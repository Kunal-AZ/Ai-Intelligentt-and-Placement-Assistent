import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { objectIdSchema } from '@placement-assistant/validation';
import { callIpca } from '../../ai/ipca/ipca.client.js';
import { AppError } from '../../utils/app-error.js';
import { requireAuthentication } from '../auth/auth.middleware.js';
import { Resume } from '../resume/resume.model.js';
import { Profile } from '../profile/profile.model.js';
import { profileCompletion } from '../profile/profile-readiness.js';
import { requireResumeAnalysis } from '../resume/resume-readiness.js';
import { getSkillSignals } from '../skills/skill.service.js';
import { careerRequestSchema, interviewEvaluationRequestSchema, interviewQuestionsRequestSchema, workflowRequestSchema } from './ai.schemas.js';
import { enqueueWorkflow, workflowQueue } from '../../queues/workflow.queue.js';

export const aiRouter = Router();
aiRouter.use(requireAuthentication);
const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, error: { code: 'AI_RATE_LIMITED', message: 'Too many AI requests. Please try again later.' } } });

async function candidateContext(userId: string, targetRole?: string) {
  const profile = await Profile.findOne({ userId }).lean();
  const role = targetRole ?? profile?.targetRoles?.[0] ?? 'Software Engineer';
  const studentName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Student';
  return { profile, role, studentName };
}

async function requireCompleteProfile(userId: string) {
  const profile = await Profile.findOne({ userId }).lean();
  if (!profile) throw new AppError(409, 'PROFILE_INCOMPLETE', 'Complete your profile before continuing.');
  const completion = profileCompletion(profile);
  if (!completion.complete) {
    throw new AppError(409, 'PROFILE_INCOMPLETE', `Complete your profile before continuing. Missing: ${completion.missing.join(', ')}.`);
  }
  return profile;
}

aiRouter.post('/workflow', aiLimiter, async (request, response, next) => {
  try {
    const input = workflowRequestSchema.parse(request.body);
    await requireCompleteProfile(request.auth!.userId);
    const filter = input.resumeId ? { _id: input.resumeId, userId: request.auth!.userId } : { userId: request.auth!.userId };
    const query = Resume.findOne(filter).select('+extractedText');
    if (!input.resumeId) query.sort({ updatedAt: -1 });
    const resume = await query;
    if (!resume) throw new AppError(404, 'RESUME_NOT_FOUND', 'Upload a resume before requesting an AI analysis.');
    if (resume.processingStatus !== 'READY' || !resume.extractedText) throw new AppError(409, 'RESUME_NOT_READY', 'Resume text extraction must finish before AI analysis.');
    if (resume.extractedText.length < 50 || resume.extractedText.length > 20000) throw new AppError(400, 'RESUME_TEXT_LENGTH', 'Analysis requires a readable resume containing between 50 and 20,000 characters. Please upload a shorter, text-based resume.');
    if (['QUEUED', 'PROCESSING'].includes(resume.workflowStatus)) {
      response.status(202).json({ success: true, data: { resumeId: resume._id, workflowStatus: resume.workflowStatus } });
      return;
    }
    // BullMQ accepts jobs without a consumer. Without this check the page
    // polls a QUEUED job for minutes when the separate AI worker is down.
    const workers = await workflowQueue.getWorkers().catch(() => { throw new AppError(503, 'WORKFLOW_QUEUE_UNAVAILABLE', 'The analysis queue is temporarily unavailable. Your resume is saved.'); });
    if (!workers.length) {
      throw new AppError(503, 'WORKFLOW_WORKER_UNAVAILABLE', 'The AI analysis worker is not running. Start the worker and try again.');
    }
    const claimed = await Resume.updateOne({ _id: resume._id, workflowStatus: { $nin: ['QUEUED', 'PROCESSING'] } }, { $set: { workflowStatus: 'QUEUED' }, $unset: { workflowErrorCode: 1, workflowErrorMessage: 1 } });
    if (!claimed.modifiedCount) {
      response.status(202).json({ success: true, data: { resumeId: resume._id, workflowStatus: 'QUEUED' } });
      return;
    }
    try {
      await enqueueWorkflow({ resumeId: resume._id.toString(), userId: request.auth!.userId, targetRole: input.targetRole });
    } catch (error) {
      await Resume.updateOne({ _id: resume._id }, { workflowStatus: 'FAILED', workflowErrorCode: 'WORKFLOW_QUEUE_UNAVAILABLE' });
      request.log.error({ err: error }, 'Unable to enqueue placement workflow');
      throw new AppError(503, 'WORKFLOW_QUEUE_UNAVAILABLE', 'The analysis queue is temporarily unavailable. Your uploaded resume is saved.');
    }
    response.status(202).json({ success: true, data: { resumeId: resume._id, workflowStatus: 'QUEUED' } });
  } catch (error) { next(error); }
});

aiRouter.get('/workflow/:resumeId', async (request, response, next) => {
  try {
    const resumeId = objectIdSchema.parse(request.params.resumeId);
    const resume = await Resume.findOne({ _id: resumeId, userId: request.auth!.userId }).lean();
    if (!resume) throw new AppError(404, 'RESUME_NOT_FOUND', 'Resume was not found.');
    response.status(200).json({ success: true, data: { workflowStatus: resume.workflowStatus, workflowErrorCode: resume.workflowErrorCode, workflowErrorMessage: resume.workflowErrorMessage, result: resume.workflowReport } });
  } catch (error) { next(error); }
});

aiRouter.post('/interview/questions', aiLimiter, async (request, response, next) => {
  try {
    const input = interviewQuestionsRequestSchema.parse(request.body);
    const { role, studentName } = await candidateContext(request.auth!.userId, input.targetRole);
    const skills = input.skills ?? (await getSkillSignals(request.auth!.userId)).map((item) => item.displayName);
    if (!skills.length) throw new AppError(400, 'SKILLS_REQUIRED', 'Add at least one skill before generating interview questions.');
    const result = await callIpca<unknown>('/generate-interview-questions', { student_name: studentName, target_role: role, skills, experience_level: input.experienceLevel, difficulty: input.difficulty, question_count: input.questionCount });
    response.status(200).json({ success: true, data: { result } });
  } catch (error) { next(error); }
});

aiRouter.post('/interview/evaluate', aiLimiter, async (request, response, next) => {
  try {
    const input = interviewEvaluationRequestSchema.parse(request.body);
    const result = await callIpca<unknown>('/evaluate-interview-answer', { question: input.question, topic: input.topic, expected_answer_points: input.expectedAnswerPoints, student_answer: input.studentAnswer });
    response.status(200).json({ success: true, data: { result } });
  } catch (error) { next(error); }
});

aiRouter.post('/careers', aiLimiter, async (request, response, next) => {
  try {
    const input = careerRequestSchema.parse(request.body);
    const profile = await requireCompleteProfile(request.auth!.userId);
    await requireResumeAnalysis(request.auth!.userId);
    const studentName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
    const skills = (await getSkillSignals(request.auth!.userId)).map((item) => item.displayName);
    if (!skills.length) throw new AppError(400, 'SKILLS_REQUIRED', 'Add at least one skill before requesting career recommendations.');
    const result = await callIpca<unknown>('/recommend-career', {
      student_name: studentName,
      education: input.education || profile.degree,
      skills,
      interests: input.interests.length ? input.interests : profile.targetRoles,
      projects: input.projects,
      experience_level: input.experienceLevel,
      preferred_work: input.preferredWork || profile.targetRoles[0],
    });
    response.status(200).json({ success: true, data: { result } });
  } catch (error) { next(error); }
});
