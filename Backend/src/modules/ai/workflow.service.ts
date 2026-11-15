import { callIpca } from '../../ai/ipca/ipca.client.js';
import { Resume } from '../resume/resume.model.js';
import { Profile } from '../profile/profile.model.js';
import { getSkillSignals, saveResumeSkills } from '../skills/skill.service.js';
import type { WorkflowJob } from '../../queues/workflow.queue.js';
import { AppError } from '../../utils/app-error.js';
import { UnrecoverableError } from 'bullmq';
import { ResumeAnalysis } from '../resume/resume-analysis.model.js';
import { workflowResultSchema, toStoredResumeAnalysis } from './workflow-analysis.js';

export async function runPlacementWorkflow(job: WorkflowJob): Promise<void> {
  const resume = await Resume.findOne({ _id: job.resumeId, userId: job.userId }).select('+extractedText');
  if (!resume) return;
  try {
    if (resume.processingStatus !== 'READY' || !resume.extractedText) throw new AppError(409, 'RESUME_NOT_READY', 'Resume text extraction must finish before analysis.');
    const profile = await Profile.findOne({ userId: job.userId }).lean();
    if (!profile) throw new AppError(409, 'PROFILE_INCOMPLETE', 'Complete your profile before analysis.');
    await Resume.updateOne({ _id: resume._id }, { $set: { workflowStatus: 'PROCESSING' }, $unset: { workflowErrorCode: 1, workflowErrorMessage: 1 } });
    const role = job.targetRole ?? profile.targetRoles[0] ?? 'Software Engineer';
    const studentName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Student';
    const currentSkills = (await getSkillSignals(job.userId)).map((item) => item.displayName);
    const result = await callIpca<unknown>('/api/v1/ipca/analyze', {
      student_name: studentName,
      resume_text: resume.extractedText,
      target_role: role,
      current_skills: currentSkills.slice(0, 50),
    });
    const parsed = workflowResultSchema.safeParse(result);
    if (!parsed.success) {
      throw new AppError(502, 'AI_INVALID_RESPONSE', 'The AI service did not return a complete resume analysis. Your uploaded resume is saved.');
    }
    const extractedSkills = parsed.data.final_report.resume_analysis.extracted_skills;
    const skills = Array.isArray(extractedSkills)
      ? extractedSkills.filter((skill): skill is string => typeof skill === 'string' && skill.trim().length > 0).map((skill) => skill.trim())
      : [];
    if (skills.length) await saveResumeSkills(job.userId, resume._id.toString(), skills);
    const storedAnalysis = await ResumeAnalysis.findOneAndUpdate(
      { resumeId: resume._id, userId: job.userId },
      { $set: { model: 'ipca-workflow', promptVersion: 'ipca-workflow-v1', analysis: toStoredResumeAnalysis(parsed.data) } },
      { upsert: true, new: true, runValidators: true },
    );
    if (!storedAnalysis) throw new Error('RESUME_ANALYSIS_STORAGE_FAILED');
    await Resume.updateOne(
      { _id: resume._id },
      { $set: { workflowReport: result, workflowCompletedAt: new Date(), workflowStatus: 'READY', analysisStatus: 'READY', latestAnalysisId: storedAnalysis._id }, $unset: { workflowErrorCode: 1, workflowErrorMessage: 1, analysisErrorCode: 1 } },
    );
  } catch (error) {
    const workflowErrorCode = error instanceof Error && 'code' in error && typeof error.code === 'string' ? error.code : 'WORKFLOW_FAILED';
    const workflowErrorMessage = error instanceof AppError ? error.message : 'The analysis could not be saved. Please try again later.';
    await Resume.updateOne({ _id: resume._id }, { workflowStatus: 'FAILED', workflowErrorCode, workflowErrorMessage });
    // Also protect jobs queued by older API processes with attempts > 1.
    if (['AI_QUOTA_EXCEEDED', 'AI_PROVIDER_AUTH_FAILED', 'RESUME_NOT_READY', 'PROFILE_INCOMPLETE'].includes(workflowErrorCode)) throw new UnrecoverableError(workflowErrorMessage);
    throw error;
  }
}
