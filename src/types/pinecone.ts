export interface PineconeVector {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

export interface PineconeQueryRequest {
  vector: number[];
  topK: number;
  includeMetadata?: boolean;
  includeValues?: boolean;
  filter?: Record<string, any>;
}

export interface PineconeQueryMatch {
  id: string;
  score: number;
  metadata?: Record<string, any>;
  values?: number[];
}

export interface PineconeQueryResponse {
  matches: PineconeQueryMatch[];
  namespace: string;
}
