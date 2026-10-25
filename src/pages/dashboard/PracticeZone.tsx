import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  BrainCircuit, Play, Flame, History, Trophy, Award, CheckCircle2, 
  AlertCircle, Clock, Target, TrendingUp, BarChart4, ShieldCheck, Zap, 
  ChevronRight, Search, Filter, ArrowRight, Download, Star, Sparkles, 
  Bot, Sliders, X, FileText, Layers, Lock, Unlock, Share2, Crown, 
  Eye, RefreshCw, AlertTriangle, Check, BookOpenCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { useStudentAcademic } from '../../context/StudentAcademicContext';
import { StudentAdaptiveDashboard } from '../../components/student/StudentAdaptiveDashboard';
import { StudentTestDashboard } from '../../components/practice/StudentTestDashboard';
import { StudentTestHistoryView } from '../../components/practice/StudentTestHistoryView';
import { StudentMcqPracticeModal } from '../../components/practice/StudentMcqPracticeModal';


interface TestItem {
  id: string;
  title: string;
  type: 'Practice' | 'Adaptive' | 'Mock Exam' | 'Upcoming' | 'Daily Challenge';
  subject: string;
  subjectCode: string;
  semester: number;
  unit?: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Adaptive AI' | 'GTU Standard';
  questionsCount: number;
  timeLimitMins: number;
  xpReward: number;
  coinsReward: number;
  avgScorePercent: number;
  attemptsCount: number;
  isLocked?: boolean;
  scheduledDate?: string;
  timeRemaining?: string;
}

interface CompletedTestItem {
  id: string;
  testTitle: string;
  subject: string;
  subjectCode: string;
  score: number;
  totalScore: number;
  accuracy: number;
  timeTaken: string;
  dateCompleted: string;
  percentile: number;
  rank: number;
  status: 'Passed' | 'Distinction' | 'Needs Improvement';
}

const SAMPLE_PRACTICE_TESTS: TestItem[] = [
  {
    id: 'test-1',
    title: 'B-Trees & Multi-Level Indexing Practice Set',
    type: 'Practice',
    subject: 'Database Management Systems',
    subjectCode: '3150703',
    semester: 5,
    unit: 3,
    difficulty: 'Medium',
    questionsCount: 15,
    timeLimitMins: 20,
    xpReward: 150,
    coinsReward: 30,
    avgScorePercent: 78,
    attemptsCount: 1240
  },
  {
    id: 'test-2',
    title: 'Adaptive Graph Algorithms (Dijkstra & A* Search)',
    type: 'Adaptive',
    subject: 'Data Structures & Algorithms',
    subjectCode: '3130702',
    semester: 3,
    unit: 4,
    difficulty: 'Adaptive AI',
    questionsCount: 20,
    timeLimitMins: 25,
    xpReward: 250,
    coinsReward: 50,
    avgScorePercent: 72,
    attemptsCount: 2100
  },
  {
    id: 'test-3',
    title: 'GTU Mid-Sem 2 Full Syllabus Mock Exam',
    type: 'Mock Exam',
    subject: 'Computer Networks',
    subjectCode: '3150710',
    semester: 5,
    difficulty: 'GTU Standard',
    questionsCount: 30,
    timeLimitMins: 45,
    xpReward: 400,
    coinsReward: 80,
    avgScorePercent: 68,
    attemptsCount: 3450
  },
  {
    id: 'test-4',
    title: 'Process Concurrency & Semaphore Deadlocks',
    type: 'Practice',
    subject: 'Operating Systems',
    subjectCode: '3140702',
    semester: 4,
    unit: 2,
    difficulty: 'Hard',
    questionsCount: 15,
    timeLimitMins: 20,
    xpReward: 200,
    coinsReward: 40,
    avgScorePercent: 64,
    attemptsCount: 980
  },
  {
    id: 'test-5',
    title: 'GATE 2027 CSE All-India Mock Simulation #4',
    type: 'Mock Exam',
    subject: 'Computer Science (All Subjects)',
    subjectCode: 'GATE-CSE',
    semester: 5,
    difficulty: 'Hard',
    questionsCount: 65,
    timeLimitMins: 180,
    xpReward: 1000,
    coinsReward: 200,
    avgScorePercent: 55,
    attemptsCount: 5200
  }
];

const COMPLETED_HISTORY: CompletedTestItem[] = [
  {
    id: 'comp-1',
    testTitle: 'DBMS Normalization & BCNF Derivations',
    subject: 'Database Management Systems',
    subjectCode: '3150703',
    score: 45,
    totalScore: 50,
    accuracy: 90,
    timeTaken: '14m 20s',
    dateCompleted: 'Yesterday, 4:30 PM',
    percentile: 94.2,
    rank: 12,
    status: 'Distinction'
  },
  {
    id: 'comp-2',
    testTitle: 'OS Memory Management & Page Replacement',
    subject: 'Operating Systems',
    subjectCode: '3140702',
    score: 32,
    totalScore: 40,
    accuracy: 80,
    timeTaken: '18m 05s',
    dateCompleted: '3 days ago',
    percentile: 86.5,
    rank: 38,
    status: 'Passed'
  },
  {
    id: 'comp-3',
    testTitle: 'DSA Trees & Binary Search Trees',
    subject: 'Data Structures & Algorithms',
    subjectCode: '3130702',
    score: 48,
    totalScore: 50,
    accuracy: 96,
    timeTaken: '12m 40s',
    dateCompleted: '5 days ago',
    percentile: 98.8,
    rank: 3,
    status: 'Distinction'
  }
];

export default function PracticeZone() {
  const { currentUser } = useAuth();
  const { academicProfile } = useStudentAcademic();
  const [leaderboardUsers, setLeaderboardUsers] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    apiClient.getLeaderboard().then(data => {
      if (isMounted && data && Array.isArray(data)) {
        setLeaderboardUsers(data);
      }
    }).catch(err => {
      console.warn('Failed to load leaderboard in PracticeZone:', err);
    });
    return () => { isMounted = false; };
  }, []);

  const standings = useMemo(() => {
    if (leaderboardUsers.length > 0) {
      return leaderboardUsers.slice(0, 10).map((u, idx) => ({
        rank: idx + 1,
        name: u.name || u.email?.split('@')[0] || 'Student',
        dept: u.branch || academicProfile.branchName || 'Engineering',
        score: `${Math.min(100, Math.max(65, Math.round(98 - idx * 3)))}%`,
        xp: `${(u.xp || 0).toLocaleString()} XP`,
        avatar: idx === 0 ? '👑' : idx === 1 ? '🥇' : idx === 2 ? '🥈' : idx === 3 ? '🥉' : '🎖️',
        isYou: Boolean(currentUser && (u.user_id === currentUser.uid || u.email === currentUser.email))
      }));
    }
    const studentName = academicProfile.fullName || currentUser?.displayName || 'Student';
    const deptName = academicProfile.branchName || 'Engineering';
    return [
      { rank: 1, name: studentName, dept: deptName, score: '100%', xp: '150 XP', avatar: '👑', isYou: true }
    ];
  }, [leaderboardUsers, currentUser, academicProfile]);

  // Primary Navigation State
  const [activeTab, setActiveTab] = useState<
    'overview' | 'practice' | 'adaptive' | 'mock' | 'upcoming' | 'history' | 'weakness' | 'leaderboard' | 'certificates'
  >('overview');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Modals & Triggers
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedReviewTest, setSelectedReviewTest] = useState<CompletedTestItem | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mcqModalState, setMcqModalState] = useState<{
    isOpen: boolean;
    filters?: {
      subjectCode?: string;
      subjectName?: string;
      difficulty?: any;
      sourceMode?: any;
    };
    title?: string;
  }>({ isOpen: false });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Custom Test Configuration
  const [configSubject, setConfigSubject] = useState('Database Management Systems');
  const [configUnit, setConfigUnit] = useState(3);
  const [configCount, setConfigCount] = useState(15);
  const [configDifficulty, setConfigDifficulty] = useState('Medium');
  const [configAdaptiveAI, setConfigAdaptiveAI] = useState(true);

  const filteredTests = SAMPLE_PRACTICE_TESTS.filter(test => {
    const matchesSearch = 
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.subjectCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = selectedSubject === 'all' || test.subject.toLowerCase().includes(selectedSubject.toLowerCase());
    const matchesDiff = selectedDifficulty === 'all' || test.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

    const matchesTab = 
      activeTab === 'overview' ? true :
      activeTab === 'practice' ? test.type === 'Practice' :
      activeTab === 'adaptive' ? test.type === 'Adaptive' :
      activeTab === 'mock' ? test.type === 'Mock Exam' :
      activeTab === 'upcoming' ? test.type === 'Upcoming' :
      true;

    return matchesSearch && matchesSubject && matchesDiff && matchesTab;
  });

  return (
    <div className="space-y-6 pb-16 text-slate-900 dark:text-slate-100 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP HERO BANNER (Stripe & Linear SaaS Style) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-navy-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800/80">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 mb-4">
          <Link to="/student" className="hover:text-brand-orange transition">Home</Link>
          <span>/</span>
          <span className="text-slate-300">Student Portal</span>
          <span>/</span>
          <span className="text-brand-orange font-bold">Smart Assessment Platform</span>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-xs font-bold">
              <BrainCircuit className="w-3.5 h-3.5 animate-pulse" />
              <span>AI-Powered GTU & GATE Assessment Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-white">
              Smart Assessment & Mock Exams
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Adaptive tests, full-length GTU mid-sem mocks, automated weak-topic diagnostics, and national rank prediction.
            </p>

            {/* Quick Metrics Badge Row */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">
                <Target className="w-3.5 h-3.5 text-brand-orange" />
                <strong className="text-white">14,200+</strong> Mocks Taken
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <strong className="text-white">94.2%</strong> Avg Accuracy
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <strong className="text-white">1.2k</strong> Verified Certificates
              </span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-5 py-3 rounded-2xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              <Sliders className="w-4 h-4" />
              <span>Configure Custom Test</span>
            </button>

            <button
              onClick={() => setActiveTab('adaptive')}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Start Adaptive AI Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 🔥 DAILY CHALLENGE HIGHLIGHT CARD */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/30 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-orange text-white flex items-center justify-center shrink-0 shadow-md">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-brand-orange bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 rounded-md">
                Today's Daily Engineering Challenge
              </span>
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Time Remaining: 04h 22m
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1">
              Floyd-Warshall All-Pairs Shortest Path Matrix Derivation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Data Structures & Algorithms • Reward: <strong className="text-brand-orange">+50 XP</strong> & <strong className="text-amber-500">+15 Campus Coins</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMcqModalState({
              isOpen: true,
              title: "Today's Daily Engineering Challenge: Algorithms & Data Structures",
              filters: {
                difficulty: 'Medium',
                sourceMode: 'ALL',
                subjectName: 'Data Structures & Algorithms'
              }
            });
          }}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer border-none"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Attempt Daily Challenge</span>
        </button>
      </div>

      {/* 3. PRIMARY NAVIGATION CATEGORY TABS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'overview', label: 'Analytics & Overview', icon: BarChart4 },
            { id: 'practice', label: 'Practice Sets', icon: BookOpenCheck },
            { id: 'adaptive', label: 'Adaptive AI Tests', icon: Sparkles },
            { id: 'mock', label: 'Mock Exams (GTU/GATE)', icon: ShieldCheck },
            { id: 'upcoming', label: 'Upcoming Tests', icon: Clock },
            { id: 'history', label: 'Test History', icon: History },
            { id: 'weakness', label: 'Weak Topics Diagnostic', icon: AlertTriangle },
            { id: 'leaderboard', label: 'Class Leaderboard', icon: Trophy },
            { id: 'certificates', label: 'Certificates', icon: Award },
          ].map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-brand-orange text-white shadow-md shadow-orange-500/20'
                    : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-orange'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Secondary Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tests by subject, GTU code, unit or difficulty..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Subjects</option>
              <option value="Database Management Systems">DBMS</option>
              <option value="Data Structures & Algorithms">Data Structures</option>
              <option value="Operating Systems">Operating Systems</option>
              <option value="Computer Networks">Computer Networks</option>
            </select>

            <select
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Adaptive AI">Adaptive AI</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. TAB 1: OVERVIEW & PERFORMANCE ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 Performance Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Overall Accuracy</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                88.5%
                <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">+4.2%</span>
              </div>
              <p className="text-[11px] text-slate-400">Based on 14 completed assessments</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Avg Speed / Question</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                48s
                <span className="text-xs font-bold text-blue-500 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">Optimal</span>
              </div>
              <p className="text-[11px] text-slate-400">GTU Standard target: 90s</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estimated GATE Rank</span>
              <div className="text-2xl font-black text-brand-orange flex items-center gap-2">
                #340
                <span className="text-xs font-bold text-slate-400">All India</span>
              </div>
              <p className="text-[11px] text-slate-400">Percentile: 98.4th</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Weak Topics Flagged</span>
              <div className="text-2xl font-black text-red-500 flex items-center gap-2">
                2 Sub-topics
                <span className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">Action Req</span>
              </div>
              <p className="text-[11px] text-slate-400">Requires 15m revision set</p>
            </div>
          </div>

          {/* Subject Mastery Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Breakdown Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart4 className="w-4 h-4 text-brand-orange" />
                  Subject Accuracy Breakdown
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">GTU Sem 3 - Sem 5</span>
              </div>

              <div className="space-y-4 text-xs font-semibold">
                {[
                  { subject: 'Database Management Systems', score: 92, color: 'bg-emerald-500' },
                  { subject: 'Data Structures & Algorithms', score: 86, color: 'bg-blue-500' },
                  { subject: 'Computer Networks', score: 78, color: 'bg-amber-500' },
                  { subject: 'Operating Systems (Semaphores)', score: 64, color: 'bg-red-500' },
                ].map((s, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-800 dark:text-slate-200">{s.subject}</span>
                      <span className="text-slate-900 dark:text-white font-extrabold">{s.score}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Weakness Diagnosis Box */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    AI Weak Topics Diagnostic
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase">Low Accuracy</span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200/40 dark:border-red-900/30 space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-extrabold text-red-700 dark:text-red-400">
                      <span>B+ Tree Deletions & Key Redistribution</span>
                      <span>42% Accuracy</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      You missed 4/5 questions on tree node merging during underflow.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-900/30 space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-extrabold text-amber-700 dark:text-amber-400">
                      <span>Semaphores & Dining Philosophers</span>
                      <span>58% Accuracy</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Deadlock prevention condition checks need review.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('weakness')}
                className="w-full py-3 rounded-2xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <Zap className="w-4 h-4" />
                <span>Start Remedial Practice Set for Weak Topics</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 2, 3, 4: TESTS GRID VIEW (Practice, Adaptive, Mock Exams) */}
      {(activeTab === 'practice' || activeTab === 'adaptive' || activeTab === 'mock' || activeTab === 'upcoming') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map(test => (
            <div
              key={test.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950 text-brand-orange text-[10px] font-black uppercase tracking-wider border border-orange-200/40">
                    {test.type} • {test.subjectCode}
                  </span>

                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                    test.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600' :
                    test.difficulty === 'Medium' ? 'bg-blue-50 text-blue-600' :
                    test.difficulty === 'Adaptive AI' ? 'bg-purple-50 text-purple-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {test.difficulty}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-brand-orange transition">
                    {test.title}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {test.subject} • Sem {test.semester}
                  </p>
                </div>
              </div>

              {/* Stats & Details */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Questions</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{test.questionsCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Time</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{test.timeLimitMins}m</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Reward</span>
                    <span className="font-extrabold text-brand-orange">+{test.xpReward} XP</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Avg Score: {test.avgScorePercent}%</span>
                  <span>{test.attemptsCount.toLocaleString()} Attempts</span>
                </div>

                <button
                  onClick={() =>
                    setMcqModalState({
                      isOpen: true,
                      filters: {
                        subjectCode: test.subjectCode,
                        subjectName: test.subject,
                        difficulty:
                          test.difficulty === 'Easy' ? 'easy' : test.difficulty === 'Hard' ? 'hard' : undefined,
                      },
                      title: test.title,
                    })
                  }
                  className="w-full py-3 rounded-2xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Test Attempt</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. TAB 2: ADAPTIVE LEARNING DASHBOARD */}
      {activeTab === 'adaptive' && (
        <StudentAdaptiveDashboard />
      )}

      {/* 5. TAB 3: LIVE TEST & PRACTICE GENERATION DASHBOARD */}
      {activeTab === 'practice' && (
        <StudentTestDashboard />
      )}

      {/* 6. TAB 6: COMPLETED TEST HISTORY & REVIEW SOLUTIONS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <StudentTestHistoryView />
        </div>
      )}


      {/* 7. TAB 7: WEAK TOPICS DIAGNOSTIC & REMEDIAL EXERCISES */}
      {activeTab === 'weakness' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Automated Weak Topics Diagnostic
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                AI diagnosis of your test responses across previous 14 quizzes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/20 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-1 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 font-extrabold text-xs">
                    Priority 1 Weakness
                  </span>
                  <span className="text-xs font-black text-red-600">42% Accuracy</span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  B-Trees & B+ Tree Node Splitting / Deletions
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Database Management Systems (Unit 3). You incorrectly answered node redistributions under minimum key degree constraints.
                </p>
                <button
                  onClick={() => triggerToast('Launching 10-question remedial drill on B+ Trees')}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer border-none"
                >
                  Start Remedial Practice Drill (10 Mins)
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 font-extrabold text-xs">
                    Priority 2 Weakness
                  </span>
                  <span className="text-xs font-black text-amber-600">58% Accuracy</span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Semaphores & Deadlock Prevention Conditions
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Operating Systems (Unit 2). Practice needed on Bankers algorithm resource matrix safety checking.
                </p>
                <button
                  onClick={() => triggerToast('Launching 10-question remedial drill on Semaphores')}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer border-none"
                >
                  Start Remedial Practice Drill (10 Mins)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB 8: CLASS LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              GTU Sem {academicProfile.semester || 5} Assessment Standings
            </h3>
            <span className="text-xs text-slate-400 font-bold">Updated Live</span>
          </div>

          <div className="space-y-2">
            {standings.map(user => (
              <div
                key={user.rank}
                className={`p-4 rounded-2xl flex items-center justify-between gap-4 border transition ${
                  user.isYou ? 'bg-orange-50/60 dark:bg-orange-950/40 border-brand-orange' : 'bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-black w-6 text-center">{user.avatar}</span>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      {user.name}
                      {user.isYou && <span className="px-1.5 py-0.2 bg-brand-orange text-white text-[9px] font-black rounded">YOU</span>}
                    </h4>
                    <p className="text-[10px] text-slate-400">{user.dept}</p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="font-black text-slate-900 dark:text-white block">{user.score}</span>
                  <span className="text-brand-orange font-bold text-[10px]">{user.xp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. TAB 9: VERIFIED CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded">
                Verified Distinction
              </span>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-2">
                Certificate of Excellence in Database Systems
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Awarded for scoring 95%+ in GTU Mid-Sem DBMS Mock Assessment.
              </p>
            </div>
            <button
              onClick={() => setShowCertificateModal('DBMS Excellence Certificate')}
              className="w-full py-2.5 rounded-xl bg-brand-orange text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer border-none"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Verified Certificate PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* 10. MODAL: SOLUTION REVIEW MODAL */}
      {selectedReviewTest && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded uppercase">
                  Score: {selectedReviewTest.score} / {selectedReviewTest.totalScore}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  Solution Review: {selectedReviewTest.testTitle}
                </h3>
              </div>
              <button onClick={() => setSelectedReviewTest(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 space-y-2">
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400 block">Q1: Which normal form guarantees removal of transitive functional dependencies?</span>
                <p className="text-slate-700 dark:text-slate-300"><strong>Your Answer:</strong> 3NF (Third Normal Form) ✓ Correct</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  <strong>Explanation:</strong> 3NF requires that no non-prime attribute is transitively dependent on the primary key. BCNF addresses non-trivial dependencies where X is not a super key.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 space-y-2">
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400 block">Q2: What is the maximum number of pointers in a B-Tree node of order M?</span>
                <p className="text-slate-700 dark:text-slate-300"><strong>Your Answer:</strong> M pointers ✓ Correct</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  <strong>Explanation:</strong> A B-Tree node of order M can have at most M children (pointers) and M-1 keys.
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedReviewTest(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs cursor-pointer border-none"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. MODAL: TEST CONFIGURATOR MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-brand-orange" />
                Configure Custom Assessment Set
              </h3>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">Subject</label>
                <select
                  value={configSubject}
                  onChange={e => setConfigSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Database Management Systems">Database Management Systems</option>
                  <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="Computer Networks">Computer Networks</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">Question Count</label>
                  <select
                    value={configCount}
                    onChange={e => setConfigCount(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={10}>10 Questions (15 mins)</option>
                    <option value={15}>15 Questions (20 mins)</option>
                    <option value={30}>30 Questions (45 mins)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">Difficulty</label>
                  <select
                    value={configDifficulty}
                    onChange={e => setConfigDifficulty(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Adaptive AI">Adaptive AI</option>
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Enable Adaptive AI Difficulty</span>
                  <span className="text-[10px] text-slate-400">Questions automatically adjust based on your correct/wrong answers.</span>
                </div>
                <input
                  type="checkbox"
                  checked={configAdaptiveAI}
                  onChange={e => setConfigAdaptiveAI(e.target.checked)}
                  className="w-4 h-4 accent-brand-orange cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfigModal(false);
                    setMcqModalState({
                      isOpen: true,
                      filters: {
                        subjectName: configSubject,
                        difficulty:
                          configDifficulty === 'Easy' ? 'easy' : configDifficulty === 'Hard' ? 'hard' : undefined,
                      },
                      title: `${configSubject} Custom Practice`,
                    });
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-brand-orange hover:bg-orange-600 text-white shadow-md transition cursor-pointer border-none"
                >
                  Launch Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student MCQ Practice Modal */}
      <StudentMcqPracticeModal
        isOpen={mcqModalState.isOpen}
        onClose={() => setMcqModalState({ isOpen: false })}
        initialFilters={mcqModalState.filters}
        subjectTitle={mcqModalState.title}
      />
    </div>
  );
}

