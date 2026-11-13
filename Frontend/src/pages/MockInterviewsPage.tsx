import { useState } from 'react';
import { api } from '../lib/api';

type Question = { question: string; rubric: string[]; focusSkills: string[] };
type Response = { _id: string; question: Question };
type Session = { _id: string; type: string; role?: string; difficulty: string };
type Evaluation = { technicalAccuracy: string; communication: string; structure: string; reasoning: string; strengths: string[]; improvements: string[]; followUpFocus: string[] };

export function MockInterviewsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [current, setCurrent] = useState<Response | null>(null);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [type, setType] = useState('TECHNICAL');
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true); setEvaluation(null); setMessage('Preparing your interview…');
    try {
      const { session: created, question } = await api<{ session: Session; question: Response }>('/interviews', { method: 'POST', body: JSON.stringify({ type, difficulty }) });
      setSession(created); setCurrent(question); setAnswer(''); setMessage('');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not start the interview.'); } finally { setBusy(false); }
  }
  async function submit() {
    if (!session || !answer.trim()) return;
    setBusy(true); setMessage('Evaluating your answer…');
    try {
      const result = await api<{ evaluation: Evaluation; nextQuestion: Response }>(`/interviews/${session._id}/respond`, { method: 'POST', body: JSON.stringify({ answer }) });
      setEvaluation(result.evaluation); setCurrent(result.nextQuestion); setAnswer(''); setMessage('Feedback saved. Your next question is ready.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not evaluate this answer.'); } finally { setBusy(false); }
  }
  async function finish() {
    if (!session) return;
    try { await api(`/interviews/${session._id}/complete`, { method: 'POST' }); setMessage('Interview completed. Your dashboard has been updated.'); setSession(null); setCurrent(null); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not complete the interview.'); }
  }

  return <div className="mock-interviews-layout flex flex-col gap-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]"><div><span className="badge badge-success">Saved practice session</span><h1 className="text-2xl font-black tracking-tight mt-2">Technical Mock Interviews</h1><p className="text-sm text-[var(--text-muted)]">Each response is evaluated, saved, and used to improve your next question.</p></div>{session && <button className="btn-secondary text-xs" onClick={finish}>Finish interview</button>}</div>
    {!session && <section className="card p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end"><div className="form-group"><label className="form-label">Interview type</label><select className="form-select" value={type} onChange={(event) => setType(event.target.value)}><option value="TECHNICAL">Technical</option><option value="DSA">DSA</option><option value="SYSTEM_DESIGN">System design</option><option value="HR">HR</option><option value="BEHAVIORAL">Behavioral</option></select></div><div className="form-group"><label className="form-label">Difficulty</label><select className="form-select" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="BEGINNER">Beginner</option><option value="INTERMEDIATE">Intermediate</option><option value="ADVANCED">Advanced</option></select></div><button className="btn-primary" disabled={busy} onClick={start}>{busy ? 'Preparing…' : 'Start interview'}</button></section>}
    {message && <p className="text-sm text-[var(--text-secondary)]" role="status">{message}</p>}
    {current && <section className="card-elevated p-6 flex flex-col gap-5"><div><span className="badge badge-mono">{session?.type.replace('_', ' ')}</span><h2 className="text-lg font-bold mt-3">{current.question.question}</h2><p className="text-xs text-[var(--text-muted)] mt-2">Focus: {current.question.focusSkills.join(', ') || 'Core reasoning'}</p></div><div className="rounded-lg bg-[var(--bg-subtle)] p-4 text-xs"><strong>What a strong answer covers</strong><ul className="mt-2 space-y-1">{current.question.rubric.map((item) => <li key={item}>• {item}</li>)}</ul></div><textarea className="form-textarea min-h-40" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Write your answer. Explain your reasoning, examples, and trade-offs." disabled={busy}/><button className="btn-primary self-end" disabled={!answer.trim() || busy} onClick={submit}>{busy ? 'Evaluating…' : 'Submit answer'}</button></section>}
    {evaluation && <section className="card p-6 flex flex-col gap-4"><div><span className="badge badge-success">Feedback saved</span><h2 className="text-lg font-bold mt-2">Your last answer</h2></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs"><Score label="Technical" value={evaluation.technicalAccuracy}/><Score label="Communication" value={evaluation.communication}/><Score label="Structure" value={evaluation.structure}/><Score label="Reasoning" value={evaluation.reasoning}/></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><List title="Strengths" values={evaluation.strengths}/><List title="Improve next" values={evaluation.improvements}/></div></section>}
  </div>;
}
function Score({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-[var(--bg-subtle)] p-3"><p className="text-[10px] uppercase text-[var(--text-muted)]">{label}</p><strong className="text-xs">{value}</strong></div>; }
function List({ title, values }: { title: string; values: string[] }) { return <div><h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">{title}</h3><ul className="space-y-1 text-xs">{values.map((value) => <li key={value}>• {value}</li>)}</ul></div>; }
