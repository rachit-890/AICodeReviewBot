import React, { useState } from 'react';
import { BookOpen, Sparkles, Download } from 'lucide-react';
import { apiService } from '../services/api';
import type { DocExplanation } from '../types';

interface DocsStudioProps {
  apiKey: string;
}

export function DocsStudio({ apiKey }: DocsStudioProps) {
  const [codeSnippet, setCodeSnippet] = useState(
    `public class RAGService {\n    private final EmbeddingStore<TextSegment> embeddingStore;\n    private final EmbeddingModel embeddingModel;\n\n    public RAGService(EmbeddingStore<TextSegment> embeddingStore, EmbeddingModel embeddingModel) {\n        this.embeddingStore = embeddingStore;\n        this.embeddingModel = embeddingModel;\n    }\n}`
  );
  const [filePath, setFilePath] = useState('prReviewBot/src/main/java/com/proj/prreviewbot/service/RAGService.java');
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<DocExplanation | null>({
    explanation: 'This Java service class implements Retrieval-Augmented Generation (RAG) using LangChain4j and Google Gemini. It injects a generic `EmbeddingStore<TextSegment>` bean to store source code vector embeddings and query similarity matches.',
    astBreakdown: [
      'Class: RAGService (@Service annotated Spring bean)',
      'Dependency Injection: Constructor-injected EmbeddingStore & EmbeddingModel',
      'Security: Thread-safe final fields'
    ],
    complexityScore: 88
  });

  const handleGenerateDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExplaining(true);
    try {
      const res = await apiService.explainCode(codeSnippet, filePath, apiKey);
      setExplanation(res);
    } catch (err: any) {
      console.warn('Backend fallback explanation active:', err.message);
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="border-b border-[#3c4a46] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-display tracking-tight text-[#dde4e1] uppercase flex items-center space-x-3">
            <span>DOCS & EXPLANATION STUDIO</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 bg-[#00574d]/40 border border-[#2dd4bf] text-[#57f1db]">
              AST ANALYSIS
            </span>
          </h2>
          <p className="text-xs text-[#bacac5] font-mono mt-1">Automated code documentation generation, AST parsing, and technical markdown export.</p>
        </div>

        <button
          onClick={() => {
            const blob = new Blob([explanation?.explanation || ''], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'CODE_EXPLANATION.md';
            a.click();
          }}
          className="px-4 py-2 bg-[#161d1b] border border-[#3c4a46] hover:border-[#2dd4bf] text-xs font-mono text-[#57f1db] transition-colors flex items-center space-x-2 w-fit"
        >
          <Download className="w-4 h-4" />
          <span>EXPORT MARKDOWN DOCS</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input Pane */}
        <div className="lg:col-span-6 bg-[#161d1b] border border-[#3c4a46] p-5 space-y-4">
          <form onSubmit={handleGenerateDocs} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-[10px] text-[#bacac5] uppercase mb-1">Target File Path</label>
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                className="w-full bg-[#09100e] border border-[#3c4a46] px-3 py-1.5 text-xs font-mono text-[#dde4e1] focus:outline-none focus:border-[#2dd4bf]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#bacac5] uppercase mb-1">Code Snippet Input</label>
              <textarea
                rows={12}
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                className="w-full bg-[#09100e] border border-[#3c4a46] p-3 text-xs font-mono text-[#57f1db] focus:outline-none focus:border-[#2dd4bf]"
              />
            </div>

            <button
              type="submit"
              disabled={isExplaining}
              className="w-full py-3 bg-[#2dd4bf] hover:bg-[#57f1db] text-[#0e1513] font-bold text-xs font-mono tracking-wider transition-colors flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isExplaining ? 'PARSING AST WITH GEMINI...' : 'GENERATE AI DOCUMENTATION'}</span>
            </button>
          </form>
        </div>

        {/* Right Explanation Output Pane */}
        <div className="lg:col-span-6 bg-[#161d1b] border border-[#3c4a46] p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-[#3c4a46] pb-3">
            <h3 className="text-sm font-bold font-display text-[#dde4e1] uppercase flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-[#2dd4bf]" />
              <span>GENERATED DOCUMENTATION</span>
            </h3>
            <span className="text-xs font-mono text-[#57f1db]">SCORE: {explanation?.complexityScore || 90}/100</span>
          </div>

          <div className="bg-[#09100e] border border-[#3c4a46] p-4 text-xs font-mono text-[#dde4e1] space-y-4">
            <div>
              <span className="text-[#2dd4bf] font-bold block mb-1"># High-Level Architecture Overview</span>
              <p className="text-[#bacac5] leading-relaxed">{explanation?.explanation}</p>
            </div>

            {explanation?.astBreakdown && (
              <div>
                <span className="text-[#57f1db] font-bold block mb-2"># AST Structural Components</span>
                <ul className="space-y-1 text-[#bacac5]">
                  {explanation.astBreakdown.map((item, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <span className="text-[#2dd4bf]">›</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
