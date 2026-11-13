import { FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

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
    text: 'Welcome to HiPlacement AI Career Coach. Complete your profile, resume analysis, and learning activities to receive increasingly personalized guidance.\n\nHow can I help with your placement preparation today?',
    timestamp: 'Just now',
    citations: ['HiPlacement Career Coach'],
  },
];

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_HISTORY);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationId = useRef<string | null>(null);
  const [connectionError, setConnectionError] = useState('');

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    api<{ conversation: { _id: string } }>('/chat/conversations', {
      method: 'POST', body: JSON.stringify({ title: 'Career coaching' }),
    }).then(({ conversation }) => { conversationId.current = conversation._id; })
      .catch((error: unknown) => setConnectionError(error instanceof Error ? error.message : 'Unable to start the AI coach.'));
  }, []);

  async function handleSend(e: FormEvent) {
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

    try {
      if (!conversationId.current) throw new Error('The AI coach is still starting. Please try again in a moment.');
      const result = await api<{ assistantMessage: { content: string; sources?: Array<{ label: string }> } }>(`/chat/conversations/${conversationId.current}/messages`, {
        method: 'POST', body: JSON.stringify({ message: text }),
      });
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        text: result.assistantMessage.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: result.assistantMessage.sources?.map((source) => source.label),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The AI coach could not answer right now.';
      setConnectionError(message);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'ai', text: message, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } finally {
      setIsTyping(false);
    }
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
        {connectionError && <p className="text-xs text-[var(--status-warning)]">{connectionError}</p>}
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
