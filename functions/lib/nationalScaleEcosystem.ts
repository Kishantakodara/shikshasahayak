/**
 * SHIKSHA SAHAYAK OS — PHASE Z NATIONAL SCALE EDTECH PLATFORM ENGINE
 * Multi-Tenant, Enterprise SaaS, Marketplace, Mobile APIs, National Exam & AI Agent Platform
 * Powering Modules 1 through 20.
 */

export interface ResumeData {
  studentName: string;
  email: string;
  phone: string;
  education: Array<{ degree: string; institution: string; gpa: number; year: string }>;
  skills: string[];
  projects: Array<{ title: string; techStack: string[]; githubUrl: string }>;
  atsScore: number;
  atsRecommendations: string[];
}

export interface CodingChallenge {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'DSA' | 'Dynamic Programming' | 'Graphs' | 'System Design';
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  testCases: Array<{ input: string; expectedOutput: string }>;
  acceptanceRatePercent: number;
}

export interface MarketplaceProduct {
  id: string;
  title: string;
  creatorId: string;
  creatorName: string;
  category: 'Course' | 'Notes' | 'TestSeries' | 'QuestionBank' | 'Book';
  priceINR: number;
  rating: number;
  salesCount: number;
}

export interface NationalExamCatalog {
  examCode: 'JEE' | 'NEET' | 'GATE' | 'CAT' | 'UPSC' | 'SSC' | 'CUET' | 'CLAT';
  examName: string;
  conductingBody: string;
  totalSeats: number;
  syllabusUnits: string[];
  mockTestCount: number;
}

export interface GamificationProfile {
  userId: string;
  xp: number;
  coins: number;
  level: number;
  title: string;
  streakDays: number;
  achievements: Array<{ id: string; name: string; unlockedAt: string }>;
}

export interface PaymentInvoice {
  invoiceId: string;
  userId: string;
  amountINR: number;
  gstAmountINR: number;
  totalAmountINR: number;
  paymentMethod: 'UPI' | 'Card' | 'NetBanking' | 'Wallet';
  status: 'PAID' | 'PENDING' | 'FAILED';
  paidAt: string;
}

/**
 * MODULE 1 — Resume Builder & ATS Scorer Engine
 */
export function generateStudentResumeAndATS(studentData: Partial<ResumeData>): ResumeData {
  const skills = studentData.skills || ['JavaScript', 'React', 'TypeScript', 'Node.js', 'SQL', 'Data Structures'];
  const projects = studentData.projects || [
    { title: 'ShikshaSahayak OS EdTech Platform', techStack: ['React', 'TypeScript', 'Cloudflare Workers', 'D1'], githubUrl: 'https://github.com/shikshasahayak/platform' }
  ];

  let score = 75;
  const recommendations: string[] = [];

  if (skills.length >= 6) score += 10;
  else recommendations.push('Add at least 6 core technical skills to improve ATS keyword match.');

  if (projects.length >= 2) score += 10;
  else recommendations.push('Include 2 or more full-stack projects with live links and GitHub repositories.');

  return {
    studentName: studentData.studentName || 'Raj Patel',
    email: studentData.email || 'raj.patel@gtu.ac.in',
    phone: studentData.phone || '+91 9876543210',
    education: studentData.education || [
      { degree: 'B.Tech Computer Engineering', institution: 'Gujarat Technological University (GTU)', gpa: 8.75, year: '2026' }
    ],
    skills,
    projects,
    atsScore: Math.min(100, score),
    atsRecommendations: recommendations.length > 0 ? recommendations : ['Resume is ATS-Optimized with high keyword density!']
  };
}

/**
 * MODULE 3 — Coding Platform Challenge Runner
 */
export function getCodingChallenge(challengeId: string): CodingChallenge {
  return {
    id: challengeId || 'dsa_01',
    title: 'Two Sum & Subarray Optimization',
    difficulty: 'Easy',
    category: 'DSA',
    problemStatement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    inputFormat: 'Line 1: Space-separated integers. Line 2: Single integer target.',
    outputFormat: 'Space-separated pair of indices.',
    testCases: [
      { input: '2 7 11 15\n9', expectedOutput: '0 1' },
      { input: '3 2 4\n6', expectedOutput: '1 2' }
    ],
    acceptanceRatePercent: 88.4
  };
}

/**
 * MODULE 7 — Creator Marketplace Catalog
 */
export function fetchMarketplaceProducts(category?: string): MarketplaceProduct[] {
  return [
    { id: 'prod_101', title: 'GTU Computer Engineering Semester 5 Master Notes', creatorId: 'prof_shah', creatorName: 'Prof. A. Shah', category: 'Notes', priceINR: 299, rating: 4.9, salesCount: 1420 },
    { id: 'prod_102', title: 'GATE 2027 Complete Computer Science Test Series', creatorId: 'gate_academy', creatorName: 'GATE Academy', category: 'TestSeries', priceINR: 999, rating: 4.8, salesCount: 3250 },
    { id: 'prod_103', title: 'Full Stack Web Development with Cloudflare Workers & React 19', creatorId: 'dev_expert', creatorName: 'ShikshaSahayak Tech Faculty', category: 'Course', priceINR: 1499, rating: 4.95, salesCount: 890 }
  ];
}

/**
 * MODULE 10 — Scholarship Eligibility Matching Engine
 */
export function matchScholarships(userBranch: string, gpa: number) {
  return [
    {
      id: 'sch_gtu_merit',
      title: 'GTU Merit-Cum-Means Engineering Scholarship',
      provider: 'Government of Gujarat',
      amountINR: 50000,
      deadline: '2026-09-30',
      isEligible: gpa >= 8.0,
      matchScorePercent: gpa >= 8.0 ? 98 : 45
    },
    {
      id: 'sch_digital_gujarat',
      title: 'Digital Gujarat Higher Education Scholarship',
      provider: 'Education Department, Gujarat',
      amountINR: 35000,
      deadline: '2026-10-15',
      isEligible: true,
      matchScorePercent: 95
    }
  ];
}

/**
 * MODULE 11 — National Exam Catalog
 */
export function getNationalExams(): NationalExamCatalog[] {
  return [
    { examCode: 'GATE', examName: 'Graduate Aptitude Test in Engineering', conductingBody: 'IIT Consortium', totalSeats: 15000, syllabusUnits: ['Engineering Mathematics', 'Digital Logic', 'COA', 'DSA', 'Algorithms', 'OS', 'DBMS', 'Computer Networks'], mockTestCount: 45 },
    { examCode: 'JEE', examName: 'Joint Entrance Examination Main & Advanced', conductingBody: 'NTA', totalSeats: 50000, syllabusUnits: ['Physics', 'Chemistry', 'Mathematics'], mockTestCount: 120 },
    { examCode: 'CAT', examName: 'Common Admission Test', conductingBody: 'IIM Consortium', totalSeats: 6000, syllabusUnits: ['VARC', 'DILR', 'QA'], mockTestCount: 30 }
  ];
}

/**
 * MODULE 13 — Gamification Engine
 */
export function getUserGamification(userId: string): GamificationProfile {
  return {
    userId,
    xp: 4850,
    coins: 620,
    level: 14,
    title: 'GTU Code Master',
    streakDays: 18,
    achievements: [
      { id: 'ach_1', name: '7-Day Study Streak', unlockedAt: '2026-07-28' },
      { id: 'ach_2', name: '50 PYQs Solved', unlockedAt: '2026-08-02' },
      { id: 'ach_3', name: 'GTU Mock Test Champion', unlockedAt: '2026-08-06' }
    ]
  };
}

/**
 * MODULE 15 — Enterprise Payment Platform Engine
 */
export function generateGSTInvoice(userId: string, amountINR: number): PaymentInvoice {
  const gstRate = 0.18;
  const gstAmountINR = Math.round(amountINR * gstRate * 100) / 100;
  const totalAmountINR = amountINR + gstAmountINR;

  return {
    invoiceId: `INV_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    userId,
    amountINR,
    gstAmountINR,
    totalAmountINR,
    paymentMethod: 'UPI',
    status: 'PAID',
    paidAt: new Date().toISOString()
  };
}
