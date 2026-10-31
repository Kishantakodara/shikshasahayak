import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  Search, 
  Filter, 
  CheckCircle2, 
  Sparkles, 
  Bookmark, 
  BookmarkCheck,
  ChevronRight,
  GraduationCap,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  FileCheck,
  Compass,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Bell,
  Rocket,
  ArrowRight,
  ArrowUpDown
} from 'lucide-react';
import { CareerListingDTO } from '@/types/prepZone';
import { PortalReturnBar } from '../../components/navigation/PortalReturnBar';
import { InternshipOpportunityCard } from '../../components/career/InternshipOpportunityCard';
import { useLearningEcosystem } from '../../context/LearningEcosystemContext';
import { InternshipCardSkeleton } from '../../components/career/InternshipCardSkeleton';
import { InternshipEmptyState } from '../../components/career/InternshipEmptyState';
import { JobCard } from '../../components/career/JobCard';
import { useStudentAcademic } from '../../context/StudentAcademicContext';
import { useAuth } from '../../context/AuthContext';

export const CareerListingsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { academicProfile } = useStudentAcademic();
  const { currentUser } = useAuth();

  const [listings, setListings] = useState<CareerListingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global Section Switcher ('OVERVIEW' | 'INTERNSHIPS' | 'JOBS')
  const [activeSection, setActiveSection] = useState<'OVERVIEW' | 'INTERNSHIPS' | 'JOBS'>(() => {
    if (location.pathname.includes('/internships')) return 'INTERNSHIPS';
    if (location.pathname.includes('/jobs')) return 'JOBS';
    return 'OVERVIEW';
  });

  // Global search that filters both sections if filled
  const [globalSearch, setGlobalSearch] = useState('');

  // Section 1: Featured Internships Filters
  const [internshipDomain, setInternshipDomain] = useState('all');
  const [internshipLocation, setInternshipLocation] = useState('all');
  const [internshipStipend, setInternshipStipend] = useState('all');
  const [internshipDuration, setInternshipDuration] = useState('all');
  const [internshipSort, setInternshipSort] = useState<'newest' | 'stipend' | 'deadline'>('newest');
  const [showAllInternships, setShowAllInternships] = useState(false);

  // Section 2: Featured Jobs Filters
  const [jobDomain, setJobDomain] = useState('all');
  const [jobLocation, setJobLocation] = useState('all');
  const [jobExperience, setJobExperience] = useState('all');
  const [jobType, setJobType] = useState('all');
  const [jobSort, setJobSort] = useState<'newest' | 'salary' | 'deadline'>('newest');
  const [showAllJobs, setShowAllJobs] = useState(false);

  // Bookmarks
  const { addBookmark, removeBookmark } = useLearningEcosystem();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Section refs for smooth scrolling
  const internshipRef = useRef<HTMLDivElement>(null);
  const jobRef = useRef<HTMLDivElement>(null);

  // Sync route path changes
  useEffect(() => {
    if (location.pathname.endsWith('/internships')) {
      setActiveSection('INTERNSHIPS');
      internshipRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (location.pathname.endsWith('/jobs')) {
      setActiveSection('JOBS');
      jobRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.pathname]);

  // Load saved bookmarks from localStorage and reconcile with server
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shiksha_saved_jobs');
      if (stored) {
        setSavedIds(JSON.parse(stored));
      }
    } catch {}

    // Reconcile with authenticated student bookmarks if available
    const reconcileBookmarks = async () => {
      try {
        const res = await fetch('/api/student/bookmarks');
        if (res.ok) {
          const data = await res.json() as Array<{ resourceId: string }>;
          if (Array.isArray(data)) {
            const serverIds = data.map(b => b.resourceId);
            setSavedIds(prev => {
              const combined = Array.from(new Set([...prev, ...serverIds]));
              localStorage.setItem('shiksha_saved_jobs', JSON.stringify(combined));
              return combined;
            });
          }
        }
      } catch {}
    };
    reconcileBookmarks();
  }, []);

  const toggleSave = async (id: string, e: React.MouseEvent) => {
    e?.stopPropagation?.();
    const isCurrentlySaved = savedIds.includes(id);
    const updated = isCurrentlySaved 
      ? savedIds.filter(item => item !== id) 
      : [...savedIds, id];
    const msg = isCurrentlySaved ? 'Removed from bookmarks' : 'Saved for later';

    // Optimistic local state update
    setSavedIds(updated);
    try {
      localStorage.setItem('shiksha_saved_jobs', JSON.stringify(updated));
    } catch {}

    const targetListing = listings.find(l => l.id === id);
    if (isCurrentlySaved) {
      removeBookmark(id);
    } else {
      addBookmark({
        targetId: id,
        title: targetListing?.title || id,
        url: `/career/internships?id=${id}`,
        itemType: targetListing?.listingType === 'JOB' ? 'job' : 'internship',
        subjectCode: targetListing?.companyName,
      });
    }

    // Persist to server API if possible
    try {
      if (isCurrentlySaved) {
        await fetch(`/api/student/bookmarks?resourceId=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      } else {
        await fetch('/api/student/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resourceId: id,
            resourceType: targetListing?.listingType === 'JOB' ? 'job' : 'internship',
            title: targetListing?.title || id,
            url: `/career/internships?id=${id}`,
          }),
        });
      }
    } catch (err) {
      console.warn('Could not persist bookmark to server, retained locally:', err);
    }

    // Show toast
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Fetch opportunities
  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/career/listings`);
      if (!res.ok) throw new Error('Failed to fetch career opportunities');
      const data = await res.json() as { success: boolean; listings: CareerListingDTO[] };
      if (data.success && Array.isArray(data.listings)) {
        setListings(data.listings);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to load opportunities at this moment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Separate master datasets (STRICT INVARIANT: No mixing!)
  const allInternships = useMemo(() => {
    return listings.filter(item => item.listingType === 'INTERNSHIP');
  }, [listings]);

  const allJobs = useMemo(() => {
    return listings.filter(item => item.listingType === 'JOB');
  }, [listings]);

  // Filtered Internships (Independent filter logic)
  const filteredInternships = useMemo(() => {
    let result = [...allInternships];

    // Global search
    const query = globalSearch.toLowerCase().trim();
    if (query) {
      result = result.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.companyName.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.requiredSkills.some(s => s.toLowerCase().includes(query))
      );
    }

    // Domain filter
    if (internshipDomain !== 'all') {
      result = result.filter(item => 
        item.title.toLowerCase().includes(internshipDomain.toLowerCase()) ||
        item.requiredSkills.some(s => s.toLowerCase().includes(internshipDomain.toLowerCase())) ||
        (item.eligibleBranches || []).some(b => b.toLowerCase().includes(internshipDomain.toLowerCase()))
      );
    }

    // Location filter
    if (internshipLocation !== 'all') {
      result = result.filter(item => 
        item.location.toLowerCase().includes(internshipLocation.toLowerCase()) ||
        item.workplaceType?.toLowerCase().includes(internshipLocation.toLowerCase())
      );
    }

    // Stipend filter
    if (internshipStipend !== 'all') {
      if (internshipStipend === '50k+') {
        result = result.filter(item => {
          const num = parseInt((item.stipendOrSalary || '').replace(/[^0-9]/g, ''), 10);
          return num >= 50000;
        });
      } else if (internshipStipend === '25k+') {
        result = result.filter(item => {
          const num = parseInt((item.stipendOrSalary || '').replace(/[^0-9]/g, ''), 10);
          return num >= 25000;
        });
      } else if (internshipStipend === '15k+') {
        result = result.filter(item => {
          const num = parseInt((item.stipendOrSalary || '').replace(/[^0-9]/g, ''), 10);
          return num >= 15000;
        });
      }
    }

    // Duration filter
    if (internshipDuration !== 'all') {
      result = result.filter(item => item.duration?.toLowerCase().includes(internshipDuration.toLowerCase()));
    }

    // Sort
    if (internshipSort === 'newest') {
      result.sort((a, b) => (b.postedDate || '').localeCompare(a.postedDate || ''));
    } else if (internshipSort === 'deadline') {
      result.sort((a, b) => (a.applicationDeadline || '9999').localeCompare(b.applicationDeadline || '9999'));
    } else if (internshipSort === 'stipend') {
      result.sort((a, b) => {
        const numA = parseInt((a.stipendOrSalary || '').replace(/[^0-9]/g, '') || '0', 10);
        const numB = parseInt((b.stipendOrSalary || '').replace(/[^0-9]/g, '') || '0', 10);
        return numB - numA;
      });
    }

    return result;
  }, [allInternships, globalSearch, internshipDomain, internshipLocation, internshipStipend, internshipDuration, internshipSort]);

  // Filtered Jobs (Independent filter logic)
  const filteredJobs = useMemo(() => {
    let result = [...allJobs];

    // Global search
    const query = globalSearch.toLowerCase().trim();
    if (query) {
      result = result.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.companyName.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.requiredSkills.some(s => s.toLowerCase().includes(query))
      );
    }

    // Domain filter
    if (jobDomain !== 'all') {
      result = result.filter(item => 
        item.title.toLowerCase().includes(jobDomain.toLowerCase()) ||
        item.requiredSkills.some(s => s.toLowerCase().includes(jobDomain.toLowerCase())) ||
        (item.eligibleBranches || []).some(b => b.toLowerCase().includes(jobDomain.toLowerCase()))
      );
    }

    // Location filter
    if (jobLocation !== 'all') {
      result = result.filter(item => 
        item.location.toLowerCase().includes(jobLocation.toLowerCase()) ||
        item.workplaceType?.toLowerCase().includes(jobLocation.toLowerCase())
      );
    }

    // Experience filter
    if (jobExperience !== 'all') {
      result = result.filter(item => 
        item.experienceLevel?.toLowerCase().includes(jobExperience.toLowerCase())
      );
    }

    // Job Type filter
    if (jobType !== 'all') {
      result = result.filter(item => 
        item.workplaceType?.toLowerCase().includes(jobType.toLowerCase())
      );
    }

    // Sort
    if (jobSort === 'newest') {
      result.sort((a, b) => (b.postedDate || '').localeCompare(a.postedDate || ''));
    } else if (jobSort === 'deadline') {
      result.sort((a, b) => (a.applicationDeadline || '9999').localeCompare(b.applicationDeadline || '9999'));
    } else if (jobSort === 'salary') {
      result.sort((a, b) => {
        const numA = parseInt((a.stipendOrSalary || '').replace(/[^0-9]/g, '') || '0', 10);
        const numB = parseInt((b.stipendOrSalary || '').replace(/[^0-9]/g, '') || '0', 10);
        return numB - numA;
      });
    }

    return result;
  }, [allJobs, globalSearch, jobDomain, jobLocation, jobExperience, jobType, jobSort]);

  // Sliced views for initial layout (4 cards each on default view unless expanded)
  const visibleInternships = showAllInternships || activeSection === 'INTERNSHIPS' 
    ? filteredInternships 
    : filteredInternships.slice(0, 4);

  const visibleJobs = showAllJobs || activeSection === 'JOBS'
    ? filteredJobs
    : filteredJobs.slice(0, 4);

  // Student personalization context
  const branchName = academicProfile?.branchName || 'Engineering';
  const semesterNum = academicProfile?.semester ? `Semester ${academicProfile.semester}` : 'All Semesters';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 space-y-2 pb-3">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Top Navigation & Profile Bar */}
      <div className="flex items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search internships, jobs, companies..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 shadow-2xs transition"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Notification & User Profile Pill */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <button 
            type="button"
            className="relative p-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 shadow-2xs transition"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-orange-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          <div className="flex items-center gap-1.5 pl-1">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-[11px] shadow-2xs ring-1 ring-white dark:ring-slate-800 shrink-0">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Student Profile" className="w-full h-full object-cover" />
              ) : (
                <span>AP</span>
              )}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                {currentUser?.displayName || academicProfile?.fullName || 'Aarav Patel'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                {(academicProfile?.college || academicProfile?.universityName || 'GTU').split(' ')[0]} • {academicProfile?.branchName || 'Electrical Engineering'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* SECTION A: HERO BANNER (BALANCED COMFORTABLE HEIGHT) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0B1528] border border-slate-800/80 px-5 sm:px-8 py-4 sm:py-5 text-white shadow-lg min-h-[165px] lg:h-[180px] flex items-center justify-between">
        {/* Seamless High-Fidelity Hero Artwork (Centered in Background) */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
          <img 
            src="/images/career/hero-artwork.jpg" 
            alt="Career Tomorrow Skyline" 
            className="w-full h-full object-cover object-center opacity-85" 
          />
          {/* Subtle Directional Gradients for High Readability on Left Text & Right Cards */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1528] via-[#0B1528]/60 to-[#0B1528]/85" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528]/80 via-transparent to-[#0B1528]/40" />
        </div>

        {/* Left Column Content */}
        <div className="relative z-10 flex flex-col justify-center space-y-1 max-w-sm sm:max-w-md">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
            YOUR NEXT STEP
          </div>
          
          <h1 className="text-xl sm:text-2xl lg:text-[26px] font-black tracking-tight leading-tight">
            <span className="text-[#F97316]">Internships & Jobs</span>
            <br />
            <span className="text-white">for a Bigger Tomorrow</span>
          </h1>
          
          <p className="text-slate-300 text-xs leading-relaxed line-clamp-2 max-w-xs sm:max-w-sm font-normal pt-0.5">
            Gain real-world experience, build your skills and kickstart your career with the right opportunities.
          </p>
        </div>

        {/* Center: 3 Floating Glassmorphic Stat Cards (Matching Image) */}
        <div className="relative z-10 hidden md:flex items-center gap-2.5 lg:gap-3">
          {/* Stat 1: 100+ Active Internships */}
          <div className="bg-[#121F38]/90 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10 shadow-sm min-w-[92px] text-left">
            <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center mb-1">
              <Briefcase className="w-3 h-3" />
            </div>
            <div className="text-sm font-black text-white leading-none">100+</div>
            <div className="text-[9px] text-slate-400 font-medium mt-0.5 whitespace-nowrap">Active Internships</div>
          </div>

          {/* Stat 2: 50+ Active Jobs */}
          <div className="bg-[#121F38]/90 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10 shadow-sm min-w-[92px] text-left">
            <div className="w-4 h-4 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center mb-1">
              <Briefcase className="w-3 h-3" />
            </div>
            <div className="text-sm font-black text-white leading-none">50+</div>
            <div className="text-[9px] text-slate-400 font-medium mt-0.5 whitespace-nowrap">Active Jobs</div>
          </div>

          {/* Stat 3: Top Companies Hiring Now */}
          <div className="bg-[#121F38]/90 backdrop-blur-md rounded-xl px-3 py-2 border border-white/10 shadow-sm min-w-[96px] text-left">
            <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1">
              <Building2 className="w-3 h-3" />
            </div>
            <div className="text-xs font-black text-white leading-none mt-0.5">Top Companies</div>
            <div className="text-[9px] text-slate-400 font-medium mt-0.5 whitespace-nowrap">Hiring Now</div>
          </div>
        </div>
      </div>

      {/* Switcher Tabs (Internships | Jobs) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveSection('INTERNSHIPS');
            internshipRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
            activeSection === 'INTERNSHIPS' || activeSection === 'OVERVIEW'
              ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 border-orange-200 dark:border-orange-800 shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-orange-500" />
          <span>Internships</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSection('JOBS');
            jobRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
            activeSection === 'JOBS'
              ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 border-orange-200 dark:border-orange-800 shadow-2xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-slate-500" />
          <span>Jobs</span>
        </button>
      </div>

      {/* SECTION C: FEATURED INTERNSHIPS (STRICTLY INTERNSHIP ONLY) */}
      <section 
        ref={internshipRef} 
        className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2"
      >
          {/* Section Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-center text-slate-800 dark:text-white shrink-0">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Featured Internships
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Gain hands-on experience and learn from the best in the industry.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAllInternships(!showAllInternships)}
              className="text-[11px] font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 shrink-0 transition"
            >
              <span>{showAllInternships ? 'Show Less' : 'View All Internships'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* 5-Dropdown Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              {/* All Domains */}
              <div className="relative">
                <select
                  value={internshipDomain}
                  onChange={(e) => setInternshipDomain(e.target.value)}
                  className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium pl-3 pr-7 py-1 rounded-lg shadow-2xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="all">All Domains</option>
                  <option value="Software">Software Engineering</option>
                  <option value="Design">Product & UI/UX Design</option>
                  <option value="Data">Data Science & AI</option>
                  <option value="Research">Research & Space</option>
                  <option value="Mechanical">Mechanical Engineering</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* All Locations */}
              <div className="relative">
                <select
                  value={internshipLocation}
                  onChange={(e) => setInternshipLocation(e.target.value)}
                  className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium pl-3 pr-7 py-1 rounded-lg shadow-2xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="all">All Locations</option>
                  <option value="Remote">Remote</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Ahmedabad">Ahmedabad</option>
                  <option value="Gandhinagar">Gandhinagar</option>
                  <option value="Mumbai">Mumbai</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Stipend */}
              <div className="relative">
                <select
                  value={internshipStipend}
                  onChange={(e) => setInternshipStipend(e.target.value)}
                  className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium pl-3 pr-7 py-1 rounded-lg shadow-2xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="all">Stipend</option>
                  <option value="50k+">₹ 50,000+ / mo</option>
                  <option value="25k+">₹ 25,000+ / mo</option>
                  <option value="15k+">₹ 15,000+ / mo</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Duration */}
              <div className="relative">
                <select
                  value={internshipDuration}
                  onChange={(e) => setInternshipDuration(e.target.value)}
                  className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium pl-3 pr-7 py-1 rounded-lg shadow-2xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="all">Duration</option>
                  <option value="2 months">2 Months</option>
                  <option value="3 months">3 Months</option>
                  <option value="4 months">4 Months</option>
                  <option value="6 months">6 Months</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {(internshipDomain !== 'all' || internshipLocation !== 'all' || internshipStipend !== 'all' || internshipDuration !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setInternshipDomain('all');
                    setInternshipLocation('all');
                    setInternshipStipend('all');
                    setInternshipDuration('all');
                    setInternshipSort('newest');
                  }}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-orange-500 hover:bg-white dark:hover:bg-slate-900 transition"
                  title="Reset filters"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Sort: Newest First */}
            <div className="relative shrink-0">
              <select
                value={internshipSort}
                onChange={(e) => setInternshipSort(e.target.value as any)}
                className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium pl-7 pr-7 py-1 rounded-lg shadow-2xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="stipend">Highest Stipend</option>
                <option value="deadline">Approaching Deadline</option>
              </select>
              <ArrowUpDown className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <InternshipCardSkeleton count={4} />
            </div>
          ) : error ? (
            <div className="p-6 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 space-y-2">
              <AlertCircle className="w-6 h-6 mx-auto" />
              <p className="text-xs font-semibold">{error}</p>
              <button
                onClick={fetchListings}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition"
              >
                Retry Loading
              </button>
            </div>
          ) : visibleInternships.length === 0 ? (
            <InternshipEmptyState
              onReset={() => {
                setInternshipDomain('all');
                setInternshipLocation('all');
                setInternshipStipend('all');
                setInternshipDuration('all');
                setInternshipSort('newest');
                setGlobalSearch('');
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {visibleInternships.map(internship => (
                <InternshipOpportunityCard
                  key={internship.id}
                  listing={internship}
                  isSaved={savedIds.includes(internship.id)}
                  onToggleSave={toggleSave}
                  onSelect={(item) => navigate(`/career/internships/${item.id}`)}
                />
              ))}
            </div>
          )}
        </section>

      {/* SECTION D: FEATURED JOBS (STRICTLY FULL-TIME JOBS ONLY) */}
      <section 
        ref={jobRef} 
        className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2"
      >
          {/* Section Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 shadow-2xs flex items-center justify-center text-indigo-600 shrink-0">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Featured Jobs
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Full-time and part-time roles to kickstart your career.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAllJobs(!showAllJobs)}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 shrink-0 transition"
            >
              <span>{showAllJobs ? 'Show Less' : 'View All Jobs'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* 5-Dropdown Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              {/* All Domains */}
              <div className="relative">
                <select
                  value={jobDomain}
                  onChange={(e) => setJobDomain(e.target.value)}
                  className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium pl-3 pr-7 py-1 rounded-lg shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All Domains</option>
                  <option value="Software">Software Development</option>
                  <option value="Frontend">Frontend & Web</option>
                  <option value="Data">Data Analytics</option>
                  <option value="System">System & Cloud Engineering</option>
                  <option value="Electronics">VLSI & Embedded</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* All Locations */}
              <div className="relative">
                <select
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                  className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium pl-3 pr-7 py-1 rounded-lg shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All Locations</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Gurgaon">Gurgaon</option>
                  <option value="Mysuru">Mysuru</option>
                  <option value="Remote">Remote</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Ahmedabad">Ahmedabad</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Experience Level */}
              <div className="relative">
                <select
                  value={jobExperience}
                  onChange={(e) => setJobExperience(e.target.value)}
                  className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium pl-3 pr-7 py-1 rounded-lg shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">Experience Level</option>
                  <option value="0 - 2">0 – 2 Years</option>
                  <option value="1 - 3">1 – 3 Years</option>
                  <option value="fresher">Fresher</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Job Type */}
              <div className="relative">
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium pl-3 pr-7 py-1 rounded-lg shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">Job Type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Remote">Remote</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {(jobDomain !== 'all' || jobLocation !== 'all' || jobExperience !== 'all' || jobType !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setJobDomain('all');
                    setJobLocation('all');
                    setJobExperience('all');
                    setJobType('all');
                    setJobSort('newest');
                  }}
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-900 transition"
                  title="Reset filters"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Sort: Newest First */}
            <div className="relative shrink-0">
              <select
                value={jobSort}
                onChange={(e) => setJobSort(e.target.value as any)}
                className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-medium pl-7 pr-7 py-1 rounded-lg shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="salary">Highest Package (CTC)</option>
                <option value="deadline">Approaching Deadline</option>
              </select>
              <ArrowUpDown className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="animate-pulse bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl h-44" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 space-y-2">
              <AlertCircle className="w-6 h-6 mx-auto" />
              <p className="text-xs font-semibold">{error}</p>
              <button
                onClick={fetchListings}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition"
              >
                Retry Loading
              </button>
            </div>
          ) : visibleJobs.length === 0 ? (
            <div className="p-6 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <Briefcase className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Jobs Match This Filter</h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Try resetting your discipline or experience filters to explore entry-level engineering vacancies.
              </p>
              <button
                type="button"
                onClick={() => {
                  setJobDomain('all');
                  setJobLocation('all');
                  setJobExperience('all');
                  setJobType('all');
                  setJobSort('newest');
                  setGlobalSearch('');
                }}
                className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 rounded-lg hover:bg-indigo-100 transition"
              >
                Reset Job Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {visibleJobs.map(job => (
                <JobCard
                  key={job.id}
                  listing={job}
                  isSaved={savedIds.includes(job.id)}
                  onToggleSave={toggleSave}
                  onSelect={(item) => navigate(`/career/jobs/${item.id}`)}
                />
              ))}
            </div>
          )}
        </section>

      {/* SECTION E: RECOMMENDATION & PROFILE CTA BANNER */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#EEF2FF] via-[#F5F3FF] to-[#EDE9FE] dark:from-slate-900 dark:to-slate-800 border border-indigo-100 dark:border-slate-800 px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 z-10">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <Rocket className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              Not finding the right opportunity?
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              Create your profile, set your preferences and get personalized recommendations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/student/profile')}
          className="z-10 px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-2xs transition flex items-center gap-1 shrink-0"
        >
          <span>Update Your Profile</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default CareerListingsPage;
