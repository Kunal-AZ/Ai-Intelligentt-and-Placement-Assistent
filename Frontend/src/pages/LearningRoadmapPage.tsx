import { useState } from 'react';

interface RoadmapTask {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  impactTag: string;
}

interface RoadmapWeek {
  weekNumber: number;
  title: string;
  status: 'DONE' | 'ACTIVE' | 'NEXT';
  tasks: RoadmapTask[];
}

const INITIAL_WEEKS: RoadmapWeek[] = [
  {
    weekNumber: 1,
    title: 'ATS Resume Verification',
    status: 'DONE',
    tasks: [
      { id: 't1', title: 'Single-Column ATS Layout Rewrite', duration: '2h', completed: true, impactTag: '+15 ATS' },
      { id: 't2', title: 'Runtime Zod Payload Validation', duration: '3h', completed: true, impactTag: 'Core SDE' },
    ],
  },
  {
    weekNumber: 2,
    title: 'Concurrency & Task Queues',
    status: 'ACTIVE',
    tasks: [
      { id: 't3', title: 'BullMQ Worker Async OCR Pipeline', duration: '4h', completed: true, impactTag: 'Production' },
      { id: 't4', title: 'Cache Stampede & Mutex Locking Drill', duration: '2.5h', completed: false, impactTag: 'High Yield Gap' },
      { id: 't5', title: 'MongoDB Vector HNSW Indexing', duration: '3h', completed: false, impactTag: 'AI Placement' },
    ],
  },
  {
    weekNumber: 3,
    title: 'Mock Interview Calibration',
    status: 'NEXT',
    tasks: [
      { id: 't6', title: 'Idempotency Payment Webhook Simulation', duration: '45m', completed: false, impactTag: 'Mock Lab' },
      { id: 't7', title: 'Node.js Event Loop Microtasks Defense', duration: '45m', completed: false, impactTag: 'Core Drill' },
    ],
  },
  {
    weekNumber: 4,
    title: 'Tier-1 Recruiter Outreach',
    status: 'NEXT',
    tasks: [
      { id: 't8', title: 'Submit Dossier to Razorpay & Swiggy', duration: '1h', completed: false, impactTag: 'Direct Apply' },
    ],
  },
];

export function LearningRoadmapPage() {
  const [weeks, setWeeks] = useState<RoadmapWeek[]>(INITIAL_WEEKS);

  function toggleTask(taskId: string) {
    setWeeks(
      weeks.map((week) => ({
        ...week,
        tasks: week.tasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        ),
      }))
    );
  }

  const allTasks = weeks.flatMap((w) => w.tasks);
  const completedCount = allTasks.filter((t) => t.completed).length;
  const progressPct = Math.round((completedCount / allTasks.length) * 100);

  return (
    <div className="learning-roadmap-page flex flex-col gap-6">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-success">30-Day Sprint</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Placement Preparation Sprint</h1>
        </div>

        {/* Visual Progress Pill */}
        <div className="flex items-center gap-3">
          <div className="w-28 h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
            <div
              className="h-full bg-[var(--text-primary)] rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="font-mono font-bold text-xs text-[var(--text-primary)]">
            {progressPct}% Done
          </span>
        </div>
      </div>

      {/* ── Weeks Grid (Visual & Concise) ──────────────────────── */}
      <div className="space-y-4">
        {weeks.map((week) => (
          <div key={week.weekNumber} className="card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-[var(--text-muted)]">
                  W0{week.weekNumber}
                </span>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">{week.title}</h2>
              </div>
              <span
                className={`badge text-[9px] ${
                  week.status === 'DONE'
                    ? 'badge-success'
                    : week.status === 'ACTIVE'
                    ? 'badge-mono'
                    : 'badge-info'
                }`}
              >
                {week.status}
              </span>
            </div>

            {/* Tasks */}
            <div className="space-y-1.5">
              {week.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    task.completed
                      ? 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] opacity-70'
                      : 'bg-[var(--bg-surface)] border-[var(--border-default)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="w-3.5 h-3.5 rounded cursor-pointer accent-[var(--text-primary)]"
                    />
                    <span
                      className={`font-medium ${
                        task.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{task.duration}</span>
                    <span className="badge badge-mono text-[9px]">{task.impactTag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
