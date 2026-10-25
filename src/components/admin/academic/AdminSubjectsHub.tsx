// ============================================================
// SHIKSHA SAHAYAK OS: ADMIN MASTER SUBJECTS HUB
// Manage master academic subject catalog, content coverage, & cross-links
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Book,
  Building,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
  BookOpen,
  FileText,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Loader2,
  CheckSquare,
  Square,
  BarChart2,
} from 'lucide-react';
import { AdminAcademicShell } from './AdminAcademicShell';
import {
  AcademicTabKey,
  SubjectAdminItem,
  UniversityAdminItem,
  BranchAdminItem,
  AcademicFilterState,
} from '../../../types/academic-management';
import { academicManagementClient } from '../../../api/academicManagementClient';
import { AcademicDetailDrawer } from './AcademicDetailDrawer';
import { SubjectModal, ImpactConfirmModal } from './AcademicModals';
import { AcademicImportExportModal } from './AcademicImportExportModal';

interface AdminSubjectsHubProps {
  onNavigateToTab: (tab: string, filters?: any) => void;
  initialFilters?: Partial<AcademicFilterState>;
}

export const AdminSubjectsHub: React.FC<AdminSubjectsHubProps> = ({
  onNavigateToTab,
  initialFilters,
}) => {
  const [subjects, setSubjects] = useState<SubjectAdminItem[]>([]);
  const [universities, setUniversities] = useState<UniversityAdminItem[]>([]);
  const [branches, setBranches] = useState<BranchAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState<AcademicFilterState>({
    university: initialFilters?.university || 'all',
    branch: initialFilters?.branch || 'all',
    semester: initialFilters?.semester || 'all',
    academicYear: 'all',
    status: 'all',
    search: '',
  });

  // Selected for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Drawer & Modal State
  const [selectedSubject, setSelectedSubject] = useState<SubjectAdminItem | null>(null);
  const [editingSubject, setEditingSubject] = useState<SubjectAdminItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState<SubjectAdminItem | null>(null);
  const [importExportMode, setImportExportMode] = useState<'import' | 'export' | null>(null);

  const handleFilterChange = (key: keyof AcademicFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sData, uData, bData] = await Promise.all([
        academicManagementClient.getSubjects(filters),
        academicManagementClient.getUniversities(),
        academicManagementClient.getBranches(),
      ]);
      setSubjects(sData);
      setUniversities(uData);
      setBranches(bData);
    } catch (e) {
      console.error('Failed to load subjects:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.university, filters.branch, filters.semester, filters.status, filters.search]);

  // Bulk Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === subjects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(subjects.map((s) => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkStatus = async (activate: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      setIsLoading(true);
      for (const id of selectedIds) {
        await academicManagementClient.saveSubject({ id, isActive: activate });
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
  const totalCount = subjects.length;
  const activeCount = subjects.filter((s) => s.isActive).length;
  const withContentCount = subjects.filter((s) => s.hasContent).length;
  const withoutContentCount = totalCount - withContentCount;

  const kpis = [
    {
      label: 'Total Subjects',
      value: totalCount,
      subtext: 'Catalog catalogued',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      icon: Book,
    },
    {
      label: 'Active Subjects',
      value: activeCount,
      subtext: 'Live on student portal',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: CheckCircle2,
    },
    {
      label: 'With Content',
      value: withContentCount,
      subtext: 'Notes & PYQs linked',
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      icon: BookOpen,
    },
    {
      label: 'Without Content',
      value: withoutContentCount,
      subtext: 'Requires curriculum ingestion',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      icon: FileText,
    },
  ];

  return (
    <AdminAcademicShell
      activeTab="subjects"
      onTabChange={(tab) => onNavigateToTab(tab)}
      title="Subjects"
      description="Manage the master academic subject catalog, syllabus mappings, and content coverage."
      breadcrumbs={[{ label: 'Subjects' }]}
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
      availableBranches={branches}
      onRefresh={loadData}
      isLoading={isLoading}
      primaryAction={{
        label: 'Add Subject',
        icon: Plus,
        onClick: () => setIsAddOpen(true),
      }}
      onImportClick={() => setImportExportMode('import')}
      onExportClick={() => setImportExportMode('export')}
    >
      {/* Master Subject Catalog Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Table Top Controls & Bulk Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              Course Subjects Catalog ({subjects.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any subject to inspect units, topics, syllabus, study materials, and content coverage
            </p>
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
            <span className="text-xs text-slate-400 font-bold">Loading master subjects...</span>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-xl space-y-3">
            <Book className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Subjects Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No subjects matched your search or branch/semester filters. Add a new subject or import catalog.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="pb-3 w-8">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                      {selectedIds.length === subjects.length ? (
                        <CheckSquare className="w-4 h-4 text-orange-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="pb-3 font-bold">Subject Name</th>
                  <th className="pb-3 font-bold">Code</th>
                  <th className="pb-3 font-bold">Branch & Semester</th>
                  <th className="pb-3 font-bold">Credits</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold">Content Coverage</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {subjects.map((subject) => (
                  <tr
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject)}
                    className="hover:bg-slate-900/60 transition cursor-pointer group"
                  >
                    <td className="py-3.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleSelect(subject.id)}
                        className="text-slate-500 hover:text-white"
                      >
                        {selectedIds.includes(subject.id) ? (
                          <CheckSquare className="w-4 h-4 text-orange-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 font-bold text-white max-w-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold shrink-0">
                          <Book className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold group-hover:text-orange-400 transition truncate block">
                            {subject.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal font-mono truncate">
                            {subject.universityShort || 'GTU'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 font-mono font-bold text-slate-300">
                      {subject.code ? (
                        <span className="px-2 py-0.5 bg-slate-800 rounded-md border border-slate-700 text-orange-300">
                          {subject.code}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-normal">N/A</span>
                      )}
                    </td>

                    <td className="py-3.5 text-slate-300 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-md text-[10px] font-bold">
                          Sem {subject.semester}
                        </span>
                        <span className="font-bold text-slate-200 truncate">{subject.branchShort || subject.branchName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 font-mono text-slate-300 font-bold">{subject.credits || 4}</td>

                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 border ${
                          subject.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${subject.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {subject.status || (subject.isActive ? 'Active' : 'Inactive')}
                      </span>
                    </td>

                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              subject.contentCoverage > 50
                                ? 'bg-emerald-500'
                                : subject.contentCoverage > 0
                                ? 'bg-amber-500'
                                : 'bg-slate-700'
                            }`}
                            style={{ width: `${Math.max(5, subject.contentCoverage)}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-300">
                          {subject.contentCoverage}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingSubject(subject)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                          title="Edit Subject"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingSubject(subject)}
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
        isOpen={Boolean(selectedSubject)}
        onClose={() => setSelectedSubject(null)}
        entityType="subject"
        data={selectedSubject}
        onNavigateToTab={(tab, params) => {
          setSelectedSubject(null);
          onNavigateToTab(tab, params);
        }}
        onEditEntity={(s) => {
          setSelectedSubject(null);
          setEditingSubject(s);
        }}
      />

      {/* Add / Edit Subject Modals */}
      <SubjectModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        availableUniversities={universities}
        availableBranches={branches}
        onSave={async (data) => {
          await academicManagementClient.saveSubject(data);
          await loadData();
        }}
      />

      {editingSubject && (
        <SubjectModal
          isOpen={Boolean(editingSubject)}
          initialData={editingSubject}
          availableUniversities={universities}
          availableBranches={branches}
          onClose={() => setEditingSubject(null)}
          onSave={async (data) => {
            await academicManagementClient.saveSubject(data);
            await loadData();
          }}
        />
      )}

      {/* Impact Confirmation Dialog */}
      {deletingSubject && (
        <ImpactConfirmModal
          isOpen={Boolean(deletingSubject)}
          onClose={() => setDeletingSubject(null)}
          title={`Deactivate Subject: ${deletingSubject.name}`}
          message={`Are you sure you want to deactivate ${deletingSubject.name}?`}
          impactInfo={{
            documents: (deletingSubject.materialsCount || 0) + (deletingSubject.pyqsCount || 0),
          }}
          confirmLabel="Deactivate Subject"
          onConfirm={async () => {
            await academicManagementClient.deleteSubject(deletingSubject.id, false);
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
