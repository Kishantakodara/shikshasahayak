import React, { useState, useEffect } from "react";
import { Building2, Layers, GitMerge, CheckCircle, Plus, ShieldCheck } from "lucide-react";
import { getUniversities, getAcademicPrograms, createSubjectEquivalenceMapping } from "../../api/multiUniversityClient";
import { UniversityProfile, AcademicProgram } from "../../types/multi-university-platform";

export const MultiUniversityAdminHub: React.FC = () => {
  const [universities, setUniversities] = useState<UniversityProfile[]>([]);
  const [selectedUnivId, setSelectedUnivId] = useState<string>("gtu");
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [sourceSubject, setSourceSubject] = useState("");
  const [targetSubject, setTargetSubject] = useState("");
  const [mappingNotes, setMappingNotes] = useState("");
  const [mappingStatus, setMappingStatus] = useState<string | null>(null);

  useEffect(() => {
    getUniversities().then(setUniversities);
  }, []);

  useEffect(() => {
    getAcademicPrograms(selectedUnivId).then(setPrograms);
  }, [selectedUnivId]);

  const handleCreateEquivalence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceSubject || !targetSubject) return;

    const ok = await createSubjectEquivalenceMapping(sourceSubject, targetSubject, mappingNotes);
    if (ok) {
      setMappingStatus("Subject equivalence mapping saved successfully!");
      setSourceSubject("");
      setTargetSubject("");
      setMappingNotes("");
    } else {
      setMappingStatus("Failed to save mapping.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white font-display flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#f97316]" /> Multi-University Governance Hub
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Manage institutions, academic programs, curriculum versions, and cross-university subject equivalences.
          </p>
        </div>
      </div>

      {/* University & Program Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Universities */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-5 space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#f97316]" /> Registered Institutions ({universities.length})
          </h3>
          <div className="space-y-2">
            {universities.map((u) => (
              <div
                key={u.id}
                onClick={() => setSelectedUnivId(u.id)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                  selectedUnivId === u.id
                    ? "bg-[#f97316]/10 border-[#f97316]/40 text-white"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <div>
                  <h4 className="font-bold text-white leading-snug">{u.name} ({u.shortName})</h4>
                  <span className="text-[10px] text-slate-400">{u.state}, {u.country} • Scale: {u.gradingSystem.scale}</span>
                </div>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Academic Programs */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-5 space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" /> Academic Programs ({programs.length})
          </h3>
          {programs.length === 0 ? (
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800 text-center text-xs text-slate-500">
              No additional programs registered for this institution yet.
            </div>
          ) : (
            <div className="space-y-2">
              {programs.map((p) => (
                <div key={p.id} className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-white">{p.name} ({p.programType})</h4>
                    <span className="text-[10px] text-slate-400">{p.durationYears} Years • {p.totalSemesters} Semesters</span>
                  </div>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cross-University Subject Equivalence Mapper */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-extrabold text-white font-display flex items-center gap-2">
          <GitMerge className="h-5 w-5 text-purple-400" /> Cross-University Subject Equivalence Engine
        </h3>
        <p className="text-xs text-slate-400 font-medium leading-relaxed">
          Map equivalent subjects across GTU, Nirma, PDPU, and external universities to share PYQs, notes, and AI study plans.
        </p>

        {mappingStatus && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold">
            {mappingStatus}
          </div>
        )}

        <form onSubmit={handleCreateEquivalence} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Source Subject ID (e.g. gtu_3110005)"
            value={sourceSubject}
            onChange={(e) => setSourceSubject(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316]"
            required
          />
          <input
            type="text"
            placeholder="Target Equivalent Subject ID"
            value={targetSubject}
            onChange={(e) => setTargetSubject(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316]"
            required
          />
          <input
            type="text"
            placeholder="Notes (e.g. 95% syllabus match)"
            value={mappingNotes}
            onChange={(e) => setMappingNotes(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#f97316]"
          />
          <button
            type="submit"
            className="md:col-span-3 py-2.5 bg-[#f97316] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Save Subject Equivalence Mapping
          </button>
        </form>
      </div>
    </div>
  );
};
