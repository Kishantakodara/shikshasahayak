// ============================================================
// SHIKSHA SAHAYAK OS API: /api/governance/item/:id
// ============================================================

import { jsonResponse, errorResponse } from "../../../lib/json";
import { getContentGovernance, transitionLifecycleState } from "../../../lib/contentGovernance";
import { Env } from "../../../lib/contentEngine";
import { LifecycleState } from "../../../../src/types/content-governance";

export async function onRequestGet(context: { request: Request; params: { id: string }; env: Env }) {
  const { params, env } = context;
  const documentId = params.id;

  if (!documentId) {
    return errorResponse("Missing document ID parameter", 400);
  }

  try {
    const gov = await getContentGovernance(env, documentId);
    if (!gov) {
      return errorResponse("Governance metadata not found", 404);
    }
    return jsonResponse(gov, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}

export async function onRequestPut(context: { request: Request; params: { id: string }; env: Env }) {
  const { request, params, env } = context;
  const documentId = params.id;

  if (!documentId) {
    return errorResponse("Missing document ID parameter", 400);
  }

  try {
    const body: { newState: LifecycleState; performedBy: string; details?: Record<string, unknown> } =
      await request.json();

    if (!body.newState || !body.performedBy) {
      return errorResponse("Missing required fields: newState, performedBy", 400);
    }

    const success = await transitionLifecycleState(env, documentId, body.newState, body.performedBy, body.details);

    if (!success) {
      return errorResponse("Failed to transition lifecycle state", 500);
    }

    const updatedGov = await getContentGovernance(env, documentId);
    return jsonResponse(updatedGov);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
