// ============================================================
// SHIKSHA SAHAYAK OS - MASTER INTEGRATION & BLUEPRINT TYPES
// ============================================================

/** Architecture Document Status */
export type DocStatus = 'draft' | 'in_review' | 'approved' | 'implemented';

/** 10 Execution Stages */
export type MilestoneStage =
  | 'stage_1'
  | 'stage_2'
  | 'stage_3'
  | 'stage_4'
  | 'stage_5'
  | 'stage_6'
  | 'stage_7'
  | 'stage_8'
  | 'stage_9'
  | 'stage_10';

/** Architecture Document Registry Record Specification */
export interface ArchitectureDocSpec {
  docId: string;
  title: string;
  phase: string;
  status: DocStatus;
  completedAt: string;
}

/** Execution Milestone Roadmap Specification */
export interface ExecutionMilestoneSpec {
  milestoneId: string;
  stageNumber: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  completionPercent: number;
  completedAt: string;
}

/** Module Readiness Specification */
export interface ModuleReadinessSpec {
  moduleKey: string;
  name: string;
  readinessScore: number; // 0.0 to 100.0%
  isProductionReady: boolean;
  updatedAt: string;
}

/** Master Dependency Graph DAG Node */
export interface MasterDependencyNode {
  docId: string;
  title: string;
  stageNumber: number;
  prerequisites: string[];
  dependents: string[];
}

/** Master Blueprint Overview Report Payload */
export interface MasterBlueprintReport {
  timestamp: string;
  totalDocumentsCount: number;
  completedDocumentsCount: number;
  totalMilestonesCount: number;
  completedMilestonesCount: number;
  overallSystemReadinessScore: number; // 0.0 to 100.0%
  documents: ArchitectureDocSpec[];
  milestones: ExecutionMilestoneSpec[];
  readinessMatrix: ModuleReadinessSpec[];
  productionAcceptanceChecklistCount: number;
}
