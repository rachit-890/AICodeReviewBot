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
    <div className="relative min-h-screen bg-[#0e1513] text-[#dde4e1] overflow-hidden">
      {/* 3D Particle Canvas Background */}
      <Hero3DCanvas />

      {/* Grid Pattern Backdrop */}
      <div className="absolute inset-0 grid-bg-obsidian pointer-events-none opacity-40" />

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Top Status Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-3 px-4 py-1.5 bg-[#161d1b] border border-[#3c4a46] text-xs font-mono"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2dd4bf] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2dd4bf]"></span>
            </span>
            <span className="text-[#bacac5]">SENTINAI INTELLIGENCE PLATFORM V1.0</span>
            <span className="text-[#3c4a46]">|</span>
            <span className="text-[#57f1db]">SPRING BOOT 3.4 + GEMINI AI</span>
          </motion.div>

          {/* Hero Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black font-display tracking-tight text-[#dde4e1] leading-none uppercase"
          >
            AUTONOMOUS CODE <br />
            <span className="gradient-text-teal text-glow-teal">SECURITY & PR REVIEW</span> AGENT
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-[#bacac5] font-sans max-w-2xl mx-auto leading-relaxed"
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
              className="w-full sm:w-auto px-8 py-4 bg-[#2dd4bf] hover:bg-[#57f1db] text-[#0e1513] font-bold text-sm font-mono tracking-wider transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-3 shadow-lg shadow-[#2dd4bf]/10"
            >
              <Terminal className="w-5 h-5" />
              <span>LAUNCH CONSOLE</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateTab('diff-studio')}
              className="w-full sm:w-auto px-8 py-4 bg-[#161d1b] hover:bg-[#1a211f] border border-[#3c4a46] hover:border-[#2dd4bf] text-[#dde4e1] font-mono text-sm tracking-wider transition-colors flex items-center justify-center space-x-3"
            >
              <GitPullRequest className="w-5 h-5 text-[#2dd4bf]" />
              <span>TEST PR DIFF STUDIO</span>
            </button>
          </motion.div>

          {/* Telemetry Counter Banner */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-[#3c4a46]/50 max-w-3xl mx-auto"
          >
            {[
              { label: 'PRs Audited', value: '14,290+', unit: 'PRs' },
              { label: 'Avg Scan Time', value: '< 1.4s', unit: 'Latency' },
              { label: 'AST Vulnerabilities', value: '99.8%', unit: 'Accuracy' },
              { label: 'RAG Context Store', value: '768-Dim', unit: 'PgVector' },
            ].map((stat, i) => (
              <div key={i} className="p-4 bg-[#161d1b]/60 border border-[#3c4a46] text-left">
                <div className="text-xs font-mono text-[#bacac5] uppercase">{stat.label}</div>
                <div className="text-xl font-bold font-mono text-[#57f1db] mt-1">{stat.value}</div>
                <div className="text-[10px] font-mono text-[#859490]">{stat.unit}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Live Interactive Quick Audit Demo */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-20 bg-[#161d1b] border border-[#3c4a46] p-6 shadow-2xl relative"
        >
          <div className="flex items-center justify-between border-b border-[#3c4a46] pb-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-[#ffb4ab]" />
              <div className="w-3 h-3 bg-[#57f1db]" />
              <div className="w-3 h-3 bg-[#2dd4bf]" />
              <span className="text-xs font-mono text-[#bacac5] ml-2">quick_pr_audit.sh</span>
            </div>
            <span className="text-xs font-mono text-[#2dd4bf]">LIVE ENGINE PREVIEW</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#bacac5] uppercase mb-1">GitHub Pull Request URL</label>
                <input
                  type="text"
                  value={demoPrUrl}
                  onChange={(e) => setDemoPrUrl(e.target.value)}
                  className="w-full bg-[#09100e] border border-[#3c4a46] px-4 py-2 text-xs font-mono text-[#dde4e1] focus:outline-none focus:border-[#2dd4bf]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#bacac5] uppercase mb-1">Head Commit SHA</label>
                <input
                  type="text"
                  value={demoSha}
                  onChange={(e) => setDemoSha(e.target.value)}
                  className="w-full bg-[#09100e] border border-[#3c4a46] px-4 py-2 text-xs font-mono text-[#dde4e1] focus:outline-none focus:border-[#2dd4bf]"
                />
              </div>

              <button
                onClick={() => onNavigateTab('diff-studio')}
                className="w-full py-3 bg-[#1a211f] hover:bg-[#242b2a] border border-[#3c4a46] hover:border-[#2dd4bf] text-[#2dd4bf] font-mono text-xs font-bold transition-all flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>EXECUTE FULL ANALYSIS IN PR STUDIO</span>
              </button>
            </div>

            {/* Architecture Pipeline Preview */}
            <div className="bg-[#09100e] border border-[#3c4a46] p-4 text-xs font-mono space-y-3">
              <div className="text-[#2dd4bf] font-bold border-b border-[#3c4a46] pb-2 uppercase">Analysis Pipeline</div>
              <div className="flex items-center space-x-2 text-[#dde4e1]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2dd4bf]" />
                <span>1. GitHub Webhook Listener</span>
              </div>
              <div className="flex items-center space-x-2 text-[#dde4e1]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2dd4bf]" />
                <span>2. Spring Boot Security Gate</span>
              </div>
              <div className="flex items-center space-x-2 text-[#dde4e1]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2dd4bf]" />
                <span>3. LangChain4j RAG Vector Store</span>
              </div>
              <div className="flex items-center space-x-2 text-[#dde4e1]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2dd4bf]" />
                <span>4. Gemini 2.5 Pro Static Audit</span>
              </div>
              <div className="flex items-center space-x-2 text-[#57f1db] font-bold pt-2 border-t border-[#3c4a46]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Automated PR Inline Comments</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="mt-28 grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div key={i} className="bg-[#161d1b] border border-[#3c4a46] p-6 hover:border-[#2dd4bf] transition-colors">
              <feature.icon className="w-8 h-8 text-[#2dd4bf] mb-4" />
              <h3 className="text-lg font-bold font-display text-[#dde4e1] mb-2">{feature.title}</h3>
              <p className="text-xs text-[#bacac5] leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
