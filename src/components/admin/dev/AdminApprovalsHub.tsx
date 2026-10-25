// ============================================================
// SHIKSHA SAHAYAK OS: ADMIN APPROVALS HUB
// Contribution Moderation, Metadata Editor & Publish Pipeline
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../api/client';
import {
  CheckCircle2, XCircle, Eye, RefreshCw, Loader2, AlertTriangle,
  BookOpen, GraduationCap, Calendar, User, FileText, Search,
  ChevronRight, Clock, Download, Shield, Zap, CheckCheck,
  Filter, ArrowUpRight, FileQuestion, SlidersHorizontal
} from 'lucide-react';
import { Branch, SubjectOffering } from '../../../types';
import { toast } from 'sonner';

interface PendingMaterial {
  id: string;
  title: string;
  author_name: string | null;
  document_type: string;
  branch_id: string | null;
  semester_no: number | null;
  subject_id: string | null;
  subject_name: string | null;
  subject_code: string | null;
  file_url: string | null;
  created_at: string;
}

interface AdminApprovalsHubProps {
  onNavigateToTab?: (tab: string) => void;
}

export const AdminApprovalsHub: React.FC<AdminApprovalsHubProps> = ({ onNavigateToTab }) => {
  const [pendingItems, setPendingItems] = useState<PendingMaterial[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [catalogSubjects, setCatalogSubjects] = useState<SubjectOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PendingMaterial | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Edit states
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [semester, setSemester] = useState('');
  const [subjectMode, setSubjectMode] = useState<'catalog' | 'custom'>('catalog');
  const [subjectOfferingId, setSubjectOfferingId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const loadPending = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getPendingMaterials();
      setPendingItems(data || []);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load pending materials');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
    apiClient.getBranches().then(setBranches).catch(console.error);
  }, [loadPending]);

  useEffect(() => {
    if (!branchId || !semester) { setCatalogSubjects([]); return; }
    const branch = branches.find(b => b.id === branchId);
    if (!branch) return;
    let active = true;
    setIsCatalogLoading(true);
    apiClient.getCatalog(branch.slug, Number(semester), 2026)
      .then(data => { if (active) setCatalogSubjects(data); })
      .catch(() => { if (active) setCatalogSubjects([]); })
      .finally(() => { if (active) setIsCatalogLoading(false); });
    return () => { active = false; };
  }, [branchId, semester, branches]);

  const selectItemForEditing = (item: PendingMaterial) => {
    setSelectedItem(item);
    setTitle(item.title || '');
    setAuthorName(item.author_name || '');
    setBranchId(item.branch_id || '');
    setSemester(item.semester_no ? String(item.semester_no) : '');
    if (item.subject_id) {
      setSubjectOfferingId(item.subject_id);
      setSubjectName(item.subject_name || '');
      setSubjectCode(item.subject_code || '');
      setSubjectMode('catalog');
    } else {
      setSubjectOfferingId('');
      setSubjectName(item.subject_name || '');
      setSubjectCode(item.subject_code || '');
      setSubjectMode('custom');
    }
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    if (!title.trim()) { toast.error('File title is required.'); return; }
    if (!branchId) { toast.error('Please select a branch.'); return; }
    if (!semester) { toast.error('Please select a semester.'); return; }
    if (subjectMode === 'catalog' && !subjectOfferingId) {
      toast.error('Please select a catalog subject, or choose custom subject.');
      return;
    }
    if (subjectMode === 'custom' && !subjectName.trim()) {
      toast.error('Custom subject name is required.');
      return;
    }
    try {
      setIsApproving(true);
      await apiClient.approveMaterial(selectedItem.id, {
        title,
        author_name: authorName,
        branch_id: branchId,
        semester: Number(semester),
        subject_id: subjectOfferingId || undefined,
        subject_name: subjectMode === 'custom' ? subjectName : undefined,
        subject_code: subjectMode === 'custom' ? subjectCode : undefined,
      });
      toast.success('Material approved & published to the public catalog!');
      await loadPending();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve material');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    if (!window.confirm('Reject and permanently delete this contribution? This is irreversible.')) return;
    try {
      setIsRejecting(true);
      await apiClient.rejectMaterial(selectedItem.id);
      toast.success('Material rejected and removed.');
      await loadPending();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject material');
    } finally {
      setIsRejecting(false);
    }
  };

  const docTypes = ['all', ...Array.from(new Set(pendingItems.map(i => i.document_type)))];
  const filtered = pendingItems.filter(item => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.author_name || '').toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || item.document_type === filterType;
    return matchSearch && matchType;
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Submission Approvals</h1>
            {pendingItems.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                {pendingItems.length} pending
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm">Review, edit metadata, and publish or reject student contributions.</p>
        </div>
        <button
          onClick={loadPending}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending Review', value: pendingItems.length, icon: Clock, color: 'amber' },
          { label: 'Study Materials', value: pendingItems.filter(i => i.document_type === 'study-material').length, icon: BookOpen, color: 'blue' },
          { label: 'PYQs', value: pendingItems.filter(i => i.document_type === 'pyq').length, icon: FileQuestion, color: 'purple' },
          { label: 'Other Types', value: pendingItems.filter(i => !['study-material','pyq'].includes(i.document_type)).length, icon: FileText, color: 'slate' },
        ].map(stat => (
          <div key={stat.label} className={`bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${stat.color}-500/10 border border-${stat.color}-500/20 shrink-0`}>
              <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 2-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        {/* LEFT: Pending list */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Search + filter bar */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search submissions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-orange-500/50 outline-none"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {docTypes.slice(0, 4).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${filterType === type ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {type === 'study-material' ? 'Notes' : type}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-slate-800/60 max-h-[520px] overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-7 h-7 text-orange-400 animate-spin" />
                <span className="text-sm text-slate-400">Loading submissions...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 px-4 text-center">
                <CheckCheck className="w-10 h-10 text-emerald-500/60" />
                <p className="font-semibold text-white text-sm">All Clear!</p>
                <p className="text-xs text-slate-400">No pending submissions match your filter.</p>
              </div>
            ) : (
              filtered.map(item => (
                <button
                  key={item.id}
                  onClick={() => selectItemForEditing(item)}
                  className={`w-full text-left p-4 flex items-start gap-3 group transition ${selectedItem?.id === item.id ? 'bg-orange-500/8 border-l-2 border-orange-500' : 'hover:bg-slate-800/50'}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${selectedItem?.id === item.id ? 'bg-orange-500/20' : 'bg-slate-800'}`}>
                    <FileText className={`w-4 h-4 ${selectedItem?.id === item.id ? 'text-orange-400' : 'text-slate-400'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      {item.document_type === 'study-material' ? 'Study Material' : item.document_type}
                    </span>
                    <h4 className={`font-semibold text-sm truncate ${selectedItem?.id === item.id ? 'text-orange-300' : 'text-white group-hover:text-orange-300 transition'}`}>
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.author_name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 mt-1 transition-transform ${selectedItem?.id === item.id ? 'text-orange-400 translate-x-0.5' : 'text-slate-600 group-hover:translate-x-0.5'}`} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Editor / approval panel */}
        <div className="lg:col-span-3">
          {!selectedItem ? (
            <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-16 text-center flex flex-col items-center justify-center min-h-[480px]">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                <SlidersHorizontal className="w-7 h-7 text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Select a Submission</h3>
              <p className="text-sm text-slate-400 max-w-xs">Choose a pending contribution from the list to review, edit metadata, and approve or reject it.</p>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden animate-fade-in">
              {/* Panel Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-800/50 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div>
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Review & Edit</span>
                  <h3 className="text-lg font-bold text-white mt-0.5 truncate max-w-sm" title={selectedItem.title}>
                    {title || selectedItem.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {selectedItem.file_url && (
                    <a
                      href={selectedItem.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-xl transition border border-slate-600"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Form */}
              <div className="p-6 space-y-5">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> File Title / Name
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter clean document title"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-orange-500/60 outline-none text-sm font-medium"
                  />
                </div>

                {/* Author */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Author / Contributor
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    placeholder="e.g. Anonymous"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-orange-500/60 outline-none text-sm"
                  />
                </div>

                {/* Branch + Semester */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" /> Branch
                    </label>
                    <select
                      value={branchId}
                      onChange={e => { setBranchId(e.target.value); setSubjectOfferingId(''); setSubjectName(''); setSubjectCode(''); setSubjectMode('catalog'); }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-orange-500/60 outline-none text-sm appearance-none"
                    >
                      <option value="">Select Branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Semester
                    </label>
                    <select
                      value={semester}
                      onChange={e => { setSemester(e.target.value); setSubjectOfferingId(''); setSubjectName(''); setSubjectCode(''); setSubjectMode('catalog'); }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-orange-500/60 outline-none text-sm appearance-none"
                    >
                      <option value="">Select Semester</option>
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Subject
                  </label>
                  <select
                    value={subjectMode === 'custom' ? '__custom' : subjectOfferingId}
                    onChange={e => {
                      if (e.target.value === '__custom') { setSubjectMode('custom'); setSubjectOfferingId(''); setSubjectName(''); setSubjectCode(''); return; }
                      const s = catalogSubjects.find(x => x.id === e.target.value);
                      setSubjectMode('catalog');
                      setSubjectOfferingId(s?.id || '');
                      setSubjectName(s?.subjectName || '');
                      setSubjectCode(s?.subjectCode || '');
                    }}
                    disabled={!branchId || !semester || isCatalogLoading}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-orange-500/60 outline-none text-sm appearance-none disabled:opacity-50"
                  >
                    <option value="">{isCatalogLoading ? 'Loading subjects...' : 'Select Catalog Subject'}</option>
                    {catalogSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.subjectName}{s.subjectCode ? ` (${s.subjectCode})` : ''}</option>
                    ))}
                    <option value="__custom">✏️ Custom Subject</option>
                  </select>
                </div>

                {/* Custom Subject */}
                {subjectMode === 'custom' && (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3 animate-fade-in">
                    <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Custom Subject Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={subjectName}
                        onChange={e => setSubjectName(e.target.value)}
                        placeholder="Subject name (e.g. Maths-2)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-orange-500/60 outline-none text-sm"
                      />
                      <input
                        type="text"
                        value={subjectCode}
                        onChange={e => setSubjectCode(e.target.value)}
                        placeholder="Code (optional, e.g. MA201)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-orange-500/60 outline-none text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-800">
                  <button
                    onClick={handleReject}
                    disabled={isRejecting || isApproving}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-semibold text-sm transition disabled:opacity-50"
                  >
                    {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Reject & Delete
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isRejecting || isApproving}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Approve & Publish
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminApprovalsHub;
