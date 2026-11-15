/** Retry one existing resume through the real worker without another upload. */
import { connectToDatabase, disconnectFromDatabase } from '../src/config/database.js';
import { redisConnection, queueConnection } from '../src/config/redis.js';
import { Resume } from '../src/modules/resume/resume.model.js';
import { enqueueWorkflow, workflowQueue } from '../src/queues/workflow.queue.js';

try {
  const id = process.argv[2];
  if (!id || !/^[a-f0-9]{24}$/i.test(id)) throw new Error('Pass the exact resume ID to retry.');
  await connectToDatabase();
  const resume = await Resume.findById(id);
  if (!resume || resume.processingStatus !== 'READY' || resume.workflowStatus !== 'FAILED') throw new Error('Only a saved, extracted resume with a failed workflow may be retried.');
  if (!(await workflowQueue.getWorkers()).length) throw new Error('No workflow worker is connected.');
  await Resume.updateOne({ _id: id }, { $set: { workflowStatus: 'QUEUED' }, $unset: { workflowErrorCode: 1, workflowErrorMessage: 1 } });
  await enqueueWorkflow({ resumeId: id, userId: resume.userId.toString() });
  let previous = '';
  const deadline = Date.now() + 330_000;
  while (Date.now() < deadline) {
    const current = await Resume.findById(id).lean();
    if (current?.workflowStatus !== previous) {
      previous = current?.workflowStatus ?? 'MISSING';
      console.log('Workflow status:', previous);
    }
    if (previous === 'READY') {
      console.log('Report saved:', Boolean(current?.workflowReport), 'Analysis status:', current?.analysisStatus);
      break;
    }
    if (previous === 'FAILED') {
      console.log('Failure code:', current?.workflowErrorCode);
      console.log('User message:', current?.workflowErrorMessage);
      process.exitCode = 1;
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (!['READY', 'FAILED'].includes(previous)) throw new Error('Workflow has not reached a terminal state.');
} finally {
  await workflowQueue.close();
  redisConnection.disconnect();
  queueConnection.disconnect();
  await disconnectFromDatabase();
}
