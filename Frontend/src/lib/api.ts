const baseUrl = import.meta.env.VITE_API_URL ?? '/api/v1';
let accessToken: string | null = sessionStorage.getItem('placement_access_token');
const authListeners = new Set<() => void>();
const sessionListeners = new Set<() => void>();
let sessionVersion = 0;
let refreshInFlight: Promise<void> | null = null;
export function setAccessToken(token: string | null, renewed = false) {
  accessToken = token;
  if (token) sessionStorage.setItem('placement_access_token', token);
  else sessionStorage.removeItem('placement_access_token');
  if (!renewed) {
    sessionVersion++;
    sessionListeners.forEach(listener => listener());
  }
  authListeners.forEach(listener => listener());
}
export function subscribeToSessionChange(listener: () => void) {
  sessionListeners.add(listener);
  return () => { sessionListeners.delete(listener); };
}
export function subscribeToAuthentication(listener: () => void) {
  authListeners.add(listener);
  return () => { authListeners.delete(listener); };
}
export function hasAccessToken() { return Boolean(accessToken); }

async function refreshSession(): Promise<void> {
  if (!refreshInFlight) {
    const previousToken = accessToken;
    const previousSession = sessionVersion;
    refreshInFlight = (async () => {
      const response = await fetch(`${baseUrl}/auth/refresh`, { method: 'POST', credentials: 'include', signal: AbortSignal.timeout(15_000) });
      const payload = await response.json().catch(() => undefined);
      // Do not resurrect a session if the user signed out or logged in while
      // a previous session's refresh was in flight.
      if (accessToken !== previousToken || sessionVersion !== previousSession) return;
      if (!response.ok) {
        if (response.status === 401) setAccessToken(null);
        throw new Error(response.status === 401 ? 'Your session has expired. Please sign in again.' : 'Your session could not be renewed. Please try again.');
      }
      if (typeof payload?.data?.accessToken !== 'string') throw new Error('The server returned an invalid session response.');
      setAccessToken(payload.data.accessToken, true);
    })().finally(() => { refreshInFlight = null; });
  }
  await refreshInFlight;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const requestSession = sessionVersion;
  const requireSameSession = () => {
    if (requestSession !== sessionVersion) throw new Error('Your session has expired or changed. Please try again.');
  };
  try {
    const send = () => {
      const headers = new Headers(init.headers);
      if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
      if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
      const timeout = AbortSignal.timeout(/^\/(ai|chat|interviews)(?:\/|$)/.test(path) && init.method?.toUpperCase() === 'POST' ? 180_000 : 30_000);
      return fetch(`${baseUrl}${path}`, { ...init, credentials: 'include', headers, signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout });
    };
    const sentToken = accessToken;
    let response = await send();
    requireSameSession();
    if (response.status === 401 && sentToken && !path.startsWith('/auth/')) {
      // A single refresh serves concurrent page requests; late 401 responses
      // reuse the already-renewed token instead of rotating the cookie twice.
      if (sentToken === accessToken) await refreshSession();
      requireSameSession();
      if (!accessToken) throw new Error('Your session has expired. Please sign in again.');
      response = await send();
    }
    requireSameSession();
    if (response.status === 204) return undefined as T;
    const payload = await response.json().catch(() => undefined) as { data?: T; error?: { message?: string } } | undefined;
    requireSameSession();
    if (!response.ok) {
      // A 502/503/504 can be returned by the API when a dependency such as
      // the AI service is unavailable. Preserve its error message instead of
      // incorrectly telling the user that the browser cannot reach the API.
      if (payload?.error?.message) throw new Error(payload.error.message);
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        throw new Error('The service is temporarily unavailable. Please try again in a moment.');
      }
      throw new Error(`Request failed (${response.status})`);
    }
    return payload?.data as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') throw new Error('The server took too long to respond. Please try again.', { cause: error });
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('We could not reach the application server. Check your connection and try again.', { cause: error });
    }
    throw error;
  }
}
