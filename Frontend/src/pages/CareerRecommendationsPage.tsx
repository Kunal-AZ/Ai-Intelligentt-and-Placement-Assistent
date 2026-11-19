import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';

type CareerPath = { career_title: string; description: string; match_score: number; matching_skills: string[]; missing_skills: string[]; recommendation_reason: string; next_steps: string[]; learning_roadmap: string[]; growth_opportunities: string[] };
type CareerResult = { profile_summary: string; top_career_paths: CareerPath[]; overall_guidance: string; alternative_career_options: string[] };

export function CareerRecommendationsPage() {
  const [education, setEducation] = useState('');
  const [interests, setInterests] = useState('');
  const [preferredWork, setPreferredWork] = useState('');
  const [projects, setProjects] = useState('');
  const [result, setResult] = useState<CareerResult | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [recordedSkills, setRecordedSkills] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([api<{ profile: { degree?: string; targetRoles?: string[] } }>('/profile'), api<{ skills: Array<{ displayName: string }> }>('/skills')])
      .then(([profileResult, skillsResult]) => {
        const role = profileResult.profile.targetRoles?.[0] ?? '';
        setEducation(profileResult.profile.degree ?? '');
        setPreferredWork(role);
        setInterests(role);
        setRecordedSkills(skillsResult.skills.map((skill) => skill.displayName));
      })
      .catch(() => undefined);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('Generating career recommendations…'); setResult(null);
    try {
      const { result: data } = await api<{ result: CareerResult }>('/ai/careers', { method: 'POST', body: JSON.stringify({ education, interests: interests.split(',').map((item) => item.trim()).filter(Boolean), projects: projects.split('\n').map((item) => item.trim()).filter(Boolean), preferredWork }) });
      setResult(data); setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not generate recommendations.'); } finally { setBusy(false); }
  }

  return <div className="flex flex-col gap-6">
    <div className="pb-4 border-b border-[var(--border-subtle)]"><span className="badge badge-success">Multi-Agent Guidance</span><h1 className="text-2xl font-black tracking-tight mt-2">Career Recommendations</h1><p className="text-sm text-[var(--text-muted)] mt-1">Recommendations use your current recorded skills, resume evidence, and selected target role.</p>{recordedSkills.length > 0 && <p className="text-xs text-[var(--text-muted)] mt-2">Current skill evidence: {recordedSkills.join(' · ')}</p>}</div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><form className="card p-5 flex flex-col gap-3" onSubmit={submit}><label className="text-xs font-bold">Education<input className="form-input mt-1" required value={education} onChange={(event) => setEducation(event.target.value)} placeholder="B.Tech Computer Science" /></label><label className="text-xs font-bold">Interests<input className="form-input mt-1" value={interests} onChange={(event) => setInterests(event.target.value)} placeholder="backend systems, AI" /></label><label className="text-xs font-bold">Preferred work<input className="form-input mt-1" required value={preferredWork} onChange={(event) => setPreferredWork(event.target.value)} placeholder="Backend engineering" /></label><label className="text-xs font-bold">Projects <span className="font-normal text-[var(--text-muted)]">(one per line)</span><textarea className="form-textarea mt-1" value={projects} onChange={(event) => setProjects(event.target.value)} placeholder="Resume analysis platform" /></label><button className="btn-primary mt-2" disabled={busy || !recordedSkills.length}>{busy ? 'Generating…' : 'Get recommendations'}</button>{!recordedSkills.length && <p className="text-xs text-[var(--text-muted)]">Analyze a resume or add skills first to unlock recommendations.</p>}{message && <p className="text-xs text-[var(--text-secondary)]" role="status">{message}</p>}</form>
      <section className="lg:col-span-2 flex flex-col gap-4">{!result ? <div className="card p-6 text-sm text-[var(--text-muted)]">Complete the form to receive real recommendations from the AI service.</div> : <><div className="card p-5"><h2 className="font-bold">Profile summary</h2><p className="text-sm text-[var(--text-secondary)] mt-2">{result.profile_summary}</p><p className="text-sm mt-3"><strong>Guidance: </strong>{result.overall_guidance}</p></div>{result.top_career_paths.map((path) => <article className="card p-5" key={path.career_title}><div className="flex justify-between gap-3"><div><h2 className="font-bold">{path.career_title}</h2><p className="text-xs text-[var(--text-muted)] mt-1">{path.description}</p></div><span className="badge badge-success self-start">{path.match_score}% fit</span></div><p className="text-sm mt-3">{path.recommendation_reason}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs"><Items title="Matching skills" values={path.matching_skills} /><Items title="Skills to build" values={path.missing_skills} /><Items title="Next steps" values={path.next_steps} /><Items title="Growth opportunities" values={path.growth_opportunities} /></div></article>)}</>}</section></div>
  </div>;
}

function Items({ title, values }: { title: string; values: string[] }) { return <div><h3 className="font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">{title}</h3><ul className="space-y-1">{values.map((value) => <li key={value}>• {value}</li>)}</ul></div>; }
