import React, { useState, useEffect } from "react";
import { Trophy, Flame, Zap, Crown } from "lucide-react";
import { LeaderboardUserSpec } from "../../types/engagement-gamification";
import { fetchLeaderboard } from "../../api/studentEngagementClient";

export const LeaderboardView: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUserSpec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard().then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-6 bg-card border border-border rounded-2xl text-muted-foreground text-xs animate-pulse">Loading Leaderboard...</div>;
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h3 className="font-extrabold text-sm text-foreground font-display uppercase tracking-wider">
            GTU Top Learners Leaderboard
          </h3>
        </div>
        <span className="text-[10px] font-bold text-muted-foreground">Weekly Refresh</span>
      </div>

      {users.length === 0 ? (
        <div className="p-8 text-center bg-muted/30 border border-dashed border-border rounded-2xl">
          <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-xs font-bold text-foreground">No Student Rankings Available Yet</p>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
            Complete practice tests, study assignments, and learning modules to earn XP and appear on the university leaderboard.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 pt-2">
          {users.map((u) => (
            <div
              key={u.userId}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors ${
                u.rank === 1
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                  : u.rank === 2
                  ? "bg-muted/80 border-border text-foreground"
                  : u.rank === 3
                  ? "bg-amber-900/10 border-amber-800/20 text-amber-800 dark:text-amber-200"
                  : "bg-muted/40 border-border text-muted-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center font-black text-xs text-foreground">
                  {u.rank === 1 ? <Crown className="h-4 w-4 text-amber-500" /> : `#${u.rank}`}
                </div>
                <div>
                  <span className="font-bold text-xs block text-foreground">{u.displayName}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Level {u.level}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-extrabold">
                <span className="flex items-center gap-1 text-[#f97316]">
                  <Flame className="h-3.5 w-3.5" /> {u.streak}d
                </span>
                <span className="flex items-center gap-1 text-amber-500">
                  <Zap className="h-3.5 w-3.5" /> {u.totalXp} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
