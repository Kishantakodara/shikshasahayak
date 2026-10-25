'use client';

import React from 'react';
import { Question, QuestionType } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Check, X, AlertCircle } from 'lucide-react';
import { MathRenderer } from '@/components/ui/MathRenderer';

interface QuestionRendererProps {
  question: Question;
  selectedAnswer: any; // Selected option ID, string array, text, number etc.
  onChange: (value: any) => void;
  showFeedback?: boolean;
  isCorrect?: boolean | null;
  explanation?: string | null;
}

export function QuestionRenderer({
  question,
  selectedAnswer,
  onChange,
  showFeedback = false,
  isCorrect = null,
  explanation,
}: QuestionRendererProps) {
  
  // Extract options if JSON
  const options = typeof question.options === 'string' 
    ? JSON.parse(question.options) 
    : question.options || [];

  const handleMcqSelect = (optionId: string) => {
    onChange(optionId);
  };

  const handleMultipleSelect = (optionId: string, checked: boolean) => {
    const currentAnswers = Array.isArray(selectedAnswer) ? selectedAnswer : [];
    if (checked) {
      onChange([...currentAnswers, optionId]);
    } else {
      onChange(currentAnswers.filter((id: string) => id !== optionId));
    }
  };

  const renderMCQ = () => {
    return (
      <div className="space-y-3">
        {options.map((opt: any) => {
          const isSelected = selectedAnswer === opt.id;
          const isOptCorrect = opt.isCorrect;
          
          let optionStyle = 'border-muted hover:bg-accent/30';
          if (isSelected) optionStyle = 'border-primary bg-primary/5';
          
          if (showFeedback) {
            if (isOptCorrect) {
              optionStyle = 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300';
            } else if (isSelected && !isOptCorrect) {
              optionStyle = 'border-red-500 bg-red-500/5 text-red-700 dark:text-red-300';
            }
          }

          return (
            <div
              key={opt.id}
              onClick={() => !showFeedback && handleMcqSelect(opt.id)}
              className={cn(
                'flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 font-medium text-xs sm:text-sm active:scale-[0.99] touch-manipulation',
                optionStyle
              )}
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1 pr-2">
                <div className={cn(
                  'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] mt-0.5 sm:mt-0',
                  isSelected ? 'border-primary bg-primary text-white' : 'border-muted-foreground/35'
                )}>
                  {isSelected && '✓'}
                </div>
                <span className="break-words leading-relaxed text-foreground">
                  <MathRenderer content={opt.text} inline />
                </span>
              </div>
              
              {showFeedback && (
                <div className="shrink-0">
                  {isOptCorrect && <Check className="h-5 w-5 text-emerald-500" />}
                  {isSelected && !isOptCorrect && <X className="h-5 w-5 text-red-500" />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMultipleCorrect = () => {
    const currentAnswers = Array.isArray(selectedAnswer) ? selectedAnswer : [];

    return (
      <div className="space-y-3">
        {options.map((opt: any) => {
          const isSelected = currentAnswers.includes(opt.id);
          const isOptCorrect = opt.isCorrect;

          let optionStyle = 'border-muted hover:bg-accent/30';
          if (isSelected) optionStyle = 'border-primary bg-primary/5';

          if (showFeedback) {
            if (isOptCorrect) {
              optionStyle = 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300';
            } else if (isSelected && !isOptCorrect) {
              optionStyle = 'border-red-500 bg-red-500/5 text-red-700 dark:text-red-300';
            }
          }

          return (
            <div
              key={opt.id}
              className={cn(
                'flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 transition-all duration-200 font-medium text-xs sm:text-sm active:scale-[0.99] touch-manipulation',
                optionStyle
              )}
            >
              <div className="flex items-start sm:items-center gap-3 w-full min-w-0 flex-1 pr-2">
                <Checkbox
                  id={opt.id}
                  checked={isSelected}
                  disabled={showFeedback}
                  onCheckedChange={(checked) => handleMultipleSelect(opt.id, !!checked)}
                  className="mt-0.5 sm:mt-0 shrink-0"
                />
                <Label htmlFor={opt.id} className="cursor-pointer w-full text-foreground py-0.5 break-words leading-relaxed">
                  <MathRenderer content={opt.text} inline />
                </Label>
              </div>

              {showFeedback && (
                <div className="shrink-0">
                  {isOptCorrect && <Check className="h-5 w-5 text-emerald-500" />}
                  {isSelected && !isOptCorrect && <X className="h-5 w-5 text-red-500" />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTrueFalse = () => {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {['true', 'false'].map((val) => {
          const isSelected = selectedAnswer === val;
          const isValCorrect = question.correctAnswer === val;

          let optionStyle = 'border-muted hover:bg-accent/30';
          if (isSelected) optionStyle = 'border-primary bg-primary/5';

          if (showFeedback) {
            if (isValCorrect) {
              optionStyle = 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300';
            } else if (isSelected && !isValCorrect) {
              optionStyle = 'border-red-500 bg-red-500/5 text-red-700 dark:text-red-300';
            }
          }

          return (
            <div
              key={val}
              onClick={() => !showFeedback && onChange(val)}
              className={cn(
                'p-4 sm:p-6 rounded-xl border-2 text-center font-bold text-xs sm:text-sm cursor-pointer transition-all uppercase tracking-wide active:scale-95 touch-manipulation',
                optionStyle
              )}
            >
              {val}
            </div>
          );
        })}
      </div>
    );
  };

  const renderFillInBlank = () => {
    return (
      <div className="space-y-3">
        <Input
          type="text"
          disabled={showFeedback}
          placeholder="Type your answer here..."
          value={selectedAnswer || ''}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-11 text-base sm:text-sm',
            showFeedback && (
              isCorrect 
                ? 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300' 
                : 'border-red-500 bg-red-500/5 text-red-700 dark:text-red-300'
            )
          )}
        />
        {showFeedback && !isCorrect && (
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 mt-1">
            Correct Answer: {question.correctAnswer}
          </p>
        )}
      </div>
    );
  };

  const renderNumerical = () => {
    return (
      <div className="space-y-3">
        <Input
          type="number"
          disabled={showFeedback}
          placeholder="Enter numeric value..."
          value={selectedAnswer || ''}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-11 text-base sm:text-sm',
            showFeedback && (
              isCorrect 
                ? 'border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300' 
                : 'border-red-500 bg-red-500/5 text-red-700 dark:text-red-300'
            )
          )}
        />
        {showFeedback && !isCorrect && (
          <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 mt-1">
            Correct Answer: {question.correctAnswer}
          </p>
        )}
      </div>
    );
  };

  const renderSubjective = () => {
    return (
      <div className="space-y-3">
        <Textarea
          disabled={showFeedback}
          placeholder="Type detailed explanation here..."
          value={selectedAnswer || ''}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[120px]"
        />
        {showFeedback && (
          <div className="p-3 rounded-lg border bg-amber-500/5 border-amber-500/10 text-xs text-amber-700 dark:text-amber-300 flex gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Subjective answers require manual teacher evaluation.</span>
          </div>
        )}
      </div>
    );
  };

  const renderAssertionReason = () => {
    const options = question.options && Array.isArray(question.options) ? question.options : [
      { id: 'opt-a', text: 'Both Assertion and Reason are true, and Reason is the correct explanation of Assertion.', isCorrect: true },
      { id: 'opt-b', text: 'Both Assertion and Reason are true, but Reason is NOT the correct explanation of Assertion.', isCorrect: false },
      { id: 'opt-c', text: 'Assertion is true, but Reason is false.', isCorrect: false },
      { id: 'opt-d', text: 'Assertion is false, but Reason is true.', isCorrect: false }
    ];

    return (
      <div className="space-y-4">
        {/* Statement Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {question.assertionText && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-left space-y-1">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Assertion (A)</span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">{question.assertionText}</p>
            </div>
          )}
          {question.reasonText && (
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 text-left space-y-1">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Reason (R)</span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">{question.reasonText}</p>
            </div>
          )}
        </div>

        {/* Option Selectors */}
        <div className="space-y-2">
          {options.map((opt: any) => {
            const isSelected = selectedAnswer === opt.id;
            const isOptCorrect = opt.isCorrect || question.correctAnswer === opt.id;
            
            let optionStyle = 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50';
            if (isSelected) optionStyle = 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 text-slate-900 dark:text-white';

            if (showFeedback) {
              if (isOptCorrect) {
                optionStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
              } else if (isSelected && !isOptCorrect) {
                optionStyle = 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-300';
              }
            }

            return (
              <div
                key={opt.id}
                onClick={() => !showFeedback && onChange(opt.id)}
                className={cn(
                  'flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all text-xs font-semibold text-left',
                  optionStyle
                )}
              >
                <span>
                  <MathRenderer content={opt.text} inline />
                </span>
                {showFeedback && (
                  <div>
                    {isOptCorrect && <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
                    {isSelected && !isOptCorrect && <X className="h-4 w-4 text-red-500 shrink-0" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderNumericalKeypad = () => {
    const handleKeyClick = (val: string) => {
      if (showFeedback) return;
      const current = String(selectedAnswer || '');
      if (val === 'CLEAR') {
        onChange('');
      } else if (val === 'BACK') {
        onChange(current.slice(0, -1));
      } else {
        onChange(current + val);
      }
    };

    return (
      <div className="space-y-4 max-w-sm">
        <div className="space-y-1">
          <Input
            type="text"
            readOnly
            disabled={showFeedback}
            placeholder="Click keypad to enter number..."
            value={selectedAnswer || ''}
            className={cn(
              'h-12 text-center text-lg font-mono font-bold tracking-wider',
              showFeedback && (
                isCorrect 
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' 
                  : 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-300'
              )
            )}
          />
          {question.acceptableNumericalRange && (
            <p className="text-[10px] text-slate-500 text-center font-mono">
              Acceptable Range: {question.acceptableNumericalRange.min} to {question.acceptableNumericalRange.max}
            </p>
          )}
        </div>

        {/* On-screen virtual keypad for exam mode */}
        {!showFeedback && (
          <div className="grid grid-cols-4 gap-2">
            {['7', '8', '9', 'BACK', '4', '5', '6', 'CLEAR', '1', '2', '3', '.', '0', '-'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyClick(key)}
                className={cn(
                  'h-10 rounded-xl font-bold text-xs border transition-all cursor-pointer shadow-xs',
                  key === 'CLEAR' || key === 'BACK'
                    ? 'bg-red-50 dark:bg-red-950/30 text-red-600 border-red-200 col-span-1'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                )}
              >
                {key}
              </button>
            ))}
          </div>
        )}

        {showFeedback && (
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs text-emerald-700 dark:text-emerald-300">
            <strong>Correct Answer:</strong> {question.correctAnswer}
          </div>
        )}
      </div>
    );
  };

  const renderQuestionBody = () => {
    if (question.type === QuestionType.ASSERTION_REASON || question.assertionText) {
      return renderAssertionReason();
    }

    switch (question.type) {
      case QuestionType.SINGLE_CORRECT:
        return renderMCQ();
      case QuestionType.MULTIPLE_CORRECT:
        return renderMultipleCorrect();
      case QuestionType.TRUE_FALSE:
        return renderTrueFalse();
      case QuestionType.FILL_IN_BLANK:
        return renderFillInBlank();
      case QuestionType.NAT:
      case QuestionType.NUMERICAL:
        return renderNumericalKeypad();
      case QuestionType.SUBJECTIVE:
        return renderSubjective();
      default:
        return renderMCQ();
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {question.examSource && (
            <Badge className="bg-orange-500 text-white font-mono text-[10px] px-2 py-0.5">
              {question.examSource} {question.examYear || ''}
            </Badge>
          )}
          {question.questionCategory && (
            <Badge variant="outline" className="border-orange-500/40 text-orange-600 dark:text-orange-400 text-[10px] uppercase font-mono">
              {question.questionCategory}
            </Badge>
          )}
          <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px]">
            {question.difficulty}
          </Badge>
          <span className="text-xs text-slate-500 font-semibold ml-auto">Marks: {question.marks}</span>
          {question.negativeMarks > 0 && (
            <Badge variant="destructive" className="text-[9px] uppercase h-5">
              -{question.negativeMarks} Neg
            </Badge>
          )}
        </div>
        <h3 className="font-display font-bold text-base md:text-lg text-slate-900 dark:text-white leading-snug">
          <MathRenderer content={question.questionText} />
        </h3>
        {question.questionImage && (
          <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-64 flex justify-center bg-slate-50 dark:bg-slate-950">
            <img src={question.questionImage} alt="question graphic" className="object-contain max-h-64" />
          </div>
        )}
      </div>

      <div className="pt-2">
        {renderQuestionBody()}
      </div>

      {showFeedback && (explanation || question.explanation || question.stepByStepSolution) && (
        <Card className="border-orange-500/20 bg-orange-50/30 dark:bg-orange-950/10 mt-6 rounded-2xl shadow-xs">
          <CardContent className="p-4 space-y-3 text-left">
            <h5 className="font-bold text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1.5 uppercase tracking-wider">
              💡 Complete Solution & Explanation
            </h5>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <MathRenderer content={explanation || question.explanation} />
            </div>

            {question.stepByStepSolution && question.stepByStepSolution.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <h6 className="text-[11px] font-bold text-slate-900 dark:text-white">Step-by-Step Mathematical Solution:</h6>
                <div className="space-y-1">
                  {question.stepByStepSolution.map((step, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200">
                      <MathRenderer content={step} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
