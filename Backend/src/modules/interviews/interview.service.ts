import { evaluateInterviewAnswer, generateInterviewQuestion } from '../../ai/agents/interview.agent.js';
import { AppError } from '../../utils/app-error.js';
import { InterviewResponse } from './interview-response.model.js';
import { InterviewSession } from './interview-session.model.js';

export async function respondToInterview(userId: string, sessionId: string, answer: string) {
  const session = await InterviewSession.findOne({ _id: sessionId, userId, status: 'ACTIVE' });
  if (!session) throw new AppError(404, 'INTERVIEW_SESSION_NOT_FOUND', 'Active interview session was not found.');
  const current = await InterviewResponse.findOne({ sessionId: session._id, questionNumber: session.currentQuestionNumber, userId });
  if (!current) throw new AppError(409, 'INTERVIEW_QUESTION_NOT_FOUND', 'No current interview question was found.');
  if (current.answer && current.answer !== answer) {
    throw new AppError(409, 'INTERVIEW_ANSWER_ALREADY_SUBMITTED', 'The current answer has already been submitted.');
  }

  // Persist the evaluation once, and reuse it if generating the next question
  // fails. A retry must be able to finish advancing this session.
  let evaluated = current;
  if (!current.evaluation) {
    const evaluation = await evaluateInterviewAnswer(current.question.question, answer);
    evaluated = await InterviewResponse.findOneAndUpdate(
      { _id: current._id, answer: { $exists: false } },
      { $set: { answer, evaluation } },
      { new: true },
    ) ?? await InterviewResponse.findOne({ _id: current._id, userId }) ?? current;
  }
  if (evaluated.answer !== answer || !evaluated.evaluation) {
    throw new AppError(409, 'INTERVIEW_ANSWER_ALREADY_SUBMITTED', 'The current answer has already been submitted.');
  }

  const nextNumber = session.currentQuestionNumber + 1;
  const nextFilter = { sessionId: session._id, userId, questionNumber: nextNumber };
  let nextResponse = await InterviewResponse.findOne(nextFilter);
  if (!nextResponse) {
    const question = await generateInterviewQuestion({ type: session.type, role: session.role, difficulty: session.difficulty, questionNumber: nextNumber, focus: evaluated.evaluation.followUpFocus });
    nextResponse = await InterviewResponse.findOneAndUpdate(
      nextFilter,
      { $setOnInsert: { ...nextFilter, question } },
      { upsert: true, new: true, runValidators: true },
    );
  }
  await InterviewSession.updateOne(
    { _id: session._id, userId, status: 'ACTIVE', currentQuestionNumber: session.currentQuestionNumber },
    { $set: { currentQuestionNumber: nextNumber } },
  );
  return { evaluation: evaluated.evaluation, nextQuestion: nextResponse };
}
