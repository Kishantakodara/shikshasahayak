// ============================================================
// CLIENT API: GTU CANONICAL PYQ SYSTEM
// ============================================================

export interface CanonicalQuestionPaper {
  id: string;
  title: string;
  subjectCode?: string;
  examYear: number;
  examSession: 'SUMMER' | 'WINTER';
  sessionLabel: string;
  source: string;
  sourceUrl: string;
  canonicalUrl: string;
  verificationStatus: 'verified' | 'unverified' | 'broken' | 'redirected';
}

export interface CanonicalSubjectCodeGroup {
  id: string;
  subjectCode: string;
  officialSubjectName: string;
  syllabusVersion: string;
  effectiveYear?: number;
  mappingStatus: 'confirmed' | 'probable' | 'needs_review' | 'unmatched';
  totalPapers: number;
  totalVerifiedPapers?: number;
  totalIndexedPapers?: number;
  papers: CanonicalQuestionPaper[];
}

export interface CanonicalSubjectTreeItem {
  id: string;
  canonicalName: string;
  normalizedName: string;
  aliases: string[];
  degree: string;
  branchId: string;
  branchSlug: string;
  branchName: string;
  branchShortName: string;
  semester: number;
  totalSubjectCodes: number;
  totalPapers: number;
  totalVerifiedPapers?: number;
  totalIndexedPapers?: number;
  subjectCodes: CanonicalSubjectCodeGroup[];
}

export interface GtuSyncLog {
  id: string;
  sync_started_at: string;
  sync_completed_at?: string;
  status: 'running' | 'completed' | 'failed';
  candidates_generated?: number;
  discovered_count?: number;
  verified_count?: number;
  broken_count?: number;
  unverified_count?: number;
  indexed_count?: number;
  mapping_review_count?: number;
  links_found: number;
  links_new: number;
  links_existing: number;
  links_verified: number;
  links_failed: number;
  errors?: string;
  summary_json?: string;
}

export interface GtuSyncStats {
  candidateUrls?: number;
  discoveredUrls?: number;
  verifiedUrls?: number;
  brokenUrls?: number;
  unverifiedUrls?: number;
  indexedPapers?: number;
  totalPapers: number;
  totalCanonicalSubjects: number;
  totalSubjectCodes: number;
  verifiedPapers: number;
  brokenPapers: number;
  unverifiedPapers: number;
  pendingReviewCount: number;
}

export interface GtuSubjectMappingItem {
  id: string;
  canonical_subject_id: string;
  subject_code: string;
  official_subject_name: string;
  degree: string;
  branch_id: string;
  branch_name: string;
  branch_slug: string;
  semester: number;
  syllabus_version?: string;
  effective_year?: number;
  aliases?: string;
  confidence: number;
  mapping_status: 'confirmed' | 'probable' | 'needs_review' | 'unmatched';
  canonical_name: string;
  paper_count: number;
  created_at: string;
  updated_at: string;
}

const API_BASE = '/api';

export const gtuPyqClient = {
  /**
   * Fetches Canonical PYQ Tree for student browsing / search.
   */
  getCanonicalTree: async (params?: {
    branch?: string;
    semester?: number | string;
    query?: string;
    code?: string;
    limit?: number;
  }): Promise<{ canonicalSubjects: CanonicalSubjectTreeItem[]; total: number }> => {
    const sp = new URLSearchParams();
    if (params?.branch) sp.set('branch', params.branch);
    if (params?.semester !== undefined && params?.semester !== '') sp.set('semester', String(params.semester));
    if (params?.query) sp.set('query', params.query);
    if (params?.code) sp.set('code', params.code);
    if (params?.limit) sp.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/pyqs/canonical-tree?${sp.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch canonical PYQ tree');
    return res.json();
  },

  /**
   * Fetches single PYQ paper or Canonical Subject details by ID.
   */
  getPyqItem: async (id: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/pyqs/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Failed to fetch PYQ item');
    return res.json();
  },

  /**
   * Admin: Get Sync Logs & Metrics.
   */
  getSyncLogs: async (): Promise<{ logs: GtuSyncLog[]; stats: GtuSyncStats }> => {
    const res = await fetch(`${API_BASE}/admin/pyqs/sync`);
    if (!res.ok) throw new Error('Failed to fetch sync logs');
    return res.json();
  },

  /**
   * Admin: Trigger GTU PYQ Sync.
   */
  triggerSync: async (options?: {
    branchSlug?: string;
    semester?: number;
    subjectCodes?: string[];
    startYear?: number;
    endYear?: number;
    verifyUrls?: boolean;
  }): Promise<any> => {
    const res = await fetch(`${API_BASE}/admin/pyqs/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Sync failed' }));
      throw new Error(err.error || 'Failed to trigger GTU sync');
    }
    return res.json();
  },

  /**
   * Admin: Get Subject Mappings for review.
   */
  getMappings: async (params?: {
    status?: string;
    search?: string;
    branchId?: string;
    semester?: number | string;
    limit?: number;
    offset?: number;
  }): Promise<{ mappings: GtuSubjectMappingItem[]; total: number }> => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.search) sp.set('search', params.search);
    if (params?.branchId) sp.set('branchId', params.branchId);
    if (params?.semester !== undefined && params?.semester !== '') sp.set('semester', String(params.semester));
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.offset) sp.set('offset', String(params.offset));

    const res = await fetch(`${API_BASE}/admin/pyqs/mappings?${sp.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch subject mappings');
    return res.json();
  },

  /**
   * Admin: Update/Approve/Reassign Subject Mapping.
   */
  updateMapping: async (data: {
    mappingId: string;
    action: 'approve' | 'reject' | 'reassign' | 'create_new_subject';
    targetCanonicalSubjectId?: string;
    newCanonicalSubjectName?: string;
  }): Promise<any> => {
    const res = await fetch(`${API_BASE}/admin/pyqs/mappings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Update failed' }));
      throw new Error(err.error || 'Failed to update mapping');
    }
    return res.json();
  },

  /**
   * Admin: Get Canonical Subjects.
   */
  getCanonicalSubjects: async (params?: {
    branchId?: string;
    semester?: number | string;
    search?: string;
  }): Promise<{ canonicalSubjects: any[]; total: number }> => {
    const sp = new URLSearchParams();
    if (params?.branchId) sp.set('branchId', params.branchId);
    if (params?.semester !== undefined && params?.semester !== '') sp.set('semester', String(params.semester));
    if (params?.search) sp.set('search', params.search);

    const res = await fetch(`${API_BASE}/admin/pyqs/canonical-subjects?${sp.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch canonical subjects');
    return res.json();
  },

  /**
   * Admin: Create Canonical Subject.
   */
  createCanonicalSubject: async (data: {
    canonicalName: string;
    branchId: string;
    semester: number;
    degree?: string;
    aliases?: string[];
  }): Promise<any> => {
    const res = await fetch(`${API_BASE}/admin/pyqs/canonical-subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Create failed' }));
      throw new Error(err.error || 'Failed to create canonical subject');
    }
    return res.json();
  },

  /**
   * Admin: Merge Canonical Subjects.
   */
  mergeCanonicalSubjects: async (sourceId: string, targetId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/admin/pyqs/canonical-subjects`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'merge',
        sourceCanonicalSubjectId: sourceId,
        targetCanonicalSubjectId: targetId,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Merge failed' }));
      throw new Error(err.error || 'Failed to merge canonical subjects');
    }
    return res.json();
  },

  /**
   * Admin: Batch URL Verification.
   */
  verifyUrls: async (options?: { limit?: number; status?: string }): Promise<any> => {
    const res = await fetch(`${API_BASE}/admin/pyqs/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    });
    if (!res.ok) throw new Error('Failed to verify URLs');
    return res.json();
  },
};
