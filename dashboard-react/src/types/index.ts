export interface Finding {
  id?: string;
  file?: string;
  filePath?: string;
  line?: number;
  lineNumber?: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  category: string;
  title?: string;
  description: string;
  snippet?: string;
  suggestion: string;
}

export interface ReviewDetail {
  id: string;
  prUrl: string;
  prTitle?: string;
  repository?: string;
  headCommitSha: string;
  overallScore: number;
  reviewedAt: string;
  summary: string;
  findings: Finding[];
}

export interface ApiKeyMetadata {
  id: string;
  clientName: string;
  createdAt: string;
  lastUsedAt: string | null;
  active: boolean;
}

export interface CreatedApiKeyResponse {
  apiKey: string;
  metadata: ApiKeyMetadata;
}

export interface DocExplanation {
  explanation: string;
  astBreakdown?: string[];
  complexityScore?: number;
}

export interface RagSearchResult {
  score: number;
  content: string;
  repository: string;
  filePath: string;
  chunkId: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp?: string;
}
