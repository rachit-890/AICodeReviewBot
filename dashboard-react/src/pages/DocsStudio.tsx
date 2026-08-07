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
    <div className="p-6 sm:p-10 space-y-8 max-w-6xl mx-auto bg-[#FDFBFC] text-[#201E1E] font-sans">
      {/* Top Header */}
      <div className="border-b border-[#A68B78]/25 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold font-sans text-[#164A40] flex items-center space-x-3">
            <span>Docs & Explanation Studio</span>
            <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 bg-[#164A40] text-[#F7D3CC]">
              AST ANALYSIS
            </span>
          </h2>
          <p className="text-sm font-editorial italic text-[#634F43] mt-1">Automated code documentation generation, AST parsing, and technical markdown export.</p>
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
          className="px-4 py-2.5 bg-[#F4EFEB] border border-[#A68B78]/30 hover:border-[#164A40] text-xs font-sans font-semibold text-[#164A40] hover:text-[#164A40] transition-colors flex items-center space-x-2 w-fit"
        >
          <Download className="w-4 h-4 text-[#164A40]" />
          <span>Export markdown docs</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Input Pane */}
        <div className="lg:col-span-6 bg-[#FDFBFC] border border-[#A68B78]/30 p-6 sm:p-8 space-y-5 shadow-sm">
          <form onSubmit={handleGenerateDocs} className="space-y-4 font-sans text-xs">
            <div>
              <label className="block text-xs font-mono text-[#634F43] uppercase mb-1.5 font-medium">Target File Path</label>
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                className="w-full bg-[#F4EFEB] border border-[#A68B78]/30 px-3.5 py-2.5 text-xs font-mono text-[#201E1E] focus:outline-none focus:border-[#164A40]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#634F43] uppercase mb-1.5 font-medium">Code Snippet Input</label>
              <textarea
                rows={12}
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                className="w-full bg-[#F4EFEB] border border-[#A68B78]/30 p-3.5 text-xs font-mono text-[#164A40] font-medium focus:outline-none focus:border-[#164A40]"
              />
            </div>

            <button
              type="submit"
              disabled={isExplaining}
              className="w-full py-3.5 bg-[#164A40] hover:bg-[#0f362e] text-[#FDFBFC] hover:text-[#F7D3CC] font-sans font-semibold text-xs transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-[#F7D3CC]" />
              <span>{isExplaining ? 'Parsing AST with Gemini...' : 'Generate AI documentation'}</span>
            </button>
          </form>
        </div>

        {/* Right Explanation Output Pane */}
        <div className="lg:col-span-6 bg-[#FDFBFC] border border-[#A68B78]/30 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#A68B78]/20 pb-4">
            <h3 className="text-xl font-extrabold font-sans text-[#164A40] flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-[#164A40]" />
              <span>Generated documentation</span>
            </h3>
            <span className="text-xs font-mono text-[#164A40] font-bold">SCORE: {explanation?.complexityScore || 90}/100</span>
          </div>

          <div className="bg-[#F4EFEB] border border-[#A68B78]/25 p-6 text-xs text-[#201E1E] space-y-5">
            <div>
              <span className="text-[#164A40] font-bold font-editorial text-base block mb-2">High-Level Architecture Overview</span>
              <p className="text-[#634F43] font-sans text-xs leading-relaxed">{explanation?.explanation}</p>
            </div>

            {explanation?.astBreakdown && (
              <div>
                <span className="text-[#164A40] font-bold font-sans block mb-2 uppercase text-[10px] tracking-wider">AST Structural Components</span>
                <ul className="space-y-1.5 text-[#634F43] font-mono text-xs">
                  {explanation.astBreakdown.map((item, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <span className="text-[#164A40] font-bold">›</span>
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
