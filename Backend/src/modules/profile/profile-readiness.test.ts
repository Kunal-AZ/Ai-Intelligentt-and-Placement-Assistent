import { describe, expect, it } from 'vitest';
import { profileCompletion } from './profile-readiness.js';

describe('profile readiness', () => {
  const profile = { firstName: 'Vishal', college: 'Example University', degree: 'B.Tech', targetRoles: ['Software Engineer'] };
  it('accepts valid academic context', () => {
    expect(profileCompletion(profile).complete).toBe(true);
  });
  it('requires existing invalid data to be corrected before analysis', () => {
    expect(profileCompletion({ ...profile, firstName: '123', college: '999', degree: '<script>', targetRoles: ['anything'] })).toEqual({ complete: false, missing: ['first name', 'college or university', 'degree and major', 'primary target role'] });
  });
  it('handles a missing profile', () => {
    expect(profileCompletion(null).complete).toBe(false);
  });
});
