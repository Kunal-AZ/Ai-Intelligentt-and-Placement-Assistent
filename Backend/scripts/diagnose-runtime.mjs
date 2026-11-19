import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

dotenv.config({ path: new URL('../../.env', import.meta.url) });
for (const [name, url] of [
  ['API', 'http://127.0.0.1:4000/api/v1/health'],
  ['Web', 'http://localhost:5173'],
  ['AI', `${process.env.AI_SERVICE_URL}/health`],
]) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    console.log(name, response.status);
  } catch { console.log(name, 'unreachable'); }
}
const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, connectTimeout: 5000, retryStrategy: () => null });
redis.on('error', () => {});
const queue = new Queue('placement-workflow', { connection: redis });
try {
  console.log('Workflow workers', (await queue.getWorkers()).length);
  console.log('Queue counts', await queue.getJobCounts());
  console.log('Recent failures', (await queue.getJobs(['failed'], 0, 3)).map(job => ({ id: job.id, reason: job.failedReason, attempts: job.attemptsMade })));
} finally { await queue.close(); redis.disconnect(); }
try {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DATABASE, serverSelectionTimeoutMS: 5000 });
  console.log('Recent resumes', await mongoose.connection.db.collection('resumes').find({}, {
    projection: { originalFileName: 1, processingStatus: 1, workflowStatus: 1, workflowErrorCode: 1, analysisStatus: 1, updatedAt: 1 },
  }).sort({ createdAt: -1 }).limit(4).toArray());
} finally { await mongoose.disconnect(); }
