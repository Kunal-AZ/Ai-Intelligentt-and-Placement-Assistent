import { z } from 'zod';
import { objectIdSchema } from '@placement-assistant/validation';
const skillList = z.array(z.string().trim().min(1).max(100)).max(40).default([]);
export const createCompanySchema = z.object({ name: z.string().trim().min(1).max(160), website: z.string().url().max(2048).optional(), industry: z.string().trim().max(100).optional() }).strict();
export const createJobSchema = z.object({ companyId: objectIdSchema, title: z.string().trim().min(1).max(160), description: z.string().trim().min(40).max(20000), location: z.string().trim().max(160).optional(), employmentType: z.enum(['INTERNSHIP', 'FULL_TIME', 'PART_TIME']), requiredSkills: skillList, preferredSkills: skillList, educationRequirements: z.string().trim().max(1000).optional() }).strict();
export const matchJobSchema = z.object({ jobId: objectIdSchema }).strict();
export const liveJobsQuerySchema = z.object({
  query: z.string().trim().min(2).max(100).default('software developer'),
  country: z.string().trim().regex(/^[a-zA-Z]{2}$/).default('in'),
});
