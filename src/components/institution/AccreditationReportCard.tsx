import React from "react";
import { ShieldCheck, Award, FileCheck } from "lucide-react";
import { AccreditationRecord } from "../../types/institution-saas";

interface Props {
  records: AccreditationRecord[];
}

export const AccreditationReportCard: React.FC<Props> = ({ records }) => {
  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <h3 className="font-extrabold text-sm text-white font-display uppercase tracking-wider">
            NAAC / NBA Accreditation Hub ({records.length})
          </h3>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 text-center text-xs text-slate-500">
          No accreditation reporting cycles active for this institution.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {records.map((rec) => (
            <div
              key={rec.id}
              className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" /> {rec.bodyName} ({rec.academicYear})
                </span>
                {rec.grade && (
                  <span className="font-black text-[#f97316] text-sm font-display">Grade {rec.grade}</span>
                )}
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                  <span>CO-PO Evidence Collected</span>
                  <span className="text-white">{rec.evidenceCollectedScore}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${rec.evidenceCollectedScore}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                <span className="capitalize">Status: {rec.status.replace("_", " ")}</span>
                <span className="flex items-center gap-1 text-slate-300 font-bold">
                  <FileCheck className="h-3 w-3 text-emerald-400" /> Report Ready
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
