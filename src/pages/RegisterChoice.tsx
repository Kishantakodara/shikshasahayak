// ============================================================
// SHIKSHA SAHAYAK — ACCOUNT TYPE CHOOSER PAGE (`/register`)
// Allows users to select Student or Teacher registration flow
// Brand-aligned Orange (#F97316) & Navy (#0F172A) Design System
// ============================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Users, ArrowRight, ShieldCheck } from 'lucide-react';

const RegisterChoice: React.FC = () => {
  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50 dark:bg-navy-950 px-4 py-12 transition-colors">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/40 border border-orange-200/40 dark:border-orange-500/20 text-brand-orange text-xs font-bold tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4 text-brand-orange" />
            <span>Welcome to ShikshaSahayak</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 dark:text-white font-display tracking-tight">
            Choose Your Account Type
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
            Select how you would like to use ShikshaSahayak to get started with tailored tools.
          </p>
        </div>

        {/* Choice Cards */}
        <div className="max-w-md mx-auto">
          
          {/* Card 1: Student */}
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-8 border border-gray-200 dark:border-navy-800 shadow-xl hover:border-brand-orange/50 dark:hover:border-brand-orange/50 transition-all group flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/50 dark:border-orange-500/20 text-brand-orange flex items-center justify-center group-hover:scale-105 transition-transform">
                <GraduationCap className="w-8 h-8 text-brand-orange" />
              </div>
              <h2 className="text-2xl font-bold text-navy-900 dark:text-white font-display">
                I am a Student
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Access GTU previous year papers (PYQs), subject notes, AI Tutor, quizzes, and personalized academic analytics.
              </p>
              <ul className="space-y-2 pt-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                  <span>Branch & Semester-tailored study materials</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                  <span>Interactive AI Tutor & Quiz Practice Zone</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                  <span>Personalized Digital Library & Progress Tracker</span>
                </li>
              </ul>
            </div>

            <Link
              to="/register/student"
              className="w-full py-3.5 px-6 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Register as Student</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

        {/* Footer Login Link */}
        <div className="text-center pt-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-orange font-bold hover:underline">
              Login here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default RegisterChoice;
