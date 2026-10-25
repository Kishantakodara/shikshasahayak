import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Layers,
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  ExternalLink,
  Plus,
  ShieldCheck,
  Check,
  X,
  Edit2,
  GitMerge,
  Eye,
  Filter,
  Loader2,
  Calendar,
  Building,
  Info
} from 'lucide-react';
import {
  gtuPyqClient,
  CanonicalSubjectTreeItem,
  GtuSyncLog,
  GtuSyncStats,
  GtuSubjectMappingItem,
} from '../../api/gtuPyqClient';
import { SEMESTERS } from '../../constants';

export const AdminGtuCanonicalPyqHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'hierarchy' | 'sync' | 'mappings' | 'verifier'>('hierarchy');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<GtuSyncStats | null>(null);
  const [syncLogs, setSyncLogs] = useState<GtuSyncLog[]>([]);

  // Hierarchy Explorer State
  const [canonicalTree, setCanonicalTree] = useState<CanonicalSubjectTreeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  // Sync Form State
  const [syncBranch, setSyncBranch] = useState('');
  const [syncSemester, setSyncSemester] = useState('');
  const [syncStartYear, setSyncStartYear] = useState('2018');
  const [syncEndYear, setSyncEndYear] = useState('2026');
  const [syncCustomCodes, setSyncCustomCodes] = useState('');
  const [syncVerifyUrls, setSyncVerifyUrls] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);

  // Mappings Review State
  const [mappings, setMappings] = useState<GtuSubjectMappingItem[]>([]);
  const [mappingStatusFilter, setMappingStatusFilter] = useState<'all' | 'needs_review' | 'probable' | 'confirmed'>('needs_review');
  const [mappingSearch, setMappingSearch] = useState('');
  const [isUpdatingMapping, setIsUpdatingMapping] = useState<string | null>(null);
  const [reassignModal, setReassignModal] = useState<{ mapping: GtuSubjectMappingItem } | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState('');

  // Merge State
  const [mergeModal, setMergeModal] = useState<{ sourceCs: CanonicalSubjectTreeItem } | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState('');

  // New Subject Modal
  const [showNewSubjectModal, setShowNewSubjectModal] = useState(false);
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjBranch, setNewSubjBranch] = useState('computer-engineering');
  const [newSubjSemester, setNewSubjSemester] = useState(3);
  const [newSubjAliases, setNewSubjAliases] = useState('');

  // Verifier State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyBatchSize, setVerifyBatchSize] = useState<number>(50);
  const [verifyQueueTarget, setVerifyQueueTarget] = useState<'unverified' | 'broken' | 'all'>('unverified');
  const [verifyResultMsg, setVerifyResultMsg] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [logsData, treeData, mappingsData] = await Promise.all([
        gtuPyqClient.getSyncLogs().catch(() => ({ logs: [], stats: null })),
        gtuPyqClient.getCanonicalTree({
          branch: filterBranch,
          semester: filterSemester,
          query: searchQuery,
        }).catch(() => ({ canonicalSubjects: [], total: 0 })),
        gtuPyqClient.getMappings({
          status: mappingStatusFilter,
          search: mappingSearch,
        }).catch(() => ({ mappings: [], total: 0 })),
      ]);

      if (logsData.stats) setStats(logsData.stats);
      setSyncLogs(logsData.logs || []);
      setCanonicalTree(treeData.canonicalSubjects || []);
      setMappings(mappingsData.mappings || []);
    } catch (err) {
      console.error('Failed to load GTU PYQ hub data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterBranch, filterSemester, searchQuery, mappingStatusFilter, mappingSearch]);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncResultMsg(null);
    try {
      const codes = syncCustomCodes
        .split(/[\n, ]+/)
        .map((c) => c.trim())
        .filter(Boolean);

      const res = await gtuPyqClient.triggerSync({
        branchSlug: syncBranch || undefined,
        semester: syncSemester ? Number(syncSemester) : undefined,
        subjectCodes: codes.length > 0 ? codes : undefined,
        startYear: Number(syncStartYear) || 2018,
        endYear: Number(syncEndYear) || 2026,
        verifyUrls: syncVerifyUrls,
      });

      setSyncResultMsg(res.message || 'Sync completed successfully!');
      loadData();
    } catch (err: any) {
      setSyncResultMsg(`Error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApproveMapping = async (mappingId: string) => {
    setIsUpdatingMapping(mappingId);
    try {
      await gtuPyqClient.updateMapping({ mappingId, action: 'approve' });
      loadData();
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setIsUpdatingMapping(null);
    }
  };

  const handleReassignMapping = async () => {
    if (!reassignModal || !reassignTargetId) return;
    setIsUpdatingMapping(reassignModal.mapping.id);
    try {
      await gtuPyqClient.updateMapping({
        mappingId: reassignModal.mapping.id,
        action: 'reassign',
        targetCanonicalSubjectId: reassignTargetId,
      });
      setReassignModal(null);
      setReassignTargetId('');
      loadData();
    } catch (err: any) {
      alert(`Reassign failed: ${err.message}`);
    } finally {
      setIsUpdatingMapping(null);
    }
  };

  const handleMergeCanonical = async () => {
    if (!mergeModal || !mergeTargetId) return;
    try {
      await gtuPyqClient.mergeCanonicalSubjects(mergeModal.sourceCs.id, mergeTargetId);
      setMergeModal(null);
      setMergeTargetId('');
      loadData();
    } catch (err: any) {
      alert(`Merge failed: ${err.message}`);
    }
  };

  const handleCreateNewCanonical = async () => {
    if (!newSubjName.trim()) return;
    try {
      const aliasList = newSubjAliases
        .split(/[\n,]+/)
        .map((a) => a.trim())
        .filter(Boolean);

      await gtuPyqClient.createCanonicalSubject({
        canonicalName: newSubjName.trim(),
        branchId: newSubjBranch,
        semester: Number(newSubjSemester),
        aliases: aliasList,
      });
      setShowNewSubjectModal(false);
      setNewSubjName('');
      setNewSubjAliases('');
      loadData();
    } catch (err: any) {
      alert(`Create failed: ${err.message}`);
    }
  };

  const handleRunVerification = async () => {
    setIsVerifying(true);
    setVerifyResultMsg(null);
    try {
      const res = await gtuPyqClient.verifyUrls({
        limit: verifyBatchSize,
        status: verifyQueueTarget,
      });
      setVerifyResultMsg(res.message);
      loadData();
    } catch (err: any) {
      setVerifyResultMsg(`Verification error: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 text-left p-2 sm:p-4 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-950 text-white rounded-2xl p-5 sm:p-6 border border-navy-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-brand-orange text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Canonical Ingestion Engine
            </span>
            <span className="text-xs text-slate-300 font-mono">GTU Official PDF Discovery</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            GTU PYQ Discovery & Canonical Subject Hierarchy Manager
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Hard-enforced hierarchy: Canonical Subject → GTU Subject Codes / Syllabus Schemes → Exam Year/Session → Direct GTU PDF URLs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => loadData()}
            className="p-2.5 bg-navy-800 hover:bg-navy-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-navy-700"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowNewSubjectModal(true)}
            className="px-4 py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Canonical Subject</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-3.5 shadow-xs">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Canonical Subjects</p>
            <h4 className="text-xl font-bold text-navy-900 dark:text-white mt-1">{stats.totalCanonicalSubjects}</h4>
          </div>
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-3.5 shadow-xs">
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">GTU Subject Codes</p>
            <h4 className="text-xl font-bold text-navy-900 dark:text-white mt-1">{stats.totalSubjectCodes}</h4>
          </div>
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-3.5 shadow-xs">
            <p className="text-[11px] font-bold text-sky-600 dark:text-sky-400">Candidate URLs</p>
            <h4 className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-1">{stats.candidateUrls ?? stats.totalPapers}</h4>
          </div>
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-3.5 shadow-xs">
            <p className="text-[11px] font-bold text-brand-orange">Indexed Papers</p>
            <h4 className="text-xl font-bold text-brand-orange mt-1">{stats.indexedPapers ?? stats.totalPapers}</h4>
          </div>
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-3.5 shadow-xs">
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Live Verified URLs</p>
            <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.verifiedUrls ?? stats.verifiedPapers}</h4>
          </div>
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-3.5 shadow-xs">
            <p className="text-[11px] font-bold text-rose-500">Broken URLs (404)</p>
            <h4 className="text-xl font-bold text-rose-500 mt-1">{stats.brokenUrls ?? stats.brokenPapers}</h4>
          </div>
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-xl p-3.5 shadow-xs">
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Needs Review</p>
            <h4 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pendingReviewCount}</h4>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-navy-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('hierarchy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'hierarchy'
              ? 'bg-navy-900 dark:bg-brand-orange text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Canonical Hierarchy Explorer</span>
        </button>

        <button
          onClick={() => setActiveSubTab('mappings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'mappings'
              ? 'bg-navy-900 dark:bg-brand-orange text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          <span>Subject Code Mappings</span>
          {stats && stats.pendingReviewCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {stats.pendingReviewCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('sync')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'sync'
              ? 'bg-navy-900 dark:bg-brand-orange text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Run GTU Paper Discovery</span>
        </button>

        <button
          onClick={() => setActiveSubTab('verifier')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSubTab === 'verifier'
              ? 'bg-navy-900 dark:bg-brand-orange text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>URL Health & Verification</span>
        </button>
      </div>

      {/* SUB-TAB 1: CANONICAL HIERARCHY EXPLORER */}
      {activeSubTab === 'hierarchy' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search canonical subject or GTU code (e.g. Power System, 3140914, Calculus)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-brand-orange"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs text-navy-900 dark:text-white"
              >
                <option value="">All Branches</option>
                <option value="computer-engineering">Computer Engineering</option>
                <option value="information-technology">Information Technology</option>
                <option value="electrical-engineering">Electrical Engineering</option>
                <option value="mechanical-engineering">Mechanical Engineering</option>
                <option value="civil-engineering">Civil Engineering</option>
                <option value="first-year">1st Year Common</option>
              </select>

              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs text-navy-900 dark:text-white"
              >
                <option value="">All Semesters</option>
                <option value="0">1st Year Common</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tree View Cards */}
          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 text-brand-orange animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading canonical subject tree...</p>
            </div>
          ) : canonicalTree.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800 p-6">
              <Layers className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-navy-900 dark:text-white">No canonical subjects found</h4>
              <p className="text-xs text-slate-500 mt-1">Run discovery sync or create a canonical subject above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {canonicalTree.map((cs) => (
                <div
                  key={cs.id}
                  className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-5 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-navy-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="bg-brand-orange/10 text-brand-orange text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                          {cs.branchShortName || cs.branchName} • Sem {cs.semester === 0 ? 'Common' : cs.semester}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {cs.totalSubjectCodes} GTU Codes • {cs.totalPapers} Papers
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-navy-900 dark:text-white">
                        {cs.canonicalName}
                      </h3>
                      {cs.aliases && cs.aliases.length > 0 && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Aliases: {cs.aliases.join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setMergeModal({ sourceCs: cs })}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Merge into another subject"
                      >
                        <GitMerge className="h-3.5 w-3.5 text-purple-500" />
                        <span>Merge</span>
                      </button>
                    </div>
                  </div>

                  {/* Child GTU Subject Codes */}
                  <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-brand-orange/30">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Mapped GTU Subject Codes & Syllabus Versions:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {cs.subjectCodes.map((codeGroup) => (
                        <div
                          key={codeGroup.subjectCode}
                          className="bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-navy-800 rounded-xl p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold font-mono text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded">
                              {codeGroup.subjectCode}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {codeGroup.syllabusVersion || 'GTU Scheme'}
                            </span>
                          </div>

                          <h5 className="text-xs font-bold text-navy-900 dark:text-white truncate">
                            {codeGroup.officialSubjectName}
                          </h5>

                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 dark:border-navy-800 text-slate-500 dark:text-slate-400">
                            <span>{codeGroup.totalPapers} question papers</span>
                            <span className="text-emerald-600 font-bold">GTU Verified</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: SUBJECT CODE MAPPINGS REVIEW */}
      {activeSubTab === 'mappings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200 dark:border-navy-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMappingStatusFilter('needs_review')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  mappingStatusFilter === 'needs_review'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Needs Review
              </button>
              <button
                onClick={() => setMappingStatusFilter('confirmed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  mappingStatusFilter === 'confirmed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Confirmed
              </button>
              <button
                onClick={() => setMappingStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  mappingStatusFilter === 'all'
                    ? 'bg-navy-900 dark:bg-brand-orange text-white'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                All
              </button>
            </div>

            <div className="relative flex-1 max-w-md w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search mapped code or subject..."
                value={mappingSearch}
                onChange={(e) => setMappingSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-navy-950/80 text-slate-500 border-b border-slate-200 dark:border-navy-800 font-bold">
                <tr>
                  <th className="p-3.5">GTU Code</th>
                  <th className="p-3.5">Official GTU Name</th>
                  <th className="p-3.5">Mapped Canonical Subject</th>
                  <th className="p-3.5">Branch / Sem</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {mappings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      No subject mappings found matching filter.
                    </td>
                  </tr>
                ) : (
                  mappings.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-850/50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-brand-orange">{m.subject_code}</td>
                      <td className="p-3.5 font-bold text-navy-900 dark:text-white max-w-xs truncate">
                        {m.official_subject_name}
                      </td>
                      <td className="p-3.5 font-medium text-slate-700 dark:text-slate-200">
                        {m.canonical_name}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {m.branch_slug} • Sem {m.semester}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            m.mapping_status === 'confirmed'
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              : m.mapping_status === 'needs_review'
                              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-navy-800 text-slate-600'
                          }`}
                        >
                          {m.mapping_status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {m.mapping_status !== 'confirmed' && (
                          <button
                            onClick={() => handleApproveMapping(m.id)}
                            disabled={isUpdatingMapping === m.id}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => setReassignModal({ mapping: m })}
                          className="px-2.5 py-1 bg-navy-900 dark:bg-navy-800 hover:bg-brand-orange text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Reassign
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SYNC ORCHESTRATOR */}
      {activeSubTab === 'sync' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-orange" />
              Configure GTU Question Paper Discovery Sync
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Scans official GTU repository format (<code>https://www.gtu.ac.in/api/v1/question-papers/archive/file/&#123;Session&#125;/BE/&#123;Code&#125;.pdf</code>), maps discovered papers to Canonical Subjects, and records URLs.
            </p>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Branch</label>
                  <select
                    value={syncBranch}
                    onChange={(e) => setSyncBranch(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs"
                  >
                    <option value="">All Branches</option>
                    <option value="electrical-engineering">Electrical Engineering</option>
                    <option value="computer-engineering">Computer Engineering</option>
                    <option value="information-technology">Information Technology</option>
                    <option value="mechanical-engineering">Mechanical Engineering</option>
                    <option value="civil-engineering">Civil Engineering</option>
                    <option value="first-year">1st Year Common</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Semester</label>
                  <select
                    value={syncSemester}
                    onChange={(e) => setSyncSemester(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs"
                  >
                    <option value="">All Semesters</option>
                    <option value="0">1st Year Common</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Start Year</label>
                  <input
                    type="number"
                    value={syncStartYear}
                    onChange={(e) => setSyncStartYear(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">End Year</label>
                  <input
                    type="number"
                    value={syncEndYear}
                    onChange={(e) => setSyncEndYear(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Specific Subject Codes (Optional, comma-separated)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 3140914, 3130905, 3170910, BE04009041"
                  value={syncCustomCodes}
                  onChange={(e) => setSyncCustomCodes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="verifyUrlsCheck"
                  checked={syncVerifyUrls}
                  onChange={(e) => setSyncVerifyUrls(e.target.checked)}
                  className="rounded text-brand-orange focus:ring-brand-orange"
                />
                <label htmlFor="verifyUrlsCheck" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  Perform live HTTP verification check during discovery
                </label>
              </div>

              {syncResultMsg && (
                <div className="p-3 bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200">
                  {syncResultMsg}
                </div>
              )}

              <button
                onClick={handleTriggerSync}
                disabled={isSyncing}
                className="w-full py-3 bg-brand-orange hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Syncing with GTU Official Repositories...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Start GTU Discovery & Sync</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sync History Logs */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-orange" />
              Recent Sync Activity Logs
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {syncLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No sync logs recorded yet.</p>
              ) : (
                syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                        {log.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                          log.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Started: {new Date(log.sync_started_at).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] font-mono pt-1 text-slate-600 dark:text-slate-400">
                      <span>Found: {log.links_found}</span>
                      <span className="text-emerald-600 font-bold">New: +{log.links_new}</span>
                      <span>Verified: {log.links_verified}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: URL HEALTH & VERIFICATION */}
      {activeSubTab === 'verifier' && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-navy-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                GTU PDF Link Health & Progressive Verification Queue
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Progressively verifies GTU PDF availability via lightweight HTTP HEAD/Range requests without saving binaries.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Queue Filter</label>
                <select
                  value={verifyQueueTarget}
                  onChange={(e: any) => setVerifyQueueTarget(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs font-medium"
                >
                  <option value="unverified">Unverified Queue (Pending)</option>
                  <option value="broken">Retry Broken URLs (404s)</option>
                  <option value="all">Re-check All Records</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Batch Size</label>
                <select
                  value={verifyBatchSize}
                  onChange={(e) => setVerifyBatchSize(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs font-medium"
                >
                  <option value={25}>25 URLs</option>
                  <option value={50}>50 URLs</option>
                  <option value={100}>100 URLs</option>
                </select>
              </div>

              <div className="pt-4 sm:pt-0 self-end">
                <button
                  onClick={handleRunVerification}
                  disabled={isVerifying}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0 disabled:opacity-60 shadow-xs"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying Batch...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Verify Next Batch ({verifyBatchSize})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {verifyResultMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-mono">
              {verifyResultMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-navy-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-navy-800">
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Verified Available to Students</p>
              <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats?.verifiedUrls ?? stats?.verifiedPapers ?? 0}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Visible as active clickable PYQs</p>
            </div>

            <div className="bg-slate-50 dark:bg-navy-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-navy-800">
              <p className="text-[11px] font-bold text-sky-600 dark:text-sky-400">Unverified Queue Remaining</p>
              <h4 className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-1">{stats?.unverifiedUrls ?? stats?.unverifiedPapers ?? 0}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Hidden from student available results</p>
            </div>

            <div className="bg-slate-50 dark:bg-navy-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-navy-800">
              <p className="text-[11px] font-bold text-rose-500">Confirmed Broken (404s)</p>
              <h4 className="text-xl font-bold text-rose-500 mt-1">{stats?.brokenUrls ?? stats?.brokenPapers ?? 0}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Flagged as unavailable on GTU</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-navy-950/50 rounded-xl border border-slate-200 dark:border-navy-800 text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
              <Info className="h-4 w-4 text-brand-orange" />
              <span>Progressive Resumable Verification Policy:</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Cloudflare Worker-safe execution: Each batch processes requests in concurrency pools with automatic timeouts. Verified links become instantly active for students. Transient network timeouts remain unverified for safe retry without marking valid papers as broken.
            </p>
          </div>
        </div>
      )}

      {/* Modal: Reassign Mapping */}
      {reassignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-navy-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Reassign Subject Code: <span className="text-brand-orange font-mono">{reassignModal.mapping.subject_code}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Select the Canonical Subject that code <strong>{reassignModal.mapping.subject_code}</strong> ({reassignModal.mapping.official_subject_name}) conceptually belongs to.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Canonical Subject</label>
              <select
                value={reassignTargetId}
                onChange={(e) => setReassignTargetId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs"
              >
                <option value="">Select Canonical Subject...</option>
                {canonicalTree.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.canonicalName} ({cs.branchShortName || cs.branchName} Sem {cs.semester})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setReassignModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleReassignMapping}
                disabled={!reassignTargetId}
                className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Reassign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Merge Canonical Subjects */}
      {mergeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-navy-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <GitMerge className="h-4 w-4 text-purple-500" />
              Merge Canonical Subject
            </h3>
            <p className="text-xs text-slate-500">
              Merge <strong>{mergeModal.sourceCs.canonicalName}</strong> into another canonical subject. All mapped GTU subject codes and question papers will be transferred cleanly.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Canonical Subject to Merge Into</label>
              <select
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs"
              >
                <option value="">Select Target Subject...</option>
                {canonicalTree
                  .filter((cs) => cs.id !== mergeModal.sourceCs.id)
                  .map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.canonicalName} (Sem {cs.semester})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setMergeModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleMergeCanonical}
                disabled={!mergeTargetId}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Merge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Canonical Subject */}
      {showNewSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-navy-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Create New Canonical Subject
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Canonical Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Power System - I, Database Management Systems"
                  value={newSubjName}
                  onChange={(e) => setNewSubjName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Branch</label>
                  <select
                    value={newSubjBranch}
                    onChange={(e) => setNewSubjBranch(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs"
                  >
                    <option value="electrical-engineering">Electrical Engineering</option>
                    <option value="computer-engineering">Computer Engineering</option>
                    <option value="information-technology">Information Technology</option>
                    <option value="mechanical-engineering">Mechanical Engineering</option>
                    <option value="civil-engineering">Civil Engineering</option>
                    <option value="first-year">1st Year Common</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Semester</label>
                  <select
                    value={newSubjSemester}
                    onChange={(e) => setNewSubjSemester(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs"
                  >
                    <option value="0">1st Year Common</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Aliases (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Power System 1, Electrical Power System - I"
                  value={newSubjAliases}
                  onChange={(e) => setNewSubjAliases(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewSubjectModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewCanonical}
                disabled={!newSubjName.trim()}
                className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Create Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
