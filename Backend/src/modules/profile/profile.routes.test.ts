import { createServer, type Server } from 'node:http';
import express, { type ErrorRequestHandler } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ updated: vi.fn(), update: vi.fn(), select: vi.fn() }));
vi.mock('../auth/auth.service.js', () => ({ verifyAccessToken: () => ({ userId: 'student-user', role: 'STUDENT' }) }));
vi.mock('./profile.model.js', () => ({ Profile: {
  findOneAndUpdate: (...args: unknown[]) => { mocks.update(...args); return { select: (...selection: unknown[]) => { mocks.select(...selection); return { lean: mocks.updated }; } }; },
} }));
vi.mock('../auth/user.model.js', () => ({ User: {} }));
import { profileRouter } from './profile.routes.js';
import { universities } from './university-catalog.js';

let server: Server;
let base: string;
beforeAll(async () => {
  const app = express(); app.use(express.json()); app.use('/profile', profileRouter);
  const errors: ErrorRequestHandler = (error, _request, response, next) => { void next; response.status(error.statusCode ?? 400).json({ error: { code: error.code ?? 'VALIDATION_ERROR' } }); };
  app.use(errors); server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No test server port');
  base = `http://127.0.0.1:${address.port}/profile`;
});
afterAll(async () => { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); });
beforeEach(() => { vi.clearAllMocks(); mocks.updated.mockResolvedValue({ cgpa: '9/10' }); });
function update(body: unknown) { return fetch(base, { method: 'PUT', headers: { Authorization: 'Bearer student', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }

describe('student-only profile', () => {
  it('requires authentication for the catalog', async () => { expect((await fetch(`${base}/universities`)).status).toBe(401); });
  it('accepts valid grade edits without an administrator or approval-state condition', async () => {
    expect((await update({ cgpa: '9/10' })).status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({ userId: 'student-user' }, { $set: { cgpa: '9/10' } }, expect.objectContaining({ runValidators: true }));
    expect(mocks.select).toHaveBeenCalledWith(expect.stringContaining('-academicFileKey'));
  });
  it.each(['11/10', '5/4', '101%', '-3', '501/500'])('rejects invalid marks via direct API: %s', async (cgpa) => {
    expect((await update({ cgpa })).status).toBe(400); expect(mocks.update).not.toHaveBeenCalled();
  });
  it('requires university selection and saves its canonical name', async () => {
    expect((await update({ college: 'Made up University' })).status).toBe(400);
    expect((await update({ college: 'Made up University', universityId: universities[0].id })).status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(expect.anything(), { $set: { college: universities[0].name, universityId: universities[0].id, universityCountry: universities[0].country } }, expect.anything());
  });
  it('removes academic approval and result-card routes', async () => {
    for (const path of ['/academic-verification', '/academic-verification/reviews', '/academic-verification/123456789012345678901234/document']) {
      expect((await fetch(`${base}${path}`, { method: path === '/academic-verification' ? 'POST' : 'GET', headers: { Authorization: 'Bearer student' } })).status).toBe(404);
    }
  });
});
