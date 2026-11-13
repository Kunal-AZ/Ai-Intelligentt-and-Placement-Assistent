import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

type Requirement = { skill: string; category: 'FOUNDATIONAL' | 'CORE'; status: 'PRESENT' | 'MISSING' | 'NEEDS_REINFORCEMENT' };
type Gap = { role: string; requirements: Requirement[] };
type Profile = { targetRoles?: string[] };
type JobMatch = { missingRequirements: string[] };
type RoadmapTask = { id: string; title: string; detail: string; priority: 'HIGH' | 'MEDIUM'; completed: boolean };

const lessonConcepts: Record<string, string> = {
  typescript: 'Practice types, interfaces, generics, narrowing, and typing an API response.',
  sql: 'Learn SELECT, JOIN, GROUP BY, window functions, indexing, and solve query drills.',
  javascript: 'Revise closures, promises, async/await, event loop behaviour, and array methods.',
  'node.js': 'Build an API with routing, middleware, validation, error handling, and async patterns.',
  react: 'Practice components, state, effects, forms, data fetching, and performance basics.',
  mongodb: 'Model documents, write queries and aggregation pipelines, then add indexes.',
  'rest apis': 'Design endpoints, status codes, pagination, authentication, and validation.',
  git: 'Practice branching, pull requests, merge conflicts, and a clean commit history.',
  python: 'Practice functions, collections, virtual environments, and data-processing exercises.',
  statistics: 'Cover distributions, hypothesis testing, correlation, and practical interpretation.',
};
const conceptFor = (skill: string) => lessonConcepts[skill.toLocaleLowerCase()] ?? `Learn the core concepts, build one small project exercise, and record the result as evidence.`;

function savedProgress(role: string): string[] {
  try { return JSON.parse(localStorage.getItem(`placement-roadmap:${role}`) ?? '[]') as string[]; } catch { return []; }
}

export function LearningRoadmapPage() {
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [planDays, setPlanDays] = useState(28);

  useEffect(() => {
    Promise.allSettled([api<{ profile: Profile }>('/profile'), api<{ gaps: Gap[] }>('/skill-gaps'), api<{ matches: JobMatch[] }>('/jobs/matches')])
      .then(([profileResult, gapsResult, matchesResult]) => {
        const loadedGaps = gapsResult.status === 'fulfilled' ? gapsResult.value.gaps ?? [] : [];
        const role = profileResult.status === 'fulfilled' ? profileResult.value.profile.targetRoles?.[0] ?? loadedGaps[0]?.role ?? '' : loadedGaps[0]?.role ?? '';
        setGaps(loadedGaps); setSelectedRole(role); setCompleted(savedProgress(role));
        if (matchesResult.status === 'fulfilled') setJobMatches(matchesResult.value.matches ?? []);
        if (!loadedGaps.length) setError('Choose a target role and record skills first, then your personalized roadmap will appear here.');
      }).finally(() => setLoading(false));
  }, []);

  const activeGap = gaps.find((gap) => gap.role === selectedRole) ?? gaps[0];
  const tasks = useMemo<RoadmapTask[]>(() => {
    if (!activeGap) return [];
    const jobGaps = new Set(jobMatches.flatMap((match) => match.missingRequirements).map((skill) => skill.toLocaleLowerCase()));
    return activeGap.requirements.filter((item) => item.status !== 'PRESENT').map((item) => ({
      id: item.skill.toLocaleLowerCase(), title: `Build evidence for ${item.skill}`,
      detail: `${jobGaps.has(item.skill.toLocaleLowerCase()) ? 'Required by an opening you analyzed. ' : item.status === 'NEEDS_REINFORCEMENT' ? 'Strengthen your current beginner-level evidence. ' : ''}${conceptFor(item.skill)}`,
      priority: (jobGaps.has(item.skill.toLocaleLowerCase()) || item.category === 'CORE' ? 'HIGH' : 'MEDIUM') as 'HIGH' | 'MEDIUM',
      completed: completed.includes(item.skill.toLocaleLowerCase()),
    })).sort((a, b) => Number(b.priority === 'HIGH') - Number(a.priority === 'HIGH'));
  }, [activeGap, completed, jobMatches]);

  function selectRole(role: string) { setSelectedRole(role); setCompleted(savedProgress(role)); }
  function toggle(id: string) { const next = completed.includes(id) ? completed.filter((item) => item !== id) : [...completed, id]; setCompleted(next); localStorage.setItem(`placement-roadmap:${selectedRole}`, JSON.stringify(next)); }
  const progress = tasks.length ? Math.round(tasks.filter((task) => task.completed).length / tasks.length * 100) : 0;
  const weeks = Math.max(2, Math.ceil(planDays / 7));
  const weeklyTasks = Array.from({ length: weeks }, (_, index) => tasks.filter((_, taskIndex) => taskIndex % weeks === index));

  return <div className="learning-roadmap-page flex flex-col gap-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]"><div><span className="badge badge-success">Gap-driven plan</span><h1 className="text-2xl font-black tracking-tight mt-2">Your Learning Roadmap</h1><p className="text-sm text-[var(--text-muted)] mt-1">Priorities come from your selected role and the gaps in jobs you have analyzed.</p></div><div className="flex items-center gap-3"><div className="w-28 h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden"><div className="h-full bg-[var(--text-primary)] transition-all" style={{ width: `${progress}%` }}/></div><span className="font-mono text-xs font-bold">{progress}% done</span></div></div>
    <div className="card p-4 flex flex-col sm:flex-row gap-3 sm:items-end"><div className="form-group flex-1"><label className="form-label">Target role</label><select className="form-select" value={selectedRole} onChange={(event) => selectRole(event.target.value)}>{gaps.map((gap) => <option key={gap.role} value={gap.role}>{gap.role}</option>)}</select></div><div className="form-group flex-1"><label className="form-label">Plan duration</label><select className="form-select" value={planDays} onChange={(event) => setPlanDays(Number(event.target.value))}><option value={14}>14 days · focused</option><option value={28}>28 days · balanced</option><option value={42}>42 days · steady</option></select></div><p className="text-xs text-[var(--text-muted)] pb-2">{weeks} weekly milestones</p></div>
    {loading ? <p className="text-sm text-[var(--text-muted)]">Building your roadmap from recorded evidence…</p> : error ? <div className="card p-6 text-sm text-[var(--text-muted)] flex flex-col gap-3"><span>{error}</span><Link className="btn-primary text-xs self-start" to="/profile">Set target role</Link></div> : tasks.length ? <div className="space-y-4">{weeklyTasks.map((weekTasks, weekIndex) => <section className="card p-5 flex flex-col gap-3" key={weekIndex}><div className="flex justify-between text-xs border-b border-[var(--border-subtle)] pb-3"><span className="font-bold">Week {weekIndex + 1}</span><span className="text-[var(--text-muted)]">{weekTasks.length ? `${Math.ceil(planDays / Math.max(tasks.length, 1))} days per concept` : 'Review and practice'}</span></div>{weekTasks.length ? weekTasks.map((task) => <label key={task.id} className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer ${task.completed ? 'bg-[var(--bg-subtle)] opacity-70 border-[var(--border-subtle)]' : 'border-[var(--border-default)]'}`}><input type="checkbox" checked={task.completed} onChange={() => toggle(task.id)} /><div className="flex-1"><p className={`text-sm font-bold ${task.completed ? 'line-through' : ''}`}>{task.title}</p><p className="text-xs text-[var(--text-muted)] mt-1">{task.detail}</p></div><span className={`badge text-[9px] ${task.priority === 'HIGH' ? 'badge-warning' : 'badge-mono'}`}>{task.priority}</span></label>) : <p className="text-xs text-[var(--text-muted)]">Use this week for project work, revision, and mock-interview practice.</p>}</section>)}</div> : <div className="card p-6 text-sm flex flex-col gap-3"><p>Great work — no skill gaps are currently recorded for {selectedRole}.</p><Link className="btn-secondary text-xs self-start" to="/jobs">Analyze an opening</Link></div>}
    <div className="card p-5 text-xs text-[var(--text-muted)]">To make this job-specific, open an opportunity in <Link className="underline font-bold" to="/jobs">Job Matches</Link> and select “Analyze match.” Its missing requirements move to the top of this roadmap.</div>
  </div>;
}
