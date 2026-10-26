import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env.js';

const storageRoot = path.resolve(process.cwd(), env.LOCAL_STORAGE_PATH);

function pathForKey(storageKey: string): string {
  const candidate = path.resolve(storageRoot, storageKey);
  if (!candidate.startsWith(`${storageRoot}${path.sep}`)) throw new Error('Invalid storage key');
  return candidate;
}

export async function storeResume(buffer: Buffer, extension: 'pdf' | 'docx'): Promise<string> {
  const storageKey = `resumes/${crypto.randomUUID()}.${extension}`;
  const destination = pathForKey(storageKey);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, buffer, { flag: 'wx', mode: 0o600 });
  return storageKey;
}

export async function readResume(storageKey: string): Promise<Buffer> {
  return fs.readFile(pathForKey(storageKey));
}

export async function deleteResume(storageKey: string): Promise<void> {
  await fs.rm(pathForKey(storageKey), { force: true });
}
