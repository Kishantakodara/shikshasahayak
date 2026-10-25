// ============================================================
// SHIKSHA SAHAYAK OS - AUTOMATED UNIT & INTEGRATION TESTS
// CSV Subject Master Parser, Normalization, & Student Filtering Tests
// ============================================================

import { parseSubjectMasterCsv, isValidSyllabusUrl, normalizeSemesterValue } from '../utils/csvSubjectMasterParser';
import { normalizeBranchName } from '../utils/branchNormalization';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

export function runSubjectMasterTests() {
  console.log('🧪 Starting CSV Subject Master Unit & Integration Tests...\n');

  // Test 1: Branch Normalization
  console.log('Test 1: Branch Normalization');
  const b1 = normalizeBranchName('INFORMATION TECHNOLOGY');
  assert(b1 !== null && b1.slug === 'it', 'Failed to normalize "INFORMATION TECHNOLOGY"');

  const b2 = normalizeBranchName('Computer Science Engineering');
  assert(b2 !== null && b2.slug === 'computer', 'Failed to normalize "Computer Science Engineering"');

  const b3 = normalizeBranchName('Electrical Engineering');
  assert(b3 !== null && b3.slug === 'electrical', 'Failed to normalize "Electrical Engineering"');

  const b4 = normalizeBranchName('Chemical Engineering');
  assert(b4 !== null && b4.slug === 'chemical', 'Failed to normalize "Chemical Engineering"');
  console.log('  ✅ Branch Normalization Passed.\n');

  // Test 2: Semester Normalization
  console.log('Test 2: Semester Normalization');
  assert(normalizeSemesterValue('Sem 3') === 3, 'Failed to parse "Sem 3"');
  assert(normalizeSemesterValue('Semester 5') === 5, 'Failed to parse "Semester 5"');
  assert(normalizeSemesterValue('1') === 1, 'Failed to parse "1"');
  assert(normalizeSemesterValue('Invalid') === null, 'Should return null for invalid sem');
  console.log('  ✅ Semester Normalization Passed.\n');

  // Test 3: Syllabus URL Validation
  console.log('Test 3: Syllabus URL Validation');
  assert(isValidSyllabusUrl('https://gtu.ac.in/syllabus/syllabus.aspx') === true, 'Valid HTTPS URL rejected');
  assert(isValidSyllabusUrl('javascript:alert(1)') === false, 'Malicious javascript: URL accepted');
  assert(isValidSyllabusUrl('') === true, 'Empty optional URL rejected');
  console.log('  ✅ Syllabus URL Validation Passed.\n');

  // Test 4: GTU Section-Header CSV Parsing
  console.log('Test 4: GTU Section-Header CSV Parsing');
  const sampleGtuCsv = `
INFORMATION TECHNOLOGY

Sem,WEF,Subject Code,Subject Full Name,Source
3,2025-26,BE03000081,Data Structures,https://gtu.ac.in/syllabus/syllabus.aspx
3,2025-26,BE03000091,Database Management System,https://gtu.ac.in/syllabus/syllabus.aspx
6,Not yet published (2024+ scheme),—,No qualifying WEF 2024+ curriculum published as of 06-Aug-2026,https://gtu.ac.in/syllabus/syllabus.aspx

MECHANICAL ENGINEERING

Sem,WEF,Subject Code,Subject Full Name,Source
3,2025-26,BE03000201,Engineering Thermodynamics,https://gtu.ac.in/syllabus/syllabus.aspx
  `;

  const parsed = parseSubjectMasterCsv(sampleGtuCsv);
  assert(parsed.totalRows === 4, `Expected 4 total rows, got ${parsed.totalRows}`);
  assert(parsed.newCount === 3, `Expected 3 new subjects, got ${parsed.newCount}`);
  assert(parsed.skippedCount === 1, `Expected 1 filler skipped row, got ${parsed.skippedCount}`);
  assert(parsed.branchesDetected.includes('Information Technology'), 'Missing IT branch in detection');
  assert(parsed.branchesDetected.includes('Mechanical Engineering'), 'Missing Mechanical branch in detection');
  console.log('  ✅ GTU Section-Header CSV Parsing Passed.\n');

  // Test 5: Intra-CSV Duplicate Detection
  console.log('Test 5: Intra-CSV Duplicate Detection');
  const duplicateCsv = `
Branch,Sem,Subject Code,Subject Name,Syllabus Link
Computer Engineering,3,CE301,Data Structures,https://gtu.ac.in/syllabus.pdf
Computer Engineering,3,CE301,Data Structures,https://gtu.ac.in/syllabus.pdf
  `;

  const dupResult = parseSubjectMasterCsv(duplicateCsv);
  assert(dupResult.newCount === 1, `Expected 1 new record, got ${dupResult.newCount}`);
  assert(dupResult.warningCount === 1, `Expected 1 duplicate warning, got ${dupResult.warningCount}`);
  console.log('  ✅ Intra-CSV Duplicate Detection Passed.\n');

  console.log('🎉 ALL SUBJECT MASTER UNIT & INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
}

// Execute tests if invoked directly
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.endsWith('csvSubjectMaster.test.ts')) {
  runSubjectMasterTests();
}
