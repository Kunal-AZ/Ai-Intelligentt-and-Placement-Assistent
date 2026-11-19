import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1),
  MONGODB_DATABASE: z.string().min(1).default('placement_assistant'),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().max(30).default(7),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().max(20 * 1024 * 1024).default(5 * 1024 * 1024),
  LOCAL_STORAGE_PATH: z.string().min(1).default('./uploads'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default('resumes'),
  ATLAS_VECTOR_INDEX: z.string().min(1).default('knowledge_vector_index'),
  GEMINI_API_KEY: z.string().trim().optional().transform((value) => value || undefined),
  GEMINI_MODEL: z.string().min(1).default('gemini-flash-latest'),
  GEMINI_FALLBACK_MODEL: z.string().default('gemini-flash-lite-latest'),
  GEMINI_LIVE_MODEL: z.string().min(1).default('gemini-3.8-live'),
  GEMINI_EMBEDDING_MODEL: z.string().min(1).default('gemini-embedding-2'),
  GEMINI_EMBEDDING_DIMENSIONS: z.coerce.number().int().min(128).max(3072).default(1536),
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  AI_SERVICE_TOKEN: z.string().min(32),
  AI_SERVICE_TIMEOUT_MS: z.coerce.number().int().positive().max(600_000).default(300_000),
  ADZUNA_APP_ID: z.string().trim().optional().transform((value) => value || undefined),
  ADZUNA_APP_KEY: z.string().trim().optional().transform((value) => value || undefined),
  JOB_FETCH_TIMEOUT_MS: z.coerce.number().int().positive().max(30_000).default(10_000),
  GOOGLE_CLIENT_ID: z.string().trim().optional().transform((value) => value || undefined),
  GOOGLE_CLIENT_SECRET: z.string().trim().optional().transform((value) => value || undefined),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  GITHUB_CLIENT_ID: z.string().trim().optional().transform((value) => value || undefined),
  GITHUB_CLIENT_SECRET: z.string().trim().optional().transform((value) => value || undefined),
  GITHUB_CALLBACK_URL: z.string().url().optional(),
  LINKEDIN_CLIENT_ID: z.string().trim().optional().transform((value) => value || undefined),
  LINKEDIN_CLIENT_SECRET: z.string().trim().optional().transform((value) => value || undefined),
  LINKEDIN_CALLBACK_URL: z.string().url().optional(),
  SMTP_HOST: z.string().trim().optional().transform((value) => value || undefined),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().trim().optional().transform((value) => value || undefined),
  SMTP_PASS: z.string().trim().optional().transform((value) => value || undefined),
  SMTP_FROM: z.string().trim().default('HiPlacement <no-reply@hiplacement.com>'),
});

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(source: Record<string, string | undefined>): Environment {
  return environmentSchema.parse(source);
}
