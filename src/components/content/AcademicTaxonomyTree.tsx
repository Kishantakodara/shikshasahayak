import React, { useState, useEffect } from "react";
import { BookOpen, Layers, CheckCircle2, Star, ChevronRight } from "lucide-react";
import { GTUAcademicTaxonomyNode } from "../../types/gtu-content-domination";
import { fetchGTUTaxonomyTree } from "../../api/gtuContentDominationClient";

interface AcademicTaxonomyTreeProps {
  branchSlug: string;
  semester: number;
}

export const AcademicTaxonomyTree: React.FC<AcademicTaxonomyTreeProps> = ({ branchSlug, semester }) => {
  const [nodes, setNodes] = useState<GTUAcademicTaxonomyNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGTUTaxonomyTree(branchSlug, semester).then((data) => {
      setNodes(data);
      setLoading(false);
    });
  }, [branchSlug, semester]);

  if (loading) {
    return (
      <div className="p-6 bg-slate-900 rounded-2xl text-slate-400 text-xs font-medium animate-pulse">
        Loading GTU Academic Taxonomy...
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-xs text-center">
        No topics listed yet for {branchSlug.toUpperCase()} Semester {semester}.
      </div>
    );
  }

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#f97316]" />
          <h3 className="font-extrabold text-sm text-white font-display uppercase tracking-wider">
            GTU Syllabus & Topic Mapping
          </h3>
        </div>
        <span className="text-[11px] font-bold text-slate-400">
          {nodes.length} Topics Mapped
        </span>
      </div>

      <div className="space-y-3 pt-2">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 hover:border-[#f97316]/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f97316]/10 text-[#f97316] flex items-center justify-center font-bold text-xs">
                U{node.unitNumber}
              </div>
              <div>
                <h4 className="font-bold text-xs text-white leading-snug">{node.topicName}</h4>
                <p className="text-[10px] text-slate-400 font-medium">Subject: {node.subjectSlug}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {node.resourceCount} PYQs & Notes
              </span>
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
