// ============================================================
// ADMIN API: GET & POST /api/admin/documents
// Universal KeyDocs document listing & creation endpoint
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../../lib/auth";
import { recordAdminAuditLog } from "../../../lib/adminPlatformService";
import { queryDocuments, createDocument, validateDocumentType, validateDocumentStatus } from "../../../lib/keydocs";

export async function onRequestGet(context: {
  request: Request;
  env: { DB: D1Database };
}) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Auth check
  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin authorization required", 403);
  }

  try {
    const subject_id = url.searchParams.get("subject_id") || undefined;
    const branch_id = url.searchParams.get("branch_id") || undefined;
    const semesterStr = url.searchParams.get("semester");
    const semester = semesterStr ? parseInt(semesterStr, 10) : undefined;
    const university_id = url.searchParams.get("university_id") || undefined;
    const document_type = (url.searchParams.get("document_type") as any) || undefined;
    const status = (url.searchParams.get("status") as any) || undefined;
    const curriculum_node_id = url.searchParams.get("curriculum_node_id") || undefined;
    const material_kind = (url.searchParams.get("material_kind") as any) || undefined;
    const paper_year_str = url.searchParams.get("paper_year");
    const paper_year = paper_year_str ? parseInt(paper_year_str, 10) : undefined;
    const season = (url.searchParams.get("season") as any) || undefined;
    const search = url.searchParams.get("search") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    const { documents, total } = await queryDocuments(env.DB, {
      subject_id,
      branch_id,
      semester,
      university_id,
      document_type,
      status,
      curriculum_node_id,
      material_kind,
      paper_year,
      season,
      search,
      limit,
      offset,
    });

    return jsonResponse({
      success: true,
      data: documents,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + documents.length < total,
      },
    });
  } catch (err: any) {
    return errorResponse(`Failed to query documents: ${err.message}`, 500);
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: { DB: D1Database };
}) {
  const { request, env } = context;

  // Auth check
  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin authorization required", 403);
  }

  try {
    const body = await request.json<any>();

    if (!body.title || !body.subject_id || !body.document_type) {
      return errorResponse("Missing required fields: title, subject_id, document_type", 400);
    }

    const docType = validateDocumentType(body.document_type);
    const status = body.status ? validateDocumentStatus(body.status) : 'published';

    const document = await createDocument(env.DB, {
      document_type: docType,
      subject_id: body.subject_id,
      curriculum_node_id: body.curriculum_node_id || null,
      title: body.title,
      description: body.description || null,
      status,
      created_by: user.email,

      pyq_metadata: body.pyq_metadata || (docType === 'pyq' ? {
        exam_year: body.paper_year ? parseInt(body.paper_year, 10) : undefined,
        season: body.season,
        exam_label: body.exam_label,
      } : undefined),

      syllabus_metadata: body.syllabus_metadata || (docType === 'syllabus' ? {
        effective_year: body.syllabus_year ? parseInt(body.syllabus_year, 10) : undefined,
        regulation: body.regulation,
        version_label: body.version_label,
      } : undefined),

      material_metadata: body.material_metadata || (docType === 'study-material' ? {
        material_kind: body.material_kind || 'notes',
        author: body.author,
        publisher: body.publisher,
      } : undefined),
    });

    await recordAdminAuditLog(env, user.uid, "DOCUMENT_CREATED", "document", document.id, {
      message: `Created ${docType} document '${document.title}' for subject ${document.subject_id}`,
    });

    return jsonResponse({ success: true, data: document }, 201);
  } catch (err: any) {
    return errorResponse(`Failed to create document: ${err.message}`, 400);
  }
}
