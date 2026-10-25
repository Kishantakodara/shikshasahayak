// ============================================================
// ACADEMIC TIMELINE API: GET /api/student/timeline
// Section 27 & 28: Chronologically ordered events aggregating assignments,
// assessments, GTU examinations, and milestones for student academic planning.
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser } from "../../lib/auth";
import { getStudentAcademicProfile } from "../../lib/studentIdentityService";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const coreDb = (env as any).PADHAKU_CORE_DB || env.DB;
  const db = env.DB || (env as any).PADHAKU_CORE_DB;

  const user = await getAuthenticatedUser(request, env);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const profile = await getStudentAcademicProfile(env, user.uid);
    const semester = profile.semester || 3;
    const branchName = profile.branchName || 'Engineering';

    const events: any[] = [];
    const now = new Date();

    // 1. Assignments Deadlines
    if (coreDb) {
      try {
        const { results } = await coreDb.prepare(
          `SELECT 
             a.id,
             a.title,
             a.due_date,
             a.total_marks,
             s.name as subject_name,
             sub.id as submission_id,
             sub.status as submission_status
           FROM assignments a
           LEFT JOIN classes c ON a.class_id = c.id
           LEFT JOIN subjects s ON c.subject_id = s.id
           LEFT JOIN assignment_submissions sub ON a.id = sub.assignment_id AND sub.student_id = ?
           WHERE a.status = 'published' AND a.due_date IS NOT NULL
           ORDER BY a.due_date ASC
           LIMIT 10`
        ).bind(user.uid).all<Record<string, unknown>>();

        for (const row of results || []) {
          const dueDate = new Date(String(row.due_date));
          const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isSubmitted = Boolean(row.submission_id);

          let status = 'UPCOMING';
          if (row.submission_status === 'graded') status = 'COMPLETED';
          else if (isSubmitted) status = 'SUBMITTED';
          else if (diffDays < 0) status = 'OVERDUE';

          events.push({
            id: `assign_${row.id}`,
            title: String(row.title),
            category: 'ASSIGNMENT',
            subjectName: row.subject_name ? String(row.subject_name) : 'Academic Lab',
            date: String(row.due_date),
            daysRemaining: diffDays,
            status,
            totalMarks: row.total_marks,
            link: '/student/assignments',
          });
        }
      } catch {}
    }

    // 2. GTU Examination Milestones
    const year = now.getFullYear();
    const currentMonth = now.getMonth();

    if (currentMonth <= 5) {
      // Summer Exam Schedule
      const midSemDate = new Date(year, 3, 10); // April 10
      const vivaDate = new Date(year, 4, 12); // May 12
      const endSemDate = new Date(year, 4, 28); // May 28

      events.push({
        id: 'event_gtu_mid_sem',
        title: `College Mid-Semester Examination — Semester ${semester}`,
        category: 'EXAM',
        subjectName: `${branchName} Department`,
        date: midSemDate.toISOString().split('T')[0],
        daysRemaining: Math.ceil((midSemDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        status: midSemDate > now ? 'UPCOMING' : 'COMPLETED',
        link: '/student/practice',
      });

      events.push({
        id: 'event_gtu_practical_viva',
        title: `GTU Practical & Viva Examination — Semester ${semester}`,
        category: 'VIVA',
        subjectName: 'Laboratory Evaluation',
        date: vivaDate.toISOString().split('T')[0],
        daysRemaining: Math.ceil((vivaDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        status: vivaDate > now ? 'UPCOMING' : 'COMPLETED',
        link: '/student/study',
      });

      events.push({
        id: 'event_gtu_end_sem_summer',
        title: `GTU Summer ${year} Final Theory Examination`,
        category: 'EXAM',
        subjectName: 'GTU Central University Exam',
        date: endSemDate.toISOString().split('T')[0],
        daysRemaining: Math.ceil((endSemDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        status: endSemDate > now ? 'UPCOMING' : 'COMPLETED',
        link: '/student/pyq',
      });
    } else {
      // Winter Exam Schedule
      const midSemDate = new Date(year, 8, 25); // September 25
      const vivaDate = new Date(year, 10, 5); // November 5
      const endSemDate = new Date(year, 10, 28); // November 28

      events.push({
        id: 'event_gtu_mid_sem',
        title: `College Mid-Semester Examination — Semester ${semester}`,
        category: 'EXAM',
        subjectName: `${branchName} Department`,
        date: midSemDate.toISOString().split('T')[0],
        daysRemaining: Math.ceil((midSemDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        status: midSemDate > now ? 'UPCOMING' : 'COMPLETED',
        link: '/student/practice',
      });

      events.push({
        id: 'event_gtu_practical_viva',
        title: `GTU Practical & Viva Examination — Semester ${semester}`,
        category: 'VIVA',
        subjectName: 'Laboratory Evaluation',
        date: vivaDate.toISOString().split('T')[0],
        daysRemaining: Math.ceil((vivaDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        status: vivaDate > now ? 'UPCOMING' : 'COMPLETED',
        link: '/student/study',
      });

      events.push({
        id: 'event_gtu_end_sem_winter',
        title: `GTU Winter ${year} Final Theory Examination`,
        category: 'EXAM',
        subjectName: 'GTU Central University Exam',
        date: endSemDate.toISOString().split('T')[0],
        daysRemaining: Math.ceil((endSemDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        status: endSemDate > now ? 'UPCOMING' : 'COMPLETED',
        link: '/student/pyq',
      });
    }

    // Sort chronologically by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return jsonResponse({
      success: true,
      timeline: events,
      total: events.length,
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/student/timeline:", error);
    const message = error instanceof Error ? error.message : "Failed to load academic timeline";
    return errorResponse(message, 500);
  }
}
