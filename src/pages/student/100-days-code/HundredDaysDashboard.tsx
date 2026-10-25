import React from 'react';
import { 
  Flame, 
  Code2, 
  CheckCircle2, 
  Clock, 
  Award, 
  Sparkles, 
  ChevronRight, 
  Zap, 
  Play, 
  Compass, 
  Layers,
  ArrowRight,
  TrendingUp,
  Target
} from 'lucide-react';
import { TrackMetadata, DayRoadmapItem } from '../../../data/coding100DaysCurriculum';

export interface DashboardProps {
  track: TrackMetadata;
  solvedDays: number[];
  currentDay: number;
  stats: {
    daysCompleted: number;
    completionPercentage: number;
    streakCount: number;
    totalXp: number;
    currentPhaseNumber: number;
    currentPhaseName: string;
  };
  roadmap: DayRoadmapItem[];
  recentSubmissions: any[];
  onSelectDay: (dayNumber: number) => void;
  onOpenTracks: () => void;
  onOpenRoadmap: () => void;
  onOpenProjects: () => void;
  onOpenAchievements: () => void;
}

export const HundredDaysDashboard: React.FC<DashboardProps> = ({
  track,
  solvedDays,
  currentDay,
  stats,
  roadmap,
  recentSubmissions,
  onSelectDay,
  onOpenTracks,
  onOpenRoadmap,
  onOpenProjects,
  onOpenAchievements
}) => {
  const currentProblem = roadmap.find(r => r.dayNumber === currentDay) || roadmap[0];
  const isStarted = stats.daysCompleted > 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. HERO BANNER WITH ACTIVE TRACK & ACTION */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-navy-950 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Active Track Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Code2 className="w-4 h-4 text-orange-500" />
              <span>{track.name} Track</span>
              <button
                onClick={onOpenTracks}
                className="ml-1 text-slate-300 hover:text-white underline text-[11px] font-semibold cursor-pointer"
                aria-label="Switch primary learning track"
              >
                Switch
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
              100 Days of <span className="text-orange-500">Code Challenge</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Curated progression of daily engineering challenges, system implementations, and verified algorithmic solutions. Build placement-ready discipline, one problem per day.
            </p>
          </div>

          {/* Quick CTA Card */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectDay(currentDay)}
              className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              {isStarted ? `Continue Day ${currentDay}` : 'Start Day 1 Sprint'}
            </button>

            <button
              onClick={onOpenRoadmap}
              className="px-5 py-3.5 bg-slate-800/80 hover:bg-slate-700 active:scale-[0.98] text-slate-200 font-bold text-sm rounded-2xl border border-slate-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-orange-400" />
              View Full Roadmap
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. PROGRESS METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Days Completed Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Roadmap Progress
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.daysCompleted}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 100 Days</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.completionPercentage}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            {stats.completionPercentage}% Completed
          </span>
        </div>

        {/* Active Streak Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Streak
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Flame className="w-4 h-4 fill-orange-500 animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.streakCount}
            </span>
            <span className="text-xs font-semibold text-orange-500">Days Active</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {stats.streakCount > 0 ? 'Consistent learning streak maintained' : 'Solve today to begin your streak'}
          </p>
        </div>

        {/* Learning XP Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total XP Earned
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Zap className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.totalXp}
            </span>
            <span className="text-xs font-semibold text-purple-500">XP</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Earn +30 to +60 XP per verified challenge
          </p>
        </div>

        {/* Current Phase Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Current Phase
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Phase {stats.currentPhaseNumber}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 5</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {stats.currentPhaseName}
          </p>
        </div>
      </div>

      {/* 3. CONTINUE LEARNING SPOTLIGHT CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 animate-ping" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Next Actionable Sprint
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
            Day {currentDay} of 100
          </span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {currentProblem?.category || 'Algorithm Focus'}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                currentProblem?.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' :
                currentProblem?.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' :
                'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400'
              }`}>
                {currentProblem?.difficulty || 'Medium'}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {currentProblem?.estimatedMinutes || 45} mins
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {currentProblem?.title || `Day ${currentDay}: Problem Sprint`}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Read the concept guide, write your solution in your language of choice, and benchmark your code against graded test cases.
            </p>
          </div>

          <button
            onClick={() => onSelectDay(currentDay)}
            className="w-full md:w-auto px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>{solvedDays.includes(currentDay) ? 'Revisit Challenge' : 'Open Day Sprint'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. 100-DAY ACTIVITY HEATMAP & CALENDAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              100 Days Challenge Heatmap
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any day square to jump to its lesson and code editor.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-orange-500 inline-block ring-2 ring-orange-500/30" />
              Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-800 inline-block" />
              Available
            </span>
          </div>
        </div>

        {/* The 100 Days Grid (10x10 layout on desktop, scrollable or wrap on mobile) */}
        <div className="grid grid-cols-10 sm:grid-cols-10 md:grid-cols-20 gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 100 }, (_, i) => i + 1).map((day) => {
            const isSolved = solvedDays.includes(day);
            const isCurrent = day === currentDay;

            return (
              <button
                key={day}
                onClick={() => onSelectDay(day)}
                title={`Day ${day}: ${isSolved ? 'Completed ✓' : isCurrent ? 'Active Focus' : 'Available'}`}
                aria-label={`Jump to Day ${day}`}
                className={`h-9 rounded-xl font-mono text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-orange-500 text-white ring-2 ring-orange-500/50 scale-105 shadow-md'
                    : isSolved
                    ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {isSolved ? '✓' : day}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. ROADMAP PREVIEW & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Nearby Days Roadmap preview */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Phase {stats.currentPhaseNumber}: Upcoming Sprints
            </h2>
            <button
              onClick={onOpenRoadmap}
              className="text-xs font-bold text-orange-500 hover:underline flex items-center gap-1 cursor-pointer"
            >
              See All 100 Days <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {roadmap
              .filter(r => r.phaseNumber === stats.currentPhaseNumber)
              .slice(0, 5)
              .map((item) => {
                const isSolved = solvedDays.includes(item.dayNumber);
                const isCurrent = item.dayNumber === currentDay;

                return (
                  <div
                    key={item.dayNumber}
                    onClick={() => onSelectDay(item.dayNumber)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? 'border-orange-500/50 bg-orange-500/5 dark:bg-orange-500/10'
                        : isSolved
                        ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20'
                        : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                        isSolved ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {isSolved ? '✓' : item.dayNumber}
                      </div>

                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {item.category} • {item.estimatedMinutes} mins
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                        +{item.xpReward} XP
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right: Portfolio & Achievements Quick Access */}
        <div className="lg:col-span-5 space-y-6">
          {/* Portfolio Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Layers className="w-4 h-4 text-orange-500" />
                <span>Capstone Project Portfolio</span>
              </div>
              <button
                onClick={onOpenProjects}
                className="text-xs font-bold text-orange-500 hover:underline cursor-pointer"
              >
                View Portfolio
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Showcase projects built during the 100 days with GitHub links and live demos to demonstrate practical engineering experience.
            </p>
          </div>

          {/* Badges Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Award className="w-4 h-4 text-orange-500" />
                <span>Achievements & Badges</span>
              </div>
              <button
                onClick={onOpenAchievements}
                className="text-xs font-bold text-orange-500 hover:underline cursor-pointer"
              >
                All Badges
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Unlock milestones like 7-Day Streak, Phase 1 Champion, and 100 Days Legend as you progress through challenges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HundredDaysDashboard;
