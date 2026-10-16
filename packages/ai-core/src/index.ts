/**
 * Contracts only: concrete models, tools, retrieval, and agents are introduced in later phases.
 */
export interface AgentContext {
  requestId: string;
  userId: string;
  authorizedDataScopes: string[];
}

export interface AgentResult<T> {
  data: T;
  sources: Array<{ id: string; kind: 'user-data' | 'retrieved'; title?: string }>;
}
