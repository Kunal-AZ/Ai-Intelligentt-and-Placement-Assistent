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
  WORKFLOW_EXECUTION_ERROR: { status: 502, code: 'AI_WORKFLOW_FAILED', message: 'The AI workflow failed while processing your resume. Your resume is saved. If this persists, the site owner needs to check the AI service logs.' },
  AI_DATABASE_UNAVAILABLE: { status: 503, code: 'AI_DATABASE_UNAVAILABLE', message: 'The AI service cannot access its workflow database. Your resume is saved. The site owner needs to check the AI database connection.' },
  INTERNAL_SERVER_ERROR: { status: 502, code: 'AI_INTERNAL_ERROR', message: 'The AI service encountered an internal error. Your resume is saved. The site owner needs to check the AI service logs.' },
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
      const known = failure?.error_code ? serviceErrors[failure.error_code] : undefined;
      if (known) throw new AppError(known.status, known.code, known.message);
      // These statuses belong to the private service, not the student's session.
      // Forwarding a 401 causes the browser to refresh a valid login needlessly.
      if (response.status === 401 || response.status === 403) {
        throw new AppError(503, 'AI_SERVICE_AUTH_FAILED', 'The API and AI service authentication settings do not match. The site owner needs to check AI_SERVICE_TOKEN on both services. Your resume is saved.');
      }
      if (response.status === 404) {
        throw new AppError(503, 'AI_SERVICE_MISCONFIGURED', 'The AI analysis endpoint was not found. The site owner needs to check AI_SERVICE_URL and the deployed AI service version.');
      }
      if (response.status === 503 && failure?.detail === 'AI service authentication is not configured.') {
        throw new AppError(503, 'AI_SERVICE_AUTH_FAILED', 'Authentication is not configured on the AI service. The site owner needs to set AI_SERVICE_TOKEN. Your resume is saved.');
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
