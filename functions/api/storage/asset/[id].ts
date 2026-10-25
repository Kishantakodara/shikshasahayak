// ============================================================
// SHIKSHA SAHAYAK OS API: /api/storage/asset/:id
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { generateSignedDownloadUrl, logAssetAuditEvent } from "../../../lib/storageDam";
import { Env } from "../../../lib/contentEngine";
import { getAuthenticatedUser, isAdmin } from "../../../lib/auth";

export async function onRequestGet(context: { request: Request; params: { id: string }; env: Env }) {
  const { params, env } = context;
  const assetId = params.id;

  if (!assetId) {
    return errorResponse("Missing asset ID parameter", 400);
  }

  try {
    const link = await generateSignedDownloadUrl(env, assetId);
    if (!link) {
      return errorResponse("Digital asset not found", 404);
    }
    return jsonResponse(link, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}

export async function onRequestDelete(context: { request: Request; params: { id: string }; env: Env }) {
  const { request, params, env } = context;
  const assetId = params.id;

  if (!assetId) {
    return errorResponse("Missing asset ID parameter", 400);
  }

  try {
    const user = await getAuthenticatedUser(request, env as any);
    if (!user || (!isAdmin(user.email, user.role) && user.role !== "teacher")) {
      return errorResponse("Forbidden: Admin or teacher authorization required", 403);
    }
    const performedBy = user.uid;

    await logAssetAuditEvent(env, assetId, "delete", performedBy, { softDeleted: true });

    return jsonResponse({
      success: true,
      assetId,
      message: "Digital asset soft-deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
