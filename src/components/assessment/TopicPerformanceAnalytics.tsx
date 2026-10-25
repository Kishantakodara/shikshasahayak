// ============================================================
// SHIKSHA SAHAYAK OS - TOPIC PERFORMANCE ANALYTICS COMPONENT
// ============================================================

import React from "react";
import { CheckCircle2, AlertTriangle, TrendingUp, Target } from "lucide-react";

interface TopicPerformanceAnalyticsProps {
  score: number;
  totalMarks: number;
  accuracyPercent: number;
  strongTopics: string[];
  weakTopics: string[];
}

export const TopicPerformanceAnalytics: React.FC<TopicPerformanceAnalyticsProps> = ({
  score,
  totalMarks,
  accuracyPercent,
  strongTopics,
  weakTopics,
}) => {
  return (
    <div className="bg-[#1C2541]/70 border border-slate-700/60 rounded-2xl p-5 space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#FF6B35]" />
          <h3 className="text-sm font-bold text-white">Assessment Analytics & Mastery</h3>
        </div>
        <span className="text-xs font-semibold text-slate-300">
          Score: <span className="text-[#FF6B35]">{score}</span> / {totalMarks} ({accuracyPercent}% Accuracy)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Strong Topics */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="w-4 h-4" /> Strong Mastered Topics
          </div>
          {strongTopics.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No strong topics recorded yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {strongTopics.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium rounded-lg"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Weak Topics */}
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
            <AlertTriangle className="w-4 h-4" /> Areas Needing Practice
          </div>
          {weakTopics.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No weak topics identified.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {weakTopics.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[11px] font-medium rounded-lg"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
