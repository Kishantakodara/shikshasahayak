/**
 * Grading Engine
 * 
 * Auto-grading functionality for assignments and quizzes
 */

import type { 
  GradingResult, 
  RubricCriterion, 
  AssignmentSubmission,
  QuizAttempt 
} from '../../types/teacher';

export interface AutoGradingResult {
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  breakdown: {
    mcq?: { correct: number; total: number; marks: number };
    objective?: { correct: number; total: number; marks: number };
    penalty?: { latePenalty: number; reason: string };
  };
  gradedQuestions: Array<{
    questionId: string;
    marks: number;
    maxMarks: number;
    isCorrect: boolean;
    feedback?: string;
  }>;
}

export interface RubricGradingResult {
  criteria: Array<{
    criterionId: string;
    name: string;
    maxPoints: number;
    scoredPoints: number;
    feedback?: string;
  }>;
  totalPoints: number;
  maxPoints: number;
  percentage: number;
}

/**
 * Auto-grade a quiz attempt by comparing answers to correct answers
 */
export async function autoGradeQuiz(
  attempt: QuizAttempt,
  questions: any[],
  negativeMarking: boolean = false
): Promise<AutoGradingResult> {
  let totalMarks = 0;
  let maxMarks = 0;
  let correctCount = 0;
  let totalQuestions = 0;
  const gradedQuestions: AutoGradingResult['gradedQuestions'] = [];

  for (const question of questions) {
    const studentAnswer = attempt.answers[question.id];
    maxMarks += question.max_marks;
    totalQuestions++;

    let marks = 0;
    let isCorrect = false;
    let feedback = '';

    if (question.question_type === 'MCQ') {
      if (studentAnswer && studentAnswer === question.correct_answer) {
        marks = question.max_marks;
        isCorrect = true;
        correctCount++;
        feedback = 'Correct answer';
      } else if (negativeMarking && studentAnswer) {
        // Apply negative marking (typically 1/3 of positive marks)
        marks = -(question.max_marks / 3);
        feedback = 'Incorrect answer (negative marking applied)';
      } else {
        feedback = studentAnswer ? 'Incorrect answer' : 'No answer provided';
      }
    } else if (question.question_type === 'SHORT_ANSWER' && question.correct_answer) {
      // Simple string matching for objective short answers
      const studentAnswerNormalized = studentAnswer?.toLowerCase().trim();
      const correctAnswerNormalized = question.correct_answer.toLowerCase().trim();
      
      if (studentAnswerNormalized === correctAnswerNormalized) {
        marks = question.max_marks;
        isCorrect = true;
        correctCount++;
        feedback = 'Correct answer';
      } else {
        feedback = 'Requires manual review';
      }
    } else {
      // Questions requiring manual grading (LONG_ANSWER, FILE_UPLOAD, CODE)
      feedback = 'Requires manual grading';
    }

    totalMarks += marks;
    gradedQuestions.push({
      questionId: question.id,
      marks,
      maxMarks: question.max_marks,
      isCorrect,
      feedback,
    });
  }

  const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

  return {
    totalMarks,
    maxMarks,
    percentage,
    breakdown: {
      mcq: { correct: correctCount, total: totalQuestions, marks: totalMarks },
    },
    gradedQuestions,
  };
}

/**
 * Auto-grade assignment submission for objective questions
 */
export async function autoGradeAssignment(
  submission: AssignmentSubmission,
  assignmentQuestions: any[]
): Promise<AutoGradingResult> {
  let totalMarks = 0;
  let maxMarks = 0;
  let correctCount = 0;
  const gradedQuestions: AutoGradingResult['gradedQuestions'] = [];

  const objectiveQuestions = assignmentQuestions.filter(q => 
    q.question_type === 'MCQ' || 
    (q.question_type === 'SHORT_ANSWER' && q.correct_answer)
  );

  for (const question of objectiveQuestions) {
    const studentAnswer = submission.answers?.[question.id];
    maxMarks += question.max_marks;

    let marks = 0;
    let isCorrect = false;
    let feedback = '';

    if (question.question_type === 'MCQ') {
      if (studentAnswer && studentAnswer === question.correct_answer) {
        marks = question.max_marks;
        isCorrect = true;
        correctCount++;
        feedback = 'Correct answer';
      } else {
        feedback = studentAnswer ? 'Incorrect answer' : 'No answer provided';
      }
    } else if (question.question_type === 'SHORT_ANSWER') {
      const studentAnswerNormalized = studentAnswer?.toLowerCase().trim();
      const correctAnswerNormalized = question.correct_answer.toLowerCase().trim();
      
      if (studentAnswerNormalized === correctAnswerNormalized) {
        marks = question.max_marks;
        isCorrect = true;
        correctCount++;
        feedback = 'Correct answer';
      } else {
        feedback = 'Incorrect answer';
      }
    }

    totalMarks += marks;
    gradedQuestions.push({
      questionId: question.id,
      marks,
      maxMarks: question.max_marks,
      isCorrect,
      feedback,
    });
  }

  const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

  return {
    totalMarks,
    maxMarks,
    percentage,
    breakdown: {
      objective: { correct: correctCount, total: objectiveQuestions.length, marks: totalMarks },
    },
    gradedQuestions,
  };
}

/**
 * Calculate late penalty based on submission time and due date
 */
export function calculateLatePenalty(
  submittedAt: Date,
  dueDate: Date,
  penaltyPercent: number
): { penalty: number; hoursLate: number } {
  if (submittedAt <= dueDate) {
    return { penalty: 0, hoursLate: 0 };
  }

  const hoursLate = Math.ceil((submittedAt.getTime() - dueDate.getTime()) / (1000 * 60 * 60));
  const penalty = Math.min(penaltyPercent, 100); // Cap at 100%

  return { penalty, hoursLate };
}

/**
 * Validate that marks are within acceptable bounds
 */
export function validateMarksWithinBounds(marks: number, totalMarks: number): {
  isValid: boolean;
  error?: string;
} {
  if (marks < 0) {
    return { isValid: false, error: 'Marks cannot be negative' };
  }

  if (marks > totalMarks) {
    return { isValid: false, error: `Marks (${marks}) cannot exceed total marks (${totalMarks})` };
  }

  return { isValid: true };
}

/**
 * Apply rubric grading to a submission
 */
export function applyRubricGrading(
  rubric: RubricCriterion[],
  criteriaScores: Record<string, { points: number; feedback?: string }>
): RubricGradingResult {
  const criteria = rubric.map(criterion => {
    const score = criteriaScores[criterion.id] || { points: 0 };
    return {
      criterionId: criterion.id,
      name: criterion.name,
      maxPoints: criterion.maxPoints,
      scoredPoints: Math.min(score.points, criterion.maxPoints),
      feedback: score.feedback,
    };
  });

  const totalPoints = criteria.reduce((sum, c) => sum + c.scoredPoints, 0);
  const maxPoints = criteria.reduce((sum, c) => sum + c.maxPoints, 0);
  const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;

  return {
    criteria,
    totalPoints,
    maxPoints,
    percentage,
  };
}

/**
 * Generate auto-feedback based on performance
 */
export function generateAutoFeedback(result: AutoGradingResult): string {
  const { percentage, breakdown } = result;
  let feedback = '';

  if (percentage >= 90) {
    feedback = 'Excellent work! ';
  } else if (percentage >= 80) {
    feedback = 'Good job! ';
  } else if (percentage >= 70) {
    feedback = 'Well done! ';
  } else if (percentage >= 60) {
    feedback = 'Satisfactory work. ';
  } else {
    feedback = 'Needs improvement. ';
  }

  if (breakdown.mcq) {
    const { correct, total } = breakdown.mcq;
    feedback += `You answered ${correct} out of ${total} questions correctly.`;
  }

  if (breakdown.penalty) {
    feedback += ` Note: Late penalty of ${breakdown.penalty.reason} was applied.`;
  }

  return feedback.trim();
}

/**
 * Calculate grade distribution for a set of submissions
 */
export function calculateGradeDistribution(submissions: { marks: number; totalMarks: number }[]): {
  ranges: Array<{ label: string; count: number; percentage: number }>;
  stats: {
    average: number;
    median: number;
    highest: number;
    lowest: number;
    standardDeviation: number;
  };
} {
  const percentages = submissions
    .filter(s => s.marks !== null && s.totalMarks > 0)
    .map(s => (s.marks / s.totalMarks) * 100);

  if (percentages.length === 0) {
    return {
      ranges: [
        { label: '90-100%', count: 0, percentage: 0 },
        { label: '80-89%', count: 0, percentage: 0 },
        { label: '70-79%', count: 0, percentage: 0 },
        { label: '60-69%', count: 0, percentage: 0 },
        { label: '0-59%', count: 0, percentage: 0 },
      ],
      stats: {
        average: 0,
        median: 0,
        highest: 0,
        lowest: 0,
        standardDeviation: 0,
      },
    };
  }

  // Calculate ranges
  const ranges = [
    { label: '90-100%', count: 0, percentage: 0 },
    { label: '80-89%', count: 0, percentage: 0 },
    { label: '70-79%', count: 0, percentage: 0 },
    { label: '60-69%', count: 0, percentage: 0 },
    { label: '0-59%', count: 0, percentage: 0 },
  ];

  percentages.forEach(p => {
    if (p >= 90) ranges[0].count++;
    else if (p >= 80) ranges[1].count++;
    else if (p >= 70) ranges[2].count++;
    else if (p >= 60) ranges[3].count++;
    else ranges[4].count++;
  });

  ranges.forEach(range => {
    range.percentage = (range.count / percentages.length) * 100;
  });

  // Calculate statistics
  const sorted = [...percentages].sort((a, b) => a - b);
  const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  const variance = percentages.reduce((sum, p) => sum + Math.pow(p - average, 2), 0) / percentages.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    ranges,
    stats: {
      average: Math.round(average * 100) / 100,
      median: Math.round(median * 100) / 100,
      highest: Math.round(Math.max(...percentages) * 100) / 100,
      lowest: Math.round(Math.min(...percentages) * 100) / 100,
      standardDeviation: Math.round(standardDeviation * 100) / 100,
    },
  };
}