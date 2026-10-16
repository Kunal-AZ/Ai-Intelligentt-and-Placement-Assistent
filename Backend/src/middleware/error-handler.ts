import type { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const knownError = error instanceof AppError;
  const statusCode = knownError ? error.statusCode : 500;
  const code = knownError ? error.code : 'INTERNAL_SERVER_ERROR';

  request.log.error({ err: error, requestId: request.id }, 'Request failed');
  response.status(statusCode).json({
    success: false,
    error: {
      code,
      message: knownError ? error.message : 'An unexpected error occurred.',
      requestId: request.id,
    },
  });
};
