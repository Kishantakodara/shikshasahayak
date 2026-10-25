import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Archive,
} from 'lucide-react';
import { fetchWithAuth } from '../../api/client';

export function AdminQuestionQualityCenter() {
  const [qualityRecords, setQualityRecords] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'critical' | 'reports'>('critical');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qRes, iRes] = await Promise.all([
        fetchWithAuth('/api/admin/questions/quality'),
        fetchWithAuth('/api/admin/questions/issues?status=OPEN'),
      ]);

      const qJson = await qRes.json();
      const iJson = await iRes.json();

      if (qJson.success) setQualityRecords(qJson.qualityRecords || []);
      if (iJson.success) setIssues(iJson.reports || []);
    } catch {
      // Catch
    } finally {
      setLoading(false);
    }
  };

  const handleQuarantine = async (questionId: string) => {
    const reason = prompt('Enter quarantine reason:', 'High error anomaly / student reports');
    if (!reason) return;

    try {
      const res = await fetchWithAuth(`/api/admin/questions/${questionId}/quarantine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Question quarantined cleanly');
        fetchData();
      }
    } catch {
      alert('Failed to quarantine question');
    }
  };

  const handleRestore = async (questionId: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/questions/${questionId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin restored question' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Question restored to ACTIVE state');
        fetchData();
      }
    } catch {
      alert('Failed to restore question');
    }
  };

  const handleResolveReport = async (reportId: string, resolution: 'RESOLVED' | 'DISMISSED') => {
    const note = prompt(`Enter ${resolution.toLowerCase()} note:`, 'Issue verified and resolved');
    if (!note) return;

    try {
      const res = await fetchWithAuth(`/api/admin/questions/dummy/report-resolution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, resolution, note }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch {
      alert('Failed to resolve report');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Question Quality Center...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-red-500" /> Question Quality & Issue Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Operational quality monitoring, health flags, student issue reports, and quarantine/retire lifecycle management.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('critical')}
            className={`px-3 py-1.5 rounded font-semibold transition ${
              activeTab === 'critical' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Review Priorities ({qualityRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded font-semibold transition ${
              activeTab === 'reports' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Student Reports ({issues.length})
          </button>
        </div>
      </div>

      {activeTab === 'critical' ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-3">Priority</th>
                <th className="p-3">Question Statement</th>
                <th className="p-3">Subject & Type</th>
                <th className="p-3 text-center">Quality Score</th>
                <th className="p-3 text-center">Health Flags</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {qualityRecords.map((q) => {
                const flags = JSON.parse(q.health_flags_json || '[]');
                return (
                  <tr key={q.question_id} className="hover:bg-slate-800/40">
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        q.review_priority_level === 'CRITICAL'
                          ? 'bg-red-950 text-red-300 border border-red-800/50'
                          : q.review_priority_level === 'HIGH'
                          ? 'bg-orange-950 text-orange-300 border border-orange-800/50'
                          : 'bg-amber-950 text-amber-300'
                      }`}>
                        {q.review_priority_level} ({q.review_priority_score})
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-100 max-w-xs truncate">{q.question_text}</td>
                    <td className="p-3">
                      <div className="font-mono text-slate-300">{q.subject_code}</div>
                      <div className="text-[10px] text-slate-400">{q.question_type}</div>
                    </td>
                    <td className="p-3 text-center font-bold text-orange-400">{q.quality_score} ({q.quality_band})</td>
                    <td className="p-3 text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {flags.map((f: string) => (
                          <span key={f} className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[9px]">
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                        q.lifecycle_status === 'QUARANTINED' ? 'bg-red-950 text-red-400' : 'bg-emerald-950 text-emerald-300'
                      }`}>
                        {q.lifecycle_status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {q.lifecycle_status === 'QUARANTINED' ? (
                        <button
                          onClick={() => handleRestore(q.question_id)}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => handleQuarantine(q.question_id)}
                          className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-xs font-semibold"
                        >
                          Quarantine
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-3">Report Type</th>
                <th className="p-3">Question Statement</th>
                <th className="p-3">Message Details</th>
                <th className="p-3">Reported By</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {issues.map((iss) => (
                <tr key={iss.id} className="hover:bg-slate-800/40">
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-orange-950 text-orange-300 border border-orange-800/50 rounded font-bold text-[10px]">
                      {iss.report_type}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-100 max-w-xs truncate">{iss.question_text}</td>
                  <td className="p-3 text-slate-300 italic">{iss.message || 'No additional details provided'}</td>
                  <td className="p-3 font-mono text-slate-400">{iss.student_id}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleResolveReport(iss.id, 'RESOLVED')}
                        className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-semibold"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => handleResolveReport(iss.id, 'DISMISSED')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                      >
                        Dismiss
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
