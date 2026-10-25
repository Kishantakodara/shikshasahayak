import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, BookOpen, Clock, Bot, ArrowRight, Compass } from 'lucide-react';
import { usePageMeta } from '../utils/seo';

const NotFound: React.FC = () => {
  usePageMeta({
    title: '404 - Page Not Found — ShikshaSahayak',
    description: 'The requested page or study material could not be found. Browse ShikshaSahayak engineering notes, GTU PYQs, and revision guides.',
    path: window.location.pathname,
    robots: 'noindex,follow',
  });

  return (
    <div className="min-h-[75vh] bg-gray-50 dark:bg-navy-950 flex items-center justify-center py-16 px-4 transition-colors relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-orange/5 dark:bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full mx-auto text-center relative z-10 space-y-8">
        
        {/* Visual Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-orange-500/10 text-brand-orange border border-orange-500/20 shadow-sm mx-auto mb-2 animate-bounce-subtle">
          <Compass className="w-10 h-10" />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-extrabold uppercase tracking-widest text-brand-orange">
            Error 404 • Resource Missing
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy-900 dark:text-white font-display tracking-tight">
            Looks like you've wandered off the syllabus!
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-lg mx-auto leading-relaxed">
            The page or material you requested may have been reorganized, renamed, or relocated during a recent portal upgrade.
          </p>
        </div>

        {/* Quick Recovery Pathways */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-lg mx-auto">
          <Link
            to="/resources/study-material"
            className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-150 dark:border-navy-800 hover:border-brand-orange/40 hover:-translate-y-0.5 transition-all shadow-xs group"
          >
            <BookOpen className="w-5 h-5 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-xs font-bold text-navy-900 dark:text-white">Study Notes</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Explore chapter-wise notes</p>
          </Link>

          <Link
            to="/resources/pyq"
            className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-150 dark:border-navy-800 hover:border-brand-orange/40 hover:-translate-y-0.5 transition-all shadow-xs group"
          >
            <Clock className="w-5 h-5 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-xs font-bold text-navy-900 dark:text-white">GTU PYQs</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Winter & Summer papers</p>
          </Link>

          <Link
            to="/ai-tutor"
            className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-150 dark:border-navy-800 hover:border-brand-orange/40 hover:-translate-y-0.5 transition-all shadow-xs group"
          >
            <Bot className="w-5 h-5 text-brand-orange mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-xs font-bold text-navy-900 dark:text-white">AI Tutor</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Instant academic answers</p>
          </Link>
        </div>

        {/* Home Action */}
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy-900 dark:bg-brand-orange text-white hover:bg-navy-800 dark:hover:bg-brand-hover text-xs sm:text-sm font-bold transition-all shadow-md shadow-brand-orange/10"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default NotFound;
