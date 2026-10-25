import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { fetchWithAuth } from '../../api/client';

export function AdminGTUFailedJobsView() {
  const [failedJobs, setFailedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFailed();
  }, []);

  const fetchFailed = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/admin/gtu/failed');
      const data = await res.json();
      if (data.success) {
        setFailedJobs(data.failedJobs || []);
      }
    } catch {
      // Network catch
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (paperId: string) => {
    try {
      const res = await fetchWithAuth('/api/admin/gtu/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Job '${paperId}' queued for retry`);
        fetchFailed();
      }
    } catch {
      alert('Failed to trigger job retry');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Failed GTU Jobs...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-500" /> Failed Ingestion Jobs & Retry Manager
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Transient network/extraction failures requiring manual or scheduled retries.
          </p>
        </div>
        <button
          onClick={fetchFailed}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        {failedJobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <span>No failed GTU paper jobs! The ingestion pipeline is healthy.</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-3">Paper ID</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Failure Stage</th>
                <th className="p-3 text-center">Retry Count</th>
                <th className="p-3">Error Message</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {failedJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono text-slate-300">{job.paper_id}</td>
                  <td className="p-3">{job.subject_name} ({job.subject_code})</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-red-950 text-red-300 border border-red-800/50 rounded font-semibold text-[10px]">
                      {job.pipeline_status}
                    </span>
                  </td>
                  <td className="p-3 text-center font-bold">{job.retry_count || 0} / {job.max_retry_count || 3}</td>
                  <td className="p-3 font-mono text-red-300 line-clamp-2 max-w-xs">{job.last_error || 'Unknown error'}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleRetry(job.paper_id)}
                      className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-semibold"
                    >
                      Retry Job
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
