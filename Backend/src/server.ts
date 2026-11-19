import { createApp } from './app.js';
import { connectToDatabase } from './config/database.js';
import { env } from './config/env.js';
import { queueConnection } from './config/redis.js';

async function start(): Promise<void> {
  await connectToDatabase();

  try {
    await queueConnection.ping();
    console.info('Connected to Redis');
  } catch {
    console.warn('Warning: Redis is unreachable. Background queue workers will wait until Redis is online.');
  }

  if (process.env.RUN_WORKER_IN_API === 'true') {
    await import('./workers/ai.worker.js');
    console.info('Background workers enabled in API process');
  }

  const app = createApp();
  app.listen(env.API_PORT, () => console.info(`API listening on port ${env.API_PORT}`));
}

start().catch((error: unknown) => {
  console.error('Unable to start API', error);
  process.exit(1);
});