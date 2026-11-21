import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ session: vi.fn(), response: vi.fn(), save: vi.fn(), advance: vi.fn(), evaluate: vi.fn(), generate: vi.fn() }));
vi.mock('./interview-session.model.js', () => ({ InterviewSession: { findOne: mocks.session, updateOne: mocks.advance } }));
vi.mock('./interview-response.model.js', () => ({ InterviewResponse: { findOne: mocks.response, findOneAndUpdate: mocks.save } }));
vi.mock('../../ai/agents/interview.agent.js', () => ({ evaluateInterviewAnswer: mocks.evaluate, generateInterviewQuestion: mocks.generate }));
import { respondToInterview } from './interview.service.js';

const evaluation = { followUpFocus: 'Testing' };
const current = { _id: 'response-1', question: { question: 'Explain testing' } };
const next = { _id: 'response-2', questionNumber: 2 };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ _id: 'session-1', currentQuestionNumber: 1, type: 'TECHNICAL', difficulty: 'BEGINNER' });
  mocks.evaluate.mockResolvedValue(evaluation);
  mocks.generate.mockResolvedValue({ question: 'Next question' });
});

describe('interview recovery', () => {
  it('retries next-question generation without evaluating a saved answer again', async () => {
    mocks.response.mockResolvedValueOnce(current).mockResolvedValueOnce(null);
    mocks.save.mockResolvedValueOnce({ ...current, answer: 'My answer', evaluation });
    mocks.generate.mockRejectedValueOnce(new Error('Provider unavailable'));
    await expect(respondToInterview('user-1', 'session-1', 'My answer')).rejects.toThrow('Provider unavailable');
    expect(mocks.advance).not.toHaveBeenCalled();

    mocks.response.mockResolvedValueOnce({ ...current, answer: 'My answer', evaluation }).mockResolvedValueOnce(null);
    mocks.save.mockResolvedValueOnce(next);
    await expect(respondToInterview('user-1', 'session-1', 'My answer')).resolves.toEqual({ evaluation, nextQuestion: next });
    expect(mocks.evaluate).toHaveBeenCalledOnce();
    expect(mocks.advance).toHaveBeenCalledWith(expect.objectContaining({ currentQuestionNumber: 1, userId: 'user-1', status: 'ACTIVE' }), { $set: { currentQuestionNumber: 2 } });
  });

  it('reuses a next question saved before a failed session update', async () => {
    mocks.response.mockResolvedValueOnce({ ...current, answer: 'My answer', evaluation }).mockResolvedValueOnce(next);
    await expect(respondToInterview('user-1', 'session-1', 'My answer')).resolves.toEqual({ evaluation, nextQuestion: next });
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('does not overwrite an answer submitted by a concurrent request', async () => {
    mocks.response.mockResolvedValueOnce(current).mockResolvedValueOnce({ ...current, answer: 'Another answer', evaluation });
    mocks.save.mockResolvedValueOnce(null);
    await expect(respondToInterview('user-1', 'session-1', 'My answer')).rejects.toMatchObject({ code: 'INTERVIEW_ANSWER_ALREADY_SUBMITTED' });
    expect(mocks.generate).not.toHaveBeenCalled();
  });
});
