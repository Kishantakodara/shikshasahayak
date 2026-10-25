// ============================================================
// SHIKSHA SAHAYAK OS KEYDOCS 3.0: DOCUMENT STATS SERVICE
// Isolated document metrics management (views, likes, downloads)
// ============================================================

import { DocumentStats } from "./types";

export async function getDocumentStats(db: D1Database, documentId: string): Promise<DocumentStats> {
  const stats = await db.prepare(`SELECT * FROM document_stats WHERE document_id = ?`).bind(documentId).first<any>();
  if (!stats) {
    return {
      document_id: documentId,
      views: 0,
      likes: 0,
      downloads: 0,
      updated_at: new Date().toISOString(),
    };
  }
  return {
    document_id: stats.document_id,
    views: Number(stats.views || 0),
    likes: Number(stats.likes || 0),
    downloads: Number(stats.downloads || 0),
    updated_at: stats.updated_at,
  };
}

export async function incrementDocumentStat(
  db: D1Database,
  documentId: string,
  statType: 'views' | 'likes' | 'downloads'
): Promise<DocumentStats> {
  await db.prepare(`
    INSERT INTO document_stats (document_id, ${statType}, updated_at)
    VALUES (?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(document_id) DO UPDATE SET
      ${statType} = ${statType} + 1,
      updated_at = CURRENT_TIMESTAMP
  `).bind(documentId).run();

  // Also update core documents table for backward compatibility queries
  await db.prepare(`
    UPDATE documents SET ${statType} = COALESCE(${statType}, 0) + 1 WHERE id = ?
  `).bind(documentId).run();

  return getDocumentStats(db, documentId);
}
