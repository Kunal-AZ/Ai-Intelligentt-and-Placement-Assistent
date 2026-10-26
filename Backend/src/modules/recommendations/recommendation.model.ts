import { Schema, model } from 'mongoose';

export interface RecommendationDocument {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  type: 'CAREER_PATH';
  role: string;
  evidence: Array<{ source: string; detail: string }>;
  missingSkills: string[];
  status: 'ACTIVE' | 'SUPERSEDED';
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const recommendationSchema = new Schema<RecommendationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['CAREER_PATH'], required: true },
    role: { type: String, required: true, maxlength: 100 },
    evidence: { type: [{ source: String, detail: String }], default: [] },
    missingSkills: { type: [String], default: [] },
    status: { type: String, enum: ['ACTIVE', 'SUPERSEDED'], default: 'ACTIVE', index: true },
    generatedAt: { type: Date, required: true },
  },
  { timestamps: true, versionKey: false },
);

recommendationSchema.index({ userId: 1, type: 1, role: 1 }, { unique: true });

export const Recommendation = model<RecommendationDocument>('Recommendation', recommendationSchema);
