export const EMBEDDING_MODEL = 'Xenova/multilingual-e5-small';
export const EMBEDDING_DIMENSIONS = 384;
// Bump when the input template, pooling, model revision or quantization changes.
export const EMBEDDING_PROFILE = `${EMBEDDING_MODEL}:q8:mean:l2:v1`;

export interface SearchCandidate {
  id: string;
  title: string;
  description: string;
  genres: string[];
  tags: string[];
  author: string;
  contentHash: string;
  vector?: number[];
}

export interface EmbeddingRequest {
  id: number;
  text: string;
}

export interface EmbeddingReply {
  id: number;
  vector?: number[];
  error?: string;
}
