// ============================================================
// SHIKSHA SAHAYAK OS KEYDOCS 3.0: DOCUMENT RELATIONS SERVICE
// Explicit document-to-document link management (solution, related, etc.)
// ============================================================

import { DocumentRelation, DocumentRelationType } from "./types";

export async function getDocumentRelations(db: D1Database, documentId: string): Promise<DocumentRelation[]> {
  const { results } = await db.prepare(`
    SELECT dr.id, dr.source_document_id, dr.target_document_id, dr.relation_type, dr.created_at,
           d.title as target_title, d.document_type as target_type
    FROM document_relations dr
    JOIN documents d ON d.id = dr.target_document_id
    WHERE dr.source_document_id = ? OR dr.target_document_id = ?
    ORDER BY dr.created_at DESC
  `).bind(documentId, documentId).all<any>();

  if (!results) return [];

  return results.map(r => ({
    id: r.id,
    source_document_id: r.source_document_id,
    target_document_id: r.target_document_id,
    relation_type: r.relation_type as DocumentRelationType,
    target_title: r.target_title,
    target_type: r.target_type,
    created_at: r.created_at,
  }));
}

export async function addDocumentRelation(
  db: D1Database,
  sourceDocumentId: string,
  targetDocumentId: string,
  relationType: DocumentRelationType
): Promise<DocumentRelation> {
  if (sourceDocumentId === targetDocumentId) {
    throw new Error("Cannot create self-referencing document relation");
  }

  // Prevent circular relations
  const circularCheck = await db.prepare(`
    SELECT id FROM document_relations
    WHERE source_document_id = ? AND target_document_id = ?
  `).bind(targetDocumentId, sourceDocumentId).first<any>();

  if (circularCheck) {
    throw new Error("Circular relationship detected between documents");
  }

  const id = `rel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  await db.prepare(`
    INSERT INTO document_relations (id, source_document_id, target_document_id, relation_type)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(source_document_id, target_document_id, relation_type) DO NOTHING
  `).bind(id, sourceDocumentId, targetDocumentId, relationType).run();

  // If relation is 'solution', set parent_document_id for backward compatibility
  if (relationType === 'solution') {
    await db.prepare(`
      UPDATE documents SET parent_document_id = ? WHERE id = ?
    `).bind(sourceDocumentId, targetDocumentId).run();
  }

  const created = await db.prepare(`
    SELECT dr.id, dr.source_document_id, dr.target_document_id, dr.relation_type, dr.created_at,
           d.title as target_title, d.document_type as target_type
    FROM document_relations dr
    JOIN documents d ON d.id = dr.target_document_id
    WHERE dr.id = ?
  `).bind(id).first<any>();

  return created as DocumentRelation;
}

export async function removeDocumentRelation(db: D1Database, relationId: string): Promise<boolean> {
  await db.prepare(`DELETE FROM document_relations WHERE id = ?`).bind(relationId).run();
  return true;
}
