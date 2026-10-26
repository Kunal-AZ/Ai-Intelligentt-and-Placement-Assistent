import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { redisConnection } from '../../config/redis.js';
import { AppError } from '../../utils/app-error.js';

type EmbeddingResponse = { data?: Array<{ embedding?: unknown }> };

export async function embedText(text: string): Promise<number[]> {
  if (!env.EMBEDDING_API_KEY) throw new AppError(503, 'EMBEDDINGS_NOT_CONFIGURED', 'The embedding provider is not configured.');
  const cacheKey = `embedding:${env.EMBEDDING_MODEL}:${crypto.createHash('sha256').update(text).digest('hex')}`;
  const cached = await redisConnection.get(cacheKey);
  if (cached) return JSON.parse(cached) as number[];

  const providerResponse = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.EMBEDDING_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: env.EMBEDDING_MODEL, input: text, dimensions: env.EMBEDDING_DIMENSIONS }),
  });
  if (!providerResponse.ok) throw new AppError(502, 'EMBEDDING_PROVIDER_FAILED', 'The embedding provider did not return a usable embedding.');
  const payload = await providerResponse.json() as EmbeddingResponse;
  const embedding = payload.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length !== env.EMBEDDING_DIMENSIONS || !embedding.every((value) => typeof value === 'number' && Number.isFinite(value))) {
    throw new AppError(502, 'INVALID_EMBEDDING_RESPONSE', 'The embedding provider returned an invalid vector.');
  }
  await redisConnection.set(cacheKey, JSON.stringify(embedding), 'EX', 60 * 60 * 24);
  return embedding as number[];
}
