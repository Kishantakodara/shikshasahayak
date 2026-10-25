import { jsonResponse, errorResponse } from "../lib/json";
import { getAuthenticatedUser, isAdmin } from "../lib/auth";

export async function onRequestGet(context: { env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; request: Request }) {
  const { env, request } = context;
  const db = env.ASSESSMENT_DB || (env as any).DB;
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const leaderboard = url.searchParams.get("leaderboard");
    if (leaderboard === "true") {
      const rows = await db.prepare(
        `SELECT s.user_id, s.xp, s.streak, p.name, p.email, p.branch, p.avatar_url
         FROM student_stats s
         LEFT JOIN student_profiles p ON s.user_id = p.user_id
         ORDER BY s.xp DESC, s.streak DESC
         LIMIT 20`
      ).all();
      return jsonResponse(rows.results || []);
    }

    if (!userId) {
      return errorResponse("User ID is required", 400);
    }

    if (userId !== user.uid && !isAdmin(user.email, user.role)) {
      return errorResponse("Forbidden", 403);
    }

    let stats: any = await db.prepare(
      `SELECT * FROM student_stats WHERE user_id = ? LIMIT 1`
    ).bind(userId).first();

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    if (!stats) {
      // Return default stats if user does not exist in DB yet
      return jsonResponse({
        user_id: userId,
        xp: 0,
        coins: 0,
        level: 1,
        streak: 0,
        longest_streak: 0,
        last_active: yesterdayStr,
        claimed_daily_reward: 0
      });
    }

    // Check if daily reward can be reset (if last active was before today)
    let claimedDailyReward = stats.claimed_daily_reward;
    if (stats.last_active !== todayStr) {
      claimedDailyReward = 0;
      await db.prepare(
        `UPDATE student_stats SET claimed_daily_reward = 0 WHERE user_id = ?`
      ).bind(userId).run();
    }

    // Compute live database statistics
    let totalStudents = 1;
    let rank = 1;
    let quizzesCount = 0;
    let avgAccuracy = 0;
    let projectsCount = 0;

    try {
      const totalRes: any = await db.prepare(
        `SELECT COUNT(*) as count FROM student_profiles`
      ).first();
      totalStudents = Math.max(totalRes?.count || 0, 1);

      const rankRes: any = await db.prepare(
        `SELECT COUNT(*) + 1 as rank FROM student_stats WHERE xp > ?`
      ).bind(stats.xp || 0).first();
      rank = rankRes?.rank || 1;

      const quizRes: any = await db.prepare(
        `SELECT COUNT(*) as count, AVG(score) as avg_score FROM quiz_attempts WHERE user_id = ?`
      ).bind(userId).first();
      quizzesCount = quizRes?.count || 0;
      avgAccuracy = quizRes?.avg_score ? Math.round(quizRes.avg_score) : 0;

      const projRes: any = await db.prepare(
        `SELECT COUNT(*) as count FROM student_projects WHERE status = 'approved'`
      ).first();
      projectsCount = projRes?.count || 0;
    } catch (e) {
      console.warn("Error calculating computed stats:", e);
    }

    return jsonResponse({
      ...stats,
      claimed_daily_reward: claimedDailyReward,
      total_students: totalStudents,
      weekly_rank: rank,
      quizzes_completed: quizzesCount,
      accuracy: avgAccuracy,
      projects_approved: projectsCount
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: { env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; request: Request }) {
  const { env, request } = context;
  const db = env.ASSESSMENT_DB || (env as any).DB;

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const body: any = await request.json();
    const { userId, action } = body;

    if (userId !== user.uid) {
      return errorResponse("Forbidden: Cannot modify another user's stats", 403);
    }

    if (!userId || !action) {
      return errorResponse("Missing userId or action", 400);
    }

    let stats: any = await db.prepare(
      `SELECT * FROM student_stats WHERE user_id = ? LIMIT 1`
    ).bind(userId).first();

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    // If no stats yet, initialize them with baseline values
    if (!stats) {
      stats = {
        user_id: userId,
        xp: 0,
        coins: 0,
        level: 1,
        streak: 0,
        longest_streak: 0,
        last_active: yesterdayStr,
        claimed_daily_reward: 0
      };
      await db.prepare(
        `INSERT INTO student_stats (user_id, xp, coins, level, streak, longest_streak, last_active, claimed_daily_reward)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(userId, stats.xp, stats.coins, stats.level, stats.streak, stats.longest_streak, stats.last_active, stats.claimed_daily_reward).run();
    }

    if (action === "claim_daily") {
      if (stats.last_active === todayStr && stats.claimed_daily_reward === 1) {
        return errorResponse("Daily reward already claimed today", 400);
      }

      const xpReward = 100;
      const coinsReward = 50;

      const newXp = stats.xp + xpReward;
      const newCoins = stats.coins + coinsReward;
      const newLevel = Math.floor(newXp / 1000) + 1;
      
      let newStreak = stats.streak;
      if (stats.last_active === yesterdayStr) {
        newStreak = stats.streak + 1;
      } else if (stats.last_active !== todayStr) {
        newStreak = 1; // Streak broken
      }

      const newLongestStreak = Math.max(stats.longest_streak, newStreak);

      await db.prepare(
        `UPDATE student_stats 
         SET xp = ?, coins = ?, level = ?, streak = ?, longest_streak = ?, last_active = ?, claimed_daily_reward = 1
         WHERE user_id = ?`
      ).bind(newXp, newCoins, newLevel, newStreak, newLongestStreak, todayStr, userId).run();

      return jsonResponse({
        success: true,
        xpReward,
        coinsReward,
        stats: {
          xp: newXp,
          coins: newCoins,
          level: newLevel,
          streak: newStreak,
          longestStreak: newLongestStreak,
          claimed_daily_reward: 1
        }
      });
    }

    return errorResponse("Invalid action", 400);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
