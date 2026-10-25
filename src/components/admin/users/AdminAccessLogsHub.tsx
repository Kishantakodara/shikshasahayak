// ============================================================
// SHIKSHA SAHAYAK OS: ADMIN ACCESS LOGS HUB
// Real-time Administrative Security Audit Trail, Forensics, & Access Explorer
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Shield,
  Clock,
  Terminal,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Calendar,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminUserManagementShell } from './AdminUserManagementShell';
import { UserTabKey, AuditLogEntry } from '../../../types/user-management';
import { userManagementClient } from '../../../api/userManagementClient';
import { AuditLogDetailDrawer } from './AuditLogModals';

interface AdminAccessLogsHubProps {
  onNavigateToTab?: (tab: UserTabKey) => void;
  logs?: any[]; // backwards compatibility
}

export const AdminAccessLogsHub: React.FC<AdminAccessLogsHubProps> = ({
  onNavigateToTab,
  logs: initialLogs,
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Detail Drawer
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await userManagementClient.getAuditLogs({
        search: searchQuery,
        action: actionFilter,
        resourceType: resourceFilter,
        dateRange: dateRange,
        limit: 100,
      });
      setLogs(data.logs);
      setTotalLogs(data.total);
      setTodayCount(data.todayCount || 0);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchQuery, actionFilter, resourceFilter, dateRange]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, searchQuery, actionFilter, resourceFilter, dateRange]);

  const handleExportJSON = () => {
    const jsonContent = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonContent);
    link.setAttribute('download', `padhaku_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Admin ID', 'Action', 'Resource Type', 'Resource ID', 'IP Address', 'Details'];
    const rows = logs.map((l) => [
      l.createdAt,
      `"${l.adminEmail || l.adminId}"`,
      l.action,
      l.resourceType,
      `"${l.resourceId || ''}"`,
      l.ipAddress || '127.0.0.1',
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `padhaku_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD'))
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (action.includes('UPDATE') || action.includes('MUTATION'))
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    if (action.includes('DELETE') || action.includes('REVOKE') || action.includes('DEACTIVATE'))
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
  };

  const kpis = [
    {
      label: 'Logged Events',
      value: totalLogs || logs.length,
      subtext: 'Immutable security traces',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      icon: Terminal,
    },
    {
      label: 'Actions Today',
      value: todayCount || logs.filter((l) => new Date(l.createdAt).toDateString() === new Date().toDateString()).length,
      subtext: 'Real-time daily mutations',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: Activity,
    },
    {
      label: 'Protected Resources',
      value: 'D1 + R2 Storage',
      subtext: 'Tamper-evident logs',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      icon: Shield,
    },
    {
      label: 'Live Stream',
      value: autoRefresh ? 'Auto (15s)' : 'Manual',
      subtext: 'Log polling frequency',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      icon: Zap,
    },
  ];

  return (
    <AdminUserManagementShell
      activeTab="audit-logs"
      onTabChange={(tab) => onNavigateToTab?.(tab)}
      title="Security Audit Trail & Access Logs"
      description="Cryptographically tracked administrative mutations, role reassignments, whitelist changes, and edge session history on Cloudflare D1."
      breadcrumbs={[{ label: 'Access Logs' }]}
      kpis={kpis}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search audit events by action, admin email, IP address, or payload keywords..."
      onRefresh={fetchLogs}
      onExportClick={handleExportCSV}
      isLoading={isLoading}
      primaryAction={{
        label: autoRefresh ? 'Live Polling (On)' : 'Enable Live Stream',
        icon: Zap,
        color: autoRefresh ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-slate-800 hover:bg-slate-700',
        onClick: () => setAutoRefresh(!autoRefresh),
      }}
      secondaryAction={{
        label: 'Export JSON',
        icon: Download,
        onClick: handleExportJSON,
      }}
      hasActiveFilters={actionFilter !== 'all' || resourceFilter !== 'all' || dateRange !== 'all' || Boolean(searchQuery)}
      onResetFilters={() => {
        setSearchQuery('');
        setActionFilter('all');
        setResourceFilter('all');
        setDateRange('all');
      }}
      filters={
        <>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Actions</option>
            <option value="USER_CREATE">USER_CREATE</option>
            <option value="USER_UPDATE">USER_UPDATE</option>
            <option value="USER_ROLE_MUTATION">USER_ROLE_MUTATION</option>
            <option value="TEACHER_WHITELIST_ADD">TEACHER_WHITELIST_ADD</option>
            <option value="TEACHER_WHITELIST_REVOKE">TEACHER_WHITELIST_REVOKE</option>
            <option value="USER_BETA_UPDATE">USER_BETA_UPDATE</option>
            <option value="ROLE_ASSIGNMENT">ROLE_ASSIGNMENT</option>
          </select>

          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Resources</option>
            <option value="unified_users">unified_users</option>
            <option value="teacher_whitelist">teacher_whitelist</option>
            <option value="user_beta_access">user_beta_access</option>
            <option value="custom_roles">custom_roles</option>
            <option value="feature_flags">feature_flags</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>
        </>
      }
    >
      {/* Audit Logs Table */}
      <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Admin / Actor</th>
                <th className="p-4">Action Event</th>
                <th className="p-4">Resource Target</th>
                <th className="p-4">Payload Summary</th>
                <th className="p-4">IP Address</th>
                <th className="p-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-mono text-xs">
                    Loading security audit trail from Cloudflare D1...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Terminal className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-sm font-bold text-white">No audit records found</p>
                      <p className="text-xs text-slate-500">Try broadening your date range or adjusting search filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 text-slate-400 font-mono whitespace-nowrap text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-white font-mono text-[11px] truncate max-w-[150px]">
                        {log.adminEmail || log.adminId}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold font-mono border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="p-4 text-slate-300 font-mono text-[11px]">
                      <span className="text-white font-bold">{log.resourceType}</span>
                      {log.resourceId && (
                        <span className="text-slate-400 block text-[10px] truncate max-w-[140px]">
                          id: {log.resourceId}
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-400 font-mono text-[11px] max-w-[200px] truncate">
                      {log.details ? JSON.stringify(log.details) : <span className="text-slate-600">-</span>}
                    </td>

                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ml-auto border border-slate-700"
                        title="View Full Payload & Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Inspector Drawer */}
      <AuditLogDetailDrawer
        log={selectedLog}
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
      />
    </AdminUserManagementShell>
  );
};
