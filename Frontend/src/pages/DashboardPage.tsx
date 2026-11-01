import { Link } from 'react-router-dom';

export function DashboardPage() {
  const stats = [
    { label: 'Recorded Skills', value: '6', change: '+2 this week', icon: '◈' },
    { label: 'ATS Resume Score', value: '88', change: 'Top 12%', icon: '▣' },
    { label: 'Mock Accuracy', value: '92%', change: '3 drills', icon: '◉' },
    { label: 'Target Matches', value: '12', change: '4 Tier-1', icon: '↗' },
  ];

  const weeklyActivity = [
    { day: 'M', height: 40, active: true },
    { day: 'T', height: 70, active: true },
    { day: 'W', height: 55, active: true },
    { day: 'T', height: 90, active: true },
    { day: 'F', height: 65, active: true },
    { day: 'S', height: 30, active: false },
    { day: 'S', height: 80, active: true },
  ];

  const criticalGaps = [
    { name: 'Distributed Caching', tag: 'High Priority', link: '/interviews' },
    { name: 'Kafka Event Streaming', tag: 'Must Have', link: '/roadmap' },
  ];

  return (
    <div className="dashboard-page flex flex-col gap-6">
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-success">SDE-1 Track</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Kunal Sharma</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/resume" className="btn-secondary text-xs">
            Upload Resume
          </Link>
          <Link to="/interviews" className="btn-primary text-xs">
            Start Mock Drill ↗
          </Link>
        </div>
      </div>

      {/* ── Visual Hero Readiness & Activity Split ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Visual Readiness Circular Arc (7 cols) */}
        <div className="lg:col-span-7 card-hero flex flex-col sm:flex-row items-center justify-between gap-6 p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--status-success)] animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase text-[var(--text-muted)]">
                Placement Index
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
              84% Placement Ready
            </h2>

            <p className="text-xs text-[var(--text-secondary)]">
              Target: Tier-1 Tech (₹18 - ₹28 LPA)
            </p>

            <div className="flex items-center gap-2 pt-1">
              <Link to="/roadmap" className="btn-primary text-xs py-2 px-3.5">
                30-Day Sprint →
              </Link>
              <Link to="/chat" className="btn-secondary text-xs py-2 px-3.5">
                AI Coach ✦
              </Link>
            </div>
          </div>

          {/* SVG Circular Ring Gauge */}
          <div className="relative flex items-center justify-center w-36 h-36 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="var(--bg-subtle)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="var(--text-primary)"
                strokeWidth="8"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * 84) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-[var(--text-primary)]">84%</span>
              <span className="text-[9px] font-bold text-[var(--status-success)] uppercase">Tier-1</span>
            </div>
          </div>
        </div>

        {/* Right: Weekly Activity Bar Chart (5 cols) */}
        <div className="lg:col-span-5 card p-6 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Weekly Preparation Sprint
            </span>
            <span className="badge badge-mono text-[10px]">14.5 Hours</span>
          </div>

          {/* Mini Visual Bar Chart */}
          <div className="flex items-end justify-between gap-2 h-24 pt-4">
            {weeklyActivity.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div
                  className="w-full rounded-t-sm transition-all duration-500"
                  style={{
                    height: `${bar.height}%`,
                    backgroundColor: bar.active ? 'var(--text-primary)' : 'var(--bg-subtle)',
                  }}
                />
                <span className="text-[10px] font-mono text-[var(--text-muted)]">{bar.day}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[var(--border-subtle)] text-[var(--text-secondary)]">
            <span>Streak: 5 Days Active</span>
            <span className="font-bold text-[var(--text-primary)]">+22% vs Last Week</span>
          </div>
        </div>
      </div>

      {/* ── 4 Graphical Stat Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="card p-4 flex flex-col justify-between gap-2 hover:border-[var(--border-strong)] transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase">
                {stat.label}
              </span>
              <span className="text-base">{stat.icon}</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
              {stat.value}
            </p>
            <span className="text-[11px] text-[var(--text-secondary)] font-medium">
              {stat.change}
            </span>
          </div>
        ))}
      </div>

      {/* ── Gaps & Quick Shortcuts (Visual & Clean) ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Critical Gaps Radar */}
        <div className="card p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Remaining Skill Gaps
            </span>
            <span className="badge badge-warning text-[9px]">2 to Bridge</span>
          </div>

          <div className="space-y-2">
            {criticalGaps.map((g) => (
              <div
                key={g.name}
                className="p-3 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-warning)]" />
                  <span className="font-bold text-[var(--text-primary)]">{g.name}</span>
                </div>
                <Link
                  to={g.link}
                  className="font-semibold text-[var(--text-primary)] hover:underline"
                >
                  Bridge Drill →
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Top Job Openings Shortcut */}
        <div className="card p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Top Matched Roles
            </span>
            <Link to="/jobs" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              View All 12 →
            </Link>
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-[var(--text-primary)]">Razorpay · SDE-1 Backend</p>
                <p className="text-[11px] text-[var(--text-muted)]">₹18 - ₹26 LPA</p>
              </div>
              <span className="badge badge-success font-bold">94% Match</span>
            </div>

            <div className="p-3 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-[var(--text-primary)]">Postman · Infrastructure SDE</p>
                <p className="text-[11px] text-[var(--text-muted)]">₹16 - ₹24 LPA</p>
              </div>
              <span className="badge badge-success font-bold">91% Match</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
