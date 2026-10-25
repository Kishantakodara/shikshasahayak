// POST /api/admin/gtu/schedule (Cron trigger / Scheduled worker handler)
import { jsonResponse, errorResponse } from '../../../lib/json';
import { scanGtuAvailability, processDiscoveredPapers } from '../../../lib/questionIntelligence';
import { requireAdmin } from '../../../lib/auth';

export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  const { errorResponse: authError } = await requireAdmin(context.request, context.env);
  if (authError) {
    return authError;
  }
  try {
    // Scheduled trigger handler
    const summary = await scanGtuAvailability(context.env, { triggerMode: 'SCHEDULED' });
    const processRes = await processDiscoveredPapers(context.env, 5);

    return jsonResponse({
      success: true,
      scheduledRun: summary,
      processed: processRes,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Scheduled GTU discovery failed', 500);
  }
}
