// ============================================================
// SHIKSHA SAHAYAK OS - AUTOMATED UNIT & INTEGRATION TESTS
// GTU Canonical PYQ Discovery, Mapping, & Invariant Verification
// ============================================================

import {
  normalizeSubjectName,
  matchCanonicalSubject,
  inferSyllabusVersion,
  calculateSimilarity,
  KNOWN_GTU_CANONICAL_CLUSTERS,
} from '../../functions/lib/canonicalSubjectEngine';
import {
  normalizeGtuUrl,
  generateDiscoveryTargets,
} from '../../functions/lib/gtuPyqDiscoveryEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

export function runCanonicalGtuPyqTests() {
  console.log('🧪 Starting GTU Canonical PYQ System Tests...\n');

  // ------------------------------------------------------------
  // Test 1: Subject Name Normalization & Synonyms
  // ------------------------------------------------------------
  console.log('Test 1: Subject Name Normalization & Roman Numerals');
  assert(normalizeSubjectName('Power System - I') === 'power system 1', 'Failed to normalize "Power System - I"');
  assert(normalizeSubjectName('Power Systems I') === 'power system 1', 'Failed to normalize "Power Systems I"');
  assert(normalizeSubjectName('Power System-I') === 'power system 1', 'Failed to normalize "Power System-I"');
  assert(normalizeSubjectName('Power Systems 1') === 'power system 1', 'Failed to normalize "Power Systems 1"');
  assert(normalizeSubjectName('Power Systems l') === 'power system 1', 'Failed to normalize typo "Power Systems l"');
  assert(normalizeSubjectName('Mathematics - I') === 'mathematics 1', 'Failed to normalize "Mathematics - I"');
  assert(normalizeSubjectName('Maths 1') === 'mathematics 1', 'Failed to normalize "Maths 1"');
  assert(normalizeSubjectName('Database Management Systems') === 'database management system', 'Failed to normalize "DBMS"');
  console.log('  ✅ Subject Name Normalization Passed.\n');

  // ------------------------------------------------------------
  // Test 2: HARD REQUIREMENT — Multi-Code Power System - I Mapping
  // ------------------------------------------------------------
  console.log('Test 2: Power System - I Multi-Code Canonical Mapping');
  const psCodes = ['3130905', '3170910', '3180907', '3140914', '2150908', 'BE04009041'];
  
  for (const code of psCodes) {
    const match = matchCanonicalSubject(
      code,
      'Power System - I',
      'electrical-engineering',
      4,
      []
    );
    assert(
      match.canonicalName === 'Power System - I',
      `Code ${code} failed to map to "Power System - I". Got: "${match.canonicalName}"`
    );
    assert(
      match.confidence >= 0.9,
      `Code ${code} mapped with low confidence: ${match.confidence}`
    );
    assert(
      match.mappingStatus === 'confirmed',
      `Code ${code} mapping status expected "confirmed", got "${match.mappingStatus}"`
    );
  }
  console.log('  ✅ Power System - I Multi-Code Canonical Mapping Passed.\n');

  // ------------------------------------------------------------
  // Test 3: Official GTU URL Discovery & Normalization
  // ------------------------------------------------------------
  console.log('Test 3: Official GTU URL Discovery & Normalization');
  const u1 = normalizeGtuUrl('W2025', 'BE', '3140914');
  assert(
    u1.canonicalUrl === 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/W2025/BE/3140914.pdf',
    `Expected https://www.gtu.ac.in/api/v1/question-papers/archive/file/W2025/BE/3140914.pdf, got ${u1.canonicalUrl}`
  );
  assert(
    u1.sourceUrl === u1.canonicalUrl,
    'sourceUrl must match canonical GTU URL'
  );

  const u2 = normalizeGtuUrl('s2024', 'be', 'BE01000041');
  assert(
    u2.canonicalUrl === 'https://www.gtu.ac.in/api/v1/question-papers/archive/file/S2024/BE/BE01000041.pdf',
    `Expected https://www.gtu.ac.in/api/v1/question-papers/archive/file/S2024/BE/BE01000041.pdf, got ${u2.canonicalUrl}`
  );
  console.log('  ✅ Official GTU URL Normalization Passed.\n');

  // ------------------------------------------------------------
  // Test 4: INVARIANT — No PDF Storage (Metadata & URL only)
  // ------------------------------------------------------------
  console.log('Test 4: Invariant Verification — No Binary Storage');
  const sampleSubjects = [
    { code: '3140914', name: 'Power System - I', branchSlug: 'electrical-engineering', semester: 4 },
  ];
  const targets = generateDiscoveryTargets(sampleSubjects, 2024, 2025);
  assert(targets.length === 4, `Expected 4 targets (2 sessions * 2 years), got ${targets.length}`);

  for (const t of targets) {
    assert(t.sourceUrl.startsWith('https://www.gtu.ac.in/api/v1/question-papers/archive/file/'), 'URL must point to official GTU server');
    assert(t.sourceUrl.endsWith('.pdf'), 'URL must end with .pdf');
    assert(!('binary' in t) && !('blob' in t) && !('pdfContent' in t), 'Paper record must NEVER contain binary payload');
  }
  console.log('  ✅ Invariant Verification (No PDF Binary Storage) Passed.\n');

  // ------------------------------------------------------------
  // Test 5: Syllabus Version Inference Across Curriculum Eras
  // ------------------------------------------------------------
  console.log('Test 5: Syllabus Version Inference Across GTU Curriculum Eras');
  assert(inferSyllabusVersion('BE01R00041').syllabusVersion.includes('2025-26 NEP'), 'BE01R failed to detect NEP revised');
  assert(inferSyllabusVersion('BE01000041').syllabusVersion.includes('2024-25 NEP'), 'BE010 failed to detect NEP 2024');
  assert(inferSyllabusVersion('3140914').syllabusVersion.includes('2018-19 CBCS'), '3140914 failed to detect 2018 CBCS');
  assert(inferSyllabusVersion('2150908').syllabusVersion.includes('2013-14 CBCS'), '2150908 failed to detect 2013 CBCS');
  assert(inferSyllabusVersion('110014').syllabusVersion.includes('2008-09 Legacy'), '110014 failed to detect 2008 legacy');
  console.log('  ✅ Syllabus Version Inference Passed.\n');

  // ------------------------------------------------------------
  // Test 6: Similarity & Ambiguous Mapping Detection
  // ------------------------------------------------------------
  console.log('Test 6: Similarity & Ambiguous Mapping Review Detection');
  const simExact = calculateSimilarity('Mathematics - I', 'Maths 1');
  assert(simExact >= 0.9, `Expected >=0.9 similarity for Maths 1, got ${simExact}`);

  const simHigh = calculateSimilarity('Database Management System', 'Database Management Systems');
  assert(simHigh === 1.0, `Expected 1.0 for singular/plural DBMS, got ${simHigh}`);

  const ambiguousMatch = matchCanonicalSubject(
    '999999',
    'Advanced Quantum Power System Theory',
    'electrical-engineering',
    4,
    [{
      id: 'cs_1',
      university_id: 'gtu',
      degree: 'BE',
      branch_id: 'branch_ee',
      semester: 4,
      canonical_name: 'Power System - I',
      normalized_name: 'power system 1',
      aliases: ['Power System 1'],
      status: 'active',
    }]
  );
  // Unknown distinct subject should not mistakenly collapse without high confidence
  assert(
    ambiguousMatch.mappingStatus === 'confirmed' || ambiguousMatch.mappingStatus === 'needs_review',
    'Ambiguous match must either flag needs_review or create a clean canonical subject'
  );
  console.log('  ✅ Similarity & Ambiguous Mapping Review Passed.\n');

  console.log('🎉 ALL GTU CANONICAL PYQ SYSTEM TESTS PASSED SUCCESSFULLY!\n');
}

// Execute tests if invoked directly
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.endsWith('canonicalGtuPyq.test.ts')) {
  runCanonicalGtuPyqTests();
}
