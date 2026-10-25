'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  onSelect: (index: number) => void;
  answers: Record<number, any>; // maps index to response
  flagged: Record<number, boolean>; // maps index to true/false
}

export function QuestionNavigator({
  totalQuestions,
  currentIndex,
  onSelect,
  answers,
  flagged,
}: QuestionNavigatorProps) {
  
  const getButtonStyles = (index: number) => {
    const isCurrent = currentIndex === index;
    const isAnswered = answers[index] !== undefined && answers[index] !== '' && (!Array.isArray(answers[index]) || answers[index].length > 0);
    const isFlagged = flagged[index] === true;

    if (isCurrent) {
      return 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 ring-2 ring-primary ring-offset-2';
    }
    if (isFlagged) {
      return 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600';
    }
    if (isAnswered) {
      return 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600';
    }
    return 'bg-accent/40 text-muted-foreground border-transparent hover:bg-accent/80 hover:text-foreground';
  };

  const answeredCount = Object.keys(answers).filter(key => {
    const idx = Number(key);
    return answers[idx] !== undefined && answers[idx] !== '' && (!Array.isArray(answers[idx]) || answers[idx].length > 0);
  }).length;

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-sm font-bold flex justify-between items-center">
          <span>Navigator</span>
          <span className="text-xs text-muted-foreground font-semibold">
            {answeredCount} / {totalQuestions} Answered
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Navigation Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-5 gap-2 max-h-64 sm:max-h-56 overflow-y-auto pr-1">
          {Array.from({ length: totalQuestions }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={cn(
                'h-10 w-10 sm:h-9 sm:w-9 rounded-lg border font-bold text-xs sm:text-xs flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 touch-manipulation',
                getButtonStyles(idx)
              )}
              aria-label={`Go to question ${idx + 1}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t grid grid-cols-2 gap-y-2 text-[11px] sm:text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-primary shrink-0" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-emerald-500 shrink-0" />
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-amber-500 shrink-0" />
            <span>Flagged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-accent shrink-0" />
            <span>Unattempted</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
