import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const bucket = supabase.storage.from(env.SUPABASE_STORAGE_BUCKET);

function contentType(extension: 'pdf' | 'docx'): string {
  return extension === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}

export async function storeResume(buffer: Buffer, extension: 'pdf' | 'docx'): Promise<string> {
  const storageKey = `resumes/${crypto.randomUUID()}.${extension}`;
  const { error } = await bucket.upload(storageKey, buffer, {
    cacheControl: 'private, max-age=0',
    contentType: contentType(extension),
    upsert: false,
  });

  if (error) throw new AppError(503, 'RESUME_STORAGE_UNAVAILABLE', 'Your resume could not be uploaded because file storage is unavailable. Please try again later.');
  return storageKey;
}

export async function readResume(storageKey: string): Promise<Buffer> {
  const { data, error } = await bucket.download(storageKey);
  if (error || !data) throw new AppError(503, 'RESUME_STORAGE_UNAVAILABLE', 'Your saved resume could not be read from file storage. Please try again later.');
  return Buffer.from(await data.arrayBuffer());
}

export async function deleteResume(storageKey: string): Promise<void> {
  const { error } = await bucket.remove([storageKey]);
  if (error) throw new AppError(503, 'RESUME_STORAGE_UNAVAILABLE', 'Your resume could not be removed from file storage. Please try again later.');
}
