// ============================================================
// SHIKSHA SAHAYAK OS - TEACHER SUBJECT OVERVIEW CARD COMPONENT
// ============================================================

import React from "react";
import { TeacherSubjectAssignmentSpec } from "../../types/teacher-portal";
import { BookOpen, Users, PlusCircle, BellPlus } from "lucide-react";

interface TeacherSubjectOverviewCardProps {
  assignment: TeacherSubjectAssignmentSpec;
  onPublishMaterial: (assignment: TeacherSubjectAssignmentSpec) => void;
  onPostAnnouncement: (assignment: TeacherSubjectAssignmentSpec) => void;
}

export const TeacherSubjectOverviewCard: React.FC<TeacherSubjectOverviewCardProps> = ({
  assignment,
  onPublishMaterial,
  onPostAnnouncement,
}) => {
  return (
    <div className="bg-[#1C2541]/70 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-lg hover:border-slate-600 transition">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30">
            Class {assignment.className}
          </span>
          <span className="text-xs text-slate-400 font-medium">Semester {assignment.semester}</span>
        </div>

        <h3 className="text-base font-bold text-white uppercase tracking-wide mb-1">
          {assignment.subjectId} • {assignment.branchId.replace("-", " ")}
        </h3>
        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
          <Users className="w-3.5 h-3.5 text-slate-500" /> Active Assigned Section ({assignment.className})
        </p>
      </div>

      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={() => onPostAnnouncement(assignment)}
          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 transition"
        >
          <BellPlus className="w-3.5 h-3.5 text-amber-400" /> Announcement
        </button>

        <button
          onClick={() => onPublishMaterial(assignment)}
          className="flex-1 py-2 bg-[#FF6B35] hover:bg-[#e05a2b] text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-[#FF6B35]/20 transition"
        >
          <PlusCircle className="w-3.5 h-3.5" /> Publish Resource
        </button>
      </div>
    </div>
  );
};
