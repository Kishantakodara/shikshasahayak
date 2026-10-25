import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Bookmark, 
  ShieldAlert, 
  FileText,
  Play
} from 'lucide-react';

export interface TestInstructionsConfig {
  title: string;
  testType: string;
  sourceMode?: string;
  questionCount: number;
  durationMinutes: number;
  totalMarks?: number;
  negativeMarking?: boolean;
  negativeMarkValue?: number;
  subjectName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface TestInstructionsModalProps {
  isOpen: boolean;
  config: TestInstructionsConfig | null;
}

export const TestInstructionsModal: React.FC<TestInstructionsModalProps> = ({
  isOpen,
  config,
}) => {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen || !config) return null;

  const totalMarks = config.totalMarks || (config.questionCount * (config.sourceMode === 'GATE_PYQ' ? 1.5 : 1));
  const negMarkText = config.negativeMarking !== false 
    ? `Yes (${config.negativeMarkValue ? config.negativeMarkValue : '0.25 / 0.33'} marks deducted for incorrect MCQs; No negative marking for NAT)`
    : 'No negative marking';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="instructions-title"
    >
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 my-8 text-[#0F172A] dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#F97316] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 id="instructions-title" className="text-lg font-bold text-[#0F172A] dark:text-white">
                Examination Instructions
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                ShikshaSahayak Computer-Based Practice Simulator
              </p>
            </div>
          </div>
          <button
            onClick={config.onCancel}
            aria-label="Close instructions modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test Parameters Badge Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-[#64748B] dark:text-slate-400 block font-medium">Duration</span>
            <span className="text-base font-bold text-[#0F172A] dark:text-white mt-0.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#F97316]" />
              {config.durationMinutes} Mins
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-[#64748B] dark:text-slate-400 block font-medium">Questions</span>
            <span className="text-base font-bold text-[#0F172A] dark:text-white mt-0.5">
              {config.questionCount} Questions
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-[#64748B] dark:text-slate-400 block font-medium">Max Marks</span>
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {totalMarks} Marks
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-[#64748B] dark:text-slate-400 block font-medium">Exam Pattern</span>
            <span className="text-base font-bold text-[#F97316] mt-0.5 truncate block">
              {config.sourceMode === 'GATE_PYQ' ? 'GATE CBT' : 'University'}
            </span>
          </div>
        </div>

        {/* Instructions Body */}
        <div className="space-y-4 max-h-72 overflow-y-auto pr-2 text-xs text-[#0F172A] dark:text-slate-200 leading-relaxed">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              <strong>Important Notice:</strong> Once you click &ldquo;Begin Examination&rdquo;, the countdown timer will begin immediately. Ensure you have a stable network connection.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm text-[#0F172A] dark:text-white mb-2">1. General Guidelines</h4>
            <ul className="list-disc list-inside space-y-1 text-[#64748B] dark:text-slate-300">
              <li>The clock will be set on the server. The countdown timer in the top right corner indicates remaining time.</li>
              <li>When the timer reaches zero, the examination will end automatically and submit your responses.</li>
              <li>Negative Marking: {negMarkText}.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-[#0F172A] dark:text-white mb-2">2. Question Palette Legend</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <span className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold flex items-center justify-center text-xs">1</span>
                <span>You have not visited the question yet.</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <span className="w-6 h-6 rounded bg-red-600 text-white font-bold flex items-center justify-center text-xs">2</span>
                <span>You have visited but not answered.</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <span className="w-6 h-6 rounded bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">3</span>
                <span>You have answered the question.</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                <span className="w-6 h-6 rounded bg-purple-600 text-white font-bold flex items-center justify-center text-xs">4</span>
                <span>Marked for review (unanswered).</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 col-span-1 sm:col-span-2">
                <span className="w-6 h-6 rounded bg-purple-600 text-white font-bold flex items-center justify-center text-xs relative">
                  5
                  <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-1 ring-white" />
                </span>
                <span>Answered AND Marked for review (will be evaluated).</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm text-[#0F172A] dark:text-white mb-2">3. Question Types</h4>
            <ul className="list-disc list-inside space-y-1 text-[#64748B] dark:text-slate-300">
              <li><strong>MCQ (Multiple Choice Questions):</strong> Only one option is correct. Negative marks apply if answered incorrectly.</li>
              <li><strong>MSQ (Multiple Select Questions):</strong> One or more options may be correct. Full marks awarded only if all correct options are selected without any wrong option.</li>
              <li><strong>NAT (Numerical Answer Type):</strong> Enter the decimal or integer answer using the numeric input. No negative marking.</li>
            </ul>
          </div>
        </div>

        {/* Declaration Checkbox */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#F97316] border-slate-300 dark:border-slate-700 focus:ring-[#F97316] focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs text-[#0F172A] dark:text-slate-300 leading-snug group-hover:text-black dark:group-hover:text-white select-none">
              I have read, understood, and agreed to all examination instructions. I confirm that I will attempt this practice session with full academic sincerity.
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={config.onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[#64748B] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={config.onConfirm}
            disabled={!agreed}
            className="px-6 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Begin Examination</span>
          </button>
        </div>

      </div>
    </div>
  );
};
