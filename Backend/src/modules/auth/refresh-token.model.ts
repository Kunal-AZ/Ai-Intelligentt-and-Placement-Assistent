import { Schema, model } from 'mongoose';

export interface RefreshTokenDocument {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  replacedByTokenId?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, select: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    revokedAt: { type: Date },
    replacedByTokenId: { type: Schema.Types.ObjectId, ref: 'RefreshToken' },
  },
  { timestamps: true, versionKey: false },
);

refreshTokenSchema.index({ userId: 1, revokedAt: 1 });

export const RefreshToken = model<RefreshTokenDocument>('RefreshToken', refreshTokenSchema);
