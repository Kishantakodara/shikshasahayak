import {
  Branch,
  BranchDetail,
  BrowseSubject,
  BrowseSubjectDetail,
  BrowseSessionDetail,
  Material,
  SubjectOffering,
} from '../legacy-types';
import { MaterialTypeKey } from '../content/browse';
import { DEFAULT_CURRICULUM } from '../content/browse';
import { auth } from '../utils/firebase';

import { env } from '../config/env';

const API_BASE = env.VITE_API_URL;

// JWT Token Storage Helpers
export function getStoredTokens() {
  const access = localStorage.getItem('accessToken');
  const refresh = localStorage.getItem('refreshToken');
  return { access, refresh };
}

export function setStoredTokens(access: string, refresh: string) {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

export function clearStoredTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

// Automatic retry with exponential backoff and timeout abort signal
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 1000
): Promise<Response> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 15000); // 15-second request timeout
    const fetchOptions: RequestInit = {
      credentials: options.credentials || 'include',
      ...options,
      signal: controller.signal,
    };
    const response = await fetch(url, fetchOptions);
    clearTimeout(id);
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function refreshAuthTokens(): Promise<string> {
  const { refresh } = getStoredTokens();
  if (!refresh) throw new Error('No refresh token available');

  const res = await fetch(`${API_BASE}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });

  if (!res.ok) {
    clearStoredTokens();
    const isAdminPath = window.location.pathname.startsWith('/admin') || window.location.pathname.toLowerCase().startsWith('/ayushan0607');
    window.location.href = isAdminPath ? '/AyushAn0607' : '/student';
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json() as any;
  const tokens = data.data?.tokens;
  if (!tokens || !tokens.accessToken) {
    clearStoredTokens();
    const isAdminPath = window.location.pathname.startsWith('/admin') || window.location.pathname.toLowerCase().startsWith('/ayushan0607');
    window.location.href = isAdminPath ? '/AyushAn0607' : '/student';
    throw new Error('Invalid refresh token response');
  }

  setStoredTokens(tokens.accessToken, tokens.refreshToken);
  return tokens.accessToken;
}

// High-performance SWR API Cache for instant responses
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 300000; // 5 minutes cache TTL

async function fetchJson<T>(url: string, useCache = true): Promise<T> {
  const now = Date.now();

  if (useCache && apiCache.has(url)) {
    const cached = apiCache.get(url)!;
    // Return cached data instantly (0ms)
    if (now - cached.timestamp < CACHE_TTL) {
      if (now - cached.timestamp > 30000) {
        // Revalidate in background after 30 seconds
        fetchWithRetry(url, {})
          .then((res) => res.text())
          .then((text) => {
            try {
              const body = JSON.parse(text);
              apiCache.set(url, { data: body, timestamp: Date.now() });
            } catch {}
          })
          .catch(() => undefined);
      }
      return cached.data as T;
    }
  }

  const res = await fetchWithRetry(url, {});
  const text = await res.text();
  const isJson = (res.headers.get('content-type') || '').includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[');

  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    if (isJson) {
      try {
        const body = JSON.parse(text);
        errorMessage = body?.error?.message || body?.message || errorMessage;
      } catch {}
    }
    throw new Error(errorMessage);
  }

  if (!isJson) {
    throw new Error(`Server returned non-JSON response for ${url} (Status ${res.status})`);
  }

  const parsed = JSON.parse(text) as T;
  if (useCache) {
    apiCache.set(url, { data: parsed, timestamp: now });
  }
  return parsed;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});

  // 1. Ensure Firebase auth state is ready if not yet populated
  if (!auth.currentUser && typeof (auth as any).authStateReady === 'function') {
    try {
      await (auth as any).authStateReady();
    } catch {}
  }

  // 2. Prioritize fresh Firebase ID token if user is signed in
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      headers.set('Authorization', `Bearer ${token}`);
      setStoredTokens(token, '');
    } catch (error) {
      console.warn('Could not retrieve current Firebase ID token:', error);
    }
  }

  // 3. Fallback to stored access token if header not yet set
  if (!headers.has('Authorization')) {
    const { access } = getStoredTokens();
    if (access) {
      headers.set('Authorization', `Bearer ${access}`);
    }
  }

  const requestOptions: RequestInit = { credentials: 'include', ...options, headers };

  if (import.meta.env.DEV) {
    console.log(`[API Request] ${options.method || 'GET'} ${url}`);
  }

  let response = await fetchWithRetry(url, requestOptions);

  // 4. If unauthenticated (401), force-refresh token and retry exactly once
  if (response.status === 401 && auth.currentUser) {
    try {
      const freshToken = await auth.currentUser.getIdToken(true);
      setStoredTokens(freshToken, '');
      headers.set('Authorization', `Bearer ${freshToken}`);
      response = await fetchWithRetry(url, { credentials: 'include', ...options, headers });
    } catch (refreshErr) {
      console.warn('Firebase token force-refresh failed:', refreshErr);
    }
  } else if (response.status === 401 && getStoredTokens().refresh) {
    const { access } = getStoredTokens();
    if (!access || !access.startsWith('mock-token-')) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newAccessToken = await refreshAuthTokens();
          isRefreshing = false;
          onRefreshed(newAccessToken);
        } catch (err) {
          isRefreshing = false;
          refreshSubscribers = [];
          throw err;
        }
      }

      return new Promise<Response>((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          headers.set('Authorization', `Bearer ${token}`);
          fetchWithRetry(url, { ...options, headers })
            .then(resolve)
            .catch(reject);
        });
      });
    }
  }

  return response;
}

async function fetchJsonWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetchWithAuth(url, options);
  const text = await res.text();
  const isJson = (res.headers.get('content-type') || '').includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[');

  if (!res.ok) {
    let errorMessage = `Request failed: ${res.status}`;
    if (isJson) {
      try {
        const body = JSON.parse(text);
        errorMessage = (typeof body.error === 'string' ? body.error : body.error?.message) || body?.message || errorMessage;
      } catch {}
    }
    throw new Error(errorMessage);
  }

  if (!isJson) {
    throw new Error(`Expected JSON response from ${url} but server responded with non-JSON/HTML content (Status ${res.status})`);
  }

  return JSON.parse(text) as T;
}
export const apiClient = {
  getSearchIndex: async (): Promise<{ studyMaterials: any[]; pyqs: any[]; syllabuses: any[] }> => {
    try {
      const res = await fetchJson<any>(`/api/search-index`).catch(() => null)
               || await fetchJson<any>(`${API_BASE}/api/search-index`).catch(() => null);
      if (!res) return { studyMaterials: [], pyqs: [], syllabuses: [] };
      return {
        studyMaterials: res.studyMaterials || [],
        pyqs: res.pyqs || [],
        syllabuses: res.syllabuses || [],
      };
    } catch (e) {
      console.error('Error fetching search index:', e);
      return { studyMaterials: [], pyqs: [], syllabuses: [] };
    }
  },

  getBranches: async (): Promise<Branch[]> => {
    try {
      const res = await fetchJson<any>(`/api/branches`).catch(() => null)
               || await fetchJson<any>(`${API_BASE}/api/branches`).catch(() => null);
      if (!res) return [];
      const items = Array.isArray(res) ? res : (res.items || res.data || []);
      return items;
    } catch {
      return [];
    }
  },

  getBranch: async (slug: string): Promise<BranchDetail> => {
    try {
      const res = await fetchJson<any>(`/api/branches/${slug}`).catch(() => null)
               || await fetchJson<any>(`${API_BASE}/api/branches/${slug}`).catch(() => null);
      if (!res) throw new Error('Branch not found');
      if (res.branch) {
        return {
          branch: res.branch,
          semesters: res.semesters || [1, 2, 3, 4, 5, 6, 7, 8].map((s: number) => ({ semester: s }))
        };
      }
      return {
        branch: res.data || res,
        semesters: res.semesters || [1, 2, 3, 4, 5, 6, 7, 8].map((s: number) => ({ semester: s }))
      };
    } catch (err: any) {
      throw err;
    }
  },

  getSemesterSubjects: async (
    branchSlug: string,
    semester: number,
    type: MaterialTypeKey,
    curriculum = DEFAULT_CURRICULUM
  ): Promise<{
    branch: Branch;
    semester: number;
    subjects: BrowseSubject[];
  }> => {
    try {
      const res = await fetchJson<any>(`/api/branches/${branchSlug}/semesters/${semester}/subjects?type=${type}`).catch(() => null)
               || await fetchJson<any>(`${API_BASE}/api/branches/${branchSlug}/semesters/${semester}/subjects?type=${type}`).catch(() => null);
      if (res && res.branch && Array.isArray(res.subjects)) {
        return {
          branch: res.branch,
          semester: res.semester || semester,
          subjects: res.subjects.map((sub: any) => ({
            offering_id: sub.offering_id || sub.id,
            semester: sub.semester || semester,
            curriculum_id: sub.curriculum_id || 'curr-2026',
            curriculum_name: sub.curriculum_name || '2026 Scheme',
            subject_id: sub.subject_id || sub.id,
            subject_code: sub.subject_code || sub.code,
            subject_name: sub.subject_name || sub.name,
            subject_slug: sub.subject_slug || sub.code?.toLowerCase() || '',
            session_count: sub.session_count ?? 1,
            material_count: sub.material_count ?? 0
          }))
        };
      }
    } catch {}

    const branchRes = await fetchJson<any>(`/api/branches/${branchSlug}`).catch(() => null);
    const branch = branchRes?.branch || branchRes?.data || branchRes || { id: branchSlug, name: branchSlug, slug: branchSlug };

    return {
      branch,
      semester,
      subjects: []
    };
  },

  getSubjectBrowse: async (
    branchSlug: string,
    semester: number,
    subjectSlug: string,
    type: MaterialTypeKey,
    curriculum = DEFAULT_CURRICULUM
  ): Promise<BrowseSubjectDetail> => {
    try {
      const res = await fetchJson<any>(`/api/branches/${branchSlug}/semesters/${semester}/subjects/${subjectSlug}?type=${type}`).catch(() => null)
               || await fetchJson<any>(`${API_BASE}/api/branches/${branchSlug}/semesters/${semester}/subjects/${subjectSlug}?type=${type}`).catch(() => null);
      if (res && res.branch && res.offering) {
        return {
          branch: res.branch,
          offering: res.offering,
          semester: res.semester || semester,
          curriculum: res.curriculum || '2026 Scheme',
          material_type: res.material_type || type,
          sessions: res.sessions || [],
          materials_without_session: res.materials_without_session || []
        };
      }
    } catch {}

    const branchRes = await fetchJson<any>(`/api/branches/${branchSlug}`).catch(() => null);
    const branch = branchRes?.branch || branchRes?.data || branchRes || { id: branchSlug, name: branchSlug, slug: branchSlug };

    return {
      branch,
      offering: {
        offering_id: subjectSlug,
        semester,
        curriculum_id: 'curr-2026',
        curriculum_name: '2026 Scheme',
        subject_id: subjectSlug,
        subject_code: subjectSlug.toUpperCase(),
        subject_name: subjectSlug,
        subject_slug: subjectSlug,
        session_count: 0,
        material_count: 0
      },
      semester,
      curriculum: '2026 Scheme',
      material_type: type,
      sessions: [],
      materials_without_session: []
    };
  },

  getSessionMaterials: async (
    branchSlug: string,
    semester: number,
    subjectSlug: string,
    sessionCode: string,
    type: MaterialTypeKey,
    curriculum = DEFAULT_CURRICULUM
  ): Promise<BrowseSessionDetail> => {
    try {
      const res = await fetchJson<any>(`/api/branches/${branchSlug}/semesters/${semester}/subjects/${subjectSlug}/sessions/${sessionCode}?type=${type}`).catch(() => null)
               || await fetchJson<any>(`${API_BASE}/api/branches/${branchSlug}/semesters/${semester}/subjects/${subjectSlug}/sessions/${sessionCode}?type=${type}`).catch(() => null);
      if (res && res.branch && res.offering) {
        return res;
      }
    } catch {}

    const browse = await apiClient.getSubjectBrowse(branchSlug, semester, subjectSlug, type, curriculum);

    return {
      branch: browse.branch,
      offering: {
        offering_id: browse.offering.offering_id,
        subject_name: browse.offering.subject_name,
        subject_slug: browse.offering.subject_slug
      },
      semester: browse.semester,
      curriculum: browse.curriculum,
      session: { code: sessionCode, year: 2026, session: sessionCode, label: `${sessionCode} Exam` },
      material_type: type,
      materials: browse.materials_without_session.map((m: any) => ({
        id: m.id,
        title: m.title,
        type: type === 'study-material' ? 'note' : type === 'pyq' ? 'pyq' : 'assignment',
        offeringId: browse.offering.offering_id,
        pdfUrl: '',
        status: 'published',
        createdAt: new Date().toISOString()
      }))
    };
  },

  getCatalog: async (
    branch: string,
    semester: number,
    curriculum = 2026
  ): Promise<SubjectOffering[]> => {
    try {
      let items: any[] = [];
      
      // Attempt 1: Legacy catalog endpoint
      const res1 = await fetchJson<any>(`/api/catalog?branch=${encodeURIComponent(branch)}&semester=${semester}&curriculum=${curriculum}`).catch(() => null);
      if (res1) {
        items = Array.isArray(res1) ? res1 : (res1.items || res1.data || []);
      }

      // Attempt 2: Branch semester subjects endpoint
      if (!items || items.length === 0) {
        const res2 = await fetchJson<any>(`/api/branches/${encodeURIComponent(branch)}/semesters/${semester}/subjects`).catch(() => null);
        if (res2 && Array.isArray(res2.subjects)) {
          items = res2.subjects;
        }
      }

      // Attempt 3: All Admin subjects filtered
      if (!items || items.length === 0) {
        const allSubjects = await fetchJson<any[]>(`/api/admin/subjects`).catch(() => null);
        if (Array.isArray(allSubjects)) {
          const lowerBranch = branch.toLowerCase();
          items = allSubjects.filter((s: any) =>
            (s.branch_id === branch || s.branch_slug === lowerBranch || (s.branches && s.branches.toLowerCase() === lowerBranch)) &&
            Number(s.semester_no || s.semester) === Number(semester)
          );
        }
      }

      return items.map((sub: any) => ({
        id: sub.id || sub.offering_id || sub.subject_id,
        subjectCode: sub.subjectCode || sub.subject_code || sub.code || '',
        subjectName: sub.subjectName || sub.subject_name || sub.name || '',
        branch,
        semester,
        curriculumYear: curriculum
      }));
    } catch (e) {
      console.error('getCatalog error:', e);
      return [];
    }
  },

  getMaterials: async (offeringId: string): Promise<Material[]> => {
    try {
      const res = await fetchJson<any>(`/api/materials?offeringId=${offeringId}`).catch(() => null)
               || await fetchJson<any>(`${API_BASE}/api/materials?offeringId=${offeringId}`).catch(() => null)
               || await fetchJson<any>(`${API_BASE}/v1/content?subjectId=${offeringId}&status=published`).catch(() => null);
      const items = Array.isArray(res) ? res : (res?.items || res?.data || []);
      return items.map((item: any) => ({
        id: item.id,
        title: item.title,
        type: item.contentType === 'pyq' || item.type === 'pyq' ? 'pyq' : 'note',
        offeringId,
        pdfUrl: item.searchMetadata?.fileUrl || item.pdfUrl || '',
        status: 'published',
        createdAt: item.createdAt || new Date().toISOString()
      }));
    } catch {
      return [];
    }
  },

  getMaterial: async (id: string, preview = false): Promise<any> => {
    const rawId = encodeURIComponent(id);
    const cleanId = encodeURIComponent(id.replace(/^doc_/, ''));
    const docIdWithPrefix = encodeURIComponent(id.startsWith('doc_') ? id : `doc_${id}`);
    const previewQuery = preview ? '?preview=true' : '';

    try {
      const res = await fetchJson<any>(`/api/materials/${rawId}${previewQuery}`).catch(() => null)
               || await fetchJson<any>(`/api/materials/${docIdWithPrefix}${previewQuery}`).catch(() => null)
               || await fetchJson<any>(`/api/materials/${cleanId}${previewQuery}`).catch(() => null)
               || await fetchJson<any>(`${API_BASE}/api/materials/${rawId}${previewQuery}`).catch(() => null)
               || await fetchJson<any>(`${API_BASE}/v1/content/${cleanId}${previewQuery}`).catch(() => null);

      if (!res) return null;

      const item = res.data?.content || res.content || res;
      return {
        id: item.id || id,
        title: item.title || 'Untitled Document',
        document_type: item.document_type || item.type || item.contentType || 'study-material',
        material_kind: item.material_kind || item.kind || 'notes',
        url: item.pdfUrl || item.url || item.file_url || (item.storage_key ? `/api/storage/${item.storage_key}` : ''),
        pdfUrl: item.pdfUrl || item.url || item.file_url || (item.storage_key ? `/api/storage/${item.storage_key}` : ''),
        files: item.files || [],
        status: item.status || item.approval_status || 'published',
        approval_status: item.approval_status || item.status || 'approved',
        is_pending: item.is_pending || item.approval_status === 'pending',
        author: item.author || item.uploaded_by || item.searchMetadata?.author || 'ShikshaSahayak Admin',
        uploaded_by: item.uploaded_by || item.author || 'ShikshaSahayak Admin',
        description: item.description || '',
        university: item.university,
        branch_name: item.branch_name || item.branch,
        branch_short_name: item.branch_short_name,
        branch_slug: item.branch_slug,
        subject_id: item.subject_id || item.subjectId,
        subject_name: item.subject_name || item.subjectName,
        subject_code: item.subject_code || item.subjectCode,
        subject_slug: item.subject_slug,
        semester_no: item.semester_no !== undefined ? item.semester_no : item.semester,
        unit_no: item.unit_no,
        chapter: item.chapter,
        topic: item.topic,
        raw_markdown: item.raw_markdown || item.content || '',
        structured_content: item.structured_content || null,
        created_at: item.created_at || item.createdAt,
        blog_id: item.blog_id || item.blogId,
        blog_title: item.blog_title || item.blogTitle,
        views: item.views || 0,
        likes: item.likes || 0
      };
    } catch (error) {
      console.error('getMaterial error:', error);
      return null;
    }
  },

  likeMaterial: async (id: string): Promise<any> => {
    const res = await fetchWithAuth(`${API_BASE}/v1/content/${id}/like`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to like material');
    return res.json();
  },

  submitMaterial: async (formData: FormData): Promise<any> => {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file selected for upload');

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('visibility', 'public');
    uploadData.append('module', 'documents');

    const uploadRes = await fetchWithAuth(`${API_BASE}/v1/storage/upload`, {
      method: 'POST',
      body: uploadData,
    });
    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'File upload to R2 storage failed');
    }
    const uploadResult = await uploadRes.json() as any;
    const asset = uploadResult.data?.asset;
    if (!asset || !asset.publicUrl) {
      throw new Error('Storage service returned invalid asset metadata');
    }

    const materialType = formData.get('material_type') as string;
    let contentType = 'note';
    if (materialType === 'pyq') contentType = 'pyq';
    else if (materialType === 'solution') contentType = 'note';

    const subjectId = formData.get('subject_id') as string;
    const branchId = formData.get('departmentId') as string;
    const author = formData.get('author') as string;
    const year = formData.get('year') as string;
    const pyqType = formData.get('pyq_type') as string;
    const parentDocId = formData.get('parent_document_id') as string;

    const contentPayload = {
      title: formData.get('title') as string,
      contentType,
      status: 'in_review',
      summary: `Uploaded resource by ${author || 'anonymous'}`,
      subjectId: subjectId || null,
      branchId: branchId || null,
      searchMetadata: {
        fileUrl: asset.publicUrl,
        fileName: asset.fileName,
        author: author || 'Admin',
        year: year || null,
        pyqType: pyqType || null,
        parentDocId: parentDocId || null,
      }
    };

    const cmsRes = await fetchWithAuth(`${API_BASE}/v1/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contentPayload),
    });
    if (!cmsRes.ok) {
      const err = await cmsRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to submit document catalog entry');
    }

    return cmsRes.json();
  },

  getPendingMaterials: async (): Promise<any[]> => {
    try {
      const res = await fetchJsonWithAuth<any[]>('/api/moderation/materials?status=pending');
      if (Array.isArray(res)) return res;
    } catch (e) {
      console.error('Failed to fetch pending materials from moderation endpoint, falling back:', e);
    }
    const adminRes = await fetchJsonWithAuth<any[]>('/api/admin/materials');
    return (adminRes || []).filter((item: any) =>
      item.approval_status === 'pending' || item.approval_status === 'in_review' || item.status === 'pending' || item.status === 'in_review'
    );
  },

  approveMaterial: async (materialId: string, data?: any): Promise<void> => {
    const res = await fetchWithAuth(`/api/moderation/materials/${materialId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data || {}),
    });
    if (!res.ok) {
      const body: any = await res.json().catch(() => ({}));
      throw new Error(body?.error || 'Failed to approve material');
    }
  },

  rejectMaterial: async (materialId: string): Promise<void> => {
    const res = await fetchWithAuth(`/api/moderation/materials/${materialId}/reject`, {
      method: 'POST',
    });
    if (!res.ok) {
      const body: any = await res.json().catch(() => ({}));
      throw new Error(body?.error || 'Failed to reject material');
    }
  },

  getAdminMaterials: async (type?: string): Promise<any[]> => {
    const url = type ? `/api/admin/materials?type=${type}` : `/api/admin/materials`;
    const res = await fetchJsonWithAuth<any[]>(url);
    return res || [];
  },

  addAdminMaterial: async (formData: FormData): Promise<any> => {
    const res = await fetchWithAuth(`/api/admin/materials`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || err.error || 'Failed to add material');
    }
    return res.json();
  },

  deleteAdminMaterial: async (id: string): Promise<void> => {
    const res = await fetchWithAuth(`/api/admin/materials/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete material');
  },

  updateAdminMaterial: async (id: string, data: any): Promise<void> => {
    const res = await fetchWithAuth(`/api/admin/materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update material');
    }
  },

  getAdminMaterial: async (id: string): Promise<any> =>
    fetchJsonWithAuth(`/api/admin/materials/${id}`),

  getAnnouncements: async (): Promise<any[]> => {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (err) {
      console.warn('Public announcements fetch failed, trying admin route:', err);
    }
    return fetchJsonWithAuth<unknown>(`/api/admin/announcements`)
      .then(data => Array.isArray(data) ? data : [])
      .catch(() => []);
  },

  getLatestDocuments: async (): Promise<any[]> => {
    try {
      const res = await fetch('/api/documents/latest');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (err) {
      console.warn('Latest documents fetch failed:', err);
    }
    return [];
  },

  getAdminAnnouncements: async (): Promise<any[]> => fetchJsonWithAuth(`/api/admin/announcements`),

  addAnnouncement: async (text: string, link?: string): Promise<any> => {
    const res = await fetchWithAuth(`/api/admin/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, link }),
    });
    if (!res.ok) throw new Error('Failed to add announcement');
    return res.json();
  },

  deleteAnnouncement: async (id: string): Promise<void> => {
    const res = await fetchWithAuth(`/api/admin/announcements/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete announcement');
  },

  getActivePopup: async (): Promise<any> => fetchJson(`/api/active-popup`),

  adminGetPopups: async (): Promise<any[]> => fetchJsonWithAuth(`/api/admin/popups`),

  adminGetPopup: async (id: string): Promise<any> => fetchJsonWithAuth(`/api/admin/popups/${id}`),

  adminCreatePopup: async (data: {
    title: string;
    type?: string;
    html_content: string;
    is_active?: boolean;
    start_date?: string | null;
    end_date?: string | null;
    frequency?: string;
    expiry_days?: number;
  }): Promise<any> => {
    const res = await fetchWithAuth(`/api/admin/popups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create popup');
    }
    return res.json();
  },

  adminUpdatePopup: async (
    id: string,
    data: {
      title?: string;
      type?: string;
      html_content?: string;
      is_active?: boolean;
      start_date?: string | null;
      end_date?: string | null;
      frequency?: string;
      expiry_days?: number;
    }
  ): Promise<any> => {
    const res = await fetchWithAuth(`/api/admin/popups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update popup');
    }
    return res.json();
  },

  adminDeletePopup: async (id: string): Promise<void> => {
    const res = await fetchWithAuth(`/api/admin/popups/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete popup');
    }
  },

  getBlogs: async (admin = false): Promise<any[]> => {
    try {
      const fetchFn = admin ? fetchJsonWithAuth : fetchJson;
      const res = await fetchFn<any[]>(`/api/blogs${admin ? '?admin=true' : ''}`);
      return (res || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content || item.body || item.summary || '',
        thumbnail: item.thumbnail || null,
        category: item.category || 'Study Guides',
        status: item.status || 'draft',
        views: item.views ?? 0,
        author: item.author || 'Admin',
        tags: item.tags || '',
        created_at: item.created_at || item.createdAt || new Date().toISOString(),
        createdAt: item.created_at || item.createdAt || new Date().toISOString(),
        related_document_id: item.related_document_id || null,
      }));
    } catch {
      return [];
    }
  },

  getBlog: async (id: string, skipIncrement = false): Promise<any> => {
    const res = await fetchJson<any>(`/api/blogs/${id}${skipIncrement ? '?skip_increment=true' : ''}`);
    const item = (res && typeof res === 'object' && 'id' in res)
      ? res
      : (res.data && typeof res.data === 'object' && 'id' in res.data)
        ? res.data
        : (res.data?.content || res.content || res);
    return {
      id: item.id,
      title: item.title,
      content: item.content || item.body || item.summary || '',
      thumbnail: item.thumbnail || null,
      category: item.category || 'Study Guides',
      status: item.status || 'draft',
      views: item.views ?? 0,
      author: item.author || 'Admin',
      tags: item.tags || '',
      created_at: item.created_at || item.createdAt || new Date().toISOString(),
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      related_document_id: item.related_document_id || null,
    };
  },

  createBlog: async (data: {
    title: string;
    content: string;
    author?: string;
    category?: string;
    tags?: string;
    thumbnail?: string;
    status?: string;
    related_document_id?: string;
  }): Promise<any> => {
    const res = await fetch(`/api/blogs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create blog');
    }
    return res.json();
  },

  updateBlog: async (
    id: string,
    data: {
      title?: string;
      content?: string;
      author?: string;
      category?: string;
      tags?: string;
      thumbnail?: string;
      status?: string;
      related_document_id?: string;
    }
  ): Promise<void> => {
    const res = await fetch(`/api/blogs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update blog');
    }
  },

  deleteBlog: async (id: string): Promise<void> => {
    const res = await fetch(`/api/blogs/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete blog');
  },

  uploadBlogThumbnail: async (file: File): Promise<{ url: string; key: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`/api/blogs/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload cover image');
    }
    return res.json();
  },

  // Academic Study Materials
  getAcademicStudyMaterials: async (): Promise<any[]> => fetchJson(`${API_BASE}/academic-study-materials`),

  getAcademicStudyMaterial: async (id: string): Promise<any> => fetchJson(`${API_BASE}/academic-study-materials/${id}`),

  createAcademicStudyMaterial: async (data: FormData): Promise<any> => {
    const res = await fetch(`${API_BASE}/academic-study-materials`, {
      method: 'POST',
      body: data,
    });
    if (!res.ok) throw new Error('Failed to create academic study material');
    return res.json();
  },

  updateAcademicStudyMaterial: async (id: string, data: any): Promise<void> => {
    const res = await fetch(`${API_BASE}/academic-study-materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update academic study material');
  },

  deleteAcademicStudyMaterial: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/academic-study-materials/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete academic study material');
  },

  // Academic PYQs
  getAcademicPYQs: async (): Promise<any[]> => fetchJson(`${API_BASE}/academic-pyqs`),

  getAcademicPYQ: async (id: string): Promise<any> => fetchJson(`${API_BASE}/academic-pyqs/${id}`),

  createAcademicPYQ: async (data: FormData): Promise<any> => {
    const res = await fetch(`${API_BASE}/academic-pyqs`, {
      method: 'POST',
      body: data,
    });
    if (!res.ok) throw new Error('Failed to create academic pyq');
    return res.json();
  },

  updateAcademicPYQ: async (id: string, data: any): Promise<void> => {
    const res = await fetch(`${API_BASE}/academic-pyqs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update academic pyq');
  },

  deleteAcademicPYQ: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/academic-pyqs/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete academic pyq');
  },

  // Branch administration
  addBranch: async (branch: { id: string; name: string; slug: string; short_name?: string }): Promise<any> => {
    const res = await fetch(`/api/admin/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branch),
    });
    if (!res.ok) throw new Error('Failed to add branch');
    return res.json();
  },

  deleteBranch: async (id: string): Promise<void> => {
    const res = await fetch(`/api/admin/branches/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete branch');
  },

  // Subject administration
  getSubjects: async (): Promise<any[]> => fetchJson(`/api/admin/subjects`),

  addSubject: async (subject: { name: string; code?: string; branch_id: string; semester: number }): Promise<any> => {
    const res = await fetch(`/api/admin/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subject),
    });
    if (!res.ok) throw new Error('Failed to add subject');
    return res.json();
  },

  deleteSubject: async (offeringId: string): Promise<void> => {
    const res = await fetch(`/api/admin/subjects/${offeringId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete subject');
  },

  // Assessment & Learning Hub APIs
  getQuizzes: async (): Promise<any[]> => {
    const res = await fetchJsonWithAuth<any>(`${API_BASE}/v1/assessment/quizzes`);
    return res.quizzes || res.data?.quizzes || [];
  },

  getQuiz: async (id: string): Promise<any> => {
    const res = await fetchJsonWithAuth<any>(`${API_BASE}/v1/assessment/quizzes/${id}`);
    const q = res.data?.quiz || res.quiz || res;

    // Map backend questions & options format to frontend format
    const questions = (q.questions || []).map((question: any, idx: number) => {
      let opts = [];
      if (Array.isArray(question.options)) {
        opts = question.options;
      } else if (typeof question.options === 'string') {
        try { opts = JSON.parse(question.options); } catch { opts = []; }
      }

      const mappedOptions = opts.map((opt: any) => ({
        id: opt.id,
        text: opt.option_text || opt.text || '',
        isCorrect: opt.is_correct === 1 || opt.isCorrect === true
      }));

      return {
        id: question.id,
        quizId: q.id,
        questionId: question.id,
        orderIndex: idx,
        marks: question.marks || 4,
        negativeMarks: question.negative_marks || 1,
        question: {
          id: question.id,
          type: question.question_type || 'single_choice',
          questionText: question.question_body || '',
          options: JSON.stringify(mappedOptions),
          correctAnswer: mappedOptions.find((o: any) => o.isCorrect)?.id || '',
          correctAnswers: JSON.stringify(mappedOptions.filter((o: any) => o.isCorrect).map((o: any) => o.id)),
          explanation: question.solution_explanation || '',
          marks: question.marks || 4,
          negativeMarks: question.negative_marks || 1,
          tags: question.topic_id ? [question.topic_id] : [],
          isPublic: true,
          isVerified: true
        }
      };
    });

    return {
      id: q.id,
      title: q.title,
      description: q.description || '',
      status: q.status || 'published',
      totalMarks: q.total_marks || 100,
      passingMarks: q.pass_marks || 40,
      durationMinutes: q.duration_minutes || 30,
      questions
    };
  },

  createQuiz: async (data: any): Promise<any> => {
    const res = await fetchWithAuth(`${API_BASE}/v1/assessment/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create quiz');
    return res.json();
  },

  submitQuiz: async (quizId: string, userId: string, answers: any): Promise<any> => {
    // 1. Fetch quiz to get correct option IDs for index mapping
    const quiz = await apiClient.getQuiz(quizId);

    // 2. Start attempt
    const attemptData = await apiClient.startAttempt(quizId);
    const attemptId = attemptData.attempt?.id || attemptData.id;
    if (!attemptId) throw new Error("Could not initialize attempt session");

    // 3. Save each response in parallel
    const savePromises = Object.entries(answers).map(async ([qId, optIdx]) => {
      const questionWrapper = quiz.questions.find((q: any) => q.id === qId || q.questionId === qId);
      if (!questionWrapper) return;
      let options: any[] = [];
      try {
        options = JSON.parse(questionWrapper.question.options);
      } catch { }
      const selectedOpt = options[optIdx as number];
      if (!selectedOpt) return;

      await apiClient.autoSaveResponse(attemptId, qId, selectedOpt.id);
    });
    await Promise.all(savePromises);

    // 4. Submit attempt
    const resultData = await apiClient.submitAttempt(attemptId);
    const result = resultData.result || resultData;

    // 5. Fetch fresh user gamification state to return updated stats
    let xp = 2450;
    let coins = 350;
    let level = 3;
    let streak = 24;
    let longestStreak = 51;
    try {
      const gamificationRes = await fetchJsonWithAuth<any>(`${API_BASE}/v1/student/gamification`);
      const state = gamificationRes.gamification;
      if (state) {
        xp = state.xpPoints || 0;
        coins = state.coins || 0;
        level = state.level || 1;
        streak = state.streakCount || 0;
        longestStreak = state.streakCount || 0;
      }
    } catch { }

    return {
      correctCount: result.correctCount || 0,
      questionsCount: quiz.questions.length,
      xpEarned: 150,
      coinsEarned: 25,
      stats: { xp, coins, level, streak, longestStreak }
    };
  },

  getStudentStats: async (userId: string): Promise<any> => {
    try {
      const res = await fetchJsonWithAuth<any>(`/api/student-stats?userId=${encodeURIComponent(userId)}`);
      return res;
    } catch {
      return { xp: 0, coins: 0, level: 1, streak: 0, longest_streak: 0, claimed_daily_reward: 0 };
    }
  },

  getLeaderboard: async (): Promise<any[]> => {
    try {
      const res = await fetchJsonWithAuth<any[]>(`/api/student-stats?leaderboard=true`);
      return res || [];
    } catch {
      return [];
    }
  },

  claimDailyReward: async (userId: string): Promise<any> => {
    try {
      const res = await fetchJsonWithAuth<any>(`/api/student-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'claim_daily' }),
      });
      return res;
    } catch (e: any) {
      throw new Error(e.message || 'Failed to claim daily reward');
    }
  },

  getStudentProjects: async (admin = false): Promise<any[]> => {
    try {
      const url = admin ? '/api/student-projects?admin=true' : '/api/student-projects';
      const res = await fetchJsonWithAuth<any[]>(url);
      return res || [];
    } catch {
      return [];
    }
  },

  submitStudentProject: async (data: { title: string; author: string; dept: string; github: string; desc?: string; tech?: string | string[] }): Promise<any> => {
    const res = await fetchWithAuth('/api/student-projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        author: data.author,
        dept: data.dept,
        github: data.github,
        desc: data.desc,
        tech: data.tech,
      }),
    });
    if (!res.ok) throw new Error('Failed to submit project');
    return res.json();
  },

  upvoteStudentProject: async (projectId: string): Promise<any> => {
    const res = await fetchWithAuth('/api/student-projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, action: 'upvote' }),
    });
    if (!res.ok) throw new Error('Failed to upvote project');
    return res.json();
  },

  approveStudentProject: async (projectId: string): Promise<any> => {
    const res = await fetchWithAuth('/api/student-projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, action: 'approve' }),
    });
    if (!res.ok) throw new Error('Failed to approve project');
    return res.json();
  },

  rejectStudentProject: async (projectId: string): Promise<any> => {
    const res = await fetchWithAuth('/api/student-projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, action: 'reject' }),
    });
    if (!res.ok) throw new Error('Failed to reject project');
    return res.json();
  },

  getAdminSystemOverview: async (): Promise<any> => {
    const res = await fetchJsonWithAuth<any>(`${API_BASE}/v1/admin/system-overview`);
    return res.data?.overview || res.overview || res.data || res;
  },

  getStudentProfile: async (userId: string): Promise<any> =>
    fetchJsonWithAuth(`/api/student-profile?userId=${encodeURIComponent(userId)}`),

  saveStudentProfile: async (profile: {
    userId: string;
    name: string;
    email: string;
    phoneNumber?: string;
    branch?: string;
    semester?: number | string;
    college?: string;
    university?: string;
    degree?: string;
    dob?: string;
    enrollmentNumber?: string;
    enrollment_number?: string;
    enrollmentYear?: number | string;
    enrollment_year?: number | string;
    graduationYear?: number | string;
    graduation_year?: number | string;
    marks_10th?: string;
    marks_12th?: string;
    special_skills?: string;
    languages_known?: string;
    experience?: string;
    certifications?: string;
    avatarUrl?: string;
    goals?: string[] | string;
  }): Promise<any> => {
    const res = await fetchWithAuth(`/api/student-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({} as Record<string, string>));
      throw new Error(errData.error || errData.message || 'Failed to save student profile');
    }
    return res.json();
  },

  getStudentNotifications: async (): Promise<{ success: boolean; notifications: any[]; unread_count: number }> =>
    fetchJsonWithAuth(`/api/student/notifications`),

  markStudentNotificationRead: async (id: string): Promise<any> =>
    fetchJsonWithAuth(`/api/student/notifications/${encodeURIComponent(id)}/read`, { method: 'PUT' }),

  markAllStudentNotificationsRead: async (): Promise<any> =>
    fetchJsonWithAuth(`/api/student/notifications/read-all`, { method: 'POST' }),

  clearStudentNotifications: async (): Promise<any> =>
    fetchJsonWithAuth(`/api/student/notifications/clear`, { method: 'POST' }),

  // Phase 4: Live Search Integration
  search: async (query: string): Promise<{ studyMaterials: any[]; pyqs: any[]; syllabuses: any[] }> => {
    const res = await fetchJson<any>(`${API_BASE}/v1/search?q=${encodeURIComponent(query)}`);
    const results = res.results || res.data?.results || [];

    const studyMaterials: any[] = [];
    const pyqs: any[] = [];
    const syllabuses: any[] = [];

    for (const r of results) {
      const mapped = {
        id: r.id,
        title: r.title,
        semester: Number(r.payload?.semester || r.payload?.semester_number || 0),
        departmentId: r.payload?.departmentId || r.payload?.branchId || r.payload?.department_id || '',
        author: r.payload?.author || r.payload?.uploaded_by || 'Admin',
        year: Number(r.payload?.year || r.payload?.paper_year || 2026),
        type: r.payload?.type || r.payload?.season || '',
        subjectName: r.payload?.subjectName || r.payload?.subject_name || r.title,
        subjectCode: r.payload?.subjectCode || r.payload?.subject_code || '',
      };

      if (r.entityType === 'note' || r.entityType === 'study-material' || r.entityType === 'study_resource') {
        studyMaterials.push(mapped);
      } else if (r.entityType === 'pyq') {
        pyqs.push(mapped);
      } else if (r.entityType === 'syllabus') {
        syllabuses.push(mapped);
      }
    }

    return { studyMaterials, pyqs, syllabuses };
  },

  getSearchSuggestions: async (query: string): Promise<string[]> => {
    const res = await fetchJson<any>(`${API_BASE}/v1/search/suggestions?q=${encodeURIComponent(query)}`);
    return res.suggestions || res.data || [];
  },

  getTrendingSearches: async (): Promise<string[]> => {
    const res = await fetchJson<any>(`${API_BASE}/v1/search/trending`);
    return res.trending || res.data || [];
  },

  getRecentSearches: async (): Promise<string[]> => {
    const res = await fetchJson<any>(`${API_BASE}/v1/search/recent`);
    return res.recent || res.data || [];
  },

  startAttempt: async (quizId: string): Promise<any> => {
    const res = await fetchJsonWithAuth<any>(`${API_BASE}/v1/assessment/attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId }),
    });
    return res.data || res;
  },

  autoSaveResponse: async (attemptId: string, questionId: string, selectedOptionId?: string, textResponse?: string): Promise<any> => {
    const res = await fetchJsonWithAuth<any>(`${API_BASE}/v1/assessment/attempts/autosave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId, questionId, selectedOptionId, textResponse }),
    });
    return res.data || res;
  },

  submitAttempt: async (attemptId: string): Promise<any> => {
    const res = await fetchJsonWithAuth<any>(`${API_BASE}/v1/assessment/attempts/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId }),
    });
    return res.data || res;
  },

  getAttemptResult: async (attemptId: string): Promise<any> => {
    const res = await fetchJsonWithAuth<any>(`${API_BASE}/v1/assessment/attempts?attemptId=${encodeURIComponent(attemptId)}`);
    return res.data || res;
  },

  submitBugReport: async (payload: {
    user_email: string;
    description: string;
    browser_info: string;
    screenshot: string | null;
  }): Promise<any> => {
    const res = await fetch(`/api/bug-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit bug report');
    }
    return res.json();
  },

  getBugReports: async (): Promise<any[]> => {
    const res = await fetchJsonWithAuth<any[]>('/api/admin/bug-reports');
    return res || [];
  },

  updateBugReportStatus: async (id: string, status: string): Promise<void> => {
    const res = await fetchWithAuth(`/api/admin/bug-reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update bug report status');
    }
  },

  deleteBugReport: async (id: string): Promise<void> => {
    const res = await fetchWithAuth(`/api/admin/bug-reports/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete bug report');
    }
  },

  // ----------------------------------------------------
  // FEEDBACK MANAGEMENT
  // ----------------------------------------------------
  getFeedback: async (filters?: { type?: string; status?: string; limit?: number }): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', String(filters.limit));
    const url = `/api/admin/feedback${params.toString() ? `?${params}` : ''}`;
    const res = await fetchJsonWithAuth<any[]>(url);
    return res || [];
  },

  updateFeedback: async (id: string, payload: { status?: string; admin_reply?: string }): Promise<void> => {
    const res = await fetchWithAuth(`/api/admin/feedback/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update feedback');
    }
  },

  deleteFeedback: async (id: string): Promise<void> => {
    const res = await fetchWithAuth(`/api/admin/feedback/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete feedback');
    }
  },

  // ----------------------------------------------------
  // CONTENT FACTORY V1
  // ----------------------------------------------------
  generateContentFactoryBatch: async (payload: {
    university_id: string;
    branch_id: string;
    semester: number;
    subject_id: string;
    subject_name: string;
    unit_no: number;
    unit_title?: string;
    topics: string[];
    content_types: string[];
    config?: {
      mcqCount?: number;
      shortQuestionCount?: number;
      longQuestionCount?: number;
      vivaQuestionCount?: number;
      numericalCount?: number;
    };
  }): Promise<any> => {
    const res = await fetchWithAuth('/api/admin/content-factory/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate content batch');
    }
    return res.json();
  },

  getContentFactoryItems: async (filters?: {
    status?: string;
    subject_id?: string;
    branch_id?: string;
    semester?: number;
  }): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.subject_id) params.append('subject_id', filters.subject_id);
    if (filters?.branch_id) params.append('branch_id', filters.branch_id);
    if (filters?.semester) params.append('semester', String(filters.semester));

    const res = await fetchJsonWithAuth<any>(`/api/admin/content-factory/items?${params.toString()}`);
    return Array.isArray(res) ? res : (res?.items || []);
  },

  updateContentFactoryItem: async (payload: {
    id: string;
    status?: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED';
    raw_markdown?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }): Promise<any> => {
    const res = await fetchWithAuth('/api/admin/content-factory/items', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update content item');
    }
    return res.json();
  },

  deleteContentFactoryItem: async (id: string): Promise<any> => {
    const res = await fetchWithAuth(`/api/admin/content-factory/items?id=${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete content item');
    }
    return res.json();
  },

  importContentFactoryItems: async (payload: any): Promise<any> => {
    const res = await fetchWithAuth('/api/admin/content-factory/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to import content items');
    }
    return res.json();
  },

  getContentFactoryJobs: async (): Promise<any[]> => {
    const res = await fetchJsonWithAuth<any[]>('/api/admin/content-factory/jobs');
    return res || [];
  },

  // ----------------------------------------------------
  // ShikshaSahayak 2.0 Student Portal & Platform APIs
  // ----------------------------------------------------
  getStudentDashboard: async (params?: { branchId?: string; semester?: number }): Promise<{ success: boolean; data: any }> => {
    const qs = new URLSearchParams();
    if (params?.branchId) qs.set('branchId', params.branchId);
    if (params?.semester) qs.set('semester', String(params.semester));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetchJsonWithAuth(`/api/student/dashboard${query}`);
  },

  createPracticeSession: async (params: {
    subjectCode?: string;
    subjectName?: string;
    branchId?: string;
    semester?: number;
    topicName?: string;
    difficulty?: string;
    questionCount?: number;
    durationMinutes?: number;
    sourceMode?: string;
    practiceMode?: string;
  }): Promise<{ success: boolean; data: any }> => {
    const res = await fetchWithAuth('/api/practice/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create practice session');
    }
    return res.json();
  },

  submitPracticeSession: async (payload: {
    sessionId: string;
    answers: Array<{
      questionId: string;
      selectedOptionId: string;
      timeTakenSeconds?: number;
    }>;
    totalTimeSeconds?: number;
  }): Promise<{ success: boolean; data: any }> => {
    const res = await fetchWithAuth('/api/practice/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit practice session');
    }
    return res.json();
  },

  getStudentAssignments: async (status?: string): Promise<{ success: boolean; assignments: any[]; total: number }> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return fetchJsonWithAuth(`/api/student/assignments${query}`);
  },

  submitStudentAssignment: async (
    assignmentId: string,
    payload: { textContent?: string; attachments?: string[]; externalLinks?: string[] }
  ): Promise<{ success: boolean; message: string; submissionId: string }> => {
    const res = await fetchWithAuth(`/api/student/assignments/${encodeURIComponent(assignmentId)}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit assignment');
    }
    return res.json();
  },

  getStudentTimeline: async (): Promise<{ success: boolean; timeline: any[]; total: number }> => {
    return fetchJsonWithAuth('/api/student/timeline');
  },

  getPublicStats: async (): Promise<{ success: boolean; stats: any }> => {
    return fetchJson('/api/public/stats');
  },

  searchGlobal: async (
    query: string,
    category?: string
  ): Promise<{ success: boolean; query: string; data: any; totalCount: number }> => {
    const params = new URLSearchParams({ q: query });
    if (category) params.set('category', category);
    return fetchJson(`/api/search?${params.toString()}`);
  }
};

