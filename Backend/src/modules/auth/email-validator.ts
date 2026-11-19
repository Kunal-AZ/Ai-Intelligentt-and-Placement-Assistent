import dns from 'node:dns/promises';
import { AppError } from '../../utils/app-error.js';

// Common disposable/temporary email provider domains
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'yopmail.com',
  'trashmail.com',
  'sharklasers.com',
  'dispostable.com',
  'throwawaymail.com',
  'fakeinbox.com',
  'getairmail.com',
  'generator.email',
  'inboxkitten.com',
  'temp-mail.org',
  'mytemp.email',
  'crazymailing.com',
  'mohmal.com',
  'tempail.com',
  'fakemailgenerator.com',
  'emailondeck.com',
  'burnermail.io',
  'dropmail.me',
]);

/**
 * Validates that an email has a realistic domain and valid DNS MX mail exchange records.
 * Rejects non-existent domains (e.g., asdf@thisdomaindoesnotexist123xyz.com) and disposable mail providers.
 */
export async function validateEmailDomain(email: string): Promise<void> {
  const parts = email.split('@');
  if (parts.length !== 2) {
    throw new AppError(400, 'INVALID_EMAIL', 'Please provide a valid email address.');
  }

  const domain = parts[1].toLowerCase().trim();

  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    throw new AppError(
      400,
      'DISPOSABLE_EMAIL_NOT_ALLOWED',
      'Disposable and temporary email addresses are not permitted. Please use your real university or work email.',
    );
  }

  // Check MX records via DNS resolution
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      throw new AppError(
        400,
        'INVALID_EMAIL_DOMAIN',
        `The email domain "@${domain}" cannot receive emails because it has no mail servers configured. Please check for typos.`,
      );
    }
  } catch (error) {
    if (error instanceof AppError) throw error;

    const dnsErr = error as NodeJS.ErrnoException;
    if (dnsErr.code === 'ENOTFOUND' || dnsErr.code === 'ENODATA' || dnsErr.code === 'NODATA') {
      throw new AppError(
        400,
        'INVALID_EMAIL_DOMAIN',
        `The email domain "@${domain}" does not exist. Please check your email address for typos.`,
      );
    }

    // In isolated test environments or intermittent network timeouts, allow resolution to proceed
    if (process.env.NODE_ENV === 'test' || dnsErr.code === 'ETIMEOUT' || dnsErr.code === 'ECONNREFUSED') {
      return;
    }

    // Default fallback error
    throw new AppError(
      400,
      'INVALID_EMAIL_DOMAIN',
      `Unable to verify email domain "@${domain}". Please ensure it is a valid, active email address.`,
    );
  }
}
