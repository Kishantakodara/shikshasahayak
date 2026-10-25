import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Bookmark,
  Sparkles,
  Clock,
  ChevronRight,
  RotateCcw,
  HelpCircle,
  Trophy,
  Target,
  Award,
  AlertCircle,
  Filter,
  Flame,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { StudentMcqQuestionDTO, StudentMcqAnswerEvaluation, McqPracticeFilterParams } from '../../types';
import { studentMcqClient } from '../../api/studentMcqClient';
import { toast } from 'sonner';

interface StudentMcqPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilters?: McqPracticeFilterParams;
  subjectTitle?: string;
}

export const StudentMcqPracticeModal: React.FC<StudentMcqPracticeModalProps> = ({
  isOpen,
  onClose,
  initialFilters,
  subjectTitle,
}) => {
  const [questions, setQuestions] = useState<StudentMcqQuestionDTO[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<StudentMcqAnswerEvaluation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [difficultyFilter, setDifficultyFilter] = useState<string>(initialFilters?.difficulty || 'ALL');
  const [sourceFilter, setSourceFilter] = useState<string>(initialFilters?.sourceMode || 'ALL');

  // Bookmarking state
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});

  // Performance / Stats tracking for the session
  const [sessionResults, setSessionResults] = useState<
    Array<{
      question: StudentMcqQuestionDTO;
      selectedOption: string;
      isCorrect: boolean;
      evaluation: StudentMcqAnswerEvaluation;
    }>
  >([]);
  const [isFinished, setIsFinished] = useState(false);
  const [timeSeconds, setTimeSeconds] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadQuestions();
      setTimeSeconds(0);
      timerRef.current = setInterval(() => {
        setTimeSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, difficultyFilter, sourceFilter]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    setSelectedOptionId(null);
    setEvaluation(null);
    setCurrentIndex(0);
    setSessionResults([]);
    setIsFinished(false);

    try {
      const params: McqPracticeFilterParams = {
        ...initialFilters,
        limit: 15,
        difficulty: difficultyFilter !== 'ALL' ? (difficultyFilter as any) : undefined,
        sourceMode: sourceFilter !== 'ALL' ? (sourceFilter as any) : undefined,
        mode: 'RANDOM',
      };

      const res = await studentMcqClient.getPracticeQuestions(params);
      setQuestions(res.questions || []);

      // Build initial bookmark map
      const bMap: Record<string, boolean> = {};
      (res.questions || []).forEach((q) => {
        if (q.isBookmarked) bMap[q.id] = true;
      });
      setBookmarkedMap(bMap);
    } catch (err: any) {
      setError(err.message || 'Failed to load practice questions');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (optionId: string) => {
    if (evaluation) return; // Prevent changing after submission
    setSelectedOptionId(optionId);
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !selectedOptionId || isSubmitting || evaluation) return;

    setIsSubmitting(true);
    try {
      const evalRes = await studentMcqClient.evaluateAnswer(
        currentQuestion.id,
        selectedOptionId,
        timeSeconds,
        'RANDOM'
      );
      setEvaluation(evalRes);

      // Record result
      setSessionResults((prev) => [
        ...prev,
        {
          question: currentQuestion,
          selectedOption: selectedOptionId,
          isCorrect: evalRes.isCorrect,
          evaluation: evalRes,
        },
      ]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setEvaluation(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleToggleBookmark = async () => {
    if (!currentQuestion) return;
    const currentStatus = !!bookmarkedMap[currentQuestion.id];
    // Optimistic toggle
    setBookmarkedMap((prev) => ({ ...prev, [currentQuestion.id]: !currentStatus }));

    try {
      const updated = await studentMcqClient.toggleBookmark(currentQuestion.id);
      setBookmarkedMap((prev) => ({ ...prev, [currentQuestion.id]: updated }));
      toast.success(updated ? 'Question saved to bookmarks' : 'Removed from bookmarks');
    } catch {
      // Revert on error
      setBookmarkedMap((prev) => ({ ...prev, [currentQuestion.id]: currentStatus }));
      toast.error('Failed to update bookmark');
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  // Compute session metrics
  const totalAttempted = sessionResults.length;
  const totalCorrect = sessionResults.filter((r) => r.isCorrect).length;
  const totalIncorrect = totalAttempted - totalCorrect;
  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-navy-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-navy-900 border border-navy-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-700/60 bg-navy-850/90 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                  MCQ Practice Zone
                </span>
                {currentQuestion?.sourceType && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-navy-750 text-slate-300 border border-navy-600">
                    {currentQuestion.sourceType}
                  </span>
                )}
              </div>
              <h2 className="text-base md:text-lg font-bold text-white truncate max-w-[280px] md:max-w-md">
                {subjectTitle || currentQuestion?.subjectName || 'Engineering Practice'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!loading && questions.length > 0 && !isFinished && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-750 border border-navy-600 text-xs font-medium text-slate-300">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>{formatTimer(timeSeconds)}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-navy-750 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Strip */}
        {!loading && questions.length > 0 && !isFinished && (
          <div className="px-5 py-2.5 bg-navy-850/50 border-b border-navy-750 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-orange-400" /> Filter:
              </span>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="bg-navy-800 border border-navy-600 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-orange-500"
              >
                <option value="ALL">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-navy-800 border border-navy-600 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-orange-500"
              >
                <option value="ALL">All Sources</option>
                <option value="GTU_PYQ">GTU PYQs</option>
                <option value="GATE_PYQ">GATE PYQs</option>
                <option value="PRACTICE">AI Practice</option>
              </select>
            </div>

            <div className="text-slate-400">
              Question <span className="text-orange-400 font-bold">{currentIndex + 1}</span> of{' '}
              <span className="text-white font-bold">{questions.length}</span>
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 animate-spin">
                <RotateCcw className="w-6 h-6" />
              </div>
              <p className="text-slate-300 font-medium text-sm">Fetching verified MCQ questions...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Unable to load questions</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">{error}</p>
              <button
                onClick={loadQuestions}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Try Again
              </button>
            </div>
          ) : isFinished ? (
            /* Quiz Completed View */
            <div className="py-8 text-center space-y-6 animate-in fade-in duration-300">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                <Trophy className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Practice Session Completed!
                </span>
                <h3 className="text-2xl font-extrabold text-white mt-1">Excellent Effort!</h3>
                <p className="text-slate-400 text-sm mt-1">
                  Your answers and accuracy metrics have been saved to your student profile.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                <div className="p-4 rounded-xl bg-navy-800/80 border border-navy-700/60">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Score</span>
                  <p className="text-2xl font-black text-white mt-1">
                    {totalCorrect} / {totalAttempted}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-navy-800/80 border border-navy-700/60">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Accuracy</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">{accuracy}%</p>
                </div>
                <div className="p-4 rounded-xl bg-navy-800/80 border border-navy-700/60">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Time</span>
                  <p className="text-2xl font-black text-orange-400 mt-1">{formatTimer(timeSeconds)}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  onClick={loadQuestions}
                  className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
                >
                  <RotateCcw className="w-4 h-4" /> Practice Another Set
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-200 border border-navy-600 font-semibold text-sm transition-all"
                >
                  Back to Portal
                </button>
              </div>
            </div>
          ) : questions.length === 0 ? (
            /* Clean Empty State */
            <div className="py-16 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">MCQs coming soon for this section</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                We are currently indexing and verifying topic-wise practice questions for this subject. In the
                meantime, you can practice questions from all engineering subjects.
              </p>
              <button
                onClick={() => {
                  setDifficultyFilter('ALL');
                  setSourceFilter('ALL');
                  loadQuestions();
                }}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-all inline-flex items-center gap-2 shadow-lg shadow-orange-500/20"
              >
                <Sparkles className="w-4 h-4" /> Explore Common Engineering MCQs
              </button>
            </div>
          ) : currentQuestion ? (
            /* Active Question Card */
            <div className="space-y-6">
              {/* Question Metadata Header */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    {currentQuestion.topicName || currentQuestion.subjectName}
                  </span>
                  {currentQuestion.difficulty && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md font-semibold uppercase ${
                        currentQuestion.difficulty === 'easy'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : currentQuestion.difficulty === 'hard'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {currentQuestion.difficulty}
                    </span>
                  )}
                  {currentQuestion.examYear && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-navy-800 text-slate-300 border border-navy-700">
                      {currentQuestion.examName} {currentQuestion.examYear}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleToggleBookmark}
                  className={`p-2 rounded-xl border transition-all ${
                    bookmarkedMap[currentQuestion.id]
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-navy-800 text-slate-400 border-navy-700 hover:text-white'
                  }`}
                  title={bookmarkedMap[currentQuestion.id] ? 'Remove Bookmark' : 'Bookmark Question'}
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>

              {/* Question Text */}
              <div className="text-base md:text-lg font-medium text-slate-100 leading-relaxed bg-navy-850/60 p-4 md:p-5 rounded-xl border border-navy-750">
                {currentQuestion.questionText}
              </div>

              {/* Options Grid */}
              <div className="space-y-3">
                {(currentQuestion.options || []).map((opt, idx) => {
                  const optionLetter = String.fromCharCode(65 + idx);
                  const isSelected = selectedOptionId === opt.id || selectedOptionId === optionLetter;
                  const isSubmitted = !!evaluation;
                  const isCorrectAnswer =
                    isSubmitted &&
                    (evaluation.correctAnswer === opt.id ||
                      evaluation.correctAnswer === optionLetter ||
                      evaluation.correctAnswer === `"${opt.id}"` ||
                      evaluation.correctAnswer === `"${optionLetter}"`);

                  let optionStyle =
                    'border-navy-700 bg-navy-800/60 hover:bg-navy-750 hover:border-navy-600 text-slate-200';
                  let badge = null;

                  if (isSubmitted) {
                    if (isCorrectAnswer) {
                      optionStyle = 'border-emerald-500/80 bg-emerald-500/10 text-emerald-200';
                      badge = (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 ml-auto">
                          <CheckCircle2 className="w-4 h-4" /> Correct Answer
                        </span>
                      );
                    } else if (isSelected && !evaluation.isCorrect) {
                      optionStyle = 'border-red-500/80 bg-red-500/10 text-red-200';
                      badge = (
                        <span className="flex items-center gap-1 text-xs font-bold text-red-400 ml-auto">
                          <XCircle className="w-4 h-4" /> Your Answer
                        </span>
                      );
                    }
                  } else if (isSelected) {
                    optionStyle = 'border-orange-500 bg-orange-500/10 text-white ring-1 ring-orange-500';
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id || optionLetter)}
                      disabled={isSubmitted}
                      className={`w-full text-left p-3.5 md:p-4 rounded-xl border transition-all flex items-start gap-3.5 ${optionStyle}`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected
                            ? 'bg-orange-500 text-white'
                            : 'bg-navy-700 text-slate-300 border border-navy-600'
                        }`}
                      >
                        {optionLetter}
                      </span>
                      <span className="text-sm md:text-base font-normal pt-0.5 leading-snug">{opt.text}</span>
                      {badge}
                    </button>
                  );
                })}
              </div>

              {/* Post-Submission Explanation */}
              {evaluation && (
                <div
                  className={`p-4 md:p-5 rounded-xl border animate-in slide-in-from-bottom-2 duration-200 ${
                    evaluation.isCorrect
                      ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-100'
                      : 'bg-red-950/20 border-red-700/50 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {evaluation.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="font-bold text-sm">
                      {evaluation.isCorrect ? 'Correct! Well done!' : 'Incorrect'}
                    </span>
                  </div>

                  {evaluation.explanation ? (
                    <div className="text-sm leading-relaxed text-slate-300 mt-2">
                      <strong className="text-slate-200 block mb-1">Explanation:</strong>
                      {evaluation.explanation}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1 italic">
                      Detailed explanation will be published soon by verified educators.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        {!loading && questions.length > 0 && !isFinished && (
          <div className="px-5 py-4 border-t border-navy-700/60 bg-navy-850/90 flex items-center justify-between gap-3 sticky bottom-0">
            <div className="text-xs text-slate-400 hidden sm:block">
              {evaluation ? 'Click Next to proceed' : 'Select an option and click Submit'}
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {!evaluation ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedOptionId || isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
                >
                  {isSubmitting ? 'Evaluating...' : 'Submit Answer'}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                >
                  <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'View Results'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
