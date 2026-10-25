import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Menu,
  X,
  Send,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Check,
  Maximize2,
  Minimize2,
  Delete,
  Hash,
  AlertTriangle,
  RefreshCw,
  Eye,
  Info
} from 'lucide-react';
import { TestSessionDTO, StudentTestQuestionDTO, TestResultDTO } from '../../types';
import { AIStudyAssistantDrawer } from '../student/AIStudyAssistantDrawer';
import { MathRenderer } from '../ui/MathRenderer';
import { fetchWithAuth } from '../../api/client';
import { toast } from 'sonner';

interface StudentTestInterfaceProps {
  initialSession?: TestSessionDTO;
  onFinishTest?: (result: TestResultDTO) => void;
  onCancelTest?: () => void;
}

type PaletteState = 'UNVISITED' | 'UNANSWERED' | 'ANSWERED' | 'MARKED' | 'ANSWERED_MARKED';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export const StudentTestInterface: React.FC<StudentTestInterfaceProps> = ({
  initialSession,
  onFinishTest,
  onCancelTest,
}) => {
  const navigate = useNavigate();
  const { sessionId: routeSessionId } = useParams<{ sessionId?: string }>();

  const [session, setSession] = useState<TestSessionDTO | undefined>(initialSession);
  const [loadingSession, setLoadingSession] = useState(!initialSession && Boolean(routeSessionId));
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visited, setVisited] = useState<Record<string, boolean>>({ 0: true });

  const [remainingSeconds, setRemainingSeconds] = useState(initialSession?.remainingSeconds || 1800);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  // Modals & Drawers
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [showPaletteDrawer, setShowPaletteDrawer] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch session with auth header
  useEffect(() => {
    if (initialSession) {
      setSession(initialSession);
      setRemainingSeconds(initialSession.remainingSeconds || 1800);
      return;
    }

    if (routeSessionId) {
      setLoadingSession(true);
      fetchWithAuth(`/api/student/tests/${routeSessionId}`)
        .then((r) => r.json())
        .then((data) => {
          const loaded = data?.session || data?.testSession;
          if (data.success && loaded) {
            setSession(loaded);
            setRemainingSeconds(loaded.remainingSeconds || (loaded.durationMinutes ? loaded.durationMinutes * 60 : 1800));
          } else {
            setSessionError(data.error || 'Failed to load test session.');
          }
        })
        .catch((err) => {
          setSessionError(err.message || 'Error connecting to test server.');
        })
        .finally(() => setLoadingSession(false));
    }
  }, [initialSession, routeSessionId]);

  const questions = session?.questions || [];
  const currentQuestion: StudentTestQuestionDTO | undefined = questions[currentIndex];

  // Initialize existing answers from session payload
  useEffect(() => {
    if (!questions.length) return;
    const initialAnswers: Record<string, string> = {};
    const initialVisited: Record<string, boolean> = { 0: true };

    questions.forEach((q, idx) => {
      if (q.selectedAnswer) {
        initialAnswers[q.id] = q.selectedAnswer;
        initialVisited[idx] = true;
      }
    });

    setAnswers(prev => ({ ...initialAnswers, ...prev }));
    setVisited(prev => ({ ...initialVisited, ...prev }));
  }, [session?.id]);

  // Authoritative countdown timer
  useEffect(() => {
    if (!session?.id) return;
    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.id]);

  // Format timer into HH:MM:SS or MM:SS
  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Live Answer Persistence to Server
  const saveAnswerToServer = async (questionId: string, answerVal: string) => {
    if (!session?.id) return;
    setSaveStatus('saving');
    try {
      const res = await fetchWithAuth(`/api/student/tests/${session.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          answer: answerVal,
          studentId: session.studentId,
          timeTakenSeconds: 5,
        }),
      });
      if (res.ok) {
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  // MCQ Selection Handler
  const handleSelectMcq = (optionId: string) => {
    if (!currentQuestion) return;
    const newAnswers = { ...answers, [currentQuestion.id]: optionId };
    setAnswers(newAnswers);
    saveAnswerToServer(currentQuestion.id, optionId);
  };

  // MSQ Selection Handler
  const handleToggleMsq = (optionId: string) => {
    if (!currentQuestion) return;
    let selected: string[] = [];
    try {
      const existing = answers[currentQuestion.id];
      if (existing) selected = JSON.parse(existing);
    } catch {
      /* empty */
    }

    if (selected.includes(optionId)) {
      selected = selected.filter(id => id !== optionId);
    } else {
      selected.push(optionId);
    }

    const payloadStr = JSON.stringify(selected);
    const newAnswers = { ...answers, [currentQuestion.id]: payloadStr };
    setAnswers(newAnswers);
    saveAnswerToServer(currentQuestion.id, payloadStr);
  };

  // NAT Input Handler
  const handleNatInput = (value: string) => {
    if (!currentQuestion) return;
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    saveAnswerToServer(currentQuestion.id, value);
  };

  // Virtual Keypad Button Press for NAT
  const handleKeypadPress = (val: string) => {
    if (!currentQuestion) return;
    const currentVal = answers[currentQuestion.id] || '';
    let nextVal = currentVal;

    if (val === 'BACKSPACE') {
      nextVal = currentVal.slice(0, -1);
    } else if (val === 'CLEAR') {
      nextVal = '';
    } else if (val === '.') {
      if (!currentVal.includes('.')) {
        nextVal = currentVal === '' ? '0.' : currentVal + '.';
      }
    } else if (val === '-') {
      if (currentVal.startsWith('-')) {
        nextVal = currentVal.substring(1);
      } else {
        nextVal = '-' + currentVal;
      }
    } else {
      nextVal = currentVal + val;
    }

    handleNatInput(nextVal);
  };

  // Clear Response for current question
  const handleClearAnswer = () => {
    if (!currentQuestion) return;
    const updated = { ...answers };
    delete updated[currentQuestion.id];
    setAnswers(updated);
    saveAnswerToServer(currentQuestion.id, '');
  };

  // Toggle Mark for Review
  const handleToggleMarkForReview = () => {
    if (!currentQuestion) return;
    setMarkedForReview(prev => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  // Navigation: Jump to index
  const handleNavigate = (newIdx: number) => {
    if (newIdx >= 0 && newIdx < questions.length) {
      setCurrentIndex(newIdx);
      setVisited(prev => ({ ...prev, [newIdx]: true }));
      setShowPaletteDrawer(false);
    }
  };

  // Save & Next Action
  const handleSaveAndNext = () => {
    if (currentIndex < questions.length - 1) {
      handleNavigate(currentIndex + 1);
    }
  };

  // Mark for Review & Next Action
  const handleMarkAndNext = () => {
    if (currentQuestion) {
      setMarkedForReview(prev => ({
        ...prev,
        [currentQuestion.id]: true,
      }));
    }
    if (currentIndex < questions.length - 1) {
      handleNavigate(currentIndex + 1);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in a text field
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (!currentQuestion) return;

      if (currentQuestion.questionType === 'MCQ') {
        const key = e.key.toUpperCase();
        const optionMap: Record<string, number> = {
          '1': 0, 'A': 0,
          '2': 1, 'B': 1,
          '3': 2, 'C': 2,
          '4': 3, 'D': 3,
        };
        if (optionMap[key] !== undefined && currentQuestion.options[optionMap[key]]) {
          handleSelectMcq(currentQuestion.options[optionMap[key]].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentQuestion, answers]);

  // Final Test Submission
  const handleFinalSubmit = async (isAutoExpire: boolean = false) => {
    if (submitting || !session?.id) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const res = await fetchWithAuth(`/api/student/tests/${session.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: session.studentId }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        if (onFinishTest) {
          onFinishTest(data.result);
        } else {
          navigate(`/student/test/${session.id}/result`);
        }
      } else {
        toast.error(data.error || 'Submission failed. Please retry.');
        setSubmitting(false);
      }
    } catch {
      toast.error('Network error while submitting. Please check connection and retry.');
      setSubmitting(false);
    }
  };

  // Question Palette State Determination (GATE 5-State Standard)
  const getQuestionPaletteState = (index: number, qId: string): PaletteState => {
    const isAns = Boolean(answers[qId] && answers[qId].trim() !== '' && answers[qId] !== '[]');
    const isMarked = Boolean(markedForReview[qId]);

    if (isAns && isMarked) return 'ANSWERED_MARKED';
    if (isMarked) return 'MARKED';
    if (isAns) return 'ANSWERED';
    if (visited[index]) return 'UNANSWERED';
    return 'UNVISITED';
  };

  // Metrics counters for Palette and Summary Dialog
  const answeredCount = Object.keys(answers).filter(k => answers[k] && answers[k].trim() !== '' && answers[k] !== '[]').length;
  const markedOnlyCount = questions.filter((q, idx) => getQuestionPaletteState(idx, q.id) === 'MARKED').length;
  const answeredMarkedCount = questions.filter((q, idx) => getQuestionPaletteState(idx, q.id) === 'ANSWERED_MARKED').length;
  const visitedUnansweredCount = questions.filter((q, idx) => getQuestionPaletteState(idx, q.id) === 'UNANSWERED').length;
  const notVisitedCount = questions.filter((q, idx) => getQuestionPaletteState(idx, q.id) === 'UNVISITED').length;

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-10 h-10 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-300">
          Initializing Authoritative GATE Examination Session...
        </p>
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <AlertCircle className="w-12 h-12 text-[#F97316] mx-auto" />
        <h2 className="text-xl font-bold">Session Not Available</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          {sessionError || 'Test session not found, expired, or unauthorized.'}
        </p>
        <div className="flex gap-3 pt-2">
          <Link
            to="/student/test-dashboard"
            className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-md transition-colors"
          >
            Return to GATE Practice Arena
          </Link>
          <Link
            to="/student"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-colors"
          >
            Student Portal
          </Link>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const currentQPaletteState = getQuestionPaletteState(currentIndex, currentQuestion.id);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0F172A] dark:text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      
      {/* 1. EXAM HEADER */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExitConfirmModal(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#64748B] dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Exit Exam Session"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit Exam</span>
          </button>

          <button
            onClick={() => setShowPaletteDrawer(true)}
            className="lg:hidden p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            aria-label="Toggle Question Palette"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="text-[11px] font-bold text-[#F97316] uppercase tracking-wider flex items-center gap-1.5">
              <span>ShikshaSahayak CBT Simulator</span>
              <span className="hidden md:inline text-slate-400">•</span>
              <span className="hidden md:inline text-[#64748B] dark:text-slate-400 font-medium">
                {session.sourceMode === 'GATE_PYQ' ? 'GATE Exam Simulation' : 'Topic Assessment'}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white truncate max-w-xs sm:max-w-md">
              Question {currentIndex + 1} of {questions.length}
            </div>
          </div>
        </div>

        {/* Live Save Status & Countdown Timer */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Save Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-[#64748B] dark:text-slate-400">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-amber-500">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Check className="w-3 h-3" />
                <span>Saved</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <button
                onClick={() => currentQuestion && saveAnswerToServer(currentQuestion.id, answers[currentQuestion.id] || '')}
                className="flex items-center gap-1 text-rose-500 hover:underline cursor-pointer"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Save failed (Retry)</span>
              </button>
            )}
          </div>

          {/* Timer Display with Accessible Contrast Alerting */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-mono font-bold transition-all ${
              remainingSeconds < 60
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                : remainingSeconds < 300
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-[#0F172A] dark:text-white border-slate-200 dark:border-slate-700'
            }`}
            aria-live="polite"
            aria-label={`Time remaining: ${formatTimer(remainingSeconds)}`}
          >
            <Clock className="w-4 h-4 text-[#F97316]" />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          {/* Submit Test Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Test</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN LAYOUT: QUESTION VIEW + RIGHT PALETTE */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Question & Answer Area (approx 70% width) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 flex flex-col justify-between shadow-2xs">
          <div>
            {/* Question Header & Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between pb-3.5 mb-4 border-b border-slate-200 dark:border-slate-800 gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Question Type Badge */}
                <span className="px-2.5 py-0.5 rounded-md bg-orange-500/10 text-[#F97316] border border-orange-500/20 font-bold">
                  {currentQuestion.questionType === 'MCQ' && 'MCQ (Single Choice)'}
                  {currentQuestion.questionType === 'MSQ' && 'MSQ (Multi-Select Choice)'}
                  {currentQuestion.questionType === 'NAT' && 'NAT (Numerical Answer Type)'}
                </span>

                {/* Section / Subject */}
                {currentQuestion.subjectName && (
                  <span className="text-[#64748B] dark:text-slate-400 font-medium">
                    {currentQuestion.subjectName}
                  </span>
                )}

                {/* Marking info */}
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  +{currentQuestion.marks || 1} Mark
                </span>
                {currentQuestion.negativeMarks > 0 && (
                  <span className="text-rose-600 dark:text-rose-400 font-medium">
                    (-{currentQuestion.negativeMarks} Neg)
                  </span>
                )}
                {currentQuestion.questionType === 'NAT' && (
                  <span className="text-[#64748B] dark:text-slate-400">
                    (No Negative Marking)
                  </span>
                )}
              </div>

              {/* Status Pill & Mark for Review */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleMarkForReview}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    markedForReview[currentQuestion.id]
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500'
                      : 'border-slate-200 dark:border-slate-700 text-[#64748B] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{markedForReview[currentQuestion.id] ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>
              </div>
            </div>

            {/* Question Text with KaTeX Support */}
            <div className="text-sm sm:text-base font-medium text-[#0F172A] dark:text-slate-100 mb-6 leading-relaxed">
              <div className="mb-2 text-xs font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wide">
                Question {currentIndex + 1}:
              </div>
              <MathRenderer content={currentQuestion.questionText} />
            </div>

            {/* Question Diagram / Image (if available) */}
            {currentQuestion.questionImageUrl && (
              <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 relative group max-w-lg">
                <img
                  src={currentQuestion.questionImageUrl}
                  alt={`Question ${currentIndex + 1} Diagram`}
                  className="rounded-lg max-h-72 w-auto object-contain mx-auto"
                />
                <button
                  type="button"
                  onClick={() => setZoomedImage(currentQuestion.questionImageUrl!)}
                  className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-black/70 text-white text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Enlarge Diagram"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Enlarge</span>
                </button>
              </div>
            )}

            {/* 3. ANSWER CONTROLS (MCQ / MSQ / NAT) */}
            <div className="space-y-3 mb-6">
              
              {/* A. SINGLE CHOICE (MCQ) */}
              {currentQuestion.questionType === 'MCQ' && (
                <div className="space-y-2.5">
                  <div className="text-xs text-[#64748B] dark:text-slate-400 font-medium">
                    Choose the single correct option (or press keys 1-4 / A-D):
                  </div>
                  {currentQuestion.options.map((opt, optIdx) => {
                    const isSelected = answers[currentQuestion.id] === opt.id;
                    const letterLabel = String.fromCharCode(65 + optIdx); // A, B, C, D

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectMcq(opt.id)}
                        className={`w-full p-3.5 sm:p-4 rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer group ${
                          isSelected
                            ? 'bg-orange-500/10 text-orange-950 dark:text-orange-200 border-[#F97316] ring-1 ring-[#F97316]'
                            : 'bg-white dark:bg-slate-900/60 text-[#0F172A] dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isSelected
                                ? 'bg-[#F97316] text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-[#64748B] dark:text-slate-400 group-hover:bg-slate-200'
                            }`}
                          >
                            {letterLabel}
                          </span>
                          <div className="text-xs sm:text-sm pt-0.5 leading-relaxed">
                            <MathRenderer content={opt.text} inline />
                          </div>
                        </div>

                        <div className="shrink-0 ml-3">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-[#F97316] bg-[#F97316]'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* B. MULTI-SELECT (MSQ) */}
              {currentQuestion.questionType === 'MSQ' && (
                <div className="space-y-2.5">
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    Multiple options may be correct. Select all that apply:
                  </div>
                  {currentQuestion.options.map((opt, optIdx) => {
                    let selectedList: string[] = [];
                    try {
                      if (answers[currentQuestion.id]) selectedList = JSON.parse(answers[currentQuestion.id]);
                    } catch {
                      /* empty */
                    }
                    const isChecked = selectedList.includes(opt.id);
                    const letterLabel = String.fromCharCode(65 + optIdx);

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleToggleMsq(opt.id)}
                        className={`w-full p-3.5 sm:p-4 rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer group ${
                          isChecked
                            ? 'bg-purple-500/10 text-purple-950 dark:text-purple-200 border-purple-500 ring-1 ring-purple-500'
                            : 'bg-white dark:bg-slate-900/60 text-[#0F172A] dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isChecked
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-[#64748B] dark:text-slate-400'
                            }`}
                          >
                            {letterLabel}
                          </span>
                          <div className="text-xs sm:text-sm pt-0.5 leading-relaxed">
                            <MathRenderer content={opt.text} inline />
                          </div>
                        </div>

                        <div className="shrink-0 ml-3">
                          <div
                            className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${
                              isChecked
                                ? 'border-purple-600 bg-purple-600 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* C. NUMERICAL ANSWER TYPE (NAT) WITH VIRTUAL KEYPAD */}
              {currentQuestion.questionType === 'NAT' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <label htmlFor="nat-input" className="block text-xs font-bold text-[#0F172A] dark:text-white">
                      Enter Numerical Value:
                    </label>
                    <input
                      id="nat-input"
                      type="text"
                      inputMode="decimal"
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleNatInput(e.target.value)}
                      placeholder="e.g. 24.5 or -3"
                      className="w-full max-w-sm px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-lg font-mono font-bold text-[#0F172A] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#F97316]"
                    />
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                      Enter the precise number or decimal value matching the accepted range. (Physical keyboard or CBT virtual keypad below).
                    </p>
                  </div>

                  {/* Virtual CBT Numeric Keypad */}
                  <div className="max-w-xs p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-2">
                      On-Screen Virtual Keypad
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['7', '8', '9', 'BACKSPACE', '4', '5', '6', '-', '1', '2', '3', '.', '0', 'CLEAR'].map((btn) => (
                        <button
                          key={btn}
                          type="button"
                          onClick={() => handleKeypadPress(btn)}
                          className={`py-2 px-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                            btn === 'CLEAR'
                              ? 'col-span-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900'
                              : btn === 'BACKSPACE'
                              ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                              : 'bg-white hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0F172A] dark:text-white border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {btn === 'BACKSPACE' ? '⌫' : btn}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. BOTTOM PERSISTENT NAVIGATION BAR */}
          <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearAnswer}
                disabled={!answers[currentQuestion.id]}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold text-[#64748B] dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Response</span>
              </button>
              
              <button
                type="button"
                onClick={handleMarkAndNext}
                className="px-3.5 py-2 rounded-xl border border-purple-300 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Mark for Review &amp; Next</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleNavigate(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold text-[#0F172A] dark:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndNext}
                className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                <span>Save &amp; Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Question Palette Sidebar (Desktop) ~30% */}
        <div className="hidden lg:flex lg:col-span-4 flex-col justify-between bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A] dark:text-white">
                Question Palette
              </h3>
              <span className="text-[11px] text-[#64748B] dark:text-slate-400">
                {questions.length} Questions
              </span>
            </div>

            {/* Compact Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  {answeredCount}
                </span>
                <span className="text-[#64748B] dark:text-slate-300">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-rose-600 text-white font-bold flex items-center justify-center text-xs">
                  {visitedUnansweredCount}
                </span>
                <span className="text-[#64748B] dark:text-slate-300">Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                  {markedOnlyCount}
                </span>
                <span className="text-[#64748B] dark:text-slate-300">Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs">
                  {notVisitedCount}
                </span>
                <span className="text-[#64748B] dark:text-slate-300">Not Visited</span>
              </div>
              <div className="col-span-2 flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <span className="w-6 h-6 rounded-md bg-purple-600 text-white font-bold flex items-center justify-center text-xs relative">
                  {answeredMarkedCount}
                  <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-1 ring-white" />
                </span>
                <span className="text-[#64748B] dark:text-slate-300 text-[10px]">
                  Answered &amp; Marked for Review (Evaluated)
                </span>
              </div>
            </div>

            {/* Question Palette Number Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const state = getQuestionPaletteState(idx, q.id);
                let btnStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                if (state === 'ANSWERED') {
                  btnStyle = 'bg-emerald-600 text-white border-emerald-600 shadow-2xs';
                } else if (state === 'UNANSWERED') {
                  btnStyle = 'bg-rose-600 text-white border-rose-600 shadow-2xs';
                } else if (state === 'MARKED') {
                  btnStyle = 'bg-purple-600 text-white border-purple-600 shadow-2xs';
                } else if (state === 'ANSWERED_MARKED') {
                  btnStyle = 'bg-purple-600 text-white border-purple-600 shadow-2xs';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleNavigate(idx)}
                    className={`h-9 rounded-lg border text-xs font-bold transition-all relative flex items-center justify-center cursor-pointer ${btnStyle} ${
                      currentIndex === idx ? 'ring-2 ring-[#F97316] ring-offset-1' : ''
                    }`}
                    aria-label={`Question ${idx + 1}, status: ${state}`}
                  >
                    {idx + 1}
                    {state === 'ANSWERED_MARKED' && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Submit Block */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Entire Examination</span>
            </button>
          </div>
        </div>
      </main>

      {/* MOBILE QUESTION PALETTE DRAWER */}
      {showPaletteDrawer && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/80 backdrop-blur-xs lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-[#0F172A] w-full max-w-xs h-full p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                  Question Palette ({questions.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPaletteDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Breakdown Legend */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                    {answeredCount}
                  </span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-rose-600 text-white font-bold flex items-center justify-center text-[10px]">
                    {visitedUnansweredCount}
                  </span>
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-purple-600 text-white font-bold flex items-center justify-center text-[10px]">
                    {markedOnlyCount}
                  </span>
                  <span>Marked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[10px]">
                    {notVisitedCount}
                  </span>
                  <span>Not Visited</span>
                </div>
              </div>

              {/* Number Grid */}
              <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                {questions.map((q, idx) => {
                  const state = getQuestionPaletteState(idx, q.id);
                  let btnStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';

                  if (state === 'ANSWERED') btnStyle = 'bg-emerald-600 text-white';
                  else if (state === 'UNANSWERED') btnStyle = 'bg-rose-600 text-white';
                  else if (state === 'MARKED' || state === 'ANSWERED_MARKED') btnStyle = 'bg-purple-600 text-white';

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleNavigate(idx)}
                      className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${btnStyle} ${
                        currentIndex === idx ? 'ring-2 ring-[#F97316]' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowPaletteDrawer(false);
                  setShowConfirmModal(true);
                }}
                className="w-full py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold"
              >
                Submit Examination
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSION CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-dialog-title"
        >
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 id="submit-dialog-title" className="text-lg font-bold text-[#0F172A] dark:text-white">
                Submit Examination
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                Please review your question response summary before final evaluation. Answers cannot be modified once submitted.
              </p>
            </div>

            {/* Summary Breakdown Table */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-[#64748B] dark:text-slate-400">
                <span>Total Questions:</span>
                <span className="font-bold text-[#0F172A] dark:text-white">{questions.length}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Answered:</span>
                <span>{answeredCount}</span>
              </div>
              <div className="flex justify-between items-center text-rose-600 dark:text-rose-400 font-semibold">
                <span>Visited but Not Answered:</span>
                <span>{visitedUnansweredCount}</span>
              </div>
              <div className="flex justify-between items-center text-purple-600 dark:text-purple-400 font-semibold">
                <span>Marked for Review:</span>
                <span>{markedOnlyCount + answeredMarkedCount}</span>
              </div>
              <div className="flex justify-between items-center text-[#64748B] dark:text-slate-400">
                <span>Not Visited:</span>
                <span>{notVisitedCount}</span>
              </div>
            </div>

            {visitedUnansweredCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>You have {visitedUnansweredCount} unanswered question(s). You can return to the test to answer them.</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[#64748B] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                Back to Test
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] disabled:bg-slate-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXIT EXAM CONFIRMATION MODAL */}
      {showExitConfirmModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#F97316]" />
              <span>Exit Examination Session?</span>
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-300 leading-relaxed">
              Your answered questions have been saved on the server. You can resume this session later from the Practice Dashboard while the timer permits.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[#64748B] dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Continue Exam
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirmModal(false);
                  if (onCancelTest) {
                    onCancelTest();
                  } else {
                    navigate('/student/test-dashboard');
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
              >
                Exit to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIAGRAM LIGHTBOX MODAL */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={zoomedImage}
              alt="Zoomed Question Diagram"
              className="max-h-[85vh] max-w-full rounded-xl object-contain mx-auto shadow-2xl"
            />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
