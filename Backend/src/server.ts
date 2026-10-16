import { createApp } from './app.js';
import { connectToDatabase } from './config/database.js';
import { env } from './config/env.js';
import { redisConnection } from './config/redis.js';

async function start(): Promise<void> {
  await connectToDatabase();
  await redisConnection.ping();
  const app = createApp();
  app.listen(env.API_PORT, () => console.info(`API listening on port ${env.API_PORT}`));
}

start().catch((error: unknown) => {
  console.error('Unable to start API', error);
  process.exit(1);
});
