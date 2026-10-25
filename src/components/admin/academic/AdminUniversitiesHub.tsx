// ============================================================
// SHIKSHA SAHAYAK OS: ADMIN UNIVERSITIES HUB
// Manage institutions, faculties, and cross-university governance
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Building,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { AdminAcademicShell } from './AdminAcademicShell';
import {
  AcademicTabKey,
  UniversityAdminItem,
  AcademicFilterState,
} from '../../../types/academic-management';
import { academicManagementClient } from '../../../api/academicManagementClient';
import { AcademicDetailDrawer } from './AcademicDetailDrawer';
import { UniversityModal, ImpactConfirmModal } from './AcademicModals';
import { AcademicImportExportModal } from './AcademicImportExportModal';

interface AdminUniversitiesHubProps {
  onNavigateToTab: (tab: AcademicTabKey, filters?: Partial<AcademicFilterState>) => void;
}

export const AdminUniversitiesHub: React.FC<AdminUniversitiesHubProps> = ({
  onNavigateToTab,
}) => {
  const [universities, setUniversities] = useState<UniversityAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState<AcademicFilterState>({
    university: 'all',
    branch: 'all',
    semester: 'all',
    academicYear: 'all',
    status: 'all',
    search: '',
  });

  // Drawer & Modal State
  const [selectedUniv, setSelectedUniv] = useState<UniversityAdminItem | null>(null);
  const [editingUniv, setEditingUniv] = useState<UniversityAdminItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingUniv, setDeletingUniv] = useState<UniversityAdminItem | null>(null);
  const [importExportMode, setImportExportMode] = useState<'import' | 'export' | null>(null);

  const handleFilterChange = (key: keyof AcademicFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const loadUniversities = async () => {
    try {
      setIsLoading(true);
      const data = await academicManagementClient.getUniversities(filters);
      setUniversities(data);
    } catch (e) {
      console.error('Failed to load universities:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUniversities();
  }, [filters.status, filters.search]);

  // KPIs
  const totalCount = universities.length;
  const activeCount = universities.filter((u) => u.isActive).length;
  const inactiveCount = totalCount - activeCount;

  const kpis = [
    {
      label: 'Total Institutions',
      value: totalCount,
      subtext: 'Configured institutions',
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      icon: Building2,
    },
    {
      label: 'Active',
      value: activeCount,
      subtext: 'Live on student portal',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: CheckCircle2,
    },
    {
      label: 'Inactive / Draft',
      value: inactiveCount,
      subtext: 'Under curriculum review',
      color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
      icon: Building,
    },
  ];

  return (
    <AdminAcademicShell
      activeTab="universities"
      onTabChange={(tab) => onNavigateToTab(tab)}
      title="Universities"
      description="Manage institutions available across the ShikshaSahayak platform."
      breadcrumbs={[{ label: 'Universities' }]}
      kpis={kpis}
      filters={filters}
      onFilterChange={handleFilterChange}
      onResetFilters={() =>
        setFilters({
          university: 'all',
          branch: 'all',
          semester: 'all',
          academicYear: 'all',
          status: 'all',
          search: '',
        })
      }
      onRefresh={loadUniversities}
      isLoading={isLoading}
      primaryAction={{
        label: 'Add University',
        icon: Plus,
        onClick: () => setIsAddOpen(true),
      }}
      onImportClick={() => setImportExportMode('import')}
      onExportClick={() => setImportExportMode('export')}
    >
      {/* Universities Data Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              Institutions Catalog ({universities.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Click any row to open university details & branch mapping</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
            <span className="text-xs text-slate-400 font-bold">Loading universities catalog...</span>
          </div>
        ) : universities.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-xl space-y-3">
            <Building2 className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Universities Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No institutions matched your filter query. Add a new university to get started.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add University</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="pb-3 font-bold">University Name</th>
                  <th className="pb-3 font-bold">Short Code</th>
                  <th className="pb-3 font-bold">Type</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold">Branches</th>
                  <th className="pb-3 font-bold">Subjects</th>
                  <th className="pb-3 font-bold">Students</th>
                  <th className="pb-3 font-bold">Updated</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {universities.map((univ) => (
                  <tr
                    key={univ.id}
                    onClick={() => setSelectedUniv(univ)}
                    className="hover:bg-slate-900/60 transition cursor-pointer group"
                  >
                    <td className="py-3.5 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold group-hover:text-orange-400 transition">{univ.name}</span>
                          <span className="text-[10px] text-slate-400 block font-normal font-mono">
                            {univ.state}, {univ.country}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 font-mono font-bold text-slate-300">
                      <span className="px-2 py-0.5 bg-slate-800 rounded-md border border-slate-700 text-orange-300">
                        {univ.shortName}
                      </span>
                    </td>

                    <td className="py-3.5 text-slate-300 font-medium">{univ.type || 'State University'}</td>

                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 border ${
                          univ.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${univ.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {univ.status || (univ.isActive ? 'Active' : 'Inactive')}
                      </span>
                    </td>

                    <td className="py-3.5 text-slate-300 font-bold font-mono">{univ.totalBranches}</td>

                    <td className="py-3.5 text-orange-400 font-bold font-mono">{univ.totalSubjects}</td>

                    <td className="py-3.5 text-slate-300 font-bold font-mono">{univ.totalStudents}</td>

                    <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                      {univ.updatedAt ? new Date(univ.updatedAt).toLocaleDateString() : 'Active'}
                    </td>

                    <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigateToTab('branches', { university: univ.id })}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] rounded-lg transition"
                          title="Manage Branches"
                        >
                          Branches
                        </button>
                        <button
                          onClick={() => setEditingUniv(univ)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                          title="Edit University"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingUniv(univ)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Deactivate / Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contextual Slide-out Detail Drawer */}
      <AcademicDetailDrawer
        isOpen={Boolean(selectedUniv)}
        onClose={() => setSelectedUniv(null)}
        entityType="university"
        data={selectedUniv}
        onNavigateToTab={(tab, params) => {
          setSelectedUniv(null);
          onNavigateToTab(tab as AcademicTabKey, params);
        }}
        onEditEntity={(u) => {
          setSelectedUniv(null);
          setEditingUniv(u);
        }}
      />

      {/* Add / Edit University Modals */}
      <UniversityModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={async (data) => {
          await academicManagementClient.saveUniversity(data);
          await loadUniversities();
        }}
      />

      {editingUniv && (
        <UniversityModal
          isOpen={Boolean(editingUniv)}
          initialData={editingUniv}
          onClose={() => setEditingUniv(null)}
          onSave={async (data) => {
            await academicManagementClient.saveUniversity(data);
            await loadUniversities();
          }}
        />
      )}

      {/* Impact Confirmation Dialog */}
      {deletingUniv && (
        <ImpactConfirmModal
          isOpen={Boolean(deletingUniv)}
          onClose={() => setDeletingUniv(null)}
          title={`Deactivate University: ${deletingUniv.name}`}
          message={`Are you sure you want to deactivate ${deletingUniv.name}?`}
          impactInfo={{
            branches: deletingUniv.totalBranches,
            subjects: deletingUniv.totalSubjects,
          }}
          confirmLabel="Deactivate University"
          onConfirm={async () => {
            await academicManagementClient.deleteUniversity(deletingUniv.id, false);
            await loadUniversities();
          }}
        />
      )}

      {/* Import / Export Modal */}
      {importExportMode && (
        <AcademicImportExportModal
          isOpen={Boolean(importExportMode)}
          mode={importExportMode}
          onClose={() => setImportExportMode(null)}
          onImportSuccess={loadUniversities}
        />
      )}
    </AdminAcademicShell>
  );
};
