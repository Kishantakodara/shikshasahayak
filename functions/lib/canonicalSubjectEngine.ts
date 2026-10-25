// ============================================================
// CANONICAL SUBJECT & GTU CODE MAPPING ENGINE
// ============================================================
// Core engine that maps multiple GTU subject codes across syllabus
// revisions to single canonical ShikshaSahayak subjects.

export interface CanonicalSubjectRecord {
  id: string;
  university_id: string;
  degree: string;
  branch_id: string;
  semester: number;
  canonical_name: string;
  normalized_name: string;
  aliases: string[];
  description?: string;
  status: 'active' | 'archived' | 'merged';
}

export interface GtuSubjectMappingRecord {
  id: string;
  canonical_subject_id: string;
  subject_code: string;
  official_subject_name: string;
  degree: string;
  branch_id: string;
  semester: number;
  syllabus_version?: string;
  effective_year?: number;
  aliases: string[];
  source: string;
  confidence: number;
  mapping_status: 'confirmed' | 'probable' | 'needs_review' | 'unmatched';
}

/**
 * Normalizes a subject name for fuzzy/canonical matching:
 * - Lowercase
 * - Normalize Roman numerals (I -> 1, II -> 2, III -> 3, IV -> 4, V -> 5)
 * - Strip punctuation, brackets, hyphens, and extra whitespace
 * - Standardize common academic terms ("and" vs "&", "maths" vs "mathematics")
 */
export function normalizeSubjectName(rawName: string): string {
  if (!rawName) return '';
  let name = rawName.toLowerCase();

  // Normalize common engineering abbreviations & synonyms
  name = name.replace(/&/g, ' and ');
  name = name.replace(/\bmaths\b/g, 'mathematics');
  name = name.replace(/\belementary\b/g, 'elements of');
  name = name.replace(/\bbasics?\b/g, 'basic');
  name = name.replace(/\badvance\b/g, 'advanced');
  name = name.replace(/\bpps\b/g, 'programming for problem solving');
  name = name.replace(/\bcpu\b/g, 'computer programming and utilization');
  name = name.replace(/\begd\b/g, 'engineering graphics and design');
  name = name.replace(/\bbee\b/g, 'basic electrical engineering');
  name = name.replace(/\bbme\b/g, 'basic mechanical engineering');
  name = name.replace(/\bbce\b/g, 'basic civil engineering');
  name = name.replace(/\bece\b/g, 'electronics and communication');
  name = name.replace(/\bmos\b/g, 'mechanics of solids');
  name = name.replace(/\bds\b/g, 'data structures');
  name = name.replace(/\bdbms\b/g, 'database management systems');
  name = name.replace(/\bos\b/g, 'operating system');
  name = name.replace(/\bcn\b/g, 'computer networks');
  name = name.replace(/\bcoa\b/g, 'computer organization and architecture');
  name = name.replace(/\bps\s*-\s*1\b/g, 'power system 1');
  name = name.replace(/\bps\s*-\s*2\b/g, 'power system 2');
  name = name.replace(/\bps\s*1\b/g, 'power system 1');
  name = name.replace(/\bps\s*2\b/g, 'power system 2');

  // Normalize Roman numerals at end of subject name or preceded by hyphen/space
  name = name.replace(/[-–—]/g, ' ');
  name = name.replace(/[\(\)\[\]\{\}\.,:;\/\\]/g, ' ');
  
  name = name.replace(/\bviii\b/g, '8');
  name = name.replace(/\bvii\b/g, '7');
  name = name.replace(/\bvi\b/g, '6');
  name = name.replace(/\biv\b/g, '4');
  name = name.replace(/\bv\b/g, '5');
  name = name.replace(/\biii\b/g, '3');
  name = name.replace(/\bii\b/g, '2');
  name = name.replace(/\bi\b/g, '1');
  name = name.replace(/\bl\b/g, '1'); // GTU occasionally typos 'I' as lowercase 'l'

  // Singularize common plural terms for robust canonical matching
  name = name.replace(/\bsystems\b/g, 'system');
  name = name.replace(/\bnetworks\b/g, 'network');
  name = name.replace(/\bmachines\b/g, 'machine');
  name = name.replace(/\bstructures\b/g, 'structure');
  name = name.replace(/\bcircuits\b/g, 'circuit');
  name = name.replace(/\bdevices\b/g, 'device');
  name = name.replace(/\bprinciples\b/g, 'principle');
  name = name.replace(/\bmethods\b/g, 'method');
  name = name.replace(/\bapplications\b/g, 'application');
  name = name.replace(/\bcomputations\b/g, 'computation');

  // Collapse multiple spaces
  return name.replace(/\s+/g, ' ').trim();
}

/**
 * Known curated canonical subject clusters.
 * Groups historical GTU subject codes across syllabus revisions (110xxx -> 21xxxx -> 31xxxx -> BExxxx).
 */
export const KNOWN_GTU_CANONICAL_CLUSTERS: Array<{
  canonicalName: string;
  semester: number;
  branchSlugs: string[];
  codes: string[];
  aliases: string[];
}> = [
  {
    canonicalName: 'Power System - I',
    semester: 4,
    branchSlugs: ['electrical-engineering', 'electrical'],
    codes: ['3140914', '2150908', '130904', 'BE04009041', '3130905', '3170910', '3180907'],
    aliases: [
      'Power System-I',
      'Power System I',
      'Power System 1',
      'Power Systems I',
      'Power Systems 1',
      'Power Systems l',
      'Electrical Power System - I',
      'Electrical Power System – I',
      'Electrical Power System I',
      'Electrical Power System 1'
    ]
  },
  {
    canonicalName: 'Power System - II',
    semester: 5,
    branchSlugs: ['electrical-engineering', 'electrical'],
    codes: ['3150911', '2160908', 'BE05009021'],
    aliases: [
      'Power System-II',
      'Power System II',
      'Power System 2',
      'Power Systems II',
      'Power Systems 2',
      'Electrical Power System - II',
      'Electrical Power System – II'
    ]
  },
  {
    canonicalName: 'Mathematics - I',
    semester: 1,
    branchSlugs: ['first-year', 'computer-engineering', 'information-technology', 'electrical-engineering', 'mechanical-engineering', 'civil-engineering'],
    codes: ['BE01R00041', 'BE01000041', '3110014', '2110014', '110014'],
    aliases: ['Mathematics 1', 'Mathematics - 1', 'Calculus', 'Maths - 1', 'Maths 1']
  },
  {
    canonicalName: 'Mathematics - II',
    semester: 2,
    branchSlugs: ['first-year', 'computer-engineering', 'information-technology', 'electrical-engineering', 'mechanical-engineering', 'civil-engineering'],
    codes: ['BE02R00011', 'BE02000011', '3110015', '2110015', '110015'],
    aliases: ['Mathematics 2', 'Mathematics - 2', 'Vector Calculus and Linear Algebra', 'Maths - 2', 'Maths 2']
  },
  {
    canonicalName: 'Database Management Systems',
    semester: 3,
    branchSlugs: ['computer-engineering', 'information-technology', 'computer', 'it'],
    codes: ['3130703', '2130703', '130703', 'BE03007031', 'BE03016031'],
    aliases: ['Database Management System', 'DBMS', 'Database Systems']
  },
  {
    canonicalName: 'Data Structures',
    semester: 3,
    branchSlugs: ['computer-engineering', 'information-technology', 'computer', 'it'],
    codes: ['3130702', '2130702', '130702', 'BE03007021', 'BE03016021'],
    aliases: ['Data Structure', 'Data and File Structures', 'Advanced Data Structures']
  },
  {
    canonicalName: 'Programming for Problem Solving',
    semester: 1,
    branchSlugs: ['first-year', 'computer-engineering', 'information-technology', 'electrical-engineering', 'mechanical-engineering', 'civil-engineering'],
    codes: ['BE01000161', '3110003', '2110003', '110003'],
    aliases: ['Computer Programming and Utilization', 'PPS', 'CPU', 'C Programming']
  },
  {
    canonicalName: 'Basic Electrical Engineering',
    semester: 1,
    branchSlugs: ['first-year', 'computer-engineering', 'information-technology', 'electrical-engineering', 'mechanical-engineering', 'civil-engineering'],
    codes: ['BE01R00051', 'BE01000051', '3110005', '2110005', '110005'],
    aliases: ['Elements of Electrical Engineering', 'BEE', 'Electrical Engineering Fundamentals']
  },
  {
    canonicalName: 'Basic Mechanical Engineering',
    semester: 1,
    branchSlugs: ['first-year', 'computer-engineering', 'information-technology', 'electrical-engineering', 'mechanical-engineering', 'civil-engineering'],
    codes: ['BE01R00081', 'BE01000081', '3110006', '2110006', '110006'],
    aliases: ['Elements of Mechanical Engineering', 'BME']
  },
  {
    canonicalName: 'Basic Civil Engineering',
    semester: 1,
    branchSlugs: ['first-year', 'computer-engineering', 'information-technology', 'electrical-engineering', 'mechanical-engineering', 'civil-engineering'],
    codes: ['BE01000101', '3110004', '2110004', '110004'],
    aliases: ['Elements of Civil Engineering', 'BCE']
  },
  {
    canonicalName: 'Engineering Graphics & Design',
    semester: 1,
    branchSlugs: ['first-year', 'computer-engineering', 'information-technology', 'electrical-engineering', 'mechanical-engineering', 'civil-engineering'],
    codes: ['BE01R00061', 'BE01000061', '3110013', '2110013', '110013'],
    aliases: ['Engineering Graphics', 'EGD', 'Engineering Drawing']
  },
  {
    canonicalName: 'Physics',
    semester: 1,
    branchSlugs: ['first-year', 'computer-engineering', 'information-technology', 'electrical-engineering', 'mechanical-engineering', 'civil-engineering'],
    codes: ['BE01R00021', 'BE01000021', '3110018', '2110011', '110011'],
    aliases: ['Engineering Physics', 'Applied Physics']
  },
  {
    canonicalName: 'Chemistry',
    semester: 1,
    branchSlugs: ['first-year', 'computer-engineering', 'information-technology', 'electrical-engineering', 'mechanical-engineering', 'civil-engineering'],
    codes: ['BE01R00031', 'BE01000031', '3110001', '2110001', '110001'],
    aliases: ['Engineering Chemistry', 'Applied Chemistry']
  },
  {
    canonicalName: 'Environmental Studies',
    semester: 1,
    branchSlugs: ['first-year', 'computer-engineering', 'information-technology', 'electrical-engineering', 'mechanical-engineering', 'civil-engineering'],
    codes: ['3110007', '2110007', '110007'],
    aliases: ['Environmental Science', 'EVS', 'Environmental Sciences']
  },
  {
    canonicalName: 'Digital Logic Design',
    semester: 3,
    branchSlugs: ['computer-engineering', 'information-technology', 'computer', 'it', 'electronics-and-communication-engineering'],
    codes: ['3130704', '2130704', '130701', '3131101'],
    aliases: ['Digital Electronics', 'DLD', 'Digital Logic and Design', 'Digital System Design']
  },
  {
    canonicalName: 'Operating Systems',
    semester: 4,
    branchSlugs: ['computer-engineering', 'information-technology', 'computer', 'it'],
    codes: ['3140702', '2140702', '140702'],
    aliases: ['Operating System', 'OS']
  },
  {
    canonicalName: 'Computer Networks',
    semester: 5,
    branchSlugs: ['computer-engineering', 'information-technology', 'computer', 'it'],
    codes: ['3150710', '2150710', '150702'],
    aliases: ['Computer Network', 'CN', 'Data Communication and Networking']
  },
  {
    canonicalName: 'Design and Analysis of Algorithms',
    semester: 5,
    branchSlugs: ['computer-engineering', 'information-technology', 'computer', 'it'],
    codes: ['3150703', '2150703', '150701'],
    aliases: ['DAA', 'Analysis and Design of Algorithms', 'Algorithms']
  },
  {
    canonicalName: 'Software Engineering',
    semester: 6,
    branchSlugs: ['computer-engineering', 'information-technology', 'computer', 'it'],
    codes: ['3160701', '2160701', '160701'],
    aliases: ['Software Engineering and UML', 'SE']
  },
  {
    canonicalName: 'Theory of Computation',
    semester: 6,
    branchSlugs: ['computer-engineering', 'information-technology', 'computer', 'it'],
    codes: ['3160704', '2160704', '160704'],
    aliases: ['TOC', 'Automata and Formal Languages', 'Theory of Computer Science']
  }
];

/**
 * Calculates string similarity (Dice's coefficient over bigrams)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeSubjectName(str1);
  const s2 = normalizeSubjectName(str2);

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;

  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    if (longer > 0 && shorter / longer > 0.75) return 0.95;
  }

  const getBigrams = (str: string): Set<string> => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.slice(i, i + 2));
    }
    return bigrams;
  };

  const bg1 = getBigrams(s1);
  const bg2 = getBigrams(s2);

  let intersection = 0;
  bg1.forEach((b) => {
    if (bg2.has(b)) intersection++;
  });

  const total = bg1.size + bg2.size;
  return total > 0 ? (2.0 * intersection) / total : 0;
}

export interface MatchResult {
  canonicalSubjectId?: string;
  canonicalName: string;
  confidence: number;
  mappingStatus: 'confirmed' | 'probable' | 'needs_review' | 'unmatched';
  isNewCanonicalSubject: boolean;
  matchedCluster?: typeof KNOWN_GTU_CANONICAL_CLUSTERS[0];
}

/**
 * Evaluates whether a GTU Subject Code & Name matches an existing canonical subject
 * or belongs to a curated GTU cluster.
 */
export function matchCanonicalSubject(
  subjectCode: string,
  subjectName: string,
  branchSlug: string,
  semester: number,
  existingCanonicalSubjects: CanonicalSubjectRecord[] = []
): MatchResult {
  const cleanCode = subjectCode.trim();
  const cleanName = subjectName.trim();
  const normName = normalizeSubjectName(cleanName);

  // 1. Check known curated clusters first
  for (const cluster of KNOWN_GTU_CANONICAL_CLUSTERS) {
    // Exact code match in cluster
    if (cluster.codes.includes(cleanCode)) {
      return {
        canonicalName: cluster.canonicalName,
        confidence: 1.0,
        mappingStatus: 'confirmed',
        isNewCanonicalSubject: false,
        matchedCluster: cluster,
      };
    }

    // Name / Alias match in cluster
    const clusterNorm = normalizeSubjectName(cluster.canonicalName);
    if (clusterNorm === normName) {
      return {
        canonicalName: cluster.canonicalName,
        confidence: 0.95,
        mappingStatus: 'confirmed',
        isNewCanonicalSubject: false,
        matchedCluster: cluster,
      };
    }

    for (const alias of cluster.aliases) {
      if (normalizeSubjectName(alias) === normName) {
        return {
          canonicalName: cluster.canonicalName,
          confidence: 0.92,
          mappingStatus: 'confirmed',
          isNewCanonicalSubject: false,
          matchedCluster: cluster,
        };
      }
    }
  }

  // 2. Check existing database canonical subjects for this branch/semester
  let bestDbMatch: CanonicalSubjectRecord | null = null;
  let highestScore = 0;

  for (const cs of existingCanonicalSubjects) {
    if (cs.normalized_name === normName) {
      return {
        canonicalSubjectId: cs.id,
        canonicalName: cs.canonical_name,
        confidence: 1.0,
        mappingStatus: 'confirmed',
        isNewCanonicalSubject: false,
      };
    }

    // Check aliases
    if (cs.aliases && Array.isArray(cs.aliases)) {
      for (const alias of cs.aliases) {
        if (normalizeSubjectName(alias) === normName) {
          return {
            canonicalSubjectId: cs.id,
            canonicalName: cs.canonical_name,
            confidence: 0.95,
            mappingStatus: 'confirmed',
            isNewCanonicalSubject: false,
          };
        }
      }
    }

    const score = calculateSimilarity(cs.canonical_name, cleanName);
    if (score > highestScore) {
      highestScore = score;
      bestDbMatch = cs;
    }
  }

  if (bestDbMatch && highestScore >= 0.85) {
    return {
      canonicalSubjectId: bestDbMatch.id,
      canonicalName: bestDbMatch.canonical_name,
      confidence: highestScore,
      mappingStatus: 'confirmed',
      isNewCanonicalSubject: false,
    };
  }

  if (bestDbMatch && highestScore >= 0.65) {
    return {
      canonicalSubjectId: bestDbMatch.id,
      canonicalName: bestDbMatch.canonical_name,
      confidence: highestScore,
      mappingStatus: 'needs_review',
      isNewCanonicalSubject: false,
    };
  }

  // 3. Fallback: Standalone canonical subject derived cleanly from official subject name
  return {
    canonicalName: cleanName,
    confidence: 1.0,
    mappingStatus: 'confirmed',
    isNewCanonicalSubject: true,
  };
}

/**
 * Infers the syllabus version / curriculum era from a GTU subject code.
 */
export function inferSyllabusVersion(subjectCode: string): { syllabusVersion: string; effectiveYear: number } {
  if (!subjectCode) return { syllabusVersion: '2024-25 NEP', effectiveYear: 2024 };
  const clean = subjectCode.trim().toUpperCase();

  if (clean.startsWith('BE01R') || clean.startsWith('BE02R') || clean.startsWith('BE03R') || clean.startsWith('BE04R') || clean.startsWith('BE05R')) {
    return { syllabusVersion: '2025-26 NEP (Revised)', effectiveYear: 2025 };
  }
  if (clean.startsWith('BE01') || clean.startsWith('BE02') || clean.startsWith('BE03') || clean.startsWith('BE04') || clean.startsWith('BE05') || clean.startsWith('BE06') || clean.startsWith('BE07') || clean.startsWith('BE08') || clean.startsWith('BE')) {
    return { syllabusVersion: '2024-25 NEP', effectiveYear: 2024 };
  }
  if (clean.startsWith('31') || clean.startsWith('3')) {
    return { syllabusVersion: '2018-19 CBCS', effectiveYear: 2018 };
  }
  if (clean.startsWith('21') || clean.startsWith('2')) {
    return { syllabusVersion: '2013-14 CBCS', effectiveYear: 2013 };
  }
  if (clean.startsWith('11') || clean.startsWith('1')) {
    return { syllabusVersion: '2008-09 Legacy', effectiveYear: 2008 };
  }

  return { syllabusVersion: '2018-19 CBCS', effectiveYear: 2018 };
}
