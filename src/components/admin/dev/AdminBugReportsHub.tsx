// ============================================================
// SHIKSHA SAHAYAK OS: ADMIN BUG REPORTS HUB
// Full Bug Bounty Triage, Stack Trace Analysis & Status Pipeline
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../api/client';
import {
  Bug, Trash2, Loader2, Eye, Filter, Calendar, Mail, Terminal,
  ExternalLink, X, AlertCircle, RefreshCw, Search, CheckCircle2,
  AlertTriangle, Clock, XCircle, Shield, ArrowRight, ChevronDown,
  Monitor, Smartphone, SlidersHorizontal, TrendingUp, Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface BugReport {
  id: string;
  user_email: string;
  description: string;
  screenshot_url: string | null;
  error_stack: string | null;
  browser_info: string | null;
  status: 'pending' | 'investigating' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

const STATUS_META: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending:       { label: 'Pending',       color: 'amber',   icon: Clock },
  investigating: { label: 'Investigating', color: 'blue',    icon: Search },
  resolved:      { label: 'Resolved',      color: 'emerald', icon: CheckCircle2 },
  closed:        { label: 'Closed',        color: 'slate',   icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || STATUS_META['pending'];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border
      ${status === 'pending'       ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'   : ''}
      ${status === 'investigating' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'       : ''}
      ${status === 'resolved'      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : ''}
      ${status === 'closed'        ? 'bg-slate-500/15 text-slate-400 border-slate-700'       : ''}
    `}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

interface AdminBugReportsHubProps {
  onNavigateToTab?: (tab: string) => void;
}

export const AdminBugReportsHub: React.FC<AdminBugReportsHubProps> = () => {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getBugReports();
      setReports(data as BugReport[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load bug reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      await apiClient.updateBugReportStatus(id, newStatus);
      toast.success(`Status updated to "${newStatus}"`);
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as any, updated_at: new Date().toISOString() } : r));
      if (selectedReport?.id === id) setSelectedReport(prev => prev ? { ...prev, status: newStatus as any } : null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this bug report permanently? Screenshot attachments will also be deleted from storage.')) return;
    try {
      setDeletingId(id);
      await apiClient.deleteBugReport(id);
      toast.success('Bug report deleted');
      setReports(prev => prev.filter(r => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete report');
    } finally {
      setDeletingId(null);
    }
  };

  const openScreenshot = (url: string) => {
    if (url.startsWith('data:')) {
      const newWin = window.open('');
      if (newWin) {
        newWin.document.write(`<!DOCTYPE html><html><head><title>Bug Report Screenshot</title></head><body style="margin:0;background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;"><img src="${url}" style="max-width:100%;max-height:100vh;object-fit:contain;box-shadow:0 10px 25px rgba(0,0,0,0.5);" /></body></html>`);
        newWin.document.close();
        return;
      }
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const filtered = reports.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchSearch = !search || r.user_email.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    investigating: reports.filter(r => r.status === 'investigating').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    closed: reports.filter(r => r.status === 'closed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <Bug className="w-4 h-4 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Bug Reports</h1>
            {counts.pending > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                {counts.pending} new
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm">Triage user-reported bugs, investigate errors, and track resolutions.</p>
        </div>
        <button
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: counts.total, color: 'slate', borderColor: '' },
          { label: 'Pending', value: counts.pending, color: 'amber', borderColor: 'border-l-amber-400' },
          { label: 'Investigating', value: counts.investigating, color: 'blue', borderColor: 'border-l-blue-400' },
          { label: 'Resolved', value: counts.resolved, color: 'emerald', borderColor: 'border-l-emerald-400' },
          { label: 'Closed', value: counts.closed, color: 'slate', borderColor: 'border-l-slate-600' },
        ].map(s => (
          <div key={s.label} className={`bg-slate-900/80 border border-slate-800 ${s.borderColor ? `border-l-2 ${s.borderColor}` : ''} rounded-2xl p-4 cursor-pointer transition hover:bg-slate-800/80`}
            onClick={() => setFilterStatus(s.label === 'Total' ? 'all' : s.label.toLowerCase())}
          >
            <p className={`text-2xl font-bold text-${s.color}-${s.color === 'slate' ? '100' : '400'}`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by email or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:border-orange-500/50 outline-none"
          />
        </div>
        <div className="flex gap-1.5">
          {['all', 'pending', 'investigating', 'resolved', 'closed'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition ${filterStatus === s ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading bug reports...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="font-bold text-white">No bug reports found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Reporter</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map(report => (
                  <tr key={report.id} className="group hover:bg-slate-800/30 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span className="text-sm text-white truncate max-w-[160px] font-medium" title={report.user_email}>
                          {report.user_email}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-300 line-clamp-1 max-w-xs" title={report.description}>
                        {report.description}
                      </p>
                      {report.error_stack && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-red-400 mt-0.5">
                          <Terminal className="w-2.5 h-2.5" /> has stack trace
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(report.id)}
                          disabled={deletingId === report.id}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-slate-800/60">
            {filtered.map(report => (
              <div key={report.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <StatusBadge status={report.status} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {report.user_email}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{report.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={() => setSelectedReport(report)} className="text-xs font-bold text-orange-400 flex items-center gap-1 hover:text-orange-300 transition">
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>
                  <button onClick={() => handleDelete(report.id)} disabled={deletingId === report.id} className="p-1.5 text-red-400 bg-red-500/10 rounded-lg border border-red-500/20 disabled:opacity-50">
                    {deletingId === report.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900 z-10 rounded-t-3xl">
              <div>
                <div className="flex items-center gap-2">
                  <Bug className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-bold text-white">Bug Report Details</h3>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedReport.id}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Reporter + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reporter</p>
                  <p className="text-sm text-white font-medium break-all flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400 shrink-0" />{selectedReport.user_email}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Submitted</p>
                  <p className="text-sm text-white">{new Date(selectedReport.created_at).toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Status Control */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Status</p>
                  <StatusBadge status={selectedReport.status} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Change:</span>
                  <select
                    value={selectedReport.status}
                    onChange={(e) => handleStatusChange(selectedReport.id, e.target.value)}
                    disabled={updatingId !== null}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none focus:border-orange-500/60 disabled:opacity-50"
                  >
                    <option value="pending">Pending</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  {updatingId === selectedReport.id && <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />}
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</p>
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
                  {selectedReport.description}
                </div>
              </div>

              {/* Screenshot */}
              {selectedReport.screenshot_url && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Screenshot</p>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-800/50 p-2 max-w-md">
                    <img src={selectedReport.screenshot_url} alt="Bug screenshot" className="rounded-xl w-full h-auto max-h-64 object-contain" />
                    <button
                      type="button"
                      onClick={() => openScreenshot(selectedReport.screenshot_url!)}
                      className="absolute bottom-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg shadow-md transition cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" /> Open Full
                    </button>
                  </div>
                </div>
              )}

              {/* Browser info */}
              {selectedReport.browser_info && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Platform Diagnostics</p>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-400 break-all select-all">
                    {selectedReport.browser_info}
                  </div>
                </div>
              )}

              {/* Stack Trace */}
              {selectedReport.error_stack && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-red-400" /> Stack Trace
                  </p>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-red-400 max-h-48 overflow-y-auto whitespace-pre select-all">
                    {selectedReport.error_stack}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end border-t border-slate-800 pt-4">
                <button
                  onClick={() => handleDelete(selectedReport.id)}
                  disabled={deletingId === selectedReport.id}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-red-500/20 disabled:opacity-50"
                >
                  {deletingId === selectedReport.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete Bug Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBugReportsHub;
