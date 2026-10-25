import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { fetchWithAuth } from '../../api/client';

export function AdminQuestionAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [demand, setDemand] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, dRes] = await Promise.all([
        fetchWithAuth('/api/admin/questions/analytics'),
        fetchWithAuth('/api/admin/questions/demand'),
      ]);

      const aJson = await aRes.json();
      const dJson = await dRes.json();

      if (aJson.success) setAnalytics(aJson.analytics);
      if (dJson.success) setDemand(dJson);
    } catch {
      // Catch
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Question Analytics & Demand...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-orange-500" /> Question Intelligence Analytics & Demand
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Global quality statistics, AI vs PYQ performance comparison, and automated ingestion demand recommendations.
        </p>
      </div>

      {/* Metrics Grid */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-slate-400 text-xs">Total Verified Questions</span>
            <div className="text-2xl font-extrabold text-slate-100 mt-1">{analytics.totalVerified}</div>
          </div>
          <div className="p-4 bg-slate-900 border border-orange-900/50 rounded-xl">
            <span className="text-slate-400 text-xs">GTU Official PYQs</span>
            <div className="text-2xl font-extrabold text-orange-400 mt-1">{analytics.gtuPyqCount}</div>
          </div>
          <div className="p-4 bg-slate-900 border border-indigo-900/50 rounded-xl">
            <span className="text-slate-400 text-xs">GATE Official PYQs</span>
            <div className="text-2xl font-extrabold text-indigo-400 mt-1">{analytics.gatePyqCount}</div>
          </div>
          <div className="p-4 bg-slate-900 border border-purple-900/50 rounded-xl">
            <span className="text-slate-400 text-xs">AI Practice Questions</span>
            <div className="text-2xl font-extrabold text-purple-400 mt-1">{analytics.aiGeneratedCount}</div>
          </div>
        </div>
      )}

      {/* Demand Recommendations Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-500" /> Ingestion Demand Recommendations for Phase 1H Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(demand?.recommendations || []).map((rec: any) => (
            <div key={rec.subjectCode} className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-200">{rec.subjectName} ({rec.subjectCode})</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                  rec.priority === 'HIGH' ? 'bg-red-950 text-red-300 border border-red-800/40' : 'bg-amber-950 text-amber-300'
                }`}>
                  {rec.priority} PRIORITY
                </span>
              </div>
              <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                {rec.reasons.map((r: string, idx: number) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
              <div className="flex items-center gap-3 pt-2 text-xs font-semibold text-slate-300">
                <span>Need: +{rec.recommendedMcqCount} MCQs</span>
                <span>+{rec.recommendedMsqCount} MSQs</span>
                <span>+{rec.recommendedNatCount} NATs</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
