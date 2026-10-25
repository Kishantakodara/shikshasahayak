// ============================================================
// ADMIN API: POST /api/admin/question-intelligence/extract-url
// Website-to-Question Extraction Pipeline with SSRF protection
// ============================================================

import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { executeWebsiteExtraction, WebsiteExtractionResult } from '../../../lib/questionIntelligence/websiteExtractionService';

export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const body = (await context.request.json().catch(() => ({}))) as {
      url?: string;
      urls?: string[];
      examName?: string;
      paperCode?: string;
      subjectName?: string;
      topicName?: string;
      year?: number;
      sourceCategory?: string;
    };

    const targetUrls = body.urls && Array.isArray(body.urls) && body.urls.length > 0
      ? body.urls
      : body.url ? [body.url] : [];

    if (targetUrls.length === 0) {
      return errorResponse('Missing target URL(s) in payload', 400);
    }

    // Limit batch URL processing
    const limitedUrls = targetUrls.slice(0, 10);
    const results: WebsiteExtractionResult[] = [];

    for (const u of limitedUrls) {
      const res = await executeWebsiteExtraction(context.env, u.trim(), {
        examName: body.examName || 'GATE 2027',
        paperCode: body.paperCode || 'CS',
        subjectName: body.subjectName,
        topicName: body.topicName,
        year: body.year || 2024,
        sourceCategory: body.sourceCategory || 'PERMITTED_WEB_SOURCE',
      });
      results.push(res);
    }

    const totalExtracted = results.reduce((acc, r) => acc + (r.questions?.length || 0), 0);
    const totalDuplicates = results.reduce((acc, r) => acc + r.duplicateCount, 0);
    const totalRejected = results.reduce((acc, r) => acc + r.rejectedCount, 0);

    return jsonResponse({
      success: true,
      results,
      summary: {
        totalUrlsSubmitted: limitedUrls.length,
        totalExtracted,
        totalDuplicates,
        totalRejected,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/question-intelligence/extract-url:', err);
    return errorResponse(err.message || 'Internal Server Error during website extraction', 500);
  }
}
