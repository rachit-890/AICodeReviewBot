import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Terminal, Sparkles, ArrowRight, GitPullRequest, 
  Database, Lock, CheckCircle2, Zap
} from 'lucide-react';

interface LandingPageProps {
  onOpenConsole: () => void;
  onNavigateTab: (tab: string) => void;
}

export function LandingPage({ onOpenConsole, onNavigateTab }: LandingPageProps) {
  const [demoPrUrl, setDemoPrUrl] = useState('https://github.com/rachit-890/AICodeReviewBot/pull/1');
  const [demoSha, setDemoSha] = useState('e731e5d7178d72272eeaeb15236705b8a4133254');

  return (
    <div className="relative min-h-screen bg-white text-[#201E1E] overflow-hidden">
      {/* Hero Section - Editorial Asymmetric Layout */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pt-12 pb-20">
        
        {/* Small Technical Label */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-3 text-xs font-mono text-[#634F43] mb-6"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#164A40] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#164A40]"></span>
          </span>
          <span className="tracking-wide">SENTINAI PLATFORM V1.0</span>
          <span className="text-[#A68B78]">•</span>
          <span className="text-[#164A40] font-semibold">SPRING BOOT 3.4 + GEMINI AI</span>
        </motion.div>

        {/* Hero Asymmetric Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          
          {/* Main Editorial Headline (Left 7 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-sans font-extrabold text-[#164A40] tracking-tight text-[clamp(2.75rem,5.5vw,5.5rem)] leading-[0.98]"
            >
              Autonomous code security & pull request intelligence
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-editorial italic text-xl sm:text-2xl text-[#634F43] font-normal leading-relaxed max-w-2xl"
            >
              "Enterprise-grade static analysis, AST vulnerability detection, and vector context retrieval crafted for software engineering teams that value precision."
            </motion.p>
          </div>

          {/* Right Column: CTA Buttons & Quick Note (4 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-4 space-y-4 pt-4 lg:pt-0"
          >
            <p className="text-xs text-[#634F43] font-sans leading-relaxed">
              Real-time automated code reviews, zero-leak key governance, and dynamic AST parsing integrated into your GitHub workflow.
            </p>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 pt-2">
              <button
                onClick={onOpenConsole}
                className="px-6 py-3.5 bg-[#164A40] hover:bg-[#0f362e] text-[#FDFBFC] font-sans font-semibold text-xs tracking-wide transition-all flex items-center justify-between shadow-sm hover:text-[#F7D3CC]"
              >
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-[#F7D3CC]" />
                  <span>Launch Security Console</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#F7D3CC]" />
              </button>

              <button
                onClick={() => onNavigateTab('diff-studio')}
                className="px-6 py-3.5 bg-transparent hover:bg-[#F7D3CC]/30 border border-[#164A40] text-[#164A40] font-sans font-semibold text-xs tracking-wide transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <GitPullRequest className="w-4 h-4 text-[#164A40]" />
                  <span>Open PR Diff Studio</span>
                </div>
                <ArrowRight className="w-4 h-4 text-[#164A40]" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Statistics - Whitespace & Typography focused (No Heavy Cards) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-t border-b border-[#A68B78]/25 my-16"
        >
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold font-sans text-[#164A40] tracking-tight">14,290+</div>
            <div className="text-xs font-mono text-[#634F43] mt-2 uppercase tracking-wider">PRs audited</div>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold font-sans text-[#164A40] tracking-tight">&lt; 1.4s</div>
            <div className="text-xs font-mono text-[#634F43] mt-2 uppercase tracking-wider">Average scan time</div>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold font-sans text-[#164A40] tracking-tight">99.8%</div>
            <div className="text-xs font-mono text-[#634F43] mt-2 uppercase tracking-wider">AST detection accuracy</div>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold font-sans text-[#164A40] tracking-tight">768-dim</div>
            <div className="text-xs font-mono text-[#634F43] mt-2 uppercase tracking-wider">RAG context store</div>
          </div>
        </motion.div>

        {/* Live Interactive Quick Audit Demo */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#F4EFEB] border border-[#A68B78]/30 p-8 shadow-sm relative"
        >
          <div className="flex items-center justify-between border-b border-[#A68B78]/20 pb-4 mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono text-[#164A40] font-semibold">quick_pr_audit.sh</span>
            </div>
            <span className="text-xs font-mono text-[#A68B78]">LIVE ENGINE PREVIEW</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4 font-sans">
              <div>
                <label className="block text-xs font-mono text-[#634F43] uppercase mb-1.5 font-medium">GitHub Pull Request URL</label>
                <input
                  type="text"
                  value={demoPrUrl}
                  onChange={(e) => setDemoPrUrl(e.target.value)}
                  className="w-full bg-[#FDFBFC] border border-[#A68B78]/30 px-4 py-2.5 text-xs font-mono text-[#201E1E] focus:outline-none focus:border-[#164A40]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#634F43] uppercase mb-1.5 font-medium">Head Commit SHA</label>
                <input
                  type="text"
                  value={demoSha}
                  onChange={(e) => setDemoSha(e.target.value)}
                  className="w-full bg-[#FDFBFC] border border-[#A68B78]/30 px-4 py-2.5 text-xs font-mono text-[#201E1E] focus:outline-none focus:border-[#164A40]"
                />
              </div>

              <button
                onClick={() => onNavigateTab('diff-studio')}
                className="w-full py-3.5 bg-[#164A40] hover:bg-[#0f362e] text-[#FDFBFC] hover:text-[#F7D3CC] font-sans text-xs font-semibold transition-all flex items-center justify-center space-x-2 shadow-sm"
              >
                <Zap className="w-4 h-4 text-[#F7D3CC]" />
                <span>Execute analysis in PR Studio</span>
              </button>
            </div>

            {/* Architecture Pipeline Preview */}
            <div className="bg-[#FDFBFC] border border-[#A68B78]/30 p-6 text-xs font-sans space-y-3">
              <div className="text-[#164A40] font-bold font-editorial text-base border-b border-[#A68B78]/20 pb-2">
                Analysis Pipeline
              </div>
              <div className="flex items-center space-x-3 text-[#201E1E]">
                <CheckCircle2 className="w-4 h-4 text-[#164A40]" />
                <span>GitHub Webhook Listener</span>
              </div>
              <div className="flex items-center space-x-3 text-[#201E1E]">
                <CheckCircle2 className="w-4 h-4 text-[#164A40]" />
                <span>Spring Boot Security Gate</span>
              </div>
              <div className="flex items-center space-x-3 text-[#201E1E]">
                <CheckCircle2 className="w-4 h-4 text-[#164A40]" />
                <span>LangChain4j RAG Vector Store</span>
              </div>
              <div className="flex items-center space-x-3 text-[#201E1E]">
                <CheckCircle2 className="w-4 h-4 text-[#164A40]" />
                <span>Gemini 2.5 Pro Static Audit</span>
              </div>
              <div className="flex items-center space-x-3 text-[#164A40] font-medium pt-2 border-t border-[#A68B78]/20">
                <Sparkles className="w-4 h-4 text-[#A68B78]" />
                <span>Automated PR Inline Comments</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Editorial Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: 'AST Vulnerability Audit',
              desc: 'Identifies SQL injections, unhandled concurrency locks, secret leaks, and high-risk API contracts before merge.',
            },
            {
              icon: Database,
              title: 'PgVector RAG Context',
              desc: 'Embeds repository source code into 768-dimension vectors for deep semantic cross-file context analysis.',
            },
            {
              icon: Lock,
              title: 'Client Key Governance',
              desc: 'Zero-trust API key auth with rate-limiting, instant key revocation, and client usage telemetry.',
            },
          ].map((feature, i) => (
            <div key={i} className="bg-[#FDFBFC] border border-[#A68B78]/30 p-8 hover:border-[#164A40] transition-colors shadow-sm space-y-4">
              <div className="w-10 h-10 bg-[#F4EFEB] border border-[#A68B78]/30 flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-[#164A40]" />
              </div>
              <h3 className="text-xl font-bold font-sans text-[#164A40]">{feature.title}</h3>
              <p className="text-xs text-[#634F43] font-sans leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
