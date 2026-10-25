import React from 'react';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  ChevronRight,
  Download,
  Upload,
  Layers,
  X,
} from 'lucide-react';

export interface KPICardItem {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: string;
  color?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FilterOption {
  key: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

interface AdminContentShellProps {
  title: string;
  description: string;
  breadcrumb: string[];
  primaryAction?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
  };
  extraActions?: React.ReactNode;
  kpis?: KPICardItem[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  onRefresh?: () => void;
  isLoading?: boolean;
  activeTabSelector?: React.ReactNode;
  children: React.ReactNode;
}

export const AdminContentShell: React.FC<AdminContentShellProps> = ({
  title,
  description,
  breadcrumb,
  primaryAction,
  secondaryAction,
  extraActions,
  kpis,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters,
  onRefresh,
  isLoading = false,
  activeTabSelector,
  children,
}) => {
  return (
    <div className="space-y-5 font-sans">
      {/* 1. Header & Actions */}
      <div className="bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          {/* Breadcrumb Path */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mb-1.5 font-mono">
            {breadcrumb.map((crumb, idx) => (
              <React.Fragment key={crumb}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-500" />}
                <span className={idx === breadcrumb.length - 1 ? 'text-orange-400' : 'text-slate-400'}>
                  {crumb}
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
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer border border-slate-700 shadow-xs"
            >
              {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4 text-slate-400" />}
              <span>{secondaryAction.label}</span>
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

          {extraActions}
        </div>
      </div>

      {/* 2. KPI Summary Strip (if provided) */}
      {kpis && kpis.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition"
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
                      {kpi.trend && <span className="text-emerald-400">{kpi.trend}</span>}
                      {kpi.subtext && <span>{kpi.subtext}</span>}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Segmented Workspace Tabs (if provided) */}
      {activeTabSelector && (
        <div className="border-b border-slate-800">{activeTabSelector}</div>
      )}

      {/* 4. Filter & Search Bar */}
      {(onSearchChange || (filters && filters.length > 0)) && (
        <div className="bg-[#0F172A] p-3.5 rounded-2xl border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          {onSearchChange && (
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Filter Dropdowns */}
          {filters && filters.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto scrollbar-none">
              {filters.map((filter) => (
                <div key={filter.key} className="flex items-center shrink-0">
                  <select
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="">{filter.label}: All</option>
                    {filter.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Main Workspace Container */}
      <div className="space-y-4">{children}</div>
    </div>
  );
};
