import { useState } from 'react';

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  applyUrl: string;
}

const JOBS_DATA: JobListing[] = [
  {
    id: 'j1',
    title: 'SDE-1 (Backend & Payments)',
    company: 'Razorpay',
    location: 'Bangalore · Hybrid',
    salary: '₹18 - ₹26 LPA',
    matchScore: 94,
    matchedSkills: ['Node.js', 'Express', 'Redis', 'MongoDB', 'Docker'],
    missingSkills: ['Kafka'],
    applyUrl: 'https://razorpay.com/careers',
  },
  {
    id: 'j2',
    title: 'Junior Platform SDE',
    company: 'Postman',
    location: 'Remote · India',
    salary: '₹16 - ₹24 LPA',
    matchScore: 91,
    matchedSkills: ['TypeScript', 'Node.js', 'BullMQ', 'REST APIs'],
    missingSkills: ['Kubernetes'],
    applyUrl: 'https://postman.com/careers',
  },
  {
    id: 'j3',
    title: 'Full-Stack Engineer',
    company: 'Swiggy',
    location: 'Bangalore · Onsite',
    salary: '₹15 - ₹22 LPA',
    matchScore: 88,
    matchedSkills: ['React 19', 'TypeScript', 'Tailwind', 'TanStack'],
    missingSkills: ['Next.js SSR'],
    applyUrl: 'https://swiggy.com/careers',
  },
  {
    id: 'j4',
    title: 'AI Platform Systems SDE',
    company: 'Sarvam AI',
    location: 'Bangalore · Hybrid',
    salary: '₹22 - ₹34 LPA',
    matchScore: 84,
    matchedSkills: ['MongoDB Vector', 'TypeScript', 'Docker', 'RAG'],
    missingSkills: ['Python FastAPI'],
    applyUrl: 'https://sarvam.ai/careers',
  },
];

export function JobMatchesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);

  const filtered = JOBS_DATA.filter(
    (j) =>
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleApply(job: JobListing) {
    if (!appliedJobs.includes(job.id)) {
      setAppliedJobs([...appliedJobs, job.id]);
    }
    window.open(job.applyUrl, '_blank');
  }

  return (
    <div className="job-matches-page flex flex-col gap-6">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-success">4 Tier-1 Matches</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Verified Job Recommendations</h1>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="search"
            placeholder="Search roles or companies…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input text-xs py-2"
          />
        </div>
      </div>

      {/* ── Jobs Grid (Visual & Compact) ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((job) => {
          const isApplied = appliedJobs.includes(job.id);

          return (
            <div
              key={job.id}
              className="card p-5 flex flex-col justify-between gap-4 hover:border-[var(--border-strong)] transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center font-black text-sm">
                      {job.company[0]}
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                        {job.title}
                      </h2>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        <strong className="text-[var(--text-primary)]">{job.company}</strong> · {job.location}
                      </p>
                    </div>
                  </div>

                  {/* Visual Match Badge */}
                  <span className="badge badge-success font-mono font-bold text-xs">
                    {job.matchScore}% Match
                  </span>
                </div>

                <div className="my-2.5 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[var(--text-primary)]">
                    {job.salary}
                  </span>
                </div>

                {/* Skill Pills */}
                <div className="flex flex-wrap gap-1">
                  {job.matchedSkills.map((s) => (
                    <span key={s} className="badge badge-mono text-[9px]">
                      ✓ {s}
                    </span>
                  ))}
                  {job.missingSkills.map((s) => (
                    <span key={s} className="badge badge-warning text-[9px]">
                      ▲ {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  className="btn-ghost text-xs p-1"
                  onClick={() => setSelectedJob(job)}
                >
                  Inspect Rubric ↗
                </button>

                <button
                  type="button"
                  className={`btn-primary text-xs py-1.5 px-3.5 ${isApplied ? 'opacity-70' : ''}`}
                  onClick={() => handleApply(job)}
                >
                  {isApplied ? '✓ Applied' : 'Apply Direct ↗'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Match Rubric Modal ─────────────────────────────────── */}
      {selectedJob && (
        <div className="modal-backdrop" onClick={() => setSelectedJob(null)}>
          <div className="modal-card max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge badge-mono text-[9px] mb-1">{selectedJob.company}</span>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{selectedJob.title}</h3>
              </div>
              <button type="button" className="btn-ghost p-1" onClick={() => setSelectedJob(null)}>
                ✕
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-subtle)]">
                <span className="text-[var(--text-muted)] font-mono">Match Calculation</span>
                <span className="font-mono font-bold text-[var(--status-success)]">
                  {selectedJob.matchScore}% Verified Coverage
                </span>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Verified In Your Dossier
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedJob.matchedSkills.map((s) => (
                    <span key={s} className="badge badge-success text-[9px]">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Remaining Gaps to Close
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedJob.missingSkills.map((s) => (
                    <span key={s} className="badge badge-warning text-[9px]">
                      ▲ {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  className="btn-secondary text-xs py-1.5"
                  onClick={() => setSelectedJob(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-primary text-xs py-1.5"
                  onClick={() => handleApply(selectedJob)}
                >
                  Apply at {selectedJob.company} ↗
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
