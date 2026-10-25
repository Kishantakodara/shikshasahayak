import React from "react";
import { Flame, Zap, Award, ShieldAlert } from "lucide-react";
import { StudentStreakSpec, StudentXPAchievementSpec } from "../../types/engagement-gamification";

interface StreakCounterWidgetProps {
  streak?: StudentStreakSpec;
  xp?: StudentXPAchievementSpec;
}

export const StreakCounterWidget: React.FC<StreakCounterWidgetProps> = ({ streak, xp }) => {
  const currentStreak = streak?.currentStreak || 5;
  const totalXp = xp?.totalXp || 1250;
  const level = xp?.level || 4;
  const badges = xp?.badges || ["GTU Explorer", "PYQ Master"];

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-[#f97316] animate-bounce" />
          <h3 className="font-extrabold text-sm text-white font-display uppercase tracking-wider">
            Study Streak & XP
          </h3>
        </div>
        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20">
          Level {level}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-black">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-black text-white font-display block leading-none">{currentStreak} Days</span>
            <span className="text-[10px] text-slate-400 font-bold">Daily Streak</span>
          </div>
        </div>

        <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-black text-white font-display block leading-none">{totalXp} XP</span>
            <span className="text-[10px] text-slate-400 font-bold">Total Earned</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 pt-1">
        <span className="text-[11px] font-bold text-slate-400 block">Unlocked Badges</span>
        <div className="flex flex-wrap gap-2">
          {badges.map((b, idx) => (
            <span key={idx} className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
              <Award className="h-3 w-3" /> {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
