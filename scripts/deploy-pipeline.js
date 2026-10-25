import { execSync } from 'child_process';
import readline from 'readline';
import path from 'path';

function runCommand(command, desc) {
  console.log(`\n==================================================`);
  console.log(`🏃 Running: ${desc}...`);
  console.log(`==================================================\n`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`\n✅ ${desc} completed successfully!`);
    return true;
  } catch (error) {
    console.error(`\n❌ Error: ${desc} failed!`);
    return false;
  }
}

async function askPermission(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

async function runPipeline() {
  console.log('🤖 --- SHIKSHA SAHAYAK DEPLOYMENT PIPELINE ---');

  const stepSummary = {
    'Branch & Target Determination': 'PENDING',
    'Migration Safeguards Check': 'PENDING',
    'Production Build & Static Check': 'PENDING',
    'Local Preview Smoke Verification': 'PENDING',
    'User Authorization Gate': 'PENDING',
    'Cloudflare Pages Deployment': 'PENDING',
    'Scoped Cache Invalidation': 'PENDING',
    'Post-Deployment Live Verification': 'PENDING'
  };

  function printSummary(finalStatus) {
    console.log('\n==================================================');
    console.log('📋 DEPLOYMENT PIPELINE SUMMARY');
    console.log('==================================================');
    for (const [name, status] of Object.entries(stepSummary)) {
      let icon = '⏳';
      if (status === 'PASSED') icon = '✅';
      else if (status === 'SKIPPED') icon = 'ℹ️';
      else if (status === 'WARNING') icon = '⚠️';
      else if (status === 'FAILED') icon = '❌';
      console.log(`${icon} ${name.padEnd(35)}: ${status}`);
    }
    console.log('==================================================');
    console.log(`FINAL OUTCOME: ${finalStatus}\n`);
  }
  
  // 1. Detect active Git branch
  let currentBranch = 'unknown';
  try {
    currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch (e) {
    console.warn('⚠️ Could not determine active Git branch.');
  }

  console.log(`📌 Active Git Branch: ${currentBranch}`);

  // 2. Determine target Cloudflare Pages project based on branch
  let targetProject = '';
  let targetBranch = currentBranch;

  if (currentBranch === 'main') {
    targetProject = 'padhakuportal';
  } else if (currentBranch === '2.0') {
    targetProject = 'beta-padhakuportal';
  } else {
    stepSummary['Branch & Target Determination'] = 'FAILED';
    printSummary('ABORTED (Unauthorized Branch)');
    console.error(`❌ Deployment aborted: Branch '${currentBranch}' is not authorized for deployment. (Allowed: 'main' -> padhakuportal, '2.0' -> beta-padhakuportal).`);
    process.exit(1);
  }

  stepSummary['Branch & Target Determination'] = 'PASSED';
  console.log(`🎯 Deployment Target: Project [${targetProject}], Branch [${targetBranch}]`);

  // 3. Migration Safeguard Check
  const withMigrations = process.argv.includes('--with-migrations') || process.argv.includes('--apply-migrations');
  if (withMigrations) {
    console.log('\n🔒 Verifying remote database migration baseline status before deployment...');
    try {
      execSync('node scripts/safe-migrate-core.js --remote --check', { stdio: 'inherit' });
      stepSummary['Migration Safeguards Check'] = 'PASSED';
    } catch (err) {
      stepSummary['Migration Safeguards Check'] = 'FAILED';
      printSummary('ABORTED (Migration Baseline Unreconciled)');
      console.error('\n❌ Deployment Pipeline Aborted: Remote migrations cannot be executed because the production baseline is unreconciled.');
      console.error('Do not deploy with migrations until the one-time production reconciliation is completed and approved.');
      process.exit(1);
    }
  } else {
    console.log('🛡️ Migration Safeguard: Remote migrations are locked (fail-closed) and excluded from automated deployment.');
    stepSummary['Migration Safeguards Check'] = 'SKIPPED';
  }

  // 4. Build project (runs optimize images, sitemap, vite build, post-build, verify-build)
  if (!runCommand('npm run build', 'Production Build & Static Check')) {
    stepSummary['Production Build & Static Check'] = 'FAILED';
    printSummary('FAILED AT BUILD');
    console.error('❌ Build failed. Deployment aborted.');
    process.exit(1);
  }
  stepSummary['Production Build & Static Check'] = 'PASSED';

  // 5. Run local preview verification
  if (!runCommand('npm run verify:preview', 'Local Preview Smoke Verification')) {
    stepSummary['Local Preview Smoke Verification'] = 'FAILED';
    printSummary('FAILED AT PREVIEW VERIFICATION');
    console.error('❌ Preview verification failed. Deployment aborted.');
    process.exit(1);
  }
  stepSummary['Local Preview Smoke Verification'] = 'PASSED';

  console.log('\n🛡️ All pre-deployment verification checks have PASSED locally.');
  
  // 6. Prompt user for deployment permission (compliance with constraint)
  const confirmed = await askPermission(`❓ Proceed with Cloudflare Pages deployment to [${targetProject}] (${targetBranch})? (y/n): `);
  if (!confirmed) {
    stepSummary['User Authorization Gate'] = 'SKIPPED';
    printSummary('ABORTED BY USER');
    console.log('🛑 Deployment aborted by user command.');
    process.exit(0);
  }
  stepSummary['User Authorization Gate'] = 'PASSED';

  // 7. Run single targeted deployment (avoid unintended dual deployments)
  console.log(`\n🚀 Deploying to Cloudflare Pages (Project: ${targetProject}, Branch: ${targetBranch})...`);
  const deployCmd = `npx wrangler pages deploy dist --project-name=${targetProject} --branch ${targetBranch}`;
  if (!runCommand(deployCmd, `Cloudflare Pages Deployment (${targetProject})`)) {
    stepSummary['Cloudflare Pages Deployment'] = 'FAILED';
    printSummary('FAILED AT DEPLOYMENT COMMAND');
    console.error('❌ Cloudflare Pages deployment command failed.');
    process.exit(1);
  }
  stepSummary['Cloudflare Pages Deployment'] = 'PASSED';

  // 8. Run Scoped Cloudflare Cache Invalidation
  const purgeCmd = `node scripts/purge-cache.js --branch=${targetBranch} --project=${targetProject}`;
  const purgeOk = runCommand(purgeCmd, `Scoped Cloudflare Cache Purge (${targetProject})`);
  stepSummary['Scoped Cache Invalidation'] = purgeOk ? 'PASSED' : 'WARNING';

  // 9. Run post-deployment live smoke verification against target environment URLs
  const activeArtifactDir = process.env.ARTIFACT_DIR || path.join(process.cwd(), '.artifacts');
  const targetUrls = targetProject === 'beta-padhakuportal'
    ? 'https://beta-padhakuportal.pages.dev https://beta.shikshasahayak.org'
    : 'https://padhakuportal.pages.dev https://shikshasahayak.org';

  const liveCmd = `node scripts/verify-live.js --artifact-dir="${activeArtifactDir}" ${targetUrls}`;
  const liveOk = runCommand(liveCmd, `Post-Deployment Live Smoke Tests (${targetProject})`);

  if (!liveOk) {
    stepSummary['Post-Deployment Live Verification'] = 'FAILED';
    printSummary('DEPLOYMENT COMPLETED WITH LIVE VERIFICATION ERRORS');
    console.error('\n❌ CRITICAL: Deployment finished, but post-deployment live smoke verification FAILED!');
    console.error('Inspect live smoke logs and resolve issues before releasing.');
    process.exit(1);
  }

  stepSummary['Post-Deployment Live Verification'] = 'PASSED';
  printSummary('DEPLOYMENT FULLY COMPLETED AND VERIFIED');
  console.log('\n🎉 Pipeline complete! Deployment verified successfully.');
  process.exit(0);
}

runPipeline();
