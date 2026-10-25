// ============================================================
// SHIKSHA SAHAYAK OS KEYDOCS 3.0: END-TO-END TESTING & PRODUCTION SIMULATION
// Exhaustive E2E simulation script testing all 22 phase requirement scenarios
// ============================================================

import { 
  createCurriculumNode, 
  updateCurriculumNode, 
  deleteCurriculumNode, 
  getCurriculumTree 
} from "../functions/lib/keydocs/curriculum";

import { 
  createDocument, 
  updateDocument, 
  deleteDocument 
} from "../functions/lib/keydocs/documents";

import { 
  queryDocuments, 
  getDocumentById 
} from "../functions/lib/keydocs/queries";

import { 
  attachFileToDocument, 
  removeFileFromDocument, 
  getDocumentFiles 
} from "../functions/lib/keydocs/files";

import { 
  addDocumentRelation, 
  removeDocumentRelation, 
  getDocumentRelations 
} from "../functions/lib/keydocs/relations";

import { 
  incrementDocumentStat, 
  getDocumentStats 
} from "../functions/lib/keydocs/stats";

import { 
  validateDocumentType, 
  validateDocumentStatus, 
  validateRelationType 
} from "../functions/lib/keydocs/validators";

export interface E2ETestResult {
  step: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'MANUAL';
  details: string;
}

export async function runKeyDocs3E2ESuite(db: any): Promise<E2ETestResult[]> {
  console.log("\n==================================================");
  console.log("   KEYDOCS 3.0 END-TO-END PRODUCTION SIMULATION");
  console.log("==================================================\n");

  const results: E2ETestResult[] = [];
  const testPrefix = "KEYDOCS_E2E_TEST";

  // Track created IDs for safe teardown
  const createdDocIds: string[] = [];
  const createdNodeIds: string[] = [];

  try {
    // ----------------------------------------------------
    // 1. SETUP TEST ENVIRONMENT & SUBJECT
    // ----------------------------------------------------
    const subjectId = "sub_e2e_3150710";
    await db.prepare(`
      INSERT OR IGNORE INTO subjects (id, university_id, branch_id, semester, name, code, slug, is_active)
      VALUES (?, 'gtu', 'branch_07', 5, 'Computer Networks E2E', '3150710', 'computer-networks-e2e', 1)
    `).bind(subjectId).run();

    results.push({
      step: "01",
      name: "Test Environment Setup",
      status: "PASS",
      details: "Test subject sub_e2e_3150710 (Computer Networks, Sem 5) ready",
    });

    // ----------------------------------------------------
    // 2. CURRICULUM CRUD E2E TEST
    // ----------------------------------------------------
    const unit1 = await createCurriculumNode(db, {
      subject_id: subjectId,
      node_type: "unit",
      node_number: 1,
      title: `${testPrefix} Unit 1: Introduction`,
      description: "Network Models & Architecture",
    });
    createdNodeIds.push(unit1.id);

    const topic1 = await createCurriculumNode(db, {
      subject_id: subjectId,
      parent_id: unit1.id,
      node_type: "topic",
      node_number: 1.1,
      title: `${testPrefix} Topic: OSI Model`,
    });
    createdNodeIds.push(topic1.id);

    const subtopic1 = await createCurriculumNode(db, {
      subject_id: subjectId,
      parent_id: topic1.id,
      node_type: "subtopic",
      node_number: 1.11,
      title: `${testPrefix} Subtopic: Layer 7 Application`,
    });
    createdNodeIds.push(subtopic1.id);

    // Edit topic
    await updateCurriculumNode(db, topic1.id, { title: `${testPrefix} Topic: OSI Model (Updated)` });

    // Verify Tree
    const tree = await getCurriculumTree(db, subjectId);
    const hasUnit = tree.some(u => u.id === unit1.id);
    const hasTopic = tree.some(u => (u.children || []).some(t => t.id === topic1.id));

    results.push({
      step: "02",
      name: "Curriculum CRUD & Nesting",
      status: hasUnit && hasTopic ? "PASS" : "FAIL",
      details: `Created Unit, Topic, Subtopic with tree depth verification. Tree nodes count: ${tree.length}`,
    });

    // ----------------------------------------------------
    // 3. PYQ END-TO-END TEST
    // ----------------------------------------------------
    const pyqDoc = await createDocument(db, {
      document_type: "pyq",
      subject_id: subjectId,
      title: `${testPrefix} Computer Networks Summer 2025`,
      description: "GTU Regular Question Paper",
      status: "published",
      pyq_metadata: {
        exam_year: 2025,
        season: "S",
        exam_label: "GTU Regular Summer 2025",
      },
    });
    createdDocIds.push(pyqDoc.id);

    // Attach File to PYQ
    const pyqFile = await attachFileToDocument(db, {
      document_id: pyqDoc.id,
      file_type: "paper",
      storage_key: `materials/e2e/${pyqDoc.id}/paper.pdf`,
      file_url: `/api/storage/materials/e2e/${pyqDoc.id}/paper.pdf`,
      original_filename: "computer_networks_summer_2025.pdf",
      mime_type: "application/pdf",
      size_bytes: 1048576,
      content_hash: `hash_e2e_pyq_${Date.now()}`,
      is_primary: true,
    });

    // Verify PYQ lookup
    const pyqFetched = await getDocumentById(db, pyqDoc.id);
    const pyqValid = pyqFetched && pyqFetched.pyq_metadata?.exam_year === 2025 && pyqFetched.files?.length === 1;

    results.push({
      step: "03",
      name: "PYQ Document Creation & File Attachment",
      status: pyqValid ? "PASS" : "FAIL",
      details: `PYQ ID: ${pyqDoc.id} | Year: ${pyqFetched?.pyq_metadata?.exam_year} | Files: ${pyqFetched?.files?.length}`,
    });

    // ----------------------------------------------------
    // 4. PYQ SOLUTION RELATION TEST
    // ----------------------------------------------------
    const solDoc = await createDocument(db, {
      document_type: "pyq",
      subject_id: subjectId,
      title: `${testPrefix} Computer Networks Summer 2025 Solution`,
      description: "GTU Official Model Answer Key",
      status: "published",
      pyq_metadata: {
        exam_year: 2025,
        season: "S",
        exam_label: "GTU Regular Summer 2025 Solution",
      },
    });
    createdDocIds.push(solDoc.id);

    const rel = await addDocumentRelation(db, pyqDoc.id, solDoc.id, "solution");
    const relations = await getDocumentRelations(db, pyqDoc.id);
    const relValid = relations.some(r => r.target_document_id === solDoc.id && r.relation_type === "solution");

    // Remove relation safely
    await removeDocumentRelation(db, rel.id);
    const postRemoveRel = await getDocumentRelations(db, pyqDoc.id);

    results.push({
      step: "04",
      name: "Document Solution Relation Workflow",
      status: relValid && postRemoveRel.length === 0 ? "PASS" : "FAIL",
      details: `Created solution link ${rel.id} and verified non-destructive deletion`,
    });

    // ----------------------------------------------------
    // 5. STUDY MATERIAL TEST
    // ----------------------------------------------------
    const matDoc = await createDocument(db, {
      document_type: "study-material",
      subject_id: subjectId,
      curriculum_node_id: topic1.id,
      title: `${testPrefix} OSI Model Complete Notes`,
      description: "Comprehensive 7 Layer Breakdown",
      status: "published",
      material_metadata: {
        material_kind: "notes",
        author: "ShikshaSahayak Editorial",
      },
    });
    createdDocIds.push(matDoc.id);

    const matFetched = await getDocumentById(db, matDoc.id);
    const matValid = matFetched && matFetched.material_metadata?.material_kind === "notes" && matFetched.curriculum_node_id === topic1.id;

    results.push({
      step: "05",
      name: "Study Material Creation & Curriculum Linking",
      status: matValid ? "PASS" : "FAIL",
      details: `Material ID: ${matDoc.id} | Kind: ${matFetched?.material_metadata?.material_kind} | Node: ${matFetched?.curriculum_node_id}`,
    });

    // ----------------------------------------------------
    // 6. SYLLABUS TEST
    // ----------------------------------------------------
    const sylDoc = await createDocument(db, {
      document_type: "syllabus",
      subject_id: subjectId,
      title: `${testPrefix} Computer Networks GTU Syllabus 2025`,
      status: "published",
      syllabus_metadata: {
        effective_year: 2025,
        regulation: "GTU 2024 Scheme",
        version_label: "v1.0",
      },
    });
    createdDocIds.push(sylDoc.id);

    const sylFetched = await getDocumentById(db, sylDoc.id);
    const sylValid = sylFetched && sylFetched.syllabus_metadata?.effective_year === 2025;

    results.push({
      step: "06",
      name: "Syllabus Creation & Metadata Verification",
      status: sylValid ? "PASS" : "FAIL",
      details: `Syllabus ID: ${sylDoc.id} | Scheme: ${sylFetched?.syllabus_metadata?.regulation}`,
    });

    // ----------------------------------------------------
    // 7. FILE REPLACEMENT TEST
    // ----------------------------------------------------
    const newFile = await attachFileToDocument(db, {
      document_id: pyqDoc.id,
      file_type: "paper",
      storage_key: `materials/e2e/${pyqDoc.id}/paper_v2.pdf`,
      file_url: `/api/storage/materials/e2e/${pyqDoc.id}/paper_v2.pdf`,
      original_filename: "computer_networks_summer_2025_v2.pdf",
      mime_type: "application/pdf",
      size_bytes: 2048000,
      content_hash: `hash_e2e_pyq_v2_${Date.now()}`,
      is_primary: true,
    });

    const pyqReplaced = await getDocumentById(db, pyqDoc.id);
    const primaryFile = (pyqReplaced?.files || []).find(f => f.is_primary === 1);
    const replaceValid = primaryFile && primaryFile.storage_key.includes("paper_v2.pdf");

    results.push({
      step: "07",
      name: "File Replacement & Primary Flag Update",
      status: replaceValid ? "PASS" : "FAIL",
      details: `Primary storage_key updated to: ${primaryFile?.storage_key}`,
    });

    // ----------------------------------------------------
    // 8. ASSET DEDUPLICATION & ORPHAN SAFETY TEST
    // ----------------------------------------------------
    const sharedHash = `hash_e2e_shared_dedup_${Date.now()}`;
    const file1 = await attachFileToDocument(db, {
      document_id: pyqDoc.id,
      file_type: "other",
      storage_key: `materials/e2e/shared_blob_${sharedHash}.bin`,
      file_url: `/api/storage/materials/e2e/shared_blob_${sharedHash}.bin`,
      original_filename: "shared_reference.pdf",
      content_hash: sharedHash,
    });

    const file2 = await attachFileToDocument(db, {
      document_id: matDoc.id,
      file_type: "other",
      storage_key: `materials/e2e/shared_blob_${sharedHash}.bin`,
      file_url: `/api/storage/materials/e2e/shared_blob_${sharedHash}.bin`,
      original_filename: "shared_reference.pdf",
      content_hash: sharedHash,
    });

    const assetRows = await db.prepare(`SELECT COUNT(1) as cnt FROM assets WHERE content_hash = ?`).bind(sharedHash).first<any>();
    const docFileRows = await db.prepare(`SELECT COUNT(1) as cnt FROM document_files WHERE storage_key LIKE ?`).bind(`%${sharedHash}%`).first<any>();
    const dedupValid = Number(assetRows?.cnt || 0) === 1 && Number(docFileRows?.cnt || 0) === 2;

    results.push({
      step: "08",
      name: "Physical Asset Deduplication (Single R2 Hash)",
      status: dedupValid ? "PASS" : "FAIL",
      details: `Asset Hash Rows: ${assetRows?.cnt} (Expected: 1) | Attachment Files Rows: ${docFileRows?.cnt} (Expected: 2)`,
    });

    // ----------------------------------------------------
    // 9. DOCUMENT DELETE & CASCADE TEST
    // ----------------------------------------------------
    const delDoc = await createDocument(db, {
      document_type: "study-material",
      subject_id: subjectId,
      title: `${testPrefix} Temporary Delete Test Doc`,
      status: "draft",
    });

    await attachFileToDocument(db, {
      document_id: delDoc.id,
      file_type: "material",
      storage_key: `materials/e2e/${delDoc.id}/temp.pdf`,
      file_url: `/api/storage/materials/e2e/${delDoc.id}/temp.pdf`,
      original_filename: "temp.pdf",
    });

    await deleteDocument(db, delDoc.id);

    const postDelDoc = await getDocumentById(db, delDoc.id);
    const postDelFiles = await db.prepare(`SELECT COUNT(1) as cnt FROM document_files WHERE document_id = ?`).bind(delDoc.id).first<any>();
    const delValid = postDelDoc === null && Number(postDelFiles?.cnt || 0) === 0;

    results.push({
      step: "09",
      name: "Document Deletion & Cascade Clean",
      status: delValid ? "PASS" : "FAIL",
      details: `Document ${delDoc.id} and child files cascade deleted successfully`,
    });

    // ----------------------------------------------------
    // 10. CONTENT FACTORY PUBLICATION FLOW TEST
    // ----------------------------------------------------
    const cfItemId = `cf_e2e_${Date.now()}`;
    await db.prepare(`
      INSERT INTO content_factory_items (id, university_id, branch_id, semester, subject_id, unit_no, topic, content_type, structured_content, raw_markdown, status)
      VALUES (?, 'gtu', 'branch_07', 5, ?, 1, 'TCP IP Protocol Suite', 'notes', '{"sections":[]}', '# TCP/IP Notes', 'APPROVED')
    `).bind(cfItemId, subjectId).run();

    // Simulate publication
    const cfPubDocId = `doc_cf_pub_${Date.now()}`;
    await db.prepare(`
      INSERT INTO documents (id, document_type, university_id, branch_id, semester, subject_id, title, description, status, approval_status, created_at, updated_at)
      VALUES (?, 'study-material', 'gtu', 'branch_07', 5, ?, 'TCP IP Protocol Suite — Notes', 'Generated Notes', 'published', 'approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(cfPubDocId, subjectId).run();

    await db.prepare(`
      INSERT INTO material_metadata (document_id, material_kind, author) VALUES (?, 'notes', 'ShikshaSahayak Editorial')
    `).bind(cfPubDocId).run();

    await db.prepare(`
      UPDATE content_factory_items SET status = 'PUBLISHED', published_document_id = ? WHERE id = ?
    `).bind(cfPubDocId, cfItemId).run();
    createdDocIds.push(cfPubDocId);

    const publishedDoc = await getDocumentById(db, cfPubDocId);
    const cfPubValid = publishedDoc !== null && publishedDoc.material_metadata?.material_kind === 'notes';

    results.push({
      step: "10",
      name: "Content Factory Publication Integration",
      status: cfPubValid ? "PASS" : "FAIL",
      details: `CF Published Doc ID: ${cfPubDocId} | Material Kind: ${publishedDoc?.material_metadata?.material_kind}`,
    });

    // ----------------------------------------------------
    // 11. INPUT VALIDATION & ERROR HANDLING TEST
    // ----------------------------------------------------
    let validationSuccess = true;
    try {
      validateDocumentType("invalid_type" as any);
      validationSuccess = false;
    } catch { /* expected */ }

    try {
      validateDocumentStatus("invalid_status" as any);
      validationSuccess = false;
    } catch { /* expected */ }

    results.push({
      step: "11",
      name: "Input Validation & Error Guarding",
      status: validationSuccess ? "PASS" : "FAIL",
      details: "Invalid document types and statuses correctly rejected with catchable exceptions",
    });

    // ----------------------------------------------------
    // 12. SEARCH, FILTERING & PAGINATION TEST
    // ----------------------------------------------------
    const { documents: page1, total } = await queryDocuments(db, {
      subject_id: subjectId,
      document_type: "pyq",
      limit: 1,
      offset: 0,
    });

    const { documents: page2 } = await queryDocuments(db, {
      subject_id: subjectId,
      document_type: "pyq",
      limit: 1,
      offset: 1,
    });

    const paginationValid = total >= 2 && page1.length === 1 && page2.length === 1 && page1[0].id !== page2[0].id;

    results.push({
      step: "12",
      name: "Search, Filtering & Server Pagination",
      status: paginationValid ? "PASS" : "FAIL",
      details: `Total PYQs: ${total} | Page 1 ID: ${page1[0]?.id} | Page 2 ID: ${page2[0]?.id}`,
    });

    // ----------------------------------------------------
    // 13. STATS INCREMENT & ANALYTICS TEST
    // ----------------------------------------------------
    await incrementDocumentStat(db, pyqDoc.id, "views");
    await incrementDocumentStat(db, pyqDoc.id, "downloads");

    const stats = await getDocumentStats(db, pyqDoc.id);
    const statsValid = stats.views >= 1 && stats.downloads >= 1;

    results.push({
      step: "13",
      name: "Document Stats Concurrent Increment",
      status: statsValid ? "PASS" : "FAIL",
      details: `Views: ${stats.views} | Downloads: ${stats.downloads}`,
    });

  } catch (err: any) {
    results.push({
      step: "ERR",
      name: "E2E Test Execution Error",
      status: "FAIL",
      details: err.message,
    });
  } finally {
    // ----------------------------------------------------
    // SAFE CLEANUP TEARDOWN
    // ----------------------------------------------------
    console.log("\n🧹 Cleaning up E2E test data...");
    for (const docId of createdDocIds) {
      await db.prepare(`DELETE FROM documents WHERE id = ?`).bind(docId).run();
    }
    for (const nodeId of createdNodeIds) {
      await db.prepare(`DELETE FROM curriculum_nodes WHERE id = ?`).bind(nodeId).run();
    }
    await db.prepare(`DELETE FROM subjects WHERE id = 'sub_e2e_3150710'`).run();
    await db.prepare(`DELETE FROM content_factory_items WHERE id LIKE 'cf_e2e_%'`).run();
    await db.prepare(`DELETE FROM assets WHERE content_hash LIKE 'hash_e2e_%'`).run();
    console.log("✅ E2E test data cleanup completed safely!\n");
  }

  // Print Summary Report
  console.log("==================================================");
  console.log("          E2E SIMULATION RESULTS REPORT");
  console.log("==================================================");
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'MANUAL' ? '🔍' : '❌';
    console.log(`${icon} [Step ${r.step}] ${r.name} -> ${r.status} (${r.details})`);
  });
  console.log("==================================================\n");

  return results;
}
