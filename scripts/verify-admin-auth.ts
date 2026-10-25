// ============================================================
// SHIKSHA SAHAYAK OS: AUTOMATED ADMIN AUTH & TOKEN VERIFICATION SUITE
// Verifies Bearer Token Parsing, Role Resolution, 401/403 Enforcement
// ============================================================

import { getAuthenticatedUser, isAdmin, requireAdmin, requireAdminOrTeacher, verifyBetaAccess } from "../functions/lib/auth";

export interface AdminAuthCheckResult {
  scenario: string;
  expectedStatus: number | string;
  actualStatus: number | string;
  passed: boolean;
  details: string;
}

export async function runAdminAuthVerification(env: any = {}): Promise<AdminAuthCheckResult[]> {
  console.log("\n==================================================");
  console.log("   AUTOMATED ADMIN AUTHENTICATION & AUTHORIZATION SUITE");
  console.log("==================================================\n");

  const results: AdminAuthCheckResult[] = [];

  // 1. Missing Authorization Header -> requireAdmin returns 401
  const noAuthReq = new Request("https://shikshasahayak.org/api/admin/metrics");
  const noAuthRes = await requireAdmin(noAuthReq, env);
  results.push({
    scenario: "Unauthenticated Request -> 401 Unauthorized",
    expectedStatus: 401,
    actualStatus: noAuthRes.errorResponse?.status || 200,
    passed: noAuthRes.errorResponse?.status === 401,
    details: "Missing header returns 401",
  });

  // 2. Invalid Token -> requireAdmin returns 401
  const invalidTokenReq = new Request("https://shikshasahayak.org/api/admin/metrics", {
    headers: { "Authorization": "Bearer not-a-valid-token-xyz" }
  });
  const invalidRes = await requireAdmin(invalidTokenReq, env);
  results.push({
    scenario: "Invalid Token Request -> 401 Unauthorized",
    expectedStatus: 401,
    actualStatus: invalidRes.errorResponse?.status || 200,
    passed: invalidRes.errorResponse?.status === 401,
    details: "Invalid JWT returns 401",
  });

  // 3. Student Role Token -> requireAdmin returns 403 Forbidden
  const studentReq = new Request("https://shikshasahayak.org/api/admin/metrics", {
    headers: { "Authorization": "Bearer mock-token-student-student-123" }
  });
  const studentRes = await requireAdmin(studentReq, env);
  results.push({
    scenario: "Student Role Access to Admin Endpoint -> 403 Forbidden",
    expectedStatus: 403,
    actualStatus: studentRes.errorResponse?.status || 200,
    passed: studentRes.errorResponse?.status === 403,
    details: "Student receives 403 Forbidden for admin endpoint",
  });

  // 4. Teacher Role Token -> requireAdmin returns 403 Forbidden
  const teacherReq = new Request("https://shikshasahayak.org/api/admin/metrics", {
    headers: { "Authorization": "Bearer mock-token-teacher-teacher-456" }
  });
  const teacherAdminRes = await requireAdmin(teacherReq, env);
  results.push({
    scenario: "Teacher Role Access to Admin-Only Endpoint -> 403 Forbidden",
    expectedStatus: 403,
    actualStatus: teacherAdminRes.errorResponse?.status || 200,
    passed: teacherAdminRes.errorResponse?.status === 403,
    details: "Teacher receives 403 Forbidden for admin endpoint",
  });

  // 5. Teacher Role Token -> requireAdminOrTeacher succeeds
  const teacherAllowedRes = await requireAdminOrTeacher(teacherReq, env);
  results.push({
    scenario: "Teacher Role Access to Shared Teacher/Admin Endpoint -> 200 OK",
    expectedStatus: "Allowed",
    actualStatus: teacherAllowedRes.errorResponse ? `Denied ${teacherAllowedRes.errorResponse.status}` : "Allowed",
    passed: !teacherAllowedRes.errorResponse && teacherAllowedRes.user?.role === 'teacher',
    details: "Teacher successfully passes requireAdminOrTeacher",
  });

  // 6. Admin Role Token -> requireAdmin succeeds
  const adminReq = new Request("https://shikshasahayak.org/api/admin/metrics", {
    headers: { "Authorization": "Bearer mock-token-admin-dev-admin-uid" }
  });
  const adminRes = await requireAdmin(adminReq, env);
  results.push({
    scenario: "Admin Role Access to Admin Endpoint -> 200 OK",
    expectedStatus: "Allowed",
    actualStatus: adminRes.errorResponse ? `Denied ${adminRes.errorResponse.status}` : "Allowed",
    passed: !adminRes.errorResponse && adminRes.user?.role === 'admin',
    details: "Admin successfully passes requireAdmin",
  });

  // 7. Canonical Whitelist Email Check
  const adminEmails = [
    "contact@shikshasahayak.org",
    "tech@shikshasahayak.org",
    "team@shikshasahayak.org",
    "lead@shikshasahayak.org",
    "admin@shikshasahayak.org",
    "developer@shikshasahayak.org"
  ];
  const allEmailsPass = adminEmails.every(e => isAdmin(e));
  results.push({
    scenario: "Canonical Whitelist Admin Emails Verification",
    expectedStatus: "All true",
    actualStatus: allEmailsPass ? "All true" : "Some failed",
    passed: allEmailsPass,
    details: `Verified ${adminEmails.length} canonical admin emails`,
  });

  // 8. Insecure Substring & Domain Wildcard Rejection
  const insecureRejected = !isAdmin("random.ayush.fake@yahoo.com") && !isAdmin("admin.fake@gmail.com");
  const domainWildcardRejected = !isAdmin("random_student@shikshasahayak.org") && !isAdmin("guest@shikshasahayak.org");
  results.push({
    scenario: "Insecure Substring & Domain Wildcard Rejection",
    expectedStatus: "Rejected",
    actualStatus: insecureRejected && domainWildcardRejected ? "Rejected" : "False Positive Admin",
    passed: insecureRejected && domainWildcardRejected,
    details: "Rejects arbitrary emails and non-whitelisted @shikshasahayak.org addresses",
  });

  // 9. Unauthenticated Beta Gate Rejection (401)
  const betaGate401 = await verifyBetaAccess(null, env);
  const beta401Pass = betaGate401.allowed === false && betaGate401.response?.status === 401;
  results.push({
    scenario: "Unauthenticated Beta Endpoint Guard (401 Reject)",
    expectedStatus: 401,
    actualStatus: betaGate401.response?.status || 200,
    passed: beta401Pass,
    details: betaGate401.reason || "401 Unauthorized",
  });

  // 10. Admin Beta Entitlement Override
  const adminUser = adminRes.user;
  const betaGateAdmin = await verifyBetaAccess(adminUser, env);
  const betaAdminPass = betaGateAdmin.allowed === true;
  results.push({
    scenario: "Admin Global Beta Entitlement Access Override",
    expectedStatus: "allowed: true",
    actualStatus: `allowed: ${betaGateAdmin.allowed}`,
    passed: betaAdminPass,
    details: "Admin automatically receives beta entitlement access",
  });

  console.log("==================================================");
  console.log("     ADMIN AUTH VERIFICATION SUMMARY");
  console.log("==================================================");
  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} [${r.scenario}] -> ${r.passed ? 'PASS' : 'FAIL'} (${r.details})`);
  });
  console.log("==================================================\n");

  return results;
}

if (process.argv[1] && process.argv[1].includes('verify-admin-auth')) {
  runAdminAuthVerification();
}
