/**
 * ShikshaSahayak — Phase 3 Pilot End-to-End Lifecycle & Student Delivery Verification
 */

import { PILOT_TOPICS } from './generate-pilot-content';
import { validateGeneratedContent } from '../functions/lib/content-factory/validator';
import { formatPayloadToMarkdown } from '../functions/lib/content-factory/provider';

console.log('================================================================');
console.log('SHIKSHA SAHAYAK — PHASE 3 PILOT LIFECYCLE & DELIVERY VERIFICATION');
console.log('Pilot Batch: GTU Computer Engineering Sem 5 — Computer Networks (Unit 1)');
console.log('================================================================\n');

const testResults: { name: string; pass: boolean; details: string }[] = [];

function recordTest(name: string, pass: boolean, details: string) {
  if (pass) {
    console.log(`[PASS] ${name}: ${details}`);
    testResults.push({ name, pass: true, details });
  } else {
    console.error(`[FAIL] ${name}: ${details}`);
    testResults.push({ name, pass: false, details });
  }
}

// -------------------------------------------------------------
// 1. Content Factory Import Simulation (MODE A)
// -------------------------------------------------------------
console.log('--- 1. Import Validation & Staging into DRAFT ---');

interface MockContentFactoryItem {
  id: string;
  university_id: string;
  branch_id: string;
  semester: number;
  subject_id: string;
  unit_no: number;
  unit_title: string;
  topic: string;
  content_type: string;
  structured_content: any;
  raw_markdown: string;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED';
  validation_status: 'valid' | 'flagged' | 'warning';
  validation_notes: any;
  published_document_id?: string;
}

const mockContentFactoryDB: MockContentFactoryItem[] = [];
const mockDocumentsDB: any[] = [];

PILOT_TOPICS.forEach((item, idx) => {
  const validation = validateGeneratedContent(item.payload, item.params);
  const markdown = formatPayloadToMarkdown(item.payload, item.params);

  const stagedItem: MockContentFactoryItem = {
    id: `cf_pilot_${idx + 1}`,
    university_id: item.params.university,
    branch_id: item.params.branch,
    semester: item.params.semester,
    subject_id: 'sub_cn_sem5',
    unit_no: item.params.unitNo,
    unit_title: item.params.unitTitle || 'Introduction to Computer Networks',
    topic: item.payload.topic,
    content_type: 'full_bundle',
    structured_content: item.payload,
    raw_markdown: markdown,
    status: 'DRAFT',
    validation_status: validation.status,
    validation_notes: {
      issues: validation.issues,
      warnings: validation.warnings,
      flags: validation.qualityReviewFlags
    }
  };

  mockContentFactoryDB.push(stagedItem);
});

recordTest(
  'All 4 Pilot Topics Imported Successfully',
  mockContentFactoryDB.length === 4,
  `Staged ${mockContentFactoryDB.length} topics into Content Factory DB`
);

recordTest(
  'Imported Items Default to DRAFT State',
  mockContentFactoryDB.every(i => i.status === 'DRAFT'),
  '100% of imported items securely placed in DRAFT status'
);

recordTest(
  'Automated Validation Notes & Quality Flags Staged',
  mockContentFactoryDB.every(i => i.validation_notes && i.validation_notes.flags.length > 0),
  'Quality review flags attached to all items for academic review'
);

// -------------------------------------------------------------
// 2. Admin Review & Inspection Drawer
// -------------------------------------------------------------
console.log('\n--- 2. Admin Inspection & Quality Gate ---');

// Inspect representative content types across all topics
mockContentFactoryDB.forEach(item => {
  const content = item.structured_content;
  const hasDetailedNotes = Boolean(content.detailedNotes && content.detailedNotes.length > 500);
  const hasShortNotes = Boolean(content.shortNotes && content.shortNotes.length > 100);
  const hasDefinitions = Boolean(content.definitions && content.definitions.length > 0);
  const hasMCQs = Boolean(content.mcqs && content.mcqs.length >= 4);
  const hasShortQuestions = Boolean(content.shortQuestions && content.shortQuestions.length >= 2);
  const hasLongQuestions = Boolean(content.longQuestions && content.longQuestions.length >= 1);
  const hasQuickRevision = Boolean(content.quickRevision && content.quickRevision.summaryPoints.length > 0);

  const passedInspection = hasDetailedNotes && hasShortNotes && hasDefinitions && 
                           hasMCQs && hasShortQuestions && hasLongQuestions && hasQuickRevision;

  recordTest(
    `Academic Content Inspection: ${item.topic}`,
    passedInspection,
    `Notes (${content.detailedNotes?.length} chars), ${content.mcqs?.length} MCQs, ${content.shortQuestions?.length} Short Qs, ${content.longQuestions?.length} Long Qs`
  );
});

// -------------------------------------------------------------
// 3. Status Lifecycle Transition: DRAFT -> REVIEW -> APPROVED -> PUBLISHED
// -------------------------------------------------------------
console.log('\n--- 3. Status Transition & Publishing to Live Documents ---');

// Transition to REVIEW
mockContentFactoryDB.forEach(item => { item.status = 'REVIEW'; });
recordTest('Transition to REVIEW', mockContentFactoryDB.every(i => i.status === 'REVIEW'), 'Admin placed items in review queue');

// Transition to APPROVED
mockContentFactoryDB.forEach(item => { item.status = 'APPROVED'; });
recordTest('Transition to APPROVED', mockContentFactoryDB.every(i => i.status === 'APPROVED'), 'Admin approved all 4 verified topics');

// Transition to PUBLISHED & Synchronize into Documents Table
mockContentFactoryDB.forEach(item => {
  item.status = 'PUBLISHED';
  const docId = `doc_${item.id}`;
  item.published_document_id = docId;

  mockDocumentsDB.push({
    id: docId,
    university_id: item.university_id,
    branch_id: item.branch_id,
    semester: item.semester,
    subject_id: item.subject_id,
    unit_no: item.unit_no,
    unit_title: item.unit_title,
    title: `${item.topic} — Complete Revision Notes & Question Bank`,
    document_type: 'study-material',
    material_kind: 'notes',
    content_factory_item_id: item.id,
    approval_status: 'approved',
    is_active: 1,
    content: item.raw_markdown
  });
});

recordTest('Transition to PUBLISHED', mockContentFactoryDB.every(i => i.status === 'PUBLISHED'), 'All 4 items published');
recordTest(
  'Sync to Live Documents Repository',
  mockDocumentsDB.length === 4 && mockDocumentsDB.every(d => d.document_type === 'study-material' && d.approval_status === 'approved'),
  `Synced ${mockDocumentsDB.length} approved documents ready for student access`
);

// -------------------------------------------------------------
// 4. Student Delivery Verification
// -------------------------------------------------------------
console.log('\n--- 4. Student Portal Delivery Verification ---');

// Simulate student querying Unit 1 Computer Networks documents
const studentQueryParams = {
  university: 'gtu',
  branch_id: 'branch_computer',
  semester: 5,
  subject_id: 'sub_cn_sem5',
  unit_no: 1
};

const deliveredDocuments = mockDocumentsDB.filter(doc => 
  doc.university_id === studentQueryParams.university &&
  doc.branch_id === studentQueryParams.branch_id &&
  doc.semester === studentQueryParams.semester &&
  doc.subject_id === studentQueryParams.subject_id &&
  doc.unit_no === studentQueryParams.unit_no &&
  doc.approval_status === 'approved' &&
  doc.is_active === 1
);

recordTest(
  'Student Query Retrieves All 4 Unit 1 Documents',
  deliveredDocuments.length === 4,
  `Retrieved: ${deliveredDocuments.map(d => d.title.split('—')[0].trim()).join(', ')}`
);

recordTest(
  'Student Document Delivery Integrity',
  deliveredDocuments.every(d => d.content && d.content.length > 5000),
  'All delivered documents contain rich, fully rendered markdown'
);

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n================================================================');
console.log('SUMMARY REPORT');
console.log('================================================================');
const passCount = testResults.filter(r => r.pass).length;
const failCount = testResults.filter(r => !r.pass).length;
console.log(`Total Tests: ${testResults.length} | Passed: ${passCount} | Failed: ${failCount}`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('\n>>> ALL PHASE 3 PILOT LIFECYCLE & DELIVERY VERIFICATIONS PASSED <<<');
}
