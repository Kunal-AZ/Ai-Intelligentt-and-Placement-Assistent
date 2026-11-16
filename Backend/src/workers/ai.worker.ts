import { connectToDatabase } from '../config/database.js';
import { registerShutdown } from '../shutdown.js';
import { startWorkers } from './runtime.js';

async function startWorker(): Promise<void> {
  await connectToDatabase();
  const workers = startWorkers();
  registerShutdown(workers);
  console.info('AI workers started');
}

startWorker().catch((error: unknown) => {
  console.error('Unable to start AI worker', error);
  process.exit(1);
});
