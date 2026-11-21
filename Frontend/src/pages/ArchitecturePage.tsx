import { useState } from 'react';

interface NodeInfo {
  id: string;
  name: string;
  type: string;
  latency: string;
  uptime: string;
  throughput: string;
  specs: string[];
}

const NODES_DATA: Record<string, NodeInfo> = {
  client: {
    id: 'client',
    name: 'Web Client',
    type: 'React 19 + TypeScript',
    latency: '18ms',
    uptime: '100%',
    throughput: '2.4k req/s',
    specs: ['Vite 7', 'TanStack Query', 'Tailwind', 'Zero-Flash Theme'],
  },
  gateway: {
    id: 'gateway',
    name: 'API Gateway',
    type: 'Express + Zod Schema',
    latency: '42ms',
    uptime: '99.99%',
    throughput: '8.5k req/s',
    specs: ['JWT Rotation', 'Helmet Security', 'Rate Limiter', 'Zod Validation'],
  },
  queue: {
    id: 'queue',
    name: 'Task Queue',
    type: 'BullMQ + Redis 7',
    latency: '120ms',
    uptime: '99.95%',
    throughput: '450 jobs/s',
    specs: ['Dead Letter Queue', 'Backoff Retries', 'Concurrency: 8', 'In-Memory Cache'],
  },
  database: {
    id: 'database',
    name: 'Vector DB',
    type: 'MongoDB Atlas',
    latency: '9ms',
    uptime: '99.99%',
    throughput: '12k ops/s',
    specs: ['HNSW 1536-dim Index', 'Cosine Distance', 'Mongoose ODM', 'Read Replicas'],
  },
  ai: {
    id: 'ai',
    name: 'AI Engine',
    type: 'Gemini Pro RAG',
    latency: '340ms',
    uptime: '99.9%',
    throughput: '85 stream/s',
    specs: ['Structured JSON Output', 'Prompt Versioning', 'ATS Rubrics', 'Grounded Citations'],
  },
};

export function ArchitecturePage() {
  const [selectedNode, setSelectedNode] = useState<string>('gateway');
  const active = NODES_DATA[selectedNode] || NODES_DATA.gateway;

  return (
    <div className="architecture-visual-page flex flex-col gap-6">
      {/* ── Top Header (Concise & Visual) ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-success">Illustrative architecture; metrics are sample data</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">System Infrastructure Blueprint</h1>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-default)] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[var(--status-success)] animate-pulse" />
            <span className="font-bold text-[var(--text-primary)]">SLA 99.98%</span>
            <span className="text-[var(--text-muted)]">• P95 42ms</span>
          </div>
        </div>
      </div>

      {/* ── Main Interactive SVG Topology Diagram ─────────────── */}
      <div className="card-hero p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
          <span>DATA FLOW PIPELINE (INTERACTIVE)</span>
          <span>SELECT ANY NODE TO INSPECT TELEMETRY</span>
        </div>

        {/* Diagram Area */}
        <div className="relative w-full overflow-x-auto py-4">
          <div className="min-w-[700px] flex items-center justify-between gap-4 relative">
            {/* SVG Connecting animated pipelines behind nodes */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ minHeight: '120px' }}
            >
              <defs>
                <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--text-muted)" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="var(--text-primary)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="var(--text-muted)" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Path 1: Client to Gateway */}
              <line
                x1="120"
                y1="50"
                x2="240"
                y2="50"
                stroke="var(--border-strong)"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="animate-pulse"
              />

              {/* Path 2: Gateway to Queue */}
              <line
                x1="360"
                y1="50"
                x2="470"
                y2="50"
                stroke="var(--border-strong)"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="animate-pulse"
              />

              {/* Path 3: Queue to DB */}
              <line
                x1="590"
                y1="50"
                x2="680"
                y2="50"
                stroke="var(--border-strong)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </svg>

            {/* Node 1: Web Client */}
            <button
              type="button"
              onClick={() => setSelectedNode('client')}
              className={`z-10 w-36 p-3.5 rounded-xl border text-left transition-all ${
                selectedNode === 'client'
                  ? 'bg-[var(--bg-surface)] border-[var(--border-focus)] shadow-lg scale-105'
                  : 'bg-[var(--bg-subtle)] border-[var(--border-default)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">💻</span>
                <span className="w-2 h-2 rounded-full bg-[var(--status-success)]" />
              </div>
              <p className="font-bold text-xs text-[var(--text-primary)]">Web Client</p>
              <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">React 19</p>
              <div className="mt-2 text-[10px] font-mono text-[var(--text-secondary)]">
                {NODES_DATA.client.latency}
              </div>
            </button>

            {/* Node 2: API Gateway */}
            <button
              type="button"
              onClick={() => setSelectedNode('gateway')}
              className={`z-10 w-36 p-3.5 rounded-xl border text-left transition-all ${
                selectedNode === 'gateway'
                  ? 'bg-[var(--bg-surface)] border-[var(--border-focus)] shadow-lg scale-105'
                  : 'bg-[var(--bg-subtle)] border-[var(--border-default)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">⚡</span>
                <span className="w-2 h-2 rounded-full bg-[var(--status-success)]" />
              </div>
              <p className="font-bold text-xs text-[var(--text-primary)]">API Gateway</p>
              <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">Express + Zod</p>
              <div className="mt-2 text-[10px] font-mono text-[var(--text-secondary)]">
                {NODES_DATA.gateway.latency}
              </div>
            </button>

            {/* Node 3: BullMQ Queue */}
            <button
              type="button"
              onClick={() => setSelectedNode('queue')}
              className={`z-10 w-36 p-3.5 rounded-xl border text-left transition-all ${
                selectedNode === 'queue'
                  ? 'bg-[var(--bg-surface)] border-[var(--border-focus)] shadow-lg scale-105'
                  : 'bg-[var(--bg-subtle)] border-[var(--border-default)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">⚙️</span>
                <span className="w-2 h-2 rounded-full bg-[var(--status-success)]" />
              </div>
              <p className="font-bold text-xs text-[var(--text-primary)]">Task Queue</p>
              <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">BullMQ + Redis</p>
              <div className="mt-2 text-[10px] font-mono text-[var(--text-secondary)]">
                {NODES_DATA.queue.latency}
              </div>
            </button>

            {/* Node 4: MongoDB Atlas */}
            <button
              type="button"
              onClick={() => setSelectedNode('database')}
              className={`z-10 w-36 p-3.5 rounded-xl border text-left transition-all ${
                selectedNode === 'database'
                  ? 'bg-[var(--bg-surface)] border-[var(--border-focus)] shadow-lg scale-105'
                  : 'bg-[var(--bg-subtle)] border-[var(--border-default)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">🗄️</span>
                <span className="w-2 h-2 rounded-full bg-[var(--status-success)]" />
              </div>
              <p className="font-bold text-xs text-[var(--text-primary)]">Vector DB</p>
              <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">MongoDB Atlas</p>
              <div className="mt-2 text-[10px] font-mono text-[var(--text-secondary)]">
                {NODES_DATA.database.latency}
              </div>
            </button>

            {/* Node 5: Gemini Pro RAG */}
            <button
              type="button"
              onClick={() => setSelectedNode('ai')}
              className={`z-10 w-36 p-3.5 rounded-xl border text-left transition-all ${
                selectedNode === 'ai'
                  ? 'bg-[var(--bg-surface)] border-[var(--border-focus)] shadow-lg scale-105'
                  : 'bg-[var(--bg-subtle)] border-[var(--border-default)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">✦</span>
                <span className="w-2 h-2 rounded-full bg-[var(--status-success)]" />
              </div>
              <p className="font-bold text-xs text-[var(--text-primary)]">AI Engine</p>
              <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">Gemini 2.5</p>
              <div className="mt-2 text-[10px] font-mono text-[var(--text-secondary)]">
                {NODES_DATA.ai.latency}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── Visual Telemetry & Selected Node Inspector ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Node Telemetry Metrics (7 cols) */}
        <div className="md:col-span-7 card flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--status-success)]" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {active.name} Telemetry
              </h2>
            </div>
            <span className="badge badge-mono text-[10px]">{active.type}</span>
          </div>

          {/* Visual Gauges */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center">
              <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Latency</p>
              <p className="text-xl font-black text-[var(--text-primary)] my-0.5">{active.latency}</p>
              <span className="text-[9px] text-[var(--status-success)] font-bold">Fast</span>
            </div>

            <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center">
              <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Uptime</p>
              <p className="text-xl font-black text-[var(--text-primary)] my-0.5">{active.uptime}</p>
              <span className="text-[9px] text-[var(--status-success)] font-bold">Optimal</span>
            </div>

            <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center">
              <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Throughput</p>
              <p className="text-xl font-black text-[var(--text-primary)] my-0.5">{active.throughput}</p>
              <span className="text-[9px] text-[var(--text-secondary)] font-bold">Active</span>
            </div>
          </div>

          {/* Specifications Pills */}
          <div>
            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Runtime Architecture
            </p>
            <div className="flex flex-wrap gap-1.5">
              {active.specs.map((s) => (
                <span key={s} className="badge badge-mono text-[10px]">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Traffic & SLA Monitor (5 cols) */}
        <div className="md:col-span-5 card flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Cluster Health Status
            </h3>
            <span className="badge badge-success text-[9px]">HEALTHY</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Visual Health Bars */}
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="text-[var(--text-muted)]">Worker Queue Utilization</span>
                <span className="font-bold text-[var(--text-primary)]">24%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                <div className="h-full bg-[var(--text-primary)] rounded-full" style={{ width: '24%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="text-[var(--text-muted)]">Vector Index Memory</span>
                <span className="font-bold text-[var(--text-primary)]">42%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                <div className="h-full bg-[var(--text-primary)] rounded-full" style={{ width: '42%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="text-[var(--text-muted)]">Token Quota Margin</span>
                <span className="font-bold text-[var(--text-primary)]">89% Free</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                <div className="h-full bg-[var(--status-success)] rounded-full" style={{ width: '89%' }} />
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)]">
            <span>Security Headers: Helmet</span>
            <span>CORS: Strict</span>
          </div>
        </div>
      </div>
    </div>
  );
}
