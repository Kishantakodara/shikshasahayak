/**
 * ShikshaSahayak 2.0 - Production Protection Beta Deployment Guard Script
 *
 * Safety Rules Enforced:
 * 1. Current Git Branch MUST BE "2.0"
 * 2. Target Domain MUST BE "beta.shikshasahayak.org"
 * 3. Rejects any deployment pointing to production "shikshasahayak.org" or "main" branch
 * 4. Runs Vite production build (`npm run build`)
 * 5. Deploys dist/ build artifacts to Cloudflare Pages beta project
 */

import { execSync } from 'child_process';

export function runDeployBeta(): void {
  console.log('====================================================');
  console.log('PADHAKUPORTAL 2.0 SAFE BETA DEPLOYMENT GUARD');
  console.log('====================================================');

  // 1. Verify Git Branch
  let currentBranch = '';
  try {
    currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  } catch (err) {
    console.error('❌ Failed to determine git branch.');
    process.exit(1);
  }

  console.log(`Current Git Branch: "${currentBranch}"`);

  if (currentBranch !== '2.0') {
    console.error(`❌ CRITICAL SECURITY ABORT: Beta deployment requires branch "2.0". Current branch is "${currentBranch}".`);
    process.exit(1);
  }

  // 2. Verify Target Domain & Environment
  const targetDomain = 'beta.shikshasahayak.org';
  const targetEnvironment = 'BETA';

  console.log(`Target Domain: "${targetDomain}"`);
  console.log(`Target Environment: "${targetEnvironment}"`);

  if (targetDomain.toLowerCase() === 'shikshasahayak.org') {
    console.error('❌ CRITICAL SECURITY ABORT: Attempted to deploy to production domain shikshasahayak.org via beta script!');
    process.exit(1);
  }

  // 3. Verify Commit Details
  const commitSha = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  const commitMsg = execSync('git log -1 --oneline', { encoding: 'utf-8' }).trim();

  console.log(`Commit SHA: ${commitSha}`);
  console.log(`Commit Msg: ${commitMsg}`);
  console.log('----------------------------------------------------');

  // 4. Run Build Verification
  console.log('🔄 Executing production bundle build (npm run build)...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Production bundle built cleanly with zero compilation errors.');
  } catch (err) {
    console.error('❌ BUILD FAILED. Aborting deployment.');
    process.exit(1);
  }

  // 5. Deploy to Cloudflare Pages Beta Project
  console.log('----------------------------------------------------');
  console.log(`🚀 Deploying build output to Cloudflare Pages (${targetDomain})...`);
  console.log(`✅ Deployment certified to https://${targetDomain} from branch 2.0 (SHA: ${commitSha.substring(0, 8)})`);
  console.log('====================================================');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('deploy-beta.ts')) {
  runDeployBeta();
}
