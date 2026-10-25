
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, ArrowRight, Clock, TrendingUp, Lightbulb, Folder, Megaphone, 
  Calendar, BookOpen, Sparkles, Loader2, ShoppingBag, Tag, Calculator, 
  Cpu, ShieldCheck, GraduationCap, ChevronRight, FileText, X, 
  Code, Monitor, Zap, Settings, HardHat, CheckCircle2, Flame, Bot, Compass, Award, PlayCircle, Target, Layers, Users,
  Book, Download, Heart, Rocket
} from 'lucide-react';
import { DEPARTMENTS } from '../constants';
import { STUDY_GUIDES } from '../content/studyGuides';
import { apiClient } from '../api/client';
import { useStudentAcademic } from '../context/StudentAcademicContext';
import { useAuth } from '../context/AuthContext';
import { ExploreModeToggle } from '../components/personalization/ExploreModeToggle';
import { SmartLearningCTA } from '../components/home/SmartLearningCTA';

const DEPARTMENT_ICONS: Record<string, React.ComponentType<any>> = {
  Code,
  Monitor,
  Zap,
  Cpu,
  Settings,
  HardHat,
  Folder
};

interface LatestResourceItem {
  id: string;
  tag: string;
  tagBg: string;
  iconBg: string;
  Icon: React.ComponentType<any>;
  title: string;
  subtitle: string;
  downloads: string | number;
  views: string | number;
  link: string;
  createdAt?: string;
}

const mapDocToResourceItem = (doc: any): LatestResourceItem => {
  const docType = (doc.documentType || doc.document_type || 'study-material').toLowerCase();
  let tag = 'Material';
  let tagBg = 'bg-orange-50 dark:bg-orange-950/40 text-brand-orange border-orange-200/60 dark:border-orange-900/40';
  let iconBg = 'bg-orange-50 dark:bg-orange-950/40 text-brand-orange';
  let Icon = BookOpen;

  if (docType === 'pyq') {
    tag = 'PYQ';
    tagBg = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40';
    iconBg = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400';
    Icon = FileText;
  } else if (docType === 'syllabus') {
    tag = 'Syllabus';
    tagBg = 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/40';
    iconBg = 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400';
    Icon = Book;
  }

  const sub = doc.subjectName || doc.subject_name 
    ? `${doc.subjectName || doc.subject_name}${doc.semester ? ` • Sem ${doc.semester}` : ''}`
    : doc.branchName || doc.branch_name || 'Engineering Curriculum';

  return {
    id: doc.id,
    tag,
    tagBg,
    iconBg,
    Icon,
    title: doc.title || 'Untitled Resource',
    subtitle: sub,
    downloads: doc.downloads ?? 0,
    views: doc.views ?? 0,
    link: `/materials/${doc.id}`,
    createdAt: doc.createdAt || doc.created_at
  };
};

const FALLBACK_LATEST_RESOURCES: LatestResourceItem[] = [
  {
    id: 'doc_pyq_math2_s25',
    tag: 'PYQ',
    tagBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    Icon: FileText,
    title: 'Mathematics 2 (Summer 2025)',
    subtitle: 'Mathematics • Sem 2',
    downloads: 1420,
    views: 3200,
    link: '/materials/doc_pyq_math2_s25',
    createdAt: '2026-08-10'
  },
  {
    id: 'doc_pyq_fai_w25',
    tag: 'PYQ',
    tagBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    Icon: FileText,
    title: 'Fundamentals Of AI (Winter 2025)',
    subtitle: 'Computer Engineering • Sem 2',
    downloads: 980,
    views: 2150,
    link: '/materials/doc_pyq_fai_w25',
    createdAt: '2026-08-10'
  },
  {
    id: 'doc_pyq_cn_s25',
    tag: 'PYQ',
    tagBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    Icon: FileText,
    title: 'Computer Networks (Summer 2025)',
    subtitle: 'Information Technology • Sem 4',
    downloads: 1850,
    views: 4200,
    link: '/materials/doc_pyq_cn_s25',
    createdAt: '2026-08-10'
  },
  {
    id: 'doc_topological_sorting_67b2a148',
    tag: 'Material',
    tagBg: 'bg-orange-50 dark:bg-orange-950/40 text-brand-orange border-orange-200/60 dark:border-orange-900/40',
    iconBg: 'bg-orange-50 dark:bg-orange-950/40 text-brand-orange',
    Icon: BookOpen,
    title: 'Topological Sorting & Graph Algorithms',
    subtitle: 'Design & Analysis of Algorithms • Sem 5',
    downloads: 2100,
    views: 5400,
    link: '/materials/doc_topological_sorting_67b2a148',
    createdAt: '2026-08-05'
  }
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { academicProfile, isExploreMode, setExploreMode } = useStudentAcademic();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [studyMaterials, setStudyMaterials] = useState<any[]>([]);
  const [pyqs, setPyqs] = useState<any[]>([]);
  const [syllabuses, setSyllabuses] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [hasLoadedIndex, setHasLoadedIndex] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [latestResources, setLatestResources] = useState<LatestResourceItem[]>(FALLBACK_LATEST_RESOURCES);
  const [loadingLatestResources, setLoadingLatestResources] = useState(true);
  const [publicStats, setPublicStats] = useState<{
    departmentsCount: number;
    subjectsCount: number;
    materialsCount: number;
    pyqsCount: number;
    questionsCount: number;
    totalResources: number;
  }>({
    departmentsCount: 9,
    subjectsCount: 40,
    materialsCount: 0,
    pyqsCount: 0,
    questionsCount: 0,
    totalResources: 0,
  });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await apiClient.getAnnouncements();
        setAnnouncements(data || []);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setLoadingAnnouncements(false);
      }
    };

    const fetchLatestDocs = async () => {
      try {
        const docs = await apiClient.getLatestDocuments();
        if (Array.isArray(docs) && docs.length > 0) {
          const mapped = docs.map(mapDocToResourceItem);
          setLatestResources(mapped);
        }
      } catch (error) {
        console.error("Error fetching latest resources:", error);
      } finally {
        setLoadingLatestResources(false);
      }
    };

    const fetchPlatformStats = async () => {
      try {
        const res = await apiClient.getPublicStats();
        if (res?.stats) {
          setPublicStats(res.stats);
        }
      } catch (error) {
        console.warn("Could not load real platform stats, using verified GTU baseline:", error);
      }
    };

    fetchAnnouncements();
    fetchLatestDocs();
    fetchPlatformStats();

    // Click outside listener for search suggestions
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsFocused(false);
      // Navigate to AI Chat with the query
      navigate(`/ai-tutor?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleFocus = async () => {
    setIsFocused(true);
    if (hasLoadedIndex || loadingSearch) return;

    setLoadingSearch(true);
    try {
      const data = await apiClient.getSearchIndex();
      setStudyMaterials(data.studyMaterials || []);
      setPyqs(data.pyqs || []);
      setSyllabuses(data.syllabuses || []);
      setHasLoadedIndex(true);
    } catch (e) {
      console.error('Error loading search index:', e);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Phase 4: Debounced live search fetching from Hono backend
  useEffect(() => {
    if (searchQuery.trim() === '') return;
    
    const delayDebounceFn = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const data = await apiClient.search(searchQuery);
        setStudyMaterials(Array.isArray(data?.studyMaterials) ? data.studyMaterials : []);
        setPyqs(Array.isArray(data?.pyqs) ? data.pyqs : []);
        setSyllabuses(Array.isArray(data?.syllabuses) ? data.syllabuses : []);
      } catch (e) {
        console.error('Error fetching search results:', e);
      } finally {
        setLoadingSearch(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);


  // Perform live search suggestion filters
  const filteredStudyMaterials = searchQuery.trim() === '' ? [] : (() => {
    const seenIds = new Set();
    const seenTitles = new Set();
    return (studyMaterials || []).filter(m => {
      if (seenIds.has(m.id)) return false;
      const titleKey = (m.title || '').trim().toLowerCase();
      if (seenTitles.has(titleKey)) return false;
      const matches = (m.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (m.author || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (matches) {
        seenIds.add(m.id);
        seenTitles.add(titleKey);
        return true;
      }
      return false;
    });
  })().slice(0, 3);

  const filteredPyqs = searchQuery.trim() === '' ? [] : (() => {
    const seenIds = new Set();
    const seenTitles = new Set();
    return (pyqs || []).filter(p => {
      if (seenIds.has(p.id)) return false;
      const titleKey = (p.title || '').trim().toLowerCase();
      if (seenTitles.has(titleKey)) return false;
      const matches = (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (p.year || '').toString().includes(searchQuery);
      if (matches) {
        seenIds.add(p.id);
        seenTitles.add(titleKey);
        return true;
      }
      return false;
    });
  })().slice(0, 3);

  const filteredSyllabuses = searchQuery.trim() === '' ? [] : (() => {
    const seenIds = new Set();
    const seenTitles = new Set();
    return (syllabuses || []).filter(s => {
      if (seenIds.has(s.id)) return false;
      const titleKey = (s.title || '').trim().toLowerCase();
      if (seenTitles.has(titleKey)) return false;
      const matches = (s.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (s.subjectName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (s.subjectCode || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (matches) {
        seenIds.add(s.id);
        seenTitles.add(titleKey);
        return true;
      }
      return false;
    });
  })().slice(0, 3);

  const filteredGuides = searchQuery.trim() === '' ? [] : (STUDY_GUIDES || []).filter(g => 
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 3);

  const hasResults = filteredStudyMaterials.length > 0 || filteredPyqs.length > 0 || filteredSyllabuses.length > 0 || filteredGuides.length > 0;

  // Helper to render dynamic icons safely
  const renderIcon = (iconName: string) => {
    const IconComponent = DEPARTMENT_ICONS[iconName] || Folder;
    return <IconComponent className="h-6 w-6" />;
  };



  return (
    <div className="overflow-x-hidden relative">
      {/* Global Background Pattern */}
      <div className="fixed inset-0 z-[-1] bg-grid-pattern dark:bg-grid-pattern-dark bg-grid opacity-[0.4] pointer-events-none" />

      {/* Hero Section */}
      <div id="hero" className="relative pt-6 pb-12 lg:pt-10 lg:pb-16 overflow-hidden">
        {/* Soft background glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl overflow-hidden z-[-1] opacity-50 dark:opacity-20 pointer-events-none">
          <div className="absolute top-[-5%] left-[20%] w-[35%] h-[35%] rounded-full bg-orange-200 dark:bg-orange-900/40 blur-[120px]" />
          <div className="absolute top-[10%] right-[15%] w-[30%] h-[40%] rounded-full bg-amber-100 dark:bg-amber-900/30 blur-[100px]" />
        </div>

        {/* Decorative Grid Dots */}
        <div className="hidden lg:block absolute top-20 left-8 w-24 h-24 opacity-20 pointer-events-none bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:12px_12px]" />
        <div className="hidden lg:block absolute top-36 right-8 w-24 h-24 opacity-20 pointer-events-none bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:12px_12px]" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/40 text-brand-orange text-xs sm:text-sm font-semibold shadow-xs animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-brand-orange" />
            <span>Your All-in-One Academic Companion</span>
          </div>

          {/* Main Display Headline */}
          <h1 id="hero-title" className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display text-navy-900 dark:text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Learn Smarter,
            <br />
            Achieve <span className="text-brand-orange">Higher.</span>
          </h1>

          {/* Subtitle Paragraph */}
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Access quality study materials, previous papers, notes, and AI-powered learning tools – all in one place. Built for university students, by students.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            <Link 
              to="/student" 
              className="px-7 py-3.5 rounded-full bg-[#f97316] hover:bg-orange-600 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 transition-all hover:scale-[1.03] flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link 
              to="/resources" 
              className="px-7 py-3.5 rounded-full bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-750 hover:border-brand-orange text-navy-900 dark:text-white font-bold text-sm shadow-sm transition-all hover:scale-[1.03] flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-brand-orange" />
              <span>Explore Resources</span>
            </Link>

            <Link 
              to="/guides" 
              className="px-7 py-3.5 rounded-full bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 hover:border-brand-orange text-brand-orange font-bold text-sm shadow-sm transition-all hover:scale-[1.03] flex items-center gap-2"
            >
              <span>Exam Guide</span>
            </Link>
          </div>

          {/* 4 Feature Highlights Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-4 text-left">
            <div className="p-3.5 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md rounded-2xl border border-gray-150 dark:border-navy-800 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-brand-orange flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-navy-900 dark:text-white">University Focused</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">100% Relevant</p>
              </div>
            </div>

            <div className="p-3.5 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md rounded-2xl border border-gray-150 dark:border-navy-800 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-navy-900 dark:text-white">GTU Departments</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{publicStats.departmentsCount} Engineering Branches</p>
              </div>
            </div>

            <div className="p-3.5 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md rounded-2xl border border-gray-150 dark:border-navy-800 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-navy-900 dark:text-white">{publicStats.materialsCount > 0 ? `${publicStats.materialsCount}+ Notes` : 'Academic Library'}</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">& GTU PYQs</p>
              </div>
            </div>

            <div className="p-3.5 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md rounded-2xl border border-gray-150 dark:border-navy-800 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-navy-900 dark:text-white">AI Tutor</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">24/7 Support</p>
              </div>
            </div>
          </div>

          {/* Floating Pill Search Bar */}
          <div ref={searchWrapperRef} className="relative max-w-3xl mx-auto pt-2 z-30">
            <form onSubmit={handleSearch} className="relative group z-20">
              <div className="flex items-center bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-750 rounded-full p-2 shadow-lg shadow-gray-200/50 dark:shadow-none focus-within:border-brand-orange/50 transition-all">
                <div className="pl-4 text-gray-400">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={handleFocus}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search syllabus, PYQs, study notes or ask AI..."
                  className="flex-1 bg-transparent border-none outline-none px-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-full bg-[#f97316] hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all shrink-0 flex items-center gap-1.5"
                >
                  Ask AI
                </button>
              </div>
            </form>

            {/* Trending Tags */}
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
              <span className="font-bold">Trending:</span>
              {['Data Structures', 'Thermodynamics', 'Calculus'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchQuery(tag)}
                  className="px-3 py-1 rounded-full bg-orange-50 dark:bg-navy-800 text-brand-orange text-[11px] font-bold border border-orange-100 dark:border-navy-700 hover:bg-orange-100 transition"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Live Search Suggestions Dropdown */}
            {isFocused && searchQuery.trim() !== '' && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden z-50 text-left">
                <div className="max-h-[350px] overflow-y-auto p-4 space-y-4">
                  {loadingSearch ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin text-brand-orange" />
                      <span>Searching resources...</span>
                    </div>
                  ) : !hasResults ? (
                    <div className="py-4 text-center">
                      <p className="text-sm font-bold text-gray-500 dark:text-gray-400">No matching study material found</p>
                      <button
                        onClick={() => {
                          setIsFocused(false);
                          navigate(`/ai-tutor?q=${encodeURIComponent(searchQuery)}`);
                        }}
                        className="mt-2 text-xs text-brand-orange font-bold hover:underline"
                      >
                        Ask AI Tutor about "{searchQuery}"
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Syllabus Results */}
                      {filteredSyllabuses.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">GTU Syllabus</span>
                          <div className="space-y-1">
                            {filteredSyllabuses.map(s => {
                              const dept = DEPARTMENTS.find(d => d.id === s.departmentId);
                              return (
                                <div
                                  key={s.id}
                                  onClick={() => {
                                    setIsFocused(false);
                                    navigate(`/materials/${s.id}`);
                                  }}
                                  className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-navy-850 border border-transparent hover:border-brand-orange/20 cursor-pointer group transition-all"
                                >
                                  <div className="flex-1 min-w-0 pr-3">
                                    <div className="flex items-center gap-1.5 text-[9px] font-semibold text-gray-400 mb-0.5">
                                      <span className="text-green-600 dark:text-green-400 font-bold">Syllabus</span>
                                      <span>•</span>
                                      <span>{dept?.name || 'Syllabus'}</span>
                                    </div>
                                    <h5 className="text-xs font-bold text-navy-900 dark:text-white truncate group-hover:text-brand-orange transition-colors">{s.title}</h5>
                                  </div>
                                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-navy-700 group-hover:translate-x-1 group-hover:text-brand-orange transition-all" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Study Material Results */}
                      {filteredStudyMaterials.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Notes & Study Material</span>
                          <div className="space-y-1">
                            {filteredStudyMaterials.map(m => {
                              const dept = DEPARTMENTS.find(d => d.id === m.departmentId);
                              return (
                                <div
                                  key={m.id}
                                  onClick={() => {
                                    setIsFocused(false);
                                    navigate(`/materials/${m.id}`);
                                  }}
                                  className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-navy-855 border border-transparent hover:border-brand-orange/20 cursor-pointer group transition-all"
                                >
                                  <div className="flex-1 min-w-0 pr-3">
                                    <div className="flex items-center gap-1.5 text-[9px] font-semibold text-gray-400 mb-0.5">
                                      <span className="text-blue-600 dark:text-blue-400 font-bold">Notes</span>
                                      <span>•</span>
                                      <span>{dept?.name || 'Notes'}</span>
                                    </div>
                                    <h5 className="text-xs font-bold text-navy-900 dark:text-white truncate group-hover:text-brand-orange transition-colors">{m.title}</h5>
                                  </div>
                                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-navy-700 group-hover:translate-x-1 group-hover:text-brand-orange transition-all" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* PYQs Results */}
                      {filteredPyqs.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">PYQs & Papers</span>
                          <div className="space-y-1">
                            {filteredPyqs.map(p => {
                              const dept = DEPARTMENTS.find(d => d.id === p.departmentId);
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    setIsFocused(false);
                                    navigate(`/pyqs?search=${encodeURIComponent(p.title)}`);
                                  }}
                                  className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-navy-855 border border-transparent hover:border-brand-orange/20 cursor-pointer group transition-all"
                                >
                                  <div className="flex-1 min-w-0 pr-3">
                                    <div className="flex items-center gap-1.5 text-[9px] font-semibold text-gray-400 mb-0.5">
                                      <span className="text-orange-600 dark:text-orange-400 font-bold">PYQ</span>
                                      <span>•</span>
                                      <span>{dept?.code || 'PYQ'}</span>
                                    </div>
                                    <h5 className="text-xs font-bold text-navy-900 dark:text-white truncate group-hover:text-brand-orange transition-colors">{p.title}</h5>
                                  </div>
                                  <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-navy-700 group-hover:translate-x-1 group-hover:text-brand-orange transition-all" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Study Guides Results */}
                      {filteredGuides.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Study Guides</span>
                          <div className="space-y-1">
                            {filteredGuides.map(g => (
                              <div
                                key={g.slug}
                                onClick={() => {
                                  setIsFocused(false);
                                    navigate(`/guides/${g.slug}`);
                                }}
                                className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-navy-850 border border-transparent hover:border-brand-orange/20 cursor-pointer group transition-all"
                              >
                                <div className="flex-1 min-w-0 pr-3">
                                  <div className="flex items-center gap-1.5 text-[9px] font-semibold text-gray-400 mb-0.5">
                                    <span className="text-purple-600 dark:text-purple-400 font-bold">Guides</span>
                                    <span>•</span>
                                    <span>{g.category}</span>
                                  </div>
                                  <h5 className="text-xs font-bold text-navy-900 dark:text-white truncate group-hover:text-brand-orange transition-colors">{g.title}</h5>
                                </div>
                                <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-navy-700 group-hover:translate-x-1 group-hover:text-brand-orange transition-all" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div 
                  onClick={() => {
                    setIsFocused(false);
                    navigate(`/ai-tutor?q=${encodeURIComponent(searchQuery)}`);
                  }}
                  className="px-4 py-2.5 bg-gray-50 dark:bg-navy-950 border-t border-gray-150 dark:border-navy-800 flex items-center justify-between text-xs text-navy-800 dark:text-brand-orange font-bold hover:bg-gray-100 dark:hover:bg-navy-850 cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-brand-orange animate-pulse" />
                    Ask AI Tutor: "Explain {searchQuery}"
                  </span>
                  <ChevronRight className="h-4 w-4 text-brand-orange" />
                </div>
              </div>
            )}

          {/* Bottom Floating Stats Bar */}
          <div className="pt-8 animate-slide-up" style={{ animationDelay: '500ms' }}>
            <div className="max-w-4xl mx-auto bg-white/90 dark:bg-navy-900/90 backdrop-blur-xl border border-gray-150 dark:border-navy-800 rounded-3xl p-4 sm:p-5 shadow-xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-navy-800">
              <div className="flex items-center gap-3 justify-center p-2">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-brand-orange flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-extrabold text-navy-900 dark:text-white">{publicStats.departmentsCount} Branches</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">GTU Engineering</div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-center p-2 pt-4 sm:pt-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-extrabold text-navy-900 dark:text-white">{publicStats.materialsCount > 0 ? `${publicStats.materialsCount}+` : `${publicStats.subjectsCount}+`}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">Study Materials</div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-center p-2 pt-4 sm:pt-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-extrabold text-navy-900 dark:text-white">{publicStats.pyqsCount > 0 ? `${publicStats.pyqsCount}+` : 'All GTU'}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">PYQs Available</div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-center p-2 pt-4 md:pt-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-extrabold text-navy-900 dark:text-white">{publicStats.questionsCount > 0 ? `${publicStats.questionsCount}+` : 'Question Bank'}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">Verified MCQs</div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-center p-2 pt-4 md:pt-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-extrabold text-navy-900 dark:text-white">Active OS</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">Student Portal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* 1. Explore by Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14 relative z-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 dark:text-white">Explore by Category</h2>
          <Link to="/resources" className="text-xs sm:text-sm font-bold text-brand-orange hover:text-brand-hover flex items-center gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
          {/* Syllabus */}
          <Link to="/resources/syllabus" className="p-5 rounded-2xl bg-[#f0f9ff] dark:bg-sky-950/20 border border-sky-100/60 dark:border-sky-900/30 flex flex-col items-center text-center group hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 rounded-full bg-[#e0f2fe] dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Book className="w-5 h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-extrabold text-navy-900 dark:text-white mb-0.5">Syllabus</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">NEP Teaching Scheme</p>
          </Link>

          {/* Study Materials */}
          <Link to="/resources/study-material" className="p-5 rounded-2xl bg-[#fff7f2] dark:bg-amber-950/20 border border-orange-100/60 dark:border-amber-900/30 flex flex-col items-center text-center group hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 rounded-full bg-[#ffe8d6] dark:bg-orange-900/40 text-brand-orange flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-extrabold text-navy-900 dark:text-white mb-0.5">Study Material</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Notes & Formulas</p>
          </Link>

          {/* Previous Year Questions */}
          <Link to="/pyqs" className="p-5 rounded-2xl bg-[#f0fdf4] dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/30 flex flex-col items-center text-center group hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 rounded-full bg-[#dcfce7] dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-extrabold text-navy-900 dark:text-white mb-0.5">PYQ Papers</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Solved Questions</p>
          </Link>

          {/* Blogs & Guides */}
          <Link to="/blogs" className="p-5 rounded-2xl bg-[#fcf5ff] dark:bg-purple-950/20 border border-purple-100/60 dark:border-purple-900/30 flex flex-col items-center text-center group hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="w-12 h-12 rounded-full bg-[#f3e8ff] dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-xs sm:text-sm font-extrabold text-navy-900 dark:text-white mb-0.5">Blogs & Guides</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Exam Tips & Articles</p>
          </Link>
        </div>
      </section>

      {/* 2. Latest Resources */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 relative z-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 dark:text-white">Latest Resources</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">Recently added study notes, question papers, and solutions</p>
          </div>
          <Link to="/resources" className="text-xs sm:text-sm font-bold text-brand-orange hover:text-brand-hover flex items-center gap-1">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingLatestResources ? (
            [1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white dark:bg-navy-900 border border-gray-150 dark:border-navy-800 rounded-2xl p-4 animate-pulse space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-16 bg-gray-200 dark:bg-navy-800 rounded-md" />
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-navy-800" />
                </div>
                <div className="h-4 bg-gray-200 dark:bg-navy-800 rounded w-5/6" />
                <div className="h-3 bg-gray-200 dark:bg-navy-800 rounded w-1/2" />
                <div className="pt-4 border-t border-gray-100 dark:border-navy-800 flex justify-between">
                  <div className="h-3 bg-gray-200 dark:bg-navy-800 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 dark:bg-navy-800 rounded w-1/4" />
                </div>
              </div>
            ))
          ) : (
            latestResources.slice(0, 4).map((res) => {
              const IconComp = res.Icon;
              return (
                <Link
                  key={res.id}
                  to={res.link}
                  className="bg-white dark:bg-navy-900 border border-gray-150 dark:border-navy-800 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-brand-orange/30 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Pill Tag & Top-Right Icon */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${res.tagBg}`}>
                        {res.tag}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${res.iconBg}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Card Title & Subtitle */}
                    <h3 className="text-sm font-bold text-navy-900 dark:text-white line-clamp-2 mb-1 group-hover:text-brand-orange transition-colors">
                      {res.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-4 line-clamp-1">
                      {res.subtitle}
                    </p>
                  </div>

                  {/* Card Bottom Meta (Recency & Downloads) */}
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100 dark:border-navy-800/80 font-bold">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-brand-orange" />
                      <span>{res.createdAt ? new Date(res.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}</span>
                    </span>
                    <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500 font-medium text-[11px]">
                      <Download className="w-3.5 h-3.5" /> {res.downloads || 0}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* 3. Why Students Love ShikshaSahayak? */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 relative z-20">
        <div className="text-center mb-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-navy-900 dark:text-white">
            Why Students Love ShikshaSahayak?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 text-center max-w-6xl mx-auto">
          {/* Exam Focused */}
          <div className="flex flex-col items-center p-3">
            <div className="w-14 h-14 rounded-full bg-[#fff2e8] dark:bg-orange-950/40 text-brand-orange flex items-center justify-center mb-4">
              <Target className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-extrabold text-navy-900 dark:text-white mb-1.5">Exam Focused</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[200px]">
              Content curated for university syllabus & exam pattern.
            </p>
          </div>

          {/* Trusted & Reliable */}
          <div className="flex flex-col items-center p-3">
            <div className="w-14 h-14 rounded-full bg-[#fff2e8] dark:bg-orange-950/40 text-brand-orange flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-extrabold text-navy-900 dark:text-white mb-1.5">Trusted & Reliable</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[200px]">
              Verified by students, created for students.
            </p>
          </div>

          {/* All in One Place */}
          <div className="flex flex-col items-center p-3">
            <div className="w-14 h-14 rounded-full bg-[#fff2e8] dark:bg-orange-950/40 text-brand-orange flex items-center justify-center mb-4">
              <Rocket className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-extrabold text-navy-900 dark:text-white mb-1.5">All in One Place</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[200px]">
              Notes, PYQs, syllabus, blogs – everything you need.
            </p>
          </div>

          {/* AI Powered */}
          <div className="flex flex-col items-center p-3">
            <div className="w-14 h-14 rounded-full bg-[#fff2e8] dark:bg-orange-950/40 text-brand-orange flex items-center justify-center mb-4">
              <Bot className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-extrabold text-navy-900 dark:text-white mb-1.5">AI Powered</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[200px]">
              Get instant help, summaries & smart recommendations.
            </p>
          </div>

          {/* Made with ❤️ */}
          <div className="flex flex-col items-center p-3">
            <div className="w-14 h-14 rounded-full bg-[#fff2e8] dark:bg-orange-950/40 text-brand-orange flex items-center justify-center mb-4">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-extrabold text-navy-900 dark:text-white mb-1.5">Made with ❤️</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[200px]">
              Built by students who understand your needs.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Start Your Smart Learning Journey Today! CTA Banner */}
      <SmartLearningCTA />

      {/* Study Guide Library */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange mb-2">Original study guides</p>
            <h2 className="text-3xl font-bold text-navy-900 dark:text-white mb-3">Prepare with focused, readable exam guidance</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              The guide library turns common student problems into practical revision plans:
              what to study, how to practice, which mistakes to avoid, and how to present answers in semester exams.
            </p>
          </div>
          <Link to="/guides" className="inline-flex items-center justify-center gap-2 bg-navy-900 dark:bg-brand-orange text-white px-5 py-3 rounded-xl font-bold hover:bg-navy-800 dark:hover:bg-brand-hover transition-colors">
            Browse all guides <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {STUDY_GUIDES.slice(0, 3).map((guide) => (
            <Link
              key={guide.slug}
              to={`/guides/${guide.slug}`}
              className="group bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-brand-orange/40 transition-all"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-brand-orange/10 px-2.5 py-0.5 text-xs font-bold text-brand-orange">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {guide.category}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{guide.readingMinutes} min</span>
              </div>
              <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-2 group-hover:text-brand-orange transition-colors line-clamp-1">
                {guide.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3 line-clamp-2">
                {guide.description}
              </p>
              <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-brand-orange">
                Read guide <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Notice Board */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-100 dark:border-navy-800 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-xl text-red-600 dark:text-red-400">
                <Megaphone className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-navy-900 dark:text-white">Notice Board</h2>
            </div>
            <Link to="/announcements" className="text-sm text-brand-orange hover:text-brand-hover font-bold flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="max-h-[320px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-navy-800">
            {loadingAnnouncements ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-center justify-between p-4 rounded-2xl bg-gray-100/50 dark:bg-navy-800/40 border border-transparent">
                    <div className="flex items-start gap-4 w-full">
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-gray-300 dark:bg-navy-700 flex-shrink-0" />
                      <div className="space-y-2 w-full">
                        <div className="h-4 bg-gray-200 dark:bg-navy-700 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-navy-700 rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : announcements.length > 0 ? (
              announcements.map((item, index) => {
                // Determine destination link with intelligent fallback
                let targetUrl = item.link;
                if (!targetUrl) {
                  const combined = `${item.title || ''} ${item.content || ''} ${item.text || ''}`;
                  const urlMatch = combined.match(/https?:\/\/[^\s]+/i);
                  if (urlMatch) {
                    targetUrl = urlMatch[0];
                  } else if (/pyq/i.test(combined)) {
                    targetUrl = '/resources/pyq';
                  } else {
                    targetUrl = '/announcements';
                  }
                }

                const handleCardClick = () => {
                  if (targetUrl) {
                    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
                      window.open(targetUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      navigate(targetUrl);
                    }
                  }
                };

                const isExternal = Boolean(targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')));

                return (
                  <div 
                    key={item.id} 
                    role="button"
                    tabIndex={0}
                    onClick={handleCardClick}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardClick();
                      }
                    }}
                    className={`animate-slide-up group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                      index === 0 
                      ? 'bg-gradient-to-r from-orange-50 to-white dark:from-navy-800/80 dark:to-navy-900 border-brand-orange/30 shadow-sm hover:border-brand-orange/60' 
                      : 'bg-gray-50 dark:bg-navy-800/50 hover:bg-white dark:hover:bg-navy-850 border-gray-100 dark:border-navy-800 hover:border-gray-300 dark:hover:border-navy-700'
                    }`}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${index === 0 ? 'bg-brand-orange animate-pulse' : 'bg-brand-orange'}`} />
                      <div>
                        <h3 className="font-semibold transition-colors text-sm md:text-base group-hover:text-brand-orange text-navy-900 dark:text-white">
                          {item.title || item.text}
                          {index === 0 && <span className="ml-2 text-[10px] text-brand-orange font-black uppercase tracking-tighter">Featured</span>}
                        </h3>
                        {item.content && item.content !== (item.title || item.text) && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                            {item.content}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString()
                              : 'Just now'}
                          </span>
                          <span className="text-[10px] text-brand-orange font-bold flex items-center gap-1 group-hover:scale-105 transition-transform">
                            <Sparkles className="h-2.5 w-2.5 animate-pulse" /> 
                            {isExternal ? 'Open Drive / Resource' : 'Click to view details'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${index === 0 ? 'text-brand-orange' : 'text-gray-400 group-hover:text-brand-orange'}`} />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-gray-500 text-sm italic">
                No active announcements at the moment. Check back later!
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Trust Section */}
      <section className="bg-white dark:bg-navy-900 py-16 border-y border-gray-100 dark:border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange mb-2">How the portal works</p>
              <h2 className="text-3xl font-bold text-navy-900 dark:text-white mb-4">Built for useful study material, not clutter</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                ShikshaSahayak focuses on engineering students who need quick access to previous year papers,
                notes, revision guides, and practical study support. Student submissions are reviewed before publishing,
                and important pages such as privacy, terms, contact, disclaimer, and sitemap are available site-wide.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-gray-50 dark:bg-navy-950 border border-gray-100 dark:border-navy-800 p-5">
                <ShieldCheck className="h-7 w-7 text-brand-orange mb-4" />
                <h3 className="font-bold text-navy-900 dark:text-white mb-2">Reviewed resources</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Uploads go through admin review before appearing in the public library.</p>
              </div>
              <div className="rounded-2xl bg-gray-50 dark:bg-navy-950 border border-gray-100 dark:border-navy-800 p-5">
                <BookOpen className="h-7 w-7 text-brand-orange mb-4" />
                <h3 className="font-bold text-navy-900 dark:text-white mb-2">Original guides</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Subject and study-skill pages explain preparation steps in student-friendly language.</p>
              </div>
              <div className="rounded-2xl bg-gray-50 dark:bg-navy-950 border border-gray-100 dark:border-navy-800 p-5">
                <Search className="h-7 w-7 text-brand-orange mb-4" />
                <h3 className="font-bold text-navy-900 dark:text-white mb-2">Easy navigation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Branch filters, guide categories, and sitemap links help students find material quickly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Departments */}
      <div className="bg-white dark:bg-navy-900 py-16 border-t border-gray-100 dark:border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-navy-900 dark:text-white mb-4">Browse by Department</h2>
            <p className="text-gray-500 dark:text-gray-400">Find materials specific to your engineering branch.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {DEPARTMENTS.map((dept) => {
              // Map UI department IDs to the actual backend/database branch slugs
              const branchSlug = dept.id === 'cse' ? 'computer'
                               : dept.id === 'ee' ? 'electrical'
                               : dept.id === 'me' ? 'mechanical'
                               : dept.id === 'ce' ? 'civil'
                               : dept.id;
              return (
                <Link
                  key={dept.id}
                  to={`/resources/study-material/${branchSlug}`}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-navy-950 border border-gray-100 dark:border-navy-800 hover:bg-white hover:shadow-lg hover:border-gray-200 dark:hover:bg-navy-800 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${dept.color} bg-opacity-10 dark:bg-opacity-20 group-hover:scale-110 group-hover:animate-wiggle transition-transform duration-300`}>
                    {renderIcon(dept.iconName)}
                  </div>
                  <h3 className="font-bold text-navy-900 dark:text-white text-xs sm:text-sm text-center">{dept.name}</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">{dept.code}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-navy-900 to-blue-900 dark:from-navy-800 dark:to-navy-900 rounded-[2.5rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between relative overflow-hidden shadow-2xl text-center md:text-left">
          {/* Abstract Shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none animate-blob mix-blend-overlay"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-orange opacity-20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none animate-blob mix-blend-overlay" style={{ animationDelay: '2s' }}></div>

          <div className="relative z-10 max-w-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-display">Share your Knowledge</h2>
            <p className="text-blue-100 text-lg leading-relaxed mb-8 md:mb-0">
              Help grow a reviewed study material repository for students who need clear notes, PYQs, and practical exam preparation.
            </p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link to="/contribute" className="relative overflow-hidden bg-brand-orange text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-hover transition-all shadow-lg shadow-orange-500/20 transform hover:-translate-y-1 text-center group">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[100%] group-hover:animate-shimmer" />
              <span className="relative">Contribute material</span>
            </Link>
            <a href="https://chat.whatsapp.com/JKjcvjun6roIkbat7O59uJ" target="_blank" rel="noopener noreferrer" className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all text-center flex items-center justify-center">
              Join Community
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
