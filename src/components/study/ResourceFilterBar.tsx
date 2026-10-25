// ============================================================
// SHIKSHA SAHAYAK OS - RESOURCE FILTER BAR COMPONENT
// ============================================================

import React from "react";
import { AcademicResourceType } from "../../types/study-material";
import { Search, Filter, BookOpen, FileText, HelpCircle, FileCheck, Layers } from "lucide-react";

interface ResourceFilterBarProps {
  selectedType: AcademicResourceType | "all";
  onSelectType: (type: AcademicResourceType | "all") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ResourceFilterBar: React.FC<ResourceFilterBarProps> = ({
  selectedType,
  onSelectType,
  searchQuery,
  onSearchChange,
}) => {
  const resourceTypes: Array<{ key: AcademicResourceType | "all"; label: string; icon: React.ReactNode }> = [
    { key: "all", label: "All Resources", icon: <Layers className="w-3.5 h-3.5" /> },
    { key: "notes", label: "Lecture Notes", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { key: "pyq", label: "Previous Papers", icon: <FileText className="w-3.5 h-3.5" /> },
    { key: "syllabus", label: "Syllabus", icon: <FileCheck className="w-3.5 h-3.5" /> },
    { key: "assignment", label: "Assignments", icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { key: "lab_manual", label: "Lab Manuals", icon: <Filter className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="bg-[#1C2541]/70 border border-slate-700/60 rounded-2xl p-4 space-y-3 shadow-lg">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search notes, PYQs, units, or topics..."
          className="w-full bg-[#0B132B] border border-slate-700 text-slate-100 placeholder-slate-400 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#FF6B35]"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {resourceTypes.map((type) => (
          <button
            key={type.key}
            onClick={() => onSelectType(type.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
              selectedType === type.key
                ? "bg-[#FF6B35] text-white shadow-md shadow-[#FF6B35]/20 font-semibold"
                : "bg-[#0B132B]/80 text-slate-300 hover:text-white border border-slate-700/60 hover:bg-slate-800"
            }`}
          >
            {type.icon}
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};
