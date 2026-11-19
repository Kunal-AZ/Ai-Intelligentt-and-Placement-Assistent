import { z } from 'zod';
import { objectIdSchema } from '@placement-assistant/validation';

const status = z.enum(['SAVED', 'APPLIED', 'ONLINE_ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']);
const fields = {
  company: z.string().trim().min(1).max(160), role: z.string().trim().min(1).max(160),
  sourceUrl: z.string().url().max(2048).optional(), status: status.default('SAVED'),
  appliedAt: z.coerce.date().optional(), nextAction: z.string().trim().max(500).optional(), notes: z.string().trim().max(5000).optional(),
};
export const createApplicationSchema = z.object(fields).strict();
export const updateApplicationSchema = z.object({ ...fields, company: fields.company.optional(), role: fields.role.optional(), status: status.optional() }).strict().refine((value) => Object.keys(value).length > 0, 'Provide at least one change.');
export const applicationIdSchema = objectIdSchema;
