import { connectToDatabase } from '../config/database.js';
import { startWorkers } from './runtime.js';

async function startWorker(): Promise<void> {
  await connectToDatabase();
  startWorkers();
  console.info('AI workers started');
}

startWorker().catch((error: unknown) => {
  console.error('Unable to start AI worker', error);
  process.exit(1);
});