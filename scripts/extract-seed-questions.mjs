import fs from 'fs';
import path from 'path';

const exportPath = path.resolve('data_exports/keydocs/keydocs_full_export.sql');
const outputPath = path.resolve('scripts/seed-questions.sql');

const content = fs.readFileSync(exportPath, 'utf-8');
const lines = content.split('\n');

const insertStatements = lines.filter(line => line.startsWith('INSERT INTO "master_question_bank"'));
console.log(`Found ${insertStatements.length} question insert statements.`);

// Replace with INSERT OR IGNORE
const safeStatements = insertStatements.map(stmt => 
  stmt.replace('INSERT INTO "master_question_bank"', 'INSERT OR IGNORE INTO master_question_bank')
);

fs.writeFileSync(outputPath, safeStatements.join('\n'), 'utf-8');
console.log(`Wrote seed file to ${outputPath}`);
