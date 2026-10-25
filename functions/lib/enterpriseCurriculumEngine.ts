import * as XLSX from 'xlsx';

export interface CurriculumRowSpec {
  universityCode?: string;
  universityName?: string;
  regulationCode?: string;
  branchCode?: string;
  branchName?: string;
  semester: number;
  subjectCode: string;
  subjectName: string;
  credits?: number;
  subjectType?: 'Core' | 'Elective' | 'Lab' | 'Practical' | 'Audit' | 'Other';
  groupType?: string;
  syllabusUrl?: string;
}

export interface ValidationIssue {
  row: number;
  sheetName?: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationReport {
  isValid: boolean;
  totalRowsProcessed: number;
  totalBranchesFound: number;
  totalSubjectsFound: number;
  totalSemestersFound: number;
  errorCount: number;
  warningCount: number;
  issues: ValidationIssue[];
  parsedData: CurriculumRowSpec[];
}

export interface ImportSummary {
  versionId: string;
  uploadId: string;
  versionNumber: number;
  universityName: string;
  regulationCode: string;
  branchesCreated: number;
  subjectsCreated: number;
  syllabiLinked: number;
  logs: Array<{ level: 'info' | 'warn' | 'error'; message: string }>;
}

export const enterpriseCurriculumEngine = {
  /**
   * Reads an Excel (.xlsx/.xls), CSV, or JSON buffer and parses all worksheet tabs into normalized CurriculumRowSpec items.
   */
  parseWorkbookBuffer: (buffer: Uint8Array | ArrayBuffer, filename: string): ValidationReport => {
    const issues: ValidationIssue[] = [];
    const parsedData: CurriculumRowSpec[] = [];
    const branchSet = new Set<string>();
    const semesterSet = new Set<number>();
    const subjectCodeSet = new Set<string>();

    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      let globalRowCounter = 1;

      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        rows.forEach((row, index) => {
          globalRowCounter++;
          const rowNum = index + 2; // 1-indexed header

          // Extract fields flexibly across standard naming variations
          const rawUnivCode = String(row['University Code'] || row['Univ Code'] || row['university_code'] || 'GTU').trim();
          const rawUnivName = String(row['University Name'] || row['University'] || row['university_name'] || 'Gujarat Technological University').trim();
          const rawRegCode = String(row['Regulation'] || row['Scheme'] || row['regulation_code'] || 'REG_2026').trim();

          const rawBranchName = String(row['Branch Name'] || row['Branch'] || row['Department'] || row['branch_name'] || sheetName).trim();
          const rawBranchCode = String(row['Branch Code'] || row['branch_code'] || rawBranchName.substring(0, 4).toUpperCase()).trim();

          const rawSem = Number(row['Semester'] || row['Sem'] || row['semester'] || 0);
          const rawCode = String(row['Subject Code'] || row['Code'] || row['subject_code'] || '').trim();
          const rawName = String(row['Subject Name'] || row['Subject'] || row['Title'] || row['subject_name'] || '').trim();
          const rawCredits = Number(row['Credits'] || row['Credit'] || row['credits'] || 3);
          const rawType = String(row['Subject Type'] || row['Type'] || row['subject_type'] || 'Core').trim();
          const rawSyllabus = String(row['Syllabus Link'] || row['Syllabus URL'] || row['Syllabus'] || row['syllabus_url'] || '').trim();

          // Validation Rules
          if (!rawCode && !rawName) {
            // Empty row, skip
            return;
          }

          if (!rawCode) {
            issues.push({
              row: rowNum,
              sheetName,
              field: 'Subject Code',
              message: `Row #${rowNum} in "${sheetName}" is missing a Subject Code.`,
              severity: 'error'
            });
          }

          if (!rawName) {
            issues.push({
              row: rowNum,
              sheetName,
              field: 'Subject Name',
              message: `Row #${rowNum} in "${sheetName}" is missing a Subject Name.`,
              severity: 'error'
            });
          }

          if (isNaN(rawSem) || rawSem < 1 || rawSem > 10) {
            issues.push({
              row: rowNum,
              sheetName,
              field: 'Semester',
              message: `Row #${rowNum} has an invalid Semester number (${rawSem}). Must be between 1 and 10.`,
              severity: 'error'
            });
          }

          if (rawCode && subjectCodeSet.has(`${rawBranchCode}_sem${rawSem}_${rawCode}`)) {
            issues.push({
              row: rowNum,
              sheetName,
              field: 'Subject Code',
              message: `Duplicate Subject Code "${rawCode}" detected in branch ${rawBranchCode} semester ${rawSem}.`,
              severity: 'warning'
            });
          } else if (rawCode) {
            subjectCodeSet.add(`${rawBranchCode}_sem${rawSem}_${rawCode}`);
          }

          branchSet.add(rawBranchCode);
          semesterSet.add(rawSem);

          parsedData.push({
            universityCode: rawUnivCode,
            universityName: rawUnivName,
            regulationCode: rawRegCode,
            branchCode: rawBranchCode,
            branchName: rawBranchName,
            semester: isNaN(rawSem) ? 1 : rawSem,
            subjectCode: rawCode,
            subjectName: rawName,
            credits: isNaN(rawCredits) ? 3 : rawCredits,
            subjectType: (['Core', 'Elective', 'Lab', 'Practical', 'Audit'].includes(rawType) ? rawType : 'Core') as any,
            syllabusUrl: rawSyllabus
          });
        });
      });

      const errorCount = issues.filter(i => i.severity === 'error').length;
      const warningCount = issues.filter(i => i.severity === 'warning').length;

      return {
        isValid: errorCount === 0 && parsedData.length > 0,
        totalRowsProcessed: parsedData.length,
        totalBranchesFound: branchSet.size,
        totalSubjectsFound: parsedData.length,
        totalSemestersFound: semesterSet.size,
        errorCount,
        warningCount,
        issues,
        parsedData
      };
    } catch (err: any) {
      return {
        isValid: false,
        totalRowsProcessed: 0,
        totalBranchesFound: 0,
        totalSubjectsFound: 0,
        totalSemestersFound: 0,
        errorCount: 1,
        warningCount: 0,
        issues: [{
          row: 0,
          field: 'File Format',
          message: `Failed to parse workbook "${filename}": ${err.message || 'Invalid Excel or CSV file structure'}`,
          severity: 'error'
        }],
        parsedData: []
      };
    }
  },

  /**
   * Persists normalized curriculum data into Cloudflare D1 with automatic versioning, audit logging, and system synchronization.
   */
  importCurriculumToD1: async (
    db: D1Database,
    parsedData: CurriculumRowSpec[],
    filename: string,
    uploadedBy = 'Super Admin'
  ): Promise<ImportSummary> => {
    const logs: Array<{ level: 'info' | 'warn' | 'error'; message: string }> = [];
    const versionId = `ver_${Date.now()}`;
    const uploadId = `upl_${Date.now()}`;

    const sample = parsedData[0] || {};
    const univCode = sample.universityCode || 'GTU';
    const univName = sample.universityName || 'Gujarat Technological University';
    const regCode = sample.regulationCode || 'REG_2026';
    const univId = `univ_${univCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // 1. Ensure University Exists
    await db.prepare(
      `INSERT INTO universities (id, name, short_name, slug)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, updated_at = CURRENT_TIMESTAMP`
    ).bind(
      univId,
      univName,
      univCode,
      univCode.toLowerCase().replace(/[^a-z0-9]/g, '-')
    ).run();

    logs.push({ level: 'info', message: `Registered university "${univName}" (${univCode}).` });

    // 2. Fetch Latest Version Number
    const existingVer = await db.prepare(
      `SELECT MAX(version_number) as max_ver FROM curriculum_versions WHERE university_id = ?`
    ).bind(univId).first<{ max_ver: number }>();

    const nextVerNum = (existingVer?.max_ver || 0) + 1;

    // 3. Create Version & Upload Audit Entry
    await db.prepare(
      `INSERT INTO curriculum_versions (id, university_id, regulation_code, version_number, status, uploaded_by, filename, total_branches, total_subjects)
       VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)`
    ).bind(
      versionId,
      univId,
      regCode,
      nextVerNum,
      uploadedBy,
      filename,
      new Set(parsedData.map(d => d.branchCode)).size,
      parsedData.length
    ).run();

    await db.prepare(
      `INSERT INTO curriculum_uploads (id, version_id, workbook_name, total_rows, parsed_branches, parsed_subjects, status)
       VALUES (?, ?, ?, ?, ?, ?, 'completed')`
    ).bind(
      uploadId,
      versionId,
      filename,
      parsedData.length,
      new Set(parsedData.map(d => d.branchCode)).size,
      parsedData.length
    ).run();

    let branchesCreated = 0;
    let subjectsCreated = 0;
    let syllabiLinked = 0;

    const processedBranches = new Set<string>();

    // 4. Batch Import Branches & Subjects
    for (const item of parsedData) {
      const bSlug = (item.branchName || item.branchCode || 'core')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const bId = `branch_${bSlug}`;

      if (!processedBranches.has(bId)) {
        await db.prepare(
          `INSERT INTO branches (id, university_id, name, slug, short_name)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET name = excluded.name, updated_at = CURRENT_TIMESTAMP`
        ).bind(
          bId,
          univId,
          item.branchName || item.branchCode,
          bSlug,
          item.branchCode || bSlug.substring(0, 4).toUpperCase()
        ).run();

        processedBranches.add(bId);
        branchesCreated++;
      }

      // Upsert Subject
      const sSlug = (item.subjectName || item.subjectCode)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const sId = `${bId}_sem${item.semester}_${item.subjectCode?.toLowerCase() || sSlug}`;

      await db.prepare(
        `INSERT INTO subjects (id, university_id, branch_id, semester, name, code, slug, wef_year)
         VALUES (?, ?, ?, ?, ?, ?, ?, 2026)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, code = excluded.code, updated_at = CURRENT_TIMESTAMP`
      ).bind(
        sId,
        univId,
        bId,
        item.semester,
        item.subjectName,
        item.subjectCode || 'SUB101',
        sSlug
      ).run();

      subjectsCreated++;

      // Link Syllabus URL if present
      if (item.syllabusUrl) {
        const sylId = `syl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await db.prepare(
          `INSERT INTO syllabus_links (id, subject_id, version_id, syllabus_url, is_active)
           VALUES (?, ?, ?, ?, 1)`
        ).bind(sylId, sId, versionId, item.syllabusUrl).run();

        syllabiLinked++;
      }
    }

    logs.push({
      level: 'info',
      message: `Successfully imported Curriculum Version ${nextVerNum}: ${branchesCreated} branches, ${subjectsCreated} subjects, ${syllabiLinked} syllabus links.`
    });

    // 5. Log import entry
    await db.prepare(
      `INSERT INTO import_logs (id, upload_id, level, message, details)
       VALUES (?, ?, 'info', ?, ?)`
    ).bind(
      `log_${Date.now()}`,
      uploadId,
      'Curriculum Import Completed',
      JSON.stringify({ versionNumber: nextVerNum, branchesCreated, subjectsCreated, syllabiLinked })
    ).run();

    return {
      versionId,
      uploadId,
      versionNumber: nextVerNum,
      universityName: univName,
      regulationCode: regCode,
      branchesCreated,
      subjectsCreated,
      syllabiLinked,
      logs
    };
  }
};
