import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  Bot, 
  Rocket, 
  FileText,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface SmartLearningCTAProps {
  className?: string;
}

export const SmartLearningCTA: React.FC<SmartLearningCTAProps> = ({ className = '' }) => {
  const { currentUser } = useAuth();

  return (
    <section className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 relative z-20 ${className}`}>
      <div className="relative overflow-hidden rounded-3xl border border-orange-200/80 dark:border-navy-700/80 bg-gradient-to-br from-[#fff8f3] via-white to-[#fff0e6] dark:from-navy-900 dark:via-navy-900/95 dark:to-navy-950 p-6 sm:p-8 md:p-10 lg:p-12 shadow-xl shadow-orange-500/5 dark:shadow-2xl dark:shadow-black/40">
        {/* Ambient background glow spots */}
        <div 
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-brand-orange/15 dark:bg-brand-orange/10 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />
        <div 
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-400/15 dark:bg-amber-500/10 blur-3xl pointer-events-none" 
          aria-hidden="true" 
        />

        {/* Decorative Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] dark:opacity-[0.07] pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          
          {/* Integrated Visual Hub - Native SVG/Icons that seamlessly match light & dark mode */}
          <div className="shrink-0 flex justify-center w-full lg:w-auto">
            <div className="relative flex items-center justify-center">
              {/* Outer decorative pulsing circle */}
              <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-br from-orange-100/80 via-amber-50/50 to-transparent dark:from-navy-800/80 dark:via-navy-800/40 dark:to-navy-950 border border-orange-200/60 dark:border-navy-700/80 flex items-center justify-center shadow-inner">
                {/* Dashed rotating accent ring */}
                <div className="absolute inset-2 rounded-full border border-dashed border-orange-300/80 dark:border-orange-500/30" />
                
                {/* Central gradient icon badge */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-brand-orange via-[#ea580c] to-amber-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/30 transition-transform duration-300 hover:scale-105">
                  <GraduationCap className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-md" />
                  
                  {/* Subtle sparkle overlay */}
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-300 text-amber-900 flex items-center justify-center shadow-md">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Floating Glass Badges */}
              {/* Badge 1: Bottom Left - AI Tutor */}
              <div className="absolute -bottom-2 -left-3 sm:-left-4 px-3 py-1.5 rounded-full bg-white/95 dark:bg-navy-800/95 backdrop-blur-md border border-orange-200/80 dark:border-navy-700 shadow-md flex items-center gap-1.5 text-xs font-bold text-navy-900 dark:text-white">
                <Bot className="w-3.5 h-3.5 text-brand-orange" />
                <span>AI Study Buddy</span>
              </div>

              {/* Badge 3: Bottom Right - 100% Free */}
              <div className="hidden sm:flex absolute bottom-4 -right-6 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/60 items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>100% Free</span>
              </div>
            </div>
          </div>

          {/* Center / Main Content */}
          <div className="flex-1 text-center lg:text-left">
            {/* Tag / Category Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-100/90 dark:bg-orange-950/60 text-brand-orange border border-orange-200/80 dark:border-orange-900/50 text-xs font-extrabold uppercase tracking-wider mb-3">
              <Rocket className="w-3.5 h-3.5" />
              <span>Academic Excellence</span>
            </div>

            {/* Headline */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-navy-900 dark:text-white tracking-tight leading-tight mb-3">
              Start Your Smart Learning{' '}
              <span className="bg-gradient-to-r from-brand-orange via-orange-500 to-amber-500 bg-clip-text text-transparent">
                Journey Today!
              </span>
            </h2>

            {/* Subtitle description */}
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0 mb-5">
              Join thousands of engineering students mastering semesters with curated notes, solved PYQ solutions, syllabus roadmaps, and instant AI doubt assistance.
            </p>

            {/* Benefit Highlights */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-4 mb-6 text-xs sm:text-sm font-semibold text-navy-800 dark:text-gray-200">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-navy-800/80 border border-orange-100 dark:border-navy-700">
                <FileText className="w-3.5 h-3.5 text-brand-orange" />
                <span>Verified Notes & PYQs</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-navy-800/80 border border-orange-100 dark:border-navy-700">
                <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
                <span>24/7 AI Doubt Solver</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-navy-800/80 border border-orange-100 dark:border-navy-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>University Curriculum Aligned</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
              {currentUser ? (
                <Link 
                  to="/student/dashboard" 
                  className="px-6 py-3.5 rounded-xl bg-brand-orange hover:bg-brand-hover text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>Go to My Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link 
                  to="/register" 
                  className="px-6 py-3.5 rounded-xl bg-brand-orange hover:bg-brand-hover text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              
              <Link 
                to="/resources" 
                className="px-6 py-3.5 rounded-xl bg-white dark:bg-navy-800 hover:bg-gray-50 dark:hover:bg-navy-750 border border-gray-200 dark:border-navy-700 text-navy-900 dark:text-white font-bold text-xs sm:text-sm shadow-xs hover:border-brand-orange/60 dark:hover:border-brand-orange/60 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-brand-orange" />
                <span>Explore Resources</span>
              </Link>
            </div>

            {/* Micro reassurance line */}
            <p className="mt-3 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center lg:justify-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline shrink-0" />
              <span>No credit card required • Instant access to all GTU study materials</span>
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default SmartLearningCTA;
