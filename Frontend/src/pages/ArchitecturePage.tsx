const foundations = [
  ['Web client', 'React, TypeScript, Vite, React Router and TanStack Query'],
  ['API service', 'Express, Zod validation, Helmet, CORS and structured errors'],
  ['Data layer', 'MongoDB connection boundary and Redis-ready shared connection'],
  ['Worker runtime', 'BullMQ worker shell reserved for asynchronous AI processing'],
];

export function ArchitecturePage() {
  return (
    <main className="shell">
      <p className="eyebrow">Placement Assistant · Phase 1</p>
      <h1>Production foundation is ready.</h1>
      <p className="lede">
        The product experience begins in the next phase. This workspace now separates the web,
        API, background work, data contracts, validation, and future AI orchestration layers.
      </p>
      <section className="foundation-grid" aria-label="Platform foundation">
        {foundations.map(([title, description]) => (
          <article className="foundation-card" key={title}>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>
      <p className="status"><span /> No student data is shown until secure authentication and profiles are built.</p>
    </main>
  );
}
