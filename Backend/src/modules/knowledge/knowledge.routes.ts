import { Router } from 'express';
import { objectIdSchema } from '@placement-assistant/validation';
import { retrieveKnowledge } from '../../ai/rag/retrieval.js';
import { AppError } from '../../utils/app-error.js';
import { enqueueKnowledgeIngestion } from '../../queues/knowledge.queue.js';
import { requireAuthentication, requireRole } from '../auth/auth.middleware.js';
import { KnowledgeDocument } from './knowledge-document.model.js';
import { createKnowledgeDocumentSchema, knowledgeSearchSchema } from './knowledge.schemas.js';

export const knowledgeRouter = Router();
knowledgeRouter.use(requireAuthentication);

knowledgeRouter.post('/search', async (request, response, next) => {
  try {
    const input = knowledgeSearchSchema.parse(request.body);
    const chunks = await retrieveKnowledge(input.query, input.limit);
    response.status(200).json({ success: true, data: { chunks } });
  } catch (error) { next(error); }
});

knowledgeRouter.get('/documents', requireRole('ADMIN'), async (_request, response, next) => {
  try {
    const documents = await KnowledgeDocument.find().sort({ createdAt: -1 }).select('-content').lean();
    response.status(200).json({ success: true, data: { documents } });
  } catch (error) { next(error); }
});

knowledgeRouter.post('/documents', requireRole('ADMIN'), async (request, response, next) => {
  let documentId: string | undefined;
  try {
    const input = createKnowledgeDocumentSchema.parse(request.body);
    const document = await KnowledgeDocument.create({ ...input, createdBy: request.auth!.userId });
    documentId = document._id.toString();
    await enqueueKnowledgeIngestion(documentId);
    response.status(202).json({ success: true, data: { document: { id: document._id, status: document.status } } });
  } catch (error) {
    if (documentId) await KnowledgeDocument.deleteOne({ _id: documentId }).catch(() => undefined);
    next(error);
  }
});

knowledgeRouter.get('/documents/:id', requireRole('ADMIN'), async (request, response, next) => {
  try {
    const document = await KnowledgeDocument.findById(objectIdSchema.parse(request.params.id)).select('-content').lean();
    if (!document) throw new AppError(404, 'KNOWLEDGE_DOCUMENT_NOT_FOUND', 'Knowledge document was not found.');
    response.status(200).json({ success: true, data: { document } });
  } catch (error) { next(error); }
});
