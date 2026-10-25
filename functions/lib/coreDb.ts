// ============================================================================
// PADHAKU CORE DB ADAPTER & HELPER
// ============================================================================

export interface CoreDbEnv {
  PADHAKU_CORE_DB?: D1Database;
  DB: D1Database;
  [key: string]: any;
}

/**
 * Returns the primary database instance.
 * Prefers PADHAKU_CORE_DB, falling back to DB.
 */
export function getCoreDb(env: CoreDbEnv): D1Database {
  return env.PADHAKU_CORE_DB || env.DB;
}

/**
 * Helper to slugify a name (e.g. 'Computer Engineering' -> 'computer-engineering')
 */
export function slugify(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Map of known branch slugs to canonical and legacy branch IDs and codes
 */
export const BRANCH_SLUG_MAP: Record<string, { id: string; legacyId: string; legacySlug: string; code: string; legacyCode: number; slug: string }> = {
  // Information Technology (16 / 016)
  'information-technology': { id: 'gtu_be_016', legacyId: 'branch_it', legacySlug: 'it', code: '016', legacyCode: 16, slug: 'information-technology' },
  'it': { id: 'gtu_be_016', legacyId: 'branch_it', legacySlug: 'it', code: '016', legacyCode: 16, slug: 'information-technology' },
  '16': { id: 'gtu_be_016', legacyId: 'branch_it', legacySlug: 'it', code: '016', legacyCode: 16, slug: 'information-technology' },
  '016': { id: 'gtu_be_016', legacyId: 'branch_it', legacySlug: 'it', code: '016', legacyCode: 16, slug: 'information-technology' },
  'gtu_be_016': { id: 'gtu_be_016', legacyId: 'branch_it', legacySlug: 'it', code: '016', legacyCode: 16, slug: 'information-technology' },
  'gtu_be_16': { id: 'gtu_be_016', legacyId: 'branch_it', legacySlug: 'it', code: '016', legacyCode: 16, slug: 'information-technology' },
  'gtu-be-016': { id: 'gtu_be_016', legacyId: 'branch_it', legacySlug: 'it', code: '016', legacyCode: 16, slug: 'information-technology' },
  'gtu-be-16': { id: 'gtu_be_016', legacyId: 'branch_it', legacySlug: 'it', code: '016', legacyCode: 16, slug: 'information-technology' },
  'branch_it': { id: 'gtu_be_016', legacyId: 'branch_it', legacySlug: 'it', code: '016', legacyCode: 16, slug: 'information-technology' },

  // Computer Engineering (07 / 007)
  'computer-engineering': { id: 'gtu_be_007', legacyId: 'branch_computer', legacySlug: 'computer', code: '007', legacyCode: 7, slug: 'computer-engineering' },
  'computer': { id: 'gtu_be_007', legacyId: 'branch_computer', legacySlug: 'computer', code: '007', legacyCode: 7, slug: 'computer-engineering' },
  'cse': { id: 'gtu_be_007', legacyId: 'branch_computer', legacySlug: 'computer', code: '007', legacyCode: 7, slug: 'computer-engineering' },
  '7': { id: 'gtu_be_007', legacyId: 'branch_computer', legacySlug: 'computer', code: '007', legacyCode: 7, slug: 'computer-engineering' },
  '07': { id: 'gtu_be_007', legacyId: 'branch_computer', legacySlug: 'computer', code: '007', legacyCode: 7, slug: 'computer-engineering' },
  '007': { id: 'gtu_be_007', legacyId: 'branch_computer', legacySlug: 'computer', code: '007', legacyCode: 7, slug: 'computer-engineering' },
  'gtu_be_007': { id: 'gtu_be_007', legacyId: 'branch_computer', legacySlug: 'computer', code: '007', legacyCode: 7, slug: 'computer-engineering' },
  'gtu_be_07': { id: 'gtu_be_007', legacyId: 'branch_computer', legacySlug: 'computer', code: '007', legacyCode: 7, slug: 'computer-engineering' },
  'gtu_be_7': { id: 'gtu_be_007', legacyId: 'branch_computer', legacySlug: 'computer', code: '007', legacyCode: 7, slug: 'computer-engineering' },
  'gtu-be-007': { id: 'gtu_be_007', legacyId: 'branch_computer', legacySlug: 'computer', code: '007', legacyCode: 7, slug: 'computer-engineering' },
  'gtu-be-07': { id: 'gtu_be_007', legacyId: 'branch_computer', legacySlug: 'computer', code: '007', legacyCode: 7, slug: 'computer-engineering' },
  'gtu-be-7': { id: 'gtu_be_007', legacyId: 'branch_computer', legacySlug: 'computer', code: '007', legacyCode: 7, slug: 'computer-engineering' },
  'branch_computer': { id: 'gtu_be_007', legacyId: 'branch_computer', legacySlug: 'computer', code: '007', legacyCode: 7, slug: 'computer-engineering' },

  // Electrical Engineering (09 / 009)
  'electrical-engineering': { id: 'gtu_be_009', legacyId: 'branch_electrical', legacySlug: 'electrical', code: '009', legacyCode: 9, slug: 'electrical-engineering' },
  'electrical': { id: 'gtu_be_009', legacyId: 'branch_electrical', legacySlug: 'electrical', code: '009', legacyCode: 9, slug: 'electrical-engineering' },
  'ee': { id: 'gtu_be_009', legacyId: 'branch_electrical', legacySlug: 'electrical', code: '009', legacyCode: 9, slug: 'electrical-engineering' },
  '9': { id: 'gtu_be_009', legacyId: 'branch_electrical', legacySlug: 'electrical', code: '009', legacyCode: 9, slug: 'electrical-engineering' },
  '09': { id: 'gtu_be_009', legacyId: 'branch_electrical', legacySlug: 'electrical', code: '009', legacyCode: 9, slug: 'electrical-engineering' },
  '009': { id: 'gtu_be_009', legacyId: 'branch_electrical', legacySlug: 'electrical', code: '009', legacyCode: 9, slug: 'electrical-engineering' },
  'gtu_be_009': { id: 'gtu_be_009', legacyId: 'branch_electrical', legacySlug: 'electrical', code: '009', legacyCode: 9, slug: 'electrical-engineering' },
  'gtu_be_09': { id: 'gtu_be_009', legacyId: 'branch_electrical', legacySlug: 'electrical', code: '009', legacyCode: 9, slug: 'electrical-engineering' },
  'gtu_be_9': { id: 'gtu_be_009', legacyId: 'branch_electrical', legacySlug: 'electrical', code: '009', legacyCode: 9, slug: 'electrical-engineering' },
  'gtu-be-009': { id: 'gtu_be_009', legacyId: 'branch_electrical', legacySlug: 'electrical', code: '009', legacyCode: 9, slug: 'electrical-engineering' },
  'gtu-be-09': { id: 'gtu_be_009', legacyId: 'branch_electrical', legacySlug: 'electrical', code: '009', legacyCode: 9, slug: 'electrical-engineering' },
  'gtu-be-9': { id: 'gtu_be_009', legacyId: 'branch_electrical', legacySlug: 'electrical', code: '009', legacyCode: 9, slug: 'electrical-engineering' },
  'branch_electrical': { id: 'gtu_be_009', legacyId: 'branch_electrical', legacySlug: 'electrical', code: '009', legacyCode: 9, slug: 'electrical-engineering' },

  // Electronics & Communication (011)
  'electronics-and-communication': { id: 'gtu_be_011', legacyId: 'branch_ece', legacySlug: 'ece', code: '011', legacyCode: 11, slug: 'electronics-and-communication' },
  'electronics': { id: 'gtu_be_011', legacyId: 'branch_ece', legacySlug: 'ece', code: '011', legacyCode: 11, slug: 'electronics-and-communication' },
  'ece': { id: 'gtu_be_011', legacyId: 'branch_ece', legacySlug: 'ece', code: '011', legacyCode: 11, slug: 'electronics-and-communication' },
  'ec': { id: 'gtu_be_011', legacyId: 'branch_ece', legacySlug: 'ece', code: '011', legacyCode: 11, slug: 'electronics-and-communication' },
  '11': { id: 'gtu_be_011', legacyId: 'branch_ece', legacySlug: 'ece', code: '011', legacyCode: 11, slug: 'electronics-and-communication' },
  '011': { id: 'gtu_be_011', legacyId: 'branch_ece', legacySlug: 'ece', code: '011', legacyCode: 11, slug: 'electronics-and-communication' },
  'gtu_be_011': { id: 'gtu_be_011', legacyId: 'branch_ece', legacySlug: 'ece', code: '011', legacyCode: 11, slug: 'electronics-and-communication' },
  'gtu_be_11': { id: 'gtu_be_011', legacyId: 'branch_ece', legacySlug: 'ece', code: '011', legacyCode: 11, slug: 'electronics-and-communication' },
  'gtu-be-011': { id: 'gtu_be_011', legacyId: 'branch_ece', legacySlug: 'ece', code: '011', legacyCode: 11, slug: 'electronics-and-communication' },
  'gtu-be-11': { id: 'gtu_be_011', legacyId: 'branch_ece', legacySlug: 'ece', code: '011', legacyCode: 11, slug: 'electronics-and-communication' },
  'branch_ece': { id: 'gtu_be_011', legacyId: 'branch_ece', legacySlug: 'ece', code: '011', legacyCode: 11, slug: 'electronics-and-communication' },

  // Mechanical Engineering (019)
  'mechanical-engineering': { id: 'gtu_be_019', legacyId: 'branch_mechanical', legacySlug: 'mechanical', code: '019', legacyCode: 19, slug: 'mechanical-engineering' },
  'mechanical': { id: 'gtu_be_019', legacyId: 'branch_mechanical', legacySlug: 'mechanical', code: '019', legacyCode: 19, slug: 'mechanical-engineering' },
  'me': { id: 'gtu_be_019', legacyId: 'branch_mechanical', legacySlug: 'mechanical', code: '019', legacyCode: 19, slug: 'mechanical-engineering' },
  '19': { id: 'gtu_be_019', legacyId: 'branch_mechanical', legacySlug: 'mechanical', code: '019', legacyCode: 19, slug: 'mechanical-engineering' },
  '019': { id: 'gtu_be_019', legacyId: 'branch_mechanical', legacySlug: 'mechanical', code: '019', legacyCode: 19, slug: 'mechanical-engineering' },
  'gtu_be_019': { id: 'gtu_be_019', legacyId: 'branch_mechanical', legacySlug: 'mechanical', code: '019', legacyCode: 19, slug: 'mechanical-engineering' },
  'gtu_be_19': { id: 'gtu_be_019', legacyId: 'branch_mechanical', legacySlug: 'mechanical', code: '019', legacyCode: 19, slug: 'mechanical-engineering' },
  'gtu-be-019': { id: 'gtu_be_019', legacyId: 'branch_mechanical', legacySlug: 'mechanical', code: '019', legacyCode: 19, slug: 'mechanical-engineering' },
  'gtu-be-19': { id: 'gtu_be_019', legacyId: 'branch_mechanical', legacySlug: 'mechanical', code: '019', legacyCode: 19, slug: 'mechanical-engineering' },
  'branch_mechanical': { id: 'gtu_be_019', legacyId: 'branch_mechanical', legacySlug: 'mechanical', code: '019', legacyCode: 19, slug: 'mechanical-engineering' },

  // Civil Engineering (006)
  'civil-engineering': { id: 'gtu_be_006', legacyId: 'branch_civil', legacySlug: 'civil', code: '006', legacyCode: 6, slug: 'civil-engineering' },
  'civil': { id: 'gtu_be_006', legacyId: 'branch_civil', legacySlug: 'civil', code: '006', legacyCode: 6, slug: 'civil-engineering' },
  '6': { id: 'gtu_be_006', legacyId: 'branch_civil', legacySlug: 'civil', code: '006', legacyCode: 6, slug: 'civil-engineering' },
  '06': { id: 'gtu_be_006', legacyId: 'branch_civil', legacySlug: 'civil', code: '006', legacyCode: 6, slug: 'civil-engineering' },
  '006': { id: 'gtu_be_006', legacyId: 'branch_civil', legacySlug: 'civil', code: '006', legacyCode: 6, slug: 'civil-engineering' },
  'gtu_be_006': { id: 'gtu_be_006', legacyId: 'branch_civil', legacySlug: 'civil', code: '006', legacyCode: 6, slug: 'civil-engineering' },
  'gtu_be_06': { id: 'gtu_be_006', legacyId: 'branch_civil', legacySlug: 'civil', code: '006', legacyCode: 6, slug: 'civil-engineering' },
  'gtu_be_6': { id: 'gtu_be_006', legacyId: 'branch_civil', legacySlug: 'civil', code: '006', legacyCode: 6, slug: 'civil-engineering' },
  'gtu-be-006': { id: 'gtu_be_006', legacyId: 'branch_civil', legacySlug: 'civil', code: '006', legacyCode: 6, slug: 'civil-engineering' },
  'gtu-be-06': { id: 'gtu_be_006', legacyId: 'branch_civil', legacySlug: 'civil', code: '006', legacyCode: 6, slug: 'civil-engineering' },
  'gtu-be-6': { id: 'gtu_be_006', legacyId: 'branch_civil', legacySlug: 'civil', code: '006', legacyCode: 6, slug: 'civil-engineering' },
  'branch_civil': { id: 'gtu_be_006', legacyId: 'branch_civil', legacySlug: 'civil', code: '006', legacyCode: 6, slug: 'civil-engineering' },

  // Chemical Engineering (005)
  'chemical-engineering': { id: 'gtu_be_005', legacyId: 'branch_chemical', legacySlug: 'chemical', code: '005', legacyCode: 5, slug: 'chemical-engineering' },
  'chemical': { id: 'gtu_be_005', legacyId: 'branch_chemical', legacySlug: 'chemical', code: '005', legacyCode: 5, slug: 'chemical-engineering' },
  'ch': { id: 'gtu_be_005', legacyId: 'branch_chemical', legacySlug: 'chemical', code: '005', legacyCode: 5, slug: 'chemical-engineering' },
  '5': { id: 'gtu_be_005', legacyId: 'branch_chemical', legacySlug: 'chemical', code: '005', legacyCode: 5, slug: 'chemical-engineering' },
  '05': { id: 'gtu_be_005', legacyId: 'branch_chemical', legacySlug: 'chemical', code: '005', legacyCode: 5, slug: 'chemical-engineering' },
  '005': { id: 'gtu_be_005', legacyId: 'branch_chemical', legacySlug: 'chemical', code: '005', legacyCode: 5, slug: 'chemical-engineering' },
  'gtu_be_005': { id: 'gtu_be_005', legacyId: 'branch_chemical', legacySlug: 'chemical', code: '005', legacyCode: 5, slug: 'chemical-engineering' },
  'gtu_be_05': { id: 'gtu_be_005', legacyId: 'branch_chemical', legacySlug: 'chemical', code: '005', legacyCode: 5, slug: 'chemical-engineering' },
  'gtu_be_5': { id: 'gtu_be_005', legacyId: 'branch_chemical', legacySlug: 'chemical', code: '005', legacyCode: 5, slug: 'chemical-engineering' },
  'gtu-be-005': { id: 'gtu_be_005', legacyId: 'branch_chemical', legacySlug: 'chemical', code: '005', legacyCode: 5, slug: 'chemical-engineering' },
  'gtu-be-05': { id: 'gtu_be_005', legacyId: 'branch_chemical', legacySlug: 'chemical', code: '005', legacyCode: 5, slug: 'chemical-engineering' },
  'gtu-be-5': { id: 'gtu_be_005', legacyId: 'branch_chemical', legacySlug: 'chemical', code: '005', legacyCode: 5, slug: 'chemical-engineering' },
  'branch_chemical': { id: 'gtu_be_005', legacyId: 'branch_chemical', legacySlug: 'chemical', code: '005', legacyCode: 5, slug: 'chemical-engineering' },
};

/**
 * Looks for branch across PADHAKU_CORE_DB and DB
 */
export async function findBranch(envOrDb: any, identifier: string) {
  const clean = (identifier || '').trim().toLowerCase();
  const cleanSpace = clean.replace(/[-_]/g, ' ');
  const hyphenated = clean.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const underscored = clean.replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

  let mapped = BRANCH_SLUG_MAP[clean] || BRANCH_SLUG_MAP[hyphenated] || BRANCH_SLUG_MAP[underscored];

  // Try extracting code from GTU format like gtu_be_16 or gtu-be-016
  if (!mapped) {
    const gtuMatch = clean.match(/gtu[-_]?be[-_]?0*(\d+)/i);
    if (gtuMatch && gtuMatch[1]) {
      mapped = BRANCH_SLUG_MAP[gtuMatch[1]];
    }
  }

  const targetId = mapped ? mapped.id : identifier;
  const legacyId = mapped ? mapped.legacyId : identifier;
  const legacySlug = mapped ? mapped.legacySlug : clean;
  const targetCode = mapped ? mapped.code : identifier;
  const legacyCode = mapped ? mapped.legacyCode : Number(identifier) || -1;
  const canonicalSlug = mapped ? mapped.slug : hyphenated;

  const databases: D1Database[] = [];
  if (envOrDb.PADHAKU_CORE_DB) databases.push(envOrDb.PADHAKU_CORE_DB);
  if (envOrDb.DB) databases.push(envOrDb.DB);
  if (databases.length === 0 && envOrDb.prepare) databases.push(envOrDb);

  for (const db of databases) {
    // 1. Try shiksha-core-db schema
    try {
      const row = await db.prepare(
        `SELECT
           b.id,
           b.name,
           b.short_name,
           b.code,
           b.university_id,
           LOWER(REPLACE(REPLACE(REPLACE(b.name, ' ', '-'), '/', '-'), '&', 'and')) AS slug,
           COALESCE(c.name, 'Bachelor of Engineering') AS program_name,
           COALESCE(u.name, 'Gujarat Technological University') AS university
         FROM branches b
         LEFT JOIN courses c ON c.id = b.course_id
         LEFT JOIN universities u ON u.id = b.university_id
         WHERE b.id = ? OR b.code = ? OR b.id = ? OR b.code = ? OR LOWER(b.name) = ? OR LOWER(REPLACE(b.name, ' ', '-')) = ?`
      )
        .bind(targetId, targetCode, legacyId, identifier, cleanSpace, clean)
        .first<any>();

      if (row) {
        row.slug = canonicalSlug || row.slug || slugify(row.name);
        return row;
      }
    } catch {}

    // 2. Try legacy schema
    try {
      const legacyRow = await db.prepare(
        `SELECT
           b.id,
           b.name,
           b.slug,
           b.short_name,
           b.code,
           b.university_id,
           u.name AS program_name,
           u.slug AS program_slug,
           u.name AS university
         FROM branches b
         JOIN universities u ON u.id = b.university_id
         WHERE b.slug = ? OR b.slug = ? OR b.id = ? OR b.id = ? OR b.code = ? OR b.code = ? OR LOWER(b.name) = ? OR LOWER(b.name) LIKE '%' || ? || '%'`
      )
        .bind(clean, legacySlug, targetId, legacyId, targetCode, legacyCode, cleanSpace, cleanSpace)
        .first<any>();

      if (legacyRow) {
        legacyRow.slug = canonicalSlug || legacyRow.slug || slugify(legacyRow.name);
        return legacyRow;
      }
    } catch {}
  }

  // Fallback synthetic branch if mapped
  if (mapped) {
    return {
      id: mapped.id,
      name: mapped.slug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      code: mapped.code,
      slug: mapped.slug,
      short_name: mapped.code,
      university_id: 'gtu',
      program_name: 'Bachelor of Engineering',
      university: 'Gujarat Technological University',
    };
  }

  return null;
}

