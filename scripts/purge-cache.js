import { fileURLToPath } from 'url';
import path from 'path';
import { execSync } from 'child_process';

/**
 * ShikshaSahayak - Hardened Cloudflare Cache Purge Engine
 *
 * Implements strict environment isolation and hostname scoping:
 * 1. Branch 2.0 (Beta) ONLY invalidates configured beta hostname (default: beta.shikshasahayak.org).
 * 2. Purge everything (purge_everything: true) is STRICTLY FORBIDDEN on beta.
 * 3. Production apex (shikshasahayak.org) and *.pages.dev hostnames are STRICTLY FORBIDDEN on beta.
 * 4. Missing credentials fail safely without throwing unhandled exceptions or making unauthorized requests.
 * 5. Mismatched branches and project targets are aborted immediately.
 */

export function detectActiveBranch() {
  if (process.env.CF_PAGES_BRANCH) return process.env.CF_PAGES_BRANCH.trim();
  if (process.env.GIT_BRANCH) return process.env.GIT_BRANCH.trim();
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

export function resolvePurgeConfig(options = {}) {
  const branch = options.branch || detectActiveBranch();
  const project = options.project || (branch === '2.0' ? 'beta-padhakuportal' : (branch === 'main' ? 'padhakuportal' : ''));
  const zoneId = options.zoneId !== undefined ? options.zoneId : process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = options.apiToken !== undefined ? options.apiToken : process.env.CLOUDFLARE_API_TOKEN;
  const betaHostname = (options.betaHostname || process.env.BETA_HOSTNAME || 'beta.shikshasahayak.org').trim();
  const skipBetaPurge = options.skipBetaPurge !== undefined ? options.skipBetaPurge : (process.env.SKIP_BETA_PURGE === 'true');

  // Guard: Validate allowed branch
  if (branch !== '2.0' && branch !== 'main') {
    return {
      valid: false,
      error: 'UNAUTHORIZED_BRANCH',
      message: `Branch '${branch}' is not authorized for cache purge operations. (Allowed: '2.0' -> beta, 'main' -> production)`,
      branch,
      project
    };
  }

  // Guard: Validate branch vs project target alignment (prevent accidental interchange)
  if (branch === '2.0' && project && project !== 'beta-padhakuportal') {
    return {
      valid: false,
      error: 'PROJECT_BRANCH_MISMATCH',
      message: `Safety Violation: Branch '2.0' cannot be paired with project '${project}'.`,
      branch,
      project
    };
  }
  if (branch === 'main' && project && project !== 'padhakuportal') {
    return {
      valid: false,
      error: 'PROJECT_BRANCH_MISMATCH',
      message: `Safety Violation: Branch 'main' cannot be paired with project '${project}'.`,
      branch,
      project
    };
  }

  // Guard: Missing credentials check
  if (!zoneId || !apiToken || !zoneId.trim() || !apiToken.trim()) {
    return {
      valid: false,
      error: 'MISSING_CREDENTIALS',
      message: 'CLOUDFLARE_ZONE_ID or CLOUDFLARE_API_TOKEN is missing or empty. Cache purge safely skipped.',
      branch,
      project
    };
  }

  // Configuration for branch 2.0 (Beta)
  if (branch === '2.0') {
    // Security Guard: Forbid production hostnames
    const lowerBetaHost = betaHostname.toLowerCase();
    if (lowerBetaHost === 'shikshasahayak.org' || lowerBetaHost === 'www.shikshasahayak.org') {
      return {
        valid: false,
        error: 'FORBIDDEN_HOSTNAME',
        message: `Security Violation: Beta cache purge cannot target production hostname '${betaHostname}'.`,
        branch,
        project
      };
    }

    // Security Guard: Forbid *.pages.dev hostnames against custom domain zone API
    if (lowerBetaHost.endsWith('.pages.dev')) {
      return {
        valid: false,
        error: 'FORBIDDEN_PAGES_DEV_HOSTNAME',
        message: `Configuration Error: pages.dev hostnames ('${betaHostname}') are managed directly by Cloudflare Pages CDN and cannot be purged via Zone ID ${zoneId}.`,
        branch,
        project
      };
    }

    return {
      valid: true,
      environment: 'beta',
      branch: '2.0',
      project: 'beta-padhakuportal',
      zoneId: zoneId.trim(),
      apiToken: apiToken.trim(),
      targetHostname: lowerBetaHost,
      skipBetaPurge: Boolean(skipBetaPurge),
      payloadType: 'host_scoped',
      payload: { hosts: [lowerBetaHost] }
    };
  }

  // Configuration for branch main (Production)
  return {
    valid: true,
    environment: 'production',
    branch: 'main',
    project: 'padhakuportal',
    zoneId: zoneId.trim(),
    apiToken: apiToken.trim(),
    targetHostname: 'shikshasahayak.org',
    skipBetaPurge: false,
    payloadType: 'zone_wide',
    payload: { purge_everything: true }
  };
}

export function buildPurgePayload(targetConfig) {
  if (!targetConfig || !targetConfig.valid) {
    throw new Error('Cannot build purge payload from invalid target configuration.');
  }

  if (targetConfig.environment === 'beta') {
    // Assertive safeguard: Beta can NEVER use purge_everything
    if (targetConfig.payload?.purge_everything === true) {
      throw new Error('FATAL SAFETY VIOLATION: purge_everything: true cannot be generated for beta environment.');
    }
    // Assertive safeguard: Beta hosts cannot contain production apex
    if (targetConfig.payload?.hosts?.includes('shikshasahayak.org') || targetConfig.payload?.hosts?.includes('www.shikshasahayak.org')) {
      throw new Error('FATAL SAFETY VIOLATION: Production domains found in beta purge host list.');
    }
    return { hosts: [targetConfig.targetHostname] };
  }

  if (targetConfig.environment === 'production') {
    return { purge_everything: true };
  }

  throw new Error(`Unknown environment '${targetConfig.environment}'.`);
}

export async function executePurge(targetConfig, customFetch = fetch) {
  if (!targetConfig || !targetConfig.valid) {
    return {
      success: false,
      skipped: targetConfig?.error === 'MISSING_CREDENTIALS',
      error: targetConfig?.error || 'INVALID_CONFIG',
      message: targetConfig?.message || 'Invalid purge configuration.'
    };
  }

  if (targetConfig.environment === 'beta' && targetConfig.skipBetaPurge) {
    return {
      success: true,
      skipped: true,
      reason: 'SKIPPED_BY_CONFIG',
      message: 'Beta cache purge explicitly skipped by configuration.'
    };
  }

  const payload = buildPurgePayload(targetConfig);
  const url = `https://api.cloudflare.com/client/v4/zones/${targetConfig.zoneId}/purge_cache`;

  try {
    const response = await customFetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${targetConfig.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return {
        success: true,
        skipped: false,
        environment: targetConfig.environment,
        target: targetConfig.environment === 'beta' ? targetConfig.targetHostname : 'zone_all',
        payload,
        result
      };
    }

    // Inspect known Cloudflare API errors
    const errors = result.errors || [];
    const hasCode1012 = errors.some(e => e.code === 1012 || (e.message && e.message.includes('Purge by host is not available')));

    if (hasCode1012) {
      return {
        success: false,
        skipped: true,
        code: 1012,
        error: 'PLAN_DOES_NOT_SUPPORT_HOST_PURGE',
        message: "Cloudflare zone plan does not support Purge by Host (Enterprise feature required). Broad purge was strictly avoided to safeguard production.",
        payload,
        errors
      };
    }

    return {
      success: false,
      skipped: false,
      error: 'CLOUDFLARE_API_ERROR',
      message: 'Cloudflare cache purge API returned an error.',
      payload,
      errors
    };
  } catch (err) {
    return {
      success: false,
      skipped: false,
      error: 'NETWORK_EXCEPTION',
      message: err instanceof Error ? err.message : String(err),
      payload
    };
  }
}

export async function runPurgeCli(args = process.argv.slice(2)) {
  console.log('\n🧹 --- HARDENED CLOUDFLARE CACHE PURGE ---');
  
  let branchArg = '';
  let projectArg = '';
  let hostnameArg = '';
  let skipBeta = false;

  for (const arg of args) {
    if (arg.startsWith('--branch=')) branchArg = arg.split('=')[1];
    if (arg.startsWith('--project=')) projectArg = arg.split('=')[1];
    if (arg.startsWith('--hostname=')) hostnameArg = arg.split('=')[1];
    if (arg === '--skip-beta-purge') skipBeta = true;
  }

  const config = resolvePurgeConfig({
    branch: branchArg || undefined,
    project: projectArg || undefined,
    betaHostname: hostnameArg || undefined,
    skipBetaPurge: skipBeta || undefined
  });

  if (!config.valid) {
    if (config.error === 'MISSING_CREDENTIALS') {
      console.warn('⚠️ Notice: Cloudflare credentials (CLOUDFLARE_ZONE_ID / CLOUDFLARE_API_TOKEN) are not defined.');
      console.warn('   CDN cache purge was safely SKIPPED.');
      if (process.env.STRICT_CACHE_PURGE === 'true') {
        process.exit(1);
      }
      process.exit(0);
    }
    console.error(`❌ Cache Purge Aborted: ${config.message}`);
    process.exit(1);
  }

  console.log(`🎯 Environment: [${config.environment.toUpperCase()}] | Branch: [${config.branch}] | Project: [${config.project}]`);
  if (config.environment === 'beta') {
    console.log(`🔒 Target Hostname: [${config.targetHostname}] (Hostname-scoped invalidation)`);
  } else {
    console.log(`🌐 Target: Zone-wide CDN purge`);
  }

  const result = await executePurge(config);

  if (result.success) {
    if (result.skipped) {
      console.log(`ℹ️ ${result.message}`);
    } else {
      console.log(`✅ Success: Cache successfully purged for ${result.target}.`);
    }
    process.exit(0);
  } else {
    if (result.code === 1012) {
      console.warn(`⚠️ Warning: ${result.message}`);
      console.warn(`   Beta deployment relies on asset hashing and cache-busting headers. Production cache was NOT touched.`);
      process.exit(0);
    }
    console.error(`❌ Cache Purge Failed: ${result.message}`);
    if (result.errors) {
      console.error(JSON.stringify(result.errors, null, 2));
    }
    process.exit(1);
  }
}

// Auto-run if executed as CLI entry point
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  runPurgeCli();
}
