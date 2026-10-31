// ============================================================
// REGRESSION TEST SUITE: QUESTION INTELLIGENCE ADMIN AUTHORIZATION
// Proves verified admin access succeeds and unauthorized/student access is denied.
// ============================================================

import { getAuthenticatedUser, isAdmin, requireAdmin, requireAdminOrTeacher } from '../functions/lib/auth';
import { onRequestGet as getQuestionStats } from '../functions/api/admin/questions/stats';
import { onRequestGet as getQuestionHealth } from '../functions/api/admin/questions/health';
import { onRequestGet as getQuestionAnalytics } from '../functions/api/admin/questions/analytics';
import { onRequestGet as getQuestionDemand } from '../functions/api/admin/questions/demand';
import { onRequestGet as getQuestionQuality } from '../functions/api/admin/questions/quality';
import { onRequestGet as getQuestionIssues } from '../functions/api/admin/questions/issues';
import { onRequestGet as getQuestionQueue } from '../functions/api/admin/questions/queue';
import { onRequestGet as getPipelineJobs } from '../functions/api/admin/question-pipeline/jobs';
import { onRequestGet as getPipelineStats } from '../functions/api/admin/question-pipeline/stats';
import { onRequestGet as getGTUStats } from '../functions/api/admin/gtu/stats';
import { onRequestGet as getGTUMatrix } from '../functions/api/admin/gtu/matrix';
import { onRequestGet as getGTUFailed } from '../functions/api/admin/gtu/failed';
import { onRequestGet as getAdaptiveAnalytics } from '../functions/api/admin/adaptive/analytics';
import { onRequestGet as getAdaptiveDemand } from '../functions/api/admin/adaptive/demand-loop';
import { onRequestGet as getContentCoverage } from '../functions/api/admin/content-operations/coverage';
import { onRequestGet as getBatchStatus } from '../functions/api/admin/content-operations/batch-status';

function createMockEnv() {
  const dummyRow = { count: 0, total: 0 };
  const mockDb = {
    prepare: (_sql: string) => ({
      bind: (..._args: any[]) => ({
        first: async () => dummyRow,
        all: async () => ({ results: [] }),
        run: async () => ({ success: true }),
      }),
      first: async () => dummyRow,
      all: async () => ({ results: [] }),
      run: async () => ({ success: true }),
    }),
  };
  return {
    DB: mockDb,
    ASSESSMENT_DB: mockDb,
  };
}

async function runAuthRegressionTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING QUESTION INTELLIGENCE ADMIN AUTH REGRESSION TESTS');
  console.log('================================================================\n');

  const env = createMockEnv();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${testName} - ${detail || ''}`);
      failed++;
    }
  }

  // ─── 1. Canonical isAdmin Unit Tests ─────────────────────────
  console.log('➡️ Testing Canonical Admin Identification Logic...');
  assert(isAdmin('lead@shikshasahayak.org'), '[AUTH_01] lead@shikshasahayak.org recognized as admin');
  assert(isAdmin('developer@shikshasahayak.org'), '[AUTH_02] developer@shikshasahayak.org recognized as admin');
  assert(isAdmin('admin@shikshasahayak.org'), '[AUTH_03] admin@shikshasahayak.org recognized as admin');
  assert(isAdmin('tech@shikshasahayak.org'), '[AUTH_04] Tech Admin email recognized as admin');
  assert(isAdmin(undefined, 'admin'), '[AUTH_05] Role admin recognized without email');
  assert(isAdmin(undefined, 'super_admin'), '[AUTH_06] Role super_admin recognized without email');
  assert(!isAdmin('student@example.com', 'student'), '[AUTH_07] Normal student rejected as non-admin');
  assert(!isAdmin(undefined, 'student'), '[AUTH_08] Anonymous student rejected as non-admin');

  // ─── 2. requireAdminOrTeacher Helper Tests ───────────────────
  console.log('\n➡️ Testing requireAdminOrTeacher Helper...');
  const adminReq = new Request('https://beta.shikshasahayak.org/api/admin/test', {
    headers: { Authorization: 'Bearer mock-token-admin-123' },
  });
  const adminRes = await requireAdminOrTeacher(adminReq, env);
  assert(adminRes.user !== null && !adminRes.errorResponse, '[HELPER_01] requireAdminOrTeacher allows verified admin');

  const teacherReq = new Request('https://beta.shikshasahayak.org/api/admin/test', {
    headers: { Authorization: 'Bearer mock-token-teacher-456' },
  });
  const teacherRes = await requireAdminOrTeacher(teacherReq, env);
  assert(teacherRes.user !== null && !teacherRes.errorResponse, '[HELPER_02] requireAdminOrTeacher allows verified teacher');

  const studentReq = new Request('https://beta.shikshasahayak.org/api/admin/test', {
    headers: { Authorization: 'Bearer mock-token-student-789' },
  });
  const studentRes = await requireAdminOrTeacher(studentReq, env);
  assert(studentRes.user === null && studentRes.errorResponse?.status === 403, '[HELPER_03] requireAdminOrTeacher denies normal student with 403');

  const anonReq = new Request('https://beta.shikshasahayak.org/api/admin/test');
  const anonRes = await requireAdminOrTeacher(anonReq, env);
  assert(anonRes.user === null && anonRes.errorResponse?.status === 403, '[HELPER_04] requireAdminOrTeacher denies unauthenticated request with 403');

  // ─── 3. Endpoint E2E Authorization Tests for Verified Admin ─
  console.log('\n➡️ Testing All Question Intelligence Endpoints (Positive Admin Tests)...');

  const endpoints = [
    { name: 'GET /api/admin/questions/stats', handler: getQuestionStats },
    { name: 'GET /api/admin/questions/health', handler: getQuestionHealth },
    { name: 'GET /api/admin/questions/analytics', handler: getQuestionAnalytics },
    { name: 'GET /api/admin/questions/demand', handler: getQuestionDemand },
    { name: 'GET /api/admin/questions/quality', handler: getQuestionQuality },
    { name: 'GET /api/admin/questions/issues', handler: getQuestionIssues },
    { name: 'GET /api/admin/questions/queue', handler: getQuestionQueue },
    { name: 'GET /api/admin/question-pipeline/jobs', handler: getPipelineJobs },
    { name: 'GET /api/admin/question-pipeline/stats', handler: getPipelineStats },
    { name: 'GET /api/admin/gtu/stats', handler: getGTUStats },
    { name: 'GET /api/admin/gtu/matrix', handler: getGTUMatrix },
    { name: 'GET /api/admin/gtu/failed', handler: getGTUFailed },
    { name: 'GET /api/admin/adaptive/analytics', handler: getAdaptiveAnalytics },
    { name: 'GET /api/admin/adaptive/demand-loop', handler: getAdaptiveDemand },
    { name: 'GET /api/admin/content-operations/coverage', handler: getContentCoverage },
    { name: 'GET /api/admin/content-operations/batch-status', handler: getBatchStatus },
  ];

  for (const ep of endpoints) {
    const req = new Request(`https://beta.shikshasahayak.org${ep.name.split(' ')[1]}`, {
      headers: { Authorization: 'Bearer mock-token-admin-system' },
    });
    const res = await (ep.handler as any)({ request: req, env, params: {} });
    assert(res.status === 200, `[ADMIN_ALLOW] ${ep.name} returns HTTP 200 for verified admin`, `Got status ${res.status}`);
  }

  // ─── 4. Negative Tests (Student & Anonymous Rejected) ────────
  console.log('\n➡️ Testing Negative Security Gates (Student & Anonymous Forbidden)...');

  for (const ep of endpoints) {
    // Student request
    const sReq = new Request(`https://beta.shikshasahayak.org${ep.name.split(' ')[1]}`, {
      headers: { Authorization: 'Bearer mock-token-student-attacker' },
    });
    const sRes = await (ep.handler as any)({ request: sReq, env, params: {} });
    assert(sRes.status === 403, `[STUDENT_DENY] ${ep.name} blocks student with HTTP 403`, `Got status ${sRes.status}`);

    // Anonymous request
    const aReq = new Request(`https://beta.shikshasahayak.org${ep.name.split(' ')[1]}`);
    const aRes = await (ep.handler as any)({ request: aReq, env, params: {} });
    assert(aRes.status === 403 || aRes.status === 401, `[ANON_DENY] ${ep.name} blocks anonymous request`, `Got status ${aRes.status}`);
  }

  console.log('\n================================================================');
  console.log(`🎉 AUTH REGRESSION SUMMARY: ${passed} / ${passed + failed} TESTS PASSED CLEANLY`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthRegressionTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
