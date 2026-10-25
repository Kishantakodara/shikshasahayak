import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  RotateCcw, 
  Award,
  Check,
  Loader2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useStudentAcademic } from '../../context/StudentAcademicContext';

interface QuestionOption {
  id: string;
  text: string;
}

interface PracticeQuestion {
  id: string;
  sequenceNumber: number;
  questionText: string;
  questionHtml?: string | null;
  options: QuestionOption[];
  difficulty: string;
  marks: number;
  subjectName: string;
  subjectCode?: string | null;
  topicName?: string | null;
}

interface ServerReviewItem {
  questionId: string;
  questionText: string;
  options: QuestionOption[];
  selectedOptionId: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  isAttempted: boolean;
  explanation: string;
  stepByStepSolution?: string[];
  subjectName: string;
  topicName?: string | null;
  marks: number;
}

interface ServerEvaluationResult {
  sessionId: string;
  score: number;
  totalMarks: number;
  accuracy: number;
  totalQuestions: number;
  attemptedCount: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  timeTakenSeconds: number;
  review: ServerReviewItem[];
}

export const PracticeExamPage: React.FC = () => {
  const navigate = useNavigate();
  const { academicProfile } = useStudentAcademic();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timerSeconds, setTimerSeconds] = useState(45);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<ServerEvaluationResult | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Initialize practice session from server
  const startSession = async () => {
    setLoading(true);
    setError(null);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsFinished(false);
    setEvaluationResult(null);
    setTotalElapsedSeconds(0);

    try {
      const res = await apiClient.createPracticeSession({
        branchId: (academicProfile as any)?.branchCode || academicProfile?.branchId || 'computer-engineering',
        semester: academicProfile?.semester || 3,
        questionCount: 10,
        practiceMode: 'RANDOM',
      });

      if (res?.success && res.data?.questions && res.data.questions.length > 0) {
        setSessionId(res.data.sessionId);
        setQuestions(res.data.questions);
      } else {
        setError('No practice questions available for this subject at the moment.');
      }
    } catch (err: any) {
      console.error('Failed to create practice session:', err);
      setError(err?.message || 'Could not start practice test session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startSession();
  }, []);

  // Timer loop
  useEffect(() => {
    if (isFinished || loading) return;
    const interval = setInterval(() => {
      setTotalElapsedSeconds((prev) => prev + 1);
      setTimerSeconds((prev) => {
        if (prev <= 1) return 45;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, isFinished, loading]);

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;

  const handleSelectOption = (key: string) => {
    if (!currentQ) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: key }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimerSeconds(45);
    } else {
      handleSubmitExam();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setTimerSeconds(45);
    }
  };

  const handleSubmitExam = async () => {
    if (!sessionId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const answersPayload = questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: selectedAnswers[q.id] || '',
        timeTakenSeconds: Math.round(totalElapsedSeconds / Math.max(1, questions.length)),
      }));

      const res = await apiClient.submitPracticeSession({
        sessionId,
        answers: answersPayload,
        totalTimeSeconds: totalElapsedSeconds,
      });

      if (res?.success && res.data) {
        setEvaluationResult(res.data);
        setIsFinished(true);
      } else {
        alert('Failed to evaluate practice session.');
      }
    } catch (err: any) {
      alert(err.message || 'Error evaluating test session');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D1A] text-[#0F172A] dark:text-white flex flex-col justify-between selection:bg-orange-100">
      
      {/* TOP BAR: Examination header */}
      <header className="h-16 px-4 sm:px-8 border-b border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0F172A] flex items-center justify-between sticky top-0 z-30">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#F97316]">
            GTU Practice Engine
          </span>
          <h2 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white truncate">
            {currentQ?.subjectName || 'Engineering Practice Test'}
          </h2>
        </div>

        {/* Center: Question Counter */}
        {totalQuestions > 0 && !isFinished && (
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white">
              Question {currentIndex + 1} / {totalQuestions}
            </span>
            <div className="hidden sm:flex items-center gap-1">
              {questions.map((q, idx) => (
                <span
                  key={q.id}
                  className={`w-2 h-2 rounded-full ${
                    idx === currentIndex
                      ? 'bg-[#F97316]'
                      : selectedAnswers[q.id]
                      ? 'bg-emerald-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Right: Timer & Exit Button */}
        <div className="flex items-center gap-4">
          {!isFinished && (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
              timerSeconds <= 15
                ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-[#0F172A] dark:text-white border-slate-200 dark:border-slate-700'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>00:{timerSeconds.toString().padStart(2, '0')}</span>
            </div>
          )}

          <button
            onClick={() => setShowExitConfirm(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Exit Exam"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* MAIN QUESTION CANVAS */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col justify-center">
        {loading && (
          <div className="text-center py-16 space-y-3">
            <Loader2 className="w-8 h-8 text-[#F97316] animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Generating secure practice test from GTU Question Bank...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-6 text-center space-y-4 max-w-md mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-xs sm:text-sm font-semibold text-red-800 dark:text-red-300">{error}</p>
            <button
              onClick={startSession}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {!loading && !error && !isFinished && currentQ && (
          <div className="space-y-6">
            
            {/* Question Text */}
            <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Question {currentIndex + 1} • {currentQ.marks} {currentQ.marks === 1 ? 'Mark' : 'Marks'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/10 text-[#F97316] uppercase">
                  {currentQ.difficulty}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white leading-relaxed">
                {currentQ.questionText}
              </h3>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQ.options.map((option, idx) => {
                const optionKey = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
                const isSelected = selectedAnswers[currentQ.id] === option.id || selectedAnswers[currentQ.id] === optionKey;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'border-[#F97316] bg-orange-500/10 text-[#0F172A] dark:text-white shadow-2xs'
                        : 'border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0F172A] hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#F97316] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-[#64748B] group-hover:text-[#0F172A] dark:group-hover:text-white'
                      }`}>
                        {optionKey}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold">
                        {option.text}
                      </span>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-[#F97316] bg-[#F97316] text-white'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        )}

        {/* SERVER EVALUATED EXAM RESULT VIEW */}
        {isFinished && evaluationResult && (
          <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-6 sm:p-8 text-center max-w-2xl mx-auto shadow-xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#0F172A] dark:text-white">Practice Session Verified!</h2>
              <p className="text-xs text-[#64748B] mt-1">
                Score evaluated server-side • Progress synchronized with your academic profile
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-[#E2E8F0] dark:border-slate-800">
              <div>
                <p className="text-2xl font-black text-emerald-600">{evaluationResult.accuracy}%</p>
                <p className="text-[10px] text-[#64748B] uppercase font-bold mt-0.5">Accuracy</p>
              </div>
              <div>
                <p className="text-2xl font-black text-[#F97316]">{evaluationResult.score} / {evaluationResult.totalMarks}</p>
                <p className="text-[10px] text-[#64748B] uppercase font-bold mt-0.5">Score</p>
              </div>
              <div>
                <p className="text-2xl font-black text-blue-600">+{evaluationResult.correctCount * 10} XP</p>
                <p className="text-[10px] text-[#64748B] uppercase font-bold mt-0.5">Earned XP</p>
              </div>
            </div>

            {/* Questions Review & Explanations */}
            <div className="text-left space-y-4 pt-2">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">Question Review & Solutions</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {evaluationResult.review.map((item, idx) => (
                  <div 
                    key={item.questionId || idx}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      item.isCorrect
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A] dark:text-white">Q{idx + 1}. {item.questionText}</span>
                      {item.isCorrect ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Correct
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-extrabold flex items-center gap-1 shrink-0">
                          <X className="w-3 h-3" /> {item.isAttempted ? 'Incorrect' : 'Skipped'}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[#64748B]">
                      Correct Answer: <strong className="text-emerald-600 dark:text-emerald-400">{item.correctAnswer}</strong>
                    </p>

                    {item.explanation && (
                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 leading-relaxed">
                        <span className="font-bold text-[#0F172A] dark:text-white">Explanation: </span>
                        {item.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={startSession}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-[#0F172A] dark:text-white hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Another Set</span>
              </button>
              <button
                onClick={() => navigate('/student')}
                className="flex-1 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition-colors shadow-xs"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM BAR: Navigation & Live controls */}
      {!loading && !error && !isFinished && (
        <footer className="h-16 px-4 sm:px-8 border-t border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#0F172A] flex items-center justify-between sticky bottom-0 z-30">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'text-[#0F172A] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="hidden sm:flex items-center gap-4 text-xs font-bold text-[#64748B]">
            <span>Answered: {Object.keys(selectedAnswers).length} / {totalQuestions}</span>
            <span>•</span>
            <span className="text-[#F97316]">Time: {Math.floor(totalElapsedSeconds / 60)}m {totalElapsedSeconds % 60}s</span>
          </div>

          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <span>{currentIndex < totalQuestions - 1 ? 'Next' : 'Submit Exam'}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </footer>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-[#0F172A] dark:text-white">Exit Practice Exam?</h3>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              Your test session will be saved. Are you sure you want to exit?
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Continue Test
              </button>
              <button
                onClick={() => navigate('/student')}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Exit Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PracticeExamPage;
