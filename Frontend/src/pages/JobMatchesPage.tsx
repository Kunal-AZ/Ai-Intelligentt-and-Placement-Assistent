import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import '../styles/career-workspace.css';

type Company = { name?: string; website?: string };
type Job = { _id: string; title: string; description: string; location?: string; employmentType: string; requiredSkills: string[]; preferredSkills: string[]; companyId?: Company; matchPreview?: Match; isLive?: boolean; source?: string; applyUrl?: string };
type Match = { jobId: string | { _id: string }; requiredSkillCoverage: { required: number; evidenced: number }; existingRequirements: { skill: string }[]; missingRequirements: string[]; preparationRecommendations: string[] };
type GapPreview = Omit<Match, 'jobId'>;
type LiveJob = Omit<Job, '_id' | 'companyId' | 'isLive'> & { id: string; company: Company; sourceUrl: string };
type Profile = { targetRoles?: string[] };

export function JobMatchesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [selected, setSelected] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveProviders, setLiveProviders] = useState<string[]>([]);
  const [liveError, setLiveError] = useState('');
  const [notice, setNotice] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [trackingJob, setTrackingJob] = useState<string | null>(null);

  const load = (search = 'software developer') => {
    setLoading(true); setLiveError('');
    return Promise.allSettled([api<{ jobs: Job[] }>('/jobs'), api<{ jobs: LiveJob[]; providers: string[]; warnings?: string[] }>(`/jobs/live?query=${encodeURIComponent(search)}&country=in`), api<{ matches: Match[] }>('/jobs/matches')]).then(([jobsResult, liveResult, matchesResult]) => {
    const internalJobs = jobsResult.status === 'fulfilled' ? jobsResult.value.jobs ?? [] : [];
    const liveJobs = liveResult.status === 'fulfilled' ? liveResult.value.jobs.map((job) => ({ ...job, _id: job.id, companyId: job.company, applyUrl: job.sourceUrl, isLive: true })) : [];
    const coverage = (job: Job) => job.matchPreview?.requiredSkillCoverage.required ? job.matchPreview.requiredSkillCoverage.evidenced / job.matchPreview.requiredSkillCoverage.required : -1;
    setJobs([...liveJobs, ...internalJobs].sort((left, right) => coverage(right) - coverage(left)));
    if (liveResult.status === 'fulfilled') { setLiveProviders(liveResult.value.providers ?? []); setLiveError(liveResult.value.warnings?.join(' ') || (!liveResult.value.providers.length ? 'Live job sources are unavailable right now. Try again shortly.' : '')); }
    else setLiveError('Live providers are temporarily unavailable. Showing saved openings only.');
    if (matchesResult.status === 'fulfilled') setMatches(matchesResult.value.matches ?? []);
    setLoading(false);
    });
  };
  useEffect(() => {
    api<{ profile: Profile }>('/profile').then(({ profile }) => {
      const targetRole = profile.targetRoles?.[0];
      if (targetRole) { setQuery(targetRole); return load(targetRole); }
      return load();
    }).catch(() => load());
  }, []);
  const filtered = useMemo(() => jobs.filter((job) => (!location || job.location?.toLowerCase().includes(location.toLowerCase())) && (!type || job.employmentType === type)), [jobs, location, type]);
  const matchFor = (job: Job) => job.isLive ? undefined : matches.find((match) => (typeof match.jobId === 'string' ? match.jobId : match.jobId?._id) === job._id);
  const calculate = async (job: Job) => { setAnalyzing(true); setNotice(''); try { await api('/jobs/match', { method: 'POST', body: JSON.stringify({ jobId: job._id }) }); await load(query.trim() || 'software developer'); setNotice('Match analysis updated. Your missing skills also inform your roadmap.'); } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not analyze this job.'); } finally { setAnalyzing(false); } };
  const track = async (job: Job) => { setTrackingJob(job._id); try { await api('/applications', { method: 'POST', body: JSON.stringify({ company: job.companyId?.name || 'Company', role: job.title, sourceUrl: job.applyUrl || job.companyId?.website }) }); setNotice('Saved to your application tracker.'); } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not save this job.'); } finally { setTrackingJob(null); } };

  return <div className="job-matches-page career-workspace flex flex-col gap-6">
    <header className="career-hero"><div className="career-eyebrow">02 / Find your next opportunity</div><h1>Find work that fits your skills.</h1><p>Explore current openings, understand your skill coverage, and turn each opportunity into a focused preparation plan. Check the original listing for eligibility and availability.</p>{liveProviders.length > 0 && <div className="career-actions mt-4">{liveProviders.map((provider) => <span key={provider} className="badge badge-mono">{provider}</span>)}</div>}</header>
    <div className="career-stats"><div className="career-stat"><strong>{loading ? '—' : jobs.length}</strong><span>Openings returned</span></div><div className="career-stat"><strong>{loading ? '—' : filtered.length}</strong><span>Matching your filters</span></div><div className="career-stat"><strong>{liveProviders.length}</strong><span>Available live sources</span></div></div>
    {notice && <div className="career-notice" role="status">{notice}</div>}
    <form onSubmit={(event) => { event.preventDefault(); void load(query.trim() || 'software developer'); }} className="card p-5 grid grid-cols-1 md:grid-cols-4 gap-3"><input aria-label="Search jobs" className="form-input text-sm" placeholder="e.g. React developer" value={query} onChange={(event) => setQuery(event.target.value)}/><input aria-label="Filter by location" className="form-input text-sm" placeholder="Filter by location" value={location} onChange={(event) => setLocation(event.target.value)}/><select aria-label="Filter by employment type" className="form-select text-sm" value={type} onChange={(event) => setType(event.target.value)}><option value="">All employment types</option><option value="FULL_TIME">Full time</option><option value="INTERNSHIP">Internship</option><option value="PART_TIME">Part time</option></select><button className="btn-primary text-xs" disabled={loading} type="submit">{loading ? 'Loading…' : 'Search live jobs'}</button></form>
    {liveError && <div className="rounded-lg border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-4 py-3 text-xs text-[var(--text-secondary)]" role="status">{liveError}</div>}
    {loading ? <p className="text-sm text-[var(--text-muted)]">Loading current openings…</p> : filtered.length ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filtered.map((job) => { const match = matchFor(job); const preview = match ?? job.matchPreview; const coverage = preview && preview.requiredSkillCoverage.required ? Math.round(preview.requiredSkillCoverage.evidenced / preview.requiredSkillCoverage.required * 100) : undefined; return <article className="card job-opportunity p-5 flex flex-col gap-4" key={job._id}><div className="flex justify-between gap-3"><div><p className="text-xs text-[var(--text-muted)]">{job.companyId?.name || 'Company'} {job.source ? `· ${job.source}` : ''}</p><h2 className="font-bold text-[var(--text-primary)]">{job.title}</h2><p className="text-xs">{job.location || 'Location not specified'} · {job.employmentType.replace('_', ' ')}</p></div>{coverage !== undefined && <span className="badge badge-success self-start">{coverage}% coverage</span>}</div><p className="career-job-excerpt">{job.description || 'Open the source listing for the full role description.'}</p><div className="flex flex-wrap gap-1">{job.requiredSkills.map((skill) => <span className="badge badge-mono text-[9px]" key={skill}>{skill}</span>)}</div><div className="flex flex-wrap gap-2 mt-auto"><button className="btn-secondary text-xs" onClick={() => setSelected(job)}>View details</button><button className="btn-secondary text-xs" disabled={trackingJob === job._id} onClick={() => void track(job)}>{trackingJob === job._id ? 'Saving…' : 'Track'}</button>{job.isLive ? <a className="btn-primary text-xs" href={job.applyUrl} target="_blank" rel="noreferrer">Apply on source</a> : <button className="btn-primary text-xs" disabled={analyzing} onClick={() => void calculate(job)}>{match ? 'Refresh analysis' : 'Analyze match'}</button>}</div></article>; })}</div> : <div className="career-empty"><h2 className="text-lg font-bold">{jobs.length ? 'Try a wider search' : 'No openings returned yet'}</h2><p>{jobs.length ? 'There are openings available, but none match your location or employment filters.' : 'Try a shorter keyword such as React, Python, or developer. Live sources may have limited coverage for this role or may be temporarily unavailable.'}</p><div className="career-actions justify-center"><button className="btn-secondary" onClick={() => { setLocation(''); setType(''); setQuery('developer'); void load('developer'); }}>Reset and search developer roles</button><a className="btn-secondary" href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query || 'software developer')}`} target="_blank" rel="noreferrer">Search on LinkedIn ↗</a></div></div>}
    {selected && <JobModal job={selected} match={matchFor(selected) ?? selected.matchPreview} onClose={() => setSelected(null)} onAnalyze={() => calculate(selected)}/>}
  </div>;
}

function JobModal({ job, match, onClose, onAnalyze }: { job: Job; match?: GapPreview; onClose: () => void; onAnalyze: () => void }) { return <div className="modal-backdrop" onClick={onClose}><div className="modal-card" role="dialog" aria-modal="true" aria-label="Job details" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><p className="text-xs text-[var(--text-muted)]">{job.companyId?.name || 'Company'} {job.source ? `· ${job.source}` : ''}</p><h3 className="font-bold">{job.title}</h3></div><button className="btn-ghost" onClick={onClose}>✕</button></div><div className="modal-body flex flex-col gap-4 text-sm"><p>{job.description}</p><div><h4 className="text-xs font-bold mb-2">Detected role skills</h4><div className="flex flex-wrap gap-1">{job.requiredSkills.map((skill) => <span className="badge badge-mono text-[9px]" key={skill}>{skill}</span>)}</div></div>{match ? <div className="space-y-3"><h4 className="text-xs font-bold">Your skill gap for this job</h4><p className="text-xs"><strong>Matched:</strong> {match.existingRequirements.map((item) => item.skill).join(', ') || 'None recorded yet'}</p><p className="text-xs"><strong>Missing:</strong> {match.missingRequirements.join(', ') || 'None'}</p>{match.preparationRecommendations.length > 0 && <p className="text-xs"><strong>Next steps:</strong> {match.preparationRecommendations.join(' ')}</p>}</div> : !job.isLive && <button className="btn-primary text-xs self-start" onClick={onAnalyze}>Analyze my skill gap</button>}</div><div className="modal-footer"><button className="btn-secondary text-xs" onClick={onClose}>Close</button>{job.applyUrl ? <a className="btn-primary text-xs" href={job.applyUrl} target="_blank" rel="noreferrer">Apply on {job.source}</a> : job.companyId?.website && <a className="btn-primary text-xs" href={job.companyId.website} target="_blank" rel="noreferrer">Visit company site</a>}</div></div></div>; }
