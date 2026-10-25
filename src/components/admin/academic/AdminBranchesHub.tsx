// ============================================================
// SHIKSHA SAHAYAK OS: ADMIN BRANCHES HUB
// Manage university-linked departments, semesters, & subjects
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Building,
  Building2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Layers,
  CheckCircle2,
  Calendar,
  Book,
  Loader2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { AdminAcademicShell } from './AdminAcademicShell';
import {
  AcademicTabKey,
  BranchAdminItem,
  UniversityAdminItem,
  AcademicFilterState,
} from '../../../types/academic-management';
import { academicManagementClient } from '../../../api/academicManagementClient';
import { AcademicDetailDrawer } from './AcademicDetailDrawer';
import { BranchModal, ImpactConfirmModal } from './AcademicModals';
import { AcademicImportExportModal } from './AcademicImportExportModal';

interface AdminBranchesHubProps {
  onNavigateToTab: (tab: AcademicTabKey, filters?: Partial<AcademicFilterState>) => void;
  initialFilters?: Partial<AcademicFilterState>;
}

export const AdminBranchesHub: React.FC<AdminBranchesHubProps> = ({
  onNavigateToTab,
  initialFilters,
}) => {
  const [branches, setBranches] = useState<BranchAdminItem[]>([]);
  const [universities, setUniversities] = useState<UniversityAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState<AcademicFilterState>({
    university: initialFilters?.university || 'all',
    branch: 'all',
    semester: 'all',
    academicYear: 'all',
    status: 'all',
    search: '',
  });

  // Selected for Bulk Action
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Drawer & Modal State
  const [selectedBranch, setSelectedBranch] = useState<BranchAdminItem | null>(null);
  const [editingBranch, setEditingBranch] = useState<BranchAdminItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingBranch, setDeletingBranch] = useState<BranchAdminItem | null>(null);
  const [importExportMode, setImportExportMode] = useState<'import' | 'export' | null>(null);

  const handleFilterChange = (key: keyof AcademicFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [bData, uData] = await Promise.all([
        academicManagementClient.getBranches(filters),
        academicManagementClient.getUniversities(),
      ]);
      setBranches(bData);
      setUniversities(uData);
    } catch (e) {
      console.error('Failed to load branches:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.university, filters.status, filters.search]);

  // Bulk Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.length === branches.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(branches.map((b) => b.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Activation / Deactivation
  const handleBulkStatus = async (activate: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      setIsLoading(true);
      for (const id of selectedIds) {
        await academicManagementClient.saveBranch({ id, isActive: activate });
      }
      setSelectedIds([]);
      await loadData();
    } catch (e) {
      console.error('Bulk update error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // KPIs
  const totalCount = branches.length;
  const activeCount = branches.filter((b) => b.isActive).length;
  const inactiveCount = totalCount - activeCount;

  const kpis = [
    {
      label: 'Total Branches',
      value: totalCount,
      subtext: 'Across all universities',
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      icon: Building,
    },
    {
      label: 'Active Departments',
      value: activeCount,
      subtext: 'Catalog active',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: CheckCircle2,
    },
    {
      label: 'Inactive / Draft',
      value: inactiveCount,
      subtext: 'Pending review',
      color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
      icon: Layers,
    },
  ];

  return (
    <AdminAcademicShell
      activeTab="branches"
      onTabChange={(tab) => onNavigateToTab(tab)}
      title="Branches"
      description="Manage university-specific academic branches and departments."
      breadcrumbs={[{ label: 'Branches' }]}
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
      availableUniversities={universities}
      onRefresh={loadData}
      isLoading={isLoading}
      primaryAction={{
        label: 'Add Branch',
        icon: Plus,
        onClick: () => setIsAddOpen(true),
      }}
      onImportClick={() => setImportExportMode('import')}
      onExportClick={() => setImportExportMode('export')}
    >
      {/* Branches Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Table Top Controls & Bulk Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              Departments Catalog ({branches.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Click any row to open branch details and curriculum mapping</p>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <span className="font-bold text-orange-400 font-mono">{selectedIds.length} Selected</span>
              <button
                onClick={() => handleBulkStatus(true)}
                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg font-bold text-[11px] transition"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkStatus(false)}
                className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg font-bold text-[11px] transition"
              >
                Deactivate
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
            <span className="text-xs text-slate-400 font-bold">Loading branches...</span>
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-xl space-y-3">
            <Building className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Branches Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No branch matched your current filter criteria. Add a new branch or reset filters.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Branch</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="pb-3 w-8">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                      {selectedIds.length === branches.length ? (
                        <CheckSquare className="w-4 h-4 text-orange-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="pb-3 font-bold">Branch Name</th>
                  <th className="pb-3 font-bold">University</th>
                  <th className="pb-3 font-bold">Code</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold">Semesters</th>
                  <th className="pb-3 font-bold">Subjects</th>
                  <th className="pb-3 font-bold">Students</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {branches.map((branch) => (
                  <tr
                    key={branch.id}
                    onClick={() => setSelectedBranch(branch)}
                    className="hover:bg-slate-900/60 transition cursor-pointer group"
                  >
                    <td className="py-3.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleSelect(branch.id)}
                        className="text-slate-500 hover:text-white"
                      >
                        {selectedIds.includes(branch.id) ? (
                          <CheckSquare className="w-4 h-4 text-orange-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold shrink-0">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold group-hover:text-orange-400 transition">{branch.name}</span>
                          <span className="text-[10px] text-slate-400 block font-normal font-mono">
                            Slug: {branch.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 text-slate-300 font-medium">
                      <span className="px-2 py-0.5 bg-slate-800 rounded-md border border-slate-700 text-slate-300">
                        {branch.universityShort || branch.universityName}
                      </span>
                    </td>

                    <td className="py-3.5 font-mono font-bold text-slate-300">
                      <span className="px-2 py-0.5 bg-slate-800 rounded-md border border-slate-700 text-orange-300">
                        {branch.code || branch.shortName}
                      </span>
                    </td>

                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 border ${
                          branch.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${branch.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {branch.status || (branch.isActive ? 'Active' : 'Inactive')}
                      </span>
                    </td>

                    <td className="py-3.5 text-slate-300 font-bold font-mono">8 Semesters</td>

                    <td className="py-3.5 text-orange-400 font-bold font-mono">{branch.totalSubjects}</td>

                    <td className="py-3.5 text-slate-300 font-bold font-mono">{branch.totalStudents}</td>

                    <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() =>
                            onNavigateToTab('subjects', {
                              university: branch.universityId,
                              branch: branch.id,
                            })
                          }
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] rounded-lg transition"
                          title="View Subjects"
                        >
                          Subjects
                        </button>
                        <button
                          onClick={() => setEditingBranch(branch)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                          title="Edit Branch"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingBranch(branch)}
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
        isOpen={Boolean(selectedBranch)}
        onClose={() => setSelectedBranch(null)}
        entityType="branch"
        data={selectedBranch}
        onNavigateToTab={(tab, params) => {
          setSelectedBranch(null);
          onNavigateToTab(tab as AcademicTabKey, params);
        }}
        onEditEntity={(b) => {
          setSelectedBranch(null);
          setEditingBranch(b);
        }}
      />

      {/* Add / Edit Branch Modals */}
      <BranchModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        availableUniversities={universities}
        onSave={async (data) => {
          await academicManagementClient.saveBranch(data);
          await loadData();
        }}
      />

      {editingBranch && (
        <BranchModal
          isOpen={Boolean(editingBranch)}
          initialData={editingBranch}
          availableUniversities={universities}
          onClose={() => setEditingBranch(null)}
          onSave={async (data) => {
            await academicManagementClient.saveBranch(data);
            await loadData();
          }}
        />
      )}

      {/* Impact Confirmation Dialog */}
      {deletingBranch && (
        <ImpactConfirmModal
          isOpen={Boolean(deletingBranch)}
          onClose={() => setDeletingBranch(null)}
          title={`Deactivate Branch: ${deletingBranch.name}`}
          message={`Are you sure you want to deactivate ${deletingBranch.name}?`}
          impactInfo={{
            subjects: deletingBranch.totalSubjects,
          }}
          confirmLabel="Deactivate Branch"
          onConfirm={async () => {
            await academicManagementClient.deleteBranch(deletingBranch.id, false);
            await loadData();
          }}
        />
      )}

      {/* Import / Export Modal */}
      {importExportMode && (
        <AcademicImportExportModal
          isOpen={Boolean(importExportMode)}
          mode={importExportMode}
          onClose={() => setImportExportMode(null)}
          onImportSuccess={loadData}
        />
      )}
    </AdminAcademicShell>
  );
};
