import { Router } from 'express';
import { objectIdSchema } from '@placement-assistant/validation';
import { orchestrateCareerRequest } from '../../ai/orchestrator/career.orchestrator.js';
import { AppError } from '../../utils/app-error.js';
import { requireAuthentication } from '../auth/auth.middleware.js';
import { AiConversation } from './ai-conversation.model.js';
import { AiMessage } from './ai-message.model.js';
import { createChatMessageSchema, createConversationSchema } from './chat.schemas.js';

export const chatRouter = Router();
chatRouter.use(requireAuthentication);

chatRouter.post('/conversations', async (request, response, next) => {
  try {
    const input = createConversationSchema.parse(request.body);
    const conversation = await AiConversation.create({ userId: request.auth!.userId, title: input.title ?? 'New career conversation' });
    response.status(201).json({ success: true, data: { conversation } });
  } catch (error) { next(error); }
});

chatRouter.get('/conversations', async (request, response, next) => {
  try {
    const conversations = await AiConversation.find({ userId: request.auth!.userId }).sort({ updatedAt: -1 }).lean();
    response.status(200).json({ success: true, data: { conversations } });
  } catch (error) { next(error); }
});

chatRouter.get('/conversations/:id/messages', async (request, response, next) => {
  try {
    const conversationId = objectIdSchema.parse(request.params.id);
    const conversation = await AiConversation.exists({ _id: conversationId, userId: request.auth!.userId });
    if (!conversation) throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Conversation was not found.');
    const messages = await AiMessage.find({ conversationId, userId: request.auth!.userId }).sort({ createdAt: 1 }).lean();
    response.status(200).json({ success: true, data: { messages } });
  } catch (error) { next(error); }
});

chatRouter.post('/conversations/:id/messages', async (request, response, next) => {
  try {
    const conversationId = objectIdSchema.parse(request.params.id);
    const input = createChatMessageSchema.parse(request.body);
    const conversation = await AiConversation.findOne({ _id: conversationId, userId: request.auth!.userId });
    if (!conversation) throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Conversation was not found.');
    const userMessage = await AiMessage.create({ conversationId, userId: request.auth!.userId, role: 'USER', content: input.message, sources: [], agentTrace: [] });
    const result = await orchestrateCareerRequest(request.auth!.userId, input.message);
    const assistantMessage = await AiMessage.create({
      conversationId, userId: request.auth!.userId, role: 'ASSISTANT', content: result.response.answer,
      sources: result.sources.filter(source => result.response.citedSourceIds.includes(source.id)), agentTrace: result.agentTrace,
    });
    await AiConversation.updateOne({ _id: conversationId }, { updatedAt: new Date() });
    response.status(201).json({ success: true, data: { userMessage, assistantMessage, limitations: result.response.limitations, citedSourceIds: result.response.citedSourceIds } });
  } catch (error) { next(error); }
});
