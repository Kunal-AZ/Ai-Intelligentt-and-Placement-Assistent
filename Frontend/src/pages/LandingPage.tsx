import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../Components/Header';
import { Footer } from '../Components/Footer';
import {
  ScrollProgressBar,
  useScrollReveal,
  AnimatedCounter,
  InteractiveSpotlightCard,
  CircularGauge,
  AudioWaveform,
  LaserScanline,
  AmbientHeroParticles,
} from '../Components/animations';
import '../styles/landing.css';

/* ── Role Simulator Data ─────────────────────────────────────── */
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
    missingGaps: ['Distributed Transactions', 'Kafka Message Streaming', 'Kubernetes Helm'],
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
    name: 'DevOps & Cloud Engineer',
    matchScore: 79,
    salaryRange: '₹13 - ₹26 LPA',
    marketDemand: '🛡️ Steady Growth (+28% YoY)',
    verifiedSkills: ['Docker Containerization', 'GitHub Actions CI/CD', 'Linux Administration', 'Nginx Reverse Proxy'],
    missingGaps: ['Terraform IaC', 'AWS ECS / EKS', 'Prometheus & Grafana'],
    aiAdvice: 'Containerization is crisp. Setting up multi-environment Terraform infrastructure will bridge your remaining 21% gap for cloud-first teams.',
  },
];

/* ── FAQ Data ───────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'How is Pathway different from traditional job boards or LeetCode?',
    a: 'Traditional platforms test isolated algorithmic memorization or let you submit blind PDFs into black-hole applicant tracking systems. Pathway is an Evidence Engine: we analyze your real code repositories, quantify verified project metrics, simulate multi-dimensional AI mock interviews, and show recruiters transparent proof of what you can actually build.',
  },
  {
    q: 'Does Pathway share my personal documents or resume publicly?',
    a: 'Never. All uploaded resumes, transcripts, and mock interview recordings are isolated within your private encrypted workspace. Only anonymized evidence scores are referenced during recommendation passes, and you retain 100% data export and deletion rights.',
  },
  {
    q: 'How does the AI Career Coach verify which skills I actually possess?',
    a: 'Instead of accepting self-rated sliders ("I am 90% in React"), Pathway verifies skills through concrete evidence artifacts: git commits, architectural code patterns, unit test coverage, and interactive mock interview transcripts evaluated against standardized industry rubrics.',
  },
  {
    q: 'Can college students with zero professional experience use Pathway?',
    a: 'Yes, that is exactly who Pathway was designed for! It guides 2nd, 3rd, and 4th-year engineering students from zero verified evidence to cracking top-tier product company campus drives and off-campus opportunities in 30 to 60 days.',
  },
  {
    q: 'What role does AI play in the mock interview studio?',
    a: 'Pathway provides a real-time conversational agent that evaluates your technical accuracy, edge-case reasoning, code structure, and communication clarity with an instant rubric report and tailored improvement drills.',
  },
];

/* ── Testimonials Data ──────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: 'Aarav Mehta',
    college: 'BITS Pilani',
    role: 'SDE-1 @ Razorpay',
    package: '24 LPA',
    avatar: '👨‍💻',
    quote:
      'I was rejected from 40 companies because my resume looked like everyone else. Pathway transformed my generic bullet points into evidence-backed metrics with BullMQ & Redis benchmarks. Nailed my offer in 3 weeks.',
  },
  {
    name: 'Priya Sundaram',
    college: 'NIT Trichy',
    role: 'Full-Stack Engineer @ Atlassian',
    package: '32 LPA',
    avatar: '👩‍💻',
    quote:
      'The AI mock interview rubrics are brutal in the best way possible. It pointed out that my problem-solving was great but my verbal communication was disorganized. Practicing here made the real round a breeze.',
  },
  {
    name: 'Rohan Sharma',
    college: 'DTU Delhi',
    role: 'Backend Developer @ Zepto',
    package: '18 LPA',
    avatar: '🧑‍💻',
    quote:
      'The skill gap radar is unreal. Instead of watching random 40-hour YouTube tutorials, Pathway told me exactly which 3 Redis data structures I was missing for the Zepto backend test.',
  },
];

export function LandingPage() {
  const containerRef = useScrollReveal<HTMLDivElement>();

  /* Hero Interactive Showcase Tab State */
  const [heroTab, setHeroTab] = useState<'resume' | 'radar' | 'interview' | 'roadmap' | 'visual'>('resume');

  /* Role Simulator State */
  const [selectedRole, setSelectedRole] = useState<RoleProfile>(ROLE_PROFILES[0]);

  /* Placement Calculator State */
  const [calcYear, setCalcYear] = useState<'2nd' | '3rd' | '4th' | 'Grad'>('3rd');
  const [calcTier, setCalcTier] = useState<'tier1' | 'unicorns' | 'startups'>('tier1');
  const [calcHours, setCalcHours] = useState<'1hr' | '2hr' | '4hr'>('2hr');

  /* FAQ Accordion State */
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  /* Dynamic Calculator Math */
  const readinessWeekMap: Record<string, number> = {
    '2nd-tier1-1hr': 24,
    '2nd-tier1-2hr': 16,
    '2nd-tier1-4hr': 10,
    '3rd-tier1-1hr': 14,
    '3rd-tier1-2hr': 8,
    '3rd-tier1-4hr': 5,
    '4th-tier1-1hr': 10,
    '4th-tier1-2hr': 6,
    '4th-tier1-4hr': 4,
    'Grad-tier1-1hr': 8,
    'Grad-tier1-2hr': 5,
    'Grad-tier1-4hr': 3,
  };
  const key = `${calcYear}-${calcTier}-${calcHours}`;
  const estimatedWeeks = readinessWeekMap[key] || (calcHours === '4hr' ? 4 : calcHours === '2hr' ? 8 : 14);
  const estimatedAts = calcTier === 'tier1' ? '96%' : calcTier === 'unicorns' ? '92%' : '89%';

  return (
    <div className="landing-wrapper" ref={containerRef}>
      {/* ── 0. Neon Top Scroll Progress Indicator ───────────────── */}
      <ScrollProgressBar />

      {/* ── 1. Top Navbar ────────────────────────────────────────── */}
      <Header />

      {/* ── 2. Centered Majestic Hero Section with Animated Background ────── */}
      <div className="hero-animated-bg-wrapper">
        {/* Animated Background Image Layer with Particle Dust */}
        <div className="hero-bg-layer" aria-hidden="true">
          <img
            src="/hero-network.jpg"
            alt="AI Placement Assistant visual backdrop"
            className="hero-bg-image"
          />
          <AmbientHeroParticles />
          <div className="hero-bg-overlay-gradient" />
          <div className="hero-bg-ambient-orb orb-primary" />
          <div className="hero-bg-ambient-orb orb-secondary" />
          <div className="hero-bg-grid-mesh" />
        </div>

        {/* Floating Animated Badges over background image */}
        <div className="hero-floating-badge badge-top-left hidden xl:flex">
          <span className="badge-pulse-indicator" />
          <span className="badge-icon">⚡</span>
          <div className="badge-text-group">
            <span className="badge-title">94% ATS Score</span>
            <span className="badge-subtitle">Verified in Git Commits</span>
          </div>
        </div>

        <div className="hero-floating-badge badge-top-right hidden xl:flex">
          <span className="badge-pulse-indicator" />
          <span className="badge-icon">🎯</span>
          <div className="badge-text-group">
            <span className="badge-title">Zero Skill Gaps</span>
            <span className="badge-subtitle">Real-Time Evidence Matching</span>
          </div>
        </div>

        <div className="hero-floating-badge badge-bottom-right hidden xl:flex">
          <span className="badge-pulse-indicator" />
          <span className="badge-icon">💼</span>
          <div className="badge-text-group">
            <span className="badge-title">Tier-1 Placed</span>
            <span className="badge-subtitle">Average ₹24.8 LPA Package</span>
          </div>
        </div>

        <section className="hero-hero-section relative z-10" id="hero">
        <div className="hero-badge-pill">
          <span className="hero-pill-glow" />
          <span className="hero-pill-tag">✦ AI Career Intelligence 2.0</span>
          <span className="hero-pill-separator">·</span>
          <span className="hero-pill-text">Evidence-Backed Placement Engine</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        <h1 className="hero-main-title">
          Crack Top Tech Placements with<br />
          <span className="text-gradient">Verified Proof,</span> Not Empty Promises.
        </h1>

        <p className="hero-main-subtitle">
          Stop spraying generic resumes into recruiter black holes. Pathway analyses your actual code,
          detects high-impact skill gaps, and prepares you with conversational AI mock interviews.
        </p>

        <div className="hero-cta-group">
          <Link to="/dashboard" className="hero-primary-btn">
            <span>Launch Career Workspace</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </Link>
          <a href="#simulator" className="hero-secondary-btn">
            <span>Explore Role Matcher</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </a>
        </div>

        {/* Social Proof Strip with Smooth Dynamic Animated Counters */}
        <div className="hero-social-metrics">
          <div className="metric-item">
            <strong>
              <AnimatedCounter end={3400} suffix="+" />
            </strong>
            <span>Placed Students</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-item">
            <strong>
              <AnimatedCounter end={24.8} prefix="₹" suffix=" LPA" decimals={1} />
            </strong>
            <span>Avg Tier-1 Package</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-item">
            <strong>
              <AnimatedCounter end={94} suffix="%" />
            </strong>
            <span>ATS Pass Rate</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-item">
            <strong>
              <AnimatedCounter end={4.9} suffix=" / 5.0" decimals={1} />
            </strong>
            <span>Student Satisfaction</span>
          </div>
        </div>

        {/* ── Interactive Hero Product Showcase Window ───────────── */}
        <div className="hero-showcase-window">
          {/* Window Chrome Header */}
          <div className="showcase-window-bar">
            <div className="window-dots">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>
            <div className="window-address-bar">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>pathway.app/workspace/intelligence</span>
            </div>
            <div className="window-status-chip">
              <span className="status-live-dot" />
              <span>LIVE AI ENGINE</span>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="showcase-tabs-bar" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={heroTab === 'resume'}
              className={`showcase-tab-btn ${heroTab === 'resume' ? 'active' : ''}`}
              onClick={() => setHeroTab('resume')}
            >
              <span className="tab-icon">📄</span>
              <span>1. Resume Intelligence</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={heroTab === 'radar'}
              className={`showcase-tab-btn ${heroTab === 'radar' ? 'active' : ''}`}
              onClick={() => setHeroTab('radar')}
            >
              <span className="tab-icon">🎯</span>
              <span>2. Skill Gap Radar</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={heroTab === 'interview'}
              className={`showcase-tab-btn ${heroTab === 'interview' ? 'active' : ''}`}
              onClick={() => setHeroTab('interview')}
            >
              <span className="tab-icon">🎤</span>
              <span>3. AI Mock Interview</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={heroTab === 'roadmap'}
              className={`showcase-tab-btn ${heroTab === 'roadmap' ? 'active' : ''}`}
              onClick={() => setHeroTab('roadmap')}
            >
              <span className="tab-icon">🛣️</span>
              <span>4. Adaptive Roadmap</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={heroTab === 'visual'}
              className={`showcase-tab-btn ${heroTab === 'visual' ? 'active' : ''}`}
              onClick={() => setHeroTab('visual')}
            >
              <span className="tab-icon">🖼️</span>
              <span>5. AI Visual Engine</span>
            </button>
          </div>

          {/* Showcase Content Panel */}
          <div className="showcase-content-canvas">
            {heroTab === 'resume' && (
              <div className="showcase-view-fade">
                <div className="showcase-grid-split">
                  <div className="showcase-card-inner relative overflow-hidden">
                    <LaserScanline label="AI ATS AUDIT ENGINE" />
                    <div className="inner-card-head">
                      <span className="inner-eyebrow">ATS Score Analysis</span>
                      <span className="pill-score-high">94 / 100 · Tier A Match</span>
                    </div>
                    <h3 className="inner-card-title">Backend Systems Resume Audit</h3>
                    <p className="inner-card-desc">
                      Parsed 14 verified achievements. Detected 3 weak passive verbs and rewritten into high-impact metrics.
                    </p>

                    <div className="bullet-rewrite-preview">
                      <div className="rewrite-line bad">
                        <span className="rewrite-tag">❌ Before</span>
                        <p>"Built backend server using Express and Mongo to handle user requests."</p>
                      </div>
                      <div className="rewrite-line good">
                        <span className="rewrite-tag">✓ Pathway Evidence</span>
                        <p>"Architected distributed REST API with Express &amp; Redis caching, reducing p99 response latency by 42% under 10k req/min."</p>
                      </div>
                    </div>
                  </div>

                  <div className="showcase-stats-panel">
                    <div className="stat-pill-box">
                      <span>Action Verbs</span>
                      <strong>98% Strong</strong>
                    </div>
                    <div className="stat-pill-box">
                      <span>Keyword Density</span>
                      <strong>Top 2% FAANG</strong>
                    </div>
                    <div className="stat-pill-box">
                      <span>Quantified Impact</span>
                      <strong>12 Metrics</strong>
                    </div>
                    <Link to="/resume" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Audit Your Resume Free ↗
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {heroTab === 'radar' && (
              <div className="showcase-view-fade">
                <div className="showcase-grid-split">
                  <div className="showcase-card-inner relative overflow-hidden">
                    <LaserScanline label="SEMANTIC CODE PARSER" />
                    <div className="inner-card-head">
                      <span className="inner-eyebrow">Role Fit Diagnostics</span>
                      <span className="pill-score-high">88% Coverage</span>
                    </div>
                    <h3 className="inner-card-title">Target: SDE-1 Backend (Tier 1 Unicorns)</h3>
                    <p className="inner-card-desc">
                      Calculated from real code evidence across 6 GitHub repositories and assessment artifacts.
                    </p>

                    <div className="radar-skills-matrix">
                      <div className="matrix-group">
                        <span className="matrix-heading green">✓ Verified In Code Evidence</span>
                        <div className="matrix-chips">
                          <span className="chip-verified">✓ Redis Caching</span>
                          <span className="chip-verified">✓ BullMQ Queues</span>
                          <span className="chip-verified">✓ MongoDB Vector Indexing</span>
                          <span className="chip-verified">✓ REST API Security</span>
                        </div>
                      </div>
                      <div className="matrix-group">
                        <span className="matrix-heading red">⚠️ High-Yield Gaps to Close</span>
                        <div className="matrix-chips">
                          <span className="chip-gap">+ Kafka Message Streaming</span>
                          <span className="chip-gap">+ Distributed Transactions</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="showcase-stats-panel">
                    <div className="stat-pill-box">
                      <span>Matching Open Roles</span>
                      <strong>42 Active JDs</strong>
                    </div>
                    <div className="stat-pill-box">
                      <span>Est. Prep to 95%</span>
                      <strong>2 Weeks</strong>
                    </div>
                    <Link to="/skills" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Open Skill Gap Radar ↗
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {heroTab === 'interview' && (
              <div className="showcase-view-fade">
                <div className="showcase-grid-split">
                  <div className="showcase-card-inner">
                    <div className="relative mb-4 rounded-xl overflow-hidden border border-indigo-500/20 shadow-md">
                      <img
                        src="/interview-studio.jpg"
                        alt="AI Mock Interview Studio Session"
                        className="w-full h-36 object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                      <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-white tracking-wide">LIVE SESSION · GEMINI 2.5 FLASH</span>
                      </div>
                    </div>

                    <div className="inner-card-head">
                      <span className="inner-eyebrow">Real-Time Mock Session</span>
                      <span className="pill-score-high">Live Audio / Text</span>
                    </div>
                    <h3 className="inner-card-title">Technical Round: "Explain Cache Stampede Prevention"</h3>

                    <div className="interview-waveform-box space-y-3">
                      <AudioWaveform barsCount={24} isActive={true} />
                      <p className="transcription-text">
                        "I use distributed mutex locking combined with probabilistic early expiration (XFetch algorithm) to prevent duplicate database loads..."
                      </p>
                    </div>

                    <div className="interview-rubrics-grid">
                      <div className="rubric-card">
                        <span>ACCURACY</span>
                        <strong>94%</strong>
                      </div>
                      <div className="rubric-card">
                        <span>SYSTEM DESIGN</span>
                        <strong>90%</strong>
                      </div>
                      <div className="rubric-card">
                        <span>CLARITY</span>
                        <strong>96%</strong>
                      </div>
                    </div>
                  </div>

                  <div className="showcase-stats-panel">
                    <div className="stat-pill-box">
                      <span>AI Evaluator</span>
                      <strong>Gemini 2.5 Flash</strong>
                    </div>
                    <div className="stat-pill-box">
                      <span>Rubric Report</span>
                      <strong>Instant PDF</strong>
                    </div>
                    <Link to="/interviews" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Start Practice Round ↗
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {heroTab === 'roadmap' && (
              <div className="showcase-view-fade">
                <div className="showcase-grid-split">
                  <div className="showcase-card-inner">
                    <div className="inner-card-head">
                      <span className="inner-eyebrow">Personalised Sprint</span>
                      <span className="pill-score-high">Week 2 of 4 Active</span>
                    </div>
                    <h3 className="inner-card-title">30-Day Placement Acceleration Plan</h3>
                    <p className="inner-card-desc">
                      Dynamically adjusts as you submit code artifacts and mock interview drills.
                    </p>

                    <div className="timeline-preview">
                      <div className="timeline-node done">
                        <div className="node-marker">✓</div>
                        <div className="node-content">
                          <strong>Week 1: Core System I/O &amp; Concurrency</strong>
                          <span>Completed 4 modules · 100% quiz score</span>
                        </div>
                      </div>
                      <div className="timeline-node active">
                        <div className="node-marker">✦</div>
                        <div className="node-content">
                          <strong>Week 2: Advanced Caching &amp; Queues</strong>
                          <span>In progress: Redis lock patterns &amp; BullMQ workers</span>
                        </div>
                      </div>
                      <div className="timeline-node upcoming">
                        <div className="node-marker">03</div>
                        <div className="node-content">
                          <strong>Week 3: Microservice Communication &amp; Kafka</strong>
                          <span>Unlocked upon completing Week 2 drill</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="showcase-stats-panel">
                    <div className="stat-pill-box">
                      <span>Daily Dedication</span>
                      <strong>1.5 Hours</strong>
                    </div>
                    <div className="stat-pill-box">
                      <span>Target Drive</span>
                      <strong>Day 28 Ready</strong>
                    </div>
                    <Link to="/roadmap" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      View Full Roadmap ↗
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {heroTab === 'visual' && (
              <div className="showcase-view-fade">
                <div className="showcase-grid-split">
                  <div className="visual-architecture-card group">
                    <img
                      src="/resume-radar.jpg"
                      alt="AI Placement Assistant visual architecture"
                      className="visual-card-bg-img"
                    />
                    <div className="visual-card-overlay" />
                    <div className="visual-card-content">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/80 text-white backdrop-blur-sm shadow-sm">
                          ✦ Core Architecture
                        </span>
                        <span className="text-xs text-indigo-200">v2.4 Active · Real-time RAG</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                        Intelligent Career &amp; Evidence Processing Mesh
                      </h3>
                      <p className="text-sm text-slate-200 max-w-lg leading-relaxed mb-1">
                        Multimodal parsing pipeline synchronizing resume AST structures, GitHub commit telemetry, and conversational interview embeddings in real-time.
                      </p>
                      <div className="visual-tags-row">
                        <span className="visual-tag-pill">⚡ Vector Embeddings</span>
                        <span className="visual-tag-pill">🛡️ Private Evidence Ledger</span>
                        <span className="visual-tag-pill">🤖 Gemini &amp; DeepSeek RAG</span>
                        <span className="visual-tag-pill">📊 Real-Time ATS Matcher</span>
                      </div>
                    </div>
                  </div>

                  <div className="showcase-stats-panel">
                    <div className="stat-pill-box">
                      <span>Engine Latency</span>
                      <strong>&lt; 320ms</strong>
                    </div>
                    <div className="stat-pill-box">
                      <span>Accuracy Metric</span>
                      <strong>99.4% F1</strong>
                    </div>
                    <div className="stat-pill-box">
                      <span>Security Standard</span>
                      <strong>SOC-2 Ready</strong>
                    </div>
                    <Link to="/architecture" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      Explore Architecture ↗
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      </div>

      {/* ── 3. Hiring Company Marquee ────────────────────────────── */}
      <section className="company-logo-strip" aria-label="Top placement recruiting companies">
        <p className="strip-title">Calibrated against interview rubrics from engineering teams at</p>
        <div className="strip-marquee-track">
          {[
            'Google', 'Microsoft', 'Atlassian', 'Amazon', 'Razorpay', 'Uber', 'Zomato',
            'Goldman Sachs', 'Stripe', 'Flipkart', 'Zepto', 'CRED', 'Postman', 'Swiggy',
            'Google', 'Microsoft', 'Atlassian', 'Amazon', 'Razorpay', 'Uber', 'Zomato',
            'Goldman Sachs', 'Stripe', 'Flipkart', 'Zepto', 'CRED', 'Postman', 'Swiggy',
          ].map((company, i) => (
            <div key={`${company}-${i}`} className="company-logo-badge">
              <span className="company-sparkle">✦</span>
              <span className="company-name">{company}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Live Role Fit Simulator ───────────────────────────── */}
      <section className="landing-section" id="simulator">
        <div className="landing-section-head reveal-on-scroll">
          <p className="eyebrow">Interactive Diagnostics</p>
          <h2>Test your placement fit in 30 seconds.</h2>
          <p>
            Choose your target tech track to view verified JD expectations, realistic package bands,
            and high-impact skill gaps you need to conquer.
          </p>
        </div>

        <InteractiveSpotlightCard enableTilt={false} className="simulator-master-card reveal-on-scroll stagger-1">
          {/* Top Role Selector Tabs */}
          <div className="simulator-role-selector">
            {ROLE_PROFILES.map((profile) => (
              <button
                key={profile.id}
                type="button"
                className={`simulator-role-btn transition-all duration-200 ${selectedRole.id === profile.id ? 'active' : ''}`}
                onClick={() => setSelectedRole(profile)}
              >
                <span className="btn-title">{profile.name}</span>
                <span className="btn-pkg">{profile.salaryRange}</span>
              </button>
            ))}
          </div>

          {/* Simulator Content Grid */}
          <div className="simulator-details-grid">
            <div className="simulator-left-stats">
              <div className="sim-score-box">
                <CircularGauge score={selectedRole.matchScore} />
                <div>
                  <h3 className="sim-role-name">{selectedRole.name}</h3>
                  <p className="sim-market-demand">{selectedRole.marketDemand}</p>
                  <p className="sim-meta-sub">Calibrated across 450+ verified 2026 job descriptions</p>
                </div>
              </div>

              <div className="sim-advice-card">
                <div className="advice-icon">✦</div>
                <div>
                  <strong>AI Career Coach Recommendation:</strong>
                  <p>{selectedRole.aiAdvice}</p>
                </div>
              </div>

              <Link to="/resume" className="btn-primary" style={{ padding: '13px 22px' }}>
                Audit My Resume for {selectedRole.name.split(' ')[0]} ↗
              </Link>
            </div>

            <div className="simulator-right-skills">
              <div className="sim-skill-block verified">
                <div className="skill-block-header">
                  <span>Verified Skills Expected in Code</span>
                  <span className="tag-count green">{selectedRole.verifiedSkills.length} Matched</span>
                </div>
                <div className="skill-tags-flow">
                  {selectedRole.verifiedSkills.map((s) => (
                    <span key={s} className="sim-badge green">✓ {s}</span>
                  ))}
                </div>
              </div>

              <div className="sim-skill-block gaps">
                <div className="skill-block-header">
                  <span>High-Impact Skill Gaps to Close</span>
                  <span className="tag-count red">{selectedRole.missingGaps.length} To Prepare</span>
                </div>
                <div className="skill-tags-flow">
                  {selectedRole.missingGaps.map((g) => (
                    <span key={g} className="sim-badge red">+ {g}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </InteractiveSpotlightCard>
      </section>

      {/* ── 5. The 4 Pillars Bento Grid ──────────────────────────── */}
      <section className="landing-section" id="features">
        <div className="landing-section-head reveal-on-scroll">
          <p className="eyebrow">The Evidence Engine</p>
          <h2>Everything you need to conquer your campus drive.</h2>
          <p>
            Traditional placement prep relies on guess-work and blind grinding.
            Pathway equips you with a full-stack career operating system.
          </p>
        </div>

        <div className="bento-pillars-grid">
          {/* Card 1: Resume Studio */}
          <article className="bento-card bento-span-2 reveal-on-scroll stagger-1">
            <div className="bento-badge">01 · RESUME INTELLIGENCE</div>
            <h3>Evidence-Backed ATS Resume Studio</h3>
            <p>
              Upload PDF or DOCX. Pathway extracts hard impact indicators, flags weak bullet points,
              and generates ATS-optimized evidence metrics that catch recruiters’ attention.
            </p>

            <div className="bento-preview-box">
              <div className="bento-bullet-split">
                <div className="bullet-side bad">
                  <span className="bullet-side-tag red">❌ Outdated Resume Bullet</span>
                  <p>"Built backend server in Node.js and MongoDB to handle user data."</p>
                </div>
                <div className="bullet-side good">
                  <span className="bullet-side-tag green">✓ Pathway Evidence Upgrade</span>
                  <p>"Engineered distributed REST APIs with Node.js &amp; Redis, cutting query latency by 42% across 10K requests."</p>
                </div>
              </div>
            </div>

            <Link to="/resume" className="btn-secondary" style={{ width: 'fit-content', marginTop: 16 }}>
              Explore Resume Studio ↗
            </Link>
          </article>

          {/* Card 2: Skill Radar */}
          <article className="bento-card reveal-on-scroll stagger-2">
            <div className="bento-badge">02 · SKILL EVIDENCE</div>
            <h3>Dynamic Skill Gap Radar</h3>
            <p>
              No self-claimed sliders. Pathway calculates your exact readiness gaps by cross-referencing
              your recorded code against target role requisitions.
            </p>

            <div className="bento-preview-box">
              <div className="radar-mini-progress">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.82rem', fontWeight: 600 }}>
                  <span>SDE-1 Readiness</span>
                  <span style={{ color: 'var(--success)' }}>88% Match</span>
                </div>
                <div className="mini-progress-bar">
                  <div className="mini-progress-fill" style={{ width: '88%' }} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                  <span className="sim-badge green small">✓ Distributed Caching</span>
                  <span className="sim-badge red small">+ Kafka Pipelines</span>
                </div>
              </div>
            </div>

            <Link to="/skills" className="btn-secondary" style={{ width: 'fit-content', marginTop: 16 }}>
              View Skill Radar ↗
            </Link>
          </article>

          {/* Card 3: Mock Interview */}
          <article className="bento-card reveal-on-scroll stagger-3">
            <div className="bento-badge">03 · MOCK INTERVIEWS</div>
            <h3>Conversational AI Mock Simulator</h3>
            <p>
              Practice one answer at a time under pressure. Pathway grades your response across technical
              accuracy, edge-case coverage, code structure, and communication clarity.
            </p>

            <div className="bento-preview-box">
              <div className="mock-mini-scores">
                <div className="mini-score-node">
                  <span>Accuracy</span>
                  <strong>94%</strong>
                </div>
                <div className="mini-score-node">
                  <span>Structure</span>
                  <strong>89%</strong>
                </div>
                <div className="mini-score-node">
                  <span>Clarity</span>
                  <strong>96%</strong>
                </div>
              </div>
            </div>

            <Link to="/interviews" className="btn-secondary" style={{ width: 'fit-content', marginTop: 16 }}>
              Practice Interviews ↗
            </Link>
          </article>

          {/* Card 4: Roadmap */}
          <article className="bento-card bento-span-2 reveal-on-scroll stagger-4">
            <div className="bento-badge">04 · SPRINT ENGINE</div>
            <h3>Adaptive 30-Day Placement Roadmap</h3>
            <p>
              Your roadmap evolves dynamically every time you upload a project or complete an assessment.
              It focuses strictly on high-yield topics with zero filler content.
            </p>

            <div className="bento-preview-box">
              <div className="roadmap-horizontal-strip">
                <div className="road-step done">
                  <span className="step-num">01</span>
                  <strong>Async I/O &amp; Concurrency</strong>
                  <span className="step-status">Verified ✓</span>
                </div>
                <div className="road-step active">
                  <span className="step-num">02</span>
                  <strong>Database Index Optimization</strong>
                  <span className="step-status in-progress">In Progress ✦</span>
                </div>
                <div className="road-step upcoming">
                  <span className="step-num">03</span>
                  <strong>Distributed Caching &amp; Queues</strong>
                  <span className="step-status">Next Up</span>
                </div>
              </div>
            </div>

            <Link to="/roadmap" className="btn-secondary" style={{ width: 'fit-content', marginTop: 16 }}>
              Inspect My Roadmap ↗
            </Link>
          </article>
        </div>
      </section>

      {/* ── 6. Placement Velocity Calculator ─────────────────────── */}
      <section className="landing-section" id="calculator">
        <div className="calc-master-box reveal-on-scroll">
          <div className="calc-left-col">
            <p className="eyebrow">Interactive Estimation</p>
            <h2 className="calc-title">Calculate your placement velocity.</h2>
            <p className="calc-desc">
              Tell us where you are in your academic journey and see your personalized sprint timeline.
            </p>

            <div className="calc-inputs-flow">
              {/* Year */}
              <div className="calc-input-row">
                <label>1. Academic Standing</label>
                <div className="calc-segmented-tabs">
                  {(['2nd', '3rd', '4th', 'Grad'] as const).map((year) => (
                    <button
                      key={year}
                      type="button"
                      className={`segmented-tab ${calcYear === year ? 'active' : ''}`}
                      onClick={() => setCalcYear(year)}
                    >
                      {year === 'Grad' ? 'Recent Grad' : `${year} Year`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tier */}
              <div className="calc-input-row">
                <label>2. Target Company Tier</label>
                <div className="calc-segmented-tabs">
                  <button
                    type="button"
                    className={`segmented-tab ${calcTier === 'tier1' ? 'active' : ''}`}
                    onClick={() => setCalcTier('tier1')}
                  >
                    FAANG / Tier 1 (25+ LPA)
                  </button>
                  <button
                    type="button"
                    className={`segmented-tab ${calcTier === 'unicorns' ? 'active' : ''}`}
                    onClick={() => setCalcTier('unicorns')}
                  >
                    Tech Unicorns (14-22 LPA)
                  </button>
                  <button
                    type="button"
                    className={`segmented-tab ${calcTier === 'startups' ? 'active' : ''}`}
                    onClick={() => setCalcTier('startups')}
                  >
                    Startups (8-14 LPA)
                  </button>
                </div>
              </div>

              {/* Daily Hours */}
              <div className="calc-input-row">
                <label>3. Daily Dedicated Preparation</label>
                <div className="calc-segmented-tabs">
                  <button
                    type="button"
                    className={`segmented-tab ${calcHours === '1hr' ? 'active' : ''}`}
                    onClick={() => setCalcHours('1hr')}
                  >
                    1 hr / day (Consistent)
                  </button>
                  <button
                    type="button"
                    className={`segmented-tab ${calcHours === '2hr' ? 'active' : ''}`}
                    onClick={() => setCalcHours('2hr')}
                  >
                    2 hrs / day (Accelerated)
                  </button>
                  <button
                    type="button"
                    className={`segmented-tab ${calcHours === '4hr' ? 'active' : ''}`}
                    onClick={() => setCalcHours('4hr')}
                  >
                    4+ hrs / day (Intensive)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Calculator Output Card */}
          <div className="calc-right-output">
            <span className="output-eyebrow">Estimated Sprint Output</span>
            <div className="output-weeks-display">
              <strong>{estimatedWeeks}</strong>
              <span>weeks to 90%+ fit</span>
            </div>

            <div className="output-metrics-list">
              <div className="output-metric-item">
                <span>🎯 Target ATS Score</span>
                <strong>{estimatedAts}</strong>
              </div>
              <div className="output-metric-item">
                <span>⚡ High-Yield Practice Modules</span>
                <strong>{Math.ceil(estimatedWeeks * 1.5)} Modules</strong>
              </div>
              <div className="output-metric-item">
                <span>🎤 Mock Interview Drills</span>
                <strong>{Math.ceil(estimatedWeeks * 2)} Live Rounds</strong>
              </div>
            </div>

            <Link to="/dashboard" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
              Start Your {estimatedWeeks}-Week Sprint ↗
            </Link>
          </div>
        </div>
      </section>

      {/* ── 7. Comparison Table ──────────────────────────────────── */}
      <section className="landing-section" id="comparison">
        <div className="landing-section-head reveal-on-scroll">
          <p className="eyebrow">The Clear Difference</p>
          <h2>Stop doing what failed for the batch of 2024.</h2>
          <p>
            The hiring landscape has fundamentally changed. Blanket applications and memorized
            answers are detected instantly by AI recruiters.
          </p>
        </div>

        <div className="comparison-cards-grid">
          <div className="compare-card old-way reveal-on-scroll stagger-1">
            <h3 className="compare-card-title red">❌ The Outdated Way</h3>
            <ul className="compare-points-list">
              <li>Submitting generic PDF resumes to 200 portals with &lt;2% callback rate.</li>
              <li>Rating arbitrary self-claimed percentages like "90% in React" on resumes.</li>
              <li>Memorizing 400 LeetCode tricks without understanding distributed tradeoffs.</li>
              <li>Practicing mock interviews in front of mirrors with zero objective grading.</li>
              <li>No visibility into why rejections happen until placement season ends.</li>
            </ul>
          </div>

          <div className="compare-card new-way reveal-on-scroll stagger-2">
            <h3 className="compare-card-title green">✓ The Pathway Standard</h3>
            <ul className="compare-points-list">
              <li>Evidence-backed ATS resume optimization proven to pass corporate parsers.</li>
              <li>Transparent skill gap calculations tied to your real code commits and projects.</li>
              <li>Targeted drills on high-yield architectural gaps instead of blind grinding.</li>
              <li>Instant conversational AI mock interviews with rubrics for accuracy and clarity.</li>
              <li>Continuous readiness dashboard pinpointing exactly which skill to conquer next.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 8. Student Placements ─────────────────────────────────── */}
      <section className="landing-section" id="stories">
        <div className="landing-section-head reveal-on-scroll">
          <p className="eyebrow">Hall of Offers</p>
          <h2>Engineers who turned evidence into dream placements.</h2>
          <p>Real stories from candidates who stopped guessing and started proving.</p>
        </div>

        <div className="testimonials-cards-grid">
          {TESTIMONIALS.map((t, idx) => (
            <div key={t.name} className={`testimonial-modern-card reveal-on-scroll stagger-${idx + 1}`}>
              <div className="testi-user-row">
                <div className="testi-avatar-circle">{t.avatar}</div>
                <div>
                  <h4 className="testi-author">{t.name}</h4>
                  <p className="testi-college">{t.college} · {t.role}</p>
                </div>
              </div>
              <p className="testi-text">"{t.quote}"</p>
              <div className="testi-bottom-row">
                <span className="verified-badge">✓ Verified Placement</span>
                <strong className="pkg-text">{t.package}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 9. Interactive FAQ Accordion ──────────────────────────── */}
      <section className="landing-section" id="faq">
        <div className="landing-section-head reveal-on-scroll">
          <p className="eyebrow">Frequently Asked Questions</p>
          <h2>Everything you need to know about Pathway.</h2>
        </div>

        <div className="faq-modern-accordion reveal-on-scroll stagger-1">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={faq.q} className={`faq-card-row ${isOpen ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <svg
                    className={`faq-arrow-icon ${isOpen ? 'rotated' : ''}`}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="faq-answer-body">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 10. Mega Modern CTA Banner ────────────────────────────── */}
      <section className="landing-section">
        <div className="mega-modern-cta relative overflow-hidden reveal-on-scroll">
          {/* Animated background image overlay with hero-network */}
          <div className="cta-bg-layer" aria-hidden="true">
            <img
              src="/hero-network.jpg"
              alt="CTA Background Pattern"
              className="cta-bg-image"
            />
            <div className="cta-bg-overlay" />
          </div>

          <div className="cta-ambient-glow" />
          <span className="cta-pill relative z-10">Ready to Start?</span>
          <h2 className="relative z-10">Turn your preparation hours into offers.</h2>
          <p className="relative z-10">
            No credit card required. Free for engineering students. Sign in to your private workspace,
            audit your first resume in 60 seconds, and uncover your true placement readiness score.
          </p>

          <div className="cta-buttons-row relative z-10">
            <Link to="/dashboard" className="hero-primary-btn transition-transform hover:scale-105 duration-200 shadow-lg">
              <span>Launch Workspace Free</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </Link>
            <Link to="/architecture" className="hero-secondary-btn transition-transform hover:scale-105 duration-200" style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}>
              <span>Explore Tech Architecture</span>
              <span aria-hidden="true">⚡</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 11. Footer ────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
