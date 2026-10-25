// ============================================================
// LIGHTWEIGHT HEALTH-CHECK API: GET /api/health/keydocs
// Safe, operational health check for KeyDocs 3.0 subsystem
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";

export async function onRequestGet(context: {
  env: { DB: D1Database };
}) {
  const { env } = context;

  try {
    // 1. Database Ping Check
    const dbPing = await env.DB.prepare(`SELECT 1 as ping`).first<any>();
    const isDbOk = dbPing?.ping === 1;

    if (!isDbOk) {
      return errorResponse("KeyDocs Health Check: Database Unreachable", 503);
    }

    // 2. Documents Query Check
    const docCheck = await env.DB.prepare(`SELECT COUNT(1) as cnt FROM documents`).first<any>();
    const isDocsOk = docCheck !== null && docCheck !== undefined;

    // 3. Curriculum Query Check
    const currCheck = await env.DB.prepare(`SELECT COUNT(1) as cnt FROM curriculum_nodes`).first<any>();
    const isCurrOk = currCheck !== null && currCheck !== undefined;

    // 4. Files Metadata Check
    const fileCheck = await env.DB.prepare(`SELECT COUNT(1) as cnt FROM document_files`).first<any>();
    const isFilesOk = fileCheck !== null && fileCheck !== undefined;

    // 5. Relations Query Check
    const relCheck = await env.DB.prepare(`SELECT COUNT(1) as cnt FROM document_relations`).first<any>();
    const isRelOk = relCheck !== null && relCheck !== undefined;

    const allOk = isDbOk && isDocsOk && isCurrOk && isFilesOk && isRelOk;

    return jsonResponse({
      status: allOk ? "ok" : "degraded",
      database: isDbOk ? "ok" : "error",
      documents: isDocsOk ? "ok" : "error",
      curriculum: isCurrOk ? "ok" : "error",
      files: isFilesOk ? "ok" : "error",
      relations: isRelOk ? "ok" : "error",
    }, allOk ? 200 : 503);

  } catch (error: any) {
    return jsonResponse({
      status: "error",
      database: "error",
      documents: "error",
      curriculum: "error",
      files: "error",
      relations: "error",
    }, 500);
  }
}
