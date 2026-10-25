// ============================================================
// ADMIN API: GET, PUT, DELETE /api/admin/documents/[id]
// Single KeyDocs document management endpoint
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../../lib/auth";
import { recordAdminAuditLog } from "../../../lib/adminPlatformService";
import { getDocumentById, updateDocument, deleteDocument, validateDocumentStatus } from "../../../lib/keydocs";

export async function onRequestGet(context: {
  params: { id: string };
  request: Request;
  env: { DB: D1Database };
}) {
  const { params, request, env } = context;

  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin authorization required", 403);
  }

  try {
    const document = await getDocumentById(env.DB, params.id);
    if (!document) {
      return errorResponse("Document not found", 404);
    }
    return jsonResponse({ success: true, data: document });
  } catch (err: any) {
    return errorResponse(`Failed to fetch document: ${err.message}`, 500);
  }
}

export async function onRequestPut(context: {
  params: { id: string };
  request: Request;
  env: { DB: D1Database };
}) {
  const { params, request, env } = context;

  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin authorization required", 403);
  }

  try {
    const body = await request.json<any>();
    const status = body.status ? validateDocumentStatus(body.status) : undefined;

    const updated = await updateDocument(env.DB, params.id, {
      title: body.title,
      description: body.description,
      status,
      curriculum_node_id: body.curriculum_node_id,
      updated_by: user.email,

      pyq_metadata: body.pyq_metadata || (body.paper_year || body.season || body.exam_label ? {
        exam_year: body.paper_year ? parseInt(body.paper_year, 10) : undefined,
        season: body.season,
        exam_label: body.exam_label,
      } : undefined),

      syllabus_metadata: body.syllabus_metadata || (body.syllabus_year || body.regulation || body.version_label ? {
        effective_year: body.syllabus_year ? parseInt(body.syllabus_year, 10) : undefined,
        regulation: body.regulation,
        version_label: body.version_label,
      } : undefined),

      material_metadata: body.material_metadata || (body.material_kind || body.author || body.publisher ? {
        material_kind: body.material_kind,
        author: body.author,
        publisher: body.publisher,
      } : undefined),
    });

    await recordAdminAuditLog(env, user.uid, "DOCUMENT_UPDATED", "document", params.id, {
      message: `Updated document '${updated.title}' (${updated.id})`,
    });

    return jsonResponse({ success: true, data: updated });
  } catch (err: any) {
    return errorResponse(`Failed to update document: ${err.message}`, 400);
  }
}

export async function onRequestDelete(context: {
  params: { id: string };
  request: Request;
  env: { DB: D1Database };
}) {
  const { params, request, env } = context;

  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin authorization required", 403);
  }

  try {
    const document = await getDocumentById(env.DB, params.id);
    if (!document) {
      return errorResponse("Document not found", 404);
    }

    await deleteDocument(env.DB, params.id);

    await recordAdminAuditLog(env, user.uid, "DOCUMENT_DELETED", "document", params.id, {
      message: `Deleted document '${document.title}' (${document.id})`,
    });

    return jsonResponse({ success: true, message: "Document deleted successfully" });
  } catch (err: any) {
    return errorResponse(`Failed to delete document: ${err.message}`, 500);
  }
}
