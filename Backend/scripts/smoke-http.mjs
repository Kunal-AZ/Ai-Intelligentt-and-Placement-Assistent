// Real HTTP smoke checks with a temporary, isolated diagnostic account.
// Only that account's profile/tokens/account are cleaned up in finally.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';

dotenv.config({ path: new URL('../../.env', import.meta.url) });
const base = 'http://127.0.0.1:4000/api/v1';
const email = `diagnostic-${crypto.randomUUID()}@example.test`;
let token;
let cookie;
let userId;
let resumeId;

// A synthetic one-page PDF exercises storage and extraction without using
// anyone's resume or calling an AI provider.
function fixturePdf() {
  return readFileSync(new URL('./fixtures/diagnostic-resume.pdf.txt', import.meta.url));
}

async function request(path, method = 'GET', body, expected = 200) {
  const multipart = body instanceof FormData;
  const response = await fetch(`${base}${path}`, {
    method, signal: AbortSignal.timeout(15_000),
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => undefined);
  assert.equal(response.status, expected, `${method} ${path}: ${payload?.error?.code ?? response.status}`);
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  console.log('PASS', method, path, response.status);
  return payload?.data;
}
try {
  await request('/health');
  await request('/profile', 'GET', undefined, 401);
  const account = await request('/auth/register', 'POST', { email, password: crypto.randomBytes(24).toString('base64url'), firstName: 'Diagnostic' }, 201);
  userId = account.user.id;
  token = account.accessToken;
  await request('/profile', 'PUT', { firstName: 'Diagnostic', college: 'Test University', degree: 'Computer Science', targetRoles: ['Backend Developer'] });
  for (const path of ['/profile', '/resumes', '/skills', '/skill-gaps', '/careers', '/applications', '/interviews', '/chat/conversations', '/subscription']) await request(path);
  await request('/jobs');
  const pdf = fixturePdf();
  const upload = new FormData();
  upload.append('resume', new Blob([pdf], { type: 'application/pdf' }), 'diagnostic-fixture.pdf');
  const uploaded = await request('/resumes', 'POST', upload, 202);
  resumeId = uploaded.resume.id;
  assert.equal(uploaded.resume.processingStatus, 'READY', 'Synthetic PDF text must extract successfully');
  const saved = await request(`/resumes/${resumeId}`);
  assert.equal(saved.resume.originalFileName, 'diagnostic-fixture.pdf');
  const downloaded = await fetch(`${base}/resumes/${resumeId}/download`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) });
  assert.equal(downloaded.status, 200);
  assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), pdf);
  console.log('PASS resume upload, text extraction, storage and exact download');
  await request(`/resumes/${resumeId}`, 'DELETE', undefined, 204);
  resumeId = undefined;
  const oldCookie = cookie;
  const renewed = await request('/auth/refresh', 'POST');
  assert.notEqual(cookie, oldCookie, 'Refresh cookie must rotate');
  token = renewed.accessToken;
  await request('/profile');
  await request('/auth/logout', 'POST', undefined, 204);
  await request('/auth/refresh', 'POST', undefined, 401);
} finally {
  if (resumeId) await request(`/resumes/${resumeId}`, 'DELETE', undefined, 204);
  if (userId) {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE, serverSelectionTimeoutMS: 5000 });
    const db = mongoose.connection.db;
    const id = new mongoose.Types.ObjectId(userId);
    if (await db.collection('users').findOne({ _id: id, email })) {
      await db.collection('profiles').deleteOne({ userId: id });
      await db.collection('refreshtokens').deleteMany({ userId: id });
      await db.collection('users').deleteOne({ _id: id, email });
      console.log('Removed only this run’s temporary diagnostic account and its profile/session tokens.');
    }
    await mongoose.disconnect();
  }
}
