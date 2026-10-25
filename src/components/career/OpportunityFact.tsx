import React from 'react';

interface OpportunityFactProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subvalue?: string;
  className?: string;
}

export const OpportunityFact: React.FC<OpportunityFactProps> = ({
  icon,
  label,
  value,
  subvalue,
  className = '',
}) => {
  return (
    <div className={`flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 ${className}`}>
      <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700/80 border border-slate-200/60 dark:border-slate-600/60 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-300">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 block leading-tight">
          {label}
        </span>
        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
          {value}
        </div>
        {subvalue && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
            {subvalue}
          </span>
        )}
      </div>
    </div>
  );
};

export default OpportunityFact;
