import fs from 'fs';
import path from 'path';

const sqlFilePath = path.join(process.cwd(), 'data_exports', 'keydocs', 'keydocs_full_export.sql');
const tablesOutputDir = path.join(process.cwd(), 'data_exports', 'keydocs', 'tables');

if (!fs.existsSync(tablesOutputDir)) {
  fs.mkdirSync(tablesOutputDir, { recursive: true });
}

console.log('Reading export SQL file:', sqlFilePath);
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Regex for CREATE TABLE
const createTableRegex = /CREATE TABLE (?:IF NOT EXISTS )?["`]?([a-zA-Z0-9_]+)["`]?\s*\(([\s\S]*?)\);/gi;

const tableDefinitions = {};
let match;
while ((match = createTableRegex.exec(sqlContent)) !== null) {
  const tableName = match[1];
  const columnsBody = match[2];
  tableDefinitions[tableName] = {
    rawColumns: columnsBody.trim(),
    rows: []
  };
}

console.log(`Found ${Object.keys(tableDefinitions).length} table definitions in SQL dump.`);

// Parsing INSERT statements
// Format in wrangler d1 export: INSERT INTO "tableName" ("col1", "col2") VALUES (...), (...);
// Or standard INSERT INTO tableName VALUES (...);
const lines = sqlContent.split(/\r?\n/);
let currentInsertTable = null;
let insertCount = 0;

function parseSqlValues(valuesStr) {
  // Simple parser for comma-separated SQL value tuples: (1, 'str', NULL, ...)
  // For standard D1 dumps, let's parse tuples
  const tuples = [];
  let inString = false;
  let escape = false;
  let currentTuple = '';
  let inTuple = false;

  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];

    if (char === "'" && !escape) {
      inString = !inString;
      currentTuple += char;
    } else if (char === '\\' && inString) {
      escape = !escape;
      currentTuple += char;
    } else if (char === '(' && !inString && !inTuple) {
      inTuple = true;
      currentTuple = '';
    } else if (char === ')' && !inString && inTuple) {
      inTuple = false;
      tuples.push(currentTuple);
      currentTuple = '';
    } else if (inTuple) {
      currentTuple += char;
      if (escape) escape = false;
    }
  }

  return tuples.map(t => {
    // split by comma considering strings
    const cells = [];
    let curCell = '';
    let inStr = false;
    for (let j = 0; j < t.length; j++) {
      const c = t[j];
      if (c === "'" && t[j - 1] !== '\\') {
        inStr = !inStr;
        curCell += c;
      } else if (c === ',' && !inStr) {
        cells.push(formatCellValue(curCell.trim()));
        curCell = '';
      } else {
        curCell += c;
      }
    }
    cells.push(formatCellValue(curCell.trim()));
    return cells;
  });
}

function formatCellValue(val) {
  if (val === 'NULL' || val === 'null') return null;
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1).replace(/''/g, "'").replace(/\\'/g, "'");
  }
  const num = Number(val);
  if (!isNaN(num) && val !== '') return num;
  return val;
}

// Regex for INSERT line
const insertRegex = /^INSERT INTO ["`]?([a-zA-Z0-9_]+)["`]?\s*(?:\(([^)]+)\))?\s*VALUES\s*(.*);?$/i;

let multiLineInsert = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line || line.startsWith('--') || line.startsWith('/*')) continue;

  if (line.startsWith('INSERT INTO')) {
    const match = line.match(insertRegex);
    if (match) {
      const tableName = match[1];
      const colNames = match[2] ? match[2].split(',').map(c => c.trim().replace(/["`]/g, '')) : null;
      const valuesPart = match[3];

      if (!tableDefinitions[tableName]) {
        tableDefinitions[tableName] = { rawColumns: '', rows: [] };
      }
      if (colNames && !tableDefinitions[tableName].columns) {
        tableDefinitions[tableName].columns = colNames;
      }

      const rows = parseSqlValues(valuesPart);
      for (const r of rows) {
        if (colNames) {
          const rowObj = {};
          colNames.forEach((c, idx) => {
            rowObj[c] = r[idx];
          });
          tableDefinitions[tableName].rows.push(rowObj);
        } else {
          tableDefinitions[tableName].rows.push(r);
        }
      }
      insertCount += rows.length;
    }
  }
}

console.log(`Parsed ${insertCount} total inserted rows.`);

const summary = {
  exportDate: new Date().toISOString(),
  sourceDatabase: 'keydocs (00000000-0000-0000-0000-000000000001)',
  tables: {}
};

for (const [tableName, data] of Object.entries(tableDefinitions)) {
  summary.tables[tableName] = {
    rowCount: data.rows.length,
    columns: data.columns || []
  };

  // Write individual table JSON
  const tableFilePath = path.join(tablesOutputDir, `${tableName}.json`);
  fs.writeFileSync(tableFilePath, JSON.stringify(data.rows, null, 2), 'utf8');
}

const summaryPath = path.join(process.cwd(), 'data_exports', 'keydocs', 'keydocs_summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
console.log('Saved individual table files in data_exports/keydocs/tables/ and summary in keydocs_summary.json');
