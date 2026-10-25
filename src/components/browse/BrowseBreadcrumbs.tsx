import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface Crumb {
  label: string;
  to?: string;
}

interface BrowseBreadcrumbsProps {
  items: Crumb[];
}

const BrowseBreadcrumbs: React.FC<BrowseBreadcrumbsProps> = ({ items }) => (
  <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
    <Link
      to="/resources"
      className="inline-flex items-center gap-1 hover:text-brand-orange transition-colors"
    >
      <Home className="h-4 w-4" />
      Resources
    </Link>
    {items.map((item, index) => (
      <React.Fragment key={`${item.label}-${index}`}>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
        {item.to ? (
          <Link to={item.to} className="hover:text-brand-orange transition-colors font-medium">
            {item.label}
          </Link>
        ) : (
          <span className="text-navy-900 dark:text-white font-semibold">{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

export default BrowseBreadcrumbs;
