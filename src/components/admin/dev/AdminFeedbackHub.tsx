// ============================================================
// SHIKSHA SAHAYAK OS: ADMIN FEEDBACK HUB
// User Voice, Feature Requests & Satisfaction Tracking
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../api/client';
import {
  MessageSquare, Star, Trash2, Loader2, Eye, X, RefreshCw,
  Search, CheckCircle2, Clock, ThumbsUp, Zap, BarChart2,
  TrendingUp, Send, Lightbulb, Bug, Monitor, FileText, Users,
  MessageCircle, ArrowRight, Filter, ChevronDown, Mail
} from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackItem {
  id: string;
  user_id: string | null;
  user_email: string;
  type: 'general' | 'feature_request' | 'ux' | 'bug' | 'content' | 'other';
  rating: number | null;
  message: string;
  page_url: string | null;
  status: 'new' | 'reviewed' | 'planned' | 'implemented' | 'declined';
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
}

const TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  general:         { label: 'General',         icon: MessageCircle, color: 'slate' },
  feature_request: { label: 'Feature Request', icon: Lightbulb,     color: 'amber' },
  ux:              { label: 'UX/Design',        icon: Monitor,       color: 'blue' },
  bug:             { label: 'Bug Report',       icon: Bug,           color: 'red' },
  content:         { label: 'Content',          icon: FileText,      color: 'purple' },
  other:           { label: 'Other',            icon: MessageSquare, color: 'slate' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  new:         { label: 'New',         color: 'amber' },
  reviewed:    { label: 'Reviewed',    color: 'blue' },
  planned:     { label: 'Planned',     color: 'purple' },
  implemented: { label: 'Implemented', color: 'emerald' },
  declined:    { label: 'Declined',    color: 'slate' },
};

function TypeBadge({ type }: { type: string }) {
  const meta = TYPE_META[type] || TYPE_META['other'];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
      ${type === 'feature_request' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : ''}
      ${type === 'ux'              ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' : ''}
      ${type === 'bug'             ? 'bg-red-500/15 text-red-300 border border-red-500/30' : ''}
      ${type === 'content'         ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : ''}
      ${['general','other'].includes(type) ? 'bg-slate-500/15 text-slate-400 border border-slate-700' : ''}
    `}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-slate-600">—</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
      ))}
    </div>
  );
}

interface AdminFeedbackHubProps {
  onNavigateToTab?: (tab: string) => void;
}

export const AdminFeedbackHub: React.FC<AdminFeedbackHubProps> = () => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSendingReply, setIsSendingReply] = useState(false);

  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getFeedback();
      setFeedback(data as FeedbackItem[]);
    } catch (error: any) {
      // No feedback table yet — show empty state gracefully
      console.warn('Feedback API not available yet:', error.message);
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      setUpdatingId(id);
      await apiClient.updateFeedback(id, { status });
      toast.success(`Feedback marked as "${status}"`);
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: status as any, updated_at: new Date().toISOString() } : f));
      if (selectedItem?.id === id) setSelectedItem(prev => prev ? { ...prev, status: status as any } : null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendReply = async () => {
    if (!selectedItem || !replyText.trim()) return;
    try {
      setIsSendingReply(true);
      await apiClient.updateFeedback(selectedItem.id, { admin_reply: replyText.trim(), status: 'reviewed' });
      toast.success('Reply saved');
      setFeedback(prev => prev.map(f => f.id === selectedItem.id ? { ...f, admin_reply: replyText.trim(), status: 'reviewed' } : f));
      setSelectedItem(prev => prev ? { ...prev, admin_reply: replyText.trim(), status: 'reviewed' } : null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this feedback entry permanently?')) return;
    try {
      setDeletingId(id);
      await apiClient.deleteFeedback(id);
      toast.success('Feedback deleted');
      setFeedback(prev => prev.filter(f => f.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete feedback');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = feedback.filter(f => {
    const matchType = filterType === 'all' || f.type === filterType;
    const matchStatus = filterStatus === 'all' || f.status === filterStatus;
    const matchSearch = !search || f.user_email.toLowerCase().includes(search.toLowerCase()) || f.message.toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  // Computed stats
  const avgRating = (() => {
    const rated = feedback.filter(f => f.rating !== null);
    if (!rated.length) return 0;
    return (rated.reduce((s, f) => s + (f.rating || 0), 0) / rated.length).toFixed(1);
  })();

  const counts = {
    total: feedback.length,
    new: feedback.filter(f => f.status === 'new').length,
    featureRequests: feedback.filter(f => f.type === 'feature_request').length,
    implemented: feedback.filter(f => f.status === 'implemented').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">User Feedback</h1>
            {counts.new > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                {counts.new} new
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm">Review user suggestions, feature requests, and satisfaction ratings.</p>
        </div>
        <button
          onClick={fetchFeedback}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Feedback', value: counts.total, icon: MessageSquare, gradient: 'from-slate-800 to-slate-900', text: 'text-white' },
          { label: 'New / Unread',   value: counts.new, icon: Clock, gradient: 'from-amber-900/30 to-slate-900', text: 'text-amber-300' },
          { label: 'Feature Requests', value: counts.featureRequests, icon: Lightbulb, gradient: 'from-amber-900/20 to-slate-900', text: 'text-amber-300' },
          { label: 'Avg. Rating', value: avgRating || '—', icon: Star, gradient: 'from-emerald-900/20 to-slate-900', text: 'text-emerald-300' },
        ].map(k => (
          <div key={k.label} className={`relative bg-gradient-to-br ${k.gradient} border border-slate-800 rounded-2xl p-4 overflow-hidden`}>
            <div className="absolute top-3 right-3 opacity-10">
              <k.icon className="w-12 h-12 text-white" />
            </div>
            <p className={`text-2xl font-bold ${k.text}`}>{k.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by email or message..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:border-purple-500/50 outline-none"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 outline-none focus:border-purple-500/50"
          >
            <option value="all">All Types</option>
            {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 outline-none focus:border-purple-500/50"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading feedback...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-16 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-slate-500" />
          </div>
          <div>
            <p className="font-bold text-white">No feedback yet</p>
            <p className="text-sm text-slate-400 mt-1">
              {feedback.length === 0
                ? 'Once users submit feedback through the platform, it will appear here.'
                : 'No items match your current filters.'}
            </p>
          </div>
          {feedback.length === 0 && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-left max-w-sm">
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Setup Required</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Run migration <code className="bg-slate-900 px-1 rounded text-orange-400">068_user_feedback_system.sql</code> to create the <code className="bg-slate-900 px-1 rounded text-orange-400">user_feedback</code> D1 table, then add a feedback widget to the user-facing app.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(item => {
            const typeMeta = TYPE_META[item.type] || TYPE_META['other'];
            const statusMeta = STATUS_META[item.status] || STATUS_META['new'];
            const Icon = typeMeta.icon;
            return (
              <div
                key={item.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-3 transition group cursor-pointer"
                onClick={() => { setSelectedItem(item); setReplyText(item.admin_reply || ''); }}
              >
                <div className="flex items-start justify-between gap-2">
                  <TypeBadge type={item.type} />
                  <div className="flex items-center gap-2">
                    <StarRating rating={item.rating} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
                      ${item.status === 'new'         ? 'bg-amber-500/15 text-amber-400' : ''}
                      ${item.status === 'reviewed'    ? 'bg-blue-500/15 text-blue-400' : ''}
                      ${item.status === 'planned'     ? 'bg-purple-500/15 text-purple-400' : ''}
                      ${item.status === 'implemented' ? 'bg-emerald-500/15 text-emerald-400' : ''}
                      ${item.status === 'declined'    ? 'bg-slate-500/15 text-slate-500' : ''}
                    `}>{statusMeta.label}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">{item.message}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-600" />
                    <span className="text-xs text-slate-500 truncate max-w-[160px]">{item.user_email}</span>
                  </div>
                  <span className="text-xs text-slate-600">
                    {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                {item.admin_reply && (
                  <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-2.5">
                    <p className="text-xs text-purple-400 font-bold mb-1">Admin Reply</p>
                    <p className="text-xs text-slate-400 line-clamp-1">{item.admin_reply}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 z-10 rounded-t-3xl">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Feedback Details</h3>
                <TypeBadge type={selectedItem.type} />
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Reporter + Date + Rating */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">From</p>
                  <p className="text-sm text-white font-medium break-all">{selectedItem.user_email}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</p>
                  <p className="text-sm text-white">{new Date(selectedItem.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Rating</p>
                  <StarRating rating={selectedItem.rating} />
                </div>
              </div>

              {/* Page URL */}
              {selectedItem.page_url && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Source Page</p>
                  <p className="text-xs font-mono text-orange-400 bg-slate-800 px-3 py-2 rounded-lg">{selectedItem.page_url}</p>
                </div>
              )}

              {/* Message */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Message</p>
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
                  {selectedItem.message}
                </div>
              </div>

              {/* Status Control */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded
                    ${selectedItem.status === 'new'         ? 'bg-amber-500/15 text-amber-400' : ''}
                    ${selectedItem.status === 'reviewed'    ? 'bg-blue-500/15 text-blue-400' : ''}
                    ${selectedItem.status === 'planned'     ? 'bg-purple-500/15 text-purple-400' : ''}
                    ${selectedItem.status === 'implemented' ? 'bg-emerald-500/15 text-emerald-400' : ''}
                    ${selectedItem.status === 'declined'    ? 'bg-slate-500/15 text-slate-500' : ''}
                  `}>{STATUS_META[selectedItem.status]?.label || selectedItem.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Change to:</span>
                  <select
                    value={selectedItem.status}
                    onChange={e => handleStatusChange(selectedItem.id, e.target.value)}
                    disabled={updatingId !== null}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none focus:border-purple-500/60 disabled:opacity-50"
                  >
                    <option value="new">New</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="planned">Planned</option>
                    <option value="implemented">Implemented</option>
                    <option value="declined">Declined</option>
                  </select>
                  {updatingId === selectedItem.id && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
                </div>
              </div>

              {/* Admin Reply Box */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Admin Note / Internal Reply</p>
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Add an internal note or response (visible only to admins)..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-purple-500/50 outline-none resize-none"
                />
                <button
                  onClick={handleSendReply}
                  disabled={isSendingReply || !replyText.trim()}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                  {isSendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Save Note
                </button>
              </div>

              {/* Footer */}
              <div className="flex justify-end border-t border-slate-800 pt-4">
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  disabled={deletingId === selectedItem.id}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-sm rounded-xl transition disabled:opacity-50"
                >
                  {deletingId === selectedItem.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackHub;
