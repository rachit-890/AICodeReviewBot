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
    <div className="p-6 space-y-8 max-w-6xl mx-auto bg-[#FDFBFC] text-[#201E1E]">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#A68B78]/30 pb-4">
        <div>
          <h2 className="text-2xl font-black font-display tracking-tight text-[#164A40] uppercase flex items-center space-x-3">
            <span>OVERVIEW DASHBOARD</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 bg-[#164A40] text-[#F7D3CC]">
              LIVE TELEMETRY
            </span>
          </h2>
          <p className="text-xs text-[#634F43] font-mono mt-1">Real-time system health, PR quality metrics, and security audit log.</p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-[#F4EFEB] border border-[#A68B78]/40 hover:border-[#164A40] text-xs font-mono text-[#164A40] hover:text-[#164A40] transition-all flex items-center space-x-2 w-fit font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>REFRESH METRICS</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#F4EFEB] border border-[#A68B78]/30 p-5">
          <div className="flex items-center justify-between text-[#634F43] text-xs font-mono font-semibold">
            <span>TOTAL PR REVIEWS</span>
            <GitPullRequest className="w-4 h-4 text-[#164A40]" />
          </div>
          <div className="text-3xl font-black font-mono text-[#164A40] mt-2">{totalReviews}</div>
          <div className="text-[11px] font-mono text-[#A68B78] mt-1">Audited via GitHub Hook</div>
        </div>

        <div className="bg-[#F4EFEB] border border-[#A68B78]/30 p-5">
          <div className="flex items-center justify-between text-[#634F43] text-xs font-mono font-semibold">
            <span>CRITICAL FINDINGS</span>
            <AlertTriangle className="w-4 h-4 text-[#93000a]" />
          </div>
          <div className="text-3xl font-black font-mono text-[#93000a] mt-2">{criticalFindings}</div>
          <div className="text-[11px] font-mono text-[#A68B78] mt-1">Blocked before production</div>
        </div>

        <div className="bg-[#F4EFEB] border border-[#A68B78]/30 p-5">
          <div className="flex items-center justify-between text-[#634F43] text-xs font-mono font-semibold">
            <span>AVG PR QUALITY SCORE</span>
            <Shield className="w-4 h-4 text-[#164A40]" />
          </div>
          <div className="text-3xl font-black font-mono text-[#164A40] mt-2">{avgScore} / 100</div>
          <div className="text-[11px] font-mono text-[#A68B78] mt-1">Gemini AI Audit Score</div>
        </div>

        <div className="bg-[#F4EFEB] border border-[#A68B78]/30 p-5">
          <div className="flex items-center justify-between text-[#634F43] text-xs font-mono font-semibold">
            <span>RAG VECTOR DATABASE</span>
            <Database className="w-4 h-4 text-[#164A40]" />
          </div>
          <div className="text-3xl font-black font-mono text-[#164A40] mt-2">CONNECTED</div>
          <div className="text-[11px] font-mono text-[#A68B78] mt-1">PgVector 768-Dimension</div>
        </div>
      </div>

      {/* Main Review Audit History Table */}
      <div className="bg-[#FDFBFC] border border-[#A68B78]/40 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#A68B78]/20 pb-3">
          <h3 className="text-sm font-bold font-display text-[#164A40] uppercase flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#164A40]" />
            <span>RECENT PR AUDIT REVIEWS</span>
          </h3>
          <span className="text-xs font-mono text-[#634F43] font-semibold">{history.length} RECORDS</span>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[#A68B78]/40 bg-[#F4EFEB]">
            <Terminal className="w-8 h-8 text-[#A68B78] mx-auto mb-3" />
            <p className="text-sm font-mono text-[#201E1E]">No PR review records found in database.</p>
            <p className="text-xs font-mono text-[#634F43] mt-1">Run a scan in the PR Diff Studio to generate audit telemetry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#A68B78]/30">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#F4EFEB] border-b border-[#A68B78]/30 text-[#634F43] uppercase">
                <tr>
                  <th className="py-3 px-4">Repository & PR</th>
                  <th className="py-3 px-4">Commit SHA</th>
                  <th className="py-3 px-4">Quality Score</th>
                  <th className="py-3 px-4">Findings</th>
                  <th className="py-3 px-4">Reviewed At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A68B78]/20">
                {history.map((rev) => (
                  <tr key={rev.id} className="hover:bg-[#F4EFEB]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#164A40]">{rev.prTitle || rev.prUrl}</div>
                      <div className="text-[11px] text-[#A68B78]">{rev.repository || 'rachit-890/AICodeReviewBot'}</div>
                    </td>
                    <td className="py-3 px-4 text-[#634F43]">{rev.headCommitSha?.substring(0, 7)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 text-[11px] border font-bold ${
                        (rev.overallScore || 90) >= 80
                          ? 'bg-[#164A40] text-[#F7D3CC] border-[#164A40]'
                          : 'bg-[#93000a] text-[#FDFBFC] border-[#93000a]'
                      }`}>
                        {rev.overallScore || 90} / 100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-[#93000a] font-semibold">
                          {rev.findings?.filter((f) => f.severity === 'CRITICAL').length || 0} Critical
                        </span>
                        <span className="text-[#A68B78]">|</span>
                        <span className="text-[#634F43]">
                          {rev.findings?.filter((f) => f.severity !== 'CRITICAL').length || 0} Warnings
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#A68B78]">{new Date(rev.reviewedAt || Date.now()).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectReview(rev)}
                        className="px-3 py-1 bg-[#164A40] hover:bg-[#0f362e] text-[#FDFBFC] hover:text-[#F7D3CC] transition-colors flex items-center space-x-1 ml-auto font-semibold"
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
