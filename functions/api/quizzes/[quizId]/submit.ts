import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

export async function onRequestPost(context: { env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; params: { quizId: string }; request: Request }) {
  const { env, params, request } = context;
  const { quizId } = params;

  try {
    if (!quizId) {
      return errorResponse("Quiz ID is required", 400);
    }

    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const body: any = await request.json();
    const { userId, answers } = body;

    if (userId !== user.uid) {
      return errorResponse("Forbidden: Cannot submit quiz for another user", 403);
    }

    if (!userId || !answers) {
      return errorResponse("Missing userId or answers", 400);
    }

    const db = (env as any).DB || env.ASSESSMENT_DB;

    // Fetch quiz metadata
    const quiz: any = await db.prepare(
      `SELECT * FROM quizzes WHERE id = ? LIMIT 1`
    ).bind(quizId).first();

    if (!quiz) {
      return errorResponse("Quiz not found", 404);
    }

    // Fetch quiz questions
    const { results: questions } = await db.prepare(
      `SELECT id, correct_answer FROM questions WHERE quiz_id = ?`
    ).bind(quizId).all();

    // Evaluate answers
    let correctCount = 0;
    questions.forEach((q: any) => {
      if (answers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });

    const xpEarned = quiz.xp_reward;
    const coinsEarned = 20; // Standard 20 coins for quiz completion

    const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate dates for streak logic
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    // Fetch or create student stats
    let stats: any = await db.prepare(
      `SELECT * FROM student_stats WHERE user_id = ? LIMIT 1`
    ).bind(userId).first();

    let newXp = xpEarned;
    let newCoins = coinsEarned;
    let newLevel = 1;
    let newStreak = 1;
    let newLongestStreak = 1;

    if (!stats) {
      // First-time user setup
      newLevel = Math.floor(newXp / 1000) + 1;
      await db.prepare(
        `INSERT INTO student_stats (user_id, xp, coins, level, streak, longest_streak, last_active, claimed_daily_reward)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
      ).bind(userId, newXp, newCoins, newLevel, newStreak, newLongestStreak, todayStr).run();
    } else {
      // Existing user stats update
      newXp = stats.xp + xpEarned;
      newCoins = stats.coins + coinsEarned;
      newLevel = Math.floor(newXp / 1000) + 1;
      
      const lastActive = stats.last_active;
      if (lastActive === todayStr) {
        newStreak = stats.streak;
        newLongestStreak = stats.longest_streak;
      } else if (lastActive === yesterdayStr) {
        newStreak = stats.streak + 1;
        newLongestStreak = Math.max(stats.longest_streak, newStreak);
      } else {
        newStreak = 1;
        newLongestStreak = stats.longest_streak;
      }

      await db.prepare(
        `UPDATE student_stats 
         SET xp = ?, coins = ?, level = ?, streak = ?, longest_streak = ?, last_active = ?
         WHERE user_id = ?`
      ).bind(newXp, newCoins, newLevel, newStreak, newLongestStreak, todayStr, userId).run();
    }

    // Record quiz attempt
    await db.prepare(
      `INSERT INTO quiz_attempts (id, quiz_id, user_id, score, xp_earned, coins_earned)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(attemptId, quizId, userId, correctCount, xpEarned, coinsEarned).run();

    return jsonResponse({
      attemptId,
      correctCount,
      questionsCount: quiz.questions_count,
      xpEarned,
      coinsEarned,
      stats: {
        xp: newXp,
        coins: newCoins,
        level: newLevel,
        streak: newStreak,
        longestStreak: newLongestStreak
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
