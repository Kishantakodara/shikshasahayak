// ============================================================
// SHIKSHA SAHAYAK OS MIGRATION SCRIPT: KeyDocs 3.0 Backfill & Verification
// Backfills data into curriculum_nodes, metadata tables, assets,
// document_relations, and document_stats idempotently.
// ============================================================

export async function runKeyDocs3Migration(db: any) {
  console.log("🚀 Starting KeyDocs 3.0 Data Migration...");

  // 1. Backfill curriculum_nodes from subject_units
  console.log("📦 Migrating subject_units to curriculum_nodes (units)...");
  await db.prepare(`
    INSERT INTO curriculum_nodes (id, subject_id, parent_id, node_type, node_number, title, description, sort_order, created_at, updated_at)
    SELECT 
      su.id,
      su.subject_id,
      NULL as parent_id,
      'unit' as node_type,
      su.unit_no as node_number,
      su.title,
      su.description,
      su.unit_no as sort_order,
      su.created_at,
      su.updated_at
    FROM subject_units su
    WHERE NOT EXISTS (SELECT 1 FROM curriculum_nodes cn WHERE cn.id = su.id)
  `).run();

  // 2. Backfill curriculum_nodes from subject_topics
  console.log("📦 Migrating subject_topics to curriculum_nodes (topics)...");
  await db.prepare(`
    INSERT INTO curriculum_nodes (id, subject_id, parent_id, node_type, node_number, title, description, sort_order, created_at, updated_at)
    SELECT 
      st.id,
      su.subject_id,
      st.unit_id as parent_id,
      'topic' as node_type,
      st.topic_no as node_number,
      st.title,
      st.description,
      CAST(st.topic_no AS INTEGER) as sort_order,
      st.created_at,
      st.updated_at
    FROM subject_topics st
    JOIN subject_units su ON su.id = st.unit_id
    WHERE NOT EXISTS (SELECT 1 FROM curriculum_nodes cn WHERE cn.id = st.id)
  `).run();

  // 3. Backfill pyq_metadata
  console.log("📄 Backfilling pyq_metadata...");
  await db.prepare(`
    INSERT INTO pyq_metadata (document_id, exam_year, season, exam_label)
    SELECT id, paper_year, season, exam_label
    FROM documents
    WHERE document_type = 'pyq' AND (paper_year IS NOT NULL OR season IS NOT NULL OR exam_label IS NOT NULL)
    ON CONFLICT(document_id) DO UPDATE SET
      exam_year = excluded.exam_year,
      season = excluded.season,
      exam_label = excluded.exam_label
  `).run();

  // 4. Backfill syllabus_metadata
  console.log("📄 Backfilling syllabus_metadata...");
  await db.prepare(`
    INSERT INTO syllabus_metadata (document_id, effective_year, regulation, version_label)
    SELECT id, syllabus_year, regulation, version_label
    FROM documents
    WHERE document_type = 'syllabus' AND (syllabus_year IS NOT NULL OR regulation IS NOT NULL OR version_label IS NOT NULL)
    ON CONFLICT(document_id) DO UPDATE SET
      effective_year = excluded.effective_year,
      regulation = excluded.regulation,
      version_label = excluded.version_label
  `).run();

  // 5. Backfill material_metadata
  console.log("📄 Backfilling material_metadata...");
  await db.prepare(`
    INSERT INTO material_metadata (document_id, material_kind, author, publisher)
    SELECT id, COALESCE(material_kind, 'notes'), author, NULL as publisher
    FROM documents
    WHERE document_type = 'study-material'
    ON CONFLICT(document_id) DO UPDATE SET
      material_kind = excluded.material_kind,
      author = excluded.author
  `).run();

  // 6. Backfill document_stats
  console.log("📊 Backfilling document_stats...");
  await db.prepare(`
    INSERT INTO document_stats (document_id, views, likes, downloads, updated_at)
    SELECT id, COALESCE(views, 0), COALESCE(likes, 0), COALESCE(downloads, 0), updated_at
    FROM documents
    ON CONFLICT(document_id) DO UPDATE SET
      views = excluded.views,
      likes = excluded.likes,
      downloads = excluded.downloads
  `).run();

  // 7. Backfill document_relations from parent_document_id
  console.log("🔗 Backfilling document_relations...");
  await db.prepare(`
    INSERT INTO document_relations (id, source_document_id, target_document_id, relation_type, created_at)
    SELECT 
      'rel_' || id as id,
      parent_document_id as source_document_id,
      id as target_document_id,
      'solution' as relation_type,
      created_at
    FROM documents
    WHERE parent_document_id IS NOT NULL AND parent_document_id != ''
    ON CONFLICT(source_document_id, target_document_id, relation_type) DO NOTHING
  `).run();

  // 8. Backfill assets from file_assets
  console.log("💾 Backfilling assets from file_assets...");
  await db.prepare(`
    INSERT INTO assets (id, content_hash, storage_key, original_filename, mime_type, size_bytes, created_at)
    SELECT id, content_hash, storage_key, original_filename, mime_type, size_bytes, created_at
    FROM file_assets
    ON CONFLICT(content_hash) DO NOTHING
  `).run();

  // 9. Associate documents with curriculum_nodes where unit_no matches
  console.log("🎯 Linking documents to curriculum_nodes...");
  await db.prepare(`
    UPDATE documents
    SET curriculum_node_id = (
      SELECT cn.id 
      FROM curriculum_nodes cn 
      WHERE cn.subject_id = documents.subject_id 
        AND cn.node_type = 'unit' 
        AND CAST(cn.node_number AS INTEGER) = CAST(documents.unit_no AS INTEGER)
      LIMIT 1
    )
    WHERE curriculum_node_id IS NULL AND unit_no IS NOT NULL
  `).run();

  console.log("✅ KeyDocs 3.0 Migration & Backfill Completed Successfully!");
}
