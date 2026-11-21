import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';
import { Profile } from '../profile/profile.model.js';
import { User } from './user.model.js';
import { issueTokenPairForUserId } from './auth.service.js';

const googleClient = new OAuth2Client();
const identitySchema = z.object({
  sub: z.string().min(1).max(255),
  email: z.string().email().max(254).transform(value => value.toLowerCase()),
  email_verified: z.literal(true),
  nonce: z.string().min(1),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
});

export function createGoogleChallenge() {
  if (!env.GOOGLE_CLIENT_ID) throw new AppError(503, 'GOOGLE_NOT_CONFIGURED', 'Google sign-in is not configured yet.');
  const nonce = crypto.randomBytes(32).toString('hex');
  const cookie = jwt.sign({ nonce, type: 'google-login' }, env.JWT_SECRET, { expiresIn: '10m', audience: 'google-login' });
  return { nonce, cookie };
}

export function readGoogleChallenge(cookie: unknown): string {
  try {
    if (typeof cookie !== 'string') throw new Error('Missing challenge');
    const claims = jwt.verify(cookie, env.JWT_SECRET, { algorithms: ['HS256'], audience: 'google-login' });
    if (typeof claims === 'string' || claims.type !== 'google-login' || typeof claims.nonce !== 'string') throw new Error('Invalid challenge');
    return claims.nonce;
  } catch {
    throw new AppError(401, 'GOOGLE_LOGIN_EXPIRED', 'Google sign-in expired. Reload this page and try again.');
  }
}

export async function authenticateGoogle(credential: string, nonce: string) {
  if (!env.GOOGLE_CLIENT_ID) throw new AppError(503, 'GOOGLE_NOT_CONFIGURED', 'Google sign-in is not configured yet.');
  let identity: z.infer<typeof identitySchema>;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID });
    identity = identitySchema.parse(ticket.getPayload());
    if (identity.nonce !== nonce) throw new Error('Nonce mismatch');
  } catch {
    throw new AppError(401, 'INVALID_GOOGLE_CREDENTIAL', 'Google sign-in could not be verified. Reload this page and try again.');
  }

  let user = await User.findOne({ googleSubject: identity.sub });
  if (!user) {
    // Never attach a provider to an existing account based only on an email match.
    if (await User.exists({ email: identity.email })) {
      throw new AppError(409, 'GOOGLE_ACCOUNT_NOT_LINKED', 'This email already has an account. Sign in using your existing password.');
    }
    try {
      user = await User.create({ email: identity.email, googleSubject: identity.sub, isEmailVerified: true, passwordChangedAt: new Date(), role: 'STUDENT' });
    } catch (error) {
      if (!(typeof error === 'object' && error && 'code' in error && error.code === 11000)) throw error;
      // A concurrent first sign-in may have created the same provider identity.
      user = await User.findOne({ googleSubject: identity.sub });
      if (!user) throw new AppError(409, 'GOOGLE_ACCOUNT_NOT_LINKED', 'This email already has an account. Sign in using your existing password.');
    }
  }
  // Retrying after a profile write failure repairs the profile without changing existing fields.
  await Profile.updateOne({ userId: user._id }, { $setOnInsert: { userId: user._id, firstName: identity.given_name?.slice(0, 80), lastName: identity.family_name?.slice(0, 80) } }, { upsert: true, runValidators: true });
  return {
    user: { id: user._id.toString(), email: user.email, role: user.role, isEmailVerified: user.isEmailVerified },
    tokens: await issueTokenPairForUserId(user._id.toString()),
  };
}
