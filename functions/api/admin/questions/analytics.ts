// GET /api/admin/questions/analytics
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';

export async function onRequestGet(context: { request: Request; env: WorkerBindings }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const totalVerified = (await context.env.DB.prepare(
      `SELECT COUNT(*) as c FROM master_question_bank WHERE verification_status = 'verified'`
    ).first<{ c: number }>())?.c || 0;

    const pyqStats = await context.env.DB.prepare(
      `SELECT
        SUM(CASE WHEN source_type = 'GTU' THEN 1 ELSE 0 END) as gtu_cnt,
        SUM(CASE WHEN source_type = 'GATE' THEN 1 ELSE 0 END) as gate_cnt,
        SUM(CASE WHEN is_ai_generated = 1 THEN 1 ELSE 0 END) as ai_cnt
       FROM master_question_bank WHERE verification_status = 'verified'`
    ).first<{ gtu_cnt: number; gate_cnt: number; ai_cnt: number }>();

    const openReports = (await context.env.DB.prepare(
      `SELECT COUNT(*) as c FROM question_issue_reports WHERE status IN ('OPEN', 'INVESTIGATING')`
    ).first<{ c: number }>())?.c || 0;

    const quarantinedCount = (await context.env.DB.prepare(
      `SELECT COUNT(*) as c FROM question_quality_metrics WHERE lifecycle_status = 'QUARANTINED'`
    ).first<{ c: number }>())?.c || 0;

    const retiredCount = (await context.env.DB.prepare(
      `SELECT COUNT(*) as c FROM question_quality_metrics WHERE lifecycle_status = 'RETIRED'`
    ).first<{ c: number }>())?.c || 0;

    return jsonResponse({
      success: true,
      analytics: {
        totalVerified,
        gtuPyqCount: pyqStats?.gtu_cnt || 0,
        gatePyqCount: pyqStats?.gate_cnt || 0,
        aiGeneratedCount: pyqStats?.ai_cnt || 0,
        openReportsCount: openReports,
        quarantinedCount,
        retiredCount,
      },
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch question analytics', 500);
  }
}
