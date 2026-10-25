import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  FileText,
  BarChart3,
  TrendingUp,
  Cpu,
  Flame,
  Archive,
  BookOpen,
  Filter,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  Calendar,
  Tag,
  Hash,
} from 'lucide-react';
import {
  adminQuestionIntelligenceClient,
  QuestionIntelligenceOverviewSnapshot,
  MatrixSubjectRow,
  QuestionInspectorDetail,
} from '../../api/adminQuestionIntelligenceClient';
import { toast } from 'sonner';

export default function AdminQuestionIntelligenceDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<QuestionIntelligenceOverviewSnapshot | null>(null);
  const [matrix, setMatrix] = useState<MatrixSubjectRow[]>([]);
  const [qualityData, setQualityData] = useState<any>(null);
  const [duplicateData, setDuplicateData] = useState<any>(null);
  const [curriculumData, setCurriculumData] = useState<any>(null);
  const [difficultyData, setDifficultyData] = useState<any>(null);
  const [patternData, setPatternData] = useState<any>(null);
  const [moderationData, setModerationData] = useState<any>(null);
  const [operationsData, setOperationsData] = useState<any>(null);

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchPagination, setSearchPagination] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Inspector Modal State
  const [inspectingQuestionId, setInspectingQuestionId] = useState<string | null>(null);
  const [inspectorDetail, setInspectorDetail] = useState<QuestionInspectorDetail | null>(null);
  const [inspectorLoading, setInspectorLoading] = useState(false);

  // Cell Detail Modal State
  const [activeCellModal, setActiveCellModal] = useState<any | null>(null);

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [ovRes, matRes] = await Promise.all([
        adminQuestionIntelligenceClient.getOverview().catch(() => null),
        adminQuestionIntelligenceClient.getMatrix().catch(() => null),
      ]);

      if (ovRes?.success) setOverview(ovRes.snapshot);
      if (matRes?.success) setMatrix(matRes.matrix);

      // Lazy load tab-specific data based on activeTab
      if (activeTab === 'quality') {
        const qRes = await adminQuestionIntelligenceClient.getQuality().catch(() => null);
        if (qRes?.success) setQualityData(qRes);
      } else if (activeTab === 'duplicates') {
        const dRes = await adminQuestionIntelligenceClient.getDuplicates().catch(() => null);
        if (dRes?.success) setDuplicateData(dRes);
      } else if (activeTab === 'curriculum') {
        const cRes = await adminQuestionIntelligenceClient.getCurriculum().catch(() => null);
        if (cRes?.success) setCurriculumData(cRes);
      } else if (activeTab === 'difficulty') {
        const diffRes = await adminQuestionIntelligenceClient.getDifficulty().catch(() => null);
        if (diffRes?.success) setDifficultyData(diffRes);
      } else if (activeTab === 'patterns') {
        const pRes = await adminQuestionIntelligenceClient.getPatterns().catch(() => null);
        if (pRes?.success) setPatternData(pRes);
      } else if (activeTab === 'moderation') {
        const mRes = await adminQuestionIntelligenceClient.getModerationQueue().catch(() => null);
        if (mRes?.success) setModerationData(mRes);
      } else if (activeTab === 'operations') {
        const oRes = await adminQuestionIntelligenceClient.getOperations().catch(() => null);
        if (oRes?.success) setOperationsData(oRes);
      }
    } catch {
      toast.error('Failed to load Question Intelligence data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  const executeSearch = async (page: number = 1) => {
    setSearchLoading(true);
    try {
      const res = await adminQuestionIntelligenceClient.searchQuestions({
        q: searchQuery || undefined,
        subjectCode: selectedSubjectCode || undefined,
        status: selectedStatus || undefined,
        page,
        pageSize: 15,
      });
      if (res.success) {
        setSearchResults(res.questions);
        setSearchPagination(res.pagination);
      }
    } catch {
      toast.error('Search query failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const openInspector = async (questionId: string) => {
    setInspectingQuestionId(questionId);
    setInspectorLoading(true);
    try {
      const res = await adminQuestionIntelligenceClient.getQuestionDetail(questionId);
      if (res.success) {
        setInspectorDetail(res.question);
      }
    } catch {
      toast.error('Failed to load question details');
      setInspectingQuestionId(null);
    } finally {
      setInspectorLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'verified':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">Verified</span>;
      case 'STAGED':
      case 'unverified':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-800">Staged</span>;
      case 'PARTIAL':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800">Partial</span>;
      case 'FAILED':
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-950/80 text-red-300 border border-red-800">Failed / Rejected</span>;
      case 'archived':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">Archived</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">Not Discovered</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 flex items-center gap-2.5">
              <Layers className="w-8 h-8 text-orange-500" />
              Question Intelligence Command Center
            </h1>
            <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Admin Console
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Real-time curriculum coverage, GTU recurrence patterns, automated quality metrics, and prioritized moderation.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-400' : ''}`} />
            Refresh Intelligence
          </button>
        </div>
      </div>

      {/* Real-Time Quality Alert Banner */}
      {overview && overview.warnings && overview.warnings.length > 0 && (
        <div className="space-y-2">
          {overview.warnings.map(w => (
            <div
              key={w.id}
              className={`p-3.5 rounded-xl border flex items-start sm:items-center justify-between gap-3 text-xs ${
                w.level === 'CRITICAL'
                  ? 'bg-red-950/40 border-red-800/80 text-red-200'
                  : (w.level === 'HIGH' ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' : 'bg-blue-950/40 border-blue-800/80 text-blue-200')
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <div>
                  <span className="font-bold uppercase tracking-wider mr-2">[{w.category}] {w.title}:</span>
                  <span className="opacity-90">{w.description}</span>
                </div>
              </div>
              {w.actionUrl && (
                <Link
                  to={w.actionUrl}
                  className="shrink-0 px-3 py-1 bg-slate-900/80 hover:bg-slate-900 border border-slate-700 text-white rounded-lg font-bold transition flex items-center gap-1"
                >
                  Review <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xs">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">Bank Health</div>
          <div className="text-2xl font-black text-slate-100 flex items-center gap-1.5">
            {overview?.overallHealthScore || 0}%
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
              overview?.healthStatus === 'HEALTHY' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
            }`}>
              {overview?.healthStatus || 'N/A'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Verified Base</div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xs">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">Coverage</div>
          <div className="text-2xl font-black text-emerald-400">{overview?.coverageScore || 0}%</div>
          <div className="text-[11px] text-slate-400 mt-1">{overview?.subjectsCovered || 0} Subjects</div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xs">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">Verified Items</div>
          <div className="text-2xl font-black text-slate-100">{overview?.verifiedQuestions || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">{overview?.originalPyqCount || 0} Original PYQs</div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xs">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">Staged / Backlog</div>
          <div className="text-2xl font-black text-amber-400">{overview?.stagedQuestions || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting Review</div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xs">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">Duplicate Clusters</div>
          <div className="text-2xl font-black text-slate-100">{overview?.duplicateClusterCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Recurring Concepts</div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xs">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">Failed Papers</div>
          <div className="text-2xl font-black text-red-400">{overview?.failedIngestionCount || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Requires Retry</div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'matrix', label: '🗺️ Subject × Session Heatmap' },
            { id: 'quality', label: '⭐ Quality Center' },
            { id: 'duplicates', label: '🔁 Duplicate Intelligence' },
            { id: 'curriculum', label: '📚 Curriculum Mapping' },
            { id: 'difficulty', label: '⚖️ Difficulty Analysis' },
            { id: 'patterns', label: '📈 Exam Patterns' },
            { id: 'moderation', label: '🛡️ Moderation Queue' },
            { id: 'operations', label: '⚙️ Ingestion Ops' },
            { id: 'search', label: '🔍 Bank Search' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === t.id
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
              <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Question Bank Health & Verification Health
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Total Cataloged Questions</span>
                  <span className="font-bold text-slate-100">{overview?.totalQuestions || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Verified (Student Eligible)</span>
                  <span className="font-bold text-emerald-400">{overview?.verifiedQuestions || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Staged (Awaiting Moderation)</span>
                  <span className="font-bold text-amber-400">{overview?.stagedQuestions || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Rejected / Malformed</span>
                  <span className="font-bold text-red-400">{overview?.rejectedQuestions || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400">Archived Duplicates</span>
                  <span className="font-bold text-slate-400">{overview?.archivedQuestions || 0}</span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
              <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-orange-400" />
                Provenance & Source Distribution
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Authentic GTU PYQs</span>
                  <span className="font-bold text-orange-400">{overview?.originalPyqCount || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">AI Practice Variations</span>
                  <span className="font-bold text-cyan-400">{overview?.aiGeneratedCount || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Distinct GTU Exam Sessions</span>
                  <span className="font-bold text-slate-100">{overview?.sessionsCovered || 0} Sessions</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">Average Quality Rating</span>
                  <span className="font-bold text-emerald-400">{overview?.qualityScore || 0}/100</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400">Unmapped Topic Gaps</span>
                  <span className="font-bold text-amber-400">{overview?.unmappedQuestionCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Heatmap Matrix */}
      {activeTab === 'matrix' && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-400" />
                10 First-Year Engineering Subjects × 5 GTU Exam Sessions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time coverage matrix indicating verified, staged, partial, and uningested exam papers.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-3 text-center">W2022</th>
                  <th className="py-3 px-3 text-center">S2023</th>
                  <th className="py-3 px-3 text-center">W2023</th>
                  <th className="py-3 px-3 text-center">S2024</th>
                  <th className="py-3 px-3 text-center">W2024</th>
                  <th className="py-3 px-4 text-right">Total Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {matrix.map(row => (
                  <tr key={row.subjectCode} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100">{row.subjectName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{row.subjectCode} • Sem {row.semester}</div>
                    </td>
                    {row.sessions.map(sess => (
                      <td key={sess.sessionCode} className="py-3 px-3 text-center">
                        <button
                          onClick={() => setActiveCellModal({ subject: row, session: sess })}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition border ${
                            sess.status === 'VERIFIED'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                              : (sess.status === 'PARTIAL'
                                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800 hover:bg-cyan-900'
                                : (sess.status === 'STAGED'
                                  ? 'bg-amber-950/80 text-amber-300 border-amber-800 hover:bg-amber-900'
                                  : (sess.status === 'FAILED'
                                    ? 'bg-red-950/80 text-red-300 border-red-800 hover:bg-red-900'
                                    : 'bg-slate-950/60 text-slate-500 border-slate-800 hover:bg-slate-800')))
                          }`}
                        >
                          {sess.status === 'VERIFIED' && `✓ ${sess.verifiedQuestions}`}
                          {sess.status === 'PARTIAL' && `⚡ ${sess.verifiedQuestions} / ${sess.totalQuestions}`}
                          {sess.status === 'STAGED' && `⏳ ${sess.stagedQuestions}`}
                          {sess.status === 'FAILED' && `✕ Failed`}
                          {sess.status === 'NOT_DISCOVERED' && '—'}
                        </button>
                      </td>
                    ))}
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-400">
                      {row.totalVerified} Questions
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Quality Center */}
      {activeTab === 'quality' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-slate-400 text-xs font-bold">High Quality (&gt;= 80)</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {qualityData?.summary?.distribution?.highQuality || 0}
              </div>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-slate-400 text-xs font-bold">Acceptable (60 - 79)</div>
              <div className="text-2xl font-black text-cyan-400 mt-1">
                {qualityData?.summary?.distribution?.acceptable || 0}
              </div>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-slate-400 text-xs font-bold">Needs Review (40 - 59)</div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {qualityData?.summary?.distribution?.needsReview || 0}
              </div>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-slate-400 text-xs font-bold">Poor / Flagged (&lt; 40)</div>
              <div className="text-2xl font-black text-red-400 mt-1">
                {qualityData?.summary?.distribution?.poor || 0}
              </div>
            </div>
          </div>

          {/* Flagged items list */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <h3 className="text-sm font-bold text-slate-100 mb-3">Items Flagged for Quality Issues</h3>
            <div className="space-y-3">
              {(qualityData?.flaggedItems || []).map((item: any) => (
                <div key={item.id} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 max-w-2xl">
                    <div className="font-semibold text-slate-200 line-clamp-1">{item.questionText}</div>
                    <div className="flex items-center gap-2 flex-wrap text-slate-400">
                      <span>{item.subjectName} ({item.subjectCode})</span>
                      <span>•</span>
                      <span>Score: <b className="text-amber-400">{item.overallScore}/100</b></span>
                      {item.flags.map((f: string) => (
                        <span key={f} className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px]">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => openInspector(item.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold shrink-0 cursor-pointer"
                  >
                    Inspect
                  </button>
                </div>
              ))}
              {(!qualityData?.flaggedItems || qualityData.flaggedItems.length === 0) && (
                <div className="text-xs text-slate-400 py-6 text-center">No critical quality issues flagged.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Duplicates & Recurrence */}
      {activeTab === 'duplicates' && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-slate-100">Recurring GTU Duplicate Question Clusters</h3>
          <p className="text-xs text-slate-400">
            Questions conceptually repeated across multiple GTU exam papers. Provenance is preserved intact without mutating source records.
          </p>

          <div className="space-y-3">
            {(duplicateData?.clusters || []).map((c: any) => (
              <div key={c.clusterId} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-extrabold text-orange-400 text-sm">
                    Repeated {c.repeatCount} Times across GTU papers
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-orange-950 text-orange-300 border border-orange-800 font-bold">
                    {c.repeatFrequencyBand}
                  </span>
                </div>
                <div className="font-medium text-slate-200">{c.canonicalQuestionText}</div>
                <div className="text-slate-400 flex items-center gap-3">
                  <span>First Seen: {c.firstSeen || 'N/A'}</span>
                  <span>•</span>
                  <span>Last Seen: {c.lastSeen || 'N/A'}</span>
                  <span>•</span>
                  <span>Subject: {c.subjectCode}</span>
                </div>

                {/* Member occurrences */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400">Observed Paper Occurrences:</div>
                  {c.members.map((m: any) => (
                    <div key={m.questionId} className="flex items-center justify-between text-[11px] text-slate-300 pl-2 border-l-2 border-orange-500/50">
                      <span>{m.session} • Paper: {m.sourcePaperId || 'GTU Official Paper'}</span>
                      <button
                        onClick={() => openInspector(m.questionId)}
                        className="text-orange-400 hover:underline cursor-pointer"
                      >
                        Inspect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {(!duplicateData?.clusters || duplicateData.clusters.length === 0) && (
              <div className="text-xs text-slate-400 py-6 text-center">No recurring duplicate clusters found.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Curriculum Mapping */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-2">Curriculum Mapping Review Queue</h3>
            <p className="text-xs text-slate-400 mb-4">
              Questions mapped by NLP requiring expert reviewer confirmation or lacking assigned unit topics.
            </p>

            <div className="space-y-3 text-xs">
              {(curriculumData?.reviewQueue || []).map((item: any) => (
                <div key={item.questionId} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-200">{item.questionText}</div>
                    <div className="text-slate-400 flex items-center gap-2 flex-wrap">
                      <span>{item.subjectName}</span>
                      <span>•</span>
                      <span>Assigned: <b className="text-cyan-400">Unit {item.unitNo}: {item.topicName}</b></span>
                      <span>•</span>
                      <span>Confidence: {(item.mappingConfidence * 100).toFixed(0)}%</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px]">
                        {item.mappingStatus}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => openInspector(item.questionId)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold shrink-0 cursor-pointer"
                  >
                    Review Mapping
                  </button>
                </div>
              ))}
              {(!curriculumData?.reviewQueue || curriculumData.reviewQueue.length === 0) && (
                <div className="text-xs text-slate-400 py-6 text-center">All questions are verified and mapped cleanly.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Moderation Queue */}
      {activeTab === 'moderation' && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-100">Prioritized Moderation Backlog</h3>
              <p className="text-xs text-slate-400">
                Sorted deterministically by Moderation Priority Score (High-impact GTU PYQs & exam topics ranked first).
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {(moderationData?.items || []).map((item: any) => (
              <div key={item.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                      item.priorityLevel === 'CRITICAL'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : (item.priorityLevel === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800' : 'bg-slate-800 text-slate-300')
                    }`}>
                      {item.priorityLevel} PRIORITY ({item.priorityScore}/100)
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{item.subjectName} ({item.subjectCode})</span>
                    {item.isOriginalPyq && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold">
                        ORIGINAL GTU PYQ
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-slate-100 text-sm">{item.questionText}</div>
                  <div className="text-slate-400 text-[11px]">
                    Reason: <span className="text-slate-300">{item.priorityReason}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openInspector(item.id)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold cursor-pointer transition shadow-sm"
                  >
                    Moderate & Inspect
                  </button>
                </div>
              </div>
            ))}
            {(!moderationData?.items || moderationData.items.length === 0) && (
              <div className="text-xs text-slate-400 py-6 text-center">No pending items in moderation queue.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Operations & Limits */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-3">Hard Backend Concurrency & Safety Constants</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="text-slate-400">Max Papers / Run</div>
                <div className="text-lg font-black text-slate-100 mt-1">20 Papers</div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="text-slate-400">Max Batch Size</div>
                <div className="text-lg font-black text-slate-100 mt-1">100 Questions</div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="text-slate-400">Max PDF Size</div>
                <div className="text-lg font-black text-slate-100 mt-1">15 MB</div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="text-slate-400">Max Retries</div>
                <div className="text-lg font-black text-slate-100 mt-1">3 Attempts</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Bank Search */}
      {activeTab === 'search' && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && executeSearch(1)}
                placeholder="Search question text, formulas, or keywords..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-orange-500"
              />
            </div>
            <button
              onClick={() => executeSearch(1)}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition cursor-pointer w-full sm:w-auto"
            >
              Search Bank
            </button>
          </div>

          {/* Search results list */}
          <div className="space-y-3 text-xs pt-2">
            {searchResults.map(q => (
              <div key={q.id} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-1 max-w-2xl">
                  <div className="font-semibold text-slate-100 line-clamp-2">{q.questionText}</div>
                  <div className="text-slate-400 flex items-center gap-2 flex-wrap">
                    <span>{q.subjectName} ({q.subjectCode})</span>
                    <span>•</span>
                    <span>{q.difficulty}</span>
                    <span>•</span>
                    <span>{q.marks}M</span>
                    <span>•</span>
                    {getStatusBadge(q.verificationStatus)}
                  </div>
                </div>
                <button
                  onClick={() => openInspector(q.id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold shrink-0 cursor-pointer"
                >
                  Inspect
                </button>
              </div>
            ))}
            {searchResults.length === 0 && !searchLoading && (
              <div className="text-xs text-slate-400 py-8 text-center">Use search bar above to query question bank.</div>
            )}
          </div>
        </div>
      )}

      {/* QUESTION INSPECTOR MODAL */}
      {inspectingQuestionId && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">Question Inspector</h3>
                <span className="px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-800 text-[10px] font-extrabold">
                  {inspectorDetail?.provenanceType || 'PROVENANCE'}
                </span>
              </div>
              <button
                onClick={() => setInspectingQuestionId(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {inspectorLoading ? (
              <div className="py-12 text-center text-slate-400">Loading full intelligence report...</div>
            ) : inspectorDetail ? (
              <div className="space-y-4 text-xs">
                {/* Question Text */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-slate-400 text-[11px] font-bold uppercase mb-1">Question Content</div>
                  <div className="text-sm font-medium text-slate-100 whitespace-pre-wrap">{inspectorDetail.questionText}</div>
                </div>

                {/* Options if present */}
                {inspectorDetail.options && inspectorDetail.options.length > 0 && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-slate-400 text-[11px] font-bold uppercase">Answer Choices</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {inspectorDetail.options.map((opt, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200">
                          <b className="text-orange-400 mr-2">[{opt.id}]</b> {opt.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-slate-400">Subject</div>
                    <div className="font-bold text-slate-100 mt-0.5">{inspectorDetail.subjectName}</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-slate-400">Unit / Topic</div>
                    <div className="font-bold text-slate-100 mt-0.5">Unit {inspectorDetail.unitNo}: {inspectorDetail.topicName}</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-slate-400">Marks / Type</div>
                    <div className="font-bold text-slate-100 mt-0.5">{inspectorDetail.marks}M • {inspectorDetail.questionType}</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-slate-400">Verification Status</div>
                    <div className="font-bold text-emerald-400 mt-0.5">{inspectorDetail.verificationStatus}</div>
                  </div>
                </div>

                {/* Provenance Details */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="text-slate-400 text-[11px] font-bold uppercase">Immutable Provenance</div>
                  <div className="text-slate-300">Exam Session: <b>{inspectorDetail.examSession || 'GTU'} {inspectorDetail.examYear || ''}</b></div>
                  <div className="text-slate-400 text-[11px]">Source Paper: {inspectorDetail.paperId || 'Official Upload'}</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* CELL DETAIL MODAL */}
      {activeCellModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-slate-100 text-sm">
                {activeCellModal.subject.subjectName} • {activeCellModal.session.sessionName}
              </h4>
              <button onClick={() => setActiveCellModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Status</span>
                <span>{getStatusBadge(activeCellModal.session.status)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Verified Questions</span>
                <span className="font-bold text-emerald-400">{activeCellModal.session.verifiedQuestions}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Staged Questions</span>
                <span className="font-bold text-amber-400">{activeCellModal.session.stagedQuestions}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Total Questions</span>
                <span className="font-bold text-slate-100">{activeCellModal.session.totalQuestions}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
