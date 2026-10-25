import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutDashboard,
  Sparkles,
  Database,
  Book,
  FileText,
  BookOpen,
  Megaphone,
  PenTool,
  Users,
  ShieldCheck,
  Flag,
  Activity,
  Bug,
  Settings,
  Building,
  Building2,
  Layers,
  GraduationCap,
  Calendar,
  X,
  ArrowRight,
} from 'lucide-react';
import { AdminTab } from './AdminLayout';

interface AdminCommandSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: AdminTab) => void;
}

interface CommandItem {
  id: AdminTab;
  title: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
}

const COMMANDS: CommandItem[] = [
  {
    id: 'dashboard',
    title: 'Command Center Dashboard',
    category: 'Overview',
    description: 'Overview KPIs, platform analytics, system health, and quick actions',
    icon: LayoutDashboard,
    keywords: ['home', 'kpi', 'metrics', 'stats', 'analytics', 'overview'],
  },
  {
    id: 'unified-studio',
    title: 'Unified Content Studio',
    category: 'Studio & Content',
    description: 'All-in-one studio: Curriculum topics, AI question generator, verification queue, and master bank',
    icon: Sparkles,
    keywords: ['studio', 'questions', 'generate', 'verify', 'curriculum', 'intelligence', 'bank', 'mcq', 'unified'],
  },
  {
    id: 'content-factory',
    title: 'Content Factory (AI)',
    category: 'Content Management',
    description: 'Autonomous AI note generator and study material synthesizer',
    icon: Sparkles,
    keywords: ['ai', 'generate', 'notes', 'content', 'factory', 'synthesizer'],
  },
  {
    id: 'subject-master',
    title: 'Academic Subjects & Master',
    category: 'Content Management',
    description: 'University subject directory and code taxonomy master',
    icon: Book,
    keywords: ['subjects', 'master', 'codes', 'syllabus', 'academic'],
  },
  {
    id: 'cms',
    title: 'Curriculum CMS',
    category: 'Content Management',
    description: 'Enterprise curriculum workbook and bulk syllabus upload engine',
    icon: Database,
    keywords: ['curriculum', 'cms', 'excel', 'import', 'universities', 'syllabus'],
  },
  {
    id: 'study-material',
    title: 'Study Materials & Notes',
    category: 'Content Management',
    description: 'Manage, search, edit, and publish student study notes',
    icon: BookOpen,
    keywords: ['study', 'notes', 'materials', 'pdf', 'documents', 'library'],
  },
  {
    id: 'pyqs',
    title: 'Question Bank & PYQs',
    category: 'Content Management',
    description: 'GTU canonical PYQ discovery hub and manual paper manager',
    icon: FileText,
    keywords: ['pyq', 'papers', 'exams', 'questions', 'gtu', 'solutions'],
  },
  {
    id: 'syllabus',
    title: 'Syllabus Management',
    category: 'Content Management',
    description: 'Subject syllabus guidelines and unit breakdowns',
    icon: BookOpen,
    keywords: ['syllabus', 'units', 'topics', 'curriculum'],
  },
  {
    id: 'blogs',
    title: 'Blogs & Articles',
    category: 'Content Management',
    description: 'Editorial blog posts and academic career guides',
    icon: PenTool,
    keywords: ['blog', 'articles', 'posts', 'editorial'],
  },
  {
    id: 'academic-overview',
    title: 'Academic Overview',
    category: 'Academic Management',
    description: 'Central academic hierarchy command center and structure metrics',
    icon: Layers,
    keywords: ['academic', 'overview', 'hierarchy', 'structure', 'dashboard'],
  },
  {
    id: 'universities',
    title: 'Universities & Institutions',
    category: 'Academic Management',
    description: 'Manage universities and institutions supported by ShikshaSahayak',
    icon: Building2,
    keywords: ['universities', 'institutions', 'colleges', 'gtu'],
  },
  {
    id: 'branches',
    title: 'Branches & Departments',
    category: 'Academic Management',
    description: 'Engineering branches and degree program taxonomies',
    icon: Building,
    keywords: ['branches', 'departments', 'engineering', 'degrees'],
  },
  {
    id: 'semesters',
    title: 'Semesters',
    category: 'Academic Management',
    description: 'Semester 1 to 8 curriculum scheduling',
    icon: Calendar,
    keywords: ['semesters', 'sem', 'terms'],
  },
  {
    id: 'subjects',
    title: 'Subjects & Units',
    category: 'Academic Management',
    description: 'Subject directory and branch semester allocations',
    icon: Book,
    keywords: ['subjects', 'modules', 'courses'],
  },
  {
    id: 'academic-years',
    title: 'Academic Years',
    category: 'Academic Management',
    description: 'Academic session batches and examination years',
    icon: GraduationCap,
    keywords: ['years', 'sessions', 'batches'],
  },
  {
    id: 'users',
    title: 'All Users Roster',
    category: 'User & Access',
    description: 'Student and teacher user directory, roles, and profiles',
    icon: Users,
    keywords: ['users', 'students', 'teachers', 'accounts', 'roster'],
  },
  {
    id: 'teacher-whitelist',
    title: 'Teacher Whitelist',
    category: 'User & Access',
    description: 'Whitelist faculty emails for teacher portal and LMS access',
    icon: ShieldCheck,
    keywords: ['teacher', 'whitelist', 'faculty', 'educator', 'access'],
  },
  {
    id: 'beta-whitelist',
    title: 'Beta User Whitelist',
    category: 'User & Access',
    description: 'Manage 2.0 beta testers and custom preview access',
    icon: Sparkles,
    keywords: ['beta', 'testers', 'preview', 'whitelist', '2.0'],
  },
  {
    id: 'roles-permissions',
    title: 'Roles & Permissions',
    category: 'User & Access',
    description: 'Role-based access matrix for Admin, Teacher, and Student',
    icon: ShieldCheck,
    keywords: ['roles', 'permissions', 'rbac', 'security'],
  },
  {
    id: 'features-control',
    title: 'Feature Control Center',
    category: 'Platform Management',
    description: 'Real-time feature flag toggles and master kill-switches',
    icon: Flag,
    keywords: ['features', 'flags', 'killswitch', 'toggles', 'modules'],
  },
  {
    id: 'system-health',
    title: 'System Health & Telemetry',
    category: 'Platform Management',
    description: 'Edge workers, D1, R2, CDN, and AI latency monitor',
    icon: Activity,
    keywords: ['health', 'uptime', 'workers', 'd1', 'r2', 'telemetry', 'status'],
  },
  {
    id: 'approvals',
    title: 'Submissions & Approvals',
    category: 'Moderation & Support',
    description: 'Review and approve student and teacher uploaded content',
    icon: ShieldCheck,
    keywords: ['approvals', 'pending', 'review', 'moderation'],
  },
  {
    id: 'bug-reports',
    title: 'Bug Reports & Diagnostics',
    category: 'Moderation & Support',
    description: 'User-submitted bug reports and technical diagnostic logs',
    icon: Bug,
    keywords: ['bugs', 'errors', 'issues', 'reports', 'feedback'],
  },
  {
    id: 'settings',
    title: 'System Settings',
    category: 'Platform Management',
    description: 'Portal branding, maintenance mode, and edge configurations',
    icon: Settings,
    keywords: ['settings', 'config', 'maintenance', 'branding'],
  },
];

export const AdminCommandSearchModal: React.FC<AdminCommandSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredCommands = COMMANDS.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q) ||
      cmd.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  const handleSelect = (item: CommandItem) => {
    onNavigate(item.id);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl bg-[#0F172A] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[70vh]"
        >
          {/* Search Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 shrink-0">
            <Search className="w-5 h-5 text-orange-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search anything (users, content, subjects, settings, branches)..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="w-full bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none"
            />
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No admin controls or sections found matching "{query}".
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const Icon = cmd.icon;
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelect(cmd)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition text-left cursor-pointer group ${
                      isSelected
                        ? 'bg-orange-500/15 border border-orange-500/40 text-white'
                        : 'hover:bg-slate-800/60 border border-transparent text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-orange-500 text-white border-orange-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700 group-hover:border-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">{cmd.title}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {cmd.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{cmd.description}</p>
                      </div>
                    </div>

                    <ArrowRight
                      className={`w-4 h-4 text-orange-400 shrink-0 ml-3 transition-transform ${
                        isSelected ? 'translate-x-1 opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between px-5 py-2.5 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 shrink-0">
            <div className="flex items-center gap-3">
              <span>Navigate with <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">↓</kbd></span>
              <span>Select <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Enter</kbd></span>
            </div>
            <span>Close <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Esc</kbd></span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
