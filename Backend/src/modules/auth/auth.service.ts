import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';
import { RefreshToken } from './refresh-token.model.js';
import { User, type UserDocument } from './user.model.js';
import type { AuthenticatedUser, TokenPair } from './auth.types.js';

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

export async function register(email: string, password: string, firstName?: string) {
  const existingUser = await User.exists({ email });
  if (existingUser) throw new AppError(409, 'EMAIL_IN_USE', 'An account with this email already exists.');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, passwordChangedAt: new Date() });
  return { user: toAuthenticatedUser(user), firstName };
}

export async function authenticate(email: string, password: string) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
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

  const token = await RefreshToken.findOneAndUpdate(
    { tokenHash: hashToken(rawToken), revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
    { revokedAt: new Date() },
    { new: true },
  );
  if (!token) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Your session has expired. Please sign in again.');

  const user = await User.findById(claims.sub);
  if (!user) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Your session has expired. Please sign in again.');

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
