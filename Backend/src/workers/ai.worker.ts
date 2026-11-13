import { Worker } from 'bullmq';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { connectToDatabase } from '../config/database.js';
import { redisConnection } from '../config/redis.js';
import { Resume } from '../modules/resume/resume.model.js';
import { readResume } from '../modules/resume/resume.storage.js';
import { resumeQueueName, type ResumeProcessingJob } from '../queues/resume.queue.js';
import { knowledgeQueueName, type KnowledgeIngestionJob } from '../queues/knowledge.queue.js';
import { KnowledgeDocument } from '../modules/knowledge/knowledge-document.model.js';
import { KnowledgeChunk } from '../modules/knowledge/knowledge-chunk.model.js';
import { chunkKnowledgeContent } from '../ai/rag/knowledge-base.js';
import { embedText } from '../ai/rag/embeddings.js';
import { resumeAnalysisQueueName, type ResumeAnalysisJob } from '../queues/resume-analysis.queue.js';
import { ResumeAnalysis } from '../modules/resume/resume-analysis.model.js';
import { analyzeResumeText, resumeAgentPromptVersion } from '../ai/agents/resume.agent.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

const maximumExtractedCharacters = 100000;

function normalizeText(value: string): string {
  return value.replaceAll('\0', '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, maximumExtractedCharacters);
}

async function extractText(mimeType: string, file: Buffer): Promise<string> {
  if (mimeType === 'application/pdf') return normalizeText((await pdfParse(file)).text);
  return normalizeText((await mammoth.extractRawText({ buffer: file })).value);
}

async function processResume(job: { data: ResumeProcessingJob }): Promise<void> {
  const resume = await Resume.findById(job.data.resumeId).select('+storageKey');
  if (!resume || resume.userId.toString() !== job.data.userId) return;

  await Resume.updateOne({ _id: resume._id }, { processingStatus: 'PROCESSING', processingErrorCode: undefined });
  try {
    const text = await extractText(resume.mimeType, await readResume(resume.storageKey));
    if (!text) throw new Error('RESUME_TEXT_NOT_EXTRACTABLE');
    await Resume.updateOne({ _id: resume._id }, { processingStatus: 'READY', extractedText: text, processedAt: new Date() });
  } catch (error) {
    const processingErrorCode = error instanceof Error && error.message === 'RESUME_TEXT_NOT_EXTRACTABLE' ? error.message : 'RESUME_EXTRACTION_FAILED';
    await Resume.updateOne({ _id: resume._id }, { processingStatus: 'FAILED', processingErrorCode });
    throw error;
  }
}

async function processKnowledge(job: { data: KnowledgeIngestionJob }): Promise<void> {
  const document = await KnowledgeDocument.findById(job.data.documentId).select('+content');
  if (!document) return;
  await KnowledgeDocument.updateOne({ _id: document._id }, { status: 'PROCESSING', failureCode: undefined });
  try {
    const chunks = chunkKnowledgeContent(document.content);
    if (!chunks.length) throw new Error('KNOWLEDGE_CONTENT_EMPTY');
    const embeddings = await Promise.all(chunks.map((chunk) => embedText(chunk)));
    await KnowledgeChunk.deleteMany({ documentId: document._id });
    await KnowledgeChunk.insertMany(chunks.map((text, ordinal) => ({
      documentId: document._id, ordinal, text, embedding: embeddings[ordinal],
      metadata: { type: document.type, title: document.title, sourceLabel: document.sourceLabel, sourceUrl: document.sourceUrl, tags: document.tags },
    })));
    await KnowledgeDocument.updateOne({ _id: document._id }, { status: 'READY', processedAt: new Date() });
  } catch (error) {
    const failureCode = error instanceof AppError ? error.code : error instanceof Error && error.message === 'KNOWLEDGE_CONTENT_EMPTY' ? error.message : 'KNOWLEDGE_INGESTION_FAILED';
    await KnowledgeDocument.updateOne({ _id: document._id }, { status: 'FAILED', failureCode });
    throw error;
  }
}

async function processResumeAnalysis(job: { data: ResumeAnalysisJob }): Promise<void> {
  const resume = await Resume.findById(job.data.resumeId).select('+extractedText');
  if (!resume || resume.userId.toString() !== job.data.userId || !resume.extractedText) return;
  await Resume.updateOne({ _id: resume._id }, { analysisStatus: 'PROCESSING', analysisErrorCode: undefined });
  try {
    const analysis = await analyzeResumeText(resume.extractedText);
    const storedAnalysis = await ResumeAnalysis.findOneAndUpdate(
      { resumeId: resume._id },
      { $set: { userId: resume.userId, model: env.GEMINI_MODEL, promptVersion: resumeAgentPromptVersion, analysis } },
      { new: true, upsert: true, runValidators: true },
    );
    if (!storedAnalysis) throw new Error('RESUME_ANALYSIS_STORAGE_FAILED');
    await Resume.updateOne({ _id: resume._id }, { analysisStatus: 'READY', latestAnalysisId: storedAnalysis._id });
  } catch (error) {
    const analysisErrorCode = error instanceof AppError ? error.code : 'RESUME_ANALYSIS_FAILED';
    await Resume.updateOne({ _id: resume._id }, { analysisStatus: 'FAILED', analysisErrorCode });
    throw error;
  }
}

async function startWorker(): Promise<void> {
  await connectToDatabase();
  const worker = new Worker<ResumeProcessingJob>(resumeQueueName, processResume, { connection: redisConnection, concurrency: 2 });
  worker.on('error', (error) => console.error('Resume worker error', error));
  const knowledgeWorker = new Worker<KnowledgeIngestionJob>(knowledgeQueueName, processKnowledge, { connection: redisConnection, concurrency: 1 });
  knowledgeWorker.on('error', (error) => console.error('Knowledge worker error', error));
  const resumeAnalysisWorker = new Worker<ResumeAnalysisJob>(resumeAnalysisQueueName, processResumeAnalysis, { connection: redisConnection, concurrency: 1 });
  resumeAnalysisWorker.on('error', (error) => console.error('Resume analysis worker error', error));
}

startWorker().catch((error: unknown) => {
  console.error('Unable to start AI worker', error);
  process.exit(1);
});
