import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react';
import { fetchWithAuth } from '../../api/client';

export function AdminQuestionPoolHealthView() {
  const [healthData, setHealthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/admin/questions/health');
      const data = await res.json();
      if (data.success) {
        setHealthData(data.poolHealth || []);
      }
    } catch {
      // Catch network error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Question Pool Health...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-orange-500" /> Question Pool Health & Test Engine Availability
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Detailed breakdown of verified vs pending questions by subject and question type.
          </p>
        </div>
        <button
          onClick={fetchHealth}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3">Subject Code & Name</th>
              <th className="p-3 text-center">Format</th>
              <th className="p-3 text-center">Verified (Available)</th>
              <th className="p-3 text-center">Pending Review</th>
              <th className="p-3 text-center">Rejected</th>
              <th className="p-3 text-center">Shortage Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {healthData.map((row, i) => {
              const verified = Number(row.verified_count || 0);
              const isLow = verified < 10;
              return (
                <tr key={i} className="hover:bg-slate-800/40">
                  <td className="p-3">
                    <span className="font-mono text-slate-400 mr-2">{row.subject_code}</span>
                    <span className="font-medium text-slate-200">{row.subject_name}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold text-[10px]">
                      {row.question_type}
                    </span>
                  </td>
                  <td className="p-3 text-center font-bold text-emerald-400">{verified}</td>
                  <td className="p-3 text-center text-amber-400">{row.pending_count || 0}</td>
                  <td className="p-3 text-center text-red-400">{row.rejected_count || 0}</td>
                  <td className="p-3 text-center">
                    {isLow ? (
                      <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800/40 rounded text-[10px] flex items-center justify-center gap-1 w-fit mx-auto">
                        <AlertCircle className="w-3 h-3" /> Low Pool
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/40 rounded text-[10px] flex items-center justify-center gap-1 w-fit mx-auto">
                        <ShieldCheck className="w-3 h-3" /> Healthy
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
