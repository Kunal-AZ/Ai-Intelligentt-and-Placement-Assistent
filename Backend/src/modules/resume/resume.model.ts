import { Schema, model } from 'mongoose';

export type ResumeProcessingStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';

export interface ResumeDocument {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  originalFileName: string;
  mimeType: 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  sizeBytes: number;
  sha256: string;
  storageKey: string;
  processingStatus: ResumeProcessingStatus;
  analysisStatus: 'NOT_REQUESTED' | 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED';
  analysisErrorCode?: string;
  latestAnalysisId?: Schema.Types.ObjectId;
  workflowReport?: Record<string, unknown>;
  workflowCompletedAt?: Date;
  extractedText?: string;
  processingErrorCode?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<ResumeDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalFileName: { type: String, required: true, maxlength: 180 },
    mimeType: { type: String, required: true, enum: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
    sizeBytes: { type: Number, required: true, min: 1 },
    sha256: { type: String, required: true, minlength: 64, maxlength: 64, index: true },
    storageKey: { type: String, required: true, unique: true, select: false },
    processingStatus: { type: String, required: true, enum: ['UPLOADED', 'PROCESSING', 'READY', 'FAILED'], default: 'UPLOADED', index: true },
    analysisStatus: { type: String, required: true, enum: ['NOT_REQUESTED', 'QUEUED', 'PROCESSING', 'READY', 'FAILED'], default: 'NOT_REQUESTED', index: true },
    analysisErrorCode: { type: String, maxlength: 80 },
    latestAnalysisId: { type: Schema.Types.ObjectId, ref: 'ResumeAnalysis' },
    workflowReport: { type: Schema.Types.Mixed },
    workflowCompletedAt: { type: Date },
    extractedText: { type: String, maxlength: 100000, select: false },
    processingErrorCode: { type: String, maxlength: 80 },
    processedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

resumeSchema.index({ userId: 1, createdAt: -1 });

export const Resume = model<ResumeDocument>('Resume', resumeSchema);
