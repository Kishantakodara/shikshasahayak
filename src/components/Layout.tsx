import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Bot, User, Search, Youtube, Send, Linkedin, Instagram, Download, LogOut, Sparkles, Compass, GraduationCap, ChevronDown, BookOpen, FileText, ScrollText } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { getRouteMeta, usePageMeta } from '../utils/seo';
import SearchModal from './SearchModal';
import { usePWA } from '../context/PWAContext';
import { useStudentAcademic } from '../context/StudentAcademicContext';
import { useAuth } from '../context/AuthContext';
import { useBetaFeatures } from '../hooks/useBetaFeatures';
import { UniversityContextSelector } from './academic/UniversityContextSelector';
import { getCanonicalBranchSlug } from '../utils/branchUtils';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileResourcesOpen, setIsMobileResourcesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  usePageMeta(getRouteMeta(location.pathname));

  const { isStandalone, installPrompt, setShowInstallBanner, triggerInstallPrompt } = usePWA();
  const { currentUser, logout } = useAuth();
  const { academicProfile, isExploreMode, toggleExploreMode } = useStudentAcademic();
  const { isBetaTester, hasFeature } = useBetaFeatures();

  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDashboardRoute = 
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/student') || 
    location.pathname.startsWith('/teacher') || 
    location.pathname.startsWith('/college') || 
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/courses') ||
    location.pathname.startsWith('/scholarships') ||
    location.pathname.startsWith('/opportunities') ||
    location.pathname.startsWith('/workshops') ||
    location.pathname.startsWith('/festivals') ||
    location.pathname.startsWith('/compete') ||
    location.pathname.startsWith('/coding') ||
    location.pathname.startsWith('/career') ||
    location.pathname.startsWith('/practice') ||
    location.pathname.startsWith('/resources') ||
    location.pathname.startsWith('/materials') ||
    location.pathname.startsWith('/academic-') ||
    location.pathname === '/study' ||
    location.pathname === '/subjects' ||
    location.pathname === '/assignments' ||
    location.pathname === '/timeline' ||
    location.pathname === '/gate-2027' ||
    location.pathname === '/contribute';

  if (isDashboardRoute) {
    return <>{children}</>;
  }

  const isActive = (path: string) =>
    (path === '/' ? location.pathname === '/' : location.pathname === path || location.pathname.startsWith(`${path}/`))
      ? 'text-brand-orange font-bold bg-orange-50 dark:bg-navy-800/50'
      : 'text-gray-600 dark:text-gray-300 hover:text-navy-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-navy-800/50';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-navy-950 text-slate-900 dark:text-gray-100 transition-colors duration-300">

      {/* Mobile Menu Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-navy-950/60 dark:bg-black/75 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-4 pb-2 pointer-events-none">
        <nav className={`mx-auto max-w-6xl rounded-2xl transition-all duration-300 pointer-events-auto border shadow-sm ${
          isMobileMenuOpen
            ? 'bg-white dark:bg-navy-900 border-gray-200 dark:border-navy-700 shadow-2xl py-3 px-4 sm:px-6'
            : scrolled
              ? 'glass shadow-lg py-2 px-4 border-white/20'
              : 'bg-white/90 dark:bg-navy-900/90 backdrop-blur-sm py-3 px-6 border-transparent'
        }`}>
          <div className="flex items-center justify-between">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-navy-900 dark:text-white font-display block whitespace-nowrap">
                Shiksha<span className="text-brand-orange">Sahayak</span>
              </span>
              {isBetaTester && (
                <span className="px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/30 text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3 text-brand-orange" /> BETA
                </span>
              )}
            </Link>

            {/* Navigation Options based on Auth State */}
            {!currentUser ? (
              /* MODE 1: PUBLIC VISITOR NAVIGATION */
              <div className="hidden md:flex items-center gap-1">
                <Link to="/" className={`${isActive('/')} transition-all px-3 py-1.5 rounded-full text-xs font-bold`}>
                  Home
                </Link>
                <Link to="/resources" className={`${isActive('/resources')} transition-all px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1`}>
                  Resources <ChevronDown className="w-3 h-3 text-gray-400" />
                </Link>
                <Link to="/resources/pyq" className={`${isActive('/resources/pyq')} transition-all px-3 py-1.5 rounded-full text-xs font-semibold`}>
                  PYQs
                </Link>
                <Link to="/resources/study-material" className={`${isActive('/notes')} transition-all px-3 py-1.5 rounded-full text-xs font-semibold`}>
                  Notes
                </Link>
                <Link to="/blogs" className={`${isActive('/blogs')} transition-all px-3 py-1.5 rounded-full text-xs font-semibold`}>
                  Blogs
                </Link>
                <Link to="/hackathon" className={`${isActive('/hackathon')} transition-all px-3 py-1.5 rounded-full text-xs font-bold text-brand-orange flex items-center gap-1`}>
                  <span>🇮🇳</span>
                  <span>Social Cause</span>
                </Link>
                <Link 
                  to="/student" 
                  className="transition-all px-3 py-1.5 rounded-full text-xs font-bold text-brand-orange bg-orange-500/10 hover:bg-orange-500/20 border border-brand-orange/30 flex items-center gap-1 ml-1"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student Portal</span>
                </Link>
              </div>
            ) : (
              /* MODE 2: AUTHENTICATED PERSONALIZED NAVIGATION */
              <div className="hidden md:flex items-center gap-1">
                <Link 
                  to="/student" 
                  className={`${isActive('/student')} transition-all px-3 py-1.5 rounded-full text-xs font-bold text-brand-orange`}
                >
                  My Home
                </Link>
                <Link 
                  to="/student/library" 
                  className={`${isActive('/student/library')} transition-all px-3 py-1.5 rounded-full text-xs font-semibold`}
                >
                  My Library
                </Link>
                <Link 
                  to="/student/calendar" 
                  className={`${isActive('/student/calendar')} transition-all px-3 py-1.5 rounded-full text-xs font-semibold`}
                >
                  Calendar
                </Link>
                {hasFeature('aiCopilot') && (
                  <Link 
                    to="/ai-tutor" 
                    className={`transition-all px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${location.pathname === '/ai-tutor'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-navy-800 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    <Bot className="h-3.5 w-3.5" /> AI Tutor
                  </Link>
                )}

                {/* Explore Mode Toggle */}
                <button
                  onClick={toggleExploreMode}
                  className={`ml-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 border ${
                    isExploreMode 
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20' 
                      : 'bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-navy-700 hover:border-brand-orange'
                  }`}
                  title="Toggle Explore Mode to view other departments and universities"
                >
                  <Compass className="w-3 h-3" />
                  {isExploreMode ? 'Explore Mode ON' : 'Explore'}
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="hidden md:flex items-center gap-3">
              <UniversityContextSelector />
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-navy-900 dark:hover:text-white bg-gray-100 dark:bg-navy-800 hover:bg-gray-200 dark:hover:bg-navy-750 transition-all rounded-full flex items-center justify-center w-9 h-9"
                title="Search (Ctrl+K)"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
              <ThemeToggle />

              {!currentUser ? (
                /* Mode 1 Visitor Auth Actions */
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-full text-xs font-extrabold border border-brand-orange/40 dark:border-brand-orange/60 bg-white dark:bg-navy-800 text-brand-orange dark:text-white hover:bg-brand-orange hover:text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2 rounded-full text-xs font-extrabold bg-[#f97316] hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 transition-all hover:scale-105"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                /* Mode 2 Authenticated User Menu */
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-navy-800 hover:bg-gray-200 dark:hover:bg-navy-750 rounded-full transition-all border border-gray-200 dark:border-navy-700 cursor-pointer"
                  >
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt={academicProfile?.fullName || currentUser.displayName || "Student"} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-brand-orange text-white flex items-center justify-center font-bold text-xs">
                        {(academicProfile?.fullName || currentUser.displayName || "Student").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-bold text-navy-900 dark:text-white max-w-[100px] truncate hidden lg:inline">
                      {(academicProfile?.fullName || currentUser.displayName || "Student").split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-1" />
                  </button>

                  {/* Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 rounded-2xl shadow-xl overflow-hidden z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-navy-800">
                        <p className="text-xs font-extrabold text-navy-900 dark:text-white truncate">{academicProfile?.fullName || currentUser.fullName || currentUser.displayName || "Student"}</p>
                        <p className="text-[11px] text-gray-400 truncate">{academicProfile?.email || currentUser.email || ""}</p>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-orange/10 text-brand-orange text-[10px] font-bold">
                          <GraduationCap className="w-3 h-3" />
                          <span>{academicProfile?.branchName || 'Engineering'} • Sem {academicProfile?.semester || 1}</span>
                        </div>
                      </div>

                      <Link
                        to="/student"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-navy-800 flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-blue-500" /> Student Dashboard
                      </Link>

                      <Link
                        to="/student/resume"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-navy-800 flex items-center gap-2"
                      >
                        <BookOpen className="w-4 h-4 text-brand-orange" /> Resume Builder & ATS
                      </Link>

                      <Link
                        to="/marketplace"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-navy-800 flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" /> Notes Marketplace
                      </Link>

                      {!isStandalone && (
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            triggerInstallPrompt();
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-bold text-brand-orange hover:bg-orange-50 dark:hover:bg-navy-800 flex items-center gap-2 cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-brand-orange" /> Install ShikshaSahayak App
                        </button>
                      )}

                      <div className="border-t border-gray-100 dark:border-navy-800 my-1"></div>

                      <button
                        onClick={async () => {
                          setIsProfileMenuOpen(false);
                          await logout();
                          navigate('/');
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button & Quick Login */}
            <div className="md:hidden flex items-center gap-1.5 sm:gap-2">
              {!currentUser && (
                <Link
                  to="/login"
                  className="bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm transition-all"
                >
                  Login
                </Link>
              )}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-brand-orange transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-navy-800"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-full bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 focus:outline-none min-h-[40px] min-w-[40px]"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X className="block h-5 w-5" /> : <Menu className="block h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden pt-4 pb-2 space-y-1 border-t border-gray-100 dark:border-navy-700 mt-2 max-h-[calc(100dvh-5.5rem)] overflow-y-auto">
              {!currentUser ? (
                /* Mode 1 Mobile Links */
                <>
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-800">Home</Link>
                  <Link to="/student" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-base font-bold text-brand-orange bg-orange-50 dark:bg-navy-800/80">
                    <GraduationCap className="w-5 h-5 text-brand-orange" />
                    <span>Student Portal</span>
                  </Link>
                  <Link to="/resources/study-material" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-800">Study Material</Link>
                  <Link to="/resources/pyq" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-800">Previous Papers</Link>
                  <Link to="/blogs" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-800">Blogs</Link>
                  <Link to="/hackathon" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-base font-bold text-brand-orange bg-orange-50/50 dark:bg-navy-800/50 hover:bg-orange-50">
                    <span>🇮🇳</span>
                    <span>Social Cause (VBYLD 2027)</span>
                  </Link>
                  <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-800">About</Link>
                  <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-800">Contact</Link>
                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-center py-2.5 rounded-xl font-bold bg-gray-100 dark:bg-navy-800 text-navy-900 dark:text-white">Login</Link>
                    <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="text-center py-2.5 rounded-xl font-bold bg-[#f97316] text-white">Register</Link>
                  </div>
                </>
              ) : (
                /* Mode 2 Mobile Links */
                <>
                  <div className="px-4 py-2.5 bg-orange-50 dark:bg-navy-800/80 rounded-xl mb-2 flex items-center justify-between border border-orange-100 dark:border-navy-700">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-navy-900 dark:text-white truncate">
                        {academicProfile?.fullName || currentUser.fullName || currentUser.displayName || "Student"}
                      </p>
                      <p className="text-[11px] text-brand-orange font-bold truncate">
                        {academicProfile?.branchName ? `${academicProfile.branchName} • Sem ${academicProfile.semester || 1}` : 'GTU Student'}
                      </p>
                    </div>
                  </div>
                  {/* Resources (Sem X) Accordion Menu */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsMobileResourcesOpen(!isMobileResourcesOpen)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold text-navy-900 dark:text-gray-200 hover:text-brand-orange hover:bg-gray-50 dark:hover:bg-navy-800 transition-colors cursor-pointer"
                      aria-expanded={isMobileResourcesOpen}
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-brand-orange" />
                        Resources (Sem {academicProfile?.semester || 1})
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isMobileResourcesOpen ? 'rotate-180 text-brand-orange' : ''}`} />
                    </button>

                      {(() => {
                        const canonicalBranch = getCanonicalBranchSlug(academicProfile?.branchId || academicProfile?.branchName);
                        return (
                          <div className="pl-4 pr-2 py-1.5 space-y-1 bg-gray-100 dark:bg-navy-800 rounded-xl mt-1 border border-gray-200 dark:border-navy-700 animate-in fade-in duration-150">
                            <Link
                              to={`/resources/study-material/${canonicalBranch}/semester/${academicProfile.semester || 1}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 hover:text-brand-orange hover:bg-orange-50 dark:hover:bg-navy-700 transition-colors"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                              <span>Study Material</span>
                            </Link>
                            <Link
                              to={`/resources/pyq/${canonicalBranch}/semester/${academicProfile.semester || 1}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-navy-700 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>GTU PYQs</span>
                            </Link>
                            <Link
                              to={`/resources/syllabus/${canonicalBranch}/semester/${academicProfile.semester || 1}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-navy-700 transition-colors"
                            >
                              <ScrollText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>Syllabus</span>
                            </Link>
                          </div>
                        );
                      })()}
                  </div>

                  <Link to="/student" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-bold text-[#f97316] hover:bg-gray-50 dark:hover:bg-navy-800">Student Dashboard</Link>
                  <Link to="/ai-tutor" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-navy-800"><Bot className="w-4 h-4" /> My AI Tutor</Link>
                  {!isStandalone && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        triggerInstallPrompt();
                      }}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-brand-orange flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-800"
                    >
                      <Download className="w-4 h-4" /> Install ShikshaSahayak App
                    </button>
                  )}
                  <button onClick={async () => { setIsMobileMenuOpen(false); await logout(); navigate('/'); }} className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">Logout</button>
                </>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-grow pt-24 pb-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-navy-900 border-t border-gray-200 dark:border-navy-800 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 group mb-4">
                <div className="bg-navy-900 dark:bg-transparent p-1.5 rounded-lg">
                  <img src="/logo.webp" alt="ShikshaSahayak Logo" className="h-8 w-auto object-contain" width="32" height="32" />
                </div>
                <span className="text-lg font-bold text-navy-900 dark:text-white font-display">
                  Shiksha<span className="text-brand-orange">Sahayak</span>
                </span>
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Your academic success partner. Access study materials, notes, and exam papers in one organized place.
              </p>
              <div className="flex items-center gap-3 mt-5">
                <a href="https://youtube.com/@shikshasahayak" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-50 dark:bg-navy-850 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 flex items-center justify-center border border-gray-100 dark:border-navy-800 transition-colors" title="YouTube">
                  <Youtube className="w-4 h-4" strokeWidth={2.5} />
                </a>
                <a href="https://www.instagram.com/shikshasahayak" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-50 dark:bg-navy-850 hover:bg-pink-50 dark:hover:bg-pink-950/20 text-pink-500 flex items-center justify-center border border-gray-100 dark:border-navy-800 transition-colors" title="Instagram">
                  <Instagram className="w-4 h-4" strokeWidth={2.5} />
                </a>
                <a href="https://t.me/shikshasahayak" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-50 dark:bg-navy-850 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-400 flex items-center justify-center border border-gray-100 dark:border-navy-800 transition-colors" title="Telegram">
                  <Send className="w-4 h-4" strokeWidth={2.5} />
                </a>
                <a href="https://chat.whatsapp.com/JKjcvjun6roIkbat7O59uJ" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-50 dark:bg-navy-850 hover:bg-green-50 dark:hover:bg-green-950/20 text-green-500 flex items-center justify-center border border-gray-100 dark:border-navy-800 transition-colors" title="WhatsApp Community">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <circle cx="6.5" cy="11.5" r="2.2" />
                    <path d="M3 21v-1.5A2.5 2.5 0 0 1 5.5 17h1" />
                    <circle cx="17.5" cy="11.5" r="2.2" />
                    <path d="M17.5 17h1a2.5 2.5 0 0 1 2.5 2.5V21" />
                    <circle cx="12" cy="7.5" r="2.8" />
                    <path d="M7.5 21v-2a4.5 4.5 0 0 1 9 0v2" />
                  </svg>
                </a>
                <a href="https://whatsapp.com/channel/0029VbCPjEsJf05VIeyIHv2i" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-50 dark:bg-navy-850 hover:bg-green-50 dark:hover:bg-green-950/20 text-green-500 flex items-center justify-center border border-gray-100 dark:border-navy-800 transition-colors" title="WhatsApp Channel">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M21 11.5a8.5 8.5 0 0 1-16.5 4l-2.5 2.5a0.5 0.5 0 0 1-.85-.35l.5-4.1a8.5 8.5 0 1 1 19.35-2.05z" />
                    <circle cx="12" cy="11.5" r="1.2" fill="currentColor" stroke="none" />
                    <path d="M9.5 9a3.5 3.5 0 0 0 0 5" />
                    <path d="M14.5 9a3.5 3.5 0 0 1 0 5" />
                  </svg>
                </a>
                <a href="https://www.linkedin.com/company/shikshasahayak/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-50 dark:bg-navy-850 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-500 flex items-center justify-center border border-gray-100 dark:border-navy-800 transition-colors" title="LinkedIn">
                  <Linkedin className="w-4 h-4" strokeWidth={2.5} />
                </a>

              </div>
            </div>

            <div>
              <h4 className="font-bold text-navy-900 dark:text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link to="/resources/pyq" className="hover:text-brand-orange transition-colors">Previous Year Papers</Link></li>
                <li><Link to="/resources/study-material" className="hover:text-brand-orange transition-colors">Study Material</Link></li>
                <li><Link to="/guides" className="hover:text-brand-orange transition-colors">Study Guides</Link></li>
                <li><Link to="/exam-tips" className="hover:text-brand-orange transition-colors">Exam Tips</Link></li>
                <li><Link to="/announcements" className="hover:text-brand-orange transition-colors">Notice Board</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-navy-900 dark:text-white mb-4">ShikshaSahayak</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link to="/about" className="hover:text-brand-orange transition-colors">About Us</Link></li>
                <li><Link to="/hackathon" className="hover:text-brand-orange transition-colors flex items-center gap-1.5"><span className="text-brand-orange font-bold">🇮🇳</span><span>Social Cause (VBYLD 2027)</span></Link></li>
                <li><Link to="/contact" className="hover:text-brand-orange transition-colors">Contact Us</Link></li>
                <li><Link to="/contribute" className="hover:text-brand-orange transition-colors">Contribute Material</Link></li>
                <li><Link to="/sitemap" className="hover:text-brand-orange transition-colors">Sitemap</Link></li>
                <li className="pt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-navy-800">
                  <strong>Support Email:</strong><br />
                  <a href="mailto:support@shikshasahayak.org" className="text-brand-orange hover:underline font-bold">support@shikshasahayak.org</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-navy-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link to="/privacy-policy" className="hover:text-brand-orange transition-colors font-medium">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-brand-orange transition-colors font-medium">Terms of Service</Link></li>
                <li><Link to="/disclaimer" className="hover:text-brand-orange transition-colors font-medium">Disclaimer</Link></li>
                <li><Link to="/bug-bounty" className="hover:text-brand-orange transition-colors font-medium">Bug Bounty</Link></li>
                <li><Link to="/sitemap" className="hover:text-brand-orange transition-colors">HTML Sitemap</Link></li>
                <li><button onClick={() => setIsSearchOpen(true)} className="hover:text-brand-orange transition-colors text-left w-full outline-none">Search Portal</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-navy-800 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} ShikshaSahayak Education. Built for students, by students.
          </div>
        </div>
      </footer>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

export default Layout;
