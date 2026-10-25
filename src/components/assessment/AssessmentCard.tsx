// ============================================================
// SHIKSHA SAHAYAK OS - ASSESSMENT QUIZ CARD COMPONENT
// ============================================================

import React from "react";
import { AssessmentQuizSpec } from "../../types/assessment-portal";
import { BrainCircuit, Clock, Award, PlayCircle } from "lucide-react";

interface AssessmentCardProps {
  quiz: AssessmentQuizSpec;
  onStartQuiz: (quiz: AssessmentQuizSpec) => void;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({ quiz, onStartQuiz }) => {
  const difficultyColors: Record<string, string> = {
    easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    hard: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  };

  return (
    <div className="bg-[#1C2541]/70 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-lg hover:border-slate-600 transition">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
              difficultyColors[quiz.difficulty] || difficultyColors.medium
            }`}
          >
            {quiz.difficulty} Difficulty
          </span>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-[#FF6B35]" />
            {quiz.durationMinutes} mins
          </div>
        </div>

        <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">{quiz.title}</h3>
        {quiz.description && (
          <p className="text-xs text-slate-400 line-clamp-2">{quiz.description}</p>
        )}
      </div>

      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold">{quiz.totalMarks} Marks</span>
          <span className="text-slate-500 text-[11px]">(Pass: {quiz.passingMarks})</span>
        </div>

        <button
          onClick={() => onStartQuiz(quiz)}
          className="px-4 py-2 bg-[#FF6B35] hover:bg-[#e05a2b] text-white font-medium text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-[#FF6B35]/20 transition"
        >
          <PlayCircle className="w-3.5 h-3.5" /> Start Test
        </button>
      </div>
    </div>
  );
};
