import React, { useEffect, useState } from 'react';
import {
  Globe,
  RefreshCcw,
  Play,
  CheckCircle2,
  AlertTriangle,
  FileSearch,
  Sparkles,
  Layers,
} from 'lucide-react';
import { fetchWithAuth } from '../../api/client';

export function AdminGTUDiscoveryDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanSummary, setScanSummary] = useState<any>(null);
  const [processSummary, setProcessSummary] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/gtu/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch {
      // Ignore network catch
    }
  };

  const handleScanNow = async () => {
    setScanning(true);
    setScanSummary(null);
    try {
      const res = await fetchWithAuth('/api/admin/gtu/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: ['W2024', 'S2024', 'W2023', 'S2023'] }),
      });
      const data = await res.json();
      if (data.success) {
        setScanSummary(data.summary);
        fetchStats();
      } else {
        alert(`Scan failed: ${data.error}`);
      }
    } catch {
      alert('Network error scanning GTU papers');
    } finally {
      setScanning(false);
    }
  };

  const handleProcessPapers = async () => {
    setProcessing(true);
    setProcessSummary(null);
    try {
      const res = await fetchWithAuth('/api/admin/gtu/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 5 }),
      });
      const data = await res.json();
      if (data.success) {
        setProcessSummary(data);
        fetchStats();
      } else {
        alert(`Processing failed: ${data.error}`);
      }
    } catch {
      alert('Network error processing papers');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Globe className="w-7 h-7 text-orange-500" /> GTU Automated Paper Discovery & Ingestion
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Automated discovery of official GTU semester papers, content hashing, extraction, and queue ingestion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleScanNow}
            disabled={scanning}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition shadow-lg shadow-orange-950"
          >
            <RefreshCcw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} /> Scan GTU Now
          </button>
          <button
            onClick={handleProcessPapers}
            disabled={processing}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition shadow-lg shadow-emerald-950"
          >
            <Play className="w-4 h-4" /> Process New Papers
          </button>
        </div>
      </div>

      {/* Action Summaries */}
      {scanSummary && (
        <div className="p-4 bg-slate-900 border border-orange-800/40 rounded-xl space-y-2">
          <h4 className="text-sm font-bold text-orange-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> GTU Availability Scan Completed (Run ID: {scanSummary.runId})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2 bg-slate-950 rounded">
              <span className="text-slate-400">Papers Checked:</span> <strong className="text-slate-200">{scanSummary.papersChecked}</strong>
            </div>
            <div className="p-2 bg-slate-950 rounded">
              <span className="text-slate-400">Papers Found:</span> <strong className="text-emerald-400">{scanSummary.papersFound}</strong>
            </div>
            <div className="p-2 bg-slate-950 rounded">
              <span className="text-slate-400">New Papers:</span> <strong className="text-orange-400">{scanSummary.newPapers}</strong>
            </div>
            <div className="p-2 bg-slate-950 rounded">
              <span className="text-slate-400">Already Processed:</span> <strong className="text-slate-300">{scanSummary.alreadyProcessed}</strong>
            </div>
          </div>
        </div>
      )}

      {processSummary && (
        <div className="p-4 bg-slate-900 border border-emerald-800/40 rounded-xl space-y-2">
          <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Paper Processing Batch Completed
          </h4>
          <p className="text-xs text-slate-300">
            Processed <strong>{processSummary.processedPapersCount}</strong> papers and enqueued <strong>{processSummary.queuedQuestionsCount}</strong> verified questions into Phase 1F Admin Review Queue.
          </p>
        </div>
      )}

      {/* Recent Runs Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-950/80 text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <FileSearch className="w-4 h-4 text-orange-500" /> Recent GTU Discovery Runs
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800 font-semibold">
            <tr>
              <th className="p-3">Run ID</th>
              <th className="p-3">Mode</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-center font-semibold">Checked</th>
              <th className="p-3 text-center text-emerald-400 font-semibold">Found</th>
              <th className="p-3 text-center text-orange-400 font-semibold">New</th>
              <th className="p-3 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {(stats?.recentRuns || []).map((run: any) => (
              <tr key={run.id} className="hover:bg-slate-800/40">
                <td className="p-3 font-mono text-slate-300">{run.run_id}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold text-[10px]">
                    {run.trigger_mode}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    run.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' : 'bg-amber-950 text-amber-300'
                  }`}>
                    {run.status}
                  </span>
                </td>
                <td className="p-3 text-center font-bold">{run.papers_checked || 0}</td>
                <td className="p-3 text-center font-bold text-emerald-400">{run.papers_found || 0}</td>
                <td className="p-3 text-center font-bold text-orange-400">{run.new_papers || 0}</td>
                <td className="p-3 text-right text-slate-400">{new Date(run.started_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
