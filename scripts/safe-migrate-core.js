import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * ShikshaSahayak Core DB Migration & Seed Safeguard
 *
 * Enforces fail-closed protection on PADHAKU_CORE_DB to prevent:
 * 1. Accidental replay of Migration 0001 against existing production schema.
 * 2. Catastrophic replay of Migration 0002 (30,646 lines of bootstrap seed) which would
 *    clobber live operational tables (users, announcements, blogs, bug_reports).
 * 3. Execution of remote migrations while the production baseline is unreconciled.
 * 4. Cross-database execution of KeyDocs migrations on PADHAKU_CORE_DB.
 */

const CORE_BINDING = 'PADHAKU_CORE_DB';
const CORE_DB_NAME = 'shiksha-core-db';
const CORE_DB_ID = '4e63a42b-1271-462f-8271-da47cf659139';
const CORE_MIGRATIONS_DIR = path.join(process.cwd(), 'migrations-shiksha-core');

const REQUIRED_BASELINE_MIGRATIONS = [
  '0001_initial_schema.sql',
  '0002_seed_from_keydocs.sql',
  '0004_prep_zone_expansion.sql'
];

export function blockRemoteSeed() {
  console.error('\n================================================================================');
  console.error('🛑 FAIL-CLOSED SAFEGUARD TRIGGERED: REMOTE SEED REPLAY IS PERMANENTLY BLOCKED');
  console.error('================================================================================');
  console.error(`Target Database: ${CORE_BINDING} (${CORE_DB_NAME} - ${CORE_DB_ID})`);
  console.error('Reason:');
  console.error('  Replaying historical bootstrap seed data against production is strictly forbidden.');
  console.error('  The seed file contains 2,394 INSERT OR REPLACE statements.');
  console.error('  Replaying this file would overwrite live user profiles, active announcements,');
  console.error('  bug reports, and blog posts with stale historical data from September 2026.');
  console.error('\nProduction Protection: Command aborted. Zero remote changes made.');
  console.error('================================================================================\n');
  process.exit(1);
}

export function getLocalCoreMigrations() {
  if (!fs.existsSync(CORE_MIGRATIONS_DIR)) {
    return [];
  }
  return fs.readdirSync(CORE_MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
}

export function inspectCoreMigrationStatus(options = {}) {
  const localFiles = getLocalCoreMigrations();

  if (options.mockStatus === 'unreconciled') {
    return {
      isReconciled: false,
      appliedNames: [],
      missingBaseline: [...REQUIRED_BASELINE_MIGRATIONS],
      totalApplied: 0,
      localFiles
    };
  }

  if (options.mockStatus === 'reconciled') {
    return {
      isReconciled: true,
      appliedNames: [...REQUIRED_BASELINE_MIGRATIONS],
      missingBaseline: [],
      totalApplied: REQUIRED_BASELINE_MIGRATIONS.length,
      localFiles
    };
  }

  try {
    const cmd = `npx wrangler d1 execute ${CORE_BINDING} --remote --command="SELECT name FROM d1_migrations ORDER BY id ASC;" --json`;
    const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const parsed = JSON.parse(output);
    const rows = parsed[0]?.results || [];
    const appliedNames = rows.map((r) => r.name);

    const missingBaseline = REQUIRED_BASELINE_MIGRATIONS.filter(m => !appliedNames.includes(m));
    const isReconciled = missingBaseline.length === 0;

    return {
      isReconciled,
      appliedNames,
      missingBaseline,
      totalApplied: appliedNames.length,
      localFiles
    };
  } catch (err) {
    return {
      isReconciled: false,
      appliedNames: [],
      missingBaseline: [...REQUIRED_BASELINE_MIGRATIONS],
      totalApplied: 0,
      localFiles,
      error: err.message || String(err)
    };
  }
}

export function runSafeRemoteMigration(options = {}) {
  console.log('\n================================================================================');
  console.log('🛡️ PADHAKU CORE DB MIGRATION SAFEGUARD CHECK');
  console.log('================================================================================');
  console.log(`Database Binding: ${CORE_BINDING} (${CORE_DB_NAME})`);
  console.log(`Database ID:      ${CORE_DB_ID}`);
  console.log(`Migrations Dir:   ${CORE_MIGRATIONS_DIR}`);

  const status = inspectCoreMigrationStatus(options);

  console.log(`\nLocal migration files in ${path.basename(CORE_MIGRATIONS_DIR)}:`);
  for (const f of status.localFiles) {
    console.log(`  - ${f}`);
  }

  console.log(`\nRemote d1_migrations tracking rows found: ${status.totalApplied}`);
  if (status.appliedNames.length > 0) {
    for (const name of status.appliedNames) {
      console.log(`  ✓ ${name}`);
    }
  }

  if (!status.isReconciled) {
    console.error('\n================================================================================');
    console.error('🛑 FAIL-CLOSED SAFEGUARD TRIGGERED: REMOTE MIGRATION EXECUTION BLOCKED');
    console.error('================================================================================');
    console.error('Reason:');
    console.error(`  Production ${CORE_BINDING} baseline is UNRECONCILED in d1_migrations.`);
    console.error(`  Missing required baseline records (${status.missingBaseline.length}):`);
    for (const missing of status.missingBaseline) {
      console.error(`    ❌ ${missing}`);
    }
    console.error('\nHAZARD PREVENTED:');
    console.error('  Executing Wrangler migrations now would attempt to:');
    console.error('  1. Re-run 0001 against existing schema tables.');
    console.error('  2. CATASTROPHIC HAZARD: Re-run 2,394 INSERT OR REPLACE statements from 0002,');
    console.error('     overwriting live modified users, announcements, bug reports, and blogs!');
    console.error('  3. Re-run 0004 against existing Prep Zone schema.');
    console.error('\nREQUIRED ACTION BEFORE ANY FUTURE MIGRATION CAN RUN:');
    console.error('  Production requires a one-time baseline metadata reconciliation command');
    console.error('  during an authorized, explicitly approved maintenance window:');
    console.error('\n  [NOT EXECUTED — REQUIRES EXPLICIT APPROVAL]');
    console.error(`  npx wrangler d1 execute ${CORE_BINDING} --remote --command="INSERT INTO d1_migrations (name) VALUES ('0001_initial_schema.sql'), ('0002_seed_from_keydocs.sql'), ('0004_prep_zone_expansion.sql');"`);
    console.error('\nExecution aborted to protect production databases. Exit code: 1.');
    console.error('================================================================================\n');
    process.exit(1);
  }

  console.log('\n✅ Baseline migrations (0001, 0002, 0004) are verified reconciled in d1_migrations.');

  // Find unapplied migrations
  const unapplied = status.localFiles.filter(f => !status.appliedNames.includes(f));
  if (unapplied.length === 0) {
    console.log('✅ No new migrations to be applied. Database is up to date.');
    if (options.checkOnly) {
      process.exit(0);
    }
    return;
  }

  console.log(`\nPending new migrations (${unapplied.length}):`);
  for (const mig of unapplied) {
    console.log(`  * ${mig}`);
  }

  // Safety check: Ensure no historical baseline migration is in unapplied list
  const dangerousUnapplied = unapplied.filter(f => REQUIRED_BASELINE_MIGRATIONS.includes(f));
  if (dangerousUnapplied.length > 0) {
    console.error('\n🛑 CRITICAL ERROR: Historical baseline migration found in unapplied list:', dangerousUnapplied);
    console.error('Aborting execution.');
    process.exit(1);
  }

  if (options.checkOnly) {
    console.log('\n[Check Only Mode] Pre-flight verification passed.');
    process.exit(0);
  }

  // Require explicit confirmation flag for running future remote migrations
  const allowMigration = process.env.ALLOW_REMOTE_CORE_MIGRATION === 'true' || process.argv.includes('--confirm');
  if (!allowMigration) {
    console.error('\n⚠️ Execution halted: Remote migration apply requires explicit operator confirmation.');
    console.error('Set ALLOW_REMOTE_CORE_MIGRATION=true or pass --confirm to apply pending migrations.');
    process.exit(1);
  }

  console.log(`\n🚀 Applying ${unapplied.length} pending migration(s) to ${CORE_BINDING}...`);
  execSync(`npx wrangler d1 migrations apply ${CORE_BINDING} --remote`, { stdio: 'inherit' });
  console.log('\n✅ Remote migration applied successfully.');
}

// CLI entry point
const args = process.argv.slice(2);

if (args.includes('--block-seed-remote')) {
  blockRemoteSeed();
} else if (args.includes('--remote')) {
  const checkOnly = args.includes('--check');
  let mockStatus;
  if (args.includes('--mock-unreconciled')) mockStatus = 'unreconciled';
  if (args.includes('--mock-reconciled')) mockStatus = 'reconciled';
  runSafeRemoteMigration({ checkOnly, mockStatus });
} else if (args.includes('--check')) {
  let mockStatus;
  if (args.includes('--mock-unreconciled')) mockStatus = 'unreconciled';
  if (args.includes('--mock-reconciled')) mockStatus = 'reconciled';
  runSafeRemoteMigration({ checkOnly: true, mockStatus });
} else if (args.includes('--local')) {
  console.log(`Applying local migrations to ${CORE_BINDING}...`);
  execSync(`npx wrangler d1 migrations apply ${CORE_BINDING} --local`, { stdio: 'inherit' });
} else {
  // Default to check
  runSafeRemoteMigration({ checkOnly: true });
}
