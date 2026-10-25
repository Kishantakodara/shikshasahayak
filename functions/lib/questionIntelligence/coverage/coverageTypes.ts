// ============================================================
// QUESTION INTELLIGENCE ENGINE - COVERAGE TYPES
// Unified interfaces for deterministic GTU Question Bank coverage.
// ============================================================

export interface SubjectCoverageDetail {
  subjectCode: string;
  subjectName: string;
  shortName: string;
  semester: number;
  isFirstYearCommon: boolean;
  applicableBranches: string[];
  papersDiscovered: number;
  papersCompleted: number;
  papersFailed: number;
  questionsTotal: number;
  mcqCount: number;
  msqCount: number;
  natCount: number;
  descriptiveCount: number;
  verifiedCount: number;
  stagedCount: number;
  pendingCount: number;
  rejectedCount: number;
  archivedCount: number;
  duplicateCount: number;
  coveragePercentage: number;
}

export interface SessionCoverageDetail {
  sessionCode: string;
  examYear: number;
  examSession: 'WINTER' | 'SUMMER';
  papersDiscovered: number;
  papersCompleted: number;
  papersFailed: number;
  questionsTotal: number;
  verifiedCount: number;
  pendingCount: number;
  rejectedCount: number;
  failureRate: number;
}

export interface SemesterCoverageDetail {
  semester: number;
  subjectsCount: number;
  totalQuestions: number;
  verifiedQuestions: number;
  pendingQuestions: number;
  coveragePercentage: number;
}

export interface BranchCoverageDetail {
  branchId: string;
  branchName: string;
  mappedSubjectsCount: number;
  totalQuestions: number;
  verifiedQuestions: number;
}

export interface QuestionBankCoverageSummary {
  totalFirstYearSubjects: number;
  totalHistoricalSessions: number;
  totalDiscoveredPapers: number;
  totalCompletedPapers: number;
  totalFailedPapers: number;
  totalQuestions: number;
  verifiedQuestions: number;
  stagedQuestions: number;
  pendingQuestions: number;
  rejectedQuestions: number;
  archivedQuestions: number;
  duplicateClustersCount: number;
  overallCoveragePercentage: number;
  moderationBacklogCount: number;
  ingestionFailureRate: number;
  retryBacklogCount: number;
  subjectCoverage: SubjectCoverageDetail[];
  sessionCoverage: SessionCoverageDetail[];
  semesterCoverage: SemesterCoverageDetail[];
  branchCoverage: BranchCoverageDetail[];
}
