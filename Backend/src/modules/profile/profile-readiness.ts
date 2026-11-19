import type { ProfileDocument } from './profile.model.js';

/**
 * The minimum context required for personalised analysis.  Links and the
 * secondary role remain optional, but an analysis without a student, study
 * context, and selected destination would be misleading.
 */
export function profileCompletion(profile: Pick<ProfileDocument, 'firstName' | 'college' | 'degree' | 'targetRoles'> | null | undefined) {
  const missing: string[] = [];
  if (!profile?.firstName?.trim()) missing.push('first name');
  if (!profile?.college?.trim()) missing.push('college or university');
  if (!profile?.degree?.trim()) missing.push('degree and major');
  if (!profile?.targetRoles?.[0]?.trim()) missing.push('primary target role');
  return { complete: missing.length === 0, missing };
}
