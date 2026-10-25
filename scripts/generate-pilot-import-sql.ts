import fs from 'fs';
import path from 'path';

function sqlEscape(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

export function generatePilotSql(): string {
  const jsonPath = path.join(process.cwd(), 'data', 'questions', 'transformers_pilot.json');
  const items = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const sqlStatements: string[] = [
    '-- ============================================================',
    '-- SHIKSHA SAHAYAK — TRANSFORMERS MCQ PILOT CONTROLLED INGESTION',
    '-- Target: D1 DB (keydocs)',
    '-- Strictly 12 questions and their branch_09 branch mappings',
    '-- Idempotent: INSERT OR IGNORE',
    '-- ============================================================',
    '',
  ];

  for (const item of items) {
    const optionsJson = JSON.stringify(item.mcqData?.options || item.options);
    const correctAnswerJson = JSON.stringify(item.mcqData?.correctAnswer || item.correctAnswer);
    const stepSolutionJson = item.stepByStepSolution ? JSON.stringify(item.stepByStepSolution) : null;

    const qSql = `INSERT OR IGNORE INTO master_question_bank (
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
  ${sqlEscape(item.id)},
  ${sqlEscape(item.sourceType || 'TEACHER')},
  0,
  0,
  ${sqlEscape(item.provenanceId || 'pilot_em_trans_2026')},
  NULL,
  ${sqlEscape(item.examName || 'GTU')},
  NULL,
  NULL,
  NULL,
  NULL,
  ${sqlEscape(item.canonicalSubjectId)},
  ${sqlEscape(item.subjectCode)},
  ${sqlEscape(item.subjectName)},
  ${item.semester || 3},
  NULL,
  ${item.unitNo || 1},
  ${sqlEscape(item.topicName)},
  ${sqlEscape(item.subtopicName)},
  ${sqlEscape(item.questionType)},
  ${sqlEscape(item.questionText)},
  NULL,
  NULL,
  ${sqlEscape(optionsJson)},
  ${sqlEscape(correctAnswerJson)},
  NULL,
  ${sqlEscape(item.explanation)},
  ${sqlEscape(stepSolutionJson)},
  ${item.marks || 1.0},
  ${item.negativeMarking !== undefined ? item.negativeMarking : 0.25},
  ${sqlEscape(item.difficulty || 'medium')},
  ${sqlEscape(item.bloomLevel)},
  ${sqlEscape(item.verificationStatus || 'verified')},
  ${sqlEscape(item.verifiedBy || 'curriculum_expert_electrical')},
  ${sqlEscape(item.verifiedAt || new Date().toISOString())},
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);`;

    sqlStatements.push(qSql);

    // Branch mappings for branch_09
    const mappingId = `qbm_${item.id}_branch_09`;
    const bmSql = `INSERT OR IGNORE INTO question_branch_mappings (id, question_id, branch_id, is_primary, created_at)
VALUES (${sqlEscape(mappingId)}, ${sqlEscape(item.id)}, 'branch_09', 1, CURRENT_TIMESTAMP);`;
    sqlStatements.push(bmSql);
    sqlStatements.push('');
  }

  const outPath = path.join(process.cwd(), 'data', 'pilot_remote_import.sql');
  const fullSql = sqlStatements.join('\n');
  fs.writeFileSync(outPath, fullSql, 'utf8');
  console.log(`Successfully generated: ${outPath} (${items.length} questions, ${items.length} branch mappings)`);
  return outPath;
}

if (process.argv[1] && process.argv[1].includes('generate-pilot-import-sql')) {
  generatePilotSql();
}
