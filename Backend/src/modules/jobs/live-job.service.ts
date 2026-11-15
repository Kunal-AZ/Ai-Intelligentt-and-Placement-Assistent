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
type JobicyResponse = { jobs?: Array<{ id: number | string; jobTitle?: string; companyName?: string; jobGeo?: string; url?: string; pubDate?: string; jobDescription?: string; jobType?: string; jobIndustry?: string }> };

const cache = new Map<string, { expiresAt: number; jobs: LiveJob[]; providers: string[] }>();
const knownSkills = [...new Set(roleProfiles.flatMap((profile) => profile.requirements.map((requirement) => requirement.skill)))];

function cleanText(value: string): string { return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); }
function skillsFrom(value: string): string[] {
  const text = value.toLocaleLowerCase();
  return knownSkills.filter((skill) => text.includes(skill.toLocaleLowerCase())).slice(0, 40);
}
function jobType(value?: string): LiveJob['employmentType'] {
  const type = value?.toLocaleLowerCase() ?? '';
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
async function remotiveJobs(query: string): Promise<LiveJob[]> {
  const data = await fetchJson<RemotiveResponse>(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=30`);
  return (data.jobs ?? []).map((item) => {
    const description = cleanText(item.description ?? '');
    return { id: `remotive:${item.id}`, source: 'REMOTIVE', sourceUrl: item.url, title: cleanText(item.title), description, location: item.candidate_required_location || 'Remote', employmentType: jobType(item.job_type), requiredSkills: skillsFrom(`${item.title} ${description}`), preferredSkills: [], company: { name: item.company_name ?? 'Company', website: item.company_logo_url }, postedAt: item.publication_date };
  });
}
async function jobicyJobs(query: string): Promise<LiveJob[]> {
  const params = new URLSearchParams({ count: '100', geo: 'apac', industry: 'engineering', tag: query.slice(0, 50) });
  const data = await fetchJson<JobicyResponse>(`https://jobicy.com/api/jobs?${params}`);
  return (data.jobs ?? []).flatMap((item) => {
    if (!item.id || !item.url || !item.jobTitle) return [];
    const description = cleanText(item.jobDescription ?? '');
    return [{ id: `jobicy:${item.id}`, source: 'JOBICY' as const, sourceUrl: item.url, title: cleanText(item.jobTitle), description, location: item.jobGeo || 'Remote', employmentType: jobType(item.jobType), requiredSkills: skillsFrom(`${item.jobTitle} ${description}`), preferredSkills: [], company: { name: item.companyName ?? 'Company' }, postedAt: item.pubDate }];
  });
}

export async function getLiveJobs(query: string, country: string): Promise<{ jobs: LiveJob[]; providers: string[] }> {
  const key = `${query.toLocaleLowerCase()}:${country.toLocaleLowerCase()}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return { jobs: cached.jobs, providers: cached.providers };
  const [adzuna, remotive, jobicy] = await Promise.allSettled([adzunaJobs(query, country), remotiveJobs(query), jobicyJobs(query)]);
  const jobs = [...(adzuna.status === 'fulfilled' ? adzuna.value : []), ...(remotive.status === 'fulfilled' ? remotive.value : []), ...(jobicy.status === 'fulfilled' ? jobicy.value : [])];
  const unique = [...new Map(jobs.map((job) => [`${job.title.toLocaleLowerCase()}:${job.company.name.toLocaleLowerCase()}:${job.location.toLocaleLowerCase()}`, job])).values()];
  // Remotive advises consumers not to fetch more than four times per day.
  const providers = [adzuna.status === 'fulfilled' && env.ADZUNA_APP_ID ? 'ADZUNA' : '', remotive.status === 'fulfilled' ? 'REMOTIVE' : '', jobicy.status === 'fulfilled' ? 'JOBICY' : ''].filter(Boolean);
  if (providers.length) cache.set(key, { jobs: unique, providers, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
  return { jobs: unique, providers };
}
