import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Target, 
  Folder, 
  Layers, 
  Briefcase,
  Trophy,
  Users,
  Gift,
  Bookmark, 
  TrendingUp,
  FileText, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronDown,
  GraduationCap, 
  Flame, 
  Sparkles, 
  Clock, 
  Compass, 
  CheckCircle2, 
  ExternalLink,
  Calendar,
  ClipboardList,
  Code,
  Award,
  Video,
  FileCheck,
  Building2,
  BrainCircuit,
  Lightbulb,
  Radio
} from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import SearchModal from '../SearchModal';
import { useAuth } from '../../context/AuthContext';
import { useStudentAcademic } from '../../context/StudentAcademicContext';
import { getCanonicalBranchSlug } from '../../utils/branchUtils';

interface ShikshaSahayakShellProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  badge?: string;
  badgeColor?: string;
  isExternal?: boolean;
}

interface NavGroup {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

export const ShikshaSahayakShell: React.FC<ShikshaSahayakShellProps> = ({ children, rightPanel }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { academicProfile, setShowProfileModal } = useStudentAcademic();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const studentName = currentUser?.displayName || academicProfile?.fullName || 'Student';
  const branchName = academicProfile?.branchName || 'Computer Engineering';
  const semesterNum = academicProfile?.semester || 3;

  const searchParams = new URLSearchParams(location.search);
  const currentTab = (searchParams.get('tab') || 'overview').toLowerCase();
  const isStudentHome = location.pathname === '/student' || location.pathname === '/student/dashboard';

  const isTabActive = (tabKey: string) => {
    if (isStudentHome) {
      return currentTab === tabKey;
    }
    if (tabKey === 'curriculum' && (location.pathname === '/student/study' || location.pathname === '/study' || location.pathname.startsWith('/resources') || location.pathname.startsWith('/materials') || location.pathname.startsWith('/academic-'))) return true;
    if (tabKey === 'classroom' && (location.pathname === '/student/classes' || location.pathname === '/student/attendance' || location.pathname === '/student/assignments')) return true;
    if (tabKey === 'practice' && (location.pathname === '/student/practice' || location.pathname === '/practice' || location.pathname.startsWith('/student/practice/'))) return true;
    if (tabKey === 'progress' && (location.pathname === '/student/profile' || location.pathname === '/student/analytics')) return true;
    return false;
  };

  const studentHubTabs = [
    { id: 'overview', label: 'Overview', path: '/student?tab=overview', icon: Home },
    { id: 'curriculum', label: 'Study & Curriculum', path: '/student?tab=curriculum', icon: BookOpen, badge: `Sem ${semesterNum}` },
    { id: 'classroom', label: 'Classroom & Attendance', path: '/student?tab=classroom', icon: Users, badge: 'GTU', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { id: 'practice', label: 'Practice Arena', path: '/student?tab=practice', icon: Target, badge: 'MCQs', badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { id: 'progress', label: 'Progress & Profile', path: '/student?tab=progress', icon: TrendingUp },
  ];

  const careerItems = [
    { label: 'Pro Resume Builder', path: '/student/resume', icon: FileCheck, badge: 'ATS 8+', badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
    { label: '5-Day Interview Prep', path: '/career/interview-prep', icon: Briefcase, badge: 'CRASH', badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { label: 'Internships & Jobs', path: '/career/internships', icon: Building2, badge: 'HIRING', badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    { label: 'Career Roadmaps', path: '/student/career', icon: Compass },
  ];

  const studentBranchSlug = getCanonicalBranchSlug(academicProfile?.branchId || academicProfile?.branchName) || 'computer-engineering';
  const hasAcademicContext = Boolean(
    currentUser &&
    (academicProfile?.branchId || academicProfile?.branchName) &&
    Number(semesterNum) > 0
  );

  const academicItems = [
    { 
      label: 'Study Materials & Notes', 
      path: hasAcademicContext ? `/resources/study-material/${studentBranchSlug}/semester/${semesterNum}` : '/resources/study-material', 
      icon: BookOpen, 
      badge: 'NOTES', 
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
    },
    { 
      label: 'Previous Year Papers', 
      path: hasAcademicContext ? `/resources/pyq/${studentBranchSlug}/semester/${semesterNum}` : '/resources/pyq', 
      icon: FileText, 
      badge: 'PYQ', 
      badgeColor: 'bg-orange-500/10 text-[#F97316]' 
    },
    { 
      label: 'Syllabus Schemes', 
      path: hasAcademicContext ? `/resources/syllabus/${studentBranchSlug}/semester/${semesterNum}` : '/resources/syllabus', 
      icon: Layers 
    },
    { label: 'GATE 2027 Portal', path: '/gate-2027', icon: Award, badge: 'GATE', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { label: 'Timed Mock Exams', path: '/student/practice/exam', icon: Clock },
    { label: 'My Saved Library', path: '/student/library', icon: Bookmark },
  ];

  const opportunityItems = [
    { label: '100 Days of Code', path: '/practice/100-days-of-code', icon: Code, badge: 'HOT', badgeColor: 'bg-orange-500/10 text-[#F97316]' },
    { label: 'College Festivals', path: '/compete/festivals', icon: Trophy, badge: 'GTU', badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
    { label: 'Scholarships Directory', path: '/opportunities/scholarships', icon: Gift, badge: 'GOVT', badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { label: 'GTU Academic Calendar', path: '/student/calendar', icon: Calendar },
    { label: 'Contribute Notes', path: '/contribute', icon: Sparkles },
  ];

  // Auto-close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function isLinkActive(path: string) {
    if (path.startsWith('/student?tab=')) {
      const targetTab = path.split('tab=')[1];
      return isTabActive(targetTab);
    }
    if (path === '/student') return isStudentHome && currentTab === 'overview';
    if (path === '/') return location.pathname === '/' || location.pathname === '/home';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }

  const subNavItemClass = (path: string) => `
    flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 group
    ${isLinkActive(path)
      ? 'bg-orange-500/10 text-[#F97316] font-bold shadow-2xs'
      : 'text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
    }
  `;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D1A] text-[#0F172A] dark:text-slate-100 flex flex-col antialiased">
      {/* Search Modal (Ctrl + K) */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* MOBILE DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* MOBILE DRAWER */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 w-80 bg-white dark:bg-[#0F172A] border-r border-[#E2E8F0] dark:border-slate-800 z-50 flex flex-col p-4 transition-transform duration-300 ease-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
          <Link to="/student" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F97316] flex items-center justify-center text-white font-bold shadow-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-[#0F172A] dark:text-white">ShikshaSahayak</span>
              <span className="block text-[10px] text-[#64748B] font-medium leading-none">Unified Engineering Hub</span>
            </div>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close navigation drawer"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Student Info Chip */}
        <button
          type="button"
          onClick={() => {
            setIsMobileMenuOpen(false);
            navigate('/register');
          }}
          className={`my-3 p-3 rounded-xl border flex items-center gap-3 text-left w-full transition-colors group cursor-pointer ${
            !academicProfile?.isProfileComplete
              ? 'bg-orange-500/10 border-2 border-[#F97316]'
              : 'bg-slate-50 dark:bg-slate-800/60 border-[#E2E8F0] dark:border-slate-700/60 hover:border-[#F97316]'
          }`}
          title="Click to personalize branch and semester on Registration Form"
        >
          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#F97316] flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
            {!academicProfile?.isProfileComplete ? <Sparkles className="w-4 h-4 text-[#F97316]" /> : (studentName || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold truncate text-[#0F172A] dark:text-white flex items-center gap-1.5">
              <span>{studentName || 'Student'}</span>
              {!academicProfile?.isProfileComplete ? (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm bg-[#F97316] text-white">Setup</span>
              ) : (
                <span className="text-[10px] text-[#F97316] font-normal underline">Edit</span>
              )}
            </p>
            <p className="text-[11px] text-[#64748B] truncate">
              {!academicProfile?.isProfileComplete ? 'Tap to choose Branch & Sem' : `Sem ${semesterNum} • ${branchName || 'GTU'}`}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#F97316] bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md shrink-0">
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#F97316]" />
          </div>
        </button>

        {/* Mobile Navigation List */}
        <div className="flex-1 overflow-y-auto space-y-3 py-1 pr-1">
          {/* Primary 5 Hub Tabs */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-black uppercase text-[#64748B] dark:text-slate-400 tracking-wider">
              Student Hub
            </p>
            {studentHubTabs.map((tab) => {
              const TabIcon = tab.icon;
              const active = isTabActive(tab.id);
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-orange-500/10 text-[#F97316] shadow-2xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <TabIcon className={`w-4 h-4 ${active ? 'text-[#F97316]' : 'text-slate-500 dark:text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm ${tab.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                      {tab.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Career & Placement */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-0.5">
            <p className="px-3 text-[10px] font-black uppercase text-[#64748B] dark:text-slate-400 tracking-wider">
              Career & Placement
            </p>
            {careerItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <Link key={item.path} to={item.path} className={subNavItemClass(item.path)}>
                  <div className="flex items-center gap-2">
                    <ItemIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm shrink-0 ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Academic & Exam Prep */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-0.5">
            <p className="px-3 text-[10px] font-black uppercase text-[#64748B] dark:text-slate-400 tracking-wider">
              Academics & Exams
            </p>
            {academicItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <Link key={item.path} to={item.path} className={subNavItemClass(item.path)}>
                  <div className="flex items-center gap-2">
                    <ItemIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm shrink-0 ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Opportunities & Community */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-0.5">
            <p className="px-3 text-[10px] font-black uppercase text-[#64748B] dark:text-slate-400 tracking-wider">
              Opportunities & Contests
            </p>
            {opportunityItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <Link key={item.path} to={item.path} className={subNavItemClass(item.path)}>
                  <div className="flex items-center gap-2">
                    <ItemIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm shrink-0 ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Public Landing Link */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <Link 
              to="/" 
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-[#F97316]" />
                <span>Public Landing Page</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Mobile Drawer Bottom */}
        <div className="pt-3 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between">
          <ThemeToggle />
          {currentUser ? (
            <button 
              onClick={() => logout()}
              className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          ) : (
            <Link 
              to="/login"
              className="text-xs font-bold text-[#F97316] hover:underline"
            >
              Sign In →
            </Link>
          )}
        </div>
      </aside>

      {/* DESKTOP LAYOUT WRAPPER */}
      <div className="flex-1 flex w-full">
        {/* DESKTOP FIXED LEFT SIDEBAR (240px) */}
        <aside 
          className="hidden md:flex flex-col w-[250px] shrink-0 bg-white dark:bg-[#0F172A] border-r border-[#E2E8F0] dark:border-slate-800/80 sticky top-0 h-screen z-40 select-none"
          aria-label="Sidebar Navigation"
        >
          {/* Logo Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800/80 shrink-0">
            <Link to="/student" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-[#F97316] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[13px] tracking-tight text-[#0F172A] dark:text-white leading-tight">ShikshaSahayak</span>
                  <span className="text-[10px] font-black uppercase text-[#F97316] bg-orange-500/10 px-1 rounded-sm">Hub</span>
                </div>
                <span className="text-[10px] text-[#64748B] font-medium leading-none">Engineering Platform</span>
              </div>
            </Link>
          </div>

          {/* Navigation Scroll Area */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">
            {/* Primary 5 Hub Tabs */}
            <div className="space-y-1">
              <p className="px-2 text-[10px] font-black uppercase text-[#64748B] dark:text-slate-400 tracking-wider mb-1">
                Student Hub
              </p>
              {studentHubTabs.map((tab) => {
                const TabIcon = tab.icon;
                const active = isTabActive(tab.id);
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                      active
                        ? 'bg-orange-500/10 text-[#F97316] shadow-2xs'
                        : 'text-slate-700 dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <TabIcon className={`w-4 h-4 shrink-0 ${active ? 'text-[#F97316]' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm shrink-0 ${tab.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                        {tab.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Career & Placement Group */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-0.5">
              <p className="px-2 text-[10px] font-black uppercase text-[#64748B] dark:text-slate-400 tracking-wider mb-1">
                Career & Placement
              </p>
              {careerItems.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={subNavItemClass(item.path)}
                  >
                    <div className="flex items-center gap-2">
                      <ItemIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm shrink-0 ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Academics & Exams Group */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-0.5">
              <p className="px-2 text-[10px] font-black uppercase text-[#64748B] dark:text-slate-400 tracking-wider mb-1">
                Academics & Exams
              </p>
              {academicItems.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={subNavItemClass(item.path)}
                  >
                    <div className="flex items-center gap-2">
                      <ItemIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm shrink-0 ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Opportunities & Contests Group */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-0.5">
              <p className="px-2 text-[10px] font-black uppercase text-[#64748B] dark:text-slate-400 tracking-wider mb-1">
                Opportunities & Contests
              </p>
              {opportunityItems.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={subNavItemClass(item.path)}
                  >
                    <div className="flex items-center gap-2">
                      <ItemIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm shrink-0 ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Public Quick Switch */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 my-1">
              <Link 
                to="/" 
                className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>Public Landing Page</span>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Link>
            </div>

            {/* Streak & Consistency Card */}
            <div className="p-3 rounded-2xl bg-orange-500/5 border border-orange-500/15">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-[#F97316] flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  Active Streak
                </span>
                <span className="text-[10px] text-[#64748B]">Active</span>
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400 leading-relaxed">
                Consistent daily practice builds engineering mastery.
              </p>
            </div>
          </div>

          {/* Bottom Student Profile Pill */}
          <div className="p-3 border-t border-[#E2E8F0] dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
            <div className="flex items-center justify-between">
              <Link 
                to="/student?tab=progress"
                className="flex items-center gap-2.5 min-w-0 group hover:opacity-90"
              >
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#F97316] font-bold text-xs flex items-center justify-center shrink-0 border border-orange-200 dark:border-orange-800/40">
                  {(studentName || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate text-[#0F172A] dark:text-white group-hover:text-[#F97316] transition-colors">
                    {studentName || 'Student'}
                  </p>
                  <p className="text-[10px] text-[#64748B] truncate">
                    Sem {semesterNum} • {branchName ? branchName.split(' ')[0] : 'Engineering'}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-1 shrink-0">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN COLUMN (HEADER + PAGE CONTENT) */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* TOP BAR */}
          <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4">
            {/* Left: Mobile hamburger & breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
                aria-label="Open mobile navigation"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/register')}
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                  !academicProfile?.isProfileComplete
                    ? 'bg-orange-500/15 border-2 border-[#F97316] text-[#F97316] shadow-xs animate-pulse'
                    : 'bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 text-[#0F172A] dark:text-slate-200'
                }`}
                title="Click to personalize University, Branch & Semester on Registration Form"
              >
                {!academicProfile?.isProfileComplete ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                    <span className="font-extrabold text-[#F97316]">Set Branch & Sem (GTU)</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#F97316]" />
                  </>
                ) : (
                  <>
                    <span className="font-bold text-[#F97316]">GTU</span>
                    <span className="text-slate-400">•</span>
                    <span className="truncate max-w-[140px] md:max-w-xs">{branchName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-[#F97316] font-extrabold">Sem {semesterNum}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#F97316] transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* Center: Command Palette Trigger Input */}
            <div className="flex-1 max-w-md mx-auto">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-[#E2E8F0] dark:border-slate-700/60 text-xs text-[#64748B] hover:border-slate-300 dark:hover:border-slate-600 transition-colors shadow-2xs"
                aria-label="Search courses, tests, jobs, materials"
              >
                <div className="flex items-center gap-2 truncate">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">Search courses, practice, jobs, scholarships...</span>
                </div>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono font-medium text-slate-500 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 px-1.5 py-0.5 rounded-md shrink-0">
                  Ctrl K
                </kbd>
              </button>
            </div>

            {/* Right: Notifications, Student Chip, Profile */}
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/student?tab=classroom"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F97316]/10 hover:bg-[#F97316]/20 border border-[#F97316]/30 text-xs font-bold text-[#F97316] transition-colors"
                title="My Classrooms & Join Code"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Classrooms</span>
              </Link>

              <Link
                to="/announcements"
                className="relative p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F97316]"></span>
              </Link>

              {/* Student Summary Chip */}
              <Link
                to="/student?tab=progress"
                className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-[#E2E8F0] dark:border-slate-700/60 text-xs hover:border-[#F97316] transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-[#F97316] text-white flex items-center justify-center font-bold text-[10px]">
                  {(studentName || 'A').charAt(0).toUpperCase()}
                </div>
                <span className="font-bold text-[#0F172A] dark:text-white">{studentName || 'Student'}</span>
                <span className="text-[11px] text-[#64748B]">• Sem {semesterNum}</span>
              </Link>

              {!currentUser && (
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-bold bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl shadow-2xs transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </header>

          {/* PAGE CONTENT */}
          <main className={`flex-1 w-full min-w-0 ${location.pathname.startsWith('/career') || location.pathname === '/student/career-hub' ? 'pb-4 md:pb-6' : 'pb-20 md:pb-12'}`}>
            {children}
          </main>
        </div>

        {/* OPTIONAL CONTEXTUAL RIGHT PANEL */}
        {rightPanel && (
          <aside className="hidden xl:block w-80 shrink-0 border-l border-[#E2E8F0] dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-5 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
            {rightPanel}
          </aside>
        )}
      </div>

      {/* DEDICATED MOBILE BOTTOM NAVIGATION */}
      <nav 
        className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-t border-[#E2E8F0] dark:border-slate-800 z-40 md:hidden flex items-center justify-around px-2"
        aria-label="Mobile Bottom Navigation"
      >
        <Link 
          to="/student" 
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
            isLinkActive('/student') ? 'text-[#F97316] font-bold' : 'text-[#64748B]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </Link>

        <Link 
          to="/student?tab=curriculum" 
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
            isLinkActive('/student?tab=curriculum') || isLinkActive('/student/study') ? 'text-[#F97316] font-bold' : 'text-[#64748B]'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Learn</span>
        </Link>

        <Link 
          to="/student?tab=practice" 
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
            isLinkActive('/student?tab=practice') || isLinkActive('/practice') ? 'text-[#F97316] font-bold' : 'text-[#64748B]'
          }`}
        >
          <Target className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Practice</span>
        </Link>

        <Link 
          to="/career/internships" 
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
            isLinkActive('/career/internships') || isLinkActive('/career/jobs') || isLinkActive('/career') || isLinkActive('/student/career-hub') ? 'text-[#F97316] font-bold' : 'text-[#64748B]'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Career</span>
        </Link>

        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center w-16 h-12 rounded-xl text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </nav>
    </div>
  );
};

export default ShikshaSahayakShell;
