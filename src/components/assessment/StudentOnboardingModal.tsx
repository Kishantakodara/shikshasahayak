import React, { useState } from 'react';
import { 
  GraduationCap, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Award, 
  Briefcase, 
  Code, 
  TrendingUp, 
  X,
  Target
} from 'lucide-react';
import { UNIVERSITIES, BRANCH_PACKS, GOAL_PACKS } from '../../config/assessmentPacks';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    university: string;
    college: string;
    degree: string;
    branch: string;
    semester: number;
    goals: string[];
  }) => void;
  initialData?: {
    university?: string;
    college?: string;
    degree?: string;
    branch?: string;
    semester?: number;
    goals?: string[];
  };
}

export function StudentOnboardingModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  const gtuUni = UNIVERSITIES[0];
  const [university, setUniversity] = useState(initialData?.university || 'gtu');
  const [college, setCollege] = useState(initialData?.college || gtuUni.colleges[0].name);
  const [degree, setDegree] = useState(initialData?.degree || gtuUni.degrees[0].name);
  const [branch, setBranch] = useState(initialData?.branch || 'cse');
  const [semester, setSemester] = useState<number>(initialData?.semester || 5);
  
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    initialData?.goals && initialData.goals.length > 0 
      ? initialData.goals 
      : ['gtu_prep', 'coding_practice']
  );

  if (!isOpen) return null;

  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      if (selectedGoals.length > 1) {
        setSelectedGoals(selectedGoals.filter(id => id !== goalId));
      }
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  const handleFinish = () => {
    onSave({
      university,
      college,
      degree,
      branch,
      semester,
      goals: selectedGoals
    });
    onClose();
  };

  const selectedBranchPack = BRANCH_PACKS[branch] || BRANCH_PACKS['cse'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl w-[95vw] sm:max-w-2xl p-4 sm:p-8 shadow-2xl space-y-4 sm:space-y-6 relative max-h-[92vh] overflow-y-auto text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                Personalized Academic Setup
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tailor your ShikshaSahayak workspace for your GTU semester & goals.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between px-2">
          <div className={`flex items-center gap-2 text-xs font-bold ${step >= 1 ? 'text-orange-500' : 'text-slate-400'}`}>
            <span className="w-6 h-6 rounded-full border flex items-center justify-center text-[10px]">1</span>
            <span>Academic Info</span>
          </div>
          <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-800 mx-3" />
          <div className={`flex items-center gap-2 text-xs font-bold ${step >= 2 ? 'text-orange-500' : 'text-slate-400'}`}>
            <span className="w-6 h-6 rounded-full border flex items-center justify-center text-[10px]">2</span>
            <span>Academic Goals</span>
          </div>
          <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-800 mx-3" />
          <div className={`flex items-center gap-2 text-xs font-bold ${step >= 3 ? 'text-orange-500' : 'text-slate-400'}`}>
            <span className="w-6 h-6 rounded-full border flex items-center justify-center text-[10px]">3</span>
            <span>Generated Hub</span>
          </div>
        </div>

        {/* STEP 1: Academic Profile */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* University */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">University</label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {UNIVERSITIES.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.shortName})</option>
                  ))}
                </select>
              </div>

              {/* College */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">College / Institute</label>
                <select
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {gtuUni.colleges.map(c => (
                    <option key={c.id} value={c.name}>{c.name} ({c.city})</option>
                  ))}
                </select>
              </div>

              {/* Degree */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Degree Program</label>
                <select
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {gtuUni.degrees.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Branch */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Engineering Branch</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {Object.entries(BRANCH_PACKS).map(([key, b]) => (
                    <option key={key} value={key}>{b.name} ({b.shortName})</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Semester Selector Pills */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Current GTU Semester</label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSemester(s)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      semester === s
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md ring-2 ring-orange-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Sem {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <span>Next: Select Goals</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Academic Goals */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select one or more targets. ShikshaSahayak will automatically unlock relevant study tools and widgets for you.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {Object.entries(GOAL_PACKS).map(([goalId, goal]) => {
                const isSelected = selectedGoals.includes(goalId);
                return (
                  <div
                    key={goalId}
                    onClick={() => toggleGoal(goalId)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20 text-slate-900 dark:text-white shadow-sm ring-1 ring-orange-500/50'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold">{goal.name}</h4>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{goal.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <span>Preview Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Auto-Generated Preview */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-extrabold text-xs uppercase tracking-wider">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <span>Custom Dashboard Pack Generated</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                <p><strong>Target Branch:</strong> {selectedBranchPack.name} (Semester {semester})</p>
                <p><strong>Core GTU Subjects:</strong> {(selectedBranchPack.coreSubjects[semester] || []).join(', ')}</p>
                <p><strong>Activated Widgets:</strong> {selectedBranchPack.defaultWidgets.length + selectedGoals.length * 2} Modules Pre-Configured</p>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-xs rounded-xl shadow-xl flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Launch My Workspace</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
