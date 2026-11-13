import { Router } from 'express';
import { generateInterviewQuestion, evaluateInterviewAnswer } from '../../ai/agents/interview.agent.js';
import { AppError } from '../../utils/app-error.js';
import { requireAuthentication } from '../auth/auth.middleware.js';
import { InterviewResponse } from './interview-response.model.js';
import { InterviewSession } from './interview-session.model.js';
import { createInterviewSchema, interviewAnswerSchema, sessionIdSchema } from './interview.schemas.js';
import { Profile } from '../profile/profile.model.js';

export const interviewRouter = Router();
interviewRouter.use(requireAuthentication);
interviewRouter.get('/', async (request, response, next) => {
  try {
    const sessions = await InterviewSession.find({ userId: request.auth!.userId }).sort({ updatedAt: -1 }).lean();
    const responses = await InterviewResponse.find({ userId: request.auth!.userId }).sort({ updatedAt: -1 }).lean();
    response.status(200).json({ success: true, data: { sessions, responses } });
  } catch (error) { next(error); }
});
interviewRouter.post('/', async (request, response, next) => { try { const input = createInterviewSchema.parse(request.body); const profile = input.role ? undefined : await Profile.findOne({ userId: request.auth!.userId }).lean(); const context = { ...input, role: input.role ?? profile?.targetRoles?.[0] }; const session = await InterviewSession.create({ userId: request.auth!.userId, ...context, currentQuestionNumber: 1 }); const question = await generateInterviewQuestion({ ...context, questionNumber: 1 }); const interviewResponse = await InterviewResponse.create({ sessionId: session._id, userId: request.auth!.userId, questionNumber: 1, question }); response.status(201).json({ success: true, data: { session, question: interviewResponse } }); } catch (error) { next(error); } });
interviewRouter.post('/:id/respond', async (request, response, next) => {
  try {
    const id = sessionIdSchema.parse(request.params.id); const { answer } = interviewAnswerSchema.parse(request.body); const session = await InterviewSession.findOne({ _id: id, userId: request.auth!.userId, status: 'ACTIVE' });
    if (!session) throw new AppError(404, 'INTERVIEW_SESSION_NOT_FOUND', 'Active interview session was not found.');
    const current = await InterviewResponse.findOne({ sessionId: session._id, questionNumber: session.currentQuestionNumber, userId: request.auth!.userId });
    if (!current) throw new AppError(409, 'INTERVIEW_QUESTION_NOT_FOUND', 'No current interview question was found.');
    if (current.answer) throw new AppError(409, 'INTERVIEW_ANSWER_ALREADY_SUBMITTED', 'The current answer has already been submitted.');
    const evaluation = await evaluateInterviewAnswer(current.question.question, answer); await InterviewResponse.updateOne({ _id: current._id }, { answer, evaluation });
    const nextNumber = session.currentQuestionNumber + 1; const nextQuestion = await generateInterviewQuestion({ type: session.type, role: session.role, difficulty: session.difficulty, questionNumber: nextNumber, focus: evaluation.followUpFocus });
    const nextResponse = await InterviewResponse.create({ sessionId: session._id, userId: request.auth!.userId, questionNumber: nextNumber, question: nextQuestion }); await InterviewSession.updateOne({ _id: session._id }, { currentQuestionNumber: nextNumber });
    response.status(200).json({ success: true, data: { evaluation, nextQuestion: nextResponse } });
  } catch (error) { next(error); }
});
interviewRouter.get('/:id', async (request, response, next) => { try { const id = sessionIdSchema.parse(request.params.id); const session = await InterviewSession.findOne({ _id: id, userId: request.auth!.userId }).lean(); if (!session) throw new AppError(404, 'INTERVIEW_SESSION_NOT_FOUND', 'Interview session was not found.'); const responses = await InterviewResponse.find({ sessionId: id, userId: request.auth!.userId }).sort({ questionNumber: 1 }).lean(); response.status(200).json({ success: true, data: { session, responses } }); } catch (error) { next(error); } });
interviewRouter.post('/:id/complete', async (request, response, next) => { try { const id = sessionIdSchema.parse(request.params.id); const session = await InterviewSession.findOneAndUpdate({ _id: id, userId: request.auth!.userId, status: 'ACTIVE' }, { status: 'COMPLETED' }, { new: true }); if (!session) throw new AppError(404, 'INTERVIEW_SESSION_NOT_FOUND', 'Active interview session was not found.'); response.status(200).json({ success: true, data: { session } }); } catch (error) { next(error); } });
