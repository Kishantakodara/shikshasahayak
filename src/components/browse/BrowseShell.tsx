import React from 'react';
import BrowseBreadcrumbs, { Crumb } from './BrowseBreadcrumbs';

interface BrowseShellProps {
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const BrowseShell: React.FC<BrowseShellProps> = ({
  crumbs,
  eyebrow,
  title,
  description,
  children,
}) => (
  <div className="w-full min-h-full bg-slate-50 dark:bg-[#090D1A] py-6 sm:py-10 animate-fade-in transition-colors">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <BrowseBreadcrumbs items={crumbs} />
      </div>
      <header className="mb-10 max-w-3xl">
        {eyebrow && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-brand-orange text-xs font-extrabold uppercase tracking-wider mb-3">
            {eyebrow}
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-slate-900 dark:text-white tracking-tight leading-tight mb-3">
          {title}
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {description}
          </p>
        )}
      </header>
      {children}
    </div>
  </div>
);

export default BrowseShell;
