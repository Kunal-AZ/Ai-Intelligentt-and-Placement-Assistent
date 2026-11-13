import { Schema, model } from 'mongoose';

export interface ProfileDocument {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  firstName?: string;
  lastName?: string;
  headline?: string;
  college?: string;
  degree?: string;
  cgpa?: string;
  graduationYear?: number;
  targetRoles: string[];
  secondaryRole?: string;
  expectedLpa?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  allowRecruiterSharing: boolean;
  notifyJobMatches: boolean;
  notifyRoadmapReminders: boolean;
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
    degree: { type: String, trim: true, maxlength: 160 },
    cgpa: { type: String, trim: true, maxlength: 30 },
    graduationYear: { type: Number, min: 2000, max: 2100 },
    targetRoles: { type: [String], default: [], maxlength: 10 },
    secondaryRole: { type: String, trim: true, maxlength: 100 },
    expectedLpa: { type: String, trim: true, maxlength: 40 },
    githubUrl: { type: String, trim: true, maxlength: 500 },
    linkedinUrl: { type: String, trim: true, maxlength: 500 },
    portfolioUrl: { type: String, trim: true, maxlength: 500 },
    allowRecruiterSharing: { type: Boolean, default: false },
    notifyJobMatches: { type: Boolean, default: false },
    notifyRoadmapReminders: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

export const Profile = model<ProfileDocument>('Profile', profileSchema);
