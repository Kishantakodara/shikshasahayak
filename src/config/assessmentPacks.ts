// ============================================================
// ShikshaSahayak Assessment Platform — Dynamic Configuration Engine
// Phase 1: GTU Focus (NEP 2020 / 2024-25 Scheme)
// Scalable multi-university configuration architecture.
// ============================================================

export interface UniversityConfig {
  id: string;
  name: string;
  shortName: string;
  code: string;
  logoUrl?: string;
  colleges: CollegeConfig[];
  degrees: DegreeConfig[];
}

export interface CollegeConfig {
  id: string;
  name: string;
  shortName: string;
  city: string;
}

export interface DegreeConfig {
  id: string;
  name: string;
  shortName: string;
  durationYears: number;
}

export interface BranchPackConfig {
  id: string;
  name: string;
  shortName: string;
  iconName: string;
  coreSubjects: Record<number, string[]>; // Semester (1-8) -> Subject Names
  defaultWidgets: string[]; // Widget IDs enabled by default
  recommendedGoals: string[];
}

export interface GoalPackConfig {
  id: string;
  name: string;
  category: 'academic' | 'career' | 'competitive' | 'skills' | 'coding';
  iconName: string;
  description: string;
  unlockedWidgets: string[]; // Widget IDs enabled when goal is selected
}

export interface WidgetDefinition {
  id: string;
  title: string;
  description: string;
  category: 'academic' | 'career' | 'revision' | 'coding' | 'productivity' | 'branch_specific';
  iconName: string;
  targetBranch?: string; // Optional branch affinity
  defaultGridSpan?: 'small' | 'medium' | 'large' | 'full';
  isCrossBranchFriendly?: boolean;
}

// ------------------------------------------------------------
// UNIVERSITIES & COLLEGES (GTU Phase 1)
// ------------------------------------------------------------
export const UNIVERSITIES: UniversityConfig[] = [
  {
    id: 'gtu',
    name: 'Gujarat Technological University',
    shortName: 'GTU',
    code: '007',
    colleges: [
      { id: 'ldce', name: 'L.D. College of Engineering', shortName: 'LDCE', city: 'Ahmedabad' },
      { id: 'vgec', name: 'Vishwakarma Government Engineering College', shortName: 'VGEC', city: 'Chandkheda' },
      { id: 'bvm', name: 'Birla Vishvakarma Mahavidyalaya', shortName: 'BVM', city: 'V.V. Nagar' },
      { id: 'gecg', name: 'Government Engineering College', shortName: 'GECG', city: 'Gandhinagar' },
      { id: 'gecr', name: 'Government Engineering College', shortName: 'GECR', city: 'Rajkot' },
      { id: 'gecs', name: 'Government Engineering College', shortName: 'GECS', city: 'Surat' },
      { id: 'nirma', name: 'Institute of Technology, Nirma University', shortName: 'ITNU', city: 'Ahmedabad' },
      { id: 'pdpu', name: 'Pandit Deendayal Energy University', shortName: 'PDEU', city: 'Gandhinagar' },
      { id: 'silveroak', name: 'Silver Oak College of Engineering & Tech', shortName: 'SOCET', city: 'Ahmedabad' },
    ],
    degrees: [
      { id: 'btech', name: 'Bachelor of Technology / Engineering', shortName: 'B.Tech / B.E.', durationYears: 4 },
      { id: 'diploma', name: 'Diploma Engineering', shortName: 'Diploma', durationYears: 3 },
      { id: 'mtech', name: 'Master of Technology', shortName: 'M.Tech', durationYears: 2 },
    ],
  },
  {
    id: 'aktu',
    name: 'Dr. A.P.J. Abdul Kalam Technical University',
    shortName: 'AKTU / UPTU',
    code: '001',
    colleges: [
      { id: 'iet_lucknow', name: 'Institute of Engineering and Technology', shortName: 'IET Lucknow', city: 'Lucknow' },
      { id: 'kiet_ghaziabad', name: 'KIET Group of Institutions', shortName: 'KIET', city: 'Ghaziabad' },
      { id: 'akgec', name: 'Ajay Kumar Garg Engineering College', shortName: 'AKGEC', city: 'Ghaziabad' },
      { id: 'jssaten', name: 'JSS Academy of Technical Education', shortName: 'JSSATE', city: 'Noida' }
    ],
    degrees: [
      { id: 'btech', name: 'Bachelor of Technology / Engineering', shortName: 'B.Tech / B.E.', durationYears: 4 },
      { id: 'mtech', name: 'Master of Technology', shortName: 'M.Tech', durationYears: 2 }
    ]
  },
  {
    id: 'vtu',
    name: 'Visvesvaraya Technological University',
    shortName: 'VTU',
    code: '002',
    colleges: [
      { id: 'rvce', name: 'R.V. College of Engineering', shortName: 'RVCE', city: 'Bengaluru' },
      { id: 'bmsce', name: 'B.M.S. College of Engineering', shortName: 'BMSCE', city: 'Bengaluru' },
      { id: 'msrit', name: 'M.S. Ramaiah Institute of Technology', shortName: 'MSRIT', city: 'Bengaluru' },
      { id: 'sit_tumkur', name: 'Siddaganga Institute of Technology', shortName: 'SIT', city: 'Tumakuru' }
    ],
    degrees: [
      { id: 'btech', name: 'Bachelor of Technology / Engineering', shortName: 'B.Tech / B.E.', durationYears: 4 },
      { id: 'mtech', name: 'Master of Technology', shortName: 'M.Tech', durationYears: 2 }
    ]
  },
  {
    id: 'anna',
    name: 'Anna University',
    shortName: 'Anna Univ',
    code: '003',
    colleges: [
      { id: 'ceg_guindy', name: 'College of Engineering, Guindy', shortName: 'CEG', city: 'Chennai' },
      { id: 'mit_chromepet', name: 'Madras Institute of Technology', shortName: 'MIT', city: 'Chennai' },
      { id: 'psg_tech', name: 'PSG College of Technology', shortName: 'PSG Tech', city: 'Coimbatore' }
    ],
    degrees: [
      { id: 'btech', name: 'Bachelor of Technology / Engineering', shortName: 'B.Tech / B.E.', durationYears: 4 },
      { id: 'mtech', name: 'Master of Technology', shortName: 'M.Tech', durationYears: 2 }
    ]
  },
  {
    id: 'jntuh',
    name: 'Jawaharlal Nehru Technological University Hyderabad',
    shortName: 'JNTUH',
    code: '004',
    colleges: [
      { id: 'jntu_ceh', name: 'JNTU College of Engineering Hyderabad', shortName: 'JNTUH CEH', city: 'Hyderabad' },
      { id: 'cbr', name: 'CBR Engineering College', shortName: 'CBRE', city: 'Hyderabad' },
      { id: 'vasavi', name: 'Vasavi College of Engineering', shortName: 'VCE', city: 'Hyderabad' }
    ],
    degrees: [
      { id: 'btech', name: 'Bachelor of Technology / Engineering', shortName: 'B.Tech / B.E.', durationYears: 4 },
      { id: 'mtech', name: 'Master of Technology', shortName: 'M.Tech', durationYears: 2 }
    ]
  },
  {
    id: 'rgpv',
    name: 'Rajiv Gandhi Proudyogiki Vishwavidyalaya',
    shortName: 'RGPV',
    code: '005',
    colleges: [
      { id: 'uit_rgpv', name: 'University Institute of Technology RGPV', shortName: 'UIT RGPV', city: 'Bhopal' },
      { id: 'gsits', name: 'Shri Govindram Seksaria Institute of Technology and Science', shortName: 'SGSITS', city: 'Indore' }
    ],
    degrees: [
      { id: 'btech', name: 'Bachelor of Technology / Engineering', shortName: 'B.Tech / B.E.', durationYears: 4 },
      { id: 'mtech', name: 'Master of Technology', shortName: 'M.Tech', durationYears: 2 }
    ]
  },
  {
    id: 'makaut',
    name: 'Maulana Abul Kalam Azad University of Technology',
    shortName: 'MAKAUT',
    code: '006',
    colleges: [
      { id: 'kgp_eng', name: 'Kalyani Government Engineering College', shortName: 'KGEC', city: 'Kalyani' },
      { id: 'heritage', name: 'Heritage Institute of Technology', shortName: 'HIT', city: 'Kolkata' }
    ],
    degrees: [
      { id: 'btech', name: 'Bachelor of Technology / Engineering', shortName: 'B.Tech / B.E.', durationYears: 4 }
    ]
  },
  {
    id: 'sppu',
    name: 'Savitribai Phule Pune University',
    shortName: 'SPPU',
    code: '008',
    colleges: [
      { id: 'coep', name: 'COEP Technological University', shortName: 'COEP', city: 'Pune' },
      { id: 'vit_pune', name: 'Vishwakarma Institute of Technology', shortName: 'VIT Pune', city: 'Pune' }
    ],
    degrees: [
      { id: 'btech', name: 'Bachelor of Technology / Engineering', shortName: 'B.Tech / B.E.', durationYears: 4 }
    ]
  },
  {
    id: 'iits_nits',
    name: 'IITs / NITs / IIITs System',
    shortName: 'IIT / NIT',
    code: '100',
    colleges: [
      { id: 'iitb', name: 'Indian Institute of Technology Bombay', shortName: 'IITB', city: 'Mumbai' },
      { id: 'iitd', name: 'Indian Institute of Technology Delhi', shortName: 'IITD', city: 'New Delhi' },
      { id: 'iitm', name: 'Indian Institute of Technology Madras', shortName: 'IITM', city: 'Chennai' },
      { id: 'nitt', name: 'National Institute of Technology Tiruchirappalli', shortName: 'NITT', city: 'Trichy' },
      { id: 'nitk', name: 'National Institute of Technology Surathkal', shortName: 'NITK', city: 'Mangaluru' }
    ],
    degrees: [
      { id: 'btech', name: 'Bachelor of Technology', shortName: 'B.Tech', durationYears: 4 },
      { id: 'mtech', name: 'Master of Technology', shortName: 'M.Tech', durationYears: 2 }
    ]
  }
];

// ------------------------------------------------------------
// BRANCH PACKS (Predefined academic configurations for GTU)
// ------------------------------------------------------------
export const BRANCH_PACKS: Record<string, BranchPackConfig> = {
  cse: {
    id: 'cse',
    name: 'Computer Engineering',
    shortName: 'CSE',
    iconName: 'Cpu',
    coreSubjects: {
      1: ['Calculus', 'Basic Electrical Engineering', 'Engineering Graphics', 'Physics'],
      2: ['Vector Calculus & Linear Algebra', 'Programming for Problem Solving', 'Basic Electronics', 'Chemistry'],
      3: ['Data Structures', 'Database Management Systems', 'Digital Fundamentals', 'Object Oriented Programming with C++'],
      4: ['Operating Systems', 'Computer Networks', 'Discrete Mathematics', 'Computer Organization & Architecture'],
      5: ['Analysis & Design of Algorithms', 'Software Engineering', 'Theory of Computation', 'Cyber Security'],
      6: ['Web Technology', 'Compiler Design', 'Advanced Java Programming', 'Artificial Intelligence'],
      7: ['Cloud Computing', 'Machine Learning', 'Information Security', 'Mobile Application Development'],
      8: ['Project Phase-II', 'Big Data Analytics', 'Internet of Things']
    },
    defaultWidgets: ['daily_quiz', 'pyqs', 'coding_practice', 'mock_tests', 'weak_topics', 'subject_progress'],
    recommendedGoals: ['gtu_prep', 'gate_prep', 'coding_practice', 'placement_prep']
  },
  it: {
    id: 'it',
    name: 'Information Technology',
    shortName: 'IT',
    iconName: 'Compass',
    coreSubjects: {
      1: ['Calculus', 'Basic Electrical Engineering', 'Physics'],
      2: ['Vector Calculus', 'Programming for Problem Solving', 'Basic Electronics'],
      3: ['Data Structures', 'Database Management Systems', 'Digital Logic Design'],
      4: ['Operating Systems', 'Computer Networks', 'Object Oriented Programming with Java'],
      5: ['Design & Analysis of Algorithms', 'Software Engineering', 'Python Programming'],
      6: ['Information Security', 'Web Technologies', 'Full Stack Development'],
      7: ['Cloud Computing', 'Data Mining & Business Intelligence', 'DevOps Fundamentals'],
      8: ['Major Project', 'Cyber Forensics']
    },
    defaultWidgets: ['daily_quiz', 'pyqs', 'coding_practice', 'mock_tests', 'weak_topics', 'subject_progress'],
    recommendedGoals: ['gtu_prep', 'placement_prep', 'coding_practice']
  },
  me: {
    id: 'me',
    name: 'Mechanical Engineering',
    shortName: 'ME',
    iconName: 'Wrench',
    coreSubjects: {
      1: ['Calculus', 'Basic Electrical Engineering', 'Engineering Graphics'],
      2: ['Vector Calculus', 'Material Science', 'Basic Mechanical Engineering'],
      3: ['Mechanics of Solids', 'Thermodynamics', 'Manufacturing Processes-I', 'Engineering Metallurgy'],
      4: ['Kinematics of Machines', 'Fluid Mechanics', 'Applied Thermodynamics', 'Manufacturing Processes-II'],
      5: ['Dynamics of Machinery', 'Heat Transfer', 'Design of Machine Elements', 'Control Engineering'],
      6: ['Computer Aided Design (CAD)', 'Internal Combustion Engines', 'Refrigeration & Air Conditioning'],
      7: ['Power Plant Engineering', 'Finite Element Method', 'Industrial Engineering'],
      8: ['Automobile Engineering', 'Major Project']
    },
    defaultWidgets: ['daily_quiz', 'pyqs', 'formula_revision', 'numericals', 'mock_tests', 'subject_progress'],
    recommendedGoals: ['gtu_prep', 'gate_prep', 'cpi_boost']
  },
  ce: {
    id: 'ce',
    name: 'Civil Engineering',
    shortName: 'CE',
    iconName: 'Building2',
    coreSubjects: {
      1: ['Calculus', 'Engineering Physics', 'Basic Civil Engineering'],
      2: ['Vector Calculus', 'Engineering Mechanics', 'Basic Mechanical Engineering'],
      3: ['Mechanics of Solids', 'Surveying', 'Fluid Mechanics', 'Building Construction'],
      4: ['Structural Analysis-I', 'Geotechnical Engineering', 'Hydrology & Water Resources'],
      5: ['Structural Analysis-II', 'Design of Reinforced Concrete Structures', 'Environmental Engineering-I'],
      6: ['Design of Steel Structures', 'Transportation Engineering', 'Construction Management'],
      7: ['Irrigation Engineering', 'Estimation & Costing', 'Earthquake Engineering'],
      8: ['Advanced Structural Design', 'Major Project']
    },
    defaultWidgets: ['daily_quiz', 'pyqs', 'formula_revision', 'mock_tests', 'subject_progress'],
    recommendedGoals: ['gtu_prep', 'gate_prep', 'higher_studies']
  },
  ee: {
    id: 'ee',
    name: 'Electrical Engineering',
    shortName: 'EE',
    iconName: 'Zap',
    coreSubjects: {
      1: ['Calculus', 'Physics', 'Basic Electrical Engineering'],
      2: ['Vector Calculus', 'Basic Electronics', 'Programming for Problem Solving'],
      3: ['Electrical Circuit Analysis', 'Electrical Machines-I', 'Analog Electronics'],
      4: ['Electrical Machines-II', 'Power System-I', 'Electromagnetic Field Theory'],
      5: ['Power Electronics', 'Power System-II', 'Control System Engineering'],
      6: ['Microcontrollers & Applications', 'Switchgear & Protection', 'High Voltage Engineering'],
      7: ['Electrical Drives', 'Renewable Energy Sources', 'Power Quality'],
      8: ['Major Project', 'Smart Grid Technology']
    },
    defaultWidgets: ['daily_quiz', 'pyqs', 'formula_revision', 'numericals', 'mock_tests', 'subject_progress'],
    recommendedGoals: ['gtu_prep', 'gate_prep', 'cpi_boost']
  },
  ece: {
    id: 'ece',
    name: 'Electronics & Communication',
    shortName: 'ECE',
    iconName: 'Radio',
    coreSubjects: {
      1: ['Calculus', 'Physics', 'Basic Electrical Engineering'],
      2: ['Vector Calculus', 'Programming for Problem Solving', 'Basic Electronics'],
      3: ['Digital Electronics', 'Network Theory', 'Electronic Devices & Circuits'],
      4: ['Signals & Systems', 'Analog Communication', 'Microprocessor & Microcontrollers'],
      5: ['Digital Signal Processing', 'Digital Communication', 'Control Systems'],
      6: ['VLSI Design', 'Antenna & Wave Propagation', 'Embedded Systems'],
      7: ['Optical Communication', 'Wireless Communication', 'Microwave Engineering'],
      8: ['Major Project', 'Satellite Communication']
    },
    defaultWidgets: ['daily_quiz', 'pyqs', 'formula_revision', 'mock_tests', 'coding_practice', 'subject_progress'],
    recommendedGoals: ['gtu_prep', 'gate_prep', 'placement_prep']
  }
};

// ------------------------------------------------------------
// GOAL PACKS (Configurable Goal-Driven Modules)
// ------------------------------------------------------------
export const GOAL_PACKS: Record<string, GoalPackConfig> = {
  gtu_prep: {
    id: 'gtu_prep',
    name: 'GTU End Sem Preparation',
    category: 'academic',
    iconName: 'GraduationCap',
    description: 'Targeted GTU previous year papers, unit tests, and syllabus coverage for high CPI.',
    unlockedWidgets: ['gtu_exam_countdown', 'pyqs', 'important_questions', 'revision_planner', 'subject_progress']
  },
  gate_prep: {
    id: 'gate_prep',
    name: 'GATE Preparation',
    category: 'competitive',
    iconName: 'Award',
    description: 'Concept quizzes, NAT/MSQ questions, formula cheat sheets, and GATE PYQs.',
    unlockedWidgets: ['gate_concept_quiz', 'formula_revision', 'gate_pyq_analysis', 'mock_tests']
  },
  placement_prep: {
    id: 'placement_prep',
    name: 'Placement & Interview Prep',
    category: 'career',
    iconName: 'Briefcase',
    description: 'Quantitative aptitude, technical interview Q&A, and resume checklists.',
    unlockedWidgets: ['aptitude_practice', 'interview_questions', 'resume_checklist', 'coding_challenge']
  },
  coding_practice: {
    id: 'coding_practice',
    name: 'Coding & Data Structures',
    category: 'coding',
    iconName: 'Code',
    description: 'Daily code wars, DSA practice problems, streak tracker, and problem solving.',
    unlockedWidgets: ['coding_challenge', 'dsa_tracker', 'daily_streak']
  },
  cpi_boost: {
    id: 'cpi_boost',
    name: 'Improve CPI / GPA',
    category: 'academic',
    iconName: 'TrendingUp',
    description: 'Focus on weak topics, mid-sem score boosters, and quick revision flashcards.',
    unlockedWidgets: ['weak_topics', 'flashcards', 'subject_progress']
  },
  skill_dev: {
    id: 'skill_dev',
    name: 'Skill & Tech Development',
    category: 'skills',
    iconName: 'Sparkles',
    description: 'Hands-on projects, modern toolboxes, and industry tech stack roadmaps.',
    unlockedWidgets: ['toolbox_widget', 'project_showcase']
  },
  higher_studies: {
    id: 'higher_studies',
    name: 'Higher Studies & Research',
    category: 'academic',
    iconName: 'BookOpen',
    description: 'GRE/GATE preparation, research paper breakdowns, and university roadmaps.',
    unlockedWidgets: ['research_hub', 'gate_concept_quiz']
  }
};

// ------------------------------------------------------------
// WIDGET LIBRARY CATALOG (All available modular widgets)
// ------------------------------------------------------------
export const WIDGET_CATALOG: WidgetDefinition[] = [
  // Academic
  { id: 'daily_quiz', title: 'Daily Subject Quiz', description: 'Daily 5-minute MCQ set tailored to your current GTU semester.', category: 'academic', iconName: 'BrainCircuit', defaultGridSpan: 'small', isCrossBranchFriendly: true },
  { id: 'pyqs', title: 'GTU Previous Year Papers', description: 'Official GTU semester question papers and answer keys.', category: 'academic', iconName: 'FileText', defaultGridSpan: 'medium', isCrossBranchFriendly: true },
  { id: 'mock_tests', title: 'Full Length Mock Tests', description: 'Timed exam environment with instant scoring and solutions.', category: 'academic', iconName: 'Clock', defaultGridSpan: 'medium', isCrossBranchFriendly: true },
  { id: 'weak_topics', title: 'Weak Topics AI Focus', description: 'Rule-based tracker identifying topics where your accuracy is below 60%.', category: 'academic', iconName: 'AlertTriangle', defaultGridSpan: 'small', isCrossBranchFriendly: true },
  { id: 'subject_progress', title: 'Subject Syllabus Progress', description: 'Track your unit-by-unit syllabus completion across all subjects.', category: 'academic', iconName: 'BarChart2', defaultGridSpan: 'medium', isCrossBranchFriendly: true },
  { id: 'gtu_exam_countdown', title: 'GTU Exam Countdown', description: 'Live countdown timer for your upcoming university end-sem exams.', category: 'academic', iconName: 'Calendar', defaultGridSpan: 'small', isCrossBranchFriendly: true },
  { id: 'important_questions', title: 'High-Yield GTU Questions', description: 'Most frequently asked 7-mark and 4-mark questions in GTU exams.', category: 'academic', iconName: 'Sparkles', defaultGridSpan: 'medium', isCrossBranchFriendly: true },

  // Revision
  { id: 'formula_revision', title: 'Formula & Concept Sheet', description: 'Quick-access mathematical formulas and core engineering theorems.', category: 'revision', iconName: 'Calculator', defaultGridSpan: 'medium', isCrossBranchFriendly: true },
  { id: 'flashcards', title: 'Active Recall Flashcards', description: 'Spaced repetition flashcards for definitions, equations, and rules.', category: 'revision', iconName: 'Copy', defaultGridSpan: 'small', isCrossBranchFriendly: true },
  { id: 'revision_planner', title: 'Smart Revision Planner', description: 'Scheduled revision reminders for completed chapters.', category: 'revision', iconName: 'RotateCcw', defaultGridSpan: 'small', isCrossBranchFriendly: true },

  // Coding & Technical
  { id: 'coding_challenge', title: 'Daily Coding Challenge', description: 'Hands-on programming problems with instant test case runner.', category: 'coding', iconName: 'Code', targetBranch: 'cse', defaultGridSpan: 'medium', isCrossBranchFriendly: true },
  { id: 'dsa_tracker', title: 'Data Structures Sheet', description: '75 essential LeetCode/GTU DSA problems tracking grid.', category: 'coding', iconName: 'GitBranch', targetBranch: 'cse', defaultGridSpan: 'medium', isCrossBranchFriendly: true },

  // Career
  { id: 'aptitude_practice', title: 'Quantitative Aptitude', description: 'Practice sets for company placement drives and competitive exams.', category: 'career', iconName: 'Target', defaultGridSpan: 'small', isCrossBranchFriendly: true },
  { id: 'interview_questions', title: 'Technical Interview Q&A', description: 'Top technical interview questions asked by hiring companies.', category: 'career', iconName: 'MessageSquare', defaultGridSpan: 'medium', isCrossBranchFriendly: true },
  { id: 'resume_checklist', title: 'Placement Resume Checklist', description: 'Key milestones, project guidelines, and verification rules.', category: 'career', iconName: 'CheckSquare', defaultGridSpan: 'small', isCrossBranchFriendly: true },

  // Productivity & Utility
  { id: 'daily_streak', title: 'Study Streak Tracker', description: 'Track your daily login and practice consistency.', category: 'productivity', iconName: 'Flame', defaultGridSpan: 'small', isCrossBranchFriendly: true },
  { id: 'toolbox_widget', title: 'Engineering Toolbox', description: 'Converters, online IDEs, scientific calculators, and reference charts.', category: 'productivity', iconName: 'Sliders', defaultGridSpan: 'medium', isCrossBranchFriendly: true },
  { id: 'project_showcase', title: 'Student Project Showcase', description: 'Explore peer engineering projects and submit your portfolio work.', category: 'career', iconName: 'FolderGit2', defaultGridSpan: 'medium', isCrossBranchFriendly: true }
];

export function normalizeBranchId(branchInput: string | undefined | null): string {
  if (!branchInput) return 'cse';
  const b = branchInput.toLowerCase().trim().replace(/[-_]/g, ' ');
  if (b === 'ee' || (b.includes('electr') && !b.includes('electronics') && !b.includes('comm') && !b.includes('tele'))) {
    return 'ee';
  }
  if (b === 'ece' || b === 'ec' || b.includes('electronic') || b.includes('comm') || b.includes('telecommunication') || b.includes('instrumentation')) {
    return 'ece';
  }
  if (b === 'me' || b.includes('mech') || b.includes('automobile') || b.includes('aeronautical') || b.includes('production') || b.includes('industrial') || b.includes('mechatronics') || b.includes('metallurgy') || b.includes('marine')) {
    return 'me';
  }
  if (b === 'ce' || b.includes('civil') || b.includes('structural') || b.includes('environmental') || b.includes('mining')) {
    return 'ce';
  }
  if (b === 'it' || b.includes('information') || b.includes('cloud') || b.includes('data science') || b.includes('ai') || b.includes('artificial')) {
    return 'it';
  }
  if (b === 'cse' || b.includes('computer') || b.includes('software') || b.includes('cyber')) {
    return 'cse';
  }
  if (BRANCH_PACKS[b]) {
    return b;
  }
  return 'cse';
}
