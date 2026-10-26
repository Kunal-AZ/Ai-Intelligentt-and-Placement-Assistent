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
  EMBEDDING_API_KEY: z.string().trim().optional().transform((value) => value || undefined),
  EMBEDDING_MODEL: z.string().min(1).default('text-embedding-3-small'),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().max(4096).default(1536),
  ATLAS_VECTOR_INDEX: z.string().min(1).default('knowledge_vector_index'),
  LLM_API_KEY: z.string().trim().optional().transform((value) => value || undefined),
  LLM_MODEL: z.string().min(1).default('gpt-4.1-mini'),
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(source: Record<string, string | undefined>): Environment {
  return environmentSchema.parse(source);
}
