// ============================================================
// ShikshaSahayak Assessment Platform — Rule-Based Recommendation Engine
// Zero AI API cost — Fast, deterministic, high-yield learning suggestions
// ============================================================

import { BRANCH_PACKS, GOAL_PACKS, normalizeBranchId } from '../config/assessmentPacks';

export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  category: 'weak_topic' | 'goal_booster' | 'daily_target' | 'pyq_focus';
  actionLabel: string;
  actionTab?: string;
  priority: 'high' | 'medium' | 'low';
  tag: string;
}

export function generateStudentRecommendations(params: {
  university?: string;
  branch: string;
  semester: number;
  selectedGoals: string[];
  userStats: {
    xp: number;
    streak: number;
    dailyChallengeDone?: boolean;
  };
  subjectAccuracies?: Record<string, number>; // e.g. { "Thermodynamics": 48, "DBMS": 85 }
}): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];
  const branchKey = normalizeBranchId(params.branch);
  const pack = BRANCH_PACKS[branchKey] || BRANCH_PACKS['cse'];
  const semesterNum = Number(params.semester) || 3;
  const currentSemesterSubjects = pack.coreSubjects[semesterNum] || pack.coreSubjects[3] || [];

  // 1. Weak Topics Recommendation (< 60% accuracy)
  if (params.subjectAccuracies) {
    Object.entries(params.subjectAccuracies).forEach(([subject, accuracy]) => {
      if (accuracy < 60) {
        recommendations.push({
          id: `weak-${subject.toLowerCase().replace(/\s+/g, '-')}`,
          title: `Low Accuracy Alert: ${subject} (${accuracy}%)`,
          description: `Your average score in ${subject} is below 60%. Revise formula sheets and attempt previous year questions to boost your CPI.`,
          category: 'weak_topic',
          actionLabel: `Revise ${subject}`,
          actionTab: 'GATE PYQ Zone',
          priority: 'high',
          tag: 'Needs Focus',
        });
      }
    });
  }

  // 2. Goal-Based Targeted Recommendations
  params.selectedGoals.forEach((goalId) => {
    const goalConfig = GOAL_PACKS[goalId];
    if (!goalConfig) return;

    if (goalId === 'gtu_prep') {
      recommendations.push({
        id: 'rec-gtu-pyq',
        title: 'GTU End-Sem PYQ Mastery',
        description: `Solve 7-mark questions for ${pack.name} Semester ${params.semester} to lock in top grades.`,
        category: 'pyq_focus',
        actionLabel: 'Open GTU PYQs',
        actionTab: 'GATE PYQ Zone',
        priority: 'high',
        tag: 'GTU Exam',
      });
    }

    if (goalId === 'gate_prep') {
      recommendations.push({
        id: 'rec-gate-concept',
        title: 'GATE Concept & NAT Drills',
        description: 'Practice Numerical Answer Type (NAT) and Multiple Select Questions (MSQ) for competitive edge.',
        category: 'goal_booster',
        actionLabel: 'Start GATE Test',
        actionTab: 'GATE PYQ Zone',
        priority: 'high',
        tag: 'GATE Target',
      });
    }

    if (goalId === 'placement_prep') {
      recommendations.push({
        id: 'rec-placement-apt',
        title: 'Placement Technical & Aptitude Drill',
        description: 'Complete 10 aptitude questions and review tech interview notes.',
        category: 'goal_booster',
        actionLabel: 'Practice Aptitude',
        actionTab: 'Quizzes',
        priority: 'medium',
        tag: 'Placement',
      });
    }

    if (goalId === 'coding_practice') {
      recommendations.push({
        id: 'rec-coding-war',
        title: 'Daily Code Challenge',
        description: 'Solve today’s algorithmic puzzle to maintain your active streak.',
        category: 'daily_target',
        actionLabel: 'Solve Problem',
        actionTab: '🔥 Daily Challenge',
        priority: 'medium',
        tag: 'Coding',
      });
    }
  });

  // 3. Fallback / General Recommendation if list is small
  if (recommendations.length === 0) {
    const firstSubject = currentSemesterSubjects[0] || 'Core Subject';
    recommendations.push({
      id: 'rec-default-daily',
      title: `Daily Practice: ${firstSubject}`,
      description: `Test your understanding of ${firstSubject} with today's 5-question quick assessment.`,
      category: 'daily_target',
      actionLabel: 'Start Practice',
      actionTab: 'Quizzes',
      priority: 'medium',
      tag: 'Daily Quiz',
    });
  }

  return recommendations;
}
