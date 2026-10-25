// ============================================================
// SHIKSHA SAHAYAK OS - CANONICAL BRANCH SLUG & IDENTIFIER UTILITIES
// Centralized mapping for all GTU engineering departments, codes,
// database IDs (e.g. gtu_be_016), and public SEO URL slugs.
// ============================================================

import { GTU_BE_BRANCHES } from '../config/gtuData';

export interface CanonicalBranchInfo {
  slug: string;
  name: string;
  code: string;
  dbId: string;
}

/**
 * Authoritative mapping of known engineering branches to their
 * canonical public URL slug, formal name, GTU code, and core DB ID.
 */
export const CANONICAL_BRANCH_MAP: Record<string, CanonicalBranchInfo> = {
  // Information Technology (GTU Code 16 / 016)
  'information-technology': { slug: 'information-technology', name: 'Information Technology', code: '016', dbId: 'gtu_be_016' },
  'it': { slug: 'information-technology', name: 'Information Technology', code: '016', dbId: 'gtu_be_016' },
  '16': { slug: 'information-technology', name: 'Information Technology', code: '016', dbId: 'gtu_be_016' },
  '016': { slug: 'information-technology', name: 'Information Technology', code: '016', dbId: 'gtu_be_016' },
  'gtu_be_016': { slug: 'information-technology', name: 'Information Technology', code: '016', dbId: 'gtu_be_016' },
  'gtu_be_16': { slug: 'information-technology', name: 'Information Technology', code: '016', dbId: 'gtu_be_016' },
  'gtu-be-016': { slug: 'information-technology', name: 'Information Technology', code: '016', dbId: 'gtu_be_016' },
  'gtu-be-16': { slug: 'information-technology', name: 'Information Technology', code: '016', dbId: 'gtu_be_016' },
  'branch_it': { slug: 'information-technology', name: 'Information Technology', code: '016', dbId: 'gtu_be_016' },

  // Computer Engineering (GTU Code 07 / 007)
  'computer-engineering': { slug: 'computer-engineering', name: 'Computer Engineering', code: '007', dbId: 'gtu_be_007' },
  'computer': { slug: 'computer-engineering', name: 'Computer Engineering', code: '007', dbId: 'gtu_be_007' },
  'cse': { slug: 'computer-engineering', name: 'Computer Engineering', code: '007', dbId: 'gtu_be_007' },
  'ce': { slug: 'computer-engineering', name: 'Computer Engineering', code: '007', dbId: 'gtu_be_007' },
  '7': { slug: 'computer-engineering', name: 'Computer Engineering', code: '007', dbId: 'gtu_be_007' },
  '07': { slug: 'computer-engineering', name: 'Computer Engineering', code: '007', dbId: 'gtu_be_007' },
  '007': { slug: 'computer-engineering', name: 'Computer Engineering', code: '007', dbId: 'gtu_be_007' },
  'gtu_be_007': { slug: 'computer-engineering', name: 'Computer Engineering', code: '007', dbId: 'gtu_be_007' },
  'gtu_be_07': { slug: 'computer-engineering', name: 'Computer Engineering', code: '007', dbId: 'gtu_be_007' },
  'gtu_be_7': { slug: 'computer-engineering', name: 'Computer Engineering', code: '007', dbId: 'gtu_be_007' },
  'gtu-be-007': { slug: 'computer-engineering', name: 'Computer Engineering', code: '007', dbId: 'gtu_be_007' },
  'gtu-be-07': { slug: 'computer-engineering', name: 'Computer Engineering', code: '007', dbId: 'gtu_be_007' },
  'gtu-be-7': { slug: 'computer-engineering', name: 'Computer Engineering', code: '007', dbId: 'gtu_be_007' },
  'branch_computer': { slug: 'computer-engineering', name: 'Computer Engineering', code: '007', dbId: 'gtu_be_007' },

  // Electrical Engineering (GTU Code 09 / 009)
  'electrical-engineering': { slug: 'electrical-engineering', name: 'Electrical Engineering', code: '009', dbId: 'gtu_be_009' },
  'electrical': { slug: 'electrical-engineering', name: 'Electrical Engineering', code: '009', dbId: 'gtu_be_009' },
  'ee': { slug: 'electrical-engineering', name: 'Electrical Engineering', code: '009', dbId: 'gtu_be_009' },
  '9': { slug: 'electrical-engineering', name: 'Electrical Engineering', code: '009', dbId: 'gtu_be_009' },
  '09': { slug: 'electrical-engineering', name: 'Electrical Engineering', code: '009', dbId: 'gtu_be_009' },
  '009': { slug: 'electrical-engineering', name: 'Electrical Engineering', code: '009', dbId: 'gtu_be_009' },
  'gtu_be_009': { slug: 'electrical-engineering', name: 'Electrical Engineering', code: '009', dbId: 'gtu_be_009' },
  'gtu_be_09': { slug: 'electrical-engineering', name: 'Electrical Engineering', code: '009', dbId: 'gtu_be_009' },
  'gtu_be_9': { slug: 'electrical-engineering', name: 'Electrical Engineering', code: '009', dbId: 'gtu_be_009' },
  'gtu-be-009': { slug: 'electrical-engineering', name: 'Electrical Engineering', code: '009', dbId: 'gtu_be_009' },
  'gtu-be-09': { slug: 'electrical-engineering', name: 'Electrical Engineering', code: '009', dbId: 'gtu_be_009' },
  'gtu-be-9': { slug: 'electrical-engineering', name: 'Electrical Engineering', code: '009', dbId: 'gtu_be_009' },
  'branch_electrical': { slug: 'electrical-engineering', name: 'Electrical Engineering', code: '009', dbId: 'gtu_be_009' },

  // Electronics & Communication (GTU Code 11 / 011)
  'electronics-and-communication': { slug: 'electronics-and-communication', name: 'Electronics and Communication', code: '011', dbId: 'gtu_be_011' },
  'electronics': { slug: 'electronics-and-communication', name: 'Electronics and Communication', code: '011', dbId: 'gtu_be_011' },
  'ece': { slug: 'electronics-and-communication', name: 'Electronics and Communication', code: '011', dbId: 'gtu_be_011' },
  'ec': { slug: 'electronics-and-communication', name: 'Electronics and Communication', code: '011', dbId: 'gtu_be_011' },
  '11': { slug: 'electronics-and-communication', name: 'Electronics and Communication', code: '011', dbId: 'gtu_be_011' },
  '011': { slug: 'electronics-and-communication', name: 'Electronics and Communication', code: '011', dbId: 'gtu_be_011' },
  'gtu_be_011': { slug: 'electronics-and-communication', name: 'Electronics and Communication', code: '011', dbId: 'gtu_be_011' },
  'gtu_be_11': { slug: 'electronics-and-communication', name: 'Electronics and Communication', code: '011', dbId: 'gtu_be_011' },
  'gtu-be-011': { slug: 'electronics-and-communication', name: 'Electronics and Communication', code: '011', dbId: 'gtu_be_011' },
  'gtu-be-11': { slug: 'electronics-and-communication', name: 'Electronics and Communication', code: '011', dbId: 'gtu_be_011' },
  'branch_ece': { slug: 'electronics-and-communication', name: 'Electronics and Communication', code: '011', dbId: 'gtu_be_011' },

  // Mechanical Engineering (GTU Code 19 / 019)
  'mechanical-engineering': { slug: 'mechanical-engineering', name: 'Mechanical Engineering', code: '019', dbId: 'gtu_be_019' },
  'mechanical': { slug: 'mechanical-engineering', name: 'Mechanical Engineering', code: '019', dbId: 'gtu_be_019' },
  'me': { slug: 'mechanical-engineering', name: 'Mechanical Engineering', code: '019', dbId: 'gtu_be_019' },
  '19': { slug: 'mechanical-engineering', name: 'Mechanical Engineering', code: '019', dbId: 'gtu_be_019' },
  '019': { slug: 'mechanical-engineering', name: 'Mechanical Engineering', code: '019', dbId: 'gtu_be_019' },
  'gtu_be_019': { slug: 'mechanical-engineering', name: 'Mechanical Engineering', code: '019', dbId: 'gtu_be_019' },
  'gtu_be_19': { slug: 'mechanical-engineering', name: 'Mechanical Engineering', code: '019', dbId: 'gtu_be_019' },
  'gtu-be-019': { slug: 'mechanical-engineering', name: 'Mechanical Engineering', code: '019', dbId: 'gtu_be_019' },
  'gtu-be-19': { slug: 'mechanical-engineering', name: 'Mechanical Engineering', code: '019', dbId: 'gtu_be_019' },
  'branch_mechanical': { slug: 'mechanical-engineering', name: 'Mechanical Engineering', code: '019', dbId: 'gtu_be_019' },

  // Civil Engineering (GTU Code 06 / 006)
  'civil-engineering': { slug: 'civil-engineering', name: 'Civil Engineering', code: '006', dbId: 'gtu_be_006' },
  'civil': { slug: 'civil-engineering', name: 'Civil Engineering', code: '006', dbId: 'gtu_be_006' },
  '6': { slug: 'civil-engineering', name: 'Civil Engineering', code: '006', dbId: 'gtu_be_006' },
  '06': { slug: 'civil-engineering', name: 'Civil Engineering', code: '006', dbId: 'gtu_be_006' },
  '006': { slug: 'civil-engineering', name: 'Civil Engineering', code: '006', dbId: 'gtu_be_006' },
  'gtu_be_006': { slug: 'civil-engineering', name: 'Civil Engineering', code: '006', dbId: 'gtu_be_006' },
  'gtu_be_06': { slug: 'civil-engineering', name: 'Civil Engineering', code: '006', dbId: 'gtu_be_006' },
  'gtu_be_6': { slug: 'civil-engineering', name: 'Civil Engineering', code: '006', dbId: 'gtu_be_006' },
  'gtu-be-006': { slug: 'civil-engineering', name: 'Civil Engineering', code: '006', dbId: 'gtu_be_006' },
  'gtu-be-06': { slug: 'civil-engineering', name: 'Civil Engineering', code: '006', dbId: 'gtu_be_006' },
  'gtu-be-6': { slug: 'civil-engineering', name: 'Civil Engineering', code: '006', dbId: 'gtu_be_006' },
  'branch_civil': { slug: 'civil-engineering', name: 'Civil Engineering', code: '006', dbId: 'gtu_be_006' },

  // Chemical Engineering (GTU Code 05 / 005)
  'chemical-engineering': { slug: 'chemical-engineering', name: 'Chemical Engineering', code: '005', dbId: 'gtu_be_005' },
  'chemical': { slug: 'chemical-engineering', name: 'Chemical Engineering', code: '005', dbId: 'gtu_be_005' },
  'ch': { slug: 'chemical-engineering', name: 'Chemical Engineering', code: '005', dbId: 'gtu_be_005' },
  '5': { slug: 'chemical-engineering', name: 'Chemical Engineering', code: '005', dbId: 'gtu_be_005' },
  '05': { slug: 'chemical-engineering', name: 'Chemical Engineering', code: '005', dbId: 'gtu_be_005' },
  '005': { slug: 'chemical-engineering', name: 'Chemical Engineering', code: '005', dbId: 'gtu_be_005' },
  'gtu_be_005': { slug: 'chemical-engineering', name: 'Chemical Engineering', code: '005', dbId: 'gtu_be_005' },
  'gtu_be_05': { slug: 'chemical-engineering', name: 'Chemical Engineering', code: '005', dbId: 'gtu_be_005' },
  'gtu_be_5': { slug: 'chemical-engineering', name: 'Chemical Engineering', code: '005', dbId: 'gtu_be_005' },
  'gtu-be-005': { slug: 'chemical-engineering', name: 'Chemical Engineering', code: '005', dbId: 'gtu_be_005' },
  'gtu-be-05': { slug: 'chemical-engineering', name: 'Chemical Engineering', code: '005', dbId: 'gtu_be_005' },
  'gtu-be-5': { slug: 'chemical-engineering', name: 'Chemical Engineering', code: '005', dbId: 'gtu_be_005' },
  'branch_chemical': { slug: 'chemical-engineering', name: 'Chemical Engineering', code: '005', dbId: 'gtu_be_005' },
};

/**
 * Normalizes any branch representation (code, DB id, legacy id, display name)
 * into its canonical public URL slug (e.g. 'information-technology').
 */
export function getCanonicalBranchSlug(input: string | undefined | null): string {
  if (!input) return 'computer-engineering';

  const raw = String(input).trim().toLowerCase();

  // Direct lookup
  if (CANONICAL_BRANCH_MAP[raw]) {
    return CANONICAL_BRANCH_MAP[raw].slug;
  }

  // Normalize separators: replace non-alphanumerics with hyphens
  const hyphenated = raw.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (CANONICAL_BRANCH_MAP[hyphenated]) {
    return CANONICAL_BRANCH_MAP[hyphenated].slug;
  }

  // Check underscore variant
  const underscored = raw.replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
  if (CANONICAL_BRANCH_MAP[underscored]) {
    return CANONICAL_BRANCH_MAP[underscored].slug;
  }

  // Check if string contains GTU branch ID format like gtu_be_16 or gtu-be-016
  const gtuMatch = raw.match(/gtu[-_]?be[-_]?0*(\d+)/i);
  if (gtuMatch && gtuMatch[1]) {
    const codeNum = gtuMatch[1];
    if (CANONICAL_BRANCH_MAP[codeNum]) {
      return CANONICAL_BRANCH_MAP[codeNum].slug;
    }
  }

  // Match by keyword in name
  if (raw.includes('information') || raw.includes(' it') || raw.startsWith('it ') || raw === 'it') {
    return 'information-technology';
  }
  if (raw.includes('computer') || raw.includes('cse') || raw.includes('software')) {
    return 'computer-engineering';
  }
  if (raw.includes('electric') && !raw.includes('electronic')) {
    return 'electrical-engineering';
  }
  if (raw.includes('electronic') || raw.includes('comm') || raw.includes('telecom')) {
    return 'electronics-and-communication';
  }
  if (raw.includes('mechanic') || raw.includes('automobile')) {
    return 'mechanical-engineering';
  }
  if (raw.includes('civil') || raw.includes('construction') || raw.includes('infra')) {
    return 'civil-engineering';
  }
  if (raw.includes('chem')) {
    return 'chemical-engineering';
  }

  // Check GTU_BE_BRANCHES config list
  const foundInList = GTU_BE_BRANCHES.find(
    (b) =>
      b.code === raw ||
      b.code === raw.padStart(2, '0') ||
      b.name.toLowerCase() === raw ||
      b.shortName?.toLowerCase() === raw
  );
  if (foundInList) {
    const slug = foundInList.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return slug;
  }

  return hyphenated || 'computer-engineering';
}

/**
 * Returns the proper human-readable branch name (e.g. "Information Technology").
 */
export function getCanonicalBranchName(input: string | undefined | null): string {
  if (!input) return 'Computer Engineering';

  const raw = String(input).trim().toLowerCase();
  if (CANONICAL_BRANCH_MAP[raw]) {
    return CANONICAL_BRANCH_MAP[raw].name;
  }

  const slug = getCanonicalBranchSlug(input);
  if (CANONICAL_BRANCH_MAP[slug]) {
    return CANONICAL_BRANCH_MAP[slug].name;
  }

  const foundInList = GTU_BE_BRANCHES.find(
    (b) =>
      b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug ||
      b.code === raw ||
      b.name.toLowerCase() === raw
  );
  if (foundInList) {
    return foundInList.name;
  }

  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns the 3-digit GTU database ID (e.g. "gtu_be_016").
 */
export function getCanonicalBranchDbId(input: string | undefined | null): string {
  const slug = getCanonicalBranchSlug(input);
  if (CANONICAL_BRANCH_MAP[slug]) {
    return CANONICAL_BRANCH_MAP[slug].dbId;
  }
  return 'gtu_be_007';
}
