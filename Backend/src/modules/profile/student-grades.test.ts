import { describe, expect, it } from 'vitest';
import { parseAcademicGrade, updateProfileSchema } from '@placement-assistant/validation';

describe('self-reported grade ranges', () => {
  it.each(['0', '10', '7/10', '3.75/4', '4.5/5', '6.5/7', '85%', '100%', '450/500', '0/500', '500/500', '17/20'])('accepts valid score %s', (cgpa) => {
    expect(parseAcademicGrade(cgpa)).not.toBeNull();
    expect(updateProfileSchema.safeParse({ cgpa }).success).toBe(true);
  });
  it.each(['-1', '11', '11/10', '5/4', '101%', '501/500', '7/0', '0/0', '5/-10', 'NaN', 'Infinity', 'nine', '1e2%', '7.999/10', '5/1000001'])('rejects invalid score %s', (cgpa) => {
    expect(parseAcademicGrade(cgpa)).toBeNull();
    expect(updateProfileSchema.safeParse({ cgpa }).success).toBe(false);
  });
  it('does not represent range validation as verification of a student record', () => {
    expect(parseAcademicGrade('7/10')).toEqual({ value: 7, maximum: 10, percentage: false });
    expect(parseAcademicGrade('9/10')).toEqual({ value: 9, maximum: 10, percentage: false });
    expect(updateProfileSchema.safeParse({ academicStatus: 'APPROVED' }).success).toBe(false);
  });
});
