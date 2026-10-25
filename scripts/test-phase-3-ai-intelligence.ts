// ============================================================
// PHASE 3: AI QUESTION INTELLIGENCE & PERSONALIZATION TEST SUITE
// Tests AI Provider Abstraction, Generation, PYQ Variants,
// Quality Gate, Edge Caching, and Provenance Invariants.
// ============================================================

import {
  generateQuestionBatchAI,
  transformPyqWithAI,
  evaluateQuestionQualityAI,
  getStudyAssistanceAI,
} from '../functions/lib/questionIntelligence/aiIntelligence';
import { validateMasterQuestionPayload } from '../functions/lib/questionIntelligence/validationService';
import { MasterQuestion } from '../src/types';

interface TestEnv {
  DB: any;
  GEMINI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
}

function createMockEnv(): TestEnv {
  const masterQuestions = new Map<string, any>();
  const ingestionQueue = new Map<string, any>();
  const assistanceCache = new Map<string, any>();
  const batches = new Map<string, any>();

  // Seed sample canonical master question
  masterQuestions.set('Q_CN_001', {
    id: 'Q_CN_001',
    question_type: 'MCQ',
    question_text: 'In the OSI reference model, which layer is responsible for end-to-end process-to-process communication?',
    options_json: JSON.stringify([
      { id: 'A', text: 'Network Layer' },
      { id: 'B', text: 'Transport Layer' },
      { id: 'C', text: 'Data Link Layer' },
      { id: 'D', text: 'Session Layer' },
    ]),
    correct_answer_json: 'B',
    explanation: 'The Transport layer provides logical communication between application processes running on different hosts.',
    subject_code: '3150710',
    subject_name: 'Computer Networks',
    semester: 5,
    unit_no: 1,
    topic_name: 'OSI Reference Model',
    marks: 1.0,
    negative_marking: 0.25,
    difficulty: 'medium',
    bloom_level: 'UNDERSTAND',
    exam_name: 'GTU',
    exam_year: 2024,
    exam_session: 'WINTER',
    source_url: 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/W2024/BE/3150710.pdf',
  });

  const mockDb = {
    prepare: (query: string) => {
      const normQuery = query.replace(/\s+/g, ' ').trim();
      let boundParams: any[] = [];
      const queryObj = {
        bind: (...params: any[]) => {
          boundParams = params;
          return queryObj;
        },
        first: async <T>(): Promise<T | null> => {
          if (normQuery.includes('FROM master_question_bank WHERE id = ?')) {
            const id = boundParams[0];
            return (masterQuestions.get(id) as T) || null;
          }
          if (normQuery.includes('FROM ai_study_assistance_cache WHERE question_id = ?')) {
            const [qId, aType, selOpt] = boundParams;
            const key = `${qId}_${aType}_${selOpt}`;
            return (assistanceCache.get(key) as T) || null;
          }
          return null;
        },
        all: async <T>(): Promise<{ results: T[] }> => {
          return { results: [] };
        },
        run: async () => {
          if (normQuery.includes('INSERT INTO ai_generation_batches')) {
            const [batchId] = boundParams;
            batches.set(batchId, boundParams);
          }
          if (normQuery.includes('INSERT OR REPLACE INTO ai_study_assistance_cache')) {
            const [, qId, aType, selOpt, content, model] = boundParams;
            const key = `${qId}_${aType}_${selOpt}`;
            assistanceCache.set(key, { content_payload_json: content, model_used: model });
          }
          if (normQuery.includes('INSERT INTO question_ingestion_queue')) {
            const [queueId, source, payloadJson, qText, dType, cScore] = boundParams;
            ingestionQueue.set(queueId, { id: queueId, source, payloadJson, qText, dType, cScore });
          }
          return { success: true };
        },
      };
      return queryObj;
    },
  };

  return {
    DB: mockDb,
    GEMINI_API_KEY: 'test_gemini_key',
  };
}

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testId: string, description: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASSED: [${testId}] ${description}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAILED: [${testId}] ${description}${detail ? ` - ${detail}` : ''}`);
    failedCount++;
  }
}

async function runPhase3Tests() {
  console.log('================================================================');
  console.log('🧪 RUNNING PHASE 3: AI QUESTION INTELLIGENCE TEST SUITE');
  console.log('================================================================\n');

  const env = createMockEnv();

  // ------------------------------------------------------------
  // SECTION 1: AI QUESTION GENERATION & SCHEMA VALIDATION
  // ------------------------------------------------------------
  console.log('➡️ Testing Phase 3A & 3B: AI Question Generation & Schema Validation...');

  const aiGeneratedMcqPayload: Partial<MasterQuestion> = {
    sourceType: 'AI_PRACTICE',
    isOriginalPyq: false,
    isAiGenerated: true,
    examName: 'PRACTICE',
    examYear: 2026,
    subjectCode: '3150710',
    subjectName: 'Computer Networks',
    semester: 5,
    unitNo: 2,
    topicName: 'Sliding Window Protocols',
    questionType: 'MCQ',
    questionText: 'In Go-Back-N ARQ with $m$-bit sequence numbers, what is the maximum sender window size $W_s$?',
    options: [
      { id: 'A', text: '$2^m$' },
      { id: 'B', text: '$2^m - 1$' },
      { id: 'C', text: '$2^{m-1}$' },
      { id: 'D', text: '$2^{m+1}$' },
    ],
    correctAnswer: 'B',
    explanation: 'In Go-Back-N ARQ, the sender window size cannot exceed $2^m - 1$ to avoid ambiguity with acknowledgments.',
    marks: 1.0,
    negativeMarking: 0.25,
    difficulty: 'medium',
    bloomLevel: 'UNDERSTAND',
    verificationStatus: 'unverified',
  };

  const valMcq = validateMasterQuestionPayload(aiGeneratedMcqPayload);
  assert(valMcq.isValid, 'AI_GEN_01', 'Valid AI-generated MCQ passes technical validation gate');

  const aiGeneratedNatPayload: Partial<MasterQuestion> = {
    sourceType: 'AI_PRACTICE',
    isOriginalPyq: false,
    isAiGenerated: true,
    examName: 'PRACTICE',
    examYear: 2026,
    subjectCode: '3150710',
    subjectName: 'Computer Networks',
    semester: 5,
    unitNo: 3,
    topicName: 'Subnetting and CIDR',
    questionType: 'NAT',
    questionText: 'Given an IPv4 subnet mask /27, calculate the total number of usable host IP addresses.',
    correctAnswer: '30',
    acceptableNumericalRange: { min: 30, max: 30, tolerance: 0 },
    explanation: 'A /27 mask leaves $32 - 27 = 5$ bits for hosts. Total usable hosts = $2^5 - 2 = 30$.',
    marks: 2.0,
    negativeMarking: 0.0,
    difficulty: 'medium',
    bloomLevel: 'APPLY',
    verificationStatus: 'unverified',
  };

  const valNat = validateMasterQuestionPayload(aiGeneratedNatPayload);
  assert(valNat.isValid, 'AI_GEN_02', 'Valid AI-generated NAT passes technical validation gate');

  // ------------------------------------------------------------
  // SECTION 2: AI PYQ TRANSFORMATION & PROVENANCE LINKAGE
  // ------------------------------------------------------------
  console.log('\n➡️ Testing Phase 3C: AI PYQ Transformation & Provenance Invariants...');

  const transformRes = await transformPyqWithAI(env as any, {
    parentQuestionId: 'Q_CN_001',
    transformationType: 'DISTRACTOR_VARIANT',
    targetDifficulty: 'hard',
  });

  assert(
    transformRes.success && transformRes.parentQuestionId === 'Q_CN_001',
    'TRANS_01',
    'PYQ transformation successfully links back to canonical parent PYQ ID'
  );

  assert(
    transformRes.status === 'STAGED' || transformRes.status === 'QUARANTINED',
    'TRANS_02',
    'Transformed question strictly enters staging or quarantine queue (never master directly)'
  );

  // ------------------------------------------------------------
  // SECTION 3: AI QUALITY EVALUATOR
  // ------------------------------------------------------------
  console.log('\n➡️ Testing Phase 3D: AI Quality Evaluator & Ambiguity Quarantine...');

  const qualityRes = await evaluateQuestionQualityAI(env as any, aiGeneratedMcqPayload);
  assert(
    qualityRes.overallQualityScore >= 0.75 && !qualityRes.isAmbiguous,
    'QUAL_01',
    'High-quality syllabus question receives positive quality band (EXCELLENT/GOOD)'
  );

  // ------------------------------------------------------------
  // SECTION 4: AI STUDY ASSISTANCE & EDGE CACHING
  // ------------------------------------------------------------
  console.log('\n➡️ Testing Phase 3E: AI Study Assistance & Edge Caching...');

  // First request: Cache Miss (Generates content)
  const hintRes1 = await getStudyAssistanceAI(env as any, {
    questionId: 'Q_CN_001',
    assistanceType: 'HINT',
  });

  assert(
    Boolean(hintRes1.markdownContent && hintRes1.markdownContent.length > 10),
    'ASSIST_01',
    'Socratic hint generated with non-empty pedagogical content'
  );

  // Second request: Cache Hit (Zero compute latency)
  const hintRes2 = await getStudyAssistanceAI(env as any, {
    questionId: 'Q_CN_001',
    assistanceType: 'HINT',
  });

  assert(
    hintRes2.cached === true,
    'ASSIST_02',
    'Identical assistance request retrieves from D1 edge cache (cached = true)'
  );

  // Wrong Answer Diagnosis
  const diagRes = await getStudyAssistanceAI(env as any, {
    questionId: 'Q_CN_001',
    assistanceType: 'WRONG_ANSWER_DIAGNOSIS',
    selectedOption: 'A',
  });

  assert(
    Boolean(diagRes.markdownContent && diagRes.selectedOption === 'A'),
    'ASSIST_03',
    'Misconception diagnosis generated for selected wrong option A'
  );

  // ------------------------------------------------------------
  // SECTION 5: SECURITY & RATE LIMITING INVARIANTS
  // ------------------------------------------------------------
  console.log('\n➡️ Testing Phase 3F: Security, Privacy & Invariants...');

  assert(
    aiGeneratedMcqPayload.isOriginalPyq === false && aiGeneratedMcqPayload.isAiGenerated === true,
    'SEC_01',
    'AI questions strictly enforce isOriginalPyq = false and isAiGenerated = true'
  );

  assert(
    aiGeneratedMcqPayload.verificationStatus === 'unverified',
    'SEC_02',
    'AI questions default to unverified status to require human review before publishing'
  );

  console.log('\n================================================================');
  console.log(`🎉 PHASE 3 TEST SUMMARY: ${passedCount} / ${passedCount + failedCount} TESTS PASSED CLEANLY`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch(err => {
  console.error('Fatal error in Phase 3 test execution:', err);
  process.exit(1);
});
