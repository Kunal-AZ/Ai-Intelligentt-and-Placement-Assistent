import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const knowledgeQueueName = 'knowledge-ingestion';
export type KnowledgeIngestionJob = { documentId: string };

export const knowledgeIngestionQueue = new Queue<KnowledgeIngestionJob>(knowledgeQueueName, {
  connection: redisConnection,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 100, removeOnFail: 1000 },
});

export async function enqueueKnowledgeIngestion(documentId: string): Promise<void> {
  await knowledgeIngestionQueue.add('ingest-knowledge', { documentId }, { jobId: documentId });
}
