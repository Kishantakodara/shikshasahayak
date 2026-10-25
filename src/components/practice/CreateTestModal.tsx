import React, { useState, useEffect } from 'react';
import { X, Sliders, CheckCircle2, AlertTriangle, Play, Sparkles } from 'lucide-react';
import { TestGenerationConfig } from '../../types';

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTest: (config: TestGenerationConfig) => void;
}

export const CreateTestModal: React.FC<CreateTestModalProps> = ({
  isOpen,
  onClose,
  onStartTest,
}) => {
  const [sourceMode, setSourceMode] = useState<'ALL' | 'GTU_PYQ' | 'GATE_PYQ' | 'PRACTICE'>('ALL');
  const [testType, setTestType] = useState<any>('RANDOM_TEST');
  const [questionTypes, setQuestionTypes] = useState<any>('MIXED');
  const [branchId, setBranchId] = useState<string>('branch_07');
  const [semester, setSemester] = useState<number>(1);
  const [subjectCode, setSubjectCode] = useState<string>('');
  const [topicName, setTopicName] = useState<string>('');
  const [difficulty, setDifficulty] = useState<any>('MIXED');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [durationMinutes, setDurationMinutes] = useState<number>(10);
  const [negativeMarking, setNegativeMarking] = useState<boolean>(true);
  const [negativeMarkValue, setNegativeMarkValue] = useState<number>(0.25);

  const [availability, setAvailability] = useState<{ availableCount: number; isSufficient: boolean } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkQuestionAvailability();
    }
  }, [isOpen, sourceMode, testType, questionTypes, branchId, semester, subjectCode, topicName, difficulty, questionCount]);

  const checkQuestionAvailability = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/student/tests/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testType,
          sourceMode,
          questionTypes: questionTypes === 'MIXED' ? ['MCQ', 'MSQ', 'NAT'] : [questionTypes],
          branchId,
          semester,
          subjectCode: subjectCode || undefined,
          topicName: topicName || undefined,
          difficulty,
          questionCount,
          durationMinutes,
        }),
      });
      const data = await res.json();
      if (data.success && data.availability) {
        setAvailability(data.availability);
      }
    } catch {
      /* empty */
    } finally {
      setChecking(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (availability && !availability.isSufficient) return;

    onStartTest({
      testType,
      sourceMode,
      questionTypes: questionTypes === 'MIXED' ? 'MIXED' : [questionTypes],
      branchId,
      semester,
      subjectCode: subjectCode || undefined,
      topicName: topicName || undefined,
      difficulty,
      questionCount,
      durationMinutes,
      negativeMarking,
      negativeMarkValue,
      randomizeQuestions: true,
      randomizeOptions: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-navy-900 border border-navy-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 my-8">
        <div className="flex items-center justify-between border-b border-navy-800 pb-4">
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <Sliders className="w-5 h-5 text-orange-400" />
            <span>Create Custom Test Session</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Source Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Question Source</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'ALL', label: 'All Sources' },
                { id: 'GTU_PYQ', label: 'GTU PYQ' },
                { id: 'GATE_PYQ', label: 'GATE PYQ' },
                { id: 'PRACTICE', label: 'AI Practice' },
              ].map(src => (
                <button
                  type="button"
                  key={src.id}
                  onClick={() => setSourceMode(src.id as any)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    sourceMode === src.id
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500'
                      : 'bg-navy-950 text-slate-400 border-navy-800 hover:border-navy-700'
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Question Type</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'MIXED', label: 'Mixed (All)' },
                { id: 'MCQ', label: 'MCQ (Single)' },
                { id: 'MSQ', label: 'MSQ (Multi)' },
                { id: 'NAT', label: 'NAT (Numeric)' },
              ].map(qt => (
                <button
                  type="button"
                  key={qt.id}
                  onClick={() => setQuestionTypes(qt.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    questionTypes === qt.id
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500'
                      : 'bg-navy-950 text-slate-400 border-navy-800 hover:border-navy-700'
                  }`}
                >
                  {qt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Branch & Semester */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Engineering Branch</label>
              <select
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="branch_07">Computer Engineering (CE)</option>
                <option value="branch_31">Computer Science & Eng (CSE)</option>
                <option value="branch_16">Information Technology (IT)</option>
                <option value="branch_11">Electronics & Comm (ECE)</option>
                <option value="branch_09">Electrical Engineering (EE)</option>
                <option value="branch_19">Mechanical Engineering (ME)</option>
                <option value="branch_06">Civil Engineering</option>
                <option value="branch_41">Robotics & Automation</option>
                <option value="branch_43">AI & Data Science</option>
                <option value="branch_05">Chemical Engineering</option>
                <option value="branch_17">Instrumentation & Control</option>
                <option value="branch_32">Information & Comm Tech</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Semester</label>
              <select
                value={semester}
                onChange={e => setSemester(Number(e.target.value))}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value={1}>Semester 1</option>
                <option value={2}>Semester 2</option>
              </select>
            </div>
          </div>

          {/* Question Count & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Number of Questions</label>
              <select
                value={questionCount}
                onChange={e => setQuestionCount(Number(e.target.value))}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {[5, 10, 15, 20, 25, 30].map(cnt => (
                  <option key={cnt} value={cnt}>{cnt} Questions</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Minutes)</label>
              <select
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-navy-950 border border-navy-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {[5, 10, 15, 20, 30, 45, 60].map(dur => (
                  <option key={dur} value={dur}>{dur} Minutes</option>
                ))}
              </select>
            </div>
          </div>

          {/* Availability Check Badge */}
          <div className="bg-navy-950 rounded-xl p-3 border border-navy-800 text-xs flex items-center justify-between">
            <span className="text-slate-400">Question Pool Availability:</span>
            {checking ? (
              <span className="text-slate-400">Checking...</span>
            ) : availability ? (
              availability.isSufficient ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{availability.availableCount} verified questions available</span>
                </span>
              ) : (
                <span className="text-red-400 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Only {availability.availableCount} verified questions available for selection</span>
                </span>
              )
            ) : (
              <span className="text-slate-400">Ready</span>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-navy-800 text-slate-300 text-xs font-semibold hover:bg-navy-750"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={Boolean(availability && !availability.isSufficient)}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
            >
              <Play className="w-4 h-4" />
              <span>Start Test Session</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
