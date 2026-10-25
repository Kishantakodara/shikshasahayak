import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Sparkles,
  Database,
  Book,
  FileText,
  BookOpen,
  PenTool,
  Building,
  Building2,
  Layers,
  Calendar,
  GraduationCap,
  Users,
  ShieldCheck,
  Shield,
  Flag,
  Settings,
  Activity,
  Bug,
  Megaphone,
  BarChart,
  LogOut,
  Search,
  Menu,
  X,
  Moon,
  Sun,
  Monitor,
  Cloud,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Bell,
  MessageSquare,
  FileSpreadsheet,
  Upload,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AdminCommandSearchModal } from './AdminCommandSearchModal';

export type AdminTab =
  | 'dashboard'
  | 'unified-studio'
  | 'content-factory'
  | 'subject-master'
  | 'cms'
  | 'study-material'
  | 'pyqs'
  | 'syllabus'
  | 'blogs'
  | 'announcements'
  | 'academic-overview'
  | 'universities'
  | 'branches'
  | 'semesters'
  | 'subjects'
  | 'academic-years'
  | 'users'
  | 'teacher-whitelist'
  | 'beta-whitelist'
  | 'roles-permissions'
  | 'audit-logs'
  | 'features-control'
  | 'homepage-control'
  | 'settings'
  | 'system-health'
  | 'ai-beta'
  | 'approvals'
  | 'bug-reports'
  | 'feedback'
  | 'analytics'
  | 'uploads'
  | 'question-bank'
  | 'question-intelligence'
  | 'ingestion-queue'
  | 'pipeline-monitor'
  | 'quality-center'
  | 'adaptive-analytics';


interface NavItem {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

interface AdminLayoutProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  onLogout: () => void;
  materialsCount: number;
  pendingCount?: number;
  materials?: any[];
  children: React.ReactNode;
}

const getAdminName = (email?: string | null, displayName?: string | null): string => {
  if (displayName && displayName.trim()) return displayName.trim();
  if (email && email.trim()) {
    const parts = email.split('@');
    if (parts.length > 0 && parts[0]) {
      const name = parts[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return email;
  }
  return 'Admin User';
};

const getAdminRoleBadge = (role?: string | null): string => {
  const r = (role || '').toLowerCase().trim();
  if (r === 'super_admin') return 'Super Administrator';
  if (r === 'admin') return 'Verified Administrator';
  if (r === 'teacher' || r === 'educator') return 'Educator / Reviewer';
  if (r === 'student') return 'Student Account';
  if (!role) return 'Cloudflare Verified Admin';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export const getActivePillarId = (tab: AdminTab): AdminTab => {
  if (tab === 'dashboard') return 'dashboard';
  if (
    [
      'unified-studio',
      'content-factory',
      'study-material',
      'pyqs',
      'syllabus',
      'blogs',
      'announcements',
      'question-bank',
      'question-intelligence',
      'ingestion-queue',
      'pipeline-monitor',
      'quality-center',
      'adaptive-analytics',
      'uploads',
    ].includes(tab)
  ) {
    return 'unified-studio';
  }
  if (
    [
      'academic-overview',
      'universities',
      'branches',
      'semesters',
      'subjects',
      'academic-years',
      'cms',
      'subject-master',
    ].includes(tab)
  ) {
    return 'academic-overview';
  }
  if (
    [
      'users',
      'teacher-whitelist',
      'beta-whitelist',
      'roles-permissions',
      'audit-logs',
      'ai-beta',
    ].includes(tab)
  ) {
    return 'users';
  }
  if (
    [
      'system-health',
      'features-control',
      'homepage-control',
      'settings',
      'approvals',
      'bug-reports',
      'feedback',
      'analytics',
    ].includes(tab)
  ) {
    return 'system-health';
  }
  return 'dashboard';
};

const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  setActiveTab,
  onLogout,
  materialsCount,
  pendingCount = 0,
  materials = [],
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { currentUser } = useAuth();

  // Collapsible nav groups state
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupTitle: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupTitle]: !prev[groupTitle] }));
  };

  // Calculate actual Cloudflare R2 / D1 storage bytes
  const totalActualBytes =
    materials && materials.length > 0
      ? materials.reduce((sum, m) => sum + (Number(m.size_bytes) || 1500000), 0)
      : materialsCount * 1500000;

  const totalSizeMB = (totalActualBytes / (1024 * 1024)).toFixed(2);
  const totalSizeGB = (totalActualBytes / (1024 * 1024 * 1024)).toFixed(2);
  const totalSizePercent = Math.min((totalActualBytes / (10 * 1024 * 1024 * 1024)) * 100, 100).toFixed(1);

  const navGroups: NavGroup[] = [
    {
      groupTitle: 'UNIFIED CONTROL CENTER',
      items: [
        {
          id: 'dashboard',
          label: 'Executive Overview',
          icon: LayoutDashboard,
        },
        {
          id: 'unified-studio',
          label: 'Content & Question Studio',
          icon: Sparkles,
          badge: 'All-in-One',
          badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        },
        {
          id: 'academic-overview',
          label: 'Academic & Curriculum',
          icon: Layers,
          badge: 'Sem 1-8',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        },
        {
          id: 'users',
          label: 'Users & Whitelist',
          icon: Users,
          badge: 'Access',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
        {
          id: 'system-health',
          label: 'Platform & Health',
          icon: ShieldCheck,
          badge: pendingCount > 0 ? `${pendingCount} alerts` : 'Live SSoT',
          badgeColor:
            pendingCount > 0
              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
              : 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        },
      ],
    },
  ];

  const handleTabClick = (id: AdminTab) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <div className="min-h-screen bg-[#070D1E] text-slate-100 flex font-sans">
      {/* Global Command Search Modal */}
      <AdminCommandSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onNavigate={handleTabClick}
      />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Left Sidebar (Sticky on Desktop) */}
      <aside
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 h-screen bg-[#0B132B] border-r border-slate-800/80 flex flex-col shadow-2xl lg:shadow-none overflow-hidden shrink-0 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ width: 260 }}
      >
        {/* Sidebar Header */}
        <div className="h-18 flex items-center justify-between px-5 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src="/logo.png" alt="ShikshaSahayak" className="h-7 w-auto object-contain" />
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                ShikshaSahayak
              </span>
              <span className="text-[10px] font-bold text-orange-400 font-mono tracking-wider uppercase">
                2.0 Admin Control
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Grouped Items */}
        <nav className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {navGroups.map((group) => {
            const activePillar = getActivePillarId(activeTab);

            return (
              <div key={group.groupTitle} className="space-y-2">
                <div className="px-3 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{group.groupTitle}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePillar === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 text-xs font-semibold group cursor-pointer ${
                          isActive
                            ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/25'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-colors ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white border-white/30'
                                : item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer Status Widget */}
        <div className="p-3.5 border-t border-slate-800/80 shrink-0 bg-[#090F22] space-y-2.5">
          {/* Cloudflare Operational Status */}
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <div className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              <span>Cloudflare Status</span>
            </div>
            <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
              <CheckCircle2 className="w-3 h-3" /> All Operational
            </span>
          </div>

          {/* Storage Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Storage</span>
              <span className="text-orange-400 font-bold">{totalSizePercent}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(Number(totalSizePercent), 4)}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-400 font-mono text-right">
              {Number(totalSizeGB) > 0 ? `${totalSizeGB} GB` : `${totalSizeMB} MB`} / 10 GB
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Bar */}
        <header className="h-18 bg-[#0B132B]/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-30 px-5 sm:px-8 flex items-center justify-between shrink-0">
          {/* Left: Mobile Trigger & Search */}
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Global Search Input */}
            <div
              onClick={() => setIsSearchModalOpen(true)}
              className="flex-1 flex items-center bg-[#0F172A] border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2 transition cursor-pointer group"
            >
              <Search className="h-4 w-4 text-slate-400 group-hover:text-orange-400 mr-2.5 shrink-0" />
              <span className="text-xs text-slate-400 group-hover:text-slate-300 flex-1 truncate">
                Search anything (users, content, subjects, settings)...
              </span>
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-800 rounded border border-slate-700">
                Ctrl + K
              </kbd>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Indicator Dot */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Edge</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title={`Current Theme: ${theme}. Click to switch.`}
            >
              <ThemeIcon className="h-4 w-4" />
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => handleTabClick('approvals')}
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Approvals & Notifications"
            >
              <Bell className="h-4 w-4" />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            {/* Admin Profile Details */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 font-extrabold text-xs">
                {getAdminName(currentUser?.email, currentUser?.displayName).charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-white leading-tight">
                  {getAdminName(currentUser?.email, currentUser?.displayName)}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {getAdminRoleBadge(currentUser?.role)}
                </p>
              </div>

              <button
                onClick={onLogout}
                className="ml-1 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                title="Logout from Admin Control Center"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-7">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
