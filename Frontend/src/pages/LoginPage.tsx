import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setAccessToken } from '../lib/api';

/* ── Modern Hero Illustration ─────────────────────── */
function ModernAuthIllustration() {
  return (
    <svg
      viewBox="0 0 420 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: '100%', maxWidth: 400 }}
    >
      {/* Soft Glow */}
      <circle cx="210" cy="170" r="140" fill="url(#auth-glow)" fillOpacity="0.3" className="animate-pulse-slow" />

      {/* Main Glass Card */}
      <g className="animate-float-slow">
        <rect
          x="60"
          y="60"
          width="220"
          height="160"
          rx="16"
          fill="rgba(255, 255, 255, 0.08)"
          stroke="rgba(255, 255, 255, 0.18)"
          strokeWidth="1.5"
        />
        <rect x="80" y="80" width="80" height="24" rx="6" fill="#4f46e5" />
        <text x="94" y="96" fontFamily="sans-serif" fontSize="10" fontWeight="700" fill="#ffffff">
          RESUME AI
        </text>

        {/* Lines */}
        <rect x="80" y="120" width="120" height="7" rx="3.5" fill="rgba(255, 255, 255, 0.7)" />
        <rect x="80" y="136" width="160" height="6" rx="3" fill="rgba(255, 255, 255, 0.35)" />
        <rect x="80" y="150" width="140" height="6" rx="3" fill="rgba(255, 255, 255, 0.35)" />
        <rect x="80" y="164" width="100" height="6" rx="3" fill="rgba(255, 255, 255, 0.35)" />
        <rect x="80" y="178" width="130" height="6" rx="3" fill="rgba(255, 255, 255, 0.35)" />
      </g>

      {/* Overlapping Skills Card */}
      <g transform="translate(200, 110)" className="animate-float-reverse">
        <rect
          width="170"
          height="120"
          rx="14"
          fill="#ffffff"
          stroke="#e2e8f0"
          strokeWidth="1.5"
          filter="drop-shadow(0 10px 20px rgba(0,0,0,0.15))"
        />
        <text x="18" y="28" fontFamily="sans-serif" fontSize="11" fontWeight="700" fill="#0f172a">
          Skill Radar
        </text>
        <rect x="18" y="42" width="134" height="6" rx="3" fill="#f1f5f9" />
        <rect x="18" y="42" width="112" height="6" rx="3" fill="#10b981" />

        <rect x="18" y="60" width="134" height="6" rx="3" fill="#f1f5f9" />
        <rect x="18" y="60" width="88" height="6" rx="3" fill="#6366f1" />

        <rect x="18" y="78" width="134" height="6" rx="3" fill="#f1f5f9" />
        <rect x="18" y="78" width="122" height="6" rx="3" fill="#8b5cf6" />

        <text x="18" y="104" fontFamily="sans-serif" fontSize="9" fontWeight="600" fill="#10b981">
          ✓ 92% Role Match Score
        </text>
      </g>

      <defs>
        <radialGradient id="auth-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(210 170) rotate(90) scale(140)">
          <stop stopColor="#818cf8" />
          <stop offset="1" stopColor="#4f46e5" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await api<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAccessToken(result.accessToken);
      navigate('/dashboard');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-layout relative overflow-hidden">
      {/* Subtle animated background image using hero-network */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-25" aria-hidden="true">
        <img
          src="/hero-network.jpg"
          alt="Auth background"
          className="w-full h-full object-cover animate-bg-pan"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-indigo-950/85 to-slate-950/95" />
      </div>

      {/* ── Left: Hero Intro ─────────────────────────── */}
      <section className="auth-intro relative z-10" aria-label="Product introduction">
        <Link to="/" className="auth-intro-eyebrow transition-transform duration-200 hover:scale-105" style={{ textDecoration: 'none' }}>
          <span>✦</span> Pathway · Modern Career Intelligence
        </Link>

        <h1>
          Make every<br />
          preparation<br />
          <em className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-200 to-cyan-300">hour count.</em>
        </h1>

        <p>
          One private workspace for your resume, skill evidence, career direction,
          and interview practice — all driven by verified data, never guesswork.
        </p>

        <ul className="auth-feature-list" aria-label="Key features">
          <li>
            <span className="check" aria-hidden="true">✓</span>
            AI-powered resume analysis &amp; feedback
          </li>
          <li>
            <span className="check" aria-hidden="true">✓</span>
            Evidence-based skill gap detection
          </li>
          <li>
            <span className="check" aria-hidden="true">✓</span>
            Personalised 30-day learning roadmaps
          </li>
          <li>
            <span className="check" aria-hidden="true">✓</span>
            Real-time conversational mock interviews
          </li>
        </ul>

        <div className="animate-float-slow" style={{ marginTop: 36, maxWidth: 400 }}>
          <ModernAuthIllustration />
        </div>
      </section>

      {/* ── Right: Auth Card ─────────────────────────── */}
      <div className="auth-card relative z-10 transition-all duration-300 hover:shadow-2xl" role="main">
        <div className="auth-card-inner">
          <Link to="/" className="eyebrow" style={{ marginBottom: 12 }}>
            ← Back to Home
          </Link>
          <h2>Sign in to continue</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.92rem' }}>
            Access your private career workspace and live AI tools.
          </p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="form-error" role="alert" style={{ margin: 0 }}>
                <span aria-hidden="true">⚠️</span>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !email || !password}
              style={{ width: '100%', padding: '13px 20px', fontSize: '0.95rem', marginTop: 8 }}
            >
              {isLoading ? (
                <>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#ffffff',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }}
                    aria-hidden="true"
                  />
                  Signing in…
                </>
              ) : (
                <>Sign in to Workspace <span aria-hidden="true">→</span></>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span className="auth-divider-line" />
            <span className="auth-divider-text">or explore workspace</span>
            <span className="auth-divider-line" />
          </div>

          <Link to="/dashboard" className="btn-demo-workspace">
            <span>✦ Launch Demo Workspace Directly</span>
            <span aria-hidden="true">→</span>
          </Link>

          <p className="auth-footer" style={{ marginTop: 20 }}>
            Don't have an account yet?{' '}
            <Link to="/dashboard" className="font-bold text-indigo-600 hover:underline">
              Create student account
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
