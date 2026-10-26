import { z } from 'zod';
import { objectIdSchema } from '@placement-assistant/validation';
export const createInterviewSchema = z.object({ type: z.enum(['TECHNICAL', 'HR', 'BEHAVIORAL', 'DSA', 'SYSTEM_DESIGN', 'ROLE_SPECIFIC']), role: z.string().trim().max(100).optional(), difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('INTERMEDIATE') }).strict();
export const interviewAnswerSchema = z.object({ answer: z.string().trim().min(1).max(10000) }).strict();
export const sessionIdSchema = objectIdSchema;
