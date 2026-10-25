// ============================================================
// QUESTION INTELLIGENCE ENGINE - GTU DISCOVERY SERVICE
// Discovers official GTU Previous Year Question (PYQ) papers,
// course codes, subject mappings, and URL conventions.
// ============================================================

export interface GtuSubjectInfo {
  code: string;
  name: string;
  shortName: string;
  semester: number;
  isFirstYearCommon: boolean;
  applicableBranches: string[];
}

export interface GtuPaperMetadata {
  paperId: string;
  subjectCode: string;
  subjectName: string;
  semester: number;
  examName: 'GTU';
  examYear: number;
  examSession: 'WINTER' | 'SUMMER';
  sessionCode: string;
  courseCode: string;
  downloadUrl: string;
}

/**
  Curated list of GTU 1st Year / Common Engineering Curriculum subjects.
  Mapped across all 13 Phase-1 engineering branches.
 */
export const GTU_FIRST_YEAR_SUBJECTS: GtuSubjectInfo[] = [
  {
    code: '3110014',
    name: 'Mathematics - 1',
    shortName: 'Maths-1',
    semester: 1,
    isFirstYearCommon: true,
    applicableBranches: ['branch_07', 'branch_31', 'branch_16', 'branch_11', 'branch_10', 'branch_09', 'branch_19', 'branch_06', 'branch_41', 'branch_43', 'branch_05', 'branch_17', 'branch_32'],
  },
  {
    code: '3110015',
    name: 'Mathematics - 2',
    shortName: 'Maths-2',
    semester: 2,
    isFirstYearCommon: true,
    applicableBranches: ['branch_07', 'branch_31', 'branch_16', 'branch_11', 'branch_10', 'branch_09', 'branch_19', 'branch_06', 'branch_41', 'branch_43', 'branch_05', 'branch_17', 'branch_32'],
  },
  {
    code: '3110005',
    name: 'Basic Electrical Engineering',
    shortName: 'BEE',
    semester: 1,
    isFirstYearCommon: true,
    applicableBranches: ['branch_07', 'branch_31', 'branch_16', 'branch_11', 'branch_10', 'branch_09', 'branch_19', 'branch_06', 'branch_41', 'branch_43', 'branch_05', 'branch_17', 'branch_32'],
  },
  {
    code: '3110003',
    name: 'Programming for Problem Solving',
    shortName: 'PPS',
    semester: 1,
    isFirstYearCommon: true,
    applicableBranches: ['branch_07', 'branch_31', 'branch_16', 'branch_11', 'branch_10', 'branch_09', 'branch_41', 'branch_43', 'branch_32'],
  },
  {
    code: '3110002',
    name: 'English',
    shortName: 'English',
    semester: 1,
    isFirstYearCommon: true,
    applicableBranches: ['branch_07', 'branch_31', 'branch_16', 'branch_11', 'branch_10', 'branch_09', 'branch_19', 'branch_06', 'branch_41', 'branch_43', 'branch_05', 'branch_17', 'branch_32'],
  },
  {
    code: '3110018',
    name: 'Physics',
    shortName: 'Physics',
    semester: 1,
    isFirstYearCommon: true,
    applicableBranches: ['branch_07', 'branch_31', 'branch_16', 'branch_11', 'branch_10', 'branch_09', 'branch_19', 'branch_06', 'branch_41', 'branch_43', 'branch_05', 'branch_17', 'branch_32'],
  },
  {
    code: '3110001',
    name: 'Chemistry',
    shortName: 'Chemistry',
    semester: 1,
    isFirstYearCommon: true,
    applicableBranches: ['branch_19', 'branch_06', 'branch_05', 'branch_17'],
  },
  {
    code: '3110006',
    name: 'Basic Mechanical Engineering',
    shortName: 'BME',
    semester: 1,
    isFirstYearCommon: true,
    applicableBranches: ['branch_19', 'branch_06', 'branch_41', 'branch_05'],
  },
  {
    code: '3110004',
    name: 'Elements of Civil Engineering',
    shortName: 'ECE-Civil',
    semester: 1,
    isFirstYearCommon: true,
    applicableBranches: ['branch_06', 'branch_19', 'branch_05'],
  },
  {
    code: '3110013',
    name: 'Engineering Graphics & Design',
    shortName: 'EGD',
    semester: 1,
    isFirstYearCommon: true,
    applicableBranches: ['branch_19', 'branch_06', 'branch_41', 'branch_05', 'branch_17'],
  },
];

/**
  Constructs official GTU PYQ download URL.
  Format: https://www.gtu.ac.in/api/v1/question-papers/archive/file/{sessionCode}/{courseCode}/{subjectCode}.pdf
 */
export function getOfficialGtuPaperUrl(
  sessionCode: string,
  subjectCode: string,
  courseCode: string = 'BE'
): string {
  const cleanSession = sessionCode.trim().toUpperCase();
  const cleanCourse = courseCode.trim().toUpperCase();
  const cleanSubject = subjectCode.trim();
  return `https://www.gtu.ac.in/api/v1/question-papers/archive/file/${cleanSession}/${cleanCourse}/${cleanSubject}.pdf`;
}

/**
  Parses GTU session code like 'W2024' or 'S2024' into structured metadata.
 */
export function parseGtuSession(sessionCode: string): { examYear: number; examSession: 'WINTER' | 'SUMMER' } | null {
  const match = sessionCode.trim().match(/^([WS])(\d{4})$/i);
  if (!match) return null;
  const prefix = match[1].toUpperCase();
  const year = parseInt(match[2], 10);
  return {
    examYear: year,
    examSession: prefix === 'W' ? 'WINTER' : 'SUMMER',
  };
}

/**
  Discovers official GTU PYQ paper URLs for a controlled sample set.
 */
export function discoverGtuSamplePaperMetadata(
  subjectCodes: string[] = ['3110014', '3110015', '3110005', '3110003', '3110002'],
  sessionCodes: string[] = ['W2024', 'S2024', 'W2023', 'S2023', 'W2022']
): GtuPaperMetadata[] {
  const discovered: GtuPaperMetadata[] = [];

  for (const code of subjectCodes) {
    const subjInfo = GTU_FIRST_YEAR_SUBJECTS.find(s => s.code === code) || {
      code,
      name: `GTU Subject ${code}`,
      semester: 1,
    };

    for (const sessCode of sessionCodes) {
      const parsedSess = parseGtuSession(sessCode);
      if (!parsedSess) continue;

      const paperId = `gtu_paper_${sessCode}_BE_${code}`;
      const downloadUrl = getOfficialGtuPaperUrl(sessCode, code, 'BE');

      discovered.push({
        paperId,
        subjectCode: code,
        subjectName: subjInfo.name,
        semester: subjInfo.semester,
        examName: 'GTU',
        examYear: parsedSess.examYear,
        examSession: parsedSess.examSession,
        sessionCode: sessCode,
        courseCode: 'BE',
        downloadUrl,
      });
    }
  }

  return discovered;
}
