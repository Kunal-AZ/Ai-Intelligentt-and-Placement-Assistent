const baseUrl = import.meta.env.VITE_API_URL ?? '/api/v1';
let accessToken: string | null = sessionStorage.getItem('placement_access_token');
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) sessionStorage.setItem('placement_access_token', token);
  else sessionStorage.removeItem('placement_access_token');
}

export function hasAccessToken(): boolean {
  return Boolean(accessToken);
}

export async function restoreSession(): Promise<string | null> {
  if (accessToken) return accessToken;
  return refreshAccessToken();
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        setAccessToken(null);
        return null;
      }
      const payload = (await response.json().catch(() => undefined)) as
        | { data?: { accessToken?: string } }
        | undefined;
      const newToken = payload?.data?.accessToken ?? null;
      setAccessToken(newToken);
      return newToken;
    } catch {
      setAccessToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function api<T>(path: string, init: RequestInit = {}, isRetry = false): Promise<T> {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init.headers,
      },
    });

    if (response.status === 401 && !isRetry && !path.startsWith('/auth/')) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return api<T>(path, init, true);
      }
    }

    const payload = await response.json().catch(() => undefined) as { data?: T; error?: { message?: string } } | undefined;
    if (!response.ok) {
      if (payload?.error?.message) throw new Error(payload.error.message);
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        throw new Error('The service is temporarily unavailable. Please try again in a moment.');
      }
      throw new Error(`Request failed (${response.status})`);
    }
    return payload?.data as T;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('We could not reach the application server. Check your connection and try again.', { cause: error });
    }
    throw error;
  }
}
