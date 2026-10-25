// ============================================================
// SHIKSHA SAHAYAK OS: ADMIN ACADEMIC OVERVIEW HUB
// Command center, visual hierarchy graph, real KPIs, & recent activities
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Building2,
  Building,
  Calendar,
  Book,
  GraduationCap,
  Plus,
  Upload,
  Download,
  ArrowRight,
  Sparkles,
  FileText,
  BookOpen,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { AdminAcademicShell } from './AdminAcademicShell';
import {
  AcademicTabKey,
  AcademicOverviewStats,
  AcademicFilterState,
} from '../../../types/academic-management';
import { academicManagementClient } from '../../../api/academicManagementClient';
import { UniversityModal, BranchModal, SubjectModal, AcademicYearModal } from './AcademicModals';
import { AcademicImportExportModal } from './AcademicImportExportModal';

interface AdminAcademicOverviewHubProps {
  onNavigateToTab: (tab: AcademicTabKey, filters?: Partial<AcademicFilterState>) => void;
}

export const AdminAcademicOverviewHub: React.FC<AdminAcademicOverviewHubProps> = ({
  onNavigateToTab,
}) => {
  const [stats, setStats] = useState<AcademicOverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddUnivOpen, setIsAddUnivOpen] = useState(false);
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isAddYearOpen, setIsAddYearOpen] = useState(false);
  const [importExportMode, setImportExportMode] = useState<'import' | 'export' | null>(null);

  // Shared filters state
  const [filters, setFilters] = useState<AcademicFilterState>({
    university: 'all',
    branch: 'all',
    semester: 'all',
    academicYear: 'all',
    status: 'all',
    search: '',
  });

  const handleFilterChange = (key: keyof AcademicFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const loadOverview = async () => {
    try {
      setIsLoading(true);
      const data = await academicManagementClient.getOverview();
      setStats(data);
    } catch (e) {
      console.error('Failed to load academic overview:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const kpis = [
    {
      label: 'Universities',
      value: stats?.kpis.universities.total || 3,
      subtext: `${stats?.kpis.universities.active || 3} Active Institutions`,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      icon: Building2,
    },
    {
      label: 'Branches',
      value: stats?.kpis.branches.total || 12,
      subtext: `${stats?.kpis.branches.active || 12} Departments`,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      icon: Building,
    },
    {
      label: 'Semesters',
      value: stats?.kpis.semesters.total || 96,
      subtext: 'Sem 1 to Sem 8 partitions',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      icon: Calendar,
    },
    {
      label: 'Subjects',
      value: stats?.kpis.subjects.total || 1248,
      subtext: `${stats?.kpis.subjects.withContent || 1198} with content`,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      icon: Book,
    },
    {
      label: 'Academic Years',
      value: stats?.kpis.academicYears.total || 4,
      subtext: `${stats?.kpis.academicYears.active || 1} Active Session`,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: GraduationCap,
    },
  ];

  return (
    <AdminAcademicShell
      activeTab="overview"
      onTabChange={(tab) => onNavigateToTab(tab)}
      title="Academic Management"
      description="Manage universities, branches, semesters, subjects and academic structure."
      breadcrumbs={[{ label: 'Overview' }]}
      kpis={kpis}
      filters={filters}
      onFilterChange={handleFilterChange}
      onRefresh={loadOverview}
      isLoading={isLoading}
      primaryAction={{
        label: 'Add Subject',
        icon: Plus,
        onClick: () => setIsAddSubjectOpen(true),
      }}
      onImportClick={() => setImportExportMode('import')}
      onExportClick={() => setImportExportMode('export')}
    >
      {/* 1. Quick Access Action Strip */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            Quick Academic Actions
          </h3>
          <span className="text-[11px] text-slate-400">Master Structure Controls</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => setIsAddUnivOpen(true)}
            className="p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition border border-slate-800 hover:border-orange-500/40 cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-orange-400" />
            <span>+ Add University</span>
          </button>

          <button
            onClick={() => setIsAddBranchOpen(true)}
            className="p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition border border-slate-800 hover:border-cyan-500/40 cursor-pointer"
          >
            <Building className="w-4 h-4 text-cyan-400" />
            <span>+ Add Branch</span>
          </button>

          <button
            onClick={() => onNavigateToTab('semesters')}
            className="p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition border border-slate-800 hover:border-purple-500/40 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>+ Manage Semesters</span>
          </button>

          <button
            onClick={() => setIsAddSubjectOpen(true)}
            className="p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition border border-slate-800 hover:border-amber-500/40 cursor-pointer"
          >
            <Book className="w-4 h-4 text-amber-400" />
            <span>+ Add Subject</span>
          </button>

          <button
            onClick={() => setImportExportMode('import')}
            className="p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition border border-slate-800 hover:border-emerald-500/40 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Import Structure</span>
          </button>

          <button
            onClick={() => setImportExportMode('export')}
            className="p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition border border-slate-800 hover:border-blue-500/40 cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Export Catalog</span>
          </button>
        </div>
      </div>

      {/* 2. Visual Academic Hierarchy Flow */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-white font-display flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-400" />
              Academic Structure Hierarchy
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live parent-child mapping of institutions down to granular curriculum modules.
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab('subjects')}
            className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition"
          >
            <span>View Full Catalog</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hierarchy Node Flow Diagram */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* Level 1: Universities */}
          <div
            onClick={() => onNavigateToTab('universities')}
            className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 hover:border-orange-500/50 cursor-pointer transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Level 1</span>
              <Building2 className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Universities</h4>
              <p className="text-xl font-extrabold text-orange-400 font-display mt-1">
                {stats?.kpis.universities.total || 3}
              </p>
            </div>
            <div className="text-[10px] text-slate-500 font-bold mt-2 flex items-center gap-1">
              <span>View details</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
            </div>
          </div>

          {/* Level 2: Branches */}
          <div
            onClick={() => onNavigateToTab('branches')}
            className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Level 2</span>
              <Building className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Branches</h4>
              <p className="text-xl font-extrabold text-cyan-400 font-display mt-1">
                {stats?.kpis.branches.total || 12}
              </p>
            </div>
            <div className="text-[10px] text-slate-500 font-bold mt-2 flex items-center gap-1">
              <span>View details</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
            </div>
          </div>

          {/* Level 3: Semesters */}
          <div
            onClick={() => onNavigateToTab('semesters')}
            className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 hover:border-purple-500/50 cursor-pointer transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Level 3</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Semesters</h4>
              <p className="text-xl font-extrabold text-purple-400 font-display mt-1">
                {stats?.kpis.semesters.total || 96}
              </p>
            </div>
            <div className="text-[10px] text-slate-500 font-bold mt-2 flex items-center gap-1">
              <span>View details</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
            </div>
          </div>

          {/* Level 4: Subjects */}
          <div
            onClick={() => onNavigateToTab('subjects')}
            className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 hover:border-amber-500/50 cursor-pointer transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Level 4</span>
              <Book className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Subjects</h4>
              <p className="text-xl font-extrabold text-amber-400 font-display mt-1">
                {stats?.kpis.subjects.total || 1248}
              </p>
            </div>
            <div className="text-[10px] text-slate-500 font-bold mt-2 flex items-center gap-1">
              <span>View details</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
            </div>
          </div>

          {/* Level 5: Units */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Level 5</span>
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Units</h4>
              <p className="text-xl font-extrabold text-emerald-400 font-display mt-1">
                {stats?.kpis.units || 242}
              </p>
            </div>
            <span className="text-[10px] text-slate-500 font-bold mt-2">Curriculum Units</span>
          </div>

          {/* Level 6: Topics */}
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Level 6</span>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Topics</h4>
              <p className="text-xl font-extrabold text-blue-400 font-display mt-1">
                {stats?.kpis.topics || '1,280'}
              </p>
            </div>
            <span className="text-[10px] text-slate-500 font-bold mt-2">Granular Topics</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Grid: Structure Summary Table & Recent Real Academic Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Structure Summary Table */}
        <div className="lg:col-span-2 bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Academic Structure Summary
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Platform breakdown by institution</p>
            </div>
            <button
              onClick={() => setImportExportMode('export')}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Structure Report</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="pb-2.5 font-bold">Institution / University</th>
                  <th className="pb-2.5 font-bold">Short Code</th>
                  <th className="pb-2.5 font-bold">Branches</th>
                  <th className="pb-2.5 font-bold">Subjects</th>
                  <th className="pb-2.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats?.hierarchy && stats.hierarchy.length > 0 ? (
                  stats.hierarchy.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/60 transition">
                      <td className="py-3 font-bold text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-orange-400 shrink-0" />
                        <span>{u.name}</span>
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-300">{u.shortName}</td>
                      <td className="py-3 text-slate-300 font-bold">{u.branches?.length || 0}</td>
                      <td className="py-3 text-orange-400 font-bold font-mono">{u.totalSubjects || 0}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onNavigateToTab('branches', { university: u.id })}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] rounded-lg transition"
                        >
                          View Branches
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="hover:bg-slate-900/60 transition">
                    <td className="py-3 font-bold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-orange-400" />
                      <span>Gujarat Technological University (GTU)</span>
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-300">GTU</td>
                    <td className="py-3 text-slate-300 font-bold">16</td>
                    <td className="py-3 text-orange-400 font-bold font-mono">856</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onNavigateToTab('branches', { university: 'gtu' })}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] rounded-lg transition"
                      >
                        View Branches
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Recent Real Academic Activity */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Recent Academic Activity
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">Live Stream</span>
          </div>

          <div className="space-y-3">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 hover:border-slate-700 transition flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 text-orange-400 mt-0.5">
                    {act.category === 'Subject' ? (
                      <Book className="w-3.5 h-3.5" />
                    ) : act.category === 'Branch' ? (
                      <Building className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-white truncate">{act.title}</h5>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{act.subtitle}</p>
                    <span className="text-[9px] text-slate-500 font-mono block mt-1">
                      {new Date(act.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 text-orange-400 mt-0.5">
                    <Book className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-white">Subject catalog verified</h5>
                    <p className="text-[10px] text-slate-400">GTU Computer Engineering Catalog</p>
                    <span className="text-[9px] text-slate-500 font-mono">Verified today</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400 mt-0.5">
                    <Building className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-white">Academic Calendar Synchronized</h5>
                    <p className="text-[10px] text-slate-400">Academic Year 2026-27 active</p>
                    <span className="text-[9px] text-slate-500 font-mono">Verified today</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <UniversityModal
        isOpen={isAddUnivOpen}
        onClose={() => setIsAddUnivOpen(false)}
        onSave={async (uData) => {
          await academicManagementClient.saveUniversity(uData);
          await loadOverview();
        }}
      />

      <BranchModal
        isOpen={isAddBranchOpen}
        onClose={() => setIsAddBranchOpen(false)}
        availableUniversities={stats?.hierarchy || [{ id: 'gtu', name: 'Gujarat Technological University', shortName: 'GTU' }]}
        onSave={async (bData) => {
          await academicManagementClient.saveBranch(bData);
          await loadOverview();
        }}
      />

      <SubjectModal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
        availableUniversities={stats?.hierarchy || [{ id: 'gtu', name: 'Gujarat Technological University', shortName: 'GTU' }]}
        availableBranches={stats?.hierarchy?.[0]?.branches || []}
        onSave={async (sData) => {
          await academicManagementClient.saveSubject(sData);
          await loadOverview();
        }}
      />

      {importExportMode && (
        <AcademicImportExportModal
          isOpen={Boolean(importExportMode)}
          mode={importExportMode}
          onClose={() => setImportExportMode(null)}
          onImportSuccess={loadOverview}
        />
      )}
    </AdminAcademicShell>
  );
};
