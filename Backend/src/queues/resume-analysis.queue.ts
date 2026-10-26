import { Queue } from 'bullmq';
import crypto from 'node:crypto';
import { redisConnection } from '../config/redis.js';

export const resumeAnalysisQueueName = 'resume-analysis';
export type ResumeAnalysisJob = { resumeId: string; userId: string };

export const resumeAnalysisQueue = new Queue<ResumeAnalysisJob>(resumeAnalysisQueueName, {
  connection: redisConnection,
  defaultJobOptions: { attempts: 2, backoff: { type: 'exponential', delay: 3000 }, removeOnComplete: 100, removeOnFail: 1000 },
});

export async function enqueueResumeAnalysis(job: ResumeAnalysisJob): Promise<void> {
  await resumeAnalysisQueue.add('analyze-resume', job, { jobId: `${job.resumeId}:${crypto.randomUUID()}` });
}
