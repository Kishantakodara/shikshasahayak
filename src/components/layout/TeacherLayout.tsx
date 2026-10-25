import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  GraduationCap, 
  Home,
  BookOpen, 
  LayoutGrid, 
  Users, 
  CheckCircle,
  FileText, 
  HelpCircle, 
  FileCheck,
  BarChart2, 
  FileCode,
  Upload,
  Folder,
  Megaphone,
  Mail,
  Calendar,
  BarChart4,
  Settings, 
  HelpCircle as QuestionIcon,
  LogOut, 
  Search, 
  Bell, 
  Menu, 
  X,
  User as UserIcon
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import ThemeToggle from '../ThemeToggle';
import SearchModal from '../SearchModal';

interface TeacherLayoutProps {
  children: React.ReactNode;
}

export const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const teacherName = currentUser?.displayName || 'Prof. Sharma';
  const avatarUrl = currentUser?.photoURL;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/teacher/login');
    } catch (err) {
      console.error(err);
      toast.error('Logout failed');
    }
  };

  const navGroups = [
    {
      title: 'TEACHING',
      items: [
        { label: 'My Subjects', path: '/teacher/subjects', icon: BookOpen },
        { label: 'My Classes', path: '/teacher/classes', icon: LayoutGrid },
        { label: 'Students', path: '/teacher/students', icon: Users },
        { label: 'Attendance', path: '/teacher/attendance', icon: CheckCircle, badge: 'NEW' },
        { label: 'Assignments', path: '/teacher/assignments', icon: FileText },
        { label: 'Quizzes', path: '/teacher/quizzes', icon: HelpCircle },
        { label: 'Question Bank', path: '/teacher/question-bank', icon: FileCheck },
        { label: 'Marks & Results', path: '/teacher/results', icon: BarChart2 },
      ]
    },
    {
      title: 'CONTENT',
      items: [
        { label: 'My Notes', path: '/teacher/notes', icon: FileCode },
        { label: 'Study Materials', path: '/teacher/materials', icon: BookOpen },
        { label: 'Upload Material', path: '/teacher/materials/upload', icon: Upload },
        { label: 'Resource Library', path: '/teacher/resources', icon: Folder },
      ]
    },
    {
      title: 'COMMUNICATION',
      items: [
        { label: 'Announcements', path: '/teacher/announcements', icon: Megaphone },
        { label: 'Messages', path: '/teacher/messages', icon: Mail },
      ]
    },
    {
      title: 'MORE',
      items: [
        { label: 'Calendar', path: '/student/calendar', icon: Calendar },
        { label: 'Reports & Analytics', path: '/teacher/results', icon: BarChart4 },
        { label: 'Settings', path: '/teacher/settings', icon: Settings },
        { label: 'Help & Support', path: '/contact', icon: QuestionIcon },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#070D19] flex font-sans">
      
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-navy-900 border-r border-gray-200/80 dark:border-navy-800 text-slate-800 dark:text-gray-100 shrink-0 shadow-xs justify-between min-h-screen sticky top-0 h-screen z-30">
        
        <div className="p-5 space-y-5 overflow-y-auto scrollbar-thin">
          {/* Dashboard Active Header */}
          <Link
            to="/teacher"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-extrabold transition-all shadow-md ${
              location.pathname === '/teacher'
                ? 'bg-[#f97316] text-white shadow-orange-500/20'
                : 'bg-orange-50 dark:bg-navy-800 text-brand-orange hover:bg-orange-100'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>

          {/* Grouped Nav Section */}
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-1">
                {group.title}
              </h4>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-orange-50 dark:bg-navy-800 text-brand-orange font-bold'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-800/60 hover:text-navy-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-brand-orange' : 'text-gray-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#f97316] text-white text-[9px] font-black uppercase tracking-tight">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Profile & Logout Bottom Bar */}
        <div className="p-4 border-t border-gray-100 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950 flex items-center justify-between">
          <Link 
            to="/teacher/settings"
            className="flex items-center gap-2.5 min-w-0"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={teacherName} className="w-9 h-9 rounded-full object-cover border border-brand-orange/40" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand-orange/10 border border-brand-orange/30 text-brand-orange flex items-center justify-center font-bold text-xs">
                {teacherName[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-navy-900 dark:text-white truncate">{teacherName}</h4>
              <p className="text-[10px] text-gray-400 truncate">Electrical Engg.</p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </aside>

      {/* Mobile Drawer (Responsive Sidebar) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 max-w-[80vw] bg-white dark:bg-navy-900 text-slate-900 dark:text-white flex flex-col justify-between p-5 z-10 min-h-screen overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-navy-900 dark:text-white font-display">
                    ShikshaSahayak<span className="text-brand-orange">Portal</span>
                  </span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-navy-900 dark:hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {navGroups.map((group) => (
                  <div key={group.title} className="space-y-1">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">{group.title}</h4>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-navy-800"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-brand-orange" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && <span className="px-1.5 py-0.5 rounded bg-brand-orange text-white text-[9px] font-bold">{item.badge}</span>}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Right Content Layout */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar (Matching Image 1 Header) */}
        <header className="bg-white dark:bg-navy-900 border-b border-gray-200/80 dark:border-navy-800 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo in Header (matching Image 1 top left) */}
            <Link to="/teacher" className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold text-navy-900 dark:text-white font-display">
                ShikshaSahayak<span className="text-brand-orange">Portal</span>
              </span>
              <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-brand-orange text-[11px] font-bold border border-orange-100 dark:border-orange-900/40">
                <UserIcon className="w-3 h-3" />
                <span>Teachers Portal</span>
              </span>
            </Link>
          </div>

          {/* Center Search bar */}
          <div className="hidden sm:flex items-center gap-4 flex-1 max-w-md mx-4">
            <div 
              onClick={() => setIsSearchOpen(true)}
              className="w-full relative cursor-pointer"
            >
              <div className="w-full pl-4 pr-10 py-2 text-xs bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 text-gray-400 rounded-full flex items-center justify-between shadow-xs hover:border-brand-orange/50 transition-colors">
                <span>Search students, subjects, classes, notes...</span>
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
              </div>
            </div>
          </div>

          {/* Right Utilities: Notifications, Messages, Calendar, Help & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <button 
              onClick={() => toast.info('You have 5 unread notifications')}
              className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#f97316] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                5
              </span>
            </button>

            {/* Messages Mail */}
            <button 
              onClick={() => toast.info('You have 3 new messages')}
              className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors hidden sm:block"
              title="Messages"
            >
              <Mail className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#f97316] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Calendar */}
            <Link 
              to="/student/calendar"
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors hidden sm:block"
              title="Calendar"
            >
              <Calendar className="w-4 h-4" />
            </Link>

            {/* Help */}
            <Link 
              to="/contact"
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors hidden sm:block"
              title="Help & Support"
            >
              <QuestionIcon className="w-4 h-4" />
            </Link>

            {/* Theme Toggle Switch */}
            <ThemeToggle />

            {/* Profile Avatar Header Badge */}
            <Link to="/teacher/settings" className="flex items-center gap-2.5 pl-2 border-l border-gray-200 dark:border-navy-800">
              {avatarUrl ? (
                <img src={avatarUrl} alt={teacherName} className="w-8 h-8 rounded-full object-cover border border-brand-orange/40" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center font-bold text-xs">
                  {teacherName[0]}
                </div>
              )}
              <div className="hidden md:block text-left">
                <h4 className="text-xs font-extrabold text-navy-900 dark:text-white leading-tight">{teacherName}</h4>
                <p className="text-[10px] text-gray-400 font-medium">Electrical Engineering</p>
              </div>
            </Link>
          </div>

        </header>

        {/* Page Main Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>

      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
