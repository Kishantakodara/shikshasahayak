// ============================================================
// SHIKSHA SAHAYAK OS: ACADEMIC MANAGEMENT API CLIENT
// Complete frontend client for Academic Management Suite
// ============================================================

import {
  AcademicOverviewStats,
  UniversityAdminItem,
  BranchAdminItem,
  SemesterAdminItem,
  SubjectAdminItem,
  AcademicYearAdminItem,
  AcademicFilterState,
  UnitCoverageItem,
} from '../types/academic-management';
import { fetchWithAuth } from './client';

const API_ROOT = '/api/admin/academic';

export const academicManagementClient = {
  /**
   * 1. Overview & Hierarchy Stats
   */
  async getOverview(): Promise<AcademicOverviewStats> {
    try {
      const res = await fetchWithAuth(`${API_ROOT}/overview`);
      if (!res.ok) throw new Error(`Failed to load overview: ${res.statusText}`);
      const data = await res.json();
      return data;
    } catch (e) {
      console.error('Error fetching academic overview:', e);
      // Clean zero fallback
      return {
        kpis: {
          universities: { total: 0, active: 0, inactive: 0, draft: 0 },
          branches: { total: 0, active: 0, inactive: 0, draft: 0 },
          semesters: { total: 0, active: 0, inactive: 0, draft: 0 },
          subjects: { total: 0, active: 0, inactive: 0, draft: 0, withContent: 0, withoutContent: 0 },
          academicYears: { total: 0, active: 0, inactive: 0, draft: 0 },
          units: 0,
          topics: 0
        },
        hierarchy: [],
        recentActivities: []
      };
    }
  },

  /**
   * 2. Universities API
   */
  async getUniversities(params?: Partial<AcademicFilterState>): Promise<UniversityAdminItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.status && params.status !== 'all') query.set('status', params.status);
      if (params?.search) query.set('search', params.search);

      const res = await fetchWithAuth(`${API_ROOT}/universities?${query.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.universities || [];
    } catch (e) {
      console.warn('Error fetching universities:', e);
      return [];
    }
  },

  async getUniversity(id: string): Promise<any> {
    const res = await fetchWithAuth(`${API_ROOT}/universities/${id}`);
    if (!res.ok) throw new Error('Failed to fetch university');
    return await res.json();
  },

  async saveUniversity(payload: Partial<UniversityAdminItem>): Promise<any> {
    const isEdit = Boolean(payload.id);
    const url = isEdit ? `${API_ROOT}/universities/${payload.id}` : `${API_ROOT}/universities`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetchWithAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save university');
    }
    return await res.json();
  },

  async deleteUniversity(id: string, hard = false): Promise<any> {
    const res = await fetchWithAuth(`${API_ROOT}/universities/${id}?hard=${hard}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete university');
    return await res.json();
  },

  /**
   * 3. Branches API
   */
  async getBranches(params?: Partial<AcademicFilterState>): Promise<BranchAdminItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.university && params.university !== 'all') query.set('universityId', params.university);
      if (params?.status && params.status !== 'all') query.set('status', params.status);
      if (params?.search) query.set('search', params.search);

      const res = await fetchWithAuth(`${API_ROOT}/branches?${query.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.branches || [];
    } catch (e) {
      console.warn('Error fetching branches:', e);
      return [];
    }
  },

  async getBranch(id: string): Promise<any> {
    const res = await fetchWithAuth(`${API_ROOT}/branches/${id}`);
    if (!res.ok) throw new Error('Failed to fetch branch');
    return await res.json();
  },

  async saveBranch(payload: Partial<BranchAdminItem>): Promise<any> {
    const isEdit = Boolean(payload.id);
    const url = isEdit ? `${API_ROOT}/branches/${payload.id}` : `${API_ROOT}/branches`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetchWithAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save branch');
    }
    return await res.json();
  },

  async deleteBranch(id: string, hard = false): Promise<any> {
    const res = await fetchWithAuth(`${API_ROOT}/branches/${id}?hard=${hard}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete branch');
    return await res.json();
  },

  /**
   * 4. Semesters API
   */
  async getSemesters(params?: Partial<AcademicFilterState>): Promise<SemesterAdminItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.university && params.university !== 'all') query.set('universityId', params.university);
      if (params?.branch && params.branch !== 'all') query.set('branchId', params.branch);
      if (params?.academicYear && params.academicYear !== 'all') query.set('academicYear', params.academicYear);
      if (params?.status && params.status !== 'all') query.set('status', params.status);
      if (params?.search) query.set('search', params.search);

      const res = await fetchWithAuth(`${API_ROOT}/semesters?${query.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.semesters || [];
    } catch (e) {
      console.warn('Error fetching semesters:', e);
      return [];
    }
  },

  async saveSemester(payload: Partial<SemesterAdminItem>): Promise<any> {
    const res = await fetchWithAuth(`${API_ROOT}/semesters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save semester');
    return await res.json();
  },

  /**
   * 5. Subjects API
   */
  async getSubjects(params?: Partial<AcademicFilterState>): Promise<SubjectAdminItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.university && params.university !== 'all') query.set('university', params.university);
      if (params?.branch && params.branch !== 'all') query.set('branch', params.branch);
      if (params?.semester && params.semester !== 'all') query.set('semester', params.semester);
      if (params?.status && params.status !== 'all') query.set('status', params.status);
      if (params?.search) query.set('search', params.search);

      const res = await fetchWithAuth(`${API_ROOT}/subjects?${query.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.subjects || [];
    } catch (e) {
      console.warn('Error fetching subjects:', e);
      return [];
    }
  },

  async getSubject(id: string): Promise<{
    subject: SubjectAdminItem;
    units: any[];
    topics: any[];
    unitsBreakdown: UnitCoverageItem[];
    recentMaterials: any[];
  }> {
    const res = await fetchWithAuth(`${API_ROOT}/subjects/${id}`);
    if (!res.ok) throw new Error('Failed to fetch subject details');
    return await res.json();
  },

  async saveSubject(payload: Partial<SubjectAdminItem>): Promise<any> {
    const isEdit = Boolean(payload.id);
    const url = isEdit ? `${API_ROOT}/subjects/${payload.id}` : `${API_ROOT}/subjects`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetchWithAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save subject');
    }
    return await res.json();
  },

  async deleteSubject(id: string, hard = false): Promise<any> {
    const res = await fetchWithAuth(`${API_ROOT}/subjects/${id}?hard=${hard}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete subject');
    return await res.json();
  },

  /**
   * 6. Academic Years API
   */
  async getAcademicYears(params?: Partial<AcademicFilterState>): Promise<AcademicYearAdminItem[]> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.set('status', params.status);

    const res = await fetchWithAuth(`${API_ROOT}/years?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load academic years');
    const data = await res.json();
    return data.academicYears || [];
  },

  async saveAcademicYear(payload: Partial<AcademicYearAdminItem>): Promise<any> {
    const isEdit = Boolean(payload.id);
    const url = isEdit ? `${API_ROOT}/years/${payload.id}` : `${API_ROOT}/years`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetchWithAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save academic year');
    }
    return await res.json();
  },

  async deleteAcademicYear(id: string): Promise<any> {
    const res = await fetchWithAuth(`${API_ROOT}/years/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete academic year');
    return await res.json();
  },

  /**
   * 7. Units API
   */
  async getUnits(subjectId?: string): Promise<any[]> {
    const query = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
    const res = await fetchWithAuth(`${API_ROOT}/units${query}`);
    if (!res.ok) throw new Error('Failed to load units');
    const data = await res.json();
    return data.units || [];
  },

  async saveUnit(payload: { id?: string; subjectId: string; unitNo: number; title: string; description?: string }): Promise<any> {
    const isEdit = Boolean(payload.id);
    const url = isEdit ? `${API_ROOT}/units/${payload.id}` : `${API_ROOT}/units`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetchWithAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save unit');
    }
    return await res.json();
  },

  async deleteUnit(id: string): Promise<any> {
    const res = await fetchWithAuth(`${API_ROOT}/units/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete unit');
    return await res.json();
  },

  /**
   * 8. Topics API
   */
  async getTopics(params: { unitId?: string; subjectId?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.unitId) query.set('unitId', params.unitId);
    if (params.subjectId) query.set('subjectId', params.subjectId);
    const res = await fetchWithAuth(`${API_ROOT}/topics?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load topics');
    const data = await res.json();
    return data.topics || [];
  },

  async saveTopic(payload: { id?: string; unitId: string; topicNo: number; title: string; description?: string }): Promise<any> {
    const isEdit = Boolean(payload.id);
    const url = isEdit ? `${API_ROOT}/topics/${payload.id}` : `${API_ROOT}/topics`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetchWithAuth(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save topic');
    }
    return await res.json();
  },

  async deleteTopic(id: string): Promise<any> {
    const res = await fetchWithAuth(`${API_ROOT}/topics/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete topic');
    return await res.json();
  }
};
