import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  HelpCircle, 
  AlertCircle, 
  Zap, 
  Sparkles, 
  Code2, 
  Terminal, 
  BookOpen, 
  Target,
  FileCode,
  Check,
  RotateCcw,
  Compass,
  ArrowRight
} from 'lucide-react';
import { DayProblemDetailDTO, TrackMetadata } from '../../../data/coding100DaysCurriculum';
import { CodeEditor } from '../../../components/coding/CodeEditor';
import { fetchWithAuth } from '../../../api/client';

export interface DailyLessonProps {
  dayNumber: number;
  trackId: string;
  problem: DayProblemDetailDTO;
  isSolved: boolean;
  onNavigateDay: (dayNumber: number) => void;
  onSolutionAccepted: (awardedXp: number, streak: number) => void;
  onBackToRoadmap: () => void;
}

export const HundredDaysDailyLesson: React.FC<DailyLessonProps> = ({
  dayNumber,
  trackId,
  problem,
  isSolved: initialSolved,
  onNavigateDay,
  onSolutionAccepted,
  onBackToRoadmap
}) => {
  // Mobile active tab: 'lesson' | 'challenge' | 'editor'
  const [mobileTab, setMobileTab] = useState<'problem' | 'editor'>('problem');
  const [leftTab, setLeftTab] = useState<'concept' | 'problem'>('problem');

  // Editor states
  const [language, setLanguage] = useState<'javascript' | 'python' | 'cpp' | 'java'>('javascript');
  const [code, setCode] = useState<string>('');
  
  // Execution & Submission states
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [submitVerdict, setSubmitVerdict] = useState<any>(null);
  const [consoleTab, setConsoleTab] = useState<'output' | 'testcases'>('testcases');
  const [unlockedHints, setUnlockedHints] = useState<number>(0);

  // Initialize starter code when language or problem changes
  useEffect(() => {
    if (problem?.starterCode) {
      const starter = problem.starterCode[language] || '';
      setCode(starter);
    }
    setRunResult(null);
    setSubmitVerdict(null);
    setUnlockedHints(0);
  }, [problem, language]);

  // Handle Run (Sample Tests only)
  const handleRunCode = async () => {
    if (!code.trim() || running || submitting) return;
    setRunning(true);
    setRunResult(null);
    setSubmitVerdict(null);
    setConsoleTab('output');

    try {
      const res = await fetchWithAuth('/api/coding/100-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run',
          dayNumber,
          trackId,
          language,
          code
        })
      });
      const data = await res.json() as any;
      setRunResult(data);
    } catch (err: any) {
      setRunResult({
        success: false,
        status: 'EXECUTION_ERROR',
        feedback: err.message || 'Execution request failed. Please check network connection.'
      });
    } finally {
      setRunning(false);
    }
  };

  // Handle Submit (Server-Graded Evaluation)
  const handleSubmitCode = async () => {
    if (!code.trim() || submitting || running) return;
    setSubmitting(true);
    setSubmitVerdict(null);
    setRunResult(null);
    setConsoleTab('testcases');

    try {
      const res = await fetchWithAuth('/api/coding/100-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          dayNumber,
          trackId,
          language,
          code
        })
      });
      const data = await res.json() as any;
      setSubmitVerdict(data);

      if (data.success && data.status === 'ACCEPTED') {
        onSolutionAccepted(data.xpEarned || 0, data.streakCount || 1);
      }
    } catch (err: any) {
      setSubmitVerdict({
        success: false,
        status: 'SUBMISSION_ERROR',
        feedback: err.message || 'Submission request failed.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const starterCodeForLang = problem?.starterCode?.[language] || '';
  const storageKey = `padhaku_100days_draft_${trackId}_d${dayNumber}_${language}`;

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Breadcrumb & Day Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToRoadmap}
            className="text-xs font-bold text-slate-500 hover:text-orange-500 flex items-center gap-1 transition cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" /> 100 Days Roadmap
          </button>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Day {dayNumber}: {problem.title}
          </span>
        </div>

        {/* Prev / Next Navigation Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => onNavigateDay(dayNumber - 1)}
            disabled={dayNumber <= 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev Day
          </button>

          <span className="text-xs font-mono font-bold text-orange-500 px-2">
            Day {dayNumber} / 100
          </span>

          <button
            onClick={() => onNavigateDay(dayNumber + 1)}
            disabled={dayNumber >= 100}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            Next Day <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile Tab Toggle (< lg screens) */}
      <div className="flex lg:hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl">
        <button
          onClick={() => setMobileTab('problem')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
            mobileTab === 'problem'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Lesson & Problem
        </button>

        <button
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
            mobileTab === 'editor'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Code Editor
        </button>
      </div>

      {/* Main Split Layout: Left (Lesson/Problem) & Right (Editor/Console) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Lesson & Problem Specification */}
        <div className={`lg:col-span-5 space-y-5 ${mobileTab === 'editor' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            {/* Tab switch between Problem Statement & Concept Guide */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setLeftTab('problem')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  leftTab === 'problem' ? 'bg-white dark:bg-slate-900 text-orange-500 shadow-sm' : 'text-slate-500'
                }`}
              >
                Problem Statement
              </button>
              <button
                onClick={() => setLeftTab('concept')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  leftTab === 'concept' ? 'bg-white dark:bg-slate-900 text-orange-500 shadow-sm' : 'text-slate-500'
                }`}
              >
                Concept Lesson
              </button>
            </div>

            {leftTab === 'problem' ? (
              <div className="space-y-5">
                {/* Header Info */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-500">
                      {problem.category}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                        problem.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' :
                        problem.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400' :
                        'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                      }`}>
                        {problem.difficulty}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-[11px] font-bold">
                        +{problem.xpReward} XP
                      </span>
                    </div>
                  </div>

                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {problem.title}
                  </h2>
                </div>

                {/* Problem Statement */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h4>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {problem.problemStatement}
                  </p>
                </div>

                {/* Input / Output Formats */}
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 font-sans font-bold block mb-1">Input Format:</span>
                    <code className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-1 rounded block border border-slate-200 dark:border-slate-800">
                      {problem.inputFormat}
                    </code>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans font-bold block mb-1">Expected Output:</span>
                    <code className="text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 px-2 py-1 rounded block border border-slate-200 dark:border-slate-800">
                      {problem.outputFormat}
                    </code>
                  </div>
                </div>

                {/* Constraints */}
                {problem.constraints && problem.constraints.length > 0 && (
                  <div className="space-y-1.5 text-xs">
                    <h4 className="font-bold uppercase tracking-wider text-slate-400">Constraints</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {problem.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Progressive Hints */}
                {problem.hints && problem.hints.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-orange-500" /> Progressive Hints
                      </span>
                      {unlockedHints < problem.hints.length && (
                        <button
                          onClick={() => setUnlockedHints(prev => prev + 1)}
                          className="text-[11px] font-bold text-orange-500 hover:underline cursor-pointer"
                        >
                          Reveal Hint ({unlockedHints + 1}/{problem.hints.length})
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {problem.hints.slice(0, unlockedHints).map((hint, idx) => (
                        <div key={idx} className="p-3 bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                          <span className="font-bold text-orange-500">Hint {idx + 1}: </span>
                          {hint}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Concept Lesson Markdown Tab */
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-orange-500">Learning Objectives</h3>
                  <div className="space-y-1.5">
                    {problem.learningObjectives.map((obj, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-3 font-sans">
                  {problem.lessonContent}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code Editor & Console */}
        <div className={`lg:col-span-7 space-y-5 ${mobileTab === 'problem' ? 'hidden lg:block' : 'block'}`}>
          {/* Embedded Editor */}
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            onLanguageChange={setLanguage}
            onRun={handleRunCode}
            onSubmit={handleSubmitCode}
            starterCode={starterCodeForLang}
            storageKey={storageKey}
            minHeight="380px"
          />

          {/* Action Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Independent Run & Server-Graded Submit</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {/* Run Sample Tests Button */}
              <button
                onClick={handleRunCode}
                disabled={running || submitting || !code.trim()}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                <span>{running ? 'Running Tests...' : 'Run Code'}</span>
              </button>

              {/* Submit Final Solution Button */}
              <button
                onClick={handleSubmitCode}
                disabled={submitting || running || !code.trim()}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{submitting ? 'Submitting...' : 'Submit Solution'}</span>
              </button>
            </div>
          </div>

          {/* Console & Verdict Drawer */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {/* Console Tabs */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConsoleTab('testcases')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    consoleTab === 'testcases' ? 'bg-white dark:bg-slate-900 text-orange-500 shadow-sm font-bold' : 'text-slate-500'
                  }`}
                >
                  Test Cases
                </button>
                <button
                  onClick={() => setConsoleTab('output')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    consoleTab === 'output' ? 'bg-white dark:bg-slate-900 text-orange-500 shadow-sm font-bold' : 'text-slate-500'
                  }`}
                >
                  Console Output
                </button>
              </div>

              {(running || submitting) && (
                <span className="text-[11px] text-orange-500 font-mono animate-pulse">
                  Evaluating in isolate...
                </span>
              )}
            </div>

            {/* Console Content */}
            <div className="p-4 min-h-[140px] text-xs font-mono">
              {submitVerdict ? (
                <div className="space-y-3">
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${
                    submitVerdict.status === 'ACCEPTED'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {submitVerdict.status === 'ACCEPTED' ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          <span>Accepted — Day {dayNumber} Conquered! (+{submitVerdict.xpEarned || 0} XP)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                          <span>Submission Failed: {submitVerdict.status}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans text-xs">
                    {submitVerdict.feedback}
                  </p>
                </div>
              ) : runResult ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-slate-500 font-sans text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Sample Run Status: {runResult.status}
                    </span>
                    <span>{runResult.passedTests || 0} / {runResult.totalTests || 1} Passed</span>
                  </div>
                  <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl overflow-x-auto text-xs">
                    {runResult.feedback || 'Run completed successfully.'}
                  </pre>
                </div>
              ) : consoleTab === 'testcases' ? (
                /* Visible Test Cases List */
                <div className="space-y-2">
                  {problem.testCases.map((tc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs"
                    >
                      <div className="space-y-1 truncate max-w-sm">
                        <span className="text-slate-400 font-sans block text-[10px] font-bold">Input:</span>
                        <code className="text-slate-800 dark:text-slate-200 truncate block">{tc.input}</code>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 font-sans block text-[10px] font-bold">Expected:</span>
                        <code className="text-emerald-500">{tc.expectedOutput}</code>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 font-sans text-xs space-y-1">
                  <Terminal className="w-6 h-6 mx-auto text-slate-400 mb-2 opacity-50" />
                  <p>Console output is empty.</p>
                  <p className="text-[11px] text-slate-500">Click &ldquo;Run Code&rdquo; to test your algorithm against sample cases.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HundredDaysDailyLesson;
