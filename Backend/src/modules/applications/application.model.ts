import { Schema, model } from 'mongoose';

export type ApplicationStatus = 'SAVED' | 'APPLIED' | 'ONLINE_ASSESSMENT' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';

export interface ApplicationDocument {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  company: string;
  role: string;
  sourceUrl?: string;
  status: ApplicationStatus;
  appliedAt?: Date;
  nextAction?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema<ApplicationDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  company: { type: String, required: true, trim: true, maxlength: 160 },
  role: { type: String, required: true, trim: true, maxlength: 160 },
  sourceUrl: { type: String, trim: true, maxlength: 2048 },
  status: { type: String, enum: ['SAVED', 'APPLIED', 'ONLINE_ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'], default: 'SAVED', index: true },
  appliedAt: { type: Date },
  nextAction: { type: String, trim: true, maxlength: 500 },
  notes: { type: String, trim: true, maxlength: 5000 },
}, { timestamps: true, versionKey: false });

applicationSchema.index({ userId: 1, status: 1, updatedAt: -1 });
export const Application = model<ApplicationDocument>('Application', applicationSchema);
