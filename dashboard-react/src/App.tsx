import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, LayoutDashboard, Lock, Key, 
  GitPullRequest, Database, BookOpen, Activity, Menu, X 
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
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
    { id: 'landing', label: 'OVERVIEW', shortLabel: 'HOME', icon: Activity },
    { id: 'overview', label: 'DASHBOARD', shortLabel: 'DASH', icon: LayoutDashboard },
    { id: 'diff-studio', label: 'PR STUDIO', shortLabel: 'PR DIFF', icon: GitPullRequest },
    { id: 'docs-studio', label: 'DOCS', shortLabel: 'DOCS', icon: BookOpen },
    { id: 'rag-studio', label: 'RAG KNOWLEDGE', shortLabel: 'RAG', icon: Database },
    { id: 'credentials', label: 'GOVERNANCE', shortLabel: 'KEYS', icon: Key },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBFC] text-[#201E1E] font-sans selection:bg-[#F7D3CC] selection:text-[#164A40] flex flex-col relative">
      
      {/* ========================================================================= */}
      {/* DESKTOP RIGHT-SIDE VERTICAL NAVIGATION RAIL (Fixed 110px width on Right)  */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex fixed right-0 top-0 bottom-0 w-[110px] bg-[#164A40] text-[#FDFBFC] flex-col justify-between items-center py-6 border-l border-[#A68B78]/30 z-50 select-none shadow-xl">
        
        {/* Top: Brand Identity / Logo */}
        <div 
          onClick={() => setActiveTab('landing')}
          className="flex flex-col items-center cursor-pointer group px-2 text-center"
        >
          <div className="w-10 h-10 bg-[#FDFBFC] text-[#164A40] flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-display font-black text-[11px] tracking-widest text-[#FDFBFC] mt-2 group-hover:text-[#F7D3CC] transition-colors">
            SENTINAI
          </span>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#F7D3CC] text-[#164A40] mt-1 tracking-wider">
            PRO
          </span>
        </div>

        {/* Center: Vertical Navigation Rail Items */}
        <nav className="flex flex-col items-center space-y-5 my-auto w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full py-2.5 px-1.5 flex flex-col items-center justify-center space-y-1 transition-all duration-300 relative group ${
                  isActive
                    ? 'text-[#F7D3CC] font-bold'
                    : 'text-[#FDFBFC]/70 hover:text-[#F7D3CC]'
                }`}
              >
                {/* Active Indicator Accent Line on Right Edge */}
                {isActive && (
                  <motion.div 
                    layoutId="activeNavIndicator"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#F7D3CC]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-[#F7D3CC]' : 'text-[#FDFBFC]/70 group-hover:text-[#F7D3CC]'}`} />
                
                <span className="text-[9px] font-mono tracking-widest text-center leading-tight">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Controls & Telemetry */}
        <div className="flex flex-col items-center space-y-4 px-2 w-full">
          {/* Subtle Decorative Dots */}
          <div className="flex space-x-1.5 text-[#A68B78]/60 text-[10px]">
            <span>•</span>
            <span>•</span>
            <span>•</span>
          </div>

          {/* API Health Pill */}
          <div className="flex flex-col items-center text-[9px] font-mono text-[#A68B78]">
            <span className="flex h-2 w-2 relative mb-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F7D3CC] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F7D3CC]"></span>
            </span>
            <span className="text-[8px] tracking-tighter text-[#FDFBFC]/80">{healthStatus}</span>
          </div>

          {/* Auth Gate Button */}
          <button
            onClick={() => setIsLockscreenOpen(true)}
            title={apiKey ? 'API Key Active' : 'Unlock Auth Session'}
            className="w-8 h-8 bg-[#FDFBFC]/10 hover:bg-[#F7D3CC] border border-[#A68B78]/40 hover:border-[#F7D3CC] text-[#FDFBFC] hover:text-[#164A40] transition-colors flex items-center justify-center"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE / TABLET HEADER (< lg Viewports)                                  */}
      {/* ========================================================================= */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#164A40] text-[#FDFBFC] border-b border-[#A68B78]/30 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
          <div className="w-7 h-7 bg-[#FDFBFC] text-[#164A40] flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-black text-sm text-[#FDFBFC] tracking-wider">SENTINAI</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-[#F7D3CC] text-[#164A40]">PRO</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsLockscreenOpen(true)}
            className="p-1.5 bg-[#FDFBFC]/10 text-[#F7D3CC] border border-[#A68B78]/30 text-xs font-mono"
          >
            <Lock className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 text-[#FDFBFC] hover:text-[#F7D3CC] transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Editorial Overlay Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed inset-0 top-[53px] z-30 bg-[#164A40] text-[#FDFBFC] p-6 flex flex-col justify-between border-t border-[#A68B78]/30"
          >
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`p-4 border text-left font-mono text-xs font-bold transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-[#FDFBFC] text-[#164A40] border-[#F7D3CC]'
                        : 'bg-transparent border-[#A68B78]/30 text-[#FDFBFC] hover:bg-[#FDFBFC]/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <span className="text-[10px] text-[#164A40] font-black">ACTIVE</span>}
                  </button>
                );
              })}
            </nav>

            <div className="pt-6 border-t border-[#A68B78]/30 flex justify-between items-center text-xs font-mono text-[#A68B78]">
              <span>STATUS: {healthStatus}</span>
              <span>SENTINAI V1.0</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MAIN CONTENT BODY (Offset on Desktop by lg:pr-[110px] for Right Nav Rail) */}
      {/* ========================================================================= */}
      <main className="flex-1 lg:pr-[110px] transition-all">
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
      <footer className="lg:pr-[110px] border-t border-[#A68B78]/30 bg-[#164A40] text-[#FDFBFC] px-6 py-6 text-center text-xs font-mono">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SentinAI Autonomous Code Security Agent &copy; {new Date().getFullYear()}</span>
          <span className="text-[#F7D3CC]">Cotswolds Luxury Editorial Architecture</span>
        </div>
      </footer>
    </div>
  );
}
