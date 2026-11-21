import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { AppError } from '../utils/app-error.js';

export const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
  if (response.headersSent) return next(error);
  const bodyErrorType = error && typeof error === 'object' ? error.type : undefined;
  const bodyError = bodyErrorType === 'entity.parse.failed' || bodyErrorType === 'entity.too.large';
  const knownError = error instanceof AppError;
  const validationError = error instanceof ZodError;
  const uploadError = error instanceof multer.MulterError;
  const duplicateKeyError = typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  const statusCode = knownError ? error.statusCode : bodyError ? (bodyErrorType === 'entity.too.large' ? 413 : 400) : validationError || uploadError ? 400 : duplicateKeyError ? 409 : 500;
  const code = knownError ? error.code : bodyError ? (bodyErrorType === 'entity.too.large' ? 'PAYLOAD_TOO_LARGE' : 'INVALID_JSON') : validationError ? 'VALIDATION_ERROR' : uploadError ? 'UPLOAD_REJECTED' : duplicateKeyError ? 'CONFLICT' : 'INTERNAL_SERVER_ERROR';

  const validationMessage = validationError && error.issues?.length ? error.issues.map((i) => i.message).filter(Boolean).join(' ') || 'One or more fields are invalid.' : undefined;
  const message = knownError
    ? error.message
    : bodyError ? (bodyErrorType === 'entity.too.large' ? 'The request body exceeds the allowed size.' : 'The request body must contain valid JSON.') : validationMessage ?? (uploadError
      ? 'The uploaded file does not meet the allowed limits.'
      : duplicateKeyError
        ? 'An account with these details already exists.'
        : 'An unexpected error occurred.');

  request.log.error({ err: error, requestId: request.id }, 'Request failed');
  response.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      requestId: request.id,
    },
  });
};
