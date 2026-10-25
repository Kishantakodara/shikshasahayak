import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Check, 
  Sparkles, 
  Sliders, 
  BrainCircuit, 
  Code, 
  Briefcase, 
  RotateCcw, 
  LayoutGrid
} from 'lucide-react';
import { WIDGET_CATALOG, WidgetDefinition } from '../../config/assessmentPacks';

interface WidgetLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  installedWidgetIds: string[];
  onToggleWidget: (widgetId: string) => void;
  onRestoreDefaults: () => void;
}

export function WidgetLibraryModal({
  isOpen,
  onClose,
  installedWidgetIds,
  onToggleWidget,
  onRestoreDefaults
}: WidgetLibraryModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Modules' },
    { id: 'academic', label: 'Academic & Exams' },
    { id: 'coding', label: 'Coding & Tech' },
    { id: 'revision', label: 'Revision & Formulas' },
    { id: 'career', label: 'Career & Placement' },
    { id: 'productivity', label: 'Productivity' },
  ];

  const filteredWidgets = WIDGET_CATALOG.filter(w => {
    const matchesCategory = activeCategory === 'all' || w.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      w.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-[95vw] sm:max-w-4xl p-4 sm:p-8 shadow-2xl space-y-4 sm:space-y-6 relative overflow-hidden text-left flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                Widget Library & Cross-Branch Store
                <span className="text-[10px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-950/50 dark:text-orange-400 px-2 py-0.5 rounded-full font-mono uppercase">
                  App Store
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Install, remove, or customize widgets from any GTU engineering branch freely.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search widgets (e.g. Coding, Formulas, GTU PYQs, Aptitude)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={onRestoreDefaults}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-orange-500 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset layout to default branch pack"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Restore Defaults</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === c.id
                    ? 'bg-orange-500 text-white shadow-sm font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-1 flex-1">
          {filteredWidgets.map((widget) => {
            const isInstalled = installedWidgetIds.includes(widget.id);
            return (
              <div
                key={widget.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isInstalled
                    ? 'border-orange-500/40 bg-orange-50/20 dark:bg-orange-950/10'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {widget.category}
                    </span>
                    {widget.isCrossBranchFriendly && (
                      <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-500" /> Cross-Branch
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {widget.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {widget.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                    Span: {widget.defaultGridSpan || 'medium'}
                  </span>
                  <button
                    onClick={() => onToggleWidget(widget.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isInstalled
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-900/30'
                        : 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs'
                    }`}
                  >
                    {isInstalled ? (
                      <>
                        <X className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>Install</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Active Installed Widgets: {installedWidgetIds.length}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done Customizing
          </button>
        </div>

      </div>
    </div>
  );
}
