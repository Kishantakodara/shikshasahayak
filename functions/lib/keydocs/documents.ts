// ============================================================
// SHIKSHA SAHAYAK OS KEYDOCS 3.0: DOCUMENT CRUD SERVICE
// Core CRUD management for thin documents entity and type metadata
// ============================================================

import { UnifiedDocument, DocumentType, DocumentStatus, PyqMetadata, SyllabusMetadata, MaterialMetadata } from "./types";
import { getDocumentById } from "./queries";

export async function createDocument(
  db: D1Database,
  data: {
    document_type: DocumentType;
    subject_id: string;
    curriculum_node_id?: string | null;
    title: string;
    description?: string | null;
    status?: DocumentStatus;
    created_by?: string | null;

    // Metadata payloads
    pyq_metadata?: Partial<PyqMetadata>;
    syllabus_metadata?: Partial<SyllabusMetadata>;
    material_metadata?: Partial<MaterialMetadata>;
  }
): Promise<UnifiedDocument> {
  const id = `doc_${data.document_type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const status: DocumentStatus = data.status || 'published';

  // 1. Fetch Subject context to populate legacy university/branch/semester for zero-downtime backward compatibility
  const subject = await db.prepare(`SELECT university_id, branch_id, semester FROM subjects WHERE id = ?`).bind(data.subject_id).first<any>();
  const universityId = subject ? subject.university_id : 'gtu';
  const branchId = subject ? subject.branch_id : 'branch_07';
  const semester = subject ? subject.semester : 1;

  // 2. Insert thin core document (also backfilling legacy fields)
  await db.prepare(`
    INSERT INTO documents (
      id, document_type, university_id, branch_id, semester, subject_id, curriculum_node_id,
      title, description, status, approval_status, created_by,
      paper_year, season, exam_label, syllabus_year, regulation, version_label, material_kind, author
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    data.document_type,
    universityId,
    branchId,
    semester,
    data.subject_id,
    data.curriculum_node_id || null,
    data.title,
    data.description || null,
    status,
    status === 'published' ? 'approved' : 'pending',
    data.created_by || null,

    // Legacy fallbacks
    data.pyq_metadata?.exam_year || null,
    data.pyq_metadata?.season || null,
    data.pyq_metadata?.exam_label || null,
    data.syllabus_metadata?.effective_year || null,
    data.syllabus_metadata?.regulation || null,
    data.syllabus_metadata?.version_label || null,
    data.material_metadata?.material_kind || 'notes',
    data.material_metadata?.author || null
  ).run();

  // 3. Write into Type-Specific Metadata table
  if (data.document_type === 'pyq' && data.pyq_metadata) {
    await db.prepare(`
      INSERT INTO pyq_metadata (document_id, exam_year, season, exam_label)
      VALUES (?, ?, ?, ?)
    `).bind(id, data.pyq_metadata.exam_year || null, data.pyq_metadata.season || null, data.pyq_metadata.exam_label || null).run();
  } else if (data.document_type === 'syllabus' && data.syllabus_metadata) {
    await db.prepare(`
      INSERT INTO syllabus_metadata (document_id, effective_year, regulation, version_label)
      VALUES (?, ?, ?, ?)
    `).bind(id, data.syllabus_metadata.effective_year || null, data.syllabus_metadata.regulation || null, data.syllabus_metadata.version_label || null).run();
  } else if (data.document_type === 'study-material' && data.material_metadata) {
    await db.prepare(`
      INSERT INTO material_metadata (document_id, material_kind, author, publisher)
      VALUES (?, ?, ?, ?)
    `).bind(id, data.material_metadata.material_kind || 'notes', data.material_metadata.author || null, data.material_metadata.publisher || null).run();
  }

  // 4. Initialize Stats
  await db.prepare(`
    INSERT INTO document_stats (document_id, views, likes, downloads)
    VALUES (?, 0, 0, 0)
    ON CONFLICT(document_id) DO NOTHING
  `).bind(id).run();

  const created = await getDocumentById(db, id);
  if (!created) throw new Error("Document creation failed");
  return created;
}

export async function updateDocument(
  db: D1Database,
  id: string,
  updates: {
    title?: string;
    description?: string | null;
    status?: DocumentStatus;
    curriculum_node_id?: string | null;
    updated_by?: string | null;

    pyq_metadata?: Partial<PyqMetadata>;
    syllabus_metadata?: Partial<SyllabusMetadata>;
    material_metadata?: Partial<MaterialMetadata>;
  }
): Promise<UnifiedDocument> {
  const existing = await getDocumentById(db, id);
  if (!existing) throw new Error("Document not found");

  const title = updates.title ?? existing.title;
  const description = updates.description !== undefined ? updates.description : existing.description;
  const status = updates.status ?? existing.status;
  const curriculum_node_id = updates.curriculum_node_id !== undefined ? updates.curriculum_node_id : existing.curriculum_node_id;

  // 1. Update Core
  await db.prepare(`
    UPDATE documents
    SET title = ?, description = ?, status = ?, approval_status = ?, curriculum_node_id = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(title, description, status, status === 'published' ? 'approved' : 'pending', curriculum_node_id, updates.updated_by || null, id).run();

  // 2. Update Type Metadata
  if (existing.document_type === 'pyq' && updates.pyq_metadata) {
    await db.prepare(`
      INSERT INTO pyq_metadata (document_id, exam_year, season, exam_label)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(document_id) DO UPDATE SET
        exam_year = excluded.exam_year,
        season = excluded.season,
        exam_label = excluded.exam_label
    `).bind(id, updates.pyq_metadata.exam_year ?? existing.pyq_metadata?.exam_year ?? null, updates.pyq_metadata.season ?? existing.pyq_metadata?.season ?? null, updates.pyq_metadata.exam_label ?? existing.pyq_metadata?.exam_label ?? null).run();

    await db.prepare(`UPDATE documents SET paper_year = ?, season = ?, exam_label = ? WHERE id = ?`).bind(updates.pyq_metadata.exam_year ?? null, updates.pyq_metadata.season ?? null, updates.pyq_metadata.exam_label ?? null, id).run();
  } else if (existing.document_type === 'syllabus' && updates.syllabus_metadata) {
    await db.prepare(`
      INSERT INTO syllabus_metadata (document_id, effective_year, regulation, version_label)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(document_id) DO UPDATE SET
        effective_year = excluded.effective_year,
        regulation = excluded.regulation,
        version_label = excluded.version_label
    `).bind(id, updates.syllabus_metadata.effective_year ?? existing.syllabus_metadata?.effective_year ?? null, updates.syllabus_metadata.regulation ?? existing.syllabus_metadata?.regulation ?? null, updates.syllabus_metadata.version_label ?? existing.syllabus_metadata?.version_label ?? null).run();

    await db.prepare(`UPDATE documents SET syllabus_year = ?, regulation = ?, version_label = ? WHERE id = ?`).bind(updates.syllabus_metadata.effective_year ?? null, updates.syllabus_metadata.regulation ?? null, updates.syllabus_metadata.version_label ?? null, id).run();
  } else if (existing.document_type === 'study-material' && updates.material_metadata) {
    await db.prepare(`
      INSERT INTO material_metadata (document_id, material_kind, author, publisher)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(document_id) DO UPDATE SET
        material_kind = excluded.material_kind,
        author = excluded.author,
        publisher = excluded.publisher
    `).bind(id, updates.material_metadata.material_kind ?? existing.material_metadata?.material_kind ?? 'notes', updates.material_metadata.author ?? existing.material_metadata?.author ?? null, updates.material_metadata.publisher ?? existing.material_metadata?.publisher ?? null).run();

    await db.prepare(`UPDATE documents SET material_kind = ?, author = ? WHERE id = ?`).bind(updates.material_metadata.material_kind ?? 'notes', updates.material_metadata.author ?? null, id).run();
  }

  const updated = await getDocumentById(db, id);
  if (!updated) throw new Error("Document update failed");
  return updated;
}

export async function deleteDocument(db: D1Database, id: string): Promise<boolean> {
  // Cascades metadata, stats, document_files, document_relations
  await db.prepare(`DELETE FROM documents WHERE id = ?`).bind(id).run();
  return true;
}
