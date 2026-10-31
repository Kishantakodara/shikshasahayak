import {
  resolvePurgeConfig,
  buildPurgePayload,
  executePurge
} from './purge-cache.js';

interface OutboundCapture {
  url: string;
  options: any;
  parsedBody: any;
}

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASSED: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAILED: ${testName}`);
    if (detail) console.error(`     Detail: ${detail}`);
    throw new Error(`Test assertion failed: ${testName}`);
  }
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('🧪 RUNNING HARDENED CLOUDFLARE CACHE PURGE SCOPE TEST SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // Test 1: Branch 2.0 resolution & target scoping
  // -------------------------------------------------------------
  console.log('➡️ Test 1: Branch 2.0 target resolution');
  const betaConfig = resolvePurgeConfig({
    branch: '2.0',
    project: 'beta-SHIKSHASAHAYAK',
    zoneId: 'test-zone-beta-123',
    apiToken: 'test-token-beta-abc'
  });
  assert(betaConfig.valid === true, 'Beta configuration is recognized as valid');
  assert(betaConfig.environment === 'beta', 'Environment resolved to beta');
  assert(betaConfig.targetHostname === 'beta.shikshasahayak.org', 'Target hostname defaults strictly to beta.shikshasahayak.org');
  assert(betaConfig.payloadType === 'host_scoped', 'Payload type is host_scoped');
  assert(betaConfig.payload?.hosts?.[0] === 'beta.shikshasahayak.org', 'Payload hosts contains beta.shikshasahayak.org');
  assert(betaConfig.payload?.purge_everything === undefined, 'Beta payload does NOT have purge_everything property');

  // -------------------------------------------------------------
  // Test 2: Beta path never constructs purge_everything: true
  // -------------------------------------------------------------
  console.log('\n➡️ Test 2: Beta payload construction safeguards');
  const betaPayload = buildPurgePayload(betaConfig);
  assert(betaPayload.purge_everything === undefined, 'buildPurgePayload does not set purge_everything on beta');
  assert(Array.isArray(betaPayload.hosts), 'buildPurgePayload outputs hosts array');
  assert(betaPayload.hosts[0] === 'beta.shikshasahayak.org', 'hosts array strictly equals beta.shikshasahayak.org');

  // Tamper test: If beta configuration is illegally mutated with purge_everything: true
  let tamperCaught = false;
  try {
    const tamperedConfig = {
      ...betaConfig,
      payload: { purge_everything: true, hosts: ['beta.shikshasahayak.org'] }
    };
    buildPurgePayload(tamperedConfig as any);
  } catch (err: any) {
    if (err.message.includes('FATAL SAFETY VIOLATION')) {
      tamperCaught = true;
    }
  }
  assert(tamperCaught, 'FATAL SAFETY VIOLATION triggered if purge_everything: true injected into beta');

  // -------------------------------------------------------------
  // Test 3: Beta path strictly rejects production hostnames
  // -------------------------------------------------------------
  console.log('\n➡️ Test 3: Production hostnames rejected in beta configuration');
  const apexAttempt = resolvePurgeConfig({
    branch: '2.0',
    project: 'beta-SHIKSHASAHAYAK',
    zoneId: 'test-zone',
    apiToken: 'test-token',
    betaHostname: 'shikshasahayak.org'
  });
  assert(apexAttempt.valid === false, 'Apex domain shikshasahayak.org rejected for beta branch');
  assert(apexAttempt.error === 'FORBIDDEN_HOSTNAME', 'Error code is FORBIDDEN_HOSTNAME');

  const wwwAttempt = resolvePurgeConfig({
    branch: '2.0',
    project: 'beta-SHIKSHASAHAYAK',
    zoneId: 'test-zone',
    apiToken: 'test-token',
    betaHostname: 'www.shikshasahayak.org'
  });
  assert(wwwAttempt.valid === false, 'www.shikshasahayak.org rejected for beta branch');
  assert(wwwAttempt.error === 'FORBIDDEN_HOSTNAME', 'Error code is FORBIDDEN_HOSTNAME');

  // -------------------------------------------------------------
  // Test 4: Beta path rejects *.pages.dev hostnames against Zone API
  // -------------------------------------------------------------
  console.log('\n➡️ Test 4: *.pages.dev hostnames rejected against Zone API');
  const pagesDevAttempt = resolvePurgeConfig({
    branch: '2.0',
    project: 'beta-SHIKSHASAHAYAK',
    zoneId: 'test-zone',
    apiToken: 'test-token',
    betaHostname: 'beta-SHIKSHASAHAYAK.pages.dev'
  });
  assert(pagesDevAttempt.valid === false, 'pages.dev hostname rejected for Cloudflare Zone API');
  assert(pagesDevAttempt.error === 'FORBIDDEN_PAGES_DEV_HOSTNAME', 'Error code is FORBIDDEN_PAGES_DEV_HOSTNAME');

  // -------------------------------------------------------------
  // Test 5: Missing credentials produce safe, explicit result
  // -------------------------------------------------------------
  console.log('\n➡️ Test 5: Missing credentials safe handling');
  const missingCreds = resolvePurgeConfig({
    branch: '2.0',
    zoneId: '',
    apiToken: ''
  });
  assert(missingCreds.valid === false, 'Missing credentials marked as invalid');
  assert(missingCreds.error === 'MISSING_CREDENTIALS', 'Error code is MISSING_CREDENTIALS');

  let fetchCalledOnMissing = false;
  const mockFetchNoop = async () => {
    fetchCalledOnMissing = true;
    return new Response();
  };
  const execMissing = await executePurge(missingCreds, mockFetchNoop as any);
  assert(execMissing.success === false, 'Result success is false for missing credentials');
  assert(execMissing.skipped === true, 'Result explicitly marked as skipped');
  assert(!fetchCalledOnMissing, 'No HTTP request was dispatched when credentials missing');

  // -------------------------------------------------------------
  // Test 6: Unsupported branches do not trigger unintended purge
  // -------------------------------------------------------------
  console.log('\n➡️ Test 6: Unsupported branches rejected');
  const rogueBranch = resolvePurgeConfig({
    branch: 'feature/unreviewed-work',
    zoneId: 'test-zone',
    apiToken: 'test-token'
  });
  assert(rogueBranch.valid === false, 'Arbitrary feature branch rejected');
  assert(rogueBranch.error === 'UNAUTHORIZED_BRANCH', 'Error code is UNAUTHORIZED_BRANCH');

  // -------------------------------------------------------------
  // Test 7: Branch and project interchange prevention
  // -------------------------------------------------------------
  console.log('\n➡️ Test 7: Branch & Project interchange safety');
  const interchange1 = resolvePurgeConfig({
    branch: '2.0',
    project: 'SHIKSHASAHAYAK', // Production project illegally targeted from branch 2.0
    zoneId: 'test-zone',
    apiToken: 'test-token'
  });
  assert(interchange1.valid === false, 'Branch 2.0 targeting SHIKSHASAHAYAK project blocked');
  assert(interchange1.error === 'PROJECT_BRANCH_MISMATCH', 'Error code is PROJECT_BRANCH_MISMATCH');

  const interchange2 = resolvePurgeConfig({
    branch: 'main',
    project: 'beta-SHIKSHASAHAYAK', // Beta project illegally targeted from main
    zoneId: 'test-zone',
    apiToken: 'test-token'
  });
  assert(interchange2.valid === false, 'Branch main targeting beta project blocked');
  assert(interchange2.error === 'PROJECT_BRANCH_MISMATCH', 'Error code is PROJECT_BRANCH_MISMATCH');

  // -------------------------------------------------------------
  // Test 8: Outbound HTTP request inspection for Branch 2.0
  // -------------------------------------------------------------
  console.log('\n➡️ Test 8: Outbound request inspection on Beta execution');
  let outboundCapture: OutboundCapture | null = null;
  const mockSuccessFetch = async (url: string, options: any) => {
    outboundCapture = {
      url,
      options,
      parsedBody: JSON.parse(options.body)
    };
    return new Response(JSON.stringify({ success: true, result: { id: 'purge-op-1' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const execBeta = await executePurge(betaConfig, mockSuccessFetch as any);
  assert(execBeta.success === true, 'Beta purge succeeded with mock');
  assert(outboundCapture !== null, 'Outbound fetch was called');
  assert(outboundCapture!.url === 'https://api.cloudflare.com/client/v4/zones/test-zone-beta-123/purge_cache', 'Correct Cloudflare zone endpoint targeted');
  assert(outboundCapture!.options.headers['Authorization'] === 'Bearer test-token-beta-abc', 'Authorization header includes Bearer token');
  assert(Array.isArray(outboundCapture!.parsedBody.hosts), 'Body contains hosts array');
  assert(outboundCapture!.parsedBody.hosts.length === 1, 'Body hosts array has exactly 1 element');
  assert(outboundCapture!.parsedBody.hosts[0] === 'beta.shikshasahayak.org', 'Target host is strictly beta.shikshasahayak.org');
  assert(outboundCapture!.parsedBody.purge_everything === undefined, 'purge_everything is strictly absent from outbound payload');

  // -------------------------------------------------------------
  // Test 9: Failed API responses surfaced correctly
  // -------------------------------------------------------------
  console.log('\n➡️ Test 9: Failed API response handling');
  const mockFailedFetch = async () => {
    return new Response(JSON.stringify({
      success: false,
      errors: [{ code: 1000, message: 'Invalid purge request payload' }]
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const execFailed = await executePurge(betaConfig, mockFailedFetch as any);
  assert(execFailed.success === false, 'executePurge correctly returned success: false');
  assert(execFailed.error === 'CLOUDFLARE_API_ERROR', 'Error is CLOUDFLARE_API_ERROR');
  assert(execFailed.errors?.[0]?.code === 1000, 'Original API error code 1000 surfaced');
  assert(execFailed.errors?.[0]?.message === 'Invalid purge request payload', 'Original API error message surfaced');

  // -------------------------------------------------------------
  // Test 10: Plan limitation error (Code 1012) handling
  // -------------------------------------------------------------
  console.log('\n➡️ Test 10: Plan limitation (Code 1012) handling');
  const mockPlanLimitFetch = async () => {
    return new Response(JSON.stringify({
      success: false,
      errors: [{ code: 1012, message: "Purge by host is not available for your zone's plan" }]
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const execPlanLimit = await executePurge(betaConfig, mockPlanLimitFetch as any);
  assert(execPlanLimit.success === false, 'Success is false when plan does not support host purge');
  assert(execPlanLimit.skipped === true, 'Skipped is true to signal safe bypass');
  assert(execPlanLimit.code === 1012, 'Code 1012 captured');
  assert(execPlanLimit.error === 'PLAN_DOES_NOT_SUPPORT_HOST_PURGE', 'Error categorized as PLAN_DOES_NOT_SUPPORT_HOST_PURGE');
  assert(execPlanLimit.payload.purge_everything === undefined, 'No fallback to purge_everything: true occurred');

  // -------------------------------------------------------------
  // Test 11: Production main path correctly scopes to production
  // -------------------------------------------------------------
  console.log('\n➡️ Test 11: Production main path verification');
  const prodConfig = resolvePurgeConfig({
    branch: 'main',
    project: 'SHIKSHASAHAYAK',
    zoneId: 'test-zone-prod-456',
    apiToken: 'test-token-prod-xyz'
  });
  assert(prodConfig.valid === true, 'Production config is valid');
  assert(prodConfig.environment === 'production', 'Environment is production');

  let prodCapture: OutboundCapture | null = null;
  const mockProdFetch = async (url: string, options: any) => {
    prodCapture = {
      url,
      options,
      parsedBody: JSON.parse(options.body)
    };
    return new Response(JSON.stringify({ success: true, result: { id: 'purge-op-prod' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const execProd = await executePurge(prodConfig, mockProdFetch as any);
  assert(execProd.success === true, 'Production purge succeeds with mock');
  assert(prodCapture !== null, 'Production outbound fetch was called');
  assert(prodCapture!.url === 'https://api.cloudflare.com/client/v4/zones/test-zone-prod-456/purge_cache', 'Correct production zone endpoint targeted');
  assert(prodCapture!.parsedBody.purge_everything === true, 'Production payload uses purge_everything: true');

  // -------------------------------------------------------------
  // Test 12: Network exception handling
  // -------------------------------------------------------------
  console.log('\n➡️ Test 12: Network exception handling');
  const mockNetworkErrorFetch = async () => {
    throw new Error('ETIMEDOUT: Cloudflare API endpoint connection timed out');
  };

  const execNetworkError = await executePurge(betaConfig, mockNetworkErrorFetch as any);
  assert(execNetworkError.success === false, 'Network error sets success: false');
  assert(execNetworkError.error === 'NETWORK_EXCEPTION', 'Error categorized as NETWORK_EXCEPTION');
  assert(execNetworkError.message.includes('ETIMEDOUT'), 'Exception message captured');

  console.log('\n================================================================');
  console.log(`🎉 TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED CLEANLY`);
  console.log('================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED UNEXPECTEDLY:', err);
  process.exit(1);
});
