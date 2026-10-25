import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

interface InternshipEmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
  className?: string;
}

export const InternshipEmptyState: React.FC<InternshipEmptyStateProps> = ({
  title = 'No internships found',
  description = 'Try adjusting your filters or search term to find more opportunities.',
  onReset,
  className = '',
}) => {
  return (
    <div
      className={`col-span-full py-16 px-6 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      {/* Search illustration icon circle matching reference */}
      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/40 flex items-center justify-center">
          <div className="w-12 h-14 rounded-lg bg-white dark:bg-slate-800 border-2 border-orange-400 dark:border-orange-500 flex flex-col items-center justify-center gap-1.5 shadow-sm">
            <div className="w-7 h-1 bg-orange-300 rounded" />
            <div className="w-5 h-1 bg-orange-200 rounded" />
          </div>
        </div>
        <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md">
          <Search className="w-4 h-4 stroke-[2.5]" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs mt-1.5 leading-relaxed">
        {description}
      </p>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset filters</span>
        </button>
      )}
    </div>
  );
};

export default InternshipEmptyState;
