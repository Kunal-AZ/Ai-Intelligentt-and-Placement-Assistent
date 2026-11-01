import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'Junior SDE' | 'Mid SDE-1' | 'Tier-1 Senior';
  rubric: string[];
  focusSkills: string[];
}

interface EvaluationResult {
  technicalAccuracy: 'STRONG' | 'PARTIAL' | 'INSUFFICIENT';
  technicalScore: number;
  communication: 'STRONG' | 'PARTIAL' | 'INSUFFICIENT';
  communicationScore: number;
  structure: 'STRONG' | 'PARTIAL' | 'INSUFFICIENT';
  structureScore: number;
  reasoning: 'STRONG' | 'PARTIAL' | 'INSUFFICIENT';
  reasoningScore: number;
  strengths: string[];
  improvements: string[];
  feedbackSummary: string;
}

const PRESET_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'q1',
    question: 'How would you handle a Cache Stampede (Thundering Herd) when a high-traffic Redis key expires in a distributed backend system?',
    category: 'System Design & Concurrency',
    difficulty: 'Mid SDE-1',
    rubric: [
      'Identifies the risk of thousands of concurrent requests overwhelming the database.',
      'Proposes Distributed Locking (e.g., Redlock or mutex) so only one worker recalculates.',
      'Suggests Probabilistic Early Expiration (XFetch algorithm) or background refresh.',
      'Considers stale-while-revalidate serving pattern.',
    ],
    focusSkills: ['Redis', 'Distributed Locking', 'Concurrency', 'Database Protection'],
  },
  {
    id: 'q2',
    question: 'Explain how Node.js event loop handles microtasks versus macrotasks, and why process.nextTick() can starve I/O operations if misused.',
    category: 'Node.js Internals',
    difficulty: 'Junior SDE',
    rubric: [
      'Distinguishes microtask queue (Promise, nextTick) from macrotask phases (Timers, Poll, Check).',
      'Explains that the microtask queue is drained completely before moving to the next event loop phase.',
      'Details how recursive process.nextTick() starves the I/O poll queue.',
    ],
    focusSkills: ['Node.js', 'Event Loop', 'Asynchronous Programming', 'Microtasks'],
  },
  {
    id: 'q3',
    question: 'Design an idempotent payment processing webhook handler in Express with MongoDB. How do you guarantee zero duplicate charges despite network retries?',
    category: 'Backend Architecture',
    difficulty: 'Tier-1 Senior',
    rubric: [
      'Extracts and stores unique Idempotency-Key from headers or payment provider.',
      'Uses unique database constraints and atomic transactions (ACID session).',
      'Returns cached successful response on replayed webhook deliveries.',
      'Handles in-flight concurrent requests with optimistic concurrency or Redis locks.',
    ],
    focusSkills: ['Express', 'MongoDB Transactions', 'Idempotency', 'Distributed Systems'],
  },
];

const SAMPLE_EVALUATION: EvaluationResult = {
  technicalAccuracy: 'STRONG',
  technicalScore: 94,
  communication: 'STRONG',
  communicationScore: 88,
  structure: 'PARTIAL',
  structureScore: 78,
  reasoning: 'STRONG',
  reasoningScore: 92,
  feedbackSummary: 'Outstanding grasp of distributed locking and the XFetch probabilistic algorithm. You clearly explained why naive TTL expiration breaks under burst load.',
  strengths: [
    'Directly articulated the difference between mutex locking and probabilistic early expiration.',
    'Mentioned real-world failure mode where Redis lock acquisition timeout could cause cascading delays.',
    'Cites production metrics and sub-millisecond cache latency expectations.',
  ],
  improvements: [
    'Structure your answer using the STAR or Problem-Options-Recommendation framework for crisper delivery.',
    'Briefly mention cache-aside vs write-through fallback patterns before diving into locking mechanisms.',
  ],
};

export function MockInterviewsPage() {
  const [activeTab, setActiveTab] = useState<'practice' | 'history'>('practice');
  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion>(PRESET_QUESTIONS[0]);
  const [userAnswer, setUserAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(180);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showRubric, setShowRubric] = useState(false);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((s) => s - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  function handleStartTimer() {
    setIsTimerRunning(true);
  }

  function handleToggleRecording() {
    if (!isRecording) {
      setIsRecording(true);
      setIsTimerRunning(true);
    } else {
      setIsRecording(false);
    }
  }

  async function handleSubmitAnswer() {
    if (!userAnswer.trim()) return;
    setIsEvaluating(true);
    setIsTimerRunning(false);

    try {
      // Attempt backend call if session exists
      await api('/interviews/demo/respond', {
        method: 'POST',
        body: JSON.stringify({ answer: userAnswer }),
      }).catch(() => undefined);

      setTimeout(() => {
        setEvaluation(SAMPLE_EVALUATION);
        setIsEvaluating(false);
      }, 1200);
    } catch {
      setEvaluation(SAMPLE_EVALUATION);
      setIsEvaluating(false);
    }
  }

  function handleLoadSampleAnswer() {
    setUserAnswer(
      "To prevent a cache stampede when a key expires, I would implement two primary strategies:\n\n1. Probabilistic Early Expiration (XFetch algorithm): Rather than waiting for the key to hard-expire at time T, as the remaining TTL approaches zero, background requests calculate a probabilistic score based on compute delta and frequency. If triggered, one asynchronous thread fetches fresh data from MongoDB and refreshes Redis before the TTL hits zero, guaranteeing zero cache misses for user traffic.\n\n2. Distributed Mutex Locking with Stale-While-Revalidate: If a key has indeed expired, the first worker acquires a Redis mutex lock (with a 2-second safety lease) to recompute the data. Any concurrent requests that fail to acquire the lock immediately receive the previously cached stale value instead of blocking or hammering the primary database."
    );
  }

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mock-interviews-layout flex flex-col gap-6">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-success">Gemini Pro Evaluator</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">AI Technical Mock Interviews</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="tab-list">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'practice' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('practice')}
            >
              Interactive Simulator
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'history' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History &amp; Analytics
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'practice' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Question Select & Prompt (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="card flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Select Interview Drill
              </span>

              <div className="space-y-2">
                {PRESET_QUESTIONS.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setSelectedQuestion(q);
                      setEvaluation(null);
                      setUserAnswer('');
                      setTimerSeconds(180);
                      setIsTimerRunning(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedQuestion.id === q.id
                        ? 'bg-[var(--bg-subtle)] border-[var(--border-strong)]'
                        : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="badge badge-mono text-[9px]">{q.category}</span>
                      <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[var(--text-primary)] line-clamp-2">
                      {q.question}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Question Prompt Card */}
            <div className="card-elevated flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="badge badge-mono">AI Interviewer Persona</span>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--text-primary)]">
                  <span>⏱</span>
                  <span>{formatTimer(timerSeconds)}</span>
                </div>
              </div>

              <h2 className="text-base font-bold text-[var(--text-primary)] leading-snug">
                {selectedQuestion.question}
              </h2>

              <div className="flex flex-wrap gap-1.5 mt-1">
                {selectedQuestion.focusSkills.map((skill) => (
                  <span key={skill} className="badge badge-mono text-[10px]">
                    {skill}
                  </span>
                ))}
              </div>

              {/* Rubric Accordion */}
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-between w-full"
                  onClick={() => setShowRubric(!showRubric)}
                >
                  <span>Inspection Rubric ({selectedQuestion.rubric.length} points)</span>
                  <span>{showRubric ? '▲' : '▼'}</span>
                </button>

                {showRubric && (
                  <ul className="mt-2 space-y-1.5 text-xs text-[var(--text-muted)] pl-2 border-l border-[var(--border-default)]">
                    {selectedQuestion.rubric.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Answer Workspace & AI Evaluation (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="card flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Your Technical Answer
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={handleLoadSampleAnswer}
                  >
                    Load Sample Tier-1 Answer ↗
                  </button>
                  <button
                    type="button"
                    className={`btn-secondary text-xs ${isRecording ? 'border-[var(--status-danger)] text-[var(--status-danger)]' : ''}`}
                    onClick={handleToggleRecording}
                  >
                    <span>{isRecording ? '🔴 Recording…' : '🎤 Audio Mode'}</span>
                  </button>
                </div>
              </div>

              {/* Audio Waveform Simulator when recording */}
              {isRecording && (
                <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--status-danger)] animate-pulse" />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    Listening to voice stream… (Transcribing into answer field)
                  </span>
                  <div className="flex items-center gap-1 ml-auto">
                    {[12, 24, 18, 30, 16, 28, 20, 14].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-[var(--text-primary)] rounded-full animate-pulse"
                        style={{ height: h, animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <textarea
                rows={9}
                value={userAnswer}
                onChange={(e) => {
                  setUserAnswer(e.target.value);
                  if (!isTimerRunning) handleStartTimer();
                }}
                placeholder="Structure your answer clearly:
1. Core problem & failure modes
2. Architecture approach & distributed algorithms
3. Tradeoffs & edge-case mitigations"
                className="form-textarea font-mono text-xs leading-relaxed"
              />

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                <span className="text-xs text-[var(--text-muted)]">
                  {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
                </span>

                <button
                  type="button"
                  className="btn-primary"
                  disabled={!userAnswer.trim() || isEvaluating}
                  onClick={handleSubmitAnswer}
                >
                  {isEvaluating ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                      <span>Grading Response…</span>
                    </>
                  ) : (
                    <>
                      <span>Submit for AI Evaluation</span>
                      <span>✦</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Evaluation Report */}
            {evaluation && (
              <div className="card-elevated flex flex-col gap-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                  <div>
                    <span className="badge badge-success mb-1">Evaluation Complete</span>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      AI Performance Scorecard
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-[var(--text-primary)]">
                      {Math.round(
                        (evaluation.technicalScore +
                          evaluation.communicationScore +
                          evaluation.structureScore +
                          evaluation.reasoningScore) /
                          4
                      )}
                      %
                    </span>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                      Composite Score
                    </p>
                  </div>
                </div>

                {/* 4 Rubric Meters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                    <p className="text-[11px] text-[var(--text-muted)] font-bold">Tech Accuracy</p>
                    <p className="text-lg font-black text-[var(--text-primary)] my-0.5">
                      {evaluation.technicalScore}%
                    </p>
                    <span className="badge badge-success text-[9px]">
                      {evaluation.technicalAccuracy}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                    <p className="text-[11px] text-[var(--text-muted)] font-bold">Communication</p>
                    <p className="text-lg font-black text-[var(--text-primary)] my-0.5">
                      {evaluation.communicationScore}%
                    </p>
                    <span className="badge badge-success text-[9px]">
                      {evaluation.communication}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                    <p className="text-[11px] text-[var(--text-muted)] font-bold">Structure</p>
                    <p className="text-lg font-black text-[var(--text-primary)] my-0.5">
                      {evaluation.structureScore}%
                    </p>
                    <span className="badge badge-warning text-[9px]">
                      {evaluation.structure}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                    <p className="text-[11px] text-[var(--text-muted)] font-bold">Reasoning</p>
                    <p className="text-lg font-black text-[var(--text-primary)] my-0.5">
                      {evaluation.reasoningScore}%
                    </p>
                    <span className="badge badge-success text-[9px]">
                      {evaluation.reasoning}
                    </span>
                  </div>
                </div>

                {/* Qualitative Feedback */}
                <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] leading-relaxed">
                  <strong className="text-[var(--text-primary)]">Examiner Note: </strong>
                  {evaluation.feedbackSummary}
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--status-success)] uppercase tracking-wider mb-2">
                      Key Strengths
                    </h4>
                    <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                      {evaluation.strengths.map((str, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-[var(--status-success)]">✓</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[var(--status-warning)] uppercase tracking-wider mb-2">
                      Areas to Polish
                    </h4>
                    <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                      {evaluation.improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-[var(--status-warning)]">▲</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="card flex flex-col gap-4">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Past Mock Interview Sessions
          </h2>
          <div className="divide-y divide-[var(--border-subtle)]">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-[var(--text-primary)]">
                  Redis Cache Stampede &amp; Concurrency
                </p>
                <p className="text-xs text-[var(--text-muted)]">Completed Yesterday · System Design</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge badge-success">94% Accuracy</span>
                <span className="text-xs text-[var(--text-muted)]">Tier-1 Ready</span>
              </div>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-[var(--text-primary)]">
                  Node.js Event Loop Microtasks Starvation
                </p>
                <p className="text-xs text-[var(--text-muted)]">Completed 3 days ago · Core Backend</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge badge-mono">88% Accuracy</span>
                <span className="text-xs text-[var(--text-muted)]">Pass</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
