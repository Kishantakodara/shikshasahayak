import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Star, 
  ChevronRight, 
  Filter, 
  Clock, 
  Zap, 
  BookOpen, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { DayRoadmapItem, TrackMetadata } from '../../../data/coding100DaysCurriculum';

export interface RoadmapProps {
  track: TrackMetadata;
  roadmap: DayRoadmapItem[];
  solvedDays: number[];
  currentDay: number;
  onSelectDay: (dayNumber: number) => void;
  onBackToDashboard: () => void;
}

const PHASES = [
  { number: 1, name: 'Phase 1: Foundations', range: 'Days 1–20', desc: 'Core syntax, time complexity, and linear data structures.' },
  { number: 2, name: 'Phase 2: Problem Solving', range: 'Days 21–40', desc: 'Two pointers, sliding window, stacks, and hash tables.' },
  { number: 3, name: 'Phase 3: Building & Structures', range: 'Days 41–60', desc: 'Trees, recursion, binary search, and heaps.' },
  { number: 4, name: 'Phase 4: Real-World Systems', range: 'Days 61–80', desc: 'Dynamic programming, graph traversals, and algorithms.' },
  { number: 5, name: 'Phase 5: Capstone & Portfolio', range: 'Days 81–100', desc: 'System design, complex problem solving, and capstone projects.' }
];

export const HundredDaysRoadmap: React.FC<RoadmapProps> = ({
  track,
  roadmap,
  solvedDays,
  currentDay,
  onSelectDay,
  onBackToDashboard
}) => {
  const [selectedPhase, setSelectedPhase] = useState<number>(1);
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Pending'>('All');

  // Filter days for current view
  const phaseDays = roadmap.filter(d => d.phaseNumber === selectedPhase);
  const filteredDays = phaseDays.filter(d => {
    if (difficultyFilter !== 'All' && d.difficulty !== difficultyFilter) return false;
    if (statusFilter === 'Completed' && !solvedDays.includes(d.dayNumber)) return false;
    if (statusFilter === 'Pending' && solvedDays.includes(d.dayNumber)) return false;
    return true;
  });

  const phaseCompletedCount = phaseDays.filter(d => solvedDays.includes(d.dayNumber)).length;
  const phasePercentage = Math.round((phaseCompletedCount / phaseDays.length) * 100);

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" /> 100 Days Curriculum Roadmap
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {track.name} <span className="text-orange-500">Milestone Map</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Organized into 5 progressive phases of 20 days each. Every challenge builds upon the previous concept to ensure systematic mastery.
          </p>
        </div>

        <button
          onClick={onBackToDashboard}
          className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Phase Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {PHASES.map((p) => {
          const isSelected = selectedPhase === p.number;
          const completedInThisPhase = roadmap
            .filter(d => d.phaseNumber === p.number)
            .filter(d => solvedDays.includes(d.dayNumber)).length;

          return (
            <button
              key={p.number}
              onClick={() => setSelectedPhase(p.number)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                isSelected
                  ? 'border-orange-500 bg-orange-500/5 dark:bg-orange-500/10 shadow-md ring-2 ring-orange-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  {p.range}
                </span>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                  {p.name.replace(/Phase \d+: /, '')}
                </h4>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <span className="font-semibold">{completedInThisPhase} / 20 Done</span>
                {completedInThisPhase === 20 && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar & Phase Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            {PHASES[selectedPhase - 1].name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {PHASES[selectedPhase - 1].desc} • {phaseCompletedCount} of 20 Challenges Conquered ({phasePercentage}%)
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Difficulty Dropdown */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
            aria-label="Filter by difficulty"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy Only</option>
            <option value="Medium">Medium Only</option>
            <option value="Hard">Hard Only</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
            aria-label="Filter by completion status"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed Only</option>
            <option value="Pending">Pending Only</option>
          </select>
        </div>
      </div>

      {/* Days List */}
      <div className="space-y-3">
        {filteredDays.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No challenges match the selected filters.</p>
            <button
              onClick={() => { setDifficultyFilter('All'); setStatusFilter('All'); }}
              className="text-xs text-orange-500 font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredDays.map((item) => {
            const isSolved = solvedDays.includes(item.dayNumber);
            const isCurrent = item.dayNumber === currentDay;
            // A day is unlocked if it's day 1 or previous day is solved, or if student solved it
            const isUnlocked = item.dayNumber === 1 || solvedDays.includes(item.dayNumber - 1) || isSolved;

            return (
              <div
                key={item.dayNumber}
                onClick={() => onSelectDay(item.dayNumber)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                  isCurrent
                    ? 'border-orange-500 bg-orange-500/5 dark:bg-orange-500/10 shadow-sm ring-1 ring-orange-500/30'
                    : isSolved
                    ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/20 hover:bg-emerald-50/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Left: Number + Details */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl font-mono text-xs font-black flex items-center justify-center shrink-0 ${
                    isSolved
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {isSolved ? '✓' : item.dayNumber}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      {item.isMilestone && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Star className="w-3 h-3 fill-current" /> Milestone
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {item.estimatedMinutes} mins
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Badges & Action */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                      item.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' :
                      item.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' :
                      'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                    }`}>
                      {item.difficulty}
                    </span>

                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-[11px] font-bold">
                      +{item.xpReward} XP
                    </span>
                  </div>

                  <button
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isSolved
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        : isCurrent
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{isSolved ? 'Review' : 'Start'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HundredDaysRoadmap;
