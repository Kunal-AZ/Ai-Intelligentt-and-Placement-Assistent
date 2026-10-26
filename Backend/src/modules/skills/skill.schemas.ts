import { z } from 'zod';

export const declaredSkillSchema = z.object({
  name: z.string().trim().min(1).max(100),
  proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  summary: z.string().trim().max(300).optional(),
});

export const updateSkillsSchema = z.object({ skills: z.array(declaredSkillSchema).min(1).max(50) }).strict();
