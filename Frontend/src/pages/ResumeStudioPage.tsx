import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { updateProfileSchema } from '@placement-assistant/validation';

type WorkflowReport = {
  status?: string; resume_quality_score?: number;
  resume_analysis?: { summary?: string; extracted_skills?: string[]; strengths?: string[]; improvement_areas?: string[]; missing_skills?: string[]; roadmap?: Array<{ week: string; topic: string; description: string }> };
  skill_gap_analysis?: { overall_recommendation?: string }; warnings?: string[] | null;
  career_recommendations?: { top_career_paths?: Array<{ career_title: string; match_score: number; recommendation_reason: string }> };
};
type Resume = { id: string; processingStatus: string };
type StoredResume = { _id: string; originalFileName?: string; processingStatus?: string; workflowStatus?: string; workflowErrorCode?: string; workflowErrorMessage?: string; workflowReport?: { final_report?: WorkflowReport; workflow_status?: string; resume_feedback?: string } };
type Profile = { firstName?: string; college?: string; degree?: string; targetRoles?: string[] };

function workflowFailureMessage(code?: string): string {
  switch (code) {
    case 'AI_QUOTA_EXCEEDED':
      return 'The AI provider quota has been exhausted. Analysis is unavailable until the quota resets or the site owner updates the provider plan. Your uploaded resume is saved.';
    case 'AI_PROVIDER_AUTH_FAILED':
      return 'The AI provider credentials need attention from the site owner.';
    case 'AI_PROVIDER_UNAVAILABLE':
      return 'The AI provider is overloaded or temporarily unavailable. Your resume is saved; try again later.';
    case 'AI_SERVICE_UNAVAILABLE':
      return 'The AI analysis service is unavailable. Please try again in a moment.';
    case 'AI_SERVICE_TIMEOUT':
      return 'The AI analysis took too long. Please try again.';
    case 'AI_SERVICE_FAILED':
      return 'The AI analysis service could not complete this resume. Please try again shortly.';
    case 'WORKFLOW_QUEUE_UNAVAILABLE':
      return 'The analysis queue is unavailable. Please try again in a moment.';
    case 'WORKFLOW_WORKER_UNAVAILABLE':
      return 'The AI analysis worker is not running. Please start it, then try again.';
    default:
      return `The AI analysis failed${code ? ` (${code})` : ''}. Please try again later.`;
  }
}

export function ResumeStudioPage() {
  const activeRequest = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedResumeId, setUploadedResumeId] = useState<string | null>(null);
  const [savedFileName, setSavedFileName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<WorkflowReport | null>(null);
  const [profileReady, setProfileReady] = useState<boolean | null>(null);
  const [profileMessage, setProfileMessage] = useState('');
  const [resumesLoaded, setResumesLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    activeRequest.current = controller;
    api<{ profile: Profile }>('/profile', { signal: controller.signal }).then(({ profile }) => {
      const missing = [(!profile.firstName?.trim() || !updateProfileSchema.shape.firstName.safeParse(profile.firstName).success) && 'first name', (!profile.college?.trim() || !updateProfileSchema.shape.college.safeParse(profile.college).success) && 'college or university', (!profile.degree?.trim() || !updateProfileSchema.shape.degree.safeParse(profile.degree).success) && 'degree and major', (!profile.targetRoles?.[0] || !updateProfileSchema.shape.targetRoles.safeParse(profile.targetRoles).success) && 'primary target role'].filter(Boolean);
      setProfileReady(missing.length === 0);
      setProfileMessage(missing.length ? `Complete your profile first: ${missing.join(', ')}.` : '');
    }).catch((error: unknown) => { if (!controller.signal.aborted) { setProfileReady(false); setProfileMessage(error instanceof Error ? error.message : 'Your profile could not be loaded. Please refresh and try again.'); } });
    api<{ resumes: StoredResume[] }>('/resumes', { signal: controller.signal }).then(async ({ resumes }) => {
      const newest = resumes[0];
      if (newest?.processingStatus === 'READY') {
        setUploadedResumeId(newest._id);
        setSavedFileName(newest.originalFileName ?? 'Saved resume');
      }
      if (newest?.workflowStatus === 'FAILED') setMessage(newest.workflowErrorMessage || workflowFailureMessage(newest.workflowErrorCode));
      if (newest && ['QUEUED', 'PROCESSING'].includes(newest.workflowStatus ?? '')) {
        setBusy(true);
        try {
          const result = await waitForWorkflow(newest._id, controller.signal);
          setReport(result.final_report ?? { status: result.workflow_status });
          setMessage('Analysis complete. Your result has been saved.');
        } finally { if (!controller.signal.aborted) setBusy(false); }
        return;
      }
      const latest = resumes.find((resume) => resume.workflowReport);
      if (!latest?.workflowReport) return;
      setReport(latest.workflowReport.final_report ?? {
        status: latest.workflowReport.workflow_status,
        warnings: latest.workflowReport.resume_feedback ? [String(latest.workflowReport.resume_feedback)] : null,
      });
      if (newest?.workflowStatus !== 'FAILED') setMessage('Showing your latest saved resume analysis.');
    }).catch((error: unknown) => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'Saved resumes could not be loaded.'); })
      .finally(() => { if (!controller.signal.aborted) setResumesLoaded(true); });
    return () => { controller.abort(); activeRequest.current?.abort(); };
  }, []);

  async function waitForExtraction(id: string, signal: AbortSignal): Promise<void> {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const { resume } = await api<{ resume: { processingStatus: string } }>(`/resumes/${id}`, { signal });
      if (resume.processingStatus === 'READY') return;
      if (resume.processingStatus === 'FAILED') throw new Error('We could not extract text from this resume. Please upload a readable PDF or DOCX.');
      await new Promise((resolve) => window.setTimeout(resolve, 1000));
    }
    throw new Error('Resume extraction is still running. Please try the analysis again shortly.');
  }

  async function waitForWorkflow(id: string, signal: AbortSignal): Promise<{ final_report?: WorkflowReport; workflow_status?: string; resume_feedback?: string }> {
    for (let attempt = 0; attempt < 300; attempt += 1) {
      const { workflowStatus, workflowErrorCode, workflowErrorMessage, result } = await api<{ workflowStatus: string; workflowErrorCode?: string; workflowErrorMessage?: string; result?: { final_report?: WorkflowReport; workflow_status?: string; resume_feedback?: string } }>(`/ai/workflow/${id}`, { signal });
      if (workflowStatus === 'READY' && result) return result;
      if (workflowStatus === 'FAILED') throw new Error(workflowErrorMessage || workflowFailureMessage(workflowErrorCode));
      setMessage(workflowStatus === 'QUEUED' ? 'Your resume is queued for analysis…' : 'The AI agents are analyzing your resume…');
      await new Promise((resolve) => window.setTimeout(resolve, 1_000));
    }
    throw new Error('The AI analysis is still running. You can return to this page shortly.');
  }

  async function handleAnalyze() {
    if ((!file && !uploadedResumeId) || !profileReady || !resumesLoaded || busy) return;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setBusy(true);
    try {
      let resumeId = uploadedResumeId;
      if (!resumeId) {
        if (!file) return;
        setMessage('Uploading your resume…');
        const form = new FormData(); form.append('resume', file);
        const { resume } = await api<{ resume: Resume }>('/resumes', { method: 'POST', body: form, signal: controller.signal });
        resumeId = resume.id;
        setUploadedResumeId(resumeId);
      }
      setMessage('Extracting text from your resume…');
      await waitForExtraction(resumeId, controller.signal);
      setMessage('Running the multi-agent placement analysis…');
      await api<{ resumeId: string; workflowStatus: string }>('/ai/workflow', { method: 'POST', body: JSON.stringify({ resumeId }), signal: controller.signal });
      setMessage('Running the multi-agent placement analysis… this can take a few minutes.');
      const result = await waitForWorkflow(resumeId, controller.signal);
      setReport(result.final_report ?? { status: result.workflow_status, warnings: result.resume_feedback ? [result.resume_feedback] : null });
      setMessage('Analysis complete. Resume skills were added to your evidence profile when available.');
    } catch (error) { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'The analysis could not be completed. Please try again.'); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }

  return <div className="resume-studio-page flex flex-col gap-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]"><div><span className="badge badge-success">Multi-Agent Analysis</span><h1 className="text-2xl font-black tracking-tight mt-2">Resume Intelligence</h1><p className="text-sm text-[var(--text-muted)] mt-1">Upload a resume to receive grounded feedback, skill gaps, interview preparation, and a learning roadmap.</p></div></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section className="card p-6 flex flex-col gap-4 lg:col-span-1">{profileReady === false ? <div className="rounded-lg bg-[var(--status-warning-bg)] border border-[var(--status-warning-border)] p-4 text-xs flex flex-col gap-3"><p>{profileMessage}</p><Link className="btn-primary text-xs self-start" to="/profile">Complete profile</Link></div> : <><label className="upload-dropzone py-8 cursor-pointer"><input type="file" accept=".pdf,.docx" className="hidden" disabled={busy || profileReady !== true || !resumesLoaded} onChange={(event: ChangeEvent<HTMLInputElement>) => { setFile(event.target.files?.[0] ?? null); setUploadedResumeId(null); setSavedFileName(''); setMessage(''); }} /><div className="upload-icon-circle text-lg">{file ? '📄' : '☁️'}</div><div className="text-center"><p className="font-bold text-xs">{file?.name ?? (savedFileName || 'Choose a PDF or DOCX resume')}</p><p className="text-[10px] text-[var(--text-muted)] mt-1">Your selected target role will be used for the gap analysis.</p></div></label><button className="btn-primary w-full" disabled={(!file && !uploadedResumeId) || busy || profileReady !== true || !resumesLoaded} onClick={handleAnalyze}>{busy ? 'Analyzing…' : !resumesLoaded ? 'Loading saved resumes…' : 'Run AI Analysis'}</button></>}{message && <p className="text-xs text-[var(--text-secondary)]" role="status">{message}</p>}</section>
      <section className="card p-6 flex flex-col gap-5 lg:col-span-2">{!report ? <p className="text-sm text-[var(--text-muted)]">Your verified analysis will appear here after the workflow finishes.</p> : <><div className="flex items-center justify-between"><div><span className={`badge ${report.warnings?.length ? 'badge-warning' : 'badge-success'}`}>{report.status ?? 'COMPLETED'}</span><h2 className="text-lg font-bold mt-2">Placement readiness report</h2></div>{typeof report.resume_quality_score === 'number' && <div className="text-right"><span className="text-3xl font-black">{report.resume_quality_score}<span className="text-sm text-[var(--text-muted)]">/100</span></span><p className="text-[10px] text-[var(--text-muted)]">section completeness</p></div>}</div>{report.resume_analysis?.summary && <p className="text-sm text-[var(--text-secondary)]">{report.resume_analysis.summary}</p>}<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"><ResultList title="Strengths" items={report.resume_analysis?.strengths} /><ResultList title="Areas to improve" items={report.resume_analysis?.improvement_areas ?? report.resume_analysis?.missing_skills} /></div><ResultList title="Extracted skills" items={report.resume_analysis?.extracted_skills} tags />{report.resume_analysis?.roadmap?.length ? <div><h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Learning roadmap</h3><div className="space-y-2">{report.resume_analysis.roadmap.map((step, index) => <div className="p-3 rounded-lg bg-[var(--bg-subtle)] text-xs" key={`${step.week}-${index}`}><strong>{step.week}: {step.topic}</strong><p className="text-[var(--text-muted)] mt-1">{step.description}</p></div>)}</div></div> : null}{report.skill_gap_analysis?.overall_recommendation && <p className="text-xs p-3 rounded-lg bg-[var(--bg-subtle)]"><strong>Skill-gap recommendation: </strong>{report.skill_gap_analysis.overall_recommendation}</p>}{report.career_recommendations?.top_career_paths?.length ? <div><h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Recommended roles</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{report.career_recommendations.top_career_paths.slice(0, 2).map((path) => <div className="p-3 rounded-lg bg-[var(--bg-subtle)] text-xs" key={path.career_title}><strong>{path.career_title} · {path.match_score}% fit</strong><p className="text-[var(--text-muted)] mt-1">{path.recommendation_reason}</p></div>)}</div></div> : null}{report.warnings?.length ? <ResultList title="Workflow notes" items={report.warnings} /> : null}</>}</section>
    </div>
    {report && <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h2 className="font-bold text-sm">Continue your placement plan</h2><p className="text-xs text-[var(--text-muted)] mt-1">Review openings ranked by your evidence, then generate a roadmap from the gaps in a role you choose.</p></div><div className="flex gap-2 shrink-0"><Link className="btn-secondary text-xs" to="/jobs">See matched jobs</Link><Link className="btn-primary text-xs" to="/roadmap">Open my roadmap</Link></div></div>}
  </div>;
}

function ResultList({ title, items, tags = false }: { title: string; items?: string[]; tags?: boolean }) {
  if (!items?.length) return null;
  return <div><h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">{title}</h3>{tags ? <div className="flex flex-wrap gap-1">{items.map((item) => <span className="badge badge-mono" key={item}>{item}</span>)}</div> : <ul className="space-y-1 text-[var(--text-secondary)]">{items.map((item) => <li key={item}>• {item}</li>)}</ul>}</div>;
}
