import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FolderOpen, BookOpen } from 'lucide-react';

interface FolderCardProps {
  to: string;
  title: string;
  description?: string;
  meta?: string;
}

export const FolderCard: React.FC<FolderCardProps> = ({ to, title, description, meta }) => (
  <Link
    to={to}
    className="group flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-brand-orange dark:hover:border-brand-orange rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-lg transition-all duration-200 min-h-[120px] card-interactive"
  >
    <div>
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-brand-orange flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <FolderOpen className="h-5 w-5" />
        </div>
        {meta && (
          <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {meta}
          </span>
        )}
      </div>
      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-orange transition-colors mb-1 line-clamp-2">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{description}</p>
      )}
    </div>
    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-brand-orange">
      <span>Open folder</span>
      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
    </div>
  </Link>
);

export default FolderCard;
