import React, { useState, useRef, useEffect } from 'react';
import { Search, Building2, Check, ChevronDown, Plus } from 'lucide-react';
import { TECHNICAL_UNIVERSITIES, TechnicalUniversity } from '../config/universities';

interface SearchableUniversitySelectProps {
  selectedUniversityName: string;
  onSelect: (universityName: string) => void;
}

export const SearchableUniversitySelect: React.FC<SearchableUniversitySelectProps> = ({
  selectedUniversityName,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customUniversity, setCustomUniversity] = useState('');
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

  const filteredUniversities = TECHNICAL_UNIVERSITIES.filter((uni) => {
    const query = searchQuery.toLowerCase();
    return (
      uni.name.toLowerCase().includes(query) ||
      uni.shortName.toLowerCase().includes(query) ||
      uni.state.toLowerCase().includes(query) ||
      uni.type.toLowerCase().includes(query)
    );
  });

  const handleSelectUniversity = (uniName: string) => {
    onSelect(uniName);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleApplyCustom = () => {
    if (customUniversity.trim()) {
      onSelect(customUniversity.trim());
      setIsOpen(false);
      setCustomUniversity('');
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
        Technical University *
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full pl-10 pr-10 py-3 text-left text-sm bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl focus:outline-none focus:border-brand-orange/50 focus:ring-2 focus:ring-brand-orange/10 transition-all dark:text-white flex items-center justify-between min-h-[46px]"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <span className="truncate">
              {selectedUniversityName || 'Select your Technical University...'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search box inside dropdown */}
          <div className="p-2 border-b border-gray-100 dark:border-navy-800 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indian Technical Universities (GTU, AKTU, VTU, Anna, JNTU, NIT, IIT)..."
              className="w-full pl-8 pr-4 py-2 text-xs bg-gray-50 dark:bg-navy-950 border border-gray-150 dark:border-navy-850 rounded-lg focus:outline-none focus:border-brand-orange/50 dark:text-white"
            />
          </div>

          {/* Universities list */}
          <ul className="max-h-60 overflow-y-auto py-1 text-xs">
            {filteredUniversities.length === 0 ? (
              <li className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center space-y-2">
                <p>No listed university found matching "{searchQuery}"</p>
                <div className="flex items-center gap-2 max-w-xs mx-auto">
                  <input
                    type="text"
                    value={customUniversity}
                    onChange={(e) => setCustomUniversity(e.target.value)}
                    placeholder="Enter your university name..."
                    className="flex-1 px-2.5 py-1.5 text-xs bg-gray-100 dark:bg-navy-950 border border-gray-300 dark:border-navy-800 rounded-md focus:outline-none dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustom}
                    className="px-3 py-1.5 bg-brand-orange text-white text-xs font-bold rounded-md hover:bg-brand-hover"
                  >
                    Add
                  </button>
                </div>
              </li>
            ) : (
              filteredUniversities.map((uni) => {
                const isSelected = selectedUniversityName === uni.name;
                return (
                  <li key={uni.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectUniversity(uni.name)}
                      className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-navy-800 transition-colors ${
                        isSelected
                          ? 'bg-brand-orange/5 text-brand-orange font-semibold'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 truncate">
                        <span className="truncate text-xs font-medium">
                          {uni.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                          <span className="bg-gray-100 dark:bg-navy-950 px-1.5 py-0.5 rounded font-mono">
                            {uni.state}
                          </span>
                          <span>•</span>
                          <span className="uppercase">{uni.type}</span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-brand-orange shrink-0 ml-2" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {/* Custom university input option at bottom */}
          <div className="p-2 border-t border-gray-100 dark:border-navy-800 bg-gray-50/50 dark:bg-navy-950/50 flex items-center gap-2">
            <input
              type="text"
              value={customUniversity}
              onChange={(e) => setCustomUniversity(e.target.value)}
              placeholder="Or type custom university name..."
              className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 rounded-lg focus:outline-none dark:text-white"
            />
            <button
              type="button"
              onClick={handleApplyCustom}
              disabled={!customUniversity.trim()}
              className="px-3 py-1.5 bg-brand-orange text-white text-xs font-bold rounded-lg disabled:opacity-50 hover:bg-brand-hover flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Use</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
