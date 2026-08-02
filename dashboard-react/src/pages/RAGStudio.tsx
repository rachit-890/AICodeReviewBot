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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="border-b border-[#3c4a46] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-display tracking-tight text-[#dde4e1] uppercase flex items-center space-x-3">
            <span>RAG VECTOR KNOWLEDGE BASE</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 bg-[#00574d]/40 border border-[#2dd4bf] text-[#57f1db]">
              768-DIM PGVECTOR
            </span>
          </h2>
          <p className="text-xs text-[#bacac5] font-mono mt-1">Repository semantic chunking, vector embedding indexing, and high-dimensional search.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Repository Indexing Box */}
        <div className="lg:col-span-5 bg-[#161d1b] border border-[#3c4a46] p-5 space-y-4">
          <h3 className="text-sm font-bold font-display text-[#dde4e1] uppercase flex items-center space-x-2 border-b border-[#3c4a46] pb-3">
            <RefreshCw className="w-4 h-4 text-[#2dd4bf]" />
            <span>RE-INDEX REPOSITORY CODEBASE</span>
          </h3>

          <form onSubmit={handleIndexRepo} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-[10px] text-[#bacac5] uppercase mb-1">GitHub Repo URL</label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full bg-[#09100e] border border-[#3c4a46] px-3 py-1.5 text-xs font-mono text-[#dde4e1] focus:outline-none focus:border-[#2dd4bf]"
              />
            </div>

            <button
              type="submit"
              disabled={isIndexing}
              className="w-full py-2.5 bg-[#2dd4bf] hover:bg-[#57f1db] text-[#0e1513] font-bold text-xs font-mono tracking-wider transition-colors flex items-center justify-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>{isIndexing ? 'INDEXING REPO INTO PGVECTOR...' : 'PURGE & RE-INDEX VECTOR STORE'}</span>
            </button>
          </form>
        </div>

        {/* Vector Search Inspector */}
        <div className="lg:col-span-7 bg-[#161d1b] border border-[#3c4a46] p-5 space-y-4">
          <h3 className="text-sm font-bold font-display text-[#dde4e1] uppercase flex items-center space-x-2 border-b border-[#3c4a46] pb-3">
            <Search className="w-4 h-4 text-[#2dd4bf]" />
            <span>VECTOR SEARCH INSPECTOR</span>
          </h3>

          <form onSubmit={handleSearchRag} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query semantic codebase context..."
              className="flex-1 bg-[#09100e] border border-[#3c4a46] px-3 py-1.5 text-xs font-mono text-[#dde4e1] focus:outline-none focus:border-[#2dd4bf]"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-1.5 bg-[#1a211f] border border-[#3c4a46] hover:border-[#2dd4bf] text-xs font-mono text-[#2dd4bf] font-bold"
            >
              SEARCH
            </button>
          </form>

          {/* Search Result Chunks */}
          <div className="space-y-3 font-mono text-xs">
            {searchResults.map((res, i) => (
              <div key={i} className="p-3 bg-[#09100e] border border-[#3c4a46] space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#57f1db] font-bold">{res.filePath}</span>
                  <span className="px-2 py-0.5 bg-[#00574d]/30 border border-[#2dd4bf] text-[#2dd4bf]">
                    COSINE SIM: {(res.score * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-[#bacac5] text-[11px] leading-relaxed">{res.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
