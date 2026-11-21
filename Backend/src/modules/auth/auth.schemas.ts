import { z } from 'zod';

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = z.string().min(6, 'Password must be at least 6 characters.').max(128);

<<<<<<< HEAD
export const registerSchema = z.object({ email, password, firstName: z.string().trim().min(1).max(80).optional(), lastName: z.string().trim().max(80).optional() });
export const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
=======
export const registerSchema = z.object({
  email,
  password,
  firstName: z.string().trim().min(1).max(80).optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export const verifyEmailSchema = z.object({
  email,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Verification code must be exactly 6 digits.'),
  firstName: z.string().trim().min(1).max(80).optional(),
});

export const resendVerificationSchema = z.object({
  email,
});
>>>>>>> 5ba8bc5f979219befd0b21c404eb98cde05857fb
