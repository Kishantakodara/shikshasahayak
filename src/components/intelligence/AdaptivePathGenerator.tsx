import React, { useState } from "react";
import { Calendar, Sparkles, CheckCircle2 } from "lucide-react";
import { AdaptiveLearningPath } from "../../types/education-intelligence";
import { generateAdaptivePath } from "../../api/educationIntelligenceClient";

export const AdaptivePathGenerator: React.FC = () => {
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [dailyHours, setDailyHours] = useState(2.5);
  const [path, setPath] = useState<AdaptiveLearningPath | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await generateAdaptivePath("gtu_dsa", examDate, dailyHours);
    setPath(res);
    setLoading(false);
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-cyan-500" />
          <h3 className="font-extrabold text-sm text-foreground font-display uppercase tracking-wider">
            Adaptive Exam Study Path Generator
          </h3>
        </div>
      </div>

      <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center justify-between">
            <span>Target Horizon (Estimate)</span>
            <span className="text-[9px] text-amber-500 font-normal">Customizable</span>
          </label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-[#f97316]"
            title="Estimated target date for adaptive study schedule (default: 30 days)"
            required
          />
          <p className="text-[9px] text-muted-foreground mt-0.5">30-day revision target estimate</p>
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Daily Study Hours</label>
          <input
            type="number"
            step="0.5"
            min="1"
            max="12"
            value={dailyHours}
            onChange={(e) => setDailyHours(parseFloat(e.target.value))}
            className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-[#f97316]"
            required
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#f97316] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5" /> {loading ? "Generating..." : "Generate Revision Path"}
          </button>
        </div>
      </form>

      {path && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-foreground font-display">Personalized Revision Schedule</h4>
            <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded">Estimated Pace</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {path.schedule.map((day) => (
              <div
                key={day.dayNumber}
                className="p-2.5 bg-muted/40 rounded-xl border border-border flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-[#f97316] bg-orange-500/10 px-2 py-0.5 rounded">
                    Day {day.dayNumber} ({day.date})
                  </span>
                  <span className="font-bold text-foreground">{day.topicToStudy}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-bold">{day.allocatedHours} hrs</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
