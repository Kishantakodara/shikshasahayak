import React from 'react';

interface SkeletonGridProps {
  count?: number;
  columns?: string;
}

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 animate-pulse">
      {/* Top badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-5 w-12 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
        <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Subject */}
      <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />

      {/* Title */}
      <div className="space-y-1.5">
        <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-4 w-3/5 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
};

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({ 
  count = 4,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
}) => {
  return (
    <div className={`grid ${columns} gap-4 sm:gap-5`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export default SkeletonCard;
