import { Schema, model } from 'mongoose';
import type { UserRole } from '@placement-assistant/types';

export interface UserDocument {
  _id: Schema.Types.ObjectId;
  email: string;
  passwordHash?: string;
  googleSubject?: string;
  role: UserRole;
  plan: 'FREE' | 'PLUS' | 'PRO';
  isEmailVerified: boolean;
  passwordChangedAt: Date;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
    passwordHash: { type: String, select: false },
    googleSubject: { type: String, unique: true, sparse: true, select: false },
    role: { type: String, enum: ['STUDENT', 'ADMIN', 'COUNSELOR'], default: 'STUDENT', index: true },
    plan: { type: String, enum: ['FREE', 'PLUS', 'PRO'], default: 'FREE', index: true },
    isEmailVerified: { type: Boolean, default: false },
    passwordChangedAt: { type: Date, required: true },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpiresAt: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
  },
  { timestamps: true, versionKey: false },
);

export const User = model<UserDocument>('User', userSchema);
