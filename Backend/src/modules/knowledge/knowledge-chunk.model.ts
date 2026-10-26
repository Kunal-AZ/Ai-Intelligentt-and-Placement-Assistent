import { Schema, model } from 'mongoose';

export interface KnowledgeChunkDocument {
  _id: Schema.Types.ObjectId;
  documentId: Schema.Types.ObjectId;
  ordinal: number;
  text: string;
  embedding: number[];
  metadata: { type: string; title: string; sourceLabel: string; sourceUrl?: string; tags: string[] };
  createdAt: Date;
  updatedAt: Date;
}

const knowledgeChunkSchema = new Schema<KnowledgeChunkDocument>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'KnowledgeDocument', required: true, index: true },
    ordinal: { type: Number, required: true, min: 0 },
    text: { type: String, required: true, maxlength: 1200 },
    embedding: { type: [Number], required: true, select: false },
    metadata: {
      type: { type: String, required: true }, title: { type: String, required: true }, sourceLabel: { type: String, required: true },
      sourceUrl: { type: String }, tags: { type: [String], default: [] },
    },
  },
  { timestamps: true, versionKey: false },
);

knowledgeChunkSchema.index({ documentId: 1, ordinal: 1 }, { unique: true });

export const KnowledgeChunk = model<KnowledgeChunkDocument>('KnowledgeChunk', knowledgeChunkSchema);
