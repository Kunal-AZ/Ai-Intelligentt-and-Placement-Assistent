import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';

interface FastApiError {
  detail?: string | { msg?: string }[];
}

function detailMessage(body: FastApiError | undefined): string {
  if (typeof body?.detail === 'string') return body.detail;
  if (Array.isArray(body?.detail)) return body.detail.map((item) => item.msg).filter(Boolean).join('; ');
  return 'The AI service returned an invalid response.';
}

export async function callIpca<T>(path: string, payload: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.AI_SERVICE_TIMEOUT_MS);
  try {
    const response = await fetch(new URL(path, `${env.AI_SERVICE_URL}/`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => undefined) as T | FastApiError | undefined;
    if (!response.ok) {
      const status = response.status === 422 ? 400 : response.status >= 500 ? 502 : response.status;
      throw new AppError(status, 'AI_SERVICE_FAILED', detailMessage(body as FastApiError | undefined));
    }
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
