import React, { useState, useEffect } from 'react';

// Interfaces mapping backend models
interface ReviewDetail {
  id: string;
  prUrl: string;
  headCommitSha: string;
  overallScore: number;
  reviewedAt: string;
  findings: Finding[];
}

interface Finding {
  id: string;
  filePath: string;
  lineNumber: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  category: string;
  description: string;
  snippet: string;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'security'>('overview');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('rcb_api_key') || '');
  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem('rcb_api_key', value);
  };
  const [keysList, setKeysList] = useState<ApiKeyMetadata[]>([]);
  const [reviewsHistory, setReviewsHistory] = useState<ReviewDetail[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewDetail | null>(null);
  
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Actions states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [generatedKeyResult, setGeneratedKeyResult] = useState<{ key: string } | null>(null);
  const [reviewPrUrl, setReviewPrUrl] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

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

  // Trigger New PR Review
  const handleTriggerReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewPrUrl.trim()) return;
    
    // Check if key is set
    const keyToUse = apiKey || (keysList.find(k => k.active)?.id ? 'rcb-demo-key' : '');
    
    setSubmittingReview(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`${BACKEND_URL}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': keyToUse || 'rcb-defaultkey-placeholder'
        },
        body: JSON.stringify({ prUrl: reviewPrUrl }),
      });
      
      if (response.ok) {
        const data = await response.json();
        alert('Review completed successfully!');
        setReviewPrUrl('');
        fetchHistory();
        // Set the active tab to reviews to show details
        setActiveTab('reviews');
        // Fetch review details to select it
        const detailResp = await fetch(`${BACKEND_URL}/review/${data.id}`, {
          headers: { 'X-API-Key': keyToUse }
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

  // Metrics Calculations
  const totalPRs = reviewsHistory.length;
  const avgScore = totalPRs > 0 ? (reviewsHistory.reduce((acc, curr) => acc + curr.overallScore, 0) / totalPRs).toFixed(1) : 'N/A';
  const totalFindings = reviewsHistory.reduce((acc, curr) => acc + (curr.findings ? curr.findings.length : 0), 0);
  const criticalFindings = reviewsHistory.reduce((acc, curr) => 
    acc + (curr.findings ? curr.findings.filter(f => f.severity === 'CRITICAL').length : 0), 0);

  return (
    <div className="dashboard-container">
      {/* Sidebar Panel */}
      <aside className="sidebar">
        <div className="logo-container">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color: 'var(--primary)'}}>
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span>AntiG-CodeReview</span>
        </div>

        <nav>
          <ul className="nav-links">
            <li>
              <button 
                className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
                Overview
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Review Details
              </button>
            </li>
            <li>
              <button 
                className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Security & Keys
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Container */}
      <main className="main-content">
        <header className="header-panel">
          <div className="header-title">
            <h1>
              {activeTab === 'overview' && 'Overview Dashboard'}
              {activeTab === 'reviews' && 'Pull Request Reviews'}
              {activeTab === 'security' && 'API Access Control'}
            </h1>
            <p>
              {activeTab === 'overview' && 'Real-time telemetry and metrics for AI code reviews.'}
              {activeTab === 'reviews' && 'Detailed inspection of AI findings, suggestions, and source diffs.'}
              {activeTab === 'security' && 'Manage webhook verification secrets and API credentials.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ margin: 0, fontSize: '0.7rem' }}>X-API-Key:</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter client key..." 
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                style={{ width: '180px', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              />
            </div>
          </div>
        </header>

        {/* Tab content: OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            {/* KPI Section */}
            <section className="kpi-grid">
              <div className="glass-panel kpi-card">
                <span className="kpi-label">Analyzed PRs</span>
                <span className="kpi-val">{totalPRs}</span>
                <span className="kpi-trend positive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"></polyline></svg>
                  Active
                </span>
              </div>
              <div className="glass-panel kpi-card">
                <span className="kpi-label">Average Code Quality Score</span>
                <span className="kpi-val" style={{color: parseFloat(avgScore) >= 80.0 ? 'var(--success)' : parseFloat(avgScore) >= 60.0 ? 'var(--warning)' : 'inherit'}}>
                  {avgScore} <span style={{fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)'}}>/ 100</span>
                </span>
                <span className="kpi-trend positive">Healthy</span>
              </div>
              <div className="glass-panel kpi-card">
                <span className="kpi-label">Critical Vulnerabilities</span>
                <span className="kpi-val" style={{color: criticalFindings > 0 ? 'var(--danger)' : 'var(--success)'}}>{criticalFindings}</span>
                <span className="kpi-trend" style={{color: criticalFindings > 0 ? 'var(--danger)' : 'var(--success)'}}>
                  {criticalFindings > 0 ? 'Action Required' : 'Secured'}
                </span>
              </div>
              <div className="glass-panel kpi-card">
                <span className="kpi-label">Total Code Findings</span>
                <span className="kpi-val">{totalFindings}</span>
                <span className="kpi-trend positive">Telemetries updated</span>
              </div>
            </section>

            {/* Quick Trigger & Review Volume Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
              <section className="glass-panel">
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700 }}>Trigger Immediate Review</h3>
                <form onSubmit={handleTriggerReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>GitHub PR URL</label>
                    <input 
                      type="url" 
                      className="form-input" 
                      placeholder="e.g. https://github.com/owner/repo/pull/1" 
                      value={reviewPrUrl}
                      onChange={(e) => setReviewPrUrl(e.target.value)}
                      required 
                    />
                  </div>
                  {errorMessage && <div style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errorMessage}</div>}
                  <button type="submit" className="btn" disabled={submittingReview}>
                    {submittingReview ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="spinning" style={{marginRight: '0.25rem'}}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                        Reviewing...
                      </>
                    ) : 'Run Analysis'}
                  </button>
                </form>
              </section>

              {/* Review Volume Graph */}
              <section className="glass-panel">
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700 }}>Telemetry Metrics (Code Quality Scores)</h3>
                <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '1rem 0' }}>
                  {loadingHistory ? (
                    <div style={{ color: 'var(--text-muted)', margin: 'auto', fontSize: '0.875rem' }}>Loading telemetry stats...</div>
                  ) : reviewsHistory.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', margin: 'auto', fontSize: '0.875rem' }}>No reviews executed yet. Run a review to see telemetry chart.</div>
                  ) : (
                    reviewsHistory.map((rev) => (
                      <div key={rev.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.5rem' }}>
                        <div 
                          style={{ 
                            width: '30px', 
                            height: `${rev.overallScore * 0.8}%`, 
                            background: 'linear-gradient(to top, var(--secondary), var(--primary))', 
                            borderRadius: '4px 4px 0 0',
                            position: 'relative'
                          }} 
                        >
                          <span style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.75rem', fontWeight: 700 }}>{rev.overallScore}</span>
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          PR #{rev.prUrl.split('/').pop()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Recent PR Activity Table */}
            <section className="glass-panel">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700 }}>Recent PR Activity</h3>
              <div className="data-table-container">
                {reviewsHistory.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No PR reviews registered yet.</div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Pull Request</th>
                        <th>Commit SHA</th>
                        <th>Quality Score</th>
                        <th>Findings</th>
                        <th>Timestamp</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewsHistory.map(rev => (
                        <tr key={rev.id}>
                          <td style={{ fontWeight: 600 }}>
                            <a href={rev.prUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                              PR #{rev.prUrl.split('/').pop()}
                            </a>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {rev.headCommitSha.substring(0, 8)}
                          </td>
                          <td>
                            <span className={`badge ${rev.overallScore >= 80 ? 'badge-success' : rev.overallScore >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                              {rev.overallScore} / 100
                            </span>
                          </td>
                          <td>{rev.findings ? rev.findings.length : 0} alerts</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {new Date(rev.reviewedAt).toLocaleString()}
                          </td>
                          <td>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                              onClick={() => {
                                setSelectedReview(rev);
                                setActiveTab('reviews');
                              }}
                            >
                              Inspect Code
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}

        {/* Tab content: REVIEWS */}
        {activeTab === 'reviews' && (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Reviews Navigation Panel */}
            <aside className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Reviewed PRs</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {reviewsHistory.map(rev => (
                  <button 
                    key={rev.id}
                    onClick={() => setSelectedReview(rev)}
                    className={`nav-item ${selectedReview?.id === rev.id ? 'active' : ''}`}
                    style={{ textAlign: 'left', width: '100%', border: 'none', background: 'none' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span>PR #{rev.prUrl.split('/').pop()}</span>
                      <span className={`badge ${rev.overallScore >= 80 ? 'badge-success' : 'badge-warning'}`} style={{ padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>{rev.overallScore}</span>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            {/* Review Inspection Workspace */}
            {selectedReview ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <section className="glass-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>PR Details & LLM Review Analysis</h3>
                    <a href={selectedReview.prUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                      View on GitHub
                    </a>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <div>
                      <span className="kpi-label" style={{ fontSize: '0.65rem' }}>Commit Sha</span>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>{selectedReview.headCommitSha}</p>
                    </div>
                    <div>
                      <span className="kpi-label" style={{ fontSize: '0.65rem' }}>Overall Score</span>
                      <p style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedReview.overallScore} / 100</p>
                    </div>
                    <div>
                      <span className="kpi-label" style={{ fontSize: '0.65rem' }}>Findings Detected</span>
                      <p style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedReview.findings ? selectedReview.findings.length : 0}</p>
                    </div>
                  </div>

                  <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>LLM Findings & Suggestions</h4>
                  {(!selectedReview.findings || selectedReview.findings.length === 0) ? (
                    <div style={{ color: 'var(--success)', padding: '1rem', background: 'rgba(0, 255, 170, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 255, 170, 0.1)' }}>
                      🎉 No vulnerabilities or issues found. Code adheres to top-tier quality standards.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {selectedReview.findings.map(finding => (
                        <div key={finding.id} className="glass-panel" style={{ padding: '1rem', borderLeft: `4px solid ${finding.severity === 'CRITICAL' ? 'var(--danger)' : finding.severity === 'WARNING' ? 'var(--warning)' : 'var(--primary)'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600 }}>{finding.filePath} (Line {finding.lineNumber})</span>
                            <span className={`badge ${finding.severity === 'CRITICAL' ? 'badge-danger' : finding.severity === 'WARNING' ? 'badge-warning' : 'badge-success'}`}>{finding.severity}</span>
                          </div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>{finding.description}</p>
                          
                          {/* Code comparison panel */}
                          {finding.snippet && (
                            <div className="code-diff-container" style={{ marginTop: '0.75rem' }}>
                              <div className="diff-pane">
                                <div className="diff-pane-header">Original Code</div>
                                <div className="diff-pane-content diff-line-removed">
                                  {finding.snippet}
                                </div>
                              </div>
                              <div className="diff-pane">
                                <div className="diff-pane-header">Recommended Fix</div>
                                <div className="diff-pane-content diff-line-added">
                                  {finding.suggestion}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No review selected. Use the overview tab to run a review.
              </div>
            )}
          </div>
        )}

        {/* Tab content: SECURITY */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <section className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.25rem' }}>API Keys Credentials</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Keys used by build servers, GitHub Webhooks, or client scripts to request code review analysis.</p>
                </div>
                <button className="btn" onClick={() => {
                  setGeneratedKeyResult(null);
                  setShowGenerateModal(true);
                }}>
                  Generate New Key
                </button>
              </div>

              {loadingKeys ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading keys...</div>
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Client / App Name</th>
                        <th>Created At</th>
                        <th>Last Used At</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keysList.map(k => (
                        <tr key={k.id}>
                          <td style={{ fontWeight: 600 }}>{k.clientName}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(k.createdAt).toLocaleString()}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : 'Never'}
                          </td>
                          <td>
                            <span className={`badge ${k.active ? 'badge-success' : 'badge-danger'}`}>
                              {k.active ? 'Active' : 'Revoked'}
                            </span>
                          </td>
                          <td>
                            {k.active && (
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                                onClick={() => handleRevokeKey(k.id)}
                              >
                                Revoke Key
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {keysList.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No API keys configured yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Redis & Webhook Health Telemetry */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <section className="glass-panel">
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700 }}>Cache & Session Infrastructure</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                  <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                    {/* Ring progress bar using SVG */}
                    <svg viewBox="0 0 36 36" style={{ width: '80px', height: '80px' }}>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--primary)" strokeDasharray="100, 100" strokeWidth="3" />
                    </svg>
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.8rem', fontWeight: 800 }}>100%</span>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>Redis Cache Database</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Primary memory cache database active. Connected on port 6379.</p>
                    <span className="badge badge-success">Online & Connected</span>
                  </div>
                </div>
              </section>

              <section className="glass-panel">
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700 }}>Signature & Security Rules</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem' }}>HMAC Webhook Verification</span>
                    <span className="badge badge-success">Enforced</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem' }}>Client Rate Limit per minute</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>10 requests</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem' }}>Gemini Model Instance</span>
                    <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>gemini-2.5-pro</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Key Generator Modal overlay */}
            {showGenerateModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Create API Credentials</h3>
                  
                  {!generatedKeyResult ? (
                    <form onSubmit={handleGenerateKey} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Client Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. GitHub Action Client" 
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          required 
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>Cancel</button>
                        <button type="submit" className="btn">Generate Key</button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ padding: '0.75rem', background: 'rgba(255, 183, 0, 0.1)', border: '1px solid rgba(255, 183, 0, 0.2)', borderRadius: '8px', color: 'var(--warning)', fontSize: '0.8rem' }}>
                        ⚠️ Copy this key now! For security reasons, it will not be shown again.
                      </div>
                      <div className="form-group">
                        <label>Your API Key</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={generatedKeyResult.key} 
                          readOnly 
                          onClick={(e) => (e.target as HTMLInputElement).select()} 
                          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)' }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button type="button" className="btn" onClick={() => setShowGenerateModal(false)}>Done</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
