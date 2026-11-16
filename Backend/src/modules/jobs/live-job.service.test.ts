import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../config/env.js', () => ({ env: { JOB_FETCH_TIMEOUT_MS: 1000 } }));
beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe('live job discovery', () => {
  it('keeps related titles, accepts provider arrays, and reuses public feeds across searches', async () => {
    const fetch = vi.fn(async (url: string) => Response.json(url.includes('remotive') ? { jobs: [{ id: 1, title: 'Senior Backend Engineer', url: 'https://example.com/1', company_name: 'Example', description: 'Node.js and SQL' }] } : { jobs: [{ id: 2, jobTitle: 'Software Developer', url: 'https://example.com/2', companyName: 'Example 2', jobType: ['full-time'], jobDescription: 'React' }] }));
    vi.stubGlobal('fetch', fetch);
    const { getLiveJobs } = await import('./live-job.service.js');
    const first = await getLiveJobs('Backend Developer', 'in');
    expect(first.jobs).toHaveLength(2);
    expect(first.jobs[1].employmentType).toBe('FULL_TIME');
    expect(first.warnings.join(' ')).toContain('not configured');
    const second = await getLiveJobs('React', 'in');
    expect(second.jobs).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('reports failed providers instead of silently returning an empty success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { getLiveJobs } = await import('./live-job.service.js');
    const result = await getLiveJobs('developer', 'in');
    expect(result.providers).toEqual([]);
    expect(result.jobs).toEqual([]);
    expect(result.warnings.join(' ')).toContain('REMOTIVE is temporarily unavailable');
    expect(result.warnings.join(' ')).toContain('JOBICY is temporarily unavailable');
  });
});
