// ============================================================
// VERIFICATION TEST SUITE FOR BETA PORTAL AUTHENTICATION FLOW
// ============================================================

import { isEmailInBetaWhitelist } from '../src/utils/betaWhitelist';

async function runBetaAuthVerification() {
  console.log("==================================================");
  console.log("Running Beta Portal Authentication Flow Audits...");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  // Test 1: Admin & Internal Whitelist Auto-Approval
  console.log("\n[Test 1] Testing Admin / Internal Email Whitelist Verification...");
  const adminEmails = [
    'contact@shikshasahayak.org',
    'tech@shikshasahayak.org',
    'team@shikshasahayak.org',
    'developer@shikshasahayak.org'
  ];

  for (const email of adminEmails) {
    const isWhitelisted = await isEmailInBetaWhitelist(email);
    if (isWhitelisted) {
      console.log(`  ✓ Approved: ${email}`);
      passed++;
    } else {
      console.error(`  ✕ FAILED: ${email} should be whitelisted!`);
      failed++;
    }
  }

  // Test 2: Unapproved / Non-whitelisted Email Rejection
  console.log("\n[Test 2] Testing Non-Whitelisted Email Rejection...");
  const fakeEmail = 'unapproved_user_99999999@randomdomain.test';
  const isFakeWhitelisted = await isEmailInBetaWhitelist(fakeEmail);

  if (!isFakeWhitelisted) {
    console.log(`  ✓ Correctly Denied: ${fakeEmail} (NOT whitelisted)`);
    passed++;
  } else {
    console.error(`  ✕ FAILED: ${fakeEmail} should have been denied!`);
    failed++;
  }

  // Test 3: Null & Invalid Inputs
  console.log("\n[Test 3] Testing Invalid Input Safeguards...");
  const invalidChecks = [
    await isEmailInBetaWhitelist(null),
    await isEmailInBetaWhitelist(undefined),
    await isEmailInBetaWhitelist(""),
  ];

  if (invalidChecks.every(res => res === false)) {
    console.log("  ✓ Correctly rejected null, undefined, and empty string inputs");
    passed++;
  } else {
    console.error("  ✕ FAILED: Invalid input guard failed!");
    failed++;
  }

  console.log("\n--------------------------------------------------");
  console.log(`Verification Summary: ${passed} Passed, ${failed} Failed`);
  console.log("--------------------------------------------------");

  if (failed > 0) {
    process.exit(1);
  }
}

runBetaAuthVerification().catch((err) => {
  console.error("Fatal error during verification execution:", err);
  process.exit(1);
});
