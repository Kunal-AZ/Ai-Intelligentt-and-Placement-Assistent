import crypto from 'node:crypto';
import type { RequestHandler } from 'express';
import { Router } from 'express';
import multer from 'multer';
import { objectIdSchema } from '@placement-assistant/validation';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';
import { enqueueResumeProcessing } from '../../queues/resume.queue.js';
import { enqueueResumeAnalysis } from '../../queues/resume-analysis.queue.js';
import { requireAuthentication } from '../auth/auth.middleware.js';
import { Resume } from './resume.model.js';
import { ResumeAnalysis } from './resume-analysis.model.js';
import { deleteResume, readResume, storeResume } from './resume.storage.js';
import { validateResumeFile } from './resume.validation.js';

export const resumeRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: env.UPLOAD_MAX_BYTES, files: 1, fields: 4 } });

function uploadOne(fieldName: string): RequestHandler {
  return (request, response, next) => upload.single(fieldName)(request, response, next);
}

resumeRouter.use(requireAuthentication);

resumeRouter.post('/', uploadOne('resume'), async (request, response, next) => {
  let storageKey: string | undefined;
  let resumeId: string | undefined;
  try {
    const file = validateResumeFile(request.file);
    storageKey = await storeResume(request.file!.buffer, file.extension);
    const resume = await Resume.create({
      userId: request.auth!.userId,
      originalFileName: file.originalFileName,
      mimeType: file.mimeType,
      sizeBytes: request.file!.size,
      sha256: crypto.createHash('sha256').update(request.file!.buffer).digest('hex'),
      storageKey,
    });
    resumeId = resume._id.toString();
    await enqueueResumeProcessing({ resumeId: resume._id.toString(), userId: request.auth!.userId });
    response.status(202).json({ success: true, data: { resume: { id: resume._id, processingStatus: resume.processingStatus } } });
  } catch (error) {
    if (storageKey) await deleteResume(storageKey).catch(() => undefined);
    if (resumeId) await Resume.deleteOne({ _id: resumeId }).catch(() => undefined);
    next(error);
  }
});

resumeRouter.get('/', async (request, response, next) => {
  try {
    const resumes = await Resume.find({ userId: request.auth!.userId }).sort({ createdAt: -1 }).lean();
    response.status(200).json({ success: true, data: { resumes } });
  } catch (error) { next(error); }
});

resumeRouter.get('/:id', async (request, response, next) => {
  try {
    const id = objectIdSchema.parse(request.params.id);
    const resume = await Resume.findOne({ _id: id, userId: request.auth!.userId }).lean();
    if (!resume) throw new AppError(404, 'RESUME_NOT_FOUND', 'Resume was not found.');
    response.status(200).json({ success: true, data: { resume } });
  } catch (error) { next(error); }
});

resumeRouter.get('/:id/download', async (request, response, next) => {
  try {
    const id = objectIdSchema.parse(request.params.id);
    const resume = await Resume.findOne({ _id: id, userId: request.auth!.userId }).select('+storageKey');
    if (!resume) throw new AppError(404, 'RESUME_NOT_FOUND', 'Resume was not found.');
    const content = await readResume(resume.storageKey);
    response.type(resume.mimeType).attachment(resume.originalFileName).send(content);
  } catch (error) { next(error); }
});

resumeRouter.post('/:id/analyze', async (request, response, next) => {
  try {
    const id = objectIdSchema.parse(request.params.id);
    const resume = await Resume.findOne({ _id: id, userId: request.auth!.userId }).select('+extractedText');
    if (!resume) throw new AppError(404, 'RESUME_NOT_FOUND', 'Resume was not found.');
    if (resume.processingStatus !== 'READY' || !resume.extractedText) throw new AppError(409, 'RESUME_NOT_READY', 'Resume text extraction must complete before analysis.');
    await Resume.updateOne({ _id: resume._id }, { analysisStatus: 'QUEUED', analysisErrorCode: undefined });
    try {
      await enqueueResumeAnalysis({ resumeId: resume._id.toString(), userId: request.auth!.userId });
    } catch (error) {
      await Resume.updateOne({ _id: resume._id }, { analysisStatus: 'FAILED', analysisErrorCode: 'RESUME_ANALYSIS_QUEUE_FAILED' });
      throw error;
    }
    response.status(202).json({ success: true, data: { resume: { id: resume._id, analysisStatus: 'QUEUED' } } });
  } catch (error) { next(error); }
});

resumeRouter.get('/:id/analysis', async (request, response, next) => {
  try {
    const id = objectIdSchema.parse(request.params.id);
    const analysis = await ResumeAnalysis.findOne({ resumeId: id, userId: request.auth!.userId }).lean();
    if (!analysis) throw new AppError(404, 'RESUME_ANALYSIS_NOT_FOUND', 'Resume analysis is not available yet.');
    response.status(200).json({ success: true, data: { analysis } });
  } catch (error) { next(error); }
});
