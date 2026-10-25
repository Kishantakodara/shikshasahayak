import React from 'react';
import { 
  Award, 
  Sparkles, 
  Flame, 
  Trophy, 
  ShieldCheck, 
  Zap, 
  Compass, 
  Crown,
  Lock,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { BADGES_LIST, BadgeDefinition } from '../../../data/coding100DaysCurriculum';

export interface AchievementItem extends BadgeDefinition {
  isUnlocked: boolean;
  unlockedAt: string | null;
}

export interface AchievementsProps {
  badges: AchievementItem[];
  daysCompletedCount: number;
  streakCount: number;
  totalXp: number;
  onBackToDashboard: () => void;
}

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Flame,
  Trophy,
  ShieldCheck,
  Zap,
  Award,
  Compass,
  Crown
};

export const HundredDaysAchievements: React.FC<AchievementsProps> = ({
  badges = BADGES_LIST.map(b => ({ ...b, isUnlocked: false, unlockedAt: null })),
  daysCompletedCount,
  streakCount,
  totalXp,
  onBackToDashboard
}) => {
  const unlockedCount = badges.filter(b => b.isUnlocked).length;
  const progressPercent = Math.round((unlockedCount / badges.length) * 100);

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" /> Milestones & Verified Badges
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Your 100 Days <span className="text-orange-500">Achievements</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Milestones unlocked by real server-verified problem submissions and disciplined daily streaks. No artificial gamification or duplicate awards.
          </p>
        </div>

        <button
          onClick={onBackToDashboard}
          className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Unlocked Badges</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {unlockedCount} <span className="text-xs font-semibold text-slate-400">/ {badges.length}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs">
            {progressPercent}%
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Streak</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 flex items-baseline gap-1">
              {streakCount} <span className="text-xs font-bold text-orange-500">Days</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <Flame className="w-5 h-5 fill-current" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Learning XP</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 flex items-baseline gap-1">
              {totalXp} <span className="text-xs font-bold text-purple-500">XP</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Zap className="w-5 h-5 fill-current" />
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {badges.map((b) => {
          const IconComp = BADGE_ICONS[b.icon] || Award;
          const isUnlocked = b.isUnlocked;

          return (
            <div
              key={b.key}
              className={`p-6 rounded-3xl border flex flex-col justify-between space-y-4 transition ${
                isUnlocked
                  ? 'bg-white dark:bg-slate-900 border-orange-500/40 shadow-md ring-1 ring-orange-500/20'
                  : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-70'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isUnlocked
                      ? 'bg-orange-500/10 text-orange-500'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}>
                    <IconComp className="w-6 h-6" />
                  </div>

                  {isUnlocked ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {b.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {b.description}
                  </p>
                </div>
              </div>

              {/* Footer status / unlock date */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 font-medium flex items-center justify-between">
                {isUnlocked && b.unlockedAt ? (
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 truncate">
                    <Calendar className="w-3 h-3" />
                    {new Date(b.unlockedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                ) : (
                  <span>
                    {b.requiredDaysCount ? `Requires ${b.requiredDaysCount} days` : b.requiredStreak ? `Requires ${b.requiredStreak}-day streak` : 'Milestone reward'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HundredDaysAchievements;
