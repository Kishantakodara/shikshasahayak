// ============================================================
// GTU FIRST-YEAR CANONICAL SUBJECT CATALOG
// Authoritative catalog for 1st year/common engineering subjects
// across the 13 Phase-1 engineering streams.
// ============================================================

export interface GTUFirstYearSubject {
  subjectCode: string;
  subjectName: string;
  semester: number;
  courseCode: string;
  applicableBranches: string[];
  status: 'active' | 'inactive';
}

export const FIRST_YEAR_BRANCH_IDS = [
  'branch_07', // Computer Engineering (CE)
  'branch_31', // Computer Science & Engineering (CSE)
  'branch_16', // Information Technology (IT)
  'branch_11', // Electronics & Communication Engineering (ECE)
  'branch_10', // Electronics Engineering
  'branch_09', // Electrical Engineering (EE)
  'branch_19', // Mechanical Engineering (ME)
  'branch_06', // Civil Engineering (CEIL)
  'branch_34', // Robotics & Automation (R&A)
  'branch_32', // Artificial Intelligence & Data Science (AI&DS)
  'branch_05', // Chemical Engineering
  'branch_17', // Instrumentation & Control Engineering (IC)
  'branch_02', // Automobile / ICT / Electronics
];

export const GTU_FIRST_YEAR_CATALOG: GTUFirstYearSubject[] = [
  {
    subjectCode: '3110014',
    subjectName: 'Mathematics - 1',
    semester: 1,
    courseCode: 'BE',
    applicableBranches: FIRST_YEAR_BRANCH_IDS,
    status: 'active',
  },
  {
    subjectCode: '3110015',
    subjectName: 'Mathematics - 2',
    semester: 2,
    courseCode: 'BE',
    applicableBranches: FIRST_YEAR_BRANCH_IDS,
    status: 'active',
  },
  {
    subjectCode: '3110002',
    subjectName: 'English',
    semester: 1,
    courseCode: 'BE',
    applicableBranches: FIRST_YEAR_BRANCH_IDS,
    status: 'active',
  },
  {
    subjectCode: '3110003',
    subjectName: 'Programming for Problem Solving',
    semester: 1,
    courseCode: 'BE',
    applicableBranches: [
      'branch_07',
      'branch_31',
      'branch_16',
      'branch_11',
      'branch_10',
      'branch_32',
    ],
    status: 'active',
  },
  {
    subjectCode: '3110005',
    subjectName: 'Basic Electrical Engineering',
    semester: 1,
    courseCode: 'BE',
    applicableBranches: [
      'branch_09',
      'branch_10',
      'branch_11',
      'branch_17',
      'branch_07',
      'branch_31',
    ],
    status: 'active',
  },
  {
    subjectCode: '3110006',
    subjectName: 'Basic Mechanical Engineering',
    semester: 1,
    courseCode: 'BE',
    applicableBranches: [
      'branch_19',
      'branch_06',
      'branch_34',
      'branch_05',
      'branch_02',
    ],
    status: 'active',
  },
  {
    subjectCode: '3110007',
    subjectName: 'Environmental Sciences',
    semester: 2,
    courseCode: 'BE',
    applicableBranches: FIRST_YEAR_BRANCH_IDS,
    status: 'active',
  },
  {
    subjectCode: '3110011',
    subjectName: 'Physics',
    semester: 1,
    courseCode: 'BE',
    applicableBranches: FIRST_YEAR_BRANCH_IDS,
    status: 'active',
  },
  {
    subjectCode: '3110013',
    subjectName: 'Engineering Graphics & Design',
    semester: 1,
    courseCode: 'BE',
    applicableBranches: [
      'branch_19',
      'branch_06',
      'branch_34',
      'branch_05',
      'branch_02',
    ],
    status: 'active',
  },
];

export function getFirstYearSubjectByCode(code: string): GTUFirstYearSubject | undefined {
  return GTU_FIRST_YEAR_CATALOG.find((s) => s.subjectCode === code);
}
