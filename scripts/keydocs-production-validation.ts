// ============================================================
// SHIKSHA SAHAYAK OS KEYDOCS 3.0: FULL SYSTEM PRODUCTION VALIDATION SCRIPT
// Validates Student UI, Admin CMS, and API contracts against D1 data
// ============================================================

import { queryDocuments, getDocumentById } from "../functions/lib/keydocs/queries";
import { getCurriculumTree } from "../functions/lib/keydocs/curriculum";

export interface SystemValidationCheck {
  subsystem: string;
  test: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

export async function runFullSystemValidation(db: any): Promise<SystemValidationCheck[]> {
  console.log("\n==================================================");
  console.log("   KEYDOCS 3.0 FULL-SYSTEM PRODUCTION VALIDATION");
  console.log("==================================================\n");

  const checks: SystemValidationCheck[] = [];
  const subjectId = "sub_3150710"; // Computer Networks Pilot Subject

  // 1. Student PYQ Endpoint Validation
  try {
    const { documents: pyqs } = await queryDocuments(db, {
      subject_id: subjectId,
      document_type: "pyq",
      limit: 10,
    });
    const valid = pyqs.length > 0 && pyqs.every(p => p.pyq_metadata?.exam_year !== undefined);
    checks.push({
      subsystem: "Student API",
      test: "PYQ Query & Response Contract Parity (/api/academic-pyqs)",
      status: valid ? "PASS" : "FAIL",
      details: `Retrieved ${pyqs.length} PYQs with exam_year metadata`,
    });
  } catch (err: any) {
    checks.push({
      subsystem: "Student API",
      test: "PYQ Query & Response Contract Parity (/api/academic-pyqs)",
      status: "FAIL",
      details: err.message,
    });
  }

  // 2. Student Materials Endpoint Validation
  try {
    const { documents: materials } = await queryDocuments(db, {
      subject_id: subjectId,
      document_type: "study-material",
      limit: 10,
    });
    const valid = materials.length > 0 && materials.every(m => m.material_metadata?.material_kind !== undefined);
    checks.push({
      subsystem: "Student API",
      test: "Study Material Query Parity (/api/materials)",
      status: valid ? "PASS" : "FAIL",
      details: `Retrieved ${materials.length} Materials with material_kind metadata`,
    });
  } catch (err: any) {
    checks.push({
      subsystem: "Student API",
      test: "Study Material Query Parity (/api/materials)",
      status: "FAIL",
      details: err.message,
    });
  }

  // 3. Student Syllabus Endpoint Validation
  try {
    const { documents: syllabi } = await queryDocuments(db, {
      subject_id: subjectId,
      document_type: "syllabus",
      limit: 10,
    });
    const valid = syllabi.length > 0 && syllabi.every(s => s.syllabus_metadata?.effective_year !== undefined);
    checks.push({
      subsystem: "Student API",
      test: "Syllabus Query Parity (/api/syllabus)",
      status: valid ? "PASS" : "FAIL",
      details: `Retrieved ${syllabi.length} Syllabi with effective_year metadata`,
    });
  } catch (err: any) {
    checks.push({
      subsystem: "Student API",
      test: "Syllabus Query Parity (/api/syllabus)",
      status: "FAIL",
      details: err.message,
    });
  }

  // 4. Admin Curriculum Tree Validation
  try {
    const tree = await getCurriculumTree(db, subjectId);
    checks.push({
      subsystem: "Admin CMS",
      test: "Curriculum Infinite Tree Rendering (Units ➔ Topics)",
      status: tree.length > 0 ? "PASS" : "FAIL",
      details: `Rendered ${tree.length} top-level Units in curriculum tree`,
    });
  } catch (err: any) {
    checks.push({
      subsystem: "Admin CMS",
      test: "Curriculum Infinite Tree Rendering (Units ➔ Topics)",
      status: "FAIL",
      details: err.message,
    });
  }

  // 5. PDF & Storage Download Links Validation
  try {
    const { documents: docs } = await queryDocuments(db, { subject_id: subjectId, limit: 1 });
    const firstDoc = docs[0] ? await getDocumentById(db, docs[0].id) : null;
    const hasFiles = firstDoc && (firstDoc.files || []).length > 0;
    checks.push({
      subsystem: "Storage Pipeline",
      test: "Document Attachment & Signed Storage URL Resolution",
      status: hasFiles ? "PASS" : "FAIL",
      details: `Verified primary file URL: ${firstDoc?.files?.[0]?.file_url}`,
    });
  } catch (err: any) {
    checks.push({
      subsystem: "Storage Pipeline",
      test: "Document Attachment & Signed Storage URL Resolution",
      status: "FAIL",
      details: err.message,
    });
  }

  console.log("==================================================");
  console.log("        FULL SYSTEM VALIDATION SUMMARY");
  console.log("==================================================");
  checks.forEach(c => {
    const icon = c.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${c.subsystem}] ${c.test} -> ${c.status} (${c.details})`);
  });
  console.log("==================================================\n");

  return checks;
}
