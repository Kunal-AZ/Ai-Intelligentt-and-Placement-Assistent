import { env } from '../../config/env.js';
import { roleProfiles } from '../../ai/role-profiles.js';

export type LiveJob = {
  id: string;
  source: 'ADZUNA' | 'REMOTIVE' | 'JOBICY';
  sourceUrl: string;
  title: string;
  description: string;
  location: string;
  employmentType: 'INTERNSHIP' | 'FULL_TIME' | 'PART_TIME';
  requiredSkills: string[];
  preferredSkills: string[];
  company: { name: string; website?: string };
  postedAt?: string;
};

type AdzunaResponse = { results?: Array<{ id: string; title: string; description?: string; redirect_url: string; created?: string; company?: { display_name?: string }; location?: { display_name?: string }; contract_time?: string }> };
type RemotiveResponse = { jobs?: Array<{ id: number; title: string; description?: string; url: string; publication_date?: string; company_name?: string; company_logo_url?: string; candidate_required_location?: string; job_type?: string }> };
type JobicyResponse = { jobs?: Array<{ id: number | string; jobTitle?: string; companyName?: string; jobGeo?: string; url?: string; pubDate?: string; jobDescription?: string; jobType?: string | string[]; jobIndustry?: string }> };

const cache = new Map<string, { expiresAt: number; jobs: LiveJob[]; providers: string[]; warnings: string[] }>();
const knownSkills = [...new Set(roleProfiles.flatMap((profile) => profile.requirements.map((requirement) => requirement.skill)))];

function cleanText(value: string): string { return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
function skillsFrom(value: string): string[] {
  const text = value.toLocaleLowerCase();
  return knownSkills.filter((skill) => text.includes(skill.toLocaleLowerCase())).slice(0, 40);
}
function jobType(value?: string | string[]): LiveJob['employmentType'] {
  const type = (Array.isArray(value) ? value.join(' ') : value ?? '').toLocaleLowerCase();
  if (type.includes('intern')) return 'INTERNSHIP';
  if (type.includes('part')) return 'PART_TIME';
  return 'FULL_TIME';
}
async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.JOB_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Provider returned ${response.status}`);
    return await response.json() as T;
  } finally { clearTimeout(timeout); }
}
async function adzunaJobs(query: string, country: string): Promise<LiveJob[]> {
  if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) return [];
  const allowedCountry = /^[a-z]{2}$/i.test(country) ? country.toLowerCase() : 'in';
  const params = new URLSearchParams({ app_id: env.ADZUNA_APP_ID, app_key: env.ADZUNA_APP_KEY, results_per_page: '30', what: query, 'content-type': 'application/json' });
  const data = await fetchJson<AdzunaResponse>(`https://api.adzuna.com/v1/api/jobs/${allowedCountry}/search/1?${params}`);
  return (data.results ?? []).map((item) => {
    const description = cleanText(item.description ?? '');
    return { id: `adzuna:${item.id}`, source: 'ADZUNA', sourceUrl: item.redirect_url, title: cleanText(item.title), description, location: item.location?.display_name ?? 'Location not specified', employmentType: jobType(item.contract_time), requiredSkills: skillsFrom(`${item.title} ${description}`), preferredSkills: [], company: { name: item.company?.display_name ?? 'Company' }, postedAt: item.created };
  });
}
async function remotiveJobs(): Promise<LiveJob[]> {
  const data = await fetchJson<RemotiveResponse>('https://remotive.com/api/remote-jobs');
  return (data.jobs ?? []).map((item) => {
    const description = cleanText(item.description ?? '');
    return { id: `remotive:${item.id}`, source: 'REMOTIVE', sourceUrl: item.url, title: cleanText(item.title), description, location: item.candidate_required_location || 'Remote', employmentType: jobType(item.job_type), requiredSkills: skillsFrom(`${item.title} ${description}`), preferredSkills: [], company: { name: item.company_name ?? 'Company' }, postedAt: item.publication_date };
  });
}
async function jobicyJobs(): Promise<LiveJob[]> {
  const params = new URLSearchParams({ count: '100', industry: 'engineering' });
  const data = await fetchJson<JobicyResponse>(`https://jobicy.com/api/jobs?${params}`);
  return (data.jobs ?? []).flatMap((item) => {
    if (!item.id || !item.url || !item.jobTitle) return [];
    const description = cleanText(item.jobDescription ?? '');
    return [{ id: `jobicy:${item.id}`, source: 'JOBICY' as const, sourceUrl: item.url, title: cleanText(item.jobTitle), description, location: item.jobGeo || 'Remote', employmentType: jobType(item.jobType), requiredSkills: skillsFrom(`${item.jobTitle} ${description}`), preferredSkills: [], company: { name: item.companyName ?? 'Company' }, postedAt: item.pubDate }];
  });
}

// Cache public feeds independently of search terms to avoid refetching for every search.
const feeds = new Map<string, { expiresAt: number; promise: Promise<LiveJob[]> }>();
function publicFeed(name: string, fetcher: () => Promise<LiveJob[]>) {
  const cached = feeds.get(name);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;
  const promise = fetcher().catch((error: unknown) => { feeds.delete(name); throw error; });
  feeds.set(name, { expiresAt: Date.now() + 6 * 60 * 60 * 1000, promise });
  return promise;
}

export function matchesJobSearch(job: LiveJob, query: string): boolean {
  const tokens = query.toLowerCase().split(/[^a-z0-9+#.]+/).filter(Boolean);
  const title = `${job.title} ${job.company.name} ${job.requiredSkills.join(' ')}`.toLowerCase();
  return !tokens.length || tokens.some((token) => title.includes(token));
}

export async function getLiveJobs(query: string, country: string): Promise<{ jobs: LiveJob[]; providers: string[]; warnings: string[] }> {
  const key = `${query.toLocaleLowerCase()}:${country.toLocaleLowerCase()}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return { jobs: cached.jobs, providers: cached.providers, warnings: cached.warnings };
  const results = await Promise.allSettled([
    adzunaJobs(query, country),
    publicFeed('REMOTIVE', remotiveJobs),
    publicFeed('JOBICY', jobicyJobs),
  ]);
  const names = ['ADZUNA', 'REMOTIVE', 'JOBICY'];
  const providers: string[] = [];
  const warnings: string[] = [];
  const jobs: LiveJob[] = [];
  results.forEach((result, index) => {
    if (index === 0 && (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY)) {
      warnings.push('Local job listings are not configured; showing remote sources. Check location eligibility on each listing.');
      return;
    }
    if (result.status === 'rejected') { warnings.push(`${names[index]} is temporarily unavailable.`); return; }
    providers.push(names[index]);
    jobs.push(...(index === 0 ? result.value : result.value.filter((job) => matchesJobSearch(job, query))));
  });
  const unique = [...new Map(jobs.map((job) => [`${job.title.toLowerCase()}:${job.company.name.toLowerCase()}:${job.location.toLowerCase()}`, job])).values()];
  // Partial failures get a short retry window; successful feeds retain their own cache.
  if (providers.length) cache.set(key, { jobs: unique, providers, warnings, expiresAt: Date.now() + (results.some((result) => result.status === 'rejected') ? 60_000 : 6 * 60 * 60 * 1000) });
  return { jobs: unique, providers, warnings };
}
