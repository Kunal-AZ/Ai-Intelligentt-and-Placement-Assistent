import type { ProfileDocument } from './profile.model.js';
import { updateProfileSchema } from './profile.schemas.js';

/**
 * The minimum context required for personalised analysis.  Links and the
 * secondary role remain optional, but an analysis without a student, study
 * context, and selected destination would be misleading.
 */
export function profileCompletion(profile: Pick<ProfileDocument, 'firstName' | 'college' | 'degree' | 'targetRoles'> | null | undefined) {
  const missing: string[] = [];
  if (!profile?.firstName?.trim() || !updateProfileSchema.shape.firstName.safeParse(profile.firstName).success) missing.push('first name');
  if (!profile?.college?.trim() || !updateProfileSchema.shape.college.safeParse(profile.college).success) missing.push('college or university');
  if (!profile?.degree?.trim() || !updateProfileSchema.shape.degree.safeParse(profile.degree).success) missing.push('degree and major');
  if (!profile?.targetRoles?.[0]?.trim() || !updateProfileSchema.shape.targetRoles.safeParse(profile.targetRoles).success) missing.push('primary target role');
  return { complete: missing.length === 0, missing };
}
