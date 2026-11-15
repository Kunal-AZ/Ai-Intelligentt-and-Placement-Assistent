import crypto from 'node:crypto';
import { Queue } from 'bullmq';
import { queueConnection } from '../config/redis.js';

export const workflowQueueName = 'placement-workflow';
export type WorkflowJob = { resumeId: string; userId: string; targetRole?: string };

export const workflowQueue = new Queue<WorkflowJob>(workflowQueueName, {
  connection: queueConnection,
  // A workflow already makes several paid provider calls. Retry explicitly
  // instead of repeating the entire workflow (including quota failures).
  defaultJobOptions: { attempts: 1, removeOnComplete: 100, removeOnFail: 1_000 },
});

export async function enqueueWorkflow(job: WorkflowJob): Promise<void> {
  // BullMQ reserves `:` as an internal key separator, so it cannot appear in
  // a custom job ID. A hyphen keeps each retry/run unique without violating
  // Redis key constraints.
  await workflowQueue.add('run-placement-workflow', job, { jobId: `${job.resumeId}-${crypto.randomUUID()}` });
}
