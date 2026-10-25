import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, GraduationCap, ListChecks, Share2, Bookmark } from 'lucide-react';
import { getRelatedGuides, getStudyGuideBySlug, SITE_URL } from '../content/studyGuides';
import NotFound from './NotFound';
import { usePageMeta } from '../utils/seo';

const StudyGuideView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const guide = getStudyGuideBySlug(slug);
  const path = guide ? `/guides/${guide.slug}` : `/guides/${slug ?? ''}`;

  usePageMeta({
    title: guide ? `${guide.title} — Study Guide | ShikshaSahayak` : 'Study Guide — ShikshaSahayak',
    description: guide?.description || 'Practical engineering exam preparation guide, GTU PYQ breakdown, and revision strategy.',
    path,
    type: 'article',
  });

  if (!guide) {
    return <NotFound />;
  }

  const relatedGuides = getRelatedGuides(guide);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 py-10 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/guides"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-brand-orange transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Study Guides
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-8 items-start">
          {/* Main Article Body */}
          <article className="bg-white dark:bg-navy-900 border border-gray-150 dark:border-navy-800 rounded-3xl p-6 sm:p-10 shadow-xs">
            <header className="mb-10 pb-8 border-b border-gray-100 dark:border-navy-800">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 text-brand-orange border border-orange-500/20 px-3 py-1 text-xs font-bold">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {guide.category}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-navy-800 px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  <Clock className="h-3.5 w-3.5 text-brand-orange" />
                  {guide.readingMinutes} min read
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-navy-900 dark:text-white leading-tight mb-5">
                {guide.title}
              </h1>

              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                {guide.description}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-navy-900 dark:text-white">Curated by {guide.author}</span>
                <span className="hidden sm:inline text-gray-300 dark:text-navy-700">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Updated {new Date(`${guide.updatedAt}T00:00:00`).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </header>

            <div className="prose prose-slate dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 prose-headings:font-display prose-headings:font-bold prose-headings:text-navy-900 dark:prose-headings:text-white">
              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">Overview</h2>
                <p className="leading-relaxed">{guide.summary}</p>
                <p className="leading-relaxed">{guide.whyItMatters}</p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">Key Topics to Cover</h2>
                <ul className="space-y-3 pl-0">
                  {guide.keyTopics.map((topic) => (
                    <li key={topic} className="flex items-start gap-3 list-none ml-0 p-3 rounded-2xl bg-gray-50 dark:bg-navy-950 border border-gray-150 dark:border-navy-800/80">
                      <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-sm font-medium">{topic}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">Recommended Practice Plan</h2>
                <ol className="space-y-4 pl-0">
                  {guide.practicePlan.map((step, index) => (
                    <li key={step} className="flex items-start gap-4 list-none ml-0 p-4 rounded-2xl bg-gray-50 dark:bg-navy-950 border border-gray-150 dark:border-navy-800/80">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-brand-orange text-xs font-extrabold text-white shadow-xs">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">Common Pitfalls to Avoid</h2>
                <ul className="space-y-3 pl-0">
                  {guide.commonMistakes.map((mistake) => (
                    <li key={mistake} className="flex items-start gap-3 list-none ml-0 p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium leading-relaxed">{mistake}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">Exam Room Execution Tips</h2>
                <ul className="space-y-3 pl-0">
                  {guide.examRoomTips.map((tip) => (
                    <li key={tip} className="flex items-start gap-3 list-none ml-0 p-3 rounded-2xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20 text-navy-900 dark:text-slate-200">
                      <ListChecks className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {guide.faqs.map((faq) => (
                    <div key={faq.question} className="rounded-2xl border border-gray-150 dark:border-navy-800 bg-gray-50 dark:bg-navy-950 p-5 space-y-2">
                      <h3 className="text-base font-bold text-navy-900 dark:text-white">{faq.question}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed m-0">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </article>

          {/* Right Sidebar */}
          <aside className="lg:sticky lg:top-28 space-y-6">
            <div className="bg-white dark:bg-navy-900 border border-gray-150 dark:border-navy-800 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                Guide Metadata
              </h3>
              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="text-gray-400">Target Department</dt>
                  <dd className="font-bold text-navy-900 dark:text-white mt-0.5">{guide.department}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Category</dt>
                  <dd className="font-bold text-brand-orange mt-0.5">{guide.category}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Canonical Path</dt>
                  <dd className="text-gray-500 truncate mt-0.5">{`${SITE_URL}${path}`}</dd>
                </div>
              </dl>
            </div>

            {relatedGuides.length > 0 && (
              <div className="bg-white dark:bg-navy-900 border border-gray-150 dark:border-navy-800 rounded-3xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-brand-orange" />
                  <span>Related Guides</span>
                </h3>
                <div className="space-y-3">
                  {relatedGuides.map((related) => (
                    <Link
                      key={related.slug}
                      to={`/guides/${related.slug}`}
                      className="block rounded-2xl border border-gray-100 dark:border-navy-800/80 p-4 hover:border-brand-orange/40 hover:bg-orange-500/5 transition-all group"
                    >
                      <h4 className="font-bold text-xs sm:text-sm text-navy-900 dark:text-white group-hover:text-brand-orange transition-colors mb-1.5 leading-snug">
                        {related.title}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange">
                        Read guide <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default StudyGuideView;
