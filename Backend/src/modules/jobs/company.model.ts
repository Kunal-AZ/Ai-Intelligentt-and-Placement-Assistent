import { Schema, model } from 'mongoose';
export interface CompanyDocument { _id: Schema.Types.ObjectId; name: string; website?: string; industry?: string; createdAt: Date; updatedAt: Date; }
const companySchema = new Schema<CompanyDocument>({ name: { type: String, required: true, trim: true, maxlength: 160, unique: true }, website: { type: String, maxlength: 2048 }, industry: { type: String, maxlength: 100 } }, { timestamps: true, versionKey: false });
export const Company = model<CompanyDocument>('Company', companySchema);
