import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../config/env.js', () => ({ env: { AI_SERVICE_URL: 'http://ai.test', AI_SERVICE_TOKEN: 'test-token', AI_SERVICE_TIMEOUT_MS: 1000 } }));
import { callIpca } from './ipca.client.js';

afterEach(() => vi.unstubAllGlobals());

describe('FastAPI error contract', () => {
  it.each([
    [401, 'AI_SERVICE_AUTH_FAILED'],
    [403, 'AI_SERVICE_AUTH_FAILED'],
    [404, 'AI_SERVICE_ENDPOINT_INVALID'],
    [405, 'AI_SERVICE_ENDPOINT_INVALID'],
    [502, 'AI_SERVICE_UNAVAILABLE'],
    [503, 'AI_SERVICE_UNAVAILABLE'],
    [504, 'AI_SERVICE_TIMEOUT'],
  ])('classifies infrastructure HTTP %s without exposing the response body', async (status, code) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('private upstream details', { status })));
    await expect(callIpca('/api/v1/ipca/analyze', {})).rejects.toMatchObject({ code, statusCode: status === 504 ? 504 : 503 });
  });
  it.each([
    ['LLM_QUOTA_EXCEEDED', 429, 'AI_QUOTA_EXCEEDED'],
    ['LLM_AUTH_FAILED', 401, 'AI_PROVIDER_AUTH_FAILED'],
    ['AGENT_TIMEOUT', 504, 'AI_SERVICE_TIMEOUT'],
    ['LLM_API_ERROR', 502, 'AI_PROVIDER_UNAVAILABLE'],
    ['INVALID_AGENT_DATA', 502, 'AI_INVALID_RESPONSE'],
    ['WORKFLOW_EXECUTION_ERROR', 500, 'AI_WORKFLOW_FAILED'],
    ['AI_DATABASE_UNAVAILABLE', 503, 'AI_DATABASE_UNAVAILABLE'],
    ['INTERNAL_SERVER_ERROR', 500, 'AI_INTERNAL_ERROR'],
  ])('preserves %s as an actionable application error', async (error_code, status, code) => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error_code, message: 'Provider account details' }), { status }));
    vi.stubGlobal('fetch', fetch);
    await expect(callIpca('/api/v1/ipca/analyze', {})).rejects.toMatchObject({ code });
    expect(fetch).toHaveBeenCalledOnce();
  });
  it('rejects an empty successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 200 })));
    await expect(callIpca('/api/v1/ipca/analyze', {})).rejects.toMatchObject({ code: 'AI_INVALID_RESPONSE' });
  });
  it.each([401, 403])('does not confuse service authentication (%s) with student authentication', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ detail: 'Unauthorized AI service request.' }, { status })));
    await expect(callIpca('/api/v1/ipca/analyze', {})).rejects.toMatchObject({ statusCode: 503, code: 'AI_SERVICE_AUTH_FAILED' });
  });
  it('identifies a missing internal token configuration', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ detail: 'AI service authentication is not configured.' }, { status: 503 })));
    await expect(callIpca('/api/v1/ipca/analyze', {})).rejects.toMatchObject({ code: 'AI_SERVICE_AUTH_FAILED' });
  });
  it('identifies an incorrect service endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ detail: 'Not Found' }, { status: 404 })));
    await expect(callIpca('/api/v1/ipca/analyze', {})).rejects.toMatchObject({ code: 'AI_SERVICE_MISCONFIGURED' });
  });
  it('accepts a successful JSON response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ workflow_status: 'completed', final_report: {} })));
    await expect(callIpca('/api/v1/ipca/analyze', {})).resolves.toMatchObject({ workflow_status: 'completed' });
  });
});
