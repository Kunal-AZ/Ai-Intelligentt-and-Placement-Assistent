import { Link } from 'react-router-dom';

/* ── Modern Dashboard Visual SVG ──────────────────── */
function ModernDashboardVisual() {
  return (
    <svg
      viewBox="0 0 320 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: '100%', maxWidth: 300 }}
    >
      {/* Background Soft Glow */}
      <circle cx="200" cy="120" r="110" fill="url(#hero-glow)" fillOpacity="0.4" className="animate-pulse-slow" />

      {/* Main Glass Card */}
      <rect
        x="60"
        y="40"
        width="220"
        height="145"
        rx="14"
        fill="rgba(255, 255, 255, 0.12)"
        stroke="rgba(255, 255, 255, 0.25)"
        strokeWidth="1.5"
      />

      {/* Inner Profile Chip */}
      <rect x="80" y="58" width="38" height="38" rx="8" fill="#6366f1" />
      <text x="94" y="82" fontSize="16" fill="#ffffff" fontWeight="bold">✦</text>

      {/* Card Header lines */}
      <rect x="130" y="64" width="70" height="7" rx="3.5" fill="rgba(255, 255, 255, 0.85)" />
      <rect x="130" y="78" width="110" height="6" rx="3" fill="rgba(255, 255, 255, 0.45)" />

      {/* Progress Bars */}
      <rect x="80" y="114" width="180" height="6" rx="3" fill="rgba(255, 255, 255, 0.15)" />
      <rect x="80" y="114" width="135" height="6" rx="3" fill="#34d399" />

      <rect x="80" y="130" width="180" height="6" rx="3" fill="rgba(255, 255, 255, 0.15)" />
      <rect x="80" y="130" width="95" height="6" rx="3" fill="#818cf8" />

      <rect x="80" y="146" width="180" height="6" rx="3" fill="rgba(255, 255, 255, 0.15)" />
      <rect x="80" y="146" width="155" height="6" rx="3" fill="#a78bfa" />

      {/* Floating Badge (Top Left) */}
      <g transform="translate(25, 25)" className="animate-float-slow">
        <rect
          width="100"
          height="32"
          rx="8"
          fill="#10b981"
          box-shadow="0 4px 12px rgba(16, 185, 129, 0.3)"
        />
        <text x="14" y="20" fill="#ffffff" fontSize="10" fontWeight="700" fontFamily="sans-serif">
          Ready to verify ✓
        </text>
      </g>

      {/* Floating Badge (Bottom Right) */}
      <g transform="translate(190, 160)" className="animate-float-reverse">
        <rect
          width="110"
          height="36"
          rx="10"
          fill="#ffffff"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        <text x="14" y="16" fill="#64748b" fontSize="8" fontWeight="600" fontFamily="sans-serif">
          AI INTERVIEW
        </text>
        <text x="14" y="28" fill="#4f46e5" fontSize="10" fontWeight="700" fontFamily="sans-serif">
          94% Accuracy
        </text>
      </g>

      <defs>
        <radialGradient id="hero-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(200 120) rotate(90) scale(110)">
          <stop stopColor="#a855f7" />
          <stop offset="1" stopColor="#4f46e5" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ── Quick stat items with rich icons & gradients ── */
const stats = [
  { value: '0', label: 'Skills Recorded', trend: 'Add 1st skill', icon: '🎯', gradient: 'from-indigo-500/15 to-violet-500/15 text-indigo-600', badge: 'Tier 1 Gaps' },
  { value: '—', label: 'Resume ATS Score', trend: 'Upload resume', icon: '📄', gradient: 'from-emerald-500/15 to-teal-500/15 text-emerald-600', badge: 'Audit Ready' },
  { value: '0', label: 'Mock Interviews', trend: 'Start practising', icon: '🎤', gradient: 'from-amber-500/15 to-orange-500/15 text-amber-600', badge: 'Gemini 2.5' },
  { value: '12', label: 'Target Job Matches', trend: 'Available to match', icon: '💼', gradient: 'from-cyan-500/15 to-blue-500/15 text-cyan-600', badge: '450+ Active JDs' },
];

/* ── Next-step action cards ─────────────────────────── */
const actions = [
  {
    title: 'Upload your resume',
    detail: 'Add a PDF or DOCX to trigger real-time AI impact verb extraction and ATS parsing.',
    path: '/resume',
    icon: '📄',
    step: '01',
    highlight: '60s Audit',
  },
  {
    title: 'Record your verified skills',
    detail: 'Cross-reference repository code & project commits against industry rubrics.',
    path: '/skills',
    icon: '🎯',
    step: '02',
    highlight: 'Evidence Engine',
  },
  {
    title: 'Calibrate target tech track',
    detail: 'Select Backend, Fullstack, AI/ML or DevOps to unlock tailor-made interview drills.',
    path: '/profile',
    icon: '🗺️',
    step: '03',
    highlight: 'Personalized',
  },
];

export function DashboardPage() {
  return (
    <section className="page-grid" aria-label="Dashboard">
      {/* ── Hero Card ─────────────────────────────────── */}
      <article className="hero-card relative overflow-hidden group transition-all duration-300 hover:shadow-2xl">
        {/* Animated background image overlay with hero-network */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden" aria-hidden="true">
          <img
            src="/hero-network.jpg"
            alt=""
            className="w-full h-full object-cover animate-bg-pan scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-indigo-950/80 to-transparent" />
        </div>

        <div className="hero-copy relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-indigo-200 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Career Workspace 2.0</span>
          </div>
          <h2>
            Make your next<br />
            <em className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-200 to-cyan-300">move count.</em>
          </h2>
          <p>
            Build your evidence proof, find high-yield gaps, and turn every preparation hour
            into verified placement opportunities.
          </p>
          <div className="flex items-center gap-3">
            <Link className="btn-primary link-button transition-transform duration-200 hover:scale-105 shadow-lg shadow-indigo-500/25" to="/resume">
              Start with your resume <span aria-hidden="true">↗</span>
            </Link>
            <Link className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/15 backdrop-blur-md transition-all duration-200" to="/chat">
              Ask AI Coach ✦
            </Link>
          </div>
        </div>

        <div className="dashboard-visual relative z-10 animate-float-slow hidden lg:block" aria-label="Career progress illustration">
          <ModernDashboardVisual />
        </div>
      </article>

      {/* ── Placement Readiness Card ───────────────────── */}
      <aside className="status-card relative overflow-hidden" aria-label="Placement readiness">
        <div className="flex items-center justify-between mb-2">
          <p className="eyebrow" style={{ margin: 0 }}>Placement Readiness</p>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Stage 0: Unverified
          </span>
        </div>

        <div className="my-3 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold text-slate-900 tracking-tight">—</span>
          <span className="text-xs font-semibold text-slate-400">/ 100 ATS Score</span>
        </div>

        <div className="readiness-bar-wrap" role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={100}>
          <div className="readiness-bar" style={{ width: '8%' }} />
        </div>

        <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span>Resume PDF / DOCX</span>
            </span>
            <span className="font-semibold text-indigo-600">Pending</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span>Skill Evidence Radar</span>
            </span>
            <span className="font-semibold text-slate-400">0 of 5</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span>Mock Interview Drill</span>
            </span>
            <span className="font-semibold text-slate-400">0 done</span>
          </div>
        </div>

        <Link to="/resume" className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-between pt-2 border-t border-slate-100 group">
          <span>Run instant diagnostic scan</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </aside>

      {/* ── Quick Stats ───────────────────────────────── */}
      <div className="stats-strip" role="list" aria-label="Quick statistics">
        {stats.map(({ value, label, trend, icon, gradient, badge }) => (
          <div className="stat-card group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg cursor-default border border-slate-200/80 hover:border-indigo-200" role="listitem" key={label}>
            <div className="flex items-center justify-between mb-2">
              <p className="stat-label text-slate-500 font-bold uppercase tracking-wider text-[11px]">{label}</p>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                {icon}
              </div>
            </div>
            <p className="stat-value text-3xl font-extrabold text-slate-900 tracking-tight my-1">{value}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="stat-trend text-xs font-semibold text-indigo-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                {trend}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                {badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section Heading ───────────────────────────── */}
      <div className="section-heading flex items-center justify-between">
        <div>
          <p className="eyebrow">Onboarding Steps</p>
          <h2 className="text-xl font-extrabold text-slate-900">Set up your career workspace</h2>
        </div>
        <Link to="/profile" className="btn-secondary transition-all duration-200 hover:scale-105 shadow-sm" style={{ fontSize: '0.88rem' }}>
          Complete Profile →
        </Link>
      </div>

      {/* ── Action Grid ───────────────────────────────── */}
      <div className="action-grid" role="list" aria-label="Getting started steps">
        {actions.map(({ title, detail, path, icon, step, highlight }) => (
          <Link className="action-card group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-indigo-300 relative overflow-hidden" to={path} key={path} role="listitem">
            <div className="flex items-center justify-between mb-3">
              <div className="card-icon w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300" aria-hidden="true">{icon}</div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  {highlight}
                </span>
                <span className="step-number text-xs font-extrabold text-slate-400">Step {step}</span>
              </div>
            </div>
            <h3 className="group-hover:text-indigo-600 transition-colors duration-200 text-base font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">{detail}</p>
            <div className="flex items-center justify-end text-indigo-600 font-bold text-xs group-hover:translate-x-1 transition-transform duration-200">
              <span>Get Started</span>
              <span className="ml-1" aria-hidden="true">→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
