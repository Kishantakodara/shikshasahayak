import React from "react";
import { BookMarked, Download, FileText, Lock, Globe } from "lucide-react";
import { InstitutionalLibraryResource } from "../../types/institution-saas";

interface Props {
  resources: InstitutionalLibraryResource[];
}

export const InstitutionalLibraryView: React.FC<Props> = ({ resources }) => {
  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-purple-400" />
          <h3 className="font-extrabold text-sm text-white font-display uppercase tracking-wider">
            Campus Digital Library ({resources.length})
          </h3>
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 text-center text-xs text-slate-500">
          No campus-specific lab manuals or research papers published yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {resources.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white leading-snug">{item.title}</h4>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {item.resourceType.replace("_", " ")} • Uploaded {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.isPublic ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Campus Open
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Restricted
                  </span>
                )}
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
