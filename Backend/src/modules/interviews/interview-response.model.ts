import { Schema, model } from 'mongoose';
import type { z } from 'zod';
import type { interviewEvaluationSchema, interviewQuestionSchema } from '@placement-assistant/validation';
type Question = z.infer<typeof interviewQuestionSchema>; type Evaluation = z.infer<typeof interviewEvaluationSchema>;
export interface InterviewResponseDocument { _id: Schema.Types.ObjectId; sessionId: Schema.Types.ObjectId; userId: Schema.Types.ObjectId; questionNumber: number; question: Question; answer?: string; evaluation?: Evaluation; createdAt: Date; updatedAt: Date; }
const responseSchema = new Schema<InterviewResponseDocument>({ sessionId: { type: Schema.Types.ObjectId, ref: 'InterviewSession', required: true, index: true }, userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, questionNumber: { type: Number, required: true }, question: { type: Schema.Types.Mixed, required: true }, answer: { type: String, maxlength: 10000 }, evaluation: { type: Schema.Types.Mixed } }, { timestamps: true, versionKey: false });
responseSchema.index({ sessionId: 1, questionNumber: 1 }, { unique: true });
export const InterviewResponse = model<InterviewResponseDocument>('InterviewResponse', responseSchema);
