// ============================================================
// SHIKSHA SAHAYAK OS API: /api/coding/100-days
// Section: 100 Days of Code Multi-Track Engineering Platform
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { Env } from "../../lib/contentEngine";
import { getAuthenticatedUser } from "../../lib/auth";
import {
  AVAILABLE_TRACKS,
  BADGES_LIST,
  getDayProblem,
  getRoadmapDays,
  getPhaseInfo
} from "../../lib/coding100DaysData";
import {
  gradeSubmission,
  validateCodeSyntaxAndStructure,
  TestCase
} from "../../lib/codeExecutionAdapter";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const db = (env as any).PADHAKU_CORE_DB || env.DB;
  const user = await getAuthenticatedUser(request, env);
  const userId = user?.uid || url.searchParams.get("userId") || 'guest_student';

  const view = url.searchParams.get("view") || 'dashboard';
  const trackId = url.searchParams.get("track") || 'dsa';
  const dayParam = url.searchParams.get("day");

  try {
    // -------------------------------------------------------------
    // VIEW: TRACKS LIST & PROGRESS
    // -------------------------------------------------------------
    if (view === 'tracks') {
      let enrolledTrack = 'dsa';
      let solvedCountsByTrack: Record<string, number> = {};

      if (db) {
        try {
          const activeTrackRes = await db.prepare(
            `SELECT track_id FROM student_100_days_tracks WHERE user_id = ? AND is_active = 1 LIMIT 1`
          ).bind(userId).first<{ track_id: string }>();

          if (activeTrackRes?.track_id) {
            enrolledTrack = activeTrackRes.track_id;
          }

          // Count solved days
          const countRes = await db.prepare(
            `SELECT count(*) as count FROM student_100_days_progress WHERE user_id = ? AND status = 'SOLVED'`
          ).bind(userId).first<{ count: number }>();
          
          solvedCountsByTrack['dsa'] = countRes?.count || 0;
        } catch (dbErr) {
          console.warn('Tracks query notice:', dbErr);
        }
      }

      const tracksWithProgress = AVAILABLE_TRACKS.map(t => ({
        ...t,
        isEnrolled: t.id === enrolledTrack,
        completedDays: solvedCountsByTrack[t.id] || 0,
        completionPercentage: Math.round(((solvedCountsByTrack[t.id] || 0) / t.plannedDays) * 100)
      }));

      return jsonResponse({
        success: true,
        tracks: tracksWithProgress,
        activeTrackId: enrolledTrack
      });
    }

    // -------------------------------------------------------------
    // VIEW: STUDENT PROJECT PORTFOLIO
    // -------------------------------------------------------------
    if (view === 'projects') {
      let projects: any[] = [];
      if (db) {
        try {
          const { results } = await db.prepare(
            `SELECT * FROM student_100_days_projects WHERE user_id = ? ORDER BY created_at DESC`
          ).bind(userId).all();

          projects = (results || []).map((p: any) => ({
            ...p,
            techStack: typeof p.tech_stack === 'string' ? JSON.parse(p.tech_stack || '[]') : (p.tech_stack || [])
          }));
        } catch (dbErr) {
          console.warn('Projects query notice:', dbErr);
        }
      }

      return jsonResponse({
        success: true,
        projects
      });
    }

    // -------------------------------------------------------------
    // VIEW: ACHIEVEMENTS & BADGES
    // -------------------------------------------------------------
    if (view === 'achievements') {
      let unlockedKeys = new Set<string>();
      let unlockedDates: Record<string, string> = {};

      if (db) {
        try {
          const { results } = await db.prepare(
            `SELECT badge_key, unlocked_at FROM student_100_days_achievements WHERE user_id = ?`
          ).bind(userId).all<{ badge_key: string; unlocked_at: string }>();

          if (results) {
            for (const r of results) {
              unlockedKeys.add(r.badge_key);
              unlockedDates[r.badge_key] = r.unlocked_at;
            }
          }
        } catch (dbErr) {
          console.warn('Achievements query notice:', dbErr);
        }
      }

      const badges = BADGES_LIST.map(b => ({
        ...b,
        isUnlocked: unlockedKeys.has(b.key),
        unlockedAt: unlockedDates[b.key] || null
      }));

      return jsonResponse({
        success: true,
        badges
      });
    }

    // -------------------------------------------------------------
    // DEFAULT VIEW: ROADMAP & DAY DETAILS
    // -------------------------------------------------------------
    let solvedDays: number[] = [];
    let streakCount = 0;
    let totalXp = 0;
    let activeTrack = trackId;

    if (db) {
      try {
        // Query active track
        const trackRow = await db.prepare(
          `SELECT track_id FROM student_100_days_tracks WHERE user_id = ? AND is_active = 1 LIMIT 1`
        ).bind(userId).first<{ track_id: string }>();
        if (trackRow?.track_id && !url.searchParams.get("track")) {
          activeTrack = trackRow.track_id;
        }

        // Query solved days
        const { results } = await db.prepare(
          `SELECT day_number FROM student_100_days_progress WHERE user_id = ? AND status = 'SOLVED' ORDER BY day_number ASC`
        ).bind(userId).all<{ day_number: number }>();

        if (results && results.length > 0) {
          solvedDays = results.map(r => r.day_number);
        }

        // Query student stats for real streak and XP
        const statsRow = await db.prepare(
          `SELECT streak, xp FROM student_stats WHERE user_id = ? LIMIT 1`
        ).bind(userId).first<{ streak: number; xp: number }>();

        if (statsRow) {
          streakCount = statsRow.streak || 0;
          totalXp = statsRow.xp || 0;
        } else {
          streakCount = solvedDays.length > 0 ? 1 : 0;
        }
      } catch (dbErr) {
        console.warn('Dashboard stats query notice:', dbErr);
      }
    }

    // Determine target day (defaults to lowest unsolved day or 1)
    let currentDayNumber = 1;
    if (dayParam) {
      currentDayNumber = Math.max(1, Math.min(100, parseInt(dayParam, 10) || 1));
    } else {
      // Find lowest unsolved day
      const firstUnsolved = Array.from({ length: 100 }, (_, i) => i + 1).find(d => !solvedDays.includes(d));
      currentDayNumber = firstUnsolved || 100;
    }

    const currentProblem = getDayProblem(activeTrack, currentDayNumber);
    const roadmapSummary = getRoadmapDays(activeTrack);

    // Sanitize test cases for client: Strip hidden test case expected outputs to prevent client leaking
    const safeProblem = {
      ...currentProblem,
      testCases: currentProblem.testCases.map(tc => ({
        input: tc.input,
        expectedOutput: tc.isHidden ? '[Hidden Test Case]' : tc.expectedOutput,
        isHidden: !!tc.isHidden
      }))
    };

    // Calculate roadmap stats
    const daysCompletedCount = solvedDays.length;
    const completionPercentage = Math.round((daysCompletedCount / 100) * 100);
    const currentPhase = getPhaseInfo(currentDayNumber);

    // Recent activity feed from attempts log
    let recentSubmissions: any[] = [];
    if (db) {
      try {
        const { results: recentAttempts } = await db.prepare(
          `SELECT day_number, action_type, language, status, execution_time_ms, created_at 
           FROM student_100_days_attempts 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT 5`
        ).bind(userId).all();
        recentSubmissions = recentAttempts || [];
      } catch {}
    }

    return jsonResponse({
      success: true,
      trackId: activeTrack,
      currentDay: currentDayNumber,
      problem: safeProblem,
      roadmap: roadmapSummary,
      solvedDays,
      stats: {
        daysCompleted: daysCompletedCount,
        completionPercentage,
        streakCount,
        totalXp,
        currentPhaseNumber: currentPhase.phaseNumber,
        currentPhaseName: currentPhase.phaseName
      },
      recentSubmissions
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to process 100 Days request', 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const db = (env as any).PADHAKU_CORE_DB || env.DB;
  const user = await getAuthenticatedUser(request, env);
  const userId = user?.uid;

  if (!userId) {
    return errorResponse('Authentication required to submit coding challenges.', 401);
  }

  try {
    const body = await request.json() as {
      action?: 'run' | 'submit' | 'enroll_track' | 'create_project' | 'delete_project';
      dayNumber?: number;
      trackId?: string;
      language?: 'javascript' | 'python' | 'cpp' | 'java';
      code?: string;
      projectData?: {
        title: string;
        description: string;
        techStack: string[];
        repoUrl?: string;
        demoUrl?: string;
        phaseNumber?: number;
        dayNumber?: number;
      };
      projectId?: string;
    };

    const action = body?.action || 'submit';

    // -------------------------------------------------------------
    // ACTION: ENROLL OR SWITCH TRACK
    // -------------------------------------------------------------
    if (action === 'enroll_track') {
      const trackId = body?.trackId || 'dsa';
      const validTrack = AVAILABLE_TRACKS.find(t => t.id === trackId);
      if (!validTrack) {
        return errorResponse(`Invalid track: ${trackId}`, 400);
      }

      if (db) {
        // Set all user tracks inactive, then activate selected track
        await db.prepare(
          `UPDATE student_100_days_tracks SET is_active = 0 WHERE user_id = ?`
        ).bind(userId).run();

        const enrollmentId = `enr_${userId}_${trackId}`;
        await db.prepare(
          `INSERT INTO student_100_days_tracks (id, user_id, track_id, is_active, last_active_at)
           VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
           ON CONFLICT(user_id, track_id) DO UPDATE SET
             is_active = 1,
             last_active_at = CURRENT_TIMESTAMP`
        ).bind(enrollmentId, userId, trackId).run();
      }

      return jsonResponse({
        success: true,
        enrolledTrack: trackId,
        message: `Successfully switched primary track to ${validTrack.name}. Previous progress is preserved.`
      });
    }

    // -------------------------------------------------------------
    // ACTION: CREATE PROJECT PORTFOLIO ITEM
    // -------------------------------------------------------------
    if (action === 'create_project') {
      const p = body?.projectData;
      if (!p || !p.title || !p.description) {
        return errorResponse('Project title and description are required.', 400);
      }

      const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const techStackJson = JSON.stringify(p.techStack || ['JavaScript']);
      const trackId = body.trackId || 'dsa';

      if (db) {
        await db.prepare(
          `INSERT INTO student_100_days_projects 
           (id, user_id, track_id, phase_number, day_number, title, description, tech_stack, repo_url, demo_url, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED')`
        ).bind(
          projectId,
          userId,
          trackId,
          p.phaseNumber || 1,
          p.dayNumber || 20,
          p.title,
          p.description,
          techStackJson,
          p.repoUrl || null,
          p.demoUrl || null
        ).run();
      }

      return jsonResponse({
        success: true,
        projectId,
        message: 'Project successfully added to your 100 Days of Code portfolio.'
      });
    }

    // -------------------------------------------------------------
    // ACTION: DELETE PROJECT PORTFOLIO ITEM
    // -------------------------------------------------------------
    if (action === 'delete_project') {
      const projectId = body?.projectId;
      if (!projectId) {
        return errorResponse('Project ID is required for deletion.', 400);
      }

      if (db) {
        await db.prepare(
          `DELETE FROM student_100_days_projects WHERE id = ? AND user_id = ?`
        ).bind(projectId, userId).run();
      }

      return jsonResponse({
        success: true,
        message: 'Project removed from portfolio.'
      });
    }

    // -------------------------------------------------------------
    // ACTION: RUN CODE (Sample tests only, no persistence of solved state)
    // -------------------------------------------------------------
    const dayNumber = Math.max(1, Math.min(100, body?.dayNumber || 1));
    const trackId = body?.trackId || 'dsa';
    const language = (body?.language || 'javascript').toLowerCase() as 'javascript' | 'python' | 'cpp' | 'java';
    const code = body?.code || '';

    const problem = getDayProblem(trackId, dayNumber);

    if (action === 'run') {
      // Validate structural syntax
      const syntaxCheck = validateCodeSyntaxAndStructure(language, code);
      if (!syntaxCheck.valid) {
        return jsonResponse({
          success: false,
          status: 'COMPILATION_ERROR',
          passed: false,
          feedback: syntaxCheck.error || 'Syntax validation failed.'
        });
      }

      // Visible sample tests only
      const visibleCases = problem.testCases.filter(t => !t.isHidden);
      const grade = await gradeSubmission(language, code, visibleCases, env as any);

      // Log attempt
      if (db) {
        try {
          const attemptId = `att_run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await db.prepare(
            `INSERT INTO student_100_days_attempts 
             (id, user_id, track_id, day_number, action_type, language, submitted_code, status, passed_tests, total_tests, execution_time_ms, feedback)
             VALUES (?, ?, ?, ?, 'RUN', ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            attemptId,
            userId,
            trackId,
            dayNumber,
            language,
            code,
            grade.status,
            grade.passedTests,
            grade.totalTests,
            grade.executionTimeMs,
            grade.feedback
          ).run();
        } catch (logErr) {
          console.warn('Run attempt log warning:', logErr);
        }
      }

      return jsonResponse({
        success: true,
        status: grade.status,
        passed: grade.passed,
        passedTests: grade.passedTests,
        totalTests: grade.totalTests,
        executionTimeMs: grade.executionTimeMs,
        feedback: grade.feedback
      });
    }

    // -------------------------------------------------------------
    // ACTION: SUBMIT SOLUTION (Full grading against visible & hidden tests)
    // -------------------------------------------------------------
    if (action === 'submit') {
      const grade = await gradeSubmission(language, code, problem.testCases, env as any);

      // Log submission attempt
      if (db) {
        try {
          const attemptId = `att_sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await db.prepare(
            `INSERT INTO student_100_days_attempts 
             (id, user_id, track_id, day_number, action_type, language, submitted_code, status, passed_tests, total_tests, execution_time_ms, feedback)
             VALUES (?, ?, ?, ?, 'SUBMIT', ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            attemptId,
            userId,
            trackId,
            dayNumber,
            language,
            code,
            grade.status,
            grade.passedTests,
            grade.totalTests,
            grade.executionTimeMs,
            grade.feedback
          ).run();
        } catch (subErr) {
          console.warn('Submit attempt log warning:', subErr);
        }
      }

      if (!grade.passed) {
        return jsonResponse({
          success: false,
          status: grade.status,
          passedTests: grade.passedTests,
          totalTests: grade.totalTests,
          executionTimeMs: grade.executionTimeMs,
          feedback: grade.feedback
        });
      }

      // Check if day was already solved previously (Idempotency safeguard)
      let alreadySolved = false;
      let newStreak = 1;
      let awardedXp = problem.xpReward;

      if (db) {
        try {
          const existing = await db.prepare(
            `SELECT id, status FROM student_100_days_progress WHERE user_id = ? AND day_number = ?`
          ).bind(userId, dayNumber).first<{ id: string; status: string }>();

          if (existing && existing.status === 'SOLVED') {
            alreadySolved = true;
            awardedXp = 0; // Prevent duplicate XP reward
          }

          // Persist solved state
          const progressId = `hnd_${userId}_${dayNumber}`;
          await db.prepare(
            `INSERT INTO student_100_days_progress 
             (id, user_id, day_number, status, language, submitted_code, passed_tests, total_tests, execution_time_ms, submitted_at)
             VALUES (?, ?, ?, 'SOLVED', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(user_id, day_number) DO UPDATE SET
               status = 'SOLVED',
               language = ?,
               submitted_code = ?,
               passed_tests = ?,
               total_tests = ?,
               execution_time_ms = ?,
               submitted_at = CURRENT_TIMESTAMP`
          ).bind(
            progressId, userId, dayNumber, language, code, grade.passedTests, grade.totalTests, grade.executionTimeMs,
            language, code, grade.passedTests, grade.totalTests, grade.executionTimeMs
          ).run();

          // Update student stats (XP & Streak) only if newly solved today
          if (!alreadySolved) {
            const todayStr = new Date().toISOString().split('T')[0];
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

            const stats = await db.prepare(
              `SELECT xp, streak, longest_streak, last_active FROM student_stats WHERE user_id = ? LIMIT 1`
            ).bind(userId).first<{ xp: number; streak: number; longest_streak: number; last_active: string }>();

            if (stats) {
              if (stats.last_active === yesterdayStr) {
                newStreak = stats.streak + 1;
              } else if (stats.last_active === todayStr) {
                newStreak = stats.streak;
              } else {
                newStreak = 1;
              }
              const newLongest = Math.max(stats.longest_streak || 0, newStreak);
              const updatedXp = (stats.xp || 0) + awardedXp;

              await db.prepare(
                `UPDATE student_stats 
                 SET xp = ?, streak = ?, longest_streak = ?, last_active = ? 
                 WHERE user_id = ?`
              ).bind(updatedXp, newStreak, newLongest, todayStr, userId).run();
            } else {
              // Insert baseline stats row
              await db.prepare(
                `INSERT INTO student_stats (user_id, xp, coins, level, streak, longest_streak, last_active, claimed_daily_reward)
                 VALUES (?, ?, 0, 1, 1, 1, ?, 0)`
              ).bind(userId, awardedXp, todayStr).run();
            }

            // Milestone Badge Evaluation
            const totalSolvedRow = await db.prepare(
              `SELECT count(*) as count FROM student_100_days_progress WHERE user_id = ? AND status = 'SOLVED'`
            ).bind(userId).first<{ count: number }>();
            const totalSolved = totalSolvedRow?.count || 1;

            const badgesToAward: Array<{ key: string; title: string; desc: string }> = [];
            if (totalSolved >= 1) badgesToAward.push({ key: 'first_day_solved', title: 'First Step Taken', desc: 'Solved Day 1 coding sprint.' });
            if (newStreak >= 3) badgesToAward.push({ key: 'three_day_streak', title: 'Momentum Builder', desc: '3-day continuous daily coding streak.' });
            if (newStreak >= 7) badgesToAward.push({ key: 'week_warrior', title: '7-Day Code Warrior', desc: '7-day continuous coding streak.' });
            if (totalSolved >= 20) badgesToAward.push({ key: 'phase_1_master', title: 'Foundations Champion', desc: 'Completed all 20 days of Phase 1.' });
            if (totalSolved >= 30) badgesToAward.push({ key: 'thirty_day_veteran', title: 'Habit of Excellence', desc: '30 days of code solved.' });
            if (totalSolved >= 50) badgesToAward.push({ key: 'half_century', title: 'Half-Century Coder', desc: 'Reached Day 50 of 100 Days of Code.' });
            if (totalSolved >= 80) badgesToAward.push({ key: 'phase_4_architect', title: 'System Architect', desc: 'Completed 80 days of code.' });
            if (totalSolved >= 100) badgesToAward.push({ key: 'hundred_days_legend', title: '100 Days Legend', desc: 'Completed all 100 days of code.' });

            for (const badge of badgesToAward) {
              const badgeId = `bdg_${userId}_${badge.key}`;
              await db.prepare(
                `INSERT INTO student_100_days_achievements (id, user_id, badge_key, title, description, unlocked_at)
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                 ON CONFLICT(user_id, badge_key) DO NOTHING`
              ).bind(badgeId, userId, badge.key, badge.title, badge.desc).run();
            }
          }
        } catch (dbErr) {
          console.warn('Submission persistence warning:', dbErr);
        }
      }

      return jsonResponse({
        success: true,
        status: 'ACCEPTED',
        passed: true,
        dayNumber,
        xpEarned: awardedXp,
        streakCount: newStreak,
        alreadySolved,
        feedback: alreadySolved 
          ? 'Solution updated and re-verified. (Day was already marked solved; no duplicate XP awarded).' 
          : `Day ${dayNumber} conquered! +${awardedXp} XP awarded and streak updated.`
      });
    }

    return errorResponse(`Unsupported action: ${action}`, 400);
  } catch (err: any) {
    return errorResponse(err.message || 'Submission processing error', 500);
  }
}
