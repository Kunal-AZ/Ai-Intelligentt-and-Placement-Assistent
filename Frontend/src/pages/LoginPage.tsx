<<<<<<< HEAD
import { FormEvent, useCallback, useState } from 'react';
=======
import { FormEvent, useEffect, useState } from 'react';
>>>>>>> 5ba8bc5f979219befd0b21c404eb98cde05857fb
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { api, setAccessToken } from '../lib/api';
import { ThemeToggle } from '../Components/ThemeToggle';
import { BrandLogo } from '../Components/BrandLogo';
import { GoogleSignIn } from '../Components/GoogleSignIn';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Verification fields & state
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [verificationFirstName, setVerificationFirstName] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [devVerificationCode, setDevVerificationCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const afterGoogleSignIn = useCallback((token: string) => {
    setAccessToken(token);
    navigate((location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard');
  }, [navigate, location.state]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthToken = params.get('oauth_token');
    const oauthError = params.get('error');

    if (oauthToken) {
      setAccessToken(oauthToken);
      const redirectPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';
      navigate(redirectPath, { replace: true });
      return;
    }

    if (oauthError) {
      setError(decodeURIComponent(oauthError));
    }
  }, [location, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  function handleSocialSignIn(provider: 'google' | 'github' | 'linkedin') {
    const apiBase = import.meta.env.VITE_API_URL ?? '/api/v1';
    window.location.href = `${apiBase}/auth/${provider}`;
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setError('');
    setUnverifiedEmail(null);
    setIsLoading(true);

    try {
      const res = await api<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAccessToken(res.accessToken);
      navigate((location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to connect to the authentication server.';
      if (msg.includes('verify your email') || msg.includes('EMAIL_NOT_VERIFIED')) {
        setError('Please verify your email address before signing in.');
        setUnverifiedEmail(email);
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api<{
        requiresVerification?: boolean;
        email?: string;
        accessToken?: string;
        devVerificationCode?: string;
        message?: string;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          firstName,
          lastName,
        }),
      });

      if (res?.requiresVerification) {
        setVerificationEmail(signupEmail);
        setVerificationFirstName(firstName);
        setDevVerificationCode(res.devVerificationCode ?? null);
        setSuccessMessage('A 6-digit verification code has been sent to your email.');
        setResendCooldown(30);
        return;
      }

      if (res?.accessToken) {
        setAccessToken(res.accessToken);
        navigate((location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      if (
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('already registered') ||
        msg.includes('409') ||
        msg.includes('EMAIL_IN_USE')
      ) {
        setError('This email is already registered.');
        setEmail(signupEmail);
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    if (!verificationEmail || !verificationCode) return;
    setError('');
    setIsLoading(true);

    try {
      const res = await api<{ accessToken: string }>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({
          email: verificationEmail,
          code: verificationCode.trim(),
          firstName: verificationFirstName || undefined,
        }),
      });
      setAccessToken(res.accessToken);
      navigate((location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please check your code.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendCode() {
    if (!verificationEmail || resendCooldown > 0) return;
    setError('');
    setIsResending(true);

    try {
      const res = await api<{ devVerificationCode?: string; message?: string }>('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: verificationEmail }),
      });
      setSuccessMessage('A fresh verification code has been sent to your email.');
      setDevVerificationCode(res?.devVerificationCode ?? null);
      setResendCooldown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  }

  async function handleTriggerVerificationForUnverified() {
    if (!unverifiedEmail) return;
    setError('');
    setIsLoading(true);
    try {
      const res = await api<{ devVerificationCode?: string }>('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      setVerificationEmail(unverifiedEmail);
      setDevVerificationCode(res?.devVerificationCode ?? null);
      setSuccessMessage(`A verification code was sent to ${unverifiedEmail}`);
      setResendCooldown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-page min-h-screen w-full flex flex-col items-center bg-[var(--bg-canvas)] text-[var(--text-primary)]">
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
<<<<<<< HEAD
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
            resume claims, identifies skill gaps, and helps you prepare with AI mock interviews.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-subtle)]">
            <div>
              <p className="text-2xl font-black text-[var(--text-primary)]">Resume</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Analysis and feedback</p>
            </div>
            <div>
              <p className="text-2xl font-black text-[var(--text-primary)]">Interview</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Guided practice</p>
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
=======
          {/* Left Side: Product Value & Proof (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <span className="badge badge-mono">Zero Guesswork Placement Engine</span>
>>>>>>> 5ba8bc5f979219befd0b21c404eb98cde05857fb
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Crack top tech placements with verified proof.
            </h1>

<<<<<<< HEAD
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
                      placeholder="Your first name"
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
                      placeholder="Surname "
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
                    placeholder="Min 6 characters"
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

            <GoogleSignIn disabled={isLoading} onSuccess={afterGoogleSignIn} onBusyChange={setIsLoading} />

            <p className="pt-3 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
              Your workspace is private and saved to your account.
=======
            <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed">
              Stop sending unverified resumes into applicant tracking black holes. HiPlacement evaluates your
              real-world code commits, detects high-impact skill gaps, and prepares you with conversational AI mock interviews.
>>>>>>> 5ba8bc5f979219befd0b21c404eb98cde05857fb
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
              {verificationEmail ? (
                /* Verification Step */
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-mono">Email Verification</span>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight">Verify your email address</h2>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      We sent a 6-digit verification code to{' '}
                      <span className="font-semibold text-[var(--text-primary)]">{verificationEmail}</span>. Enter the code below to complete your registration.
                    </p>
                  </div>

                  {devVerificationCode && (
                    <div className="p-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)] font-mono text-[11px]">🔧 Dev Mode Code:</span>
                      <span className="font-mono font-bold text-[var(--accent)] tracking-widest">{devVerificationCode}</span>
                    </div>
                  )}

                  {successMessage && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                      <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{successMessage}</span>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 rounded-lg bg-[var(--status-danger-bg)] border border-[var(--status-danger-border)] text-xs text-[var(--status-danger)] flex items-center gap-2">
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
                    <div className="form-group">
                      <label className="form-label text-center block">Enter 6-Digit Code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="form-input text-center text-2xl tracking-[0.4em] font-mono font-bold py-3 uppercase"
                        autoFocus
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-primary w-full py-2.5"
                      disabled={isLoading || verificationCode.length !== 6}
                    >
                      {isLoading ? 'Verifying Code…' : 'Verify & Enter Workspace ↗'}
                    </button>
                  </form>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationEmail(null);
                        setVerificationCode('');
                        setError('');
                        setSuccessMessage('');
                      }}
                      className="btn-ghost text-xs p-0 hover:underline"
                    >
                      ← Use different email
                    </button>

                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0 || isResending}
                      className={`text-xs font-semibold ${
                        resendCooldown > 0 ? 'text-[var(--text-muted)] cursor-not-allowed' : 'text-[var(--text-primary)] hover:underline cursor-pointer'
                      }`}
                    >
                      {isResending ? 'Resending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal Sign In / Sign Up Card */
                <>
                  {/* Tab switch */}
                  <div className="tab-list">
                    <button
                      type="button"
                      className={`tab-btn ${authMode === 'signin' ? 'is-active' : ''}`}
                      onClick={() => {
                        setAuthMode('signin');
                        setError('');
                        setUnverifiedEmail(null);
                      }}
                    >
                      Sign In to Workspace
                    </button>
                    <button
                      type="button"
                      className={`tab-btn ${authMode === 'signup' ? 'is-active' : ''}`}
                      onClick={() => {
                        setAuthMode('signup');
                        setError('');
                        setUnverifiedEmail(null);
                      }}
                    >
                      Create Account
                    </button>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-[var(--status-danger-bg)] border border-[var(--status-danger-border)] text-xs text-[var(--status-danger)] flex items-center justify-between gap-2">
                      <span>{error}</span>
                      {unverifiedEmail ? (
                        <button
                          type="button"
                          className="underline font-bold text-xs whitespace-nowrap cursor-pointer hover:opacity-80"
                          onClick={handleTriggerVerificationForUnverified}
                        >
                          Verify Email Now →
                        </button>
                      ) : (
                        authMode === 'signup' &&
                        (error.toLowerCase().includes('already') || error.toLowerCase().includes('registered')) && (
                          <button
                            type="button"
                            className="underline font-bold text-xs whitespace-nowrap cursor-pointer hover:opacity-80"
                            onClick={() => {
                              setAuthMode('signin');
                              setEmail(signupEmail);
                              setError('');
                            }}
                          >
                            Sign In Now →
                          </button>
                        )
                      )}
                    </div>
                  )}

                  {/* Social OAuth Actions */}
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSocialSignIn('google')}
                        className="btn-secondary flex items-center justify-center gap-2 py-2.5 text-xs font-semibold cursor-pointer hover:border-[var(--border-strong)] transition-all"
                        title="Sign in with Google"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>Google</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSocialSignIn('github')}
                        className="btn-secondary flex items-center justify-center gap-2 py-2.5 text-xs font-semibold cursor-pointer hover:border-[var(--border-strong)] transition-all"
                        title="Sign in with GitHub"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                          />
                        </svg>
                        <span>GitHub</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSocialSignIn('linkedin')}
                        className="btn-secondary flex items-center justify-center gap-2 py-2.5 text-xs font-semibold cursor-pointer hover:border-[var(--border-strong)] transition-all"
                        title="Sign in with LinkedIn"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="#0A66C2">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.53 1.53 0 1 0 0-3.06 1.53 1.53 0 0 0 0 3.06m1.39 9.74v-8.37H5.07v8.37h2.78z" />
                        </svg>
                        <span>LinkedIn</span>
                      </button>
                    </div>

                    <div className="relative my-1 flex items-center justify-center">
                      <div className="w-full border-t border-[var(--border-subtle)]" />
                      <span className="absolute bg-[var(--bg-elevated)] px-2.5 text-[10px] font-mono tracking-wider uppercase text-[var(--text-muted)]">
                        or continue with email
                      </span>
                    </div>
                  </div>

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
                            placeholder="Your first name"
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
                            placeholder="Surname"
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
                          placeholder="Min 6 characters"
                          className="form-input"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn-primary w-full py-2.5 mt-2"
                        disabled={isLoading || !signupEmail || !signupPassword || !firstName}
                      >
                        {isLoading ? 'Sending verification code…' : 'Create Free Student Account ↗'}
                      </button>
                    </form>
                  )}

                  <p className="pt-3 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
                    Your workspace is private and saved to your account.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
