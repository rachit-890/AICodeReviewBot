import React, { useState } from 'react';
import { Database, Search, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';
import type { RagSearchResult } from '../types';

interface RAGStudioProps {
  apiKey: string;
}

export function RAGStudio({ apiKey }: RAGStudioProps) {
  const [repoUrl, setRepoUrl] = useState('https://github.com/rachit-890/AICodeReviewBot');
  const [searchQuery, setSearchQuery] = useState('PgVector embedding store database connection');
  const [isIndexing, setIsIndexing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<RagSearchResult[]>([
    {
      score: 0.94,
      chunkId: 'chk-89a12',
      repository: 'rachit-890/AICodeReviewBot',
      filePath: 'prReviewBot/src/main/java/com/proj/prreviewbot/config/EmbeddingStoreConfig.java',
      content: 'PgVectorEmbeddingStore bean initialization logic parsing spring.datasource.url regex to extract database host and fallback gracefully.'
    },
    {
      score: 0.88,
      chunkId: 'chk-77b31',
      repository: 'rachit-890/AICodeReviewBot',
      filePath: 'prReviewBot/src/main/java/com/proj/prreviewbot/service/RAGService.java',
      content: 'Purges repository metadata and text segment vector embeddings before re-indexing codebase to prevent stale context.'
    }
  ]);

  const handleIndexRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIndexing(true);
    try {
      await apiService.indexRepository(repoUrl, 'main', apiKey);
      alert('Repository indexed successfully into RAG PgVector store!');
    } catch (err: any) {
      console.warn('Backend fallback indexing simulated:', err.message);
    } finally {
      setIsIndexing(false);
    }
  };

  const handleSearchRag = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const results = await apiService.searchRag(searchQuery, undefined, 5, apiKey);
      setSearchResults(results);
    } catch (err: any) {
      console.warn('Backend fallback search active:', err.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 max-w-6xl mx-auto bg-[#FDFBFC] text-[#201E1E] font-sans">
      {/* Top Header */}
      <div className="border-b border-[#A68B78]/25 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-sans text-[#164A40] flex items-center space-x-3">
            <span>RAG Vector Knowledge Base</span>
            <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 bg-[#164A40] text-[#F7D3CC]">
              768-DIM PGVECTOR
            </span>
          </h2>
          <p className="text-sm font-editorial italic text-[#634F43] mt-1">Repository semantic chunking, vector embedding indexing, and high-dimensional search.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Repository Indexing Box */}
        <div className="lg:col-span-5 bg-[#FDFBFC] border border-[#A68B78]/30 p-6 sm:p-8 space-y-6 shadow-sm">
          <h3 className="text-xl font-extrabold font-sans text-[#164A40] flex items-center space-x-2 border-b border-[#A68B78]/20 pb-4">
            <RefreshCw className="w-4 h-4 text-[#164A40]" />
            <span>Re-index codebase</span>
          </h3>

          <form onSubmit={handleIndexRepo} className="space-y-4 font-sans text-xs">
            <div>
              <label className="block text-xs font-mono text-[#634F43] uppercase mb-1.5 font-medium">GitHub Repository URL</label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full bg-[#F4EFEB] border border-[#A68B78]/30 px-3.5 py-2.5 text-xs font-mono text-[#201E1E] focus:outline-none focus:border-[#164A40]"
              />
            </div>

            <button
              type="submit"
              disabled={isIndexing}
              className="w-full py-3.5 bg-[#164A40] hover:bg-[#0f362e] text-[#FDFBFC] hover:text-[#F7D3CC] font-sans font-semibold text-xs transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              <Database className="w-4 h-4 text-[#F7D3CC]" />
              <span>{isIndexing ? 'Indexing repo into PgVector...' : 'Purge & re-index vector store'}</span>
            </button>
          </form>
        </div>

        {/* Vector Search Inspector */}
        <div className="lg:col-span-7 bg-[#FDFBFC] border border-[#A68B78]/30 p-6 sm:p-8 space-y-6 shadow-sm">
          <h3 className="text-xl font-extrabold font-sans text-[#164A40] flex items-center space-x-2 border-b border-[#A68B78]/20 pb-4">
            <Search className="w-4 h-4 text-[#164A40]" />
            <span>Vector search inspector</span>
          </h3>

          <form onSubmit={handleSearchRag} className="flex gap-3 font-sans">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query semantic codebase context..."
              className="flex-1 bg-[#F4EFEB] border border-[#A68B78]/30 px-3.5 py-2.5 text-xs font-sans text-[#201E1E] focus:outline-none focus:border-[#164A40]"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 bg-[#164A40] hover:bg-[#0f362e] text-xs font-sans text-[#FDFBFC] font-semibold shadow-sm transition-colors"
            >
              Search
            </button>
          </form>

          {/* Search Result Chunks */}
          <div className="space-y-4">
            {searchResults.map((res, i) => (
              <div key={i} className="p-4 bg-[#F4EFEB] border border-[#A68B78]/25 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#164A40] font-mono font-bold">{res.filePath}</span>
                  <span className="px-2.5 py-0.5 bg-[#164A40] text-[#F7D3CC] font-mono font-bold text-[10px]">
                    COSINE SIM: {(res.score * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-[#634F43] text-xs font-sans leading-relaxed">{res.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
