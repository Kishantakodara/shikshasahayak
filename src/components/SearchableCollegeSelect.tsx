import React, { useState, useRef, useEffect } from 'react';
import { Search, School, Check, ChevronDown } from 'lucide-react';
import { COLLEGES, College } from '../config/colleges';

interface SearchableCollegeSelectProps {
  selectedCollegeName: string;
  onSelect: (college: College) => void;
}

export const SearchableCollegeSelect: React.FC<SearchableCollegeSelectProps> = ({
  selectedCollegeName,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredColleges = COLLEGES.filter((college) => {
    const query = searchQuery.toLowerCase();
    return (
      college.name.toLowerCase().includes(query) ||
      college.code.toLowerCase().includes(query) ||
      college.type.toLowerCase().includes(query) ||
      `zone ${college.zone}`.includes(query)
    );
  });

  const selectedCollege = COLLEGES.find((c) => c.name === selectedCollegeName);

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
        College / Institute *
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full pl-10 pr-10 py-3 text-left text-sm bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl focus:outline-none focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/10 transition-all dark:text-white flex items-center justify-between min-h-[46px]"
        >
          <div className="flex items-center gap-2 truncate">
            <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <span className="truncate">
              {selectedCollege
                ? `[${selectedCollege.code}] ${selectedCollege.name}`
                : 'Select your college...'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search box inside dropdown */}
          <div className="p-2 border-b border-gray-100 dark:border-navy-800 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-405" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, name, zone or type..."
              className="w-full pl-8 pr-4 py-2 text-xs bg-gray-50 dark:bg-navy-950 border border-gray-150 dark:border-navy-850 rounded-lg focus:outline-none focus:border-brand-orange/50 dark:text-white"
            />
          </div>

          {/* Colleges list */}
          <ul className="max-h-60 overflow-y-auto py-1 text-xs">
            {filteredColleges.length === 0 ? (
              <li className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">
                No colleges found matching "{searchQuery}"
              </li>
            ) : (
              filteredColleges.map((college) => {
                const isSelected = selectedCollegeName === college.name;
                return (
                  <li key={college.code}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(college);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-navy-800 transition-colors ${
                        isSelected
                          ? 'bg-brand-orange/5 text-brand-orange font-semibold'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 truncate">
                        <span className="truncate text-xs">
                          {college.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                          <span className="bg-gray-100 dark:bg-navy-950 px-1.5 py-0.5 rounded font-mono">
                            Code: {college.code}
                          </span>
                          <span>•</span>
                          <span>Zone {college.zone}</span>
                          <span>•</span>
                          <span className="uppercase">{college.type}</span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-brand-orange shrink-0 ml-2" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
