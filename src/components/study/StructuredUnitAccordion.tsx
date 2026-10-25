// ============================================================
// SHIKSHA SAHAYAK OS - STRUCTURED UNIT ACCORDION COMPONENT
// ============================================================

import React, { useState } from "react";
import { AcademicUnitSpec, StudyMaterialResourceSpec } from "../../types/study-material";
import { formatBytes } from "../../utils/formatters";
import { ChevronDown, ChevronUp, FileText, Download, Bookmark, ExternalLink } from "lucide-react";

interface StructuredUnitAccordionProps {
  units: AcademicUnitSpec[];
  resources: StudyMaterialResourceSpec[];
  onDownloadResource: (resource: StudyMaterialResourceSpec) => void;
  onBookmarkResource?: (resource: StudyMaterialResourceSpec) => void;
}

export const StructuredUnitAccordion: React.FC<StructuredUnitAccordionProps> = ({
  units,
  resources,
  onDownloadResource,
  onBookmarkResource,
}) => {
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(units.length > 0 ? units[0].id : null);

  const toggleUnit = (unitId: string) => {
    setExpandedUnitId((prev) => (prev === unitId ? null : unitId));
  };

  return (
    <div className="space-y-3">
      {units.map((unit) => {
        const isExpanded = expandedUnitId === unit.id;
        const unitResources = resources.filter((r) => r.unitId === unit.id);

        return (
          <div
            key={unit.id}
            className="bg-[#1C2541]/70 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg transition"
          >
            <button
              onClick={() => toggleUnit(unit.id)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2.5 py-1 bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20 font-bold text-xs rounded-lg shrink-0">
                  Unit {unit.unitNumber}
                </span>
                <h3 className="text-sm font-semibold text-white truncate">{unit.unitTitle}</h3>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  {unitResources.length} {unitResources.length === 1 ? "resource" : "resources"}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="p-4 pt-0 border-t border-slate-800 space-y-3 bg-[#0B132B]/40">
                {unit.description && (
                  <p className="text-xs text-slate-400 pt-3">{unit.description}</p>
                )}

                {unitResources.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">No study materials uploaded for this unit yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {unitResources.map((res) => (
                      <div
                        key={res.id}
                        className="bg-[#1C2541] border border-slate-700/60 rounded-xl p-3 flex flex-col justify-between gap-3 hover:border-slate-600 transition"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {res.resourceType.replace("_", " ")}
                            </span>
                            {onBookmarkResource && (
                              <button
                                onClick={() => onBookmarkResource(res)}
                                className="text-slate-400 hover:text-[#FF6B35] p-1 transition"
                                title="Bookmark resource"
                              >
                                <Bookmark className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <h4 className="text-xs font-semibold text-white line-clamp-2">{res.title}</h4>
                          {res.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{res.description}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                          <span>{formatBytes(res.fileSizeBytes)}</span>
                          <button
                            onClick={() => onDownloadResource(res)}
                            className="flex items-center gap-1 text-[#FF6B35] hover:text-[#ff8554] font-medium transition"
                          >
                            <Download className="w-3.5 h-3.5" /> Download ({res.downloadCount})
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
