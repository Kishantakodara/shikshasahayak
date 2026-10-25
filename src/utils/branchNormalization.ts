// ============================================================
// SHIKSHA SAHAYAK OS - BRANCH NORMALIZATION SERVICE
// Maps messy CSV branch strings into canonical ShikshaSahayak branch IDs & names
// ============================================================

export interface CanonicalBranchInfo {
  id: string;          // e.g. 'branch_computer' or 'computer'
  slug: string;        // e.g. 'computer'
  name: string;        // e.g. 'Computer Engineering'
  shortName: string;   // e.g. 'CE'
  code?: string;
}

export const CANONICAL_BRANCHES: Record<string, CanonicalBranchInfo> = {
  'computer': {
    id: 'branch_07',
    slug: 'computer-engineering',
    name: 'Computer Engineering',
    shortName: 'CE',
    code: '07',
  },
  'it': {
    id: 'branch_16',
    slug: 'information-technology',
    name: 'Information Technology',
    shortName: 'IT',
    code: '16',
  },
  'electrical': {
    id: 'branch_09',
    slug: 'electrical-engineering',
    name: 'Electrical Engineering',
    shortName: 'EE',
    code: '09',
  },
  'ece': {
    id: 'branch_11',
    slug: 'electronics-and-communication-engineering',
    name: 'Electronics & Communication Engineering',
    shortName: 'ECE',
    code: '11',
  },
  'mechanical': {
    id: 'branch_19',
    slug: 'mechanical-engineering',
    name: 'Mechanical Engineering',
    shortName: 'ME',
    code: '19',
  },
  'civil': {
    id: 'branch_06',
    slug: 'civil-engineering',
    name: 'Civil Engineering',
    shortName: 'CE',
    code: '06',
  },
  'chemical': {
    id: 'branch_05',
    slug: 'chemical-engineering',
    name: 'Chemical Engineering',
    shortName: 'Chemical',
    code: '05',
  },
  'first-year': {
    id: 'branch_00',
    slug: 'first-year',
    name: '1st Year Common',
    shortName: 'FYC',
    code: '00',
  },

  // Additional 5 Phase-1 Engineering Branches (GTU Database IDs)
  'computer-science': {
    id: 'branch_31',
    slug: 'computer-science-and-engineering',
    name: 'Computer Science & Engineering',
    shortName: 'CSE',
    code: '31',
  },
  'electronics': {
    id: 'branch_10',
    slug: 'electronics-engineering',
    name: 'Electronics Engineering',
    shortName: 'Electronics',
    code: '10',
  },
  'robotics': {
    id: 'branch_41',
    slug: 'robotics-and-automation',
    name: 'Robotics & Automation',
    shortName: 'R&A',
    code: '41',
  },
  'ai-ds': {
    id: 'branch_43',
    slug: 'ai-and-ds',
    name: 'Artificial Intelligence & Data Science',
    shortName: 'AI & DS',
    code: '43',
  },
  'ic': {
    id: 'branch_17',
    slug: 'instrumentation-and-control-engineering',
    name: 'Instrumentation & Control Engineering',
    shortName: 'IC',
    code: '17',
  },
  'ict': {
    id: 'branch_32',
    slug: 'information-and-communication-technology',
    name: 'Information & Communication Technology',
    shortName: 'ICT',
    code: '32',
  },
};

/** All 13 Phase-1 Engineering Branches */
export const PHASE_1_BRANCHES: CanonicalBranchInfo[] = [
  CANONICAL_BRANCHES['computer'],
  CANONICAL_BRANCHES['computer-science'],
  CANONICAL_BRANCHES['it'],
  CANONICAL_BRANCHES['ece'],
  CANONICAL_BRANCHES['electronics'],
  CANONICAL_BRANCHES['electrical'],
  CANONICAL_BRANCHES['mechanical'],
  CANONICAL_BRANCHES['civil'],
  CANONICAL_BRANCHES['robotics'],
  CANONICAL_BRANCHES['ai-ds'],
  CANONICAL_BRANCHES['chemical'],
  CANONICAL_BRANCHES['ic'],
  CANONICAL_BRANCHES['ict'],
];

/**
 * Normalizes input raw branch text into canonical branch info.
 */
export function normalizeBranchName(rawBranch: string): CanonicalBranchInfo | null {
  if (!rawBranch) return null;
  const clean = rawBranch.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');

  // 13 Phase-1 Branch Normalization Checks
  if (clean.includes('robotics') || clean.includes('automation') || clean === 'r a') {
    return CANONICAL_BRANCHES['robotics'];
  }
  if (clean.includes('artificial intelligence') || clean.includes('data science') || clean.includes('ai ds') || clean.includes('aids')) {
    return CANONICAL_BRANCHES['ai-ds'];
  }
  if (clean.includes('instrumentation') || clean.includes('control') || clean === 'ic') {
    return CANONICAL_BRANCHES['ic'];
  }
  if (clean.includes('information and communication') || clean.includes('info comm') || clean === 'ict') {
    return CANONICAL_BRANCHES['ict'];
  }
  if (clean.includes('computer science') || clean.includes('cse')) {
    return CANONICAL_BRANCHES['computer-science'];
  }
  if (clean.includes('computer engineering') || clean.includes('comp eng') || clean === 'ce') {
    return CANONICAL_BRANCHES['computer'];
  }
  if (clean.includes('information technology') || clean.includes('info tech') || clean === 'it') {
    return CANONICAL_BRANCHES['it'];
  }
  if (clean.includes('electrical') || clean === 'ee') {
    return CANONICAL_BRANCHES['electrical'];
  }
  if (clean.includes('electronics and communication') || clean.includes('ece') || clean === 'ec') {
    return CANONICAL_BRANCHES['ece'];
  }
  if (clean.includes('electronics') || clean.includes('tronics')) {
    return CANONICAL_BRANCHES['electronics'];
  }
  if (clean.includes('mechanical') || clean === 'me') {
    return CANONICAL_BRANCHES['mechanical'];
  }
  if (clean.includes('civil') || clean.includes('ce civil')) {
    return CANONICAL_BRANCHES['civil'];
  }
  if (clean.includes('chemical') || clean === 'che') {
    return CANONICAL_BRANCHES['chemical'];
  }
  if (clean.includes('first year') || clean.includes('1st year') || clean.includes('fyc')) {
    return CANONICAL_BRANCHES['first-year'];
  }

  // Fallback slugification
  const slugified = clean.replace(/\s+/g, '-');
  if (CANONICAL_BRANCHES[slugified]) {
    return CANONICAL_BRANCHES[slugified];
  }

  return null;
}

