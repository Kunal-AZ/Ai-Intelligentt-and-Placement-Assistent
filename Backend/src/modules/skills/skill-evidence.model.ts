import { Schema, model } from 'mongoose';

export type SkillEvidenceSource = 'USER_DECLARED' | 'RESUME' | 'ASSESSMENT' | 'INTERVIEW';
export type SkillProficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface SkillEvidenceDocument {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  skillId: Schema.Types.ObjectId;
  source: SkillEvidenceSource;
  sourceRef: string;
  proficiency?: SkillProficiency;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const skillEvidenceSchema = new Schema<SkillEvidenceDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skillId: { type: Schema.Types.ObjectId, ref: 'Skill', required: true, index: true },
    source: { type: String, enum: ['USER_DECLARED', 'RESUME', 'ASSESSMENT', 'INTERVIEW'], required: true },
    sourceRef: { type: String, required: true, maxlength: 120 },
    proficiency: { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
    summary: { type: String, maxlength: 300 },
  },
  { timestamps: true, versionKey: false },
);

skillEvidenceSchema.index({ userId: 1, skillId: 1, source: 1, sourceRef: 1 }, { unique: true });

export const SkillEvidence = model<SkillEvidenceDocument>('SkillEvidence', skillEvidenceSchema);
