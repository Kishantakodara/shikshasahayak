import React, { useState } from 'react';
import { X, BookOpen, Target, Sparkles, Play, ArrowRight } from 'lucide-react';

export interface TopicPracticeConfig {
  subjectName: string;
  subjectCode?: string;
  topicName?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount: number;
  durationMinutes: number;
}

interface TopicPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (config: TopicPracticeConfig) => void;
  defaultSubject?: string;
}

const GATE_SUBJECTS = [
  { name: 'Discrete Mathematics', code: 'CS_DM', topics: ['Set Theory & Algebra', 'Graph Theory', 'Mathematical Logic', 'Combinatorics'] },
  { name: 'Data Structures & Algorithms', code: 'CS_DSA', topics: ['Trees & Binary Search', 'Sorting & Searching', 'Graph Algorithms', 'Dynamic Programming'] },
  { name: 'Operating Systems', code: 'CS_OS', topics: ['Process Synchronization & Deadlocks', 'CPU Scheduling', 'Memory Management & Paging', 'File Systems'] },
  { name: 'Database Management Systems', code: 'CS_DBMS', topics: ['Relational Algebra & SQL', 'Normalization & ER Models', 'Transactions & Concurrency', 'Indexing & B-Trees'] },
  { name: 'Computer Networks', code: 'CS_CN', topics: ['TCP/IP & OSI Architecture', 'Routing Algorithms & IP Addressing', 'Flow & Error Control', 'Network Security'] },
  { name: 'Theory of Computation', code: 'CS_TOC', topics: ['Regular Expressions & Finite Automata', 'Context Free Grammars & PDA', 'Turing Machines & Decidability'] },
  { name: 'Computer Organization & Architecture', code: 'CS_COA', topics: ['Instruction Pipelining & Hazards', 'Cache Memory Mapping', 'CPU Data Path & ALU'] },
  { name: 'Compiler Design', code: 'CS_CD', topics: ['Lexical Analysis & Syntax Analysis', 'Intermediate Code Generation', 'Code Optimization'] },
  { name: 'Engineering Mathematics', code: 'CS_EM', topics: ['Linear Algebra & Matrices', 'Calculus & Vector Calculus', 'Probability & Distributions'] },
  { name: 'General Aptitude', code: 'CS_GA', topics: ['Numerical Ability', 'Verbal Reasoning', 'Data Interpretation'] },
];

export const TopicPracticeModal: React.FC<TopicPracticeModalProps> = ({
  isOpen,
  onClose,
  onStart,
  defaultSubject,
}) => {
  const [selectedSubject, setSelectedSubject] = useState(defaultSubject || GATE_SUBJECTS[0].name);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [questionCount, setQuestionCount] = useState(10);

  if (!isOpen) return null;

  const currentSubjectObj = GATE_SUBJECTS.find(s => s.name === selectedSubject) || GATE_SUBJECTS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duration = Math.max(5, Math.round(questionCount * 1.5));
    onStart({
      subjectName: selectedSubject,
      subjectCode: currentSubjectObj.code,
      topicName: selectedTopic || undefined,
      difficulty,
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
      aria-labelledby="topic-practice-title"
    >
      <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 my-8 text-[#0F172A] dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#F97316] flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 id="topic-practice-title" className="text-lg font-bold text-[#0F172A] dark:text-white">
                Topic-Wise Practice Drill
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Targeted problem solving on specific engineering topics
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
          {/* Subject Selection */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-200 mb-1.5">
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#F97316]"
            >
              {GATE_SUBJECTS.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subtopic Quick Badges */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-200">
                Topic / Unit (Optional)
              </label>
              {selectedTopic && (
                <button
                  type="button"
                  onClick={() => setSelectedTopic('')}
                  className="text-[11px] text-[#F97316] hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {currentSubjectObj.topics.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setSelectedTopic(selectedTopic === t ? '' : t)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    selectedTopic === t
                      ? 'bg-[#F97316] text-white border-[#F97316]'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-[#64748B] dark:text-slate-400 hover:border-[#F97316]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or type a specific subtopic keyword..."
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#F97316]"
            />
          </div>

          {/* Difficulty and Question Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-200 mb-1.5">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#F97316]"
              >
                <option value="mixed">Mixed (GATE Standard)</option>
                <option value="easy">Easy (Fundamentals)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="hard">Hard (Advanced)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] dark:text-slate-200 mb-1.5">
                Question Count
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[#0F172A] dark:text-white text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#F97316]"
              >
                <option value={5}>5 Questions (~8 mins)</option>
                <option value={10}>10 Questions (~15 mins)</option>
                <option value={15}>15 Questions (~22 mins)</option>
                <option value={20}>20 Questions (~30 mins)</option>
                <option value={25}>25 Questions (~40 mins)</option>
              </select>
            </div>
          </div>

          {/* Session Overview Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#64748B] dark:text-slate-400">
              <Sparkles className="w-4 h-4 text-[#F97316]" />
              <span>Full solutions with KaTeX formulas provided after submission</span>
            </div>
            <span className="font-bold text-[#0F172A] dark:text-white">
              {Math.round(questionCount * 1.5)} Mins
            </span>
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
              <span>Start Topic Drill</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
