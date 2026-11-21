import { z } from 'zod';
export { updateProfileSchema, studentRoles } from './profile.js';
export { academicDegrees, academicMajors } from './academics.js';
export { parseAcademicGrade } from './grades.js';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid identifier');

export const resumeAnalysisSchema = z.object({
  skills: z.array(z.string().trim().min(1).max(100)).max(60),
  education: z.array(z.object({ institution: z.string().max(200), degree: z.string().max(160).optional(), field: z.string().max(160).optional(), dates: z.string().max(80).optional() })).max(10),
  projects: z.array(z.object({ name: z.string().max(160), description: z.string().max(1000).optional(), technologies: z.array(z.string().max(100)).max(30) })).max(20),
  experience: z.array(z.object({ company: z.string().max(200).optional(), role: z.string().max(160).optional(), duration: z.string().max(100).optional(), highlights: z.array(z.string().max(400)).max(10) })).max(20),
  certifications: z.array(z.string().max(200)).max(30),
  strengths: z.array(z.string().max(500)).max(20),
  weaknesses: z.array(z.object({ issue: z.string().max(500), evidence: z.string().max(500).optional() })).max(20),
  atsIssues: z.array(z.object({ issue: z.string().max(500), severity: z.enum(['LOW', 'MEDIUM', 'HIGH']) })).max(20),
  missingInformation: z.array(z.string().max(500)).max(20),
  recommendations: z.array(z.object({ priority: z.enum(['HIGH', 'MEDIUM', 'LOW']), recommendation: z.string().max(500), rationale: z.string().max(500) })).max(20),
}).strict();

export type ResumeAnalysisOutput = z.infer<typeof resumeAnalysisSchema>;

export const chatResponseSchema = z.object({
  answer: z.string().trim().min(1).max(5000),
  citedSourceIds: z.array(z.string().min(1).max(120)).max(20),
  limitations: z.array(z.string().max(300)).max(10),
}).strict();

export type ChatResponseOutput = z.infer<typeof chatResponseSchema>;

export const interviewQuestionSchema = z.object({ question: z.string().trim().min(1).max(1500), rubric: z.array(z.string().max(300)).min(1).max(6), focusSkills: z.array(z.string().max(100)).max(10) }).strict();
export const interviewEvaluationSchema = z.object({ technicalAccuracy: z.enum(['INSUFFICIENT', 'PARTIAL', 'STRONG']), communication: z.enum(['INSUFFICIENT', 'PARTIAL', 'STRONG']), structure: z.enum(['INSUFFICIENT', 'PARTIAL', 'STRONG']), reasoning: z.enum(['INSUFFICIENT', 'PARTIAL', 'STRONG']), strengths: z.array(z.string().max(400)).max(8), improvements: z.array(z.string().max(400)).max(8), followUpFocus: z.array(z.string().max(100)).max(8) }).strict();
