import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, Shield, Terminal, LayoutDashboard, LogOut, Plus, Settings, 
  HelpCircle, Activity, FileCode, Trash2, ExternalLink, Lock, Check, 
  Eye, EyeOff, Search, AlertTriangle, Sparkles, Globe, 
  RefreshCw, Play, ArrowRight, LockKeyhole, Users, CheckCircle2, GitPullRequest
} from 'lucide-react';

// Interfaces mapping backend models
interface ReviewDetail {
  id: string;
  prUrl: string;
  prTitle?: string;
  repository?: string;
  headCommitSha: string;
  overallScore: number;
  reviewedAt: string;
  summary: string;
  findings: Finding[];
}

interface Finding {
  id?: string;
  file?: string;
  filePath?: string;
  line?: number;
  lineNumber?: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  category: string;
  title?: string;
  description: string;
  snippet?: string;
  suggestion: string;
}

interface ApiKeyMetadata {
  id: string;
  clientName: string;
  createdAt: string;
  lastUsedAt: string | null;
  active: boolean;
}

// Custom 3D-like Particle Canvas Background
export function Hero3DCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles: Array<{
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }> = [];

    const numParticles = 70;
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 1,
        color: i % 3 === 0 ? '#6366f1' : i % 3 === 1 ? '#a855f7' : '#06b6d4',
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 8, 22, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // Smooth mouse tracking
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Glowing cursor light halo
      const gradient1 = ctx.createRadialGradient(mouseX, mouseY, 5, mouseX, mouseY, 180);
      gradient1.addColorStop(0, 'rgba(99, 102, 241, 0.07)');
      gradient1.addColorStop(1, 'rgba(5, 8, 22, 0)');
      ctx.fillStyle = gradient1;
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 180, 0, Math.PI * 2);
      ctx.fill();

      // Glowing slow orbiting sphere
      const time = Date.now() * 0.0006;
      const orbX = width / 2 + Math.cos(time) * 200;
      const orbY = height / 2 + Math.sin(time) * 120;
      const gradient2 = ctx.createRadialGradient(orbX, orbY, 5, orbX, orbY, 150);
      gradient2.addColorStop(0, 'rgba(168, 85, 247, 0.09)');
      gradient2.addColorStop(1, 'rgba(5, 8, 22, 0)');
      ctx.fillStyle = gradient2;
      ctx.beginPath();
      ctx.arc(orbX, orbY, 150, 0, Math.PI * 2);
      ctx.fill();

      // Update & Draw particles
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        // Push away slightly from cursor
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          p.x -= (dx / dist) * 0.3;
          p.y -= (dy / dist) * 0.3;
        }

        // Bounce borders
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Connect close lines
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distNodes = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
          if (distNodes < 80) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - distNodes / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
}

// Live Terminal Analysis Simulator component
function TerminalDemo() {
  const [lines, setLines] = useState<string[]>([]);
  
  useEffect(() => {
    const steps = [
      '⚡ Initializing sentinel security engine v2.0.4...',
      '🔍 Authenticating client webhook connection: PASSED',
      '📦 Triggered audit on branch: feature/security-update',
      '📂 Checking 8 modified files for OWASP vulnerabilities...',
      '🚨 CRITICAL: SQL Injection exposure in src/auth/OAuthProvider.java:42',
      '💡 Recommended solution generated: replace concatenation with PreparedStatement',
      '✅ Key hashing validation check: 100% secure hashing applied',
      '🚀 Code review compiled. Quality Score: 92/100',
      '🎉 Webhook callback delivered successfully to GitHub repository.'
    ];

    let current = 0;
    const interval = setInterval(() => {
      setLines(prev => {
        if (current >= steps.length) {
          current = 0;
          return [steps[0]];
        }
        const next = [...prev, steps[current]];
        current++;
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-950/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 font-mono text-xs leading-relaxed text-slate-300 shadow-2xl relative w-full overflow-hidden">
      <div className="flex gap-1.5 mb-4 border-b border-white/5 pb-3">
        <span className="w-3 h-3 rounded-full bg-rose-500 block"></span>
        <span className="w-3 h-3 rounded-full bg-amber-500 block"></span>
        <span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
        <span className="text-[10px] text-slate-500 ml-2 uppercase font-bold tracking-wider">sentinai - terminal daemon</span>
      </div>
      <div className="space-y-1.5 min-h-[220px]">
        {lines.map((l, i) => {
          const isError = l.includes('🚨') || l.includes('CRITICAL');
          const isSuccess = l.includes('✅') || l.includes('PASSED') || l.includes('success');
          return (
            <div key={i} className={`${isError ? 'text-rose-400 font-bold' : isSuccess ? 'text-emerald-400' : 'text-slate-300'}`}>
              {l}
            </div>
          );
        })}
        <div className="w-2 h-4 bg-primary inline-block animate-pulse ml-0.5"></div>
      </div>
    </div>
  );
}

export default function App() {
  const [viewMode, setViewMode] = useState<'landing' | 'console'>('landing');
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'security' | 'logs'>('overview');
  
  // Auth & API states
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('rcb_api_key') || '');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [webhookSecretVisible, setWebhookSecretVisible] = useState(false);
  const [forceHmac, setForceHmac] = useState(true);
  const [filterKeys, setFilterKeys] = useState('');

  // Lockscreen setup state
  const [authMode, setAuthMode] = useState<'login' | 'generate'>('login');
  const [setupClientName, setSetupClientName] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccessKey, setSetupSuccessKey] = useState<string | null>(null);

  // Core database lists
  const [keysList, setKeysList] = useState<ApiKeyMetadata[]>([]);
  const [reviewsHistory, setReviewsHistory] = useState<ReviewDetail[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewDetail | null>(null);
  
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal triggers
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [generatedKeyResult, setGeneratedKeyResult] = useState<{ key: string } | null>(null);
  
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [reviewPrUrl, setReviewPrUrl] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Stream logs
  const [logs, setLogs] = useState<string[]>([
    '[2026-07-09 20:01:10] INFO  com.proj.prreviewbot.config.ApiKeyAuthFilter - Sentinel engine filters initialized',
    '[2026-07-09 20:02:15] INFO  com.proj.prreviewbot.PrReviewBotApplication - Tomcat container ready on port 8080',
    '[2026-07-09 20:04:30] INFO  c.p.p.service.ReviewPersistenceService - Database connection Pool OK',
    '[2026-07-09 20:05:12] INFO  c.p.p.service.ReviewCacheService - Redis client initialized at redis:6379',
    '[2026-07-09 20:10:45] INFO  c.p.p.controller.ReviewController - Server health telemetry checked: 100% OK'
  ]);

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem('rcb_api_key', value);
  };

  const fetchKeys = async () => {
    if (!apiKey) return;
    setLoadingKeys(true);
    try {
      const response = await fetch(`${BACKEND_URL}/keys`, {
        headers: { 'X-API-Key': apiKey }
      });
      if (response.ok) {
        const data = await response.json();
        setKeysList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingKeys(false);
    }
  };

  const fetchHistory = async () => {
    if (!apiKey) return;
    setLoadingHistory(true);
    try {
      const response = await fetch(`${BACKEND_URL}/review/history`, {
        headers: { 'X-API-Key': apiKey }
      });
      if (response.ok) {
        const data = await response.json();
        setReviewsHistory(data);
        if (data.length > 0 && !selectedReview) {
          setSelectedReview(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      fetchKeys();
      fetchHistory();
    } else {
      setKeysList([]);
      setReviewsHistory([]);
      setSelectedReview(null);
    }
  }, [apiKey]);

  // Periodic diagnostics stream
  useEffect(() => {
    const interval = setInterval(() => {
      const actions = [
        'API Key verification: PASSED for client github-webhook-prod',
        'Rate limit check: client github-webhook-prod (1/10 r/m)',
        'Database health-check: ok',
        'Redis connection pool check: 10 active connections',
        'Evicted cache check: no staled entries',
        'System telemetry update dispatched',
        'Webhook signature validation: success',
        'Scheduled memory optimization complete'
      ];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const time = new Date().toISOString().replace('T', ' ').substring(0, 19);
      setLogs(prev => [...prev.slice(-49), `[${time}] INFO  c.p.p.service.Diagnostics - ${randomAction}`]);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Revoke this credentials token permanently?')) return;
    try {
      const response = await fetch(`${BACKEND_URL}/keys/${id}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey }
      });
      if (response.ok) {
        fetchKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    try {
      const response = await fetch(`${BACKEND_URL}/keys/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: newClientName }),
      });
      if (response.ok) {
        const data = await response.json();
        setGeneratedKeyResult({ key: data.apiKey });
        setNewClientName('');
        fetchKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetupGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupClientName.trim()) return;
    setSetupError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/keys/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: setupClientName }),
      });
      if (response.ok) {
        const data = await response.json();
        setSetupSuccessKey(data.apiKey);
        setSetupClientName('');
      } else {
        setSetupError('Generation failed. Verify Spring Boot connection.');
      }
    } catch (err) {
      setSetupError('Unable to connect to service. Ensure port 8080 is live.');
    }
  };

  const handleTriggerReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewPrUrl.trim()) return;
    setSubmittingReview(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`${BACKEND_URL}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({ prUrl: reviewPrUrl }),
      });
      if (response.ok) {
        const data = await response.json();
        alert('Code review successfully completed!');
        setReviewPrUrl('');
        setShowTriggerModal(false);
        fetchHistory();
        
        // Load details automatically
        const details = await fetch(`${BACKEND_URL}/review/${data.id}`, {
          headers: { 'X-API-Key': apiKey }
        });
        if (details.ok) {
          const detailData = await details.json();
          setSelectedReview(detailData);
        }
        setViewMode('console');
        setActiveTab('reviews');
      } else {
        const err = await response.json().catch(() => ({}));
        setErrorMessage(err.error || 'Trigger failed. Check repository access.');
      }
    } catch (err) {
      setErrorMessage('Network connection lost.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Permanently delete review details and cache?')) return;
    try {
      const response = await fetch(`${BACKEND_URL}/review/${id}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey }
      });
      if (response.ok) {
        const updated = reviewsHistory.filter(r => r.id !== id);
        setReviewsHistory(updated);
        if (selectedReview?.id === id) {
          setSelectedReview(updated.length > 0 ? updated[0] : null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics
  const totalPRs = reviewsHistory.length;
  const avgScore = useMemo(() => {
    if (totalPRs === 0) return 0;
    return Math.round(reviewsHistory.reduce((a, b) => a + b.overallScore, 0) / totalPRs);
  }, [reviewsHistory, totalPRs]);

  const dynamicChartData = useMemo(() => {
    if (reviewsHistory.length === 0) return null;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 20;
    const width = 600;
    const height = 176;

    const sorted = [...reviewsHistory].sort((a, b) => new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime());

    const getX = (index: number) => {
      if (sorted.length <= 1) return paddingLeft + (width - paddingLeft - paddingRight) / 2;
      return paddingLeft + (index / (sorted.length - 1)) * (width - paddingLeft - paddingRight);
    };

    const getY = (score: number) => {
      return height - paddingBottom - (score / 100) * (height - paddingTop - paddingBottom);
    };

    let linePath = '';
    let areaPath = '';

    if (sorted.length > 0) {
      const firstX = getX(0);
      const firstY = getY(sorted[0].overallScore);
      linePath = `M ${firstX} ${firstY}`;
      areaPath = `M ${firstX} ${height - paddingBottom} L ${firstX} ${firstY}`;

      for (let i = 1; i < sorted.length; i++) {
        const cx = getX(i);
        const cy = getY(sorted[i].overallScore);
        linePath += ` L ${cx} ${cy}`;
        areaPath += ` L ${cx} ${cy}`;
      }

      const lastX = getX(sorted.length - 1);
      areaPath += ` L ${lastX} ${height - paddingBottom} Z`;
    }

    return {
      width,
      height,
      paddingLeft,
      paddingRight,
      getX,
      getY,
      linePath,
      areaPath,
      dataPoints: sorted
    };
  }, [reviewsHistory]);

  const totalFindings = useMemo(() => {
    return reviewsHistory.reduce((a, b) => a + (b.findings?.length || 0), 0);
  }, [reviewsHistory]);

  const criticalFindings = useMemo(() => {
    return reviewsHistory.reduce((acc, curr) => {
      return acc + (curr.findings || []).filter(f => f.severity === 'CRITICAL').length;
    }, 0);
  }, [reviewsHistory]);

  const selectedFindings = selectedReview?.findings || [];
  const criticalCount = selectedFindings.filter(f => f.severity === 'CRITICAL').length;
  const warningCount = selectedFindings.filter(f => f.severity === 'WARNING').length;
  const infoCount = selectedFindings.filter(f => f.severity === 'INFO').length;

  const filteredKeys = useMemo(() => {
    if (!filterKeys.trim()) return keysList;
    return keysList.filter(k => k.clientName.toLowerCase().includes(filterKeys.toLowerCase()));
  }, [keysList, filterKeys]);

  const renderFindingDiff = (finding: Finding) => {
    const file = finding.file || finding.filePath || 'src/main/java/Engine.java';
    const line = finding.line || finding.lineNumber || 1;
    const snippet = finding.snippet;
    const suggestion = finding.suggestion;

    return (
      <div key={finding.id || `${file}-${line}`} className="glass-card rounded-2xl overflow-hidden shadow-xl border border-white/[0.06] mb-6">
        <div className="bg-white/[0.02] px-6 py-4 flex items-center justify-between border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <Code className="text-on-surface-variant w-4 h-4" />
            <span className="font-mono text-sm text-slate-300">{file}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded text-[10px] font-bold">Line {line}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              finding.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
              finding.severity === 'WARNING' ? 'bg-purple-500/20 text-purple-400' :
              'bg-indigo-500/20 text-indigo-400'
            }`}>
              {finding.severity}
            </span>
          </div>
        </div>

        <div className="p-0 font-mono text-xs leading-relaxed overflow-x-auto">
          {snippet ? (
            <>
              <div className="flex w-full bg-rose-950/10 border-l-4 border-rose-500/40">
                <span className="w-12 text-right pr-4 py-1 text-slate-600 bg-rose-950/5 select-none">{line}</span>
                <span className="w-12 text-center py-1 text-rose-500/50 select-none">-</span>
                <code className="py-1 px-4 text-rose-400/90 whitespace-pre">{snippet}</code>
              </div>
              <div className="flex w-full bg-indigo-950/10 border-l-4 border-indigo-500/40">
                <span className="w-12 text-right pr-4 py-1 text-slate-600 bg-indigo-950/5 select-none">{line}</span>
                <span className="w-12 text-center py-1 text-indigo-400 select-none">+</span>
                <code className="py-1 px-4 text-indigo-300 whitespace-pre">{suggestion}</code>
              </div>
            </>
          ) : (
            <div className="flex w-full bg-indigo-950/5 border-l-4 border-indigo-500/30">
              <span className="w-12 text-right pr-4 py-2 text-slate-600 bg-indigo-950/5 select-none">{line}</span>
              <span className="w-12 text-center py-2 text-indigo-400 select-none">Fix</span>
              <code className="py-2 px-4 text-indigo-300 whitespace-pre block w-full overflow-x-auto">{suggestion}</code>
            </div>
          )}

          {/* AI Agent Commentary Box */}
          <div className="m-6 p-6 rounded-xl bg-white/[0.01] border border-white/[0.04] backdrop-blur-xl relative">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-400 text-xs tracking-wider uppercase">SENTINAI SECURITY INSTINCT</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    finding.severity === 'CRITICAL' ? 'bg-rose-500/15 text-rose-400' :
                    finding.severity === 'WARNING' ? 'bg-purple-500/15 text-purple-400' :
                    'bg-indigo-500/15 text-indigo-400'
                  }`}>
                    {finding.severity}
                  </span>
                </div>
                <h4 className="font-bold text-on-surface text-base">{finding.title || `${finding.category} Issue`}</h4>
                <p className="text-on-surface-variant leading-relaxed text-sm">
                  {finding.description}
                </p>
                <div className="flex gap-4 pt-2 text-xs">
                  <button className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">Apply Refactor</button>
                  <button className="text-on-surface-variant hover:text-on-surface transition-colors">Discuss Response</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-on-surface selection:bg-indigo-500/30 selection:text-white">
      
      {/* 3D Moving Canvas Background */}
      {viewMode === 'landing' && <Hero3DCanvas />}

      {/* Floating Header Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            onClick={() => setViewMode('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight font-sans text-white group-hover:text-indigo-300 transition-colors">SentinAI</span>
          </div>

          {viewMode === 'landing' ? (
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-on-surface-variant">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#demo" className="hover:text-white transition-colors">Live Simulation</a>
              <a href="#metrics" className="hover:text-white transition-colors">Core Metrics</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4 text-xs font-mono text-on-surface-variant">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500 glow-pulse"></span>Health: 99.9%</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500 glow-pulse"></span>Redis: Live</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            {apiKey && viewMode === 'landing' ? (
              <button 
                onClick={() => setViewMode('console')}
                className="bg-white/10 hover:bg-white/15 text-white border border-white/10 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider hover:border-indigo-500/40 transition-all flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Console Panel
              </button>
            ) : null}
            
            <button 
              onClick={() => {
                if (viewMode === 'landing') {
                  setViewMode('console');
                } else {
                  setViewMode('landing');
                }
              }}
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:brightness-110 text-white font-bold px-5 py-2 rounded-full text-xs transition-transform active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
            >
              {viewMode === 'landing' ? 'Launch Console' : 'Back to Website'}
            </button>
          </div>
        </div>
      </nav>

      {/* VIEWMODE 1: SAAS LANDING PAGE */}
      {viewMode === 'landing' && (
        <div className="pt-24 space-y-32">
          
          {/* Hero Section */}
          <header className="max-w-5xl mx-auto px-6 text-center pt-16 pb-8 relative z-10 flex flex-col items-center">
            
            {/* Tagline Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/[0.08] rounded-full text-xs font-semibold text-indigo-400 mb-6 backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Next-Gen Autonomous Code Verification</span>
            </motion.div>

            {/* Glowing Hero Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-display-lg md:text-6xl font-bold font-sans text-white tracking-tight leading-tight max-w-4xl"
            >
              Audits every line. <br />
              <span className="gradient-text-indigo-purple">Prevents every threat.</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-on-surface-variant text-base md:text-xl max-w-3xl mt-6 leading-relaxed font-normal"
            >
              SentinAI acts as an automated security proxy for your software repository. It verifies commit safety, hashes database client keys, and rate-limits webhook payload deliveries automatically.
            </motion.p>

            {/* CTA controls */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap gap-4 justify-center mt-10"
            >
              <button 
                onClick={() => {
                  setErrorMessage(null);
                  setReviewPrUrl('');
                  setShowTriggerModal(true);
                }}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 text-white font-bold px-8 py-3 rounded-full text-sm shadow-[0_0_25px_rgba(99,102,241,0.35)] flex items-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Play className="w-4 h-4 fill-white" />
                Start Code Audit
              </button>
              <button 
                onClick={() => setViewMode('console')}
                className="bg-white/[0.03] hover:bg-white/[0.08] text-white border border-white/[0.08] font-bold px-8 py-3 rounded-full text-sm flex items-center gap-2 hover:border-indigo-500/40 transition-colors"
              >
                Enter Administrator App
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Live Terminal Demo Panel */}
            <div id="demo" className="w-full mt-24 flex justify-center relative z-20">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-20 pointer-events-none"></div>
              <TerminalDemo />
            </div>

          </header>

          {/* Metrics Counter Section */}
          <section id="metrics" className="max-w-7xl mx-auto px-6 relative z-10 border-t border-white/[0.05] pt-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 text-center glass-card rounded-2xl">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold font-mono">Lines Scanned</span>
                <h3 className="text-4xl md:text-5xl font-extrabold text-white mt-2 font-mono">1,428,290+</h3>
                <p className="text-xs text-on-surface-variant mt-2">Continuous static analytics audits</p>
              </div>
              <div className="p-8 text-center glass-card rounded-2xl">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold font-mono">Average Review Time</span>
                <h3 className="text-4xl md:text-5xl font-extrabold text-indigo-400 mt-2 font-mono">&lt; 12.8s</h3>
                <p className="text-xs text-on-surface-variant mt-2">Optimized AI model processing pipelines</p>
              </div>
              <div className="p-8 text-center glass-card rounded-2xl">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold font-mono">Uptime SLA</span>
                <h3 className="text-4xl md:text-5xl font-extrabold text-purple-400 mt-2 font-mono">99.99%</h3>
                <p className="text-xs text-on-surface-variant mt-2">Robust Redis & Postgres persistence</p>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section id="features" className="max-w-7xl mx-auto px-6 space-y-12 relative z-10">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold font-sans text-white">Full Stack Cryptographic Security</h2>
              <p className="text-on-surface-variant text-base">We enforce zero-trust policies from API key ingestion to webhook response verification.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="p-6 glass-card rounded-2xl hover:-translate-y-1.5 transition-all duration-300 hover:border-indigo-500/20 group">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                  <LockKeyhole className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-lg">SHA-256 Client Hashing</h4>
                <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                  API client tokens are never stored in raw plaintext. Database lookups only utilize SHA-256 hashes.
                </p>
              </div>

              <div className="p-6 glass-card rounded-2xl hover:-translate-y-1.5 transition-all duration-300 hover:border-purple-500/20 group">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4 border border-purple-500/20 group-hover:scale-105 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-lg">Redis Memory Throttling</h4>
                <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                  Real-time rate limit monitoring safeguards server endpoints from unauthorized automated scraping.
                </p>
              </div>

              <div className="p-6 glass-card rounded-2xl hover:-translate-y-1.5 transition-all duration-300 hover:border-pink-500/20 group">
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 mb-4 border border-pink-500/20 group-hover:scale-105 transition-transform">
                  <Globe className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-lg">HMAC Payload Signatures</h4>
                <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                  Verifies caller authenticity using robust HMAC-SHA-256 digest validation signatures.
                </p>
              </div>

              <div className="p-6 glass-card rounded-2xl hover:-translate-y-1.5 transition-all duration-300 hover:border-cyan-500/20 group">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                  <Code className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-lg">Java Bytecode Audits</h4>
                <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                  Specifically tailored semantic algorithms resolving security exploits such as SQL Injection surfaces.
                </p>
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing" className="max-w-4xl mx-auto px-6 space-y-12 relative z-10">
            <div className="text-center space-y-4 max-w-xl mx-auto">
              <h2 className="text-3xl font-bold font-sans text-white">SaaS Plans</h2>
              <p className="text-on-surface-variant text-sm">Flexible licensing built for independent developers and enterprise codebases.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Dev Plan */}
              <div className="p-8 glass-card rounded-3xl relative overflow-hidden flex flex-col justify-between hover:border-white/10 transition-colors">
                <div>
                  <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold font-mono">Developer Tier</span>
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-4xl font-extrabold text-white font-mono">$0</span>
                    <span className="text-sm text-on-surface-variant">/ month</span>
                  </div>
                  <ul className="space-y-3.5 mt-8 text-sm text-on-surface-variant">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-indigo-400" />
                      50 Code Reviews per hour limit
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-indigo-400" />
                      Standard SHA-256 Key generation
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-indigo-400" />
                      Public repository access
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => setViewMode('console')}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white font-bold rounded-xl mt-8 transition-colors text-sm"
                >
                  Enter Console Mode
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="p-8 glass-card rounded-3xl relative overflow-hidden flex flex-col justify-between hover:border-indigo-500/20 transition-all border border-indigo-500/30">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-bold uppercase tracking-wider py-1 px-4 rounded-bl-xl shadow-lg shadow-indigo-500/20">
                  POPULAR
                </div>
                <div>
                  <span className="text-[10px] text-purple-400 uppercase tracking-widest font-bold font-mono">Enterprise Tier</span>
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-4xl font-extrabold text-white font-mono">$199</span>
                    <span className="text-sm text-on-surface-variant">/ month</span>
                  </div>
                  <ul className="space-y-3.5 mt-8 text-sm text-on-surface-variant">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-400" />
                      Unlimited Code Review triggers
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-400" />
                      Force HMAC Signature validation
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-400" />
                      Custom rate limits & SLA support
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => setViewMode('console')}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 text-white font-bold rounded-xl mt-8 transition-all text-sm shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                >
                  Activate License
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-white/[0.05] bg-slate-950/40 relative z-10 py-16">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h4 className="font-bold text-white mb-4 text-sm">Product</h4>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4 text-sm">Resources</h4>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Telemetry</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Status Page</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4 text-sm">Company</h4>
                <ul className="space-y-2 text-xs text-on-surface-variant">
                  <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                </ul>
              </div>
              <div className="col-span-2 md:col-span-1">
                <h4 className="font-bold text-white mb-4 text-sm">Legal</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  © 2026 SentinAI Inc. All rights reserved. Enforcing static cryptographic review pipelines worldwide.
                </p>
              </div>
            </div>
          </footer>

        </div>
      )}

      {/* VIEWMODE 2: CONSOLE ADMINISTRATOR DASHBOARD */}
      {viewMode === 'console' && (
        <div className="h-screen overflow-hidden flex bg-[#050816] text-on-surface select-none pt-16">
          
          {/* Left Sidebar Panel */}
          <aside className="w-[280px] bg-slate-950/40 border-r border-white/[0.05] flex flex-col z-40 flex-shrink-0">
            
            {/* Header logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.03]">
              <div className="w-7 h-7 rounded bg-indigo-500 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.4)]">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-md text-white tracking-wide">SentinAI Console</span>
            </div>

            {/* Menu options list */}
            <nav className="flex-1 py-6 space-y-1">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center px-6 py-3.5 space-x-3 border-l-4 transition-all duration-200 text-left ${activeTab === 'overview' ? 'text-indigo-400 font-bold border-indigo-500 bg-white/[0.02] shadow-[0_0_15px_rgba(99,102,241,0.08)]' : 'border-transparent text-on-surface-variant hover:bg-white/[0.01] hover:text-white'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="text-sm">Dashboard</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('reviews')}
                className={`w-full flex items-center px-6 py-3.5 space-x-3 border-l-4 transition-all duration-200 text-left ${activeTab === 'reviews' ? 'text-indigo-400 font-bold border-indigo-500 bg-white/[0.02] shadow-[0_0_15px_rgba(99,102,241,0.08)]' : 'border-transparent text-on-surface-variant hover:bg-white/[0.01] hover:text-white'}`}
              >
                <FileCode className="w-4 h-4" />
                <span className="text-sm">PR Reviews</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center px-6 py-3.5 space-x-3 border-l-4 transition-all duration-200 text-left ${activeTab === 'security' ? 'text-indigo-400 font-bold border-indigo-500 bg-white/[0.02] shadow-[0_0_15px_rgba(99,102,241,0.08)]' : 'border-transparent text-on-surface-variant hover:bg-white/[0.01] hover:text-white'}`}
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm">Security & Keys</span>
              </button>

              <button 
                onClick={() => setActiveTab('logs')}
                className={`w-full flex items-center px-6 py-3.5 space-x-3 border-l-4 transition-all duration-200 text-left ${activeTab === 'logs' ? 'text-indigo-400 font-bold border-indigo-500 bg-white/[0.02] shadow-[0_0_15px_rgba(99,102,241,0.08)]' : 'border-transparent text-on-surface-variant hover:bg-white/[0.01] hover:text-white'}`}
              >
                <Terminal className="w-4 h-4" />
                <span className="text-sm">System Logs</span>
              </button>
            </nav>

            {/* Sidebar actions footer */}
            <div className="mt-auto p-6 border-t border-white/[0.03]">
              
              <button 
                onClick={() => {
                  setErrorMessage(null);
                  setReviewPrUrl('');
                  setShowTriggerModal(true);
                }}
                className="w-full mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_15px_rgba(99,102,241,0.25)] transition-transform text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                New Analysis
              </button>

              <div className="space-y-1">
                <div className="flex items-center py-2 px-2 space-x-3 text-on-surface-variant hover:text-white transition-colors cursor-pointer rounded hover:bg-white/[0.02]">
                  <Settings className="w-4 h-4" />
                  <span className="text-xs font-semibold">Settings</span>
                </div>
                <div className="flex items-center py-2 px-2 space-x-3 text-on-surface-variant hover:text-white transition-colors cursor-pointer rounded hover:bg-white/[0.02]">
                  <HelpCircle className="w-4 h-4" />
                  <span className="text-xs font-semibold">Support</span>
                </div>
              </div>

              {/* Authenticated user card details */}
              <div className="mt-6 flex items-center gap-3 border-t border-white/[0.03] pt-4">
                <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center border border-white/[0.08] text-indigo-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-white font-bold truncate text-xs">SentinAI Daemon</p>
                  <p className="text-[10px] text-on-surface-variant truncate font-mono">Master Administrator</p>
                </div>
                <button 
                  onClick={() => handleApiKeyChange('')}
                  className="text-on-surface-variant hover:text-rose-400 transition-colors"
                  title="Disconnect Security Key"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>

          {/* Main Console Tab Workspace Canvas */}
          <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950/40">
            
            {/* Header controls bar */}
            <header className="h-14 flex items-center justify-between px-8 border-b border-white/[0.04] bg-slate-950/20">
              <div className="flex items-center gap-6">
                <h3 className="font-bold text-white tracking-tight capitalize text-sm font-sans">
                  {activeTab === 'overview' && 'Dashboard Overview'}
                  {activeTab === 'reviews' && 'Pull Request Reviews'}
                  {activeTab === 'security' && 'Credentials & Key Manager'}
                  {activeTab === 'logs' && 'System Telemetries'}
                </h3>
              </div>

              <div className="flex items-center gap-6">
                
                {/* Active connection tokens status badging */}
                <div className="hidden lg:flex items-center gap-3 pr-4 border-r border-white/[0.05]">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.02] rounded-full text-[10px] font-mono text-indigo-400 border border-indigo-500/10">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full glow-pulse"></span>
                    Webhook Listener: ACTIVE
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.02] rounded-full text-[10px] font-mono text-indigo-400 border border-indigo-500/10">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full glow-pulse"></span>
                    Redis Cache: LIVE
                  </div>
                </div>

                {/* API Key management password field */}
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center">
                    <input 
                      type={apiKeyVisible ? "text" : "password"}
                      className="bg-slate-950 border border-white/[0.05] focus:border-indigo-500/40 focus:ring-0 text-xs font-mono text-white rounded-lg px-3 py-1 pr-8 w-44 transition-all"
                      placeholder="X-API-Key Header"
                      value={apiKey}
                      onChange={(e) => handleApiKeyChange(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setApiKeyVisible(!apiKeyVisible)}
                      className="absolute right-2 text-on-surface-variant hover:text-white transition-colors"
                    >
                      {apiKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* Scrollable content container */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-8"
                >
                  
                  {/* TAB 1: DASHBOARD OVERVIEW */}
                  {activeTab === 'overview' && (
                    <div className="space-y-8">
                      
                      {/* Critical Security threats warning badge */}
                      {criticalFindings > 0 && (
                        <div className="bg-rose-500/10 border border-rose-500/25 p-4 rounded-2xl flex items-center gap-4 shadow-xl">
                          <AlertTriangle className="text-rose-500 w-6 h-6 flex-shrink-0 animate-bounce" />
                          <div className="flex-1">
                            <h4 className="font-bold text-white text-sm">Critical Security Vulnerabilities Detected</h4>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              Sentinel proxy audit flagged {criticalFindings} high-severity database SQL exploits requiring prompt code patching.
                            </p>
                          </div>
                          <button 
                            onClick={() => {
                              const crit = reviewsHistory.find(r => r.findings?.some(f => f.severity === 'CRITICAL'));
                              if (crit) {
                                setSelectedReview(crit);
                                setActiveTab('reviews');
                              }
                            }}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-colors"
                          >
                            Inspect Threat
                          </button>
                        </div>
                      )}

                      {/* KPI Card Grids */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        
                        {/* Card 1: total reviews */}
                        <div className="glass-card p-6 rounded-2xl hover:border-white/10 transition-colors relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 blur-[25px] pointer-events-none"></div>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Total Code Reviews</p>
                          <h3 className="text-4xl font-bold font-mono text-white mt-2">{totalPRs}</h3>
                          <div className="h-10 mt-4 overflow-hidden">
                            <svg className="w-full h-full" viewBox="0 0 100 20">
                              <path className="opacity-40 group-hover:opacity-80 transition-opacity" d="M0,15 Q10,8 20,18 T40,12 T60,16 T80,8 T100,14" fill="none" stroke="#6366f1" strokeWidth="2"></path>
                            </svg>
                          </div>
                        </div>

                        {/* Card 2: Quality Score */}
                        <div className="glass-card p-6 rounded-2xl hover:border-white/10 transition-colors flex items-center justify-between group relative overflow-hidden">
                          <div>
                            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Average Quality</p>
                            <h3 className="text-4xl font-bold font-mono text-purple-400 mt-2">{avgScore}%</h3>
                            <span className="text-[9px] font-bold text-slate-500 mt-2 block uppercase">
                              {avgScore >= 80 ? '🔒 Stable Build' : avgScore >= 60 ? '⚠️ Warnings Pending' : '🚨 Critical Threat'}
                            </span>
                          </div>
                          <div className="relative w-16 h-16">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" fill="none" r="16" stroke="rgba(255,255,255,0.05)" strokeWidth="3"></circle>
                              <circle cx="18" cy="18" fill="none" r="16" stroke="#a855f7" strokeDasharray={`${avgScore}, 100`} strokeLinecap="round" strokeWidth="3" style={{ filter: 'drop-shadow(0 0 4px #a855f7)' }}></circle>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-300 font-mono">
                              {avgScore}
                            </div>
                          </div>
                        </div>

                        {/* Card 3: Vulnerabilities */}
                        <div className="glass-card p-6 rounded-2xl hover:border-white/10 transition-colors relative overflow-hidden group">
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Critical Threats</p>
                          <h3 className={`text-4xl font-bold font-mono mt-2 ${criticalFindings > 0 ? 'text-rose-400' : 'text-slate-200'}`}>{criticalFindings}</h3>
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 mt-4 uppercase">
                            <span className={`w-1.5 h-1.5 rounded-full ${criticalFindings > 0 ? 'bg-rose-500 animate-ping' : 'bg-indigo-400'}`}></span>
                            {criticalFindings > 0 ? 'Threat mitigation required' : 'Active defenses armed'}
                          </div>
                        </div>

                        {/* Card 4: Total Findings */}
                        <div className="glass-card p-6 rounded-2xl hover:border-white/10 transition-colors relative overflow-hidden group">
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Total Code Alerts</p>
                          <h3 className="text-4xl font-bold font-mono text-indigo-400 mt-2">{totalFindings}</h3>
                          <p className="text-[9px] font-bold text-slate-500 mt-4 uppercase">🚀 Telemetry pipelines active</p>
                        </div>
                      </div>

                      {/* SVG Chart timeline & quota widgets */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* Area plot timeline */}
                        <div className="lg:col-span-8 glass-card p-6 rounded-2xl relative overflow-hidden shadow-xl">
                          <div className="flex justify-between items-center mb-6">
                            <div>
                              <h4 className="font-bold text-white text-base font-sans">Quality Score Timeline</h4>
                              <p className="text-[10px] text-on-surface-variant">Continuous historical reviews scores progression</p>
                            </div>
                            <div className="flex gap-2">
                              <button className="px-3 py-1 bg-white/[0.04] text-white border border-white/[0.05] rounded-lg text-xs font-semibold">7 Days</button>
                              <button className="px-3 py-1 text-on-surface-variant hover:text-white rounded-lg text-xs font-semibold">30 Days</button>
                            </div>
                          </div>

                          <div className="h-44 flex items-center justify-center">
                            {loadingHistory ? (
                              <div className="text-on-surface-variant text-xs font-mono">Loading data telemetry...</div>
                            ) : reviewsHistory.length === 0 ? (
                              <div className="text-on-surface-variant text-xs font-mono">No review logs registered. Run an audit.</div>
                            ) : dynamicChartData ? (
                              <svg width="100%" height="100%" viewBox={`0 0 ${dynamicChartData.width} ${dynamicChartData.height}`} style={{ overflow: 'visible' }}>
                                <defs>
                                  <linearGradient id="landingGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                  </linearGradient>
                                  <linearGradient id="landingLine" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="50%" stopColor="#a855f7" />
                                    <stop offset="100%" stopColor="#ec4899" />
                                  </linearGradient>
                                </defs>

                                {/* Y-axis grids */}
                                {[0, 25, 50, 75, 100].map(s => {
                                  const y = dynamicChartData.getY(s);
                                  return (
                                    <g key={s}>
                                      <line x1={dynamicChartData.paddingLeft} y1={y} x2={dynamicChartData.width - dynamicChartData.paddingRight} y2={y} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                                      <text x={dynamicChartData.paddingLeft - 8} y={y + 3} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end" className="font-mono">{s}</text>
                                    </g>
                                  );
                                })}

                                {/* Area */}
                                <path d={dynamicChartData.areaPath} fill="url(#landingGrad)" />

                                {/* Line */}
                                <path d={dynamicChartData.linePath} fill="none" stroke="url(#landingLine)" strokeWidth="2" strokeLinecap="round" />

                                {/* Markers */}
                                {dynamicChartData.dataPoints.map((pt, i) => {
                                  const cx = dynamicChartData.getX(i);
                                  const cy = dynamicChartData.getY(pt.overallScore);
                                  return (
                                    <g key={pt.id} className="group cursor-pointer">
                                      <circle cx={cx} cy={cy} r="4.5" fill="#6366f1" stroke="#050816" strokeWidth="2.5" />
                                      <text x={cx} y={cy - 10} fill="#f3f4f6" fontSize="9" fontWeight="bold" textAnchor="middle" className="font-mono">{pt.overallScore}</text>
                                      <text x={cx} y={dynamicChartData.height - 4} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="middle" className="font-mono">#{pt.prUrl.split('/').pop()}</text>
                                    </g>
                                  );
                                })}
                              </svg>
                            ) : null}
                          </div>
                        </div>

                        {/* Quota widget */}
                        <div className="lg:col-span-4 glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                          <h4 className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">API Limit Quota</h4>
                          <div className="relative w-32 h-32 my-6">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" fill="none" r="42" stroke="rgba(255,255,255,0.03)" strokeWidth="8"></circle>
                              <circle cx="50" cy="50" fill="none" r="42" stroke="#6366f1" strokeDasharray={`${Math.min(totalPRs * 15, 263)} 263`} strokeLinecap="round" strokeWidth="8" style={{ filter: 'drop-shadow(0 0 4px #6366f1)' }}></circle>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                              <span className="text-xl font-bold text-white">{totalPRs * 3}</span>
                              <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">/ 50 hr</span>
                            </div>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed max-w-[200px]">
                            Throttling capacity resets hourly. Redis synchronized.
                          </p>
                        </div>
                      </div>

                      {/* Recent repository reviews tables */}
                      <div className="glass-card rounded-2xl overflow-hidden shadow-xl border border-white/[0.05]">
                        <div className="p-6 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.01]">
                          <div>
                            <h4 className="font-bold text-white text-base font-sans">Recent Audits History</h4>
                            <p className="text-[10px] text-on-surface-variant mt-0.5">Track code vulnerabilities, merge status, and diagnostics</p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          {reviewsHistory.length === 0 ? (
                            <div className="p-12 text-center text-on-surface-variant">
                              <GitPullRequest className="w-12 h-12 mx-auto opacity-10 mb-4 text-white" />
                              <p className="text-sm font-mono">No analysis records registered.</p>
                              <button 
                                onClick={() => setShowTriggerModal(true)}
                                className="mt-4 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg text-xs"
                              >
                                Trigger First Audit
                              </button>
                            </div>
                          ) : (
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider border-b border-white/[0.05] bg-white/[0.02]">
                                  <th className="px-6 py-4">Repository / Pull Request</th>
                                  <th className="px-6 py-4">Commit SHA</th>
                                  <th className="px-6 py-4">Quality Score</th>
                                  <th className="px-6 py-4">Threat Status</th>
                                  <th className="px-6 py-4">Audited At</th>
                                  <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/[0.03] text-sm">
                                {reviewsHistory.map(rev => {
                                  const prNum = rev.prUrl.split('/').pop();
                                  const repo = rev.prUrl.replace('https://github.com/', '').split('/pull/')[0];
                                  return (
                                    <tr key={rev.id} className="hover:bg-white/[0.01] transition-colors group">
                                      <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                          <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                                            {rev.prTitle || `Pull Request #${prNum}`}
                                          </span>
                                          <a href={rev.prUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-on-surface-variant hover:text-indigo-300 hover:underline flex items-center gap-1.5 mt-0.5">
                                            <ExternalLink className="w-3 h-3" />
                                            {repo}
                                          </a>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 font-mono text-xs">
                                        <span className="bg-white/[0.03] border border-white/[0.06] text-slate-300 px-2 py-0.5 rounded">
                                          {rev.headCommitSha.substring(0, 8)}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                                          rev.overallScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                          rev.overallScore >= 60 ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                        }`}>
                                          {rev.overallScore}%
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 text-xs text-on-surface-variant font-mono">
                                        {rev.findings?.length || 0} findings audit
                                      </td>
                                      <td className="px-6 py-4 text-xs text-on-surface-variant">
                                        {new Date(rev.reviewedAt).toLocaleString()}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                          <button 
                                            onClick={() => {
                                              setSelectedReview(rev);
                                              setActiveTab('reviews');
                                            }}
                                            className="px-3 py-1.5 bg-white/[0.04] hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors"
                                          >
                                            Inspect
                                          </button>
                                          <button 
                                            onClick={(e) => handleDeleteReview(rev.id, e)}
                                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition-colors"
                                            title="Delete Review"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PULL REQUEST REVIEWS DETAILS */}
                  {activeTab === 'reviews' && (
                    <div className="grid grid-cols-12 gap-8">
                      
                      {/* Left side review metrics detail */}
                      <div className="col-span-12 lg:col-span-8 space-y-8">
                        
                        {/* Selector card */}
                        <div className="glass-card p-6 rounded-2xl flex flex-wrap items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                              <GitPullRequest className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Target Audit Repository</span>
                              <select 
                                value={selectedReview?.id || ''} 
                                onChange={(e) => {
                                  const found = reviewsHistory.find(r => r.id === e.target.value);
                                  if (found) setSelectedReview(found);
                                }}
                                className="bg-transparent text-white font-sans font-bold text-base focus:ring-0 focus:outline-none border-none py-0 pl-0 pr-6 cursor-pointer"
                              >
                                {reviewsHistory.map(r => (
                                  <option key={r.id} value={r.id} className="bg-[#0b0f19] text-white">
                                    PR #{r.prUrl.split('/').pop()} - {(r.prTitle || r.repository || 'Code Review').substring(0, 35)}
                                  </option>
                                ))}
                                {reviewsHistory.length === 0 && <option value="">No analysis logs available</option>}
                              </select>
                            </div>
                          </div>

                          {selectedReview && (
                            <div className="flex items-center gap-2">
                              <a 
                                href={selectedReview.prUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                View on GitHub
                              </a>
                              <button 
                                onClick={(e) => handleDeleteReview(selectedReview.id, e)}
                                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all"
                              >
                                Delete Review
                              </button>
                            </div>
                          )}
                        </div>

                        {selectedReview ? (
                          <>
                            {/* PR Info meta */}
                            <div className="glass-card p-6 rounded-2xl flex flex-wrap items-center justify-between gap-6 shadow-md border border-white/[0.05]">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center border border-white/[0.08] text-indigo-400">
                                  <Users className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Auditor System</p>
                                  <p className="font-bold text-white text-sm font-mono mt-0.5">
                                    {selectedReview.prUrl.replace('https://github.com/', '').split('/pull/')[0]}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-8 text-xs font-mono">
                                <div>
                                  <p className="text-[9px] text-on-surface-variant uppercase font-bold">Pull Request</p>
                                  <p className="font-bold text-indigo-400 mt-0.5">#{selectedReview.prUrl.split('/').pop()}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-on-surface-variant uppercase font-bold">Target Target</p>
                                  <p className="font-bold text-white mt-0.5">main</p>
                                </div>
                                <div>
                                  <p className="text-[9px] text-on-surface-variant uppercase font-bold">Commit SHA</p>
                                  <p className="font-bold text-slate-300 mt-0.5">{selectedReview.headCommitSha.substring(0, 8)}</p>
                                </div>
                              </div>
                            </div>

                            {/* AI summary */}
                            <div className="glass-card p-8 rounded-2xl relative overflow-hidden shadow-lg border border-white/[0.05]">
                              <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-400">
                                <Sparkles className="w-24 h-24" />
                              </div>
                              <div className="flex items-center gap-2.5 mb-4">
                                <Sparkles className="text-indigo-400 w-5 h-5" />
                                <h4 className="font-bold text-indigo-400 text-sm tracking-wide font-sans">AI Analysis Summary</h4>
                              </div>
                              <p className="text-on-surface-variant leading-relaxed text-sm whitespace-pre-wrap">
                                {selectedReview.summary || 'No audit summary details registered.'}
                              </p>
                            </div>

                            {/* Code findings */}
                            <div className="space-y-6">
                              <h4 className="font-bold text-white text-sm flex items-center gap-2 font-sans border-b border-white/[0.04] pb-2">
                                <AlertTriangle className="text-purple-400 w-4 h-4" />
                                Security Vulnerabilities & Patches ({selectedFindings.length})
                              </h4>

                              {selectedFindings.length === 0 ? (
                                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-8 text-center text-indigo-300">
                                  <CheckCircle2 className="w-12 h-12 mx-auto opacity-45 mb-2 text-indigo-400" />
                                  <h5 className="font-bold text-white text-base">All Files Passed Clean Audit</h5>
                                  <p className="text-xs text-on-surface-variant mt-1">This branch fully satisfies all standard SQL injection and key sanitization validations.</p>
                                </div>
                              ) : (
                                selectedFindings.map(finding => renderFindingDiff(finding))
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="glass-card p-12 rounded-2xl text-center text-on-surface-variant border border-white/[0.05]">
                            <GitPullRequest className="w-16 h-16 mx-auto opacity-10 mb-4 text-white" />
                            <h4 className="font-bold text-white text-base">Select Review Audit</h4>
                            <p className="text-xs text-on-surface-variant mt-1">Use the select dropdown above to review repository analysis logs.</p>
                          </div>
                        )}
                      </div>

                      {/* Right Sidebar PR score detail */}
                      <aside className="col-span-12 lg:col-span-4 space-y-8">
                        
                        {/* Gauge score card */}
                        <div className="glass-card p-8 rounded-2xl flex flex-col items-center text-center shadow-xl relative overflow-hidden border border-white/[0.05]">
                          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest font-mono mb-6">Security Score</span>
                          
                          <div className="relative w-44 h-44 flex items-center justify-center">
                            <div 
                              className="w-full h-full rounded-full flex items-center justify-center transition-all duration-1000"
                              style={{
                                background: `radial-gradient(closest-side, #0b0f19 82%, transparent 83% 100%), conic-gradient(#a855f7 ${selectedReview?.overallScore || 0}%, #111827 0)`
                              }}
                            >
                              <div className="w-[85%] h-[85%] bg-slate-950/20 rounded-full flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-purple-400 leading-none font-mono">
                                  {selectedReview ? selectedReview.overallScore : '0'}
                                </span>
                                <span className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter mt-1 font-mono">out of 100</span>
                              </div>
                            </div>
                          </div>

                          {selectedReview && (
                            <p className="mt-6 text-xs text-on-surface-variant leading-relaxed">
                              {selectedReview.overallScore >= 80 ? (
                                <span className="text-emerald-400 font-bold font-sans">Build approved for deployment merge.</span>
                              ) : (
                                <span className="text-rose-400 font-bold font-sans">{criticalCount} critical vulnerability block merges.</span>
                              )}
                              <span className="text-[10px] text-slate-500 block mt-1">Enforced by continuous webhook audits.</span>
                            </p>
                          )}
                        </div>

                        {/* Breakdown status */}
                        <div className="glass-card p-6 rounded-2xl space-y-4 border border-white/[0.05] shadow-md">
                          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest font-mono">Issue Breakdown</span>
                          
                          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="text-rose-400 w-4 h-4" />
                              <span className="text-xs font-bold text-rose-300 font-mono">Critical exploits</span>
                            </div>
                            <span className="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase">{criticalCount} flagged</span>
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="text-purple-400 w-4 h-4" />
                              <span className="text-xs font-bold text-purple-300 font-mono">Warnings refactor</span>
                            </div>
                            <span className="bg-purple-500 text-white text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase">{warningCount} warnings</span>
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="text-indigo-400 w-4 h-4" />
                              <span className="text-xs font-bold text-indigo-300 font-mono">Optimizations Info</span>
                            </div>
                            <span className="bg-indigo-500 text-white text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase">{infoCount} info</span>
                          </div>
                        </div>

                        {/* Checks list */}
                        <div className="glass-card p-6 rounded-2xl border border-white/[0.05] shadow-md">
                          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest font-mono block mb-4">Diagnostics Policy</span>
                          <ul className="space-y-3.5 text-xs font-medium text-on-surface-variant">
                            <li className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400"><Check className="w-3 h-3" /></div>
                              <span>SHA-256 Key Encryption audit</span>
                            </li>
                            <li className="flex items-center gap-3">
                              <div className="w-4 h-4 rounded bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400"><Check className="w-3 h-3" /></div>
                              <span>HMAC Webhook signature audit</span>
                            </li>
                            <li className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${forceHmac ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'border-white/10'}`}>
                                {forceHmac && <Check className="w-3 h-3" />}
                              </div>
                              <span className={`${forceHmac ? 'text-on-surface-variant' : 'text-slate-600'}`}>Enforce HMAC payload check</span>
                            </li>
                          </ul>
                        </div>

                      </aside>
                    </div>
                  )}

                  {/* TAB 3: SECURITY & KEY MANAGER */}
                  {activeTab === 'security' && (
                    <div className="flex flex-col lg:flex-row gap-8">
                      
                      {/* Left side credentials list */}
                      <div className="w-full lg:w-2/3 flex flex-col gap-8">
                        
                        {/* Header action panel */}
                        <div className="glass-card p-6 rounded-2xl border border-white/[0.05] flex items-center justify-between shadow-lg">
                          <div className="flex items-center gap-8">
                            <button 
                              onClick={() => {
                                setGeneratedKeyResult(null);
                                setNewClientName('');
                                setShowGenerateModal(true);
                              }}
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 text-white font-bold px-5 py-2 rounded-xl flex items-center gap-2 text-xs shadow-[0_0_15px_rgba(99,102,241,0.25)] transition-transform active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Create Client Key
                            </button>

                            <div className="flex items-center gap-4">
                              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider font-mono">Force HMAC Signature</span>
                              <button 
                                onClick={() => setForceHmac(!forceHmac)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${forceHmac ? 'bg-indigo-500/20 border border-indigo-500/30' : 'bg-white/5 border border-white/10'}`}
                              >
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-indigo-400 transition-transform duration-200 ${forceHmac ? 'translate-x-4.5' : 'translate-x-0.5'}`}></span>
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 font-mono uppercase">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400"></span>
                            </span>
                            Shield Mode Active
                          </div>
                        </div>

                        {/* Active API clients */}
                        <div className="glass-card rounded-2xl overflow-hidden shadow-xl border border-white/[0.05] flex-1">
                          
                          <div className="p-6 border-b border-white/[0.05] flex flex-wrap gap-4 justify-between items-center bg-white/[0.01]">
                            <div>
                              <h4 className="font-bold text-white text-base font-sans">Active Client credentials</h4>
                              <p className="text-[10px] text-on-surface-variant mt-0.5">Database credentials stored securely as hashed digests</p>
                            </div>
                            
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 rounded-lg border border-white/[0.05]">
                              <Search className="text-on-surface-variant w-3.5 h-3.5" />
                              <input 
                                className="bg-transparent border-none outline-none focus:ring-0 text-xs text-white placeholder:text-on-surface-variant w-40" 
                                placeholder="Filter client name..." 
                                type="text"
                                value={filterKeys}
                                onChange={(e) => setFilterKeys(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            {loadingKeys ? (
                              <div className="p-12 text-center text-on-surface-variant font-mono text-xs">Loading database keys...</div>
                            ) : filteredKeys.length === 0 ? (
                              <div className="p-12 text-center text-on-surface-variant font-mono text-xs">No client keys configured.</div>
                            ) : (
                              <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                  <tr className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider border-b border-white/[0.05] bg-white/[0.02]">
                                    <th className="px-6 py-4">Client Name</th>
                                    <th className="px-6 py-4">SHA-256 Hashed Prefix</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Rate Limiting</th>
                                    <th className="px-6 py-4">Last Active</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                  {filteredKeys.map(k => (
                                    <tr key={k.id} className={`hover:bg-white/[0.01] transition-colors group ${!k.active ? 'opacity-50' : ''}`}>
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 font-bold text-white text-xs font-mono">
                                          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                                          {k.clientName}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">
                                        sha256:{k.id.substring(0, 8)}...
                                      </td>
                                      <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                                          k.active ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/5 text-slate-500 border border-white/5'
                                        }`}>
                                          {k.active ? 'ACTIVE' : 'REVOKED'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 w-24">
                                          <div className="flex justify-between text-[9px] text-on-surface-variant font-mono">
                                            <span>{k.active ? '142' : '0'}</span>
                                            <span>500/hr</span>
                                          </div>
                                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500" style={{ width: k.active ? '28%' : '0%' }}></div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 text-xs text-on-surface-variant font-mono">
                                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleTimeString() : 'Never'}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                        {k.active ? (
                                          <button 
                                            onClick={() => handleRevokeKey(k.id)}
                                            className="text-rose-400 hover:text-rose-300 text-xs font-bold border border-rose-500/20 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition-colors"
                                          >
                                            Revoke
                                          </button>
                                        ) : (
                                          <span className="text-[10px] text-slate-600 font-mono">Deactivated</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right side Redis monitoring details */}
                      <div className="w-full lg:w-1/3 flex flex-col gap-8">
                        
                        {/* Redis cache memory meter */}
                        <div className="glass-card p-6 rounded-2xl border border-white/[0.05] shadow-xl relative overflow-hidden flex flex-col items-center">
                          <div className="flex justify-between items-start w-full mb-6">
                            <div>
                              <h4 className="font-bold text-white text-sm font-sans">Redis Throttle Cache</h4>
                              <p className="text-[9px] text-on-surface-variant font-mono mt-0.5">HEALTHY OPERATION</p>
                            </div>
                            <Activity className="w-5 h-5 text-indigo-400" />
                          </div>

                          <div className="relative w-32 h-32 my-4">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" fill="none" r="40" stroke="rgba(255,255,255,0.03)" strokeWidth="6"></circle>
                              <circle cx="50" cy="50" fill="none" r="40" stroke="#06b6d4" strokeDasharray="251.2" strokeDashoffset="216" strokeLinecap="round" strokeWidth="6" style={{ filter: 'drop-shadow(0 0 3px #06b6d4)' }}></circle>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                              <span className="text-xl font-bold text-white">14%</span>
                              <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">Usage limit</span>
                            </div>
                          </div>
                        </div>

                        {/* Webhook HMAC SHA-256 signature secret */}
                        <div className="glass-card p-6 rounded-2xl border border-white/[0.05] shadow-xl space-y-6">
                          <div>
                            <h4 className="font-bold text-white text-sm font-sans">Webhook Authentication</h4>
                            <p className="text-[10px] text-on-surface-variant font-mono">HMAC signature verify secret</p>
                          </div>

                          <div className="bg-slate-950 p-4 rounded-xl border border-white/[0.05] flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mb-1">Secret Key</span>
                              <span className="font-mono text-xs text-slate-300 tracking-[0.2em]">
                                {webhookSecretVisible ? 'default-webhook-secret' : '••••••••••••••••'}
                              </span>
                            </div>
                            <button 
                              onClick={() => setWebhookSecretVisible(!webhookSecretVisible)}
                              className="text-on-surface-variant hover:text-white transition-colors"
                            >
                              {webhookSecretVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>

                          <div>
                            <span className="text-[9px] text-on-surface-variant uppercase tracking-wider font-mono font-bold block mb-4">Request Integrity (Last 24h)</span>
                            <div className="flex items-end justify-between h-20 gap-1.5">
                              {[14, 18, 22, 16, 20, 12, 24].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col gap-0.5 justify-end">
                                  <div 
                                    className={`w-full bg-indigo-500/40 rounded-t-sm ${i === 6 ? 'bg-indigo-500 shadow-[0_0_8px_#6366f1]' : ''}`} 
                                    style={{ height: `${h * 2.5}px` }}
                                  ></div>
                                  <div className="w-full bg-rose-500/20 rounded-b-sm" style={{ height: i % 3 === 0 ? '6px' : '2px' }}></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* TAB 4: SYSTEM DIAGNOSTICS LOGS */}
                  {activeTab === 'logs' && (
                    <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.05] flex flex-col h-[calc(100vh-14rem)] shadow-2xl bg-slate-950/20">
                      <div className="p-5 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.01]">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 glow-pulse"></span>
                          <div>
                            <h4 className="font-bold text-white text-base font-sans">Diagnostics Engine Stream</h4>
                            <p className="text-[9px] text-on-surface-variant font-mono">Live diagnostics logs from SentinAI engine</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              const time = new Date().toISOString().replace('T', ' ').substring(0, 19);
                              setLogs(prev => [...prev, `[${time}] INFO  c.p.p.service.Diagnostics - Client request manually dispatched`]);
                            }}
                            className="px-3.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            Trigger Diagnostic
                          </button>
                          <button 
                            onClick={() => setLogs([])}
                            className="px-3.5 py-1.5 border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Clear Stream
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 p-6 font-mono text-xs text-slate-300 overflow-y-auto custom-scrollbar select-text bg-[#030611]">
                        <div className="space-y-1.5">
                          {logs.map((line, idx) => {
                            const isErr = line.includes('ERROR') || line.includes('failed');
                            return (
                              <div key={idx} className={isErr ? 'text-rose-400 font-bold' : ''}>
                                {line}
                              </div>
                            );
                          })}
                          <div className="text-indigo-400/40 animate-pulse mt-4">_ LOG LISTENER CONNECTED. INGESTION ACTIVE...</div>
                        </div>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      )}

      {/* LOCKSCREEN AUTH SCREEN */}
      {viewMode === 'console' && !apiKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-4 bg-[#050816] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] pointer-events-none"></div>
          
          <div className="w-full max-w-md bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white font-sans">SentinAI Security</h2>
              <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest font-mono">Unlock Authentication Node</p>
            </div>

            {authMode === 'login' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-2 font-mono">X-API-Key credentials</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 text-on-surface-variant w-4 h-4" />
                    <input 
                      type={apiKeyVisible ? "text" : "password"}
                      className="w-full bg-slate-950 border border-white/[0.08] focus:border-indigo-500/40 focus:ring-0 text-xs font-mono text-white rounded-xl pl-11 pr-10 py-3.5 transition-all"
                      placeholder="rcb-xxxxxxxxxxxxxxxxxxxx"
                      value={setupClientName}
                      onChange={(e) => setSetupClientName(e.target.value)}
                    />
                    <button 
                      type="button" 
                      onClick={() => setApiKeyVisible(!apiKeyVisible)}
                      className="absolute right-3.5 text-on-surface-variant hover:text-white transition-colors"
                    >
                      {apiKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    if (setupClientName.trim()) {
                      handleApiKeyChange(setupClientName.trim());
                      setSetupClientName('');
                    } else {
                      alert('Please specify your credentials key');
                    }
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:brightness-110 shadow-[0_0_20px_rgba(99,102,241,0.25)] active:scale-98 transition-all text-sm"
                >
                  Unlock Node Console
                </button>

                <div className="flex justify-between items-center text-xs text-on-surface-variant border-t border-white/[0.05] pt-4 font-sans">
                  <span>No active client token?</span>
                  <button 
                    onClick={() => {
                      setSetupClientName('');
                      setAuthMode('generate');
                      setSetupError(null);
                      setSetupSuccessKey(null);
                    }}
                    className="text-indigo-400 hover:underline font-bold"
                  >
                    Generate Credentials
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {!setupSuccessKey ? (
                  <form onSubmit={handleSetupGenerateKey} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-2 font-mono">Client Name</label>
                      <input 
                        type="text"
                        className="w-full bg-slate-950 border border-white/[0.08] focus:border-indigo-500/40 focus:ring-0 text-xs text-white rounded-xl px-4 py-3.5 transition-all"
                        placeholder="e.g. dev-console"
                        value={setupClientName}
                        onChange={(e) => setSetupClientName(e.target.value)}
                        required
                      />
                    </div>

                    {setupError && (
                      <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 text-center font-mono">{setupError}</p>
                    )}

                    <button 
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:brightness-110 active:scale-98 transition-all text-sm"
                    >
                      Generate API Access Token
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4 font-sans">
                    <div className="bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl p-3.5 text-xs leading-relaxed">
                      ⚠️ Copy key credentials now. For security purposes, it will never be displayed again.
                    </div>
                    <div>
                      <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1 font-mono">API Access Token</label>
                      <input 
                        type="text"
                        className="w-full bg-slate-950 border border-white/[0.08] text-indigo-400 font-mono rounded-xl px-4 py-3 text-xs"
                        value={setupSuccessKey}
                        readOnly
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                    </div>
                    <button 
                      onClick={() => {
                        handleApiKeyChange(setupSuccessKey);
                        setSetupSuccessKey(null);
                        setAuthMode('login');
                      }}
                      className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors text-xs"
                    >
                      Authenticate Key
                    </button>
                  </div>
                )}

                <div className="text-center pt-2 border-t border-white/[0.05]">
                  <button 
                    onClick={() => {
                      setSetupClientName('');
                      setAuthMode('login');
                      setSetupError(null);
                      setSetupSuccessKey(null);
                    }}
                    className="text-xs text-on-surface-variant hover:text-white underline font-sans"
                  >
                    Back to Authentication
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: TRIGGER NEW CODE AUDIT REVIEW */}
      {showTriggerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0d1321] border border-white/[0.08] rounded-2xl p-6 shadow-2xl relative font-sans">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Search className="text-indigo-400 w-5 h-5" />
                Analyze Repository Code
              </h3>
              <button 
                onClick={() => setShowTriggerModal(false)}
                className="text-on-surface-variant hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleTriggerReview} className="space-y-4">
              <div>
                <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-2 font-mono">Pull Request Url</label>
                <input 
                  type="url"
                  className="w-full bg-slate-950 border border-white/[0.08] focus:border-indigo-500/40 focus:ring-0 text-xs text-white rounded-xl px-4 py-3.5 transition-all"
                  placeholder="https://github.com/owner/repository/pull/1"
                  value={reviewPrUrl}
                  onChange={(e) => setReviewPrUrl(e.target.value)}
                  required
                />
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed font-medium">
                  SentinAI will pull the git diff, locate security threats (e.g. SQL Injection or encryption exploits), and generate a quality score report.
                </p>
              </div>

              {errorMessage && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-lg p-2.5 text-center font-mono">{errorMessage}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowTriggerModal(false)}
                  className="px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingReview}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingReview ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Auditing files...
                    </>
                  ) : 'Start Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GENERATE API CREDENTIALS FOR SECURITY KEY TAB */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0d1321] border border-white/[0.08] rounded-2xl p-6 shadow-2xl relative font-sans">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-white text-base">Generate Key Credentials</h3>
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="text-on-surface-variant hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {!generatedKeyResult ? (
              <form onSubmit={handleGenerateKey} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-2 font-mono">Client name</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-950 border border-white/[0.08] focus:border-indigo-500/40 focus:ring-0 text-xs text-white rounded-xl px-4 py-3 transition-all animate-pulse-glow"
                    placeholder="e.g. production-actions-ci"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/[0.08] rounded-xl text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Generate Credentials
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl p-3.5 text-xs leading-relaxed">
                  ⚠️ Copy key credentials now. For security purposes, it will never be displayed again.
                </div>
                <div>
                  <label className="block text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1 font-mono">Secret Key</label>
                  <input 
                    type="text"
                    className="w-full bg-slate-950 border border-white/[0.08] text-indigo-400 font-mono rounded-xl px-4 py-3 text-xs"
                    value={generatedKeyResult.key}
                    readOnly
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => setShowGenerateModal(false)}
                    className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
