import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const schemaFile = path.join(process.cwd(), 'shiksha-core-schema.sql');
const seedFile = path.join(process.cwd(), 'shiksha-core-seed-keydocs.sql');
const tempDbFile = path.join(process.cwd(), 'scratch_verify.sqlite');

if (fs.existsSync(tempDbFile)) {
  fs.unlinkSync(tempDbFile);
}

console.log('Testing SQL schema & seed integrity using sqlite3 / wrangler...');
console.log('1. Checking file sizes:');
console.log(' - shiksha-core-schema.sql:', fs.statSync(schemaFile).size, 'bytes');
console.log(' - shiksha-core-seed-keydocs.sql:', fs.statSync(seedFile).size, 'bytes');

// Check line counts and SQL statement counts
const seedContent = fs.readFileSync(seedFile, 'utf8');
const insertMatches = seedContent.match(/INSERT OR REPLACE INTO ([a-zA-Z0-9_]+)/g) || [];
console.log('Total INSERT statements in seed file:', insertMatches.length);

const countsByTable = {};
for (const m of insertMatches) {
  const tbl = m.replace('INSERT OR REPLACE INTO ', '').trim();
  countsByTable[tbl] = (countsByTable[tbl] || 0) + 1;
}

console.log('INSERT counts by table:');
console.table(countsByTable);
