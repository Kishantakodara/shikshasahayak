import React from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  FileText, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  AlertTriangle,
  Mail
} from 'lucide-react';
import { usePageMeta } from '../utils/seo';

const About: React.FC = () => {
  usePageMeta({
    title: 'About ShikshaSahayak — Our Mission & Academic Integrity',
    description: 'Learn about ShikshaSahayak, the student-first EdTech platform providing verified GTU engineering notes, solved PYQ question papers, and study guides.',
    path: '/about',
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 py-12 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 text-brand-orange border border-orange-500/20 text-xs font-bold uppercase tracking-wider mb-4">
            <GraduationCap className="w-4 h-4" />
            <span>Built by Engineers, for Engineers</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy-900 dark:text-white mb-6 font-display tracking-tight leading-tight">
            Democratizing Engineering Education with <span className="text-brand-orange">Zero Paywalls</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            ShikshaSahayak is an open educational platform created to eliminate the frantic pre-exam hunt across scattered chat groups, broken drive links, and unverified folders.
          </p>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: 'Engineering Students', value: '50,000+', icon: Users, color: 'text-brand-orange' },
            { label: 'Subject Notes & Guides', value: '10,000+', icon: FileText, color: 'text-blue-500' },
            { label: 'GTU Previous Papers', value: '2,500+', icon: BookOpen, color: 'text-purple-500' },
            { label: 'Free Access Forever', value: '100%', icon: ShieldCheck, color: 'text-emerald-500' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-5 text-center shadow-xs hover:border-brand-orange/30 transition-all"
            >
              <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
              <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white font-display mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* The Problem & Our Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-8 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white font-display">The Pre-Exam Nightmare</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Every semester, thousands of engineering students waste precious preparation hours searching through disorganized WhatsApp groups, expired Google Drives, and handwritten PDFs with missing pages. Important syllabus changes and exam patterns get lost in the noise.
            </p>
          </div>

          <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-8 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-navy-900 dark:text-white font-display">The ShikshaSahayak Solution</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              A clean, high-speed, branch-and-semester catalog where every subject's notes, official GTU question papers, verified solutions, and original revision blueprints are structured logically in one central portal — accessible from any device in seconds.
            </p>
          </div>
        </div>

        {/* 4 Core Pillars */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white font-display mb-2">
              Our Core Academic Pillars
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              How we ensure every resource published delivers genuine academic value.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white font-display">Rigorous Moderation</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Student and educator submissions go through a human review workflow to verify legibility, accuracy with official syllabi, and check for copyright conflicts.
              </p>
            </div>

            <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white font-display">Deep Topic Indexing</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Previous year papers are indexed by exam year (Summer & Winter), subject codes, and engineering branches so you can target recurring high-weightage topics.
              </p>
            </div>

            <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white font-display">Zero Scaled Spam</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                We strictly reject auto-spun, scraped, or plagiarized articles. Our editorial guides are drafted by real engineering seniors and university alumni.
              </p>
            </div>
          </div>
        </div>

        {/* Hack for Social Cause & UN SDGs Alignment */}
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-orange-500/10 border-2 border-brand-orange/30 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-brand-orange font-bold text-sm uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Hack for Social Cause — VBYLD 2027 & UN SDGs</span>
            </div>
            <Link
              to="/hackathon"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:text-orange-600 transition-colors"
            >
              <span>View Full Hackathon Showcase</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            ShikshaSahayak is proudly submitted under the <strong>Viksit Bharat Young Leaders Dialogue (VBYLD) 2027 — Hack for Social Cause</strong> initiative organized by the Ministry of Youth Affairs & Sports (MoYAS) with IIT Bombay as National Knowledge Partner.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-white/80 dark:bg-navy-900/80 rounded-2xl p-4 border border-gray-200 dark:border-navy-700 space-y-1">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Primary Goal</span>
              <h4 className="text-xs font-bold text-navy-900 dark:text-white">SDG 4: Quality Education</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Zero-cost access to notes, PYQs, and AI doubts clearing.</p>
            </div>
            <div className="bg-white/80 dark:bg-navy-900/80 rounded-2xl p-4 border border-gray-200 dark:border-navy-700 space-y-1">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Equity Goal</span>
              <h4 className="text-xs font-bold text-navy-900 dark:text-white">SDG 10: Reduced Inequalities</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Bridging the Tier-1 vs Tier-3 and rural college divide.</p>
            </div>
            <div className="bg-white/80 dark:bg-navy-900/80 rounded-2xl p-4 border border-gray-200 dark:border-navy-700 space-y-1">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Economic Goal</span>
              <h4 className="text-xs font-bold text-navy-900 dark:text-white">SDG 8: Decent Work</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Coding practice tracks and verified career opportunities.</p>
            </div>
          </div>
        </div>

        {/* Disclaimer & Non-Affiliation */}
        <div className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-brand-orange font-bold text-sm uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Academic Independence & Disclaimer</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
            <p>
              <strong>ShikshaSahayak</strong> is an independent academic resource hub created and run by enthusiastic educators and engineering students. We are not officially affiliated with, endorsed by, or sponsored by Gujarat Technological University (GTU) or any governmental institution.
            </p>
            <p>
              All university names, course codes, and trademarks are used strictly for identification and educational reference. Students are always advised to verify critical examination dates, syllabus changes, and grade circulars on official university portals.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-br from-navy-900 to-navy-950 text-white rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden border border-navy-800">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display">
              Ready to Upgrade Your Study Game?
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Explore thousands of verified engineering notes, solved PYQs, and original guides right now.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 justify-center">
              <Link
                to="/resources/study-material"
                className="px-6 py-3 rounded-xl bg-brand-orange hover:bg-brand-hover text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-brand-orange/20"
              >
                Browse Study Notes
              </Link>
              <Link
                to="/resources/pyq"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs sm:text-sm font-bold transition-all"
              >
                View GTU PYQs
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
