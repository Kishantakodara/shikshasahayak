import { execSync } from 'child_process';
import * as fs from 'fs';

interface ColumnInfo {
  name: string;
  type: string;
  notnull: number;
}

export function runFullReconciliation() {
  console.log('Reading master schema.sql and remote D1 PRAGMAs...');
  const schemaSql = fs.readFileSync('schema.sql', 'utf-8');

  // Extract CREATE TABLE statements from schema.sql
  const createTableRegex = /CREATE TABLE IF NOT EXISTS ([a-zA-Z0-9_]+) \(([\s\S]*?)\);/g;
  let match;
  const schemaTables: Record<string, string[]> = {};

  while ((match = createTableRegex.exec(schemaSql)) !== null) {
    const tableName = match[1];
    const body = match[2];
    const lines = body.split('\n');
    const cols: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('FOREIGN KEY') || trimmed.startsWith('PRIMARY KEY') || trimmed.startsWith('UNIQUE') || trimmed.startsWith('CHECK')) {
        continue;
      }
      const parts = trimmed.split(/\s+/);
      const colName = parts[0]?.replace(/[^a-zA-Z0-9_]/g, '');
      if (colName && !colName.toUpperCase().includes('CONSTRAINT')) {
        cols.push(colName.toLowerCase());
      }
    }
    schemaTables[tableName] = cols;
  }

  console.log(`Parsed ${Object.keys(schemaTables).length} tables from schema.sql.`);

  // Get list of tables from remote D1
  const tablesJsonStr = execSync(
    `npx wrangler d1 execute DB --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name ASC;" --json`,
    { encoding: 'utf-8' }
  );

  const tablesJson = JSON.parse(tablesJsonStr);
  const remoteTableNames: string[] = (tablesJson[0]?.results || []).map((r: any) => r.name);

  console.log(`Found ${remoteTableNames.length} tables in remote D1.`);

  const missingColumns: Array<{ table: string; column: string }> = [];

  // Check each table defined in schema.sql
  const batchPragmas: string[] = [];
  const activeTables: string[] = [];

  for (const t of Object.keys(schemaTables)) {
    if (remoteTableNames.includes(t)) {
      batchPragmas.push(`PRAGMA table_info(${t});`);
      activeTables.push(t);
    } else {
      console.warn(`[WARNING] Table in schema.sql missing from remote D1: ${t}`);
    }
  }

  console.log(`Executing batch PRAGMA inspection for ${activeTables.length} tables...`);
  const pragmaOutputStr = execSync(
    `npx wrangler d1 execute DB --remote --command="${batchPragmas.join(' ')}" --json`,
    { encoding: 'utf-8', maxBuffer: 20 * 1024 * 1024 }
  );

  const pragmaParsed = JSON.parse(pragmaOutputStr);

  for (let i = 0; i < activeTables.length; i++) {
    const tableName = activeTables[i];
    const remoteCols: any[] = pragmaParsed[i]?.results || [];
    const remoteColSet = new Set(remoteCols.map((c: any) => c.name.toLowerCase()));

    const expectedCols = schemaTables[tableName] || [];
    for (const col of expectedCols) {
      if (!remoteColSet.has(col)) {
        missingColumns.push({ table: tableName, column: col });
      }
    }
  }

  console.log(`Full scan complete. Found ${missingColumns.length} missing columns between schema.sql and remote D1:`);
  console.log(JSON.stringify(missingColumns, null, 2));

  return { schemaTables, remoteTableNames, missingColumns };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('reconcile-all-tables.ts')) {
  runFullReconciliation();
}
