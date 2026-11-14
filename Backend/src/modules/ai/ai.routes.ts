import { Router } from 'express';
import { callIpca } from '../../ai/ipca/ipca.client.js';
import { AppError } from '../../utils/app-error.js';
import { requireAuthentication } from '../auth/auth.middleware.js';
import { Resume } from '../resume/resume.model.js';
import { Profile } from '../profile/profile.model.js';
import { profileCompletion } from '../profile/profile-readiness.js';
import { requireResumeAnalysis } from '../resume/resume-readiness.js';
import { getSkillSignals, saveResumeSkills } from '../skills/skill.service.js';
import { careerRequestSchema, interviewEvaluationRequestSchema, interviewQuestionsRequestSchema, workflowRequestSchema } from './ai.schemas.js';

export const aiRouter = Router();
aiRouter.use(requireAuthentication);

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

aiRouter.post('/workflow', async (request, response, next) => {
  try {
    const input = workflowRequestSchema.parse(request.body);
    const profile = await requireCompleteProfile(request.auth!.userId);
    const role = input.targetRole ?? profile.targetRoles[0];
    const studentName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
    const filter = input.resumeId ? { _id: input.resumeId, userId: request.auth!.userId } : { userId: request.auth!.userId };
    const query = Resume.findOne(filter).select('+extractedText');
    if (!input.resumeId) query.sort({ updatedAt: -1 });
    const resume = await query;
    if (!resume) throw new AppError(404, 'RESUME_NOT_FOUND', 'Upload a resume before requesting an AI analysis.');
    if (resume.processingStatus !== 'READY' || !resume.extractedText) throw new AppError(409, 'RESUME_NOT_READY', 'Resume text extraction must finish before AI analysis.');
    const currentSkills = (await getSkillSignals(request.auth!.userId)).map((item) => item.displayName);
    const result = await callIpca<unknown>('/api/v1/ipca/analyze', {
      student_name: studentName,
      resume_text: resume.extractedText,
      target_role: role,
      current_skills: currentSkills,
    });
    // The workflow response is intentionally treated as untrusted external
    // data. Persist only the bounded list of skills that it explicitly
    // returns, and label it as resume evidence rather than a verified level.
    const extractedSkills = result && typeof result === 'object'
      ? (result as { final_report?: { resume_analysis?: { extracted_skills?: unknown } } }).final_report?.resume_analysis?.extracted_skills
      : undefined;
    const skills = Array.isArray(extractedSkills)
      ? extractedSkills.filter((skill): skill is string => typeof skill === 'string' && skill.trim().length > 0).map((skill) => skill.trim())
      : [];
    if (skills.length) await saveResumeSkills(request.auth!.userId, resume._id.toString(), skills);
    await Resume.updateOne(
      { _id: resume._id },
      { workflowReport: result, workflowCompletedAt: new Date(), analysisStatus: 'READY', analysisErrorCode: undefined },
    );
    response.status(200).json({ success: true, data: { result, syncedSkills: skills.length } });
  } catch (error) { next(error); }
});

aiRouter.post('/interview/questions', async (request, response, next) => {
  try {
    const input = interviewQuestionsRequestSchema.parse(request.body);
    const { role, studentName } = await candidateContext(request.auth!.userId, input.targetRole);
    const skills = input.skills ?? (await getSkillSignals(request.auth!.userId)).map((item) => item.displayName);
    if (!skills.length) throw new AppError(400, 'SKILLS_REQUIRED', 'Add at least one skill before generating interview questions.');
    const result = await callIpca<unknown>('/generate-interview-questions', { student_name: studentName, target_role: role, skills, experience_level: input.experienceLevel, difficulty: input.difficulty, question_count: input.questionCount });
    response.status(200).json({ success: true, data: { result } });
  } catch (error) { next(error); }
});

aiRouter.post('/interview/evaluate', async (request, response, next) => {
  try {
    const input = interviewEvaluationRequestSchema.parse(request.body);
    const result = await callIpca<unknown>('/evaluate-interview-answer', { question: input.question, topic: input.topic, expected_answer_points: input.expectedAnswerPoints, student_answer: input.studentAnswer });
    response.status(200).json({ success: true, data: { result } });
  } catch (error) { next(error); }
});

aiRouter.post('/careers', async (request, response, next) => {
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
