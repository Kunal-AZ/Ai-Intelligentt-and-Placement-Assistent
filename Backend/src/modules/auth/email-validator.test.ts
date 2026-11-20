import { describe, expect, it } from 'vitest';
import { validateEmailDomain } from './email-validator.js';

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
    // In test environment or with standard domains, it resolves without error
    await expect(validateEmailDomain('student@gmail.com')).resolves.toBeUndefined();
  });
});
