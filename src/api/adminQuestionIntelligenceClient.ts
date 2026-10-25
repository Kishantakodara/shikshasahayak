// ============================================================
// ADMIN QUESTION INTELLIGENCE API CLIENT
// Typed frontend client for all question intelligence operations.
// ============================================================

import { fetchWithAuth } from './client';

export interface QuestionIntelligenceOverviewSnapshot {
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'INSUFFICIENT_DATA';
  overallHealthScore: number;
  coverageScore: number;
  qualityScore: number;
  totalQuestions: number;
  verifiedQuestions: number;
  stagedQuestions: number;
  rejectedQuestions: number;
  archivedQuestions: number;
  originalPyqCount: number;
  aiGeneratedCount: number;
  duplicateClusterCount: number;
  unmappedQuestionCount: number;
  failedIngestionCount: number;
  subjectsCovered: number;
  sessionsCovered: number;
  warnings: Array<{
    id: string;
    level: 'CRITICAL' | 'HIGH' | 'NORMAL';
    category: string;
    title: string;
    description: string;
    actionUrl?: string;
  }>;
  generatedAt: string;
}

export interface MatrixSessionCell {
  sessionCode: string;
  sessionName: string;
  session: string;
  year: number;
  status: 'VERIFIED' | 'STAGED' | 'PARTIAL' | 'FAILED' | 'NOT_DISCOVERED';
  totalQuestions: number;
  verifiedQuestions: number;
  stagedQuestions: number;
  rejectedQuestions: number;
}

export interface MatrixSubjectRow {
  subjectCode: string;
  subjectName: string;
  semester: number;
  totalVerified: number;
  totalStaged: number;
  sessions: MatrixSessionCell[];
}

export interface QuestionInspectorDetail {
  id: string;
  questionText: string;
  questionType: string;
  subjectCode: string;
  subjectName: string;
  semester: number;
  unitNo: number;
  unitName: string;
  topicName: string;
  conceptTags: string[];
  difficulty: string;
  marks: number;
  options: Array<{ id: string; text: string }>;
  provenanceType: 'ORIGINAL GTU PYQ' | 'AI PRACTICE' | 'CURATED';
  isOriginalPyq: boolean;
  isAiGenerated: boolean;
  sourceType: string;
  paperId?: string;
  examName?: string;
  examSession?: string;
  examYear?: number;
  sourceUrl?: string;
  pageNumber?: number;
  verificationStatus: string;
  quality?: {
    overallScore: number;
    qualityBand: string;
    confidenceBand: string;
    flags: string[];
    evaluatedAt: string;
  } | null;
  curriculumMapping?: {
    mappingStatus: string;
    mappingConfidence: number;
    mappedBy: string;
  } | null;
  duplicateCluster?: {
    clusterId: string;
    repeatFrequencyBand: string;
    totalOccurrences: number;
    canonicalQuestionText: string;
    otherOccurrences: Array<{
      questionId: string;
      examSession?: string;
      examYear?: number;
      similarityScore: number;
      questionText: string;
      verificationStatus: string;
    }>;
  } | null;
  auditTrail: Array<{
    id: string;
    actorId: string;
    actorRole?: string;
    action: string;
    reason?: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export const adminQuestionIntelligenceClient = {
  async getOverview(): Promise<{ success: boolean; snapshot: QuestionIntelligenceOverviewSnapshot }> {
    const res = await fetchWithAuth('/api/admin/question-intelligence/overview');
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch overview snapshot`);
    return res.json();
  },

  async getMatrix(): Promise<{ success: boolean; subjects: any[]; sessions: any[]; matrix: MatrixSubjectRow[] }> {
    const res = await fetchWithAuth('/api/admin/question-intelligence/matrix');
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch subject session matrix`);
    return res.json();
  },

  async getCoverage(): Promise<{ success: boolean; coverage: any }> {
    const res = await fetchWithAuth('/api/admin/question-intelligence/coverage');
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch coverage`);
    return res.json();
  },

  async getQuality(params?: { subjectCode?: string; qualityBand?: string; limit?: number }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.subjectCode) q.set('subjectCode', params.subjectCode);
    if (params?.qualityBand) q.set('qualityBand', params.qualityBand);
    if (params?.limit) q.set('limit', String(params.limit));
    const res = await fetchWithAuth(`/api/admin/question-intelligence/quality?${q.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch quality analytics`);
    return res.json();
  },

  async getDuplicates(params?: { subjectCode?: string }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.subjectCode) q.set('subjectCode', params.subjectCode);
    const res = await fetchWithAuth(`/api/admin/question-intelligence/duplicates?${q.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch duplicate intelligence`);
    return res.json();
  },

  async getCurriculum(params?: { subjectCode?: string; status?: string }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.subjectCode) q.set('subjectCode', params.subjectCode);
    if (params?.status) q.set('status', params.status);
    const res = await fetchWithAuth(`/api/admin/question-intelligence/curriculum?${q.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch curriculum mappings`);
    return res.json();
  },

  async getDifficulty(params?: { subjectCode?: string }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.subjectCode) q.set('subjectCode', params.subjectCode);
    const res = await fetchWithAuth(`/api/admin/question-intelligence/difficulty?${q.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch difficulty intelligence`);
    return res.json();
  },

  async getPatterns(params?: { subjectCode?: string }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.subjectCode) q.set('subjectCode', params.subjectCode);
    const res = await fetchWithAuth(`/api/admin/question-intelligence/patterns?${q.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch pattern intelligence`);
    return res.json();
  },

  async getModerationQueue(params?: { priority?: string; subjectCode?: string; limit?: number }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.priority) q.set('priority', params.priority);
    if (params?.subjectCode) q.set('subjectCode', params.subjectCode);
    if (params?.limit) q.set('limit', String(params.limit));
    const res = await fetchWithAuth(`/api/admin/question-intelligence/moderation?${q.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch moderation queue`);
    return res.json();
  },

  async getOperations(): Promise<any> {
    const res = await fetchWithAuth('/api/admin/question-intelligence/operations');
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch operations status`);
    return res.json();
  },

  async searchQuestions(params: {
    q?: string;
    subjectCode?: string;
    topicName?: string;
    unitNo?: number;
    session?: string;
    year?: number;
    type?: string;
    status?: string;
    difficulty?: string;
    isOriginalPyq?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<any> {
    const q = new URLSearchParams();
    if (params.q) q.set('q', params.q);
    if (params.subjectCode) q.set('subjectCode', params.subjectCode);
    if (params.topicName) q.set('topicName', params.topicName);
    if (params.unitNo !== undefined) q.set('unitNo', String(params.unitNo));
    if (params.session) q.set('session', params.session);
    if (params.year !== undefined) q.set('year', String(params.year));
    if (params.type) q.set('type', params.type);
    if (params.status) q.set('status', params.status);
    if (params.difficulty) q.set('difficulty', params.difficulty);
    if (params.isOriginalPyq !== undefined) q.set('isOriginalPyq', String(params.isOriginalPyq));
    if (params.page !== undefined) q.set('page', String(params.page));
    if (params.pageSize !== undefined) q.set('pageSize', String(params.pageSize));

    const res = await fetchWithAuth(`/api/admin/question-intelligence/search?${q.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to search questions`);
    return res.json();
  },

  async getQuestionDetail(id: string): Promise<{ success: boolean; question: QuestionInspectorDetail }> {
    const res = await fetchWithAuth(`/api/admin/question-intelligence/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch question detail`);
    return res.json();
  },

  async getAuditLog(params?: { questionId?: string; action?: string; limit?: number }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.questionId) q.set('questionId', params.questionId);
    if (params?.action) q.set('action', params.action);
    if (params?.limit) q.set('limit', String(params.limit));
    const res = await fetchWithAuth(`/api/admin/question-intelligence/audit?${q.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch audit log`);
    return res.json();
  },
};
