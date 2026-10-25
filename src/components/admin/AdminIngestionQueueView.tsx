import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  CheckSquare,
  Square,
  CheckCircle2,
  XCircle,
  Archive,
  Eye,
  Tag,
  AlertTriangle,
  Award,
  Sparkles,
} from 'lucide-react';
import { fetchWithAuth } from '../../api/client';
import { AdminQuestionReviewWorkspace } from './AdminQuestionReviewWorkspace';

interface Props {
  onSelectQuestion?: (questionId: string) => void;
}

export function AdminIngestionQueueView({ onSelectQuestion }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('PENDING_REVIEW');
  const [sourceFilter, setSourceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

  useEffect(() => {
    fetchQueue();
  }, [page, statusFilter, sourceFilter, searchQuery]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '15',
      });
      if (statusFilter) params.append('status', statusFilter);
      if (sourceFilter) params.append('source', sourceFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetchWithAuth(`/api/admin/questions/queue?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setTotal(data.total || 0);
      }
    } catch {
      // Network catch
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to execute '${action}' on ${selectedIds.length} question(s)?`)) return;

    try {
      const res = await fetchWithAuth('/api/admin/questions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, questionIds: selectedIds }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedIds([]);
        fetchQueue();
      }
    } catch {
      alert('Bulk action failed');
    }
  };

  if (activeReviewId) {
    return (
      <AdminQuestionReviewWorkspace
        questionId={activeReviewId}
        onBack={() => {
          setActiveReviewId(null);
          fetchQueue();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Status Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatusFilter('PENDING_REVIEW')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            statusFilter === 'PENDING_REVIEW'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Pending Review
        </button>
        <button
          onClick={() => setStatusFilter('verified')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            statusFilter === 'verified'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Verified & Published
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            statusFilter === 'rejected'
              ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-red-400" />
          Rejected
        </button>
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            statusFilter === ''
              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-orange-400" />
          All Questions ({total})
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search questions, subject, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-medium text-slate-200"
          >
            <option value="">All Sources</option>
            <option value="GTU">GTU</option>
            <option value="GATE">GATE</option>
            <option value="AI_PRACTICE">AI Practice</option>
          </select>
        </div>
      </div>

      {/* Bulk Toolbar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-orange-950/40 border border-orange-800/50 rounded-xl flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-orange-300">{selectedIds.length} question(s) selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('BULK_APPROVE')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve Selected
            </button>
            <button
              onClick={() => handleBulkAction('BULK_REJECT')}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-medium flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject Selected
            </button>
          </div>
        </div>
      )}

      {/* Ingestion Data Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading queue items...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm space-y-2">
            <div className="font-semibold text-slate-300">No questions found matching this filter.</div>
            <div className="text-xs text-slate-500">
              {statusFilter === 'PENDING_REVIEW'
                ? "There are currently 0 questions pending review. Switch to 'Verified & Published' to view active questions in the bank."
                : "Try clearing your search query or selecting 'All Sources'."}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-950/80 text-xs font-semibold text-slate-400 flex items-center gap-3">
              <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-200">
                {selectedIds.length === items.length ? <CheckSquare className="w-4 h-4 text-orange-500" /> : <Square className="w-4 h-4" />}
              </button>
              <div className="w-24">ID</div>
              <div className="flex-1">Question & Provenance</div>
              <div className="w-24 text-center">Type</div>
              <div className="w-28 text-center">Status</div>
              <div className="w-20 text-right">Action</div>
            </div>

            {/* Rows */}
            {items.map((item) => (
              <div key={item.id} className="px-4 py-3.5 hover:bg-slate-800/40 flex items-center gap-3 text-sm transition">
                <button onClick={() => toggleSelectOne(item.id)} className="text-slate-400 hover:text-slate-200">
                  {selectedIds.includes(item.id) ? <CheckSquare className="w-4 h-4 text-orange-500" /> : <Square className="w-4 h-4" />}
                </button>

                <div className="w-24 text-xs font-mono text-slate-400 truncate">{item.id}</div>

                <div className="flex-1 min-w-0 pr-4 space-y-1">
                  <div className="text-slate-200 font-medium line-clamp-1">{item.question_text}</div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold text-[10px]">
                      {item.source_type} {item.exam_year ? item.exam_year : ''}
                    </span>
                    <span className="text-slate-400">{item.subject_name}</span>
                    {item.is_original_pyq === 1 && (
                      <span className="px-1.5 py-0.5 bg-amber-950/60 border border-amber-800/50 text-amber-300 rounded text-[10px] flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-400" /> Original PYQ
                      </span>
                    )}
                    {item.is_ai_generated === 1 && (
                      <span className="px-1.5 py-0.5 bg-purple-950/60 border border-purple-800/50 text-purple-300 rounded text-[10px] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-400" /> AI Generated
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-24 text-center">
                  <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-semibold">
                    {item.question_type}
                  </span>
                </div>

                <div className="w-28 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    item.verification_status === 'verified'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                      : item.verification_status === 'rejected'
                      ? 'bg-red-950 text-red-300 border border-red-800/50'
                      : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                  }`}>
                    {item.verification_status}
                  </span>
                </div>

                <div className="w-20 text-right">
                  <button
                    onClick={() => {
                      setActiveReviewId(item.id);
                      onSelectQuestion?.(item.id);
                    }}
                    className="p-1.5 bg-orange-600/20 hover:bg-orange-600 text-orange-400 hover:text-white rounded transition cursor-pointer"
                    title="Review & Edit Question"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
