import React, { useEffect, useState } from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { fetchWithAuth } from '../../api/client';

export function AdminPipelineMonitor() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsRes, metricsRes] = await Promise.all([
        fetchWithAuth('/api/admin/question-pipeline/jobs'),
        fetchWithAuth('/api/admin/question-pipeline/stats'),
      ]);

      const jobsJson = await jobsRes.json().catch(() => ({ success: false }));
      const metricsJson = await metricsRes.json().catch(() => ({ success: false }));

      if (jobsJson.success) setJobs(jobsJson.jobs || []);
      if (metricsJson.success) setMetrics(metricsJson.metrics);
      if (!jobsJson.success && !metricsJson.success) {
        setError(jobsJson.error || metricsJson.error || 'Failed to communicate with Pipeline Orchestrator backend.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error connecting to Pipeline Orchestrator.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartJob = async (sourceType: 'GTU' | 'GATE') => {
    try {
      const res = await fetchWithAuth('/api/admin/question-pipeline/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType, requestedScope: 'FULL' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(`Failed to start job: ${data.error}`);
      }
    } catch {
      alert('Network error starting pipeline job');
    }
  };

  const handlePreview = async (sourceType: 'GTU' | 'GATE') => {
    try {
      const res = await fetchWithAuth('/api/admin/question-pipeline/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewData(data.preview);
      }
    } catch {
      alert('Network error generating preview');
    }
  };

  const handleAction = async (jobId: string, action: 'pause' | 'resume' | 'cancel' | 'retry') => {
    try {
      const res = await fetchWithAuth(`/api/admin/question-pipeline/${jobId}/${action}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch {
      // Catch
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Pipeline Orchestrator Monitor...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-slate-900 border border-red-900/50 rounded-xl space-y-4 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-100">Pipeline Monitor Unavailable</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-7 h-7 text-orange-500" /> Intelligent Question Pipeline Monitor
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time pipeline orchestration, checkpoint resumption, stage observability, and quality gates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handlePreview('GTU')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Eye className="w-4 h-4 text-slate-400" /> Preview GTU Pipeline
          </button>
          <button
            onClick={() => handleStartJob('GTU')}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-orange-950"
          >
            <Play className="w-4 h-4" /> Start GTU Pipeline
          </button>
          <button
            onClick={() => handleStartJob('GATE')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-indigo-950"
          >
            <Sparkles className="w-4 h-4" /> Start GATE Pipeline
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-slate-400 text-xs">Total Pipeline Jobs</span>
            <div className="text-2xl font-extrabold text-slate-100 mt-1">{metrics.totalJobs}</div>
          </div>
          <div className="p-4 bg-slate-900 border border-emerald-900/50 rounded-xl">
            <span className="text-slate-400 text-xs">Completed Jobs</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{metrics.completedJobs}</div>
          </div>
          <div className="p-4 bg-slate-900 border border-orange-900/50 rounded-xl">
            <span className="text-slate-400 text-xs">Questions Staged</span>
            <div className="text-2xl font-extrabold text-orange-400 mt-1">{metrics.totalStaged}</div>
          </div>
          <div className="p-4 bg-slate-900 border border-purple-900/50 rounded-xl">
            <span className="text-slate-400 text-xs">AI Practice Transformations</span>
            <div className="text-2xl font-extrabold text-purple-400 mt-1">{metrics.totalAiTransformations}</div>
          </div>
        </div>
      )}

      {/* Preview Modal / Drawer */}
      {previewData && (
        <div className="p-4 bg-slate-900 border border-orange-500/40 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-orange-400 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Non-Mutating Pipeline Yield Preview ({previewData.sourceType})
            </h4>
            <button onClick={() => setPreviewData(null)} className="text-slate-400 hover:text-slate-200 text-xs">Close</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2 bg-slate-950 rounded">
              <span className="text-slate-400">Expected Papers:</span> <strong className="text-slate-200">{previewData.expectedPapersCount}</strong>
            </div>
            <div className="p-2 bg-slate-950 rounded">
              <span className="text-slate-400">Available Papers:</span> <strong className="text-emerald-400">{previewData.availablePapersCount}</strong>
            </div>
            <div className="p-2 bg-slate-950 rounded">
              <span className="text-slate-400">Est. Questions:</span> <strong className="text-orange-400">{previewData.estimatedQuestionCount}</strong>
            </div>
            <div className="p-2 bg-slate-950 rounded">
              <span className="text-slate-400">Est. AI Transformations:</span> <strong className="text-purple-400">{previewData.estimatedAiTransformations}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Jobs Grid / Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-950/80 text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800">
          <Layers className="w-4 h-4 text-orange-500" /> Orchestrated Pipeline Jobs
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800 font-semibold">
            <tr>
              <th className="p-3">Job ID</th>
              <th className="p-3">Source</th>
              <th className="p-3">Current Stage</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-center">Completed</th>
              <th className="p-3 text-center">Failed</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-800/40">
                <td className="p-3 font-mono text-slate-300">{job.job_id}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded font-semibold text-[10px]">
                    {job.source_type}
                  </span>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-slate-800/80 text-orange-300 border border-orange-800/40 rounded font-mono text-[10px]">
                    {job.current_stage}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    job.status === 'COMPLETED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                      : job.status === 'RUNNING'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800/40'
                      : job.status === 'PAUSED'
                      ? 'bg-amber-950 text-amber-300'
                      : 'bg-red-950 text-red-300'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="p-3 text-center font-bold text-emerald-400">{job.completed_items} / {job.total_items}</td>
                <td className="p-3 text-center font-bold text-red-400">{job.failed_items}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {job.status === 'RUNNING' && (
                      <button
                        onClick={() => handleAction(job.job_id, 'pause')}
                        className="px-2 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 rounded text-[10px] font-medium"
                      >
                        Pause
                      </button>
                    )}
                    {job.status === 'PAUSED' && (
                      <button
                        onClick={() => handleAction(job.job_id, 'resume')}
                        className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded text-[10px] font-medium"
                      >
                        Resume
                      </button>
                    )}
                    {job.status === 'FAILED' && (
                      <button
                        onClick={() => handleAction(job.job_id, 'retry')}
                        className="px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-[10px] font-semibold"
                      >
                        Retry
                      </button>
                    )}
                    {(job.status === 'RUNNING' || job.status === 'PAUSED') && (
                      <button
                        onClick={() => handleAction(job.job_id, 'cancel')}
                        className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-300 rounded text-[10px] font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
