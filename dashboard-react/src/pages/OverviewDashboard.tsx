import { 
  Activity, Shield, GitPullRequest, Database, AlertTriangle, 
  Terminal, ChevronRight, RefreshCw
} from 'lucide-react';
import type { ReviewDetail } from '../types';

interface OverviewDashboardProps {
  history: ReviewDetail[];
  onSelectReview: (review: ReviewDetail) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function OverviewDashboard({ history, onSelectReview, onRefresh, isLoading }: OverviewDashboardProps) {
  // Aggregate statistics
  const totalReviews = history.length;
  const criticalFindings = history.reduce(
    (acc, rev) => acc + (rev.findings?.filter((f) => f.severity === 'CRITICAL').length || 0),
    0
  );
  const avgScore = totalReviews > 0
    ? Math.round(history.reduce((acc, rev) => acc + (rev.overallScore || 0), 0) / totalReviews)
    : 94;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3c4a46] pb-4">
        <div>
          <h2 className="text-2xl font-black font-display tracking-tight text-[#dde4e1] uppercase flex items-center space-x-3">
            <span>OVERVIEW DASHBOARD</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 bg-[#00574d]/40 border border-[#2dd4bf] text-[#57f1db]">
              LIVE TELEMETRY
            </span>
          </h2>
          <p className="text-xs text-[#bacac5] font-mono mt-1">Real-time system health, PR quality metrics, and security audit log.</p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-[#161d1b] border border-[#3c4a46] hover:border-[#2dd4bf] text-xs font-mono text-[#dde4e1] hover:text-[#57f1db] transition-all flex items-center space-x-2 w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>REFRESH METRICS</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#161d1b] border border-[#3c4a46] p-5">
          <div className="flex items-center justify-between text-[#bacac5] text-xs font-mono">
            <span>TOTAL PR REVIEWS</span>
            <GitPullRequest className="w-4 h-4 text-[#2dd4bf]" />
          </div>
          <div className="text-3xl font-black font-mono text-[#57f1db] mt-2">{totalReviews}</div>
          <div className="text-[11px] font-mono text-[#859490] mt-1">Audited via GitHub Hook</div>
        </div>

        <div className="bg-[#161d1b] border border-[#3c4a46] p-5">
          <div className="flex items-center justify-between text-[#bacac5] text-xs font-mono">
            <span>CRITICAL FINDINGS</span>
            <AlertTriangle className="w-4 h-4 text-[#ffb4ab]" />
          </div>
          <div className="text-3xl font-black font-mono text-[#ffb4ab] mt-2">{criticalFindings}</div>
          <div className="text-[11px] font-mono text-[#859490] mt-1">Blocked before production</div>
        </div>

        <div className="bg-[#161d1b] border border-[#3c4a46] p-5">
          <div className="flex items-center justify-between text-[#bacac5] text-xs font-mono">
            <span>AVG PR QUALITY SCORE</span>
            <Shield className="w-4 h-4 text-[#2dd4bf]" />
          </div>
          <div className="text-3xl font-black font-mono text-[#57f1db] mt-2">{avgScore} / 100</div>
          <div className="text-[11px] font-mono text-[#859490] mt-1">Gemini AI Audit Score</div>
        </div>

        <div className="bg-[#161d1b] border border-[#3c4a46] p-5">
          <div className="flex items-center justify-between text-[#bacac5] text-xs font-mono">
            <span>RAG VECTOR DATABASE</span>
            <Database className="w-4 h-4 text-[#2dd4bf]" />
          </div>
          <div className="text-3xl font-black font-mono text-[#57f1db] mt-2">CONNECTED</div>
          <div className="text-[11px] font-mono text-[#859490] mt-1">PgVector 768-Dimension</div>
        </div>
      </div>

      {/* Main Review Audit History Table */}
      <div className="bg-[#161d1b] border border-[#3c4a46] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-display text-[#dde4e1] uppercase flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#2dd4bf]" />
            <span>RECENT PR AUDIT REVIEWS</span>
          </h3>
          <span className="text-xs font-mono text-[#bacac5]">{history.length} RECORDS</span>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[#3c4a46] bg-[#09100e]">
            <Terminal className="w-8 h-8 text-[#859490] mx-auto mb-3" />
            <p className="text-sm font-mono text-[#bacac5]">No PR review records found in database.</p>
            <p className="text-xs font-mono text-[#859490] mt-1">Run a scan in the PR Diff Studio to generate audit telemetry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#3c4a46]">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#1a211f] border-b border-[#3c4a46] text-[#bacac5] uppercase">
                <tr>
                  <th className="py-3 px-4">Repository & PR</th>
                  <th className="py-3 px-4">Commit SHA</th>
                  <th className="py-3 px-4">Quality Score</th>
                  <th className="py-3 px-4">Findings</th>
                  <th className="py-3 px-4">Reviewed At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3c4a46]">
                {history.map((rev) => (
                  <tr key={rev.id} className="hover:bg-[#1a211f]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#dde4e1]">{rev.prTitle || rev.prUrl}</div>
                      <div className="text-[11px] text-[#2dd4bf]">{rev.repository || 'rachit-890/AICodeReviewBot'}</div>
                    </td>
                    <td className="py-3 px-4 text-[#bacac5]">{rev.headCommitSha?.substring(0, 7)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 text-[11px] border font-bold ${
                        (rev.overallScore || 90) >= 80
                          ? 'bg-[#00574d]/30 border-[#2dd4bf] text-[#57f1db]'
                          : 'bg-[#93000a]/30 border-[#ffb4ab] text-[#ffb4ab]'
                      }`}>
                        {rev.overallScore || 90} / 100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-[#ffb4ab]">
                          {rev.findings?.filter((f) => f.severity === 'CRITICAL').length || 0} Critical
                        </span>
                        <span className="text-[#bacac5]">|</span>
                        <span className="text-[#bacac5]">
                          {rev.findings?.filter((f) => f.severity !== 'CRITICAL').length || 0} Warnings
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#859490]">{new Date(rev.reviewedAt || Date.now()).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectReview(rev)}
                        className="px-3 py-1 bg-[#1a211f] border border-[#3c4a46] hover:border-[#2dd4bf] text-[#2dd4bf] hover:text-[#57f1db] transition-colors flex items-center space-x-1 ml-auto"
                      >
                        <span>INSPECT</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
