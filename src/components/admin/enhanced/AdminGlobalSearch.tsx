// ============================================================
// ENHANCED ADMIN GLOBAL SEARCH COMPONENT
// Unified search across all question intelligence data with advanced filters
// ============================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  Clock,
  BookOpen,
  Hash,
  Calendar,
  Tag,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Database,
  ArrowRight,
  Save,
  History,
  Zap,
} from 'lucide-react';

export interface SearchFilter {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'number' | 'boolean';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: Record<string, any>;
  createdAt: string;
  usageCount: number;
}

export interface SearchResult {
  id: string;
  type: 'question' | 'subject' | 'paper' | 'duplicate-cluster' | 'quality-issue';
  title: string;
  subtitle: string;
  description: string;
  badges: Array<{ label: string; color: string }>;
  metadata: Record<string, any>;
  score: number;
}

interface AdminGlobalSearchProps {
  onResultSelect: (result: SearchResult) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  availableFilters: SearchFilter[];
  savedSearches: SavedSearch[];
  onSaveSearch: (name: string, query: string, filters: Record<string, any>) => void;
  className?: string;
}

export const AdminGlobalSearch: React.FC<AdminGlobalSearchProps> = ({
  onResultSelect,
  onFilterChange,
  availableFilters,
  savedSearches,
  onSaveSearch,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => searchRef.current?.focus(), 100);
      }
      
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  // Debounced search execution
  const executeSearch = useCallback(async (searchQuery: string, searchFilters: Record<string, any>) => {
    if (!searchQuery.trim() && Object.keys(searchFilters).length === 0) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // This would connect to your actual search API
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'question',
          title: 'What is the difference between process and thread?',
          subtitle: 'Operating System • Unit 2: Process Management',
          description: 'Question covers fundamental concepts in process management...',
          badges: [
            { label: 'Verified', color: 'emerald' },
            { label: 'High Quality', color: 'blue' }
          ],
          metadata: { semester: 5, difficulty: 'Medium', marks: 7 },
          score: 0.95
        },
        {
          id: '2', 
          type: 'duplicate-cluster',
          title: 'Duplicate Cluster: Database Normalization',
          subtitle: '5 occurrences across W2022, S2023, W2023',
          description: 'Recurring question about 1NF, 2NF, 3NF with slight variations',
          badges: [
            { label: 'High Frequency', color: 'orange' },
            { label: 'Needs Review', color: 'amber' }
          ],
          metadata: { occurrences: 5, subjects: ['DBMS', 'Database Systems'] },
          score: 0.88
        }
      ];
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      setResults(mockResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(query, filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filters, executeSearch]);

  const handleFilterChange = (filterId: string, value: any) => {
    const newFilters = { ...filters, [filterId]: value };
    if (value === '' || value === null || value === undefined) {
      delete newFilters[filterId];
    }
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSavedSearchSelect = (savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    setShowFilters(false);
  };

  const handleSaveCurrentSearch = () => {
    if (query.trim()) {
      const name = prompt('Enter name for this search:');
      if (name) {
        onSaveSearch(name, query, filters);
      }
    }
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'question': return BookOpen;
      case 'subject': return Database;
      case 'paper': return Calendar;
      case 'duplicate-cluster': return Hash;
      case 'quality-issue': return AlertTriangle;
      default: return Search;
    }
  };

  const getBadgeColor = (color: string) => {
    const colorMap = {
      emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      red: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  };
  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-3 px-4 py-2.5 bg-slate-900/60 border border-slate-700 hover:border-slate-600 rounded-xl transition-all group cursor-pointer ${className}`}
      >
        <Search className="w-4 h-4 text-slate-400 group-hover:text-orange-400" />
        <span className="text-sm text-slate-400 group-hover:text-slate-300 flex-1 text-left">
          Search questions, subjects, patterns...
        </span>
        <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
          ⌘K
        </kbd>
      </button>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <motion.div
              ref={containerRef}
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 mx-4"
            >
              {/* Search Header */}
              <div className="p-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-orange-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search across all question intelligence data..."
                    className="flex-1 bg-transparent text-white placeholder-slate-400 text-lg outline-none"
                    autoComplete="off"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveCurrentSearch}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      title="Save search"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`p-2 rounded-lg transition ${
                        showFilters || Object.keys(filters).length > 0
                          ? 'text-orange-400 bg-orange-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Active Filters Display */}
                {Object.keys(filters).length > 0 && (
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-xs text-slate-400">Active filters:</span>
                    {Object.entries(filters).map(([key, value]) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-lg text-xs"
                      >
                        {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                        <button
                          onClick={() => handleFilterChange(key, null)}
                          className="text-orange-400 hover:text-orange-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Advanced Filters Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-b border-slate-800 overflow-hidden"
                  >
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableFilters.map((filter) => (
                          <div key={filter.id} className="space-y-2">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                              {filter.label}
                            </label>
                            {filter.type === 'select' && (
                              <select
                                value={filters[filter.id] || ''}
                                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                              >
                                <option value="">All</option>
                                {filter.options?.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            )}
                            {filter.type === 'text' && (
                              <input
                                type="text"
                                value={filters[filter.id] || ''}
                                onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                                placeholder={filter.placeholder}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-400"
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Saved Searches */}
                      {savedSearches.length > 0 && (
                        <div className="pt-4 border-t border-slate-800">
                          <div className="flex items-center gap-2 mb-3">
                            <History className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Saved Searches
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {savedSearches.slice(0, 5).map((savedSearch) => (
                              <button
                                key={savedSearch.id}
                                onClick={() => handleSavedSearchSelect(savedSearch)}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg text-sm text-slate-300 hover:text-white transition"
                              >
                                {savedSearch.name}
                                <span className="ml-2 text-xs text-slate-500">
                                  ({savedSearch.usageCount})
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search Results */}
              <div className="max-h-96 overflow-y-auto">
                {loading && (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center gap-3 text-slate-400">
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Searching...</span>
                    </div>
                  </div>
                )}

                {!loading && results.length === 0 && query.trim() && (
                  <div className="p-8 text-center text-slate-400">
                    <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No results found for "{query}"</p>
                    <p className="text-xs mt-1">Try adjusting your search terms or filters</p>
                  </div>
                )}

                {!loading && results.length > 0 && (
                  <div className="p-2">
                    {results.map((result, index) => {
                      const Icon = getResultIcon(result.type);
                      return (
                        <button
                          key={result.id}
                          onClick={() => {
                            onResultSelect(result);
                            setIsOpen(false);
                          }}
                          className={`w-full p-3 rounded-xl text-left transition-all group ${
                            selectedIndex === index
                              ? 'bg-orange-500/20 border border-orange-500/30'
                              : 'hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h4 className="font-medium text-white text-sm truncate group-hover:text-orange-100">
                                  {result.title}
                                </h4>
                                <div className="flex items-center gap-1 shrink-0">
                                  {result.badges.map((badge, i) => (
                                    <span
                                      key={i}
                                      className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getBadgeColor(badge.color)}`}
                                    >
                                      {badge.label}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-slate-400 mb-1">{result.subtitle}</p>
                              <p className="text-xs text-slate-500 line-clamp-2">{result.description}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 mt-1 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
                <span>Press ↵ to select • ↓↑ to navigate • esc to close</span>
                <span>{results.length} results</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};