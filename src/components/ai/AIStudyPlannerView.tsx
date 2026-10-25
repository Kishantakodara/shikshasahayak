import React, { useState } from "react";
import { Sparkles, Calendar, CheckCircle, Clock } from "lucide-react";
import { AIStudyPlanSpec } from "../../types/ai-ecosystem";
import { requestAIStudyPlan } from "../../api/aiEcosystemClient";

interface AIStudyPlannerViewProps {
  subjectId?: string;
}

export const AIStudyPlannerView: React.FC<AIStudyPlannerViewProps> = ({ subjectId = "dbms" }) => {
  const [plan, setPlan] = useState<AIStudyPlanSpec | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await requestAIStudyPlan(subjectId, ["Normalization 3NF", "Indexing & B-Trees"]);
    setPlan(result);
    setLoading(false);
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#f97316]" />
          <h3 className="font-extrabold text-sm text-white font-display uppercase tracking-wider">
            AI Study Planner & Weak Area Strategy
          </h3>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-3.5 py-1.5 bg-[#f97316] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate AI Plan"}
        </button>
      </div>

      {!plan ? (
        <p className="text-xs text-slate-400 font-medium">
          Click above to generate a personalized 4-day revision schedule based on your GTU branch, semester, and assessment results.
        </p>
      ) : (
        <div className="space-y-3 pt-2">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-white">Target Subject: {plan.subjectId.toUpperCase()}</span>
            <span className="text-[10px] font-bold text-amber-400">Weak Topics: {plan.weakTopics.join(", ")}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plan.dailyTasks.map((t) => (
              <div key={t.day} className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#f97316]">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Day {t.day}</span>
                  <span className="flex items-center gap-1 text-slate-400"><Clock className="h-3 w-3" /> {t.durationMinutes} mins</span>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-snug">{t.task}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
