import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, LayoutDashboard, Lock, Key, 
  GitPullRequest, Database, BookOpen, Activity
} from 'lucide-react';

import { LandingPage } from './pages/LandingPage';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { PRDiffStudio } from './pages/PRDiffStudio';
import { DocsStudio } from './pages/DocsStudio';
import { RAGStudio } from './pages/RAGStudio';
import { CredentialsManager } from './pages/CredentialsManager';
import { LockscreenModal } from './components/LockscreenModal';
import { apiService } from './services/api';
import type { ReviewDetail } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('sentinai_api_key') || '');
  const [isLockscreenOpen, setIsLockscreenOpen] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<string>('CHECKING...');
  const [reviewHistory, setReviewHistory] = useState<ReviewDetail[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewDetail | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Check backend connection health
  const checkHealth = async () => {
    const res = await apiService.getHealth(apiKey);
    setHealthStatus(res.status || 'OK');
  };

  // Load audit history
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await apiService.getReviewHistory(undefined, apiKey);
      setReviewHistory(data);
    } catch (err) {
      console.warn('Backend history load fallback');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    checkHealth();
    loadHistory();
  }, [apiKey]);

  const handleAuthenticate = (key: string) => {
    setApiKey(key);
    localStorage.setItem('sentinai_api_key', key);
  };

  const navItems = [
    { id: 'landing', label: 'OVERVIEW', icon: Activity },
    { id: 'overview', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'diff-studio', label: 'PR DIFF STUDIO', icon: GitPullRequest },
    { id: 'docs-studio', label: 'DOCS STUDIO', icon: BookOpen },
    { id: 'rag-studio', label: 'RAG KNOWLEDGE', icon: Database },
    { id: 'credentials', label: 'KEYS & GOVERNANCE', icon: Key },
  ];

  return (
    <div className="min-h-screen bg-[#0e1513] text-[#dde4e1] font-sans selection:bg-[#2dd4bf]/20 selection:text-[#57f1db] flex flex-col">
      {/* Top Main Navigation Bar (Stitch Screen 1033a060b4154ac0be9ba49377307413) */}
      <header className="sticky top-0 z-40 bg-[#161d1b]/90 backdrop-blur-md border-b border-[#3c4a46] px-4 lg:px-8 py-3 flex items-center justify-between">
        {/* Brand Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
          <div className="w-8 h-8 bg-[#1a211f] border border-[#2dd4bf] flex items-center justify-center text-[#2dd4bf]">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-black text-base text-[#dde4e1] tracking-wider">SENTINAI</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-[#00574d]/40 border border-[#2dd4bf] text-[#57f1db]">PRO</span>
            </div>
            <p className="text-[10px] font-mono text-[#bacac5] hidden sm:block">AI CODE REVIEW & SECURITY PLATFORM</p>
          </div>
        </div>

        {/* Center Tabs */}
        <nav className="hidden md:flex items-center space-x-1 font-mono text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 border transition-all flex items-center space-x-2 ${
                  isActive
                    ? 'bg-[#1a211f] border-[#2dd4bf] text-[#57f1db] font-bold shadow-sm shadow-[#2dd4bf]/20'
                    : 'bg-transparent border-transparent text-[#bacac5] hover:text-[#dde4e1] hover:bg-[#1a211f]/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#2dd4bf]' : 'text-[#bacac5]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          {/* Backend Status Pill */}
          <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 bg-[#09100e] border border-[#3c4a46]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2dd4bf] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2dd4bf]"></span>
            </span>
            <span className="text-[#bacac5] text-[11px]">API: {healthStatus}</span>
          </div>

          {/* Auth Key Gate */}
          <button
            onClick={() => setIsLockscreenOpen(true)}
            className="px-3 py-1.5 bg-[#1a211f] border border-[#3c4a46] hover:border-[#2dd4bf] text-[#2dd4bf] hover:text-[#57f1db] transition-colors flex items-center space-x-2"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{apiKey ? 'KEY ACTIVE' : 'AUTH LOCK'}</span>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div className="md:hidden bg-[#161d1b] border-b border-[#3c4a46] px-4 py-2 flex overflow-x-auto space-x-2 font-mono text-xs">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1.5 border shrink-0 ${
              activeTab === item.id
                ? 'bg-[#1a211f] border-[#2dd4bf] text-[#57f1db] font-bold'
                : 'border-[#3c4a46] text-[#bacac5]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main View Screen Body */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LandingPage
                onOpenConsole={() => setIsLockscreenOpen(true)}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            </motion.div>
          )}

          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <OverviewDashboard
                history={reviewHistory}
                isLoading={isLoadingHistory}
                onRefresh={loadHistory}
                onSelectReview={(rev) => {
                  setSelectedReview(rev);
                  setActiveTab('diff-studio');
                }}
              />
            </motion.div>
          )}

          {activeTab === 'diff-studio' && (
            <motion.div key="diff-studio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PRDiffStudio
                apiKey={apiKey}
                selectedReview={selectedReview}
                onReviewCreated={(newRev) => {
                  setReviewHistory([newRev, ...reviewHistory]);
                  setSelectedReview(newRev);
                }}
              />
            </motion.div>
          )}

          {activeTab === 'docs-studio' && (
            <motion.div key="docs-studio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DocsStudio apiKey={apiKey} />
            </motion.div>
          )}

          {activeTab === 'rag-studio' && (
            <motion.div key="rag-studio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RAGStudio apiKey={apiKey} />
            </motion.div>
          )}

          {activeTab === 'credentials' && (
            <motion.div key="credentials" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CredentialsManager apiKey={apiKey} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Console Lockscreen Modal */}
      <LockscreenModal
        isOpen={isLockscreenOpen}
        onClose={() => setIsLockscreenOpen(false)}
        onAuthenticate={handleAuthenticate}
        currentApiKey={apiKey}
      />

      {/* Footer */}
      <footer className="border-t border-[#3c4a46] bg-[#09100e] px-6 py-4 text-center text-xs font-mono text-[#859490]">
        SentinAI Autonomous Code Review & Intelligence Agent &copy; {new Date().getFullYear()} — Powered by Spring Boot & Google Gemini AI.
      </footer>
    </div>
  );
}
