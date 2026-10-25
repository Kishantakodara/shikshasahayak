// ============================================================
// SHIKSHA SAHAYAK — CANONICAL QUESTION BATCH IMPORT & VALIDATION RUNNER
// Safe, idempotent, non-destructive import pipeline with dry-run support.
// Reuses: validateMasterQuestionPayload, detectDuplicateQuestion,
// normalizeQuestionText, and canonical branch mapping resolution.
// Command: npx tsx scripts/import-question-batch.ts [--dry-run] [--write] [--file=<path>]
// ============================================================

import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import {
  validateMasterQuestionPayload,
  containsPlaceholderOptions,
} from '../functions/lib/questionIntelligence/validationService';
import {
  normalizeQuestionText,
} from '../functions/lib/questionIntelligence/normalizationService';
import {
  detectDuplicateQuestion,
  calculateTextSimilarity,
} from '../functions/lib/questionIntelligence/duplicateDetectionService';
import {
  resolveCanonicalBranchId,
} from '../functions/lib/questionIntelligence/branchMappingService';
import { MasterQuestion, McqOptionSpec } from '../src/types';

export interface BatchImportOptions {
  filePath: string;
  isDryRun: boolean;
  targetDbPath?: string; // ':memory:' or custom sqlite path
  allowDuplicates?: boolean;
}

export interface QuestionImportReport {
  totalLoaded: number;
  validCount: number;
  invalidCount: number;
  validationErrors: Array<{ id?: string; errors: string[] }>;
  duplicateCount: number;
  duplicateWarnings: Array<{ id: string; matchedId?: string; confidence: number; text: string }>;
  skippedExistingCount: number;
  skippedExistingIds: string[];
  readyForInsertCount: number;
  insertedCount: number;
  branchMappingsCount: number;
  practiceReadiness: {
    isReadyForMcqPractice: boolean;
    subjectCode: string;
    semester: number;
    branchId: string;
    verifiedQuestionsCount: number;
  };
}

/**
 * Creates and initializes a local SQLite database using root schema.sql.
 */
export function createLocalDatabaseAdapter(dbPath: string = ':memory:') {
  const db = new DatabaseSync(dbPath);
  const root = process.cwd();
  const schemaPath = path.join(root, 'schema.sql');

  if (fs.existsSync(schemaPath)) {
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');
    // Sanitize case-insensitive duplicate column if present for node:sqlite compatibility
    schemaSql = schemaSql.replace(/Code INT,/g, '');
    db.exec(schemaSql);
  }

  // Ensure student_mcq_topic_progress exists for local/disposable environments
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_mcq_topic_progress (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      subject_code TEXT NOT NULL,
      topic_name TEXT NOT NULL,
      total_attempted INTEGER DEFAULT 0,
      total_correct INTEGER DEFAULT 0,
      last_practiced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, branch_id, subject_code, topic_name)
    );
  `);

  // Ensure canonical Electrical branch exists in branches table
  db.exec(`
    INSERT OR IGNORE INTO branches (id, name, slug, short_name, code)
    VALUES ('branch_09', 'Electrical Engineering', 'electrical-engineering', 'EE', '09');
  `);

  // Ensure canonical Electrical Machines I subject exists in canonical_subjects for local test
  db.exec(`
    INSERT OR IGNORE INTO canonical_subjects (id, university_id, degree, branch_id, semester, canonical_name, normalized_name)
    VALUES ('cs_electrical_s3_electrical_machines_i', 'gtu', 'BE', 'branch_09', 3, 'Electrical Machines I', 'electrical machines i');
    INSERT OR IGNORE INTO canonical_subjects (id, university_id, degree, branch_id, semester, canonical_name, normalized_name)
    VALUES ('sub_electrical-machines-i_3_21686f81', 'gtu', 'BE', 'branch_09', 3, 'Electrical Machines I', 'electrical machines i');
  `);

  return db;
}

/**
 * Runs the safe batch import / dry-run pipeline.
 */
export function runBatchImport(options: BatchImportOptions): QuestionImportReport {
  const { filePath, isDryRun, targetDbPath = ':memory:' } = options;

  if (!fs.existsSync(filePath)) {
    throw new Error(`Import payload file not found: ${filePath}`);
  }

  const rawJson = fs.readFileSync(filePath, 'utf8');
  const items: Partial<MasterQuestion>[] = JSON.parse(rawJson);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Payload must contain a non-empty array of question objects.');
  }

  const db = createLocalDatabaseAdapter(targetDbPath);

  const report: QuestionImportReport = {
    totalLoaded: items.length,
    validCount: 0,
    invalidCount: 0,
    validationErrors: [],
    duplicateCount: 0,
    duplicateWarnings: [],
    skippedExistingCount: 0,
    skippedExistingIds: [],
    readyForInsertCount: 0,
    insertedCount: 0,
    branchMappingsCount: 0,
    practiceReadiness: {
      isReadyForMcqPractice: false,
      subjectCode: items[0]?.subjectCode || 'UNKNOWN',
      semester: items[0]?.semester || 1,
      branchId: 'branch_09',
      verifiedQuestionsCount: 0,
    },
  };

  // Pre-load existing rows for duplicate & existing check
  const existingRows = db.prepare(`
    SELECT id, question_text, subject_name, subject_code, question_type, exam_year, exam_name
    FROM master_question_bank
  `).all() as Array<{
    id: string;
    question_text: string;
    subject_name: string;
    subject_code?: string;
    question_type: string;
    exam_year?: number;
    exam_name?: string;
  }>;

  const validPreparedItems: Array<{
    normalized: MasterQuestion;
    applicableBranches: string[];
  }> = [];

  for (let idx = 0; idx < items.length; idx++) {
    const raw = items[idx];
    const questionId = raw.id || `Q_TEMP_${idx + 1}`;

    // 1. Structural & Payload Validation
    const valRes = validateMasterQuestionPayload(raw);
    if (!valRes.isValid) {
      report.invalidCount++;
      report.validationErrors.push({ id: questionId, errors: valRes.errors });
      continue;
    }

    // 2. Placeholder Option Protection
    let rawOptions: any[] = [];
    if (raw.mcqData?.options) rawOptions = raw.mcqData.options;
    else if (Array.isArray(raw.options)) rawOptions = raw.options;
    else if (typeof raw.optionsJson === 'string') {
      try { rawOptions = JSON.parse(raw.optionsJson); } catch {}
    }

    if (rawOptions.length > 0 && containsPlaceholderOptions(rawOptions)) {
      report.invalidCount++;
      report.validationErrors.push({
        id: questionId,
        errors: ['Contains generic placeholder/dummy options (e.g. Option Choice A)'],
      });
      continue;
    }

    // 3. Normalization (without changing core engineering meaning)
    const normalizedTextResult = normalizeQuestionText(raw.questionText!);
    const cleanText = normalizedTextResult.normalized;

    // 4. Duplicate Check against existing database questions
    const dupRes = detectDuplicateQuestion(existingRows, {
      ...raw,
      questionText: cleanText,
    });

    if (dupRes.isDuplicate) {
      report.duplicateCount++;
      report.duplicateWarnings.push({
        id: questionId,
        matchedId: dupRes.matchedQuestionId,
        confidence: dupRes.confidence,
        text: dupRes.matchedQuestionText || '',
      });
      if (!options.allowDuplicates) {
        continue; // Skip duplicate item
      }
    } else if (dupRes.confidence >= 0.60) {
      // Potential candidate warning (does not block, but reported for review)
      report.duplicateWarnings.push({
        id: questionId,
        matchedId: dupRes.matchedQuestionId,
        confidence: dupRes.confidence,
        text: dupRes.matchedQuestionText || '',
      });
    }

    // 5. Existing ID Check (Never overwrite)
    const existingById = db.prepare('SELECT id FROM master_question_bank WHERE id = ?').get(questionId);
    if (existingById) {
      report.skippedExistingCount++;
      report.skippedExistingIds.push(questionId);
      continue;
    }

    report.validCount++;

    // Prepare options & correct answer JSON strings
    let optionsJson: string | null = null;
    let correctAnswerJson = String(raw.correctAnswerJson || raw.correctAnswer || '').trim();

    if (rawOptions.length > 0) {
      const formattedOptions: McqOptionSpec[] = rawOptions.map((opt: any, optIdx: number) => {
        if (typeof opt === 'string') return { id: String(optIdx), text: opt.trim() };
        return {
          id: String(opt.id || optIdx).trim(),
          text: String(opt.text || opt.value || '').trim(),
          imageUrl: opt.imageUrl ? String(opt.imageUrl) : undefined,
        };
      });
      optionsJson = JSON.stringify(formattedOptions);
    }

    if (!correctAnswerJson.startsWith('"') && !correctAnswerJson.startsWith('[')) {
      correctAnswerJson = JSON.stringify(correctAnswerJson);
    }

    const stepSolutionJson = raw.stepByStepSolution && Array.isArray(raw.stepByStepSolution)
      ? JSON.stringify(raw.stepByStepSolution)
      : (raw.stepByStepSolutionJson || null);

    const isAi = Boolean(raw.isAiGenerated) || raw.sourceType === 'AI_PRACTICE';
    const isOriginal = Boolean(raw.isOriginalPyq) && !isAi;

    // Branch resolution
    const branches = (raw.applicableBranches || ['branch_09']).map(resolveCanonicalBranchId);

    const normalizedRecord: MasterQuestion = {
      id: questionId,
      sourceType: raw.sourceType || 'TEACHER',
      isOriginalPyq: isOriginal,
      isAiGenerated: isAi,
      provenanceId: raw.provenanceId || null,
      sourceUrl: raw.sourceUrl || null,
      examName: raw.examName || 'GTU',
      examYear: raw.examYear !== undefined ? raw.examYear : null,
      examSession: raw.examSession || null,
      questionNo: raw.questionNo || null,
      subQuestionNo: raw.subQuestionNo || null,
      canonicalSubjectId: raw.canonicalSubjectId || null,
      subjectCode: raw.subjectCode || null,
      subjectName: raw.subjectName!,
      semester: raw.semester || 3,
      curriculumNodeId: raw.curriculumNodeId || null,
      unitNo: raw.unitNo !== undefined ? raw.unitNo : 1,
      topicName: raw.topicName || null,
      subtopicName: raw.subtopicName || null,
      questionType: raw.questionType as any,
      questionText: cleanText,
      questionHtml: raw.questionHtml || null,
      questionImageUrl: raw.questionImageUrl || null,
      optionsJson,
      correctAnswerJson,
      acceptableNumericalRangeJson: raw.acceptableNumericalRangeJson || null,
      explanation: raw.explanation || null,
      stepByStepSolutionJson: stepSolutionJson,
      marks: raw.marks || 1.0,
      negativeMarking: raw.negativeMarking !== undefined ? raw.negativeMarking : 0.25,
      difficulty: (raw.difficulty || 'medium') as any,
      bloomLevel: raw.bloomLevel || null,
      verificationStatus: (raw.verificationStatus || 'verified') as any,
      verifiedBy: raw.verifiedBy || 'system_importer',
      verifiedAt: raw.verifiedAt || new Date().toISOString(),
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };

    validPreparedItems.push({
      normalized: normalizedRecord,
      applicableBranches: branches,
    });
  }

  report.readyForInsertCount = validPreparedItems.length;

  // 6. Execution: Perform actual database writes only if NOT a dry-run
  if (!isDryRun) {
    const insertQuestionStmt = db.prepare(`
      INSERT OR IGNORE INTO master_question_bank (
        id, source_type, is_original_pyq, is_ai_generated, provenance_id, source_url,
        exam_name, exam_year, exam_session, question_no, sub_question_no,
        canonical_subject_id, subject_code, subject_name, semester,
        curriculum_node_id, unit_no, topic_name, subtopic_name,
        question_type, question_text, question_html, question_image_url,
        options_json, correct_answer_json, acceptable_numerical_range_json,
        explanation, step_by_step_solution_json, marks, negative_marking,
        difficulty, bloom_level, verification_status, verified_by, verified_at,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `);

    const insertBranchStmt = db.prepare(`
      INSERT OR IGNORE INTO question_branch_mappings (id, question_id, branch_id, is_primary)
      VALUES (?, ?, ?, 1)
    `);

    for (const item of validPreparedItems) {
      const q = item.normalized;
      let safeCanonicalSubjectId = q.canonicalSubjectId;
      if (safeCanonicalSubjectId) {
        try {
          const exists = db.prepare('SELECT id FROM canonical_subjects WHERE id = ?').get(safeCanonicalSubjectId);
          if (!exists) safeCanonicalSubjectId = null;
        } catch {
          safeCanonicalSubjectId = null;
        }
      }

      insertQuestionStmt.run(
        q.id,
        q.sourceType,
        q.isOriginalPyq ? 1 : 0,
        q.isAiGenerated ? 1 : 0,
        q.provenanceId,
        q.sourceUrl,
        q.examName,
        q.examYear,
        q.examSession,
        q.questionNo,
        q.subQuestionNo,
        safeCanonicalSubjectId,
        q.subjectCode,
        q.subjectName,
        q.semester,
        q.curriculumNodeId,
        q.unitNo,
        q.topicName,
        q.subtopicName,
        q.questionType,
        q.questionText,
        q.questionHtml,
        q.questionImageUrl,
        q.optionsJson,
        q.correctAnswerJson,
        q.acceptableNumericalRangeJson,
        q.explanation,
        q.stepByStepSolutionJson,
        q.marks,
        q.negativeMarking,
        q.difficulty,
        q.bloomLevel,
        q.verificationStatus,
        q.verifiedBy,
        q.verifiedAt
      );
      report.insertedCount++;

      for (const branchId of item.applicableBranches) {
        const mappingId = `qbm_${q.id}_${branchId}`;
        insertBranchStmt.run(mappingId, q.id, branchId);
        report.branchMappingsCount++;
      }
    }
  }

  // 7. Student Practice Readiness Verification
  const sample = validPreparedItems[0]?.normalized;
  if (sample) {
    const verifiedCount = validPreparedItems.filter(
      i => i.normalized.verificationStatus === 'verified' && i.normalized.questionType === 'MCQ'
    ).length;

    report.practiceReadiness = {
      isReadyForMcqPractice: verifiedCount >= 10,
      subjectCode: sample.subjectCode || 'BE03009021',
      semester: sample.semester,
      branchId: 'branch_09',
      verifiedQuestionsCount: verifiedCount,
    };
  }

  try {
    db.close();
  } catch {}

  return report;
}

// ------------------------------------------------------------
// CLI RUNNER ENTRY POINT
// ------------------------------------------------------------
function main() {
  const args = process.argv.slice(2);
  const isWriteRequested = args.includes('--write') || args.includes('--execute');
  const isDryRun = !isWriteRequested || args.includes('--dry-run');

  // File argument
  let targetFile = path.join(process.cwd(), 'data', 'questions', 'transformers_pilot.json');
  const fileArg = args.find(a => a.startsWith('--file='));
  if (fileArg) {
    targetFile = path.resolve(fileArg.split('=')[1]);
  }

  // DB Path argument
  let targetDb = ':memory:';
  const dbArg = args.find(a => a.startsWith('--target='));
  if (dbArg) {
    targetDb = dbArg.split('=')[1];
  } else if (isWriteRequested) {
    targetDb = path.join(process.cwd(), 'data', 'local_pilot_test.sqlite');
  }

  console.log('============================================================');
  console.log('SHIKSHA SAHAYAK — QUESTION BATCH IMPORT & VALIDATION');
  console.log('============================================================');
  console.log(`Payload File:  ${targetFile}`);
  console.log(`Mode:          ${isDryRun ? 'DRY-RUN (Simulated, zero writes)' : 'WRITE (Committed to target database)'}`);
  console.log(`Target DB:     ${targetDb}`);
  console.log('============================================================\n');

  try {
    const report = runBatchImport({
      filePath: targetFile,
      isDryRun,
      targetDbPath: targetDb,
    });

    console.log('--- AUDIT & INGESTION SUMMARY ---');
    console.log(`Total Records Loaded:        ${report.totalLoaded}`);
    console.log(`Valid Records:               ${report.validCount}`);
    console.log(`Invalid Records:             ${report.invalidCount}`);
    console.log(`Duplicate Rejections:        ${report.duplicateCount}`);
    console.log(`Skipped (Already in DB):     ${report.skippedExistingCount}`);
    console.log(`Ready for Ingestion:         ${report.readyForInsertCount}`);
    console.log(`Actual Inserted (MQB):       ${report.insertedCount}`);
    console.log(`Branch Mappings Created:     ${report.branchMappingsCount}`);

    if (report.duplicateWarnings.length > 0) {
      console.log('\n--- DUPLICATE CANDIDATE WARNINGS ---');
      for (const w of report.duplicateWarnings) {
        console.log(`  [WARN] ${w.id} has similarity ${w.confidence} with existing ${w.matchedId || 'record'}`);
      }
    }

    if (report.validationErrors.length > 0) {
      console.log('\n--- VALIDATION ERRORS ---');
      for (const e of report.validationErrors) {
        console.log(`  [FAIL] ${e.id}: ${e.errors.join('; ')}`);
      }
    }

    console.log('\n--- STUDENT MCQ PRACTICE READINESS ---');
    console.log(`Subject Code:                ${report.practiceReadiness.subjectCode}`);
    console.log(`Semester:                    ${report.practiceReadiness.semester}`);
    console.log(`Branch ID:                   ${report.practiceReadiness.branchId} (Electrical Engineering)`);
    console.log(`Verified MCQs Count:         ${report.practiceReadiness.verifiedQuestionsCount}`);
    console.log(`Ready for /api/student/mcq:  ${report.practiceReadiness.isReadyForMcqPractice ? 'YES (Meets minimum 10 threshold)' : 'NO'}`);
    console.log('============================================================\n');

    if (isDryRun) {
      console.log('Dry-run complete. ZERO production/local tables were modified.');
      console.log('To execute actual write to a local disposable database, run with: --write\n');
    } else {
      console.log(`Write complete. Data committed to ${targetDb}.\n`);
    }

  } catch (err: any) {
    console.error('Execution Failed:', err.message || err);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith('import-question-batch.ts')) {
  main();
}
