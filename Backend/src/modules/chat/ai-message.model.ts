import { Schema, model } from 'mongoose';

export interface AiMessageDocument {
  _id: Schema.Types.ObjectId;
  conversationId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sources: Array<{ id: string; kind: 'USER_DATA' | 'RETRIEVED_KNOWLEDGE'; label: string }>;
  agentTrace: string[];
  createdAt: Date;
  updatedAt: Date;
}

const aiMessageSchema = new Schema<AiMessageDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'AiConversation', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['USER', 'ASSISTANT'], required: true },
    content: { type: String, required: true, maxlength: 5000 },
    sources: { type: [{ id: String, kind: String, label: String }], default: [] },
    agentTrace: { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false },
);

aiMessageSchema.index({ conversationId: 1, createdAt: 1 });

export const AiMessage = model<AiMessageDocument>('AiMessage', aiMessageSchema);
