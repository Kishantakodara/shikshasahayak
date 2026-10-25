import React from 'react';
import { LucideIcon, Search, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onActionClick?: () => void;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Search,
  title,
  description,
  actionText,
  actionHref,
  onActionClick,
  onAction,
}) => {
  const handleAction = onActionClick || onAction;
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 my-6">
      <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-brand-orange flex items-center justify-center mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && (
        actionHref ? (
          <Link
            to={actionHref}
            className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all hover:scale-105 inline-flex items-center gap-2"
          >
            {actionText}
          </Link>
        ) : handleAction ? (
          <button
            onClick={handleAction}
            className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all hover:scale-105 inline-flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{actionText}</span>
          </button>
        ) : null
      )}
    </div>
  );
};

export default EmptyState;
