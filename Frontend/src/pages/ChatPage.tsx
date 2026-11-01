import { FormEvent, useEffect, useRef, useState } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
  citations?: string[];
}

const INITIAL_SUGGESTIONS = [
  'What should I prioritize this week for Tier-1 backend roles?',
  'Review the critical gaps found in my resume ATS scan',
  'How do I explain my BullMQ queue project in a system design interview?',
  'Which matched companies are hiring without DSA rounds?',
];

const INITIAL_HISTORY: ChatMessage[] = [
  {
    id: 'msg-0',
    role: 'ai',
    text: "Hello Kunal. I am your HiPlacement AI Career Coach. I am calibrated against your verified SDE-1 Backend profile, your 88 ATS resume score, and recorded competencies in Redis, Node.js, and MongoDB.\n\nHow can I help accelerate your placement readiness today?",
    timestamp: 'Just now',
    citations: ['Profile: SDE-1 Track', 'Resume ATS: 88/100', 'Evidence: Redis BullMQ'],
  },
];

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_HISTORY);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  function getAiResponse(query: string): { text: string; citations: string[] } {
    const q = query.toLowerCase();

    if (q.includes('prioritize') || q.includes('this week') || q.includes('plan')) {
      return {
        text: "Based on your active 30-day roadmap and SDE-1 calibration, here are your top 2 highest-yield focus areas for this week:\n\n1. **Distributed Caching & Concurrency (XFetch & Mutex Locks)**: Razorpay and Swiggy heavily test this in round 2. Complete the 30-min drill in the Mock Interview studio.\n2. **Kafka Event Streaming Architecture**: You have BullMQ in your profile, but adding Kafka streaming to your resume will boost your match score at top fintech firms by 14%.\n\nWould you like me to generate a 5-step implementation guide for an idempotent Kafka consumer?",
        citations: ['Roadmap: Week 2 Sprint', 'Job Match: Razorpay 94%'],
      };
    }

    if (q.includes('resume') || q.includes('gap') || q.includes('ats')) {
      return {
        text: "Your current resume score is **88/100 (Tier-1 Ready)**. The 2 critical gaps flagged by the parser are:\n\n- **Project #3 Lacks Quantified Metrics**: Add concrete percentage or latency improvements (e.g., 'Reduced cache misses by 38%').\n- **Missing Distributed Tracing Details**: Mention OpenTelemetry or Prometheus metrics to demonstrate production maturity.\n\nOnce updated, re-upload to Resume Studio to push past the 90+ threshold.",
        citations: ['Resume Studio: ATS Audit v4.8'],
      };
    }

    if (q.includes('bullmq') || q.includes('system design') || q.includes('interview')) {
      return {
        text: "When presenting your BullMQ project, follow this 3-step high-impact engineering narrative:\n\n1. **The Bottleneck**: Explain that synchronous resume parsing choked CPU cores, leading to 504 timeouts under sudden campus traffic bursts.\n2. **The Architecture**: You separated the REST gateway from BullMQ worker processes backed by Redis 7 with exponential backoff retries and dead-letter queues.\n3. **The Outcome**: OCR processing latency was cut by 42%, and the gateway maintained a sub-50ms p99 response time.",
        citations: ['Evidence Ledger: BullMQ Queues', 'Mock Interview: Concurrency Drill'],
      };
    }

    return {
      text: "That is a great strategic question. Looking across your verified competencies and target company benchmarks, the fastest way to stand out is by demonstrating production-grade reliability patterns rather than just generic CRUD code.\n\nWould you like to drill into code examples or practice a simulated interview question on this topic?",
      citations: ['HiPlacement Evidence Engine'],
    };
  }

  function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = inputVal.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getAiResponse(text);
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: response.citations,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1000);
  }

  function handleQuickPrompt(promptText: string) {
    setInputVal(promptText);
    inputRef.current?.focus();
  }

  return (
    <div className="chat-page flex flex-col gap-6 max-w-4xl mx-auto h-[calc(100vh-140px)]">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-success">Online &amp; Calibrated</span>
          </div>
          <h1 className="text-xl font-black tracking-tight">AI Career &amp; Placement Coach</h1>
        </div>

        <button
          type="button"
          className="btn-ghost text-xs"
          onClick={() => setMessages(INITIAL_HISTORY)}
        >
          Clear Chat
        </button>
      </div>

      {/* ── Messages Scroll Area ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1.5 ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono px-1">
              <span>{msg.role === 'user' ? 'You' : 'HiPlacement Coach AI'}</span>
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            <div
              className={`p-4 rounded-xl text-xs leading-relaxed max-w-2xl whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-[var(--text-primary)] text-[var(--text-inverse)] font-medium'
                  : 'bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] shadow-sm'
              }`}
            >
              {msg.text}

              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Cited Evidence:
                  </span>
                  {msg.citations.map((c) => (
                    <span key={c} className="badge badge-mono text-[9px]">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] p-2">
            <span className="w-2 h-2 rounded-full bg-[var(--text-primary)] animate-pulse" />
            <span>Consulting candidate evidence dossier…</span>
          </div>
        )}

        <div ref={scrollEndRef} />
      </div>

      {/* ── Quick Suggestions Bar ──────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
        {INITIAL_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleQuickPrompt(s)}
            className="px-3 py-1.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-default)] hover:border-[var(--border-strong)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap transition-all shrink-0"
          >
            {s} ↗
          </button>
        ))}
      </div>

      {/* ── Input Box ──────────────────────────────────────────── */}
      <form onSubmit={handleSend} className="shrink-0 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask anything about your placement preparation, resume, or interview drills…"
          className="form-input text-xs py-3"
          disabled={isTyping}
        />
        <button
          type="submit"
          className="btn-primary py-3 px-5 text-xs"
          disabled={!inputVal.trim() || isTyping}
        >
          <span>Ask Coach</span>
          <span>↗</span>
        </button>
      </form>
    </div>
  );
}
