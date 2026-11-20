import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';
import { RefreshToken } from './refresh-token.model.js';
import { User, type UserDocument } from './user.model.js';
import type { AuthenticatedUser, TokenPair } from './auth.types.js';
import { validateEmailDomain } from './email-validator.js';
import { sendVerificationEmail } from './mail.service.js';

interface AccessTokenClaims extends jwt.JwtPayload {
  sub: string;
  role: AuthenticatedUser['role'];
  type: 'access';
}

interface RefreshTokenClaims extends jwt.JwtPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const refreshTtlMs = env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000;
// Constant-time dummy hash to mitigate timing-based account enumeration attacks
const DUMMY_PASSWORD_HASH = '$2a$12$e80b4j5P/8966c8N18x9r.e9Z0QG.vH2/x3Qv0/i5Z.uLp1P.r6/6';

function toAuthenticatedUser(user: UserDocument): AuthenticatedUser {
  return { id: user._id.toString(), email: user.email, role: user.role, isEmailVerified: user.isEmailVerified };
}

async function issueTokenPair(user: UserDocument): Promise<TokenPair> {
  const userId = user._id.toString();
  const accessToken = jwt.sign(
    { role: user.role, type: 'access' },
    env.JWT_SECRET,
    { subject: userId, expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'] },
  );
  const refreshToken = jwt.sign(
    { type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    { subject: userId, jwtid: crypto.randomUUID(), expiresIn: `${env.JWT_REFRESH_TTL_DAYS}d` },
  );
  await RefreshToken.create({ userId: user._id, tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + refreshTtlMs) });
  return { accessToken, refreshToken };
}

export async function issueTokenPairForUserId(userId: string): Promise<TokenPair> {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'The account could not be found.');
  return issueTokenPair(user);
}

function generateVerificationCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function register(email: string, password: string, firstName?: string) {
  await validateEmailDomain(email);

  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.isEmailVerified) {
    throw new AppError(409, 'EMAIL_IN_USE', 'This email is already registered. Please sign in instead.');
  }

  const code = generateVerificationCode();
  const emailVerificationTokenHash = hashToken(code);
  const emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  const passwordHash = await bcrypt.hash(password, 12);

  let user: UserDocument;
  if (existingUser && !existingUser.isEmailVerified) {
    existingUser.passwordHash = passwordHash;
    existingUser.passwordChangedAt = new Date();
    existingUser.emailVerificationTokenHash = emailVerificationTokenHash;
    existingUser.emailVerificationExpiresAt = emailVerificationExpiresAt;
    await existingUser.save();
    user = existingUser;
  } else {
    user = await User.create({
      email,
      passwordHash,
      passwordChangedAt: new Date(),
      isEmailVerified: false,
      emailVerificationTokenHash,
      emailVerificationExpiresAt,
    });
  }

  await sendVerificationEmail(email, code);

  return {
    requiresVerification: true,
    email: user.email,
    firstName,
    devVerificationCode: process.env.NODE_ENV === 'development' ? code : undefined,
  };
}

export async function verifyEmail(email: string, code: string) {
  const user = await User.findOne({ email }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No account found with this email address.');
  }

  if (user.isEmailVerified) {
    throw new AppError(400, 'ALREADY_VERIFIED', 'This email is already verified. Please sign in.');
  }

  if (!user.emailVerificationTokenHash || !user.emailVerificationExpiresAt) {
    throw new AppError(400, 'NO_CODE_REQUESTED', 'No verification code was requested. Please click resend code.');
  }

  if (user.emailVerificationExpiresAt < new Date()) {
    throw new AppError(400, 'CODE_EXPIRED', 'Verification code has expired. Please request a new code.');
  }

  const incomingHash = hashToken(code);
  if (incomingHash !== user.emailVerificationTokenHash) {
    throw new AppError(400, 'INVALID_CODE', 'Invalid verification code. Please check your email and try again.');
  }

  user.isEmailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();

  const tokens = await issueTokenPair(user);
  return { user: toAuthenticatedUser(user), tokens };
}

export async function resendVerificationCode(email: string) {
  await validateEmailDomain(email);

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'No account found with this email address.');
  }

  if (user.isEmailVerified) {
    throw new AppError(400, 'ALREADY_VERIFIED', 'This email is already verified. Please sign in.');
  }

  const code = generateVerificationCode();
  user.emailVerificationTokenHash = hashToken(code);
  user.emailVerificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  await sendVerificationEmail(email, code);

  return {
    success: true,
    email: user.email,
    devVerificationCode: process.env.NODE_ENV === 'development' ? code : undefined,
  };
}

export async function authenticate(email: string, password: string) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const hashToCompare = user?.passwordHash || DUMMY_PASSWORD_HASH;
  const isMatch = await bcrypt.compare(password, hashToCompare);
  if (!user || !user.passwordHash || !isMatch) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }
  if (!user.isEmailVerified) {
    throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Please verify your email address before signing in.');
  }
  return { user: toAuthenticatedUser(user), tokens: await issueTokenPair(user) };
}

export async function rotateRefreshToken(rawToken: string) {
  let claims: RefreshTokenClaims;
  try {
    claims = jwt.verify(rawToken, env.JWT_REFRESH_SECRET) as RefreshTokenClaims;
  } catch {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Your session has expired. Please sign in again.');
  }

  if (claims.type !== 'refresh' || !claims.sub) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Your session has expired. Please sign in again.');
  }

  const tokenHash = hashToken(rawToken);
  const token = await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
    { revokedAt: new Date() },
    { new: true },
  );

  if (!token) {
    // Refresh token reuse detection (RFC 6749 / OWASP session hijacking defense):
    // If a revoked token is presented, an attacker or compromised client may be replaying old tokens.
    // Invalidate all active refresh tokens for the user to safeguard the account.
    const revokedToken = await RefreshToken.findOne({ tokenHash, revokedAt: { $exists: true } });
    if (revokedToken) {
      await RefreshToken.updateMany(
        { userId: revokedToken.userId, revokedAt: { $exists: false } },
        { revokedAt: new Date() },
      );
    }
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Your session has expired. Please sign in again.');
  }

  const user = await User.findById(claims.sub);
  if (!user) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Your session has expired. Please sign in again.');

  // Invalidate refresh attempt if password was changed after token issuance
  if (claims.iat && user.passwordChangedAt && claims.iat * 1000 < user.passwordChangedAt.getTime() - 1000) {
    await RefreshToken.updateMany(
      { userId: user._id, revokedAt: { $exists: false } },
      { revokedAt: new Date() },
    );
    throw new AppError(401, 'SESSION_EXPIRED', 'Your password was recently changed. Please sign in again.');
  }

  const tokens = await issueTokenPair(user);
  const replacement = await RefreshToken.findOne({ tokenHash: hashToken(tokens.refreshToken) });
  if (replacement) {
    token.replacedByTokenId = replacement._id;
    await token.save();
  }
  return { user: toAuthenticatedUser(user), tokens };
}

export async function revokeRefreshToken(rawToken?: string): Promise<void> {
  if (!rawToken) return;
  await RefreshToken.updateOne({ tokenHash: hashToken(rawToken), revokedAt: { $exists: false } }, { revokedAt: new Date() });
}

export function verifyAccessToken(token: string): { userId: string; role: AuthenticatedUser['role'] } {
  try {
    const claims = jwt.verify(token, env.JWT_SECRET) as AccessTokenClaims;
    if (claims.type !== 'access' || !claims.sub || !claims.role) throw new Error('Invalid token claims');
    return { userId: claims.sub, role: claims.role };
  } catch {
    throw new AppError(401, 'UNAUTHENTICATED', 'Authentication is required.');
  }
}
