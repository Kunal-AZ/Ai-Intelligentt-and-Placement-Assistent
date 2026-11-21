import { describe, expect, it } from 'vitest';
import { updateProfileSchema } from './profile.schemas.js';

describe('student profile validation', () => {
  it('accepts international names, academic punctuation and valid optional fields', () => {
    expect(updateProfileSchema.parse({ firstName: ' José ', lastName: "O’Neill", college: 'IIT (BHU), Varanasi', degree: 'B.Tech', major: 'Computer Science', cgpa: '8.75/10', graduationYear: 2027, targetRoles: ['Software Engineer'], expectedLpa: '₹8–12 LPA', githubUrl: 'https://github.com/student', linkedinUrl: '', portfolioUrl: 'https://example.com' })).toMatchObject({ firstName: 'José' });
  });
  it.each([
    { firstName: '123' }, { firstName: '   ' }, { lastName: '<script>' },
    { college: '12345' }, { degree: '<b>B.Tech</b>' },
    { cgpa: 'eleven' }, { cgpa: '11' }, { cgpa: '-1' }, { cgpa: '101%' }, { cgpa: '4.5/4' },
    { graduationYear: 2026.5 }, { graduationYear: 1900 }, { graduationYear: '2027' },
    { expectedLpa: 'anything' }, { expectedLpa: '-2' }, { expectedLpa: '12–8 LPA' },
    { targetRoles: ['Made up role'] }, { targetRoles: ['AI Engineer', 'AI Engineer'] }, { secondaryRole: 'anything' }, { major: 'anything' }, { universityId: 'fake' }, { academicStatus: 'APPROVED' }, { academicRevision: 20 }, { academicFileKey: 'forged' },
    { githubUrl: 'https://github.com.evil.test/student' }, { linkedinUrl: 'https://example.com/user' },
    { portfolioUrl: 'javascript:alert(1)' }, { portfolioUrl: 'ftp://example.com' }, { email: 'changed@example.com' },
  ])('rejects malformed or unsupported fields: %j', (input) => {
    expect(updateProfileSchema.safeParse(input).success).toBe(false);
  });
  it.each(['0', '10', '3.5/4', '100%', '85.25%'])('accepts valid grade %s', (cgpa) => {
    expect(updateProfileSchema.safeParse({ cgpa }).success).toBe(true);
  });
  it('allows settings-only updates and clearing optional fields', () => {
    expect(updateProfileSchema.safeParse({ notifyJobMatches: false }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ lastName: '', cgpa: '', expectedLpa: '', secondaryRole: '', githubUrl: '', linkedinUrl: '', portfolioUrl: '' }).success).toBe(true);
  });
});
