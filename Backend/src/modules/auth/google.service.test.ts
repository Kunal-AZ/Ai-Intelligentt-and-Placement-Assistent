import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ verify: vi.fn(), find: vi.fn(), exists: vi.fn(), create: vi.fn(), profile: vi.fn(), tokens: vi.fn() }));
vi.mock('google-auth-library', () => ({ OAuth2Client: class { verifyIdToken = mocks.verify; } }));
vi.mock('../../config/env.js', () => ({ env: { GOOGLE_CLIENT_ID: 'test-client.apps.googleusercontent.com', JWT_SECRET: 'a'.repeat(48) } }));
vi.mock('./user.model.js', () => ({ User: { findOne: mocks.find, exists: mocks.exists, create: mocks.create } }));
vi.mock('../profile/profile.model.js', () => ({ Profile: { updateOne: mocks.profile } }));
vi.mock('./auth.service.js', () => ({ issueTokenPairForUserId: mocks.tokens }));
import { authenticateGoogle, createGoogleChallenge, readGoogleChallenge } from './google.service.js';

const identity = { sub: 'google-user-123', email: 'Student@Example.test', email_verified: true, nonce: 'test-nonce', given_name: 'Test', family_name: 'Student' };
const user = { _id: 'user-1', email: 'student@example.test', role: 'STUDENT', isEmailVerified: true };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.verify.mockResolvedValue({ getPayload: () => identity });
  mocks.find.mockResolvedValue(null);
  mocks.exists.mockResolvedValue(null);
  mocks.create.mockResolvedValue(user);
  mocks.tokens.mockResolvedValue({ accessToken: 'app-token', refreshToken: 'refresh-token' });
});

describe('Google sign-in', () => {
  it('binds a signed challenge to the browser and rejects missing or tampered cookies', () => {
    const challenge = createGoogleChallenge();
    expect(readGoogleChallenge(challenge.cookie)).toBe(challenge.nonce);
    expect(() => readGoogleChallenge(undefined)).toThrow('expired');
    expect(() => readGoogleChallenge(`${challenge.cookie}x`)).toThrow('expired');
  });
  it('verifies audience, creates a student without a password and issues app tokens', async () => {
    const result = await authenticateGoogle('id-token', 'test-nonce');
    expect(mocks.verify).toHaveBeenCalledWith({ idToken: 'id-token', audience: 'test-client.apps.googleusercontent.com' });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'student@example.test', googleSubject: identity.sub, role: 'STUDENT', isEmailVerified: true }));
    expect(mocks.create.mock.calls[0][0]).not.toHaveProperty('passwordHash');
    expect(result.tokens.accessToken).toBe('app-token');
  });
  it('rejects invalid provider signatures before database access', async () => {
    mocks.verify.mockRejectedValue(new Error('invalid signature'));
    await expect(authenticateGoogle('bad-token', 'test-nonce')).rejects.toMatchObject({ statusCode: 401 });
    expect(mocks.find).not.toHaveBeenCalled();
  });
  it('rejects unverified email addresses and mismatched browser nonces', async () => {
    await expect(authenticateGoogle('id-token', 'different-browser')).rejects.toMatchObject({ statusCode: 401 });
    mocks.verify.mockResolvedValue({ getPayload: () => ({ ...identity, email_verified: false }) });
    await expect(authenticateGoogle('id-token', 'test-nonce')).rejects.toMatchObject({ statusCode: 401 });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('never automatically links an existing password account by email', async () => {
    mocks.exists.mockResolvedValue({ _id: 'existing-password-account' });
    await expect(authenticateGoogle('id-token', 'test-nonce')).rejects.toMatchObject({ code: 'GOOGLE_ACCOUNT_NOT_LINKED' });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.tokens).not.toHaveBeenCalled();
  });
  it('recognizes returning users by Google subject without replacing their profile', async () => {
    mocks.find.mockResolvedValue(user);
    await authenticateGoogle('id-token', 'test-nonce');
    expect(mocks.find).toHaveBeenCalledWith({ googleSubject: identity.sub });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.profile.mock.calls[0][1]).toHaveProperty('$setOnInsert');
  });
  it('recovers from simultaneous first sign-ins with the same Google subject', async () => {
    mocks.create.mockRejectedValue({ code: 11000 });
    mocks.find.mockResolvedValueOnce(null).mockResolvedValueOnce(user);
    await expect(authenticateGoogle('id-token', 'test-nonce')).resolves.toHaveProperty('tokens.accessToken', 'app-token');
  });
});
