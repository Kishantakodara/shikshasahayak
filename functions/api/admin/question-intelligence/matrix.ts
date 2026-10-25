// ============================================================
// GET /api/admin/question-intelligence/matrix
// Subject × Session Heatmap Matrix for 10 First-Year GTU Subjects
// ============================================================

import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';

const FIRST_YEAR_SUBJECTS = [
  { code: '3110014', name: 'Mathematics - 1', semester: 1 },
  { code: '3110015', name: 'Mathematics - 2', semester: 2 },
  { code: '3110005', name: 'Basic Electrical Engineering', semester: 1 },
  { code: '3110003', name: 'Programming for Problem Solving', semester: 1 },
  { code: '3110002', name: 'English', semester: 1 },
  { code: '3110018', name: 'Physics', semester: 1 },
  { code: '3110001', name: 'Chemistry', semester: 1 },
  { code: '3110006', name: 'Basic Mechanical Engineering', semester: 1 },
  { code: '3110004', name: 'Elements of Civil Engineering', semester: 1 },
  { code: '3110013', name: 'Engineering Graphics & Design', semester: 1 },
];

const GTU_SESSIONS = [
  { code: 'W2022', session: 'WINTER', year: 2022, label: 'Winter 2022' },
  { code: 'S2023', session: 'SUMMER', year: 2023, label: 'Summer 2023' },
  { code: 'W2023', session: 'WINTER', year: 2023, label: 'Winter 2023' },
  { code: 'S2024', session: 'SUMMER', year: 2024, label: 'Summer 2024' },
  { code: 'W2024', session: 'WINTER', year: 2024, label: 'Winter 2024' },
];

export async function onRequestGet(context: { request: Request; env: WorkerBindings }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "reviewer") {
      return errorResponse('Forbidden: Admin or Reviewer access required', 403);
    }

    // Query question counts by subject and session/year
    const rows = await context.env.DB.prepare(
      `SELECT 
        subject_code, exam_session, exam_year,
        COUNT(*) as total_questions,
        SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) as verified_count,
        SUM(CASE WHEN verification_status = 'unverified' THEN 1 ELSE 0 END) as staged_count,
        SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
       FROM master_question_bank
       GROUP BY subject_code, exam_session, exam_year`
    ).all<{
      subject_code: string;
      exam_session?: string;
      exam_year?: number;
      total_questions: number;
      verified_count: number;
      staged_count: number;
      rejected_count: number;
    }>();

    const lookup = new Map<string, {
      total: number;
      verified: number;
      staged: number;
      rejected: number;
    }>();

    for (const r of rows.results || []) {
      const sess = r.exam_session || '';
      const yr = r.exam_year || 0;
      const key = `${r.subject_code}_${sess}_${yr}`;
      lookup.set(key, {
        total: Number(r.total_questions || 0),
        verified: Number(r.verified_count || 0),
        staged: Number(r.staged_count || 0),
        rejected: Number(r.rejected_count || 0),
      });
    }

    const matrix = FIRST_YEAR_SUBJECTS.map(subj => {
      const sessionCells = GTU_SESSIONS.map(sess => {
        const stats = lookup.get(`${subj.code}_${sess.session}_${sess.year}`) || {
          total: 0,
          verified: 0,
          staged: 0,
          rejected: 0,
        };

        let status: 'VERIFIED' | 'STAGED' | 'PARTIAL' | 'FAILED' | 'NOT_DISCOVERED' = 'NOT_DISCOVERED';

        if (stats.verified >= 5) {
          status = 'VERIFIED';
        } else if (stats.verified > 0 || (stats.staged > 0 && stats.verified > 0)) {
          status = 'PARTIAL';
        } else if (stats.staged > 0) {
          status = 'STAGED';
        } else if (stats.rejected > 0) {
          status = 'FAILED';
        }

        return {
          sessionCode: sess.code,
          sessionName: sess.label,
          session: sess.session,
          year: sess.year,
          status,
          totalQuestions: stats.total,
          verifiedQuestions: stats.verified,
          stagedQuestions: stats.staged,
          rejectedQuestions: stats.rejected,
        };
      });

      const totalVerified = sessionCells.reduce((acc, c) => acc + c.verifiedQuestions, 0);
      const totalStaged = sessionCells.reduce((acc, c) => acc + c.stagedQuestions, 0);

      return {
        subjectCode: subj.code,
        subjectName: subj.name,
        semester: subj.semester,
        totalVerified,
        totalStaged,
        sessions: sessionCells,
      };
    });

    return jsonResponse({
      success: true,
      subjects: FIRST_YEAR_SUBJECTS,
      sessions: GTU_SESSIONS,
      matrix,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to generate subject session matrix', 500);
  }
}
