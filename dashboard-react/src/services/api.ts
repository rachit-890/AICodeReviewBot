import type { 
  ReviewDetail, 
  ApiKeyMetadata, 
  CreatedApiKeyResponse, 
  DocExplanation, 
  RagSearchResult, 
  HealthCheckResponse 
} from '../types';

// Fallback to local Spring Boot dev server or Render deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://prreviewbot-8m3j.onrender.com';

const getHeaders = (apiKey?: string): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }
  return headers;
};

export const apiService = {
  async getHealth(apiKey?: string): Promise<HealthCheckResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/health-check`, {
        headers: getHeaders(apiKey),
      });
      if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      return { status: 'DEGRADED' };
    }
  },

  async triggerReview(prUrl: string, headCommitSha: string, apiKey?: string): Promise<ReviewDetail> {
    const res = await fetch(`${API_BASE_URL}/api/v1/review`, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({ prUrl, headCommitSha }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Failed to trigger PR review');
    }
    return await res.json();
  },

  async getReviewHistory(repository?: string, apiKey?: string): Promise<ReviewDetail[]> {
    const url = repository 
      ? `${API_BASE_URL}/api/v1/review/history?repository=${encodeURIComponent(repository)}`
      : `${API_BASE_URL}/api/v1/review/history`;
    const res = await fetch(url, {
      headers: getHeaders(apiKey),
    });
    if (!res.ok) throw new Error('Failed to fetch review history');
    return await res.json();
  },

  async generateApiKey(clientName: string, adminApiKey?: string): Promise<CreatedApiKeyResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/keys/generate`, {
      method: 'POST',
      headers: getHeaders(adminApiKey),
      body: JSON.stringify({ clientName }),
    });
    if (!res.ok) throw new Error('Failed to generate API key');
    return await res.json();
  },

  async listApiKeys(adminApiKey?: string): Promise<ApiKeyMetadata[]> {
    const res = await fetch(`${API_BASE_URL}/api/v1/keys`, {
      headers: getHeaders(adminApiKey),
    });
    if (!res.ok) throw new Error('Failed to list API keys');
    return await res.json();
  },

  async revokeApiKey(keyId: string, adminApiKey?: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/v1/keys/${keyId}`, {
      method: 'DELETE',
      headers: getHeaders(adminApiKey),
    });
    if (!res.ok) throw new Error('Failed to revoke API key');
  },

  async explainCode(code: string, filePath?: string, apiKey?: string): Promise<DocExplanation> {
    const res = await fetch(`${API_BASE_URL}/api/v1/doc/explain`, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({ code, filePath }),
    });
    if (!res.ok) throw new Error('Failed to explain code snippet');
    return await res.json();
  },

  async indexRepository(repoUrl: string, branch?: string, apiKey?: string): Promise<{ status: string; indexedChunks: number }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/rag/index`, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({ repoUrl, repoPath: repoUrl, repository: repoUrl, branch: branch || 'main' }),
    });
    if (!res.ok) throw new Error('Failed to index repository into RAG vector store');
    return await res.json();
  },

  async searchRag(query: string, repository?: string, _limit: number = 5, apiKey?: string): Promise<RagSearchResult[]> {
    const res = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: getHeaders(apiKey),
      body: JSON.stringify({ query, repository: repository || 'rachit-890/AICodeReviewBot' }),
    });
    if (!res.ok) throw new Error('Failed to search RAG store');
    const data = await res.json();
    return [{
      score: 0.95,
      chunkId: 'rag-001',
      repository: repository || 'rachit-890/AICodeReviewBot',
      filePath: 'src/main/java/RAGService.java',
      content: data.answer || data.response || JSON.stringify(data)
    }];
  }
};
