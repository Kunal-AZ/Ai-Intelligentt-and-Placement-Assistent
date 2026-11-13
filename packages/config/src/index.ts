import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().max(30).default(7),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().max(20 * 1024 * 1024).default(5 * 1024 * 1024),
  LOCAL_STORAGE_PATH: z.string().min(1).default('./uploads'),
  ATLAS_VECTOR_INDEX: z.string().min(1).default('knowledge_vector_index'),
  GEMINI_API_KEY: z.string().trim().optional().transform((value) => value || undefined),
  GEMINI_MODEL: z.string().min(1).default('gemini-flash-latest'),
  GEMINI_EMBEDDING_MODEL: z.string().min(1).default('gemini-embedding-2'),
  GEMINI_EMBEDDING_DIMENSIONS: z.coerce.number().int().min(128).max(3072).default(1536),
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  AI_SERVICE_TIMEOUT_MS: z.coerce.number().int().positive().max(120_000).default(60_000),
  ADZUNA_APP_ID: z.string().trim().optional().transform((value) => value || undefined),
  ADZUNA_APP_KEY: z.string().trim().optional().transform((value) => value || undefined),
  JOB_FETCH_TIMEOUT_MS: z.coerce.number().int().positive().max(30_000).default(10_000),
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(source: Record<string, string | undefined>): Environment {
  return environmentSchema.parse(source);
}
