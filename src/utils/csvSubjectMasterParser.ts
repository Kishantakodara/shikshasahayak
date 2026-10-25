// ============================================================
// SHIKSHA SAHAYAK OS - CSV SUBJECT MASTER PARSER & VALIDATOR
// Handles CSV row-based & section-header parsing, header fuzzy matching,
// branch/semester normalization, URL validation, and preview statistics.
// ============================================================

import { normalizeBranchName, CanonicalBranchInfo } from './branchNormalization';

export interface SubjectMasterRecord {
  rowNumber: number;
  branchRaw: string;
  branchCanonical: CanonicalBranchInfo;
  semester: number;
  wefYear?: string | null;
  subjectCode: string;
  subjectName: string;
  syllabusLink: string;
  status: 'new' | 'update' | 'unchanged' | 'skipped' | 'error';
  validationMessage?: string;
}

export interface CsvValidationError {
  rowNumber: number;
  branch?: string;
  subjectCode?: string;
  error: string;
}

export interface CsvValidationWarning {
  rowNumber: number;
  branch?: string;
  subjectCode?: string;
  warning: string;
}

export interface CsvParseResult {
  totalRows: number;
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  skippedCount: number;
  warningCount: number;
  errorCount: number;
  branchesDetected: string[];
  semestersDetected: number[];
  parsedRecords: SubjectMasterRecord[];
  errors: CsvValidationError[];
  warnings: CsvValidationWarning[];
}

/**
 * Standard CSV line splitter supporting quoted strings with commas inside.
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

/**
 * Normalizes semester input strings to an integer (0..12).
 */
export function normalizeSemesterValue(rawSem: string): number | null {
  if (!rawSem) return null;
  const match = rawSem.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    if (Number.isInteger(num) && num >= 0 && num <= 12) {
      return num;
    }
  }
  return null;
}

/**
 * Validates URLs ensuring HTTP/HTTPS scheme and no malicious scripts.
 */
export function isValidSyllabusUrl(urlStr: string): boolean {
  if (!urlStr) return true; // Optional URLs permitted with warning
  if (urlStr.toLowerCase().startsWith('javascript:')) return false;
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Header column matcher for flexible CSV aliases
 */
function findColumnIndex(headers: string[], aliases: string[]): number {
  const cleanHeaders = headers.map(h => h.trim().toLowerCase());
  for (const alias of aliases) {
    const cleanAlias = alias.toLowerCase();
    const idx = cleanHeaders.findIndex(h => h === cleanAlias || h.includes(cleanAlias));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Core CSV Subject Master Parser
 */
export function parseSubjectMasterCsv(csvText: string): CsvParseResult {
  const lines = csvText.split(/\r?\n/);
  let activeBranchRaw = '';
  let headers: string[] | null = null;

  let semCol = -1;
  let wefCol = -1;
  let codeCol = -1;
  let nameCol = -1;
  let sourceCol = -1;
  let branchCol = -1;

  const records: SubjectMasterRecord[] = [];
  const errors: CsvValidationError[] = [];
  const warnings: CsvValidationWarning[] = [];

  const branchesSet = new Set<string>();
  const semestersSet = new Set<number>();
  const seenSubjectKeys = new Map<string, SubjectMasterRecord>();

  let totalRowCount = 0;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx].trim();
    if (!line) continue;

    const cols = parseCsvLine(line);

    // 1. Detect Header line
    if (cols.some(c => /subject/i.test(c) || /code/i.test(c) || /sem/i.test(c))) {
      headers = cols;
      semCol = findColumnIndex(headers, ['sem', 'semester', 'sem no', 'semester number']);
      wefCol = findColumnIndex(headers, ['wef', 'wef year', 'academic year', 'regulation']);
      codeCol = findColumnIndex(headers, ['subject code', 'course code', 'code']);
      nameCol = findColumnIndex(headers, ['subject full name', 'subject name', 'subject', 'course name']);
      sourceCol = findColumnIndex(headers, ['source', 'syllabus link', 'syllabus url', 'syllabus']);
      branchCol = findColumnIndex(headers, ['branch', 'department', 'engineering branch', 'branch name']);
      continue;
    }

    // 2. Detect Section Branch Header line (e.g. "INFORMATION TECHNOLOGY", "COMPUTER SCIENCE ENGINEERING")
    if (cols.length === 1 || (cols.length > 1 && cols.slice(1).every(c => !c))) {
      const candidateBranch = cols[0].trim();
      const norm = normalizeBranchName(candidateBranch);
      if (norm) {
        activeBranchRaw = candidateBranch;
        continue;
      }
    }

    // Skip if headers haven't been detected yet
    if (!headers || (codeCol === -1 && nameCol === -1)) {
      // Check if line itself is a standalone branch title
      const norm = normalizeBranchName(line);
      if (norm) {
        activeBranchRaw = line;
      }
      continue;
    }

    totalRowCount++;

    // Extract row attributes
    const rawBranch = branchCol !== -1 && cols[branchCol] ? cols[branchCol] : activeBranchRaw;
    const rawSem = semCol !== -1 ? cols[semCol] : '';
    const rawWef = wefCol !== -1 ? cols[wefCol] : null;
    const rawCode = codeCol !== -1 ? cols[codeCol] : '';
    const rawName = nameCol !== -1 ? cols[nameCol] : '';
    const rawSource = sourceCol !== -1 ? cols[sourceCol] : '';

    const rowNum = lineIdx + 1;

    // Check for filler/unpublished rows (e.g. "No qualifying WEF 2024+ curriculum published")
    if (rawCode === '—' || rawCode === '-' || rawName.includes('No qualifying WEF') || rawName.includes('Not yet published')) {
      records.push({
        rowNumber: rowNum,
        branchRaw: rawBranch,
        branchCanonical: normalizeBranchName(rawBranch) || { id: 'unknown', slug: 'unknown', name: rawBranch, shortName: 'UNK' },
        semester: normalizeSemesterValue(rawSem) || 0,
        subjectCode: rawCode,
        subjectName: rawName,
        syllabusLink: rawSource,
        status: 'skipped',
        validationMessage: 'Filler / Unpublished curriculum entry'
      });
      continue;
    }

    // Validation 1: Branch
    const branchCanonical = normalizeBranchName(rawBranch);
    if (!branchCanonical) {
      errors.push({
        rowNumber: rowNum,
        branch: rawBranch,
        subjectCode: rawCode,
        error: `Unknown engineering branch: "${rawBranch || 'Missing Branch'}"`
      });
      continue;
    }
    branchesSet.add(branchCanonical.name);

    // Validation 2: Semester
    const sem = normalizeSemesterValue(rawSem);
    if (sem === null) {
      errors.push({
        rowNumber: rowNum,
        branch: branchCanonical.name,
        subjectCode: rawCode,
        error: `Invalid semester value: "${rawSem}"`
      });
      continue;
    }
    semestersSet.add(sem);

    // Validation 3: Subject Code
    const cleanCode = rawCode.trim().toUpperCase();
    if (!cleanCode) {
      errors.push({
        rowNumber: rowNum,
        branch: branchCanonical.name,
        error: `Missing Subject Code`
      });
      continue;
    }

    // Validation 4: Subject Name
    const cleanName = rawName.trim();
    if (!cleanName) {
      errors.push({
        rowNumber: rowNum,
        branch: branchCanonical.name,
        subjectCode: cleanCode,
        error: `Missing Subject Name`
      });
      continue;
    }

    // Validation 5: Syllabus Link
    const cleanSource = rawSource.trim();
    if (cleanSource && !isValidSyllabusUrl(cleanSource)) {
      errors.push({
        rowNumber: rowNum,
        branch: branchCanonical.name,
        subjectCode: cleanCode,
        error: `Invalid Syllabus URL: "${cleanSource}"`
      });
      continue;
    }
    if (!cleanSource) {
      warnings.push({
        rowNumber: rowNum,
        branch: branchCanonical.name,
        subjectCode: cleanCode,
        warning: `Missing syllabus link for subject "${cleanName}"`
      });
    }

    // Duplicate Check within same CSV (branch + semester + subjectCode)
    const uniqueKey = `${branchCanonical.slug}:${sem}:${cleanCode}`;
    if (seenSubjectKeys.has(uniqueKey)) {
      const existing = seenSubjectKeys.get(uniqueKey)!;
      if (existing.subjectName === cleanName) {
        warnings.push({
          rowNumber: rowNum,
          branch: branchCanonical.name,
          subjectCode: cleanCode,
          warning: `Duplicate row detected at line ${rowNum} matching line ${existing.rowNumber}`
        });
        continue;
      } else {
        errors.push({
          rowNumber: rowNum,
          branch: branchCanonical.name,
          subjectCode: cleanCode,
          error: `Conflicting subject name "${cleanName}" vs "${existing.subjectName}" at line ${existing.rowNumber}`
        });
        continue;
      }
    }

    const rec: SubjectMasterRecord = {
      rowNumber: rowNum,
      branchRaw: rawBranch,
      branchCanonical,
      semester: sem,
      wefYear: rawWef,
      subjectCode: cleanCode,
      subjectName: cleanName,
      syllabusLink: cleanSource,
      status: 'new'
    };

    seenSubjectKeys.set(uniqueKey, rec);
    records.push(rec);
  }

  const newCount = records.filter(r => r.status === 'new').length;
  const skippedCount = records.filter(r => r.status === 'skipped').length;

  return {
    totalRows: totalRowCount,
    newCount,
    updatedCount: 0,
    unchangedCount: 0,
    skippedCount,
    warningCount: warnings.length,
    errorCount: errors.length,
    branchesDetected: Array.from(branchesSet),
    semestersDetected: Array.from(semestersSet).sort((a, b) => a - b),
    parsedRecords: records,
    errors,
    warnings
  };
}

/**
 * Converts error array into a downloadable CSV string for administrative review
 */
export function generateErrorCsvReport(errors: CsvValidationError[], warnings: CsvValidationWarning[]): string {
  let csv = 'Row Number,Level,Branch,Subject Code,Description\n';
  errors.forEach(e => {
    csv += `"${e.rowNumber}","ERROR","${e.branch || ''}","${e.subjectCode || ''}","${e.error.replace(/"/g, '""')}"\n`;
  });
  warnings.forEach(w => {
    csv += `"${w.rowNumber}","WARNING","${w.branch || ''}","${w.subjectCode || ''}","${w.warning.replace(/"/g, '""')}"\n`;
  });
  return csv;
}
