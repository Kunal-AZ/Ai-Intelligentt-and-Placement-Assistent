import { Redis as IORedis } from 'ioredis';
import { env } from './env.js';

export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

// Workers must reconnect indefinitely; HTTP producers must fail promptly.
// Sharing the worker connection left uploads and analysis requests hanging
// forever during a Redis outage.
export const queueConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  connectTimeout: 5_000,
  commandTimeout: 5_000,
  enableOfflineQueue: false,
});
queueConnection.on('error', () => { /* Requests surface a bounded service error. */ });
