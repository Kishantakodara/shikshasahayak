import React, { useState } from "react";
import { Compass, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { CareerRoadmap } from "../../types/student-success-career";
import { updateMilestoneProgress } from "../../api/studentCareerClient";

interface Props {
  roadmaps: CareerRoadmap[];
}

export const CareerRoadmapViewer: React.FC<Props> = ({ roadmaps }) => {
  const [activeRoadmapId, setActiveRoadmapId] = useState<string>(roadmaps[0]?.id || "");

  const activeRoadmap = roadmaps.find((r) => r.id === activeRoadmapId) || roadmaps[0];

  const handleToggle = async (milestoneId: string, currentStatus: boolean) => {
    await updateMilestoneProgress(milestoneId, !currentStatus);
    // Optimistic UI update can be added if needed
  };

  if (!activeRoadmap) return null;

  return (
    <div className="bg-card border border-border rounded-3xl p-6 space-y-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-[#f97316]" />
          <h3 className="font-extrabold text-sm text-foreground font-display uppercase tracking-wider">
            Configurable Career Roadmaps
          </h3>
        </div>

        {/* Roadmap Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {roadmaps.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveRoadmapId(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeRoadmap.id === r.id
                  ? "bg-[#f97316] text-white shadow-md shadow-orange-500/20"
                  : "bg-muted text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {r.category}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-base font-black text-foreground font-display">{activeRoadmap.title}</h4>
        <p className="text-xs text-muted-foreground font-medium leading-relaxed">{activeRoadmap.description}</p>
      </div>

      {/* Milestone List */}
      <div className="space-y-3 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
        {(activeRoadmap.milestones || []).map((m) => (
          <div
            key={m.id}
            onClick={() => handleToggle(m.id, !!m.isCompleted)}
            className={`relative pl-9 p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between text-xs ${
              m.isCompleted
                ? "bg-emerald-500/5 border-emerald-500/30 text-foreground"
                : "bg-muted/40 border-border text-foreground/80 hover:border-muted-foreground/40"
            }`}
          >
            <div className="absolute left-2.5 top-4 -translate-x-1/2">
              {m.isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-500/20" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-[#f97316] uppercase tracking-wider">
                Step {m.stepNumber}
              </span>
              <h5 className="font-extrabold text-foreground text-sm">{m.title}</h5>
              <p className="text-xs text-muted-foreground font-medium">{m.description}</p>
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
};
