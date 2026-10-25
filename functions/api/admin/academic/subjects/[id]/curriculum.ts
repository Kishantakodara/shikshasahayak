// ============================================================
// ADMIN API: GET, POST, PUT, DELETE /api/admin/academic/subjects/[id]/curriculum
// Curriculum tree management endpoint (Units, Topics, Subtopics)
// ============================================================

import { jsonResponse, errorResponse } from "../../../../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../../../../lib/auth";
import { recordAdminAuditLog } from "../../../../../lib/adminPlatformService";
import { 
  getCurriculumTree,
  createCurriculumNode,
  updateCurriculumNode,
  deleteCurriculumNode,
  validateCurriculumNodeType
} from "../../../../../lib/keydocs";

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
    const tree = await getCurriculumTree(env.DB, params.id);
    return jsonResponse({ success: true, data: tree });
  } catch (err: any) {
    return errorResponse(`Failed to fetch curriculum tree: ${err.message}`, 500);
  }
}

export async function onRequestPost(context: {
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

    if (!body.title || body.node_number === undefined || !body.node_type) {
      return errorResponse("Missing required fields: title, node_number, node_type", 400);
    }

    const nodeType = validateCurriculumNodeType(body.node_type);

    const node = await createCurriculumNode(env.DB, {
      subject_id: params.id,
      parent_id: body.parent_id || null,
      node_type: nodeType,
      node_number: parseFloat(body.node_number),
      title: body.title,
      description: body.description,
      sort_order: body.sort_order ? parseInt(body.sort_order, 10) : undefined,
    });

    await recordAdminAuditLog(env, user.uid, "CURRICULUM_CREATED", "curriculum_node", node.id, {
      message: `Created ${nodeType} '${node.title}' in subject ${params.id}`,
    });

    return jsonResponse({ success: true, data: node }, 201);
  } catch (err: any) {
    return errorResponse(`Failed to create curriculum node: ${err.message}`, 400);
  }
}

export async function onRequestPut(context: {
  params: { id: string };
  request: Request;
  env: { DB: D1Database };
}) {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin authorization required", 403);
  }

  try {
    const body = await request.json<any>();
    if (!body.node_id) {
      return errorResponse("Missing node_id parameter", 400);
    }

    const updated = await updateCurriculumNode(env.DB, body.node_id, {
      title: body.title,
      description: body.description,
      node_number: body.node_number !== undefined ? parseFloat(body.node_number) : undefined,
      sort_order: body.sort_order !== undefined ? parseInt(body.sort_order, 10) : undefined,
      is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : undefined,
      parent_id: body.parent_id,
    });

    await recordAdminAuditLog(env, user.uid, "CURRICULUM_UPDATED", "curriculum_node", body.node_id, {
      message: `Updated curriculum node '${updated.title}'`,
    });

    return jsonResponse({ success: true, data: updated });
  } catch (err: any) {
    return errorResponse(`Failed to update curriculum node: ${err.message}`, 400);
  }
}

export async function onRequestDelete(context: {
  params: { id: string };
  request: Request;
  env: { DB: D1Database };
}) {
  const { request, env } = context;
  const url = new URL(request.url);

  const user = await getAuthenticatedUser(request, env as any);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin authorization required", 403);
  }

  try {
    const nodeId = url.searchParams.get("node_id");
    if (!nodeId) {
      return errorResponse("Missing node_id query parameter", 400);
    }

    await deleteCurriculumNode(env.DB, nodeId);

    await recordAdminAuditLog(env, user.uid, "CURRICULUM_DELETED", "curriculum_node", nodeId, {
      message: `Deleted curriculum node ${nodeId}`,
    });

    return jsonResponse({ success: true, message: "Curriculum node deleted successfully" });
  } catch (err: any) {
    return errorResponse(`Failed to delete curriculum node: ${err.message}`, 500);
  }
}
