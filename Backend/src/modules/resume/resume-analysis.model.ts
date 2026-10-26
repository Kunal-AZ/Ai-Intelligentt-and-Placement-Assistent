import { Schema, model } from 'mongoose';
import type { ResumeAnalysisOutput } from '@placement-assistant/validation';

export interface ResumeAnalysisDocument {
  _id: Schema.Types.ObjectId;
  resumeId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  model: string;
  promptVersion: string;
  analysis: ResumeAnalysisOutput;
  createdAt: Date;
  updatedAt: Date;
}

const resumeAnalysisSchema = new Schema<ResumeAnalysisDocument>(
  {
    resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    model: { type: String, required: true, maxlength: 100 },
    promptVersion: { type: String, required: true, maxlength: 50 },
    analysis: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true, versionKey: false },
);

export const ResumeAnalysis = model<ResumeAnalysisDocument>('ResumeAnalysis', resumeAnalysisSchema);
