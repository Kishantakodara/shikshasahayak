import React from "react";
import { Layers, Users, BookOpen } from "lucide-react";
import { InstitutionDepartment } from "../../types/institution-saas";

interface Props {
  departments: InstitutionDepartment[];
}

export const DepartmentManagerCard: React.FC<Props> = ({ departments }) => {
  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-cyan-400" />
          <h3 className="font-extrabold text-sm text-white font-display uppercase tracking-wider">
            Academic Departments ({departments.length})
          </h3>
        </div>
      </div>

      {departments.length === 0 ? (
        <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 text-center text-xs text-slate-500">
          No departments registered for this institution yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md">
                  {dept.code}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">Active Dept</span>
              </div>
              <h4 className="font-extrabold text-white text-sm leading-snug">{dept.name}</h4>
              <div className="flex items-center gap-4 text-slate-400 text-[11px] pt-1 border-t border-slate-800/60">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {dept.facultyCount || 12} Faculty
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> {dept.studentCount || 450} Enrolled
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
