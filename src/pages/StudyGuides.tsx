import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, Search, Tag, Sparkles } from 'lucide-react';
import { STUDY_GUIDES } from '../content/studyGuides';
import EmptyState from '../components/common/EmptyState';
import { usePageMeta } from '../utils/seo';

const categories = ['All', ...Array.from(new Set(STUDY_GUIDES.map((guide) => guide.category)))];

const StudyGuides: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  usePageMeta({
    title: 'Practical Engineering Exam Guides — ShikshaSahayak',
    description: 'Topic-wise engineering preparation guides for GTU exams, lab vivas, PYQs, and semester revisions.',
    path: '/guides',
  });

  const filteredGuides = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return STUDY_GUIDES.filter((guide) => {
      const matchesCategory = category === 'All' || guide.category === category;
      const matchesQuery =
        !normalizedQuery ||
        [guide.title, guide.description, guide.department, guide.category, ...guide.keyTopics]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Hero */}
        <section className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 text-brand-orange border border-orange-500/20 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Blueprints & Strategies</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-navy-900 dark:text-white mb-4 tracking-tight">
            Practical Engineering <span className="text-brand-orange">Exam Guides</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Topic-wise revision notes for GTU PYQs, semester exams, lab work, viva, and branch subjects.
            Curated to help engineering students avoid common pitfalls and target high-weightage topics.
          </p>
        </section>

        {/* Filter & Search Bar */}
        <section className="bg-white dark:bg-navy-900 border border-gray-150 dark:border-navy-800 rounded-3xl p-4 sm:p-5 mb-8 shadow-xs">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search guides by topic, branch, or keywords..."
                className="w-full pl-11 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 text-navy-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {categories.map((item) => {
                const isActive = category === item;
                return (
                  <button
                    key={item}
                    onClick={() => setCategory(item)}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20'
                        : 'bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-750'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Guides Grid */}
        <section>
          {filteredGuides.length === 0 ? (
            <EmptyState
              title="No study guides found"
              description={`We couldn't find any guides matching "${query}". Try adjusting your keywords or clearing the category filter.`}
              actionText="Reset Filters"
              onAction={() => {
                setQuery('');
                setCategory('All');
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  to={`/guides/${guide.slug}`}
                  className="group bg-white dark:bg-navy-900 border border-gray-150 dark:border-navy-800 rounded-3xl p-6 shadow-xs hover:shadow-xl hover:border-brand-orange/40 hover:-translate-y-1 transition-all duration-300 flex flex-col min-h-[300px]"
                >
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-brand-orange text-xs font-bold">
                      <Tag className="h-3.5 w-3.5" />
                      {guide.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      <Clock className="h-3.5 w-3.5 text-brand-orange" />
                      {guide.readingMinutes} min read
                    </span>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-brand-orange flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <BookOpen className="h-6 w-6" />
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold font-display text-navy-900 dark:text-white mb-2 group-hover:text-brand-orange transition-colors leading-snug">
                    {guide.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 line-clamp-3 flex-1">
                    {guide.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-navy-800 flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {guide.department}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange group-hover:translate-x-0.5 transition-transform">
                      Read guide <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default StudyGuides;
