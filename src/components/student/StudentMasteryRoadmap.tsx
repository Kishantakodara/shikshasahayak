import React, { useEffect, useState } from 'react';
import { Target, CheckCircle, AlertTriangle, ArrowRight, Zap } from 'lucide-react';

interface StudentMasteryRoadmapProps {
  subjectCode: string;
}

export function StudentMasteryRoadmap({ subjectCode }: StudentMasteryRoadmapProps) {
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoadmap();
  }, [subjectCode]);

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/adaptive/roadmap?subjectCode=${subjectCode}`);
      const data = await res.json();
      if (data.success) setRoadmap(data.roadmap);
    } catch {
      // Catch
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-400 text-xs">Loading Mastery Roadmap...</div>;
  }

  if (!roadmap || !roadmap.topics || roadmap.topics.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs bg-slate-900 border border-slate-800 rounded-xl">
        No active questions found for this subject.
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" /> {roadmap.subjectName} Mastery Roadmap
          </h2>
          <span className="text-xs text-slate-400 font-mono">Code: {roadmap.subjectCode}</span>
        </div>
        <div className="text-right">
          <div className="text-xl font-extrabold text-orange-400">{roadmap.overallMasteryScore}%</div>
          <div className="text-[10px] text-slate-400 uppercase font-bold">{roadmap.overallMasteryLevel}</div>
        </div>
      </div>

      <div className="space-y-3">
        {roadmap.topics.map((t: any) => (
          <div key={t.topicName} className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">{t.topicName}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                t.masteryLevel === 'MASTERED'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                  : t.masteryLevel === 'PROFICIENT'
                  ? 'bg-blue-950 text-blue-300'
                  : t.masteryLevel === 'PRACTICING'
                  ? 'bg-amber-950 text-amber-300'
                  : 'bg-red-950 text-red-300'
              }`}>
                {t.masteryLevel} ({t.masteryScore}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  t.masteryScore >= 90
                    ? 'bg-emerald-500'
                    : t.masteryScore >= 75
                    ? 'bg-blue-500'
                    : t.masteryScore >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.max(5, t.masteryScore)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>{t.totalAttempts} attempts ({t.accuracyPercentage}% accuracy)</span>
              <span className="font-semibold text-orange-400 flex items-center gap-1">
                <Zap className="w-3 h-3" /> {t.recommendedAction}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
