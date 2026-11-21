import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';

interface FastApiError {
  detail?: string | { msg?: string }[];
  message?: string;
  error_code?: string;
}

function detailMessage(body: FastApiError | undefined): string {
  if (typeof body?.message === 'string') return body.message;
  if (typeof body?.detail === 'string') return body.detail;
  if (Array.isArray(body?.detail)) return body.detail.map((item) => item.msg).filter(Boolean).join('; ');
  return 'The AI service returned an invalid response.';
}

// Only expose known operational messages; raw provider errors can include
// account information and do not tell a student how to proceed.
const serviceErrors: Record<string, { status: number; code: string; message: string }> = {
  LLM_QUOTA_EXCEEDED: { status: 429, code: 'AI_QUOTA_EXCEEDED', message: 'The AI provider quota has been exhausted. Analysis is unavailable until the quota resets or the site owner updates the provider plan. Your uploaded resume is saved.' },
  LLM_AUTH_FAILED: { status: 503, code: 'AI_PROVIDER_AUTH_FAILED', message: 'The AI provider credentials need attention from the site owner.' },
  AGENT_TIMEOUT: { status: 504, code: 'AI_SERVICE_TIMEOUT', message: 'The AI provider took too long to respond. Your resume is saved; try the analysis again later.' },
  LLM_API_ERROR: { status: 503, code: 'AI_PROVIDER_UNAVAILABLE', message: 'The AI provider is overloaded or temporarily unavailable. Your resume is saved; try again later.' },
  INVALID_AGENT_DATA: { status: 502, code: 'AI_INVALID_RESPONSE', message: 'The AI provider returned an incomplete analysis. Your resume is saved; try again later.' },
};

export async function callIpca<T>(path: string, payload: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.AI_SERVICE_TIMEOUT_MS);
  try {
    const response = await fetch(new URL(path, `${env.AI_SERVICE_URL}/`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-ai-service-token': env.AI_SERVICE_TOKEN },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => undefined) as T | FastApiError | undefined;
    if (!response.ok) {
      const failure = body as FastApiError | undefined;
      // Log only bounded metadata: response bodies may contain resume text or credentials.
      console.error('AI service request failed', { path, status: response.status, errorCode: typeof failure?.error_code === 'string' && /^[A-Z0-9_]{1,64}$/.test(failure.error_code) ? failure.error_code : undefined });
      const known = failure?.error_code ? serviceErrors[failure.error_code] : undefined;
      if (known) throw new AppError(known.status, known.code, known.message);
      if (response.status === 401 || response.status === 403) {
        throw new AppError(503, 'AI_SERVICE_AUTH_FAILED', 'The AI service connection needs attention from the site owner. Your uploaded resume is saved.');
      }
      if (response.status === 404 || response.status === 405) {
        throw new AppError(503, 'AI_SERVICE_ENDPOINT_INVALID', 'The AI service address needs attention from the site owner. Your uploaded resume is saved.');
      }
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        throw new AppError(response.status === 504 ? 504 : 503, response.status === 504 ? 'AI_SERVICE_TIMEOUT' : 'AI_SERVICE_UNAVAILABLE', 'The AI service is temporarily unavailable. Your uploaded resume is saved; try the analysis again later.');
      }
      const status = response.status === 422 ? 400 : response.status >= 500 ? 502 : response.status;
      throw new AppError(status, 'AI_SERVICE_FAILED', response.status === 422 ? detailMessage(failure) : 'The AI service could not complete the request. Please try again later.');
    }
    if (!body || typeof body !== 'object') throw new AppError(502, 'AI_INVALID_RESPONSE', 'The AI service returned an empty or invalid response.');
    return body as T;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AppError(504, 'AI_SERVICE_TIMEOUT', 'The AI service took too long to respond. Please try again.');
    }
    throw new AppError(503, 'AI_SERVICE_UNAVAILABLE', 'The AI service is unavailable. Please try again later.');
  } finally {
    clearTimeout(timeout);
  }
}
