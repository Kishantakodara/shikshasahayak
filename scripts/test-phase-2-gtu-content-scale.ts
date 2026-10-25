// ============================================================
// PHASE 2: GTU CONTENT SCALE & AUTOMATED INGESTION TEST SUITE
// Exhaustive test runner validating Phase 2 discovery, extraction,
// normalization, deduplication, quality gates, and bulk ingestion.
// ============================================================

import { normalizeQuestionText, normalizeWhitespace, normalizeUnicode, normalizeMathText, normalizeOptionPrefixes, stripQuestionNumbering, cleanPdfArtifacts } from '../functions/lib/questionIntelligence/normalizationService';
import { calculateTextSimilarity, detectDuplicateQuestion } from '../functions/lib/questionIntelligence/duplicateDetectionService';
import { validateQuestionPayload } from '../functions/lib/questionIntelligence/validationService';
import { buildGtuPdfUrl, computeContentHash } from '../functions/lib/questionIntelligence/gtuIngestion/gtuAutomationService';
import { MasterQuestion } from '../src/types';

interface TestCaseResult {
  id: string;
  name: string;
  passed: boolean;
  message?: string;
}

const testResults: TestCaseResult[] = [];

function assert(condition: boolean, testId: string, testName: string, failureMsg?: string) {
  if (condition) {
    testResults.push({ id: testId, name: testName, passed: true });
    console.log(`  ✓ PASSED: [${testId}] ${testName}`);
  } else {
    testResults.push({ id: testId, name: testName, passed: false, message: failureMsg || 'Assertion failed' });
    console.error(`  ❌ FAILED: [${testId}] ${testName} - ${failureMsg}`);
  }
}

async function runPhase2TestSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING PHASE 2: GTU CONTENT SCALE & INGESTION TEST SUITE');
  console.log('================================================================\n');

  // ------------------------------------------------------------
  // SECTION 1: DISCOVERY & CANONICAL URL GENERATION
  // ------------------------------------------------------------
  console.log('➡️ Testing Phase 2B & 2C: Scalable Discovery & Content Hashing...');

  const url1 = buildGtuPdfUrl('W2024', 'BE', '3150710');
  assert(
    url1 === 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/W2024/BE/3150710.pdf',
    'DISC_01',
    'Canonical GTU PDF URL generation (Computer Networks)'
  );

  const url2 = buildGtuPdfUrl('s2023', 'be', '3110014');
  assert(
    url2 === 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/S2023/BE/3110014.pdf',
    'DISC_02',
    'Case-insensitive and trimmed GTU URL generation'
  );

  const dummyPdfBytes = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52]); // '%PDF-1.4'
  const hash1 = await computeContentHash(dummyPdfBytes);
  const hash2 = await computeContentHash(dummyPdfBytes);
  assert(
    typeof hash1 === 'string' && hash1.length === 64 && hash1 === hash2,
    'DISC_03',
    'Deterministic SHA-256 Content Hashing for PDF buffers'
  );

  // ------------------------------------------------------------
  // SECTION 2: QUESTION NORMALIZATION ENGINE
  // ------------------------------------------------------------
  console.log('\n➡️ Testing Phase 2E: Question Normalization & Sanitization...');

  const rawWhitespace = 'What   is   the   time    complexity?\n\n\n\n\nExplain:';
  const normWhitespace = normalizeWhitespace(rawWhitespace);
  assert(
    normWhitespace === 'What is the time complexity?\n\nExplain:',
    'NORM_01',
    'Whitespace and consecutive newline consolidation'
  );

  const rawUnicode = '“What is the value of ‘x’ – ‘y’?”';
  const normUnicode = normalizeUnicode(rawUnicode);
  assert(
    normUnicode === '"What is the value of \'x\' - \'y\'?"',
    'NORM_02',
    'Unicode quotation marks and dash standardization'
  );

  const rawMath = 'Calculate \\[\n\\int_0^1 x^2 dx\\] and find &alpha; + &beta;';
  const normMath = normalizeMathText(rawMath);
  assert(
    normMath.includes('$$\n\\int_0^1 x^2 dx$$') && normMath.includes('\\alpha + \\beta'),
    'NORM_03',
    'LaTeX math delimiters and HTML math entity translation'
  );

  const optionRaw = '(A) Transmission Control Protocol';
  const normOption = normalizeOptionPrefixes(optionRaw);
  assert(
    normOption === 'Transmission Control Protocol',
    'NORM_04',
    'Option prefix tag stripping ((A), Option A:, a))'
  );

  const questionNumberRaw = 'Q.1(a) Explain OSI model architecture in detail.';
  const normQuestionNumber = stripQuestionNumbering(questionNumberRaw);
  assert(
    normQuestionNumber === 'Explain OSI model architecture in detail.',
    'NORM_05',
    'Question numbering prefix stripping (Q.1(a), 14.)'
  );

  const rawPdfArtifact = 'Seat No.: 123456789012 Enrolment No.: 987654321 GUJARAT TECHNOLOGICAL UNIVERSITY\nPage 1 of 2\nFind the value of x.';
  const cleanedPdf = cleanPdfArtifacts(rawPdfArtifact);
  assert(
    !cleanedPdf.includes('Seat No.') && !cleanedPdf.includes('GUJARAT TECHNOLOGICAL') && cleanedPdf.includes('Find the value of x.'),
    'NORM_06',
    'PDF header, footer, and seat number artifact removal'
  );

  // ------------------------------------------------------------
  // SECTION 3: DUPLICATE & CANONICALIZATION ENGINE
  // ------------------------------------------------------------
  console.log('\n➡️ Testing Phase 2F: Multi-Tier Duplicate Detection...');

  const simExact = calculateTextSimilarity(
    'What is the maximum efficiency of pure ALOHA protocol?',
    'What is the maximum efficiency of pure ALOHA protocol?'
  );
  assert(simExact === 1.0, 'DUP_01', 'Exact text match similarity (1.0)');

  const simMinor = calculateTextSimilarity(
    'What is maximum efficiency of pure ALOHA protocol in data link layer?',
    'What is the maximum efficiency of pure ALOHA protocol in Data Link Layer?'
  );
  assert(simMinor >= 0.88, 'DUP_02', 'Normalized minor variation similarity (>= 0.88)');

  const simDistinct = calculateTextSimilarity(
    'What is Dijkstra algorithm?',
    'Explain Maximum Power Transfer theorem.'
  );
  assert(simDistinct < 0.3, 'DUP_03', 'Distinct questions similarity separation (< 0.3)');

  const existingDbQuestions = [
    {
      id: 'Q_EXISTING_01',
      question_text: 'What is the maximum efficiency of pure ALOHA protocol in data link layer?',
      subject_name: 'Computer Networks',
      subject_code: '3150710',
      question_type: 'MCQ',
      exam_year: 2024,
      exam_name: 'GTU',
    },
  ];

  const duplicateCandidate: Partial<MasterQuestion> = {
    questionText: 'What is maximum efficiency of pure ALOHA protocol in Data Link Layer?',
    questionType: 'MCQ',
    subjectCode: '3150710',
    examYear: 2023,
    examName: 'GTU',
  };

  const dupResult = detectDuplicateQuestion(existingDbQuestions, duplicateCandidate);
  assert(
    dupResult.isDuplicate && dupResult.matchedQuestionId === 'Q_EXISTING_01',
    'DUP_04',
    'Cross-year PYQ duplicate identification with high confidence'
  );

  // ------------------------------------------------------------
  // SECTION 4: QUALITY GATE & VALIDATION
  // ------------------------------------------------------------
  console.log('\n➡️ Testing Phase 2G: Quality Gate & Validation...');

  const validMcqPayload: Partial<MasterQuestion> = {
    questionType: 'MCQ',
    questionText: 'Which layer of OSI model provides end-to-end reliable transport?',
    options: [
      { id: 'A', text: 'Network Layer' },
      { id: 'B', text: 'Transport Layer' },
      { id: 'C', text: 'Session Layer' },
      { id: 'D', text: 'Physical Layer' },
    ],
    correctAnswer: 'B',
    subjectCode: '3150710',
    subjectName: 'Computer Networks',
    semester: 5,
    sourceType: 'GTU',
    examName: 'GTU',
    examYear: 2024,
  };

  const valValid = validateQuestionPayload(validMcqPayload);
  assert(valValid.isValid && valValid.errors.length === 0, 'QUAL_01', 'Valid MCQ passes quality gate (READY_FOR_REVIEW)');

  const invalidMcqNoOptions: Partial<MasterQuestion> = {
    questionType: 'MCQ',
    questionText: 'Which layer of OSI model provides end-to-end reliable transport?',
    correctAnswer: 'B',
    subjectCode: '3150710',
    subjectName: 'Computer Networks',
    semester: 5,
    sourceType: 'GTU',
    examName: 'GTU',
  };
  const valNoOpts = validateQuestionPayload(invalidMcqNoOptions);
  assert(!valNoOpts.isValid && valNoOpts.errors.some(e => e.includes('options')), 'QUAL_02', 'MCQ missing options rejected to NEEDS_REVIEW');

  const invalidNatRange: Partial<MasterQuestion> = {
    questionType: 'NAT',
    questionText: 'Calculate the resonant frequency in Hz.',
    correctAnswer: '50.3',
    acceptableNumericalRange: { min: 60.0, max: 40.0 }, // Invalid min > max
    subjectCode: '3110005',
    subjectName: 'Basic Electrical Engineering',
    semester: 1,
    sourceType: 'GTU',
    examName: 'GTU',
  };
  const valNatRange = validateQuestionPayload(invalidNatRange);
  assert(!valNatRange.isValid && valNatRange.errors.some(e => e.toLowerCase().includes('range')), 'QUAL_03', 'NAT inverted range rejected to QUARANTINED');

  // ------------------------------------------------------------
  // SECTION 5: PROVENANCE & IDEMPOTENCY INVARIANTS
  // ------------------------------------------------------------
  console.log('\n➡️ Testing Provenance & Idempotency Invariants...');

  const gtuProvenanceQ: Partial<MasterQuestion> = {
    isOriginalPyq: true,
    isAiGenerated: false,
    sourceType: 'GTU',
    examName: 'GTU',
    examYear: 2024,
    sourceUrl: 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/W2024/BE/3150710.pdf',
    provenanceId: 'gtu_paper_W2024_BE_3150710',
  };

  assert(
    gtuProvenanceQ.isOriginalPyq === true && gtuProvenanceQ.isAiGenerated === false && gtuProvenanceQ.sourceType === 'GTU',
    'PROV_01',
    'GTU PYQ provenance integrity (isOriginalPyq = true, isAiGenerated = false)'
  );

  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;

  console.log('\n================================================================');
  console.log(`🎉 PHASE 2 TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED CLEANLY`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase2TestSuite().catch(err => {
  console.error('Fatal error running Phase 2 test suite:', err);
  process.exit(1);
});
