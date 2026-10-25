// ============================================================
// QUESTION INTELLIGENCE ENGINE - CURRICULUM MAPPING SERVICE
// Deterministic topic, unit, subtopic, and concept mapping layer.
// ============================================================

import { Env } from '../contentEngine';

export type CurriculumMappingStatus = 'AUTO_MAPPED' | 'REVIEW_REQUIRED' | 'UNMAPPED';

export interface CurriculumMappingResult {
  questionId: string;
  subjectCode: string;
  unitNo?: number;
  unitName?: string;
  topicName?: string;
  subtopicName?: string;
  conceptTags: string[];
  mappingConfidence: number; // 0.0 to 1.0
  mappingStatus: CurriculumMappingStatus;
  mappedBy: string;
}

// Canonical topic keywords for First-Year engineering subjects
const FIRST_YEAR_TOPIC_RULES: Record<string, Array<{ unitNo: number; unitName: string; topicName: string; keywords: string[] }>> = {
  // Maths-1 (3110014)
  '3110014': [
    { unitNo: 1, unitName: 'Indeterminate Forms & Taylor Series', topicName: 'L’Hopital Rule & Expansion', keywords: ['indeterminate', 'l\'hopital', 'taylor', 'maclaurin', 'series expansion', 'expansion'] },
    { unitNo: 2, unitName: 'Matrices & Linear Algebra', topicName: 'Rank & System of Linear Equations', keywords: ['rank', 'echelon', 'linear equations', 'augmented matrix', 'consistency'] },
    { unitNo: 2, unitName: 'Matrices & Linear Algebra', topicName: 'Eigenvalues & Cayley-Hamilton', keywords: ['eigenvalue', 'eigenvalues', 'eigenvector', 'cayley-hamilton', 'characteristic equation', 'diagonalization'] },
    { unitNo: 3, unitName: 'Partial Derivatives', topicName: 'Euler Theorem & Partial Differentiation', keywords: ['partial derivative', 'euler theorem', 'homogeneous function', 'total derivative'] },
    { unitNo: 4, unitName: 'Multiple Integrals', topicName: 'Double & Triple Integrals', keywords: ['double integral', 'triple integral', 'change of order', 'area', 'volume'] },
  ],
  // Maths-2 (3110015)
  '3110015': [
    { unitNo: 1, unitName: 'First Order ODEs', topicName: 'Exact & Linear Differential Equations', keywords: ['exact differential', 'integrating factor', 'bernoulli', 'orthogonal trajectories'] },
    { unitNo: 2, unitName: 'Higher Order Linear ODEs', topicName: 'Complementary Function & Particular Integral', keywords: ['particular integral', 'complementary function', 'method of variation of parameters', 'cauchy-euler'] },
    { unitNo: 3, unitName: 'Laplace Transforms', topicName: 'Laplace & Inverse Laplace Transforms', keywords: ['laplace transform', 'inverse laplace', 'convolution theorem', 'unit step'] },
    { unitNo: 4, unitName: 'Vector Calculus', topicName: 'Gradient, Divergence & Curl', keywords: ['gradient', 'divergence', 'curl', 'green theorem', 'stokes theorem', 'divergence theorem'] },
  ],
  // Basic Electrical Engineering (3110005)
  '3110005': [
    { unitNo: 1, unitName: 'DC Circuits', topicName: 'Network Theorems', keywords: ['thevenin', 'norton', 'superposition', 'maximum power transfer', 'kvl', 'kcl', 'mesh', 'nodal'] },
    { unitNo: 2, unitName: 'AC Circuits', topicName: 'Single Phase AC & Resonance', keywords: ['sinusoidal', 'rms value', 'form factor', 'r-l-c', 'resonance', 'power factor', 'impedance'] },
    { unitNo: 3, unitName: 'Transformers', topicName: 'Single Phase Transformer', keywords: ['transformer', 'emf equation', 'core losses', 'copper losses', 'efficiency', 'turns ratio'] },
    { unitNo: 4, unitName: 'Electrical Machines', topicName: 'DC & Induction Motors', keywords: ['dc motor', 'induction motor', 'slip', 'torque', 'rotor', 'stator'] },
  ],
  // Programming for Problem Solving (3110003)
  '3110003': [
    { unitNo: 1, unitName: 'Introduction to C', topicName: 'Data Types, Operators & I/O', keywords: ['data type', 'printf', 'scanf', 'operators', 'type casting', 'keywords'] },
    { unitNo: 2, unitName: 'Control Structures', topicName: 'Conditional Statements & Loops', keywords: ['if-else', 'switch-case', 'for loop', 'while loop', 'do-while', 'break', 'continue'] },
    { unitNo: 3, unitName: 'Arrays & Strings', topicName: '1D/2D Arrays & String Handling', keywords: ['array', 'matrix', 'string', 'strlen', 'strcpy', 'strcmp', 'strcat'] },
    { unitNo: 4, unitName: 'Functions & Pointers', topicName: 'Functions, Recursion & Pointers', keywords: ['function', 'recursion', 'call by value', 'call by reference', 'pointer', 'address of'] },
    { unitNo: 5, unitName: 'Structures & File I/O', topicName: 'Structures, Unions & Files', keywords: ['structure', 'union', 'file pointer', 'fopen', 'fclose', 'fread', 'fwrite'] },
  ],
  // English (3110002)
  '3110002': [
    { unitNo: 1, unitName: 'Communication Skills', topicName: 'Verbal & Non-Verbal Communication', keywords: ['communication', 'kinesics', 'proxemics', 'paralanguage', 'barriers'] },
    { unitNo: 2, unitName: 'Grammar & Vocabulary', topicName: 'Tenses & Active/Passive Voice', keywords: ['active voice', 'passive voice', 'direct speech', 'indirect speech', 'tenses', 'preposition'] },
    { unitNo: 3, unitName: 'Writing Skills', topicName: 'Letter & Report Writing', keywords: ['formal letter', 'report writing', 'resume', 'email writing', 'paragraph'] },
  ],
  // Physics (3110018)
  '3110018': [
    { unitNo: 1, unitName: 'Optics', topicName: 'Interference & Diffraction', keywords: ['interference', 'diffraction', 'polarization', 'newton ring', 'grating', 'laser'] },
    { unitNo: 2, unitName: 'Quantum Mechanics', topicName: 'De-Broglie Waves & Schrodinger Equation', keywords: ['de-broglie', 'heisenberg', 'schrodinger', 'wave function', 'quantum'] },
    { unitNo: 3, unitName: 'Semiconductors', topicName: 'Band Theory & PN Junction', keywords: ['semiconductor', 'fermi level', 'hall effect', 'pn junction', 'band gap'] },
    { unitNo: 4, unitName: 'Superconductivity', topicName: 'Meissner Effect & Superconductors', keywords: ['superconductivity', 'meissner effect', 'critical temperature', 'type-i', 'type-ii'] },
  ],
};

/**
  Maps a question to canonical curriculum topic hierarchy deterministically.
 */
export function determineCurriculumMapping(
  questionText: string,
  subjectCode: string,
  explicitTopic?: string | null
): CurriculumMappingResult {
  const cleanText = (questionText || '').toLowerCase();
  const code = subjectCode.trim();

  // If explicit topic is provided and known
  if (explicitTopic && explicitTopic.trim()) {
    return {
      questionId: '',
      subjectCode: code,
      topicName: explicitTopic.trim(),
      conceptTags: [explicitTopic.trim()],
      mappingConfidence: 1.0,
      mappingStatus: 'AUTO_MAPPED',
      mappedBy: 'EXPLICIT',
    };
  }

  const rules = FIRST_YEAR_TOPIC_RULES[code];
  if (!rules || rules.length === 0) {
    return {
      questionId: '',
      subjectCode: code,
      conceptTags: [],
      mappingConfidence: 0.0,
      mappingStatus: 'UNMAPPED',
      mappedBy: 'SYSTEM',
    };
  }

  let bestMatch: { unitNo: number; unitName: string; topicName: string } | null = null;
  let highestScore = 0;
  const matchedConcepts: string[] = [];

  for (const rule of rules) {
    let matchCount = 0;
    for (const kw of rule.keywords) {
      if (cleanText.includes(kw)) {
        matchCount++;
        matchedConcepts.push(kw);
      }
    }

    if (matchCount > highestScore) {
      highestScore = matchCount;
      bestMatch = { unitNo: rule.unitNo, unitName: rule.unitName, topicName: rule.topicName };
    }
  }

  if (bestMatch && highestScore >= 1) {
    const confidence = Math.min(1.0, 0.55 + highestScore * 0.20);
    const status: CurriculumMappingStatus = highestScore >= 2 ? 'AUTO_MAPPED' : 'REVIEW_REQUIRED';
    return {
      questionId: '',
      subjectCode: code,
      unitNo: bestMatch.unitNo,
      unitName: bestMatch.unitName,
      topicName: bestMatch.topicName,
      conceptTags: Array.from(new Set(matchedConcepts)),
      mappingConfidence: Number(confidence.toFixed(2)),
      mappingStatus: status,
      mappedBy: 'SYSTEM_RULES',
    };
  }

  return {
    questionId: '',
    subjectCode: code,
    conceptTags: [],
    mappingConfidence: 0.0,
    mappingStatus: 'UNMAPPED',
    mappedBy: 'SYSTEM',
  };
}

/**
  Saves or updates curriculum mapping in D1 database for a question.
 */
export async function saveQuestionCurriculumMapping(
  env: Env,
  questionId: string,
  mapping: CurriculumMappingResult
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO question_curriculum_mappings (
      question_id, subject_code, unit_no, unit_name, topic_name, subtopic_name,
      concept_tags_json, mapping_confidence, mapping_status, mapped_by, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(question_id) DO UPDATE SET
      subject_code = excluded.subject_code,
      unit_no = excluded.unit_no,
      unit_name = excluded.unit_name,
      topic_name = excluded.topic_name,
      concept_tags_json = excluded.concept_tags_json,
      mapping_confidence = excluded.mapping_confidence,
      mapping_status = excluded.mapping_status,
      mapped_by = excluded.mapped_by,
      updated_at = CURRENT_TIMESTAMP`
  )
    .bind(
      questionId,
      mapping.subjectCode,
      mapping.unitNo || null,
      mapping.unitName || null,
      mapping.topicName || null,
      mapping.subtopicName || null,
      JSON.stringify(mapping.conceptTags || []),
      mapping.mappingConfidence,
      mapping.mappingStatus,
      mapping.mappedBy
    )
    .run();
}
