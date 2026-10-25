import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
  Bug, 
  Trash2, 
  Loader2, 
  Eye, 
  Filter, 
  Calendar, 
  Mail, 
  Terminal, 
  ExternalLink, 
  X,
  AlertCircle
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

const ManageBugReportsUI: React.FC = () => {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getBugReports();
      setReports(data as BugReport[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load bug reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      await apiClient.updateBugReportStatus(id, newStatus);
      toast.success(`Report status updated to ${newStatus}`);
      
      // Update local state
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as any, updated_at: new Date().toISOString() } : r));
      if (selectedReport && selectedReport.id === id) {
        setSelectedReport(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bug report? This will also delete any screenshot from storage.')) {
      return;
    }

    try {
      setDeletingId(id);
      await apiClient.deleteBugReport(id);
      toast.success('Bug report deleted');
      setReports(prev => prev.filter(r => r.id !== id));
      if (selectedReport && selectedReport.id === id) {
        setSelectedReport(null);
      }
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
      case 'investigating':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
      case 'resolved':
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
      case 'closed':
        return 'bg-gray-50 dark:bg-slate-900/20 text-gray-500 dark:text-slate-400 border-gray-100 dark:border-slate-800';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  const filteredReports = filterStatus === 'all' 
    ? reports 
    : reports.filter(r => r.status === filterStatus);

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const investigatingCount = reports.filter(r => r.status === 'investigating').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-navy-900 dark:text-white flex items-center gap-2">
            <Bug className="h-8 w-8 text-brand-orange" /> Bug Bounty Reports
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Review user feedback, platform bugs, and auto-submitted client error traces.
          </p>
        </div>

        <button 
          onClick={fetchReports} 
          disabled={loading}
          className="self-start md:self-auto bg-gray-100 dark:bg-navy-800 hover:bg-gray-200 dark:hover:bg-navy-750 text-navy-900 dark:text-white px-4 py-2.5 rounded-xl font-bold border border-gray-200 dark:border-navy-700 transition-colors flex items-center gap-2 cursor-pointer"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Refresh List
        </button>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Reports</p>
          <p className="text-2xl font-bold font-display text-navy-900 dark:text-white mt-1">{reports.length}</p>
        </div>
        <div className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 p-5 rounded-2xl shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Pending</p>
          <p className="text-2xl font-bold font-display text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 p-5 rounded-2xl shadow-sm border-l-4 border-l-blue-500">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Investigating</p>
          <p className="text-2xl font-bold font-display text-blue-600 dark:text-blue-400 mt-1">{investigatingCount}</p>
        </div>
        <div className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 p-5 rounded-2xl shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Resolved</p>
          <p className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-1">{resolvedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-150 dark:border-navy-850">
        <span className="text-sm font-semibold text-gray-550 dark:text-gray-400 flex items-center gap-1 shrink-0">
          <Filter className="h-4 w-4" /> Filter status:
        </span>
        {['all', 'pending', 'investigating', 'resolved', 'closed'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer shrink-0 ${
              filterStatus === status 
                ? 'bg-brand-orange text-white' 
                : 'bg-gray-100 dark:bg-navy-850 hover:bg-gray-200 dark:hover:bg-navy-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Reports Table / Card List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-brand-orange" />
          <p className="text-sm text-gray-500">Loading bug reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-100 dark:border-navy-800 p-12 text-center text-gray-500">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="font-bold text-navy-900 dark:text-white">No bug reports found</p>
          <p className="text-sm mt-1">There are no submissions matching your current filter.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-3xl overflow-hidden shadow-sm">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-navy-950 border-b border-gray-100 dark:border-navy-850 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Reporter</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-navy-850 text-sm text-navy-800 dark:text-gray-200">
                {filteredReports.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50/50 dark:hover:bg-navy-950/30 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-450 shrink-0" />
                        <span className="truncate max-w-[180px]" title={report.user_email}>{report.user_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="line-clamp-1 text-gray-600 dark:text-gray-300 max-w-sm" title={report.description}>
                        {report.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${getStatusBadgeClass(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="bg-gray-100 dark:bg-navy-800 hover:bg-gray-200 dark:hover:bg-navy-750 text-navy-900 dark:text-white p-2 rounded-xl border border-gray-250 dark:border-navy-700 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(report.id)}
                          disabled={deletingId === report.id}
                          className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-2 rounded-xl border border-red-100 dark:border-red-900/30 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete Report"
                        >
                          {deletingId === report.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-navy-850">
            {filteredReports.map(report => (
              <div key={report.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${getStatusBadgeClass(report.status)}`}>
                    {report.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-gray-400" /> {report.user_email}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                    {report.description}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="bg-gray-100 dark:bg-navy-800 text-navy-900 dark:text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-navy-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  <button
                    onClick={() => handleDelete(report.id)}
                    disabled={deletingId === report.id}
                    className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-1.5 rounded-lg border border-red-100 dark:border-red-900/30 cursor-pointer disabled:opacity-50"
                  >
                    {deletingId === report.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-850 rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto space-y-6 animate-scale-in">
            {/* Modal Title */}
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-navy-800 pb-4">
              <div>
                <h3 className="text-xl font-bold font-display text-navy-900 dark:text-white flex items-center gap-2">
                  <Bug className="h-5 w-5 text-brand-orange" /> Bug Details
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedReport.id}</p>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-400 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-navy-750 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Reporter</h4>
                <p className="text-sm text-navy-900 dark:text-white font-semibold mt-1 break-all flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-gray-400" /> {selectedReport.user_email}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Submitted</h4>
                <p className="text-sm text-navy-900 dark:text-white mt-1 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" /> {new Date(selectedReport.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Status Changer */}
            <div className="bg-gray-50 dark:bg-navy-950/50 p-4 rounded-2xl border border-gray-100 dark:border-navy-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Report Status</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${getStatusBadgeClass(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-semibold">Change to:</span>
                <select
                  value={selectedReport.status}
                  onChange={(e) => handleStatusChange(selectedReport.id, e.target.value)}
                  disabled={updatingId !== null}
                  className="bg-white dark:bg-navy-900 border border-gray-250 dark:border-navy-700 rounded-xl px-3 py-1.5 text-xs text-navy-900 dark:text-white font-bold outline-none cursor-pointer focus:ring-2 focus:ring-brand-orange disabled:opacity-50"
                >
                  <option value="pending">Pending</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Issue Description */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</h4>
              <div className="bg-gray-50 dark:bg-navy-950 p-4 rounded-2xl border border-gray-100 dark:border-navy-850 text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap select-text">
                {selectedReport.description}
              </div>
            </div>

            {/* Screenshot preview */}
            {selectedReport.screenshot_url && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Screenshot Attachment</h4>
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-navy-850 bg-gray-50 dark:bg-navy-950 p-2 max-w-md">
                  <img src={selectedReport.screenshot_url} alt="Bug screenshot" className="rounded-xl w-full h-auto max-h-64 object-contain" />
                  <button
                    type="button"
                    onClick={() => openScreenshot(selectedReport.screenshot_url!)}
                    className="absolute bottom-4 right-4 bg-brand-orange hover:bg-brand-hover text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-md shadow-brand-orange/15 transition-all cursor-pointer"
                  >
                    <ExternalLink className="h-3 w-3" /> Open Full Image
                  </button>
                </div>
              </div>
            )}

            {/* Diagnostic Information */}
            {selectedReport.browser_info && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Platform Diagnostics</h4>
                <div className="bg-slate-900 text-slate-350 p-3.5 rounded-xl border border-slate-800 font-mono text-[10px] break-all select-all">
                  {selectedReport.browser_info}
                </div>
              </div>
            )}

            {/* Error Stack Trace if captured */}
            {selectedReport.error_stack && (
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-brand-orange" /> Stack Trace Log
                </h4>
                <div className="bg-slate-950 text-red-400 p-4 rounded-2xl border border-slate-850 font-mono text-xs max-h-48 overflow-y-auto whitespace-pre select-all">
                  {selectedReport.error_stack}
                </div>
              </div>
            )}

            {/* Delete in detail modal */}
            <div className="flex justify-end border-t border-gray-150 dark:border-navy-800 pt-4">
              <button
                onClick={() => handleDelete(selectedReport.id)}
                disabled={deletingId === selectedReport.id}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 cursor-pointer text-sm shadow-md shadow-red-500/10 disabled:opacity-50"
              >
                {deletingId === selectedReport.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Bug Report
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ManageBugReportsUI;
