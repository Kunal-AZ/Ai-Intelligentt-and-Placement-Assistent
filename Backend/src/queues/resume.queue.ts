import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const resumeQueueName = 'resume-processing';
export type ResumeProcessingJob = { resumeId: string; userId: string };

export const resumeProcessingQueue = new Queue<ResumeProcessingJob>(resumeQueueName, {
  connection: redisConnection,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1000 }, removeOnComplete: 100, removeOnFail: 1000 },
});

export async function enqueueResumeProcessing(job: ResumeProcessingJob): Promise<void> {
  await resumeProcessingQueue.add('extract-resume', job, { jobId: job.resumeId });
}
