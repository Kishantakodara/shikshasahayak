// ============================================================
// SHIKSHA SAHAYAK OS - TESTING, QUALITY ASSURANCE & STANDARDS TYPES
// ============================================================

/** 9 Test Suite Types */
export type TestSuiteType =
  | 'unit'
  | 'integration'
  | 'component'
  | 'api'
  | 'e2e'
  | 'regression'
  | 'performance'
  | 'accessibility'
  | 'security';

/** Technical Debt Severity Levels */
export type DebtSeverity = 'low' | 'medium' | 'high' | 'critical';

/** Quality Gate Execution Record Specification */
export interface QualityGateSpec {
  id: string;
  prId: string;
  gateName: 'format_check' | 'lint_check' | 'type_check' | 'unit_tests' | 'integration_tests' | 'build_validation' | 'security_audit';
  status: 'passed' | 'failed' | 'skipped';
  executionTimeMs: number;
  createdAt: string;
}

/** Test Suite Metrics Record Specification */
export interface TestSuiteMetricsSpec {
  id: string;
  suiteType: TestSuiteType;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coveragePercent: number; // 0.0 to 100.0%
  createdAt: string;
}

/** Technical Debt Log Record Specification */
export interface TechnicalDebtEntry {
  id: string;
  moduleKey: string;
  severity: DebtSeverity;
  title: string;
  description: string;
  refactoringEffortDays: number;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

/** 10-Point Definition of Done Checklist */
export interface DefinitionOfDoneChecklist {
  implementationComplete: boolean;
  unitTestsPassing: boolean;
  zeroTypeErrors: boolean;
  backwardCompatibilityVerified: boolean;
  securityVerified: boolean;
  accessibilityAudited: boolean;
  responsiveLayoutVerified: boolean;
  performanceTargetsMet: boolean;
  technicalDebtLogged: boolean;
  codeReviewApproved: boolean;
}

/** Quality Assurance Overview Report Payload */
export interface QualityOverviewReport {
  timestamp: string;
  overallPassRatePercent: number;
  qualityGates: QualityGateSpec[];
  testSuites: TestSuiteMetricsSpec[];
  openTechnicalDebt: TechnicalDebtEntry[];
  definitionOfDone: DefinitionOfDoneChecklist;
  qualityScore: number; // 0.0 to 100.0%
}
