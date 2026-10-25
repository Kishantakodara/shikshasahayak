// ============================================================
// SHIKSHA SAHAYAK OS: ADMIN SEMESTERS HUB
// Manage deterministic semester partitions, branch bindings, & subject counts
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Building,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Book,
  ChevronRight,
  Layers,
  Loader2,
  ArrowUpDown,
} from 'lucide-react';
import { AdminAcademicShell } from './AdminAcademicShell';
import {
  AcademicTabKey,
  SemesterAdminItem,
  UniversityAdminItem,
  BranchAdminItem,
  AcademicFilterState,
} from '../../../types/academic-management';
import { academicManagementClient } from '../../../api/academicManagementClient';
import { AcademicDetailDrawer } from './AcademicDetailDrawer';
import { AcademicImportExportModal } from './AcademicImportExportModal';

interface AdminSemestersHubProps {
  onNavigateToTab: (tab: AcademicTabKey, filters?: Partial<AcademicFilterState>) => void;
  initialFilters?: Partial<AcademicFilterState>;
}

export const AdminSemestersHub: React.FC<AdminSemestersHubProps> = ({
  onNavigateToTab,
  initialFilters,
}) => {
  const [semesters, setSemesters] = useState<SemesterAdminItem[]>([]);
  const [universities, setUniversities] = useState<UniversityAdminItem[]>([]);
  const [branches, setBranches] = useState<BranchAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState<AcademicFilterState>({
    university: initialFilters?.university || 'all',
    branch: initialFilters?.branch || 'all',
    semester: 'all',
    academicYear: '2026-27',
    status: 'all',
    search: '',
  });

  // Drawer & Modal State
  const [selectedSemester, setSelectedSemester] = useState<SemesterAdminItem | null>(null);
  const [importExportMode, setImportExportMode] = useState<'import' | 'export' | null>(null);

  const handleFilterChange = (key: keyof AcademicFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [sData, uData, bData] = await Promise.all([
        academicManagementClient.getSemesters(filters),
        academicManagementClient.getUniversities(),
        academicManagementClient.getBranches(),
      ]);
      setSemesters(sData);
      setUniversities(uData);
      setBranches(bData);
    } catch (e) {
      console.error('Failed to load semesters:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.university, filters.branch, filters.academicYear, filters.status, filters.search]);

  // KPIs
  const totalCount = semesters.length;
  const activeCount = semesters.filter((s) => s.isActive).length;
  const totalSubjectsCount = semesters.reduce((acc, s) => acc + (s.subjectsCount || 0), 0);

  const kpis = [
    {
      label: 'Configured Semesters',
      value: totalCount,
      subtext: 'Across all active branches',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      icon: Calendar,
    },
    {
      label: 'Active Semesters',
      value: activeCount,
      subtext: 'Session 2026-27 live',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: CheckCircle2,
    },
    {
      label: 'Mapped Subjects',
      value: totalSubjectsCount,
      subtext: 'Across all semester tracks',
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      icon: Book,
    },
  ];

  return (
    <AdminAcademicShell
      activeTab="semesters"
      onTabChange={(tab) => onNavigateToTab(tab)}
      title="Semesters"
      description="Manage semester definitions and ordering across universities and branches."
      breadcrumbs={[{ label: 'Semesters' }]}
      kpis={kpis}
      filters={filters}
      onFilterChange={handleFilterChange}
      onResetFilters={() =>
        setFilters({
          university: 'all',
          branch: 'all',
          semester: 'all',
          academicYear: '2026-27',
          status: 'all',
          search: '',
        })
      }
      availableUniversities={universities}
      availableBranches={branches}
      onRefresh={loadData}
      isLoading={isLoading}
      onImportClick={() => setImportExportMode('import')}
      onExportClick={() => setImportExportMode('export')}
    >
      {/* Semesters Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              Semester Definitions & Hierarchy ({semesters.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Deterministic Semester 1 to Semester 8 structure per branch</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
            <span className="text-xs text-slate-400 font-bold">Loading semester definitions...</span>
          </div>
        ) : semesters.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-xl space-y-3">
            <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Semesters Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No semester structure matched your filters. Adjust filters to inspect the catalog.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="pb-3 font-bold">Semester</th>
                  <th className="pb-3 font-bold">University</th>
                  <th className="pb-3 font-bold">Branch / Department</th>
                  <th className="pb-3 font-bold">Order</th>
                  <th className="pb-3 font-bold">Academic Year</th>
                  <th className="pb-3 font-bold">Subjects Count</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {semesters.map((sem) => (
                  <tr
                    key={sem.id}
                    onClick={() => setSelectedSemester(sem)}
                    className="hover:bg-slate-900/60 transition cursor-pointer group"
                  >
                    <td className="py-3.5 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold shrink-0 font-mono">
                          {sem.semesterNumber}
                        </div>
                        <div>
                          <span className="font-extrabold group-hover:text-orange-400 transition">{sem.name}</span>
                          <span className="text-[10px] text-slate-400 block font-normal font-mono">
                            {sem.branchShort}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 text-slate-300 font-medium">
                      <span className="px-2 py-0.5 bg-slate-800 rounded-md border border-slate-700 text-slate-300">
                        {sem.universityShort || sem.universityName}
                      </span>
                    </td>

                    <td className="py-3.5 font-bold text-slate-200">{sem.branchName}</td>

                    <td className="py-3.5 font-mono font-bold text-slate-400">
                      <span className="px-2 py-0.5 bg-slate-800/60 rounded-md border border-slate-700/60">
                        Order {sem.order}
                      </span>
                    </td>

                    <td className="py-3.5 font-mono text-slate-300">{sem.academicYear || '2026-27'}</td>

                    <td className="py-3.5">
                      <span className="font-bold text-orange-400 font-mono">
                        {sem.subjectsCount} {sem.subjectsCount === 1 ? 'Subject' : 'Subjects'}
                      </span>
                    </td>

                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 border ${
                          sem.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${sem.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {sem.status || (sem.isActive ? 'Active' : 'Inactive')}
                      </span>
                    </td>

                    <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() =>
                          onNavigateToTab('subjects', {
                            university: sem.universityId,
                            branch: sem.branchId,
                            semester: String(sem.semesterNumber),
                          })
                        }
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] rounded-lg transition"
                        title="Manage Subjects"
                      >
                        View Subjects
                      </button>
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
        isOpen={Boolean(selectedSemester)}
        onClose={() => setSelectedSemester(null)}
        entityType="semester"
        data={selectedSemester}
        onNavigateToTab={(tab, params) => {
          setSelectedSemester(null);
          onNavigateToTab(tab as AcademicTabKey, params);
        }}
      />

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
