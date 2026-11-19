import type { Request } from 'express';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';
import { Profile } from '../profile/profile.model.js';
import { issueTokenPairForUserId } from './auth.service.js';
import { User, type UserDocument } from './user.model.js';

export type OAuthProvider = 'google' | 'github' | 'linkedin';

export interface NormalizedOAuthProfile {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  profileUrl?: string;
}

export function isOAuthProviderConfigured(provider: OAuthProvider): boolean {
  switch (provider) {
    case 'google':
      return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
    case 'github':
      return Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
    case 'linkedin':
      return Boolean(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET);
    default:
      return false;
  }
}

export function getOAuthCallbackUri(provider: OAuthProvider, request: Request): string {
  if (provider === 'google' && env.GOOGLE_CALLBACK_URL) return env.GOOGLE_CALLBACK_URL;
  if (provider === 'github' && env.GITHUB_CALLBACK_URL) return env.GITHUB_CALLBACK_URL;
  if (provider === 'linkedin' && env.LINKEDIN_CALLBACK_URL) return env.LINKEDIN_CALLBACK_URL;

  const protocol = request.headers['x-forwarded-proto']?.toString() || request.protocol || 'http';
  const host = request.headers['x-forwarded-host']?.toString() || request.get('host') || `localhost:${env.API_PORT}`;
  return `${protocol}://${host}/api/v1/auth/callback/${provider}`;
}

export function getOAuthAuthorizationUrl(provider: OAuthProvider, request: Request, state: string): string {
  const redirectUri = getOAuthCallbackUri(provider, request);

  switch (provider) {
    case 'google': {
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
        throw new AppError(500, 'OAUTH_NOT_CONFIGURED', 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.');
      }
      const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        access_type: 'offline',
        prompt: 'select_account',
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    case 'github': {
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
        throw new AppError(500, 'OAUTH_NOT_CONFIGURED', 'GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env.');
      }
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'read:user user:email',
        state,
      });
      return `https://github.com/login/oauth/authorize?${params.toString()}`;
    }

    case 'linkedin': {
      if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) {
        throw new AppError(500, 'OAUTH_NOT_CONFIGURED', 'LinkedIn OAuth is not configured. Please set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in .env.');
      }
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: env.LINKEDIN_CLIENT_ID,
        redirect_uri: redirectUri,
        state,
        scope: 'openid profile email',
      });
      return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    }

    default:
      throw new AppError(400, 'INVALID_OAUTH_PROVIDER', `Unsupported OAuth provider: ${provider}`);
  }
}

export async function exchangeOAuthCode(
  provider: OAuthProvider,
  code: string,
  request: Request,
): Promise<NormalizedOAuthProfile> {
  const redirectUri = getOAuthCallbackUri(provider, request);

  switch (provider) {
    case 'google':
      return exchangeGoogleCode(code, redirectUri);
    case 'github':
      return exchangeGitHubCode(code, redirectUri);
    case 'linkedin':
      return exchangeLinkedInCode(code, redirectUri);
    default:
      throw new AppError(400, 'INVALID_OAUTH_PROVIDER', `Unsupported OAuth provider: ${provider}`);
  }
}

async function exchangeGoogleCode(code: string, redirectUri: string): Promise<NormalizedOAuthProfile> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const errorBody = await tokenRes.text().catch(() => '');
    throw new AppError(401, 'OAUTH_EXCHANGE_FAILED', `Google authentication failed: ${errorBody || tokenRes.statusText}`);
  }

  const tokenData = (await tokenRes.json()) as { access_token: string };
  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) {
    throw new AppError(401, 'OAUTH_PROFILE_FAILED', 'Failed to retrieve user profile from Google.');
  }

  const userData = (await userRes.json()) as {
    sub: string;
    email: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  };

  if (!userData.email) {
    throw new AppError(400, 'EMAIL_REQUIRED', 'Google account does not provide an email address.');
  }

  return {
    provider: 'google',
    providerId: userData.sub,
    email: userData.email.toLowerCase(),
    firstName: userData.given_name,
    lastName: userData.family_name,
    avatarUrl: userData.picture,
  };
}

async function exchangeGitHubCode(code: string, redirectUri: string): Promise<NormalizedOAuthProfile> {
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID!,
      client_secret: env.GITHUB_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    throw new AppError(401, 'OAUTH_EXCHANGE_FAILED', 'GitHub token exchange failed.');
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string; error_description?: string };
  if (!tokenData.access_token) {
    throw new AppError(401, 'OAUTH_EXCHANGE_FAILED', tokenData.error_description || 'GitHub authentication was denied.');
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'User-Agent': 'Placement-Assistant-App',
      Accept: 'application/vnd.github+json',
    },
  });

  if (!userRes.ok) {
    throw new AppError(401, 'OAUTH_PROFILE_FAILED', 'Failed to retrieve GitHub profile.');
  }

  const userData = (await userRes.json()) as {
    id: number;
    login: string;
    name?: string;
    email?: string;
    avatar_url?: string;
    html_url?: string;
  };

  let email = userData.email?.toLowerCase();
  if (!email) {
    // If public email is not set on GitHub profile, query user/emails
    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'Placement-Assistant-App',
        Accept: 'application/vnd.github+json',
      },
    });

    if (emailsRes.ok) {
      const emailsList = (await emailsRes.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
      const primaryEmail = emailsList.find((e) => e.primary && e.verified) || emailsList.find((e) => e.verified) || emailsList[0];
      email = primaryEmail?.email?.toLowerCase();
    }
  }

  if (!email) {
    throw new AppError(400, 'EMAIL_REQUIRED', 'Unable to retrieve a verified email address from your GitHub account.');
  }

  const nameParts = (userData.name || userData.login).trim().split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

  return {
    provider: 'github',
    providerId: String(userData.id),
    email,
    firstName,
    lastName,
    avatarUrl: userData.avatar_url,
    profileUrl: userData.html_url,
  };
}

async function exchangeLinkedInCode(code: string, redirectUri: string): Promise<NormalizedOAuthProfile> {
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: env.LINKEDIN_CLIENT_ID!,
      client_secret: env.LINKEDIN_CLIENT_SECRET!,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const errorBody = await tokenRes.text().catch(() => '');
    throw new AppError(401, 'OAUTH_EXCHANGE_FAILED', `LinkedIn authentication failed: ${errorBody || tokenRes.statusText}`);
  }

  const tokenData = (await tokenRes.json()) as { access_token: string };
  const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) {
    throw new AppError(401, 'OAUTH_PROFILE_FAILED', 'Failed to retrieve profile from LinkedIn.');
  }

  const userData = (await userRes.json()) as {
    sub: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  };

  if (!userData.email) {
    throw new AppError(400, 'EMAIL_REQUIRED', 'LinkedIn account does not provide an email address.');
  }

  return {
    provider: 'linkedin',
    providerId: userData.sub,
    email: userData.email.toLowerCase(),
    firstName: userData.given_name,
    lastName: userData.family_name,
    avatarUrl: userData.picture,
  };
}

export async function syncOAuthUser(profile: NormalizedOAuthProfile): Promise<UserDocument> {
  const providerKey = `${profile.provider}Id` as 'googleId' | 'githubId' | 'linkedinId';

  // Find user by provider ID or email
  let user = await User.findOne({
    $or: [{ [providerKey]: profile.providerId }, { email: profile.email }],
  });

  if (user) {
    // Link provider ID and mark email verified if not already done
    let updated = false;
    if (!user[providerKey]) {
      user[providerKey] = profile.providerId;
      updated = true;
    }
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      updated = true;
    }
    if (!user.avatarUrl && profile.avatarUrl) {
      user.avatarUrl = profile.avatarUrl;
      updated = true;
    }
    if (updated) {
      await user.save();
    }

    // Ensure Profile document exists
    const existingProfile = await Profile.findOne({ userId: user._id });
    if (!existingProfile) {
      await Profile.create({
        userId: user._id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        githubUrl: profile.provider === 'github' ? profile.profileUrl : undefined,
        linkedinUrl: profile.provider === 'linkedin' ? profile.profileUrl : undefined,
      });
    } else {
      let profileUpdated = false;
      if (!existingProfile.firstName && profile.firstName) {
        existingProfile.firstName = profile.firstName;
        profileUpdated = true;
      }
      if (!existingProfile.lastName && profile.lastName) {
        existingProfile.lastName = profile.lastName;
        profileUpdated = true;
      }
      if (!existingProfile.githubUrl && profile.provider === 'github' && profile.profileUrl) {
        existingProfile.githubUrl = profile.profileUrl;
        profileUpdated = true;
      }
      if (!existingProfile.linkedinUrl && profile.provider === 'linkedin' && profile.profileUrl) {
        existingProfile.linkedinUrl = profile.profileUrl;
        profileUpdated = true;
      }
      if (profileUpdated) {
        await existingProfile.save();
      }
    }
  } else {
    // Create new OAuth user
    user = await User.create({
      email: profile.email,
      isEmailVerified: true,
      role: 'STUDENT',
      passwordChangedAt: new Date(),
      [providerKey]: profile.providerId,
      avatarUrl: profile.avatarUrl,
    });

    await Profile.create({
      userId: user._id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      githubUrl: profile.provider === 'github' ? profile.profileUrl : undefined,
      linkedinUrl: profile.provider === 'linkedin' ? profile.profileUrl : undefined,
    });
  }

  return user;
}

export async function authenticateOAuth(
  provider: OAuthProvider,
  code: string,
  request: Request,
) {
  const profile = await exchangeOAuthCode(provider, code, request);
  const user = await syncOAuthUser(profile);
  const tokens = await issueTokenPairForUserId(user._id.toString());
  return { user, tokens };
}
