/**
 * SHIKSHA SAHAYAK OS — PRODUCTION PARENT PORTAL API
 * Endpoint: /api/v1/national/parent
 */

import { getParentDashboard } from '../../../../functions/lib/parentPortalService';

export const onRequestGet: PagesFunction = async (context) => {
  try {
    const url = new URL(context.request.url);
    const parentId = url.searchParams.get('parentId') || 'prnt_101';
    const studentId = url.searchParams.get('studentId') || 'std_202';

    const dashboard = getParentDashboard(parentId, studentId);

    return new Response(JSON.stringify({ success: true, dashboard }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
