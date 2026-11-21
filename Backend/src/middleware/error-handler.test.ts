import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from './error-handler.js';

describe('HTTP error handling', () => {
  it.each([
    ['entity.parse.failed', 400, 'INVALID_JSON'],
    ['entity.too.large', 413, 'PAYLOAD_TOO_LARGE'],
  ])('returns a client error for %s without exposing request content', (type, status, code) => {
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const request = { log: { error: vi.fn() }, id: 'request-1' };
    errorHandler(Object.assign(new Error('sensitive body'), { type }), request as unknown as Request, response as unknown as Response, vi.fn());
    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.objectContaining({ code }) }));
    expect(JSON.stringify(response.json.mock.calls)).not.toContain('sensitive body');
  });

  it('delegates errors after the response has started', () => {
    const next = vi.fn();
    const error = new Error('stream failed');
    errorHandler(error, {} as Request, { headersSent: true } as Response, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});
