// ============================================================
// SHIKSHA SAHAYAK OS: ADMIN USER & ACCESS MANAGEMENT SHELL
// Shared navigation, persistent filters, breadcrumbs, & KPI strip
// ============================================================

import React from 'react';
import {
  Users,
  ShieldCheck,
  Sparkles,
  Shield,
  FileText,
  Search,
  ChevronRight,
  RefreshCw,
  X,
  Download,
  Upload,
} from 'lucide-react';
import { UserTabKey, UserManagementKPICard } from '../../../types/user-management';

interface AdminUserManagementShellProps {
  activeTab: UserTabKey;
  onTabChange: (tab: UserTabKey) => void;
  title: string;
  description: string;
  breadcrumbs: { label: string; tab?: UserTabKey; onClick?: () => void }[];
  kpis?: UserManagementKPICard[];
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
  primaryAction?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    color?: string;
  };
  secondaryAction?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
  };
  onExportClick?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const AdminUserManagementShell: React.FC<AdminUserManagementShellProps> = ({
  activeTab,
  onTabChange,
  title,
  description,
  breadcrumbs,
  kpis,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search users, emails, or IDs...',
  filters,
  onResetFilters,
  hasActiveFilters = false,
  primaryAction,
  secondaryAction,
  onExportClick,
  onRefresh,
  isLoading = false,
  children,
}) => {
  const tabs: {
    key: UserTabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }[] = [
    { key: 'users', label: 'Users', icon: Users },
    {
      key: 'teacher-whitelist',
      label: 'Teacher Whitelist',
      icon: ShieldCheck,
      badge: 'Faculty',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      key: 'beta-whitelist',
      label: 'Beta User Whitelist',
      icon: Sparkles,
      badge: '2.0 Early Access',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    },
    { key: 'roles-permissions', label: 'Roles & Permissions', icon: Shield },
    { key: 'audit-logs', label: 'Access Logs', icon: FileText },
  ];

  return (
    <div className="space-y-5 font-sans">
      {/* 1. Header & Actions */}
      <div className="bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          {/* Breadcrumb Path */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-1.5 font-mono flex-wrap">
            <span
              onClick={() => onTabChange('users')}
              className="hover:text-orange-400 cursor-pointer transition-colors"
            >
              User & Access Governance
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
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {onExportClick && (
            <button
              onClick={onExportClick}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="Export Records"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export</span>
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
            >
              {secondaryAction.icon && <secondaryAction.icon className="w-3.5 h-3.5" />}
              <span>{secondaryAction.label}</span>
            </button>
          )}

          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className={`px-4 py-2 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md ${
                primaryAction.color || 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
              }`}
            >
              {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
              <span>{primaryAction.label}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Navigation Tab Strip */}
      <div className="bg-[#0F172A] p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${
                    isActive ? 'bg-black/20 text-white border-white/20' : tab.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. KPI Metrics Ribbon */}
      {kpis && kpis.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon || Users;
            return (
              <div
                key={kpi.label + idx}
                className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5 hover:border-slate-700/80 transition-colors shadow-sm"
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold border shrink-0 ${
                    kpi.color || 'text-orange-400 bg-orange-500/10 border-orange-500/20'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                    {kpi.label}
                  </p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <p className="text-xl sm:text-2xl font-extrabold text-white font-display">
                      {kpi.value}
                    </p>
                    {kpi.trend && (
                      <span className="text-[10px] font-bold text-emerald-400 font-mono">
                        {kpi.trend}
                      </span>
                    )}
                  </div>
                  {kpi.subtext && (
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{kpi.subtext}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Filter & Search Strip */}
      {(onSearchChange || filters) && (
        <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
          {onSearchChange && (
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
              />
              {searchValue && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {filters && <div className="flex items-center gap-2 flex-wrap">{filters}</div>}

          {hasActiveFilters && onResetFilters && (
            <button
              onClick={onResetFilters}
              className="px-3 py-2 text-xs font-bold text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-xl border border-orange-500/20 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      )}

      {/* 5. Main View Area */}
      <div className="space-y-4">{children}</div>
    </div>
  );
};
