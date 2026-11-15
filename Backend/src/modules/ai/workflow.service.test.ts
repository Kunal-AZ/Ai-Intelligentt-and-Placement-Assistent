import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnrecoverableError } from 'bullmq';
import { AppError } from '../../utils/app-error.js';

const mocks = vi.hoisted(() => ({ select: vi.fn(), profile: vi.fn(), update: vi.fn(), call: vi.fn(), saveSkills: vi.fn(), signals: vi.fn(), store: vi.fn() }));
vi.mock('../resume/resume-analysis.model.js', () => ({ ResumeAnalysis: { findOneAndUpdate: mocks.store } }));
vi.mock('../resume/resume.model.js', () => ({ Resume: { findOne: () => ({ select: mocks.select }), updateOne: mocks.update } }));
vi.mock('../profile/profile.model.js', () => ({ Profile: { findOne: () => ({ lean: mocks.profile }) } }));
vi.mock('../skills/skill.service.js', () => ({ getSkillSignals: mocks.signals, saveResumeSkills: mocks.saveSkills }));
vi.mock('../../ai/ipca/ipca.client.js', () => ({ callIpca: mocks.call }));
import { runPlacementWorkflow } from './workflow.service.js';

const job = { resumeId: 'resume-1', userId: 'user-1' };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.select.mockResolvedValue({ _id: 'resume-1', processingStatus: 'READY', extractedText: 'Test resume evidence'.repeat(5) });
  mocks.profile.mockResolvedValue({ firstName: 'Test', targetRoles: ['Developer'] });
  mocks.signals.mockResolvedValue([]);
  mocks.store.mockResolvedValue({ _id: 'analysis-1' });
});

describe('placement workflow persistence', () => {
  it('saves returned skills and unlocks recommendations only after success', async () => {
    const result = { workflow_status: 'completed', final_report: { resume_analysis: { summary: 'Test provider response', extracted_skills: ['TypeScript'] } } };
    mocks.call.mockResolvedValue(result);
    await runPlacementWorkflow(job);
    expect(mocks.saveSkills).toHaveBeenCalledWith('user-1', 'resume-1', ['TypeScript']);
    expect(mocks.store).toHaveBeenCalledWith({ resumeId: 'resume-1', userId: 'user-1' }, expect.objectContaining({ $set: expect.objectContaining({ analysis: expect.objectContaining({ skills: ['TypeScript'], education: [], experience: [] }) }) }), expect.objectContaining({ upsert: true }));
    expect(mocks.update).toHaveBeenLastCalledWith({ _id: 'resume-1' }, expect.objectContaining({ $set: expect.objectContaining({ workflowReport: result, workflowStatus: 'READY', analysisStatus: 'READY' }), $unset: expect.objectContaining({ workflowErrorCode: 1 }) }));
  });
  it('stores quota failures and prevents old queued jobs from retrying', async () => {
    mocks.call.mockRejectedValue(new AppError(429, 'AI_QUOTA_EXCEEDED', 'Quota exhausted. Your resume is saved.'));
    await expect(runPlacementWorkflow(job)).rejects.toBeInstanceOf(UnrecoverableError);
    expect(mocks.update).toHaveBeenLastCalledWith({ _id: 'resume-1' }, { workflowStatus: 'FAILED', workflowErrorCode: 'AI_QUOTA_EXCEEDED', workflowErrorMessage: 'Quota exhausted. Your resume is saved.' });
    expect(mocks.saveSkills).not.toHaveBeenCalled();
  });
  it('does not mark a malformed report as ready', async () => {
    mocks.call.mockResolvedValue({ workflow_status: 'completed', final_report: null });
    await expect(runPlacementWorkflow(job)).rejects.toMatchObject({ code: 'AI_INVALID_RESPONSE' });
    expect(mocks.update).toHaveBeenLastCalledWith({ _id: 'resume-1' }, expect.objectContaining({ workflowStatus: 'FAILED' }));
    expect(mocks.saveSkills).not.toHaveBeenCalled();
  });
  it('fails a missing profile instead of leaving the job queued forever', async () => {
    mocks.profile.mockResolvedValue(null);
    await expect(runPlacementWorkflow(job)).rejects.toBeInstanceOf(UnrecoverableError);
    expect(mocks.update).toHaveBeenLastCalledWith({ _id: 'resume-1' }, expect.objectContaining({ workflowStatus: 'FAILED', workflowErrorCode: 'PROFILE_INCOMPLETE' }));
    expect(mocks.call).not.toHaveBeenCalled();
  });
});
