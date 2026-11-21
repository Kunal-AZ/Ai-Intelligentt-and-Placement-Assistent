import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  if (env.SMTP_HOST && (env.SMTP_USER || env.SMTP_PORT)) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS,
            }
          : undefined,
    });
    return transporter;
  }

  return null;
}

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const mailer = getTransporter();

  // If SMTP is not configured, log to server console banner for development
  if (!mailer) {
    console.info(`
======================================================================
📧 [EMAIL VERIFICATION CODE]
   To: ${email}
   Code: [ ${code} ]
   Expires in: 15 minutes
   Note: SMTP is not configured in .env. In production, set SMTP_HOST,
         SMTP_USER, and SMTP_PASS to deliver real emails.
======================================================================
`);
    return false;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Verify your HiPlacement email</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="margin-bottom: 24px; text-align: center;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px;">HiPlacement</h2>
      <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">AI-Powered Placement & Interview Engine</p>
    </div>

    <p style="font-size: 15px; line-height: 1.5; margin: 0 0 16px;">
      Welcome! Please verify your email address to complete your registration and activate your workspace.
    </p>

    <div style="background-color: #f1f5f9; border-radius: 8px; border: 1px solid #cbd5e1; padding: 18px; text-align: center; margin: 24px 0;">
      <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 600; display: block; margin-bottom: 6px;">Your Verification Code</span>
      <span style="font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #2563eb;">${code}</span>
    </div>

    <p style="font-size: 13px; color: #64748b; margin: 0 0 16px; line-height: 1.4;">
      This code will expire in <strong>15 minutes</strong>. If you did not sign up for a HiPlacement account, you can safely ignore this email.
    </p>

    <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
      © ${new Date().getFullYear()} HiPlacement. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

  try {
    await mailer.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject: `Your HiPlacement Verification Code: ${code}`,
      text: `Your HiPlacement verification code is: ${code}. This code expires in 15 minutes.`,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error(`[mail.service] Failed to send verification email to ${email}:`, error);
    return false;
  }
}
