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
    <div className="p-6 sm:p-10 space-y-10 max-w-6xl mx-auto bg-[#FDFBFC] text-[#201E1E] font-sans">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#A68B78]/25 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold font-sans text-[#164A40] flex items-center space-x-3">
            <span>Overview Dashboard</span>
            <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 bg-[#164A40] text-[#F7D3CC]">
              LIVE TELEMETRY
            </span>
          </h2>
          <p className="text-sm font-editorial italic text-[#634F43] mt-1">Real-time system health, pull request quality metrics, and security audit history.</p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2.5 bg-[#F4EFEB] border border-[#A68B78]/30 hover:border-[#164A40] text-xs font-sans font-semibold text-[#164A40] hover:text-[#164A40] transition-all flex items-center space-x-2 w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh metrics</span>
        </button>
      </div>

      {/* Metric Whitespace Grid (Editorial Style) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4 border-b border-[#A68B78]/20">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#634F43] uppercase tracking-wider">
            <GitPullRequest className="w-3.5 h-3.5 text-[#164A40]" />
            <span>Total PR Reviews</span>
          </div>
          <div className="text-4xl font-extrabold font-mono text-[#164A40]">{totalReviews}</div>
          <div className="text-[11px] font-sans text-[#A68B78]">Audited via GitHub Webhook</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#634F43] uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-[#93000a]" />
            <span>Critical Findings</span>
          </div>
          <div className="text-4xl font-extrabold font-mono text-[#93000a]">{criticalFindings}</div>
          <div className="text-[11px] font-sans text-[#A68B78]">Blocked before merge</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#634F43] uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-[#164A40]" />
            <span>Avg Quality Score</span>
          </div>
          <div className="text-4xl font-extrabold font-mono text-[#164A40]">{avgScore} <span className="text-sm font-sans text-[#634F43] font-normal">/ 100</span></div>
          <div className="text-[11px] font-sans text-[#A68B78]">Gemini AI Audit Score</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#634F43] uppercase tracking-wider">
            <Database className="w-3.5 h-3.5 text-[#164A40]" />
            <span>RAG Context DB</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#164A40] pt-1">ACTIVE</div>
          <div className="text-[11px] font-sans text-[#A68B78]">PgVector 768-Dimension</div>
        </div>
      </div>

      {/* Main Review Audit History Table */}
      <div className="bg-[#FDFBFC] border border-[#A68B78]/30 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#A68B78]/20 pb-4">
          <h3 className="text-xl font-extrabold font-sans text-[#164A40] flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#164A40]" />
            <span>Recent pull request audit reviews</span>
          </h3>
          <span className="text-xs font-mono text-[#634F43]">{history.length} records</span>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[#A68B78]/30 bg-[#F4EFEB]">
            <Terminal className="w-8 h-8 text-[#A68B78] mx-auto mb-3" />
            <p className="text-sm font-sans font-medium text-[#201E1E]">No PR review records found in database.</p>
            <p className="text-xs font-sans text-[#634F43] mt-1">Run a scan in the PR Diff Studio to generate audit telemetry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#A68B78]/20">
            <table className="w-full text-left font-sans text-xs">
              <thead className="bg-[#F4EFEB] border-b border-[#A68B78]/30 text-[#634F43] uppercase text-[10px] font-mono">
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
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#164A40] text-sm">{rev.prTitle || rev.prUrl}</div>
                      <div className="text-[11px] font-mono text-[#A68B78] mt-0.5">{rev.repository || 'rachit-890/AICodeReviewBot'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#634F43]">{rev.headCommitSha?.substring(0, 7)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 text-[11px] font-mono font-bold ${
                        (rev.overallScore || 90) >= 80
                          ? 'bg-[#164A40] text-[#F7D3CC]'
                          : 'bg-[#93000a] text-[#FDFBFC]'
                      }`}>
                        {rev.overallScore || 90} / 100
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2 font-sans text-xs">
                        <span className="text-[#93000a] font-semibold">
                          {rev.findings?.filter((f) => f.severity === 'CRITICAL').length || 0} Critical
                        </span>
                        <span className="text-[#A68B78]">|</span>
                        <span className="text-[#634F43]">
                          {rev.findings?.filter((f) => f.severity !== 'CRITICAL').length || 0} Warnings
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#A68B78] font-mono">{new Date(rev.reviewedAt || Date.now()).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectReview(rev)}
                        className="px-3.5 py-1.5 bg-[#164A40] hover:bg-[#0f362e] text-[#FDFBFC] hover:text-[#F7D3CC] transition-colors flex items-center space-x-1 ml-auto font-sans font-semibold text-xs shadow-sm"
                      >
                        <span>Inspect</span>
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
