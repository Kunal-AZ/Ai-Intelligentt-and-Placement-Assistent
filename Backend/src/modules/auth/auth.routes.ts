import type { Response } from 'express';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { Profile } from '../profile/profile.model.js';
import { loginSchema, registerSchema } from './auth.schemas.js';
import { authenticate, issueTokenPairForUserId, register, revokeRefreshToken, rotateRefreshToken } from './auth.service.js';

export const authRouter = Router();
const refreshCookieName = 'placement_refresh';
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
};
const authenticationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });

function sendSession(response: Response, tokens: { accessToken: string; refreshToken: string }): string {
  response.cookie(refreshCookieName, tokens.refreshToken, refreshCookieOptions);
  return tokens.accessToken;
}

authRouter.post('/register', authenticationLimiter, async (request, response, next) => {
  try {
    const input = registerSchema.parse(request.body);
    const result = await register(input.email, input.password, input.firstName);
    await Profile.create({ userId: result.user.id, firstName: result.firstName });
    const tokens = await issueTokenPairForUserId(result.user.id);
    response.status(201).json({ success: true, data: { user: result.user, accessToken: sendSession(response, tokens) } });
  } catch (error) { next(error); }
});

authRouter.post('/login', authenticationLimiter, async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);
    const { user, tokens } = await authenticate(input.email, input.password);
    response.status(200).json({ success: true, data: { user, accessToken: sendSession(response, tokens) } });
  } catch (error) { next(error); }
});

authRouter.post('/refresh', async (request, response, next) => {
  try {
    const { user, tokens } = await rotateRefreshToken(request.cookies?.[refreshCookieName]);
    response.status(200).json({ success: true, data: { user, accessToken: sendSession(response, tokens) } });
  } catch (error) { next(error); }
});

authRouter.post('/logout', async (request, response, next) => {
  try {
    await revokeRefreshToken(request.cookies?.[refreshCookieName]);
    response.clearCookie(refreshCookieName, refreshCookieOptions);
    response.status(204).send();
  } catch (error) { next(error); }
});
