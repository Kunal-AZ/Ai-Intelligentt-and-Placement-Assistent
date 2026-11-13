import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { AppError } from '../utils/app-error.js';

export const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
  void next;
  const knownError = error instanceof AppError;
  const validationError = error instanceof ZodError;
  const uploadError = error instanceof multer.MulterError;
  const duplicateKeyError = typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  const statusCode = knownError ? error.statusCode : validationError || uploadError ? 400 : duplicateKeyError ? 409 : 500;
  const code = knownError ? error.code : validationError ? 'VALIDATION_ERROR' : uploadError ? 'UPLOAD_REJECTED' : duplicateKeyError ? 'CONFLICT' : 'INTERNAL_SERVER_ERROR';

  const validationMessage = validationError && error.issues?.length ? error.issues.map((i) => i.message).filter(Boolean).join(' ') || 'One or more fields are invalid.' : undefined;
  const message = knownError
    ? error.message
    : validationMessage ?? (uploadError ? 'The uploaded file does not meet the allowed limits.' : duplicateKeyError ? 'An account with these details already exists.' : 'An unexpected error occurred.');

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
