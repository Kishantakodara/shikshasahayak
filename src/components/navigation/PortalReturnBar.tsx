import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, GraduationCap, ChevronRight } from 'lucide-react';

export interface CrumbItem {
  label: string;
  path?: string;
}

interface PortalReturnBarProps {
  /** Optional breadcrumbs trail. E.g. [{ label: 'Courses', path: '/courses' }, { label: 'Lesson 1' }] */
  crumbs?: CrumbItem[];
  /** Optional fallback path if history is empty. Default: '/student' */
  fallbackPath?: string;
  /** Extra content on the right side */
  extraRight?: React.ReactNode;
  /** Custom container class */
  className?: string;
}

export const PortalReturnBar: React.FC<PortalReturnBarProps> = ({
  crumbs = [],
  fallbackPath = '/student',
  extraRight,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleSafeBack = () => {
    // If the user arrived directly or opened in a new tab, history.length is 1 or 2
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <nav
      aria-label="Student Portal Navigation"
      className={`flex flex-wrap items-center justify-between gap-3 py-2.5 px-4 rounded-2xl bg-white/90 dark:bg-[#0F172A]/90 border border-[#E2E8F0] dark:border-slate-800 backdrop-blur-xs shadow-2xs text-xs font-semibold ${className}`}
    >
      {/* Left Navigation: Quick Back + Breadcrumbs */}
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <button
          onClick={handleSafeBack}
          type="button"
          aria-label="Go back to previous page"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F172A] dark:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

        {/* Direct Link to Student Portal Dashboard */}
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#F97316] dark:text-slate-300 dark:hover:text-[#F97316] transition-colors"
        >
          <GraduationCap className="w-4 h-4 text-[#F97316]" />
          <span>Student Portal</span>
        </Link>

        {/* Dynamic Breadcrumbs */}
        {crumbs.map((crumb, idx) => (
          <React.Fragment key={`${crumb.label}-${idx}`}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
            {crumb.path ? (
              <Link
                to={crumb.path}
                className="text-slate-600 hover:text-[#F97316] dark:text-slate-300 dark:hover:text-[#F97316] truncate max-w-[180px] sm:max-w-xs transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-[#0F172A] dark:text-white font-bold truncate max-w-[180px] sm:max-w-xs">
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Right Side Action (if provided) */}
      {extraRight && (
        <div className="flex items-center gap-2 shrink-0">
          {extraRight}
        </div>
      )}
    </nav>
  );
};

export default PortalReturnBar;
