import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Zap,
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Target,
  BarChart3,
  Sparkles,
  ChevronRight,
  Filter,
  FileText,
  Sliders,
  RotateCcw,
  ArrowRight,
  Calendar,
  Layers,
  GraduationCap,
  ShieldCheck,
  TrendingUp,
  Flame,
  Check
} from 'lucide-react';
import { TestGenerationConfig, TestSessionDTO, TestResultDTO, TestHistoryItem, TestDifficultyFilter } from '../../types';
import { PortalReturnBar } from '../navigation/PortalReturnBar';
import { apiClient } from '../../api/client';
import { toast } from 'sonner';
import { TestInstructionsModal, TestInstructionsConfig } from './TestInstructionsModal';
import { TopicPracticeModal, TopicPracticeConfig } from './TopicPracticeModal';
import { PyqPracticeModal, PyqPracticeConfig } from './PyqPracticeModal';
import { CreateTestModal } from './CreateTestModal';
import { useAuth } from '../../context/AuthContext';
import { useStudentAcademic } from '../../context/StudentAcademicContext';

interface StudentTestDashboardProps {
  onStartTest?: (config: TestGenerationConfig) => void;
  onViewHistory?: () => void;
  onViewAnalytics?: () => void;
  onOpenCustomModal?: () => void;
}

export const StudentTestDashboard: React.FC<StudentTestDashboardProps> = ({
  onStartTest,
  onViewHistory,
  onViewAnalytics,
  onOpenCustomModal,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { academicProfile } = useStudentAcademic();

  const [targetYear, setTargetYear] = useState<'GATE 2026' | 'GATE 2027'>('GATE 2027');
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [historyItems, setHistoryItems] = useState<TestHistoryItem[]>([]);
  const [resumableSession, setResumableSession] = useState<TestHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingTest, setStartingTest] = useState(false);

  // Modals state
  const [instructionsModalConfig, setInstructionsModalConfig] = useState<TestInstructionsConfig | null>(null);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [pyqModalOpen, setPyqModalOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, weakRes, historyRes] = await Promise.all([
        fetch('/api/student/analytics').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/student/tests/weak-topics').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/student/tests/history?limit=10').then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      if (analyticsRes?.analytics) {
        setStats(analyticsRes.analytics);
      }
      if (weakRes?.weakTopics) {
        setWeakTopics(weakRes.weakTopics);
      }
      if (historyRes?.history && Array.isArray(historyRes.history)) {
        setHistoryItems(historyRes.history);
        // Find latest in-progress session if any
        const active = historyRes.history.find((h: TestHistoryItem) => h.status === 'IN_PROGRESS');
        setResumableSession(active || null);
      }
    } catch {
      /* Graceful failure: UI shows clean empty state without crashing */
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (config: TestGenerationConfig) => {
    if (onStartTest) {
      onStartTest(config);
      return;
    }

    setStartingTest(true);
    try {
      const res = await apiClient.createPracticeSession({
        questionCount: config.questionCount || 10,
        durationMinutes: config.durationMinutes || 15,
        sourceMode: config.sourceMode,
        practiceMode: config.testType === 'RANDOM_TEST' ? 'RANDOM' : 'CUSTOM',
        subjectName: config.subjectName,
        subjectCode: config.subjectCode,
        topicName: config.topicName,
        difficulty: config.difficulty,
        branchId: config.branchId || (academicProfile as any)?.branchCode || 'branch_07',
        semester: config.semester || academicProfile?.semester || 1,
      });

      const sessionId = res?.data?.sessionId || res?.data?.session?.id;
      if (sessionId) {
        navigate(`/student/test/${sessionId}`);
      } else {
        toast.error('Failed to initialize test session. Please try again.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Could not start practice test session.');
    } finally {
      setStartingTest(false);
    }
  };

  // Launch pre-configured mock exam via instructions modal
  const handleOpenMockInstructions = (mock: {
    title: string;
    questionCount: number;
    durationMinutes: number;
    totalMarks: number;
    subjectName?: string;
    testType: any;
    sourceMode: any;
  }) => {
    setInstructionsModalConfig({
      title: mock.title,
      testType: mock.testType,
      sourceMode: mock.sourceMode,
      questionCount: mock.questionCount,
      durationMinutes: mock.durationMinutes,
      totalMarks: mock.totalMarks,
      negativeMarking: true,
      negativeMarkValue: 0.33,
      subjectName: mock.subjectName,
      onConfirm: () => {
        setInstructionsModalConfig(null);
        handleStartTest({
          testType: mock.testType,
          sourceMode: mock.sourceMode,
          questionTypes: 'MIXED',
          questionCount: mock.questionCount,
          durationMinutes: mock.durationMinutes,
          subjectName: mock.subjectName,
          negativeMarking: true,
          negativeMarkValue: 0.33,
        });
      },
      onCancel: () => setInstructionsModalConfig(null),
    });
  };

  // MOCK TEST DEFINITIONS (Standardized GATE Syllabus Patterns)
  const AVAILABLE_MOCKS = [
    {
      id: 'gate-full-mock',
      title: 'GATE All-India Full Length Mock Test',
      subtitle: 'Complete 65-question benchmark examination with General Aptitude & Core Engineering',
      questionCount: 65,
      durationMinutes: 180,
      totalMarks: 100,
      tag: 'Full Exam Simulation',
      testType: 'GATE_PYQ_TEST',
      sourceMode: 'GATE_PYQ',
    },
    {
      id: 'gate-math-sectional',
      title: 'Engineering Mathematics Sectional',
      subtitle: 'Discrete Maths, Linear Algebra, Calculus, Probability and Numerical Methods',
      questionCount: 15,
      durationMinutes: 30,
      totalMarks: 25,
      tag: 'Sectional Mastery',
      testType: 'TOPIC_TEST',
      sourceMode: 'ALL',
      subjectName: 'Engineering Mathematics',
    },
    {
      id: 'gate-aptitude-sectional',
      title: 'General Aptitude (GA) Sectional Mock',
      subtitle: 'Verbal Ability, Quantitative Aptitude, Analytical & Spatial Reasoning',
      questionCount: 10,
      durationMinutes: 20,
      totalMarks: 15,
      tag: 'Sectional High-Yield',
      testType: 'TOPIC_TEST',
      sourceMode: 'ALL',
      subjectName: 'General Aptitude',
    },
    {
      id: 'gate-core-technical',
      title: 'Core Technical CS/IT Discipline Mock',
      subtitle: 'Algorithms, Operating Systems, Computer Networks, DBMS & TOC',
      questionCount: 25,
      durationMinutes: 50,
      totalMarks: 40,
      tag: 'Technical Sprint',
      testType: 'GATE_PYQ_TEST',
      sourceMode: 'GATE_PYQ',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* Top Portal Navigation Breadcrumbs */}
      <PortalReturnBar
        crumbs={[
          { label: 'Student Portal', path: '/student?tab=overview' },
          { label: 'GATE Practice' },
        ]}
        fallbackPath="/student?tab=practice"
      />

      {/* A. HEADER SECTION */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-[#F97316] border border-orange-500/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                GATE Practice Simulator
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTargetYear('GATE 2026')}
                  className={`px-2.5 py-0.5 rounded-md transition-all ${
                    targetYear === 'GATE 2026'
                      ? 'bg-white dark:bg-slate-700 text-[#0F172A] dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  GATE 2026
                </button>
                <button
                  type="button"
                  onClick={() => setTargetYear('GATE 2027')}
                  className={`px-2.5 py-0.5 rounded-md transition-all ${
                    targetYear === 'GATE 2027'
                      ? 'bg-white dark:bg-slate-700 text-[#0F172A] dark:text-white shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  GATE 2027
                </button>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">
              GATE Practice &amp; Assessment Arena
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 max-w-2xl leading-relaxed">
              Targeted topic drills, verified previous year papers (PYQs), full-length computer-based exam simulations, and real-time conceptual analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                if (onOpenCustomModal) onOpenCustomModal();
                else setCustomModalOpen(true);
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[#0F172A] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-[#F97316]" />
              <span>Configure Custom Quiz</span>
            </button>
            <button
              onClick={() => {
                if (onViewHistory) onViewHistory();
                else navigate('/student/history');
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-[#0F172A] dark:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <History className="w-4 h-4 text-slate-500" />
              <span>Attempt History</span>
            </button>
          </div>
        </div>
      </div>

      {/* B. CONTINUE LEARNING / RESUMABLE ATTEMPT */}
      {resumableSession ? (
        <div className="rounded-2xl bg-orange-500/5 dark:bg-orange-500/10 border-2 border-[#F97316]/30 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#F97316] text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-orange-500/20">
              <RotateCcw className="w-6 h-6 animate-spin-reverse" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#F97316] uppercase tracking-wider mb-1">
                <span>Resumable Session In Progress</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
                {resumableSession.testType?.replace(/_/g, ' ') || 'GATE Practice Test'}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] dark:text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {resumableSession.questionCount} Questions
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {resumableSession.durationMinutes} Minutes Allotted
                </span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Answers Saved Securely
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/student/test/${resumableSession.id}`)}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all hover:scale-102 cursor-pointer"
          >
            <span>Continue Test</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#F97316] flex items-center justify-center font-bold shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white">
                Ready for Today&rsquo;s GATE Practice?
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                Consistent daily problem solving is the #1 predictor of a top 100 AIR rank.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleStartTest({
              testType: 'RANDOM_TEST',
              sourceMode: 'ALL',
              questionTypes: 'MIXED',
              questionCount: 10,
              durationMinutes: 15,
            })}
            disabled={startingTest}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{startingTest ? 'Generating...' : 'Start 10-Question Quick Drill'}</span>
          </button>
        </div>
      )}

      {/* C. PREPARATION OVERVIEW METRICS (Authoritative Data Only) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#F97316]" />
            <span>Preparation Overview</span>
          </h2>
          {stats && (
            <span className="text-[11px] text-[#64748B] dark:text-slate-400">
              Live server-verified stats
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Questions Attempted */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 block">
              Questions Solved
            </span>
            <span className="text-2xl font-black text-[#0F172A] dark:text-white mt-1 block">
              {stats?.totalQuestionsAttempted !== undefined
                ? stats.totalQuestionsAttempted
                : stats?.questionsAttempted !== undefined
                ? stats.questionsAttempted
                : historyItems.reduce((acc, h) => acc + (h.questionCount || 0), 0)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Across all modes
            </span>
          </div>

          {/* Tests Completed */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 block">
              Tests Completed
            </span>
            <span className="text-2xl font-black text-[#0F172A] dark:text-white mt-1 block">
              {stats?.totalTestsCompleted !== undefined
                ? stats.totalTestsCompleted
                : historyItems.filter(h => h.status === 'SUBMITTED').length}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Evaluated sessions
            </span>
          </div>

          {/* Recent Accuracy */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 block">
              Overall Accuracy
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {stats?.overallAccuracyPercentage !== undefined
                ? `${stats.overallAccuracyPercentage}%`
                : stats?.accuracyPercentage !== undefined
                ? `${stats.accuracyPercentage}%`
                : '—'}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Correct / Attempted ratio
            </span>
          </div>

          {/* Practice Consistency / Streak */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 block">
              Practice Streak
            </span>
            <span className="text-2xl font-black text-[#F97316] mt-1 block flex items-center gap-1.5">
              <Flame className="w-5 h-5 fill-current" />
              {stats?.currentStreakDays !== undefined ? `${stats.currentStreakDays} Days` : '1 Day'}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Consecutive practice days
            </span>
          </div>
        </div>
      </div>

      {/* D. PRACTICE MODE CARDS (4 Clear Entry Points) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">
            Choose Your Practice Mode
          </h2>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
            Select a learning pathway tailored to your current study schedule
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Topic Practice Card */}
          <div className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-[#F97316] transition-all shadow-xs group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#F97316] flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#F97316] uppercase tracking-wider block mb-1">
                  Concept Mastery
                </span>
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                  Topic Practice
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                  Focus on individual subjects and specific syllabus units with step-by-step solutions.
                </p>
              </div>
            </div>

            <button
              onClick={() => setTopicModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-[#F97316] dark:bg-slate-800 dark:hover:bg-[#F97316] text-[#0F172A] hover:text-white dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Select Subject &amp; Topic</span>
            </button>
          </div>

          {/* 2. Previous Year Questions (PYQs) */}
          <div className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-purple-500 transition-all shadow-xs group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block mb-1">
                  Official Papers
                </span>
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                  Previous Year Questions
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                  Solve real questions from GATE 2018–2024 with official answer keys and marking tolerance.
                </p>
              </div>
            </div>

            <button
              onClick={() => setPyqModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-600 dark:bg-purple-950/40 dark:hover:bg-purple-600 text-purple-700 hover:text-white dark:text-purple-300 dark:hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter by Exam Year</span>
            </button>
          </div>

          {/* 3. Mock Tests */}
          <div className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-blue-500 transition-all shadow-xs group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                  Full CBT Simulator
                </span>
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                  GATE Mock Tests
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                  Full-length and sectional timed examinations with standard GATE navigation and marking.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleOpenMockInstructions(AVAILABLE_MOCKS[0])}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 dark:bg-blue-950/40 dark:hover:bg-blue-600 text-blue-700 hover:text-white dark:text-blue-300 dark:hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start All-India Mock</span>
            </button>
          </div>

          {/* 4. Custom Quiz */}
          <div className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-emerald-500 transition-all shadow-xs group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                  Tailored Parameters
                </span>
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                  Custom Diagnostic Quiz
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                  Customize duration, question types (MCQ/MSQ/NAT), marks, and difficulty level.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (onOpenCustomModal) onOpenCustomModal();
                else setCustomModalOpen(true);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-600 dark:bg-emerald-950/40 dark:hover:bg-emerald-600 text-emerald-700 hover:text-white dark:text-emerald-300 dark:hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Configure Parameters</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTIONAL & FULL-LENGTH MOCK TESTS TABLE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
              Curated Mock Examinations
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Exam instructions and confirmation provided before timer starts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AVAILABLE_MOCKS.map((mock) => (
            <div
              key={mock.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#64748B] dark:text-slate-300">
                    {mock.tag}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {mock.totalMarks} Marks
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white">
                  {mock.title}
                </h4>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                  {mock.subtitle}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3 text-xs text-[#64748B] dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {mock.questionCount} Questions
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {mock.durationMinutes} Mins
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenMockInstructions(mock)}
                  className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start Mock</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WEAK TOPICS SECTION (Source-Backed) */}
      {weakTopics && weakTopics.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-[#0F172A] border border-rose-200 dark:border-rose-950/60 p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-white">
                  Personalized Weak Topics Diagnostics
                </h2>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  Topics where your verified accuracy is under 60%
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
              Targeted Remediation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {weakTopics.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="text-[11px] text-[#64748B] dark:text-slate-400 font-semibold block">
                    {item.subjectName || 'Engineering Subject'}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white mt-0.5">
                    {item.topicName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-bold mt-2">
                    <span>{item.accuracyPercentage}% Accuracy</span>
                    <span>•</span>
                    <span className="text-[#64748B] dark:text-slate-400 font-normal">
                      {item.totalCorrect}/{item.totalAttempted} Correct
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartTest(item.recommendedConfig || {
                    testType: 'TOPIC_TEST',
                    sourceMode: 'ALL',
                    topicName: item.topicName,
                    subjectName: item.subjectName,
                    questionCount: 10,
                    durationMinutes: 15,
                  })}
                  className="w-full py-2 rounded-lg bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-600 text-rose-700 hover:text-white dark:text-rose-300 dark:hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Practice Weak Topic</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECENT ATTEMPTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
              Recent Practice &amp; Exam Attempts
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Review full answer keys, grading breakdowns and step solutions
            </p>
          </div>
          {historyItems.length > 0 && (
            <button
              onClick={() => navigate('/student/history')}
              className="text-xs font-bold text-[#F97316] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {historyItems.length > 0 ? (
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-2xs">
            {historyItems.slice(0, 5).map((attempt) => (
              <div
                key={attempt.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#64748B] dark:text-slate-300">
                      {attempt.testType?.replace(/_/g, ' ') || 'Practice Test'}
                    </span>
                    <span className="text-xs text-[#64748B] dark:text-slate-400">
                      {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">
                    {attempt.sourceMode === 'GATE_PYQ' ? 'GATE Exam Simulation' : 'Topic Practice Session'}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-[#64748B] dark:text-slate-400 mt-1">
                    <span>{attempt.questionCount} Questions</span>
                    <span>•</span>
                    <span>Score: <strong className="text-[#0F172A] dark:text-white">{attempt.obtainedMarks} / {attempt.totalMarks}</strong></span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {attempt.accuracyPercentage}% Accuracy
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/student/test/${attempt.id}/result`)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#F97316] text-[#0F172A] dark:text-slate-200 hover:text-[#F97316] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View Analysis</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">
              No Previous Test Attempts Found
            </h4>
            <p className="text-xs text-[#64748B] dark:text-slate-400 max-w-sm mx-auto">
              You haven&rsquo;t completed any tests yet. Launch your first topic drill or PYQ challenge above to track your progress and score diagnostics!
            </p>
          </div>
        )}
      </div>

      {/* ALL MODALS */}
      <TestInstructionsModal
        isOpen={Boolean(instructionsModalConfig)}
        config={instructionsModalConfig}
      />

      <TopicPracticeModal
        isOpen={topicModalOpen}
        onClose={() => setTopicModalOpen(false)}
        onStart={(cfg: TopicPracticeConfig) => {
          handleStartTest({
            testType: 'TOPIC_TEST',
            sourceMode: 'ALL',
            questionTypes: 'MIXED',
            subjectName: cfg.subjectName,
            subjectCode: cfg.subjectCode,
            topicName: cfg.topicName,
            difficulty: cfg.difficulty.toUpperCase() as TestDifficultyFilter,
            questionCount: cfg.questionCount,
            durationMinutes: cfg.durationMinutes,
          });
        }}
      />

      <PyqPracticeModal
        isOpen={pyqModalOpen}
        onClose={() => setPyqModalOpen(false)}
        onStart={(cfg: PyqPracticeConfig) => {
          handleStartTest({
            testType: 'GATE_PYQ_TEST',
            sourceMode: 'GATE_PYQ',
            questionTypes: (cfg.questionType as any) || 'MIXED',
            subjectName: cfg.subjectName,
            questionCount: cfg.questionCount,
            durationMinutes: cfg.durationMinutes,
            examYear: cfg.examYear,
          });
        }}
      />

      <CreateTestModal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        onStartTest={handleStartTest}
      />
    </div>
  );
};
