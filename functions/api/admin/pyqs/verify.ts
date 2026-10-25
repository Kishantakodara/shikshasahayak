// ============================================================
// ADMIN API: POST /api/admin/pyqs/verify
// ============================================================
// Progressive, safe batch verification of GTU PDF URLs.
// Uses lightweight HEAD / Range HTTP checks.
// NEVER stores or downloads full PDF binaries.
// Transient network failures remain UNVERIFIED for retry.

import { jsonResponse, errorResponse } from "../../../lib/json";
import { verifyGtuPdfUrlLight } from "../../../lib/gtuPyqDiscoveryEngine";
import { requireAdmin } from "../../../lib/auth";

export async function onRequestPost(context: {
  request: Request;
  env: { DB: D1Database };
}) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  try {
    const body = (await request.json().catch(() => ({}))) as any;
    const limit = Math.min(Math.max(Number(body.limit || 25), 1), 100);
    const filterStatus = body.status || 'unverified';
    const specificIds: string[] = Array.isArray(body.ids) ? body.ids : [];

    let sql = `
      SELECT id, source_url, verification_status 
      FROM gtu_question_papers 
      WHERE is_active = 1
    `;
    const params: any[] = [];

    if (specificIds.length > 0) {
      const placeholders = specificIds.map(() => '?').join(',');
      sql += ` AND id IN (${placeholders})`;
      params.push(...specificIds);
    } else if (filterStatus !== 'all') {
      sql += ` AND verification_status = ?`;
      params.push(filterStatus);
    }

    sql += ` ORDER BY last_verified_at ASC NULLS FIRST LIMIT ?`;
    params.push(limit);

    const { results: papers } = await env.DB.prepare(sql).bind(...params).all<any>();

    if (!papers || papers.length === 0) {
      return jsonResponse({
        success: true,
        message: "No papers in queue matching verification criteria.",
        verifiedCount: 0,
        brokenCount: 0,
        unverifiedCount: 0,
        totalChecked: 0,
      });
    }

    let verifiedCount = 0;
    let brokenCount = 0;
    let unverifiedCount = 0;

    // Process in controlled concurrent chunks of 5
    const CHUNK_SIZE = 5;
    for (let i = 0; i < papers.length; i += CHUNK_SIZE) {
      const chunk = papers.slice(i, i + CHUNK_SIZE);
      const chunkResults = await Promise.all(
        chunk.map(async (paper) => {
          const status = await verifyGtuPdfUrlLight(paper.source_url, 4000);
          return { id: paper.id, status };
        })
      );

      for (const res of chunkResults) {
        if (res.status === 'verified') verifiedCount++;
        else if (res.status === 'broken') brokenCount++;
        else unverifiedCount++;

        await env.DB.prepare(
          `UPDATE gtu_question_papers 
           SET verification_status = ?, last_verified_at = CURRENT_TIMESTAMP 
           WHERE id = ?`
        )
          .bind(res.status, res.id)
          .run()
          .catch(() => null);
      }
    }

    return jsonResponse({
      success: true,
      message: `Batch verified ${papers.length} URLs: ${verifiedCount} verified, ${brokenCount} broken (404), ${unverifiedCount} remaining for retry.`,
      verifiedCount,
      brokenCount,
      unverifiedCount,
      totalChecked: papers.length,
    });
  } catch (err: any) {
    return errorResponse(err.message || "Failed to verify URLs", 500);
  }
}
