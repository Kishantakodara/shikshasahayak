import React from 'react';
import {
  Sparkles,
  Upload,
  PlusCircle,
  Users,
  Settings,
  BarChart3,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { AdminTab } from './AdminLayout';

interface AdminQuickActionsGridProps {
  onNavigate: (tab: AdminTab) => void;
  onQuickUpload?: (type: 'notes' | 'pyqs' | 'syllabus' | 'blog') => void;
}

export const AdminQuickActionsGrid: React.FC<AdminQuickActionsGridProps> = ({
  onNavigate,
  onQuickUpload,
}) => {
  const actions = [
    {
      title: 'Unified Studio',
      subtitle: 'All-in-one AI questions & content',
      icon: Sparkles,
      iconBg: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      hoverBorder: 'hover:border-orange-500/50 hover:bg-orange-500/5',
      onClick: () => onNavigate('unified-studio'),
    },
    {
      title: 'Upload Materials',
      subtitle: 'Bulk upload study content & PYQs',
      icon: Upload,
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      hoverBorder: 'hover:border-blue-500/50 hover:bg-blue-500/5',
      onClick: () => {
        if (onQuickUpload) {
          onQuickUpload('notes');
        } else {
          onNavigate('uploads');
        }
      },
    },
    {
      title: 'Add Subject',
      subtitle: 'New academic curriculum subject',
      icon: PlusCircle,
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      hoverBorder: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
      onClick: () => onNavigate('subjects'),
    },
    {
      title: 'Manage Users',
      subtitle: 'Student and teacher roster',
      icon: Users,
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      hoverBorder: 'hover:border-purple-500/50 hover:bg-purple-500/5',
      onClick: () => onNavigate('users'),
    },
    {
      title: 'System Settings',
      subtitle: 'Platform & homepage configuration',
      icon: Settings,
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      hoverBorder: 'hover:border-rose-500/50 hover:bg-rose-500/5',
      onClick: () => onNavigate('settings'),
    },
    {
      title: 'View Reports',
      subtitle: 'Platform analytics & insights',
      icon: BarChart3,
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      hoverBorder: 'hover:border-cyan-500/50 hover:bg-cyan-500/5',
      onClick: () => onNavigate('analytics'),
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-extrabold text-white text-lg">Quick Administrative Actions</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.title}
              onClick={act.onClick}
              className={`bg-[#0F172A] p-4 rounded-2xl border border-slate-800 transition-all text-left flex flex-col justify-between gap-3 group cursor-pointer ${act.hoverBorder}`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold border transition group-hover:scale-105 ${act.iconBg}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </div>

              <div>
                <h4 className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors">
                  {act.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{act.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
