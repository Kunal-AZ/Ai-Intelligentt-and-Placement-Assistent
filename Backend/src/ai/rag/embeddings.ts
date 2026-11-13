import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { redisConnection } from '../../config/redis.js';
import { AppError } from '../../utils/app-error.js';

type EmbeddingResponse = { embedding?: { values?: unknown } };

export async function embedText(text: string): Promise<number[]> {
  if (!env.GEMINI_API_KEY) throw new AppError(503, 'GEMINI_NOT_CONFIGURED', 'Gemini is not configured.');
  const cacheKey = `embedding:${env.GEMINI_EMBEDDING_MODEL}:${crypto.createHash('sha256').update(text).digest('hex')}`;
  const cached = await redisConnection.get(cacheKey);
  if (cached) return JSON.parse(cached) as number[];

  const providerResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_EMBEDDING_MODEL)}:embedContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({ content: { parts: [{ text }] }, outputDimensionality: env.GEMINI_EMBEDDING_DIMENSIONS }),
  });
  if (!providerResponse.ok) throw new AppError(502, 'EMBEDDING_PROVIDER_FAILED', 'The embedding provider did not return a usable embedding.');
  const payload = await providerResponse.json() as EmbeddingResponse;
  const embedding = payload.embedding?.values;
  if (!Array.isArray(embedding) || embedding.length !== env.GEMINI_EMBEDDING_DIMENSIONS || !embedding.every((value) => typeof value === 'number' && Number.isFinite(value))) {
    throw new AppError(502, 'INVALID_EMBEDDING_RESPONSE', 'The embedding provider returned an invalid vector.');
  }
  await redisConnection.set(cacheKey, JSON.stringify(embedding), 'EX', 60 * 60 * 24);
  return embedding as number[];
}
