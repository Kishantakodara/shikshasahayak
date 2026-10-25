/**
 * GTU Official Syllabus Utility
 * Constructs direct syllabus PDF download/view URLs hosted on official GTU S3 storage
 * and calculates dynamic academic year / WEF labels site-wide.
 */

export function getGtuOfficialSyllabusUrl(subjectCode: string): string {
  if (!subjectCode) return '';
  const cleanCode = subjectCode.trim();
  // Note: GTU official S3 bucket uses "Syallbus" in the path string
  return `https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/${encodeURIComponent(cleanCode)}.pdf`;
}

export function isValidSubjectCode(subjectCode?: string | null): boolean {
  if (!subjectCode) return false;
  const clean = subjectCode.trim();
  // Matches GTU subject code patterns (5 to 14 alphanumeric chars/digits/hyphens)
  return /^[a-zA-Z0-9-]{5,14}$/.test(clean);
}

/**
 * Returns the current active Academic Year dynamically based on the current date.
 * GTU academic sessions run from June/July to May.
 * E.g. July 2026 -> "2026-27", Jan 2026 -> "2025-26".
 */
export function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed: 0=Jan, 5=June, 6=July
  if (month >= 5) {
    return `${year}-${String(year + 1).slice(-2)}`;
  } else {
    return `${year - 1}-${String(year).slice(-2)}`;
  }
}

/**
 * Returns the latest WEF (With Effect From) curriculum year label for a subject.
 */
export function getLatestWefForSubject(
  subjectCode?: string,
  wefOptions: string[] = [],
  semester?: number
): string {
  if (wefOptions && wefOptions.length > 0) {
    return wefOptions[0];
  }

  // 1st Year (Semesters 0, 1, 2) in GTU follow the latest NEP 2024-25 Curriculum scheme
  if (semester === 0 || semester === 1 || semester === 2) {
    return '2024-25';
  }

  if (!subjectCode) return '2024-25';
  const clean = subjectCode.trim().toUpperCase();

  if (clean.startsWith('BE01') || clean.startsWith('BE02') || clean.startsWith('BE03') || clean.startsWith('BE04') || clean.startsWith('BE05') || clean.startsWith('BE06') || clean.startsWith('BE07') || clean.startsWith('BE08') || clean.startsWith('BE')) {
    return '2024-25'; // NEP 2024 Curriculum
  }
  if (clean.startsWith('31') || clean.startsWith('3')) {
    return '2018-19'; // 2018 GTU Curriculum
  }
  if (clean.startsWith('21') || clean.startsWith('2')) {
    return '2013-14'; // 2013 GTU Curriculum
  }
  if (clean.startsWith('11') || clean.startsWith('1')) {
    return '2008-09';
  }
  return '2024-25';
}

/**
 * Returns a full dynamic Academic Year & Syllabus Scheme badge label.
 * E.g. "Latest Syllabus for AY 2026-27 (WEF 2024-25)"
 */
export function getAcademicYearSyllabusLabel(
  subjectCode?: string,
  wefOptions: string[] = [],
  semester?: number
): {
  currentAcademicYear: string;
  wefLabel: string;
  badgeLabel: string;
  headerTitle: string;
} {
  const currentAcademicYear = getCurrentAcademicYear();
  const wefLabel = getLatestWefForSubject(subjectCode, wefOptions, semester);
  const badgeLabel = `AY ${currentAcademicYear} (WEF ${wefLabel})`;
  const headerTitle = `Latest Official Syllabus for AY ${currentAcademicYear} (WEF ${wefLabel})`;

  return {
    currentAcademicYear,
    wefLabel,
    badgeLabel,
    headerTitle,
  };
}
