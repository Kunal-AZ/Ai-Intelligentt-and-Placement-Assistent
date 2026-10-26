import { FormEvent, useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  'What should I learn first for a backend developer role?',
  'Review the gaps in my resume',
  'Which companies are hiring for my skill set?',
  'Give me a 30-day preparation plan',
];

/* ── AI avatar SVG ─────────────────────────────────── */
function AiAvatar() {
  return (
    <div className="avatar ai-avatar" aria-hidden="true" title="Pathway AI">
      ✦
    </div>
  );
}

/* ── User avatar ────────────────────────────────────── */
function UserAvatar() {
  return (
    <div className="avatar user-avatar" aria-hidden="true" title="You">
      👤
    </div>
  );
}

/* ── Format timestamp ───────────────────────────────── */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function ChatPage() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Auto-scroll to bottom on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* Simulate AI response (replace with actual API/socket call) */
  async function simulateAiResponse(userText: string) {
    setIsTyping(true);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800));

    const aiReply: Message = {
      id: crypto.randomUUID(),
      role: 'ai',
      text: getAiReply(userText),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiReply]);
    setIsTyping(false);
  }

  function getAiReply(question: string): string {
    const q = question.toLowerCase();
    if (q.includes('backend') || q.includes('learn first')) {
      return "Based on your evidence profile, I'd recommend starting with Node.js and Express — they appear in 78% of backend roles that match your current skill set. After that, focus on databases (PostgreSQL or MongoDB) and REST API design patterns.";
    }
    if (q.includes('resume')) {
      return "Your resume hasn't been uploaded yet. Once you upload it via Resume Studio, I can give you specific feedback on structure, keyword density, and ATS compatibility for your target roles.";
    }
    if (q.includes('30-day') || q.includes('plan')) {
      return "A great 30-day plan: Week 1 — upload your resume and record 5 core skills. Week 2 — complete 3 mock interviews. Week 3 — apply to 10 matched jobs. Week 4 — revisit gaps and update your roadmap. Shall I break any week down further?";
    }
    if (q.includes('compan') || q.includes('hiring')) {
      return "I can surface companies hiring for your skills once you've set a target role in your profile. Right now I can see you're interested in this platform — let's set that up first!";
    }
    return "That's a great question! Once your resume and skill evidence are uploaded, I'll be able to give you a much more precise and personalised answer. Would you like to start there?";
  }

  function handleSend(event: FormEvent) {
    event.preventDefault();
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    simulateAiResponse(text);
  }

  function handleSuggestion(suggestion: string) {
    setInputValue(suggestion);
    inputRef.current?.focus();
  }

  return (
    <section className="feature-page chat-page fade-up" aria-labelledby="chat-title">
      <p className="eyebrow">AI Career Coach</p>
      <h2 id="chat-title">Ask from your actual evidence.</h2>
      <p className="feature-description">
        Your coach cites the resume, skills, target roles, and knowledge sources it used —
        no black-box answers, ever.
      </p>

      {/* ── Chat window ─────────────────────────────── */}
      <div
        className="chat-window"
        role="log"
        aria-label="Conversation with Pathway AI"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 && !isTyping ? (
          /* Empty state */
          <div className="chat-empty">
            <div className="chat-empty-icon" aria-hidden="true">✦</div>
            <h3>Start a conversation</h3>
            <p>Ask anything about your career preparation. Try one of these:</p>
            <div className="chat-suggestions" role="list" aria-label="Suggested questions">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  className="chat-suggestion-btn"
                  type="button"
                  role="listitem"
                  onClick={() => handleSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-row ${msg.role}`}
                aria-label={`${msg.role === 'user' ? 'You' : 'Pathway AI'}: ${msg.text}`}
              >
                {msg.role === 'ai' ? <AiAvatar /> : <UserAvatar />}
                <div>
                  <div className={`message-bubble ${msg.role}`}>{msg.text}</div>
                  <p className="message-time" aria-label={`Sent at ${formatTime(msg.timestamp)}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message-row ai" aria-label="Pathway AI is typing">
                <AiAvatar />
                <div className="typing-indicator" role="status" aria-label="AI is composing a response">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* ── Input area ──────────────────────────────── */}
      <form className="chat-input-area" onSubmit={handleSend} aria-label="Send a message">
        <div className="chat-input-wrap">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your career preparation…"
            disabled={isTyping}
            autoComplete="off"
            aria-label="Your message"
            maxLength={500}
          />
        </div>
        <button
          className="btn-primary"
          type="submit"
          disabled={!inputValue.trim() || isTyping}
          aria-label="Send message"
          style={{ padding: '14px 22px', whiteSpace: 'nowrap' }}
        >
          Send <span aria-hidden="true">↗</span>
        </button>
      </form>

      {/* Hint text */}
      <p style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, marginTop: 8 }}>
        Pathway AI references only your uploaded evidence — responses improve as you add more data.
      </p>
    </section>
  );
}
