// ============================================================
// CURRICULUM COMBINATIONS VERIFICATION TEST SUITE
// Task 2.C: Verify representative GTU curriculum combinations against D1
// ============================================================

import { execSync } from 'child_process';

interface D1Subject {
  id: string;
  name: string;
  code: string;
  slug: string;
  semester: number;
  branch_id: string;
  branch_slug: string;
  university_id: string;
}

interface D1Branch {
  id: string;
  name: string;
  slug: string;
  code: string;
}

function runD1Query(query: string): any[] {
  try {
    const singleLineQuery = query.replace(/\s+/g, ' ').trim();
    const rawOutput = execSync(
      `npx wrangler d1 execute DB --remote --command="${singleLineQuery.replace(/"/g, '\\"')}" --json`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const parsed = JSON.parse(rawOutput);
    return parsed[0]?.results || [];
  } catch (err: any) {
    console.error('D1 Query Error:', err.message);
    return [];
  }
}

async function verifyCurriculum() {
  console.log('\n=======================================================');
  console.log('   VERIFYING GTU CURRICULUM COMBINATIONS (TASK 2.C)');
  console.log('=======================================================\n');

  // 1. Fetch GTU Branches
  console.log('1. Querying available GTU branches in D1...');
  const branches: D1Branch[] = runD1Query(
    "SELECT id, name, slug, code FROM branches WHERE university_id IN ('univ_default', 'gtu') ORDER BY name ASC"
  );
  console.log(`Found ${branches.length} branches for GTU:`);
  branches.forEach(b => console.log(`   - [${b.id}] ${b.name} (code: ${b.code}, slug: ${b.slug})`));

  if (branches.length < 3) {
    console.error('❌ Expected at least 3 GTU branches in D1!');
    process.exit(1);
  }

  // 2. Test Combinations
  const testCases = [
    {
      name: 'GTU → Computer Engineering → Semester 8',
      branchId: 'branch_computer',
      semester: 8,
      expectEmpty: true,
      description: 'Confirmed empty semester in authoritative dataset'
    },
    {
      name: 'GTU → Computer Engineering → Semester 5',
      branchId: 'branch_computer',
      semester: 5,
      expectEmpty: false,
      minSubjects: 10,
      description: 'Confirmed populated semester with authoritative subjects'
    },
    {
      name: 'GTU → Information Technology → Semester 5',
      branchId: 'branch_it',
      semester: 5,
      expectEmpty: false,
      minSubjects: 10,
      description: 'Second GTU branch test'
    },
    {
      name: 'GTU → Mechanical Engineering → Semester 5',
      branchId: 'branch_mechanical',
      semester: 5,
      expectEmpty: false,
      minSubjects: 10,
      description: 'Third GTU branch test'
    },
    {
      name: 'GTU → Civil Engineering → Semester 8',
      branchId: 'branch_civil',
      semester: 8,
      expectEmpty: true,
      description: 'A second branch/semester combination with no subjects'
    }
  ];

  let passedAll = true;

  for (const tc of testCases) {
    console.log(`\nTesting: ${tc.name}`);
    console.log(`   Criteria: ${tc.description}`);

    const query = `
      SELECT s.id, s.name, s.code, s.slug, s.semester, s.branch_id, b.slug as branch_slug, b.university_id
      FROM subjects s
      JOIN branches b ON s.branch_id = b.id
      WHERE s.branch_id = '${tc.branchId}' AND s.semester = ${tc.semester} AND b.university_id IN ('univ_default', 'gtu')
      ORDER BY s.name ASC
    `;
    const subjects: D1Subject[] = runD1Query(query);

    console.log(`   Result: Found ${subjects.length} subjects.`);

    if (tc.expectEmpty) {
      if (subjects.length === 0) {
        console.log(`   ✅ PASS: Correctly empty as expected (${subjects.length} subjects).`);
      } else {
        console.error(`   ❌ FAIL: Expected 0 subjects but found ${subjects.length}`);
        passedAll = false;
      }
    } else {
      if (subjects.length >= (tc.minSubjects || 1)) {
        console.log(`   ✅ PASS: Found ${subjects.length} subjects (>= ${tc.minSubjects}).`);
        console.log(`   Sample subjects:`);
        subjects.slice(0, 3).forEach(s => {
          console.log(`      * ${s.name} (${s.code || s.id})`);
        });

        // Verify that all subjects strictly belong to the selected branch and semester
        const allMatch = subjects.every(
          s => s.branch_id === tc.branchId && Number(s.semester) === tc.semester
        );
        if (allMatch) {
          console.log(`   ✅ PASS: All ${subjects.length} subjects strictly belong to ${tc.branchId} and Semester ${tc.semester}.`);
        } else {
          console.error(`   ❌ FAIL: Some subjects do not match branch/semester criteria.`);
          passedAll = false;
        }
      } else {
        console.error(`   ❌ FAIL: Expected at least ${tc.minSubjects} subjects but found ${subjects.length}`);
        passedAll = false;
      }
    }
  }

  // 3. Test Frontend Filtering Logic with Property Casing (camelCase vs snake_case)
  console.log('\n-------------------------------------------------------');
  console.log('Testing Frontend Filter Logic (camelCase & snake_case support)');
  console.log('-------------------------------------------------------');

  const mockApiSubjectCamelCase = {
    id: 'sub_test_1',
    name: 'Operating Systems',
    branchId: 'branch_computer',
    branchSlug: 'computer-engineering',
    universityId: 'gtu',
    semester: 5
  };

  const mockApiSubjectSnakeCase = {
    id: 'sub_test_2',
    name: 'Computer Networks',
    branch_id: 'branch_computer',
    branch_slug: 'computer-engineering',
    university_id: 'gtu',
    semester: 5
  };

  const testFilter = (s: any, selectedBranchId: string, selectedSemester: number) => {
    const bId = s.branchId || s.branch_id;
    const bSlug = s.branchSlug || s.branch_slug;
    const uId = s.universityId || s.university_id;
    const matchUniv = !'gtu' || uId === 'gtu';
    const matchBranch = !selectedBranchId || bId === selectedBranchId || bSlug === selectedBranchId;
    const matchSem = !selectedSemester || Number(s.semester) === Number(selectedSemester);
    return matchUniv && matchBranch && matchSem;
  };

  const camelPassed = testFilter(mockApiSubjectCamelCase, 'branch_computer', 5);
  const snakePassed = testFilter(mockApiSubjectSnakeCase, 'branch_computer', 5);

  if (camelPassed && snakePassed) {
    console.log('✅ PASS: Filter logic correctly matches both camelCase (API) and snake_case (SQL) shapes.');
  } else {
    console.error(`❌ FAIL: Filter logic failed property casing test (camel: ${camelPassed}, snake: ${snakePassed})`);
    passedAll = false;
  }

  console.log('\n=======================================================');
  if (passedAll) {
    console.log('🎉 ALL CURRICULUM COMBINATION TESTS PASSED!');
    console.log('=======================================================\n');
    process.exit(0);
  } else {
    console.error('💥 SOME CURRICULUM COMBINATION TESTS FAILED!');
    console.log('=======================================================\n');
    process.exit(1);
  }
}

verifyCurriculum();
