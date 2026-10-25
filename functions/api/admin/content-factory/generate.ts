import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../../lib/auth";
import { GeminiContentProvider, formatPayloadToMarkdown, ContentGenerationParams } from "../../../lib/content-factory/provider";
import { validateGeneratedContent } from "../../../lib/content-factory/validator";

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function onRequestPost(context: {
  request: Request;
  env: {
    DB: any;
    GEMINI_API_KEY?: string;
    VITE_GEMINI_API_KEY?: string;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { request, env } = context;

  try {
    // 1. Admin Authorization check
    const user = await getAuthenticatedUser(request, env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role)) {
    return errorResponse("Unauthorized. Admin privileges required.", 403);
  }

    const geminiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
    if (!geminiKey) {
      return errorResponse("GEMINI_API_KEY is not configured on the server. For bulk content creation using your Google AI Pro workflow, please use the 'Import Structured Content' tab in the Content Factory.", 400);
    }

    const body = await request.json() as {
      university_id: string;
      branch_id: string;
      semester: number;
      subject_id: string;
      subject_name: string;
      unit_no: number;
      unit_title?: string;
      topics: string[];
      content_types: string[];
      config?: {
        mcqCount?: number;
        shortQuestionCount?: number;
        longQuestionCount?: number;
        vivaQuestionCount?: number;
        numericalCount?: number;
      };
    };

    const {
      university_id = 'gtu',
      branch_id,
      semester,
      subject_id,
      subject_name,
      unit_no,
      unit_title = '',
      topics,
      content_types,
      config
    } = body;

    if (!branch_id || !semester || !subject_id || !topics || topics.length === 0 || !content_types || content_types.length === 0) {
      return errorResponse("Missing required fields: branch_id, semester, subject_id, topics, content_types", 400);
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const totalTopics = topics.length;

    // 2. Insert Batch Job
    await env.DB.prepare(`
      INSERT INTO content_factory_jobs (
        id, university_id, branch_id, semester, subject_id, unit_no, topics, content_types,
        status, total_topics, completed_topics, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'processing', ?, 0, ?, datetime('now'), datetime('now'))
    `).bind(
      jobId,
      university_id,
      branch_id,
      Number(semester),
      subject_id,
      Number(unit_no),
      JSON.stringify(topics),
      JSON.stringify(content_types),
      totalTopics,
      user.email || user.uid
    ).run();

    const provider = new GeminiContentProvider();
    const generatedItemIds: string[] = [];
    let completedCount = 0;
    let jobError: string | null = null;

    // 3. Process each topic in batch
    for (const topic of topics) {
      const genParams: ContentGenerationParams = {
        university: university_id,
        branch: branch_id,
        semester: Number(semester),
        subject: subject_name || subject_id,
        unitNo: Number(unit_no),
        unitTitle: unit_title,
        topic: topic.trim(),
        contentTypes: content_types,
        config
      };

      try {
        const payload = await provider.generate(genParams, geminiKey);
        const validation = validateGeneratedContent(payload, genParams);
        const markdown = formatPayloadToMarkdown(payload, genParams);

        const itemId = `cf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        await env.DB.prepare(`
          INSERT INTO content_factory_items (
            id, job_id, university_id, branch_id, semester, subject_id, unit_no, unit_title,
            topic, content_type, difficulty, structured_content, raw_markdown,
            status, validation_status, validation_notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, datetime('now'), datetime('now'))
        `).bind(
          itemId,
          jobId,
          university_id,
          branch_id,
          Number(semester),
          subject_id,
          Number(unit_no),
          unit_title,
          topic.trim(),
          content_types.length === 1 ? content_types[0] : 'full_bundle',
          'medium',
          JSON.stringify(payload),
          markdown,
          validation.status,
          JSON.stringify({
            issues: validation.issues,
            warnings: validation.warnings,
            flags: validation.qualityReviewFlags
          })
        ).run();

        generatedItemIds.push(itemId);
        completedCount++;

        // Update Job Progress
        await env.DB.prepare(`
          UPDATE content_factory_jobs 
          SET completed_topics = ?, updated_at = datetime('now')
          WHERE id = ?
        `).bind(completedCount, jobId).run();

      } catch (err: any) {
        console.error(`[ContentFactory] Error generating topic "${topic}":`, err);
        jobError = err.message || 'Error generating topic';
      }
    }

    // 4. Mark Job Finished
    const finalStatus = completedCount === totalTopics ? 'completed' : (completedCount > 0 ? 'completed' : 'failed');
    await env.DB.prepare(`
      UPDATE content_factory_jobs
      SET status = ?, error_message = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(finalStatus, jobError, jobId).run();

    return jsonResponse({
      success: true,
      job_id: jobId,
      total_topics: totalTopics,
      completed_topics: completedCount,
      generated_item_ids: generatedItemIds,
      status: finalStatus
    });

  } catch (error: any) {
    console.error('[ContentFactory] Global error in onRequestPost:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
