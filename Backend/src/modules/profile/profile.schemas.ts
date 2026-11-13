import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const updateProfileSchema = z
  .object({
    firstName: optionalText(80),
    lastName: optionalText(80),
    headline: optionalText(160),
    college: optionalText(160),
    degree: optionalText(160),
    cgpa: optionalText(30),
    graduationYear: z.number().int().min(2000).max(2100).optional(),
    targetRoles: z.array(z.string().trim().min(1).max(100)).max(10).optional(),
    secondaryRole: optionalText(100),
    expectedLpa: optionalText(40),
    githubUrl: z.string().url().max(500).optional().or(z.literal('')),
    linkedinUrl: z.string().url().max(500).optional().or(z.literal('')),
    portfolioUrl: z.string().url().max(500).optional().or(z.literal('')),
    allowRecruiterSharing: z.boolean().optional(),
    notifyJobMatches: z.boolean().optional(),
    notifyRoadmapReminders: z.boolean().optional(),
  })
  .strict();
