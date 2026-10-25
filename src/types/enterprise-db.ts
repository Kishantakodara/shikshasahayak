// ============================================================
// SHIKSHA SAHAYAK OS - ENTERPRISE DATABASE ARCHITECTURE TYPES
// ============================================================

/** Domain 1: Core Academic Domain Entity Specifications */
export interface CoreAcademicDomain {
  universitiesTable: 'universities';
  degreesTable: 'degrees';
  branchesTable: 'branches';
  semestersTable: 'semesters';
  subjectsTable: 'subjects';
  subjectUnitsTable: 'subject_units';
  subjectTopicsTable: 'subject_topics';
  subTopicsTable: 'sub_topics';
  learningOutcomesTable: 'learning_outcomes';
  curriculumVersionsTable: 'curriculum_versions';
}

/** Domain 2: Content Domain Entity Specifications */
export interface ContentDomain {
  documentsTable: 'documents';
  resourceMetadataTable: 'resource_metadata';
  contentTaxonomyMapTable: 'content_taxonomy_map';
  contentGovernanceMapTable: 'content_governance_map';
  contentTagsTable: 'content_tags';
  documentTagsMapTable: 'document_tags_map';
  contentVersionHistoryTable: 'content_version_history';
  fileAssetsTable: 'file_assets';
  documentFilesTable: 'document_files';
}

/** Domain 3: Assessment Domain Entity Specifications */
export interface AssessmentDomain {
  quizzesTable: 'quizzes';
  questionsTable: 'questions';
  quizAttemptsTable: 'quiz_attempts';
  iaAssessmentsTable: 'ia_assessments';
  assignmentsTable: 'assignments';
  assignmentSubmissionsTable: 'assignment_submissions';
  assignmentQuestionsTable: 'assignment_questions';
  submissionAnswersTable: 'submission_answers';
}

/** Domain 4: User Domain Entity Specifications */
export interface UserDomain {
  studentProfilesTable: 'student_profiles';
  teacherDepartmentsTable: 'teacher_departments';
  classesTable: 'classes';
  classEnrollmentsTable: 'class_enrollments';
}

/** Domain 5: Learning Domain Entity Specifications */
export interface LearningDomain {
  studentBookmarksTable: 'student_bookmarks';
  studentDownloadsTable: 'student_downloads';
  readingHistoryTable: 'reading_history';
  continueLearningTable: 'continue_learning';
  completedResourcesTable: 'completed_resources';
  userFlashcardsTable: 'user_flashcards';
}

/** Domain 6: Search Domain Entity Specifications */
export interface SearchDomain {
  metadataAliasesTable: 'metadata_aliases';
  searchAnalyticsTable: 'search_analytics';
  popularSearchesTable: 'popular_searches';
}

/** Domain 7: Analytics Domain Entity Specifications */
export interface AnalyticsDomain {
  documentStatsTable: 'document_stats';
  materialStatsTable: 'material_stats';
  studentStatsTable: 'student_stats';
  contentAnalyticsEventsTable: 'content_analytics_events';
}

/** Domain 8: Notification Domain Entity Specifications */
export interface NotificationDomain {
  notificationsTable: 'notifications';
  notificationPreferencesTable: 'notification_preferences';
}

/** Domain 9: Governance & System Domain Entity Specifications */
export interface GovernanceDomain {
  platformsTable: 'platforms';
  contentPermissionsTable: 'content_permissions';
  contentAuditLogsTable: 'content_audit_logs';
  systemSettingsTable: 'system_settings';
  featureFlagsTable: 'feature_flags';
}

/** Domain 10: Relationship Graph Domain Entity Specifications */
export interface RelationshipGraphDomain {
  contentGraphRelationshipsTable: 'content_graph_relationships';
  resourceRelationsTable: 'resource_relations';
}

/** Single Table Metadata Definition */
export interface TableDefinitionSpec {
  tableName: string;
  domain: string;
  primaryKey: string;
  foreignKeys: Array<{ column: string; targetTable: string; targetColumn: string }>;
  indexesCount: number;
  rowCount: number;
}

/** Master Enterprise Schema Overview Payload */
export interface EnterpriseSchemaOverview {
  databaseName: string;
  version: string;
  totalDomains: number;
  totalTables: number;
  domains: Array<{
    name: string;
    description: string;
    tables: string[];
  }>;
  tables: TableDefinitionSpec[];
}

/** Database Health Diagnostics Report */
export interface DatabaseHealthDiagnosticsReport {
  timestamp: string;
  status: 'healthy' | 'warning' | 'critical';
  totalTablesCount: number;
  totalRecordsCount: number;
  orphanedRowsCount: number;
  unindexedForeignKeysCount: number;
  activeFeatureFlagKeys: string[];
  healthScore: number; // 0.0 to 100.0%
}
