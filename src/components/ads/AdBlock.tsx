import React from 'react';

interface AdBlockProps {
  className?: string;
}

const AdBlock: React.FC<AdBlockProps> = ({ className = '' }) => {
  return (
    <div className={`w-full h-auto min-h-[100px] bg-gray-100 dark:bg-navy-800 border-2 border-dashed border-gray-300 dark:border-navy-600 flex items-center justify-center rounded-xl my-8 overflow-hidden ${className}`}>
      {/* 
        Google AdSense Ins tag will go here.
        Example:
        <ins className="adsbygoogle"
             style={{ display: 'block' }}
             data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
             data-ad-slot="XXXXXXXXXX"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      */}
      <span className="text-gray-400 dark:text-gray-500 font-medium text-sm text-center px-4 py-8">
        Advertisement Space<br/>
        <span className="text-xs font-normal opacity-70">(AdSense Placeholder)</span>
      </span>
    </div>
  );
};

export default AdBlock;
