import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { loadGoogleIdentity } from '../lib/google-identity';

interface Props {
  disabled: boolean;
  onSuccess: (token: string) => void;
  onBusyChange: (busy: boolean) => void;
}

export function GoogleSignIn({ disabled, onSuccess, onBusyChange }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    const target = container.current;
    async function prepare() {
      try {
        // Obtain the browser-bound nonce before showing the Google button.
        const identity = await loadGoogleIdentity();
        if (cancelled) return;
        const challenge = await api<{ nonce: string }>('/auth/google/nonce');
        if (cancelled || !target) return;
        identity.initialize({
          client_id: clientId!, nonce: challenge.nonce, auto_select: false, ux_mode: 'popup',
          callback: async ({ credential }) => {
            if (cancelled || pending.current) return;
            pending.current = true;
            onBusyChange(true);
            setError('');
            try {
              const result = await api<{ accessToken: string }>('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });
              if (!cancelled) onSuccess(result.accessToken);
            } catch (failure) {
              if (!cancelled) setError(failure instanceof Error ? failure.message : 'Google sign-in failed. Please retry.');
            } finally {
              pending.current = false;
              if (!cancelled) onBusyChange(false);
            }
          },
        });
        identity.renderButton(target, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', width: Math.min(360, target.clientWidth || 280) });
        setLoading(false);
      } catch (failure) {
        if (!cancelled) {
          setError(failure instanceof Error ? failure.message : 'Google sign-in is unavailable.');
          setLoading(false);
        }
      }
    }
    void prepare();
    return () => { cancelled = true; target?.replaceChildren(); };
  }, [clientId, attempt, onSuccess, onBusyChange]);

  if (!clientId) return null;
  return (
    <div className="flex flex-col items-center gap-3 border-t border-[var(--border-subtle)] pt-4">
      <span className="text-xs text-[var(--text-muted)]">Or continue with Google</span>
      {loading && <p role="status" className="text-xs">Loading Google sign-in…</p>}
      <div ref={container} inert={disabled} className="w-full flex justify-center" />
      {error && <div role="alert" className="text-xs text-[var(--status-danger)]">
        <p>{error}</p>
        <button type="button" className="underline mt-2" disabled={disabled} onClick={() => { setError(''); setLoading(true); setAttempt(value => value + 1); }}>Retry Google sign-in</button>
      </div>}
    </div>
  );
}
