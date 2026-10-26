import { Schema, model } from 'mongoose';

export interface ProfileDocument {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  firstName?: string;
  lastName?: string;
  headline?: string;
  college?: string;
  graduationYear?: number;
  targetRoles: string[];
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new Schema<ProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    firstName: { type: String, trim: true, maxlength: 80 },
    lastName: { type: String, trim: true, maxlength: 80 },
    headline: { type: String, trim: true, maxlength: 160 },
    college: { type: String, trim: true, maxlength: 160 },
    graduationYear: { type: Number, min: 2000, max: 2100 },
    targetRoles: { type: [String], default: [], maxlength: 10 },
  },
  { timestamps: true, versionKey: false },
);

export const Profile = model<ProfileDocument>('Profile', profileSchema);
