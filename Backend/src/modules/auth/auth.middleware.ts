import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@placement-assistant/types';
import { AppError } from '../../utils/app-error.js';
import { verifyAccessToken } from './auth.service.js';

export function requireAuthentication(request: Request, _response: Response, next: NextFunction): void {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return next(new AppError(401, 'UNAUTHENTICATED', 'Authentication is required.'));
  try {
    request.auth = verifyAccessToken(authorization.slice(7));
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.auth) return next(new AppError(401, 'UNAUTHENTICATED', 'Authentication is required.'));
    if (!roles.includes(request.auth.role)) return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'));
    next();
  };
}
