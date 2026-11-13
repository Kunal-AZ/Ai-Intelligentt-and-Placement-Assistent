import { z } from 'zod';

export const workflowRequestSchema = z.object({
  resumeId: z.string().regex(/^[a-fA-F0-9]{24}$/).optional(),
  targetRole: z.string().trim().min(2).max(100).optional(),
}).strict();

export const interviewQuestionsRequestSchema = z.object({
  skills: z.array(z.string().trim().min(1).max(100)).min(1).max(40).optional(),
  targetRole: z.string().trim().min(2).max(100).optional(),
  experienceLevel: z.string().trim().min(1).max(60).default('Fresher'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Mixed']).default('Mixed'),
  questionCount: z.number().int().min(1).max(10).default(5),
}).strict();

export const interviewEvaluationRequestSchema = z.object({
  question: z.string().trim().min(1).max(1500),
  topic: z.string().trim().min(1).max(200),
  expectedAnswerPoints: z.array(z.string().trim().min(1).max(500)).min(1).max(20),
  studentAnswer: z.string().trim().min(5).max(5000),
}).strict();

export const careerRequestSchema = z.object({
  education: z.string().trim().min(2).max(200),
  interests: z.array(z.string().trim().min(1).max(100)).min(1).max(20),
  projects: z.array(z.string().trim().min(1).max(300)).max(10).default([]),
  preferredWork: z.string().trim().min(2).max(200),
  experienceLevel: z.enum(['Fresher', 'Beginner', 'Intermediate', 'Experienced']).default('Fresher'),
}).strict();
