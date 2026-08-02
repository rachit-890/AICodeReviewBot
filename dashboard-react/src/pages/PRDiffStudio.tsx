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
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Controls Bar */}
      <div className="bg-[#161d1b] border border-[#3c4a46] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <form onSubmit={handleRunAudit} className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-mono text-[#bacac5] uppercase mb-1">Target PR URL</label>
            <input
              type="text"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              className="w-full bg-[#09100e] border border-[#3c4a46] px-3 py-1.5 text-xs font-mono text-[#dde4e1] focus:outline-none focus:border-[#2dd4bf]"
              placeholder="https://github.com/owner/repo/pull/1"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[#bacac5] uppercase mb-1">Commit SHA</label>
            <input
              type="text"
              value={headCommitSha}
              onChange={(e) => setHeadCommitSha(e.target.value)}
              className="w-full bg-[#09100e] border border-[#3c4a46] px-3 py-1.5 text-xs font-mono text-[#dde4e1] focus:outline-none focus:border-[#2dd4bf]"
              placeholder="Commit SHA"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full py-2 px-4 bg-[#2dd4bf] hover:bg-[#57f1db] text-[#0e1513] font-bold text-xs font-mono tracking-wider transition-colors flex items-center justify-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>ANALYZING AST & RAG...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>RUN AI SECURITY AUDIT</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="flex items-center space-x-4 border-l border-[#3c4a46] pl-4 text-xs font-mono">
          <div>
            <span className="text-[#bacac5] block text-[10px]">AUDIT SCORE</span>
            <span className="text-lg font-bold text-[#57f1db]">{currentReview.overallScore} / 100</span>
          </div>
          <div>
            <span className="text-[#bacac5] block text-[10px]">TOTAL ISSUES</span>
            <span className="text-lg font-bold text-[#ffb4ab]">{currentReview.findings?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* 58/42 Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px]">
        {/* Left Pane: Code Diff Viewer (58%) */}
        <div className="lg:col-span-7 bg-[#161d1b] border border-[#3c4a46] flex flex-col">
          <div className="bg-[#1a211f] border-b border-[#3c4a46] px-4 py-2.5 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2 text-[#dde4e1]">
              <FileCode className="w-4 h-4 text-[#2dd4bf]" />
              <span className="font-bold">DIFF INSPECTOR</span>
              <span className="text-[#859490]">({currentReview.repository})</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-[#57f1db]">+79 lines</span>
              <span className="text-[#ffb4ab]">-17 lines</span>
            </div>
          </div>

          <div className="flex-1 bg-[#09100e] p-4 overflow-x-auto font-mono text-xs space-y-1">
            <div className="text-[#859490] border-b border-[#3c4a46] pb-2 mb-3">
              @@ -14,7 +14,9 @@ import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;
            </div>

            <div className="bg-[#93000a]/20 border-l-2 border-[#ffb4ab] px-3 py-1 text-[#ffb4ab] flex items-center justify-between">
              <span>- import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;</span>
              <span className="text-[10px] text-[#ffb4ab]/70">L14</span>
            </div>

            <div className="bg-[#00574d]/20 border-l-2 border-[#2dd4bf] px-3 py-1 text-[#57f1db] flex items-center justify-between">
              <span>+ import dev.langchain4j.store.embedding.EmbeddingStore;</span>
              <span className="text-[10px] text-[#2dd4bf]/70">L14</span>
            </div>

            <div className="bg-[#00574d]/20 border-l-2 border-[#2dd4bf] px-3 py-1 text-[#57f1db] flex items-center justify-between">
              <span>+ import dev.langchain4j.store.embedding.filter.Filter;</span>
              <span className="text-[10px] text-[#2dd4bf]/70">L15</span>
            </div>

            <div className="px-3 py-1 text-[#bacac5]">
              &nbsp; public class RAGService &#123;
            </div>

            <div className="bg-[#93000a]/20 border-l-2 border-[#ffb4ab] px-3 py-1 text-[#ffb4ab] flex items-center justify-between">
              <span>- private final PgVectorEmbeddingStore embeddingStore;</span>
              <span className="text-[10px] text-[#ffb4ab]/70">L60</span>
            </div>

            <div className="bg-[#00574d]/20 border-l-2 border-[#2dd4bf] px-3 py-1 text-[#57f1db] flex items-center justify-between">
              <span>+ private final EmbeddingStore&lt;TextSegment&gt; embeddingStore;</span>
              <span className="text-[10px] text-[#2dd4bf]/70">L60</span>
            </div>

            <div className="px-3 py-1 text-[#bacac5]">
              &nbsp; &nbsp; public RAGService(EmbeddingStore&lt;TextSegment&gt; embeddingStore, ...) &#123;
            </div>

            <div className="mt-4 p-3 bg-[#1a211f] border border-[#3c4a46] text-[#bacac5] space-y-2">
              <div className="flex items-center space-x-2 text-[#2dd4bf] font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI INLINE AUDIT COMMENTARY</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Refactoring from concrete class <code className="text-[#2dd4bf]">PgVectorEmbeddingStore</code> to interface <code className="text-[#2dd4bf]">EmbeddingStore&lt;TextSegment&gt;</code> prevents dependency injection crashes during cloud vector DB reconnect cycles.
              </p>
            </div>
          </div>
        </div>

        {/* Right Pane: Findings & Fix Applicator (42%) */}
        <div className="lg:col-span-5 bg-[#161d1b] border border-[#3c4a46] flex flex-col">
          <div className="bg-[#1a211f] border-b border-[#3c4a46] px-4 py-2.5 flex items-center space-x-4 text-xs font-mono">
            <button
              onClick={() => setActiveTab('diff')}
              className={`pb-1 font-bold ${activeTab === 'diff' ? 'text-[#2dd4bf] border-b-2 border-[#2dd4bf]' : 'text-[#bacac5]'}`}
            >
              FINDINGS ({currentReview.findings?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('fix-preview')}
              className={`pb-1 font-bold ${activeTab === 'fix-preview' ? 'text-[#2dd4bf] border-b-2 border-[#2dd4bf]' : 'text-[#bacac5]'}`}
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
                      ? 'bg-[#1a211f] border-[#2dd4bf]'
                      : 'bg-[#09100e] border-[#3c4a46] hover:border-[#859490]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold border ${
                      finding.severity === 'CRITICAL'
                        ? 'bg-[#93000a]/40 border-[#ffb4ab] text-[#ffb4ab]'
                        : finding.severity === 'WARNING'
                        ? 'bg-[#00574d]/40 border-[#2dd4bf] text-[#57f1db]'
                        : 'bg-[#1a211f] border-[#3c4a46] text-[#bacac5]'
                    }`}>
                      {finding.severity}
                    </span>
                    <span className="text-[10px] text-[#bacac5]">{finding.category}</span>
                  </div>

                  <h4 className="font-bold text-[#dde4e1] mb-1">{finding.title}</h4>
                  <p className="text-[#bacac5] text-[11px] leading-relaxed mb-3">{finding.description}</p>

                  <div className="bg-[#0e1513] p-2 border border-[#3c4a46] text-[#2dd4bf] text-[11px]">
                    <span className="text-[#859490] block text-[9px] uppercase">Suggested Fix:</span>
                    {finding.suggestion}
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-[#09100e] border border-[#3c4a46] space-y-3">
                  <h4 className="text-xs font-bold text-[#57f1db] uppercase">Automated AST Code Fix</h4>
                  <p className="text-[11px] text-[#bacac5]">Apply recommended batch insertion optimization to RAGService.java:</p>

                  <div className="bg-[#0e1513] p-3 border border-[#3c4a46] text-[#57f1db] text-[11px] overflow-x-auto">
                    <code>
                      // Optimized batch insertion<br />
                      embeddingStore.addAll(embeddings, textSegments);
                    </code>
                  </div>

                  <button
                    onClick={() => alert('Fix patch created for GitHub Pull Request.')}
                    className="w-full py-2 bg-[#2dd4bf] hover:bg-[#57f1db] text-[#0e1513] font-bold text-xs transition-colors flex items-center justify-center space-x-2"
                  >
                    <Send className="w-3.5 h-3.5" />
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
