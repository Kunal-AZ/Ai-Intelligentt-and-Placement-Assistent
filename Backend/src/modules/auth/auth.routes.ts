import crypto from 'node:crypto';
import type { Response } from 'express';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { Profile } from '../profile/profile.model.js';
import { loginSchema, registerSchema, resendVerificationSchema, verifyEmailSchema } from './auth.schemas.js';
import {
  authenticate,
  register,
  resendVerificationCode,
  revokeRefreshToken,
  rotateRefreshToken,
  verifyEmail,
} from './auth.service.js';
import {
  authenticateOAuth,
  getOAuthAuthorizationUrl,
  isOAuthProviderConfigured,
  type OAuthProvider,
} from './oauth.service.js';

export const authRouter = Router();
const refreshCookieName = 'placement_refresh';
const oauthStateCookieName = 'oauth_state';
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
};
const oauthStateCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: 10 * 60 * 1000,
};
const authenticationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });
const refreshLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false });
const logoutLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });

function sendSession(response: Response, tokens: { accessToken: string; refreshToken: string }): string {
  response.cookie(refreshCookieName, tokens.refreshToken, refreshCookieOptions);
  return tokens.accessToken;
}

authRouter.get('/providers', (_request, response) => {
  response.status(200).json({
    success: true,
    data: {
      google: isOAuthProviderConfigured('google'),
      github: isOAuthProviderConfigured('github'),
      linkedin: isOAuthProviderConfigured('linkedin'),
    },
  });
});

authRouter.get('/:provider', (request, response) => {
  const param = request.params.provider;
  if (param !== 'google' && param !== 'github' && param !== 'linkedin') {
    return response.status(404).json({ success: false, error: { message: 'Provider not supported' } });
  }
  const provider = param as OAuthProvider;
  if (!isOAuthProviderConfigured(provider)) {
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    return response.redirect(
      `${env.WEB_ORIGIN}/login?error=${encodeURIComponent(
        `${providerName} sign-in is not configured yet. Please set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET in your .env file.`,
      )}`,
    );
  }

  const state = crypto.randomUUID();
  response.cookie(oauthStateCookieName, state, oauthStateCookieOptions);
  const authorizationUrl = getOAuthAuthorizationUrl(provider, request, state);
  response.redirect(authorizationUrl);
});

authRouter.get('/callback/:provider', async (request, response) => {
  const param = request.params.provider;
  if (param !== 'google' && param !== 'github' && param !== 'linkedin') {
    return response.status(404).json({ success: false, error: { message: 'Provider not supported' } });
  }
  const provider = param as OAuthProvider;
  const { code, state, error, error_description } = request.query;

  if (error) {
    const errorMsg = String(error_description || error || 'Sign-in cancelled');
    return response.redirect(`${env.WEB_ORIGIN}/login?error=${encodeURIComponent(errorMsg)}`);
  }

  const savedState = request.cookies?.[oauthStateCookieName];
  response.clearCookie(oauthStateCookieName, oauthStateCookieOptions);

  if (!state || !savedState || state !== savedState) {
    return response.redirect(
      `${env.WEB_ORIGIN}/login?error=${encodeURIComponent('Security validation failed: invalid OAuth state. Please try again.')}`,
    );
  }

  if (!code || typeof code !== 'string') {
    return response.redirect(
      `${env.WEB_ORIGIN}/login?error=${encodeURIComponent('Missing authorization code from provider.')}`,
    );
  }

  try {
    const { tokens } = await authenticateOAuth(provider, code, request);
    const accessToken = sendSession(response, tokens);
    response.redirect(`${env.WEB_ORIGIN}/login?oauth_token=${encodeURIComponent(accessToken)}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Social authentication failed';
    response.redirect(`${env.WEB_ORIGIN}/login?error=${encodeURIComponent(message)}`);
  }
});

authRouter.post('/register', authenticationLimiter, async (request, response, next) => {
  try {
    const input = registerSchema.parse(request.body);
    const result = await register(input.email, input.password, input.firstName);
    response.status(200).json({
      success: true,
      data: {
        requiresVerification: true,
        email: result.email,
        firstName: result.firstName,
        message: 'A 6-digit verification code has been sent to your email.',
        devVerificationCode: result.devVerificationCode,
      },
    });
  } catch (error) { next(error); }
});

authRouter.post('/verify-email', authenticationLimiter, async (request, response, next) => {
  try {
    const input = verifyEmailSchema.parse(request.body);
    const { user, tokens } = await verifyEmail(input.email, input.code);
    if (input.firstName) {
      await Profile.findOneAndUpdate(
        { userId: user.id },
        { userId: user.id, firstName: input.firstName },
        { upsert: true, new: true },
      );
    }
    response.status(200).json({
      success: true,
      data: {
        user,
        accessToken: sendSession(response, tokens),
      },
    });
  } catch (error) { next(error); }
});

authRouter.post('/resend-verification', authenticationLimiter, async (request, response, next) => {
  try {
    const input = resendVerificationSchema.parse(request.body);
    const result = await resendVerificationCode(input.email);
    response.status(200).json({
      success: true,
      data: {
        message: 'A new 6-digit verification code has been sent to your email.',
        devVerificationCode: result.devVerificationCode,
      },
    });
  } catch (error) { next(error); }
});

authRouter.post('/login', authenticationLimiter, async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);
    const { user, tokens } = await authenticate(input.email, input.password);
    response.status(200).json({ success: true, data: { user, accessToken: sendSession(response, tokens) } });
  } catch (error) { next(error); }
});

authRouter.post('/refresh', refreshLimiter, async (request, response, next) => {
  try {
    const { user, tokens } = await rotateRefreshToken(request.cookies?.[refreshCookieName]);
    response.status(200).json({ success: true, data: { user, accessToken: sendSession(response, tokens) } });
  } catch (error) { next(error); }
});

authRouter.post('/logout', logoutLimiter, async (request, response, next) => {
  try {
    await revokeRefreshToken(request.cookies?.[refreshCookieName]);
    response.clearCookie(refreshCookieName, refreshCookieOptions);
    response.status(204).send();
  } catch (error) { next(error); }
});
