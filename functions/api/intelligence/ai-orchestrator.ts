// ============================================================
// SHIKSHA SAHAYAK OS API: /api/intelligence/ai-orchestrator
// Provider-agnostic AI Orchestration endpoint
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { runOrchestratedAICompletion } from "../../lib/aiOrchestrator";
import { Env } from "../../lib/contentEngine";

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body = (await request.json()) as {
      taskName: string;
      prompt: string;
      preferredModel?: string;
    };

    if (!body || !body.prompt || !body.taskName) {
      return errorResponse("Missing taskName or prompt", 400);
    }

    const completion = await runOrchestratedAICompletion(env, {
      taskName: body.taskName,
      prompt: body.prompt,
      preferredModel: body.preferredModel,
    });

    return jsonResponse({ success: true, completion });
  } catch (error) {
    return errorResponse("Internal Server Error", 500);
  }
}
