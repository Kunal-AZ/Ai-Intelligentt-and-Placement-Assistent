import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';
import { KnowledgeChunk } from '../../modules/knowledge/knowledge-chunk.model.js';
import { embedText } from './embeddings.js';

export type RetrievedKnowledge = {
  chunkId: string;
  documentId: string;
  text: string;
  score: number;
  source: { type: string; title: string; sourceLabel: string; sourceUrl?: string; tags: string[] };
};

export async function retrieveKnowledge(query: string, limit: number): Promise<RetrievedKnowledge[]> {
  const queryVector = await embedText(query);
  try {
    const results = await KnowledgeChunk.aggregate<{
      _id: { toString(): string }; documentId: { toString(): string }; text: string; score: number;
      metadata: RetrievedKnowledge['source'];
    }>([
      { $vectorSearch: { index: env.ATLAS_VECTOR_INDEX, path: 'embedding', queryVector, numCandidates: Math.max(limit * 20, 100), limit } },
      { $project: { documentId: 1, text: 1, metadata: 1, score: { $meta: 'vectorSearchScore' } } },
    ]);
    return results.map((result) => ({ chunkId: result._id.toString(), documentId: result.documentId.toString(), text: result.text, score: result.score, source: result.metadata }));
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(503, 'VECTOR_SEARCH_UNAVAILABLE', 'Knowledge retrieval is unavailable. Verify the Atlas Vector Search index configuration.');
  }
}

export function buildRetrievalContext(chunks: RetrievedKnowledge[]): string {
  return chunks.map((chunk, index) => `[Source ${index + 1}: ${chunk.source.title}]\n${chunk.text}`).join('\n\n');
}
