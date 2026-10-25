import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, GraduationCap, ShieldCheck } from 'lucide-react';
import { STUDY_GUIDES } from '../content/studyGuides';

const resourceLinks = [
  { title: 'Home', path: '/', description: 'Start here for study resources, PYQs, study material, and guides.' },
  { title: 'Study Resources', path: '/resources', description: 'Browse PYQs, study material, and syllabus by folder.' },
  { title: 'Previous Year Papers', path: '/resources/pyq', description: 'Browse PYQs by department, semester, subject, and exam season.' },
  { title: 'Study Material', path: '/resources/study-material', description: 'Find study materials and summaries by branch and semester.' },
  { title: 'Exam Tips', path: '/exam-tips', description: 'Read exam strategy, revision, and answer-writing advice.' },
  { title: 'AI Tutor', path: '/ai-tutor', description: 'Ask academic questions and revise concepts interactively.' },
  { title: 'Contribute Material', path: '/contribute', description: 'Submit useful study material for admin review.' },
  { title: 'Notice Board', path: '/announcements', description: 'Stay updated with the latest academic announcements, notice boards, exam schedules, and portal updates.' },
];

const trustLinks = [
  { title: 'About', path: '/about' },
  { title: 'Contact', path: '/contact' },
  { title: 'Privacy Policy', path: '/privacypolicy' },
  { title: 'Terms of Service', path: '/terms-of-service' },
  { title: 'Disclaimer', path: '/disclaimer' },
];

const Sitemap: React.FC = () => {
  const guidesByCategory = STUDY_GUIDES.reduce<Record<string, typeof STUDY_GUIDES>>((groups, guide) => {
    groups[guide.category] = [...(groups[guide.category] ?? []), guide];
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 py-10 animate-slide-up">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="max-w-3xl mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange mb-3">Sitemap</p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-navy-900 dark:text-white mb-5">
            Browse all ShikshaSahayak pages
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Use this page to find study resources, legal information, and every published study guide.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-8">
          <div className="space-y-8">
            <section className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-2xl p-6">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-navy-900 dark:text-white mb-5">
                <FileText className="h-6 w-6 text-brand-orange" />
                Main Resources
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resourceLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="rounded-xl border border-gray-100 dark:border-navy-800 p-4 hover:border-brand-orange/50 transition-colors group"
                  >
                    <h3 className="font-bold text-navy-900 dark:text-white group-hover:text-brand-orange transition-colors mb-1">
                      {link.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{link.description}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-2xl p-6">
              <h2 className="flex items-center gap-2 text-2xl font-bold text-navy-900 dark:text-white mb-5">
                <BookOpen className="h-6 w-6 text-brand-orange" />
                Study Guides
              </h2>
              <div className="space-y-8">
                {Object.entries(guidesByCategory).map(([category, guides]) => (
                  <div key={category}>
                    <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-3">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {guides.map((guide) => (
                        <Link
                          key={guide.slug}
                          to={`/guides/${guide.slug}`}
                          className="rounded-xl bg-gray-50 dark:bg-navy-950 border border-gray-100 dark:border-navy-800 p-4 hover:border-brand-orange/50 transition-colors"
                        >
                          <span className="block font-semibold text-navy-900 dark:text-white mb-1">{guide.title}</span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">{guide.department}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-2xl p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold text-navy-900 dark:text-white mb-4">
                <ShieldCheck className="h-5 w-5 text-brand-orange" />
                Trust and Legal
              </h2>
              <ul className="space-y-3">
                {trustLinks.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-gray-600 dark:text-gray-300 hover:text-brand-orange transition-colors">
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-2xl p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold text-navy-900 dark:text-white mb-3">
                <GraduationCap className="h-5 w-5 text-brand-orange" />
                Content Coverage
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                This sitemap includes {STUDY_GUIDES.length} study guides plus core resource and policy pages.
                New notes and PYQs may also appear inside the dynamic resource libraries after admin review.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;
