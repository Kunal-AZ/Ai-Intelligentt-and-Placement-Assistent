import { Schema, model } from 'mongoose';

export type KnowledgeDocumentType = 'CAREER' | 'SKILL' | 'JOB' | 'COMPANY' | 'INTERVIEW' | 'DSA' | 'SYSTEM_DESIGN' | 'RESUME_GUIDELINE' | 'LEARNING_RESOURCE';
export type KnowledgeDocumentStatus = 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED';

export interface KnowledgeDocumentDocument {
  _id: Schema.Types.ObjectId;
  type: KnowledgeDocumentType;
  title: string;
  content: string;
  sourceUrl?: string;
  sourceLabel: string;
  tags: string[];
  status: KnowledgeDocumentStatus;
  failureCode?: string;
  processedAt?: Date;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const knowledgeDocumentSchema = new Schema<KnowledgeDocumentDocument>(
  {
    type: { type: String, enum: ['CAREER', 'SKILL', 'JOB', 'COMPANY', 'INTERVIEW', 'DSA', 'SYSTEM_DESIGN', 'RESUME_GUIDELINE', 'LEARNING_RESOURCE'], required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 200000, select: false },
    sourceUrl: { type: String, maxlength: 2048 },
    sourceLabel: { type: String, required: true, trim: true, maxlength: 160 },
    tags: { type: [String], default: [], maxlength: 20 },
    status: { type: String, enum: ['QUEUED', 'PROCESSING', 'READY', 'FAILED'], default: 'QUEUED', index: true },
    failureCode: { type: String, maxlength: 80 },
    processedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, versionKey: false },
);

knowledgeDocumentSchema.index({ type: 1, tags: 1, status: 1 });

export const KnowledgeDocument = model<KnowledgeDocumentDocument>('KnowledgeDocument', knowledgeDocumentSchema);
