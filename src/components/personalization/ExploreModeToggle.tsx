// ============================================================
// SHIKSHA SAHAYAK OS - EXPLORE MODE TOGGLE COMPONENT
// ============================================================

import React from "react";
import { Link } from "react-router-dom";
import { Compass, Sparkles, Filter } from "lucide-react";
import { useStudentAcademic } from "../../context/StudentAcademicContext";

interface ExploreModeToggleProps {
  isExploreMode: boolean;
  onToggleExploreMode: (explore: boolean) => void;
}

export const ExploreModeToggle: React.FC<ExploreModeToggleProps> = ({
  isExploreMode,
  onToggleExploreMode,
}) => {
  const { academicProfile } = useStudentAcademic();
  const displayBranch = academicProfile?.branchName || 'Computer Engineering';
  const displaySem = (academicProfile?.semester && academicProfile.semester > 0) ? academicProfile.semester : 3;
  const displayUniv = academicProfile?.universityName || 'Gujarat Technological University';

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div
          className={`p-2.5 rounded-xl border transition ${
            isExploreMode
              ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
              : "bg-[#FF6B35]/10 border-[#FF6B35]/30 text-[#FF6B35]"
          }`}
        >
          {isExploreMode ? <Compass className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {isExploreMode ? "Explore Mode Active" : "Personalized for Your Profile"}
            </h3>
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                isExploreMode
                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                  : "bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30"
              }`}
            >
              {isExploreMode ? "Unrestricted Catalog" : "Profile Scoped"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isExploreMode
              ? "Browsing all GTU branches, degrees, and semesters without altering your profile."
              : `${displayBranch} • Semester ${displaySem} (${displayUniv})`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {!isExploreMode && (
          <Link
            to="/register"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 bg-muted/60 hover:bg-muted px-3 py-1.5 rounded-lg border border-border transition-colors"
          >
            <Filter className="w-3.5 h-3.5 text-[#FF6B35]" /> Change Profile
          </Link>
        )}

        <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-xl border border-border">
          <button
            onClick={() => onToggleExploreMode(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              !isExploreMode
                ? "bg-[#FF6B35] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            My Branch
          </button>
          <button
            onClick={() => onToggleExploreMode(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              isExploreMode
                ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Explore All
          </button>
        </div>
      </div>
    </div>
  );
};
