import React, { useEffect, useState } from 'react';
import { Layers, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { fetchWithAuth } from '../../api/client';

export function AdminSubjectCoverageMatrix() {
  const [matrix, setMatrix] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/admin/gtu/matrix');
      const data = await res.json();
      if (data.success) {
        setMatrix(data.coverageMatrix || []);
      }
    } catch {
      // Network catch
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Subject Coverage Matrix...</div>;
  }

  const sessions = ['W2024', 'S2024', 'W2023', 'S2023'];

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-6 h-6 text-orange-500" /> GTU First-Year Subject Coverage Matrix
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Coverage status for 1st year engineering subjects across GTU exam sessions.
        </p>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold">
            <tr>
              <th className="p-3">Subject Code & Name</th>
              <th className="p-3 text-center">Semester</th>
              {sessions.map((s) => (
                <th key={s} className="p-3 text-center font-bold">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {matrix.map((row) => (
              <tr key={row.subjectCode} className="hover:bg-slate-800/40">
                <td className="p-3">
                  <span className="font-mono text-slate-400 mr-2">{row.subjectCode}</span>
                  <span className="font-medium text-slate-100">{row.subjectName}</span>
                </td>
                <td className="p-3 text-center text-slate-400">Sem {row.semester}</td>
                {sessions.map((s) => {
                  const sessInfo = row.sessions[s] || { available: false, status: 'NOT_FOUND' };
                  return (
                    <td key={s} className="p-3 text-center">
                      {sessInfo.status === 'COMPLETED' ? (
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/50 rounded font-semibold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Processed
                        </span>
                      ) : sessInfo.available ? (
                        <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800/50 rounded font-semibold text-[10px] inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" /> Discovered
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-950 text-slate-500 rounded font-semibold text-[10px] inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-slate-600" /> Not Published
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
