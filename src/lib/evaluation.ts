import { Question, QuestionType, QuizAttempt, QuizResponse, QuizQuestion } from '@/types';

interface EvaluationResult {
  isCorrect: boolean;
  marksObtained: number;
}

/**
 * Evaluates a single student response for a given question.
 * Supports exact matching for Single Choice, True/False, Fill in Blank.
 * Array intersection checks for Multiple Correct.
 * Numerical range checks for numeric tolerances.
 */
export function evaluateResponse(
  question: Question,
  selectedAnswer: any,
  questionMarks: number = question.marks,
  negativeMarks: number = question.negativeMarks
): EvaluationResult {
  // If student skipped the question
  if (selectedAnswer === undefined || selectedAnswer === null || selectedAnswer === '') {
    return { isCorrect: false, marksObtained: 0 };
  }

  const cleanVal = (val: any) => String(val).trim().toLowerCase();

  switch (question.type) {
    case QuestionType.SINGLE_CORRECT:
    case QuestionType.TRUE_FALSE: {
      const isCorrect = cleanVal(selectedAnswer) === cleanVal(question.correctAnswer);
      return {
        isCorrect,
        marksObtained: isCorrect ? questionMarks : -negativeMarks,
      };
    }

    case QuestionType.MULTIPLE_CORRECT: {
      const correctAnswersList = typeof question.correctAnswers === 'string'
        ? JSON.parse(question.correctAnswers)
        : question.correctAnswers || [];
      
      const studentAnswersList = Array.isArray(selectedAnswer) ? selectedAnswer : [];

      if (correctAnswersList.length === 0 || studentAnswersList.length === 0) {
        return { isCorrect: false, marksObtained: -negativeMarks };
      }

      // Check if student selected exactly the correct options
      const hasAllCorrect = 
        correctAnswersList.length === studentAnswersList.length &&
        correctAnswersList.every((ans: string) => studentAnswersList.includes(ans));

      return {
        isCorrect: hasAllCorrect,
        marksObtained: hasAllCorrect ? questionMarks : -negativeMarks,
      };
    }

    case QuestionType.FILL_IN_BLANK: {
      const isCorrect = cleanVal(selectedAnswer) === cleanVal(question.correctAnswer);
      return {
        isCorrect,
        marksObtained: isCorrect ? questionMarks : -negativeMarks,
      };
    }

    case QuestionType.NUMERICAL: {
      const studentNum = Number(selectedAnswer);
      const correctNum = Number(question.correctAnswer);

      if (isNaN(studentNum) || isNaN(correctNum)) {
        return { isCorrect: false, marksObtained: -negativeMarks };
      }

      // Allow 0.01 tolerance window for float roundings
      const tolerance = 0.01;
      const isCorrect = Math.abs(studentNum - correctNum) <= tolerance;

      return {
        isCorrect,
        marksObtained: isCorrect ? questionMarks : -negativeMarks,
      };
    }

    case QuestionType.SUBJECTIVE:
    default:
      // Subjective questions cannot be auto-evaluated.
      // Set obtained marks as 0, awaiting manual teacher grading
      return {
        isCorrect: false,
        marksObtained: 0,
      };
  }
}

interface QuizEvaluationReport {
  obtainedMarks: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  percentage: number;
  isEvaluated: boolean; // false if there are subjective questions needing manual review
}

/**
 * Evaluates an entire quiz attempt by matching student responses against their respective questions.
 */
export function evaluateQuiz(
  questions: QuizQuestion[],
  responses: Record<string, any> // mapping: questionId -> studentAnswer
): QuizEvaluationReport {
  let obtainedMarks = 0;
  let totalMarks = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let hasSubjective = false;

  questions.forEach((qq) => {
    const q = qq.question;
    if (!q) return;

    const qMarks = qq.marks ?? q.marks;
    const qNeg = qq.negativeMarks ?? q.negativeMarks;
    totalMarks += qMarks;

    if (q.type === QuestionType.SUBJECTIVE) {
      hasSubjective = true;
    }

    const studentAns = responses[q.id];

    if (studentAns === undefined || studentAns === null || studentAns === '') {
      skippedCount++;
    } else {
      const result = evaluateResponse(q, studentAns, qMarks, qNeg);
      obtainedMarks += result.marksObtained;
      if (q.type !== QuestionType.SUBJECTIVE) {
        if (result.isCorrect) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    }
  });

  const finalScore = Math.max(0, obtainedMarks);
  const percentage = totalMarks > 0 ? (finalScore / totalMarks) * 100 : 0;

  return {
    obtainedMarks: Number(finalScore.toFixed(2)),
    correctCount,
    wrongCount,
    skippedCount,
    percentage: Number(percentage.toFixed(1)),
    isEvaluated: !hasSubjective,
  };
}
