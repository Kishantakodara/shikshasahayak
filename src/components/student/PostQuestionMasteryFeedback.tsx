import React from 'react';
import { CheckCircle, XCircle, TrendingUp, ArrowRight } from 'lucide-react';

interface PostQuestionMasteryFeedbackProps {
  isCorrect: boolean;
  masteryFeedback?: {
    subjectCode: string;
    topicName: string;
    newMasteryScore: number;
    masteryLevel: string;
    recommendedAction: string;
  } | null;
  onNextQuestion: () => void;
}

export function PostQuestionMasteryFeedback({
  isCorrect,
  masteryFeedback,
  onNextQuestion,
}: PostQuestionMasteryFeedbackProps) {
  return (
    <div className={`p-4 rounded-xl border text-xs space-y-3 ${
      isCorrect ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' : 'bg-red-950/80 border-red-800 text-red-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-sm">
          {isCorrect ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
          <span>{isCorrect ? 'Correct Answer!' : 'Incorrect Answer'}</span>
        </div>
        <button
          onClick={onNextQuestion}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs flex items-center gap-1"
        >
          Next Question <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {masteryFeedback && (
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between gap-4 text-slate-200">
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">{masteryFeedback.topicName} Mastery</div>
            <div className="text-xs font-bold text-slate-100 mt-0.5">{masteryFeedback.recommendedAction}</div>
          </div>
          <div className="text-right">
            <div className="text-base font-extrabold text-orange-400">{masteryFeedback.newMasteryScore}%</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">{masteryFeedback.masteryLevel}</div>
          </div>
        </div>
      )}
    </div>
  );
}
