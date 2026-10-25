import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Users, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Award,
  PlayCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CourseSummaryDTO } from '@/types';
import { PortalReturnBar } from '../../components/navigation/PortalReturnBar';

export const CoursesCatalogPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseSummaryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedLevel !== 'all') params.set('level', selectedLevel);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/courses?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch courses');
      const data = await res.json() as { success: boolean; courses: CourseSummaryDTO[] };
      if (data.success) {
        setCourses(data.courses || []);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to load course catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [selectedCategory, selectedLevel]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Portal Navigation Bar */}
      <PortalReturnBar
        crumbs={[
          { label: 'Courses & Skill Tracks' }
        ]}
        fallbackPath="/student"
      />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy-950 via-navy-900 to-slate-900 border border-navy-800 p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-xs font-bold uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" /> Engineering Skill Tracks & Courses
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            Curated Courses for <span className="text-brand-orange">Engineers & Placements</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            From GTU core syllabus mastery to cutting-edge React 19 and Generative AI systems. Complete structured lesson paths, solve integrated practice challenges, and earn authenticated certificates.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" /> Verifiable Certificates
            </span>
            <span className="flex items-center gap-1.5">
              <PlayCircle className="w-4 h-4 text-brand-orange" /> Self-Paced Interactive Lessons
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-400" /> GTU & Industry Aligned
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Category Pills */}
      <div className="bg-white dark:bg-navy-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm space-y-4">
        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses by keyword, instructor, or technology..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-950 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs sm:text-sm rounded-xl transition shrink-0"
          >
            Search
          </button>
        </form>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-navy-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Track:</span>
          {['all', 'Web Development', 'Programming', 'AI/ML', 'Core Engineering', 'Aptitude'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat
                  ? 'bg-navy-900 dark:bg-brand-orange text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Tracks' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl h-80" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl text-red-700 dark:text-red-300">
          <p className="text-sm font-semibold">{error}</p>
          <button onClick={fetchCourses} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold">
            Retry
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-navy-900 border border-dashed border-slate-200 dark:border-navy-700 rounded-3xl space-y-3">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-navy-950 dark:text-white">No Courses Found</h3>
          <p className="text-xs text-slate-500">Try selecting "All Tracks" or clearing your search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="group bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-700 hover:border-brand-orange/60 dark:hover:border-brand-orange/60 transition-all shadow-sm hover:shadow-md overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-navy-800">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-navy-950/80 backdrop-blur-md text-white text-[11px] font-bold">
                      {course.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-brand-orange/90 backdrop-blur-md text-white text-[11px] font-bold">
                      {course.level}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {course.durationHours} hrs
                    </span>
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {course.rating} ({course.ratingCount})
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> {course.enrolledCount} enrolled
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-navy-950 dark:text-white group-hover:text-brand-orange transition line-clamp-2">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {course.tags.slice(0, 3).map((tag, tIdx) => (
                      <span key={tIdx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-5 pt-0">
                <Link
                  to={`/courses/${course.slug}/learn`}
                  className="w-full py-2.5 px-4 bg-slate-100 dark:bg-navy-800 hover:bg-brand-orange hover:text-white dark:hover:bg-brand-orange text-navy-900 dark:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 group-hover:bg-brand-orange group-hover:text-white"
                >
                  Start Learning Track <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesCatalogPage;
