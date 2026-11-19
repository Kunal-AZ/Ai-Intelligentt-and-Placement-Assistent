import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../Components/Header';
import { Footer } from '../Components/Footer';
import {
  ScrollProgressBar,
  AmbientHeroParticles,
  AnimatedCounter,
  CircularGauge,
  LaserScanline,
  AudioWaveform,
  InteractiveSpotlightCard,
  useScrollReveal,
} from '../Components/animations';
import '../styles/landing.css';

interface RoleProfile {
  id: string;
  name: string;
  matchScore: number;
  salaryRange: string;
  marketDemand: string;
  verifiedSkills: string[];
  missingGaps: string[];
  aiAdvice: string;
}

const ROLE_PROFILES: RoleProfile[] = [
  {
    id: 'backend',
    name: 'Backend Systems Engineer',
    matchScore: 92,
    salaryRange: '₹14 - ₹28 LPA',
    marketDemand: '🔥 High (+34% YoY)',
    verifiedSkills: ['Node.js & Express', 'MongoDB Vector Search', 'Redis Caching', 'BullMQ Queues', 'REST API Design'],
    missingGaps: ['Distributed Locking & Mutex', 'Kafka Message Streaming', 'Kubernetes Helm'],
    aiAdvice: 'Your BullMQ and Redis queue architectures are production-ready. Prioritize a Kafka streaming pipeline to qualify for Tier-1 backend roles with zero hesitation.',
  },
  {
    id: 'fullstack',
    name: 'Full-Stack Web Architect',
    matchScore: 88,
    salaryRange: '₹12 - ₹24 LPA',
    marketDemand: '⚡ Very High (+41% YoY)',
    verifiedSkills: ['React 19 & TypeScript', 'Tailwind & Modern CSS', 'Express APIs', 'Zod Schema Validation'],
    missingGaps: ['SSR Next.js App Router', 'Playwright E2E Testing', 'GraphQL Subscriptions'],
    aiAdvice: 'Exceptional client-side performance and component modeling. Adding end-to-end integration tests will elevate your placement readiness score past 95%.',
  },
  {
    id: 'aiml',
    name: 'AI / RAG Engineer',
    matchScore: 84,
    salaryRange: '₹16 - ₹36 LPA',
    marketDemand: '🚀 Skyrocketing (+82% YoY)',
    verifiedSkills: ['Python & FastAPI', 'Vector Embeddings & RAG', 'Gemini & OpenAI APIs', 'LangChain Workflows'],
    missingGaps: ['Fine-Tuning LoRA Models', 'vLLM Inference Serving', 'Evaluation Benchmarks'],
    aiAdvice: 'Your semantic RAG retrieval accuracy is benchmarked at 89%. Focus on structured evaluation matrices to stand out in top generative AI hiring pipelines.',
  },
  {
    id: 'devops',
    name: 'Cloud & DevOps Engineer',
    matchScore: 79,
    salaryRange: '₹14 - ₹30 LPA',
    marketDemand: '🛡️ Core Infrastructure',
    verifiedSkills: ['Docker Containers', 'Linux / Bash Scripting', 'GitHub Actions CI/CD', 'Nginx Reverse Proxy'],
    missingGaps: ['Terraform Infrastructure as Code', 'Prometheus & Grafana Monitoring', 'AWS VPC Peering'],
    aiAdvice: 'Strong container fundamentals. Automating cloud resource provisioning with Terraform will bridge your final gap into Tier-1 cloud engineering.',
  },
];

const FAQS = [
  {
    q: 'How does HiPlacement verify skills differently than standard ATS checkers?',
    a: 'Traditional ATS checkers only look for superficial keyword frequency. HiPlacement parses your code repositories, verifies test assertions, validates background queue implementations, and tests your reasoning through simulated AI mock interview sessions.',
  },
  {
    q: 'Is my uploaded resume and code kept private?',
    a: 'Yes. Files are validated, hashed, and stored in private object storage. Downloads require your authenticated account, and your data is never exposed to recruiters without your explicit action.',
  },
  {
    q: 'Is HiPlacement completely free for engineering students?',
    a: 'Yes. The full core suite — including the ATS Diagnostic Scanner, Evidence Ledger, 30-Day Learning Roadmap, and AI Mock Interviews — is 100% free for students preparing for campus and off-campus placement drives.',
  },
  {
    q: 'How are the match percentages for job openings calculated?',
    a: 'We transparently map required vs preferred competencies against your verified profile. If a role requires 5 critical skills and you have 4 verified, you will see exactly which 1 skill is missing and how to bridge it in your roadmap.',
  },
];

export function LandingPage() {
  const containerRef = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });
  const [activeSimulatorRole, setActiveSimulatorRole] = useState<RoleProfile>(ROLE_PROFILES[0]);
  const [heroTab, setHeroTab] = useState<'ats' | 'ledger' | 'interview'>('ats');

  // Interactive Calculator state
  const [calcDsa, setCalcDsa] = useState(160);
  const [calcProjects, setCalcProjects] = useState(3);
  const [calcInterviews, setCalcInterviews] = useState(4);
  const [calcDeploys, setCalcDeploys] = useState(2);

  // Dynamic readiness computation
  const calcScore = Math.min(
    99,
    Math.round(
      (calcDsa / 300) * 35 +
      (calcProjects / 4) * 30 +
      (calcInterviews / 8) * 20 +
      (calcDeploys / 3) * 15
    )
  );

  const calcGrade =
    calcScore >= 85 ? 'Tier-1 Elite (₹18 - ₹32 LPA)' :
    calcScore >= 70 ? 'Tier-1 Qualified (₹12 - ₹20 LPA)' :
    'Foundational (₹6 - ₹12 LPA)';

  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div ref={containerRef} className="landing-wrapper">
      {/* Sleek top illuminated scroll progress bar */}
      <ScrollProgressBar />

      <div className="landing-grid-bg" />

      {/* Global Header */}
      <Header />

      {/* ── 1. Hero Section ──────────────────────────────────────── */}
      <section className="landing-section pt-16 pb-12 flex flex-col items-center text-center relative">
        {/* Subtle Ambient Particle Field */}
        <AmbientHeroParticles />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] mb-6 z-10">
          <span className="w-2 h-2 rounded-full bg-[var(--status-success)] animate-pulse" />
          <span>AI Placement Intelligence 2.0</span>
          <span>•</span>
          <span>Evidence-Backed Career Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl text-[var(--text-primary)] leading-[1.08] z-10">
          Crack Top Tech Placements with Verified Proof.
        </h1>

        <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mt-4 leading-relaxed z-10">
          Code-verified resumes, high-impact skill gap detection, and real-time AI mock interviews.
        </p>

        {/* Dual Call-to-Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 z-10">
          <Link to="/dashboard" className="btn-primary py-3 px-6 text-sm">
            <span>Launch Career Workspace Free</span>
            <span aria-hidden="true">↗</span>
          </Link>
          <a href="#simulator" className="btn-secondary py-3 px-6 text-sm">
            <span>Explore Role Matcher</span>
            <span aria-hidden="true">↓</span>
          </a>
        </div>

        {/* Trust Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 mt-12 border-t border-[var(--border-subtle)] w-full max-w-4xl mx-auto text-left z-10">
          <div>
            <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
              <AnimatedCounter end={3400} suffix="+" />
            </p>
            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Placed Students</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
              <AnimatedCounter end={24.8} prefix="₹" suffix=" LPA" decimals={1} />
            </p>
            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Average Tier-1 CTC</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
              <AnimatedCounter end={94} suffix="%" />
            </p>
            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">ATS Pass Rate</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
              <AnimatedCounter end={4.9} suffix=" / 5.0" decimals={1} />
            </p>
            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Student Satisfaction</p>
          </div>
        </div>

        {/* ── Hero Live Terminal Showcase ────────────────────────── */}
        <div className="w-full max-w-5xl mx-auto mt-12 text-left z-10">
          <div className="hero-terminal relative">
            {/* Terminal bar */}
            <div className="hero-terminal-header">
              <div className="terminal-dots">
                <span className="terminal-dot" />
                <span className="terminal-dot" />
                <span className="terminal-dot" />
              </div>

              {/* Tab Pills */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setHeroTab('ats')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    heroTab === 'ats'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  ATS Diagnostic (88/100)
                </button>
                <button
                  type="button"
                  onClick={() => setHeroTab('ledger')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    heroTab === 'ledger'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  Evidence Proof Ledger
                </button>
                <button
                  type="button"
                  onClick={() => setHeroTab('interview')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    heroTab === 'interview'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  Mock Interview Drill (94%)
                </button>
              </div>

              <span className="badge badge-mono text-[9px] hidden sm:inline-flex">Live Telemetry</span>
            </div>

            {/* Terminal Tab Body */}
            <div className="terminal-body relative">
              {heroTab === 'ats' && (
                <div className="flex flex-col gap-5 animate-fadeIn relative">
                  <LaserScanline label="GEMINI RAG ATS PARSER" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="badge badge-success mb-1">Tier-1 Candidate Ready</span>
                      <h3 className="text-xl font-bold text-[var(--text-primary)]">
                        Full ATS Parsability &amp; Competency Audit
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Parsed using Gemini RAG Extraction Rubric
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-4xl font-black text-[var(--text-primary)]">88</span>
                      <span className="text-sm font-bold text-[var(--text-muted)]"> / 100</span>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                        Top 12% Applicant Pool
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-[var(--border-subtle)]">
                    <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                      <p className="text-[11px] text-[var(--text-muted)]">Formatting</p>
                      <p className="text-base font-bold text-[var(--text-primary)]">95%</p>
                      <span className="text-[10px] text-[var(--status-success)]">Single-column parse</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                      <p className="text-[11px] text-[var(--text-muted)]">Impact Verbs</p>
                      <p className="text-base font-bold text-[var(--text-primary)]">84%</p>
                      <span className="text-[10px] text-[var(--status-success)]">Quantified metrics</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                      <p className="text-[11px] text-[var(--text-muted)]">Keywords</p>
                      <p className="text-base font-bold text-[var(--text-primary)]">92%</p>
                      <span className="text-[10px] text-[var(--status-success)]">SDE-1 Alignment</span>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                      <p className="text-[11px] text-[var(--text-muted)]">Depth &amp; Systems</p>
                      <p className="text-base font-bold text-[var(--text-primary)]">81%</p>
                      <span className="text-[10px] text-[var(--status-warning)]">2 Gaps to bridge</span>
                    </div>
                  </div>
                </div>
              )}

              {heroTab === 'ledger' && (
                <div className="flex flex-col gap-3 animate-fadeIn text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                    <span className="font-bold text-[var(--text-primary)]">Verified Evidence Trail</span>
                    <span className="badge badge-mono">6 of 6 Verified</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-between">
                    <div>
                      <strong className="text-[var(--text-primary)]">BullMQ Asynchronous Job Queues</strong>
                      <p className="text-[var(--text-muted)]">Verified via GitHub repo: hiplacement-backend-api (Tests passing)</p>
                    </div>
                    <span className="badge badge-success">Production Verified</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-between">
                    <div>
                      <strong className="text-[var(--text-primary)]">MongoDB Atlas Vector Search (1536-dim)</strong>
                      <p className="text-[var(--text-muted)]">Sub-100ms cosine similarity indexing verified</p>
                    </div>
                    <span className="badge badge-success">Verified</span>
                  </div>
                </div>
              )}

              {heroTab === 'interview' && (
                <div className="flex flex-col gap-3 animate-fadeIn text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                    <span className="font-bold text-[var(--text-primary)]">
                      System Design Drill: Redis Cache Stampede Mitigation
                    </span>
                    <AudioWaveform isActive={true} />
                  </div>
                  <p className="text-[var(--text-secondary)] italic">
                    "Candidate successfully defended the XFetch probabilistic early expiration algorithm and contrasted it with distributed mutex locking on Redis."
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
                    <span className="text-[var(--status-success)]">✓ Technical Accuracy: 94%</span>
                    <span>•</span>
                    <span className="text-[var(--status-success)]">✓ Communication: 88%</span>
                    <span>•</span>
                    <span className="text-[var(--status-success)]">✓ Reasoning: 92%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Interactive Role Simulator Section (#simulator) ──── */}
      <section id="simulator" className="landing-section reveal-on-scroll">
        <div className="landing-section-head">
          <span className="badge badge-mono mb-2">Role Benchmarks</span>
          <h2>Target Role Calibration</h2>
          <p>
            Inspect required competencies, current packages, and high-impact skill gaps.
          </p>
        </div>

        {/* Role Selector Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {ROLE_PROFILES.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setActiveSimulatorRole(role)}
              className={`simulator-tab-pill ${
                activeSimulatorRole.id === role.id ? 'is-active' : ''
              }`}
            >
              {role.name}
            </button>
          ))}
        </div>

        {/* Active Role Card */}
        <InteractiveSpotlightCard className="card-hero w-full max-w-4xl mx-auto flex flex-col gap-6 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
            <div>
              <span className="badge badge-mono mb-1">{activeSimulatorRole.marketDemand}</span>
              <h3 className="text-2xl font-black text-[var(--text-primary)]">
                {activeSimulatorRole.name}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Expected Compensation: <strong className="text-[var(--text-primary)]">{activeSimulatorRole.salaryRange}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-4xl font-black text-[var(--text-primary)]">
                {activeSimulatorRole.matchScore}%
              </span>
              <p className="text-[10px] font-bold text-[var(--status-success)] uppercase tracking-wider">
                Readiness Match
              </p>
            </div>
          </div>

          {/* Dual Gaps & Verified Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <h4 className="font-bold text-[var(--status-success)] uppercase tracking-wider mb-2.5">
                Verified Skills Required ({activeSimulatorRole.verifiedSkills.length})
              </h4>
              <ul className="space-y-1.5 text-[var(--text-secondary)]">
                {activeSimulatorRole.verifiedSkills.map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className="text-[var(--status-success)] font-bold">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[var(--status-warning)] uppercase tracking-wider mb-2.5">
                Remaining High-Impact Gaps ({activeSimulatorRole.missingGaps.length})
              </h4>
              <ul className="space-y-1.5 text-[var(--text-secondary)]">
                {activeSimulatorRole.missingGaps.map((g) => (
                  <li key={g} className="flex items-center gap-2">
                    <span className="text-[var(--status-warning)] font-bold">▲</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Strategy Advice */}
          <div className="p-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)]">AI Recruiter Strategic Advice: </strong>
            {activeSimulatorRole.aiAdvice}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-xs text-[var(--text-muted)]">
              Calibrated against 1,200+ active SDE openings
            </span>
            <Link to="/skills" className="btn-primary text-xs py-2 px-4">
              Calibrate Your Profile ↗
            </Link>
          </div>
        </InteractiveSpotlightCard>
      </section>

      {/* ── 3. Interactive Readiness Calculator (#calculator) ───── */}
      <section id="calculator" className="landing-section reveal-on-scroll">
        <div className="landing-section-head">
          <span className="badge badge-mono mb-2">Readiness Index</span>
          <h2>Placement Readiness Calculator</h2>
          <p>
            Adjust your metrics to calculate your placement qualification score and package bracket.
          </p>
        </div>

        <div className="card w-full max-w-4xl mx-auto p-6 md:p-10 flex flex-col md:flex-row items-center gap-10">
          {/* Sliders Left (7 cols) */}
          <div className="w-full md:w-3/5 flex flex-col gap-5">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>DSA &amp; LeetCode Solved</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">{calcDsa}</span>
              </div>
              <input
                type="range"
                min="0"
                max="450"
                value={calcDsa}
                onChange={(e) => setCalcDsa(Number(e.target.value))}
                className="w-full accent-[var(--text-primary)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Fullstack / Backend Projects Built</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">{calcProjects}</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                value={calcProjects}
                onChange={(e) => setCalcProjects(Number(e.target.value))}
                className="w-full accent-[var(--text-primary)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>System Design &amp; Mock Drills</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">{calcInterviews}</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                value={calcInterviews}
                onChange={(e) => setCalcInterviews(Number(e.target.value))}
                className="w-full accent-[var(--text-primary)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Verified Production Deployments</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">{calcDeploys}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={calcDeploys}
                onChange={(e) => setCalcDeploys(Number(e.target.value))}
                className="w-full accent-[var(--text-primary)]"
              />
            </div>
          </div>

          {/* Outcome Gauge Right (5 cols) */}
          <div className="w-full md:w-2/5 p-6 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-strong)] flex flex-col items-center text-center gap-3">
            <span className="badge badge-mono text-[10px]">Projected Outcome</span>
            <CircularGauge score={calcScore} size={120} label="READINESS" />
            <p className="text-xs font-bold text-[var(--status-success)]">
              {calcGrade}
            </p>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
              Based on historical placement data across 3,400+ engineering graduates.
            </p>
            <Link to="/dashboard" className="btn-primary w-full text-xs mt-2">
              Start Diagnostic Audit ↗
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. Why HiPlacement Comparison (#comparison) ─────────────── */}
      <section id="comparison" className="landing-section reveal-on-scroll">
        <div className="landing-section-head">
          <span className="badge badge-mono mb-2">Architectural Superiority</span>
          <h2>Why Generic SaaS Portals Fail Candidates</h2>
          <p>
            Traditional placement tools sell automated buzzwords. HiPlacement is built on verified code,
            reproducible rubrics, and high-precision evaluation.
          </p>
        </div>

        <div className="comparison-grid w-full max-w-4xl mx-auto">
          {/* Traditional Card */}
          <div className="comparison-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-[var(--text-muted)]">
                Generic Job Portals &amp; Templates
              </h3>
              <span className="badge badge-danger">Broken Model</span>
            </div>
            <ul className="space-y-3 text-xs text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--status-danger)]">✕</span>
                <span>Superficial keyword stuffing that gets filtered by modern ATS parsers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--status-danger)]">✕</span>
                <span>Silent automated rejections with zero actionable feedback.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--status-danger)]">✕</span>
                <span>Static, unguided practice without conversational rubric grading.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--status-danger)]">✕</span>
                <span>Irrelevant mass job recommendations based on unverified resume claims.</span>
              </li>
            </ul>
          </div>

          {/* HiPlacement Card */}
          <div className="comparison-card highlight">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-[var(--text-primary)]">
                HiPlacement Evidence Engine
              </h3>
              <span className="badge badge-success">Verified</span>
            </div>
            <ul className="space-y-3 text-xs text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--status-success)]">✓</span>
                <span>Code-backed evidence linking projects directly to candidate competencies.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--status-success)]">✓</span>
                <span>Transparent role requirement catalogs showing exact missing gaps.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--status-success)]">✓</span>
                <span>Interactive AI Mock Interview Studio with technical accuracy scoring.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--status-success)]">✓</span>
                <span>Adaptive 30-day learning roadmaps that re-calibrate with every drill.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 5. Student Placement Stories (#stories) ─────────────── */}
      <section id="stories" className="landing-section reveal-on-scroll">
        <div className="landing-section-head">
          <span className="badge badge-mono mb-2">Verified Placements</span>
          <h2>From Critical Gaps to Tier-1 Offers</h2>
          <p>
            Real engineering students who used HiPlacement to audit their resumes and pass technical interviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
          <div className="card flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[var(--text-primary)]">Yash Gidde</span>
              <span className="badge badge-mono">₹40 LPA · Razorpay</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
              "The Cache Stampede interview drill was almost identical to Round 2 at Razorpay. Defending the XFetch algorithm got me the offer on the spot."
            </p>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              B.Tech CSE '27 · Data Analyst
            </span>
          </div>

          <div className="card flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[var(--text-primary)]">Samarth Rampure</span>
              <span className="badge badge-mono">₹22 LPA · Sugar Factory</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
              "The ATS diagnostic pointed out that my third project had no quantified latency metrics. Fixing that took my resume score from 71 to 89."
            </p>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              B.Tech '27 · Full-Stack Track
            </span>
          </div>

          <div className="card flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[var(--text-primary)]">Parth Mukkawar</span>
              <span className="badge badge-mono">₹28 LPA · Swiggy</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic">
              "HiPlacement showed me that I was missing message queue evidence. I spent a weekend building the BullMQ task queue and got 3 immediate recruiter replies."
            </p>
            <span className="text-[11px] text-[var(--text-muted)] font-mono">
              Vishwakarma University '27 · Systems SDE
            </span>
          </div>
        </div>
      </section>

      {/* ── 6. FAQ Accordion Section (#faq) ────────────────────── */}
      <section id="faq" className="landing-section reveal-on-scroll">
        <div className="landing-section-head">
          <span className="badge badge-mono mb-2">Frequently Answered</span>
          <h2>Everything You Need to Know</h2>
        </div>

        <div className="w-full max-w-3xl mx-auto space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="faq-item">
                <button
                  type="button"
                  className="faq-trigger"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <span>{faq.q}</span>
                  <span className="font-mono text-xs">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && <div className="faq-content">{faq.a}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 7. Mega Modern Monochrome CTA Banner ───────────────── */}
      <section className="landing-section reveal-on-scroll">
        <InteractiveSpotlightCard className="mega-cta-card w-full max-w-4xl mx-auto flex flex-col items-center gap-5">
          <span className="badge badge-mono">Ready to Begin?</span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)] max-w-2xl">
            Turn your preparation hours into placement offers.
          </h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
            No credit card required. Free for engineering students. Audit your first resume in 60 seconds
            and uncover your verified placement readiness score.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <Link to="/dashboard" className="btn-primary py-3 px-6 text-sm">
              <span>Launch Workspace Free</span>
              <span aria-hidden="true">↗</span>
            </Link>
            <Link to="/roadmap" className="btn-secondary py-3 px-6 text-sm">
              <span>Explore Learning Roadmap</span>
            </Link>
          </div>
        </InteractiveSpotlightCard>
      </section>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
