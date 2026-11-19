import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { queueConnection } from '../../config/redis.js';
import { AppError } from '../../utils/app-error.js';

type EmbeddingResponse = { embedding?: { values?: unknown } };

export async function embedText(text: string): Promise<number[]> {
  if (!env.GEMINI_API_KEY) throw new AppError(503, 'GEMINI_NOT_CONFIGURED', 'Gemini is not configured.');
  const cacheKey = `embedding:${env.GEMINI_EMBEDDING_MODEL}:${crypto.createHash('sha256').update(text).digest('hex')}`;
  const cached = await queueConnection.get(cacheKey).catch(() => null);
  if (cached) {
    try {
      const values: unknown = JSON.parse(cached);
      if (Array.isArray(values) && values.length === env.GEMINI_EMBEDDING_DIMENSIONS && values.every(value => typeof value === 'number' && Number.isFinite(value))) return values;
    } catch { /* A corrupt optional cache must not break retrieval. */ }
  }

  const providerResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_EMBEDDING_MODEL)}:embedContent`, {
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({ content: { parts: [{ text }] }, outputDimensionality: env.GEMINI_EMBEDDING_DIMENSIONS }),
  });
  if (!providerResponse.ok) throw new AppError(502, 'EMBEDDING_PROVIDER_FAILED', 'The embedding provider did not return a usable embedding.');
  const payload = await providerResponse.json() as EmbeddingResponse;
  const embedding = payload.embedding?.values;
  if (!Array.isArray(embedding) || embedding.length !== env.GEMINI_EMBEDDING_DIMENSIONS || !embedding.every((value) => typeof value === 'number' && Number.isFinite(value))) {
    throw new AppError(502, 'INVALID_EMBEDDING_RESPONSE', 'The embedding provider returned an invalid vector.');
  }
  await queueConnection.set(cacheKey, JSON.stringify(embedding), 'EX', 60 * 60 * 24).catch(() => undefined);
  return embedding as number[];
}
