import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';

/**
 * Automated Verification Suite for D1 Migration Safeguards
 *
 * Verifies:
 * 1. Core migration discovery excludes KeyDocs-only migration.
 * 2. KeyDocs migration ownership is correct and original SQL is preserved.
 * 3. The deployment pipeline refuses to execute remote migrations while baseline is unreconciled.
 * 4. No migration or command automatically replays the historical seed.
 */

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('\n================================================================================');
console.log('🧪 RUNNING D1 MIGRATION TRACKING SAFEGUARD VERIFICATION SUITE');
console.log('================================================================================\n');

try {
  // --------------------------------------------------------------------------
  // TEST SUITE 1: Core Migration Discovery Excludes KeyDocs Migration
  // --------------------------------------------------------------------------
  console.log('🔍 Test Suite 1: Core Migration Discovery Isolation');

  const coreDir = path.join(process.cwd(), 'migrations-shiksha-core');
  assert(fs.existsSync(coreDir), 'migrations-shiksha-core directory exists');

  const coreFiles = fs.readdirSync(coreDir).filter(f => f.endsWith('.sql'));
  assert(!coreFiles.includes('0003_update_gtu_pyq_links.sql'), '0003_update_gtu_pyq_links.sql is EXCLUDED from migrations-shiksha-core');
  assert(coreFiles.includes('0001_initial_schema.sql'), '0001_initial_schema.sql is present in Core');
  assert(coreFiles.includes('0002_seed_from_keydocs.sql'), '0002_seed_from_keydocs.sql is present in Core');
  assert(coreFiles.includes('0004_prep_zone_expansion.sql'), '0004_prep_zone_expansion.sql is present in Core');
  assert(coreFiles.length === 3, `Core directory contains exactly 3 SQL migration files (found: ${coreFiles.length})`);

  // Verify none of the Core migration files target KeyDocs-only GTU tables
  for (const file of coreFiles) {
    const content = fs.readFileSync(path.join(coreDir, file), 'utf8');
    assert(!content.includes('gtu_question_papers'), `${file} does NOT reference KeyDocs table 'gtu_question_papers'`);
    assert(!content.includes('gtu_paper_registry'), `${file} does NOT reference KeyDocs table 'gtu_paper_registry'`);
  }

  // Verify wrangler.toml configuration for PADHAKU_CORE_DB
  const wranglerContent = fs.readFileSync(path.join(process.cwd(), 'wrangler.toml'), 'utf8');
  assert(wranglerContent.includes('binding = "PADHAKU_CORE_DB"'), 'wrangler.toml defines PADHAKU_CORE_DB binding');
  assert(wranglerContent.includes('migrations_dir = "migrations-shiksha-core"'), 'PADHAKU_CORE_DB points to migrations-shiksha-core');

  // Verify Wrangler local migration discovery for PADHAKU_CORE_DB
  const coreWranglerList = execSync('npx wrangler d1 migrations list PADHAKU_CORE_DB --local', { encoding: 'utf8' });
  assert(coreWranglerList.includes('0001_initial_schema.sql'), 'Wrangler discovers 0001 for PADHAKU_CORE_DB');
  assert(coreWranglerList.includes('0002_seed_from_keydocs.sql'), 'Wrangler discovers 0002 for PADHAKU_CORE_DB');
  assert(coreWranglerList.includes('0004_prep_zone_expansion.sql'), 'Wrangler discovers 0004 for PADHAKU_CORE_DB');
  assert(!coreWranglerList.includes('0003_update_gtu_pyq_links.sql'), 'Wrangler excludes 0003 from PADHAKU_CORE_DB discovery');

  console.log('\n--------------------------------------------------------------------------------');

  // --------------------------------------------------------------------------
  // TEST SUITE 2: KeyDocs Migration Ownership & Integrity
  // --------------------------------------------------------------------------
  console.log('🔍 Test Suite 2: KeyDocs Migration Ownership & Integrity');

  const keydocsDir = path.join(process.cwd(), 'migrations-keydocs');
  assert(fs.existsSync(keydocsDir), 'migrations-keydocs directory exists');

  const keydocsFiles = fs.readdirSync(keydocsDir).filter(f => f.endsWith('.sql'));
  assert(keydocsFiles.includes('0014_update_gtu_pyq_links.sql'), '0014_update_gtu_pyq_links.sql exists in migrations-keydocs');
  assert(keydocsFiles.includes('0001_allow_semester_zero.sql'), '0001_allow_semester_zero.sql exists in migrations-keydocs');
  assert(keydocsFiles.includes('013_create_bug_reports.sql'), '013_create_bug_reports.sql exists in migrations-keydocs');
  assert(keydocsFiles.length === 15, `migrations-keydocs contains full sequence of 15 migrations (found: ${keydocsFiles.length})`);

  // Verify original SQL statements are preserved (NOT a no-op)
  const mig0014Sql = fs.readFileSync(path.join(keydocsDir, '0014_update_gtu_pyq_links.sql'), 'utf8');
  assert(mig0014Sql.includes('UPDATE gtu_question_papers'), 'Migration 0014 preserves authentic UPDATE gtu_question_papers statement');
  assert(mig0014Sql.includes('UPDATE gtu_paper_registry'), 'Migration 0014 preserves authentic UPDATE gtu_paper_registry statement');
  assert(mig0014Sql.includes('UPDATE document_files'), 'Migration 0014 preserves authentic UPDATE document_files statement');
  assert(mig0014Sql.includes('api/v1/question-papers/archive/file/'), 'Migration 0014 preserves target API URL replacement pattern');

  // Verify wrangler.toml configuration for DB
  assert(wranglerContent.includes('binding = "DB"'), 'wrangler.toml defines DB binding');
  assert(wranglerContent.includes('database_name = "keydocs"'), 'DB database_name is keydocs');
  assert(wranglerContent.includes('migrations_dir = "migrations-keydocs"'), 'DB binding points to migrations-keydocs');

  // Verify Wrangler local migration discovery for DB
  const dbWranglerList = execSync('npx wrangler d1 migrations list DB --local', { encoding: 'utf8' });
  assert(dbWranglerList.includes('0014_update_gtu_pyq_links.sql'), 'Wrangler discovers 0014 for DB (keydocs)');
  assert(!dbWranglerList.includes('0001_initial_schema.sql'), 'Wrangler excludes Core 0001 from DB');
  assert(!dbWranglerList.includes('0002_seed_from_keydocs.sql'), 'Wrangler excludes Core 0002 from DB');
  assert(!dbWranglerList.includes('0004_prep_zone_expansion.sql'), 'Wrangler excludes Core 0004 from DB');

  console.log('\n--------------------------------------------------------------------------------');

  // --------------------------------------------------------------------------
  // TEST SUITE 3: Deployment Pipeline & Fail-Closed Safeguard
  // --------------------------------------------------------------------------
  console.log('🔍 Test Suite 3: Deployment Pipeline & Remote Migration Safeguard');

  // Verify safe-migrate-core.js blocks remote migration when baseline is unreconciled
  const unreconciledRun = spawnSync('node', ['scripts/safe-migrate-core.js', '--check', '--mock-unreconciled'], { encoding: 'utf8' });
  assert(unreconciledRun.status === 1, 'safe-migrate-core exits with code 1 when baseline is unreconciled');
  assert(unreconciledRun.stderr.includes('FAIL-CLOSED SAFEGUARD TRIGGERED'), 'Outputs fail-closed safeguard alert');
  assert(unreconciledRun.stderr.includes('Missing required baseline records'), 'Explains missing required baseline records');
  assert(unreconciledRun.stderr.includes('INSERT INTO d1_migrations'), 'Provides exact manual reconciliation SQL marked as NOT EXECUTED');

  // Verify safe-migrate-core.js CANNOT be bypassed via flags (--confirm or ALLOW_REMOTE_CORE_MIGRATION=true)
  const bypassAttemptRun = spawnSync('node', ['scripts/safe-migrate-core.js', '--remote', '--confirm', '--mock-unreconciled'], {
    encoding: 'utf8',
    env: { ...process.env, ALLOW_REMOTE_CORE_MIGRATION: 'true' }
  });
  assert(bypassAttemptRun.status === 1, 'safe-migrate-core REFUSES to bypass baseline check even with --confirm and env var');
  assert(bypassAttemptRun.stderr.includes('FAIL-CLOSED SAFEGUARD TRIGGERED'), 'Bypass attempt triggers fail-closed block');

  // Verify deploy-pipeline.js refuses to deploy when migrations flag is invoked with unreconciled baseline
  const deployWithMigRun = spawnSync('node', ['scripts/deploy-pipeline.js', '--with-migrations'], { encoding: 'utf8' });
  assert(deployWithMigRun.status === 1, 'deploy-pipeline exits with code 1 when --with-migrations is passed with unreconciled baseline');
  assert(deployWithMigRun.stderr.includes('Deployment Pipeline Aborted: Remote migrations cannot be executed'), 'Deploy pipeline explicitly aborts and refuses remote migrations');

  // Verify package.json wiring
  const pkgContent = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8');
  const pkg = JSON.parse(pkgContent);
  assert(pkg.scripts['db:core:migrate:remote'] === 'node scripts/safe-migrate-core.js --remote', 'db:core:migrate:remote is routed through safe-migrate-core.js');

  console.log('\n--------------------------------------------------------------------------------');

  // --------------------------------------------------------------------------
  // TEST SUITE 4: Historical Seed Replay Protection
  // --------------------------------------------------------------------------
  console.log('🔍 Test Suite 4: Historical Seed Replay Protection');

  // Verify db:core:seed:remote fails closed immediately
  const seedRun = spawnSync('npm', ['run', 'db:core:seed:remote'], { encoding: 'utf8', shell: true });
  assert(seedRun.status === 1, 'npm run db:core:seed:remote exits with code 1');
  assert(seedRun.stderr.includes('REMOTE SEED REPLAY IS PERMANENTLY BLOCKED'), 'db:core:seed:remote prints permanent block warning');
  assert(seedRun.stderr.includes('2,394 INSERT OR REPLACE statements'), 'Explains hazard of overwriting live data with stale seed');

  assert(pkg.scripts['db:core:seed:remote'] === 'node scripts/safe-migrate-core.js --block-seed-remote', 'package.json maps db:core:seed:remote to fail-closed block');

  console.log('\n================================================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('================================================================================\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Test execution encountered an error:', error);
  process.exit(1);
}
