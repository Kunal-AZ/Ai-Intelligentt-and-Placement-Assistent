import { Schema, model } from 'mongoose';

export interface AiConversationDocument {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiConversationSchema = new Schema<AiConversationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
  },
  { timestamps: true, versionKey: false },
);

aiConversationSchema.index({ userId: 1, updatedAt: -1 });

export const AiConversation = model<AiConversationDocument>('AiConversation', aiConversationSchema);
