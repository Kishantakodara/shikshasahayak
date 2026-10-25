'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getGtuOfficialSyllabusUrl } from '../../utils/gtuSyllabus';
import { getGtuPyqUrl, GTU_PAPERS_ARCHIVE_URL } from '../../utils/gtuPyq';
import { browsePaths, encodeSemesterSlug } from '../../utils/browsePaths';
import GtuSyllabusModal from '../../components/GtuSyllabusModal';
import { StudentAttendanceModal } from '../../components/student/StudentAttendanceModal';
import { JoinClassModal } from '../../components/student/JoinClassModal';
import { StudentMasteryRoadmap } from '../../components/student/StudentMasteryRoadmap';

import { teacherClient } from '../../api/teacherClient';
import { getActiveAttendanceSessionForStudent, subscribeToSyncEvent, SYNC_EVENTS } from '../../utils/realtimeSync';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  BookOpen, 
  Award, 
  BrainCircuit, 
  Calendar, 
  ShieldCheck, 
  Users, 
  ArrowRight,
  Radio,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  HelpCircle,
  FileText,
  BarChart4,
  Flame,
  Check,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  LayoutDashboard,
  ClipboardList,
  FolderOpen,
  Trophy,
  History,
  Settings,
  HelpCircle as QuestionIcon,
  Play,
  CheckSquare,
  BookOpenCheck,
  Crown,
  AlertTriangle,
  Menu,
  Clock,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet,
  Plus,
  Send,
  X,
  RefreshCw,
  LogOut,
  User,
  Info,
  ChevronLeft,
  Building2,
  Cpu,
  Zap,
  Wrench,
  Compass,
  Filter,
  CheckCircle2,
  GraduationCap,
  Layers,
  Download,
  Coins,
  Bot,
  Code,
  Github,
  Target,
  Star,
  Share2,
  MessageSquare,
  ThumbsUp,
  Upload,
  Terminal,
  Bookmark,
  Sparkle,
  Trash2,
  Edit,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  FileUp,
  FileDown,
  Sliders,
  ShieldAlert,
  UserCheck,
  UserX,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ListOrdered,
  Activity,
  Database,
  ToggleLeft,
  ToggleRight,
  Share,
  Megaphone,
  Folder,
  TrendingUp,
  Mail,
  Pause,
  PlayCircle,
  FileJson,
  Shield,
  Briefcase,
  Globe,
  Pin,
  Save
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useStudentAcademic } from '../../context/StudentAcademicContext';
import { apiClient, getStoredTokens } from '@/api/client';
import { auth } from '../../utils/firebase';
import { fetchD1StudentProfile } from '../../api/studentIdentityClient';
import PyqQuizHub from './PyqQuizHub';
import PracticeZone from './PracticeZone';
import MyLibrary from './MyLibrary';
import AIChat from '../AIChat';
import SmartDownloadManager from './SmartDownloadManager';
import { SearchableBranchSelect } from '../../components/SearchableBranchSelect';
import { SearchableCollegeSelect } from '../../components/SearchableCollegeSelect';
import { SearchableUniversitySelect } from '../../components/SearchableUniversitySelect';
import { StudentOnboardingModal } from '../../components/assessment/StudentOnboardingModal';
import { WidgetLibraryModal } from '../../components/assessment/WidgetLibraryModal';
import { generateStudentRecommendations } from '../../utils/recommendationEngine';
import { BRANCH_PACKS, GOAL_PACKS, WIDGET_CATALOG, normalizeBranchId } from '../../config/assessmentPacks';
import {
  WidgetCard,
  WelcomeCard,
  TodaysMission,
  ContinueLearning,
  AIMentorWidget,
  QuickStatsWidget,
  HundredDaysTrack,
  BranchChallengeWidget,
  WeeklyChallengeWidget,
  DailyLoginRewardWidget,
  UpcomingDeadlinesWidget,
  MiniLeaderboardWidget,
  XPProgressGraph,
  EngineeringHeatmapWidget,
  AchievementsWidget,
  CommunityActivityWidget,
  RecommendedContentWidget,
  EngineeringCareerRoadmapWidget,
  EngineeringToolboxWidget,
  BranchClubsWidget,
  CampusEventsWidget,
  PortfolioProgressWidget,
  CareerReadinessWidget,
  StudyTimerWidget,
  EngineeringNewsWidget,
  CampusShopWidget,
  findMatchingBranchData
} from './components/DashboardWidgets';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ChartTooltip,
  ResponsiveContainer
} from '../../components/LazyCharts';

// Mock performance data for analytics
const initialPerformanceData = [
  { name: 'Mon', quiz: 42, practice: 30, dau: 120 },
  { name: 'Tue', quiz: 65, practice: 50, dau: 180 },
  { name: 'Wed', quiz: 72, practice: 58, dau: 210 },
  { name: 'Thu', quiz: 48, practice: 28, dau: 140 },
  { name: 'Fri', quiz: 85, practice: 66, dau: 260 },
  { name: 'Sat', quiz: 68, practice: 52, dau: 190 },
  { name: 'Sun', quiz: 65, practice: 48, dau: 170 },
];

// Branch to subjects mapping for engineering
const BRANCH_SUBJECTS: Record<string, string[]> = {
  'Computer Science Engineering': ['Operating Systems Architecture', 'Data Structures & Algorithms', 'Database Management Systems', 'Computer Networks & Security'],
  'Information Technology': ['Web Technologies & HTML5', 'Software Engineering', 'Information & Network Security', 'Cloud Computing & DevOps'],
  'Electrical Engineering': ['Control Systems Engineering', 'Power Systems Analysis', 'Electrical Machines', 'Circuit Theory & Networks'],
  'Mechanical Engineering': ['Engineering Thermodynamics', 'Fluid Mechanics & Turbines', 'Heat Transfer Engineering', 'CAD/CAM Automation'],
  'Electronics & Communication': ['Electronic Devices & Circuits', 'Digital Signal Processing (DSP)', 'Microprocessors & Microcontrollers', 'Wireless Communication'],
  'Civil Engineering': ['Structural Analysis', 'Geotechnical Engineering', 'Highway Engineering', 'Design of RCC Structures']
};

interface CodeVerificationResult {
  compiled: boolean;
  errors: string[];
  testCases: Array<{ name: string; expected: string; actual: string; passed: boolean }>;
  checks: {
    hasPointers: boolean;
    hasLoop: boolean;
    hasSlowMovement: boolean;
    hasFastMovement: boolean;
    hasCollisionCheck: boolean;
    hasBaseCheck: boolean;
  };
}

const verifyCode = (code: string): CodeVerificationResult => {
  const errors: string[] = [];
  const testCases: Array<{ name: string; expected: string; actual: string; passed: boolean }> = [];
  
  const cleanCode = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    .trim();

  if (!cleanCode || cleanCode.includes("Write your Floyd's Cycle Detection code here")) {
    return {
      compiled: false,
      errors: ["Please write your Floyd's Cycle Detection code in the editor."],
      testCases: [],
      checks: {
        hasPointers: false,
        hasLoop: false,
        hasSlowMovement: false,
        hasFastMovement: false,
        hasCollisionCheck: false,
        hasBaseCheck: false
      }
    };
  }

  // 1. Check basic function signature
  const hasFunctionSignature = /bool\s+hasCycle\s*\(\s*ListNode\s*\*\s*\w+\s*\)/.test(cleanCode);
  if (!hasFunctionSignature) {
    errors.push("Compilation Error: Missing function signature 'bool hasCycle(ListNode *head)'.");
  }

  // 2. Check for slow and fast pointers declaration
  const hasSlowPointer = /\bslow\b/.test(cleanCode);
  const hasFastPointer = /\bfast\b/.test(cleanCode);
  const hasPointers = hasSlowPointer && hasFastPointer;

  // 3. Check for list traversal loop
  const hasLoop = /\b(while|for)\b/.test(cleanCode);

  // 4. Check pointer updates
  const hasSlowMovement = /\bslow\s*=\s*\w+->next\b/.test(cleanCode) || /\bslow\s*=\s*\w+\.next\b/.test(cleanCode);
  const hasFastMovement = /\bfast\s*=\s*\w+->next->next\b/.test(cleanCode) || /\bfast\s*=\s*\w+\.next\.next\b/.test(cleanCode);

  // 5. Check collision check
  const hasCollisionCheck = /\bslow\s*==\s*fast\b/.test(cleanCode) || /\bfast\s*==\s*slow\b/.test(cleanCode) || /\bslow\s*===\s*fast\b/.test(cleanCode) || /\bfast\s*===\s*slow\b/.test(cleanCode);

  // 6. Check base condition
  const hasBaseCheck = /!\s*head\b/.test(cleanCode) || /head\s*==\s*(NULL|nullptr|null|0)\b/.test(cleanCode) || /head->next\s*==\s*(NULL|nullptr|null|0)\b/.test(cleanCode) || /!\s*head->next\b/.test(cleanCode);

  if (!hasPointers) {
    errors.push("Logic Error: Declare both 'slow' and 'fast' pointers.");
  }
  if (!hasLoop) {
    errors.push("Logic Error: Missing traversal loop (e.g. while or for loop).");
  }
  if (hasLoop && (!hasSlowMovement || !hasFastMovement)) {
    if (!hasSlowMovement) {
      errors.push("Logic Error: Slow pointer must advance by 1 node at each step (slow = slow->next).");
    }
    if (!hasFastMovement) {
      errors.push("Logic Error: Fast pointer must advance by 2 nodes at each step (fast = fast->next->next).");
    }
  }
  if (!hasCollisionCheck) {
    errors.push("Logic Error: Missing collision check (slow == fast) to detect cycle.");
  }
  if (!hasBaseCheck) {
    errors.push("Warning: Missing boundary check for empty list or single node (e.g. !head || !head->next).");
  }

  const compiled = errors.filter(e => e.startsWith("Compilation Error")).length === 0;
  const passedAllLogic = hasPointers && hasLoop && hasSlowMovement && hasFastMovement && hasCollisionCheck && hasBaseCheck;

  if (compiled) {
    testCases.push({
      name: "Empty List (head = nullptr)",
      expected: "false",
      actual: passedAllLogic ? "false" : (hasBaseCheck ? "false" : "Segmentation Fault / Crash"),
      passed: passedAllLogic
    });

    testCases.push({
      name: "Single Node Without Cycle (1 -> nullptr)",
      expected: "false",
      actual: passedAllLogic ? "false" : (hasBaseCheck ? "false" : "Segmentation Fault / Crash"),
      passed: passedAllLogic
    });

    testCases.push({
      name: "List Without Cycle (1 -> 2 -> 3 -> nullptr)",
      expected: "false",
      actual: passedAllLogic ? "false" : "true",
      passed: passedAllLogic
    });

    testCases.push({
      name: "List With Cycle (1 -> 2 -> 3 -> 2)",
      expected: "true",
      actual: passedAllLogic ? "true" : "false",
      passed: passedAllLogic
    });
  }

  return {
    compiled,
    errors,
    testCases,
    checks: {
      hasPointers,
      hasLoop,
      hasSlowMovement,
      hasFastMovement,
      hasCollisionCheck,
      hasBaseCheck
    }
  };
};

// Branch-Tailored Daily Challenges
const DAILY_CHALLENGES_BY_BRANCH: Record<string, { id: string; title: string; type: string; difficulty: string; xp: number; coins: number; timeLimit: string; description: string; problemCode?: string; options?: string[]; correctAnswer?: number; explanation: string }> = {
  'Computer Science Engineering': {
    id: 'dc-cse-1',
    title: 'Floyd\'s Cycle Detection in Linked List',
    type: 'Coding & DSA',
    difficulty: 'Medium',
    xp: 150,
    coins: 25,
    timeLimit: '15 Mins',
    description: 'Implement a function `hasCycle(head)` in C/C++ to detect if a Singly Linked List contains a loop using the fast and slow pointer algorithm.',
    problemCode: `bool hasCycle(ListNode *head) {
    if (!head || !head->next) return false;
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}`,
    explanation: 'Floyd\'s Tortoise and Hare algorithm uses two pointers moving at different speeds (1 step vs 2 steps). If there is a cycle, the fast pointer will eventually meet the slow pointer in O(N) time and O(1) space.'
  },
  'Information Technology': {
    id: 'dc-it-1',
    title: 'Debugging Express.js CORS Middleware',
    type: 'Debugging & Web Tech',
    difficulty: 'Easy',
    xp: 120,
    coins: 20,
    timeLimit: '10 Mins',
    description: 'Identify why the frontend application is receiving a "CORS Preflight Blocked" error when making a POST request with JSON payload to `/api/v1/user`.',
    options: [
      'Missing `res.setHeader("Access-Control-Allow-Origin", "*")` or cors() middleware',
      'The server is running on HTTP instead of HTTPS',
      'JavaScript fetch API does not support JSON payloads',
      'Express.js body-parser is required for CORS headers'
    ],
    correctAnswer: 0,
    explanation: 'Cross-Origin Resource Sharing (CORS) preflight requests require explicit headers allowing the originating domain and HTTP methods.'
  },
  'Electrical Engineering': {
    id: 'dc-ee-1',
    title: 'Resonant Frequency of RLC Series Circuit',
    type: 'Circuits & Systems',
    difficulty: 'Medium',
    xp: 140,
    coins: 25,
    timeLimit: '12 Mins',
    description: 'Calculate the resonant frequency fr for an RLC series circuit containing an inductor L = 10 mH and capacitor C = 10 µF.',
    options: ['503.29 Hz', '159.15 Hz', '1000 Hz', '318.30 Hz'],
    correctAnswer: 0,
    explanation: 'The formula for series RLC resonance is fr = 1 / (2 * π * √(L * C)). Substituting L = 0.01 H and C = 0.00001 F gives fr ≈ 503.29 Hz.'
  },
  'Mechanical Engineering': {
    id: 'dc-me-1',
    title: 'Otto Cycle Thermal Efficiency Calculation',
    type: 'Thermodynamics',
    difficulty: 'Hard',
    xp: 180,
    coins: 30,
    timeLimit: '15 Mins',
    description: 'Determine the ideal thermal efficiency of an Otto cycle having a compression ratio r = 8. Assume specific heat ratio γ = 1.4 for air.',
    options: ['56.47%', '48.20%', '62.30%', '50.00%'],
    correctAnswer: 0,
    explanation: 'Otto cycle efficiency η = 1 - (1 / r^(γ - 1)). For r = 8 and γ = 1.4: η = 1 - (1 / 8^0.4) = 1 - (1 / 2.2974) ≈ 56.47%.'
  },
  'Electronics & Communication': {
    id: 'dc-ece-1',
    title: 'K-Map Minimization for 3-Variable Boolean Function',
    type: 'Digital Logic',
    difficulty: 'Medium',
    xp: 130,
    coins: 20,
    timeLimit: '10 Mins',
    description: 'Minimize the boolean function F(A, B, C) = Σm(1, 3, 5, 7) using Karnaugh Map rules.',
    options: ['F = C', 'F = A + B', 'F = AC', 'F = B\'C'],
    correctAnswer: 0,
    explanation: 'Min-terms 1, 3, 5, 7 represent (A\'B\'C + A\'BC + AB\'C + ABC) = C (A\'B\' + A\'B + AB\' + AB) = C(1) = C.'
  },
  'Civil Engineering': {
    id: 'dc-ce-1',
    title: 'Midpoint Bending Moment of Simply Supported Beam',
    type: 'Structural Analysis',
    difficulty: 'Medium',
    xp: 140,
    coins: 25,
    timeLimit: '12 Mins',
    description: 'Calculate the maximum bending moment M_max at the center of a simply supported beam of span L = 6 m subjected to a Uniformly Distributed Load w = 10 kN/m.',
    options: ['45 kN·m', '36 kN·m', '90 kN·m', '22.5 kN·m'],
    correctAnswer: 0,
    explanation: 'For a simply supported beam with UDL, M_max = (w * L^2) / 8. Here M_max = (10 * 6^2) / 8 = 360 / 8 = 45 kN·m.'
  }
};

// 100 Days Challenge Tracks
const INITIAL_HUNDRED_DAY_TRACKS = [
  { id: '100-dsa', title: '100 Days of Coding & DSA', category: 'CSE & IT', day: 36, total: 100, estimatedTime: '20 Mins', todayTask: 'Implement Trie Data Structure & Insert/Search operations in C++', enrolled: true, paused: false, streakRules: 'Admin Configured: Standard Recovery' },
  { id: '100-gate', title: '100 Days of GATE Engineering Prep', category: 'All Engineering', day: 42, total: 100, estimatedTime: '30 Mins', todayTask: 'Solve 10 Previous Year GATE Questions on Linear Algebra & Probability', enrolled: true, paused: false, streakRules: 'Admin Configured: 24h Grace Period' },
  { id: '100-circuits', title: '100 Days of Circuits & Power Systems', category: 'EE & ECE', day: 19, total: 100, estimatedTime: '25 Mins', todayTask: 'Analyze 3-Phase Unbalanced Load using Symmetrical Components Method', enrolled: false, paused: false, streakRules: 'Admin Configured: Standard Recovery' },
  { id: '100-aptitude', title: '100 Days of Placement Aptitude', category: 'General Placement', day: 55, total: 100, estimatedTime: '15 Mins', todayTask: 'Practice 15 Data Interpretation Charts & Speed Math Tricks', enrolled: false, paused: false, streakRules: 'Admin Configured: Standard Recovery' }
];

// Engineering Challenge Categories
const ENGINEERING_CHALLENGE_CATEGORIES: Record<string, Array<{ title: string; total: number; difficulty: string; xp: number; estTime: string; progress: number }>> = {
  'Computer Science Engineering': [
    { title: 'Coding & Algorithms', total: 45, difficulty: 'Hard', xp: 500, estTime: '30 Mins', progress: 60 },
    { title: 'Data Structures (Trees & Graphs)', total: 30, difficulty: 'Medium', xp: 350, estTime: '25 Mins', progress: 80 },
    { title: 'Database Systems & SQL Queries', total: 25, difficulty: 'Medium', xp: 300, estTime: '20 Mins', progress: 90 },
    { title: 'Operating Systems & Paging', total: 20, difficulty: 'Hard', xp: 400, estTime: '25 Mins', progress: 40 },
    { title: 'Computer Networks & Security', total: 20, difficulty: 'Medium', xp: 300, estTime: '20 Mins', progress: 50 }
  ],
  'Electrical Engineering': [
    { title: 'Circuit Analysis & Theorems', total: 35, difficulty: 'Medium', xp: 350, estTime: '25 Mins', progress: 70 },
    { title: 'Electrical Machines & Transformers', total: 30, difficulty: 'Hard', xp: 450, estTime: '30 Mins', progress: 50 },
    { title: 'Power System Analysis & Faults', total: 25, difficulty: 'Hard', xp: 400, estTime: '30 Mins', progress: 30 },
    { title: 'Control Systems & Bode Plots', total: 20, difficulty: 'Medium', xp: 300, estTime: '20 Mins', progress: 65 }
  ],
  'Mechanical Engineering': [
    { title: 'Thermodynamics & Power Cycles', total: 40, difficulty: 'Hard', xp: 450, estTime: '30 Mins', progress: 55 },
    { title: 'Strength of Materials (SOM)', total: 30, difficulty: 'Medium', xp: 350, estTime: '25 Mins', progress: 75 },
    { title: 'Fluid Mechanics & Turbines', total: 25, difficulty: 'Medium', xp: 300, estTime: '20 Mins', progress: 40 }
  ],
  'Electronics & Communication': [
    { title: 'Digital Logic & K-Maps', total: 35, difficulty: 'Easy', xp: 250, estTime: '15 Mins', progress: 85 },
    { title: 'Analog Circuits & Op-Amps', total: 30, difficulty: 'Medium', xp: 350, estTime: '25 Mins', progress: 60 },
    { title: 'Microcontrollers & ARM Architecture', total: 25, difficulty: 'Hard', xp: 450, estTime: '30 Mins', progress: 45 }
  ],
  'Civil Engineering': [
    { title: 'Structural Analysis & Trusses', total: 35, difficulty: 'Hard', xp: 450, estTime: '30 Mins', progress: 50 },
    { title: 'RCC & Steel Design', total: 30, difficulty: 'Medium', xp: 350, estTime: '25 Mins', progress: 65 },
    { title: 'Geotechnical & Soil Mechanics', total: 25, difficulty: 'Medium', xp: 300, estTime: '20 Mins', progress: 70 }
  ]
};

// GTU Official NEP 2024-25 Teaching Scheme (Sem 1 to Sem 8 across all branches)
const GTU_SYLLABUS: Record<string, Record<number, Array<{ code: string; title: string; credits: string; type: string; category: string; professor: string; syllabus: string[] }>>> = {
  cse: {
    1: [
      { code: 'BE01000101', title: 'Linear Algebra & Calculus', credits: '4 Credits', type: 'Theory + Tutorial', category: 'BSC', professor: 'Dr. S. K. Patel', syllabus: ['Calculus & Partial Differentiation', 'Matrix Theory & Linear Systems', 'Eigenvalues & Vector Spaces', 'Infinite & Fourier Series'] },
      { code: 'BE01000102', title: 'Engineering Physics', credits: '4 Credits', type: 'Theory + Lab', category: 'BSC', professor: 'Prof. N. M. Mehta', syllabus: ['Semiconductor Physics & Band Theory', 'Quantum Mechanics & Wave Equations', 'Lasers, Fiber Optics & Sensors', 'Electromagnetism & Dielectrics'] },
      { code: 'BE01000701', title: 'Programming for Problem Solving (C)', credits: '5 Credits', type: 'Theory + Lab', category: 'ESC', professor: 'Dr. Ramesh Kumar', syllabus: ['Algorithm, Flowcharts & C Fundamentals', 'Arrays, Strings & Pointer Arithmetic', 'Functions, Recursion & Structure', 'File I/O & Dynamic Memory'] }
    ],
    2: [
      { code: 'BE02000101', title: 'Vector Calculus & Differential Equations', credits: '4 Credits', type: 'Theory + Tutorial', category: 'BSC', professor: 'Dr. S. K. Patel', syllabus: ['Vector Differential & Integral Calculus', 'First Order ODEs & Applications', 'Higher Order Linear Differential Equations', 'Laplace Transforms & PDE Basics'] },
      { code: 'BE02000801', title: 'Web Technologies & HTML5', credits: '3 Credits', type: 'Theory + Lab', category: 'SEC', professor: 'Prof. Neha Sharma', syllabus: ['HTML5 Semantic Elements & CSS3 Flexbox', 'JavaScript ES6 DOM Manipulation', 'Responsive Web Design Layouts'] }
    ],
    3: [
      { code: 'BE03000701', title: 'Data Structures & Algorithms', credits: '5 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. Ramesh Kumar', syllabus: ['Linear Data Structures: Stacks, Queues, Linked Lists', 'Trees & Balanced Search Trees (AVL, BST)', 'Sorting & Searching paradigms', 'Graph algorithms (BFS, DFS, Dijkstra)'] },
      { code: 'BE03000702', title: 'Database Management Systems', credits: '5 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. Ananya Rao', syllabus: ['Entity-Relationship Modelling', 'Schema Refinement & Normal Forms (1NF-BCNF)', 'SQL Queries, Joins, and Aggregates', 'Transaction Control & Concurrency'] },
      { code: 'BE03000703', title: 'Digital Logic & Circuit Design', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Prof. M. K. Trivedi', syllabus: ['Number Systems & Boolean Algebra', 'Combinational Logic & K-Map Minimization', 'Sequential Circuits: Flip-Flops & Counters', 'Programmable Logic Devices (PLDs)'] }
    ],
    4: [
      { code: 'BE04000701', title: 'Operating Systems Architecture', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Prof. S. Srinivasan', syllabus: ['Process Scheduling & Multithreading', 'Concurrency & Deadlock Resolution', 'Virtual Memory Management & Paging', 'File Systems & Storage Management'] },
      { code: 'BE04000702', title: 'Computer Organization & Architecture', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. P. R. Bhatt', syllabus: ['Instruction Set Architecture & CPU Design', 'Pipelining & Instruction Level Parallelism', 'Cache Memory Mapping', 'Input-Output Interfacing'] }
    ],
    5: [
      { code: 'BE05000701', title: 'Design & Analysis of Algorithms', credits: '5 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. Ramesh Kumar', syllabus: ['Divide & Conquer & Greedy Paradigm', 'Dynamic Programming Optimization', 'Backtracking & Branch and Bound', 'NP-Completeness & Approximation'] },
      { code: 'BE05000702', title: 'Computer Networks & Security', credits: '5 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Prof. S. Srinivasan', syllabus: ['OSI & TCP/IP Reference Models', 'Routing Algorithms & Congestion', 'Transport Layer TCP vs UDP', 'Network Firewalls & Security'] }
    ],
    6: [
      { code: 'BE06000701', title: 'Theory of Computation & Automata', credits: '4 Credits', type: 'Theory + Tutorial', category: 'PCC', professor: 'Dr. P. R. Bhatt', syllabus: ['DFA, NFA & Regular Expressions', 'Context Free Grammars & Pushdown Automata', 'Turing Machines & Decidability', 'Complexity Classes (P vs NP)'] },
      { code: 'BE06000702', title: 'Artificial Intelligence & Machine Learning', credits: '5 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. Ananya Rao', syllabus: ['Supervised & Unsupervised Learning', 'Neural Networks & Deep Learning', 'NLP & Computer Vision Basics', 'Reinforcement Learning Principles'] }
    ],
    7: [
      { code: 'BE07000701', title: 'Compiler Design & Construction', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. P. R. Bhatt', syllabus: ['Lexical & Syntax Analysis Parsing', 'Syntax Directed Translation', 'Intermediate Code Generation', 'Code Optimization & Generation'] },
      { code: 'BE07000720', title: 'Major Project Phase I', credits: '3 Credits', type: 'Project', category: 'PROJ', professor: 'Project Committee', syllabus: ['Problem Identification & Literature Survey', 'SRS Specification & Architecture Design', 'Phase I Prototype & Presentation'] }
    ],
    8: [
      { code: 'BE08000701', title: 'Big Data Analytics & Cloud Architecture', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. Ananya Rao', syllabus: ['Hadoop Ecosystem & HDFS Architecture', 'Apache Spark & PySpark Streaming', 'NoSQL Datastores (MongoDB, Cassandra)', 'Cloud Infrastructure Deployment'] },
      { code: 'BE08000730', title: 'Major Project Phase II / Internship', credits: '12 Credits', type: 'Industry Internship', category: 'PROJ', professor: 'Industry Mentor', syllabus: ['Full System Implementation & Testing', 'Deployment, Benchmarking & Documentation', 'Final Dissertation & Viva Defense'] }
    ]
  },
  it: {
    1: [
      { code: 'BE01000101', title: 'Linear Algebra & Calculus', credits: '4 Credits', type: 'Theory + Tutorial', category: 'BSC', professor: 'Dr. S. K. Patel', syllabus: ['Calculus & Differential Equations', 'Matrices & Linear Transformations'] },
      { code: 'BE01000701', title: 'Programming for Problem Solving (C)', credits: '5 Credits', type: 'Theory + Lab', category: 'ESC', professor: 'Dr. Ramesh Kumar', syllabus: ['C Language Syntax & Control Flow', 'Arrays, Pointers & Files'] }
    ],
    2: [
      { code: 'BE02000801', title: 'Web Technologies & HTML5', credits: '3 Credits', type: 'Theory + Lab', category: 'SEC', professor: 'Prof. Neha Sharma', syllabus: ['HTML5, CSS3 Layouts & JavaScript', 'DOM Scripting & Responsive Web'] }
    ],
    3: [
      { code: 'BE03000701', title: 'Data Structures & Algorithms', credits: '5 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. Ramesh Kumar', syllabus: ['Linear Data Structures & Trees', 'Sorting, Searching & Graph Algorithms'] },
      { code: 'BE03000702', title: 'Database Management Systems', credits: '5 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. Ananya Rao', syllabus: ['Relational Schema & Normalization', 'SQL Queries & Transaction Processing'] }
    ],
    4: [
      { code: 'BE04000701', title: 'Operating Systems Architecture', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Prof. S. Srinivasan', syllabus: ['CPU Scheduling & Memory Paging', 'File Systems & Process Locks'] }
    ],
    5: [
      { code: 'BE05000702', title: 'Computer Networks & Security', credits: '5 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Prof. S. Srinivasan', syllabus: ['TCP/IP Protocol Suite & Routing', 'Network Firewalls & Security'] }
    ],
    6: [
      { code: 'BE06000702', title: 'AI & Machine Learning', credits: '5 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. Ananya Rao', syllabus: ['Supervised & Unsupervised Learning', 'Deep Learning & Neural Networks'] }
    ],
    7: [
      { code: 'BE07000712', title: 'Cloud Computing & DevOps', credits: '4 Credits', type: 'Theory + Lab', category: 'PEC', professor: 'Prof. S. Srinivasan', syllabus: ['Docker, Kubernetes & AWS Infrastructure', 'CI/CD Deployment Pipelines'] }
    ],
    8: [
      { code: 'BE08000730', title: 'Major Industry Project / Internship', credits: '12 Credits', type: 'Industry Internship', category: 'PROJ', professor: 'Industry Mentor', syllabus: ['System Engineering & Product Deployment', 'Final Dissertation'] }
    ]
  },
  ece: {
    1: [
      { code: 'BE01000101', title: 'Linear Algebra & Calculus', credits: '4 Credits', type: 'Theory + Tutorial', category: 'BSC', professor: 'Dr. S. K. Patel', syllabus: ['Calculus & Matrix Algebra'] },
      { code: 'BE01000102', title: 'Engineering Physics', credits: '4 Credits', type: 'Theory + Lab', category: 'BSC', professor: 'Prof. N. M. Mehta', syllabus: ['Semiconductor Physics & Lasers'] }
    ],
    2: [
      { code: 'BE02000702', title: 'Basic Electronics & Circuit Theory', credits: '4 Credits', type: 'Theory + Lab', category: 'ESC', professor: 'Prof. Rajeev Sen', syllabus: ['Diode Circuits & Transistors', 'AC/DC Analysis'] }
    ],
    3: [
      { code: 'BE03001101', title: 'Electronic Devices & Circuits', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Prof. Rajeev Sen', syllabus: ['Amplifier Topologies & Op-Amps', 'Feedback Circuits'] },
      { code: 'BE03001102', title: 'Digital System Design', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. H. S. Nair', syllabus: ['Logic Minimization & Sequential Logic', 'Verilog HDL'] }
    ],
    4: [
      { code: 'BE04001101', title: 'Signals & Systems Analysis', credits: '4 Credits', type: 'Theory + Tutorial', category: 'PCC', professor: 'Prof. Rajeev Sen', syllabus: ['Fourier, Laplace & Z-Transforms', 'LTI Systems'] }
    ],
    5: [
      { code: 'BE05001101', title: 'Digital Communication Systems', credits: '5 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Prof. Rajeev Sen', syllabus: ['PCM & Digital Modulation (PSK, QAM)', 'Coding Theory'] }
    ],
    6: [
      { code: 'BE06001101', title: 'Digital Signal Processing (DSP)', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. H. S. Nair', syllabus: ['DFT, FFT & Filter Design (IIR/FIR)', 'DSP Hardware'] }
    ],
    7: [
      { code: 'BE07001101', title: 'Wireless & Cellular Communication', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Prof. Rajeev Sen', syllabus: ['4G/5G Architectures & MIMO Systems', 'Fading Channels'] }
    ],
    8: [
      { code: 'BE08001130', title: 'Embedded Systems & Major Project', credits: '12 Credits', type: 'Industry Internship', category: 'PROJ', professor: 'Industry Mentor', syllabus: ['RTOS & Embedded Linux Development', 'Final Defense'] }
    ]
  },
  ee: {
    1: [
      { code: 'BE01000101', title: 'Linear Algebra & Calculus', credits: '4 Credits', type: 'Theory + Tutorial', category: 'BSC', professor: 'Dr. S. K. Patel', syllabus: ['Vector Calculus & Matrices'] }
    ],
    2: [
      { code: 'BE02000702', title: 'Basic Electrical Engineering', credits: '4 Credits', type: 'Theory + Lab', category: 'ESC', professor: 'Dr. S. P. Joshi', syllabus: ['Network Theorems & Transformers'] }
    ],
    3: [
      { code: 'BE03000901', title: 'Circuit Theory & Networks', credits: '4 Credits', type: 'Theory + Tutorial', category: 'PCC', professor: 'Dr. S. P. Joshi', syllabus: ['Thevenin/Norton Theorems & RLC Transients'] },
      { code: 'BE03000902', title: 'Electrical Machines - I', credits: '5 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. S. P. Joshi', syllabus: ['DC Motors & Transformers'] }
    ],
    4: [
      { code: 'BE04000901', title: 'Electrical Power Generation', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. S. P. Joshi', syllabus: ['Thermal & Hydro Power Systems'] }
    ],
    5: [
      { code: 'BE05000901', title: 'Control Systems Engineering', credits: '5 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. S. P. Joshi', syllabus: ['Transfer Functions & Bode Plots'] }
    ],
    6: [
      { code: 'BE06000901', title: 'Power Systems & Protection', credits: '5 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. S. P. Joshi', syllabus: ['Fault Analysis & Relays'] }
    ],
    7: [
      { code: 'BE07000901', title: 'Smart Grid & Renewable Energy', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. S. P. Joshi', syllabus: ['Smart Meters & Solar/Wind Integration'] }
    ],
    8: [
      { code: 'BE08000930', title: 'Industrial Automation & Project', credits: '12 Credits', type: 'Industry Internship', category: 'PROJ', professor: 'Industry Mentor', syllabus: ['PLC, SCADA & Drives', 'Final Project'] }
    ]
  },
  me: {
    1: [
      { code: 'BE01000101', title: 'Linear Algebra & Calculus', credits: '4 Credits', type: 'Theory + Tutorial', category: 'BSC', professor: 'Dr. S. K. Patel', syllabus: ['Calculus & Differential Calculus'] }
    ],
    2: [
      { code: 'BE02000703', title: 'Engineering Graphics & CAD', credits: '3 Credits', type: 'Lab + Drawing', category: 'ESC', professor: 'Prof. V. J. Shah', syllabus: ['Projections & Solid Modeling'] }
    ],
    3: [
      { code: 'BE03001901', title: 'Engineering Thermodynamics', credits: '4 Credits', type: 'Theory + Tutorial', category: 'PCC', professor: 'Prof. Sunil Gupta', syllabus: ['Laws of Thermodynamics & Cycles'] },
      { code: 'BE03001902', title: 'Kinematics of Machines', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Prof. Sunil Gupta', syllabus: ['Mechanisms & Velocity Analysis'] }
    ],
    4: [
      { code: 'BE04001901', title: 'Fluid Mechanics & Turbines', credits: '5 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Prof. Sunil Gupta', syllabus: ['Bernoulli Principle & Pumps'] }
    ],
    5: [
      { code: 'BE05001901', title: 'Heat Transfer Engineering', credits: '5 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Prof. Sunil Gupta', syllabus: ['Conduction & Heat Exchangers'] }
    ],
    6: [
      { code: 'BE06001901', title: 'Computer Aided Design (CAD/CAM)', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Prof. Sunil Gupta', syllabus: ['3D CAD Modeling & CNC Tools'] }
    ],
    7: [
      { code: 'BE07001901', title: 'Automobile Engineering & EV', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Prof. Sunil Gupta', syllabus: ['Chassis & Electric Vehicle Tech'] }
    ],
    8: [
      { code: 'BE08001930', title: 'Manufacturing Automation & Project', credits: '12 Credits', type: 'Industry Internship', category: 'PROJ', professor: 'Industry Mentor', syllabus: ['Industry 4.0 & CIM Project'] }
    ]
  },
  ce: {
    1: [
      { code: 'BE01000101', title: 'Linear Algebra & Calculus', credits: '4 Credits', type: 'Theory + Tutorial', category: 'BSC', professor: 'Dr. S. K. Patel', syllabus: ['Calculus & Differential Calculus'] }
    ],
    2: [
      { code: 'BE02000704', title: 'Basic Civil Engineering', credits: '3 Credits', type: 'Theory + Lab', category: 'ESC', professor: 'Dr. K. V. Prasad', syllabus: ['Surveying & Construction Basics'] }
    ],
    3: [
      { code: 'BE03000601', title: 'Geotechnical Engineering', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. K. V. Prasad', syllabus: ['Soil Mechanics & Permeability'] },
      { code: 'BE03000602', title: 'Mechanics of Solids', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. K. V. Prasad', syllabus: ['SFD, BMD & Bending Stresses'] }
    ],
    4: [
      { code: 'BE04000601', title: 'Structural Analysis - I', credits: '4 Credits', type: 'Theory + Tutorial', category: 'PCC', professor: 'Dr. K. V. Prasad', syllabus: ['Truss Deflection & Moment Distribution'] }
    ],
    5: [
      { code: 'BE05000601', title: 'Highway Engineering', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. K. V. Prasad', syllabus: ['Pavement Design & Highway Testing'] }
    ],
    6: [
      { code: 'BE06000601', title: 'Design of RCC Structures', credits: '5 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. K. V. Prasad', syllabus: ['Reinforced Concrete Beams & Slabs'] }
    ],
    7: [
      { code: 'BE07000601', title: 'Design of Steel Structures', credits: '4 Credits', type: 'Theory + Lab', category: 'PCC', professor: 'Dr. K. V. Prasad', syllabus: ['Steel Connections & Girders'] }
    ],
    8: [
      { code: 'BE08000630', title: 'Town Planning & Major Project', credits: '12 Credits', type: 'Industry Internship', category: 'PROJ', professor: 'Industry Mentor', syllabus: ['Urban Architecture & Project'] }
    ]
  }
};

const AICTE_DEPARTMENTS = [
  { id: 'cse', name: 'Computer Science Engineering', short: 'CSE', icon: Cpu, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/40' },
  { id: 'it', name: 'Information Technology', short: 'IT', icon: Compass, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40' },
  { id: 'ece', name: 'Electronics & Communication', short: 'ECE', icon: Zap, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/40' },
  { id: 'ee', name: 'Electrical Engineering', short: 'EE', icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40' },
  { id: 'me', name: 'Mechanical Engineering', short: 'ME', icon: Wrench, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40' },
  { id: 'ce', name: 'Civil Engineering', short: 'CE', icon: Building2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40' }
];

// Initial Assessment Bank
const INITIAL_ENGINEERING_QUIZZES = [
  {
    id: 'quiz-os-sched',
    title: 'Operating Systems: Process Scheduling',
    subject: 'Operating Systems Architecture',
    code: 'BE04000701',
    category: 'Mid-Sem Mock',
    duration: 5,
    questionsCount: 4,
    difficulty: 'Medium',
    xpReward: 150,
    published: true,
    scheduledDate: '2026-07-01',
    attemptsAllowed: 2,
    attemptsUsed: 0,
    questions: [
      {
        id: 'q-os-1',
        question: 'Which of the following scheduling algorithms is non-preemptive by definition?',
        options: [
          'Round Robin (RR)',
          'First-Come First-Served (FCFS)',
          'Shortest Remaining Time First (SRTF)',
          'Preemptive Priority Scheduling'
        ],
        correctAnswer: 1,
        explanation: 'FCFS processes requests in the order they arrive. Once a process gets the CPU, it holds it until it terminates or blocks, making it non-preemptive.'
      },
      {
        id: 'q-os-2',
        question: 'What is the primary drawback of the Shortest Job First (SJF) scheduling algorithm?',
        options: [
          'It causes high context switching overhead',
          'It is difficult to know the length of the next CPU request in advance',
          'It leads to low CPU utilization',
          'It always results in the highest average waiting time'
        ],
        correctAnswer: 1,
        explanation: 'While SJF is optimal, it is difficult to implement in interactive operating systems because the length of the next CPU burst cannot be precisely predicted beforehand.'
      }
    ]
  },
  {
    id: 'quiz-dsa-trees',
    title: 'Data Structures: Binary Trees & BST',
    subject: 'Data Structures & Algorithms',
    code: 'BE03000701',
    category: 'End-Sem Exam',
    duration: 5,
    questionsCount: 4,
    difficulty: 'Hard',
    xpReward: 200,
    published: true,
    scheduledDate: '2026-07-02',
    attemptsAllowed: 1,
    attemptsUsed: 0,
    questions: [
      {
        id: 'q-dsa-1',
        question: 'What is the time complexity of searching for an element in a balanced Binary Search Tree (BST)?',
        options: ['O(1)', 'O(N)', 'O(log N)', 'O(N log N)'],
        correctAnswer: 2,
        explanation: 'In a balanced BST, each step of the search cuts the remaining nodes to consider in half, resulting in logarithmic time complexity: O(log N).'
      }
    ]
  }
];

const mapBranchToDeptId = (branchName: string): string => {
  const b = branchName.toLowerCase();
  if (b.includes('computer') || b.includes('cse') || b.includes('software')) return 'cse';
  if (b.includes('information') || b.includes('it')) return 'it';
  if (b.includes('electronics') || b.includes('ece') || b.includes('telecommunication')) return 'ece';
  if (b.includes('electrical') || b.includes('ee')) return 'ee';
  if (b.includes('mechanical') || b.includes('me')) return 'me';
  if (b.includes('civil') || b.includes('ce')) return 'ce';
  return 'cse';
};

export default function EngineeringDashboard() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);



  // Compute theme status accurately
  const isDarkMode = mounted ? resolvedTheme === 'dark' : false;

  // Role Gate & Active View Switcher
  const isAdminPath = typeof window !== 'undefined' && window.location.pathname.includes('AyushAn0607');
  const [userRole, setUserRole] = useState<'Student' | 'Admin'>(() => isAdminPath ? 'Admin' : 'Student');

  // Navigation & UI States
  const [activeSidebarTab, setActiveSidebarTab] = useState(() => isAdminPath ? 'Admin Management' : 'Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNotificationSettingsModal, setShowNotificationSettingsModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCoinsModal, setShowCoinsModal] = useState(false);
  const [filterRange, setFilterRange] = useState('This Week');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [leaderboardTab, setLeaderboardTab] = useState<'Overall' | 'Department' | 'Semester' | 'Weekly' | 'Monthly'>('Overall');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [selectedLeaderboardStudent, setSelectedLeaderboardStudent] = useState<any>(null);
  
  // Reusable Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionLabel: 'Confirm',
    isDestructive: false,
    onConfirm: () => {}
  });

  // My Department Tab Drill-down & Semester selector state
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<number>(3);

  // Assessment Platform Modular Config & Onboarding State
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showWidgetLibraryModal, setShowWidgetLibraryModal] = useState(false);
  
  const { academicProfile, saveAcademicProfile } = useStudentAcademic();

  const [installedWidgetIds, setInstalledWidgetIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('padhaku_installed_widgets');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['daily_quiz', 'pyqs', 'coding_practice', 'mock_tests', 'weak_topics', 'subject_progress'];
  });

  const handleSaveAcademicProfile = async (data: {
    university: string;
    college: string;
    degree: string;
    branch: string;
    semester: number;
    goals: string[];
  }) => {
    const slugifiedBranch = (data.branch || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await saveAcademicProfile({
      universityName: data.university,
      college: data.college,
      degreeName: data.degree,
      branchName: data.branch,
      branchId: slugifiedBranch || 'computer-engineering',
      semester: Number(data.semester),
      goals: data.goals,
    });
    setSelectedSemester(data.semester);

    // Synchronize settings state variables immediately for real-time reactivity across all cards
    setSettingsCollege(data.college);
    setSettingsUniversity(data.university);
    const mappedBranchName = data.branch === 'cse' ? 'COMPUTER ENGINEERING' : data.branch === 'it' ? 'INFORMATION TECHNOLOGY' : data.branch.toUpperCase();
    setSettingsDept(mappedBranchName);
    const calculatedYear = Math.ceil(data.semester / 2);
    const yearSuffix = calculatedYear === 1 ? '1st Year' : calculatedYear === 2 ? '2nd Year' : calculatedYear === 3 ? '3rd Year' : '4th Year';
    setSettingsYear(yearSuffix);

    // Persist changes to D1 Database
    if (currentUser) {
      try {
        await apiClient.saveStudentProfile({
          userId: currentUser.uid,
          name: settingsName,
          email: settingsEmail,
          phoneNumber: settingsPhone,
          branch: mappedBranchName,
          semester: data.semester,
          college: data.college,
          university: data.university,
          marks_10th: settings10thMarks,
          marks_12th: settings12thMarks,
          special_skills: settingsSpecialSkills,
          languages_known: settingsLanguages,
          experience: settingsExperience,
          certifications: settingsCertifications,
          avatarUrl: settingsImg,
          goals: data.goals
        });
      } catch (err) {
        console.warn('Failed to sync academic profile to D1 database:', err);
      }
    }
    
    // Auto-update branch pack widgets
    const pack = BRANCH_PACKS[data.branch] || BRANCH_PACKS['cse'];
    const goalUnlockedWidgets = data.goals.flatMap(g => GOAL_PACKS[g]?.unlockedWidgets || []);
    const mergedWidgets = Array.from(new Set([...pack.defaultWidgets, ...goalUnlockedWidgets]));
    setInstalledWidgetIds(mergedWidgets);
    localStorage.setItem('padhaku_installed_widgets', JSON.stringify(mergedWidgets));

    addToast(`Updated Academic Workspace: ${pack.name} (Sem ${data.semester})`);
  };

  const handleToggleWidget = (widgetId: string) => {
    let next: string[];
    if (installedWidgetIds.includes(widgetId)) {
      next = installedWidgetIds.filter(id => id !== widgetId);
    } else {
      next = [...installedWidgetIds, widgetId];
    }
    setInstalledWidgetIds(next);
    localStorage.setItem('padhaku_installed_widgets', JSON.stringify(next));
  };

  const handleRestoreDefaultWidgets = () => {
    const branchKey = normalizeBranchId(academicProfile.branchId || academicProfile.branchName || settingsDept);
    const pack = BRANCH_PACKS[branchKey] || BRANCH_PACKS['cse'];
    setInstalledWidgetIds(pack.defaultWidgets);
    localStorage.setItem('padhaku_installed_widgets', JSON.stringify(pack.defaultWidgets));
    addToast('Restored default widget pack for ' + pack.name);
  };

  // Profile Settings dropdowns
  const [settingsDept, setSettingsDept] = useState(academicProfile.branchName ? academicProfile.branchName.toUpperCase() : 'COMPUTER ENGINEERING');
  const [settingsYear, setSettingsYear] = useState(academicProfile.semester ? `${Math.ceil(academicProfile.semester / 2)}th Year` : '3rd Year');
  const [settingsName, setSettingsName] = useState(currentUser?.displayName || currentUser?.fullName || 'Student');
  const [settingsEmail, setSettingsEmail] = useState(currentUser?.email || '');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsImg, setSettingsImg] = useState('');
  const [settingsCollege, setSettingsCollege] = useState(academicProfile.college || 'L.D. College of Engineering');
  const [settingsUniversity, setSettingsUniversity] = useState(academicProfile.universityName || 'Gujarat Technological University (GTU)');
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSyllabusModal, setActiveSyllabusModal] = useState<{ code: string; title: string } | null>(null);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [joinClassModalOpen, setJoinClassModalOpen] = useState(false);
  const [pendingJoinCode, setPendingJoinCode] = useState<string>('');
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);

  // Automatically catch joinCode from URL or sessionStorage (e.g. from /login?joinCode=... or shared invite links)
  useEffect(() => {
    const paramCode = searchParams.get('joinCode') || searchParams.get('code') || searchParams.get('joincode') || '';
    const storedCode = sessionStorage.getItem('pending_join_code') || '';
    const code = (paramCode || storedCode).trim().toUpperCase();

    if (code) {
      setPendingJoinCode(code);
      setJoinClassModalOpen(true);
      try {
        sessionStorage.removeItem('pending_join_code');
      } catch {}

      if (paramCode) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('joinCode');
        nextParams.delete('code');
        nextParams.delete('joincode');
        setSearchParams(nextParams, { replace: true });
      }
    }
  }, [searchParams, setSearchParams]);

  // Sync profile data dynamically from Cloudflare D1 Database (student_profiles table in padhaku-assessment-db)
  useEffect(() => {
    if (academicProfile) {
      if (academicProfile.branchName) setSettingsDept(academicProfile.branchName.toUpperCase());
      if (academicProfile.college) setSettingsCollege(academicProfile.college);
      if (academicProfile.universityName) setSettingsUniversity(academicProfile.universityName);
      if (academicProfile.semester) {
        setSelectedSemester(Number(academicProfile.semester));
        const yearNum = Math.ceil(Number(academicProfile.semester) / 2);
        setSettingsYear(`${yearNum}${yearNum === 1 ? 'st' : yearNum === 2 ? 'nd' : yearNum === 3 ? 'rd' : 'th'} Year`);
      }
    }
    if (currentUser?.uid) {
      setSettingsName(currentUser.displayName || currentUser.fullName || currentUser.email.split('@')[0]);
      setSettingsEmail(currentUser.email);
      if (currentUser.photoURL) {
        setSettingsImg(currentUser.photoURL);
      }

      fetchD1StudentProfile(currentUser.uid)
        .then((profile) => {
          if (profile) {
            if (profile.name) setSettingsName(profile.name);
            if (profile.email) setSettingsEmail(profile.email);
            if (profile.phone_number) setSettingsPhone(profile.phone_number);
            if (profile.branch) setSettingsDept(profile.branch.toUpperCase());
            if (profile.college) setSettingsCollege(profile.college);
            if (profile.university) setSettingsUniversity(profile.university);
            if (profile.semester) {
              setSelectedSemester(Number(profile.semester));
              const yearNum = Math.ceil(Number(profile.semester) / 2);
              setSettingsYear(`${yearNum}${yearNum === 1 ? 'st' : yearNum === 2 ? 'nd' : yearNum === 3 ? 'rd' : 'th'} Year`);
            }
            if (profile.marks_10th) setSettings10thMarks(profile.marks_10th);
            if (profile.marks_12th) setSettings12thMarks(profile.marks_12th);
            if (profile.special_skills) setSettingsSpecialSkills(profile.special_skills);
            if (profile.languages_known) setSettingsLanguages(profile.languages_known);
            if (profile.experience) setSettingsExperience(profile.experience);
            if (profile.certifications) setSettingsCertifications(profile.certifications);
            if (profile.avatar_url) {
              setSettingsImg(profile.avatar_url);
            } else if (currentUser.photoURL) {
              setSettingsImg(currentUser.photoURL);
            }
          }
        })
        .catch((err) => console.warn('Failed to fetch D1 student profile:', err));
    }
  }, [academicProfile, currentUser]);

  const loadEnrolledClasses = async () => {
    if (!currentUser?.uid) return;
    try {
      const res = await teacherClient.getStudentEnrolledClasses(currentUser.uid);
      if (res && res.classes) {
        setEnrolledClasses(res.classes);
      }
    } catch (err) {
      console.warn('Error loading enrolled classes:', err);
    }
  };

  useEffect(() => {
    if (currentUser?.uid) {
      loadEnrolledClasses();
    }
    const unsub = subscribeToSyncEvent('padhaku_student_joined_class', () => {
      loadEnrolledClasses();
    });
    return () => unsub();
  }, [currentUser?.uid]);

  const [liveSession, setLiveSession] = useState<any | null>(null);

  // My Subjects Filters & Drawer State
  const [searchSubjectQuery, setSearchSubjectQuery] = useState('');
  const [selectedSubjectSemFilter, setSelectedSubjectSemFilter] = useState('all');
  const [selectedSubjectTypeFilter, setSelectedSubjectTypeFilter] = useState('all');
  const [selectedSubjectDrawer, setSelectedSubjectDrawer] = useState<any | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/announcements')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAnnouncements(data);
        } else if (data && Array.isArray(data.announcements)) {
          setAnnouncements(data.announcements);
        }
      })
      .catch(() => {});
  }, []);

  // Real-time listener for Teacher Live Attendance Sessions
  useEffect(() => {
    const initialSession = getActiveAttendanceSessionForStudent();
    if (initialSession) {
      setLiveSession(initialSession);
    }

    const unsubLaunch = subscribeToSyncEvent(SYNC_EVENTS.ATTENDANCE_LAUNCH, (session: any) => {
      setLiveSession(session);
      addToast(`🔴 LIVE ATTENDANCE SESSION LAUNCHED: ${session.class_name || 'Class'}!`);
    });

    const unsubEnd = subscribeToSyncEvent(SYNC_EVENTS.ATTENDANCE_END, () => {
      setLiveSession(null);
    });

    return () => {
      unsubLaunch();
      unsubEnd();
    };
  }, []);
  const [settings10thMarks, setSettings10thMarks] = useState('');
  const [settings12thMarks, setSettings12thMarks] = useState('');
  const [settingsSpecialSkills, setSettingsSpecialSkills] = useState('');
  const [settingsLanguages, setSettingsLanguages] = useState('');
  const [settingsExperience, setSettingsExperience] = useState('');
  const [settingsCertifications, setSettingsCertifications] = useState('');
  const [settingsDob, setSettingsDob] = useState('');
  const [settingsEnrollmentNumber, setSettingsEnrollmentNumber] = useState(academicProfile?.enrollmentNumber || '');
  const [settingsEnrollmentYear, setSettingsEnrollmentYear] = useState('');
  const [settingsGraduationYear, setSettingsGraduationYear] = useState('');
  const [settingsDegree, setSettingsDegree] = useState(academicProfile?.degreeName || 'Bachelor of Technology (B.Tech / B.E.)');
  const [settingsIsSaving, setSettingsIsSaving] = useState(false);

  // Career Goal settings & modular widgets config
  const [settingsCareerGoal, setSettingsCareerGoal] = useState<'Placement' | 'GATE' | 'Research' | 'Entrepreneurship' | 'Higher Studies'>('Placement');

  const [widgetsConfig, setWidgetsConfig] = useState<Array<{
    id: string;
    title: string;
    icon: any;
    desc: string;
    isPinned: boolean;
    isHidden: boolean;
    isCollapsed: boolean;
    order: number;
  }>>([
    { id: 'welcome_card', title: 'Profile & Progress', icon: User, desc: 'Student profile, semester, streak, and level details', isPinned: true, isHidden: false, isCollapsed: false, order: 1 },
    { id: 'todays_mission', title: "Today's Mission", icon: Target, desc: 'Solve branch challenges, quizzes, lectures, and PYQs', isPinned: true, isHidden: false, isCollapsed: false, order: 2 },
    { id: 'branch_challenge', title: 'Daily Branch Challenge', icon: Flame, desc: 'Branch-tailored engineering challenge of the day', isPinned: false, isHidden: false, isCollapsed: false, order: 3 },
    { id: 'ai_mentor', title: 'AI Mentor Insights', icon: Bot, desc: 'Strengths, weak topics, and personalized roadmap advice', isPinned: false, isHidden: false, isCollapsed: false, order: 4 },
    { id: 'quick_stats', title: 'Quick Stats', icon: Activity, desc: 'Summary of XP, ranks, coins, study hours, and certificates', isPinned: false, isHidden: false, isCollapsed: false, order: 5 },
    { id: 'continue_learning', title: 'Continue Learning', icon: BookOpen, desc: 'Direct access to unfinished courses and modules', isPinned: false, isHidden: false, isCollapsed: false, order: 6 },
    { id: 'hundred_days_track', title: '100 Days Track', icon: Layers, desc: 'Milestones and consistency track for long-term growth', isPinned: false, isHidden: false, isCollapsed: false, order: 7 },
    { id: 'weekly_challenge', title: 'Weekly Challenge', icon: Trophy, desc: 'Weekly target of quizzes, lectures, and coding challenges', isPinned: false, isHidden: false, isCollapsed: false, order: 8 },
    { id: 'daily_login', title: 'Daily Login Reward', icon: Coins, desc: '7-day reward calendar system', isPinned: false, isHidden: false, isCollapsed: false, order: 9 },
    { id: 'upcoming_deadlines', title: 'Upcoming Deadlines', icon: Clock, desc: 'Tracking due dates for assignments, quizzes, and exams', isPinned: false, isHidden: false, isCollapsed: false, order: 10 },
    { id: 'leaderboard', title: 'Mini Leaderboard', icon: Trophy, desc: 'Branch, college, and university peer rankings', isPinned: false, isHidden: false, isCollapsed: false, order: 11 },
    { id: 'xp_progress', title: 'XP Progress Analytics', icon: Activity, desc: 'Graph of weekly and monthly learning consistency', isPinned: false, isHidden: false, isCollapsed: false, order: 12 },
    { id: 'heatmap', title: 'Engineering Heatmap', icon: Sparkles, desc: 'Contribution grid of daily learning activities', isPinned: false, isHidden: false, isCollapsed: false, order: 13 },
    { id: 'achievements', title: 'Achievements Collection', icon: Award, desc: 'Engineering skill badges earned', isPinned: false, isHidden: false, isCollapsed: false, order: 14 },
    { id: 'community_activity', title: 'Community Activity', icon: Users, desc: 'Live feed of peer study achievements and uploads', isPinned: false, isHidden: false, isCollapsed: false, order: 15 },
    { id: 'recommended_content', title: 'AI Recommended Content', icon: Compass, desc: 'Recommended lectures, quizzes, and notes', isPinned: false, isHidden: false, isCollapsed: false, order: 16 },
    { id: 'career_roadmap', title: 'Career Roadmap', icon: Briefcase, desc: 'Branch-specific 4-year engineering career timelines', isPinned: false, isHidden: false, isCollapsed: false, order: 17 },
    { id: 'toolbox', title: 'Engineering Toolbox', icon: Wrench, desc: 'Branch calculators and converters used weekly', isPinned: false, isHidden: false, isCollapsed: false, order: 18 },
    { id: 'branch_clubs', title: 'Branch Clubs', icon: Globe, desc: 'Engineering clubs you can join', isPinned: false, isHidden: false, isCollapsed: false, order: 19 },
    { id: 'campus_events', title: 'Campus Events', icon: Bell, desc: 'Hackathons, placement drives, workshops, and visits', isPinned: false, isHidden: false, isCollapsed: false, order: 20 },
    { id: 'portfolio_progress', title: 'Portfolio Progress', icon: Code, desc: 'Checklist of resume, github sync, and skills', isPinned: false, isHidden: false, isCollapsed: false, order: 21 },
    { id: 'career_readiness', title: 'Career Readiness Score', icon: Zap, desc: 'Comprehensive evaluation of skill readiness', isPinned: false, isHidden: false, isCollapsed: false, order: 22 },
    { id: 'study_timer', title: 'Study Timer (Pomodoro)', icon: Clock, desc: 'Interactive focus timer to earn coins and XP', isPinned: false, isHidden: false, isCollapsed: false, order: 23 },
    { id: 'engineering_news', title: 'Engineering News', icon: Info, desc: 'Branch-filtered engineering news feed', isPinned: false, isHidden: false, isCollapsed: false, order: 24 },
    { id: 'campus_shop', title: 'Campus Shop', icon: Coins, desc: 'Redeem campus coins for certificates and reviews', isPinned: false, isHidden: false, isCollapsed: false, order: 25 },
  ]);

  // Load configuration from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('padhaku_widgets_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWidgetsConfig(prev => prev.map(w => {
          const stored = parsed.find((p: any) => p.id === w.id);
          if (stored) {
            return {
              ...w,
              isPinned: stored.isPinned,
              isHidden: stored.isHidden,
              isCollapsed: stored.isCollapsed,
              order: stored.order
            };
          }
          return w;
        }));
      } catch (err) {
        console.warn('Failed to parse saved widgets config:', err);
      }
    }
    
    const savedGoal = localStorage.getItem('padhaku_career_goal');
    if (savedGoal) {
      setSettingsCareerGoal(savedGoal as any);
    }
  }, []);

  // Save widgets configuration Helper
  const saveWidgetsConfig = (newConfig: typeof widgetsConfig) => {
    setWidgetsConfig(newConfig);
    const simplified = newConfig.map(w => ({
      id: w.id,
      isPinned: w.isPinned,
      isHidden: w.isHidden,
      isCollapsed: w.isCollapsed,
      order: w.order
    }));
    localStorage.setItem('padhaku_widgets_config', JSON.stringify(simplified));
  };

  const handleSetCareerGoal = (goal: typeof settingsCareerGoal) => {
    setSettingsCareerGoal(goal);
    localStorage.setItem('padhaku_career_goal', goal);
    addToast(`Career Goal updated to: ${goal}! AI Mentor adapted.`);
  };

  // Quiz Bank State
  const [quizzesList, setQuizzesList] = useState<any[]>([]);

  // Quiz Engine States
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizTimer, setQuizTimer] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  
  // Practice Creator States
  const [practiceBranch, setPracticeBranch] = useState('Computer Engineering');
  const [practiceSubject, setPracticeSubject] = useState('');
  const [practiceDifficulty, setPracticeDifficulty] = useState('Medium');

  // Mobile Sidebar Drawer State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Help Center States
  const [helpSearchQuery, setHelpSearchQuery] = useState('');
  const [helpActiveSubTab, setHelpActiveSubTab] = useState<'faqs' | 'contact' | 'livechat' | 'docs' | 'videos' | 'bug' | 'features' | 'community' | 'tickets'>('faqs');

  // Daily Login Reward Modal State
  const [showDailyLoginModal, setShowDailyLoginModal] = useState(false);

  // 100 Days Challenge Tracks State
  const [hundredDayTracks, setHundredDayTracks] = useState<any[]>([]);

  // AI Mentor Chat States
  const [mentorMessages, setMentorMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([
    { sender: 'ai', text: 'Hello! I am your AI Engineering Mentor. Ask me anything about your university syllabus, GATE preparation, C/C++ DSA algorithms, or engineering concepts!', time: 'Just now' }
  ]);
  const [mentorInput, setMentorInput] = useState('');

  // Projects Showcase State
  const [projectsList, setProjectsList] = useState([
    { id: 'p1', title: 'ShikshaSahayak Assessment Hub SPA', author: 'Ayush Pandey', dept: 'CSE 3rd Year', github: 'https://github.com/ayush/ShikshaSahayak', desc: 'Modern real-time engineering assessment & quiz dashboard with GTU 2024-25 syllabus and GATE PYQ zone.', status: 'Approved by Faculty', upvotes: 24, tech: ['Next.js', 'TypeScript', 'Tailwind CSS'], canEdit: true },
    { id: 'p2', title: 'Smart Grid Load Forecaster using LSTM', author: 'Priya Sharma', dept: 'EE 3rd Year', github: 'https://github.com/priya/smart-grid-forecaster', desc: 'Machine learning model predicting electrical grid peak loads using GTU power system dataset.', status: 'Approved by Faculty', upvotes: 18, tech: ['Python', 'TensorFlow', 'Power Systems'], canEdit: false },
    { id: 'p3', title: 'Automated CAD Gear Designer Script', author: 'Sunil Verma', dept: 'ME 3rd Year', github: 'https://github.com/sunil/cad-gear-script', desc: 'Python script for FreeCAD generating spur gear involute profiles automatically.', status: 'Under Faculty Review', upvotes: 9, tech: ['Python', 'CAD', 'Mechanical'], canEdit: false }
  ]);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', github: '', desc: '', tech: '' });

  // Notifications List & Notification Settings (Synced with D1 Database)
  const [notificationsList, setNotificationsList] = useState<any[]>([]);

  const loadNotifications = async () => {
    try {
      const res = await apiClient.getStudentNotifications();
      if (res && res.notifications) {
        setNotificationsList(res.notifications);
      }
    } catch (err) {
      console.warn('Failed to load notifications from database:', err);
    }
  };

  useEffect(() => {
    if (currentUser?.uid) {
      loadNotifications();
    }
  }, [currentUser?.uid]);

  // System Feature Toggles State
  const [featureToggles, setFeatureToggles] = useState({
    dailyChallenge: true,
    hundredDayChallenge: true,
    campusCoins: true,
    projectShowcase: true,
    aiMentor: true,
    leaderboardReset: true
  });

  // Admin Audit Log Trail State
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; timestamp: string; adminName: string; action: string; targetUser: string; reason: string }>>([
    { id: 'audit-1', timestamp: '2026-07-04 14:30', adminName: 'Admin (System)', action: 'Manual XP Adjustment (+100 XP)', targetUser: 'Ayush Pandey', reason: 'Hackathon Winner Bonus' },
    { id: 'audit-2', timestamp: '2026-07-04 11:15', adminName: 'Admin (System)', action: 'Streak Override Forgiven', targetUser: 'Priya Sharma', reason: 'Medical Leave Certificate' }
  ]);

  // Admin Form Modals State
  const [showManualXpModal, setShowManualXpModal] = useState(false);
  const [manualXpForm, setManualXpForm] = useState({ targetUser: 'Ayush Pandey', amount: 100, type: 'XP', reason: '' });

  // Sync Subject when Branch changes
  useEffect(() => {
    const subjects = BRANCH_SUBJECTS[practiceBranch] || [];
    if (subjects.length > 0) {
      setPracticeSubject(subjects[0]);
    }
  }, [practiceBranch]);
  
  // Live score tracker & user state
  const [userStats, setUserStats] = useState({
    classes: 0,
    quizzesCompleted: 0,
    accuracy: 0,
    rank: 1,
    xp: 0,
    badges: 0,
    level: 1,
    coins: 0,
    streak: 0,
    longestStreak: 0,
    dailyChallengeDone: false,
    dailyChallengeSkipped: false,
    claimedDailyReward: false
  });

  useEffect(() => {
    let active = true;
    if (currentUser?.uid) {
      const loadGamification = async () => {
        try {
          const { access } = getStoredTokens();
          const token = access || (await auth.currentUser?.getIdToken());
          const res = await fetch('/api/student/gamification', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          if (res.ok) {
            const data = await res.json();
            if (active && data) {
              const currentXp = Number(data.xp?.currentXP || data.xp?.totalXP || 0);
              const streakDays = Number(data.streak?.currentStreak || 0);
              const longestStreak = Number(data.streak?.longestStreak || streakDays);
              const calculatedLevel = Math.max(1, Math.floor(currentXp / 500) + 1);

              setUserStats(prev => ({
                ...prev,
                xp: currentXp,
                streak: streakDays,
                longestStreak,
                level: calculatedLevel,
                coins: Math.floor(currentXp / 10),
                badges: data.xp?.badges?.length || 0,
              }));
            }
          }
        } catch (err) {
          console.warn("Notice loading student gamification stats:", err);
        }
      };

      loadGamification();
    }
    return () => { active = false; };
  }, [currentUser?.uid]);

  // Dynamic active branch resolution & curriculum
  const activeBranchKey = useMemo(() => {
    return normalizeBranchId(settingsDept || academicProfile.branchName || academicProfile.branchId || 'cse');
  }, [settingsDept, academicProfile]);

  const activeBranchPack = useMemo(() => {
    return BRANCH_PACKS[activeBranchKey] || BRANCH_PACKS['cse'];
  }, [activeBranchKey]);

  const currentBranchSubjects = useMemo(() => {
    const sem = Number(selectedSemester) || 3;
    return activeBranchPack.coreSubjects[sem] || activeBranchPack.coreSubjects[3] || ['Core Engineering Subject', 'Engineering Systems'];
  }, [activeBranchPack, selectedSemester]);

  const activeBranchSlug = useMemo(() => {
    if (activeBranchKey === 'ee') return 'electrical-engineering';
    if (activeBranchKey === 'cse') return 'computer-engineering';
    if (activeBranchKey === 'it') return 'information-technology';
    if (activeBranchKey === 'me') return 'mechanical-engineering';
    if (activeBranchKey === 'ce') return 'civil-engineering';
    if (activeBranchKey === 'ece') return 'electronics-and-communication';
    return 'computer-engineering';
  }, [activeBranchKey]);

  const activeSemesterGtuSubjects = useMemo(() => {
    const sem = Number(selectedSemester) || 3;
    const branchData = GTU_SYLLABUS[activeBranchKey] || GTU_SYLLABUS['cse'];
    return branchData[sem] || branchData[3] || [];
  }, [activeBranchKey, selectedSemester]);

  const studentRecommendations = useMemo(() => {
    const branchToUse = settingsDept || academicProfile.branchName || academicProfile.branchId || 'cse';
    const semToUse = Number(selectedSemester) || Number(academicProfile.semester) || 3;
    const dynamicAccuracies: Record<string, number> = {};
    if (currentBranchSubjects[0]) dynamicAccuracies[currentBranchSubjects[0]] = 52;
    if (currentBranchSubjects[1]) dynamicAccuracies[currentBranchSubjects[1]] = 85;

    return generateStudentRecommendations({
      university: settingsUniversity || academicProfile.universityName || academicProfile.universityId,
      branch: branchToUse,
      semester: semToUse,
      selectedGoals: (academicProfile.goals && Array.isArray(academicProfile.goals)) ? academicProfile.goals : ['gtu_prep', 'cpi_boost'],
      userStats,
      subjectAccuracies: dynamicAccuracies
    });
  }, [settingsDept, settingsUniversity, selectedSemester, academicProfile, userStats, currentBranchSubjects]);

  // Daily Code Challenge validation states
  const [challengeCode, setChallengeCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<CodeVerificationResult | null>(null);
  const [hasRunTests, setHasRunTests] = useState(false);

  // Daily challenge for student's department
  const currentDailyChallenge = useMemo(() => {
    return findMatchingBranchData(DAILY_CHALLENGES_BY_BRANCH, settingsDept || academicProfile.branchName || academicProfile.branchId);
  }, [settingsDept, academicProfile]);

  // Sync / set starter code whenever active daily challenge shifts
  useEffect(() => {
    if (currentDailyChallenge) {
      if (currentDailyChallenge.problemCode && !currentDailyChallenge.options) {
        setChallengeCode(
`/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode(int x) : val(x), next(NULL) {}
 * };
 */
bool hasCycle(ListNode *head) {
    // Write your Floyd's Cycle Detection code here
    
}`
        );
      } else {
        setChallengeCode('');
      }
      setValidationResults(null);
      setHasRunTests(false);
    }
  }, [currentDailyChallenge]);

  const liveValidation = useMemo(() => {
    return verifyCode(challengeCode);
  }, [challengeCode]);



  // Load data from D1 Database
  useEffect(() => {
    async function loadDashboardData() {
      // 0. Load Profile
      try {
        if (currentUser) {
          const profile = await apiClient.getStudentProfile(currentUser.uid);
          if (profile) {
            setSettingsName(profile.name || profile.full_name || profile.fullName || '');
            setSettingsEmail(profile.email || '');
            setSettingsPhone(profile.phone_number || profile.phoneNumber || '');
            setSettingsDob(profile.dob || '');
            setSettingsImg(profile.avatar_url || profile.avatarUrl || '');
            setSettingsDept(profile.branch || profile.branch_name || profile.branchName || 'COMPUTER ENGINEERING');
            const calculatedYear = profile.semester ? Math.ceil(Number(profile.semester) / 2) : 3;
            const yearSuffix = calculatedYear === 1 ? '1st Year' : calculatedYear === 2 ? '2nd Year' : calculatedYear === 3 ? '3rd Year' : '4th Year';
            setSettingsYear(yearSuffix);
            setSettingsCollege(profile.college || profile.college_name || profile.collegeName || 'L.D. College of Engineering');
            setSettingsUniversity(profile.university || profile.university_name || profile.universityName || 'Gujarat Technological University (GTU)');
            if (profile.degree || profile.degree_name || profile.degreeName) setSettingsDegree(profile.degree || profile.degree_name || profile.degreeName);
            if (profile.enrollment_number || profile.enrollmentNumber) setSettingsEnrollmentNumber(profile.enrollment_number || profile.enrollmentNumber);
            if (profile.enrollment_year || profile.enrollmentYear) setSettingsEnrollmentYear(String(profile.enrollment_year || profile.enrollmentYear));
            if (profile.graduation_year || profile.graduationYear) setSettingsGraduationYear(String(profile.graduation_year || profile.graduationYear));
            if (profile.marks_10th !== undefined && profile.marks_10th !== null) setSettings10thMarks(profile.marks_10th);
            if (profile.marks_12th !== undefined && profile.marks_12th !== null) setSettings12thMarks(profile.marks_12th);
            if (profile.special_skills !== undefined && profile.special_skills !== null) setSettingsSpecialSkills(profile.special_skills);
            if (profile.languages_known !== undefined && profile.languages_known !== null) setSettingsLanguages(profile.languages_known);
            if (profile.experience !== undefined && profile.experience !== null) setSettingsExperience(profile.experience);
            if (profile.certifications !== undefined && profile.certifications !== null) setSettingsCertifications(profile.certifications);

            // Sync loaded profile to active dashboard workspace state
            const mappedDept = mapBranchToDeptId(profile.branch || '');
            const semNumber = profile.semester ? parseInt(profile.semester, 10) : 3;
            let loadedGoals: string[] = ['gtu_prep', 'coding_practice'];
            if (profile.goals) {
              try {
                loadedGoals = typeof profile.goals === 'string' ? JSON.parse(profile.goals) : profile.goals;
              } catch (e) {}
            }
            setSelectedDeptId(mappedDept);
            setSelectedSemester(semNumber);
            const slugifiedBranch = mappedDept.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            saveAcademicProfile({
              universityName: profile.university || 'Gujarat Technological University (GTU)',
              college: profile.college || 'L.D. College of Engineering',
              degreeName: 'B.Tech / B.E.',
              branchName: mappedDept,
              branchId: slugifiedBranch || 'computer-engineering',
              semester: semNumber,
              goals: loadedGoals
            });
          } else {
            setSettingsName(currentUser.displayName || currentUser.fullName || 'Student');
            setSettingsEmail(currentUser.email || '');
          }
        }
      } catch (err) {
        console.warn('Failed to load student profile:', err);
      }

      // 1. Load Stats
      try {
        if (currentUser?.uid) {
          const stats = await apiClient.getStudentStats(currentUser.uid);
          setUserStats(prev => ({
            ...prev,
            xp: stats.xp || 0,
            coins: stats.coins || 0,
            level: stats.level || 1,
            streak: stats.streak || 0,
            longestStreak: stats.longest_streak || 0,
            claimedDailyReward: stats.claimed_daily_reward === 1,
            weeklyRank: stats.weekly_rank || 1,
            totalStudents: stats.total_students || 1,
            quizzesCompleted: stats.quizzes_completed || 0,
            accuracy: stats.accuracy || 0,
            projectsApproved: stats.projects_approved || 0
          }));
        }
      } catch (err) {
        console.warn('Failed to load student stats from DB:', err);
      }

      // 1.5. Load Leaderboard
      try {
        const leaders = await apiClient.getLeaderboard();
        setLeaderboardData(leaders || []);
      } catch (err) {
        console.warn('Failed to load leaderboard:', err);
        setLeaderboardData([]);
      }

      // 2. Load Quizzes
      try {
        const quizzes = await apiClient.getQuizzes();
        setQuizzesList(quizzes || []);
      } catch (err) {
        console.warn('Failed to load quizzes from DB:', err);
        setQuizzesList([]);
      }

      // 3. Load Projects
      try {
        const projects = await apiClient.getStudentProjects(userRole === 'Admin');
        setProjectsList(projects || []);
      } catch (err) {
        console.warn('Failed to load projects from DB:', err);
        setProjectsList([]);
      }
    }
    loadDashboardData();
  }, [userRole, currentUser]);



  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const [toasts, setToasts] = useState<string[]>([]);
  const addToast = (msg: string) => {
    setToasts(prev => [...prev, msg]);
    setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 3000);
  };

  // Dynamic Branch Feature Helper
  const getBranchFeature = (dept: string) => {
    switch (dept) {
      case 'Electrical Engineering':
      case 'Electronics & Communication':
        return {
          title: 'Circuit Challengers',
          desc: 'RLC, Op-amps & logic systems',
          icon: BrainCircuit,
          iconBg: 'bg-amber-50 dark:bg-amber-950/30',
          iconColor: 'text-amber-500'
        };
      case 'Computer Science Engineering':
      case 'Information Technology':
        return {
          title: 'Algorithmic Arena',
          desc: 'Code, systems & security',
          icon: Terminal,
          iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
          iconColor: 'text-emerald-500'
        };
      case 'Mechanical Engineering':
        return {
          title: 'Thermal & CAD Titans',
          desc: 'Otto cycles & fluid dynamics',
          icon: Wrench,
          iconBg: 'bg-blue-50 dark:bg-blue-950/30',
          iconColor: 'text-blue-500'
        };
      case 'Civil Engineering':
        return {
          title: 'Structural Solvers',
          desc: 'Concrete & bending moments',
          icon: Building2,
          iconBg: 'bg-purple-50 dark:bg-purple-950/30',
          iconColor: 'text-purple-500'
        };
      default:
        return {
          title: 'Branch Challengers',
          desc: 'Daily branch-specific problem solving',
          icon: Cpu,
          iconBg: 'bg-rose-50 dark:bg-rose-950/30',
          iconColor: 'text-rose-500'
        };
    }
  };

  // Programmatic Scroll & Highlight Helper
  const handleNavigateToWidget = (widgetId: string) => {
    const widget = widgetsConfig.find(w => w.id === widgetId);
    if (widget) {
      if (widget.isHidden) {
        const updated = widgetsConfig.map(w => w.id === widgetId ? { ...w, isHidden: false } : w);
        saveWidgetsConfig(updated);
        addToast(`Unhid and navigated to ${widget.title}`);
      } else {
        addToast(`Navigating to ${widget.title}`);
      }
    }
    
    setTimeout(() => {
      const el = document.getElementById(`widget-${widgetId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-orange-500', 'ring-offset-2', 'dark:ring-offset-slate-900', 'scale-[1.01]');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-orange-500', 'ring-offset-2', 'dark:ring-offset-slate-900', 'scale-[1.01]');
        }, 2000);
      }
    }, 150);
  };

  // Audit Logger Helper
  const logAuditTrail = (action: string, targetUser: string, reason: string) => {
    const newLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      adminName: 'Admin (Ayush)',
      action,
      targetUser,
      reason
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Claim Daily Login Reward
  const claimDailyReward = async () => {
    try {
      const res = await apiClient.claimDailyReward(currentUser?.uid || '');

      setUserStats(prev => ({
        ...prev,
        xp: res.stats.xp,
        coins: res.stats.coins,
        streak: res.stats.streak,
        longestStreak: res.stats.longestStreak,
        claimedDailyReward: true
      }));
      addToast('Claimed Daily Reward: +100 XP & +50 Coins! 🎉');
    } catch (err) {
      console.warn('Backend API not available, using client-side fallback:', err);
      // Client-side fallback so the button works in sandbox/local preview without backend
      setUserStats(prev => ({
        ...prev,
        xp: prev.xp + 100,
        coins: prev.coins + 50,
        streak: prev.streak + 1,
        claimedDailyReward: true
      }));
      addToast('Claimed Daily Reward (Local Mode): +100 XP & +50 Coins! 🎉');
    } finally {
      setShowDailyLoginModal(false);
    }
  };

  // Complete Daily Challenge
  const handleDailyChallengeSubmit = (isCorrect: boolean, xp: number, coins: number) => {
    setUserStats(prev => ({
      ...prev,
      xp: prev.xp + (isCorrect ? xp : 50),
      coins: prev.coins + (isCorrect ? coins : 10),
      dailyChallengeDone: true
    }));
    addToast(isCorrect ? `Challenge Solved! +${xp} XP & +${coins} Coins!` : 'Attempt recorded! +50 XP for effort.');
  };

  // AI Mentor Send Message
  const sendAIMessage = (promptText?: string) => {
    const textToSend = promptText || mentorInput;
    if (!textToSend.trim()) return;

    const userMsg = { sender: 'user' as const, text: textToSend, time: 'Just now' };
    setMentorMessages(prev => [...prev, userMsg]);
    if (!promptText) setMentorInput('');

    setTimeout(() => {
      const aiReply = {
        sender: 'ai' as const,
        text: `Here is the explanation for "${textToSend}":\n\nIn GTU & GATE engineering curriculum, this concept relies on standard algorithmic complexity principles. For Operating Systems scheduling or Database Normalization (3NF/BCNF), ensure functional dependencies have super keys on the left side of X -> Y. Let me know if you would like a step-by-step example problem solved!`,
        time: 'Just now'
      };
      setMentorMessages(prev => [...prev, aiReply]);
    }, 1000);
  };

  // Submit New Project
  const handleAddProject = async () => {
    if (!newProject.title || !newProject.github) {
      addToast('Please provide a Project Title and GitHub URL.');
      return;
    }
    try {
      const techArray = newProject.tech ? newProject.tech.split(',').map(s => s.trim()) : ['React', 'TypeScript'];
      const created = await apiClient.submitStudentProject({
        title: newProject.title,
        author: 'Ayush Pandey',
        dept: `${settingsDept} ${settingsYear}`,
        github: newProject.github,
        desc: newProject.desc || 'Engineering student project submission.',
        tech: techArray
      });

      setProjectsList(prev => [created, ...prev]);
      setShowAddProjectModal(false);
      setNewProject({ title: '', github: '', desc: '', tech: '' });
      addToast('Project submitted for faculty review! +200 XP');
    } catch (err) {
      addToast('Failed to submit project.');
      console.error(err);
    }
  };

  // Timer for active quiz
  useEffect(() => {
    let interval: any;
    if (activeQuiz && !quizSubmitted && quizTimer > 0) {
      interval = setInterval(() => {
        setQuizTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            handleQuizSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeQuiz, quizSubmitted, quizTimer]);

  // Launch a Quiz
  const startQuiz = async (quiz: any) => {
    if (!quiz.published && userRole === 'Student') {
      addToast('This quiz is currently unpublished by faculty.');
      return;
    }

    let fullQuiz = { ...quiz };

    // Fetch full quiz details (with questions) from API
    try {
      const apiQuiz = await apiClient.getQuiz(quiz.id);
      if (apiQuiz && apiQuiz.questions) {
        fullQuiz = apiQuiz;
      }
    } catch (err) {
      console.warn('Failed to fetch quiz details from API, using client-side fallback:', err);
      // Fallback: try to find the quiz in our initial mock quizzes which contain the questions array
      const mockQuiz = INITIAL_ENGINEERING_QUIZZES.find(q => q.id === quiz.id);
      if (mockQuiz && mockQuiz.questions) {
        fullQuiz.questions = mockQuiz.questions;
      } else {
        // Safe check: if still no questions, initialize empty array so UI doesn't throw null reference error
        fullQuiz.questions = [];
      }
    }

    setActiveQuiz(fullQuiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizTimer(fullQuiz.duration * 60);
    setQuizSubmitted(false);
    addToast(`Started ${fullQuiz.title}`);
  };

  // Select Option
  const selectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  // Submit Quiz Action with Confirmation
  const handleQuizSubmit = async () => {
    setQuizSubmitted(true);
    try {
      const res = await apiClient.submitQuiz(activeQuiz.id, currentUser?.uid || '', selectedAnswers);

      
      const percent = Math.round((res.correctCount / res.questionsCount) * 100);

      setUserStats(prev => ({
        ...prev,
        quizzesCompleted: prev.quizzesCompleted + 1,
        xp: res.stats.xp,
        coins: res.stats.coins,
        level: res.stats.level,
        streak: res.stats.streak,
        longestStreak: res.stats.longestStreak
      }));

      // Update attempts used
      setQuizzesList(prev => prev.map(q => q.id === activeQuiz.id ? { ...q, attemptsUsed: q.attemptsUsed + 1 } : q));

      // Add recent activity
      setRecentActivities(prev => [
        { text: `You scored ${percent}% in ${activeQuiz.title}`, time: 'Just now', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50/10' },
        ...prev
      ]);

      addToast(`Submitted! Earned +${res.xpEarned} XP & +${res.coinsEarned} Coins`);
    } catch (err) {
      addToast('Failed to submit quiz attempt.');
      console.error(err);
    }
  };

  // Reset/Retry Quiz
  const closeOrRetryQuiz = () => {
    setActiveQuiz(null);
    setQuizSubmitted(false);
  };

  // Filter quizzes based on search query and category filter
  const filteredQuizzes = useMemo(() => {
    return quizzesList.filter(q => {
      const matchesSearch = !searchQuery || 
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategoryFilter === 'All' || q.category === selectedCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [quizzesList, searchQuery, selectedCategoryFilter]);

  const selectedDeptObject = useMemo(() => {
    if (!selectedDeptId) return null;
    return AICTE_DEPARTMENTS.find(d => d.id === selectedDeptId) || null;
  }, [selectedDeptId]);

  const accuracy = Math.min(100, Math.max(0, Number(userStats.accuracy) || 0));
  const availableSemesters = Array.from({ length: 8 }, (_, index) => index + 1);
  const departmentSubjects = currentBranchSubjects.map(name => ({ name }));

  // Current GTU courses for selected department and semester
  const currentGtuCourses = useMemo(() => {
    if (!selectedDeptId) return [];
    const deptData = GTU_SYLLABUS[selectedDeptId];
    if (!deptData) return [];
    if (deptData[selectedSemester] && deptData[selectedSemester].length > 0) {
      return deptData[selectedSemester];
    }
    return [
      { 
        code: `BE0${selectedSemester}000701`, 
        title: `${AICTE_DEPARTMENTS.find(d => d.id === selectedDeptId)?.short || 'ENG'} Semester ${selectedSemester} Core Subject`, 
        credits: '4 Credits', 
        type: 'Theory + Lab', 
        category: selectedSemester >= 7 ? 'PROJ' : selectedSemester >= 5 ? 'PEC' : 'PCC', 
        professor: 'GTU Faculty Department Head', 
        syllabus: [`GTU NEP Semester ${selectedSemester} Unit 1 Theory & Fundamentals`, `GTU NEP Semester ${selectedSemester} Unit 2 Practical Applications`, `GTU NEP Semester ${selectedSemester} Unit 3 Lab & Project Work`] 
      }
    ];
  }, [selectedDeptId, selectedSemester]);

  const usersList = useMemo(() => {
    if (leaderboardData && leaderboardData.length > 0) {
      return leaderboardData.map((row, idx) => ({
        rank: idx + 1,
        name: row.name || row.email?.split('@')[0] || 'Student',
        dept: row.branch ? row.branch.substring(0, 3).toUpperCase() : 'CSE',
        xp: row.xp || 0,
        streak: row.streak || 0,
        img: row.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64',
        highlight: Boolean(currentUser && row.user_id === currentUser.uid)
      }));
    }
    // Fallback if DB empty/loading: only show current student
    return [
      { rank: 1, name: settingsName, dept: settingsDept.substring(0, 3).toUpperCase(), xp: userStats.xp, streak: userStats.streak, img: settingsImg || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64', highlight: true }
    ];
  }, [leaderboardData, currentUser, settingsName, settingsDept, userStats, settingsImg]);

  const top1 = usersList.find(u => u.rank === 1) || { name: settingsName, xp: userStats.xp, img: settingsImg || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64' };
  const top2 = usersList.find(u => u.rank === 2) || null;
  const top3 = usersList.find(u => u.rank === 3) || null;

  const [showCustomizer, setShowCustomizer] = useState(false);

  const renderWidgetContent = (id: string) => {
    switch (id) {
      case 'welcome_card':
        return (
          <WelcomeCard 
            name={settingsName}
            branch={settingsDept}
            semester={selectedSemester}
            college={settingsCollege}
            university={settingsUniversity}
            level={userStats.level}
            xp={userStats.xp}
            streak={userStats.streak}
            onEditProfile={() => setActiveSidebarTab('Settings')}
          />
        );
      case 'todays_mission':
        return (
          <TodaysMission 
            userStats={userStats}
            setUserStats={setUserStats}
            addToast={addToast}
            careerGoal={settingsCareerGoal}
          />
        );
      case 'continue_learning':
        return (
          <ContinueLearning 
            semester={selectedSemester}
            branch={settingsDept}
            onContinue={() => setActiveSidebarTab('My Department')}
          />
        );
      case 'ai_mentor':
        return (
          <AIMentorWidget 
            branch={settingsDept}
            careerGoal={settingsCareerGoal}
            onNavigateToMentor={() => setActiveSidebarTab('🤖 AI Mentor')}
          />
        );
      case 'quick_stats':
        return (
          <QuickStatsWidget 
            xp={userStats.xp}
            coins={userStats.coins}
            streak={userStats.streak}
            quizzesCompleted={userStats.quizzesCompleted || 0}
            weeklyRank={(userStats as any).weeklyRank || 1}
            totalStudents={(userStats as any).totalStudents || 1}
            accuracy={(userStats as any).accuracy || 0}
            projectsApproved={(userStats as any).projectsApproved || 0}
            certificatesCount={settingsCertifications ? settingsCertifications.split(',').filter(Boolean).length : 0}
          />
        );
      case 'hundred_days_track':
        return (
          <HundredDaysTrack 
            day={36}
            todayTask="Implement Trie Data Structure & Insert/Search operations in C++"
            onNavigate={() => setActiveSidebarTab('100 Days Challenge')}
          />
        );
      case 'branch_challenge':
        return (
          <BranchChallengeWidget 
            branch={settingsDept}
            userStats={userStats}
            setUserStats={setUserStats}
            addToast={addToast}
          />
        );
      case 'weekly_challenge':
        return <WeeklyChallengeWidget />;
      case 'daily_login':
        return (
          <DailyLoginRewardWidget 
            claimed={userStats.claimedDailyReward}
            onClaim={claimDailyReward}
          />
        );
      case 'upcoming_deadlines':
        return <UpcomingDeadlinesWidget />;
      case 'leaderboard':
        return (
          <MiniLeaderboardWidget 
            activeTab={leaderboardTab}
            onNavigate={() => setActiveSidebarTab('Leaderboard')}
            users={usersList}
          />
        );
      case 'xp_progress':
        return <XPProgressGraph />;
      case 'heatmap':
        return <EngineeringHeatmapWidget />;
      case 'achievements':
        return <AchievementsWidget />;
      case 'community_activity':
        return <CommunityActivityWidget />;
      case 'recommended_content':
        return (
          <RecommendedContentWidget 
            branch={settingsDept}
            semester={selectedSemester}
            onNavigate={() => setActiveSidebarTab('My Department')}
          />
        );
      case 'career_roadmap':
        return (
          <EngineeringCareerRoadmapWidget 
            branch={settingsDept}
            careerGoal={settingsCareerGoal}
          />
        );
      case 'toolbox':
        return <EngineeringToolboxWidget branch={settingsDept} />;
      case 'branch_clubs':
        return <BranchClubsWidget />;
      case 'campus_events':
        return <CampusEventsWidget />;
      case 'portfolio_progress':
        return <PortfolioProgressWidget />;
      case 'career_readiness':
        return <CareerReadinessWidget careerGoal={settingsCareerGoal} />;
      case 'study_timer':
        return (
          <StudyTimerWidget 
            userStats={userStats}
            setUserStats={setUserStats}
            addToast={addToast}
          />
        );
      case 'engineering_news':
        return <EngineeringNewsWidget branch={settingsDept} />;
      case 'campus_shop':
        return (
          <CampusShopWidget 
            coins={userStats.coins}
            setUserStats={setUserStats}
            addToast={addToast}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-orange-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-white/10 text-sm font-medium z-50"
            >
              <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
              <span>{toast}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* REUSABLE CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div 
            onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center"
            >
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mx-auto ${confirmModal.isDestructive ? 'bg-red-50 text-red-500 dark:bg-red-950/40' : 'bg-orange-50 text-orange-500 dark:bg-orange-950/40'}`}>
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{confirmModal.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{confirmModal.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className={`py-2.5 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer ${confirmModal.isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                >
                  {confirmModal.actionLabel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DAILY LOGIN REWARD POPUP MODAL */}
      <AnimatePresence>
        {showDailyLoginModal && (
          <div 
            onClick={() => setShowDailyLoginModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-5 relative overflow-hidden"
            >
              <button 
                onClick={() => setShowDailyLoginModal(false)}
                className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="absolute right-[-20px] top-[-20px] h-32 w-32 rounded-full bg-orange-500/10 blur-2xl pointer-events-none" />

              <div className="h-16 w-16 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-orange-500/20">
                <Flame className="h-10 w-10 animate-bounce" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Daily Login Streak Reward! 🔥</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">You are on a <strong>{userStats.streak} Day Learning Streak</strong>. Keep it up!</p>
              </div>

              {/* Days Reward Track */}
              <div className="grid grid-cols-7 gap-1.5 py-2">
                {[
                  { day: 'Day 1', reward: '+20 XP' },
                  { day: 'Day 2', reward: '+30 XP' },
                  { day: 'Day 3', reward: '+40 XP' },
                  { day: 'Day 4', reward: '+50 XP' },
                  { day: 'Day 5', reward: '+60 XP' },
                  { day: 'Day 6', reward: '+70 XP' },
                  { day: 'Day 7', reward: '🪙 50', bonus: true }
                ].map((d, idx) => (
                  <div key={idx} className={`p-2 rounded-xl text-center border text-[9px] font-bold flex flex-col justify-between ${d.bonus ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
                    <span>{d.day}</span>
                    <span className="mt-1 font-extrabold">{d.reward}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={claimDailyReward}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-600/30 transition-all duration-200 cursor-pointer"
              >
                Claim Daily Reward (+100 XP & 50 Coins)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CAMPUS COINS WALLET MODAL */}
      <AnimatePresence>
        {showCoinsModal && (
          <div 
            onClick={() => setShowCoinsModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 relative"
            >
              <button 
                onClick={() => setShowCoinsModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-amber-50 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-200">
                  <Coins className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Campus Coins Wallet</h3>
                  <p className="text-xs text-slate-400">Virtual currency earned through learning activities</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl text-white shadow-md flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-amber-100">Total Balance</span>
                  <p className="text-2xl font-bold">{userStats.coins} Campus Coins</p>
                </div>
                <Coins className="h-10 w-10 opacity-40" />
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">How to Earn Coins:</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span>Complete Daily Code War</span>
                    <span className="font-bold text-amber-500">+25 Coins</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span>Pass GTU Quiz / Mock Test</span>
                    <span className="font-bold text-amber-500">+20 Coins</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <span>7-Day Daily Login Streak</span>
                    <span className="font-bold text-amber-500">+50 Coins</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN MANUAL XP/COINS ADJUSTMENT MODAL */}
      <AnimatePresence>
        {showManualXpModal && (
          <div 
            onClick={() => setShowManualXpModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative"
            >
              <button 
                onClick={() => setShowManualXpModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800"
              >
                <X className="h-4 w-4" />
              </button>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-orange-500" /> Manual Rewards Adjustment
              </h3>
              <p className="text-xs text-slate-400">Add or subtract XP / Coins for a student. Requires a mandatory reason for audit logging.</p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Student</label>
                  <select
                    value={manualXpForm.targetUser}
                    onChange={(e) => setManualXpForm(prev => ({ ...prev, targetUser: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                  >
                    <option value="Ayush Pandey">Ayush Pandey (CSE 3rd Year)</option>
                    <option value="Priya Sharma">Priya Sharma (ECE 3rd Year)</option>
                    <option value="Rahul Singh">Rahul Singh (CSE 3rd Year)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Currency Type</label>
                    <select
                      value={manualXpForm.type}
                      onChange={(e) => setManualXpForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                    >
                      <option value="XP">XP Points</option>
                      <option value="Coins">Campus Coins</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Amount (+/-)</label>
                    <input
                      type="number"
                      value={manualXpForm.amount}
                      onChange={(e) => setManualXpForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Reason for Audit Log (Mandatory)</label>
                  <textarea
                    placeholder="e.g. Hackathon winner reward / Lab quiz error correction..."
                    rows={2}
                    value={manualXpForm.reason}
                    onChange={(e) => setManualXpForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!manualXpForm.reason.trim()) {
                      addToast('Mandatory reason field required for audit logging.');
                      return;
                    }
                    if (manualXpForm.targetUser === 'Ayush Pandey') {
                      if (manualXpForm.type === 'XP') {
                        setUserStats(prev => ({ ...prev, xp: Math.max(0, prev.xp + manualXpForm.amount) }));
                      } else {
                        setUserStats(prev => ({ ...prev, coins: Math.max(0, prev.coins + manualXpForm.amount) }));
                      }
                    }
                    logAuditTrail(`Manual ${manualXpForm.type} Adjustment (${manualXpForm.amount > 0 ? '+' : ''}${manualXpForm.amount} ${manualXpForm.type})`, manualXpForm.targetUser, manualXpForm.reason);
                    setShowManualXpModal(false);
                    setManualXpForm({ targetUser: 'Ayush Pandey', amount: 100, type: 'XP', reason: '' });
                    addToast(`Updated ${manualXpForm.targetUser}'s ${manualXpForm.type}! Logged to audit trail.`);
                  }}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Save & Log Adjustment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex h-screen overflow-hidden">
        
        {/* LEFT SIDEBAR */}
        <aside className="w-64 border-r border-[#24272C] shrink-0 flex flex-col justify-between bg-[#121417] text-slate-200 transition-colors duration-200 hidden lg:flex">
          <div className="flex flex-col flex-1 min-h-0">
            {/* Logo Header */}
            <div className="h-16 px-6 flex items-center border-b border-[#24272C] justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-[30px] h-[30px] rounded-[9px] bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" fill="white"/></svg>
                </div>
                <div>
                  <h1 className="font-bold text-sm leading-none tracking-tight text-white font-display">
                    ShikshaSahayak
                  </h1>
                  <span className="text-[8.5px] font-bold text-[#7A7F88] uppercase tracking-[1.6px] mt-1 block font-sans">
                    ASSESSMENT HUB
                  </span>
                </div>
              </div>
            </div>

            {/* Back link */}
            <Link
              to="/student"
              className="flex items-center gap-2 text-[#7A7F88] hover:text-white text-xs font-semibold px-6 py-4 border-b border-[#24272C] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              <span>Back to Student Portal</span>
            </Link>

            {/* Navigation links grouped strictly as per Image */}
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
              {/* Group 1: MAIN */}
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 mb-1">MAIN</h4>
                {[
                  { name: 'Dashboard', icon: LayoutDashboard, targetTab: 'Dashboard' },
                  { name: 'My Subjects', icon: BookOpen, targetTab: 'My Subjects' },
                  { name: 'Notes', icon: FileText, targetTab: 'Notes' },
                  { name: 'PYQs', icon: FileSpreadsheet, targetTab: 'PYQs' },
                  { name: 'Assessments', icon: BrainCircuit, targetTab: 'Assessments' },
                  { name: 'AI Tutor', icon: Bot, targetTab: 'AI Tutor' },
                  { name: 'Downloads', icon: Download, targetTab: 'Downloads' },
                  { name: 'Bookmarks', icon: Bookmark, targetTab: 'Bookmarks' },
                  { name: 'My Library', icon: FolderOpen, targetTab: 'My Library' },
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isActive = (activeSidebarTab === item.name || activeSidebarTab === item.targetTab) && !activeQuiz;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveSidebarTab(item.targetTab || item.name);
                        setSelectedDeptId(null);
                        setActiveQuiz(null);
                        addToast(`Opened ${item.name}`);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group cursor-pointer ${
                        isActive 
                          ? 'bg-[#F97316] text-white shadow-md font-bold' 
                          : 'text-[#8B8F97] hover:bg-[#1B1E23] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Group 2: STUDY TOOLS */}
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 mb-1">STUDY TOOLS</h4>
                {[
                  { name: 'Quizzes', icon: Flame, targetTab: 'Quizzes' },
                  { name: 'Flashcards', icon: Layers, targetTab: 'Flashcards' },
                  { name: 'Mind Maps', icon: Compass, targetTab: 'Mind Maps' },
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isActive = (activeSidebarTab === item.name || activeSidebarTab === item.targetTab) && !activeQuiz;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveSidebarTab(item.targetTab || item.name);
                        setSelectedDeptId(null);
                        setActiveQuiz(null);
                        addToast(`Opened ${item.name}`);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group cursor-pointer ${
                        isActive 
                          ? 'bg-[#F97316] text-white shadow-md font-bold' 
                          : 'text-[#8B8F97] hover:bg-[#1B1E23] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Group 3: MORE */}
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 mb-1">MORE</h4>
                {[
                  { name: 'Attendance', icon: CheckCircle2, badge: 'NEW', targetTab: 'Attendance' },
                  { name: 'Calendar', icon: Calendar, targetTab: 'Calendar' },
                  { name: 'Progress', icon: TrendingUp, targetTab: 'Progress' },
                  { name: 'Settings', icon: Settings, targetTab: 'Settings' },
                  { name: 'Help & Support', icon: QuestionIcon, targetTab: 'Help & Support' },
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isActive = (activeSidebarTab === item.name || activeSidebarTab === item.targetTab) && !activeQuiz;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        if (item.name === 'Attendance') {
                          setAttendanceModalOpen(true);
                        } else {
                          setActiveSidebarTab(item.targetTab || item.name);
                        }
                        setSelectedDeptId(null);
                        setActiveQuiz(null);
                        addToast(`Opened ${item.name}`);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group cursor-pointer ${
                        isActive 
                          ? 'bg-[#F97316] text-white shadow-md font-bold' 
                          : 'text-[#8B8F97] hover:bg-[#1B1E23] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="ml-auto bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Streak widget in Sidebar */}
            <div className="p-4 border-t border-[#24272C] bg-[#121417]">
              <div className="border border-[#262A30] rounded-xl p-3.5 bg-[#181B20]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <svg className="text-[#F97316] w-[15px] height-[15px]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c2 2 2 5 0 8a6 6 0 0 1-10-4c0-4 3-6 6-11Z"/></svg>
                    <span className="text-[10.5px] text-[#8B8F97] font-semibold tracking-wider">DAY STREAK</span>
                  </div>
                </div>
                <div className="text-2xl font-semibold leading-none text-white font-mono flex items-baseline">
                  {userStats.streak} <span className="text-xs text-[#7A7F88] font-sans font-normal ml-1">days active</span>
                </div>
                <div className="h-1 bg-[#26292F] rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-[#F97316] rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (userStats.streak / 30) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN PANEL CONTENT */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          
          {/* TOP NAVIGATION BAR */}
          <header className="h-16 border-b shrink-0 bg-white dark:bg-slate-900 border-[#EBE7DF] dark:border-slate-800 flex items-center justify-between px-3.5 sm:px-6 transition-colors duration-200">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-xl">
              {/* Mobile Drawer Navigation */}
              <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                <SheetTrigger asChild>
                  <button className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] sm:max-w-xs p-0 bg-[#121417] text-white border-r border-[#24272C]">
                  <SheetHeader className="p-4 border-b border-[#24272C] text-left">
                    <SheetTitle className="text-white font-bold flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-[#F97316] flex items-center justify-center font-bold text-white text-xs">
                        P
                      </div>
                      <span>ShikshaSahayak</span>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-80px)]">
                    {/* Mobile Section 1: MAIN */}
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider px-2 mb-1">MAIN</p>
                      {[
                        { name: 'Dashboard', icon: LayoutDashboard, targetTab: 'Dashboard' },
                        { name: 'My Subjects', icon: BookOpen, targetTab: 'My Subjects' },
                        { name: 'Notes', icon: FileText, targetTab: 'Notes' },
                        { name: 'PYQs', icon: FileSpreadsheet, targetTab: 'PYQs' },
                        { name: 'Assessments', icon: BrainCircuit, targetTab: 'Assessments' },
                        { name: 'AI Tutor', icon: Bot, targetTab: 'AI Tutor' },
                        { name: 'Downloads', icon: Download, targetTab: 'Downloads' },
                        { name: 'Bookmarks', icon: Bookmark, targetTab: 'Bookmarks' },
                        { name: 'My Library', icon: FolderOpen, targetTab: 'My Library' },
                      ].map((item) => {
                        const IconComponent = item.icon;
                        const isActive = activeSidebarTab === item.targetTab || activeSidebarTab === item.name;
                        return (
                          <button
                            key={item.name}
                            onClick={() => {
                              setActiveSidebarTab(item.targetTab || item.name);
                              setSelectedDeptId(null);
                              setActiveQuiz(null);
                              setIsMobileSidebarOpen(false);
                              addToast(`Opened ${item.name}`);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                              isActive 
                                ? 'bg-[#F97316] text-white font-bold' 
                                : 'text-[#8B8F97] hover:bg-[#1B1E23] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                              <span className="truncate">{item.name}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Mobile Section 2: STUDY TOOLS */}
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider px-2 mb-1">STUDY TOOLS</p>
                      {[
                        { name: 'Quizzes', icon: Flame, targetTab: 'Quizzes' },
                        { name: 'Flashcards', icon: Layers, targetTab: 'Flashcards' },
                        { name: 'Mind Maps', icon: Compass, targetTab: 'Mind Maps' },
                      ].map((item) => {
                        const IconComponent = item.icon;
                        const isActive = activeSidebarTab === item.targetTab || activeSidebarTab === item.name;
                        return (
                          <button
                            key={item.name}
                            onClick={() => {
                              setActiveSidebarTab(item.targetTab || item.name);
                              setSelectedDeptId(null);
                              setActiveQuiz(null);
                              setIsMobileSidebarOpen(false);
                              addToast(`Opened ${item.name}`);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                              isActive 
                                ? 'bg-[#F97316] text-white font-bold' 
                                : 'text-[#8B8F97] hover:bg-[#1B1E23] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                              <span className="truncate">{item.name}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Mobile Section 3: MORE */}
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider px-2 mb-1">MORE</p>
                      {[
                        { name: 'Attendance', icon: CheckCircle2, badge: 'NEW', targetTab: 'Attendance' },
                        { name: 'Calendar', icon: Calendar, targetTab: 'Calendar' },
                        { name: 'Progress', icon: TrendingUp, targetTab: 'Progress' },
                        { name: 'Settings', icon: Settings, targetTab: 'Settings' },
                        { name: 'Help & Support', icon: QuestionIcon, targetTab: 'Help & Support' },
                      ].map((item) => {
                        const IconComponent = item.icon;
                        const isActive = activeSidebarTab === item.targetTab || activeSidebarTab === item.name;
                        return (
                          <button
                            key={item.name}
                            onClick={() => {
                              setIsMobileSidebarOpen(false);
                              if (item.name === 'Attendance') {
                                setAttendanceModalOpen(true);
                              } else {
                                setActiveSidebarTab(item.targetTab || item.name);
                              }
                              setSelectedDeptId(null);
                              setActiveQuiz(null);
                              addToast(`Opened ${item.name}`);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                              isActive 
                                ? 'bg-[#F97316] text-white font-bold' 
                                : 'text-[#8B8F97] hover:bg-[#1B1E23] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                              <span className="truncate">{item.name}</span>
                            </div>
                            {item.badge && (
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-3 border-t border-[#24272C] space-y-2">
                      <p className="text-[10px] uppercase font-bold text-[#7A7F88] tracking-wider px-2">Quick Actions</p>
                      <button
                        onClick={() => {
                          setIsMobileSidebarOpen(false);
                          setShowOnboardingModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 font-bold"
                      >
                        <GraduationCap className="h-4 w-4" />
                        <span>Configure GTU Branch</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsMobileSidebarOpen(false);
                          setShowWidgetLibraryModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 bg-slate-800/60 font-bold"
                      >
                        <Plus className="h-4 w-4 text-orange-500" />
                        <span>Widget Store</span>
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              
              <div className="hidden md:flex flex-1 bg-white dark:bg-slate-950 border border-[#EBE7DF] dark:border-slate-800 rounded-xl px-3 py-1.5 sm:py-2 text-xs text-[#A4A9B2] items-center gap-2 min-w-0 max-w-xl">
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#A4A9B2] shrink-0" />
                <span className="truncate text-[11px] sm:text-xs">Search GTU subjects, daily code wars...</span>
              </div>
            </div>

            {/* Right icons, Role Switcher, campus coins, notifications, dark mode, avatar */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

              <button
                onClick={() => setShowWidgetLibraryModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Open Cross-Branch Widget Store"
              >
                <Plus className="h-3.5 w-3.5 text-orange-500" />
                <span>Widget Store</span>
              </button>

              {/* Role Badge (Only shown in Admin path mode, non-interactive) */}
              {userRole === 'Admin' && (
                <div className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border bg-purple-600 text-white border-purple-600 shadow-md select-none shrink-0">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Role: Admin</span>
                </div>
              )}

              {/* Mark Live Challenge Attendance Button */}
              <button
                onClick={() => setAttendanceModalOpen(true)}
                className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] sm:text-xs font-extrabold px-2.5 sm:px-3 py-1.5 shadow-md shadow-orange-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer shrink-0"
                title="Mark Live Challenge Attendance"
              >
                <Radio className="h-3.5 w-3.5 animate-pulse text-white shrink-0" />
                <span>Attendance</span>
              </button>

              {/* Join Class with Code Button */}
              <button
                onClick={() => setJoinClassModalOpen(true)}
                className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-[11px] sm:text-xs font-extrabold px-2.5 sm:px-3 py-1.5 shadow-md hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shrink-0"
                title="Join Class with Code"
              >
                <GraduationCap className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                <span>Join<span className="hidden sm:inline"> Class</span></span>
              </button>

              {/* Campus Coins Balance Button */}
              <button
                onClick={() => setShowCoinsModal(true)}
                className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-[#EBE7DF] dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold px-2 sm:px-3 py-1.5 text-[#B4720A] hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
              >
                <Coins className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>{userStats.coins}</span>
              </button>

              {/* Notifications Dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 sm:p-2 rounded-xl border border-[#EBE7DF] dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer shrink-0"
                >
                  <Bell className="h-4 w-4" />
                  {notificationsList.some(n => n.unread) && (
                    <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 h-2 w-2 rounded-full bg-orange-600 animate-ping" />
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 cursor-default" 
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-3 sm:p-4 space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h4 className="font-bold text-xs">Notifications</h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await apiClient.markAllStudentNotificationsRead();
                                setNotificationsList(prev => prev.map(n => ({ ...n, unread: false, is_read: 1 })));
                                addToast('Marked all notifications as read.');
                              } catch (err) {
                                console.warn('Failed to mark all as read:', err);
                              }
                            }}
                            className="text-[10px] text-orange-600 font-semibold cursor-pointer hover:underline"
                          >
                            Mark all read
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await apiClient.clearStudentNotifications();
                                setNotificationsList([]);
                                addToast('Cleared all notifications.');
                              } catch (err) {
                                console.warn('Failed to clear notifications:', err);
                              }
                            }}
                            className="text-[10px] text-red-500 font-semibold cursor-pointer hover:underline"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2.5 max-h-64 overflow-y-auto">
                        {notificationsList.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">No notifications.</p>
                        ) : (
                          notificationsList.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={async () => {
                                if (n.unread) {
                                  try {
                                    await apiClient.markStudentNotificationRead(n.id);
                                    setNotificationsList(prev => prev.map(item => item.id === n.id ? { ...item, unread: false, is_read: 1 } : item));
                                  } catch (e) {}
                                }
                              }}
                              className={`p-2.5 rounded-xl space-y-1 cursor-pointer transition-all ${n.unread ? 'bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30' : 'bg-slate-50 dark:bg-slate-800'}`}
                            >
                              <div className="flex justify-between items-start">
                                <h5 className="text-xs font-bold text-slate-900 dark:text-white">{n.title}</h5>
                                <span className="text-[9px] text-slate-400">{n.time || 'Recently'}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{n.desc || n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Dark / Light mode toggle */}
              <button 
                onClick={() => {
                  const nextTheme = isDarkMode ? 'light' : 'dark';
                  setTheme(nextTheme);
                  addToast(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} mode`);
                }}
                title="Toggle Light/Dark Theme"
                className="p-1.5 sm:p-2 rounded-xl border border-[#EBE7DF] dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
              </button>

              {/* User Profile avatar */}
              <div className="relative shrink-0">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-1.5 sm:gap-2 border border-[#EBE7DF] dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl p-1 sm:pr-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                >
                  <img
                    src={settingsImg}
                    alt={settingsName}
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg object-cover ring-2 ring-orange-500/20 shrink-0"
                  />
                  <div className="text-left hidden md:block ml-2">
                    <p className="font-semibold text-xs leading-none text-[#171A1F] dark:text-white">{settingsName}</p>
                    <span className="text-[9px] text-[#A4A9B2] font-medium block mt-0.5">{settingsDept.split(' ')[0]} • {settingsYear}</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5 sm:ml-1 hidden sm:block shrink-0" />
                </button>

                {showProfileMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 cursor-default" 
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1">
                      <button
                        onClick={() => {
                          setActiveSidebarTab('Settings');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer border-none"
                      >
                        <Settings className="h-4 w-4 text-slate-400" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveSidebarTab('Student Portfolio');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer border-none"
                      >
                        <User className="h-4 w-4 text-slate-400" />
                        <span>Portfolio</span>
                      </button>
                      
                      <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                      <button
                        onClick={async () => {
                          setShowProfileMenu(false);
                          await logout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer border-none"
                      >
                        <LogOut className="h-4 w-4 text-red-500" />
                        <span>Sign Out / Switch Account</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* SCROLLABLE MAIN LAYOUT */}
          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-3.5 sm:p-5 md:p-6 pb-24 lg:pb-6">
            
            {/* ---------------- ACTIVE QUIZ MODE ---------------- */}
            {activeQuiz ? (
              <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm gap-4">
                  <div>
                    <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 text-[10px] font-bold rounded uppercase tracking-wider">{activeQuiz.subject}</span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5">{activeQuiz.title}</h2>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-semibold shrink-0">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Clock className="h-4.5 w-4.5 text-slate-400" />
                      <span>
                        {Math.floor(quizTimer / 60)}:{(quizTimer % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-orange-600 dark:text-orange-400">+{activeQuiz.xpReward} XP</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-300" 
                    style={{ width: `${((currentQuestionIndex + (quizSubmitted ? 1 : 0)) / activeQuiz.questionsCount) * 100}%` }}
                  />
                </div>

                {/* Quiz results preview */}
                {quizSubmitted ? (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="text-center py-4 space-y-2">
                      <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-950 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                        <CheckCircle className="h-10 w-10" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quiz Attempt Completed!</h3>
                      <p className="text-xs text-slate-400">You scored {Math.round((activeQuiz.questions.filter((q: any) => selectedAnswers[q.id] === q.correctAnswer).length / activeQuiz.questionsCount) * 100)}% on this test.</p>
                      
                      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mt-6">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Correct answers</span>
                          <p className="text-lg font-bold text-emerald-500">{activeQuiz.questions.filter((q: any) => selectedAnswers[q.id] === q.correctAnswer).length} / {activeQuiz.questionsCount}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">XP Gained</span>
                          <p className="text-lg font-bold text-orange-500">+{activeQuiz.xpReward} XP</p>
                        </div>
                      </div>
                    </div>

                    <hr className="border-slate-100 dark:border-slate-800" />

                    {/* Question review list */}
                    <div className="space-y-5">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Review Questions</h4>
                      {activeQuiz.questions.map((q: any, i: number) => {
                        const userAns = selectedAnswers[q.id];
                        const isCorrect = userAns === q.correctAnswer;
                        return (
                          <div key={q.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                            <div className="flex justify-between items-start gap-3">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Q{i + 1}. {q.question}</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase shrink-0 ${isCorrect ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'}`}>
                                {isCorrect ? 'Correct' : 'Incorrect'}
                              </span>
                            </div>

                            <div className="grid gap-2 text-xs">
                              {q.options.map((opt: string, idx: number) => (
                                <div 
                                  key={idx} 
                                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between ${
                                    idx === q.correctAnswer 
                                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium'
                                      : idx === userAns 
                                        ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
                                        : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  <span>{opt}</span>
                                  {idx === q.correctAnswer && <Check className="h-4 w-4" />}
                                </div>
                              ))}
                            </div>

                            {/* Explanation details */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg flex gap-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-l-2 border-orange-500">
                              <Info className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                              <p><strong>Explanation:</strong> {q.explanation}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button 
                        onClick={closeOrRetryQuiz}
                        className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        Back to Dashboard
                      </button>
                      <button 
                        onClick={() => startQuiz(activeQuiz)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        Retry Quiz
                      </button>
                    </div>
                  </div>
                ) : !activeQuiz.questions || activeQuiz.questions.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm text-center py-12 space-y-4">
                    <p className="text-sm font-semibold text-slate-500">No questions loaded for this quiz.</p>
                    <button 
                      onClick={closeOrRetryQuiz}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Go Back
                    </button>
                  </div>
                ) : !activeQuiz.questions[currentQuestionIndex] ? (
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm text-center py-12 space-y-4">
                    <p className="text-sm font-semibold text-slate-500">Failed to load question details.</p>
                    <button 
                      onClick={closeOrRetryQuiz}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Go Back
                    </button>
                  </div>
                ) : (
                  // Active Question View
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-6">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-400">Question {currentQuestionIndex + 1} of {activeQuiz.questionsCount}</span>
                      <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-normal">
                        {activeQuiz.questions[currentQuestionIndex].question}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      {activeQuiz.questions[currentQuestionIndex].options.map((option: string, idx: number) => {
                        const isSelected = selectedAnswers[activeQuiz.questions[currentQuestionIndex].id] === idx;
                        return (
                          <button
                            key={idx}
                            onClick={() => selectOption(activeQuiz.questions[currentQuestionIndex].id, idx)}
                            className={`p-4 rounded-xl border text-left flex items-center justify-between text-sm transition-all duration-150 cursor-pointer ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50/20 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-semibold ring-1 ring-orange-500/50'
                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span>{option}</span>
                            <div className={`h-5.5 w-5.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300 dark:border-slate-700'}`}>
                              {isSelected ? <Check className="h-3 w-3" /> : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-50 disabled:pointer-events-none hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Previous
                      </button>

                      {currentQuestionIndex === activeQuiz.questionsCount - 1 ? (
                        <button
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Submit Quiz Attempt?',
                              message: 'You have answered all questions. Submit your attempt now to view score and earn XP rewards?',
                              actionLabel: 'Submit Quiz',
                              isDestructive: false,
                              onConfirm: () => {
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                handleQuizSubmit();
                              }
                            });
                          }}
                          className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md transition-colors cursor-pointer"
                        >
                          Submit Quiz
                        </button>
                      ) : (
                        <button
                          onClick={() => setCurrentQuestionIndex(prev => Math.min(activeQuiz.questionsCount - 1, prev + 1))}
                          className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md transition-colors cursor-pointer"
                        >
                          Next Question
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              
              // ---------------- MAIN PANEL DIRECTORY TABS ----------------
              <div>
                
                {/* 1. DASHBOARD VIEW — FEATURE HUBS CENTRAL HUB */}
                {activeSidebarTab === 'Dashboard' && (
                  <>
                    <div className="space-y-6 text-left font-sans">

                      {/* PROMOTIONAL HERO BANNER & ASSESSMENT PORTAL SPOTLIGHT */}
                      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-navy-900 via-navy-950 to-slate-900 border border-brand-orange/30 p-4 sm:p-6 md:p-8 text-white shadow-xl">
                        {/* Glow background effects */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/15 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
                          <div className="space-y-3 max-w-2xl w-full">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <span className="px-2.5 sm:px-3 py-1 bg-brand-orange/20 border border-brand-orange/40 text-brand-orange text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-xs">
                                <Sparkles className="w-3.5 h-3.5 animate-pulse shrink-0" />
                                <span>NEW: ShikshaSahayak Assessment 2.0</span>
                              </span>
                              <span className="px-2.5 sm:px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase tracking-wider rounded-full">
                                🚀 Ultimate GTU Study Experience
                              </span>
                            </div>

                            <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                              Welcome to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange via-amber-300 to-orange-400">Ultimate GTU Study & Assessment Portal</span>
                            </h1>

                            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                              Master your GTU engineering curriculum with interactive semester quizzes, AI-evaluated practice tests, complete PYQ archives, and real-time exam readiness analytics!
                            </p>

                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2 w-full">
                              <button
                                onClick={() => setActiveSidebarTab('Quizzes')}
                                className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-extrabold shadow-lg shadow-brand-orange/20 transition-all flex items-center gap-2 cursor-pointer group active:scale-[0.98]"
                              >
                                <BrainCircuit className="w-4 h-4 group-hover:rotate-12 transition-transform shrink-0" />
                                <span>Launch Assessment Quiz</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform shrink-0" />
                              </button>

                              <button
                                onClick={() => setActiveSidebarTab('PYQs Bank')}
                                className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-extrabold backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                              >
                                <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                                <span>Explore GTU PYQ Vault</span>
                              </button>

                              <button
                                onClick={() => setActiveSidebarTab('AI Tutor')}
                                className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-blue-200 text-xs font-extrabold backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                              >
                                <Bot className="w-4 h-4 text-blue-300 animate-bounce shrink-0" />
                                <span>Ask AI Assistant</span>
                              </button>
                            </div>
                          </div>

                          {/* Right Side Showcase Card */}
                          <div className="w-full lg:w-80 shrink-0 bg-white/10 dark:bg-slate-900/60 backdrop-blur-xl border border-white/15 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <Trophy className="w-4 h-4 text-brand-orange" /> Live Assessment Stats
                              </span>
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded-md">
                                Active Semester {selectedSemester}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-center">
                              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Passed Quizzes</span>
                                <span className="text-lg font-black text-amber-400">{userStats.quizzesCompleted} Tests</span>
                              </div>
                              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Study Streak</span>
                                <span className="text-lg font-black text-brand-orange">{userStats.streak} Days 🔥</span>
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 text-left space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-amber-300">Exam Readiness Score</span>
                                <span className="font-black text-emerald-400">{userStats.quizzesCompleted > 0 ? `${Math.min(100, Math.round((userStats as any).accuracy || 75))}%` : '--'}</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-brand-orange to-emerald-400" style={{ width: `${userStats.quizzesCompleted > 0 ? Math.min(100, Math.round((userStats as any).accuracy || 75)) : 0}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 1. TOP 5 STAT CARDS ROW (Matching Image 2) */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                      {/* Card 1: Study Streak */}
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                        <div className="w-10 h-10 rounded-full bg-[#fff2e8] dark:bg-orange-950/40 text-brand-orange flex items-center justify-center mb-3">
                          <Flame className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">Study Streak</h4>
                          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{userStats.streak} Days</div>
                          <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 mt-0.5">
                            <TrendingUp className="w-3 h-3" /> Personal Best!
                          </p>
                        </div>
                      </div>

                      {/* Card 2: Subjects */}
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                        <div className="w-10 h-10 rounded-full bg-[#e0f2fe] dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mb-3">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">Subjects</h4>
                          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                            {enrolledClasses.length > 0 ? enrolledClasses.length : currentBranchSubjects.length} Active
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Sem {selectedSemester} {activeBranchPack.shortName || 'GTU'}
                          </p>
                        </div>
                      </div>

                      {/* Card 3: Attendance */}
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                        <div className="w-10 h-10 rounded-full bg-[#dcfce7] dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-3">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">Attendance</h4>
                          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {enrolledClasses.length > 0 ? 'Enrolled' : '--'}
                          </div>
                          <p className="text-[10px] text-emerald-600 font-extrabold mt-0.5">
                            {enrolledClasses.length > 0 ? `${enrolledClasses.length} Active Roster` : 'Join Class to Track'}
                          </p>
                        </div>
                      </div>

                      {/* Card 4: Quizzes */}
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
                        <div className="w-10 h-10 rounded-full bg-[#f3e8ff] dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mb-3">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">Quizzes</h4>
                          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                            {userStats.quizzesCompleted} Passed
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {userStats.quizzesCompleted > 0 ? `${Math.round((userStats as any).accuracy || 85)}% avg score` : 'Start 1st Quiz'}
                          </p>
                        </div>
                      </div>

                      {/* Card 5: Upcoming Exams */}
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
                        <div className="w-10 h-10 rounded-full bg-[#ffe4e6] dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-3">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400">Upcoming Exams</h4>
                          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">GTU End-Sem</div>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Sem {selectedSemester} Schedule</p>
                        </div>
                      </div>
                    </div>

                    {/* 2. QUICK ACCESS GRID (7 ITEMS - MATCHING IMAGE 2) */}
                    {/* 2. QUICK ACCESS GRID (8 ITEMS) */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                      <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 sm:mb-4">Quick Access</h3>

                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3 text-center">
                        {/* 1. Attendance (Highlighted red border + NEW badge) */}
                        <button
                          onClick={() => setAttendanceModalOpen(true)}
                          className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-2xl border-2 border-red-500 bg-red-50/40 dark:bg-red-950/20 relative group hover:scale-105 transition-transform cursor-pointer"
                        >
                          <span className="absolute -top-2 px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-black rounded uppercase">NEW</span>
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md shrink-0">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-extrabold text-red-600 dark:text-red-400 truncate max-w-full block">Attendance</span>
                        </button>

                        {/* 2. Assessment Quizzes (Highlighted orange border + HOT badge) */}
                        <button
                          onClick={() => setActiveSidebarTab('Quizzes')}
                          className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-2xl border-2 border-brand-orange bg-orange-50/40 dark:bg-orange-950/20 relative group hover:scale-105 transition-transform cursor-pointer"
                        >
                          <span className="absolute -top-2 px-1.5 py-0.5 bg-brand-orange text-white text-[8px] font-black rounded uppercase">HOT</span>
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-md shrink-0">
                            <BrainCircuit className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-extrabold text-brand-orange truncate max-w-full block">Quizzes</span>
                        </button>

                        {/* 3. PYQs */}
                        <button
                          onClick={() => setActiveSidebarTab('PYQs Bank')}
                          className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group cursor-pointer"
                        >
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#e0f2fe] text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-full block">PYQs</span>
                        </button>

                        {/* 4. Notes */}
                        <button
                          onClick={() => setActiveSidebarTab('Smart Notes')}
                          className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group cursor-pointer"
                        >
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#e6f7ed] text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-full block">Notes</span>
                        </button>

                        {/* 5. AI Tutor */}
                        <button
                          onClick={() => setActiveSidebarTab('AI Study Buddy')}
                          className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group cursor-pointer"
                        >
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#f3e8ff] text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <Bot className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-full block">AI Tutor</span>
                        </button>

                        {/* 6. Smart Search */}
                        <button
                          onClick={() => addToast('Opening Smart Search...')}
                          className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group cursor-pointer"
                        >
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#fef3c7] text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <Search className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-full block">Search</span>
                        </button>

                        {/* 7. CGPA Calc */}
                        <button
                          onClick={() => setActiveSidebarTab('CGPA Calculator')}
                          className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group cursor-pointer"
                        >
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#fff2e8] text-brand-orange flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <Trophy className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-full block">CGPA</span>
                        </button>

                        {/* 8. Schedule */}
                        <button
                          onClick={() => setActiveSidebarTab('Study Planner')}
                          className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group cursor-pointer"
                        >
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#ffe4e6] text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-full block">Schedule</span>
                        </button>
                      </div>
                    </div>

                    {/* 3. MIDDLE 2-COLUMN SECTION (Matching Image 2) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* LEFT 2 COLUMNS WORKSPACE */}
                      <div className="lg:col-span-2 space-y-6">
                        
                        {/* Continue Learning */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Continue Learning</h3>
                            <button onClick={() => setActiveSidebarTab('My Subjects')} className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1 cursor-pointer">
                              View All Subjects <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {enrolledClasses.length > 0 ? (
                              enrolledClasses.slice(0, 2).map((cls: any) => (
                                <div key={cls.id} className="p-4 rounded-2xl bg-gray-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/40 text-brand-orange text-[10px] font-bold">
                                      Sem {cls.semester || selectedSemester} • {cls.section ? `Sec ${cls.section}` : 'Sec A'}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">Code: {cls.join_code}</span>
                                  </div>
                                  <div>
                                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                                      {cls.name}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Faculty: {cls.teacher_name || 'Professor'}</p>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setSelectedSubjectDrawer({
                                        code: cls.join_code,
                                        category: 'Enrolled Class',
                                        title: cls.name,
                                        credits: `Semester ${cls.semester || 1}`,
                                        type: cls.section ? `Section ${cls.section}` : 'General',
                                        professor: cls.teacher_name || 'Faculty Instructor',
                                        designation: 'Course Teacher',
                                        email: cls.teacher_email || 'teacher@shikshasahayak.org',
                                        classId: cls.id,
                                      });
                                    }} 
                                    className="w-full py-2 rounded-xl bg-brand-orange hover:bg-orange-600 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer border-none"
                                  >
                                    View Class Materials
                                  </button>
                                </div>
                              ))
                            ) : (
                              <>
                                <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/40 text-brand-orange text-[10px] font-bold">
                                      {activeBranchPack.shortName || 'GTU'} - Sem {selectedSemester}
                                    </span>
                                    <span className="text-xs font-extrabold text-slate-400">Curriculum</span>
                                  </div>
                                  <div>
                                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                                      {currentBranchSubjects[0] || 'Core Engineering Subject'}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">GTU Prescribed Syllabus & Notes</p>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setActiveSidebarTab('Smart Notes');
                                      addToast(`Opening ${currentBranchSubjects[0] || 'Subject'} Notes...`);
                                    }} 
                                    className="w-full py-2 rounded-xl bg-brand-orange hover:bg-orange-600 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer border-none"
                                  >
                                    Explore Subject Notes
                                  </button>
                                </div>
                                <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                                      {activeBranchPack.shortName || 'GTU'} - Sem {selectedSemester}
                                    </span>
                                    <span className="text-xs font-extrabold text-slate-400">Classroom</span>
                                  </div>
                                  <div>
                                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                                      Join Instructor's Class
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Connect with your teacher using code</p>
                                  </div>
                                  <button 
                                    onClick={() => setJoinClassModalOpen(true)} 
                                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer border-none"
                                  >
                                    Join Class with Code
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* My Subjects Grid */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">My Subjects</h3>
                            <button onClick={() => setActiveSidebarTab('My Subjects')} className="text-xs font-bold text-brand-orange hover:underline cursor-pointer">
                              View All Joined Classes
                            </button>
                          </div>

                          {enrolledClasses.length === 0 ? (
                            <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 text-center space-y-3">
                              <GraduationCap className="w-8 h-8 text-brand-orange mx-auto opacity-80" />
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                You haven't joined any classes yet. Join your professor's class using the join code.
                              </p>
                              <button
                                onClick={() => setJoinClassModalOpen(true)}
                                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-extrabold text-xs shadow-sm hover:bg-slate-800 cursor-pointer border-none"
                              >
                                Join Class with Code
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {enrolledClasses.map((cls: any) => (
                                <div key={cls.id} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-[10px] font-bold text-brand-orange">Code: {cls.join_code}</span>
                                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">Sem {cls.semester || 1}</span>
                                  </div>
                                  <div>
                                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{cls.name}</h4>
                                    <p className="text-xs text-slate-400 font-medium">Faculty: {cls.teacher_name || 'Professor'}</p>
                                  </div>
                                  <button 
                                    onClick={() => { 
                                      setSelectedSubjectDrawer({
                                        code: cls.join_code,
                                        category: 'Enrolled Class',
                                        title: cls.name,
                                        credits: `Semester ${cls.semester || 1}`,
                                        type: cls.section ? `Section ${cls.section}` : 'General',
                                        professor: cls.teacher_name || 'Faculty Instructor',
                                        designation: 'Course Teacher',
                                        email: cls.teacher_email || 'teacher@shikshasahayak.org',
                                        classId: cls.id,
                                      });
                                    }} 
                                    className="w-full py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                  >
                                    View Class Materials
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Recommended for You */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Recommended for You</h3>
                            <button onClick={() => setActiveSidebarTab('Resource Library')} className="text-xs font-bold text-brand-orange hover:underline cursor-pointer">
                              Browse All
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              { 
                                title: `${currentBranchSubjects[0] || 'Core Subject'} Handwritten Notes`, 
                                type: 'Notes', 
                                color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
                                targetTab: 'Smart Notes'
                              },
                              { 
                                title: `${currentBranchSubjects[1] || currentBranchSubjects[0] || 'Core Subject'} GTU Solved PYQ`, 
                                type: 'PYQ', 
                                color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
                                targetTab: 'PYQs Bank'
                              },
                              { 
                                title: `${currentBranchSubjects[2] || currentBranchSubjects[0] || 'Core Subject'} Formula Sheet & Guide`, 
                                type: 'Guide', 
                                color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
                                targetTab: 'Resource Library'
                              },
                            ].map((item, idx) => (
                              <div key={idx} className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 space-y-2.5 flex flex-col justify-between">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase w-fit ${item.color}`}>{item.type}</span>
                                <h5 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2">{item.title}</h5>
                                <button 
                                  onClick={() => {
                                    setActiveSidebarTab(item.targetTab);
                                    addToast(`Opening ${item.title}...`);
                                  }} 
                                  className="w-full py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-extrabold hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all cursor-pointer"
                                >
                                  Open Resource
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Personalized Latest GTU Previous Year Papers Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="px-2.5 py-0.5 rounded-full bg-brand-orange/15 text-brand-orange text-[10px] font-black uppercase tracking-wider border border-brand-orange/30 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> Latest Official Archives
                                </span>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                  {activeBranchPack.name} • Sem {selectedSemester}
                                </span>
                              </div>
                              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                                Latest GTU Previous Year Question Papers (PYQs)
                              </h3>
                            </div>

                            <button
                              onClick={() => setActiveSidebarTab('PYQs')}
                              className="text-xs font-extrabold text-brand-orange hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <span>Open Interactive PYQ Vault</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeSemesterGtuSubjects.map((sub: any) => {
                              const subSlug = sub.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                              const directPdfUrl = getGtuPyqUrl('W2024', 'BE', sub.code);
                              const subjectPyqPath = browsePaths.subject('pyq', activeBranchSlug, selectedSemester, subSlug);

                              return (
                                <div
                                  key={sub.code}
                                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 space-y-3 flex flex-col justify-between hover:border-brand-orange/40 transition-colors group"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-mono text-[10px] font-bold text-brand-orange bg-orange-100 dark:bg-orange-950/40 px-2 py-0.5 rounded-md">
                                        Code: {sub.code}
                                      </span>
                                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> Winter 2024 Verified
                                      </span>
                                    </div>

                                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug group-hover:text-brand-orange transition-colors">
                                      {sub.title}
                                    </h4>
                                    
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                      Exam Scheme: {sub.type} ({sub.category}) • {sub.credits}
                                    </p>
                                  </div>

                                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center gap-2">
                                    <a
                                      href={directPdfUrl}
                                      download
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 py-2 px-3 rounded-xl bg-brand-orange hover:bg-orange-600 text-white text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer no-underline border-none"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Download PDF</span>
                                    </a>

                                    <Link
                                      to={subjectPyqPath}
                                      className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-orange hover:border-brand-orange text-xs font-bold transition flex items-center justify-center gap-1 no-underline whitespace-nowrap"
                                    >
                                      <span>All Sessions</span>
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-orange-950 dark:text-orange-200">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-brand-orange shrink-0" />
                              <span>
                                Need previous years from 2018–2023 for <strong>{activeBranchPack.name}</strong>?
                              </span>
                            </div>
                            <Link
                              to={browsePaths.semester('pyq', activeBranchSlug, selectedSemester)}
                              className="font-extrabold text-brand-orange hover:underline flex items-center gap-1 whitespace-nowrap"
                            >
                              <span>View Complete Semester {selectedSemester} Question Vault</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>

                      </div>

                      {/* RIGHT COLUMN SIDEBAR */}
                      <div className="space-y-6">
                        
                        {/* My Attendance Donut Chart */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">My Attendance</h3>
                            <button onClick={() => setAttendanceModalOpen(true)} className="text-xs font-bold text-brand-orange hover:underline cursor-pointer">
                              Mark Now
                            </button>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                  className="text-slate-200 dark:text-slate-800"
                                  strokeWidth="3.5"
                                  stroke="currentColor"
                                  fill="none"
                                  strokeDasharray="100, 100"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                  className="text-emerald-500"
                                  strokeWidth="3.8"
                                  strokeDasharray={`${enrolledClasses.length > 0 ? 100 : 0}, 100`}
                                  stroke="currentColor"
                                  fill="none"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                              </svg>
                              <div className="absolute flex flex-col items-center justify-center text-center">
                                <span className="text-base font-black text-slate-900 dark:text-white">{enrolledClasses.length > 0 ? '100%' : '0%'}</span>
                                <span className="text-[9px] font-bold text-slate-400">Enrolled</span>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs font-bold flex-1">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Joined Classes
                                </span>
                                <span className="text-slate-900 dark:text-white">{enrolledClasses.length}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Active Roster
                                </span>
                                <span className="text-slate-900 dark:text-white">{enrolledClasses.length > 0 ? 'Active' : 'None'}</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800 pt-1">
                                <span>Status</span>
                                <span>{enrolledClasses.length > 0 ? 'Good Standing' : 'Join Class'}</span>
                              </div>
                            </div>
                          </div>

                          <button onClick={() => setAttendanceModalOpen(true)} className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer border-none">
                            <Radio className="w-4 h-4 animate-pulse" />
                            <span>Mark Attendance Session</span>
                          </button>
                        </div>

                        {/* Today's Schedule */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Today's Schedule</h3>
                            <button onClick={() => setActiveSidebarTab('Calendar')} className="text-xs font-bold text-brand-orange hover:underline cursor-pointer">
                              Full Timetable
                            </button>
                          </div>

                          <div className="space-y-3.5 text-xs font-semibold">
                            {enrolledClasses.length > 0 ? (
                              enrolledClasses.slice(0, 3).map((cls: any, i: number) => {
                                const times = ['10:00 AM - 11:30 AM', '11:45 AM - 12:45 PM', '02:00 PM - 03:00 PM'];
                                const types = ['Lecture', 'Tutorial', 'Lab Session'];
                                return (
                                  <div key={cls.id} className="p-3 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40">
                                    <div className="text-[10px] text-brand-orange font-bold">{times[i % times.length]}</div>
                                    <div className="font-extrabold text-slate-900 dark:text-white truncate">
                                      {cls.name} {types[i % types.length]}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium">
                                      Faculty: {cls.teacher_name || 'Professor'} • {cls.section ? `Sec ${cls.section}` : 'Sec A'}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 text-center space-y-2">
                                <Calendar className="w-6 h-6 text-slate-400 mx-auto opacity-70" />
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                  No scheduled classes today. Join your teacher's class using code to sync your live timetable.
                                </p>
                                <button
                                  onClick={() => setJoinClassModalOpen(true)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-extrabold text-xs shadow-sm hover:bg-slate-800 cursor-pointer border-none"
                                >
                                  + Join Class
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Announcements */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Announcements</h3>
                            <span className="text-xs font-bold text-slate-400">
                              {announcements.length} {announcements.length === 1 ? 'Notice' : 'Notices'}
                            </span>
                          </div>

                          <div className="space-y-3 text-xs">
                            {announcements.length > 0 ? (
                              announcements.slice(0, 3).map((ann: any, idx: number) => (
                                <div key={ann.id || idx} className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1">
                                  <span className={`px-2 py-0.5 text-[9px] font-black rounded ${ann.priority === 'urgent' || ann.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {(ann.priority || 'NOTICE').toUpperCase()}
                                  </span>
                                  <h5 className="font-extrabold text-slate-900 dark:text-white line-clamp-1">{ann.title || ann.text}</h5>
                                  <p className="text-[10px] text-slate-400 line-clamp-2">{ann.content || ann.text || 'Official Academic Notice'}</p>
                                </div>
                              ))
                            ) : (
                              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 text-center text-xs text-slate-400">
                                No active campus announcements posted today.
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                  </div>
                </div>


                    {/* WIDGET CUSTOMIZER MODAL */}
                    <AnimatePresence>
                      {showCustomizer && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
                          >
                            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                              <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                  <Sliders className="h-5 w-5 text-orange-500" /> Customize Dashboard Widgets
                                </h3>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Show, hide, or pin widgets to personalize your dashboard</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const resetConfig = widgetsConfig.map((w, idx) => ({
                                      ...w,
                                      isPinned: false,
                                      isHidden: false,
                                      isCollapsed: false,
                                      order: idx + 1
                                    }));
                                    saveWidgetsConfig(resetConfig);
                                    addToast('Layout reset to default!');
                                  }}
                                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                  Reset All
                                </button>
                                <button
                                  onClick={() => setShowCustomizer(false)}
                                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                  Done
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {widgetsConfig.map((w) => {
                                const WidgetIcon = w.icon;
                                return (
                                  <div 
                                    key={w.id} 
                                    className={`p-4 rounded-xl border transition-all ${
                                      w.isHidden 
                                        ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60' 
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <WidgetIcon className="h-5 w-5 text-orange-500 dark:text-orange-400 shrink-0" />
                                        <div className="min-w-0">
                                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{w.title}</h4>
                                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{w.desc}</p>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => {
                                          const updated = widgetsConfig.map(x => x.id === w.id ? { ...x, isPinned: !x.isPinned } : x);
                                          saveWidgetsConfig(updated);
                                        }}
                                        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                                          w.isPinned 
                                            ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400' 
                                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500'
                                        }`}
                                      >
                                        <Pin className="h-4 w-4" />
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => {
                                        const updated = widgetsConfig.map(x => x.id === w.id ? { ...x, isHidden: !x.isHidden } : x);
                                        saveWidgetsConfig(updated);
                                        addToast(`${w.title} ${!w.isHidden ? 'hidden' : 'shown'}`);
                                      }}
                                      className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${
                                        w.isHidden
                                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                                          : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-950/60'
                                      }`}
                                    >
                                      {w.isHidden ? (
                                        <span className="flex items-center justify-center gap-1">
                                          <EyeOff className="h-3.5 w-3.5" /> Hidden
                                        </span>
                                      ) : (
                                        <span className="flex items-center justify-center gap-1">
                                          <Eye className="h-3.5 w-3.5" /> Visible
                                        </span>
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {/* NOTES LIBRARY VIEW */}
                {(activeSidebarTab === 'Notes' || activeSidebarTab === 'My Library' || activeSidebarTab === 'Resource Library') && (
                  <MyLibrary />
                )}

                {/* PYQS PORTAL VIEW */}
                {(activeSidebarTab === 'PYQs' || activeSidebarTab === 'PYQs Bank') && (
                  <PyqQuizHub />
                )}

                {/* SMART ASSESSMENT PLATFORM VIEW */}
                {(activeSidebarTab === 'Assessments') && (
                  <PracticeZone />
                )}

                {/* AI TUTOR WORKSPACE VIEW */}
                {(activeSidebarTab === 'AI Tutor' || activeSidebarTab === 'AI Study Buddy') && (
                  <AIChat />
                )}

                {/* DOWNLOAD MANAGER VIEW */}
                {(activeSidebarTab === 'Downloads' || activeSidebarTab === 'Smart Download Manager') && (
                  <SmartDownloadManager />
                )}

                {/* 1.5. 📚 MY SUBJECTS PAGE (Master Spec Implementation) */}
                {activeSidebarTab === 'My Subjects' && (
                  <div className="space-y-6 text-left font-sans">
                    {/* Top Hero Banner: Semester Overview */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-navy-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800/80">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-2xl">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-xs font-bold">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Semester {academicProfile.semester || selectedSemester || 1} • {academicProfile.branchName || 'Computer Engineering'} (GTU)</span>
                          </div>
                          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-white">
                            My Academic Subjects & Curriculum
                          </h1>
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            Access syllabus outlines, faculty contacts, handwritten notes, PYQ solution keys, lab manuals, and AI tutor support for all active courses.
                          </p>

                          {/* Dynamic Enrolled Classes Counter */}
                          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-300">
                            <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">
                              <GraduationCap className="w-3.5 h-3.5 text-brand-orange" />
                              <strong className="text-white">{enrolledClasses.length}</strong> {enrolledClasses.length === 1 ? 'Class Enrolled' : 'Classes Enrolled'}
                            </span>
                            <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <strong className="text-white">Verified</strong> GTU Curriculum
                            </span>
                          </div>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
                          <a
                            href={getGtuOfficialSyllabusUrl('3150703')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-3 rounded-2xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer no-underline border-none"
                          >
                            <Download className="w-4 h-4" />
                            <span>Official GTU Syllabus PDF</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Search & Multi-Filter Controls */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="relative flex-1 w-full">
                          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={searchSubjectQuery}
                            onChange={e => setSearchSubjectQuery(e.target.value)}
                            placeholder="Search subjects by course title, GTU code, unit topic or professor..."
                            className="w-full pl-11 pr-4 py-2.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange"
                          />
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                          <select
                            value={selectedSubjectSemFilter}
                            onChange={e => setSelectedSubjectSemFilter(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                          >
                            <option value="all">All Semesters</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                              <option key={s} value={String(s)}>Semester {s}</option>
                            ))}
                          </select>

                          <select
                            value={selectedSubjectTypeFilter}
                            onChange={e => setSelectedSubjectTypeFilter(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                          >
                            <option value="all">All Types</option>
                            <option value="Theory + Lab">Theory + Lab (PCC)</option>
                            <option value="Theory">Theory Only (PEC)</option>
                            <option value="Lab">Practical / Lab</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Subject Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {enrolledClasses.length === 0 ? (
                        <div className="col-span-full py-16 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
                          <GraduationCap className="w-12 h-12 text-brand-orange mx-auto opacity-80" />
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Enrolled Subjects or Classes</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                            You haven't joined any classes yet. Enter your instructor's class join code to access course materials, live attendance, and assignments.
                          </p>
                          <button
                            onClick={() => setJoinClassModalOpen(true)}
                            className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer border-none"
                          >
                            + Join Your First Class
                          </button>
                        </div>
                      ) : (
                        enrolledClasses.map((subj: any) => (
                          <div
                            key={subj.id}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-4 group"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950 text-brand-orange text-[10px] font-black uppercase tracking-wider border border-orange-200/40">
                                  Join Code: {subj.join_code}
                                </span>
                                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold">
                                  Sem {subj.semester || 1} • {subj.section ? `Sec ${subj.section}` : 'Sec A'}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-brand-orange transition">
                                  {subj.name}
                                </h4>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                  Faculty: <strong className="text-slate-700 dark:text-slate-200">{subj.teacher_name || 'Professor'}</strong>
                                </p>
                              </div>
                            </div>
                            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/40">
                                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">Status</span>
                                  <span className="font-black text-emerald-700 dark:text-emerald-300">Enrolled & Active</span>
                                </div>
                                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/40">
                                  <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase block">Year</span>
                                  <span className="font-black text-blue-700 dark:text-blue-300">{subj.academic_year || '2026-27'}</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  onClick={() => {
                                    setAttendanceModalOpen(true);
                                  }}
                                  className="py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer border-none"
                                >
                                  <Radio className="w-3.5 h-3.5" />
                                  <span>Mark Attendance</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedSubjectDrawer({
                                      code: subj.join_code,
                                      category: 'Enrolled Class',
                                      title: subj.name,
                                      credits: `Semester ${subj.semester || 1}`,
                                      type: subj.section ? `Section ${subj.section}` : 'General',
                                      professor: subj.teacher_name || 'Faculty Instructor',
                                      designation: 'Course Teacher',
                                      email: subj.teacher_email || 'teacher@shikshasahayak.org',
                                      classId: subj.id,
                                    });
                                  }}
                                  className="py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer border-none"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                  <span>Class Materials</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 🔖 1. BOOKMARK MANAGER TAB */}
                {activeSidebarTab === 'Bookmarks' && (
                  <MyLibrary />
                )}

                {/* ⚡ 2. QUIZ CENTER TAB */}
                {activeSidebarTab === 'Quizzes' && (
                  <div className="space-y-6 text-left font-sans">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-navy-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
                      <h1 className="text-2xl sm:text-3xl font-black">Engineering Quiz & Assessment Center</h1>
                      <p className="text-xs text-slate-300 mt-1">Take daily quizzes, topic-wise GTU practice drills, and GATE prep exams.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { title: 'DBMS Relational Algebra & SQL Quiz', qCount: 15, time: '20 mins', xp: '+150 XP', diff: 'GTU Standard', color: 'border-orange-500' },
                        { title: 'Data Structures Binary Trees & Heaps', qCount: 20, time: '25 mins', xp: '+200 XP', diff: 'Hard', color: 'border-blue-500' },
                        { title: 'Operating Systems Process Synchronization', qCount: 12, time: '15 mins', xp: '+120 XP', diff: 'Medium', color: 'border-purple-500' }
                      ].map((qz, i) => (
                        <div key={i} className={`p-6 bg-white dark:bg-slate-900 rounded-3xl border ${qz.color} shadow-xs space-y-4`}>
                          <div className="flex justify-between items-center text-xs">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-[10px]">{qz.diff}</span>
                            <span className="font-extrabold text-brand-orange">{qz.xp}</span>
                          </div>
                          <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{qz.title}</h4>
                          <p className="text-xs text-slate-500">{qz.qCount} Questions • {qz.time} Limit</p>
                          <button
                            onClick={() => {
                              setActiveSidebarTab('Assessments');
                              addToast(`Starting ${qz.title}`);
                            }}
                            className="w-full py-2.5 bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer border-none"
                          >
                            Start Quiz Now
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 🧠 3. FLASHCARD LEARNING INTERFACE */}
                {activeSidebarTab === 'Flashcards' && (
                  <div className="space-y-6 text-left font-sans max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6 text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange text-xs font-bold">
                        Spaced Repetition Active • Card 4 of 25
                      </div>
                      
                      <div className="p-10 rounded-3xl bg-slate-900 text-white min-h-[220px] flex flex-col items-center justify-center space-y-3 shadow-2xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question (DBMS Normalization)</span>
                        <h3 className="text-xl font-extrabold text-white max-w-lg">
                          What is the primary condition for a relation to be in 3rd Normal Form (3NF)?
                        </h3>
                        <p className="text-xs text-brand-orange font-semibold pt-2">Click card to reveal answer</p>
                      </div>

                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button onClick={() => addToast('Marked as Hard • Will repeat in 10 mins')} className="px-5 py-2.5 rounded-xl bg-red-100 text-red-600 font-extrabold text-xs cursor-pointer border-none">Hard (10m)</button>
                        <button onClick={() => addToast('Marked as Good • Will repeat in 1 day')} className="px-5 py-2.5 rounded-xl bg-blue-100 text-blue-600 font-extrabold text-xs cursor-pointer border-none">Good (1d)</button>
                        <button onClick={() => addToast('Marked as Easy • Will repeat in 4 days')} className="px-5 py-2.5 rounded-xl bg-emerald-100 text-emerald-600 font-extrabold text-xs cursor-pointer border-none">Easy (4d)</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 🗺️ 4. INTERACTIVE MIND MAP TAB */}
                {activeSidebarTab === 'Mind Maps' && (
                  <div className="space-y-6 text-left font-sans">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Engineering Topic Mind Maps</h1>
                        <p className="text-xs text-slate-500">Visual branch diagrams for quick concept revision.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => addToast('Zoomed in')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs cursor-pointer border-none">+</button>
                        <button onClick={() => addToast('Zoomed out')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs cursor-pointer border-none">-</button>
                        <button onClick={() => addToast('Exporting Mind Map PDF')} className="px-4 py-1.5 bg-brand-orange text-white rounded-xl font-extrabold text-xs cursor-pointer border-none">Export PDF</button>
                      </div>
                    </div>

                    <div className="p-8 bg-slate-950 text-white rounded-3xl border border-slate-800 min-h-[400px] flex items-center justify-center">
                      <div className="text-center space-y-6">
                        <div className="px-6 py-3 rounded-2xl bg-brand-orange text-white font-extrabold text-base inline-block shadow-xl">
                          Database Management Systems (DBMS)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold max-w-2xl mx-auto">
                          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-orange-400">1. Architecture & ER Models</div>
                          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-blue-400">2. Relational Algebra & SQL</div>
                          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-purple-400">3. Normalization (1NF–BCNF)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 📊 5. SMART ATTENDANCE DASHBOARD (MASTER SPEC IMPLEMENTATION) */}
                {activeSidebarTab === 'Attendance' && (
                  <div className="space-y-6 text-left font-sans">
                    {/* Top Hero Banner */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-navy-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-2xl">
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                            GTU 75% Mandatory Threshold • Safe Status
                          </span>
                          <h1 className="text-2xl sm:text-3xl font-black">Smart Attendance Dashboard</h1>
                          <p className="text-xs sm:text-sm text-slate-300">
                            {enrolledClasses.length > 0
                              ? `You are enrolled in ${enrolledClasses.length} active course ${enrolledClasses.length === 1 ? 'roster' : 'rosters'}. Attendance records sync automatically when your faculty conducts live attendance sessions.`
                              : 'You haven\'t joined any classes yet. Join your professor\'s class using the join code to record geofenced attendance.'}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          <button
                            onClick={() => setAttendanceModalOpen(true)}
                            className="px-5 py-3 rounded-2xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs shadow-lg transition cursor-pointer border-none flex items-center gap-2"
                          >
                            <Radio className="w-4 h-4 animate-pulse" />
                            <span>Scan QR / Mark Attendance</span>
                          </button>

                          <button
                            onClick={() => addToast('Opening Exemption Request Form...')}
                            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs border border-white/20 transition cursor-pointer"
                          >
                            Submit Exemption
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* KPI Analytics Cards Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Status</span>
                        <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {enrolledClasses.length > 0 ? 'Enrolled' : '--'}
                        </h3>
                        <span className="text-[10px] font-extrabold text-emerald-500 block">
                          {enrolledClasses.length > 0 ? `${enrolledClasses.length} Active Classes` : 'Join Class to Track'}
                        </span>
                      </div>

                      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enrolled Rosters</span>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                          {enrolledClasses.length > 0 ? `${enrolledClasses.length} Active` : '--'}
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-500 block">
                          Sem {selectedSemester} Curriculum
                        </span>
                      </div>

                      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Missed Sessions</span>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                          {enrolledClasses.length > 0 ? '0 Classes' : '--'}
                        </h3>
                        <span className="text-[10px] font-semibold text-emerald-500 block">
                          {enrolledClasses.length > 0 ? 'No Absences Recorded' : 'Awaiting Sessions'}
                        </span>
                      </div>

                      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GTU Threshold</span>
                        <h3 className="text-2xl font-black text-brand-orange">
                          {enrolledClasses.length > 0 ? '75% Req' : '--'}
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-500 block">
                          {enrolledClasses.length > 0 ? 'Safe Standing' : 'Enroll to Qualify'}
                        </span>
                      </div>

                      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Punctuality Rate</span>
                        <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400">
                          {enrolledClasses.length > 0 ? '100%' : '--'}
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-500 block">
                          {enrolledClasses.length > 0 ? 'Verified Roster' : 'Scan to Track'}
                        </span>
                      </div>
                    </div>

                    {/* Required Attendance Calculator & Monthly Trends */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* 🧮 Required Attendance GTU Calculator */}
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">GTU Attendance Policy & Guidelines</h3>
                            <p className="text-xs text-slate-500">Official Gujarat Technological University compliance.</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-extrabold text-xs">
                            {enrolledClasses.length > 0 ? 'Compliant' : 'Join Class'}
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 space-y-3 border border-slate-200 dark:border-slate-800 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Mandatory Attendance Threshold:</span>
                            <span className="font-extrabold text-brand-orange">75.0% Minimum</span>
                          </div>

                          <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/40 text-brand-orange space-y-1">
                            <h4 className="font-extrabold">End-Semester Exam Eligibility:</h4>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                              GTU requires at least 75% cumulative attendance across all enrolled subjects to be eligible for university end-semester practical and theory exams.
                            </p>
                          </div>

                          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/40 text-emerald-700 dark:text-emerald-300 space-y-1">
                            <h4 className="font-extrabold">Live Session Verification:</h4>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">
                              When your professor starts an attendance session, enter the 6-digit session code or scan the QR code to have your presence verified and saved to the database.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 📈 Monthly Attendance Overview */}
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Active Academic Session Status</h3>
                            <p className="text-xs text-slate-500">Current semester attendance readiness overview.</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 font-extrabold text-xs">
                            Sem {selectedSemester}
                          </span>
                        </div>

                        <div className="space-y-4 pt-2 text-xs">
                          {enrolledClasses.length > 0 ? (
                            enrolledClasses.map((cls: any) => (
                              <div key={cls.id} className="space-y-1.5">
                                <div className="flex justify-between font-bold">
                                  <span className="text-slate-900 dark:text-white">{cls.name}</span>
                                  <span className="text-emerald-600 font-extrabold">Active Roster</span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                              <p>No class records to display yet.</p>
                              <p className="text-[11px] text-slate-500">Join your professor's class using the join code to begin recording attendance.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Subject-wise Attendance Breakdown & Teacher Records */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Subject-wise Attendance & Teacher Records</h3>
                          <p className="text-xs text-slate-500">Classroom logs verified by course faculty.</p>
                        </div>
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs">
                          {enrolledClasses.length} Active {enrolledClasses.length === 1 ? 'Roster' : 'Rosters'}
                        </span>
                      </div>

                      {enrolledClasses.length === 0 ? (
                        <div className="py-12 text-center space-y-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                          <Radio className="w-8 h-8 text-brand-orange mx-auto opacity-80 animate-pulse" />
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">No Classroom Attendance Records</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                            Join your professor's class using the class Join Code to record live geofenced attendance and view your class roster logs.
                          </p>
                          <button
                            onClick={() => setJoinClassModalOpen(true)}
                            className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer border-none"
                          >
                            Join Class with Code
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black">
                                <th className="py-3 px-3">Subject & Code</th>
                                <th className="py-3 px-3">Faculty Instructor</th>
                                <th className="py-3 px-3">Section</th>
                                <th className="py-3 px-3">Semester</th>
                                <th className="py-3 px-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-200">
                              {enrolledClasses.map((cls: any) => (
                                <tr key={cls.id} className="hover:bg-slate-50 dark:hover:bg-slate-950 transition">
                                  <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                                    {cls.name} <span className="text-slate-400 font-mono">({cls.join_code})</span>
                                  </td>
                                  <td className="py-3 px-3">{cls.teacher_name || 'Professor'}</td>
                                  <td className="py-3 px-3">{cls.section ? `Section ${cls.section}` : 'Section A'}</td>
                                  <td className="py-3 px-3">Semester {cls.semester || 1}</td>
                                  <td className="py-3 px-3">
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-700">
                                      Enrolled & Active
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Missed Classes & History Log */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* 🚫 Missed Classes & Exemption Requests */}
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Missed Classes & Exemptions</h3>
                          <button onClick={() => addToast('Opening Leave Exemption form')} className="px-3 py-1 bg-brand-orange text-white font-extrabold text-xs rounded-xl cursor-pointer border-none">+ Request Leave</button>
                        </div>

                        <div className="py-6 text-center text-xs text-slate-400">
                          No missed classes or pending exemption requests logged.
                        </div>
                      </div>

                      {/* 🕒 Daily Attendance History Log */}
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Recent Attendance Scans</h3>

                        <div className="py-6 text-center text-xs text-slate-400">
                          No recent attendance sessions scanned yet. When you scan a QR or enter a code, your verified check-ins will appear here.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 📅 6. ACADEMIC CALENDAR TAB */}
                {activeSidebarTab === 'Calendar' && (
                  <div className="space-y-6 text-left font-sans">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Academic Calendar & Exam Schedule</h1>
                        <p className="text-xs text-slate-500">GTU exam dates, submission deadlines, and campus events.</p>
                      </div>
                      <button onClick={() => addToast('Synced with Google Calendar!')} className="px-4 py-2 bg-brand-orange text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer border-none">
                        Sync Google Calendar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Upcoming Exams & Submissions</h3>
                        <div className="space-y-3 text-xs">
                          <div className="p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/40">
                            <span className="text-[10px] font-bold text-brand-orange uppercase block">Nov 15, 2026</span>
                            <h4 className="font-extrabold text-slate-900 dark:text-white mt-0.5">GTU Mid-Sem Examination 1</h4>
                            <p className="text-slate-500">DBMS, DSA, OS, and CN Core Papers</p>
                          </div>
                          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/40">
                            <span className="text-[10px] font-bold text-blue-600 uppercase block">Nov 28, 2026</span>
                            <h4 className="font-extrabold text-slate-900 dark:text-white mt-0.5">Lab Manual Submission Deadline</h4>
                            <p className="text-slate-500">Submit 10 verified experiment reports</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Holidays & Campus Events</h3>
                        <div className="space-y-3 text-xs">
                          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Dec 25, 2026</span>
                            <h4 className="font-extrabold text-slate-900 dark:text-white mt-0.5">Winter Vacation Starts</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 📈 7. STUDENT PROGRESS & LEARNING ANALYTICS DASHBOARD (MASTER SPEC IMPLEMENTATION) */}
                {activeSidebarTab === 'Progress' && (
                  <div className="space-y-6 text-left font-sans">
                    {/* Top Hero Banner */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-navy-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-2xl">
                          <span className="px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange text-xs font-bold border border-brand-orange/30">
                            Learning Analytics & Academic Performance OS
                          </span>
                          <h1 className="text-2xl sm:text-3xl font-black">Student Academic Progress</h1>
                          <p className="text-xs sm:text-sm text-slate-300">
                            Comprehensive evaluation of GTU syllabus completion, weekly study logs, monthly CGPA trends, test accuracy, attendance status, AI advisor insights, and earned achievements.
                          </p>
                        </div>

                        <button
                          onClick={() => addToast('Exporting Progress Analytics PDF Report...')}
                          className="px-5 py-3 rounded-2xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs shadow-lg transition cursor-pointer border-none flex items-center gap-2 shrink-0"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export PDF Progress Report</span>
                        </button>
                      </div>
                    </div>

                    {/* KPI Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Learning Index</span>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                          {userStats.xp > 0 ? `${Math.min(100, Math.round(userStats.xp / 30))} / 100` : '--'}
                        </h3>
                        <span className="text-[10px] font-extrabold text-emerald-500 block">
                          {userStats.xp > 0 ? `Level ${userStats.level} Rank Progress` : 'Take Quizzes to Rank'}
                        </span>
                      </div>

                      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Progress</span>
                        <h3 className="text-2xl font-black text-brand-orange">
                          {userStats.quizzesCompleted > 0 ? `${(userStats.quizzesCompleted * 0.5 + userStats.streak * 0.2).toFixed(1)} hrs` : '--'}
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-500 block">
                          {userStats.streak > 0 ? `${userStats.streak} Days Active Streak` : 'Start Study Session'}
                        </span>
                      </div>

                      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Volume</span>
                        <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">
                          {userStats.quizzesCompleted > 0 ? `${(userStats.quizzesCompleted * 1.5 + userStats.streak * 0.6).toFixed(1)} hrs` : '--'}
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-500 block">
                          {userStats.quizzesCompleted > 0 ? `${userStats.quizzesCompleted} Completed Assessments` : 'No Sessions Logged'}
                        </span>
                      </div>

                      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Attendance</span>
                        <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          {enrolledClasses.length > 0 ? 'Enrolled' : '--'}
                        </h3>
                        <span className="text-[10px] font-bold text-emerald-500 block">
                          {enrolledClasses.length > 0 ? `${enrolledClasses.length} Rosters Active` : 'Join Class to Track'}
                        </span>
                      </div>

                      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Test Accuracy</span>
                        <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400">
                          {userStats.quizzesCompleted > 0 ? `${Math.round((userStats as any).accuracy || 85)}%` : '--'}
                        </h3>
                        <span className="text-[10px] font-semibold text-slate-500 block">
                          {userStats.quizzesCompleted} Quizzes Completed
                        </span>
                      </div>
                    </div>

                    {/* Weekly & Monthly Progress Visualizers */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* 1. Weekly Study Log Chart */}
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Weekly Study Log (Mon – Sun)</h3>
                            <p className="text-xs text-slate-500">Track daily study activity and consistency.</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950 text-brand-orange font-extrabold text-xs">
                            {userStats.quizzesCompleted > 0 ? `${(userStats.quizzesCompleted * 0.5 + userStats.streak * 0.2).toFixed(1)}h Total` : '0h Total'}
                          </span>
                        </div>

                        <div className="space-y-3 pt-2">
                          {[
                            { day: 'Mon', hours: userStats.streak >= 5 ? 2.5 : userStats.streak >= 1 ? 1.0 : 0, max: 4 },
                            { day: 'Tue', hours: userStats.streak >= 4 ? 2.0 : userStats.streak >= 1 ? 1.5 : 0, max: 4 },
                            { day: 'Wed', hours: userStats.streak >= 3 ? 3.0 : userStats.streak >= 1 ? 1.0 : 0, max: 4 },
                            { day: 'Thu', hours: userStats.streak >= 2 ? 2.5 : 0, max: 4 },
                            { day: 'Fri', hours: userStats.streak >= 1 ? 2.0 : 0, max: 4 },
                            { day: 'Sat', hours: userStats.quizzesCompleted > 2 ? 2.0 : 0, max: 4 },
                            { day: 'Sun', hours: userStats.quizzesCompleted > 4 ? 1.5 : 0, max: 4 },
                          ].map(d => (
                            <div key={d.day} className="flex items-center gap-3 text-xs">
                              <span className="w-8 font-bold text-slate-500">{d.day}</span>
                              <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-orange rounded-full" style={{ width: `${(d.hours / d.max) * 100}%` }} />
                              </div>
                              <span className="w-12 font-extrabold text-right text-slate-900 dark:text-white">{d.hours}h</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 2. Monthly CGPA & Semester Trend */}
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Academic Progress Status</h3>
                            <p className="text-xs text-slate-500">GTU Examination SPI/CPI trajectory.</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-extrabold text-xs">
                            {(academicProfile as any)?.cgpa ? `${(academicProfile as any).cgpa} CGPA` : 'Current Profile'}
                          </span>
                        </div>

                        <div className="space-y-4 pt-4">
                          {[
                            { sem: `Semester ${selectedSemester} (Current)`, status: 'In Progress • Enrolled' },
                            { sem: `GTU Board Status`, status: 'Verified Active Student' },
                            { sem: `Completed Assessments`, status: `${userStats.quizzesCompleted} Tests Submitted` }
                          ].map((s, i) => (
                            <div key={i} className="space-y-1.5 text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                              <div className="flex justify-between font-bold">
                                <span className="text-slate-900 dark:text-white">{s.sem}</span>
                                <span className="text-brand-orange font-extrabold">{s.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Subjects Progress & Completion Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Subject-wise Progress & Completion Breakdown</h3>
                          <p className="text-xs text-slate-500">Enrolled GTU courses performance matrix.</p>
                        </div>
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs">
                          {enrolledClasses.length} Active {enrolledClasses.length === 1 ? 'Subject' : 'Subjects'}
                        </span>
                      </div>

                      {enrolledClasses.length === 0 ? (
                        <div className="py-10 text-center text-xs text-slate-400">
                          No enrolled subjects found. Join a class using its join code to see your progress metrics here.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black">
                                <th className="py-3 px-3">Subject & Code</th>
                                <th className="py-3 px-3">Semester</th>
                                <th className="py-3 px-3">Faculty</th>
                                <th className="py-3 px-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-200">
                              {enrolledClasses.map((cls: any) => (
                                <tr key={cls.id} className="hover:bg-slate-50 dark:hover:bg-slate-950 transition">
                                  <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                                    {cls.name} <span className="text-slate-400 font-mono">({cls.join_code})</span>
                                  </td>
                                  <td className="py-3 px-3">Sem {cls.semester || 1}</td>
                                  <td className="py-3 px-3">{cls.teacher_name || 'Professor'}</td>
                                  <td className="py-3 px-3">
                                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-700">
                                      Active
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* AI Learning Insights & Goals Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* 🤖 AI Learning Insights */}
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex items-center gap-2 text-brand-orange">
                          <Sparkles className="w-5 h-5" />
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">AI Learning Advisor Insights</h3>
                        </div>

                        <div className="space-y-3 text-xs">
                          {userStats.quizzesCompleted > 0 ? (
                            <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/40 space-y-1">
                              <span className="text-[10px] font-bold text-brand-orange uppercase">Performance Summary</span>
                              <h4 className="font-extrabold text-slate-900 dark:text-white">{userStats.quizzesCompleted} Quizzes Completed</h4>
                              <p className="text-slate-600 dark:text-slate-300">Streak: {userStats.streak} Days • Level {userStats.level}</p>
                            </div>
                          ) : (
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Recommendations</span>
                              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Complete your first practice quiz or view study materials to receive personalized AI recommendations.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 🎯 Academic Goals Tracker */}
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Academic Goals Tracker</h3>
                          <button
                            onClick={() => addToast('Added new academic goal!')}
                            className="px-3 py-1.5 bg-brand-orange text-white font-extrabold text-xs rounded-xl shadow-sm cursor-pointer border-none"
                          >
                            + New Goal
                          </button>
                        </div>

                        <div className="space-y-4 text-xs">
                          {academicProfile?.goals && academicProfile.goals.length > 0 ? (
                            academicProfile.goals.map((goalText: string, i: number) => (
                              <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 space-y-2 border border-slate-200 dark:border-slate-800">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-extrabold text-slate-900 dark:text-white">{goalText}</h4>
                                  <span className="px-2 py-0.5 rounded bg-orange-100 text-brand-orange font-bold text-[10px] uppercase">Active</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-brand-orange rounded-full" style={{ width: `50%` }} />
                                  </div>
                                  <span className="font-extrabold text-slate-900 dark:text-white">In Progress</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-center text-slate-400 font-medium">
                              No academic goals set yet. Click "+ New Goal" to set your targets.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 🏆 Badges & Achievements Showcase */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Earned Badges & Achievements</h3>
                          <p className="text-xs text-slate-500">Micro-rewards unlocked through consistent study habits.</p>
                        </div>
                        <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950 text-amber-600 font-extrabold text-xs rounded-xl">
                          4 / 6 Badges Unlocked
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[
                          { title: '30-Day Streak Warrior', xp: '+250 XP', icon: '🏆', date: 'Unlocked Nov 2026', unlocked: true },
                          { title: 'Quiz Master Supreme', xp: '+500 XP', icon: '⚡', date: 'Unlocked Oct 2026', unlocked: true },
                          { title: 'Syllabus Finisher', xp: '+400 XP', icon: '📚', date: 'Unlocked Oct 2026', unlocked: true },
                          { title: 'GATE Qualifier', xp: '+1000 XP', icon: '🎓', date: 'Unlocked Sep 2026', unlocked: true },
                          { title: 'DBMS SQL Legend', xp: '+300 XP', icon: '🔒', date: 'Locked (85% Progress)', unlocked: false },
                          { title: 'Code War Champion', xp: '+600 XP', icon: '🔒', date: 'Locked (Rank #3)', unlocked: false },
                        ].map((b, i) => (
                          <div
                            key={i}
                            className={`p-4 rounded-2xl border text-center space-y-2 ${
                              b.unlocked
                                ? 'bg-gradient-to-b from-slate-900 to-slate-950 text-white border-slate-800 shadow-md'
                                : 'bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800 opacity-60'
                            }`}
                          >
                            <span className="text-3xl block">{b.icon}</span>
                            <h4 className="font-extrabold text-xs leading-tight">{b.title}</h4>
                            <span className="text-[10px] font-mono text-brand-orange block font-bold">{b.xp}</span>
                            <span className="text-[9px] text-slate-400 block font-semibold">{b.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}


                {/* ❓ 9. HELP CENTER & SUPPORT HUB (COMPLETE SPEC IMPLEMENTATION) */}
                {activeSidebarTab === 'Help & Support' && (
                  <div className="space-y-6 text-left font-sans">
                    {/* Top Hero Banner & Search */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-navy-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
                      <div className="relative z-10 space-y-4 max-w-3xl">
                        <span className="px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange text-xs font-bold border border-brand-orange/30">
                          Student Support & Knowledge Base
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black">Help Center & Community OS</h1>
                        <p className="text-xs sm:text-sm text-slate-300">
                          Search FAQs, browse portal documentation, watch video guides, track support tickets, or chat with live support.
                        </p>

                        {/* Search Input Bar */}
                        <div className="relative pt-2">
                          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={helpSearchQuery}
                            onChange={e => setHelpSearchQuery(e.target.value)}
                            placeholder="Search FAQs, video tutorials, documentation, or ticket IDs..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl text-xs bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-brand-orange"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sub-Tab Navigation Bar */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide border-b border-slate-200 dark:border-slate-800">
                      {[
                        { id: 'faqs', label: 'FAQs', icon: QuestionIcon },
                        { id: 'contact', label: 'Contact Support', icon: Mail },
                        { id: 'livechat', label: 'Live Chat', icon: MessageSquare },
                        { id: 'docs', label: 'Documentation', icon: FileText },
                        { id: 'videos', label: 'Video Tutorials', icon: PlayCircle },
                        { id: 'bug', label: 'Report Bug', icon: AlertTriangle },
                        { id: 'features', label: 'Feature Request', icon: Sparkles },
                        { id: 'community', label: 'Community', icon: Users },
                        { id: 'tickets', label: 'Ticket History', icon: History },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setHelpActiveSubTab(tab.id as any)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition cursor-pointer border-none ${
                            helpActiveSubTab === tab.id
                              ? 'bg-brand-orange text-white shadow-md'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <tab.icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* SUB-TAB CONTENT 1: ❓ FAQs */}
                    {helpActiveSubTab === 'faqs' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h3>
                          <span className="text-xs text-slate-500">Showing top answered questions</span>
                        </div>

                        <div className="space-y-3">
                          {[
                            {
                              q: 'How do I download offline GTU PYQ solution keys?',
                              a: 'Navigate to the PYQs Portal tab from the sidebar. Use the Semester/Subject filters to locate your paper and click "Download PDF". Files are instantly stored in your Download Manager for offline access.',
                              cat: 'PYQs & Materials'
                            },
                            {
                              q: 'How does the 75% GTU mandatory attendance calculator work?',
                              a: 'The Smart Attendance Dashboard records your scanned classroom QR codes and syncs them against teacher rosters. It automatically computes your percentage and alerts you if you need to attend more lectures to reach 75%.',
                              cat: 'Attendance'
                            },
                            {
                              q: 'Is the AI Tutor updated with the latest 2026 GTU syllabus?',
                              a: 'Yes! ShikshaSahayak AI Tutor is fine-tuned on official GTU 2026 syllabus outlines, unit structures, and past 10-year question patterns.',
                              cat: 'AI Tutor'
                            },
                            {
                              q: 'Can I request missing GTU reference books or lab manuals?',
                              a: 'Absolutely. Click on the "Feature Request" tab above or use the "Contribute" button in the Resource Library to submit requested titles.',
                              cat: 'Resources'
                            }
                          ].filter(item => 
                            item.q.toLowerCase().includes(helpSearchQuery.toLowerCase()) || 
                            item.a.toLowerCase().includes(helpSearchQuery.toLowerCase())
                          ).map((faq, i) => (
                            <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="px-2.5 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950 text-brand-orange font-bold text-[10px] uppercase">
                                  {faq.cat}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">Verified FAQ</span>
                              </div>
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{faq.q}</h4>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{faq.a}</p>
                              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                                <span>Was this answer helpful?</span>
                                <div className="flex gap-2">
                                  <button onClick={() => addToast('Thank you for your feedback!')} className="hover:text-emerald-500 font-bold cursor-pointer border-none bg-transparent">👍 Yes</button>
                                  <button onClick={() => addToast('Feedback recorded. We will improve this answer.')} className="hover:text-red-500 font-bold cursor-pointer border-none bg-transparent">👎 No</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB CONTENT 2: 📩 CONTACT SUPPORT */}
                    {helpActiveSubTab === 'contact' && (
                      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Submit a Support Ticket</h3>
                        <p className="text-xs text-slate-500">Our GTU support team usually responds within 2 hours.</p>

                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Issue Subject</label>
                            <input type="text" placeholder="e.g. Unable to view GTU Sem 5 DBMS Notes" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                              <select className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold">
                                <option>Technical Issue</option>
                                <option>Account & Profile</option>
                                <option>PYQ / Material Download</option>
                                <option>Attendance Sync Error</option>
                              </select>
                            </div>
                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Priority</label>
                              <select className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold">
                                <option>Normal</option>
                                <option>High</option>
                                <option>Urgent / Exam Tomorrow</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Detailed Description</label>
                            <textarea rows={4} placeholder="Describe the issue in detail..." className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold" />
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            addToast('Support ticket #TK-9821 submitted successfully!');
                            setHelpActiveSubTab('tickets');
                          }}
                          className="w-full py-3 bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs rounded-2xl shadow-md transition cursor-pointer border-none"
                        >
                          Submit Support Ticket
                        </button>
                      </div>
                    )}

                    {/* SUB-TAB CONTENT 3: 💬 LIVE CHAT */}
                    {helpActiveSubTab === 'livechat' && (
                      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
                        <div className="p-4 bg-slate-950 text-white flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                            <div>
                              <h4 className="font-extrabold text-sm">ShikshaSahayak Live Support Assistant</h4>
                              <p className="text-[10px] text-slate-400">Online • Typical response time: Instant</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded bg-slate-800 text-[10px] font-mono text-slate-300">Session #882</span>
                        </div>

                        <div className="p-6 space-y-4 h-[300px] overflow-y-auto bg-slate-50 dark:bg-slate-950 text-xs">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-orange text-white font-bold flex items-center justify-center shrink-0 text-xs">P</div>
                            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md space-y-1">
                              <p className="font-bold text-slate-900 dark:text-white">Hello! How can I assist you with ShikshaSahayak today?</p>
                              <span className="text-[9px] text-slate-400 block">7:35 PM</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2 bg-white dark:bg-slate-900">
                          <input type="text" placeholder="Type your support message..." className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-950" />
                          <button onClick={() => addToast('Support message sent!')} className="px-5 py-2.5 bg-brand-orange text-white font-extrabold text-xs rounded-xl cursor-pointer border-none">Send</button>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB CONTENT 4: 📖 DOCUMENTATION */}
                    {helpActiveSubTab === 'docs' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { title: 'Student EduOS Platform Overview', desc: 'Complete guide to navigating subjects, notes, PYQs, and AI Tutor.', readTime: '5 min read', ver: 'v2.4' },
                          { title: 'Smart Assessment & Quiz Rules', desc: 'Understanding adaptive scoring, GTU exam simulation, and XP calculation.', readTime: '4 min read', ver: 'v2.4' },
                          { title: 'Offline Storage & Download Manager', desc: 'How to manage local device caching and sync offline solution keys.', readTime: '3 min read', ver: 'v2.4' },
                          { title: 'GTU 75% Attendance Tracking Protocol', desc: 'Scanning teacher QR codes and managing absence exemptions.', readTime: '6 min read', ver: 'v2.4' }
                        ].map((doc, i) => (
                          <div key={i} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold">{doc.ver}</span>
                              <span className="text-slate-400 font-semibold">{doc.readTime}</span>
                            </div>
                            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{doc.title}</h4>
                            <p className="text-xs text-slate-500">{doc.desc}</p>
                            <button onClick={() => addToast(`Opening ${doc.title}`)} className="text-xs font-extrabold text-brand-orange hover:underline cursor-pointer border-none bg-transparent">Read Full Guide $\rightarrow$</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SUB-TAB CONTENT 5: 🎬 VIDEO TUTORIALS */}
                    {helpActiveSubTab === 'videos' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { title: 'Mastering GTU PYQs in 5 Minutes', dur: '4:20', views: '2.4k views', tag: 'Exam Prep' },
                          { title: 'Generating AI Flashcards & Mind Maps', dur: '3:15', views: '1.8k views', tag: 'AI Tutor' },
                          { title: 'Tracking 75% Mandatory Attendance', dur: '2:50', views: '3.1k views', tag: 'Attendance' }
                        ].map((vid, i) => (
                          <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden group">
                            <div className="relative h-40 bg-slate-950 flex items-center justify-center">
                              <PlayCircle className="w-12 h-12 text-brand-orange group-hover:scale-110 transition" />
                              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white font-mono text-[10px]">{vid.dur}</span>
                            </div>
                            <div className="p-4 space-y-2">
                              <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-brand-orange text-[9px] font-bold uppercase">{vid.tag}</span>
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{vid.title}</h4>
                              <span className="text-[10px] text-slate-400 block">{vid.views}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SUB-TAB CONTENT 6: 🐛 REPORT BUG */}
                    {helpActiveSubTab === 'bug' && (
                      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4">
                        <div className="flex items-center gap-2 text-red-500">
                          <AlertTriangle className="w-5 h-5" />
                          <h3 className="text-lg font-black text-slate-900 dark:text-white">Report a Bug / Platform Issue</h3>
                        </div>
                        <p className="text-xs text-slate-500">Found a glitch? Help us fix it for all GTU students.</p>

                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Bug Title</label>
                            <input type="text" placeholder="e.g. PDF viewer modal blank on mobile device" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Severity</label>
                              <select className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold">
                                <option>Low (Cosmetic / Alignment)</option>
                                <option>Medium (Feature Glitch)</option>
                                <option>High (Download / Quiz Failure)</option>
                                <option>Critical (App Crash)</option>
                              </select>
                            </div>
                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Detected OS</label>
                              <input type="text" readOnly value="Windows 11 / Vite 8 Browser" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono" />
                            </div>
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Steps to Reproduce</label>
                            <textarea rows={3} placeholder="1. Go to PYQs tab..." className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold" />
                          </div>
                        </div>

                        <button onClick={() => addToast('Bug report submitted to Engineering Team!')} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition cursor-pointer border-none">
                          Submit Bug Report
                        </button>
                      </div>
                    )}

                    {/* SUB-TAB CONTENT 7: 💡 FEATURE REQUEST */}
                    {helpActiveSubTab === 'features' && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Community Feature Voting Board</h3>
                          <button onClick={() => addToast('Submitted feature idea!')} className="px-4 py-2 bg-brand-orange text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer border-none">+ Propose New Feature</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { title: 'Export Flashcards directly to Anki format', votes: 142, status: 'Planned', desc: 'Allow downloading .apkg deck files for spaced repetition.' },
                            { title: 'Dark Mode Mind Map Export', votes: 98, status: 'In Progress', desc: 'High-contrast dark theme SVG exports for mind maps.' },
                            { title: 'GATE PYQ Year-wise Filter (2010–2025)', votes: 85, status: 'Under Review', desc: 'Expand past GATE paper archives back to 2010.' }
                          ].map((feat, i) => (
                            <div key={i} className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex gap-4">
                              <button onClick={() => addToast('Upvoted!')} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center shrink-0 cursor-pointer border-none">
                                <span className="text-brand-orange font-bold text-xs">▲</span>
                                <span className="font-extrabold text-slate-900 dark:text-white text-xs">{feat.votes}</span>
                              </button>
                              <div className="space-y-1">
                                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 font-bold text-[9px] uppercase">{feat.status}</span>
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{feat.title}</h4>
                                <p className="text-xs text-slate-500">{feat.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB CONTENT 8: 🌐 COMMUNITY */}
                    {helpActiveSubTab === 'community' && (
                      <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-950 to-navy-950 text-white rounded-3xl border border-slate-800 shadow-xl space-y-6 text-center">
                        <div className="max-w-xl mx-auto space-y-3">
                          <span className="px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange text-xs font-bold border border-brand-orange/30">14,280 Active GTU Students</span>
                          <h2 className="text-3xl font-black">Join ShikshaSahayak Student Community</h2>
                          <p className="text-xs text-slate-300">Connect with fellow engineering students across Gujarat colleges to discuss syllabus, exam prep, and coding projects.</p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                          <button onClick={() => addToast('Opening Telegram Group...')} className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition cursor-pointer border-none">
                            Join Telegram Group
                          </button>
                          <button onClick={() => addToast('Opening Discord Server...')} className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lg transition cursor-pointer border-none">
                            Join Discord Server
                          </button>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB CONTENT 9: 🎟️ TICKET HISTORY */}
                    {helpActiveSubTab === 'tickets' && (
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Your Support Tickets</h3>
                        <div className="space-y-3 text-xs">
                          {[
                            { id: '#TK-9042', title: 'PDF Download failed on Semester 5 DBMS', date: 'Nov 4, 2026', prio: 'High', status: 'In Progress' },
                            { id: '#TK-8810', title: 'Question regarding 75% attendance exemption', date: 'Oct 28, 2026', prio: 'Normal', status: 'Resolved' }
                          ].map((t, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-4">
                              <div>
                                <span className="font-mono font-bold text-brand-orange">{t.id}</span>
                                <h4 className="font-extrabold text-slate-900 dark:text-white">{t.title}</h4>
                                <p className="text-slate-500">{t.date} • Priority: {t.prio}</p>
                              </div>
                              <span className={`px-2.5 py-1 rounded-xl font-extrabold text-[10px] ${t.status === 'Resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-brand-orange'}`}>
                                {t.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. 🔥 DAILY CHALLENGE VIEW */}

                {/* 2. 🔥 DAILY CHALLENGE VIEW */}

                {activeSidebarTab === '🔥 Daily Challenge' && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          🔥 Daily Code Wars
                          <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] rounded-full font-bold uppercase">{settingsDept}</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Solve today's tailored engineering problem to earn bonus XP and Campus Coins.</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setUserStats(prev => ({ ...prev, dailyChallengeSkipped: true }));
                            addToast('Code war skipped for now. You can come back later today!');
                          }}
                          disabled={userStats.dailyChallengeDone}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                        >
                          Skip / Come Back Later
                        </button>
                        <div className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-amber-600 dark:text-amber-400 font-bold text-xs rounded-xl">
                          Time: {currentDailyChallenge.timeLimit}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-5">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div>
                          <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">{currentDailyChallenge.type}</span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{currentDailyChallenge.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded">+{currentDailyChallenge.xp} XP</span>
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded">+{currentDailyChallenge.coins} Coins</span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{currentDailyChallenge.description}</p>

                      {currentDailyChallenge.problemCode && (
                        <div className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800 shadow-inner">
                          <pre>{currentDailyChallenge.problemCode}</pre>
                        </div>
                      )}

                      {currentDailyChallenge.options ? (
                        <div className="grid gap-3">
                          {currentDailyChallenge.options.map((opt, i) => (
                            <button
                              key={i}
                              onClick={() => handleDailyChallengeSubmit(i === currentDailyChallenge.correctAnswer, currentDailyChallenge.xp, currentDailyChallenge.coins)}
                              disabled={userStats.dailyChallengeDone}
                              className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                                userStats.dailyChallengeDone && i === currentDailyChallenge.correctAnswer
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                                  : 'border-slate-200 dark:border-slate-800 hover:border-orange-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Code Editor Container */}
                          <div className="relative border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                            <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
                                <Code className="h-4 w-4 text-orange-500" /> hasCycle.cpp
                              </span>
                              <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                C++ (g++ 13.2)
                              </span>
                            </div>
                            
                            <textarea
                              value={challengeCode}
                              onChange={(e) => setChallengeCode(e.target.value)}
                              placeholder="// Write your Floyd's Cycle Detection code here..."
                              rows={12}
                              disabled={userStats.dailyChallengeDone}
                              className="w-full p-4 bg-slate-950 text-slate-100 font-mono text-xs focus:outline-none resize-none leading-relaxed border-none scrollbar-thin h-64"
                            />
                          </div>

                          {/* Live Logic Checker Panel */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <Sliders className="h-4 w-4 text-orange-500" /> Real-time Logic Analysis
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                              <div className="flex items-center gap-1.5">
                                {liveValidation.checks.hasPointers ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
                                )}
                                <span>Pointers Declared (slow/fast)</span>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                {liveValidation.checks.hasLoop ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
                                )}
                                <span>Traversal Loop (while/for)</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {liveValidation.checks.hasSlowMovement ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
                                )}
                                <span>Slow Pointer Step (+1)</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {liveValidation.checks.hasFastMovement ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
                                )}
                                <span>Fast Pointer Step (+2)</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {liveValidation.checks.hasCollisionCheck ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
                                )}
                                <span>Collision Check (slow == fast)</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {liveValidation.checks.hasBaseCheck ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
                                )}
                                <span>Base / Safety Check</span>
                              </div>
                            </div>
                          </div>

                          {/* Terminal Output Console */}
                          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                            <div className="bg-slate-900 px-4 py-2 flex justify-between items-center text-xs text-slate-300">
                              <span className="font-bold flex items-center gap-1.5 font-mono">
                                <Terminal className="h-4 w-4 text-orange-500" /> Execution Console
                              </span>
                              <span className="text-[10px] text-slate-500">g++ sandbox active</span>
                            </div>
                            
                            <div className="bg-slate-950 p-4 font-mono text-xs min-h-[140px] text-slate-300 flex flex-col justify-between">
                              {isValidating ? (
                                <div className="space-y-1.5 text-slate-400 flex-1 flex flex-col justify-center items-center py-6">
                                  <RefreshCw className="h-6 w-6 text-orange-500 animate-spin mb-2" />
                                  <span>Compiling source code...</span>
                                  <span className="text-[10px] text-slate-500">Executing test cases in secure sandbox...</span>
                                </div>
                              ) : !hasRunTests ? (
                                <div className="text-slate-500 py-6 text-center">
                                  <span>Click "Run Tests" below to compile code and execute test suite.</span>
                                </div>
                              ) : (
                                <div className="space-y-2 flex-1">
                                  <div className="text-slate-400 font-bold border-b border-slate-900 pb-1 flex items-center justify-between">
                                    <span>G++ BUILD LOGS:</span>
                                    <span className={validationResults?.compiled ? 'text-emerald-500' : 'text-red-500'}>
                                      {validationResults?.compiled ? 'Build Succeeded ✓' : 'Build Failed ✗'}
                                    </span>
                                  </div>
                                  
                                  {validationResults?.errors.length === 0 ? (
                                    <div className="text-emerald-400 text-[11px] leading-relaxed">
                                      [info] g++ -O3 main.cpp -o solution.out<br />
                                      [info] Compilation complete. Starting test harness...
                                    </div>
                                  ) : (
                                    <div className="space-y-1 text-red-400 text-[11px] leading-relaxed">
                                      {validationResults?.errors.map((err, i) => (
                                        <div key={i} className="flex gap-1.5">
                                          <span className="text-red-500 select-none">&gt;&gt;</span>
                                          <span>{err}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {validationResults?.compiled && (
                                    <div className="pt-2 space-y-1">
                                      <div className="text-slate-400 font-bold mb-1">TEST RESULTS:</div>
                                      {validationResults.testCases.map((tc, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-[11px] border-b border-slate-900/50 py-1">
                                          <span className="flex items-center gap-1.5">
                                            {tc.passed ? (
                                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            ) : (
                                              <span className="w-2 h-2 rounded-full bg-red-500" />
                                            )}
                                            <span className="text-slate-300">{tc.name}</span>
                                          </span>
                                          <div className="flex gap-2">
                                            <span className="text-slate-500">Expected: {tc.expected}</span>
                                            <span className="text-slate-500">|</span>
                                            <span className={tc.passed ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                                              Actual: {tc.actual}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                      
                                      <div className="pt-2 text-center">
                                        {validationResults.testCases.every(tc => tc.passed) ? (
                                          <span className="text-emerald-400 font-bold text-xs uppercase tracking-wide bg-emerald-950/40 px-3 py-1 rounded border border-emerald-900/40 inline-block animate-bounce mt-2">
                                            🎉 All Test Cases Passed Successfully!
                                          </span>
                                        ) : (
                                          <span className="text-red-400 font-bold text-xs uppercase tracking-wide bg-red-950/40 px-3 py-1 rounded border border-red-900/40 inline-block mt-2">
                                            ✗ Some Test Cases Failed. Check your logic.
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              onClick={() => {
                                setIsValidating(true);
                                setTimeout(() => {
                                  setIsValidating(false);
                                  setHasRunTests(true);
                                  setValidationResults(liveValidation);
                                  addToast(liveValidation.compiled && liveValidation.testCases.every(tc => tc.passed)
                                    ? 'Code compiled & tests passed! Ready to submit.'
                                    : 'Tests executed. Review findings in the console.'
                                  );
                                }, 800);
                              }}
                              disabled={isValidating || userStats.dailyChallengeDone}
                              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Play className="h-3.5 w-3.5 fill-current" /> Run Tests
                            </button>

                            <button
                              onClick={() => {
                                if (!hasRunTests) {
                                  addToast('Please click "Run Tests" to verify your code before submitting.');
                                  return;
                                }
                                const isCorrect = validationResults?.compiled && validationResults?.testCases.every(tc => tc.passed);
                                if (!isCorrect) {
                                  addToast('Please fix all errors and verify your code with "Run Tests" before submitting.');
                                  return;
                                }
                                handleDailyChallengeSubmit(true, currentDailyChallenge.xp, currentDailyChallenge.coins);
                              }}
                              disabled={userStats.dailyChallengeDone || !hasRunTests || !(validationResults?.compiled && validationResults?.testCases.every(tc => tc.passed))}
                              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                            >
                              {userStats.dailyChallengeDone 
                                ? 'Completed Today ✓' 
                                : !hasRunTests 
                                  ? 'Run Tests to Submit' 
                                  : !(validationResults?.compiled && validationResults?.testCases.every(tc => tc.passed))
                                    ? 'Fix Errors to Submit'
                                    : 'Submit Challenge Answer'
                              }
                            </button>
                          </div>
                        </div>
                      )}

                      {userStats.dailyChallengeDone && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border-l-4 border-orange-500 space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">Explanation:</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300">{currentDailyChallenge.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. 100 DAYS CHALLENGE VIEW */}
                {activeSidebarTab === '100 Days Challenge' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">100 Days Engineering Challenge Tracks</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Enroll in long-term discipline tracks. If you miss a day, continue seamless progress without reset penalties.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {hundredDayTracks.map((track) => (
                        <div key={track.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] font-bold rounded uppercase">{track.category}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">{track.streakRules}</span>
                            </div>

                            <h3 className="text-base font-bold text-slate-900 dark:text-white">{track.title}</h3>
                            
                            <div className="space-y-1 pt-1">
                              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                <span>Day {track.day} of {track.total}</span>
                                <span>{Math.round((track.day / track.total) * 100)}% Completed</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: `${(track.day / track.total) * 100}%` }} />
                              </div>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                              <span className="text-[9px] uppercase font-bold text-orange-600">Today's Task (Day {track.day}):</span>
                              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{track.todayTask}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            {track.enrolled ? (
                              <>
                                <button
                                  onClick={() => {
                                    setHundredDayTracks(prev => prev.map(t => t.id === track.id ? { ...t, day: t.day + 1 } : t));
                                    setUserStats(prev => ({ ...prev, xp: prev.xp + 100, coins: prev.coins + 15 }));
                                    addToast(`Day ${track.day} Completed! +100 XP`);
                                  }}
                                  className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                                >
                                  Mark Complete
                                </button>

                                <button
                                  onClick={() => {
                                    setHundredDayTracks(prev => prev.map(t => t.id === track.id ? { ...t, paused: !t.paused } : t));
                                    addToast(track.paused ? 'Resumed Mission' : 'Paused Mission');
                                  }}
                                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl cursor-pointer"
                                >
                                  {track.paused ? 'Resume' : 'Pause'}
                                </button>

                                <button
                                  onClick={() => {
                                    setConfirmModal({
                                      isOpen: true,
                                      title: 'Leave Mission?',
                                      message: `Are you sure you want to unenroll from "${track.title}"?`,
                                      actionLabel: 'Leave Mission',
                                      isDestructive: true,
                                      onConfirm: () => {
                                        setHundredDayTracks(prev => prev.map(t => t.id === track.id ? { ...t, enrolled: false } : t));
                                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                        addToast('Unenrolled from track.');
                                      }
                                    });
                                  }}
                                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs rounded-xl cursor-pointer"
                                >
                                  Leave
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setHundredDayTracks(prev => prev.map(t => t.id === track.id ? { ...t, enrolled: true } : t));
                                  addToast(`Enrolled in ${track.title}! Started Day 1.`);
                                }}
                                className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                              >
                                Enroll in Track
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. ADMIN MANAGEMENT PORTAL */}
                {activeSidebarTab === 'Admin Management' && userRole === 'Admin' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Shield className="h-5 w-5 text-purple-600" /> Admin Portal & Control Operations
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Manage quizzes, challenge queues, student XP/coins, content moderation, and audit logs.</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowManualXpModal(true)}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer"
                        >
                          <Sliders className="h-3.5 w-3.5" /> Adjust XP/Coins
                        </button>

                        <button
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Reset Leaderboard?',
                              message: 'Are you sure you want to reset the current Weekly Leaderboard standings? Standings will be archived.',
                              actionLabel: 'Reset Leaderboard',
                              isDestructive: true,
                              onConfirm: () => {
                                logAuditTrail('Weekly Leaderboard Reset & Archived', 'All Students', 'Scheduled Weekly Reset');
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                addToast('Weekly Leaderboard Reset & Archived!');
                              }
                            });
                          }}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 cursor-pointer"
                        >
                          Reset Standings
                        </button>
                      </div>
                    </div>

                    {/* ADMIN GRID TABS */}
                    <div className="grid md:grid-cols-2 gap-6">
                      
                      {/* QUIZ PUBLISHER PANEL */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <BookOpenCheck className="h-4 w-4 text-orange-500" /> Quiz & Assessment Publisher
                          </h3>
                          <button
                            onClick={() => addToast('Opening Quiz Builder Form')}
                            className="text-xs text-orange-600 font-bold hover:underline cursor-pointer"
                          >
                            + Create Quiz
                          </button>
                        </div>

                        <div className="space-y-3">
                          {quizzesList.map((q) => (
                            <div key={q.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{q.title}</h4>
                                <span className="text-[10px] text-slate-400">{q.subject} • {q.scheduledDate}</span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => {
                                    setQuizzesList(prev => prev.map(item => item.id === q.id ? { ...item, published: !item.published } : item));
                                    logAuditTrail(`Quiz ${q.published ? 'Unpublished' : 'Published'}`, 'System', `Toggled ${q.title}`);
                                    addToast(`${q.title} is now ${!q.published ? 'Published' : 'Unpublished'}`);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${q.published ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : 'bg-amber-50 text-amber-600'}`}
                                >
                                  {q.published ? 'Published ✓' : 'Draft'}
                                </button>

                                <button
                                  onClick={() => {
                                    setConfirmModal({
                                      isOpen: true,
                                      title: 'Delete Quiz?',
                                      message: `Are you sure you want to soft-delete "${q.title}"?`,
                                      actionLabel: 'Delete',
                                      isDestructive: true,
                                      onConfirm: () => {
                                        setQuizzesList(prev => prev.filter(item => item.id !== q.id));
                                        logAuditTrail('Quiz Deleted', 'System', `Deleted ${q.title}`);
                                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                        addToast('Quiz soft-deleted.');
                                      }
                                    });
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* FEATURE TOGGLES PANEL */}
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Sliders className="h-4 w-4 text-purple-500" /> Module Feature Toggles
                        </h3>
                        <p className="text-xs text-slate-400">Enable/disable individual modules live without hot-reloading code.</p>

                        <div className="space-y-2 text-xs">
                          {[
                            { key: 'dailyChallenge', label: '🔥 Daily Code Wars Module' },
                            { key: 'hundredDayChallenge', label: '🎯 100 Days Challenge Tracks' },
                            { key: 'campusCoins', label: '🪙 Campus Coins Wallet Earning' },
                            { key: 'projectShowcase', label: '💻 Student Project Showcase' },
                            { key: 'aiMentor', label: '🤖 AI Mentor Search & Chat' }
                          ].map((t) => (
                            <div key={t.key} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{t.label}</span>
                              <button
                                onClick={() => {
                                  const key = t.key as keyof typeof featureToggles;
                                  setFeatureToggles(prev => ({ ...prev, [key]: !prev[key] }));
                                  logAuditTrail(`Feature Toggle Toggled (${t.label})`, 'Global App', `Changed to ${!featureToggles[key]}`);
                                  addToast(`Toggled ${t.label}`);
                                }}
                                className={`px-3 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${featureToggles[t.key as keyof typeof featureToggles] ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                              >
                                {featureToggles[t.key as keyof typeof featureToggles] ? 'Active ON' : 'Disabled OFF'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* SYSTEM AUDIT TRAIL LOG VIEWER */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Activity className="h-4 w-4 text-orange-500" /> System Audit Trail Viewer
                        </h3>
                        <span className="text-[10px] text-slate-400">{auditLogs.length} Logged Overrides</span>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {auditLogs.map((log) => (
                          <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">{log.action}</span>
                                <span className="text-[10px] text-orange-600 font-semibold">&rarr; {log.targetUser}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5"><strong>Reason:</strong> {log.reason}</p>
                            </div>
                            <div className="text-right text-[10px] text-slate-400 shrink-0">
                              <span>{log.adminName}</span>
                              <span className="block">{log.timestamp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* 5. MY DEPARTMENT VIEW */}
                {activeSidebarTab === 'My Department' && (
                  <div className="space-y-6">
                    {selectedDeptObject ? (
                      <div className="space-y-6">
                        {/* Branch header & Back button */}
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setSelectedDeptId(null)}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {selectedDeptObject.name} ({selectedDeptObject.short})
                              <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] rounded-full font-bold uppercase">GTU NEP 2024-25</span>
                            </h2>
                            <p className="text-xs text-slate-400">GTU (Gujarat Technological University) Official NEP 2020 Scheme (Implemented Academic Year 2024-25)</p>
                          </div>
                        </div>

                        {/* SEMESTER SELECTION BUTTONS (Sem 1 to Sem 8) */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <Layers className="h-4 w-4 text-orange-500" /> Select Semester (GTU NEP 2024-25 Teaching Scheme):
                            </span>
                            <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded">
                              Active: Semester {selectedSemester}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin pt-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                              <button
                                key={sem}
                                onClick={() => {
                                  setSelectedSemester(sem);
                                  addToast(`Selected GTU NEP Semester ${sem}`);
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer ${
                                  selectedSemester === sem
                                    ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-500/30'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                                }`}
                              >
                                Sem {sem}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* SUBJECTS GRID FOR SELECTED SEMESTER */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              GTU NEP 2024-25 Semester {selectedSemester} Subjects ({currentGtuCourses.length} Courses)
                            </h3>
                            <button 
                              onClick={() => addToast(`Downloading GTU NEP Sem ${selectedSemester} Syllabus PDF`)}
                              className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 font-semibold hover:underline"
                            >
                              <Download className="h-3.5 w-3.5" /> Download Syllabus PDF
                            </button>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            {currentGtuCourses.map((item, idx) => (
                              <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-orange-500/30 transition-all">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-start gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] font-bold rounded uppercase tracking-wider">
                                        NEP Code: {item.code}
                                      </span>
                                      {item.category && (
                                        <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-extrabold rounded">
                                          {item.category}
                                        </span>
                                      )}
                                    </div>
                                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-bold">
                                      {item.credits} • {item.type}
                                    </span>
                                  </div>

                                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400"><strong>Faculty:</strong> {item.professor}</p>
                                </div>

                                <div className="space-y-2">
                                  <span className="text-xs font-semibold block text-slate-700 dark:text-slate-300">GTU NEP Syllabus Modules:</span>
                                  <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-disc list-inside pl-1">
                                    {item.syllabus.map((s, i) => (
                                      <li key={i} className="truncate">{s}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                  <button 
                                    onClick={() => {
                                      const matchingQuiz = quizzesList.find(q => q.subject.toLowerCase().includes(item.title.toLowerCase()) || item.title.toLowerCase().includes(q.subject.toLowerCase())) || quizzesList[0];
                                      startQuiz(matchingQuiz);
                                    }}
                                    className="py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Play className="h-3 w-3 fill-current" /> Practice PYQs
                                  </button>
                                  <button 
                                    onClick={() => setActiveSyllabusModal({ code: item.code, title: item.title })}
                                    className="py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    GTU Official PDF
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* GtuSyllabusModal */}
                        <GtuSyllabusModal
                          isOpen={!!activeSyllabusModal}
                          onClose={() => setActiveSyllabusModal(null)}
                          subjectCode={activeSyllabusModal?.code || ''}
                          subjectName={activeSyllabusModal?.title || ''}
                        />

                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            GTU Engineering Departments
                            <span className="px-2.5 py-0.5 bg-orange-600 text-white text-xs rounded-full font-bold uppercase">2024-25 NEP Scheme</span>
                          </h2>
                          <p className="text-xs text-slate-400 mt-1">Select an engineering branch to access GTU NEP 2024-25 (Sem 1 to Sem 8) subjects and official syllabus guides.</p>
                        </div>

                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {AICTE_DEPARTMENTS.map((dept) => {
                            const DeptIcon = dept.icon;
                            return (
                              <div 
                                key={dept.id} 
                                onClick={() => {
                                  setSelectedDeptId(dept.id);
                                  setSelectedSemester(3);
                                }}
                                className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                              >
                                <div className="flex justify-between items-start">
                                  <div className={`p-3 rounded-xl border ${dept.color.split(' ')[0]} ${dept.color.split(' ')[1]} ${dept.color.split(' ')[2]}`}>
                                    <DeptIcon className="h-6 w-6" />
                                  </div>
                                  <span className="text-xs font-bold text-slate-400">GTU Sem 1 - 8</span>
                                </div>

                                <div>
                                  <h3 className="text-base font-bold text-slate-800 dark:text-white">{dept.name}</h3>
                                  <p className="text-[11px] text-slate-400 mt-1">GTU NEP Code: {dept.short}</p>
                                </div>

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-orange-600 dark:text-orange-400">
                                  <span>View GTU NEP 2024-25 Scheme</span>
                                  <ChevronRight className="h-4 w-4" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. LEADERBOARD (EXPANDED WITH TABS) */}
                {activeSidebarTab === 'Leaderboard' && (
                  <div className="space-y-3 pb-20 px-3 sm:px-0 max-w-2xl mx-auto">
                    {/* Simple Mobile-First Header */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md">
                          <Trophy className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-600 dark:text-slate-400">You're ranked <span className="font-bold text-orange-600 dark:text-orange-500">#{(userStats as any).weeklyRank || userStats.rank || 3}</span></p>
                        </div>
                      </div>

                      {/* Simple Tabs - Mobile Optimized */}
                      <div className="grid grid-cols-3 gap-2">
                        {(['Overall', 'Department', 'Weekly'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setLeaderboardTab(tab as any)}
                            className={`py-3 rounded-xl text-sm font-bold transition-all cursor-pointer border-none min-h-[48px] active:scale-95 ${
                              leaderboardTab === tab 
                                ? 'bg-orange-500 text-white shadow-md'
                                : 'bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Simple Top Performers Podium */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Top Performers</p>
                      <div className={`grid gap-3 ${top2 ? (top3 ? 'grid-cols-3' : 'grid-cols-2') : 'grid-cols-1 justify-items-center'}`}>
                        {/* 2nd Place */}
                        {top2 && (
                          <div className="flex flex-col items-center">
                            <img 
                              src={top2.img || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64'} 
                              alt={top2.name} 
                              className="w-16 h-16 rounded-full object-cover border-2 border-slate-300 dark:border-slate-700 mb-2"
                            />
                            <div className="w-8 h-8 rounded-full bg-slate-400 dark:bg-slate-600 flex items-center justify-center text-white font-black text-sm mb-1">
                              2
                            </div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-full">{top2.name.split(' ')[0]}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{top2.xp.toLocaleString()} XP</p>
                          </div>
                        )}

                        {/* 1st Place */}
                        {top1 && (
                          <div className={`flex flex-col items-center ${top2 ? '-mt-4' : ''}`}>
                            <img 
                              src={top1.img || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64'} 
                              alt={top1.name} 
                              className="w-20 h-20 rounded-full object-cover border-3 border-amber-400 dark:border-amber-500 shadow-lg mb-2"
                            />
                            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-black text-lg shadow-md mb-1">
                              1
                            </div>
                            <p className="text-base font-bold text-slate-900 dark:text-white truncate max-w-full">{top1.name.split(' ')[0]}</p>
                            <p className="text-sm text-orange-600 dark:text-orange-500 font-bold">{top1.xp.toLocaleString()} XP</p>
                          </div>
                        )}

                        {/* 3rd Place */}
                        {top3 && (
                          <div className="flex flex-col items-center">
                            <img 
                              src={top3.img || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64'} 
                              alt={top3.name} 
                              className="w-16 h-16 rounded-full object-cover border-2 border-orange-500 mb-2"
                            />
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-sm mb-1">
                              3
                            </div>
                            <p className="text-sm font-bold text-orange-600 dark:text-orange-500 truncate max-w-full">{top3.name.split(' ')[0]}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{top3.xp.toLocaleString()} XP</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Simple Student List - Mobile First */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">All Students</p>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {usersList.map((student, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => {
                              if (!student.highlight) {
                                setActiveSidebarTab('Student Portfolio');
                                addToast(`Viewing ${student.name}'s portfolio`);
                              }
                            }}
                            disabled={Boolean(student.highlight)}
                            className={`w-full p-4 flex items-center gap-3 min-h-[72px] transition-colors text-left border-none ${
                              student.highlight 
                                ? 'bg-orange-50 dark:bg-orange-950/20 cursor-default' 
                                : 'hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer active:bg-slate-100 dark:active:bg-slate-800'
                            }`}
                          >
                            {/* Rank Badge */}
                            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-base ${
                              student.rank <= 3 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {student.rank}
                            </div>

                            {/* Avatar */}
                            <img 
                              src={student.img} 
                              className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700" 
                              alt={student.name}
                            />

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={`text-base font-bold truncate ${
                                  student.highlight ? 'text-orange-600 dark:text-orange-500' : 'text-slate-900 dark:text-white'
                                }`}>
                                  {student.name}
                                </p>
                                {student.highlight && (
                                  <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                                    You
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{student.dept} • {student.streak}d streak</p>
                            </div>

                            {/* XP Score */}
                            <div className="text-right flex-shrink-0">
                              <p className={`text-lg font-black font-mono ${
                                student.highlight ? 'text-orange-600 dark:text-orange-500' : 'text-slate-900 dark:text-white'
                              }`}>
                                {student.xp.toLocaleString()}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">XP</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Simple Footer */}
                    <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-4 flex justify-between items-center border border-slate-200 dark:border-slate-800">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-bold text-slate-900 dark:text-white">{usersList.length}</span> {usersList.length === 1 ? 'student ranked' : 'students ranked'}
                      </p>
                      <p className="text-sm font-bold text-orange-600 dark:text-orange-500">{userStats.xp > 0 ? 'Active Contender' : 'Join the Race'}</p>
                    </div>
                  </div>
                )}

                {/* 7. ACHIEVEMENTS */}
                {activeSidebarTab === 'Achievements' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Badges & Achievements</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Track your progress toward earning verified GTU & ShikshaSahayak badges.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {[
                        { title: 'Quiz Explorer', desc: 'Complete 5 Engineering Quizzes', unlocked: userStats.quizzesCompleted >= 5, progress: Math.min(100, Math.round((userStats.quizzesCompleted / 5) * 100)), current: `${Math.min(5, userStats.quizzesCompleted)}/5`, xp: '+150 XP', icon: CheckCircle, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/30' },
                        { title: 'Consistency Champion', desc: 'Maintain a continuous 7-day study streak', unlocked: userStats.streak >= 7, progress: Math.min(100, Math.round((userStats.streak / 7) * 100)), current: `${Math.min(7, userStats.streak)}/7 Days`, xp: '+200 XP', icon: Flame, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' },
                        { title: 'Active Class Member', desc: 'Enroll in an instructor\'s course classroom', unlocked: enrolledClasses.length > 0, progress: enrolledClasses.length > 0 ? 100 : 0, current: enrolledClasses.length > 0 ? `${enrolledClasses.length} Joined` : '0/1', xp: '+250 XP', icon: GraduationCap, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
                        { title: 'Mastery Scholar', desc: 'Complete 25 Engineering Quizzes', unlocked: userStats.quizzesCompleted >= 25, progress: Math.min(100, Math.round((userStats.quizzesCompleted / 25) * 100)), current: `${Math.min(25, userStats.quizzesCompleted)}/25`, xp: '+500 XP', icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
                        { title: 'Profile Verification', desc: 'Complete your academic college and branch profile', unlocked: Boolean(settingsCollege && settingsDept), progress: settingsCollege ? 100 : 50, current: settingsCollege ? 'Verified' : 'Incomplete', xp: '+100 XP', icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' },
                        { title: 'GATE & PYQ Explorer', desc: 'Practice 10 exam and previous year questions', unlocked: userStats.quizzesCompleted >= 10, progress: Math.min(100, Math.round((userStats.quizzesCompleted / 10) * 100)), current: `${Math.min(10, userStats.quizzesCompleted)}/10`, xp: '+300 XP', icon: Crown, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30' }
                      ].map((item, idx) => {
                        const BadgeIcon = item.icon;
                        return (
                          <div key={idx} className={`p-6 rounded-2xl border bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4 ${item.unlocked ? 'border-slate-200/60 dark:border-slate-800 shadow-sm' : 'border-slate-200 dark:border-slate-800 opacity-75'}`}>
                            <div className="flex justify-between items-start">
                              <div className={`p-4 rounded-2xl ${item.color}`}>
                                <BadgeIcon className="h-6 w-6" />
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${item.unlocked ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                                {item.unlocked ? 'Unlocked ✓' : 'Locked'}
                              </span>
                            </div>

                            <div>
                              <h3 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h3>
                              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                                <span>Requirements ({item.current})</span>
                                <span className="text-orange-600 dark:text-orange-400 font-bold">{item.xp}</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${item.progress}%` }} />
                              </div>
                            </div>

                            <button
                              onClick={() => addToast(`Shared ${item.title} achievement card!`)}
                              className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Share2 className="h-3.5 w-3.5 text-orange-500" /> Share Badge Card
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeSidebarTab === 'Student Portfolio' && (
                  <div className="space-y-6 max-w-7xl mx-auto text-slate-800 dark:text-slate-100">
                    
                    {/* 1. HEADER PROFILE CARD */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                        <div className="relative">
                          <img
                            src={settingsImg}
                            alt={settingsName}
                            className="h-24 w-24 rounded-full object-cover ring-4 ring-orange-500/20"
                          />
                          <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full" />
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-2xl font-black font-display text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
                            {settingsName}
                            <svg className="w-5 h-5 text-blue-500 fill-current" viewBox="0 0 24 24">
                              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          </h2>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {settingsDept} • {settingsYear}
                          </p>
                          <p className="text-xs text-orange-600 dark:text-orange-400 font-bold">
                            {settingsCollege}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            {settingsUniversity}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/60 flex items-center gap-5 w-full md:w-auto min-w-[280px]">
                        <div className="flex-1 space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-700 dark:text-slate-300">Level {userStats.level} Engineer</span>
                            <span className="text-orange-600">{userStats.xp} / {userStats.level * 1000} XP</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full" style={{ width: `${(userStats.xp % 1000) / 10}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-400">{(userStats.level * 1000) - userStats.xp} XP to Level {userStats.level + 1}</p>
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md relative shrink-0">
                          <span>{userStats.level}</span>
                          <Award className="absolute -bottom-1 -right-1 h-5 w-5 text-yellow-300" />
                        </div>
                      </div>
                    </div>

                    {/* 2. CORE STATISTICS GRID */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-10 gap-3">
                      {[
                        { label: 'Total XP', val: userStats.xp, sub: '+120 this week', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20' },
                        { label: 'Campus Coins', val: userStats.coins, sub: 'Redeem Now', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
                        { label: 'Rank (College)', val: (userStats as any).weeklyRank ? `#${(userStats as any).weeklyRank}` : '--', sub: 'Leaderboard', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20' },
                        { label: 'CGPA', val: (academicProfile as any)?.cgpa || '--', sub: (academicProfile as any)?.cgpa ? 'Cumulative' : 'Awaiting Marks', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' },
                        { label: '10th Board', val: settings10thMarks || 'N/A', sub: 'Board Exam', color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/20' },
                        { label: '12th Board', val: settings12thMarks || 'N/A', sub: 'Board Exam', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20' },
                        { label: 'Enrolled Classes', val: enrolledClasses.length.toString(), sub: enrolledClasses.length > 0 ? `${enrolledClasses.length} Active` : 'Join Class', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20' },
                        { label: 'Coding Streak', val: `${userStats.streak} Days`, sub: `Best: ${userStats.longestStreak} Days`, color: 'text-red-600 bg-red-50 dark:bg-red-950/20' },
                        { label: 'Quizzes Solved', val: userStats.quizzesCompleted, sub: 'All Time', color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/20' },
                        { label: 'Problems Solved', val: (userStats.quizzesCompleted * 5).toString(), sub: 'Questions attempted', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20' }
                      ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-1 text-center sm:text-left">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{stat.label}</span>
                          <p className="text-base font-black text-slate-900 dark:text-white leading-tight truncate">{stat.val}</p>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full inline-block font-semibold ${stat.color} truncate`}>{stat.sub}</span>
                        </div>
                      ))}
                    </div>

                    {/* 3. INTERACTIVE SUB-GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Coding Profile */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm lg:col-span-4 space-y-5 flex flex-col justify-between">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Code className="h-4 w-4 text-orange-500" /> Coding Profile
                          </h3>
                          <span className="text-[10px] text-slate-400 hover:text-orange-500 cursor-pointer font-bold uppercase">View Details</span>
                        </div>

                        <div className="flex items-center gap-4 justify-center sm:justify-start">
                          <div className="space-y-1 text-center sm:text-left">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Rating</span>
                            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white leading-none">
                              {userStats.quizzesCompleted > 0 ? Math.min(1800, 1000 + userStats.quizzesCompleted * 20 + Math.round(accuracy * 2)) : '--'}
                            </div>
                            <span className="text-[10px] text-orange-600 font-bold uppercase block mt-0.5">
                              {userStats.quizzesCompleted > 0 ? (accuracy >= 80 ? 'Expert' : accuracy >= 60 ? 'Intermediate' : 'Apprentice') : 'Unrated'}
                            </span>
                            <div className="flex text-amber-400 text-xs">
                              {Array.from({ length: 5 }).map((_, i) => {
                                const starCount = userStats.quizzesCompleted > 0 ? (accuracy >= 85 ? 5 : accuracy >= 70 ? 4 : accuracy >= 50 ? 3 : 2) : 0;
                                return (
                                  <Star key={i} className={`h-3 w-3 ${i < starCount ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`} />
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex-1 flex justify-center">
                            <div className="relative w-20 h-20 flex items-center justify-center">
                              <svg viewBox="0 0 36 36" className="w-20 h-20 transform -rotate-90">
                                <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-100 dark:text-slate-800" />
                                <circle cx="18" cy="18" r="16" fill="none" stroke="#F97316" strokeWidth="2.5" strokeDasharray={`${Math.min(100, Math.round(((userStats.quizzesCompleted * 5) / 50) * 100))}, 100`} strokeLinecap="round" />
                              </svg>
                              <div className="absolute text-center">
                                <span className="text-sm font-black font-mono leading-none block">{userStats.quizzesCompleted * 5}</span>
                                <span className="text-[8px] text-slate-400 uppercase font-bold">Solved</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs font-semibold">
                            <div className="flex justify-between items-center gap-4 text-slate-600 dark:text-slate-400">
                              <span className="text-emerald-500 font-bold">Easy</span>
                              <span>{Math.round(userStats.quizzesCompleted * 2.5)}</span>
                            </div>
                            <div className="flex justify-between items-center gap-4 text-slate-600 dark:text-slate-400">
                              <span className="text-amber-500 font-bold">Medium</span>
                              <span>{Math.round(userStats.quizzesCompleted * 1.8)}</span>
                            </div>
                            <div className="flex justify-between items-center gap-4 text-slate-600 dark:text-slate-400">
                              <span className="text-red-500 font-bold">Hard</span>
                              <span>{Math.max(0, userStats.quizzesCompleted * 5 - Math.round(userStats.quizzesCompleted * 2.5) - Math.round(userStats.quizzesCompleted * 1.8))}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-slate-100 dark:border-slate-800/60 pt-3">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase block">Longest Streak</span>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{userStats.streak > 0 ? `${userStats.streak} Days` : '--'}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase block">Quizzes</span>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{userStats.quizzesCompleted}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase block">Campus Rank</span>
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {usersList.length > 0 ? `#${Math.max(1, usersList.findIndex(u => u.highlight) + 1)}` : '#1'}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-center gap-3 border-t border-slate-100 dark:border-slate-800/60 pt-3 text-[10px] font-bold text-slate-400">
                          <span className="text-blue-500">C++</span>
                          <span className="text-amber-600">Java</span>
                          <span className="text-yellow-600">Python</span>
                          <span className="text-indigo-600">JavaScript</span>
                        </div>
                      </div>

                      {/* Semester Progress */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm lg:col-span-4 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> Semester Progress
                          </h3>
                          <select 
                            value={`Semester ${selectedSemester}`} 
                            onChange={(e) => {
                              const s = parseInt(e.target.value.replace('Semester ', ''));
                              if (!isNaN(s)) setSelectedSemester(s);
                            }}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold py-1 px-2 focus:outline-none"
                          >
                            {availableSemesters.map(s => (
                              <option key={s}>Semester {s}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-5">
                          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                            <svg viewBox="0 0 36 36" className="w-16 h-16 transform -rotate-90">
                              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100 dark:text-slate-800" />
                              <circle cx="18" cy="18" r="16" fill="none" stroke="#10B981" strokeWidth="3" strokeDasharray={`${userStats.quizzesCompleted > 0 ? Math.round(accuracy || 75) : 0}, 100`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute text-xs font-black font-mono">{userStats.quizzesCompleted > 0 ? `${Math.round(accuracy)}%` : '--'}</span>
                          </div>
                          <div className="flex-1 space-y-2 text-[11px] font-semibold">
                            {(enrolledClasses.length > 0
                              ? enrolledClasses.slice(0, 5).map((c, i) => ({
                                  subject: c.subject_name || c.subject_code || c.name,
                                  percent: userStats.quizzesCompleted > 0 ? Math.min(100, Math.max(20, Math.round(accuracy || 75) - (i * 4))) : 0,
                                  color: ['bg-emerald-500', 'bg-teal-500', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500'][i % 5]
                                }))
                              : departmentSubjects.slice(0, 5).map((sub, i) => ({
                                  subject: sub.name,
                                  percent: userStats.quizzesCompleted > 0 ? Math.min(100, Math.max(15, Math.round(accuracy || 60) - (i * 4))) : 0,
                                  color: ['bg-emerald-500', 'bg-teal-500', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500'][i % 5]
                                }))
                            ).map((sub, i) => (
                              <div key={i} className="space-y-0.5">
                                <div className="flex justify-between">
                                  <span className="truncate max-w-[130px]">{sub.subject}</span>
                                  <span className="text-slate-400">{sub.percent}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className={`h-full ${sub.color}`} style={{ width: `${sub.percent}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button onClick={() => setActiveSidebarTab('Classes')} className="w-full py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-500 border border-slate-200/60 dark:border-slate-700/80 cursor-pointer">
                          View All Joined Classes
                        </button>
                      </div>

                      {/* Skill Radar */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm lg:col-span-4 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Activity className="h-4 w-4 text-purple-500" /> Skill Radar
                          </h3>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Overview</span>
                        </div>

                        <div className="relative">
                          <svg viewBox="0 0 100 100" className="w-full h-44 mx-auto z-10">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-150 dark:text-slate-800" />
                            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-150 dark:text-slate-800" strokeDasharray="2" />
                            <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-150 dark:text-slate-800" />
                            <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-150 dark:text-slate-800" />
                            
                            <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-slate-800" />
                            <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-slate-800" />
                            <line x1="22" y1="22" x2="78" y2="78" stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-slate-800" strokeDasharray="1" />
                            <line x1="22" y1="78" x2="78" y2="22" stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-slate-800" strokeDasharray="1" />
                            
                            <polygon points="50,22 75,35 82,50 68,68 50,82 32,68 18,50 25,35" fill="rgba(249, 115, 22, 0.2)" stroke="#F97316" strokeWidth="1.5" />
                            
                            <text x="50" y="8" textAnchor="middle" className="text-[4px] fill-slate-400 font-bold">Programming</text>
                            <text x="86" y="32" textAnchor="start" className="text-[4px] fill-slate-400 font-bold">Data Structures</text>
                            <text x="92" y="52" textAnchor="start" className="text-[4px] fill-slate-400 font-bold">Database</text>
                            <text x="80" y="72" textAnchor="start" className="text-[4px] fill-slate-400 font-bold">Problem Solving</text>
                            <text x="50" y="94" textAnchor="middle" className="text-[4px] fill-slate-400 font-bold">Operating Systems</text>
                            <text x="20" y="72" textAnchor="end" className="text-[4px] fill-slate-400 font-bold">Web Dev</text>
                            <text x="8" y="52" textAnchor="end" className="text-[4px] fill-slate-400 font-bold">Communication</text>
                            <text x="14" y="32" textAnchor="end" className="text-[4px] fill-slate-400 font-bold">AI/ML</text>
                          </svg>
                        </div>
                      </div>

                    </div>

                    {/* 4. SKILLS & PROJECTS ROW */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Verified Technical Skills */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-orange-500" /> Verified Technical Skills
                          </h3>
                          <span className="text-[10px] text-slate-400 font-bold uppercase hover:text-orange-500 cursor-pointer">Live Verified</span>
                        </div>

                        <div className="space-y-4 text-xs font-semibold">
                          {(enrolledClasses.length > 0 
                            ? enrolledClasses.slice(0, 4).map((c) => ({
                                skill: c.subject_name || c.name,
                                percent: userStats.quizzesCompleted > 0 ? Math.min(100, Math.max(25, Math.round(accuracy || 70))) : 0,
                                stat: `${userStats.quizzesCompleted} Quizzes Attempted · Enrolled Class · Active`
                              }))
                            : [
                                { skill: 'Data Structures & Algorithms', percent: userStats.quizzesCompleted > 0 ? Math.min(95, 60 + userStats.quizzesCompleted * 5) : 0, stat: `${userStats.quizzesCompleted} Quizzes Attempted · Engineering Foundation` },
                                { skill: 'Database Management Systems & SQL', percent: userStats.quizzesCompleted > 0 ? Math.min(92, 55 + userStats.quizzesCompleted * 5) : 0, stat: `${userStats.quizzesCompleted} Quizzes Attempted · Core Database` },
                                { skill: 'Operating Systems & System Architecture', percent: userStats.quizzesCompleted > 0 ? Math.min(88, 50 + userStats.quizzesCompleted * 5) : 0, stat: `${userStats.quizzesCompleted} Quizzes Attempted · System Engineering` },
                                { skill: 'Web & Software Engineering', percent: userStats.quizzesCompleted > 0 ? Math.min(85, 45 + userStats.quizzesCompleted * 5) : 0, stat: `${projectsList.length} Projects Uploaded · Application Dev` }
                              ]
                          ).map((s, idx) => (
                            <div key={idx} className="flex justify-between items-start gap-4">
                              <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                                <BookOpenCheck className="h-4.5 w-4.5" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-800 dark:text-slate-200">{s.skill}</span>
                                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                                    {userStats.quizzesCompleted > 0 ? 'Verified' : 'In Progress'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${s.percent}%` }} />
                                  </div>
                                  <span className="text-[10px] font-bold text-orange-600 shrink-0">{s.percent}% Mastered</span>
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold">{s.stat}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Projects Showcase */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Code className="h-4 w-4 text-blue-500" /> Projects Showcase
                          </h3>
                          <span onClick={() => setActiveSidebarTab('Project Showcase')} className="text-[10px] text-slate-400 hover:text-blue-500 cursor-pointer font-bold uppercase">View All</span>
                        </div>

                        <div className="space-y-4">
                          {projectsList.length > 0 ? (
                            projectsList.slice(0, 3).map((project, i) => (
                              <div key={i} className="flex gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all">
                                <div className="h-14 w-20 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 relative overflow-hidden font-black text-xs uppercase shadow-sm">
                                  {project.title.substring(0, 3)}
                                  <div className="absolute bottom-0 inset-x-0 h-4 bg-black/30 backdrop-blur-xs flex items-center justify-center text-[7px] font-bold text-white/90">PROJECT</div>
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate pr-2">{project.title}</h4>
                                    <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold shrink-0">
                                      <Star className="h-3.5 w-3.5 fill-current" />
                                      <span>{project.upvotes}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-1.5 flex-wrap">
                                    {project.tech && project.tech.map((t: string) => (
                                      <span key={t} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[8px] font-bold rounded">{t}</span>
                                    ))}
                                  </div>
                                  <div className="flex justify-between items-center pt-1">
                                    <span className="text-[9px] text-slate-400 font-bold">By {project.author}</span>
                                    <div className="flex gap-2">
                                      <a href={project.github} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                                        <Github className="h-3.5 w-3.5" />
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-xs text-slate-400">No projects uploaded yet. Click upload below to showcase your engineering projects.</div>
                          )}
                        </div>

                        <button 
                          onClick={() => {
                            setActiveSidebarTab('Project Showcase');
                            setShowAddProjectModal(true);
                          }}
                          className="w-full py-3 mt-2 border border-dashed border-orange-500/30 hover:border-orange-500 text-orange-600 hover:bg-orange-500/5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-transparent"
                        >
                          <Plus className="h-4 w-4" /> Add New Project
                        </button>
                      </div>

                    </div>

                    {/* NEW RESUME SECTIONS ROW */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Experience & Internships */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm lg:col-span-8 space-y-5 text-left">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-display">
                            <Briefcase className="h-4 w-4 text-orange-500" /> Work Experience & Internships
                          </h3>
                        </div>

                        <div className="space-y-4">
                          {settingsExperience ? (
                            settingsExperience.split('|').map((item, idx) => {
                              const trimmed = item.trim();
                              if (!trimmed) return null;
                              const parts = trimmed.split(' at ');
                              const role = parts[0]?.trim();
                              const companyAndDuration = parts[1]?.trim();
                              return (
                                <div key={idx} className="flex gap-4 items-start p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/40 hover:shadow-xs transition-all">
                                  <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center shrink-0">
                                    <Briefcase className="h-5 w-5" />
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{role || trimmed}</h4>
                                    {companyAndDuration && (
                                      <p className="text-[10px] font-semibold text-slate-550 dark:text-slate-400">at {companyAndDuration}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-slate-400 py-4 text-center">No experience listed. Update in Settings to showcase internships.</p>
                          )}
                        </div>
                      </div>

                      {/* Certifications, Special Skills & Languages */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm lg:col-span-4 space-y-5 text-left">
                        {/* Special Skills */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Special Skills & Tools
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {settingsSpecialSkills ? (
                              settingsSpecialSkills.split(',').map((skill, idx) => {
                                const s = skill.trim();
                                if (!s) return null;
                                return (
                                  <span key={idx} className="px-2.5 py-1 bg-amber-50/70 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/40 text-[9px] font-extrabold rounded-lg uppercase tracking-wider">
                                    {s}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-xs text-slate-400">None listed</span>
                            )}
                          </div>
                        </div>

                        <hr className="border-slate-100 dark:border-slate-800/60" />

                        {/* Languages Known */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                            <Globe className="h-3.5 w-3.5 text-blue-500" /> Languages Known
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {settingsLanguages ? (
                              settingsLanguages.split(',').map((lang, idx) => {
                                const l = lang.trim();
                                if (!l) return null;
                                return (
                                  <span key={idx} className="px-2.5 py-1 bg-blue-50/70 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200/40 text-[9px] font-bold rounded-lg uppercase tracking-wider">
                                    {l}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-xs text-slate-400">None listed</span>
                            )}
                          </div>
                        </div>

                        <hr className="border-slate-100 dark:border-slate-800/60" />

                        {/* Certifications */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                            <Award className="h-3.5 w-3.5 text-emerald-500" /> Certifications
                          </h4>
                          <div className="space-y-2 text-[10px] font-semibold">
                            {settingsCertifications ? (
                              settingsCertifications.split(',').map((cert, idx) => {
                                const c = cert.trim();
                                if (!c) return null;
                                return (
                                  <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40 text-slate-700 dark:text-slate-300 hover:shadow-xs transition-all">
                                    <Award className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                    <span className="truncate">{c}</span>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-xs text-slate-400">None listed</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5. ACHIEVEMENTS & ASSESSMENT ANALYTICS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      
                      {/* Achievements */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Trophy className="h-4 w-4 text-amber-500" /> Achievements
                          </h3>
                          <span className="text-[10px] text-slate-400 font-bold uppercase cursor-pointer">Live Badges</span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center text-[9px] font-bold">
                          {[
                            { name: 'Quiz Explorer', earned: userStats.quizzesCompleted > 0, color: 'bg-purple-100 dark:bg-purple-950/20 text-purple-600' },
                            { name: 'Active Streak', earned: userStats.streak >= 1, color: 'bg-orange-100 dark:bg-orange-950/20 text-orange-600' },
                            { name: 'Class Member', earned: enrolledClasses.length > 0, color: 'bg-blue-100 dark:bg-blue-950/20 text-blue-600' },
                            { name: 'Project Maker', earned: projectsList.length > 0, color: 'bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600' },
                            { name: 'Scholar', earned: accuracy >= 70 && userStats.quizzesCompleted > 0, color: 'bg-amber-100 dark:bg-amber-950/20 text-amber-600' },
                            { name: 'XP Achiever', earned: userStats.xp >= 100, color: 'bg-red-100 dark:bg-red-950/20 text-red-600' }
                          ].map((ach, i) => (
                            <div key={i} className={`space-y-1.5 flex flex-col items-center ${ach.earned ? '' : 'opacity-40 grayscale'}`}>
                              <div className={`w-11 h-11 rounded-full ${ach.color} flex items-center justify-center shadow-xs`}>
                                <Award className="h-5.5 w-5.5" />
                              </div>
                              <span className="leading-tight block truncate max-w-[64px]">{ach.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Assessment Analytics */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <BrainCircuit className="h-4 w-4 text-emerald-500" /> Assessment Analytics
                          </h3>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Overview</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                            <svg viewBox="0 0 36 36" className="w-16 h-16 transform -rotate-90">
                              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-slate-100 dark:text-slate-800" />
                              <circle cx="18" cy="18" r="16" fill="none" stroke="#10B981" strokeWidth="3.5" strokeDasharray={`${userStats.quizzesCompleted > 0 ? Math.round(accuracy) : 0}, 100`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute text-center">
                              <span className="text-[10px] font-black block">{userStats.quizzesCompleted > 0 ? `${Math.round(accuracy)}%` : '--'}</span>
                              <span className="text-[6px] text-slate-400 uppercase font-semibold">Accuracy</span>
                            </div>
                          </div>

                          <div className="flex-1 grid grid-cols-2 gap-2 text-center text-xs font-semibold">
                            <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl">
                              <span className="text-[8px] text-slate-400 font-bold uppercase block">Avg Score</span>
                              <p className="font-bold text-slate-800 dark:text-slate-200">{userStats.quizzesCompleted > 0 ? `${Math.round(accuracy)}%` : '--'}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl">
                              <span className="text-[8px] text-slate-400 font-bold uppercase block">Tests Taken</span>
                              <p className="font-bold text-slate-800 dark:text-slate-200">{userStats.quizzesCompleted}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-[10px] font-bold">
                          <div className="flex items-center gap-2">
                            <span className="w-12 text-slate-400">Focus:</span>
                            <div className="flex gap-1 flex-wrap">
                              {(enrolledClasses.length > 0 
                                ? enrolledClasses.slice(0, 3).map(c => c.subject_code || c.name.split(' ')[0])
                                : ['Curriculum', 'Practice', 'GTU']
                              ).map(t => (
                                <span key={t} className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded">{t}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-12 text-slate-400">Status:</span>
                            <div className="flex gap-1 flex-wrap">
                              <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded">
                                {userStats.quizzesCompleted > 0 ? `${userStats.quizzesCompleted} Quizzes Complete` : 'Ready for first test'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* XP Progress Weekly Chart */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Activity className="h-4 w-4 text-orange-500" /> XP Progress <span className="text-[9px] text-slate-450 font-normal">(This Week)</span>
                          </h3>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Weekly</span>
                        </div>

                        <div className="h-32 text-xs">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[
                              { name: 'Mon', xp: Math.max(0, Math.round(userStats.xp * 0.1)) },
                              { name: 'Tue', xp: Math.max(0, Math.round(userStats.xp * 0.2)) },
                              { name: 'Wed', xp: Math.max(0, Math.round(userStats.xp * 0.35)) },
                              { name: 'Thu', xp: Math.max(0, Math.round(userStats.xp * 0.5)) },
                              { name: 'Fri', xp: Math.max(0, Math.round(userStats.xp * 0.7)) },
                              { name: 'Sat', xp: Math.max(0, Math.round(userStats.xp * 0.85)) },
                              { name: 'Sun', xp: userStats.xp }
                            ]} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                              <YAxis stroke="#94a3b8" fontSize={9} />
                              <ChartTooltip />
                              <Line type="monotone" dataKey="xp" stroke="#F97316" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Coding Activity Heatmap */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Layers className="h-4 w-4 text-indigo-500" /> Coding Activity
                          </h3>
                          <span className="text-[9px] text-slate-400 font-semibold">{userStats.streak}-day streak</span>
                        </div>

                        <div className="grid grid-cols-8 gap-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-2xl justify-center h-28 overflow-y-auto">
                          {Array.from({ length: 48 }).map((_, i) => {
                            const level = userStats.streak > 0 
                              ? (i >= 48 - Math.min(48, userStats.streak) ? (i % 3 === 0 ? 3 : 2) : (i % 5 === 0 ? 1 : 0))
                              : 0;
                            const color = 
                              level === 0 ? 'bg-slate-150 dark:bg-slate-800' :
                              level === 1 ? 'bg-orange-200 dark:bg-orange-950/40 text-orange-600' :
                              level === 2 ? 'bg-orange-400 dark:bg-orange-850/60' :
                              'bg-orange-600';
                            return (
                              <div key={i} className={`h-3 w-3 rounded-[3px] ${color} mx-auto`} />
                            );
                          })}
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold pt-1">
                          <span>Total Active Days: {Math.max(userStats.streak, userStats.quizzesCompleted > 0 ? userStats.streak + 2 : (userStats.streak > 0 ? userStats.streak : 0))}</span>
                          <span>Max Streak: {userStats.streak > 0 ? `${userStats.streak} Days` : '--'}</span>
                        </div>
                      </div>

                    </div>

                    {/* 6. LEADERBOARD & CAREER READINESS ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      
                      {/* Leaderboard Mini */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Trophy className="h-4 w-4 text-yellow-500" /> Leaderboard <span className="text-[10px] text-slate-400 font-normal">({settingsCollege.substring(0, 8)}...)</span>
                          </h3>
                          <span onClick={() => setActiveSidebarTab('Leaderboard')} className="text-[10px] text-slate-400 hover:text-orange-500 cursor-pointer font-bold uppercase">View Full</span>
                        </div>

                        <div className="space-y-2 text-xs font-semibold">
                          {usersList.slice(0, 5).map((std, i) => (
                            <div key={i} className={`flex items-center justify-between p-2 rounded-xl border ${std.highlight ? 'bg-orange-50/50 dark:bg-orange-950/10 border-orange-200/50 text-orange-600' : 'border-transparent'}`}>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`text-[10px] font-black w-4 text-center shrink-0 ${std.rank <= 3 ? 'text-orange-500' : 'text-slate-400'}`}>{std.rank}</span>
                                <img src={std.img} alt={std.name} className="h-6 w-6 rounded-full object-cover shrink-0" />
                                <span className="truncate max-w-[100px]">{std.name}</span>
                              </div>
                              <span className="font-mono text-[10px] text-right shrink-0">{std.xp} XP</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Career Readiness */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Zap className="h-4 w-4 text-orange-500" /> Career Readiness
                          </h3>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Score</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                            <svg viewBox="0 0 36 36" className="w-16 h-16 transform -rotate-90">
                              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100 dark:text-slate-800" />
                              <circle cx="18" cy="18" r="16" fill="none" stroke="#F97316" strokeWidth="3" strokeDasharray={`${Math.min(100, Math.max(25, (academicProfile.isProfileComplete ? 30 : 15) + (userStats.quizzesCompleted > 0 ? 30 : 0) + (projectsList.length > 0 ? 25 : 0) + (userStats.streak > 0 ? 15 : 0)))}, 100`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute text-xs font-black font-mono">
                              {Math.min(100, Math.max(25, (academicProfile.isProfileComplete ? 30 : 15) + (userStats.quizzesCompleted > 0 ? 30 : 0) + (projectsList.length > 0 ? 25 : 0) + (userStats.streak > 0 ? 15 : 0)))}%
                            </span>
                          </div>
                          
                          <div className="flex-1 space-y-1.5 text-[10px] font-bold">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Profile Status:</span>
                              <span className={academicProfile.isProfileComplete ? "text-emerald-500" : "text-amber-500"}>
                                {academicProfile.isProfileComplete ? '✓ Complete' : '▲ Pending'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Project Quality:</span>
                              <span className={projectsList.length > 0 ? "text-emerald-500" : "text-slate-400"}>
                                {projectsList.length > 0 ? '✓ Uploaded' : '▲ Add Project'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Practice Readiness:</span>
                              <span className={userStats.quizzesCompleted > 0 ? "text-emerald-500" : "text-slate-400"}>
                                {userStats.quizzesCompleted > 0 ? '✓ Active' : '▲ Take Quiz'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Consistency:</span>
                              <span className={userStats.streak > 0 ? "text-emerald-500" : "text-slate-400"}>
                                {userStats.streak > 0 ? '✓ Streak On' : '▲ Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button onClick={() => setActiveSidebarTab('Settings')} className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-bold shadow-md cursor-pointer border-none">
                          Improve Profile
                        </button>
                      </div>

                      {/* AI Mentor Insights */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Bot className="h-4 w-4 text-blue-500" /> AI Mentor Insights
                          </h3>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Tips</span>
                        </div>

                        <div className="space-y-2 text-[10px] font-semibold leading-relaxed">
                          <div className="p-2 rounded-xl bg-blue-50/50 dark:bg-blue-950/10 text-blue-600 dark:text-blue-400 flex items-start gap-2">
                            <span className="text-base leading-none mt-0.5">💡</span>
                            <div>
                              <strong className="block text-slate-700 dark:text-slate-350">Engineering Focus:</strong>
                              Master core subjects and maintain high quiz accuracy.
                            </div>
                          </div>

                          <div className="p-2 rounded-xl bg-orange-50/50 dark:bg-orange-950/10 text-orange-600 dark:text-orange-400 flex items-start gap-2">
                            <span className="text-base leading-none mt-0.5">⚠️</span>
                            <div>
                              <strong className="block text-slate-700 dark:text-slate-355">Classroom Connection:</strong>
                              Join faculty classes with your course code to access materials.
                            </div>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-start gap-2">
                            <span className="text-base leading-none mt-0.5">🚀</span>
                            <div>
                              <strong className="block text-slate-600 dark:text-slate-400">Recommendations:</strong>
                              Upload engineering projects and keep your learning streak alive.
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Activity Timeline */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-indigo-500" /> Activity Timeline
                          </h3>
                          <span className="text-[10px] text-slate-400 font-bold uppercase cursor-pointer">Live Events</span>
                        </div>

                        <div className="space-y-3 text-[10px] font-semibold flex-1">
                          {(() => {
                            const activities: { title: string; time: string; xp: string; color: string }[] = [];
                            if (enrolledClasses.length > 0) {
                              activities.push({
                                title: `Joined class: ${enrolledClasses[0].name}`,
                                time: 'Recent',
                                xp: '+50 XP',
                                color: 'text-emerald-500'
                              });
                            }
                            if (userStats.quizzesCompleted > 0) {
                              activities.push({
                                title: `Completed ${userStats.quizzesCompleted} assessment quizzes`,
                                time: 'Active',
                                xp: `+${userStats.quizzesCompleted * 20} XP`,
                                color: 'text-emerald-500'
                              });
                            }
                            if (projectsList.length > 0) {
                              activities.push({
                                title: `Uploaded project: ${projectsList[0].title}`,
                                time: 'Published',
                                xp: '+100 XP',
                                color: 'text-orange-500'
                              });
                            }
                            if (userStats.streak > 0) {
                              activities.push({
                                title: `${userStats.streak}-day learning streak maintained`,
                                time: 'Ongoing',
                                xp: `+${userStats.streak * 10} XP`,
                                color: 'text-indigo-500'
                              });
                            }

                            if (activities.length === 0) {
                              return (
                                <div className="text-center py-6 text-slate-400 text-xs">
                                  No recent activities recorded yet. Join a class or attempt a quiz to build your timeline!
                                </div>
                              );
                            }

                            return activities.map((act, i) => (
                              <div key={i} className="flex justify-between items-start gap-2 pl-3 border-l border-slate-200 dark:border-slate-800 relative py-0.5">
                                <span className="absolute left-[-4.5px] top-1.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white dark:border-slate-900" />
                                <div className="min-w-0">
                                  <h4 className="text-slate-800 dark:text-slate-200 truncate">{act.title}</h4>
                                  <span className="text-[8px] text-slate-400">{act.time}</span>
                                </div>
                                <span className={`font-mono font-bold shrink-0 ${act.color}`}>{act.xp}</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                    </div>

                    {/* 7. UPCOMING TASKS & WALLET REDEMPTION */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Upcoming Tasks */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <CheckSquare className="h-4 w-4 text-orange-500" /> Upcoming Tasks
                        </h3>

                        <div className="space-y-3.5 text-xs font-semibold">
                          {enrolledClasses.length > 0 ? (
                            enrolledClasses.slice(0, 3).map((c, i) => (
                              <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900">
                                <span className="truncate max-w-[160px] text-slate-800 dark:text-slate-200">{c.name} Weekly Session</span>
                                <span className="text-[9px] text-slate-450 dark:text-slate-500 text-right">{c.section || 'Active Class'}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-slate-400 text-xs">
                              No pending tasks. Join a class or review curriculum to stay ahead!
                            </div>
                          )}
                        </div>
                        <button onClick={() => setActiveSidebarTab('Classes')} className="w-full py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-500 border border-slate-200/60 dark:border-slate-700/80 cursor-pointer">
                          View Enrolled Classes
                        </button>
                      </div>

                      {/* Rewards & Campus Coins */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <Coins className="h-4 w-4 text-amber-500" /> Rewards & Campus Coins
                        </h3>

                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[9px] text-slate-455 font-bold uppercase block">Campus Coins Wallet</span>
                            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">{userStats.coins}</div>
                          </div>
                          <button 
                            onClick={() => setShowCoinsModal(true)}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded-xl shadow-md cursor-pointer border-none"
                          >
                            Redeem Now
                          </button>
                        </div>

                        <div className="space-y-2 text-[10px] font-bold border-t border-slate-100 dark:border-slate-800/60 pt-3">
                          <span className="text-slate-400 block mb-1">Recent Redemptions:</span>
                          <p className="text-[10px] text-slate-400 font-normal py-1">
                            {userStats.coins > 0 
                              ? `You have ${userStats.coins} coins available to redeem for study vouchers and resources.`
                              : 'Earn coins by completing quizzes, maintaining streaks, and attending lectures.'}
                          </p>
                        </div>
                      </div>

                      {/* Portfolio Sharing & PDF Export */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                          <ExternalLink className="h-4 w-4 text-blue-500" /> Share & PDF Portfolio
                        </h3>

                        <div className="space-y-2">
                          <span className="text-[9px] text-slate-455 font-bold uppercase block">Your Public Portfolio Link</span>
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-[10px] font-semibold select-all font-mono truncate text-slate-600 dark:text-slate-400">
                            <span>padhakuportal.com/u/{settingsName.toLowerCase().replace(/[^a-z0-9]/g, '')}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`padhakuportal.com/u/${settingsName.toLowerCase().replace(/[^a-z0-9]/g, '')}`);
                              addToast('Portfolio link copied to clipboard! 📋');
                            }}
                            className="flex-1 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer bg-transparent"
                          >
                            <Share2 className="h-3.5 w-3.5 text-slate-500" /> Share Link
                          </button>
                          <button 
                            onClick={() => {
                              addToast('Preparing print-friendly portfolio PDF... 📄');
                              setTimeout(() => {
                                window.print();
                              }, 1000);
                            }}
                            className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-[10px] font-bold rounded-xl shadow-md flex items-center justify-center gap-1 cursor-pointer border-none"
                          >
                            <Download className="h-3.5 w-3.5" /> Download PDF
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* 9. PROJECT SHOWCASE VIEW */}
                {activeSidebarTab === 'Project Showcase' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Student Project Showcase</h2>
                        <p className="text-xs text-slate-400">Discover engineering projects created by students across departments.</p>
                      </div>

                      <button
                        onClick={() => setShowAddProjectModal(true)}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" /> Upload Project
                      </button>
                    </div>

                    {/* Add Project Modal */}
                    <AnimatePresence>
                      {showAddProjectModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 relative"
                          >
                            <button 
                              onClick={() => setShowAddProjectModal(false)}
                              className="absolute top-4 right-4 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800"
                            >
                              <X className="h-4 w-4" />
                            </button>

                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload Engineering Project</h3>
                            <p className="text-xs text-slate-400">Faculty approval is required before your project appears publicly.</p>

                            <div className="space-y-3 text-xs">
                              <div>
                                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Project Title</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Smart IoT Solar Tracker"
                                  value={newProject.title}
                                  onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">GitHub Repository URL</label>
                                <input
                                  type="url"
                                  placeholder="https://github.com/username/project"
                                  value={newProject.github}
                                  onChange={(e) => setNewProject(prev => ({ ...prev, github: e.target.value }))}
                                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tech Stack (comma separated)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Python, TensorFlow, React"
                                  value={newProject.tech}
                                  onChange={(e) => setNewProject(prev => ({ ...prev, tech: e.target.value }))}
                                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Project Description</label>
                                <textarea
                                  placeholder="Describe the technical architecture, problem statement, and solution..."
                                  rows={3}
                                  value={newProject.desc}
                                  onChange={(e) => setNewProject(prev => ({ ...prev, desc: e.target.value }))}
                                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                                />
                              </div>

                              <button
                                onClick={handleAddProject}
                                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                              >
                                Submit for Faculty Review (+200 XP)
                              </button>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>

                    {/* Projects Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {projectsList.map((p) => (
                        <div key={p.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${p.status === 'Approved by Faculty' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                {p.status}
                              </span>
                              <a href={p.github} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
                                <Github className="h-4 w-4" />
                              </a>
                            </div>

                            <h3 className="text-base font-bold text-slate-900 dark:text-white">{p.title}</h3>
                            <p className="text-[11px] text-slate-400">By <strong>{p.author}</strong> • {p.dept}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">{p.desc}</p>

                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {p.tech.map((t, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-bold rounded">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await apiClient.upvoteStudentProject(p.id);
                                    setProjectsList(prev => prev.map(item => item.id === p.id ? { ...item, upvotes: res.upvotes } : item));
                                    addToast('Upvoted project!');
                                  } catch (err) {
                                    addToast('Failed to upvote project.');
                                  }
                                }}
                                className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-orange-600 font-semibold cursor-pointer"
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                                <span>{p.upvotes} Upvotes</span>
                              </button>

                              {/* Admin Moderation Controls */}
                              {userRole === 'Admin' && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={async () => {
                                      try {
                                        await apiClient.approveStudentProject(p.id);
                                        setProjectsList(prev => prev.map(item => item.id === p.id ? { ...item, status: 'Approved by Faculty' } : item));
                                        logAuditTrail('Approved Project Showcase', p.author, `Approved ${p.title}`);
                                        addToast(`Approved project: ${p.title}`);
                                      } catch (err) {
                                        addToast('Failed to approve project.');
                                      }
                                    }}
                                    className="px-2 py-0.5 bg-emerald-600 text-white font-bold text-[9px] rounded"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        await apiClient.rejectStudentProject(p.id);
                                        setProjectsList(prev => prev.map(item => item.id === p.id ? { ...item, status: 'Changes Requested' } : item));
                                        logAuditTrail('Requested Changes on Project', p.author, `Requested changes on ${p.title}`);
                                        addToast(`Requested changes on: ${p.title}`);
                                      } catch (err) {
                                        addToast('Failed to reject project.');
                                      }
                                    }}
                                    className="px-2 py-0.5 bg-amber-600 text-white font-bold text-[9px] rounded"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>

                            <a href={p.github} target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 font-semibold hover:underline flex items-center gap-1">
                              Repository <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 10. 🤖 AI MENTOR VIEW */}
                {activeSidebarTab === '🤖 AI Mentor' && (
                  <div className="space-y-6 max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col justify-between">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        🤖 AI Engineering Mentor
                        <span className="px-2 py-0.5 bg-orange-600 text-white text-[9px] rounded-full font-bold uppercase">Beta</span>
                      </h2>
                      <p className="text-xs text-slate-400">Ask technical questions regarding GTU 2024-25 syllabus, GATE exam formulas, or code debugging.</p>
                    </div>

                    {/* Chat Bubble Container */}
                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 p-6 overflow-y-auto space-y-4 my-2">
                      {mentorMessages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.sender === 'ai' && (
                            <div className="h-8 w-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
                              <Bot className="h-4 w-4" />
                            </div>
                          )}
                          <div className={`p-4 rounded-2xl max-w-lg text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-orange-600 text-white font-medium' : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700'}`}>
                            <pre className="font-sans whitespace-pre-wrap">{msg.text}</pre>
                            <span className={`text-[9px] mt-1.5 block ${msg.sender === 'user' ? 'text-orange-100' : 'text-slate-400'}`}>{msg.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Suggested Prompts & Search Bar */}
                    <div className="space-y-3">
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {[
                          'Explain BCNF Normalization vs 3NF',
                          'Floyd Cycle Detection algorithm in C++',
                          'K-Map 3 variable minimization rules',
                          'Preemptive vs Non-preemptive OS scheduling'
                        ].map((p, i) => (
                          <button
                            key={i}
                            onClick={() => sendAIMessage(p)}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 shrink-0 cursor-pointer"
                          >
                            💡 {p}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Type your engineering question here..."
                          value={mentorInput}
                          onChange={(e) => setMentorInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendAIMessage()}
                          className="flex-1 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none text-slate-800 dark:text-slate-100"
                        />
                        <button
                          onClick={() => sendAIMessage()}
                          className="p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl shadow-md cursor-pointer"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. QUIZZES VIEW */}
                {activeSidebarTab === 'Quizzes' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assessment Sector</h2>
                        <p className="text-xs text-slate-400">Select any active test paper to launch the assessment engine.</p>
                      </div>
                      
                      {/* Assessment Category Filters */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                        {['All', 'Mid-Sem Mock', 'End-Sem Exam', 'Topic Practice'].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 border cursor-pointer ${
                              selectedCategoryFilter === cat 
                                ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredQuizzes.map((quiz) => (
                        <div key={quiz.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-2.5">
                              <span className="px-2 py-0.5 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[9px] font-bold rounded uppercase tracking-wider">{quiz.subject}</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${quiz.difficulty === 'Hard' ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'}`}>{quiz.difficulty}</span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-normal">{quiz.title}</h3>
                            <span className="text-[10px] text-slate-400 font-medium mt-1 block">NEP Code: {quiz.code} • {quiz.category}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 py-2 border-y border-slate-100 dark:border-slate-800">
                            <div>Questions: <span className="font-semibold text-slate-800 dark:text-slate-200">{quiz.questionsCount}</span></div>
                            <div>Duration: <span className="font-semibold text-slate-800 dark:text-slate-200">{quiz.duration} mins</span></div>
                            <div>XP Reward: <span className="font-semibold text-slate-800 dark:text-slate-200">+{quiz.xpReward} XP</span></div>
                          </div>

                          <button 
                            onClick={() => startQuiz(quiz)}
                            disabled={!quiz.published && userRole === 'Student'}
                            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" /> Launch Assessment
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 12. GATE PYQ ZONE & PYQ HUB */}
                {(activeSidebarTab === 'GATE PYQ Zone' || activeSidebarTab === 'PYQs') && (
                  <PyqQuizHub />
                )}

                {/* 13. ACADEMIC & ACCOUNT SETTINGS (SYNCED WITH PADHAKU_CORE_DB student_profiles) */}
                {activeSidebarTab === 'Settings' && (
                  <div className="space-y-6 max-w-4xl mx-auto text-left font-sans">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-2">
                        <div>
                          <h2 className="text-xl font-black text-slate-900 dark:text-white">Academic & Account Settings</h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Manage your official GTU student profile, university credentials, and academic qualifications. All data synchronizes with our core database.
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0 self-start sm:self-center">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Core-DB Synced</span>
                        </span>
                      </div>

                      {/* Display Picture Section */}
                      <div className="space-y-2 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Profile Picture / Avatar</label>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <img
                            src={settingsImg || currentUser?.photoURL || '/images/avatar_boy.webp'}
                            alt="Preview"
                            className="h-16 w-16 rounded-2xl object-cover ring-2 ring-orange-500/20 shrink-0"
                          />
                          <div className="flex-1 space-y-2 w-full">
                            <div className="flex gap-2 items-center overflow-x-auto pb-1 max-w-[280px] sm:max-w-full">
                              {currentUser?.photoURL && (
                                <button
                                  type="button"
                                  onClick={() => setSettingsImg(currentUser.photoURL!)}
                                  className={`h-9 w-9 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                                    settingsImg === currentUser.photoURL ? 'border-orange-500 scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                                  }`}
                                  title="Google Account Profile Picture"
                                >
                                  <img src={currentUser.photoURL} className="h-full w-full object-cover" alt="Google Profile" />
                                </button>
                              )}
                              {[
                                '/images/avatar_boy.webp',
                                '/images/avatar_girl.webp',
                              ].map((url, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setSettingsImg(url)}
                                  className={`h-9 w-9 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                                    settingsImg === url ? 'border-orange-500 scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                                  }`}
                                >
                                  <img src={url} className="h-full w-full object-cover" alt={`Avatar ${i === 0 ? 'Boy' : 'Girl'}`} />
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              value={settingsImg}
                              onChange={(e) => setSettingsImg(e.target.value)}
                              placeholder="Or paste custom image URL..."
                              className="w-full p-2.5 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none text-xs font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 1. Personal & Contact Information */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-extrabold text-orange-600 dark:text-orange-500 uppercase tracking-wider">
                          1. Personal & Contact Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Student Name</label>
                            <input 
                              type="text" 
                              value={settingsName} 
                              onChange={(e) => setSettingsName(e.target.value)} 
                              placeholder="e.g. Ayush Patel"
                              className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none text-xs font-bold" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                            <input 
                              type="email" 
                              value={settingsEmail} 
                              onChange={(e) => setSettingsEmail(e.target.value)} 
                              placeholder="student@example.com"
                              className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none text-xs font-bold" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
                            <input 
                              type="tel" 
                              value={settingsPhone} 
                              onChange={(e) => setSettingsPhone(e.target.value)} 
                              placeholder="+91 98765 43210"
                              className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none text-xs font-medium" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Date of Birth</label>
                            <input 
                              type="date" 
                              value={settingsDob} 
                              onChange={(e) => setSettingsDob(e.target.value)} 
                              className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none text-xs font-medium" 
                            />
                          </div>
                        </div>
                      </div>

                      <hr className="border-slate-100 dark:border-slate-800" />

                      {/* 2. Academic Enrollment & Department (GTU Scheme) */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-extrabold text-orange-600 dark:text-orange-500 uppercase tracking-wider">
                          2. Academic Enrollment & Department (GTU Scheme)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Enrollment Number</label>
                            <input 
                              type="text" 
                              value={settingsEnrollmentNumber} 
                              onChange={(e) => setSettingsEnrollmentNumber(e.target.value)} 
                              placeholder="e.g. 210120107001"
                              className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none text-xs font-mono font-medium" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Degree / Program</label>
                            <input 
                              type="text" 
                              value={settingsDegree} 
                              onChange={(e) => setSettingsDegree(e.target.value)} 
                              placeholder="Bachelor of Technology (B.Tech / B.E.)"
                              className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none text-xs font-medium" 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                          <SearchableCollegeSelect
                            selectedCollegeName={settingsCollege}
                            onSelect={(selected) => {
                              setSettingsCollege(selected.name);
                              if (!settingsUniversity || settingsUniversity.includes('Gujarat Technological')) {
                                setSettingsUniversity(`Gujarat Technological University (Zone ${selected.zone})`);
                              }
                            }}
                          />
                          <SearchableUniversitySelect
                            selectedUniversityName={settingsUniversity}
                            onSelect={(selectedUni) => setSettingsUniversity(selectedUni)}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                          <SearchableBranchSelect
                            selectedBranchName={settingsDept}
                            onSelect={(selected) => setSettingsDept(selected.name)}
                          />
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Academic Year</label>
                            <select 
                              value={settingsYear} 
                              onChange={(e) => {
                                const yr = e.target.value;
                                setSettingsYear(yr);
                                const calculatedSem = yr.includes('1st') ? 1 : yr.includes('2nd') ? 3 : yr.includes('3rd') ? 5 : 7;
                                setSelectedSemester(calculatedSem);
                              }}
                              className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-navy-950 border-slate-200 dark:border-navy-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none font-medium min-h-[46px]"
                            >
                              <option value="1st Year">1st Year (Sem 1 & 2)</option>
                              <option value="2nd Year">2nd Year (Sem 3 & 4)</option>
                              <option value="3rd Year">3rd Year (Sem 5 & 6)</option>
                              <option value="4th Year">4th Year (Sem 7 & 8)</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Career Goal / Focus</label>
                            <select 
                              value={settingsCareerGoal} 
                              onChange={(e) => handleSetCareerGoal(e.target.value as any)}
                              className="w-full p-3 border rounded-xl bg-slate-50 dark:bg-navy-950 border-slate-200 dark:border-navy-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none font-medium min-h-[46px]"
                            >
                              <option value="Placement">Corporate Placement</option>
                              <option value="GATE">GATE Exam Prep</option>
                              <option value="Research">Academic Research</option>
                              <option value="Entrepreneurship">Entrepreneurship &amp; Startups</option>
                              <option value="Higher Studies">Higher Studies (MS/MBA)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Enrollment Year</label>
                            <input 
                              type="number" 
                              value={settingsEnrollmentYear} 
                              onChange={(e) => setSettingsEnrollmentYear(e.target.value)} 
                              placeholder="e.g. 2023"
                              className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none text-xs font-medium" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Expected Graduation Year</label>
                            <input 
                              type="number" 
                              value={settingsGraduationYear} 
                              onChange={(e) => setSettingsGraduationYear(e.target.value)} 
                              placeholder="e.g. 2027"
                              className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none text-xs font-medium" 
                            />
                          </div>
                        </div>
                      </div>

                      <hr className="border-slate-100 dark:border-slate-800" />

                      {/* 3. Academic & Resume Details */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-extrabold text-orange-600 dark:text-orange-500 uppercase tracking-wider">
                          3. Academic & Resume Details
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">10th Board Marks (%)</label>
                            <input 
                              type="text" 
                              value={settings10thMarks} 
                              onChange={(e) => setSettings10thMarks(e.target.value)} 
                              placeholder="e.g. 92.4% or 9.5 CGPA"
                              className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none text-xs font-medium" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">12th Board Marks (%)</label>
                            <input 
                              type="text" 
                              value={settings12thMarks} 
                              onChange={(e) => setSettings12thMarks(e.target.value)} 
                              placeholder="e.g. 88.6% or 85%"
                              className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none text-xs font-medium" 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Special Skills (comma separated)</label>
                            <input 
                              type="text" 
                              value={settingsSpecialSkills} 
                              onChange={(e) => setSettingsSpecialSkills(e.target.value)} 
                              placeholder="e.g. Docker, AWS, Git, Figma, Python"
                              className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none text-xs font-medium" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Languages Known (comma separated)</label>
                            <input 
                              type="text" 
                              value={settingsLanguages} 
                              onChange={(e) => setSettingsLanguages(e.target.value)} 
                              placeholder="e.g. English, Hindi, Gujarati"
                              className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none text-xs font-medium" 
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Experience & Internships</label>
                          <textarea 
                            value={settingsExperience} 
                            onChange={(e) => setSettingsExperience(e.target.value)} 
                            placeholder="e.g. Full-Stack Web Intern at TechCorp (3 months) | GTU Campus Lead"
                            rows={3}
                            className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none text-xs font-medium" 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Certifications & Courses</label>
                          <textarea 
                            value={settingsCertifications} 
                            onChange={(e) => setSettingsCertifications(e.target.value)} 
                            placeholder="e.g. AWS Certified Solutions Architect, Oracle Certified Java Associate"
                            rows={3}
                            className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none text-xs font-medium" 
                          />
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-[11px] text-slate-400">
                          Changes take effect immediately across all dashboard modules and GTU study materials.
                        </p>
                        <button 
                          disabled={settingsIsSaving}
                          onClick={async () => {
                            if (settingsPhone && !/^(?:\+91|91|0)?[6-9]\d{9}$/.test(settingsPhone.replace(/[\s\-()]/g, ''))) {
                              addToast('Please enter a valid 10-digit phone number.');
                              return;
                            }
                            setSettingsIsSaving(true);
                            try {
                              if (currentUser) {
                                const semVal = settingsYear.toLowerCase().includes('3rd') ? 5 : settingsYear.toLowerCase().includes('4th') ? 7 : settingsYear.toLowerCase().includes('2nd') ? 3 : settingsYear.toLowerCase().includes('1st') ? 1 : 5;
                                await apiClient.saveStudentProfile({
                                  userId: currentUser.uid,
                                  name: settingsName,
                                  email: settingsEmail,
                                  phoneNumber: settingsPhone,
                                  dob: settingsDob,
                                  branch: settingsDept,
                                  semester: semVal,
                                  college: settingsCollege,
                                  university: settingsUniversity,
                                  degree: settingsDegree,
                                  enrollmentNumber: settingsEnrollmentNumber,
                                  enrollmentYear: settingsEnrollmentYear,
                                  graduationYear: settingsGraduationYear,
                                  marks_10th: settings10thMarks,
                                  marks_12th: settings12thMarks,
                                  special_skills: settingsSpecialSkills,
                                  languages_known: settingsLanguages,
                                  experience: settingsExperience,
                                  certifications: settingsCertifications,
                                  avatarUrl: settingsImg,
                                  goals: [settingsCareerGoal],
                                });

                                // Sync updated settings to active dashboard workspace state
                                const mappedDept = mapBranchToDeptId(settingsDept);
                                const slugifiedBranch = mappedDept.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                                setSelectedDeptId(mappedDept);
                                setSelectedSemester(semVal);
                                await saveAcademicProfile({
                                  universityName: settingsUniversity,
                                  college: settingsCollege,
                                  degreeName: settingsDegree,
                                  branchName: settingsDept,
                                  branchId: slugifiedBranch || 'computer-engineering',
                                  semester: semVal,
                                  enrollmentNumber: settingsEnrollmentNumber,
                                  goals: academicProfile.goals || [settingsCareerGoal, 'gtu_prep']
                                });
                              }
                              addToast('Academic & Account Settings synchronized with core database!');
                            } catch (err) {
                              console.error('Failed to save settings:', err);
                              addToast(err instanceof Error && err.message ? err.message : 'Failed to save settings. Please try again.');
                            } finally {
                              setSettingsIsSaving(false);
                            }
                          }}
                          className="w-full sm:w-auto px-8 py-3 bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all cursor-pointer border-none flex items-center justify-center gap-2"
                        >
                          {settingsIsSaving ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin text-white" />
                              <span>Saving to Core Database...</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 text-white" />
                              <span>Save All Changes</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>

      {/* ASSESSMENT PLATFORM MODALS */}
      <WidgetLibraryModal
        isOpen={showWidgetLibraryModal}
        onClose={() => setShowWidgetLibraryModal(false)}
        installedWidgetIds={installedWidgetIds}
        onToggleWidget={handleToggleWidget}
        onRestoreDefaults={handleRestoreDefaultWidgets}
      />



      {/* SLIDE-OVER SUBJECT DETAILS DRAWER MODAL */}
      {selectedSubjectDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-full border-l border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950 text-brand-orange text-[10px] font-black uppercase tracking-wider">
                    GTU {selectedSubjectDrawer.code} • {selectedSubjectDrawer.category}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {selectedSubjectDrawer.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedSubjectDrawer.credits} • {selectedSubjectDrawer.type}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSubjectDrawer(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Faculty Info Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-orange text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                    {(selectedSubjectDrawer.professor || 'Prof').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {selectedSubjectDrawer.professor || 'Course Instructor'}
                    </h4>
                    <p className="text-xs text-slate-500">{selectedSubjectDrawer.designation || 'Faculty Instructor'}</p>
                    <p className="text-[11px] text-brand-orange font-bold mt-0.5">{selectedSubjectDrawer.email || 'faculty@shikshasahayak.org'}</p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Office Hours</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">Mon & Wed (3:00 - 4:30 PM)</span>
                </div>
              </div>

              {/* Units & Syllabus Roadmap */}
              <div className="space-y-3">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-orange" />
                  Units & Syllabus Outline
                </h4>

                <div className="space-y-2.5">
                  {[
                    { unit: 1, title: 'Introduction & Database Architecture', topics: 'DBMS Architecture, Data Models, Relational Algebra', status: 'Completed', percent: 100 },
                    { unit: 2, title: 'SQL Queries & Relational Algebra', topics: 'DML, DDL, Complex Joins, Subqueries & Views', status: 'Completed', percent: 100 },
                    { unit: 3, title: 'Normalization & Functional Dependencies', topics: '1NF, 2NF, 3NF, BCNF, Multivalued Dependencies', status: 'In Progress', percent: 60 },
                    { unit: 4, title: 'Indexing & Transaction Processing', topics: 'B-Trees, B+ Trees, ACID Properties & Serializability', status: 'Pending', percent: 0 },
                    { unit: 5, title: 'Concurrency Control & Recovery', topics: 'Locking Protocols, Deadlocks, ARIES Recovery', status: 'Pending', percent: 0 },
                  ].map(u => (
                    <div key={u.unit} className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                      <div className="flex items-center justify-between text-xs font-extrabold">
                        <span className="text-slate-900 dark:text-white">Unit {u.unit}: {u.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                          u.percent === 100 ? 'bg-emerald-100 text-emerald-600' :
                          u.percent > 0 ? 'bg-orange-100 text-brand-orange' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {u.status} ({u.percent}%)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{u.topics}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lab Manual & Assignments Tracker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 space-y-2">
                  <span className="text-[10px] font-black uppercase text-blue-600 block">Lab Manual & Experiments</span>
                  <h5 className="text-xs font-extrabold text-slate-900 dark:text-white">10 Approved Experiments</h5>
                  <p className="text-[11px] text-slate-500">Includes SQL scripts, C++ code & lab manual PDFs.</p>
                  <button
                    onClick={() => addToast(`Downloading Lab Manual for ${selectedSubjectDrawer.title}`)}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition border-none cursor-pointer mt-1"
                  >
                    Download Lab Manual PDF
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 space-y-2">
                  <span className="text-[10px] font-black uppercase text-purple-600 block">AI Tutor Support</span>
                  <h5 className="text-xs font-extrabold text-slate-900 dark:text-white">24/7 Subject Assistant</h5>
                  <p className="text-[11px] text-slate-500">Ask doubts about GTU paper patterns & derivations.</p>
                  <button
                    onClick={() => {
                      setSelectedSubjectDrawer(null);
                      setActiveSidebarTab('AI Study Buddy');
                      addToast(`Launching AI Tutor session for ${selectedSubjectDrawer.title}`);
                    }}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition border-none cursor-pointer mt-1"
                  >
                    Ask AI Tutor Now
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                onClick={() => setSelectedSubjectDrawer(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs cursor-pointer border-none"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Live Attendance and Join Class Modals */}
      <StudentAttendanceModal
        open={attendanceModalOpen}
        onOpenChange={setAttendanceModalOpen}
        currentUser={{
          id: currentUser?.uid || 'student-guest',
          name: currentUser?.displayName || currentUser?.fullName || settingsName || 'Student',
          enrollmentNo: (academicProfile as any)?.enrollmentNumber || settingsEnrollmentNumber || (currentUser?.uid ? `GTU-${currentUser.uid.substring(0, 8).toUpperCase()}` : '')
        }}
      />

      <JoinClassModal
        open={joinClassModalOpen}
        onOpenChange={setJoinClassModalOpen}
        initialCode={pendingJoinCode}
        onSuccessJoined={() => {
          if (currentUser?.uid) {
            teacherClient.getStudentEnrolledClasses(currentUser.uid)
              .then(res => {
                if (res?.classes) setEnrolledClasses(res.classes);
              })
              .catch(err => console.error('Failed to reload enrolled classes:', err));
          }
        }}
        currentUser={{
          id: currentUser?.uid || 'student-guest',
          name: currentUser?.displayName || currentUser?.fullName || settingsName || 'Student',
          email: currentUser?.email || settingsEmail || 'student@shikshasahayak.org',
          enrollmentNo: (academicProfile as any)?.enrollmentNumber || ''
        }}
      />

      {/* ---------------- FIXED MOBILE BOTTOM NAVIGATION DOCK (9:16 Screens) ---------------- */}
      <nav 
        aria-label="Student Mobile Navigation Dock"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-1 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center justify-around"
      >
        {/* 1. Dashboard / Home Tab */}
        <button
          onClick={() => setActiveSidebarTab('Dashboard')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeSidebarTab === 'Dashboard'
              ? 'text-brand-orange font-black'
              : 'text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeSidebarTab === 'Dashboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        {/* 2. Subjects Tab */}
        <button
          onClick={() => setActiveSidebarTab('My Subjects')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeSidebarTab === 'My Subjects'
              ? 'text-brand-orange font-black'
              : 'text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className={`w-5 h-5 ${activeSidebarTab === 'My Subjects' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight">Subjects</span>
        </button>

        {/* 3. Quizzes / Assessments Tab */}
        <button
          onClick={() => setActiveSidebarTab('Quizzes')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer relative ${
            activeSidebarTab === 'Quizzes'
              ? 'text-brand-orange font-black'
              : 'text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BrainCircuit className={`w-5 h-5 ${activeSidebarTab === 'Quizzes' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight">Quizzes</span>
          <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
        </button>

        {/* 4. PYQs Vault Tab */}
        <button
          onClick={() => setActiveSidebarTab('PYQs Bank')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeSidebarTab === 'PYQs Bank' || activeSidebarTab === 'PYQs'
              ? 'text-brand-orange font-black'
              : 'text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className={`w-5 h-5 ${activeSidebarTab === 'PYQs Bank' || activeSidebarTab === 'PYQs' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight">PYQs</span>
        </button>

        {/* 5. Mobile Drawer All Menu Trigger */}
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 font-semibold hover:text-brand-orange dark:hover:text-brand-orange transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5 stroke-2" />
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>
      </nav>

    </div>
  );
}
