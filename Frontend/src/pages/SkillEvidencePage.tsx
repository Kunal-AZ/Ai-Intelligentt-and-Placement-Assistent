import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import '../styles/career-workspace.css';

type Requirement = { skill: string; category: string; status: 'PRESENT' | 'MISSING' | 'NEEDS_REINFORCEMENT'; evidenceSources: string[] };
type Gap = { role: string; requirements: Requirement[] };
type Skill = { _id: string; displayName: string };
type Evidence = { skillId: string; source: string; proficiency?: string; summary?: string };
const roles = ['Software Engineer', 'Backend Developer', 'Frontend Developer', 'Data Analyst', 'Full-Stack Developer', 'Mobile Developer', 'DevOps Engineer', 'Cybersecurity Analyst', 'Data Scientist', 'AI Engineer'];

export function SkillEvidencePage() {
  const [role, setRole] = useState('Backend Developer');
  const [gap, setGap] = useState<Gap | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('BEGINNER');
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    Promise.all([api<{ gaps: Gap[] }>(`/skill-gaps?role=${encodeURIComponent(role)}`), api<{ skills: Skill[]; evidence: Evidence[] }>('/skills')])
      .then(([result, ledger]) => { if (active) { setGap(result.gaps[0] ?? null); setSkills(ledger.skills); setEvidence(ledger.evidence); } })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : 'Unable to load skills.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [role, revision]);

  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setSaveError('');
    try {
      await api('/skills', { method: 'PUT', body: JSON.stringify({ skills: [{ name: name.trim(), proficiency: level, summary: summary.trim() || 'Self-reported skill' }] }) });
      setAdding(false); setName(''); setSummary(''); setRevision((value) => value + 1);
    } catch (err) { setSaveError(err instanceof Error ? err.message : 'Unable to save skill.'); }
    finally { setSaving(false); }
  }
  const requirements = gap?.requirements ?? [];
  const present = requirements.filter((item) => item.status === 'PRESENT');
  const missing = requirements.filter((item) => item.status === 'MISSING');
  const reinforce = requirements.filter((item) => item.status === 'NEEDS_REINFORCEMENT');
  const coverage = requirements.length ? Math.round((present.length + reinforce.length) / requirements.length * 100) : 0;

  return <div className="career-workspace flex flex-col gap-6">
    <header className="career-hero"><div className="career-eyebrow">01 / Understand your strengths</div><h1>Your next skill starts here.</h1><p>See what your target role asks for, what your evidence already covers, and where to focus next. A missing record is an opportunity to add evidence, not a judgement of your ability.</p><div className="career-actions mt-5"><button className="btn-primary" onClick={() => { setSaveError(''); setAdding(true); }}>+ Record a skill</button><Link className="btn-secondary" to="/resume">Analyze your resume</Link></div></header>
    <section className="card p-5 flex flex-wrap items-end gap-5"><div className="form-group flex-1"><label htmlFor="gap-role" className="form-label">Explore requirements for</label><select id="gap-role" className="form-select" value={role} onChange={(event) => setRole(event.target.value)}>{roles.map((item) => <option key={item}>{item}</option>)}</select></div><Link className="btn-secondary" to={`/roadmap?role=${encodeURIComponent(role)}`}>Build my learning plan →</Link></section>
    {loading ? <div className="career-notice" role="status">Comparing your recorded skills with role requirements…</div> : error ? <div className="career-notice" role="alert">{error} <button className="btn-secondary" onClick={() => setRevision((value) => value + 1)}>Retry</button></div> : <>
      <div className="career-stats"><div className="career-stat"><strong>{coverage}%</strong><span>Requirements with recorded evidence</span></div><div className="career-stat"><strong>{missing.length}</strong><span>Skills to learn or document</span></div><div className="career-stat"><strong>{reinforce.length}</strong><span>Skills to strengthen</span></div></div>
      <div className="career-columns"><section className="card p-6"><div className="career-section-heading"><div><h2>Role requirements</h2><p>{present.length + reinforce.length} of {requirements.length} skills have evidence</p></div><span className="badge badge-mono">{role}</span></div><div className="career-progress"><span style={{ width: `${coverage}%` }} /></div><div className="skill-requirements">{requirements.map((item) => <article key={item.skill} className="skill-requirement"><div><h3>{item.skill}</h3><p>{item.category === 'CORE' ? 'Core role skill' : 'Foundation'} · {item.evidenceSources.length ? item.evidenceSources.map((source) => source.replaceAll('_', ' ').toLowerCase()).join(', ') : 'No evidence recorded'}</p></div><button className={`badge ${item.status === 'PRESENT' ? 'badge-success' : 'badge-warning'}`} onClick={() => { setName(item.skill); setSaveError(''); setAdding(true); }}>{item.status === 'PRESENT' ? 'Recorded' : item.status === 'MISSING' ? '+ Add evidence' : 'Strengthen'}</button></article>)}</div></section>
      <aside className="card p-6"><div className="career-eyebrow">Your next move</div><h2 className="text-lg font-bold">{missing[0]?.skill ?? reinforce[0]?.skill ?? 'Put your skills to work'}</h2><p className="career-body mt-3">{missing.length ? `Start with ${missing[0].skill}. Learn the fundamentals, apply them in a small project, and record what you built.` : reinforce.length ? 'Turn beginner knowledge into practical evidence with a working project and a short explanation of your decisions.' : 'Your selected role requirements have recorded evidence. Try a job-specific analysis to uncover the next challenge.'}</p><ol className="career-steps"><li><b>Learn</b><span>Understand the concepts and explain them in your own words.</span></li><li><b>Build</b><span>Create a working example with a README and tests.</span></li><li><b>Record</b><span>Add a project link and describe your contribution.</span></li></ol><Link className="btn-primary" to={`/roadmap?role=${encodeURIComponent(role)}`}>Open learning roadmap →</Link></aside></div>
      <section className="card p-6"><div className="career-section-heading"><div><h2>Your skill evidence</h2><p>Resume mentions and self-reported skills are evidence sources, not verified proficiency.</p></div><span className="badge badge-mono">{skills.length} skills</span></div>{skills.length ? <div className="skill-requirements">{skills.map((skill) => <article className="skill-requirement" key={skill._id}><h3>{skill.displayName}</h3><div>{evidence.filter((item) => item.skillId === skill._id).map((item, index) => <p key={index}>{item.summary || item.source.replaceAll('_', ' ')}{item.proficiency ? ` · ${item.proficiency.toLowerCase()}` : ' · proficiency not assessed'}</p>)}</div></article>)}</div> : <div className="career-empty"><h3>No skills recorded yet</h3><p>Add skills you already know or analyze your resume to populate this view. The role requirements above help you decide where to begin.</p><button className="btn-secondary" onClick={() => setAdding(true)}>Record your first skill</button></div>}</section>
    </>}
    {adding && <div className="modal-backdrop"><div className="modal-card max-w-lg" role="dialog" aria-modal="true" aria-labelledby="skill-title"><div className="modal-header"><h2 id="skill-title">Record skill evidence</h2><button aria-label="Close" className="btn-ghost" disabled={saving} onClick={() => setAdding(false)}>✕</button></div><form className="p-6 flex flex-col gap-4" onSubmit={save}><label className="form-group">Skill name<input autoFocus required maxLength={100} className="form-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. React" /></label><label className="form-group">Your current level<select className="form-select" value={level} onChange={(event) => setLevel(event.target.value)}><option value="BEGINNER">Beginner · learning the basics</option><option value="INTERMEDIATE">Intermediate · building independently</option><option value="ADVANCED">Advanced · applying in complex projects</option></select></label><label className="form-group">What have you built or practiced?<textarea className="form-input" rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Describe your work and include a project link if available." /></label>{saveError && <p role="alert" className="career-notice">{saveError}</p>}<button disabled={saving || !name.trim()} className="btn-primary">{saving ? 'Saving…' : 'Save evidence'}</button></form></div></div>}
  </div>;
}
