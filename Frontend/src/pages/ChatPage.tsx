import { FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import '../styles/career-workspace.css';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
  citations?: string[];
}

const INITIAL_SUGGESTIONS = [
  'Help me choose the most important skills to practice this week.',
  'How can I improve my resume with stronger project evidence?',
  'Help me turn a project into a clear interview story.',
  'Create a preparation checklist for my target role.',
];

const INITIAL_HISTORY: ChatMessage[] = [
  {
    id: 'msg-0',
    role: 'ai',
    text: 'Welcome to HiPlacement AI Career Coach. Complete your profile, resume analysis, and learning activities to receive increasingly personalized guidance.\n\nHow can I help with your placement preparation today?',
    timestamp: 'Just now',

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
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(0);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    let active = true;
    setReady(false); setConnectionError(''); conversationId.current = null;
    api<{ conversation: { _id: string } }>('/chat/conversations', {
      method: 'POST', body: JSON.stringify({ title: 'Career coaching' }),
    }).then(({ conversation }) => { if (active) { conversationId.current = conversation._id; setReady(true); } })
      .catch((error: unknown) => { if (active) setConnectionError(error instanceof Error ? error.message : 'Unable to start the AI coach.'); });
    return () => { active = false; };
  }, [session]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = inputVal.trim();
    if (!text || isTyping || !ready) return;
    setConnectionError('');

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
      setConnectionError(message); setInputVal(text);
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
    <div className="chat-page career-workspace coach-workspace flex flex-col gap-5">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="career-hero flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${ready ? 'badge-success' : 'badge-mono'}`}>{ready ? 'Ready to chat' : connectionError ? 'Connection unavailable' : 'Connecting…'}</span>
          </div>
          <h1 className="text-xl font-black tracking-tight">Your career, with a little clarity.</h1><p>Think through your next step with your AI career coach.</p>
        </div>

        <button
          type="button"
          className="btn-ghost text-xs"
          disabled={isTyping} onClick={() => { setMessages(INITIAL_HISTORY); setInputVal(''); setSession((value) => value + 1); }}
        >
          New conversation
        </button>
      </div>

      {/* ── Messages Scroll Area ───────────────────────────────── */}
      <div className="coach-conversation flex-1 overflow-y-auto p-4 sm:p-6 space-y-5" role="log" aria-label="Conversation" aria-live="polite">
        {connectionError && <div className="career-notice" role="alert">{connectionError}{!ready && <button className="btn-secondary ml-3" onClick={() => setSession((value) => value + 1)}>Reconnect</button>}</div>}
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
              className={`p-5 rounded-2xl text-sm leading-relaxed max-w-2xl whitespace-pre-line ${
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
            <span>Thinking through your next steps…</span>
          </div>
        )}

        <div ref={scrollEndRef} />
      </div>

      {/* ── Quick Suggestions Bar ──────────────────────────────── */}
      <div className="coach-prompts shrink-0">
        {INITIAL_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleQuickPrompt(s)}
            className="text-[var(--text-secondary)]"
          >
            {s} ↗
          </button>
        ))}
      </div>

      {/* ── Input Box ──────────────────────────────────────────── */}
      <form onSubmit={handleSend} className="coach-composer shrink-0 flex items-center gap-2">
        <input
          aria-label="Message your career coach"
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
          disabled={!inputVal.trim() || isTyping || !ready}
        >
          <span>Ask Coach</span>
          <span>↗</span>
        </button>
      </form>
    </div>
  );
}
