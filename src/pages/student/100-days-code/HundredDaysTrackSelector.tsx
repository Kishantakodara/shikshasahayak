import React from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Binary, 
  FileCode2, 
  Globe, 
  Coffee, 
  Cpu, 
  Layers, 
  Clock, 
  Compass, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { AVAILABLE_TRACKS, TrackMetadata } from '../../../data/coding100DaysCurriculum';

export interface TrackSelectorProps {
  tracks?: TrackMetadata[];
  activeTrackId: string;
  onSelectTrack: (trackId: string) => void;
  onBackToDashboard: () => void;
  switchingTrack?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Binary,
  FileCode2,
  Globe,
  Coffee,
  Cpu,
  Layers
};

export const HundredDaysTrackSelector: React.FC<TrackSelectorProps> = ({
  tracks = AVAILABLE_TRACKS,
  activeTrackId,
  onSelectTrack,
  onBackToDashboard,
  switchingTrack = false
}) => {
  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" /> Learning Tracks Catalog
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Choose Your <span className="text-orange-500">100-Day Discipline</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Select a specialized track tailored for your career goal. You can switch tracks at any time without losing your completed submissions or streak.
          </p>
        </div>

        <button
          onClick={onBackToDashboard}
          className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Tracks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks.map((track) => {
          const IconComponent = ICON_MAP[track.iconName] || Binary;
          const isActive = track.id === activeTrackId;

          return (
            <div
              key={track.id}
              className={`flex flex-col justify-between bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border transition-all duration-200 hover:shadow-lg ${
                isActive
                  ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                {/* Top Badge & Icon */}
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <IconComponent className="w-6 h-6" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      track.level === 'Beginner'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : track.level === 'Intermediate'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                    }`}>
                      {track.level}
                    </span>

                    {isActive && (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-500 text-white shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {track.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {track.shortDescription}
                  </p>
                </div>

                {/* Metadata List */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Planned Days
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{track.plannedDays} Days</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Daily Time
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">~{track.estimatedHoursPerDay} hr/day</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" /> Prerequisites
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]" title={track.prerequisites.join(', ')}>
                      {track.prerequisites[0]}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {track.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <button
                  onClick={() => onSelectTrack(track.id)}
                  disabled={switchingTrack}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 ${
                    isActive
                      ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {isActive ? (
                    <>
                      <span>Continue Learning</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Select Track</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HundredDaysTrackSelector;
