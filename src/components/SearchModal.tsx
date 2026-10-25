import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  FileText, 
  BookOpen, 
  ChevronRight, 
  Loader2, 
  Layers,
  Target,
  ClipboardList,
  Folder,
  ArrowRight,
  Flame,
  CheckCircle2,
  Briefcase,
  Trophy,
  Gift,
  Code,
  GraduationCap,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useStudentAcademic } from '../context/StudentAcademicContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CommandCategory = 
  | 'all' 
  | 'subjects' 
  | 'notes' 
  | 'pyqs' 
  | 'courses' 
  | 'practice' 
  | 'career' 
  | 'contests' 
  | 'scholarships';

interface SearchResultItem {
  id: string;
  category: 'subject' | 'note' | 'pyq' | 'question' | 'assignment' | 'course' | 'career' | 'contest' | 'scholarship';
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  path: string;
}

// Built-in verified items across all 11 Prep Zone modules for instantaneous discovery
const STATIC_ACADEMIC_COMMANDS: SearchResultItem[] = [
  {
    id: 'subj-em',
    category: 'subject',
    title: 'Electrical Machines (3130007)',
    subtitle: 'Semester 3 • Electrical Engineering • GTU',
    badge: 'Subject',
    badgeColor: 'bg-orange-500/10 text-[#F97316]',
    path: '/resources/study-material/electrical/semester/3/electrical-machines'
  },
  {
    id: 'subj-m3',
    category: 'subject',
    title: 'Mathematics-3 (3110016)',
    subtitle: 'Semester 3 • All Branches Foundation • GTU',
    badge: 'Subject',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    path: '/resources/study-material/computer/semester/3/mathematics-3'
  },
  {
    id: 'subj-na',
    category: 'subject',
    title: 'Network Analysis (3130005)',
    subtitle: 'Semester 3 • Electrical & Electronics • GTU',
    badge: 'Subject',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    path: '/resources/study-material/electrical/semester/3/network-analysis'
  },
  {
    id: 'note-trans',
    category: 'note',
    title: 'Transformer Unit 2 Handwritten Notes',
    subtitle: 'Electrical Machines • Magnetic Circuits & Efficiency Formulas',
    badge: 'Notes',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    path: '/resources/study-material'
  },
  {
    id: 'pyq-trans',
    category: 'pyq',
    title: 'Electrical Machines GTU Winter 2024 Paper',
    subtitle: 'GTU Official Solved Question Paper',
    badge: 'PYQ',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    path: '/resources/pyq'
  },
  {
    id: 'mcq-trans',
    category: 'question',
    title: 'Transformers MCQ Practice Test (20 Questions)',
    subtitle: 'Practice Zone • Principle of Induction & Efficiency',
    badge: 'Practice',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    path: '/practice'
  },
  {
    id: 'crs-dsa',
    category: 'course',
    title: 'Data Structures & Algorithms in C++',
    subtitle: 'Full Course • 45 Lessons • GTU Syllabus Aligned',
    badge: 'Course',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    path: '/courses/dsa-cpp'
  },
  {
    id: 'crs-web',
    category: 'course',
    title: 'Full Stack Web Development with React 19',
    subtitle: 'Modern Web Track • Frontend to Edge APIs',
    badge: 'Course',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    path: '/courses/fullstack-web-dev'
  },
  {
    id: 'code-100',
    category: 'contest',
    title: '100 Days to Code Challenge',
    subtitle: 'Daily Programming Challenge & Streak Tracker',
    badge: '100 Days',
    badgeColor: 'bg-orange-500/10 text-[#F97316]',
    path: '/practice/100-days-of-code'
  },
  {
    id: 'code-conq',
    category: 'contest',
    title: 'Coding Conquest Arena',
    subtitle: 'Competitive Coding Challenges with Live Scoreboard',
    badge: 'Contest',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    path: '/compete/coding-conquest'
  },
  {
    id: 'fest-proj',
    category: 'contest',
    title: 'Projections 2026 Tech Festival',
    subtitle: 'Robotics, Coding & Technical Symposia at Parul Univ',
    badge: 'Fest',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    path: '/compete/festivals'
  },
  {
    id: 'car-resume',
    category: 'career',
    title: 'Pro ATS Resume Builder',
    subtitle: 'Engineering Multi-Section Resume with PDF Export',
    badge: 'Resume',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    path: '/student/resume'
  },
  {
    id: 'car-prep',
    category: 'career',
    title: '5-Day Structured Interview Prep Program',
    subtitle: 'Core CS, DSA, System Design, Aptitude & Mock Prep',
    badge: '5-Day Prep',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    path: '/career/interview-prep'
  },
  {
    id: 'car-intern',
    category: 'career',
    title: 'Verified Engineering Internships Directory',
    subtitle: 'Software, Electronics, Core Engineering Roles',
    badge: 'Internship',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    path: '/career/internships'
  },
  {
    id: 'sch-mysy',
    category: 'scholarship',
    title: 'Mukhyamantri Yuva Swavalamban Yojana (MYSY)',
    subtitle: 'Gujarat Higher Education Engineering Scholarship',
    badge: 'Scholarship',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    path: '/opportunities/scholarships'
  },
  {
    id: 'sch-reliance',
    category: 'scholarship',
    title: 'Reliance Foundation Undergraduate Scholarship',
    subtitle: 'Up to Rs 2,00,000 for Engineering Students',
    badge: 'Scholarship',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    path: '/opportunities/scholarships'
  },
  {
    id: 'wk-ai',
    category: 'career',
    title: 'AI & Cloud Systems Engineering Workshop',
    subtitle: 'Live Interactive Masterclass with Industry Mentors',
    badge: 'Workshop',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    path: '/opportunities/workshops'
  }
];

const CATEGORY_TABS: { id: CommandCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'subjects', label: 'Subjects' },
  { id: 'notes', label: 'Notes' },
  { id: 'pyqs', label: 'PYQs' },
  { id: 'courses', label: 'Courses' },
  { id: 'practice', label: 'Practice' },
  { id: 'career', label: 'Career' },
  { id: 'contests', label: 'Contests' },
  { id: 'scholarships', label: 'Scholarships' },
];

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { academicProfile } = useStudentAcademic();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CommandCategory>('all');
  const [studyMaterials, setStudyMaterials] = useState<any[]>([]);
  const [pyqs, setPyqs] = useState<any[]>([]);
  const [syllabuses, setSyllabuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';

      const loadSearchIndex = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await apiClient.getSearchIndex();
          setStudyMaterials(data.studyMaterials || []);
          setPyqs(data.pyqs || []);
          setSyllabuses(data.syllabuses || []);
        } catch (e: any) {
          console.error('Failed to load search index:', e);
          setError('Could not refresh full catalog index, using local cache.');
        } finally {
          setLoading(false);
        }
      };

      loadSearchIndex();
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
      setSelectedIndex(0);
      setActiveCategory('all');
      setError(null);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const [liveResults, setLiveResults] = useState<SearchResultItem[]>([]);

  // Live Server-Side Search Integration
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setLiveResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.searchGlobal(q);
        if (res?.success && res.data) {
          const items: SearchResultItem[] = [];

          (res.data.subjects || []).forEach((s: any) => {
            items.push({
              id: `sub-${s.id}`,
              category: 'subject',
              title: s.title,
              subtitle: `Subject Code ${s.code || 'N/A'} • Sem ${s.semester}`,
              badge: 'Subject',
              badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              path: s.url || `/student/subject/${s.code || s.slug}`,
            });
          });

          (res.data.materials || []).forEach((m: any) => {
            items.push({
              id: `mat-${m.id}`,
              category: 'note',
              title: m.title,
              subtitle: `${m.subjectName} • Sem ${m.semester}`,
              badge: 'Note',
              badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
              path: m.url || `/materials/${m.id}`,
            });
          });

          (res.data.pyqs || []).forEach((p: any) => {
            items.push({
              id: `pyq-${p.id}`,
              category: 'pyq',
              title: p.title,
              subtitle: `${p.subjectName} • ${p.season} ${p.year}`,
              badge: 'PYQ',
              badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
              path: p.url || `/resources/pyq`,
            });
          });

          (res.data.questions || []).forEach((qItem: any) => {
            items.push({
              id: `q-${qItem.id}`,
              category: 'question',
              title: qItem.title,
              subtitle: `${qItem.subjectName} • ${qItem.topicName || 'Topic Practice'}`,
              badge: 'Question',
              badgeColor: 'bg-orange-500/10 text-[#F97316]',
              path: qItem.url || `/practice`,
            });
          });

          setLiveResults(items);
        }
      } catch (err) {
        console.error('Error during live global search:', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Combine fetched index with static academic entries and live results
  const allIndexedResults = useMemo(() => {
    const list: SearchResultItem[] = [...STATIC_ACADEMIC_COMMANDS];

    if (liveResults.length > 0) {
      list.unshift(...liveResults);
    }

    studyMaterials.forEach((m) => {
      list.push({
        id: `mat-${m.id}`,
        category: 'note',
        title: m.title || 'Study Material',
        subtitle: `${m.subjectName || m.branchName || 'GTU'} • Sem ${m.semester || 3}`,
        badge: 'Note',
        badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        path: `/materials/${m.id}`
      });
    });

    pyqs.forEach((p) => {
      list.push({
        id: `pyq-${p.id}`,
        category: 'pyq',
        title: p.title || `PYQ ${p.year || ''}`,
        subtitle: `${p.subjectName || 'GTU Subject'} • Exam Paper`,
        badge: 'PYQ',
        badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        path: `/resources/pyq`
      });
    });

    syllabuses.forEach((s) => {
      list.push({
        id: `syl-${s.id}`,
        category: 'subject',
        title: s.title || s.subjectName || 'Syllabus',
        subtitle: `GTU Subject Code ${s.subjectCode || ''} • NEP Scheme`,
        badge: 'Syllabus',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        path: `/materials/${s.id}`
      });
    });

    const seen = new Set<string>();
    return list.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [liveResults, studyMaterials, pyqs, syllabuses]);

  // Filter based on query and active category
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allIndexedResults.filter((item) => {
      if (activeCategory === 'subjects' && item.category !== 'subject') return false;
      if (activeCategory === 'notes' && item.category !== 'note') return false;
      if (activeCategory === 'pyqs' && item.category !== 'pyq') return false;
      if (activeCategory === 'courses' && item.category !== 'course') return false;
      if (activeCategory === 'practice' && item.category !== 'question') return false;
      if (activeCategory === 'career' && item.category !== 'career') return false;
      if (activeCategory === 'contests' && item.category !== 'contest') return false;
      if (activeCategory === 'scholarships' && item.category !== 'scholarship') return false;

      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q)
      );
    }).slice(0, 20);
  }, [allIndexedResults, query, activeCategory]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredResults.length > 0 ? (prev + 1) % filteredResults.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredResults.length > 0 ? (prev - 1 + filteredResults.length) % filteredResults.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredResults[selectedIndex];
        if (selected) {
          onClose();
          navigate(selected.path);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onClose, navigate]);

  if (!isOpen) return null;

  const popularPicks = [
    { label: 'Data Structures', q: 'Data Structures' },
    { label: '100 Days of Code', q: '100 Days' },
    { label: 'MYSY Scholarship', q: 'MYSY' },
    { label: 'Winter 2024 PYQs', q: 'Winter 2024' },
    { label: 'Resume Builder', q: 'Resume' },
    { label: 'Internships', q: 'Internship' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4 p-4 animate-fade-in"
      onClick={(e) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div 
        ref={containerRef}
        className="w-full max-w-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
        aria-label="ShikshaSahayak Global Command Palette"
      >
        {/* Top Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E2E8F0] dark:border-slate-800 shrink-0">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search courses, PYQs, practice, jobs, scholarships..."
            className="flex-1 bg-transparent text-sm text-[#0F172A] dark:text-white placeholder:text-[#64748B] focus:outline-hidden"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-50/70 dark:bg-slate-900/40 border-b border-[#E2E8F0] dark:border-slate-800 overflow-x-auto scrollbar-none shrink-0">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCategory(tab.id);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                activeCategory === tab.id
                  ? 'bg-white dark:bg-slate-800 text-[#F97316] shadow-2xs font-bold border border-slate-200 dark:border-slate-700'
                  : 'text-[#64748B] hover:text-[#0F172A] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error notification if any */}
        {error && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading && filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-xs text-[#64748B]">
              <Loader2 className="w-6 h-6 animate-spin text-[#F97316]" />
              <span>Searching academic & career database...</span>
            </div>
          ) : filteredResults.length > 0 ? (
            <>
              {!query && (
                <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Featured & Quick Access
                </div>
              )}
              {filteredResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onClose();
                      navigate(item.path);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                        <p className="text-xs font-bold text-[#0F172A] dark:text-white truncate">
                          {item.title}
                        </p>
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#F97316]' : 'text-slate-300 dark:text-slate-600'}`} />
                  </div>
                );
              })}
            </>
          ) : (
            /* Empty State */
            <div className="text-center py-12 px-4 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F172A] dark:text-white">No results found for "{query}"</p>
                <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                  Try checking spelling or exploring popular engineering searches below.
                </p>
              </div>

              {/* Popular Search Suggestions */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-md mx-auto">
                {popularPicks.map((pick) => (
                  <button
                    key={pick.label}
                    onClick={() => {
                      setQuery(pick.q);
                      setActiveCategory('all');
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#F97316] border border-transparent font-medium transition-colors"
                  >
                    {pick.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer keyboard shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-900/60 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between text-[11px] text-[#64748B] shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <span className="text-[10px] text-[#F97316] font-semibold">Global Unified Search</span>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
