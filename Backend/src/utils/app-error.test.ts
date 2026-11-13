import { describe, expect, it } from 'vitest';
import { AppError } from './app-error.js';

describe('AppError', () => {
  it('constructs with status code, error code, and human-readable message', () => {
    const error = new AppError(404, 'NOT_FOUND', 'Item not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Item not found');
    expect(error).toBeInstanceOf(Error);
  });
});

