import React from "react";
import { Sparkles, Calendar } from "lucide-react";

interface Props {
  versionName?: string;
  effectiveYear?: number;
  isEquivalent?: boolean;
}

export const CurriculumVersionBadge: React.FC<Props> = ({
  versionName = "GTU 2023 Revision",
  effectiveYear = 2023,
  isEquivalent = false,
}) => {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[11px] font-bold text-orange-400">
      <Calendar className="h-3 w-3 shrink-0" />
      <span>{versionName}</span>
      {isEquivalent && (
        <span className="ml-1 bg-emerald-500/20 text-emerald-400 text-[9px] uppercase px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
          <Sparkles className="h-2.5 w-2.5" /> Multi-Univ Mapped
        </span>
      )}
    </div>
  );
};
