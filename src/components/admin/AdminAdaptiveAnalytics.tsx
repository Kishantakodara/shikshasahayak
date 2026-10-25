import React, { useEffect, useState } from 'react';
import { BrainCircuit, TrendingUp, AlertTriangle, Layers, Play } from 'lucide-react';
import { fetchWithAuth } from '../../api/client';

export function AdminAdaptiveAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [demandLoop, setDemandLoop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [aRes, dRes] = await Promise.all([
        fetchWithAuth('/api/admin/adaptive/analytics'),
        fetchWithAuth('/api/admin/adaptive/demand-loop'),
      ]);

      const aJson = await aRes.json();
      const dJson = await dRes.json();

      if (aJson.success) setAnalytics(aJson.analytics);
      if (dJson.success) setDemandLoop(dJson.demandLoop);
    } catch {
      // Catch
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerIngestion = async (subjectCode: string) => {
    try {
      const res = await fetchWithAuth('/api/admin/adaptive/demand-loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectCode }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Pipeline ingestion job ${data.jobId} launched for ${subjectCode}!`);
      }
    } catch {
      alert('Failed to trigger ingestion pipeline job.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Adaptive Learning Analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <BrainCircuit className="w-7 h-7 text-indigo-500" /> Admin Adaptive Learning & Demand Loop Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Operational monitoring of student mastery adoption, top weak topic concentrations, and closed-loop Phase 1H ingestion triggers.
        </p>
      </div>

      {/* Metrics Grid */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-slate-400 text-xs">Active Adaptive Students</span>
            <div className="text-2xl font-extrabold text-slate-100 mt-1">{analytics.activeStudents}</div>
          </div>
          <div className="p-4 bg-slate-900 border border-red-900/50 rounded-xl">
            <span className="text-slate-400 text-xs">Student Weak Topic Concentrations</span>
            <div className="text-2xl font-extrabold text-red-400 mt-1">{analytics.topWeakTopics?.length || 0}</div>
          </div>
          <div className="p-4 bg-slate-900 border border-emerald-900/50 rounded-xl">
            <span className="text-slate-400 text-xs">Top Mastered Topics</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">{analytics.topMasteredTopics?.length || 0}</div>
          </div>
        </div>
      )}

      {/* Demand Loop Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-500" /> Closed-Loop Demand Ingestion Triggers
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(demandLoop?.topWeakTopics || []).map((w: any) => (
            <div key={`${w.subjectCode}_${w.topicName}`} className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-slate-200">{w.topicName} ({w.subjectCode})</div>
                <div className="text-[10px] text-red-400 mt-0.5 font-semibold">
                  {w.studentCount} students struggling on this topic
                </div>
              </div>
              <button
                onClick={() => handleTriggerIngestion(w.subjectCode)}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
              >
                <Play className="w-3 h-3 fill-white" /> Ingest More Questions
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
