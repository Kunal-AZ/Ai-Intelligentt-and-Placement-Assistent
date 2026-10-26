import { z } from 'zod';

const documentType = z.enum(['CAREER', 'SKILL', 'JOB', 'COMPANY', 'INTERVIEW', 'DSA', 'SYSTEM_DESIGN', 'RESUME_GUIDELINE', 'LEARNING_RESOURCE']);

export const createKnowledgeDocumentSchema = z.object({
  type: documentType,
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(50).max(200000),
  sourceUrl: z.string().url().max(2048).optional(),
  sourceLabel: z.string().trim().min(1).max(160),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
}).strict();

export const knowledgeSearchSchema = z.object({ query: z.string().trim().min(3).max(1000), limit: z.number().int().min(1).max(10).default(5) }).strict();
