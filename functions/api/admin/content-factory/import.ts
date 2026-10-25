import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../../lib/auth";
import { formatPayloadToMarkdown, ContentGenerationParams, GeneratedContentPayload } from "../../../lib/content-factory/provider";
import { validateGeneratedContent } from "../../../lib/content-factory/validator";
import { recordAdminAuditLog } from "../../../lib/adminPlatformService";

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

export interface ImportItemPayload {
  university_id?: string;
  university?: string;
  branch_id?: string;
  branch?: string;
  semester?: number;
  subject_id?: string;
  subject_name?: string;
  subject?: string;
  unit_no?: number;
  unit?: number;
  unit_title?: string;
  topic: string;
  content_type?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  raw_markdown?: string;
  // Structured payload or individual content sections
  payload?: GeneratedContentPayload;
  detailedNotes?: string;
  shortNotes?: string;
  definitions?: any[];
  examples?: any[];
  mcqs?: any[];
  shortQuestions?: any[];
  longQuestions?: any[];
  numericalProblems?: any[];
  vivaQuestions?: any[];
  quickRevision?: any;
}

export async function onRequestPost(context: {
  request: Request;
  env: {
    DB: any;
    FIREBASE_PROJECT_ID?: string;
    VITE_FIREBASE_PROJECT_ID?: string;
  };
}) {
  const { request, env } = context;

  try {
    // 1. Admin Authorization Check
    const user = await getAuthenticatedUser(request, env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role)) {
    return errorResponse("Unauthorized. Admin privileges required.", 403);
  }

    const body = await request.json() as { items?: ImportItemPayload[]; item?: ImportItemPayload } | ImportItemPayload | ImportItemPayload[];
    
    // Normalize into array of items
    let rawItems: ImportItemPayload[] = [];
    if (Array.isArray(body)) {
      rawItems = body;
    } else if (body && Array.isArray((body as any).items)) {
      rawItems = (body as any).items;
    } else if (body && (body as any).item) {
      rawItems = [(body as any).item];
    } else if (body && typeof body === 'object') {
      rawItems = [body as ImportItemPayload];
    }

    if (rawItems.length === 0) {
      return errorResponse("No import items provided in payload.", 400);
    }

    const importedIds: string[] = [];
    const validationSummaries: any[] = [];

    for (const item of rawItems) {
      const universityId = (item.university_id || item.university || 'gtu').toLowerCase();
      const branchId = item.branch_id || item.branch || 'branch_computer';
      const semester = Number(item.semester || 5);
      const subjectId = item.subject_id || (item.subject_name || item.subject || 'computer_networks').toLowerCase().replace(/\s+/g, '_');
      const subjectName = item.subject_name || item.subject || 'Computer Networks';
      const unitNo = Number(item.unit_no || item.unit || 1);
      const unitTitle = item.unit_title || '';
      const topic = (item.topic || '').trim();

      if (!topic) {
        continue;
      }

      // Assemble structured payload
      const payload: GeneratedContentPayload = item.payload || {
        topic,
        detailedNotes: item.detailedNotes,
        shortNotes: item.shortNotes,
        definitions: item.definitions,
        examples: item.examples,
        mcqs: item.mcqs,
        shortQuestions: item.shortQuestions,
        longQuestions: item.longQuestions,
        numericalProblems: item.numericalProblems,
        vivaQuestions: item.vivaQuestions,
        quickRevision: item.quickRevision
      };

      // Determine content types present
      const contentTypes: string[] = [];
      if (payload.detailedNotes) contentTypes.push('detailed_notes');
      if (payload.shortNotes) contentTypes.push('short_notes');
      if (payload.definitions && payload.definitions.length > 0) contentTypes.push('definitions');
      if (payload.examples && payload.examples.length > 0) contentTypes.push('examples');
      if (payload.mcqs && payload.mcqs.length > 0) contentTypes.push('mcqs');
      if (payload.shortQuestions && payload.shortQuestions.length > 0) contentTypes.push('short_questions');
      if (payload.longQuestions && payload.longQuestions.length > 0) contentTypes.push('long_questions');
      if (payload.numericalProblems && payload.numericalProblems.length > 0) contentTypes.push('numerical_problems');
      if (payload.vivaQuestions && payload.vivaQuestions.length > 0) contentTypes.push('viva_questions');
      if (payload.quickRevision) contentTypes.push('quick_revision');

      const genParams: ContentGenerationParams = {
        university: universityId,
        branch: branchId,
        semester,
        subject: subjectName,
        unitNo,
        unitTitle,
        topic,
        contentTypes: contentTypes.length > 0 ? contentTypes : ['detailed_notes']
      };

      // Run existing automated validator
      const validation = validateGeneratedContent(payload, genParams);

      // Generate or use supplied raw markdown
      const markdown = item.raw_markdown || formatPayloadToMarkdown(payload, genParams);

      const itemId = `cf_imp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      await env.DB.prepare(`
        INSERT INTO content_factory_items (
          id, university_id, branch_id, semester, subject_id, unit_no, unit_title,
          topic, content_type, difficulty, structured_content, raw_markdown,
          status, validation_status, validation_notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, datetime('now'), datetime('now'))
      `).bind(
        itemId,
        universityId,
        branchId,
        semester,
        subjectId,
        unitNo,
        unitTitle,
        topic,
        item.content_type || (contentTypes.length === 1 ? contentTypes[0] : 'full_bundle'),
        item.difficulty || 'medium',
        JSON.stringify(payload),
        markdown,
        validation.status,
        JSON.stringify({
          issues: validation.issues,
          warnings: validation.warnings,
          flags: validation.qualityReviewFlags
        })
      ).run();

      importedIds.push(itemId);
      validationSummaries.push({
        id: itemId,
        topic,
        status: validation.status,
        issues: validation.issues,
        flags: validation.qualityReviewFlags
      });
    }

    if (importedIds.length > 0) {
      await recordAdminAuditLog(
        env as any,
        user.email || user.uid,
        'CONTENT_IMPORT',
        'content_factory_items',
        importedIds.join(','),
        { count: importedIds.length, topics: validationSummaries.map(v => v.topic) }
      );
    }

    return jsonResponse({
      success: true,
      imported_count: importedIds.length,
      imported_ids: importedIds,
      validation_summaries: validationSummaries
    });

  } catch (error: any) {
    console.error('[ContentFactoryImport] Error importing items:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
