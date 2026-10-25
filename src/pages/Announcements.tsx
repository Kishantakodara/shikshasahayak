import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Megaphone, ArrowLeft, Search, Calendar, FileText, Cpu, 
  ShieldCheck, Sparkles, ExternalLink, RefreshCw, X, Loader2,
  GraduationCap
} from 'lucide-react';
import { apiClient } from '../api/client';

interface Announcement {
  id: string;
  text: string;
  link?: string;
  created_at: string;
}

interface CategoryConfig {
  name: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  icon: React.ComponentType<any>;
}

const CATEGORIES: Record<string, CategoryConfig> = {
  academic: {
    name: 'Exams & Academics',
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-950/30',
    borderClass: 'border-rose-100 dark:border-rose-900/30',
    icon: GraduationCap,
  },
  resource: {
    name: 'Resource Alerts',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderClass: 'border-emerald-100 dark:border-emerald-900/30',
    icon: FileText,
  },
  system: {
    name: 'System Updates',
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/30',
    borderClass: 'border-indigo-100 dark:border-indigo-900/30',
    icon: Cpu,
  },
  general: {
    name: 'General Notice',
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    borderClass: 'border-amber-100 dark:border-amber-900/30',
    icon: Megaphone,
  }
};

const getCategoryAndIcon = (text: string): { type: keyof typeof CATEGORIES; config: CategoryConfig } => {
  const lowercaseText = text.toLowerCase();
  
  // Academic & Exam related keywords
  if (
    lowercaseText.includes('exam') || 
    lowercaseText.includes('datesheet') || 
    lowercaseText.includes('midsem') || 
    lowercaseText.includes('endsem') || 
    lowercaseText.includes('result') || 
    lowercaseText.includes('schedule') || 
    lowercaseText.includes('registration') || 
    lowercaseText.includes('academic') || 
    lowercaseText.includes('semester')
  ) {
    return { type: 'academic', config: CATEGORIES.academic };
  }
  
  // Resource or file related keywords
  if (
    lowercaseText.includes('upload') || 
    lowercaseText.includes('notes') || 
    lowercaseText.includes('pyq') || 
    lowercaseText.includes('pdf') || 
    lowercaseText.includes('material') || 
    lowercaseText.includes('paper') || 
    lowercaseText.includes('link') || 
    lowercaseText.includes('click') || 
    lowercaseText.includes('visit')
  ) {
    return { type: 'resource', config: CATEGORIES.resource };
  }
  
  // System or portal updates
  if (
    lowercaseText.includes('maintenance') || 
    lowercaseText.includes('fix') || 
    lowercaseText.includes('update') || 
    lowercaseText.includes('server') || 
    lowercaseText.includes('website') || 
    lowercaseText.includes('portal') || 
    lowercaseText.includes('bug') || 
    lowercaseText.includes('design')
  ) {
    return { type: 'system', config: CATEGORIES.system };
  }
  
  // General fallback
  return { type: 'general', config: CATEGORIES.general };
};

const Announcements: React.FC = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const timelineRef = useRef<HTMLDivElement>(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getAnnouncements();
      setAnnouncements(data || []);
    } catch (err: any) {
      console.error('Error loading notices:', err);
      setError('Failed to fetch announcements. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Filter and Search logic
  useEffect(() => {
    let result = [...announcements];

    // Filter by category
    if (activeCategory !== 'all') {
      result = result.filter(item => {
        const { type } = getCategoryAndIcon(item.text);
        return type === activeCategory;
      });
    }

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.text.toLowerCase().includes(query)
      );
    }

    setFilteredAnnouncements(result);
  }, [announcements, searchQuery, activeCategory]);



  const handleCardClick = (item: Announcement) => {
    if (item.link) {
      if (item.link.startsWith('http://') || item.link.startsWith('https://')) {
        window.open(item.link, '_blank', 'noopener,noreferrer');
      } else {
        navigate(item.link);
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'Recently';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden pt-4 pb-16">
      {/* Global Background Grid Pattern */}
      <div className="fixed inset-0 z-[-1] bg-grid-pattern dark:bg-grid-pattern-dark bg-grid opacity-[0.4] pointer-events-none" />

      {/* Decorative Gradient Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl overflow-hidden z-[-1] opacity-40 dark:opacity-20 pointer-events-none">
        <div className="absolute top-[-5%] left-[-15%] w-[45%] h-[40%] rounded-full bg-violet-300 dark:bg-violet-900/60 blur-[120px] mix-blend-multiply dark:mix-blend-lighten" />
        <div className="absolute top-[25%] right-[-15%] w-[45%] h-[45%] rounded-full bg-amber-200 dark:bg-amber-900/50 blur-[120px] mix-blend-multiply dark:mix-blend-lighten" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation / Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-navy-900 dark:hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <button 
            onClick={fetchAnnouncements}
            title="Refresh Notice Board"
            className="p-2 text-gray-400 hover:text-navy-900 dark:hover:text-white hover:bg-white dark:hover:bg-navy-900 rounded-full border border-transparent hover:border-gray-200 dark:hover:border-navy-800 transition-all shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Hero Section */}
        <header className="mb-12 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-brand-orange/10 border border-brand-orange/20 mb-4">
            <Megaphone className="h-3.5 w-3.5 text-brand-orange animate-pulse" />
            <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">Official Updates</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-navy-900 dark:text-white mb-4 tracking-tight">
            Notice <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-red-500">Board</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
            Stay informed with portal enhancements, exams, schedules, study guides, and vital academic news.
          </p>
        </header>

        {/* Search & Filter Controls */}
        <div className="bg-white/95 dark:bg-navy-900/95 border border-gray-100 dark:border-navy-800/80 rounded-3xl p-5 md:p-6 shadow-sm backdrop-blur-xl mb-10 space-y-5">
          
          {/* Search Box */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-brand-orange transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search announcements by keywords (e.g. Exam, Math, Unit)..."
              className="block w-full pl-11 pr-10 py-3.5 rounded-2xl border-2 border-transparent bg-gray-50 dark:bg-navy-950/70 text-gray-900 placeholder-gray-400 focus:bg-white dark:focus:bg-navy-900 focus:border-brand-orange/30 focus:ring-4 focus:ring-brand-orange/10 transition-all dark:text-white dark:placeholder-gray-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-navy-900 dark:hover:text-white"
              >
                <X className="h-4 w-4 bg-gray-200 dark:bg-navy-850 hover:bg-gray-300 rounded-full p-0.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div>
            <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
              Filter by Category
            </span>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  activeCategory === 'all'
                    ? 'bg-navy-900 text-white dark:bg-brand-orange dark:text-white border-transparent shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-gray-200 dark:bg-navy-950 dark:text-gray-400 dark:border-navy-800 dark:hover:border-navy-700'
                }`}
              >
                All Notices ({announcements.length})
              </button>
              
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const count = announcements.filter(item => getCategoryAndIcon(item.text).type === key).length;
                const IconComponent = cat.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
                      activeCategory === key
                        ? 'bg-navy-900 text-white dark:bg-brand-orange dark:text-white border-transparent shadow-sm'
                        : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-gray-200 dark:bg-navy-950 dark:text-gray-400 dark:border-navy-800 dark:hover:border-navy-700'
                    }`}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Notices Board Content */}
        {loading ? (
          /* Loading Skeleton */
          <div className="space-y-4">
            {[1, 2, 3, 4].map(n => (
              <div 
                key={n} 
                className="bg-white/50 dark:bg-navy-900/40 border border-gray-100 dark:border-navy-800/50 rounded-3xl p-6 flex gap-5 animate-pulse"
              >
                <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-navy-850 shrink-0" />
                <div className="space-y-3 w-full">
                  <div className="h-4 bg-gray-200 dark:bg-navy-850 rounded w-1/4" />
                  <div className="h-4 bg-gray-200 dark:bg-navy-850 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-navy-850 rounded w-1/5" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-950/40 rounded-3xl p-8 text-center text-red-600 dark:text-red-400">
            <p className="font-bold mb-4">{error}</p>
            <button 
              onClick={fetchAnnouncements}
              className="bg-red-600 dark:bg-red-900 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Try Again
            </button>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          /* Empty Filter State */
          <div className="bg-white/80 dark:bg-navy-900/50 border border-gray-100 dark:border-navy-800 rounded-3xl p-12 text-center">
            <Megaphone className="h-12 w-12 text-gray-300 dark:text-navy-750 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-2">No updates found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-sm leading-relaxed">
              We couldn't find any announcements matching your current search or category filters.
            </p>
            {(searchQuery || activeCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-5 text-sm font-bold text-brand-orange hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          /* Timeline Cards Grid */
          <div ref={timelineRef} className="space-y-4 relative">
            {filteredAnnouncements.map((item, index) => {
              const { type, config } = getCategoryAndIcon(item.text);
              const IconComponent = config.icon;
              
              return (
                <div 
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className={`notice-card animate-slide-up bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-3xl p-6 flex flex-col sm:flex-row gap-5 shadow-[0_4px_20px_rgb(0,0,0,0.01)] hover:shadow-xl hover:border-gray-200 dark:hover:border-navy-700/80 transition-all duration-300 group relative overflow-hidden ${
                    item.link ? 'cursor-pointer' : ''
                  }`}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {/* Accent Highlight Bar for Featured (the newest) notice */}
                  {index === 0 && activeCategory === 'all' && searchQuery === '' && (
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-brand-orange to-red-500" />
                  )}

                  {/* Left Column: Icon Circle */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${config.borderClass} ${config.bgClass} ${config.colorClass} group-hover:scale-105 transition-transform duration-300`}>
                    <IconComponent className="h-5 w-5" />
                  </div>

                  {/* Right Column: Main Content */}
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      {/* Dynamic Tag */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${config.borderClass} ${config.bgClass} ${config.colorClass}`}>
                        {config.name}
                      </span>
                      
                      {/* Featured Alert Badge */}
                      {index === 0 && activeCategory === 'all' && searchQuery === '' && (
                        <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
                          <Sparkles className="h-2.5 w-2.5 animate-pulse" /> Latest Alert
                        </span>
                      )}
                    </div>

                    {/* Notice Text */}
                    <p className="text-base font-semibold text-navy-900 dark:text-gray-100 leading-relaxed break-words">
                      {item.text}
                    </p>

                    {/* Meta Footer */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-400 dark:text-gray-500 font-bold border-t border-gray-50 dark:border-navy-800/40 pt-3">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4.5 w-4.5" />
                        {formatDate(item.created_at)}
                      </span>
                      {formatTime(item.created_at) && (
                        <span>• {formatTime(item.created_at)}</span>
                      )}
                      {item.link && (
                        <span className="text-brand-orange font-bold flex items-center gap-1 text-[11px] ml-auto group-hover:translate-x-0.5 transition-transform">
                          View details <ExternalLink className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
