import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis.js';

/** Queue consumer shell. Resume and AI jobs are added in later phases. */
const worker = new Worker('ai-processing', async () => undefined, { connection: redisConnection });

worker.on('error', (error) => console.error('AI worker error', error));
