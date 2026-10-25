import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, User, Calendar, Loader2, Sparkles, Search, Clock, ArrowRight, Tag, Bookmark } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useStudentAcademic } from '../context/StudentAcademicContext';
import EmptyState from '../components/common/EmptyState';
import { usePageMeta } from '../utils/seo';
import { PortalReturnBar } from '../components/navigation/PortalReturnBar';

const Blogs: React.FC = () => {
  const { currentUser } = useAuth();
  const { academicProfile, isExploreMode } = useStudentAcademic();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  usePageMeta({
    title: 'ShikshaSahayak Blog — GTU & Engineering Study Insights',
    description: 'Read insightful engineering exam guides, study strategies, GTU PYQ preparation tips, and tutorials curated for students.',
    path: '/blogs',
  });

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const data = await apiClient.getBlogs();
        setBlogs(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load blogs');
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  // Compute available categories dynamically
  const categories = useMemo(() => {
    const cats = new Set<string>();
    blogs.forEach((b) => {
      if (b.category && b.category.trim()) {
        cats.add(b.category.trim());
      }
    });
    return ['All', ...Array.from(cats)];
  }, [blogs]);

  // Filter blogs based on search query and category
  const filteredBlogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return blogs.filter((blog) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        (blog.category && blog.category.toLowerCase() === selectedCategory.toLowerCase());

      const matchesQuery =
        !q ||
        (blog.title && blog.title.toLowerCase().includes(q)) ||
        (blog.author && blog.author.toLowerCase().includes(q)) ||
        (blog.content && blog.content.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [blogs, selectedCategory, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-navy-950">
        <Loader2 className="h-10 w-10 text-brand-orange animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Loading engineering articles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center bg-gray-50 dark:bg-navy-950">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-brand-orange hover:bg-brand-hover text-white rounded-xl font-bold transition-all shadow-md shadow-brand-orange/20"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Return Bar to Student Portal */}
        <PortalReturnBar
          crumbs={[{ label: 'Educational Articles & Guides' }]}
          fallbackPath="/student"
        />

        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-brand-orange border border-orange-500/20 text-xs font-bold uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>ShikshaSahayak Editorial & Guides</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy-900 dark:text-white mb-4 tracking-tight font-display">
            Student Guides & <span className="text-brand-orange">Engineering Blog</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Curated preparation tips, subject breakdowns, semester revision tactics, and academic wisdom to help you ace engineering exams.
          </p>

          {currentUser && !isExploreMode && academicProfile.branchName && (
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended for {academicProfile.branchName} • Semester {academicProfile.semester}</span>
            </div>
          )}
        </div>

        {/* Search & Category Filter Controls */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-150 dark:border-navy-800 p-4 sm:p-5 mb-10 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by title, keyword, or author..."
                className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 text-navy-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {categories.map((cat) => {
                const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20'
                        : 'bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-750'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Articles Grid or Empty State */}
        {filteredBlogs.length === 0 ? (
          <EmptyState
            title={blogs.length === 0 ? 'No articles published yet' : 'No matching articles found'}
            description={
              blogs.length === 0
                ? 'Our academic editorial team is preparing valuable guides and tutorials. Check back soon!'
                : `We couldn't find any articles matching "${searchQuery}". Try different keywords or browse all categories.`
            }
            actionText={searchQuery || selectedCategory !== 'All' ? 'Reset Filters' : 'Explore Notes'}
            actionHref={searchQuery || selectedCategory !== 'All' ? undefined : '/resources/study-material'}
            onAction={
              searchQuery || selectedCategory !== 'All'
                ? () => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredBlogs.map((blog) => {
              // Extract clean snippet
              const isHtml =
                blog.content &&
                (blog.content.trim().startsWith('<') ||
                  blog.content.toLowerCase().includes('<!doctype') ||
                  blog.content.toLowerCase().includes('<html'));
              const cleanSnippet = blog.content
                ? isHtml
                  ? blog.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
                  : blog.content.replace(/[#*`_\[\]()\-]/g, '').replace(/\s+/g, ' ').trim()
                : '';
              const snippet =
                cleanSnippet.length > 125 ? cleanSnippet.substring(0, 125) + '...' : cleanSnippet;

              // Estimated reading time
              const wordCount = cleanSnippet.split(/\s+/).filter(Boolean).length;
              const readTime = Math.max(2, Math.ceil(wordCount / 180));

              return (
                <Link
                  key={blog.id}
                  to={`/blogs/${blog.id}`}
                  className="group flex flex-col h-full bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-brand-orange/40 dark:hover:border-brand-orange/30 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Card Cover Image */}
                  <div className="h-52 relative overflow-hidden shrink-0 bg-slate-100 dark:bg-navy-950">
                    {blog.thumbnail ? (
                      <img
                        src={blog.thumbnail}
                        alt={blog.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-navy-900/10 dark:from-brand-orange/15 dark:to-navy-950 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-white/80 dark:bg-navy-800/80 backdrop-blur-sm flex items-center justify-center text-brand-orange shadow-sm mb-2 group-hover:scale-110 transition-transform">
                          <BookOpen className="w-7 h-7" />
                        </div>
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">ShikshaSahayak Guide</span>
                      </div>
                    )}

                    {/* Category Chip */}
                    {blog.category && (
                      <span className="absolute top-4 left-4 text-[10px] font-extrabold uppercase tracking-wider bg-brand-orange text-white px-3 py-1 rounded-full shadow-md">
                        {blog.category}
                      </span>
                    )}

                    {/* Reading Time Badge */}
                    <span className="absolute bottom-3 right-3 text-[11px] font-bold bg-navy-950/70 text-white backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Clock className="w-3 h-3 text-brand-orange" />
                      {readTime} min read
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-navy-900 dark:text-white group-hover:text-brand-orange transition-colors line-clamp-2 mb-3 leading-snug font-display">
                      {blog.title}
                    </h2>

                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm line-clamp-3 mb-6 leading-relaxed flex-1">
                      {snippet || 'Click to read this comprehensive academic guide on ShikshaSahayak.'}
                    </p>

                    {/* Card Footer */}
                    <div className="pt-4 border-t border-gray-100 dark:border-navy-800/80 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange font-bold text-[10px]">
                          {(blog.author || 'P')[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-navy-800 dark:text-gray-300 truncate max-w-[110px]">
                          {blog.author || 'ShikshaSahayak Team'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 font-bold text-brand-orange group-hover:translate-x-0.5 transition-transform">
                        <span>Read</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blogs;
