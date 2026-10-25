// ============================================================
// SHIKSHA SAHAYAK OS - PLATFORM METRICS OVERVIEW COMPONENT
// ============================================================

import React from "react";
import { PlatformMetricsSnapshotSpec } from "../../types/admin-platform";
import { Users, BookOpen, Award, Activity, GraduationCap } from "lucide-react";

interface PlatformMetricsOverviewProps {
  metrics: PlatformMetricsSnapshotSpec;
}

export const PlatformMetricsOverview: React.FC<PlatformMetricsOverviewProps> = ({ metrics }) => {
  const cards = [
    { title: "Total Students", value: metrics.totalStudents, icon: <GraduationCap className="w-5 h-5 text-indigo-400" /> },
    { title: "Active Users Today", value: metrics.activeUsers, icon: <Activity className="w-5 h-5 text-emerald-400" /> },
    { title: "Active Teachers", value: metrics.totalTeachers, icon: <Users className="w-5 h-5 text-sky-400" /> },
    { title: "Study Resources", value: metrics.totalResources, icon: <BookOpen className="w-5 h-5 text-[#FF6B35]" /> },
    { title: "Assessment Tests", value: metrics.totalAssessments, icon: <Award className="w-5 h-5 text-amber-400" /> },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-[#1C2541]/70 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-400 truncate">{card.title}</span>
            <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700/60">{card.icon}</div>
          </div>
          <p className="text-xl font-bold text-white tracking-tight">{card.value.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};
