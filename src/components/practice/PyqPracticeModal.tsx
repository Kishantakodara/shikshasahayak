import React, { useState } from 'react';
import { X, Award, FileText, Play, Filter, Sparkles } from 'lucide-react';

export interface PyqPracticeConfig {
  sourceMode: 'GATE_PYQ';
  examYear?: number;
  subjectName?: string;
  questionType?: string;
  questionCount: number;
  durationMinutes: number;
}

interface PyqPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: PyqPracticeConfig) => void;
}

const AVAILABLE_YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018];

const GATE_SUBJECT_DISCIPLINES = [
  'All Disciplines (Full Syllabus)',
  'Data Structures & Algorithms',
  'Operating Systems',
  'Database Management Systems',
  'Computer Networks',
  'Theory of Computation & Automata',
  'Computer Organization & Architecture',
  'Compiler Design',
  'Digital Logic Design',
  'Engineering Mathematics & Discrete Maths',
  'General Aptitude',
];

export const PyqPracticeModal: React.FC<PyqPracticeModalProps> = ({
  isOpen,
  onClose,
  onStart,
}) => {
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL');
  const [selectedSubject, setSelectedSubject] = useState(GATE_SUBJECT_DISCIPLINES[0]);
  const [questionType, setQuestionType] = useState<'MIXED' | 'MCQ' | 'MSQ' | 'NAT'>('MIXED');
  const [questionCount, setQuestionCount] = useState<number>(15);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = Math.max(10, Math.round(questionCount * 2)); // GATE gives ~2.5 mins per question
    onStart({
      sourceMode: 'GATE_PYQ',
      examYear: selectedYear === 'ALL' ? undefined : Number(selectedYear),
      subjectName: selectedSubject === GATE_SUBJECT_DISCIPLINES[0] ? undefined : selectedSubject,
      questionType: questionType === 'MIXED' ? undefined : questionType,
      questionCount,
      durationMinutes: duration,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pyq-modal-title"
    >
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 my-8 text-[#0F172A] dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 id="pyq-modal-title" className="text-lg font-bold text-[#0F172A] dark:text-white">
                GATE Previous Year Questions (PYQs)
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Official past examination questions with verified answer keys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Year Filter Buttons */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-200 mb-1.5">
              Target Exam Year
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedYear('ALL')}
                className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                  selectedYear === 'ALL'
                    ? 'bg-[#F97316] text-white border-[#F97316]'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[#64748B] dark:text-slate-400 hover:border-[#F97316]'
                }`}
              >
                All Years
              </button>
              {AVAILABLE_YEARS.map((yr) => (
                <button
                  type="button"
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                    selectedYear === yr
                      ? 'bg-[#F97316] text-white border-[#F97316]'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[#64748B] dark:text-slate-400 hover:border-[#F97316]'
                  }`}
                >
                  GATE {yr}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-200 mb-1.5">
              Subject Area
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#F97316]"
            >
              {GATE_SUBJECT_DISCIPLINES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Question Type Filter & Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-200 mb-1.5">
                Question Pattern
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#F97316]"
              >
                <option value="MIXED">Mixed (MCQ + MSQ + NAT)</option>
                <option value="MCQ">MCQ (Single Correct)</option>
                <option value="MSQ">MSQ (Multiple Select)</option>
                <option value="NAT">NAT (Numerical Answer)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-200 mb-1.5">
                Questions Count
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#F97316]"
              >
                <option value={10}>10 Questions (~20 mins)</option>
                <option value={15}>15 Questions (~30 mins)</option>
                <option value={20}>20 Questions (~40 mins)</option>
                <option value={30}>30 Questions (~60 mins)</option>
              </select>
            </div>
          </div>

          {/* Provenance note */}
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-900 dark:text-purple-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
            <span>Includes official GATE markings, negative marking rules, and NAT tolerance ranges.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[#64748B] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch PYQ Session</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
