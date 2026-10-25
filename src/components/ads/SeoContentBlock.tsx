import React from 'react';

interface SeoContentBlockProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const SeoContentBlock: React.FC<SeoContentBlockProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 ${className}`}>
      {title && <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-4">{title}</h2>}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default SeoContentBlock;
