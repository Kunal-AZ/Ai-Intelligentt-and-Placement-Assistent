import { Schema, model } from 'mongoose';

export interface SkillDocument {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  canonicalName: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

const skillSchema = new Schema<SkillDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    canonicalName: { type: String, required: true, lowercase: true, trim: true, maxlength: 100 },
    displayName: { type: String, required: true, trim: true, maxlength: 100 },
  },
  { timestamps: true, versionKey: false },
);

skillSchema.index({ userId: 1, canonicalName: 1 }, { unique: true });

export const Skill = model<SkillDocument>('Skill', skillSchema);
