import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let client: typeof import('./api');
beforeEach(async () => {
  vi.resetModules();
  const stored = new Map<string, string>();
  vi.stubGlobal('sessionStorage', { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => stored.set(key, value), removeItem: (key: string) => stored.delete(key) });
  client = await import('./api');
  client.setAccessToken('expired-token');
});
afterEach(() => vi.unstubAllGlobals());
const denied = () => Response.json({ error: { message: 'Authentication is required.' } }, { status: 401 });
const session = () => Response.json({ data: { accessToken: 'renewed-token' } });

describe('browser session recovery', () => {
  it('rejects late responses from a previous account instead of caching their data', async () => {
    let finish!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { finish = resolve; })));
    const pending = client.api('/profile');
    const rejection = expect(pending).rejects.toThrow('session has expired or changed');
    client.setAccessToken('other-account');
    finish(Response.json({ data: { private: 'previous account' } }));
    await rejection;
  });
  it('invalidates account caches on logout and login but preserves them on token renewal', async () => {
    const listener = vi.fn();
    const unsubscribe = client.subscribeToSessionChange(listener);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(denied()).mockResolvedValueOnce(session()).mockResolvedValueOnce(Response.json({ data: {} })));
    await client.api('/profile');
    expect(listener).not.toHaveBeenCalled();
    client.setAccessToken(null);
    client.setAccessToken('new-account');
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
  it('refreshes an expired session and retries with the new token', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(denied()).mockResolvedValueOnce(session()).mockResolvedValueOnce(Response.json({ data: { ready: true } }));
    vi.stubGlobal('fetch', fetch);
    await expect(client.api('/profile')).resolves.toEqual({ ready: true });
    expect(fetch.mock.calls[1][0]).toBe('/api/v1/auth/refresh');
    expect(fetch.mock.calls[2][1].headers.get('Authorization')).toBe('Bearer renewed-token');
  });
  it('shares one refresh between concurrent page requests', async () => {
    const fetch = vi.fn(async (url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return session();
      if (new Headers(init.headers).get('Authorization') === 'Bearer expired-token') return denied();
      return Response.json({ data: { ready: true } });
    });
    vi.stubGlobal('fetch', fetch);
    await Promise.all([client.api('/profile'), client.api('/resumes'), client.api('/skills')]);
    expect(fetch.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(1);
  });
  it('clears an invalid session and notifies the route guard', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(denied()).mockResolvedValueOnce(denied()));
    const listener = vi.fn();
    client.subscribeToAuthentication(listener);
    await expect(client.api('/profile')).rejects.toThrow('session has expired');
    expect(client.hasAccessToken()).toBe(false);
    expect(listener).toHaveBeenCalledOnce();
  });
  it('does not refresh failed login requests', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(denied());
    vi.stubGlobal('fetch', fetch);
    await expect(client.api('/auth/login', { method: 'POST' })).rejects.toThrow('Authentication');
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('does not restore a logged-out session from a late refresh response', async () => {
    let finish!: (response: Response) => void;
    const fetch = vi.fn().mockResolvedValueOnce(denied()).mockImplementationOnce(() => new Promise<Response>(resolve => { finish = resolve; }));
    vi.stubGlobal('fetch', fetch);
    const pending = client.api('/profile');
    const rejection = expect(pending).rejects.toThrow('session has expired');
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    client.setAccessToken(null);
    finish(session());
    await rejection;
    expect(client.hasAccessToken()).toBe(false);
  });
  it('preserves multipart boundaries and supports empty successful responses', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    const form = new FormData(); form.append('resume', new Blob(['test']));
    await client.api('/resumes', { method: 'POST', body: form });
    expect(fetch.mock.calls[0][1].headers.has('Content-Type')).toBe(false);
  });
  it('keeps the session on a temporary refresh-service failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(denied()).mockResolvedValueOnce(new Response(null, { status: 503 })));
    await expect(client.api('/profile')).rejects.toThrow('could not be renewed');
    expect(client.hasAccessToken()).toBe(true);
  });
});
