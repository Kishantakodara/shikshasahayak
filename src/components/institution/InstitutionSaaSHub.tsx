import React, { useState, useEffect } from "react";
import { Building, CreditCard, ShieldAlert, Sparkles } from "lucide-react";
import {
  getInstitutions,
  getInstitutionDepartments,
  getInstitutionalLibrary,
  getAccreditationRecords,
  getSaasSubscription,
} from "../../api/institutionSaaSClient";
import {
  InstitutionTenant,
  InstitutionDepartment,
  InstitutionalLibraryResource,
  AccreditationRecord,
  SaasSubscription,
} from "../../types/institution-saas";
import { DepartmentManagerCard } from "./DepartmentManagerCard";
import { InstitutionalLibraryView } from "./InstitutionalLibraryView";
import { AccreditationReportCard } from "./AccreditationReportCard";

export const InstitutionSaaSHub: React.FC = () => {
  const [institutions, setInstitutions] = useState<InstitutionTenant[]>([]);
  const [activeInstId, setActiveInstId] = useState<string>("inst_ldce");
  const [departments, setDepartments] = useState<InstitutionDepartment[]>([]);
  const [library, setLibrary] = useState<InstitutionalLibraryResource[]>([]);
  const [accreditations, setAccreditations] = useState<AccreditationRecord[]>([]);
  const [subscription, setSubscription] = useState<SaasSubscription | null>(null);

  useEffect(() => {
    getInstitutions().then(setInstitutions);
  }, []);

  useEffect(() => {
    getInstitutionDepartments(activeInstId).then(setDepartments);
    getInstitutionalLibrary(activeInstId).then(setLibrary);
    getAccreditationRecords(activeInstId).then(setAccreditations);
    getSaasSubscription(activeInstId).then(setSubscription);
  }, [activeInstId]);

  const currentInst = institutions.find((i) => i.id === activeInstId) || institutions[0];

  return (
    <div className="space-y-6">
      {/* Header & Tenant Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white font-display flex items-center gap-2">
            <Building className="h-6 w-6 text-[#f97316]" /> Institution OS & Campus SaaS
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Multi-tenant B2B operating system for engineering colleges, departments, and accreditation.
          </p>
        </div>

        {/* Institution Switcher */}
        <div className="flex items-center gap-2">
          {institutions.map((inst) => (
            <button
              key={inst.id}
              onClick={() => setActiveInstId(inst.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeInstId === inst.id
                  ? "bg-[#f97316] text-white shadow-md shadow-orange-500/20"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              {inst.code} ({inst.domain})
            </button>
          ))}
        </div>
      </div>

      {/* Subscription Banner */}
      {subscription && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-[#f97316] flex items-center justify-center font-bold">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm">
                {currentInst?.name || "College"} — {subscription.planTier} Plan
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Quota: {subscription.studentLimit} Students • {subscription.facultyLimit} Faculty Members
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> B2B Active (Renews {subscription.renewsAt})
            </span>
          </div>
        </div>
      )}

      {/* Components Grid */}
      <div className="space-y-6">
        <DepartmentManagerCard departments={departments} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InstitutionalLibraryView resources={library} />
          <AccreditationReportCard records={accreditations} />
        </div>
      </div>
    </div>
  );
};
