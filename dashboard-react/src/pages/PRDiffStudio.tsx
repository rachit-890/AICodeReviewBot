import React, { useState } from 'react';
import { 
  Play, FileCode, Sparkles, RefreshCw, Send
} from 'lucide-react';
import type { ReviewDetail, Finding } from '../types';
import { apiService } from '../services/api';

interface PRDiffStudioProps {
  apiKey: string;
  onReviewCreated: (review: ReviewDetail) => void;
  selectedReview: ReviewDetail | null;
}

export function PRDiffStudio({ apiKey, onReviewCreated, selectedReview }: PRDiffStudioProps) {
  const [prUrl, setPrUrl] = useState(selectedReview?.prUrl || 'https://github.com/rachit-890/AICodeReviewBot/pull/1');
  const [headCommitSha, setHeadCommitSha] = useState(selectedReview?.headCommitSha || 'e731e5d7178d72272eeaeb15236705b8a4133254');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'diff' | 'findings' | 'fix-preview'>('diff');
  const [activeFinding, setActiveFinding] = useState<Finding | null>(selectedReview?.findings?.[0] || null);

  const currentReview: ReviewDetail = selectedReview || {
    id: 'demo-review-001',
    prUrl: prUrl,
    prTitle: 'fix(rag): update RAGService to use EmbeddingStore interface and remove localhost defaults',
    repository: 'rachit-890/AICodeReviewBot',
    headCommitSha: headCommitSha,
    overallScore: 92,
    reviewedAt: new Date().toISOString(),
    summary: 'PR introduced dynamic fallback store for PgVector connection resilience. Discovered 1 medium warning regarding unvalidated thread parameter.',
    findings: [
      {
        id: 'f-1',
        filePath: 'prReviewBot/src/main/java/com/proj/prreviewbot/config/EmbeddingStoreConfig.java',
        lineNumber: 78,
        severity: 'WARNING',
        category: 'RESOURCE_LEAK',
        title: 'Unclosed Database Stream in Fallback Bean Init',
        description: 'Connection exception handler returns FallbackEmbeddingStore directly without closing failed connection stream.',
        snippet: 'try {\n    return PgVectorEmbeddingStore.builder().build();\n} catch (Exception e) {\n    return new FallbackEmbeddingStore();\n}',
        suggestion: 'Ensure connection resources are flushed before returning FallbackEmbeddingStore instance.',
      },
      {
        id: 'f-2',
        filePath: 'prReviewBot/src/main/java/com/proj/prreviewbot/service/RAGService.java',
        lineNumber: 138,
        severity: 'INFO',
        category: 'PERFORMANCE',
        title: 'Sequential Vector Insertion Optimization',
        description: 'Multiple text segments are added sequentially instead of utilizing addAll batch operation.',
        snippet: 'embeddingStore.add(embedding, segment);',
        suggestion: 'Batch insert embeddings using embeddingStore.addAll(embeddings, textSegments) for 4x performance increase.',
      }
    ]
  };

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    try {
      const result = await apiService.triggerReview(prUrl, headCommitSha, apiKey);
      onReviewCreated(result);
    } catch (err: any) {
      console.warn('Backend API fallback demo triggered:', err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto bg-[#FDFBFC] text-[#201E1E]">
      {/* Top Controls Bar */}
      <div className="bg-[#F4EFEB] border border-[#A68B78]/40 p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <form onSubmit={handleRunAudit} className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-mono text-[#634F43] uppercase mb-1 font-semibold">Target PR URL</label>
            <input
              type="text"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              className="w-full bg-[#FDFBFC] border border-[#A68B78]/40 px-3 py-2 text-xs font-mono text-[#201E1E] focus:outline-none focus:border-[#164A40]"
              placeholder="https://github.com/owner/repo/pull/1"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[#634F43] uppercase mb-1 font-semibold">Commit SHA</label>
            <input
              type="text"
              value={headCommitSha}
              onChange={(e) => setHeadCommitSha(e.target.value)}
              className="w-full bg-[#FDFBFC] border border-[#A68B78]/40 px-3 py-2 text-xs font-mono text-[#201E1E] focus:outline-none focus:border-[#164A40]"
              placeholder="Commit SHA"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full py-2.5 px-4 bg-[#164A40] hover:bg-[#0f362e] text-[#FDFBFC] hover:text-[#F7D3CC] font-bold text-xs font-mono tracking-wider transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F7D3CC]" />
                  <span>ANALYZING AST & RAG...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-[#F7D3CC]" />
                  <span>RUN AI SECURITY AUDIT</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="flex items-center space-x-6 border-l border-[#A68B78]/30 pl-6 text-xs font-mono">
          <div>
            <span className="text-[#634F43] block text-[10px] uppercase font-semibold">AUDIT SCORE</span>
            <span className="text-xl font-bold text-[#164A40]">{currentReview.overallScore} / 100</span>
          </div>
          <div>
            <span className="text-[#634F43] block text-[10px] uppercase font-semibold">TOTAL ISSUES</span>
            <span className="text-xl font-bold text-[#93000a]">{currentReview.findings?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* 58/42 Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px]">
        {/* Left Pane: Code Diff Viewer (58%) */}
        <div className="lg:col-span-7 bg-[#FDFBFC] border border-[#A68B78]/40 flex flex-col shadow-sm">
          <div className="bg-[#F4EFEB] border-b border-[#A68B78]/30 px-4 py-3 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2 text-[#164A40]">
              <FileCode className="w-4 h-4 text-[#164A40]" />
              <span className="font-bold">DIFF INSPECTOR</span>
              <span className="text-[#634F43]">({currentReview.repository})</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-bold">
              <span className="text-[#164A40]">+79 lines</span>
              <span className="text-[#93000a]">-17 lines</span>
            </div>
          </div>

          <div className="flex-1 bg-[#FDFBFC] p-4 overflow-x-auto font-mono text-xs space-y-1">
            <div className="text-[#A68B78] border-b border-[#A68B78]/20 pb-2 mb-3">
              @@ -14,7 +14,9 @@ import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;
            </div>

            <div className="bg-[#93000a]/10 border-l-4 border-[#93000a] px-3 py-1.5 text-[#93000a] flex items-center justify-between">
              <span>- import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;</span>
              <span className="text-[10px] text-[#93000a]/80 font-semibold">L14</span>
            </div>

            <div className="bg-[#164A40]/10 border-l-4 border-[#164A40] px-3 py-1.5 text-[#164A40] flex items-center justify-between font-medium">
              <span>+ import dev.langchain4j.store.embedding.EmbeddingStore;</span>
              <span className="text-[10px] text-[#164A40]/80 font-bold">L14</span>
            </div>

            <div className="bg-[#164A40]/10 border-l-4 border-[#164A40] px-3 py-1.5 text-[#164A40] flex items-center justify-between font-medium">
              <span>+ import dev.langchain4j.store.embedding.filter.Filter;</span>
              <span className="text-[10px] text-[#164A40]/80 font-bold">L15</span>
            </div>

            <div className="px-3 py-1 text-[#634F43]">
              &nbsp; public class RAGService &#123;
            </div>

            <div className="bg-[#93000a]/10 border-l-4 border-[#93000a] px-3 py-1.5 text-[#93000a] flex items-center justify-between">
              <span>- private final PgVectorEmbeddingStore embeddingStore;</span>
              <span className="text-[10px] text-[#93000a]/80 font-semibold">L60</span>
            </div>

            <div className="bg-[#164A40]/10 border-l-4 border-[#164A40] px-3 py-1.5 text-[#164A40] flex items-center justify-between font-medium">
              <span>+ private final EmbeddingStore&lt;TextSegment&gt; embeddingStore;</span>
              <span className="text-[10px] text-[#164A40]/80 font-bold">L60</span>
            </div>

            <div className="px-3 py-1 text-[#634F43]">
              &nbsp; &nbsp; public RAGService(EmbeddingStore&lt;TextSegment&gt; embeddingStore, ...) &#123;
            </div>

            <div className="mt-4 p-4 bg-[#F4EFEB] border border-[#A68B78]/40 text-[#201E1E] space-y-2">
              <div className="flex items-center space-x-2 text-[#164A40] font-bold">
                <Sparkles className="w-4 h-4 text-[#A68B78]" />
                <span>AI INLINE AUDIT COMMENTARY</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#634F43]">
                Refactoring from concrete class <code className="text-[#164A40] font-bold">PgVectorEmbeddingStore</code> to interface <code className="text-[#164A40] font-bold">EmbeddingStore&lt;TextSegment&gt;</code> prevents dependency injection crashes during cloud vector DB reconnect cycles.
              </p>
            </div>
          </div>
        </div>

        {/* Right Pane: Findings & Fix Applicator (42%) */}
        <div className="lg:col-span-5 bg-[#FDFBFC] border border-[#A68B78]/40 flex flex-col shadow-sm">
          <div className="bg-[#F4EFEB] border-b border-[#A68B78]/30 px-4 py-3 flex items-center space-x-4 text-xs font-mono">
            <button
              onClick={() => setActiveTab('diff')}
              className={`pb-1 font-bold transition-colors ${activeTab === 'diff' ? 'text-[#164A40] border-b-2 border-[#164A40]' : 'text-[#634F43]'}`}
            >
              FINDINGS ({currentReview.findings?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('fix-preview')}
              className={`pb-1 font-bold transition-colors ${activeTab === 'fix-preview' ? 'text-[#164A40] border-b-2 border-[#164A40]' : 'text-[#634F43]'}`}
            >
              AUTO-FIX APPLICATOR
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
            {activeTab === 'diff' ? (
              currentReview.findings?.map((finding, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveFinding(finding)}
                  className={`p-4 border transition-all cursor-pointer ${
                    activeFinding?.id === finding.id
                      ? 'bg-[#F4EFEB] border-[#164A40]'
                      : 'bg-[#FDFBFC] border-[#A68B78]/30 hover:border-[#164A40]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold border ${
                      finding.severity === 'CRITICAL'
                        ? 'bg-[#93000a] text-[#FDFBFC] border-[#93000a]'
                        : finding.severity === 'WARNING'
                        ? 'bg-[#164A40] text-[#F7D3CC] border-[#164A40]'
                        : 'bg-[#F4EFEB] border-[#A68B78]/40 text-[#634F43]'
                    }`}>
                      {finding.severity}
                    </span>
                    <span className="text-[10px] text-[#A68B78] font-semibold">{finding.category}</span>
                  </div>

                  <h4 className="font-bold text-[#164A40] mb-1">{finding.title}</h4>
                  <p className="text-[#634F43] text-[11px] leading-relaxed mb-3">{finding.description}</p>

                  <div className="bg-[#FDFBFC] p-3 border border-[#A68B78]/30 text-[#164A40] text-[11px]">
                    <span className="text-[#A68B78] block text-[9px] uppercase font-bold">Suggested Fix:</span>
                    {finding.suggestion}
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-4">
                <div className="p-5 bg-[#F4EFEB] border border-[#A68B78]/40 space-y-3">
                  <h4 className="text-xs font-bold text-[#164A40] uppercase">Automated AST Code Fix</h4>
                  <p className="text-[11px] text-[#634F43]">Apply recommended batch insertion optimization to RAGService.java:</p>

                  <div className="bg-[#FDFBFC] p-3 border border-[#A68B78]/40 text-[#164A40] text-[11px] overflow-x-auto font-bold">
                    <code>
                      // Optimized batch insertion<br />
                      embeddingStore.addAll(embeddings, textSegments);
                    </code>
                  </div>

                  <button
                    onClick={() => alert('Fix patch created for GitHub Pull Request.')}
                    className="w-full py-2.5 bg-[#164A40] hover:bg-[#0f362e] text-[#FDFBFC] hover:text-[#F7D3CC] font-bold text-xs transition-colors flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5 text-[#F7D3CC]" />
                    <span>PUSH AUTO-FIX TO GITHUB PR</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
