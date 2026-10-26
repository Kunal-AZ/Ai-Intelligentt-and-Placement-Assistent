import { InteractiveSpotlightCard, useScrollReveal } from '../Components/animations';

const FOUNDATIONS = [
  {
    title: 'Web Client',
    icon: '🌐',
    description: 'React 19, TypeScript, Vite, React Router v7, and TanStack Query. Fully typed, responsive, tree-shaken production client.',
  },
  {
    title: 'API Service',
    icon: '⚡',
    description: 'Express with Zod validation, Helmet security headers, CORS, and structured error boundaries ready for AI pipelines.',
  },
  {
    title: 'Data Layer',
    icon: '🗄️',
    description: 'MongoDB Atlas with vector index support for semantic similarity search. Redis-backed connection for caching & queues.',
  },
  {
    title: 'Worker Runtime',
    icon: '⚙️',
    description: 'BullMQ worker shell for asynchronous background tasks: resume OCR parsing, embedding generation, and match scoring.',
  },
  {
    title: 'AI Core',
    icon: '🤖',
    description: 'Modular AI orchestration layer with RAG pipeline, Gemini & LLM connectors, standardized rubrics, and evaluators.',
  },
  {
    title: 'Shared Contracts',
    icon: '📦',
    description: 'Monorepo packages for schemas, database interfaces, and AI core logic shared across services with strict TypeScript checking.',
  },
];

const PHASES = [
  { id: 1, label: 'Foundation', status: 'done' as const },
  { id: 2, label: 'Auth & Profiles', status: 'done' as const },
  { id: 3, label: 'Resume AI', status: 'in-progress' as const },
  { id: 4, label: 'Skills & Gaps', status: 'upcoming' as const },
  { id: 5, label: 'Job Matching', status: 'upcoming' as const },
  { id: 6, label: 'Interviews', status: 'upcoming' as const },
  { id: 7, label: 'Roadmaps', status: 'upcoming' as const },
  { id: 8, label: 'Analytics', status: 'upcoming' as const },
  { id: 9, label: 'Campus Launch', status: 'upcoming' as const },
];

const phaseStyles: Record<string, { bg: string; text: string; border: string }> = {
  done: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  'in-progress': { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
  upcoming: { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
};

export function ArchitecturePage() {
  const containerRef = useScrollReveal<HTMLDivElement>();

  return (
    <div ref={containerRef}>
      <section className="architecture-page" aria-labelledby="arch-title">
        <p className="eyebrow">Technical Overview · Microservices &amp; AI</p>
        <h1 id="arch-title" style={{ fontSize: '2.1rem', margin: '6px 0 12px' }}>
          Production-grade scalable architecture.
        </h1>
        <p className="feature-description" style={{ maxWidth: 760 }}>
          The workspace cleanly separates frontend delivery, REST endpoints, asynchronous BullMQ queues,
          vector embeddings, and real-time LLM reasoning engines.
        </p>

        {/* ── Foundation Grid ──────────────────────────── */}
        <section className="foundation-grid" aria-label="Platform foundation components">
          {FOUNDATIONS.map(({ title, icon, description }, idx) => (
            <InteractiveSpotlightCard
              key={title}
              className={`foundation-card reveal-on-scroll stagger-${(idx % 3) + 1}`}
            >
              <div className="foundation-icon" aria-hidden="true">
                {icon}
              </div>
              <h2>{title}</h2>
              <p>{description}</p>
            </InteractiveSpotlightCard>
          ))}
        </section>

      {/* ── Phase Roadmap ────────────────────────────── */}
      <div style={{ margin: '40px 0 24px' }}>
        <p className="eyebrow" style={{ marginBottom: 14 }}>
          Engineering Build Roadmap
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
          }}
          role="list"
          aria-label="Build phases"
        >
          {PHASES.map(({ id, label, status }) => {
            const style = phaseStyles[status];
            return (
              <div
                key={id}
                role="listitem"
                aria-label={`Phase ${id}: ${label} — ${status.replace('-', ' ')}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  border: `1px solid ${style.border}`,
                  borderRadius: 10,
                  backgroundColor: style.bg,
                  color: style.text,
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <span style={{ fontWeight: 800, fontSize: '0.75rem', opacity: 0.7 }}>
                  {String(id).padStart(2, '0')}
                </span>
                {label}
                {status === 'in-progress' && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      background: '#4f46e5',
                      borderRadius: '50%',
                      animation: 'pulseDot 1.5s infinite',
                    }}
                    aria-label="In progress"
                  />
                )}
                {status === 'done' && <span aria-label="Completed">✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Status Banner ────────────────────────────── */}
      <div className="status-banner" role="status" aria-live="polite">
        <span className="status-dot" aria-hidden="true" />
        <div>
          <strong>System Health Status:</strong> All core services operational. Phase 3 (Resume AI Vector Search)
          is in progress.
        </div>
      </div>
    </section>
    </div>
  );
}
