import React from 'react';

export const InternshipCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between animate-pulse"
        >
          <div className="space-y-4">
            {/* Header: Circle Avatar + 2 lines + Bookmark placeholder */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-2">
                  <div className="w-24 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="w-16 h-2.5 bg-slate-100 dark:bg-slate-850 rounded" />
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0" />
            </div>

            {/* Title Line */}
            <div className="w-4/5 h-5 bg-slate-200 dark:bg-slate-800 rounded mt-1" />

            {/* Tags */}
            <div className="flex gap-2">
              <div className="w-20 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg" />
              <div className="w-16 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg" />
            </div>

            {/* Location */}
            <div className="w-32 h-3.5 bg-slate-100 dark:bg-slate-800 rounded" />

            {/* Facts Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="h-12 bg-slate-50 dark:bg-slate-800/60 rounded-xl" />
              <div className="h-12 bg-slate-50 dark:bg-slate-800/60 rounded-xl" />
            </div>

            {/* Verified Banner placeholder */}
            <div className="h-10 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl" />
          </div>

          {/* Button placeholder */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
            <div className="w-full h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      ))}
    </>
  );
};

export default InternshipCardSkeleton;
