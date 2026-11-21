import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import '../styles/career-workspace.css';

type Requirement = { skill: string; category: 'FOUNDATIONAL' | 'CORE'; status: 'PRESENT' | 'MISSING' | 'NEEDS_REINFORCEMENT' };
type Gap = { role: string; requirements: Requirement[] };
type Profile = { userId: string; targetRoles?: string[] };
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
  'data structures': 'Implement arrays, hash maps, stacks, queues, and trees; compare their time and space costs.',
  algorithms: 'Practice searching, sorting, recursion, and dynamic programming; explain why each approach works.',
  testing: 'Write unit and integration tests for success, invalid input, and failure scenarios in a small project.',
  'cloud deployment': 'Deploy a small application with environment configuration, health checks, and logs.',
  'express.js': 'Build routes and middleware with request validation, centralized errors, and endpoint tests.',
  html: 'Build a semantic page with accessible forms, headings, navigation, and keyboard interaction.',
  css: 'Create a responsive layout with Grid and Flexbox; test small screens and visible focus states.',
  docker: 'Containerize a small service, configure environment variables, and run it with a database.',
  linux: 'Practice navigating files, permissions, processes, shell pipelines, and inspecting service logs.',
  'ci/cd': 'Create a pipeline that installs dependencies, runs checks, builds, and deploys an application.',
  'machine learning': 'Train and evaluate a baseline model; separate training and test data and explain the metrics.',
  llms: 'Build a small prompt-driven feature and evaluate its outputs for correctness and failure cases.',
  excel: 'Clean a dataset, use lookup formulas and pivot tables, and summarize findings in a chart.',
  'data visualization': 'Turn a dataset into readable charts with labels and a short explanation of the findings.',
  statistics: 'Cover distributions, hypothesis testing, correlation, and practical interpretation.',
};
const conceptFor = (skill: string) => lessonConcepts[skill.toLocaleLowerCase()] ?? `Learn the core concepts, build one small project exercise, and record the result as evidence.`;

function savedProgress(userId: string, role: string): string[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(`placement-roadmap:${userId}:${role}`) ?? '[]'); return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; } catch { return []; }
}

export function LearningRoadmapPage() {
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [planDays, setPlanDays] = useState(28);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    Promise.allSettled([api<{ profile: Profile }>('/profile'), api<{ gaps: Gap[] }>('/skill-gaps'), api<{ matches: JobMatch[] }>('/jobs/matches')])
      .then(async ([profileResult, gapsResult, matchesResult]) => {
        if (profileResult.status === 'rejected') throw profileResult.reason;
        const ownerId = profileResult.value.profile.userId;
        if (!ownerId) throw new Error('Your profile could not be loaded. Please try again.');
        const loadedGaps = gapsResult.status === 'fulfilled' ? gapsResult.value.gaps ?? [] : [];
        const requestedRole = new URLSearchParams(window.location.search).get('role');
        const role = requestedRole || (profileResult.status === 'fulfilled' ? profileResult.value.profile.targetRoles?.[0] ?? loadedGaps[0]?.role ?? '' : loadedGaps[0]?.role ?? '') || 'Software Engineer';
        if (!loadedGaps.some((gap) => gap.role === role)) {
          const result = await api<{ gaps: Gap[] }>(`/skill-gaps?role=${encodeURIComponent(role)}`);
          loadedGaps.push(...result.gaps);
        }
        setUserId(ownerId); setGaps(loadedGaps); setSelectedRole(role); setCompleted(savedProgress(ownerId, role));
        if (matchesResult.status === 'fulfilled') setJobMatches(matchesResult.value.matches ?? []);
        if (!loadedGaps.length) setError('Choose a target role and record skills first, then your personalized roadmap will appear here.');
      }).catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load your roadmap.')).finally(() => setLoading(false));
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

  function selectRole(role: string) { setSelectedRole(role); setCompleted(savedProgress(userId, role)); }
  function toggle(id: string) { if (!userId) return; const next = completed.includes(id) ? completed.filter((item) => item !== id) : [...completed, id]; setCompleted(next); try { localStorage.setItem(`placement-roadmap:${userId}:${selectedRole}`, JSON.stringify(next)); } catch { /* Progress remains available for this visit when browser storage is disabled. */ } }
  const progress = tasks.length ? Math.round(tasks.filter((task) => task.completed).length / tasks.length * 100) : 0;
  const weeks = Math.max(2, Math.ceil(planDays / 7));
  const weeklyTasks = Array.from({ length: weeks }, (_, index) => tasks.slice(index * Math.ceil(tasks.length / weeks), (index + 1) * Math.ceil(tasks.length / weeks)));
  const interviewPractice = [
    { title: 'DSA practice', detail: 'Solve two timed data-structures or algorithms problems and explain the complexity aloud.' },
    { title: 'Aptitude & reasoning', detail: 'Complete a short quantitative, logical-reasoning, or pattern-recognition drill.' },
    { title: 'Communication practice', detail: 'Record a 60-second introduction or STAR story, then improve clarity and structure.' },
  ];

  return <div className="learning-roadmap-page career-workspace flex flex-col gap-6">
    <header className="career-hero"><div className="career-eyebrow">03 / Turn gaps into progress</div><h1>A clearer path to your next role.</h1><p>A practical plan built around your role requirements and analyzed job gaps. Learn the concept, build something useful, and leave with evidence you can discuss in an interview.</p></header>
    {!loading && !error && <div className="career-stats"><div className="career-stat"><strong>{tasks.filter((task) => task.completed).length}/{tasks.length}</strong><span>Learning milestones completed</span></div><div className="career-stat"><strong>{weeks} weeks</strong><span>Your selected pace</span></div><div className="career-stat"><strong>{progress}%</strong><span>Plan progress · saved on this browser</span></div></div>}
    {!loading && !error && <div className="card p-4 flex flex-col sm:flex-row gap-3 sm:items-end"><div className="form-group flex-1"><label className="form-label">Target role</label><select className="form-select" value={selectedRole} onChange={(event) => selectRole(event.target.value)}>{gaps.map((gap) => <option key={gap.role} value={gap.role}>{gap.role}</option>)}</select></div><div className="form-group flex-1"><label className="form-label">Plan duration</label><select className="form-select" value={planDays} onChange={(event) => setPlanDays(Number(event.target.value))}><option value={14}>14 days · focused</option><option value={28}>28 days · balanced</option><option value={42}>42 days · steady</option></select></div><p className="text-xs text-[var(--text-muted)] pb-2">{weeks} weekly milestones</p></div>}
    {loading ? <p className="text-sm text-[var(--text-muted)]">Building your roadmap from recorded evidence…</p> : error ? <div className="card p-6 text-sm text-[var(--text-muted)] flex flex-col gap-3"><span>{error}</span><div className="career-actions"><button className="btn-secondary" onClick={() => window.location.reload()}>Retry</button><Link className="btn-primary text-xs" to="/profile">Set target role</Link></div></div> : tasks.length ? <div className="space-y-4">{weeklyTasks.map((weekTasks, weekIndex) => <section className="card roadmap-week p-5 flex flex-col gap-3" key={weekIndex}><div className="flex justify-between text-xs border-b border-[var(--border-subtle)] pb-3"><span className="font-bold">Week {weekIndex + 1} · {weekIndex === 0 ? 'Build momentum' : weekIndex === weeks - 1 ? 'Practice and demonstrate' : 'Learn and apply'}</span><span className="text-[var(--text-muted)]">{weekTasks.length ? `${Math.ceil(planDays / Math.max(tasks.length, 1))} days per concept` : 'Review and practice'}</span></div>{weekTasks.length ? weekTasks.map((task) => <label key={task.id} className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer ${task.completed ? 'bg-[var(--bg-subtle)] opacity-70 border-[var(--border-subtle)]' : 'border-[var(--border-default)]'}`}><input type="checkbox" checked={task.completed} onChange={() => toggle(task.id)} /><div className="flex-1"><p className={`text-sm font-bold ${task.completed ? 'line-through' : ''}`}>{task.title}</p><p className="text-sm text-[var(--text-secondary)] mt-2">{task.detail}</p><p className="text-xs text-[var(--text-muted)] mt-3"><strong>Deliverable:</strong> A working example, a short README explaining your approach, and one test or worked exercise.</p><p className="text-xs text-[var(--text-muted)] mt-1"><strong>Ready to complete:</strong> You can explain the concept and demonstrate it without following a tutorial.</p></div><span className={`badge text-[9px] ${task.priority === 'HIGH' ? 'badge-warning' : 'badge-mono'}`}>{task.priority}</span></label>) : <p className="text-xs text-[var(--text-muted)]">Use this week for project work, revision, and mock-interview practice.</p>}</section>)}</div> : <div className="card p-6 text-sm flex flex-col gap-3"><p>Great work — no skill gaps are currently recorded for {selectedRole}.</p><Link className="btn-secondary text-xs self-start" to="/jobs">Analyze an opening</Link></div>}
    {!loading && !error && <section className="card p-5 flex flex-col gap-3"><div><h2 className="font-bold text-sm">Placement practice loop</h2><p className="text-xs text-[var(--text-muted)] mt-1">Keep technical ability, aptitude, and communication moving together.</p></div><div className="grid grid-cols-1 md:grid-cols-3 gap-3">{interviewPractice.map((practice) => <div className="rounded-lg bg-[var(--bg-subtle)] p-3" key={practice.title}><h3 className="text-xs font-bold">{practice.title}</h3><p className="text-xs text-[var(--text-muted)] mt-1">{practice.detail}</p></div>)}</div><Link className="btn-secondary text-xs self-start" to="/interviews">Start a mock interview</Link></section>}
    <div className="career-notice"><strong>Make each session count.</strong> Spend 20 minutes studying, 30 minutes building, and 10 minutes recalling what you learned. Completion tracks your practice; add your project in <Link className="underline" to="/skills">Skill Evidence</Link> to update your recorded skills.</div>
    <div className="card p-5 text-xs text-[var(--text-muted)]">To make this job-specific, open an opportunity in <Link className="underline font-bold" to="/jobs">Job Matches</Link> and select “Analyze match.” Its missing requirements move to the top of this roadmap.</div>
  </div>;
}
