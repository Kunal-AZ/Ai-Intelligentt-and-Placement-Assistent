import { z } from 'zod';
import { academicDegrees, academicMajors } from './academics.js';
import { parseAcademicGrade } from './grades.js';

export const studentRoles = ['Software Engineer', 'Full-Stack Developer', 'Backend Developer', 'Frontend Developer', 'Mobile Developer', 'DevOps Engineer', 'Cloud Engineer', 'Cybersecurity Analyst', 'Data Analyst', 'Data Scientist', 'Machine Learning Engineer', 'AI Engineer', 'QA / Test Engineer', 'Site Reliability Engineer', 'UI/UX Designer', 'Product Manager', 'Business Analyst'] as const;
const name = z.string().trim().min(1, 'Enter your first name.').max(80).regex(/^[\p{L}\p{M}]+(?:[ .’'\-][\p{L}\p{M}]+)*\.?$/u, 'Names may contain letters, spaces, apostrophes, hyphens and initials.');
const grade = z.string().trim().max(30).refine((value) => !value || parseAcademicGrade(value) !== null,
  'Enter a non-negative score no greater than its maximum, with up to two decimal places (e.g. 7/10, 3.5/4, 85%, or 450/500).');
const compensation = z.string().trim().max(40).refine((value) => {
  if (!value) return true;
  const match = /^(?:₹\s*)?(\d+(?:\.\d{1,2})?)(?:\s*[-–]\s*(\d+(?:\.\d{1,2})?))?\s*(?:LPA)?$/i.exec(value);
  return !!match && Number(match[1]) > 0 && Number(match[1]) <= 1000 && (!match[2] || (Number(match[2]) >= Number(match[1]) && Number(match[2]) <= 1000));
}, 'Enter a positive LPA amount or ascending range, such as 8 or 8–12 LPA (maximum 1000).');
const link = (host?: string) => z.string().trim().max(500).refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && (!host || ((url.hostname === host || url.hostname === `www.${host}`) && url.pathname.length > 1));
  } catch { return false; }
}, host ? `Enter an http(s) ${host} profile URL.` : 'Enter an http(s) portfolio URL.').optional();

export const updateProfileSchema = z.object({
  firstName: name.optional(),
  lastName: name.or(z.literal('')).optional(),
  headline: z.string().trim().max(160).optional(),
  college: z.string().trim().min(2).max(300).refine((value) => /\p{L}/u.test(value) && !/[<>\p{Cc}]/u.test(value), 'Enter a valid college or university name.').optional(),
  universityId: z.string().regex(/^[a-f0-9]{24}$/).optional(),
  universityCountry: z.string().trim().min(2).max(120).optional(),
  degree: z.enum(academicDegrees, { error: 'Select a degree from the list.' }).optional(),
  major: z.enum(academicMajors, { error: 'Select a subject from the list.' }).optional(),
  cgpa: grade.optional(),
  graduationYear: z.number().int().min(2000).max(2100).optional(),
  targetRoles: z.array(z.enum(studentRoles, { error: 'Select a supported target role.' })).max(10).refine((roles) => new Set(roles).size === roles.length, 'Target roles must be unique.').optional(),
  secondaryRole: z.enum(studentRoles).or(z.literal('')).optional(),
  expectedLpa: compensation.optional(),
  githubUrl: link('github.com'),
  linkedinUrl: link('linkedin.com'),
  portfolioUrl: link(),
  allowRecruiterSharing: z.boolean().optional(),
  notifyJobMatches: z.boolean().optional(),
  notifyRoadmapReminders: z.boolean().optional(),
}).strict();
