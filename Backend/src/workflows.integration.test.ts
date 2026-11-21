import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ files: new Map<string, Buffer>(), enqueue: vi.fn(), workflow: vi.fn(), evaluate: vi.fn(), google: vi.fn() }));
vi.mock('google-auth-library', () => ({ OAuth2Client: class { verifyIdToken = mocks.google; } }));
vi.mock('./config/env.js', async () => {
  const { parseEnvironment } = await import('@placement-assistant/config');
  return { env: parseEnvironment({ NODE_ENV: 'test', GOOGLE_CLIENT_ID: 'audit.apps.googleusercontent.com', MONGODB_URI: 'mongodb://127.0.0.1:27028', REDIS_URL: 'redis://127.0.0.1:6388', JWT_SECRET: 'a'.repeat(48), JWT_REFRESH_SECRET: 'b'.repeat(48), AI_SERVICE_TOKEN: 'c'.repeat(48), SUPABASE_URL: 'https://example.test', SUPABASE_SECRET_KEY: 'test-only' }) };
});
vi.mock('./queues/workflow.queue.js', () => ({ workflowQueue: { getWorkers: async () => [{}] }, enqueueWorkflow: mocks.enqueue }));
vi.mock('./queues/resume.queue.js', () => ({ enqueueResumeProcessing: mocks.enqueue }));
vi.mock('./queues/resume-analysis.queue.js', () => ({ enqueueResumeAnalysis: mocks.enqueue }));
vi.mock('./queues/knowledge.queue.js', () => ({ enqueueKnowledgeIngestion: mocks.enqueue }));
vi.mock('./ai/ipca/ipca.client.js', () => ({ callIpca: mocks.workflow }));
vi.mock('./ai/rag/retrieval.js', () => ({ retrieveKnowledge: async () => [] }));
vi.mock('./ai/orchestrator/career.orchestrator.js', () => ({ orchestrateCareerRequest: async () => ({ response: { answer: 'Practice with evidence.', limitations: [], citedSourceIds: [] }, sources: [], agentTrace: [] }) }));
vi.mock('./modules/jobs/live-job.service.js', () => ({ getLiveJobs: async () => ({ jobs: [], providers: [], warnings: ['Test provider unavailable'] }) }));
vi.mock('./ai/agents/interview.agent.js', () => ({ generateInterviewQuestion: async () => ({ question: 'Explain an API.', rubric: ['Correctness'], focusSkills: ['REST APIs'] }), evaluateInterviewAnswer: mocks.evaluate }));
vi.mock('./modules/resume/resume.storage.js', () => ({
  storeResume: async (buffer: Buffer) => { const key = `test-${mocks.files.size}`; mocks.files.set(key, buffer); return key; },
  readResume: async (key: string) => mocks.files.get(key),
  deleteResume: async (key: string) => { mocks.files.delete(key); },
}));
import { createApp } from './app.js';
import { User } from './modules/auth/user.model.js';
import { Resume } from './modules/resume/resume.model.js';
import { SkillEvidence } from './modules/skills/skill-evidence.model.js';
import { runPlacementWorkflow } from './modules/ai/workflow.service.js';

// This suite only writes to a random disposable database on an explicitly supplied URI.
describe.skipIf(!process.env.AUDIT_MONGO_URI)('HTTP workflows with real MongoDB and isolated provider doubles', () => {
  let server: Server;
  let base: string;
  let token = '';
  let userId = '';
  let cookie = '';
  let otherToken = '';
  let resumeId = '';
  const databaseName = `placement_audit_${randomUUID().replaceAll('-', '')}`;
  const evaluation = { technicalAccuracy: 'STRONG', communication: 'PARTIAL', structure: 'STRONG', reasoning: 'STRONG', strengths: ['Clear'], improvements: ['Add detail'], followUpFocus: ['Testing'] };

  async function request(path: string, method = 'GET', body?: unknown, auth = token, refreshCookie?: string) {
    const multipart = body instanceof FormData;
    const response = await fetch(`${base}${path}`, { method, headers: { Origin: 'http://localhost:5173', ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...(refreshCookie ? { Cookie: refreshCookie } : {}), ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}) }, body: body ? multipart ? body : JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15_000) });
    const payload = z.object({ data: z.any().optional(), error: z.any().optional() }).parse(await response.json().catch(() => ({})));
    return { status: response.status, data: payload?.data, error: payload?.error, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  beforeAll(async () => {
    await mongoose.connect(process.env.AUDIT_MONGO_URI!, { dbName: databaseName, serverSelectionTimeoutMS: 5000 });
    await Promise.all(Object.values(mongoose.models).map(model => model.init()));
    server = createApp().listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server.once('listening', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test port');
    base = `http://127.0.0.1:${address.port}/api/v1`;
    mocks.evaluate.mockResolvedValue(evaluation);
    mocks.workflow.mockResolvedValue({ workflow_status: 'completed', final_report: { resume_analysis: { summary: 'Synthetic resume', extracted_skills: ['Python', 'SQL'] } } });
  }, 30_000);
  afterAll(async () => {
    if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    if (mongoose.connection.name === databaseName && databaseName.startsWith('placement_audit_')) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    mocks.files.clear();
  }, 30_000);

  it('registers, normalizes email, persists names, and isolates student data', async () => {
    expect((await request('/health')).status).toBe(200);
    expect((await request('/profile')).status).toBe(401);
    const registered = await request('/auth/register', 'POST', { email: 'Audit@Example.test', password: 'test-password-123', firstName: 'Audit', lastName: 'Student' });
    expect(registered.status).toBe(201);
    token = registered.data.accessToken; userId = registered.data.user.id; cookie = registered.cookie!;
    expect((await request('/profile')).data.profile.lastName).toBe('Student');
    expect((await request('/auth/register', 'POST', { email: 'audit@example.test', password: 'test-password-123' })).status).toBe(409);
    expect((await request('/auth/login', 'POST', { email: 'audit@example.test', password: 'wrong' })).status).toBe(401);
    expect((await request('/auth/login', 'POST', { email: 'audit@example.test', password: 'test-password-123' })).status).toBe(200);
    otherToken = (await request('/auth/register', 'POST', { email: 'other@example.test', password: 'test-password-123' })).data.accessToken;
    expect((await request('/profile', 'PUT', { firstName: 'Audit', college: 'Synthetic University', degree: 'Computing', targetRoles: ['Backend Developer'] })).status).toBe(200);
    expect((await request('/profile', 'PUT', { role: 'ADMIN' })).status).toBe(400);
    expect((await request('/knowledge/documents')).status).toBe(403);
    const application = await request('/applications', 'POST', { company: 'Synthetic Co', role: 'Developer' });
    expect(application.status).toBe(201);
    expect((await request(`/applications/${application.data.application._id}`, 'PATCH', { status: 'APPLIED' }, otherToken)).status).toBe(404);
    expect((await request(`/applications/${application.data.application._id}`, 'PATCH', { status: 'APPLIED' })).data.application.appliedAt).toBeTruthy();
    expect((await request(`/applications/${application.data.application._id}`, 'DELETE')).status).toBe(204);
    expect((await request('/subscription')).data.currentPlan).toBe('FREE');
  }, 30_000);

  it('uploads, extracts, downloads, analyzes, and removes a synthetic resume and its evidence', async () => {
    const pdf = await readFile(new URL('../scripts/fixtures/diagnostic-resume.pdf.txt', import.meta.url));
    const form = new FormData(); form.append('resume', new Blob([new Uint8Array(pdf)], { type: 'application/pdf' }), 'audit.pdf');
    const uploaded = await request('/resumes', 'POST', form);
    expect(uploaded.status).toBe(202); expect(uploaded.data.resume.processingStatus).toBe('READY');
    resumeId = uploaded.data.resume.id;
    expect((await request(`/resumes/${resumeId}`, 'GET', undefined, otherToken)).status).toBe(404);
    const download = await fetch(`${base}/resumes/${resumeId}/download`, { headers: { Authorization: `Bearer ${token}` } });
    expect(Buffer.from(await download.arrayBuffer())).toEqual(pdf);
    expect((await request('/ai/workflow', 'POST', { resumeId })).status).toBe(202);
    await runPlacementWorkflow({ userId, resumeId });
    expect((await request(`/ai/workflow/${resumeId}`)).data.workflowStatus).toBe('READY');
    expect((await request(`/resumes/${resumeId}/analysis`)).data.analysis.analysis.skills).toEqual(['Python', 'SQL']);
    expect((await request('/skills', 'PUT', { skills: [{ name: 'TypeScript', proficiency: 'BEGINNER' }] })).status).toBe(200);
    const gaps = (await request('/skill-gaps')).data.gaps[0].requirements;
    expect(gaps.find((item: { skill: string }) => item.skill === 'SQL').status).toBe('PRESENT');
    expect(gaps.find((item: { skill: string }) => item.skill === 'TypeScript').status).toBe('NEEDS_REINFORCEMENT');
    expect((await request('/careers/analyze', 'POST', {})).status).toBe(200);
    expect((await request('/jobs')).status).toBe(200);
    expect((await request('/jobs/live')).status).toBe(200);
    expect((await request(`/resumes/${resumeId}`, 'DELETE')).status).toBe(204);
    expect(await SkillEvidence.countDocuments({ userId, source: 'RESUME', sourceRef: resumeId })).toBe(0);
    expect((await request('/skill-gaps')).data.gaps[0].requirements.find((item: { skill: string }) => item.skill === 'SQL').status).toBe('MISSING');
    expect(await Resume.exists({ _id: resumeId })).toBeNull();
  }, 30_000);

  it('creates and completes interviews and protects conversation history', async () => {
    const interview = await request('/interviews', 'POST', { type: 'TECHNICAL', role: 'Developer' });
    expect(interview.status).toBe(201);
    const id = interview.data.session._id;
    expect((await request(`/interviews/${id}/respond`, 'POST', { answer: 'An API defines a contract.' }, otherToken)).status).toBe(404);
    expect((await request(`/interviews/${id}/respond`, 'POST', { answer: 'An API defines a contract.' })).data.nextQuestion.questionNumber).toBe(2);
    expect((await request(`/interviews/${id}/complete`, 'POST')).data.session.status).toBe('COMPLETED');
    expect((await request(`/interviews/${id}/respond`, 'POST', { answer: 'More' })).status).toBe(404);
    const conversation = await request('/chat/conversations', 'POST', { title: 'Audit' });
    const conversationId = conversation.data.conversation._id;
    expect((await request(`/chat/conversations/${conversationId}/messages`, 'POST', { message: 'How should I prepare?' })).status).toBe(201);
    expect((await request(`/chat/conversations/${conversationId}/messages`)).data.messages).toHaveLength(2);
    expect((await request(`/chat/conversations/${conversationId}/messages`, 'GET', undefined, otherToken)).status).toBe(404);
  }, 30_000);

  it('enforces admin access, validates identifiers, rotates refresh tokens and revokes logout', async () => {
    await User.updateOne({ _id: userId }, { role: 'ADMIN' });
    token = (await request('/auth/login', 'POST', { email: 'audit@example.test', password: 'test-password-123' })).data.accessToken;
    expect((await request('/knowledge/documents/not-an-id')).status).toBe(400);
    expect((await request('/knowledge/documents', 'POST', { type: 'CAREER', title: 'Audit', content: 'Synthetic career guidance for integration testing only. '.repeat(2), sourceLabel: 'Audit' })).status).toBe(202);
    expect((await request('/knowledge/search', 'POST', { query: 'testing' })).status).toBe(200);
    const company = await request('/jobs/companies', 'POST', { name: 'Audit Co' });
    expect(company.status).toBe(201);
    expect((await request('/jobs', 'POST', { companyId: company.data.company._id, title: 'Developer', description: 'Synthetic developer position for isolated integration testing.', employmentType: 'FULL_TIME', requiredSkills: ['Python'] })).status).toBe(201);
    const rotated = await request('/auth/refresh', 'POST', undefined, '', cookie);
    expect(rotated.status).toBe(200); expect(rotated.cookie).not.toBe(cookie);
    expect((await request('/auth/refresh', 'POST', undefined, '', cookie)).status).toBe(401);
    cookie = rotated.cookie!;
    expect((await request('/auth/logout', 'POST', undefined, '', cookie)).status).toBe(204);
    expect((await request('/auth/refresh', 'POST', undefined, '', cookie)).status).toBe(401);
  }, 30_000);
  it('signs in Google users with a browser challenge and rejects cross-origin or unlinked accounts', async () => {
    expect((await request('/auth/google', 'POST', { credential: 'test' }, '')).status).toBe(401);
    const challenge = await request('/auth/google/nonce', 'GET', undefined, '');
    expect(challenge.status).toBe(200);
    mocks.google.mockResolvedValue({ getPayload: () => ({ sub: 'google-audit-user', email: 'google@example.test', email_verified: true, nonce: challenge.data.nonce, given_name: 'Google', family_name: 'Student' }) });
    const rejected = await fetch(`${base}/auth/google`, { method: 'POST', headers: { Origin: 'https://attacker.example', Cookie: challenge.cookie!, 'Content-Type': 'application/json' }, body: JSON.stringify({ credential: 'test' }) });
    expect(rejected.status).toBe(403);
    const signedIn = await request('/auth/google', 'POST', { credential: 'test' }, '', challenge.cookie);
    expect(signedIn.status).toBe(200);
    expect(signedIn.data.user.role).toBe('STUDENT');
    const googleToken = signedIn.data.accessToken;
    expect((await request('/profile', 'GET', undefined, googleToken)).data.profile.firstName).toBe('Google');
    const again = await request('/auth/google', 'POST', { credential: 'test' }, '', challenge.cookie);
    expect(again.data.user.id).toBe(signedIn.data.user.id);
    expect(await User.countDocuments({ googleSubject: 'google-audit-user' })).toBe(1);
    expect((await request('/auth/login', 'POST', { email: 'google@example.test', password: 'not-a-password' }, '')).status).toBe(401);
    mocks.google.mockResolvedValue({ getPayload: () => ({ sub: 'unlinked-google-sub', email: 'audit@example.test', email_verified: true, nonce: challenge.data.nonce }) });
    expect((await request('/auth/google', 'POST', { credential: 'test' }, '', challenge.cookie)).status).toBe(409);
  }, 30_000);
});
