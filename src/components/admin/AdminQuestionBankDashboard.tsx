import React, { useEffect, useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  Layers,
  Award,
  Sparkles,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AdminAIGenerationControl } from './AdminAIGenerationControl';
import { AdminContentOperationsHub } from './AdminContentOperationsHub';
import { fetchWithAuth } from '../../api/client';

export function AdminQuestionBankDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/admin/questions/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load dashboard metrics');
      }
    } catch {
      setError('Network error fetching dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
        <span>Loading Question Bank Analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-950/30 border border-red-800/50 rounded-xl text-red-300 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <div>
          <h4 className="font-semibold text-red-200">Unable to load dashboard</h4>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const h = stats?.healthIndicators || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-7 h-7 text-orange-500" />
            Question Bank Intelligence Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time quality metrics, verification statistics, and pool health for ShikshaSahayak.
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition flex items-center gap-2 w-fit"
        >
          <Sparkles className="w-4 h-4 text-orange-400" /> Refresh Analytics
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Questions</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-extrabold text-slate-100">{stats?.totalQuestions || 0}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {stats?.originalPyqCount || 0} Original PYQs
          </div>
        </div>

        <div className="p-5 bg-slate-900/90 border border-emerald-900/40 rounded-xl">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Verified (Test Eligible)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">{stats?.verifiedQuestions || 0}</div>
          <div className="text-xs text-emerald-300/80 mt-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Verification Rate: {h.verificationRate}%
          </div>
        </div>

        <div className="p-5 bg-slate-900/90 border border-amber-900/40 rounded-xl">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Pending Review</span>
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400">{stats?.pendingReview || 0}</div>
          <div className="text-xs text-amber-300/80 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {stats?.needsReview || 0} flagged items
          </div>
        </div>

        <div className="p-5 bg-slate-900/90 border border-red-900/40 rounded-xl">
          <div className="flex items-center justify-between text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Rejected / Duplicate</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-extrabold text-red-400">{stats?.rejectedQuestions || 0}</div>
          <div className="text-xs text-red-300/80 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Rejection Rate: {h.rejectionRate}%
          </div>
        </div>
      </div>

      {/* Question Pool Health Panel */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-500" /> Question Pool Health & Quality Indicators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Missing Explanations</div>
            <div className="text-xl font-bold text-amber-300">{h.missingExplanationCount} questions</div>
            <p className="text-xs text-slate-400 mt-1">Questions requiring pedagogical explanations.</p>
          </div>
          <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Missing Topic Mappings</div>
            <div className="text-xl font-bold text-amber-300">{h.missingTopicCount} questions</div>
            <p className="text-xs text-slate-400 mt-1">Questions missing unit or subtopic alignment.</p>
          </div>
          <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">AI Transformation Acceptance</div>
            <div className="text-xl font-bold text-emerald-400">{h.aiTransformationAcceptanceRate}%</div>
            <p className="text-xs text-slate-400 mt-1">Acceptance rate for AI-generated practice questions.</p>
          </div>
        </div>
      </div>

      {/* AI Question Generation & Synthesis Studio */}
      <AdminAIGenerationControl />

      {/* GTU Content Operations & Ingestion Studio */}
      <AdminContentOperationsHub />
    </div>
  );
}
