// ============================================================
// SHIKSHA SAHAYAK OS API: /api/storage/upload
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { registerDigitalAsset } from "../../lib/storageDam";
import { Env } from "../../lib/contentEngine";
import { AssetUploadRequest } from "../../../src/types/storage-dam";

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const payload = await request.json<AssetUploadRequest>();

    if (!payload.filename || !payload.category || !payload.entityId || !payload.sizeBytes) {
      return errorResponse("Missing required fields: filename, category, entityId, sizeBytes", 400);
    }

    const response = await registerDigitalAsset(env, payload);
    return jsonResponse(response, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
