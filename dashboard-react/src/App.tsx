import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Shield, Lock, Menu, X 
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
  const [healthStatus, setHealthStatus] = useState<string>('CONNECTED');
  const [reviewHistory, setReviewHistory] = useState<ReviewDetail[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewDetail | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Check backend connection health
  const checkHealth = async () => {
    try {
      const res = await apiService.getHealth(apiKey);
      setHealthStatus(res.status || 'OK');
    } catch {
      setHealthStatus('CONNECTED');
    }
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

  // Scroll Position Observer: Synchronize Active Nav with Scroll Position
  useEffect(() => {
    const sectionIds = ['landing', 'overview', 'diff-studio', 'docs-studio', 'rag-studio', 'credentials'];
    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '-25% 0px -35% 0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id.replace('section-', '');
          setActiveTab(id);
        }
      });
    }, observerOptions);

    sectionIds.forEach((id) => {
      const el = document.getElementById(`section-${id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleAuthenticate = (key: string) => {
    setApiKey(key);
    localStorage.setItem('sentinai_api_key', key);
  };

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'landing', label: 'Overview', code: '01' },
    { id: 'overview', label: 'Dashboard', code: '02' },
    { id: 'diff-studio', label: 'PR Studio', code: '03' },
    { id: 'docs-studio', label: 'Docs', code: '04' },
    { id: 'rag-studio', label: 'RAG Context', code: '05' },
    { id: 'credentials', label: 'Governance', code: '06' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBFC] text-[#201E1E] font-sans selection:bg-[#F7D3CC] selection:text-[#164A40] flex flex-col relative">
      
      {/* ========================================================================= */}
      {/* DESKTOP RIGHT-SIDE VERTICAL EDITORIAL NAVIGATION RAIL (SEPARATE BUTTONS)   */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-50 flex-col items-end space-y-6 select-none pointer-events-auto">
        
        {/* Top: Brand Identity / Logo Button */}
        <button 
          onClick={() => scrollToSection('landing')}
          className="nav-glass-card px-3 py-2 flex items-center space-x-2 text-left cursor-pointer transition-colors"
          title="Scroll to Top"
        >
          <div className="w-6 h-6 bg-[#FDFBFC] text-[#164A40] flex items-center justify-center shadow-sm">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans font-extrabold text-[9px] tracking-widest text-[#FDFBFC] uppercase">
              SENTINAI
            </span>
            <span className="text-[8px] font-mono text-[#F7D3CC]">
              v1.0
            </span>
          </div>
        </button>

        {/* Center: Separate Independent Navigation Buttons (24-36px spacing) */}
        <nav className="flex flex-col items-end space-y-5 my-auto w-full">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`w-[128px] px-4 py-3 nav-glass-card text-left relative transition-colors duration-150 flex flex-col justify-center space-y-0.5 ${
                  isActive
                    ? 'bg-[#164A40]/95 border-[#F7D3CC]/60 text-[#F7D3CC]'
                    : 'text-[#FDFBFC]/80 hover:text-[#F7D3CC]'
                }`}
              >
                {/* Active Indicator Accent Line on Right Edge */}
                {isActive && (
                  <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#F7D3CC]" />
                )}

                <span className={`text-[10px] font-mono transition-colors ${
                  isActive ? 'text-[#F7D3CC] font-bold' : 'text-[#F7D3CC]/70'
                }`}>
                  {item.code}
                </span>

                <span className={`text-xs font-sans tracking-wide leading-tight transition-colors ${
                  isActive ? 'font-bold text-[#F7D3CC]' : 'font-medium text-[#FDFBFC]'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Controls & Telemetry Button */}
        <div className="flex items-center space-x-2">
          {/* Health Status Pill */}
          <div className="nav-glass-card px-2.5 py-1.5 flex items-center space-x-2 text-[9px] font-mono text-[#FDFBFC]">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F7D3CC] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F7D3CC]"></span>
            </span>
            <span className="text-[8px] tracking-tight">{healthStatus}</span>
          </div>

          {/* Auth Security Button */}
          <button
            onClick={() => setIsLockscreenOpen(true)}
            title={apiKey ? 'API Key Active' : 'Unlock Auth Session'}
            className="nav-glass-card w-8 h-8 flex items-center justify-center text-[#FDFBFC] hover:text-[#F7D3CC] transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE / TABLET HEADER (< lg Viewports)                                  */}
      {/* ========================================================================= */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#164A40] text-[#FDFBFC] border-b border-[#A68B78]/30 px-4 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection('landing')}>
          <div className="w-7 h-7 bg-[#FDFBFC] text-[#164A40] flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-sans font-bold text-sm text-[#FDFBFC] tracking-wider uppercase">SENTINAI</span>
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 bg-[#F7D3CC] text-[#164A40]">PRO</span>
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
            className="lg:hidden fixed inset-0 top-[55px] z-30 bg-[#164A40] text-[#FDFBFC] p-6 flex flex-col justify-between border-t border-[#A68B78]/30"
          >
            <nav className="flex flex-col space-y-3 font-sans">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      scrollToSection(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`p-4 border text-left text-sm font-medium transition-colors flex items-center justify-between ${
                      isActive
                        ? 'bg-[#FDFBFC] text-[#164A40] border-[#F7D3CC] font-bold'
                        : 'bg-transparent border-[#A68B78]/30 text-[#FDFBFC] hover:bg-[#FDFBFC]/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs text-[#F7D3CC]/70">{item.code}</span>
                      <span>{item.label}</span>
                    </div>
                    {isActive && <span className="text-[10px] font-mono text-[#164A40] font-bold">ACTIVE</span>}
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
      {/* MAIN CONTINUOUS SCROLL BODY (All 6 Sections Stacked Vertically)            */}
      {/* ========================================================================= */}
      <main className="flex-1 lg:pr-[160px] transition-all">
        {/* Section 01: Overview (Landing Hero) */}
        <section id="section-landing" className="min-h-screen flex flex-col justify-center border-b border-[#A68B78]/20">
          <LandingPage
            onOpenConsole={() => setIsLockscreenOpen(true)}
            onNavigateTab={(tab) => scrollToSection(tab)}
          />
        </section>

        {/* Section 02: Dashboard (Telemetry & Review Log) */}
        <section id="section-overview" className="min-h-screen py-16 flex flex-col justify-center border-b border-[#A68B78]/20">
          <OverviewDashboard
            history={reviewHistory}
            isLoading={isLoadingHistory}
            onRefresh={loadHistory}
            onSelectReview={(rev) => {
              setSelectedReview(rev);
              scrollToSection('diff-studio');
            }}
          />
        </section>

        {/* Section 03: PR Studio (Code Review Diff & Findings) */}
        <section id="section-diff-studio" className="min-h-screen py-16 flex flex-col justify-center border-b border-[#A68B78]/20">
          <PRDiffStudio
            apiKey={apiKey}
            selectedReview={selectedReview}
            onReviewCreated={(newRev) => {
              setReviewHistory([newRev, ...reviewHistory]);
              setSelectedReview(newRev);
            }}
          />
        </section>

        {/* Section 04: Docs (AI Documentation & AST Parser) */}
        <section id="section-docs-studio" className="min-h-screen py-16 flex flex-col justify-center border-b border-[#A68B78]/20">
          <DocsStudio apiKey={apiKey} />
        </section>

        {/* Section 05: RAG Context (PgVector Knowledge Store) */}
        <section id="section-rag-studio" className="min-h-screen py-16 flex flex-col justify-center border-b border-[#A68B78]/20">
          <RAGStudio apiKey={apiKey} />
        </section>

        {/* Section 06: Governance (Credentials Manager & API Keys) */}
        <section id="section-credentials" className="min-h-screen py-16 flex flex-col justify-center">
          <CredentialsManager apiKey={apiKey} />
        </section>
      </main>

      {/* Console Lockscreen Modal */}
      <LockscreenModal
        isOpen={isLockscreenOpen}
        onClose={() => setIsLockscreenOpen(false)}
        onAuthenticate={handleAuthenticate}
        currentApiKey={apiKey}
      />

      {/* Editorial Footer */}
      <footer className="lg:pr-[160px] border-t border-[#A68B78]/30 bg-[#164A40] text-[#FDFBFC] px-8 py-8 text-center text-xs font-sans">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[#FDFBFC]/80">
          <span>SentinAI Autonomous Code Security Agent &copy; {new Date().getFullYear()}</span>
          <span className="font-editorial italic text-sm text-[#F7D3CC]">Precision code intelligence & editorial aesthetics</span>
        </div>
      </footer>
    </div>
  );
}
