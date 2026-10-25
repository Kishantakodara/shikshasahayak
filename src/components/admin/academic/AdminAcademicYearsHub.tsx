// ============================================================
// SHIKSHA SAHAYAK OS: ADMIN ACADEMIC YEARS HUB
// Manage calendar sessions & enforce single active year rule
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  Book,
  Edit2,
  Archive,
  Loader2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { AdminAcademicShell } from './AdminAcademicShell';
import {
  AcademicTabKey,
  AcademicYearAdminItem,
  AcademicFilterState,
} from '../../../types/academic-management';
import { academicManagementClient } from '../../../api/academicManagementClient';
import { AcademicDetailDrawer } from './AcademicDetailDrawer';
import { AcademicYearModal, ImpactConfirmModal } from './AcademicModals';

interface AdminAcademicYearsHubProps {
  onNavigateToTab: (tab: AcademicTabKey, filters?: Partial<AcademicFilterState>) => void;
}

export const AdminAcademicYearsHub: React.FC<AdminAcademicYearsHubProps> = ({
  onNavigateToTab,
}) => {
  const [academicYears, setAcademicYears] = useState<AcademicYearAdminItem[]>([]);
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
  const [selectedYear, setSelectedYear] = useState<AcademicYearAdminItem | null>(null);
  const [editingYear, setEditingYear] = useState<AcademicYearAdminItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [archivingYear, setArchivingYear] = useState<AcademicYearAdminItem | null>(null);

  const handleFilterChange = (key: keyof AcademicFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await academicManagementClient.getAcademicYears(filters);
      setAcademicYears(data);
    } catch (e) {
      console.error('Failed to load academic years:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.status]);

  // Set single active year
  const handleSetActive = async (yearItem: AcademicYearAdminItem) => {
    try {
      setIsLoading(true);
      await academicManagementClient.saveAcademicYear({
        id: yearItem.id,
        year: yearItem.year,
        startDate: yearItem.startDate,
        endDate: yearItem.endDate,
        status: 'Active',
      });
      await loadData();
    } catch (e) {
      console.error('Failed to set active year:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // KPIs
  const totalCount = academicYears.length;
  const activeCount = academicYears.filter((y) => y.status === 'Active').length;
  const upcomingCount = academicYears.filter((y) => y.status === 'Upcoming').length;

  const kpis = [
    {
      label: 'Calendar Sessions',
      value: totalCount,
      subtext: 'Configured academic years',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: GraduationCap,
    },
    {
      label: 'Current Active Year',
      value: academicYears.find((y) => y.status === 'Active')?.year || '2026-27',
      subtext: 'Live on student portal',
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      icon: CheckCircle2,
    },
    {
      label: 'Upcoming Sessions',
      value: upcomingCount,
      subtext: 'Future curriculum planning',
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      icon: Calendar,
    },
  ];

  return (
    <AdminAcademicShell
      activeTab="academic-years"
      onTabChange={(tab) => onNavigateToTab(tab)}
      title="Academic Years"
      description="Manage academic calendar periods and enforce single active session business rules."
      breadcrumbs={[{ label: 'Academic Years' }]}
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
      onRefresh={loadData}
      isLoading={isLoading}
      primaryAction={{
        label: 'Add Academic Year',
        icon: Plus,
        onClick: () => setIsAddOpen(true),
      }}
    >
      {/* Academic Years Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
              Academic Calendar Sessions ({academicYears.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Only one academic year is active at any time to guarantee curriculum consistency
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-7 h-7 text-orange-500 animate-spin" />
            <span className="text-xs text-slate-400 font-bold">Loading academic sessions...</span>
          </div>
        ) : academicYears.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-xl space-y-3">
            <GraduationCap className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Academic Years Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add your first academic calendar period to start structuring session documents.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Academic Year</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="pb-3 font-bold">Academic Year</th>
                  <th className="pb-3 font-bold">Start Date</th>
                  <th className="pb-3 font-bold">End Date</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold">Universities</th>
                  <th className="pb-3 font-bold">Branches</th>
                  <th className="pb-3 font-bold">Subjects</th>
                  <th className="pb-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {academicYears.map((ay) => (
                  <tr
                    key={ay.id}
                    onClick={() => setSelectedYear(ay)}
                    className="hover:bg-slate-900/60 transition cursor-pointer group"
                  >
                    <td className="py-3.5 font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold group-hover:text-orange-400 transition font-mono">
                            {ay.year}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {ay.description || `Academic Session ${ay.year}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 font-mono text-slate-300">
                      {new Date(ay.startDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 font-mono text-slate-300">
                      {new Date(ay.endDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 border ${
                          ay.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : ay.status === 'Upcoming'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            : ay.status === 'Archived'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            ay.status === 'Active'
                              ? 'bg-emerald-400'
                              : ay.status === 'Upcoming'
                              ? 'bg-cyan-400'
                              : 'bg-slate-400'
                          }`}
                        />
                        {ay.status}
                      </span>
                    </td>

                    <td className="py-3.5 text-slate-300 font-mono font-bold">{ay.universitiesCount}</td>
                    <td className="py-3.5 text-slate-300 font-mono font-bold">{ay.branchesCount}</td>
                    <td className="py-3.5 text-orange-400 font-mono font-bold">{ay.subjectsCount}</td>

                    <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {ay.status !== 'Active' && (
                          <button
                            onClick={() => handleSetActive(ay)}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[11px] rounded-lg transition flex items-center gap-1"
                            title="Set as Current Active Year"
                          >
                            <Check className="w-3 h-3" />
                            <span>Set Active</span>
                          </button>
                        )}
                        <button
                          onClick={() => setEditingYear(ay)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                          title="Edit Year"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {ay.status !== 'Archived' && (
                          <button
                            onClick={() => setArchivingYear(ay)}
                            className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition"
                            title="Archive Year"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
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
        isOpen={Boolean(selectedYear)}
        onClose={() => setSelectedYear(null)}
        entityType="academic-year"
        data={selectedYear}
        onNavigateToTab={(tab, params) => {
          setSelectedYear(null);
          onNavigateToTab(tab as AcademicTabKey, params);
        }}
        onEditEntity={(y) => {
          setSelectedYear(null);
          setEditingYear(y);
        }}
      />

      {/* Add / Edit Academic Year Modals */}
      <AcademicYearModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={async (data) => {
          await academicManagementClient.saveAcademicYear(data);
          await loadData();
        }}
      />

      {editingYear && (
        <AcademicYearModal
          isOpen={Boolean(editingYear)}
          initialData={editingYear}
          onClose={() => setEditingYear(null)}
          onSave={async (data) => {
            await academicManagementClient.saveAcademicYear(data);
            await loadData();
          }}
        />
      )}

      {/* Impact / Archive Confirmation Dialog */}
      {archivingYear && (
        <ImpactConfirmModal
          isOpen={Boolean(archivingYear)}
          onClose={() => setArchivingYear(null)}
          title={`Archive Academic Year: ${archivingYear.year}`}
          message={`Are you sure you want to archive academic year ${archivingYear.year}? Historical documents and PYQs will remain accessible.`}
          confirmLabel="Archive Academic Year"
          isDestructive={false}
          onConfirm={async () => {
            await academicManagementClient.deleteAcademicYear(archivingYear.id);
            await loadData();
          }}
        />
      )}
    </AdminAcademicShell>
  );
};
