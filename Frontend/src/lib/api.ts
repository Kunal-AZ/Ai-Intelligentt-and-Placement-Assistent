const baseUrl = import.meta.env.VITE_API_URL ?? '/api/v1';
let accessToken: string | null = sessionStorage.getItem('placement_access_token');
export function setAccessToken(token: string | null) { accessToken = token; if (token) sessionStorage.setItem('placement_access_token', token); else sessionStorage.removeItem('placement_access_token'); }
export function hasAccessToken() { return Boolean(accessToken); }
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
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
    const payload = await response.json().catch(() => undefined) as { data?: T; error?: { message?: string } } | undefined;
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
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('We could not reach the application server. Check your connection and try again.', { cause: error });
    }
    throw error;
  }
}
