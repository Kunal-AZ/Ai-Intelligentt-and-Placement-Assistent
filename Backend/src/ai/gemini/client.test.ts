import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../config/env.js', () => ({ env: { GEMINI_API_KEY: 'test-key', GEMINI_MODEL: 'primary', GEMINI_FALLBACK_MODEL: 'fallback' } }));
beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());
const success = () => Response.json({ candidates: [{ content: { parts: [{ text: '{"answer":"fixture"}' }] } }] });

describe('shared Gemini client', () => {
  it.each([[429, 'AI_QUOTA_EXCEEDED'], [403, 'AI_PROVIDER_AUTH_FAILED']])('does not retry HTTP %s', async (status, code) => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status }));
    vi.stubGlobal('fetch', fetch);
    const { generateGeminiJson } = await import('./client.js');
    await expect(generateGeminiJson('Test', 'Test')).rejects.toMatchObject({ code });
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('recovers from overload using one fallback', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 503 })).mockResolvedValueOnce(success());
    vi.stubGlobal('fetch', fetch);
    const { generateGeminiJson } = await import('./client.js');
    await expect(generateGeminiJson('Test', 'Test')).resolves.toBe('{"answer":"fixture"}');
    expect(fetch.mock.calls[1][0]).toContain('/fallback:generateContent');
    expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
  it('bounds provider timeouts to two attempts', async () => {
    const fetch = vi.fn().mockRejectedValue(new DOMException('Timed out', 'TimeoutError'));
    vi.stubGlobal('fetch', fetch);
    const { generateGeminiJson } = await import('./client.js');
    await expect(generateGeminiJson('Test', 'Test')).rejects.toMatchObject({ code: 'AI_SERVICE_TIMEOUT' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
