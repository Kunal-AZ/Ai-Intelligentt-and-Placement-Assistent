import { beforeEach, describe, expect, it, vi } from 'vitest';
import dns from 'node:dns/promises';
vi.mock('node:dns/promises', () => ({ default: { resolveMx: vi.fn() } }));
import { validateEmailDomain } from './email-validator.js';

beforeEach(() => { vi.mocked(dns.resolveMx).mockReset(); });

describe('validateEmailDomain', () => {
  it('rejects malformed email strings without @', async () => {
    await expect(validateEmailDomain('notanemail')).rejects.toThrow('Please provide a valid email address.');
  });

  it('rejects known disposable and temporary email domains', async () => {
    await expect(validateEmailDomain('scammer@tempmail.com')).rejects.toThrow(
      'Disposable and temporary email addresses are not permitted.',
    );
    await expect(validateEmailDomain('bot@mailinator.com')).rejects.toThrow(
      'Disposable and temporary email addresses are not permitted.',
    );
  });

  it('accepts valid domains with MX records in test mode', async () => {
    vi.mocked(dns.resolveMx).mockResolvedValue([{ exchange: 'mail.example.test', priority: 10 }]);
    await expect(validateEmailDomain('student@gmail.com')).resolves.toBeUndefined();
  });
  it('rejects domains with no mail servers', async () => {
    vi.mocked(dns.resolveMx).mockResolvedValue([]);
    await expect(validateEmailDomain('student@example.test')).rejects.toMatchObject({ code: 'INVALID_EMAIL_DOMAIN' });
  });
});
