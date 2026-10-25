/**
 * SHIKSHA SAHAYAK OS — 100 DAYS OF CODE FRONTEND CURRICULUM DATA
 * Contains track specifications, badges, phases, and day problem details.
 */

export interface TrackMetadata {
  id: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  prerequisites: string[];
  plannedDays: number;
  availableDays: number;
  estimatedHoursPerDay: number;
  iconName: string;
  badgeColor: string;
  tags: string[];
}

export interface DayRoadmapItem {
  dayNumber: number;
  title: string;
  phaseNumber: number;
  phaseName: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  estimatedMinutes: number;
  xpReward: number;
  isMilestone?: boolean;
  isProjectDay?: boolean;
}

export interface TestCaseDTO {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface DayProblemDetailDTO {
  id: string;
  trackId: string;
  dayNumber: number;
  title: string;
  phaseNumber: number;
  phaseName: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  estimatedMinutes: number;
  xpReward: number;
  learningObjectives: string[];
  lessonContent: string;
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  starterCode: {
    cpp: string;
    java: string;
    python: string;
    javascript: string;
  };
  testCases: TestCaseDTO[];
  hints: string[];
  isMilestone?: boolean;
  isProjectDay?: boolean;
}

export interface BadgeDefinition {
  key: string;
  title: string;
  description: string;
  icon: string;
  requiredDaysCount?: number;
  requiredStreak?: number;
}

export const AVAILABLE_TRACKS: TrackMetadata[] = [
  {
    id: 'dsa',
    name: 'DSA & Problem Solving',
    shortDescription: 'Master algorithmic patterns, time complexities, and campus placement interview coding questions.',
    longDescription: 'Curated 100-day progression covering arrays, hash maps, two pointers, stacks, trees, dynamic programming, and graph algorithms required for top software engineering interviews.',
    level: 'Beginner',
    prerequisites: ['Basic math', 'Familiarity with any high-level language'],
    plannedDays: 100,
    availableDays: 100,
    estimatedHoursPerDay: 1,
    iconName: 'Binary',
    badgeColor: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    tags: ['Placement Ready', 'FAANG / Tier 1', 'GTU Syllabus Compliant']
  },
  {
    id: 'python',
    name: 'Python Mastery & Scripting',
    shortDescription: 'From fundamentals and data analysis to object-oriented programming and algorithmic automation.',
    longDescription: 'Structured journey through Python 3 syntax, list comprehensions, functional programming, file parsing, web scrapers, data structures, and mini-automation projects.',
    level: 'Beginner',
    prerequisites: ['No prior programming experience required'],
    plannedDays: 100,
    availableDays: 100,
    estimatedHoursPerDay: 1,
    iconName: 'FileCode2',
    badgeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    tags: ['Automation', 'Data Science Prep', 'Beginner Friendly']
  },
  {
    id: 'web-dev',
    name: 'Modern Web Development',
    shortDescription: 'Build responsive, accessible web applications with HTML5, CSS3, Modern JavaScript, and React.',
    longDescription: 'Go from semantic markup and Flexbox/Grid to DOM manipulation, asynchronous JavaScript, REST APIs, React 19 component architecture, and cloud deployment.',
    level: 'Beginner',
    prerequisites: ['Basic computer literacy', 'Browser developer tools'],
    plannedDays: 100,
    availableDays: 100,
    estimatedHoursPerDay: 1.5,
    iconName: 'Globe',
    badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    tags: ['Frontend', 'React 19', 'Portfolio Projects']
  },
  {
    id: 'java',
    name: 'Java Enterprise & Core Systems',
    shortDescription: 'Deep-dive into Object-Oriented Design, Java Collections Framework, Multithreading, and Clean Architecture.',
    longDescription: 'Comprehensive curriculum for campus recruitment and backend engineering. Covers JVM internals, OOP principles, collections, stream API, exception handling, and enterprise patterns.',
    level: 'Intermediate',
    prerequisites: ['Basic programming syntax in any language'],
    plannedDays: 100,
    availableDays: 100,
    estimatedHoursPerDay: 1.5,
    iconName: 'Coffee',
    badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    tags: ['Backend', 'OOP Design', 'Enterprise Ready']
  },
  {
    id: 'cpp',
    name: 'C++ Systems & Competitive Coding',
    shortDescription: 'Fast I/O, C++20 STL containers, memory pointers, bit manipulation, and competitive programming tactics.',
    longDescription: 'Engineered for competitive coders and systems developers. Covers pointer arithmetic, template metaprogramming, STL iterators, sorting optimizations, and Codeforces/LeetCode patterns.',
    level: 'Intermediate',
    prerequisites: ['Basic understanding of functions and loops'],
    plannedDays: 100,
    availableDays: 100,
    estimatedHoursPerDay: 1.5,
    iconName: 'Cpu',
    badgeColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    tags: ['Competitive Programming', 'Low-Level Performance', 'STL Mastery']
  },
  {
    id: 'fullstack',
    name: 'Full-Stack Development & Cloud',
    shortDescription: 'Connect frontend interfaces with Node/Express APIs, Cloudflare Workers, SQL databases, and secure auth.',
    longDescription: 'End-to-end full-stack curriculum combining React frontends, Cloudflare Workers edge APIs, D1/SQL database modeling, JWT/Firebase authentication, and production hosting.',
    level: 'Advanced',
    prerequisites: ['Familiarity with HTML, CSS and JavaScript'],
    plannedDays: 100,
    availableDays: 100,
    estimatedHoursPerDay: 2,
    iconName: 'Layers',
    badgeColor: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    tags: ['Full Stack', 'Cloud Native', 'Capstone Ready']
  }
];

export const BADGES_LIST: BadgeDefinition[] = [
  {
    key: 'first_day_solved',
    title: 'First Step Taken',
    description: 'Successfully solved your Day 1 coding sprint.',
    icon: 'Sparkles',
    requiredDaysCount: 1
  },
  {
    key: 'three_day_streak',
    title: 'Momentum Builder',
    description: 'Maintained a 3-day continuous daily coding streak.',
    icon: 'Flame',
    requiredStreak: 3
  },
  {
    key: 'week_warrior',
    title: '7-Day Code Warrior',
    description: 'Completed 7 full days of programming challenges without breaking your streak.',
    icon: 'Trophy',
    requiredStreak: 7
  },
  {
    key: 'phase_1_master',
    title: 'Foundations Champion',
    description: 'Completed all 20 days of Phase 1: Core Foundations.',
    icon: 'ShieldCheck',
    requiredDaysCount: 20
  },
  {
    key: 'thirty_day_veteran',
    title: 'Habit of Excellence',
    description: 'Completed 30 days of code with verified algorithmic solutions.',
    icon: 'Zap',
    requiredDaysCount: 30
  },
  {
    key: 'half_century',
    title: 'Half-Century Coder',
    description: 'Reached Day 50 of your 100 Days of Code roadmap.',
    icon: 'Award',
    requiredDaysCount: 50
  },
  {
    key: 'phase_4_architect',
    title: 'System Architect',
    description: 'Conquered 80 days of real-world development challenges.',
    icon: 'Compass',
    requiredDaysCount: 80
  },
  {
    key: 'hundred_days_legend',
    title: '100 Days Legend',
    description: 'Completed all 100 days of the ShikshaSahayak engineering challenge.',
    icon: 'Crown',
    requiredDaysCount: 100
  }
];

export function getPhaseInfo(dayNumber: number): { phaseNumber: number; phaseName: string } {
  if (dayNumber <= 20) return { phaseNumber: 1, phaseName: 'Foundations & Syntax Mastery' };
  if (dayNumber <= 40) return { phaseNumber: 2, phaseName: 'Data Structures & Problem Solving' };
  if (dayNumber <= 60) return { phaseNumber: 3, phaseName: 'Building & Algorithmic Application' };
  if (dayNumber <= 80) return { phaseNumber: 4, phaseName: 'Real-World Systems & Optimization' };
  return { phaseNumber: 5, phaseName: 'Capstone Projects & Portfolio' };
}
