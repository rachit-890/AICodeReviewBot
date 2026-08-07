import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Terminal, Sparkles, ArrowRight, GitPullRequest, 
  Database, Lock, CheckCircle2, Zap
} from 'lucide-react';
import { Hero3DCanvas } from '../components/Hero3DCanvas';

interface LandingPageProps {
  onOpenConsole: () => void;
  onNavigateTab: (tab: string) => void;
}

export function LandingPage({ onOpenConsole, onNavigateTab }: LandingPageProps) {
  const [demoPrUrl, setDemoPrUrl] = useState('https://github.com/rachit-890/AICodeReviewBot/pull/1');
  const [demoSha, setDemoSha] = useState('e731e5d7178d72272eeaeb15236705b8a4133254');

  return (
    <div className="relative min-h-screen bg-[#FDFBFC] text-[#201E1E] overflow-hidden">
      {/* 3D Particle Canvas Background */}
      <Hero3DCanvas />

      {/* Hero Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 pt-16 pb-24">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          
          {/* Status Pill Accent */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-3 px-4 py-1.5 bg-[#F4EFEB] border border-[#A68B78]/40 text-xs font-mono"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#164A40] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#164A40]"></span>
            </span>
            <span className="text-[#634F43] font-medium">SENTINAI INTELLIGENCE PLATFORM V1.0</span>
            <span className="text-[#A68B78]">|</span>
            <span className="text-[#164A40] font-bold">SPRING BOOT 3.4 + GEMINI AI</span>
          </motion.div>

          {/* Large Editorial Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black font-display tracking-tight text-[#164A40] leading-none uppercase"
          >
            AUTONOMOUS CODE <br />
            <span className="text-[#164A40] underline decoration-[#F7D3CC] decoration-4 underline-offset-8">SECURITY & PR REVIEW</span> AGENT
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-[#634F43] font-sans max-w-2xl mx-auto leading-relaxed"
          >
            Enterprise-grade static analysis, AST vulnerability detection, vector database context retrieval (RAG), and zero-leak client key governance for high-velocity software engineering teams.
          </motion.p>

          {/* Action CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={onOpenConsole}
              className="w-full sm:w-auto px-8 py-4 bg-[#164A40] hover:bg-[#0f362e] text-[#FDFBFC] font-bold text-sm font-mono tracking-wider transition-all flex items-center justify-center space-x-3 shadow-md hover:text-[#F7D3CC]"
            >
              <Terminal className="w-5 h-5 text-[#F7D3CC]" />
              <span>LAUNCH CONSOLE</span>
              <ArrowRight className="w-4 h-4 text-[#F7D3CC]" />
            </button>

            <button
              onClick={() => onNavigateTab('diff-studio')}
              className="w-full sm:w-auto px-8 py-4 bg-[#FDFBFC] hover:bg-[#F7D3CC]/30 border border-[#164A40] text-[#164A40] font-mono text-sm tracking-wider transition-colors flex items-center justify-center space-x-3 font-semibold"
            >
              <GitPullRequest className="w-5 h-5 text-[#164A40]" />
              <span>TEST PR DIFF STUDIO</span>
            </button>
          </motion.div>

          {/* Telemetry Counter Banner */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-[#A68B78]/30 max-w-4xl mx-auto"
          >
            {[
              { label: 'PRs Audited', value: '14,290+', unit: 'PRs' },
              { label: 'Avg Scan Time', value: '< 1.4s', unit: 'Latency' },
              { label: 'AST Vulnerabilities', value: '99.8%', unit: 'Accuracy' },
              { label: 'RAG Context Store', value: '768-Dim', unit: 'PgVector' },
            ].map((stat, i) => (
              <div key={i} className="p-5 bg-[#F4EFEB] border border-[#A68B78]/30 text-left">
                <div className="text-xs font-mono text-[#634F43] uppercase tracking-wider">{stat.label}</div>
                <div className="text-2xl font-bold font-mono text-[#164A40] mt-1">{stat.value}</div>
                <div className="text-[11px] font-mono text-[#A68B78] mt-0.5">{stat.unit}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Live Interactive Quick Audit Demo */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 bg-[#F4EFEB] border border-[#A68B78]/40 p-8 shadow-sm relative"
        >
          <div className="flex items-center justify-between border-b border-[#A68B78]/30 pb-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-[#A68B78]" />
              <div className="w-3 h-3 bg-[#F7D3CC]" />
              <div className="w-3 h-3 bg-[#164A40]" />
              <span className="text-xs font-mono text-[#634F43] ml-2 font-bold">quick_pr_audit.sh</span>
            </div>
            <span className="text-xs font-mono text-[#164A40] font-bold tracking-wider">LIVE ENGINE PREVIEW</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#634F43] uppercase mb-1 font-semibold">GitHub Pull Request URL</label>
                <input
                  type="text"
                  value={demoPrUrl}
                  onChange={(e) => setDemoPrUrl(e.target.value)}
                  className="w-full bg-[#FDFBFC] border border-[#A68B78]/40 px-4 py-2.5 text-xs font-mono text-[#201E1E] focus:outline-none focus:border-[#164A40]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#634F43] uppercase mb-1 font-semibold">Head Commit SHA</label>
                <input
                  type="text"
                  value={demoSha}
                  onChange={(e) => setDemoSha(e.target.value)}
                  className="w-full bg-[#FDFBFC] border border-[#A68B78]/40 px-4 py-2.5 text-xs font-mono text-[#201E1E] focus:outline-none focus:border-[#164A40]"
                />
              </div>

              <button
                onClick={() => onNavigateTab('diff-studio')}
                className="w-full py-3.5 bg-[#164A40] hover:bg-[#0f362e] text-[#FDFBFC] hover:text-[#F7D3CC] font-mono text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm"
              >
                <Zap className="w-4 h-4 text-[#F7D3CC]" />
                <span>EXECUTE FULL ANALYSIS IN PR STUDIO</span>
              </button>
            </div>

            {/* Architecture Pipeline Preview */}
            <div className="bg-[#FDFBFC] border border-[#A68B78]/40 p-5 text-xs font-mono space-y-3">
              <div className="text-[#164A40] font-bold border-b border-[#A68B78]/30 pb-2 uppercase tracking-wider">Analysis Pipeline</div>
              <div className="flex items-center space-x-2 text-[#201E1E]">
                <CheckCircle2 className="w-4 h-4 text-[#164A40]" />
                <span>1. GitHub Webhook Listener</span>
              </div>
              <div className="flex items-center space-x-2 text-[#201E1E]">
                <CheckCircle2 className="w-4 h-4 text-[#164A40]" />
                <span>2. Spring Boot Security Gate</span>
              </div>
              <div className="flex items-center space-x-2 text-[#201E1E]">
                <CheckCircle2 className="w-4 h-4 text-[#164A40]" />
                <span>3. LangChain4j RAG Vector Store</span>
              </div>
              <div className="flex items-center space-x-2 text-[#201E1E]">
                <CheckCircle2 className="w-4 h-4 text-[#164A40]" />
                <span>4. Gemini 2.5 Pro Static Audit</span>
              </div>
              <div className="flex items-center space-x-2 text-[#164A40] font-bold pt-2 border-t border-[#A68B78]/30">
                <Sparkles className="w-4 h-4 text-[#A68B78]" />
                <span>Automated PR Inline Comments</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Editorial Cards */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div key={i} className="bg-[#FDFBFC] border border-[#A68B78]/40 p-8 hover:border-[#164A40] transition-colors shadow-sm">
              <div className="w-12 h-12 bg-[#F4EFEB] border border-[#A68B78]/30 flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-[#164A40]" />
              </div>
              <h3 className="text-xl font-bold font-display text-[#164A40] mb-3">{feature.title}</h3>
              <p className="text-xs text-[#634F43] leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
