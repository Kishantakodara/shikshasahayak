// ============================================================
// SHIKSHA SAHAYAK OS: ADMIN ACADEMIC MANAGEMENT SHELL
// Shared navigation, persistent filters, breadcrumbs, & KPI strip
// ============================================================

import React from 'react';
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
  Search,
  ChevronRight,
  RefreshCw,
  X,
  Sparkles,
} from 'lucide-react';
import { AcademicTabKey, AcademicFilterState } from '../../../types/academic-management';

export interface AcademicKPICard {
  label: string;
  value: number | string;
  subtext?: string;
  trend?: string;
  color?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface AdminAcademicShellProps {
  activeTab: AcademicTabKey;
  onTabChange: (tab: AcademicTabKey) => void;
  title: string;
  description: string;
  breadcrumbs: { label: string; tab?: AcademicTabKey; onClick?: () => void }[];
  kpis?: AcademicKPICard[];
  filters: AcademicFilterState;
  onFilterChange: (key: keyof AcademicFilterState, value: string) => void;
  onResetFilters?: () => void;
  availableUniversities?: { id: string; name: string; shortName: string }[];
  availableBranches?: { id: string; name: string; shortName: string }[];
  primaryAction?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
  };
  onImportClick?: () => void;
  onExportClick?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const AdminAcademicShell: React.FC<AdminAcademicShellProps> = ({
  activeTab,
  onTabChange,
  title,
  description,
  breadcrumbs,
  kpis,
  filters,
  onFilterChange,
  onResetFilters,
  availableUniversities = [],
  availableBranches = [],
  primaryAction,
  onImportClick,
  onExportClick,
  onRefresh,
  isLoading = false,
  children,
}) => {
  const tabs: { key: AcademicTabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'overview', label: 'Academic Overview', icon: Layers },
    { key: 'universities', label: 'Universities', icon: Building2 },
    { key: 'branches', label: 'Branches', icon: Building },
    { key: 'semesters', label: 'Semesters', icon: Calendar },
    { key: 'subjects', label: 'Subjects', icon: Book },
    { key: 'academic-years', label: 'Academic Years', icon: GraduationCap },
  ];

  const hasActiveFilters =
    Boolean(filters.university && filters.university !== 'all') ||
    Boolean(filters.branch && filters.branch !== 'all') ||
    Boolean(filters.semester && filters.semester !== 'all') ||
    Boolean(filters.academicYear && filters.academicYear !== 'all') ||
    Boolean(filters.status && filters.status !== 'all') ||
    Boolean(filters.search);

  return (
    <div className="space-y-5 font-sans">
      {/* 1. Header & Actions */}
      <div className="bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          {/* Breadcrumb Path */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-1.5 font-mono flex-wrap">
            <span
              onClick={() => onTabChange('overview')}
              className="hover:text-orange-400 cursor-pointer transition-colors"
            >
              Academic Management
            </span>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label + idx}>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span
                  onClick={crumb.onClick || (crumb.tab ? () => onTabChange(crumb.tab!) : undefined)}
                  className={`${
                    idx === breadcrumbs.length - 1
                      ? 'text-orange-400 font-extrabold'
                      : 'text-slate-400 hover:text-slate-200 cursor-pointer'
                  } transition-colors`}
                >
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight font-display flex items-center gap-2.5">
            {title}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">{description}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="Refresh Catalog Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {onExportClick && (
            <button
              onClick={onExportClick}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="Export Academic Catalog"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export</span>
            </button>
          )}

          {onImportClick && (
            <button
              onClick={onImportClick}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="Import Academic Structure"
            >
              <Upload className="w-3.5 h-3.5 text-orange-400" />
              <span>Import</span>
            </button>
          )}

          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="px-4.5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-md shadow-orange-500/20 border border-orange-400/30"
            >
              {primaryAction.icon ? (
                <primaryAction.icon className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{primaryAction.label}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top KPI Summary Strip */}
      {kpis && kpis.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {kpi.label}
                  </span>
                  {Icon && (
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                        kpi.color || 'text-orange-400 bg-orange-500/10 border-orange-500/20'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-white tracking-tight font-display">
                    {kpi.value}
                  </h3>
                  {(kpi.trend || kpi.subtext) && (
                    <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                      {kpi.trend && <span className="text-emerald-400 font-mono">{kpi.trend}</span>}
                      {kpi.subtext && <span>{kpi.subtext}</span>}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Horizontal Sub-Tab Navigation Bar */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20 border border-orange-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Shared Multi-Criteria Filter Bar */}
      {activeTab !== 'overview' && (
        <div className="bg-[#0F172A] p-3.5 rounded-2xl border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange('search', '')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto scrollbar-none flex-wrap sm:flex-nowrap">
            {/* University Filter */}
            {(activeTab === 'branches' || activeTab === 'semesters' || activeTab === 'subjects') && (
              <select
                value={filters.university}
                onChange={(e) => onFilterChange('university', e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="all">University: All</option>
                {availableUniversities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.shortName || u.name}
                  </option>
                ))}
              </select>
            )}

            {/* Branch Filter */}
            {(activeTab === 'semesters' || activeTab === 'subjects') && (
              <select
                value={filters.branch}
                onChange={(e) => onFilterChange('branch', e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="all">Branch: All</option>
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.shortName || b.name}
                  </option>
                ))}
              </select>
            )}

            {/* Semester Filter */}
            {activeTab === 'subjects' && (
              <select
                value={filters.semester}
                onChange={(e) => onFilterChange('semester', e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="all">Semester: All</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={String(s)}>
                    Semester {s}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              {activeTab === 'academic-years' && <option value="archived">Archived</option>}
            </select>

            {/* Reset Filters button */}
            {hasActiveFilters && onResetFilters && (
              <button
                onClick={onResetFilters}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 transition"
                title="Reset all filters"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. Main Workspace Container */}
      <div className="space-y-4">{children}</div>
    </div>
  );
};
