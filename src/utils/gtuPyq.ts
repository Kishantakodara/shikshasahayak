/**
 * GTU Official PYQ (Previous Year Questions) Utility
 * 
 * Constructs direct PYQ PDF URLs hosted on official GTU server repository:
 * Format: https://www.gtu.ac.in/api/v1/question-papers/archive/file/{Session}/{Course}/{SubjectCode}.pdf
 * Example: https://www.gtu.ac.in/api/v1/question-papers/archive/file/S2026/BE/BE01000021.pdf
 */

export interface GtuExamSession {
  code: string;       // e.g. 'W2025', 'S2025'
  label: string;      // e.g. 'Winter 2025', 'Summer 2025'
  year: number;       // e.g. 2025
  season: 'Winter' | 'Summer';
}

/**
 * Normalizes any GTU PYQ link (including legacy uploads/... links) to the official archive API format:
 * https://www.gtu.ac.in/api/v1/question-papers/archive/file/{Session}/{Course}/{SubjectCode}.pdf
 */
export function normalizeGtuPyqUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Pattern matching legacy: https://gtu.ac.in/uploads/{Session}/{Course}/{SubjectCode}.pdf
  const legacyMatch = trimmed.match(
    /^https?:\/\/(?:www\.)?gtu\.ac\.in\/uploads\/([^\/]+)\/([^\/]+)\/([^\/]+?)(?:\.pdf)?$/i
  );
  if (legacyMatch) {
    const [, session, course, code] = legacyMatch;
    return `https://www.gtu.ac.in/api/v1/question-papers/archive/file/${encodeURIComponent(session.trim().toUpperCase())}/${encodeURIComponent(course.trim().toUpperCase())}/${encodeURIComponent(code.trim())}.pdf`;
  }

  // If it's already using the new api endpoint, clean up any query params that could cause IIS 502 errors
  const apiMatch = trimmed.match(
    /^https?:\/\/(?:www\.)?gtu\.ac\.in\/api\/v1\/question-papers\/archive\/file\/([^\/?#]+)\/([^\/?#]+)\/([^\/?#]+?)(?:\.pdf)?(?:[?#].*)?$/i
  );
  if (apiMatch) {
    const [, session, course, code] = apiMatch;
    return `https://www.gtu.ac.in/api/v1/question-papers/archive/file/${encodeURIComponent(session.trim().toUpperCase())}/${encodeURIComponent(course.trim().toUpperCase())}/${encodeURIComponent(code.trim())}.pdf`;
  }

  return trimmed;
}

/**
 * Constructs official GTU PYQ download/view URL.
 */
export function getGtuPyqUrl(
  session: string,
  course: string = 'BE',
  subjectCode: string
): string {
  if (!session || !subjectCode) return '';
  const cleanSession = session.trim().toUpperCase();
  const cleanCourse = (course || 'BE').trim().toUpperCase();
  const cleanSubjectCode = subjectCode.trim();

  return `https://www.gtu.ac.in/api/v1/question-papers/archive/file/${encodeURIComponent(cleanSession)}/${encodeURIComponent(cleanCourse)}/${encodeURIComponent(cleanSubjectCode)}.pdf`;
}

/**
 * Maps a branch slug or degree string to GTU official course directory code.
 * (BE: Bachelor of Engineering, ME: Master of Engineering, DE: Diploma Engineering, etc.)
 */
export function getCourseCodeFromBranch(branchSlug?: string): string {
  if (!branchSlug) return 'BE';
  const slug = branchSlug.toLowerCase();
  
  if (slug.includes('diploma') || slug.startsWith('de-') || slug.includes('polytechnic')) {
    return 'DE';
  }
  if (slug.includes('master') || slug.includes('mtech') || slug.includes('me-') || slug.startsWith('m-')) {
    return 'ME';
  }
  if (slug.includes('pharmacy') || slug.includes('bph')) {
    return 'BPH';
  }
  if (slug.includes('mba')) {
    return 'MBA';
  }
  if (slug.includes('mca')) {
    return 'MCA';
  }
  return 'BE';
}

export const GTU_PAPERS_ARCHIVE_URL = 'https://gtu.ac.in/Download1.aspx';

/**
 * Known legacy GTU subject code mappings for NEP/revised subjects.
 */
export const GTU_LEGACY_CODE_MAP: Record<string, string[]> = {
  'BE01R00041': ['3110014', '2110014', '110014'], // Mathematics - 1 / Calculus
  'BE01R00042': ['3110015', '2110015', '110015'], // Mathematics - 2 / Vector Calculus
  'BE01R00011': ['3110018', '2110011', '110011'], // Physics
  'BE01R00012': ['3110001', '2110001', '110001'], // Chemistry
  'BE01R00013': ['3110005', '2110005', '110005'], // Basic Electrical Engineering
  'BE01R00014': ['3110006', '2110006', '110006'], // Basic Mechanical Engineering
  'BE01R00015': ['3110004', '2110004', '110004'], // Elements of Civil Engineering
  'BE01R00016': ['3110003', '2110003', '110003'], // Programming for Problem Solving (PPS/CPU)
  'BE01R00017': ['3110007', '2110007', '110007'], // Environmental Studies
  'BE01R00018': ['3110013', '2110013', '110013'], // Engineering Graphics & Design
  'BE01R00019': ['3110012', '2110012', '110012'], // Workshop / Manufacturing Practices
  'BE01R00020': ['3110002', '2110002', '110002'], // English / Communication Skills
  '3110014': ['2110014', '110014'],
  '3110015': ['2110015', '110015'],
  '3110003': ['2110003', '110003'],
  '3110005': ['2110005', '110005'],
  '3110007': ['2110007', '110007'],
};

export function getGtuLegacyCodes(subjectCode?: string): string[] {
  if (!subjectCode) return [];
  const clean = subjectCode.trim();
  return GTU_LEGACY_CODE_MAP[clean] || [];
}

export function generateGtuRecentSessions(
  startYear: number = 2018,
  latestYear: number = 2026
): GtuExamSession[] {
  const sessions: GtuExamSession[] = [];
  
  // S2026 (Summer 2026 exam cycle)
  if (latestYear >= 2026) {
    sessions.push({
      code: 'S2026',
      label: 'Summer 2026',
      year: 2026,
      season: 'Summer',
    });
  }

  for (let year = Math.min(latestYear, 2025); year >= startYear; year--) {
    // Winter Session (held in Nov-Jan of the academic year)
    sessions.push({
      code: `W${year}`,
      label: `Winter ${year}`,
      year: year,
      season: 'Winter',
    });
    // Summer Session (held in May-July of the academic year)
    sessions.push({
      code: `S${year}`,
      label: `Summer ${year}`,
      year: year,
      season: 'Summer',
    });
  }

  return sessions;
}


/**
 * Helper to parse a session code like 'W2025' or 'S2024' into a structured object.
 */
export function parseGtuSessionCode(sessionCode: string): GtuExamSession | null {
  if (!sessionCode) return null;
  const match = sessionCode.trim().match(/^([WS])(\d{4})$/i);
  if (!match) return null;

  const prefix = match[1].toUpperCase();
  const year = parseInt(match[2], 10);
  const season: 'Winter' | 'Summer' = prefix === 'W' ? 'Winter' : 'Summer';

  return {
    code: `${prefix}${year}`,
    label: `${season} ${year}`,
    year,
    season,
  };
}
