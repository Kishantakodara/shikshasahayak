// ============================================================
// SHIKSHA SAHAYAK OS API: /api/intelligence/graph
// Knowledge Graph traversal and concept graph endpoint
// ============================================================

import { jsonResponse } from "../../lib/json";
import { fetchKnowledgeGraphNeighborhood } from "../../lib/educationIntelligenceService";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const nodeId = url.searchParams.get("nodeId") || "kg_node_dsa";

  const graph = await fetchKnowledgeGraphNeighborhood(env, nodeId);
  return jsonResponse({ success: true, graph });
}
