import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

type Profile = { firstName?: string; targetRoles?: string[]; updatedAt?: string };
type Skill = { _id: string; displayName: string };
type Evidence = { skillId: string; source: string; proficiency?: string; createdAt?: string };
type Resume = { originalFileName: string; analysisStatus: string; updatedAt?: string };
type Interview = { _id: string; type: string; status: string; updatedAt?: string };
type Response = { sessionId: string; evaluation?: Record<string, unknown> };

const date = (value?: string) => value ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : 'No activity yet';
const evaluationScore = (evaluation?: Record<string, unknown>) => {
  const score = evaluation?.score ?? evaluation?.overallScore ?? evaluation?.overall;
  if (typeof score === 'number' && Number.isFinite(score)) return score <= 10 ? score * 10 : score;
  const ratings = ['technicalAccuracy', 'communication', 'structure', 'reasoning'].map((key) => evaluation?.[key]).filter((value): value is string => typeof value === 'string');
  if (!ratings.length) return undefined;
  const points = { INSUFFICIENT: 35, PARTIAL: 65, STRONG: 90 } as const;
  return Math.round(ratings.reduce((total, rating) => total + (points[rating as keyof typeof points] ?? 0), 0) / ratings.length);
};

export function DashboardPage() {
  const [profile, setProfile] = useState<Profile>({});
  const [skills, setSkills] = useState<Skill[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([api<{ profile: Profile }>('/profile'), api<{ skills: Skill[]; evidence: Evidence[] }>('/skills'), api<{ resumes: Resume[] }>('/resumes'), api<{ sessions: Interview[]; responses: Response[] }>('/interviews')]).then((results) => {
      if (!mounted) return;
      const [p, s, r, i] = results;
      if (p.status === 'fulfilled') setProfile(p.value.profile ?? {});
      if (s.status === 'fulfilled') { setSkills(s.value.skills ?? []); setEvidence(s.value.evidence ?? []); }
      if (r.status === 'fulfilled') setResumes(r.value.resumes ?? []);
      if (i.status === 'fulfilled') {
        const completed = (i.value.sessions ?? []).filter(session => session.status === 'COMPLETED');
        const completedIds = new Set(completed.map(session => session._id));
        setInterviews(completed);
        setResponses((i.value.responses ?? []).filter(response => completedIds.has(response.sessionId)));
      }
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const verifiedIds = new Set(evidence.filter((item) => item.source !== 'USER_DECLARED').map((item) => item.skillId));
  const verified = skills.filter((skill) => verifiedIds.has(skill._id)).length;
  const analyzed = resumes.some((resume) => resume.analysisStatus === 'READY');
  const scores = responses.map((item) => evaluationScore(item.evaluation)).filter((item): item is number => item !== undefined);
  const average = scores.length ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length) : undefined;
  const readiness = useMemo(() => (analyzed ? 35 : 0) + (skills.length ? Math.round(verified / skills.length * 35) : 0) + (interviews.length ? 30 : 0), [analyzed, interviews.length, skills.length, verified]);
  const latestActivity = [profile.updatedAt, resumes[0]?.updatedAt, interviews[0]?.updatedAt, evidence[0]?.createdAt].filter(Boolean).sort().at(-1);
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return <div className="dashboard-page flex flex-col gap-6 w-full animate-fadeIn">
    <section className="workspace-welcome card-elevated p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-end">
      <div className="flex flex-col gap-3"><span className="text-[11px] font-bold font-mono tracking-wider uppercase text-[var(--text-muted)]">Placement preparation</span><h1 className="text-2xl sm:text-3xl font-black tracking-tight">{greeting}{profile.firstName ? `, ${profile.firstName}` : ''}.</h1><p className="text-sm">Build your profile, close the important gaps, and practise for the jobs you want.</p><div className="flex flex-wrap gap-2 text-xs"><span className="badge badge-mono">Target: {profile.targetRoles?.[0] || 'Not selected'}</span><span className="badge badge-mono">Last activity: {date(latestActivity)}</span><span className="badge badge-mono">{loading ? 'Loading' : readiness ? 'In progress' : 'Get started'}</span></div></div>
      <div className="grid grid-cols-2 gap-2"><Link className="btn-primary text-xs justify-center" to={analyzed ? '/jobs' : '/resume'}>{analyzed ? 'Find jobs' : 'Analyze resume'}</Link><Link className="btn-secondary text-xs justify-center" to={profile.targetRoles?.[0] ? '/roadmap' : '/profile'}>{profile.targetRoles?.[0] ? 'View plan' : 'Set target role'}</Link></div>
    </section>

    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <section className="xl:col-span-7 card flex flex-col gap-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold">Overall Placement Readiness</h2><p className="text-xs">A transparent summary of recorded preparation activity.</p></div><span className="badge badge-mono">{readiness}%</span></div><div className="flex flex-col sm:flex-row items-center gap-6"><Gauge score={readiness}/><div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full"><Metric label="Skills evidenced" value={`${verified} / ${skills.length}`} detail="35% of score"/><Metric label="Resume analysis" value={analyzed ? 'Complete' : 'Not complete'} detail="35% of score"/><Metric label="Mock interviews" value={`${interviews.length} complete`} detail="30% of score"/></div></div><p className="text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-3">Readiness is calculated only from your analyzed resume, verified skill evidence, and completed mock interviews. It is not a job-match prediction.</p></section>
      <section className="xl:col-span-5 card flex flex-col gap-4"><div><h2 className="text-lg font-bold">Learning Performance</h2><p className="text-xs">Activity tracking appears when roadmap learning events are recorded.</p></div><Empty text="No learning-time activity has been recorded yet." action="Open Learning Roadmap" to="/roadmap"/></section>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section className="card flex flex-col gap-4"><h2 className="text-base font-bold">Skills Development</h2><div className="grid grid-cols-2 gap-3"><Metric label="Identified" value={String(skills.length)}/><Metric label="Verified" value={String(verified)}/><Metric label="In progress" value={String(Math.max(skills.length - verified, 0))}/><Metric label="Advanced evidence" value={String(evidence.filter((item) => item.proficiency === 'ADVANCED').length)}/></div><Link className="btn-secondary text-xs" to="/skills">Open Skill Evidence &amp; Gaps</Link></section>
      <section className="card flex flex-col gap-4"><h2 className="text-base font-bold">Learning Roadmap</h2><p className="text-xs">Your learning workspace remains separate so tasks are not duplicated here.</p><Empty text="No synced roadmap progress is available." action="Continue Learning" to="/roadmap"/></section>
      <section className="card flex flex-col gap-4"><h2 className="text-base font-bold">Resume Progress</h2>{resumes[0] ? <><Metric label="Latest resume" value={resumes[0].originalFileName} detail={`Analysis: ${resumes[0].analysisStatus}`}/><p className="text-xs text-[var(--text-muted)]">Last updated {date(resumes[0].updatedAt)}</p></> : <p className="text-xs text-[var(--text-muted)]">No resume has been uploaded.</p>}<Link className="btn-secondary text-xs" to="/resume">Open Resume Studio</Link></section>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section className="card flex flex-col gap-4"><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-bold">Mock Interview Performance</h2><p className="text-xs">Only completed sessions are included.</p></div><Link to="/interviews" className="btn-primary text-xs py-2">Start Mock Interview</Link></div><div className="grid grid-cols-3 gap-3"><Metric label="Completed" value={String(interviews.length)}/><Metric label="Average score" value={average === undefined ? '—' : `${average}%`}/><Metric label="Technical" value={String(interviews.filter((item) => ['TECHNICAL', 'DSA', 'SYSTEM_DESIGN', 'ROLE_SPECIFIC'].includes(item.type)).length)}/></div>{interviews.length ? <p className="text-xs text-[var(--text-muted)]">Most recent: {date(interviews[0].updatedAt)}</p> : <p className="text-xs text-[var(--text-muted)]">Complete a mock interview to unlock performance insights.</p>}</section>
      <section className="card flex flex-col gap-4"><h2 className="text-base font-bold">Your AI Learning Insights</h2>{!skills.length && !interviews.length && !resumes.length ? <Empty text="Complete a resume analysis, add skill evidence, or finish an interview to receive personalized insights." action="Complete Profile" to="/profile"/> : <div className="space-y-2 text-xs"><Insight text={verified ? `${verified} of your ${skills.length} identified skills have recorded evidence.` : 'Add evidence to turn listed skills into verified strengths.'}/><Insight text={interviews.length ? `You have completed ${interviews.length} mock interview${interviews.length === 1 ? '' : 's'}${average === undefined ? '.' : ` with a ${average}% average evaluation.`}` : 'Start a mock interview to establish a performance baseline.'}/><Insight text={analyzed ? 'Your resume analysis is available in Resume Studio.' : 'Analyze your resume to add it to your readiness calculation.'}/></div>}</section>
    </div>
  </div>;
}

function Gauge({ score }: { score: number }) { return <div className="relative w-36 h-36 shrink-0"><svg className="w-full h-full -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="var(--bg-subtle)" strokeWidth="8" fill="none"/><circle cx="50" cy="50" r="40" stroke="var(--text-primary)" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - 251.2 * score / 100} strokeLinecap="round" fill="none"/></svg><span className="absolute inset-0 flex items-center justify-center text-3xl font-black">{score}%</span></div>; }
function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) { return <div className="workspace-metric rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3"><p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{label}</p><strong className="block mt-1 text-sm text-[var(--text-primary)] truncate">{value}</strong>{detail && <span className="text-[10px] text-[var(--text-muted)]">{detail}</span>}</div>; }
function Empty({ text, action, to }: { text: string; action: string; to: string }) { return <div className="workspace-empty rounded-lg border border-dashed border-[var(--border-default)] p-4 flex flex-col gap-3 text-xs text-[var(--text-muted)]"><span>{text}</span><Link className="btn-secondary text-xs self-start" to={to}>{action}</Link></div>; }
function Insight({ text }: { text: string }) { return <div className="rounded-lg bg-[var(--bg-subtle)] p-3 text-[var(--text-secondary)]">{text}</div>; }
