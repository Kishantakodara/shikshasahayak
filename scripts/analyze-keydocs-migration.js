import fs from 'fs';
import path from 'path';

const keydocsSummary = JSON.parse(fs.readFileSync('data_exports/keydocs/keydocs_summary.json', 'utf8'));
const coreSchemaSql = fs.readFileSync('shiksha-core-schema.sql', 'utf8');

// Parse core tables from shiksha-core-schema.sql
const tableRegex = /CREATE TABLE IF NOT EXISTS ["`]?([a-zA-Z0-9_]+)["`]?\s*\(([\s\S]*?)\);/gi;
const coreTables = {};
let match;
while ((match = tableRegex.exec(coreSchemaSql)) !== null) {
  const tableName = match[1];
  const body = match[2];
  const colLines = body.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('--') && !l.startsWith('FOREIGN KEY') && !l.startsWith('PRIMARY KEY') && !l.startsWith('UNIQUE') && !l.startsWith('CHECK'));
  
  const cols = colLines.map(l => {
    const parts = l.split(/\s+/);
    return parts[0].replace(/["`]/g, '');
  });
  coreTables[tableName] = { cols, raw: body };
}

console.log('--- KEYDOCS TABLES WITH DATA ---');
const populatedTables = Object.entries(keydocsSummary.tables)
  .filter(([_, d]) => d.rowCount > 0)
  .sort((a, b) => b[1].rowCount - a[1].rowCount);

const auditReport = [];

for (const [tableName, meta] of populatedTables) {
  const tableDataPath = path.join('data_exports', 'keydocs', 'tables', `${tableName}.json`);
  let sampleData = [];
  if (fs.existsSync(tableDataPath)) {
    const raw = JSON.parse(fs.readFileSync(tableDataPath, 'utf8'));
    sampleData = raw.slice(0, 3);
  }

  // Find corresponding table in core DB
  let targetTableName = tableName;
  if (tableName === 'unified_users') targetTableName = 'users';
  if (tableName === 'master_question_bank') targetTableName = 'questions';

  const targetTable = coreTables[targetTableName];

  auditReport.push({
    sourceTable: tableName,
    rowCount: meta.rowCount,
    sourceColumns: meta.columns,
    targetTable: targetTable ? targetTableName : '(No direct table / absorbed or legacy)',
    targetColumns: targetTable ? targetTable.cols : [],
    sample: sampleData
  });
}

fs.writeFileSync('data_exports/keydocs/migration_mapping_audit.json', JSON.stringify(auditReport, null, 2), 'utf8');
console.log('Generated data_exports/keydocs/migration_mapping_audit.json');
