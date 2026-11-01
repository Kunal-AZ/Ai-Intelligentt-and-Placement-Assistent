import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setAccessToken } from '../lib/api';
import { ThemeToggle } from '../Components/ThemeToggle';
import { BrandLogo } from '../Components/BrandLogo';

export function LoginPage() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAccessToken(res.accessToken);
      navigate('/dashboard');
    } catch (err) {
      // If server is not running or invalid credentials, provide helpful message but also demo shortcut
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to authentication server. You can also click "Enter as Demo Student" below.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api<{ accessToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          firstName,
        }),
      });
      if (res?.accessToken) {
        setAccessToken(res.accessToken);
      } else {
        setAccessToken('demo-token');
      }
      navigate('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Registration failed. You can also explore directly using "Enter as Demo Student".'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleDemoAccess() {
    setAccessToken('demo_placement_student_session');
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Top utility bar */}
      <div className="w-full border-b border-[var(--border-subtle)] flex justify-center">
        <div className="w-full max-w-7xl flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 group" aria-label="HiPlacement Home">
            <BrandLogo size={28} showText={true} />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/" className="btn-ghost text-xs">
              ← Back to Landing
            </Link>
          </div>
        </div>
      </div>

      {/* Main split grid */}
      <div className="w-full flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 items-center gap-12">
        {/* Left Side: Product Value & Proof (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="badge badge-mono">Zero Guesswork Placement Engine</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Crack top tech placements with verified proof.
          </h1>

          <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed">
            Stop sending unverified resumes into applicant tracking black holes. HiPlacement evaluates your
            real-world code commits, detects high-impact skill gaps, and prepares you with conversational AI mock interviews.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-subtle)]">
            <div>
              <p className="text-2xl font-black text-[var(--text-primary)]">94%</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">ATS Pass Rate</p>
            </div>
            <div>
              <p className="text-2xl font-black text-[var(--text-primary)]">₹24.8 LPA</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Average Tier-1 CTC</p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card (6 cols) */}
        <div className="lg:col-span-6">
          <div className="card-elevated flex flex-col gap-5">
            {/* Tab switch */}
            <div className="tab-list">
              <button
                type="button"
                className={`tab-btn ${authMode === 'signin' ? 'is-active' : ''}`}
                onClick={() => { setAuthMode('signin'); setError(''); }}
              >
                Sign In to Workspace
              </button>
              <button
                type="button"
                className={`tab-btn ${authMode === 'signup' ? 'is-active' : ''}`}
                onClick={() => { setAuthMode('signup'); setError(''); }}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[var(--status-danger-bg)] border border-[var(--status-danger-border)] text-xs text-[var(--status-danger)]">
                {error}
              </div>
            )}

            {authMode === 'signin' ? (
              /* Sign In Form */
              <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">University / Work Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-2.5 mt-2"
                  disabled={isLoading || !email || !password}
                >
                  {isLoading ? 'Authenticating…' : 'Sign In to Workspace ↗'}
                </button>
              </form>
            ) : (
              /* Sign Up Form */
              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Kunal"
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Sharma"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">University Email</label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="student@nit.ac.in"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Create Password</label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="form-input"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-2.5 mt-2"
                  disabled={isLoading || !signupEmail || !signupPassword || !firstName}
                >
                  {isLoading ? 'Creating Account…' : 'Create Free Student Account ↗'}
                </button>
              </form>
            )}

            {/* Quick Demo Access Divider */}
            <div className="flex items-center gap-3 pt-3 border-t border-[var(--border-subtle)]">
              <div className="h-px bg-[var(--border-subtle)] flex-1" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Instant Portfolio &amp; Recruiter Preview
              </span>
              <div className="h-px bg-[var(--border-subtle)] flex-1" />
            </div>

            <button
              type="button"
              className="btn-secondary w-full py-2.5 flex items-center justify-center gap-2"
              onClick={handleDemoAccess}
            >
              <span>✦ Enter as Demo Student (1-Click Launch)</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
