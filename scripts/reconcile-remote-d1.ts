import { execSync } from 'child_process';
import * as fs from 'fs';

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export function runReconciliation() {
  console.log('Fetching remote D1 database inventory...');
  
  const highRiskTables = [
    'unified_users',
    'academic_profiles',
    'student_academic_profiles',
    'teacher_whitelist',
    'teacher_profiles',
    'user_beta_access',
    'user_entitlements',
    'universities',
    'branches',
    'subjects',
    'curriculum_nodes',
    'documents',
    'pyq_metadata',
    'syllabus_metadata',
    'material_metadata',
    'document_files',
    'assets',
    'document_relations',
    'document_stats',
    'content_factory_jobs',
    'content_factory_items',
    'blogs',
    'announcements',
    'admin_audit_logs'
  ];

  // Batch all PRAGMAs in one command
  const sqlCommand = highRiskTables.map(t => `PRAGMA table_info(${t});`).join(' ') + ` SELECT id, name, applied_at FROM d1_migrations ORDER BY id ASC;`;

  console.log('Executing batch schema inspection query on remote D1...');
  const outputStr = execSync(
    `npx wrangler d1 execute DB --remote --command="${sqlCommand}" --json`,
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  );

  const parsed = JSON.parse(outputStr);

  const schemaInventory: Record<string, ColumnInfo[]> = {};

  for (let i = 0; i < highRiskTables.length; i++) {
    const tableName = highRiskTables[i];
    const res = parsed[i]?.results || [];
    schemaInventory[tableName] = res;
  }

  const migrationsResult = parsed[parsed.length - 1]?.results || [];

  console.log(`Successfully inspected ${highRiskTables.length} high-risk tables.`);
  console.log(`Remote D1 has ${migrationsResult.length} applied migrations.`);
  const lastMig = migrationsResult[migrationsResult.length - 1];
  console.log(`Latest applied migration: ${lastMig?.name} (ID: ${lastMig?.id})`);

  // Write inventory markdown
  let inventoryMd = `# Remote D1 Schema Inventory & Migration State\n\n`;
  inventoryMd += `**Total Applied Migrations**: ${migrationsResult.length}\n`;
  inventoryMd += `**Latest Applied Migration**: \`${lastMig?.name}\` (Applied at: ${lastMig?.applied_at})\n\n`;

  inventoryMd += `## High-Risk Tables Schema Inventory\n\n`;
  for (const [t, cols] of Object.entries(schemaInventory)) {
    inventoryMd += `### Table: \`${t}\`\n`;
    inventoryMd += `| CID | Name | Type | NotNull | Default | PK |\n`;
    inventoryMd += `|---|---|---|---|---|---|\n`;
    for (const c of cols) {
      inventoryMd += `| ${c.cid} | \`${c.name}\` | \`${c.type}\` | ${c.notnull} | \`${c.dflt_value}\` | ${c.pk} |\n`;
    }
    inventoryMd += `\n`;
  }

  fs.writeFileSync('docs/remote-d1-schema-inventory.md', inventoryMd, 'utf-8');
  console.log('Wrote docs/remote-d1-schema-inventory.md');

  // Write migration state doc
  let migMd = `# Remote D1 Migration State\n\n`;
  migMd += `| Migration ID | Migration File | Applied At |\n`;
  migMd += `|---|---|---|\n`;
  for (const m of migrationsResult) {
    migMd += `| ${m.id} | \`${m.name}\` | ${m.applied_at} |\n`;
  }
  fs.writeFileSync('docs/remote-d1-migration-state.md', migMd, 'utf-8');
  console.log('Wrote docs/remote-d1-migration-state.md');

  return { schemaInventory, migrationsResult };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('reconcile-remote-d1.ts')) {
  runReconciliation();
}
