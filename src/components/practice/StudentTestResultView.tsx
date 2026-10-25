import React, { useState, useMemo, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RotateCcw,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
  Layers,
  Filter,
  Target,
  FileText,
  TrendingUp,
  AlertTriangle,
  Check,
  Flag,
  Share2
} from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { TestResultDTO, TestGenerationConfig } from '../../types';
import { PortalReturnBar } from '../navigation/PortalReturnBar';
import { MathRenderer } from '../ui/MathRenderer';
import { fetchWithAuth, apiClient } from '../../api/client';
import { toast } from 'sonner';

interface StudentTestResultViewProps {
  result?: TestResultDTO;
  onBackToDashboard?: () => void;
  onRetryTest?: (config: TestGenerationConfig) => void;
}

export const StudentTestResultView: React.FC<StudentTestResultViewProps> = ({
  result: initialResult,
  onBackToDashboard,
  onRetryTest,
}) => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId?: string }>();
  const [result, setResult] = useState<TestResultDTO | undefined>(initialResult);
  const [loading, setLoading] = useState(!initialResult && Boolean(sessionId));
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'INCORRECT' | 'UNANSWERED' | 'CORRECT'>('ALL');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (initialResult) {
      setResult(initialResult);
      return;
    }
    if (sessionId) {
      setLoading(true);
      fetchWithAuth(`/api/student/tests/${sessionId}/result`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.result) {
            setResult(data.result);
          } else {
            setError(data.error || 'Test result not found for this session.');
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to load test result.');
        })
        .finally(() => setLoading(false));
    }
  }, [initialResult, sessionId]);

  const handleBack = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else {
      navigate('/student/test-dashboard');
    }
  };

  const isPassed = (result?.percentage || 0) >= 50;
  const isHighScorer = (result?.percentage || 0) >= 75;

  // Filtered review questions
  const filteredQuestions = useMemo(() => {
    if (!result?.questionResults) return [];
    return result.questionResults.filter((q) => {
      if (filterMode === 'INCORRECT') return !q.isCorrect && Boolean(q.selectedAnswer);
      if (filterMode === 'UNANSWERED') return !q.selectedAnswer;
      if (filterMode === 'CORRECT') return q.isCorrect;
      return true;
    });
  }, [result?.questionResults, filterMode]);

  // Weak topics (< 50% accuracy)
  const weakTopics = useMemo(() => {
    if (!result?.topicWisePerformance) return [];
    return result.topicWisePerformance.filter((t) => t.accuracyPercentage < 50);
  }, [result?.topicWisePerformance]);

  // Retry Entire Test with new session
  const handleRetryAll = async () => {
    if (!result) return;
    setRetrying(true);
    try {
      const res = await apiClient.createPracticeSession({
        questionCount: result.totalQuestions,
        durationMinutes: Math.max(5, Math.ceil(result.timeTakenSeconds / 60)),
        sourceMode: 'ALL',
        practiceMode: 'RANDOM',
      });
      const newSessionId = res?.data?.sessionId || res?.data?.session?.id;
      if (newSessionId) {
        navigate(`/student/test/${newSessionId}`);
      } else {
        toast.error('Failed to create retry session.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Could not start retry session.');
    } finally {
      setRetrying(false);
    }
  };

  // Practice Weak Topic
  const handlePracticeWeakTopic = async (topicName: string) => {
    setRetrying(true);
    try {
      const res = await apiClient.createPracticeSession({
        questionCount: 10,
        durationMinutes: 15,
        topicName,
        sourceMode: 'ALL',
        practiceMode: 'TOPIC_WISE',
      });
      const newSessionId = res?.data?.sessionId || res?.data?.session?.id;
      if (newSessionId) {
        navigate(`/student/test/${newSessionId}`);
      } else {
        toast.error('Failed to create topic practice session.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Could not start topic session.');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 py-10 px-4 text-center">
        <PortalReturnBar
          crumbs={[
            { label: 'GATE Practice', path: '/student/test-dashboard' },
            { label: 'Test Results' },
          ]}
          fallbackPath="/student/test-dashboard"
        />
        <div className="p-12 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 shadow-2xs">
          <div className="w-10 h-10 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#0F172A] dark:text-slate-300 font-medium">
            Computing Server-Graded Performance Analytics...
          </p>
        </div>
      </div>
    );
  }

  if (!result || error) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 py-10 px-4 text-center">
        <PortalReturnBar
          crumbs={[
            { label: 'GATE Practice', path: '/student/test-dashboard' },
            { label: 'Test Results' },
          ]}
          fallbackPath="/student/test-dashboard"
        />
        <div className="p-12 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
          <AlertCircle className="w-10 h-10 text-[#F97316] mx-auto" />
          <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Test Result Not Found</h2>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 max-w-md mx-auto">
            {error || 'No active or completed evaluation record was found for this session ID.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/student/test-dashboard"
              className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-md transition-colors"
            >
              Return to GATE Practice
            </Link>
            <Link
              to="/student"
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0F172A] dark:text-slate-200 font-bold text-xs transition-colors"
            >
              Student Portal Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const attemptedCount = result.correctCount + result.incorrectCount;
  const timeMins = Math.floor(result.timeTakenSeconds / 60);
  const timeSecs = result.timeTakenSeconds % 60;

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4 sm:px-6 text-[#0F172A] dark:text-slate-100">
      
      {/* Top Portal Navigation Breadcrumbs */}
      <PortalReturnBar
        crumbs={[
          { label: 'GATE Practice', path: '/student/test-dashboard' },
          { label: 'Results & Performance Analysis' },
        ]}
        fallbackPath="/student/test-dashboard"
      />

      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-xs font-semibold text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Practice Dashboard</span>
        </button>

        <span className="text-xs text-[#64748B] dark:text-slate-400">
          Session ID: <span className="font-mono">{result.testSessionId}</span>
        </span>
      </div>

      {/* A. PERFORMANCE SUMMARY HERO CARD */}
      <div className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 shadow-xs ${
        isHighScorer
          ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-white dark:to-[#0F172A] border-emerald-500/30'
          : isPassed
          ? 'bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-white dark:to-[#0F172A] border-[#F97316]/30'
          : 'bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-white dark:to-[#0F172A] border-rose-500/30'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#0F172A] dark:text-white shadow-2xs">
                {isHighScorer ? 'Distinction Standard' : isPassed ? 'Benchmark Achieved' : 'Practice Recommended'}
              </span>
              <span className="text-xs text-[#64748B] dark:text-slate-400">
                Authoritative Server Evaluation
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] dark:text-white tracking-tight">
              {isHighScorer
                ? 'Outstanding Examination Performance!'
                : isPassed
                ? 'Test Completed with Solid Proficiency!'
                : 'Test Attempt Completed — Targeted Practice Recommended'}
            </h1>

            <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-300">
              Total Score: <strong className="text-[#0F172A] dark:text-white">{result.score.toFixed(2)} / {result.totalMarks}</strong> ({result.percentage.toFixed(1)}%) •
              Overall Accuracy: <strong className="text-emerald-600 dark:text-emerald-400">{result.accuracyPercentage.toFixed(1)}%</strong> •
              Attempted: <strong className="text-[#0F172A] dark:text-white">{attemptedCount} / {result.totalQuestions} Questions</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleRetryAll}
              disabled={retrying}
              className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] disabled:bg-slate-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{retrying ? 'Starting Retry...' : 'Retry Test Session'}</span>
            </button>
            <a
              href="#solution-review"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#0F172A] dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Review Solutions</span>
            </a>
          </div>
        </div>
      </div>

      {/* METRICS COUNTER TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Correct Answers */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#64748B] dark:text-slate-400 font-medium">Correct Answers</div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {result.correctCount} / {result.totalQuestions}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Verified Correct</div>
          </div>
        </div>

        {/* Incorrect Answers */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#64748B] dark:text-slate-400 font-medium">Incorrect Answers</div>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400">
              {result.incorrectCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Penalized Negative Marks</div>
          </div>
        </div>

        {/* Unanswered */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-[#64748B] dark:text-slate-400 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#64748B] dark:text-slate-400 font-medium">Skipped / Unanswered</div>
            <div className="text-xl font-black text-[#0F172A] dark:text-white">
              {result.unansweredCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Zero Negative Marks</div>
          </div>
        </div>

        {/* Time Spent */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#64748B] dark:text-slate-400 font-medium">Time Taken</div>
            <div className="text-xl font-black text-[#0F172A] dark:text-white">
              {timeMins}m {timeSecs}s
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Total Duration</div>
          </div>
        </div>
      </div>

      {/* B. VISUAL ANALYTICS SECTION (Topic-Wise, Difficulty, Source) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Topic-Wise Accuracy & Weak Areas Chart */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#F97316]" />
              <h2 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">
                Topic-Wise Accuracy Breakdown
              </h2>
            </div>
            <span className="text-[11px] text-[#64748B] dark:text-slate-400">
              {result.topicWisePerformance?.length || 0} Topics Evaluated
            </span>
          </div>

          {result.topicWisePerformance && result.topicWisePerformance.length > 0 ? (
            <div className="space-y-4">
              {result.topicWisePerformance.map((t, idx) => {
                const isWeak = t.accuracyPercentage < 50;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0F172A] dark:text-white truncate max-w-xs">
                        {t.topicName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#64748B] dark:text-slate-400">
                          {t.correct}/{t.total} ({t.accuracyPercentage}%)
                        </span>
                        {isWeak && (
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                            Weak Area
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Meter Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          t.accuracyPercentage >= 75
                            ? 'bg-emerald-500'
                            : t.accuracyPercentage >= 50
                            ? 'bg-[#F97316]'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(5, t.accuracyPercentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#64748B] dark:text-slate-400">No topic performance records available.</p>
          )}

          {/* Weak Topic Remediation Callout */}
          {weakTopics.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-xs text-rose-900 dark:text-rose-200 font-medium">
                  Weak topics detected: <strong>{weakTopics.map(w => w.topicName).join(', ')}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => handlePracticeWeakTopic(weakTopics[0].topicName)}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
              >
                Practice Weak Area
              </button>
            </div>
          )}
        </div>

        {/* Difficulty & Source Performance Breakdown */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-6">
          {/* Difficulty Chart */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white uppercase tracking-wider">
                  Difficulty Level Performance
                </h3>
              </div>
            </div>

            {result.difficultyWisePerformance && result.difficultyWisePerformance.length > 0 ? (
              <div className="space-y-3">
                {result.difficultyWisePerformance.map((d, idx) => {
                  const acc = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="capitalize text-[#0F172A] dark:text-white">{d.difficulty} Questions</span>
                        <span className="text-[#64748B] dark:text-slate-400">
                          {d.correct} / {d.total} Correct ({acc}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${Math.max(4, acc)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#64748B] dark:text-slate-400">Difficulty analytics unavailable.</p>
            )}
          </div>

          {/* Source Provenance Performance */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">
              Question Provenance Breakdown
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {result.sourceWisePerformance && result.sourceWisePerformance.length > 0 ? (
                result.sourceWisePerformance.map((s, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-bold uppercase truncate">
                      {s.source}
                    </span>
                    <span className="text-base font-black text-[#0F172A] dark:text-white mt-0.5 block">
                      {s.correct} / {s.total}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {s.total > 0 ? `${Math.round((s.correct / s.total) * 100)}% accuracy` : '0%'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#64748B] dark:text-slate-400 col-span-2">Standard Practice</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* C. QUESTION-BY-QUESTION REVIEW & SOLUTIONS */}
      <div id="solution-review" className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#F97316]" />
              <span>Question Solutions &amp; Technical Review</span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Detailed step-by-step solutions with KaTeX mathematical formulas
            </p>
          </div>

          {/* Interactive Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: `All (${result.totalQuestions})` },
              { id: 'INCORRECT', label: `Incorrect (${result.incorrectCount})` },
              { id: 'UNANSWERED', label: `Skipped (${result.unansweredCount})` },
              { id: 'CORRECT', label: `Correct (${result.correctCount})` },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterMode(pill.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  filterMode === pill.id
                    ? 'bg-[#F97316] text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question Solutions List */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 text-center text-[#64748B] dark:text-slate-400 text-xs">
              No questions found under the <strong>{filterMode.toLowerCase()}</strong> filter.
            </div>
          ) : (
            filteredQuestions.map((q, idx) => (
              <div
                key={q.questionId}
                className={`rounded-2xl p-5 sm:p-6 space-y-4 bg-white dark:bg-[#0F172A] border transition-all shadow-2xs ${
                  q.isCorrect
                    ? 'border-emerald-500/30 dark:border-emerald-500/20'
                    : q.selectedAnswer
                    ? 'border-rose-500/30 dark:border-rose-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Question Header & Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-[#0F172A] dark:text-white">
                      Q{q.sequenceNumber || idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[#64748B] dark:text-slate-300 font-bold">
                      {q.questionType}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-[#F97316] border border-orange-500/20 font-bold">
                      {q.sourceLabel}
                    </span>
                    {q.topicName && (
                      <span className="text-[#64748B] dark:text-slate-400">
                        • {q.topicName}
                      </span>
                    )}
                  </div>

                  {/* Marks & Status Badge */}
                  <div>
                    {q.isCorrect ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Correct (+{q.marksObtained})</span>
                      </span>
                    ) : q.selectedAnswer ? (
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Incorrect ({q.marksObtained})</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Unanswered (0)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Statement with KaTeX */}
                <div className="text-sm sm:text-base font-medium text-[#0F172A] dark:text-slate-100 leading-relaxed">
                  <MathRenderer content={q.questionText} />
                </div>

                {/* Student's Answer vs Official Answer Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Your Answer */}
                  <div className={`p-3.5 rounded-xl border ${
                    q.isCorrect
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                      : q.selectedAnswer
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                  }`}>
                    <span className="text-[#64748B] dark:text-slate-400 font-semibold block mb-1">
                      Your Selected Response:
                    </span>
                    <span className={`font-mono font-bold text-sm ${
                      q.isCorrect ? 'text-emerald-700 dark:text-emerald-300' : q.selectedAnswer ? 'text-rose-700 dark:text-rose-300' : 'text-slate-500'
                    }`}>
                      {q.selectedAnswer || 'Not Answered (Skipped)'}
                    </span>
                  </div>

                  {/* Official Answer */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                    <span className="text-emerald-800 dark:text-emerald-400 font-semibold block mb-1">
                      Official Evaluated Key:
                    </span>
                    <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300">
                      {q.correctAnswer}
                    </span>
                  </div>
                </div>

                {/* Technical Explanation & Steps */}
                {q.explanation && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2.5">
                    <div className="font-bold text-[#F97316] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Technical Solution &amp; Conceptual Explanation:</span>
                    </div>

                    <div className="text-[#0F172A] dark:text-slate-300 leading-relaxed font-sans">
                      <MathRenderer content={q.explanation} />
                    </div>

                    {q.stepByStepSolution && q.stepByStepSolution.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="font-bold text-[#64748B] dark:text-slate-400 text-[11px]">
                          Step-by-step derivation:
                        </div>
                        {q.stepByStepSolution.map((step, sIdx) => (
                          <div key={sIdx} className="text-[#64748B] dark:text-slate-400 font-mono text-[11px] flex items-start gap-1.5">
                            <span className="text-[#F97316]">•</span>
                            <MathRenderer content={step} inline />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* D. NEXT ACTIONS FOOTER BAR */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
            Ready to Continue Practicing?
          </h3>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
            Strengthen your weak areas with targeted drills or start another mock exam.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {weakTopics.length > 0 && (
            <button
              onClick={() => handlePracticeWeakTopic(weakTopics[0].topicName)}
              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-bold transition-colors cursor-pointer"
            >
              Practice {weakTopics[0].topicName}
            </button>
          )}

          <button
            onClick={() => navigate('/student/test-dashboard')}
            className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer"
          >
            Start Another Test
          </button>
        </div>
      </div>

    </div>
  );
};
