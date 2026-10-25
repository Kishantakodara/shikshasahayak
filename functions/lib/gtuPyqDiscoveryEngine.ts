// ============================================================
// GTU PYQ DISCOVERY, VERIFICATION & INGESTION PIPELINE
// ============================================================
// Discovers official GTU Question Paper URLs, extracts metadata,
// normalizes sessions/codes, maps to canonical subjects, and upserts
// metadata into Cloudflare D1.
// HARD REQUIREMENT: NEVER downloads or stores PDF binaries in ShikshaSahayak storage.

import {
  matchCanonicalSubject,
  normalizeSubjectName,
  inferSyllabusVersion,
  CanonicalSubjectRecord,
} from './canonicalSubjectEngine';

export interface DiscoveredPaperMetadata {
  subjectCode: string;
  officialSubjectName: string;
  branchSlug: string;
  semester: number;
  degree: string;
  examYear: number;
  examSession: 'SUMMER' | 'WINTER';
  sourceUrl: string;
  canonicalUrl: string;
  verificationStatus: 'verified' | 'unverified' | 'broken' | 'redirected';
}

export interface SyncOptions {
  branchSlug?: string;
  semester?: number;
  subjectCodes?: string[];
  startYear?: number;
  endYear?: number;
  verifyUrls?: boolean;
  maxConcurrency?: number;
}

export interface SyncProgressResult {
  syncId: string;
  status: 'completed' | 'failed' | 'running';
  candidatesGenerated: number;
  discoveredCount: number;
  verifiedCount: number;
  brokenCount: number;
  unverifiedCount: number;
  indexedCount: number;
  canonicalSubjectsCreated: number;
  mappingsCreated: number;
  mappingsNeedReview: number;
  totalFound: number;
  inserted: number;
  updated: number;
  existing: number;
  verified: number;
  broken: number;
  errors: string[];
}

/**
 * Normalizes an official GTU Question Paper URL.
 * Converts to canonical official format: https://www.gtu.ac.in/api/v1/question-papers/archive/file/{SESSION}/{COURSE}/{CODE}.pdf
 */
export function normalizeGtuUrl(
  sessionCode: string,
  course: string = 'BE',
  subjectCode: string
): { sourceUrl: string; canonicalUrl: string } {
  const cleanSession = sessionCode.trim().toUpperCase();
  const cleanCourse = (course || 'BE').trim().toUpperCase();
  const cleanCode = subjectCode.trim();

  const canonicalUrl = `https://www.gtu.ac.in/api/v1/question-papers/archive/file/${cleanSession}/${cleanCourse}/${cleanCode}.pdf`;
  return {
    sourceUrl: canonicalUrl,
    canonicalUrl,
  };
}

/**
 * Converts legacy GTU uploads/... URLs into the official API format:
 * https://www.gtu.ac.in/api/v1/question-papers/archive/file/{SESSION}/{COURSE}/{CODE}.pdf
 */
export function convertLegacyGtuUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  const legacyMatch = trimmed.match(
    /^https?:\/\/(?:www\.)?gtu\.ac\.in\/uploads\/([^\/]+)\/([^\/]+)\/([^\/]+?)(?:\.pdf)?$/i
  );
  if (legacyMatch) {
    const [, session, course, code] = legacyMatch;
    return `https://www.gtu.ac.in/api/v1/question-papers/archive/file/${session.trim().toUpperCase()}/${course.trim().toUpperCase()}/${code.trim()}.pdf`;
  }
  return trimmed;
}

/**
 * Performs a lightweight HTTP check (HEAD or Range GET) on the GTU PDF URL
 * without downloading the full document.
 */
export async function verifyGtuPdfUrlLight(
  url: string,
  timeoutMs: number = 4000
): Promise<'verified' | 'unverified' | 'broken'> {
  try {
    const targetUrl = convertLegacyGtuUrl(url);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Attempt 1: HEAD request
    try {
      const headRes = await fetch(targetUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/pdf,*/*',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (headRes.ok) {
        const ct = headRes.headers.get('content-type') || '';
        if (ct.includes('pdf') || ct.includes('octet-stream') || headRes.status === 200) {
          return 'verified';
        }
      }
    } catch {
      // Fallback to range request if HEAD is blocked
    }

    // Attempt 2: GET with Range header (fetches first 128 bytes only)
    const rangeRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Range': 'bytes=0-127',
        'Accept': 'application/pdf,*/*',
      },
      signal: controller.signal,
    });

    if (rangeRes.ok || rangeRes.status === 206) {
      return 'verified';
    }

    if (rangeRes.status === 404 || rangeRes.status === 502) {
      return 'broken';
    }

    return 'unverified';
  } catch (err) {
    // Network / timeout / DNS error
    return 'unverified';
  }
}

/**
 * Generates discovery targets for a set of subject codes across specified academic years & sessions.
 */
export function generateDiscoveryTargets(
  subjectCodeMap: Array<{
    code: string;
    name: string;
    branchSlug: string;
    semester: number;
    degree?: string;
  }>,
  startYear: number = 2018,
  endYear: number = 2026
): DiscoveredPaperMetadata[] {
  const targets: DiscoveredPaperMetadata[] = [];

  for (const item of subjectCodeMap) {
    const degree = item.degree || 'BE';
    const courseCode = degree.toUpperCase();

    for (let year = endYear; year >= startYear; year--) {
      // Winter Session
      const winterSession = `W${year}`;
      const winterUrls = normalizeGtuUrl(winterSession, courseCode, item.code);
      targets.push({
        subjectCode: item.code,
        officialSubjectName: item.name,
        branchSlug: item.branchSlug,
        semester: item.semester,
        degree,
        examYear: year,
        examSession: 'WINTER',
        sourceUrl: winterUrls.sourceUrl,
        canonicalUrl: winterUrls.canonicalUrl,
        verificationStatus: 'unverified',
      });

      // Summer Session
      const summerSession = `S${year}`;
      const summerUrls = normalizeGtuUrl(summerSession, courseCode, item.code);
      targets.push({
        subjectCode: item.code,
        officialSubjectName: item.name,
        branchSlug: item.branchSlug,
        semester: item.semester,
        degree,
        examYear: year,
        examSession: 'SUMMER',
        sourceUrl: summerUrls.sourceUrl,
        canonicalUrl: summerUrls.canonicalUrl,
        verificationStatus: 'unverified',
      });
    }
  }

  return targets;
}

/**
 * Ingestion orchestrator that runs inside Cloudflare Worker environment.
 */
export async function executeGtuPyqIngestion(
  db: D1Database,
  targets: DiscoveredPaperMetadata[],
  options: SyncOptions = {}
): Promise<SyncProgressResult> {
  const syncId = `sync_${Date.now()}`;
  const verifyUrls = options.verifyUrls ?? false;

  const result: SyncProgressResult = {
    syncId,
    status: 'running',
    candidatesGenerated: targets.length,
    discoveredCount: targets.length,
    verifiedCount: 0,
    brokenCount: 0,
    unverifiedCount: verifyUrls ? 0 : targets.length,
    indexedCount: 0,
    totalFound: targets.length,
    inserted: 0,
    updated: 0,
    existing: 0,
    verified: 0,
    broken: 0,
    canonicalSubjectsCreated: 0,
    mappingsCreated: 0,
    mappingsNeedReview: 0,
    errors: [],
  };

  // 1. Initialize Sync Log
  await db.prepare(
    `INSERT INTO gtu_sync_logs (
       id, sync_started_at, status, candidates_generated, discovered_count,
       links_found, unverified_count
     )
     VALUES (?, CURRENT_TIMESTAMP, 'running', ?, ?, ?, ?)`
  )
    .bind(syncId, targets.length, targets.length, targets.length, targets.length)
    .run()
    .catch(() => null);

  try {
    // 2. Load existing branch mapping
    const { results: dbBranches } = await db.prepare(
      `SELECT id, slug, name, code FROM branches`
    ).all<{ id: string; slug: string; name: string; code?: string }>();

    const branchSlugToId = new Map<string, string>();
    if (dbBranches) {
      dbBranches.forEach((b) => {
        branchSlugToId.set(b.slug, b.id);
        if (b.code) branchSlugToId.set(b.code, b.id);
      });
    }

    // 3. Load existing canonical subjects for matching
    const { results: existingCS } = await db.prepare(
      `SELECT id, university_id, degree, branch_id, semester, canonical_name, normalized_name, aliases, status
       FROM canonical_subjects WHERE status = 'active'`
    ).all<any>();

    const canonicalSubjectsList: CanonicalSubjectRecord[] = (existingCS || []).map((cs) => ({
      id: cs.id,
      university_id: cs.university_id,
      degree: cs.degree,
      branch_id: cs.branch_id,
      semester: cs.semester,
      canonical_name: cs.canonical_name,
      normalized_name: cs.normalized_name,
      aliases: cs.aliases ? JSON.parse(cs.aliases) : [],
      status: cs.status,
    }));

    // Cache canonical subjects by unique key
    const canonicalMapByKey = new Map<string, CanonicalSubjectRecord>();
    canonicalSubjectsList.forEach((cs) => {
      canonicalMapByKey.set(`${cs.branch_id}:${cs.semester}:${cs.normalized_name}`, cs);
    });

    // 4. Process each paper target
    for (const paper of targets) {
      const branchId = branchSlugToId.get(paper.branchSlug) || `branch_${paper.branchSlug}`;
      const normName = normalizeSubjectName(paper.officialSubjectName);
      const csLookupKey = `${branchId}:${paper.semester}:${normName}`;

      // A. Match or Create Canonical Subject
      let canonicalSubj = canonicalMapByKey.get(csLookupKey);

      if (!canonicalSubj) {
        const match = matchCanonicalSubject(
          paper.subjectCode,
          paper.officialSubjectName,
          paper.branchSlug,
          paper.semester,
          canonicalSubjectsList
        );

        if (match.canonicalSubjectId) {
          canonicalSubj = canonicalSubjectsList.find((c) => c.id === match.canonicalSubjectId);
        } else {
          // Create new canonical subject
          const newCsId = `cs_${paper.branchSlug}_sem${paper.semester}_${normName.replace(/[^a-z0-9]+/g, '_')}`.slice(0, 60);
          canonicalSubj = {
            id: newCsId,
            university_id: 'gtu',
            degree: paper.degree,
            branch_id: branchId,
            semester: paper.semester,
            canonical_name: match.canonicalName || paper.officialSubjectName,
            normalized_name: normName,
            aliases: [paper.officialSubjectName],
            status: 'active',
          };

          await db.prepare(
            `INSERT INTO canonical_subjects (id, university_id, degree, branch_id, semester, canonical_name, normalized_name, aliases, status)
             VALUES (?, 'gtu', ?, ?, ?, ?, ?, ?, 'active')
             ON CONFLICT(id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`
          )
            .bind(
              canonicalSubj.id,
              canonicalSubj.degree,
              canonicalSubj.branch_id,
              canonicalSubj.semester,
              canonicalSubj.canonical_name,
              canonicalSubj.normalized_name,
              JSON.stringify(canonicalSubj.aliases)
            )
            .run();

          canonicalSubjectsList.push(canonicalSubj);
          canonicalMapByKey.set(csLookupKey, canonicalSubj);
          result.canonicalSubjectsCreated++;
        }
      }

      if (!canonicalSubj) continue;

      // B. Match or Upsert GTU Subject Code Mapping
      const { syllabusVersion, effectiveYear } = inferSyllabusVersion(paper.subjectCode);
      const mappingId = `map_${paper.branchSlug}_sem${paper.semester}_${paper.subjectCode.toLowerCase()}`;

      await db.prepare(
        `INSERT INTO gtu_subject_mappings (
           id, canonical_subject_id, subject_code, official_subject_name, degree, branch_id, semester,
           syllabus_version, effective_year, aliases, source, confidence, mapping_status
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'GTU_OFFICIAL', 1.0, 'confirmed')
         ON CONFLICT(branch_id, semester, subject_code) DO UPDATE SET
           canonical_subject_id = excluded.canonical_subject_id,
           official_subject_name = excluded.official_subject_name,
           syllabus_version = excluded.syllabus_version,
           updated_at = CURRENT_TIMESTAMP`
      )
        .bind(
          mappingId,
          canonicalSubj.id,
          paper.subjectCode,
          paper.officialSubjectName,
          paper.degree,
          branchId,
          paper.semester,
          syllabusVersion,
          effectiveYear,
          JSON.stringify([paper.officialSubjectName])
        )
        .run();

      result.mappingsCreated++;

      // C. Optional URL Verification
      let vStatus = paper.verificationStatus;
      if (verifyUrls) {
        vStatus = await verifyGtuPdfUrlLight(paper.sourceUrl);
        if (vStatus === 'verified') result.verified++;
        else if (vStatus === 'broken') result.broken++;
      }

      // D. Upsert Question Paper Record (Stores official GTU URL ONLY)
      const paperTitle = `${canonicalSubj.canonical_name} (${paper.examSession === 'WINTER' ? 'Winter' : 'Summer'} ${paper.examYear})`;
      const paperId = `pyq_${paper.subjectCode}_${paper.examSession.toLowerCase()}${paper.examYear}`;

      const res = await db.prepare(
        `INSERT INTO gtu_question_papers (
           id, canonical_subject_id, gtu_subject_mapping_id, subject_code, title,
           official_subject_name, degree, branch_id, semester, exam_year, exam_session,
           source, source_url, canonical_url, verification_status, is_active, last_seen_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'GTU_OFFICIAL', ?, ?, ?, 1, CURRENT_TIMESTAMP)
         ON CONFLICT(subject_code, exam_year, exam_session, source_url) DO UPDATE SET
           canonical_subject_id = excluded.canonical_subject_id,
           gtu_subject_mapping_id = excluded.gtu_subject_mapping_id,
           title = excluded.title,
           verification_status = excluded.verification_status,
           last_seen_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP`
      )
        .bind(
          paperId,
          canonicalSubj.id,
          mappingId,
          paper.subjectCode,
          paperTitle,
          paper.officialSubjectName,
          paper.degree,
          branchId,
          paper.semester,
          paper.examYear,
          paper.examSession,
          paper.sourceUrl,
          paper.canonicalUrl,
          vStatus
        )
        .run();

      if (res.meta && res.meta.changes > 0) {
        result.inserted++;
      } else {
        result.existing++;
      }
    }

    result.status = 'completed';
    result.verifiedCount = result.verified;
    result.brokenCount = result.broken;
    result.indexedCount = result.inserted + result.existing;
    result.unverifiedCount = Math.max(0, targets.length - result.verified - result.broken);

    // 5. Finalize Sync Log
    await db.prepare(
      `UPDATE gtu_sync_logs SET
         status = 'completed',
         sync_completed_at = CURRENT_TIMESTAMP,
         candidates_generated = ?,
         discovered_count = ?,
         verified_count = ?,
         broken_count = ?,
         unverified_count = ?,
         indexed_count = ?,
         mapping_review_count = ?,
         links_found = ?,
         links_new = ?,
         links_existing = ?,
         links_verified = ?,
         links_failed = ?,
         summary_json = ?
       WHERE id = ?`
    )
      .bind(
        result.candidatesGenerated,
        result.discoveredCount,
        result.verifiedCount,
        result.brokenCount,
        result.unverifiedCount,
        result.indexedCount,
        result.mappingsNeedReview,
        result.totalFound,
        result.inserted,
        result.existing,
        result.verified,
        result.broken,
        JSON.stringify(result),
        syncId
      )
      .run()
      .catch(() => null);

    return result;
  } catch (err: any) {
    result.status = 'failed';
    result.errors.push(err.message || String(err));

    await db.prepare(
      `UPDATE gtu_sync_logs SET
         status = 'failed',
         sync_completed_at = CURRENT_TIMESTAMP,
         errors = ?
       WHERE id = ?`
    )
      .bind(err.message || 'Unknown error', syncId)
      .run()
      .catch(() => null);

    return result;
  }
}
