import React, { useState, useEffect, useMemo } from 'react';

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

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'security' | 'logs'>('overview');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('rcb_api_key') || '');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [webhookSecretVisible, setWebhookSecretVisible] = useState(false);
  const [forceHmac, setForceHmac] = useState(true);
  const [filterKeys, setFilterKeys] = useState('');

  // Authentication Setup lockscreen states
  const [authMode, setAuthMode] = useState<'login' | 'generate'>('login');
  const [setupClientName, setSetupClientName] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccessKey, setSetupSuccessKey] = useState<string | null>(null);

  // Core Data States
  const [keysList, setKeysList] = useState<ApiKeyMetadata[]>([]);
  const [reviewsHistory, setReviewsHistory] = useState<ReviewDetail[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewDetail | null>(null);
  
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Modals & Action States
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [generatedKeyResult, setGeneratedKeyResult] = useState<{ key: string } | null>(null);
  
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [reviewPrUrl, setReviewPrUrl] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Dynamic Logs State
  const [logs, setLogs] = useState<string[]>([
    '[2026-07-09 19:42:01] INFO  com.proj.prreviewbot.config.ApiKeyAuthFilter - Filter initialized successfully',
    '[2026-07-09 19:43:10] INFO  com.proj.prreviewbot.PrReviewBotApplication - Tomcat started on port 8080',
    '[2026-07-09 19:44:15] INFO  c.p.p.service.ReviewPersistenceService - Initialized database connection to Postgres',
    '[2026-07-09 19:45:00] INFO  c.p.p.service.ReviewCacheService - Connected to Redis cache at redis:6379',
    '[2026-07-09 19:53:13] INFO  c.p.p.controller.ReviewController - Webhook registration validated successfully',
    '[2026-07-09 19:53:18] INFO  c.p.p.controller.ReviewController - Server health status: 100% OK'
  ]);

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem('rcb_api_key', value);
  };

  // Fetch API Keys List
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
      } else {
        console.error('Failed to fetch keys');
      }
    } catch (err) {
      console.error('Error fetching keys:', err);
    } finally {
      setLoadingKeys(false);
    }
  };

  // Fetch Reviews History
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
        // Automatically select the first review if none selected
        if (data.length > 0 && !selectedReview) {
          setSelectedReview(data[0]);
        }
      } else {
        console.error('Failed to fetch reviews');
      }
    } catch (err) {
      console.error('Error fetching history:', err);
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

  // Periodic simulated logs stream
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

  // Revoke API Key
  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    try {
      const response = await fetch(`${BACKEND_URL}/keys/${id}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey }
      });
      if (response.ok) {
        fetchKeys();
      } else {
        alert('Failed to revoke key');
      }
    } catch (err) {
      console.error('Error revoking key:', err);
    }
  };

  // Generate New API Key
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
      } else {
        alert('Failed to generate key');
      }
    } catch (err) {
      console.error('Error generating key:', err);
    }
  };

  // Generate Key for initial Setup lockscreen
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
        setSetupError('Failed to generate master API key. Ensure backend is running.');
      }
    } catch (err) {
      console.error('Error setup generating key:', err);
      setSetupError('Unable to connect to backend server. Make sure it is running on port 8080.');
    }
  };

  // Trigger New PR Review
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
        alert('Review completed successfully!');
        setReviewPrUrl('');
        setShowTriggerModal(false);
        fetchHistory();
        
        // Select newly created review and inspect it
        setActiveTab('reviews');
        const detailResp = await fetch(`${BACKEND_URL}/review/${data.id}`, {
          headers: { 'X-API-Key': apiKey }
        });
        if (detailResp.ok) {
          const detailData = await detailResp.json();
          setSelectedReview(detailData);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setErrorMessage(errData.error || 'Failed to trigger review. Ensure API Key is valid.');
      }
    } catch (err) {
      console.error('Error reviewing PR:', err);
      setErrorMessage('Network error occurred while requesting PR review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Delete Review
  const handleDeleteReview = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this code review? This action is permanent.')) return;
    try {
      const response = await fetch(`${BACKEND_URL}/review/${id}`, {
        method: 'DELETE',
        headers: { 'X-API-Key': apiKey }
      });
      if (response.ok) {
        const updatedHistory = reviewsHistory.filter(rev => rev.id !== id);
        setReviewsHistory(updatedHistory);
        if (selectedReview?.id === id) {
          setSelectedReview(updatedHistory.length > 0 ? updatedHistory[0] : null);
        }
      } else {
        alert('Failed to delete review');
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Error connecting to backend to delete review');
    }
  };

  // Metrics Calculations
  const totalPRs = reviewsHistory.length;
  const avgScore = useMemo(() => {
    if (totalPRs === 0) return 0;
    const sum = reviewsHistory.reduce((acc, curr) => acc + (curr.overallScore || 0), 0);
    return Math.round(sum / totalPRs);
  }, [reviewsHistory, totalPRs]);

  const totalFindings = useMemo(() => {
    return reviewsHistory.reduce((acc, curr) => acc + (curr.findings ? curr.findings.length : 0), 0);
  }, [reviewsHistory]);

  const criticalFindings = useMemo(() => {
    return reviewsHistory.reduce((acc, curr) => {
      const findings = curr.findings || [];
      return acc + findings.filter(f => f.severity === 'CRITICAL').length;
    }, 0);
  }, [reviewsHistory]);

  // Keys list filter
  const filteredKeysList = useMemo(() => {
    if (!filterKeys.trim()) return keysList;
    return keysList.filter(k => k.clientName.toLowerCase().includes(filterKeys.toLowerCase()));
  }, [keysList, filterKeys]);

  // Dynamic Findings count breakdown for the selected PR review
  const selectedFindings = selectedReview?.findings || [];
  const criticalCount = selectedFindings.filter(f => f.severity === 'CRITICAL').length;
  const warningCount = selectedFindings.filter(f => f.severity === 'WARNING').length;
  const infoCount = selectedFindings.filter(f => f.severity === 'INFO').length;

  // CSS Progress background styled calculation
  const selectedProgressStyle = {
    background: `radial-gradient(closest-side, #131314 79%, transparent 80% 100%), conic-gradient(#ce5dff ${selectedReview?.overallScore || 0}%, #1c1b1c 0)`
  };

  // Dynamic Sparkline trend generator for active reviews
  const dynamicChartData = useMemo(() => {
    if (reviewsHistory.length === 0) return null;
    const dataPoints = [...reviewsHistory].reverse();
    const width = 500;
    const height = 180;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 25;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const getX = (index: number) => {
      if (dataPoints.length <= 1) return paddingLeft + plotWidth / 2;
      return paddingLeft + (index / (dataPoints.length - 1)) * plotWidth;
    };

    const getY = (score: number) => {
      return height - paddingBottom - (score / 100) * plotHeight;
    };

    const linePath = dataPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.overallScore)}`).join(' ');
    const areaPath = `${linePath} L ${getX(dataPoints.length - 1)} ${height - paddingBottom} L ${getX(0)} ${height - paddingBottom} Z`;

    return { dataPoints, width, height, paddingLeft, paddingRight, paddingTop, paddingBottom, plotWidth, plotHeight, getX, getY, linePath, areaPath };
  }, [reviewsHistory]);

  // Render a finding comparison diff panel
  const renderFindingDiff = (finding: Finding) => {
    const file = finding.file || finding.filePath || 'src/main/java/Provider.java';
    const line = finding.line || finding.lineNumber || 42;
    const snippet = finding.snippet;
    const suggestion = finding.suggestion;

    return (
      <div key={finding.id || `${file}-${line}`} className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-2xl border border-outline-variant/10">
        <div className="bg-surface-container-high px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">code</span>
            <span className="font-label-sm text-on-surface-variant">{file}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-error-container/20 text-error text-[10px] font-bold uppercase">Line {line}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              finding.severity === 'CRITICAL' ? 'bg-error-container/20 text-error' :
              finding.severity === 'WARNING' ? 'bg-secondary-container/20 text-secondary' :
              'bg-primary-container/20 text-primary-fixed'
            }`}>
              {finding.severity}
            </span>
          </div>
        </div>

        <div className="p-0 font-code-md text-code-md leading-relaxed overflow-x-auto">
          {snippet ? (
            <>
              <div className="flex w-full bg-error-container/10 border-l-4 border-error/50">
                <span className="w-12 text-right pr-4 py-1 text-on-surface-variant/40 bg-error-container/5 select-none font-label-sm">{line}</span>
                <span className="w-12 text-center py-1 text-error/60 select-none">-</span>
                <code className="py-1 px-4 text-error/90 whitespace-pre">{snippet}</code>
              </div>
              <div className="flex w-full bg-primary-container/10 border-l-4 border-primary-fixed-dim/50">
                <span className="w-12 text-right pr-4 py-1 text-on-surface-variant/40 bg-primary-container/5 select-none font-label-sm">{line}</span>
                <span className="w-12 text-center py-1 text-primary-fixed select-none">+</span>
                <code className="py-1 px-4 text-primary-fixed-dim whitespace-pre">{suggestion}</code>
              </div>
            </>
          ) : (
            <div className="flex w-full bg-primary-container/5 border-l-4 border-primary-fixed-dim/50">
              <span className="w-12 text-right pr-4 py-2 text-on-surface-variant/40 bg-primary-container/5 select-none font-label-sm">{line}</span>
              <span className="w-12 text-center py-2 text-primary-fixed select-none">Fix</span>
              <code className="py-2 px-4 text-primary-fixed-dim whitespace-pre block w-full overflow-x-auto">{suggestion}</code>
            </div>
          )}

          {/* AI Comment Box */}
          <div className="m-6 p-6 rounded-xl glass border border-secondary-container/40 shadow-[0_0_20px_rgba(206,93,255,0.1)] relative">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center border border-secondary/30">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>heart_plus</span>
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-secondary text-label-sm tracking-wide">SENTINAI SECURITY AGENT</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    finding.severity === 'CRITICAL' ? 'bg-error-container/20 text-error' :
                    finding.severity === 'WARNING' ? 'bg-secondary-container/20 text-secondary' :
                    'bg-primary-container/20 text-primary-fixed'
                  }`}>
                    {finding.severity}
                  </span>
                </div>
                <h4 className="font-headline-md text-on-surface text-lg">{finding.title || `${finding.category} Issue`}</h4>
                <p className="text-on-surface-variant leading-relaxed text-body-md">
                  {finding.description}
                </p>
                <div className="flex gap-3 pt-2">
                  <button className="text-label-sm font-label-sm text-secondary hover:underline transition-all">Apply Suggested Fix</button>
                  <button className="text-label-sm font-label-sm text-on-surface-variant hover:text-on-surface transition-all">Discuss</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Lockscreen Auth View when there is no API Key set
  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md bg-surface-container border border-outline-variant/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/10 blur-[60px] pointer-events-none"></div>
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center shadow-[0_0_16px_#00dbe7] mb-4">
              <span className="material-symbols-outlined text-[28px] text-on-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-space">SentinAI Console</h2>
            <p className="text-label-sm text-on-surface-variant mt-1">SECURITY ACCESS GATEWAY</p>
          </div>

          {authMode === 'login' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Master API Key</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-on-surface-variant">vpn_key</span>
                  <input 
                    type={apiKeyVisible ? "text" : "password"}
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 focus:border-primary-fixed-dim/60 focus:ring-0 text-body-md text-on-surface rounded-lg pl-10 pr-10 py-3 transition-all"
                    placeholder="rcb-xxxxxxxxxxxxxxxxxxxx"
                    value={setupClientName}
                    onChange={(e) => setSetupClientName(e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={() => setApiKeyVisible(!apiKeyVisible)}
                    className="absolute right-3 text-on-surface-variant hover:text-primary-fixed-dim transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">{apiKeyVisible ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (setupClientName.trim()) {
                    handleApiKeyChange(setupClientName.trim());
                    setSetupClientName('');
                  } else {
                    alert('Please enter your API Key');
                  }
                }}
                className="w-full bg-gradient-to-r from-primary-fixed-dim to-secondary-container text-on-primary-fixed font-bold py-3 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,219,231,0.2)]"
              >
                Unlock Command Center
              </button>

              <div className="flex justify-between items-center text-label-sm text-on-surface-variant border-t border-outline-variant/20 pt-4">
                <span>First time running?</span>
                <button 
                  onClick={() => {
                    setSetupClientName('');
                    setAuthMode('generate');
                    setSetupError(null);
                    setSetupSuccessKey(null);
                  }}
                  className="text-primary-fixed hover:underline font-bold"
                >
                  Generate Key
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {!setupSuccessKey ? (
                <form onSubmit={handleSetupGenerateKey} className="space-y-4">
                  <div>
                    <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Client name</label>
                    <input 
                      type="text"
                      className="w-full bg-surface-container-lowest border border-outline-variant/40 focus:border-primary-fixed-dim/60 focus:ring-0 text-body-md text-on-surface rounded-lg px-4 py-3 transition-all"
                      placeholder="e.g. admin-console"
                      value={setupClientName}
                      onChange={(e) => setSetupClientName(e.target.value)}
                      required
                    />
                  </div>

                  {setupError && (
                    <p className="text-label-sm text-error bg-error-container/10 border border-error/20 rounded p-2 text-center">{setupError}</p>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary-fixed-dim to-secondary-container text-on-primary-fixed font-bold py-3 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,219,231,0.2)]"
                  >
                    Generate Master Access Token
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-secondary-container/10 border border-secondary-container/30 text-secondary rounded-lg p-3 text-label-sm leading-relaxed">
                    ⚠️ Copy this key now! For security reasons, it will not be shown again.
                  </div>
                  <div>
                    <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Your API Key</label>
                    <input 
                      type="text"
                      className="w-full bg-surface-container-lowest border border-outline-variant/40 text-code-md text-primary-fixed font-mono rounded-lg px-3 py-2.5"
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
                    className="w-full bg-primary-fixed-dim text-on-primary-fixed font-bold py-2.5 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    Authenticate & Enter
                  </button>
                </div>
              )}

              <div className="text-center pt-2 border-t border-outline-variant/20">
                <button 
                  onClick={() => {
                    setSetupClientName('');
                    setAuthMode('login');
                    setSetupError(null);
                    setSetupSuccessKey(null);
                  }}
                  className="text-label-sm text-on-surface-variant hover:text-on-surface underline"
                >
                  Back to Authentication
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex bg-background text-on-surface font-body-md select-none">
      
      {/* Sidebar Navigation */}
      <aside className="w-[280px] bg-surface-container-low border-r border-outline-variant/30 flex flex-col z-50 flex-shrink-0">
        
        {/* Sidebar Logo Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-outline-variant/10">
          <div className="w-8 h-8 rounded bg-primary-fixed flex items-center justify-center shadow-[0_0_12px_#00dbe7]">
            <span className="material-symbols-outlined text-[20px] text-on-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <span className="font-headline-md text-headline-md text-on-surface tracking-tight font-space">SentinAI</span>
        </div>

        {/* Sidebar Menu Items */}
        <nav className="flex-1 py-6 space-y-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center px-6 py-3 space-x-3 border-l-4 transition-all duration-200 text-left ${activeTab === 'overview' ? 'text-primary-fixed font-bold border-primary-fixed bg-surface-container-highest shadow-[0_0_12px_rgba(0,219,231,0.2)]' : 'border-transparent text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface active:scale-[0.98]'}`}
          >
            <span className={`material-symbols-outlined text-[22px] ${activeTab === 'overview' ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>dashboard</span>
            <span>Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`w-full flex items-center px-6 py-3 space-x-3 border-l-4 transition-all duration-200 text-left ${activeTab === 'reviews' ? 'text-primary-fixed font-bold border-primary-fixed bg-surface-container-highest shadow-[0_0_12px_rgba(0,219,231,0.2)]' : 'border-transparent text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface active:scale-[0.98]'}`}
          >
            <span className={`material-symbols-outlined text-[22px] ${activeTab === 'reviews' ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>code_blocks</span>
            <span>PR Reviews</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center px-6 py-3 space-x-3 border-l-4 transition-all duration-200 text-left ${activeTab === 'security' ? 'text-primary-fixed font-bold border-primary-fixed bg-surface-container-highest shadow-[0_0_12px_rgba(0,219,231,0.2)]' : 'border-transparent text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface active:scale-[0.98]'}`}
          >
            <span className={`material-symbols-outlined text-[22px] ${activeTab === 'security' ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>security</span>
            <span>Security & Keys</span>
          </button>

          <button 
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center px-6 py-3 space-x-3 border-l-4 transition-all duration-200 text-left ${activeTab === 'logs' ? 'text-primary-fixed font-bold border-primary-fixed bg-surface-container-highest shadow-[0_0_12px_rgba(0,219,231,0.2)]' : 'border-transparent text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface active:scale-[0.98]'}`}
          >
            <span className={`material-symbols-outlined text-[22px] ${activeTab === 'logs' ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>terminal</span>
            <span>System Logs</span>
          </button>
        </nav>

        {/* Sidebar Footer Action */}
        <div className="mt-auto pt-6 border-t border-surface-container-high mx-6 mb-6">
          <button 
            onClick={() => {
              setErrorMessage(null);
              setReviewPrUrl('');
              setShowTriggerModal(true);
            }}
            className="w-full mb-6 bg-gradient-to-r from-primary-fixed-dim to-secondary-container text-on-primary-fixed font-bold py-3 rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(0,219,231,0.3)]"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>New Analysis</span>
          </button>

          <div className="space-y-1">
            <div className="flex items-center py-2 px-2 space-x-3 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer rounded hover:bg-surface-container-high/40">
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span className="text-body-md">Settings</span>
            </div>
            <div className="flex items-center py-2 px-2 space-x-3 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer rounded hover:bg-surface-container-high/40">
              <span className="material-symbols-outlined text-[20px]">help</span>
              <span className="text-body-md">Support</span>
            </div>
          </div>

          {/* User Profile Info section */}
          <div className="mt-6 flex items-center gap-3 border-t border-outline-variant/10 pt-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant">
              <span className="material-symbols-outlined text-[24px] text-primary-fixed">admin_panel_settings</span>
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-on-surface font-bold truncate text-sm">SentinAI Bot</p>
              <p className="text-label-sm text-on-surface-variant truncate">Master Admin</p>
            </div>
            <button 
              onClick={() => handleApiKeyChange('')}
              className="text-on-surface-variant hover:text-error transition-colors"
              title="Logout / Disconnect Key"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        
        {/* Top App Bar */}
        <header className="h-16 flex items-center justify-between px-gutter bg-surface-container-low border-b border-outline-variant/20 z-40">
          <div className="flex items-center gap-6">
            <h2 className="font-headline-md text-headline-md text-primary-fixed-dim font-bold font-space capitalize">
              {activeTab === 'overview' && 'Dashboard'}
              {activeTab === 'reviews' && 'PR Reviews'}
              {activeTab === 'security' && 'Security & Key Manager'}
              {activeTab === 'logs' && 'System Diagnostics'}
            </h2>
            
            <div className="hidden md:flex items-center gap-4 text-label-sm font-label-sm">
              <span className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-primary-fixed shadow-[0_0_8px_#00dbe7]"></span>
                Health: 99.9%
              </span>
              <span className="flex items-center gap-1.5 text-on-surface-variant">
                Uptime: 45d
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            
            {/* Quick Webhook/Redis Telemetry Badges */}
            <div className="hidden lg:flex items-center gap-3 pr-4 border-r border-outline-variant/20">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full text-label-sm font-label-sm text-primary-fixed-dim border border-primary-fixed-dim/20">
                <span className="w-1.5 h-1.5 bg-primary-fixed-dim rounded-full glow-pulse"></span>
                Webhook: ACTIVE
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full text-label-sm font-label-sm text-primary-fixed-dim border border-primary-fixed-dim/20">
                <span className="w-1.5 h-1.5 bg-primary-fixed-dim rounded-full glow-pulse"></span>
                Redis: CONNECTED
              </div>
            </div>

            {/* Quick API Key Field */}
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <input 
                  type={apiKeyVisible ? "text" : "password"}
                  className="bg-surface-container-lowest border border-outline-variant/30 focus:border-primary-fixed-dim/60 focus:ring-0 text-code-md text-on-surface rounded-lg px-3 py-1 pr-8 w-44 transition-all"
                  placeholder="X-API-Key"
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setApiKeyVisible(!apiKeyVisible)}
                  className="absolute right-2 text-on-surface-variant hover:text-primary-fixed-dim transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">{apiKeyVisible ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Utility Icons */}
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary-fixed transition-colors">notifications</span>
              <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary-fixed transition-colors">history_edu</span>
              <span className="material-symbols-outlined text-primary-fixed cursor-pointer">cloud_done</span>
            </div>
          </div>
        </header>

        {/* Dynamic Tab Scroll Container Canvas */}
        <div className="flex-1 overflow-y-auto p-container-padding custom-scrollbar">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-gutter">
              
              {/* Telemetry Alerts Banner */}
              {criticalFindings > 0 && (
                <div className="bg-error-container/10 border-l-4 border-error p-4 rounded-r-xl flex items-center gap-4 shadow-lg animate-pulse-cyan">
                  <span className="material-symbols-outlined text-error text-2xl">warning</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-on-surface">Critical Vulnerabilities Detected</h4>
                    <p className="text-sm text-on-surface-variant mt-0.5">
                      Sentinel security agent reports {criticalFindings} critical alerts requiring patch validation.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      const criticalPr = reviewsHistory.find(rev => 
                        rev.findings?.some(f => f.severity === 'CRITICAL')
                      );
                      if (criticalPr) {
                        setSelectedReview(criticalPr);
                        setActiveTab('reviews');
                      }
                    }} 
                    className="bg-error text-on-error font-bold px-3 py-1.5 rounded text-xs hover:brightness-110 active:scale-95 transition-all"
                  >
                    Inspect Threat
                  </button>
                </div>
              )}

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
                
                {/* Metric Card 1: Analyzed PRs */}
                <div className="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between hover:bg-surface-container-high transition-colors group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary-container/5 blur-[20px] pointer-events-none"></div>
                  <div>
                    <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Analyzed PRs</p>
                    <h3 className="text-display-lg font-display-lg text-primary-fixed-dim">{totalPRs}</h3>
                  </div>
                  <div className="h-10 mt-4 overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 100 20">
                      <path className="opacity-60 group-hover:opacity-100 transition-opacity" d="M0,15 Q10,10 20,18 T40,12 T60,16 T80,8 T100,12" fill="none" stroke="#00dbe7" strokeWidth="2"></path>
                    </svg>
                  </div>
                </div>

                {/* Metric Card 2: Average Quality Score */}
                <div className="bg-surface-container-low p-5 rounded-xl flex items-center justify-between hover:bg-surface-container-high transition-colors group relative overflow-hidden">
                  <div>
                    <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Average Score</p>
                    <h3 className="text-display-lg font-display-lg text-secondary leading-none">{avgScore}</h3>
                    <span className="text-[10px] text-on-surface-variant mt-2 block uppercase font-bold">
                      {avgScore >= 80 ? '🔒 Stable Build' : avgScore >= 60 ? '⚠️ Warnings Pending' : '🛑 Action Required'}
                    </span>
                  </div>
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#252426" strokeWidth="3"></path>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#cyan-purple-grad)" strokeDasharray={`${avgScore}, 100`} strokeLinecap="round" strokeWidth="3"></path>
                      <defs>
                        <linearGradient id="cyan-purple-grad" x1="0%" x2="100%" y1="0%" y2="0%">
                          <stop offset="0%" stopColor="#00dbe7"></stop>
                          <stop offset="100%" stopColor="#ebb2ff"></stop>
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-on-surface-variant">
                      {avgScore}%
                    </div>
                  </div>
                </div>

                {/* Metric Card 3: Critical Vulnerabilities */}
                <div className="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between hover:bg-surface-container-high transition-colors group relative overflow-hidden">
                  <div>
                    <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Critical Issues</p>
                    <h3 className={`text-display-lg font-display-lg ${criticalFindings > 0 ? 'text-error' : 'text-primary-fixed-dim'}`}>{criticalFindings}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-on-surface-variant mt-2">
                    <span className={`w-2 h-2 rounded-full ${criticalFindings > 0 ? 'bg-error animate-ping' : 'bg-primary-fixed'}`}></span>
                    {criticalFindings > 0 ? 'Threat Mitigation Required' : 'Shield Fully Armed'}
                  </div>
                </div>

                {/* Metric Card 4: Total Findings */}
                <div className="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between hover:bg-surface-container-high transition-colors group relative overflow-hidden">
                  <div>
                    <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Total Findings</p>
                    <h3 className="text-display-lg font-display-lg text-primary-fixed">{totalFindings}</h3>
                  </div>
                  <div className="text-[10px] text-on-surface-variant mt-2 uppercase font-bold">
                    🚀 All telemetries synchronized
                  </div>
                </div>
              </div>

              {/* Chart & Quota Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                
                {/* SVG Trend Chart */}
                <div className="lg:col-span-8 bg-surface-container p-6 rounded-xl relative overflow-hidden">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-headline-md font-space text-on-surface">Review Volume & Score Trend</h3>
                      <p className="text-label-sm text-on-surface-variant">Dynamic code quality timeline scores</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-label-sm text-primary-fixed bg-surface-container-highest border border-primary-fixed-dim/20 rounded-md">7 Days</button>
                      <button className="px-3 py-1 text-label-sm text-on-surface-variant hover:text-on-surface rounded-md transition-all">30 Days</button>
                    </div>
                  </div>

                  <div className="h-44 flex items-center justify-center">
                    {loadingHistory ? (
                      <div className="text-on-surface-variant text-sm">Loading trend data...</div>
                    ) : reviewsHistory.length === 0 ? (
                      <div className="text-on-surface-variant text-sm">No analysis reports registered. Run a review.</div>
                    ) : dynamicChartData ? (
                      <svg width="100%" height="100%" viewBox={`0 0 ${dynamicChartData.width} ${dynamicChartData.height}`} style={{ overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00dbe7" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#00dbe7" stopOpacity="0" />
                          </linearGradient>
                          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#00dbe7" />
                            <stop offset="100%" stopColor="#ebb2ff" />
                          </linearGradient>
                        </defs>
                        
                        {/* Grid Lines */}
                        {[0, 25, 50, 75, 100].map(score => {
                          const y = dynamicChartData.getY(score);
                          return (
                            <g key={score}>
                              <line 
                                x1={dynamicChartData.paddingLeft} 
                                y1={y} 
                                x2={dynamicChartData.width - dynamicChartData.paddingRight} 
                                y2={y} 
                                stroke="rgba(255, 255, 255, 0.05)" 
                                strokeDasharray="3 3" 
                              />
                              <text 
                                x={dynamicChartData.paddingLeft - 8} 
                                y={y + 3} 
                                fill="var(--on-surface-variant)" 
                                fontSize="8" 
                                textAnchor="end"
                                className="font-mono opacity-60"
                              >
                                {score}
                              </text>
                            </g>
                          );
                        })}

                        {/* Area Path */}
                        <path d={dynamicChartData.areaPath} fill="url(#chartGradient)" />

                        {/* Line Path */}
                        <path 
                          d={dynamicChartData.linePath} 
                          fill="none" 
                          stroke="url(#lineGradient)" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />

                        {/* Vertices */}
                        {dynamicChartData.dataPoints.map((pt, i) => {
                          const cx = dynamicChartData.getX(i);
                          const cy = dynamicChartData.getY(pt.overallScore);
                          return (
                            <g key={pt.id} className="group cursor-pointer">
                              <circle 
                                cx={cx} 
                                cy={cy} 
                                r="4" 
                                fill="#00dbe7" 
                                stroke="#131314" 
                                strokeWidth="2" 
                                className="transition-transform group-hover:scale-125"
                              />
                              <text 
                                x={cx} 
                                y={cy - 10} 
                                fill="#e5e2e3" 
                                fontSize="9" 
                                fontWeight="bold" 
                                textAnchor="middle"
                                className="font-mono select-none"
                              >
                                {pt.overallScore}
                              </text>
                              <text 
                                x={cx} 
                                y={dynamicChartData.height - 4} 
                                fill="#9ca3af" 
                                fontSize="8" 
                                textAnchor="middle"
                                className="font-mono opacity-40"
                              >
                                #{pt.prUrl.split('/').pop()}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    ) : null}
                  </div>
                </div>

                {/* System Performance Quota Widget */}
                <div className="lg:col-span-4 bg-surface-container-low p-6 rounded-xl flex flex-col items-center justify-center text-center">
                  <h3 className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-widest mb-6">Quota Usage</h3>
                  <div className="relative w-36 h-36 mb-6 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" fill="none" r="45" stroke="#252426" strokeWidth="8"></circle>
                      <circle 
                        className="drop-shadow-[0_0_8px_#ebb2ff]" 
                        cx="50" 
                        cy="50" 
                        fill="none" 
                        r="45" 
                        stroke="#ebb2ff" 
                        strokeDasharray={`${Math.min(totalPRs * 15, 283)} 283`}
                        strokeLinecap="round" 
                        strokeWidth="8"
                      ></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-headline-lg text-on-surface font-bold leading-none">{totalPRs * 3}</span>
                      <span className="text-[10px] text-on-surface-variant opacity-60 font-bold uppercase tracking-wider mt-1">/ 50 Req/hr</span>
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-sm max-w-[200px]">
                    API quota utilization reset occurs at the top of the hour.
                  </p>
                </div>
              </div>

              {/* Recent PR Activity Table */}
              <div className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant/10">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
                  <div>
                    <h3 className="font-headline-md font-space text-on-surface">Recent PR Activity</h3>
                    <p className="text-label-sm text-on-surface-variant">Real-time status updates of checked repositories</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {reviewsHistory.length === 0 ? (
                    <div className="p-12 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-[48px] opacity-20">find_in_page</span>
                      <p className="mt-2 text-body-md">No pull request reviews registered yet.</p>
                      <button 
                        onClick={() => setShowTriggerModal(true)}
                        className="mt-4 px-4 py-2 bg-primary-fixed-dim text-on-primary-fixed font-bold rounded-lg hover:brightness-110 transition-all text-sm"
                      >
                        Trigger First Review
                      </button>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-label-sm text-on-surface-variant border-b border-outline-variant/15 bg-surface-container-high/50">
                          <th className="px-6 py-4 uppercase font-bold tracking-wider">Repository / Pull Request</th>
                          <th className="px-6 py-4 uppercase font-bold tracking-wider">Commit SHA</th>
                          <th className="px-6 py-4 uppercase font-bold tracking-wider">Score</th>
                          <th className="px-6 py-4 uppercase font-bold tracking-wider">Findings</th>
                          <th className="px-6 py-4 uppercase font-bold tracking-wider">Reviewed At</th>
                          <th className="px-6 py-4 uppercase font-bold tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {reviewsHistory.map(rev => {
                          const prNum = rev.prUrl.split('/').pop();
                          const repoName = rev.prUrl.replace('https://github.com/', '').split('/pull/')[0];
                          return (
                            <tr key={rev.id} className="hover:bg-surface-container-high/30 transition-colors group">
                              <td className="px-6 py-4.5">
                                <div className="flex flex-col">
                                  <span className="font-bold text-on-surface group-hover:text-primary-fixed-dim transition-colors">
                                    {rev.prTitle || `Pull Request #${prNum}`}
                                  </span>
                                  <a href={rev.prUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-on-surface-variant hover:text-primary-fixed hover:underline flex items-center gap-1 mt-0.5">
                                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                    {repoName}
                                  </a>
                                </div>
                              </td>
                              <td className="px-6 py-4.5">
                                <span className="font-code-md text-code-md text-on-surface-variant bg-surface-container-lowest px-2.5 py-1 rounded font-mono">
                                  {rev.headCommitSha.substring(0, 8)}
                                </span>
                              </td>
                              <td className="px-6 py-4.5">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                  rev.overallScore >= 80 ? 'bg-primary-container/20 text-primary-fixed-dim border border-primary-fixed-dim/20' :
                                  rev.overallScore >= 60 ? 'bg-secondary-container/20 text-secondary border border-secondary/20' :
                                  'bg-error-container/20 text-error border border-error/20'
                                }`}>
                                  {rev.overallScore} / 100
                                </span>
                              </td>
                              <td className="px-6 py-4.5 text-on-surface-variant text-sm">
                                {rev.findings?.length || 0} alerts detected
                              </td>
                              <td className="px-6 py-4.5 text-on-surface-variant font-label-sm text-sm">
                                {new Date(rev.reviewedAt).toLocaleString()}
                              </td>
                              <td className="px-6 py-4.5 text-right">
                                <div className="flex gap-2.5 justify-end">
                                  <button 
                                    onClick={() => {
                                      setSelectedReview(rev);
                                      setActiveTab('reviews');
                                    }}
                                    className="px-3.5 py-1.5 bg-surface-container-highest hover:bg-primary-fixed-dim hover:text-on-primary-fixed text-on-surface rounded text-xs font-bold transition-all"
                                  >
                                    Inspect Code
                                  </button>
                                  <button 
                                    onClick={(e) => handleDeleteReview(rev.id, e)}
                                    className="p-1.5 border border-error/30 hover:bg-error/15 text-error rounded transition-all"
                                    title="Delete Review Log"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
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

          {/* TAB 2: PR REVIEWS DETAILS */}
          {activeTab === 'reviews' && (
            <div className="grid grid-cols-12 gap-gutter">
              
              {/* Left Column: Code Review content (2/3 width) */}
              <div className="col-span-12 lg:col-span-8 space-y-stack-gap">
                
                {/* Selection Dropdown + Details Header */}
                <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 flex flex-wrap items-center justify-between gap-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant">
                      <span className="material-symbols-outlined text-primary-fixed">find_in_page</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Selected Inspection Target</span>
                      
                      <div className="flex items-center gap-1">
                        <select 
                          value={selectedReview?.id || ''} 
                          onChange={(e) => {
                            const found = reviewsHistory.find(r => r.id === e.target.value);
                            if (found) setSelectedReview(found);
                          }}
                          className="bg-transparent text-on-surface font-headline-md font-bold focus:ring-0 focus:outline-none border-none py-0 pl-0 pr-6 cursor-pointer text-lg"
                        >
                          {reviewsHistory.map(r => (
                            <option key={r.id} value={r.id} className="bg-surface-container text-on-surface text-body-md">
                              PR #{r.prUrl.split('/').pop()} - {(r.prTitle || r.repository || 'PR Review').substring(0, 30)}
                            </option>
                          ))}
                          {reviewsHistory.length === 0 && <option value="">No PR reviews completed yet</option>}
                        </select>
                      </div>

                    </div>
                  </div>

                  {selectedReview && (
                    <div className="flex items-center gap-2">
                      <a 
                        href={selectedReview.prUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="px-4 py-2 bg-surface-container-highest hover:bg-surface-container-bright text-on-surface font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-outline-variant/30"
                      >
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        View on GitHub
                      </a>
                      <button 
                        onClick={(e) => handleDeleteReview(selectedReview.id, e)}
                        className="px-4 py-2 border border-error/30 hover:bg-error/15 text-error font-bold rounded-lg text-xs transition-colors"
                      >
                        Delete Review
                      </button>
                    </div>
                  )}
                </div>

                {selectedReview ? (
                  <>
                    {/* PR Metadata Card */}
                    <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/15 flex flex-wrap items-center justify-between gap-6 shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/30 overflow-hidden">
                          <span className="material-symbols-outlined text-secondary text-2xl">person_search</span>
                        </div>
                        <div>
                          <p className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-widest">Repository Path</p>
                          <p className="font-headline-md text-on-surface leading-tight text-base font-space">
                            {selectedReview.prUrl.replace('https://github.com/', '').split('/pull/')[0]}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-8 text-sm">
                        <div>
                          <p className="text-label-sm font-label-sm text-on-surface-variant">Pull Request</p>
                          <p className="font-code-md text-code-md text-primary-fixed-dim">#{selectedReview.prUrl.split('/').pop()}</p>
                        </div>
                        <div>
                          <p className="text-label-sm font-label-sm text-on-surface-variant">Target Branch</p>
                          <p className="font-code-md text-code-md text-on-surface">main</p>
                        </div>
                        <div>
                          <p className="text-label-sm font-label-sm text-on-surface-variant">Commit SHA</p>
                          <p className="font-code-md text-code-md text-on-surface-variant font-mono">{selectedReview.headCommitSha.substring(0, 8)}</p>
                        </div>
                      </div>
                    </div>

                    {/* AI Analysis Overview Card */}
                    <div className="bg-surface-container-high p-8 rounded-xl border border-outline-variant/10 relative overflow-hidden shadow-lg">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <span className="material-symbols-outlined text-[100px]">auto_awesome</span>
                      </div>
                      <div className="flex items-center gap-2.5 mb-4">
                        <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                        <h3 className="font-headline-md text-primary-fixed-dim font-space text-lg">AI Analysis Summary</h3>
                      </div>
                      <p className="text-on-surface-variant leading-relaxed text-body-md whitespace-pre-wrap">
                        {selectedReview.summary || "No review summary details provided by sentinel agent."}
                      </p>
                    </div>

                    {/* Code Diff Panel listing all findings */}
                    <div className="space-y-6">
                      <h4 className="font-headline-md text-on-surface font-space text-base flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary">security_update_warning</span>
                        Vulnerabilities & Findings ({selectedFindings.length})
                      </h4>
                      
                      {selectedFindings.length === 0 ? (
                        <div className="bg-primary-container/10 border border-primary-fixed-dim/20 rounded-xl p-8 text-center text-primary-fixed-dim">
                          <span className="material-symbols-outlined text-[48px] opacity-40 mb-2">verified</span>
                          <h4 className="font-bold text-on-surface">No Security Vulnerabilities Detected</h4>
                          <p className="text-sm text-on-surface-variant mt-1">This branch meets all top-tier cryptographic and SQL injection safety guidelines.</p>
                        </div>
                      ) : (
                        selectedFindings.map(finding => renderFindingDiff(finding))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-surface-container p-12 rounded-xl text-center text-on-surface-variant border border-outline-variant/10">
                    <span className="material-symbols-outlined text-[64px] opacity-20">find_in_page</span>
                    <p className="mt-4 text-lg font-bold text-on-surface">No PR Selection Active</p>
                    <p className="text-sm text-on-surface-variant mt-1">Run an analysis or select a PR review from the dashboard to inspect findings.</p>
                  </div>
                )}
              </div>

              {/* Right Column: PR Score and Checklist (1/3 width) */}
              <aside className="col-span-12 lg:col-span-4 space-y-stack-gap">
                
                {/* PR Score Card */}
                <div className="bg-surface-container p-8 rounded-xl border border-outline-variant/10 flex flex-col items-center text-center shadow-xl relative overflow-hidden">
                  <div className="absolute -top-16 -right-16 w-36 h-36 bg-secondary-container/5 blur-[50px] pointer-events-none"></div>
                  <h3 className="text-label-sm font-label-sm text-on-surface-variant mb-6 uppercase tracking-widest font-space">Security Grade</h3>
                  
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    
                    {/* Animated dynamic Conic Gradient Progress Circle */}
                    <div 
                      className="w-full h-full rounded-full flex items-center justify-center transition-all duration-1000"
                      style={selectedProgressStyle}
                    >
                      <div className="w-[85%] h-[85%] bg-surface-container rounded-full flex flex-col items-center justify-center">
                        <span className="text-display-lg font-bold text-secondary glow-purple leading-none font-space">
                          {selectedReview ? selectedReview.overallScore : '0'}
                        </span>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter mt-1 font-bold">/ 100 max</span>
                      </div>
                    </div>

                    {/* Orbiting dot effect */}
                    <div className="absolute inset-0 border border-secondary/15 rounded-full animate-[spin_8s_linear_infinite]">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_#f43f5e]"></div>
                    </div>
                  </div>

                  {selectedReview && (
                    <p className="mt-6 text-on-surface-variant text-sm leading-relaxed">
                      {selectedReview.overallScore >= 80 ? (
                        <span className="text-primary-fixed-dim font-bold">Approved for Production Merge.</span>
                      ) : (
                        <span className="text-error font-bold">{criticalCount} critical issue{criticalCount === 1 ? '' : 's'} preventing merge.</span>
                      )}
                      <br/>
                      <span className="text-xs text-on-surface-variant mt-1 block">Checked against 14 system security rulesets.</span>
                    </p>
                  )}
                </div>

                {/* Vulnerabilities breakdown widget */}
                <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 space-y-4 shadow-md">
                  <h3 className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-widest mb-2 font-space">Issue Breakdown</h3>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-error-container/10 border border-error/15">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                      <span className="font-body-md text-on-surface text-sm font-bold">Critical Vulnerabilities</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-error text-on-error text-[10px] font-bold uppercase">{criticalCount} Flagged</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-high border border-outline-variant/15">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                      <span className="font-body-md text-on-surface text-sm font-bold">Code Warnings</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-secondary-container/20 text-secondary text-[10px] font-bold uppercase">{warningCount} Warning{warningCount === 1 ? '' : 's'}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-high border border-outline-variant/15">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                      <span className="font-body-md text-on-surface text-sm font-bold">Refactoring Hints</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary-fixed text-[10px] font-bold uppercase">{infoCount} info</span>
                  </div>
                </div>

                {/* Security Checks checklist */}
                <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 shadow-md">
                  <h3 className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-widest mb-6 font-space">Security Enforcement</h3>
                  
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded flex items-center justify-center bg-primary-container/20 border border-primary-fixed-dim/30">
                        <span className="material-symbols-outlined text-primary-fixed-dim text-[16px] font-bold">check</span>
                      </div>
                      <span className="text-sm text-on-surface-variant font-bold">SHA-256 Key Hashing Enforcement</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded flex items-center justify-center bg-primary-container/20 border border-primary-fixed-dim/30">
                        <span className="material-symbols-outlined text-primary-fixed-dim text-[16px] font-bold">check</span>
                      </div>
                      <span className="text-sm text-on-surface-variant font-bold">Signature Integrity Verification</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${forceHmac ? 'bg-primary-container/20 border-primary-fixed-dim/30' : 'border-outline-variant'}`}>
                        {forceHmac && <span className="material-symbols-outlined text-primary-fixed-dim text-[16px] font-bold">check</span>}
                      </div>
                      <span className={`text-sm font-bold ${forceHmac ? 'text-on-surface-variant' : 'text-on-surface-variant/40'}`}>HMAC Payload Integrity Guard</span>
                    </li>
                    <li className="flex items-center gap-3 opacity-40">
                      <div className="w-5 h-5 rounded border border-outline-variant"></div>
                      <span className="text-sm text-on-surface-variant font-bold">JWT Audience Assertion Checks</span>
                    </li>
                  </ul>
                </div>

                {/* Security signal sparkline widget */}
                <div className="bg-surface-container-high rounded-xl p-6 relative overflow-hidden h-32 border border-outline-variant/10 shadow-md">
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase font-space">Security Shield Signal</span>
                    <span className="text-[10px] text-primary-fixed font-bold tracking-widest glow-cyan">OPTIMAL</span>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-16 pointer-events-none">
                    <svg className="w-full h-full preserve-3d" viewBox="0 0 100 20">
                      <path d="M0,15 Q10,5 20,12 T40,8 T60,14 T80,6 T100,10 L100,20 L0,20 Z" fill="url(#cyanGradient)" fillOpacity="0.2"></path>
                      <path className="drop-shadow-[0_0_2px_#00f2ff]" d="M0,15 Q10,5 20,12 T40,8 T60,14 T80,6 T100,10" fill="none" stroke="#00f2ff" strokeWidth="0.5"></path>
                      <defs>
                        <linearGradient id="cyanGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#00f2ff"></stop>
                          <stop offset="100%" stopColor="#00f2ff" stopOpacity="0"></stop>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </aside>
            </div>
          )}

          {/* TAB 3: SECURITY & KEY MANAGER */}
          {activeTab === 'security' && (
            <div className="flex flex-col lg:flex-row gap-gutter">
              
              {/* Left Column: Key Management List (2/3 width) */}
              <div className="w-full lg:w-2/3 flex flex-col gap-gutter">
                
                {/* Header Actions Card */}
                <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-8">
                    <button 
                      onClick={() => {
                        setGeneratedKeyResult(null);
                        setNewClientName('');
                        setShowGenerateModal(true);
                      }}
                      className="bg-gradient-to-r from-primary-fixed-dim to-secondary-container text-on-primary-fixed font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 transition-transform active:scale-95 shadow-[0_0_20px_rgba(0,219,231,0.3)] text-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Create New Key
                    </button>

                    <div className="flex items-center gap-4">
                      <span className="text-label-sm text-on-surface-variant font-bold tracking-widest uppercase font-space">Force HMAC Validation</span>
                      <button 
                        onClick={() => setForceHmac(!forceHmac)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${forceHmac ? 'bg-primary-container/20 border border-primary-container/30' : 'bg-surface-container-highest border border-outline-variant'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-primary-fixed transition-transform duration-200 ${forceHmac ? 'translate-x-6 shadow-[0_0_12px_#00dbe7]' : 'translate-x-1'}`}></span>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-fixed opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-fixed"></span>
                    </span>
                    <span className="text-label-sm text-primary-fixed font-bold font-space uppercase">Network Shield Active</span>
                  </div>
                </div>

                {/* Active API Clients Table */}
                <div className="bg-surface-container rounded-xl overflow-hidden shadow-xl border border-outline-variant/10 flex flex-col flex-1">
                  
                  <div className="p-6 border-b border-outline-variant/10 flex flex-wrap gap-4 justify-between items-center bg-surface-container-high/20">
                    <div>
                      <h3 className="font-headline-md text-primary font-space text-lg">Active API Clients & Hashed Keys</h3>
                      <p className="text-label-sm text-on-surface-variant mt-0.5">Database keys are hashed with SHA-256 for secure identification</p>
                    </div>
                    
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-lg border border-outline-variant/30">
                      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
                      <input 
                        className="bg-transparent border-none outline-none focus:ring-0 text-sm text-on-surface placeholder:text-on-surface-variant w-40" 
                        placeholder="Filter client name..." 
                        type="text"
                        value={filterKeys}
                        onChange={(e) => setFilterKeys(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {loadingKeys ? (
                      <div className="p-12 text-center text-on-surface-variant">Loading client credentials...</div>
                    ) : filteredKeysList.length === 0 ? (
                      <div className="p-12 text-center text-on-surface-variant">No client keys configured.</div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-label-sm text-on-surface-variant border-b border-outline-variant/15 bg-surface-container-high/30">
                            <th className="px-6 py-4 font-bold uppercase tracking-wider">Client Name</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-wider">Hashed SHA-256 Prefix</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-wider">Rate Limit</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-wider">Last Active</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-wider text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                          {filteredKeysList.map(k => (
                            <tr key={k.id} className={`hover:bg-surface-container-high/20 transition-colors group ${!k.active ? 'opacity-55' : ''}`}>
                              <td className="px-6 py-4.5">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-primary-fixed-dim text-[18px]">terminal</span>
                                  <span className="font-code-md text-on-surface text-sm font-bold">{k.clientName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4.5">
                                <span className="font-code-md text-xs text-on-surface-variant bg-surface-container-lowest px-2 py-1 rounded font-mono">
                                  sha256:{k.id.substring(0, 8)}...
                                </span>
                              </td>
                              <td className="px-6 py-4.5">
                                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full w-fit text-[10px] font-bold border ${
                                  k.active ? 'bg-primary-container/20 text-primary-fixed border-primary-fixed/20' : 'bg-surface-container-highest text-on-surface-variant border-outline/25'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${k.active ? 'bg-primary-fixed animate-pulse' : 'bg-on-surface-variant'}`}></span>
                                  {k.active ? 'ACTIVE' : 'REVOKED'}
                                </div>
                              </td>
                              <td className="px-6 py-4.5">
                                <div className="flex flex-col gap-1 w-28">
                                  <div className="flex justify-between text-[10px] text-on-surface-variant font-bold">
                                    <span>{k.active ? '142' : '0'}</span>
                                    <span>500/hr</span>
                                  </div>
                                  <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                    <div className="h-full bg-primary-fixed-dim" style={{ width: k.active ? '28.4%' : '0%' }}></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4.5 text-on-surface-variant font-label-sm text-xs">
                                {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleTimeString() : 'Never'}
                              </td>
                              <td className="px-6 py-4.5 text-right">
                                {k.active ? (
                                  <button 
                                    onClick={() => handleRevokeKey(k.id)}
                                    className="text-error border border-error/30 hover:bg-error/15 px-3 py-1 rounded text-xs font-bold transition-all"
                                  >
                                    Revoke
                                  </button>
                                ) : (
                                  <span className="text-on-surface-variant/40 text-xs font-bold">Disabled</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Security Note Card */}
                <div className="bg-surface-container-high/30 border-l-4 border-secondary p-6 rounded-r-xl flex gap-6 items-start border border-outline-variant/10 shadow-md">
                  <span className="material-symbols-outlined text-secondary text-3xl">verified_user</span>
                  <div>
                    <h4 className="font-headline-md text-secondary mb-2 font-space text-base">Security Enforcement Policy</h4>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      API keys are securely hashed using <span className="font-code-md text-on-surface bg-surface-container px-1.5 py-0.5 rounded font-mono text-xs">SHA-256</span> before database insertion. Plaintext key lookups are strictly blocked. Authenticated webhooks are processed using <span className="font-code-md text-on-surface bg-surface-container px-1.5 py-0.5 rounded font-mono text-xs">Redis-backed</span> rate limiting to defend against Denial of Service attacks and automated scraping.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Security Diagnostics widgets (1/3 width) */}
              <div className="w-full lg:w-1/3 flex flex-col gap-gutter">
                
                {/* Redis memory radial gauge widget */}
                <div className="bg-surface-container rounded-xl p-6 shadow-xl border border-outline-variant/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 blur-[60px] pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="font-headline-md font-space text-on-surface text-base">Redis Rate Limiter</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed shadow-[0_0_8px_#00dbe7]"></span>
                        <span className="text-label-sm text-primary-fixed font-bold tracking-widest font-space text-[10px]">HEALTHY</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">speed</span>
                  </div>

                  <div className="flex justify-center mb-6">
                    <div className="relative w-36 h-36">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle className="text-surface-container-highest" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                        <circle className="text-primary-fixed-dim" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset="216" strokeLinecap="round" strokeWidth="8" style={{ filter: 'drop-shadow(0 0 4px #00dbe7)' }}></circle>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-headline-lg text-primary-fixed-dim leading-none font-bold text-2xl">14%</span>
                        <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-1">Memory Usage</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30">
                      <p className="text-label-sm text-on-surface-variant uppercase mb-1 text-[10px]">Throttle Limit</p>
                      <p className="font-headline-md text-on-surface text-base font-space">10 <span className="text-xs text-on-surface-variant">r/m</span></p>
                    </div>
                    <div className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30">
                      <p className="text-label-sm text-on-surface-variant uppercase mb-1 text-[10px]">Blocked Requests</p>
                      <p className="font-headline-md text-on-surface text-base font-space">0</p>
                    </div>
                  </div>
                </div>

                {/* Webhook Secret Signature guard widget */}
                <div className="bg-surface-container-low rounded-xl p-6 shadow-xl border border-outline-variant/10 flex flex-col gap-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-headline-md font-space text-on-surface text-base">Webhook Signature</h3>
                      <p className="text-label-sm text-on-surface-variant">HMAC-SHA-256 Validation</p>
                    </div>
                    <div className="bg-primary-container/10 px-3 py-1 rounded flex items-center gap-1.5 animate-pulse-cyan border border-primary-fixed/20">
                      <span className="text-[10px] text-primary-fixed font-bold font-space uppercase">ENABLED</span>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/30 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1">Shared Secret</span>
                      <span className="font-code-md text-on-surface-variant tracking-[0.25em] font-mono text-sm">
                        {webhookSecretVisible ? 'default-webhook-secret' : '••••••••••••••••'}
                      </span>
                    </div>
                    <button 
                      onClick={() => setWebhookSecretVisible(!webhookSecretVisible)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-surface-container-highest rounded transition-colors text-on-surface-variant hover:text-primary-fixed-dim"
                    >
                      <span className="material-symbols-outlined text-[20px]">{webhookSecretVisible ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-4">
                      <h4 className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider text-[10px] font-space">Request Integrity (24h)</h4>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary-fixed"></span> Accepted</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-error"></span> Rejected</span>
                      </div>
                    </div>

                    {/* Mock Integrity Bar Chart */}
                    <div className="flex items-end justify-between h-24 gap-2 px-1">
                      {[16, 20, 24, 18, 22, 14, 25].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col gap-0.5 justify-end">
                          <div 
                            className={`w-full bg-primary-fixed/40 rounded-t-sm transition-all group-hover:bg-primary-fixed ${i === 6 ? 'bg-primary-fixed shadow-[0_0_8px_#00dbe7]' : ''}`} 
                            style={{ height: `${h * 3}px` }}
                          ></div>
                          <div 
                            className="w-full bg-error/25 rounded-b-sm" 
                            style={{ height: `${(i % 3 === 0) ? '6px' : '2px'}` }}
                          ></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM LOGS DIAGNOSTICS */}
          {activeTab === 'logs' && (
            <div className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant/10 shadow-2xl flex flex-col h-[calc(100vh-12rem)]">
              
              <div className="p-5 bg-surface-container-high/50 border-b border-outline-variant/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed animate-ping"></span>
                  <div>
                    <h3 className="font-headline-md font-space text-on-surface text-base">Diagnostics Log Stream</h3>
                    <p className="text-[10px] text-on-surface-variant">Live backend output telemetry from Sentinel engine</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const time = new Date().toISOString().replace('T', ' ').substring(0, 19);
                      setLogs(prev => [...prev, `[${time}] INFO  c.p.p.service.Diagnostics - Client manual flush triggered`]);
                    }}
                    className="px-3.5 py-1.5 bg-surface-container-highest hover:bg-surface-container-bright text-on-surface rounded text-xs font-bold transition-all border border-outline-variant/20"
                  >
                    Trigger Diagnostic
                  </button>
                  <button 
                    onClick={() => setLogs([])}
                    className="px-3.5 py-1.5 border border-error/30 hover:bg-error/15 text-error rounded text-xs font-bold transition-all"
                  >
                    Clear Terminal
                  </button>
                </div>
              </div>

              {/* Scrollable Terminal Output */}
              <div className="flex-1 bg-surface-container-lowest p-6 font-mono text-code-md text-on-surface-variant overflow-y-auto custom-scrollbar select-text">
                <div className="space-y-1.5">
                  {logs.map((logLine, index) => {
                    const isError = logLine.includes('ERROR') || logLine.includes('failed');
                    const isWarning = logLine.includes('WARNING');
                    return (
                      <div 
                        key={index} 
                        className={`whitespace-pre-wrap leading-relaxed ${isError ? 'text-error font-bold' : isWarning ? 'text-secondary' : ''}`}
                      >
                        {logLine}
                      </div>
                    );
                  })}
                  <div className="text-primary-fixed-dim/60 animate-pulse mt-4">_ SYSTEM SHIELD STANDBY. WAITING FOR TRIGGER...</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL 1: RUN NEW PR ANALYSIS */}
      {showTriggerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface-container border border-outline-variant/30 rounded-xl p-6 shadow-2xl relative">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-md font-space text-on-surface text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-fixed-dim">search</span>
                Analyze GitHub Repository
              </h3>
              <button 
                onClick={() => setShowTriggerModal(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleTriggerReview} className="space-y-4">
              <div>
                <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-2 font-space">Pull Request URL</label>
                <input 
                  type="url"
                  className="w-full bg-surface-container-lowest border border-outline-variant/40 focus:border-primary-fixed-dim/60 focus:ring-0 text-body-md text-on-surface rounded-lg px-4 py-3 transition-all"
                  placeholder="e.g. https://github.com/rachit-890/AICodeReviewBot/pull/1"
                  value={reviewPrUrl}
                  onChange={(e) => setReviewPrUrl(e.target.value)}
                  required
                />
                <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                  Sentinel will query GitHub API, compile changed files metadata, fetch original diffs, and query the backend LLM orchestrator.
                </p>
              </div>

              {errorMessage && (
                <p className="text-xs text-error bg-error-container/10 border border-error/25 rounded p-2 text-center">{errorMessage}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowTriggerModal(false)}
                  className="px-4 py-2.5 bg-surface-container-highest hover:bg-surface-container-bright text-on-surface rounded-lg text-xs font-bold transition-all border border-outline-variant/20"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submittingReview}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-fixed-dim to-secondary-container text-on-primary-fixed font-bold rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(0,219,231,0.2)] flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {submittingReview ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                      Running Sentinel...
                    </>
                  ) : 'Run Analysis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE API KEY CREDENTIALS */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-container border border-outline-variant/30 rounded-xl p-6 shadow-2xl relative">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline-md font-space text-on-surface text-lg">Create API Credentials</h3>
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {!generatedKeyResult ? (
              <form onSubmit={handleGenerateKey} className="space-y-4">
                <div>
                  <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-2 font-space">Client Application Name</label>
                  <input 
                    type="text"
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 focus:border-primary-fixed-dim/60 focus:ring-0 text-body-md text-on-surface rounded-lg px-4 py-2.5 transition-all"
                    placeholder="e.g. GitHub Action Production CI"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2.5 bg-surface-container-highest hover:bg-surface-container-bright text-on-surface rounded-lg text-xs font-bold transition-all border border-outline-variant/20"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-primary-fixed-dim text-on-primary-fixed font-bold rounded-lg text-xs transition-all active:scale-95"
                  >
                    Generate key
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-secondary-container/10 border border-secondary-container/30 text-secondary rounded-lg p-3 text-xs leading-relaxed">
                  ⚠️ Copy this key now! For security reasons, it will not be shown again.
                </div>
                <div>
                  <label className="block text-label-sm text-on-surface-variant uppercase tracking-wider mb-1 font-space">Secret API Token</label>
                  <input 
                    type="text"
                    className="w-full bg-surface-container-lowest border border-outline-variant/40 text-code-md text-primary-fixed font-mono rounded-lg px-3 py-2.5"
                    value={generatedKeyResult.key}
                    readOnly
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => setShowGenerateModal(false)}
                    className="px-6 py-2 bg-primary-fixed-dim text-on-primary-fixed font-bold rounded-lg text-xs hover:brightness-110 transition-all"
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
