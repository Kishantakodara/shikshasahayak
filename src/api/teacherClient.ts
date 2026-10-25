/**
 * Teacher API Client
 * 
 * API functions for teacher-specific operations
 */

import { env } from '../config/env';
import { getStoredTokens, setStoredTokens } from './client';
import { auth } from '../utils/firebase';
import type { Class, CreateClassDTO, UpdateClassDTO } from '../types/teacher';
import { mockTeacherDB } from './mockTeacherDB';

const API_BASE = env.VITE_API_URL;

/**
 * Fetch with authentication
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});

  // 1. Prioritize fresh Firebase ID token if user is signed in
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      headers.set('Authorization', `Bearer ${token}`);
      setStoredTokens(token, '');
    } catch (error) {
      console.warn('Could not retrieve current Firebase ID token in teacherClient:', error);
    }
  }

  // 2. Fallback to stored access token if header not yet set
  if (!headers.has('Authorization')) {
    const { access } = getStoredTokens();
    if (access) {
      headers.set('Authorization', `Bearer ${access}`);
    }
  }

  const requestOptions = { ...options, headers };

  if (import.meta.env.DEV) {
    console.log(`[Teacher API] ${options.method || 'GET'} ${url}`);
  }

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let message = `Request failed: ${response.status}`;
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        const errorBody = JSON.parse(text);
        message = errorBody.error?.message || errorBody.message || message;
      } catch {}
    }
    throw new Error(message);
  }

  return response;
}

/**
 * Fetch JSON with authentication
 */
async function fetchJsonWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchWithAuth(url, options);
  const text = await response.text();
  const isJson = (response.headers.get('content-type') || '').includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[');

  if (!isJson) {
    throw new Error(`Expected JSON from ${url} but server responded with non-JSON content`);
  }

  return JSON.parse(text) as T;
}

const baseTeacherClient = {
  /**
   * Get all classes for the authenticated teacher
   */
  getClasses: async (params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'inactive' | 'all';
  }): Promise<{ classes: Class[]; pagination: any }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);

    const url = `${API_BASE}/teacher/classes${queryParams.toString() ? `?${queryParams}` : ''}`;
    try {
      const res = await fetchJsonWithAuth<{ classes: Class[]; pagination: any }>(url);
      return res;
    } catch (err) {
      console.warn('[Teacher API] getClasses remote call failed, falling back to local store:', err);
      return await mockTeacherDB.getClasses(params);
    }
  },

  /**
   * Get a single class by ID
   */
  getClass: async (classId: string): Promise<Class> => {
    try {
      return await fetchJsonWithAuth<Class>(`${API_BASE}/teacher/classes/${classId}`);
    } catch (err) {
      console.warn('[Teacher API] getClass remote call failed, falling back to local store:', err);
      return await mockTeacherDB.getClass(classId);
    }
  },

  /**
   * Create a new class
   */
  createClass: async (data: CreateClassDTO): Promise<Class> => {
    try {
      const res = await fetchJsonWithAuth<any>(`${API_BASE}/teacher/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const created: Class = res.class || res;
      // Also persist into local storage mock database for consistent offline/dev fallback
      try {
        await mockTeacherDB.createClass(data);
      } catch {}
      return created;
    } catch (err) {
      console.warn('[Teacher API] createClass remote call failed, falling back to local store:', err);
      const fallback = await mockTeacherDB.createClass(data);
      return fallback as unknown as Class;
    }
  },

  /**
   * Update an existing class
   */
  updateClass: async (classId: string, data: UpdateClassDTO): Promise<Class> => {
    return fetchJsonWithAuth<Class>(`${API_BASE}/teacher/classes/${classId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a class (soft delete)
   */
  deleteClass: async (classId: string): Promise<{ success: boolean; message: string }> => {
    return fetchJsonWithAuth<{ success: boolean; message: string }>(
      `${API_BASE}/teacher/classes/${classId}`,
      { method: 'DELETE' }
    );
  },

  /**
   * Regenerate join code for a class
   */
  regenerateJoinCode: async (classId: string): Promise<{
    success: boolean;
    message: string;
    classId: string;
    oldJoinCode: string;
    newJoinCode: string;
  }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/classes/${classId}/regenerate-code`, {
      method: 'POST',
    });
  },

  // ============================================================
  // STUDENT ENROLLMENT
  // ============================================================

  /**
   * Get all students in a class
   */
  getClassStudents: async (classId: string, params?: {
    page?: number;
    limit?: number;
    status?: 'ACTIVE' | 'PENDING' | 'WITHDRAWN' | 'all';
    search?: string;
  }): Promise<{ students: any[]; pagination: any }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.search) queryParams.set('search', params.search);

    const url = `${API_BASE}/teacher/classes/${classId}/students${queryParams.toString() ? `?${queryParams}` : ''}`;
    return fetchJsonWithAuth<{ students: any[]; pagination: any }>(url);
  },

  /**
   * Bulk enroll students by Excel/CSV roster (name, enrollment number, email)
   */
  bulkEnrollStudents: async (
    classId: string, 
    studentsOrNumbers: Array<{ name?: string; enrollment_number?: string; email?: string } | string>
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      successful: any[];
      failed: any[];
      whitelistedEmailsCount?: number;
      invitationsDispatchedCount?: number;
      summary: { total: number; successful: number; failed: number; whitelisted?: number };
    };
  }> => {
    const isObjects = studentsOrNumbers.length > 0 && typeof studentsOrNumbers[0] === 'object';
    const payload = isObjects
      ? { students: studentsOrNumbers }
      : { enrollment_numbers: studentsOrNumbers };

    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/classes/${classId}/students/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update student enrollment
   */
  updateEnrollment: async (classId: string, studentId: string, data: {
    enrollment_status?: 'ACTIVE' | 'PENDING' | 'WITHDRAWN' | 'COMPLETED';
    final_grade?: string;
  }): Promise<{ success: boolean; message: string; enrollment: any }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/classes/${classId}/students/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Remove student from class
   */
  removeStudent: async (classId: string, studentId: string): Promise<{ success: boolean; message: string }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/classes/${classId}/students/${studentId}`, {
      method: 'DELETE',
    });
  },

  // ============================================================
  // QUIZ MANAGEMENT
  // ============================================================

  /**
   * Browse available quizzes for assignment
   */
  getAvailableQuizzes: async (params?: {
    page?: number;
    limit?: number;
    subject?: string;
    category?: string;
    difficulty?: string;
    search?: string;
    class_id?: string;
  }): Promise<{
    quizzes: any[];
    pagination: any;
    filters: {
      subjects: string[];
      categories: string[];
      difficulties: string[];
    };
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.subject) queryParams.set('subject', params.subject);
    if (params?.category) queryParams.set('category', params.category);
    if (params?.difficulty) queryParams.set('difficulty', params.difficulty);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.class_id) queryParams.set('class_id', params.class_id);

    const url = `${API_BASE}/teacher/quizzes${queryParams.toString() ? `?${queryParams}` : ''}`;
    return fetchJsonWithAuth<any>(url);
  },

  /**
   * Get quiz assignments for a class
   */
  getClassQuizAssignments: async (classId: string, params?: {
    page?: number;
    limit?: number;
    is_visible?: 'all' | '1' | '0';
  }): Promise<{
    assignments: any[];
    pagination: any;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.is_visible) queryParams.set('is_visible', params.is_visible);

    const url = `${API_BASE}/teacher/classes/${classId}/quizzes${queryParams.toString() ? `?${queryParams}` : ''}`;
    return fetchJsonWithAuth<any>(url);
  },

  /**
   * Assign quiz to class
   */
  assignQuizToClass: async (classId: string, data: {
    quiz_id: string;
    is_visible?: boolean;
  }): Promise<{ success: boolean; message: string; assignment: any }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/classes/${classId}/quizzes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Update quiz assignment
   */
  updateQuizAssignment: async (classId: string, assignmentId: string, data: {
    is_visible?: boolean;
  }): Promise<{ success: boolean; message: string; assignment: any }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/classes/${classId}/quizzes/${assignmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Remove quiz assignment from class
   */
  removeQuizAssignment: async (classId: string, assignmentId: string): Promise<{ success: boolean; message: string }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/classes/${classId}/quizzes/${assignmentId}`, {
      method: 'DELETE',
    });
  },

  // ============================================================
  // ASSIGNMENT MANAGEMENT
  // ============================================================

  /**
   * Get all assignments created by the teacher
   */
  getAssignments: async (params?: {
    page?: number;
    limit?: number;
    status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'GRADED' | 'all';
    class_id?: string;
    search?: string;
  }): Promise<{
    assignments: any[];
    pagination: any;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.class_id) queryParams.set('class_id', params.class_id);
    if (params?.search) queryParams.set('search', params.search);

    const url = `${API_BASE}/teacher/assignments${queryParams.toString() ? `?${queryParams}` : ''}`;
    return fetchJsonWithAuth<any>(url);
  },

  /**
   * Get a single assignment with full details
   */
  getAssignment: async (assignmentId: string): Promise<any> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/assignments/${assignmentId}`);
  },

  /**
   * Create a new assignment
   */
  createAssignment: async (data: {
    class_id: string;
    title: string;
    description?: string;
    instructions?: string;
    total_marks: number;
    due_date: string;
    allow_late_submission?: boolean;
    late_penalty_percent?: number;
    max_file_size_mb?: number;
    allowed_file_types?: string[];
    rubric?: object;
    attachments?: string[];
    questions?: Array<{
      question_text: string;
      question_type: 'MCQ' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'FILE_UPLOAD' | 'CODE';
      max_marks: number;
      options?: string[];
      correct_answer?: string;
      required?: boolean;
    }>;
  }): Promise<{ success: boolean; message: string; assignment: any }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing assignment
   */
  updateAssignment: async (assignmentId: string, data: {
    title?: string;
    description?: string;
    instructions?: string;
    total_marks?: number;
    due_date?: string;
    allow_late_submission?: boolean;
    late_penalty_percent?: number;
    max_file_size_mb?: number;
    allowed_file_types?: string[];
    rubric?: object;
    attachments?: string[];
    questions?: Array<{
      question_text: string;
      question_type: 'MCQ' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'FILE_UPLOAD' | 'CODE';
      max_marks: number;
      options?: string[];
      correct_answer?: string;
      required?: boolean;
    }>;
  }): Promise<{ success: boolean; message: string; assignment: any }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/assignments/${assignmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete an assignment
   */
  deleteAssignment: async (assignmentId: string): Promise<{ success: boolean; message: string; type: 'soft_delete' | 'hard_delete' }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Publish an assignment
   */
  publishAssignment: async (assignmentId: string, data?: {
    notify_students?: boolean;
  }): Promise<{ success: boolean; message: string; assignment: any; notifications_sent: number }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/assignments/${assignmentId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {}),
    });
  },

  /**
   * Get submissions for an assignment
   */
  getAssignmentSubmissions: async (assignmentId: string, params?: {
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'SUBMITTED' | 'LATE_SUBMITTED' | 'GRADED' | 'RETURNED' | 'all';
    search?: string;
  }): Promise<{
    submissions: any[];
    assignment_summary: any;
    pagination: any;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.search) queryParams.set('search', params.search);

    const url = `${API_BASE}/teacher/assignments/${assignmentId}/submissions${queryParams.toString() ? `?${queryParams}` : ''}`;
    return fetchJsonWithAuth<any>(url);
  },

  /**
   * Grade a submission with enhanced rubric support
   */
  gradeSubmission: async (assignmentId: string, submissionId: string, data: {
    marks: number;
    feedback?: string;
    rubric_scores?: Record<string, { points: number; feedback?: string }>;
    question_grades?: Array<{ question_id: string; marks: number; feedback?: string }>;
    annotations?: object;
    return_to_student?: boolean;
    override_reason?: string;
  }): Promise<{ success: boolean; message: string; submission: any }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/assignments/${assignmentId}/submissions/${submissionId}/grade`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Get submission details for grading
   */
  getSubmissionForGrading: async (submissionId: string): Promise<any> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/submissions/${submissionId}`);
  },

  /**
   * Bulk grade multiple submissions
   */
  bulkGradeSubmissions: async (data: {
    grades: Array<{
      submission_id: string;
      marks: number;
      feedback?: string;
      rubric_scores?: Record<string, { points: number; feedback?: string }>;
    }>;
    return_to_students?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      successful: any[];
      failed: any[];
      summary: { total: number; successful: number; failed: number };
    };
  }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/submissions/bulk-grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  // ============================================================
  // MATERIALS MANAGEMENT
  // ============================================================

  /**
   * Get all materials uploaded by teacher
   */
  getMaterials: async (params?: {
    page?: number;
    limit?: number;
    class_id?: string;
    is_visible?: 'all' | '1' | '0';
    search?: string;
  }): Promise<{
    materials: any[];
    pagination: any;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.class_id) queryParams.set('class_id', params.class_id);
    if (params?.is_visible) queryParams.set('is_visible', params.is_visible);
    if (params?.search) queryParams.set('search', params.search);

    const url = `${API_BASE}/teacher/materials${queryParams.toString() ? `?${queryParams}` : ''}`;
    return fetchJsonWithAuth<any>(url);
  },

  /**
   * Upload a new material
   */
  uploadMaterial: async (data: {
    class_id?: string;
    title?: string;
    description?: string;
    file_url?: string;
    file_name?: string;
    file_type?: string;
    file_size_bytes?: number;
    is_visible?: boolean;
    [key: string]: any;
  } | FormData): Promise<{ success: boolean; message: string; material?: any }> => {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      const response = await fetchWithAuth(`${API_BASE}/teacher/materials`, {
        method: 'POST',
        body: data,
      });
      return await response.json();
    }
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Get enrolled students for teacher
   */
  getStudents: async (params?: any): Promise<{ students: any[]; count: number }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/students`).catch(() => ({ students: [], count: 0 }));
  },

  /**
   * Get subjects taught by teacher
   */
  getSubjects: async (params?: any): Promise<{ subjects: any[] }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/subjects`).catch(() => ({ subjects: [] }));
  },


  /**
   * Get material details with stats
   */
  getMaterial: async (materialId: string): Promise<any> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/materials/${materialId}`);
  },

  /**
   * Update material metadata
   */
  updateMaterial: async (materialId: string, data: {
    title?: string;
    description?: string;
    is_visible?: boolean;
  }): Promise<{ success: boolean; message: string; material: any }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/materials/${materialId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a material
   */
  deleteMaterial: async (materialId: string): Promise<{ success: boolean; message: string }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/materials/${materialId}`, {
      method: 'DELETE',
    });
  },

  // ============================================================
  // NOTIFICATIONS MANAGEMENT
  // ============================================================

  /**
   * Get teacher notifications
   */
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    is_read?: 'all' | '1' | '0';
    type?: string;
  }): Promise<{
    notifications: any[];
    pagination: any;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.is_read) queryParams.set('is_read', params.is_read);
    if (params?.type) queryParams.set('type', params.type);

    const url = `${API_BASE}/teacher/notifications${queryParams.toString() ? `?${queryParams}` : ''}`;
    return fetchJsonWithAuth<any>(url);
  },

  /**
   * Create notifications (announcements)
   */
  createNotification: async (data: {
    class_id?: string;
    user_ids?: string[];
    type: string;
    channel?: 'IN_APP' | 'EMAIL' | 'SMS';
    title: string;
    message: string;
    link?: string;
    metadata?: object;
  }): Promise<{ success: boolean; message: string; notifications_created: number }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Mark notification as read
   */
  markNotificationRead: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },

  // ============================================================
  // ANALYTICS
  // ============================================================

  /**
   * Get teacher analytics dashboard
   */
  getAnalytics: async (params?: {
    class_id?: string;
    period?: 'week' | 'month' | 'semester' | 'all';
  }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.class_id) queryParams.set('class_id', params.class_id);
    if (params?.period) queryParams.set('period', params.period);

    const url = `${API_BASE}/teacher/analytics/dashboard${queryParams.toString() ? `?${queryParams}` : ''}`;
    return fetchJsonWithAuth<any>(url);
  },

  /**
   * Get at-risk students across classes
   */
  getAtRiskStudents: async (params?: { class_id?: string }): Promise<{ students: any[] }> => {
    const queryParams = new URLSearchParams();
    if (params?.class_id) queryParams.set('class_id', params.class_id);

    const url = `${API_BASE}/teacher/analytics/at-risk${queryParams.toString() ? `?${queryParams}` : ''}`;
    return fetchJsonWithAuth<any>(url);
  },

  /**
   * Get AI-generated performance insights
   */
  getAIInsights: async (params?: { class_id?: string }): Promise<{ insights: any[] }> => {
    const queryParams = new URLSearchParams();
    if (params?.class_id) queryParams.set('class_id', params.class_id);

    const url = `${API_BASE}/teacher/analytics/ai-insights${queryParams.toString() ? `?${queryParams}` : ''}`;
    return fetchJsonWithAuth<any>(url);
  },

  /**
   * Override a grade (HOD only)
   */
  overrideGrade: async (submissionId: string, data: { new_marks: number; reason: string }): Promise<any> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/submissions/${submissionId}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  // ============================================================
  // SETTINGS
  // ============================================================

  /**
   * Get teacher settings and preferences
   */
  getSettings: async (): Promise<any> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/settings`);
  },

  /**
   * Update teacher preferences
   */
  updateSettings: async (data: {
    notifications?: object;
    grading?: object;
    class_management?: object;
    display_name?: string;
    department?: string;
    designation?: string;
    [key: string]: any;
  }): Promise<{ success: boolean; message: string }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Get teacher dashboard overview metrics
   */
  getOverview: async (): Promise<{ stats: any }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/analytics/overview`).catch(() => ({
      stats: {
        subjectsCount: 0,
        classesCount: 0,
        studentsCount: 0,
        pendingGradingCount: 0,
      }
    }));
  },


  // ============================================================
  // GRADE ANALYTICS
  // ============================================================

  /**
   * Get grade analytics and distribution
   */
  getGradeAnalytics: async (params?: {
    assignment_id?: string;
    class_id?: string;
    period?: 'week' | 'month' | 'semester' | 'all';
    include_distribution?: boolean;
    include_trends?: boolean;
  }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.assignment_id) queryParams.set('assignment_id', params.assignment_id);
    if (params?.class_id) queryParams.set('class_id', params.class_id);
    if (params?.period) queryParams.set('period', params.period);
    if (params?.include_distribution) queryParams.set('include_distribution', 'true');
    if (params?.include_trends) queryParams.set('include_trends', 'true');

    const url = `${API_BASE}/teacher/analytics/grades${queryParams.toString() ? `?${queryParams}` : ''}`;
    return fetchJsonWithAuth<any>(url);
  },

  // ============================================================
  // PEER REVIEW SYSTEM
  // ============================================================

  /**
   * Set up peer review for an assignment
   */
  setupPeerReview: async (assignmentId: string, data: {
    review_deadline: string;
    reviews_per_student?: number;
    review_rubric: any[];
    allow_self_review?: boolean;
    anonymous_reviews?: boolean;
    auto_assign?: boolean;
  }): Promise<{ success: boolean; message: string; assignment_id: string }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/assignments/${assignmentId}/peer-review/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Get peer review status and assignments
   */
  getPeerReviewStatus: async (assignmentId: string): Promise<any> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/assignments/${assignmentId}/peer-review`);
  },

  /**
   * Manage peer review assignments
   */
  managePeerReviewAssignments: async (assignmentId: string, data: {
    action: 'reassign' | 'remove';
    reviewer_id: string;
    reviewee_submission_id: string;
    new_reviewer_id?: string;
    new_reviewee_submission_id?: string;
  }): Promise<{ success: boolean; message: string }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/assignments/${assignmentId}/peer-review/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  // ============================================================
  // ASSIGNMENT TEMPLATES
  // ============================================================

  /**
   * Get assignment templates
   */
  getAssignmentTemplates: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    created_by?: 'me' | 'others' | 'all';
    is_public?: 'all' | '1' | '0';
    tags?: string;
  }): Promise<{
    templates: any[];
    pagination: any;
    filters: any;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.search) queryParams.set('search', params.search);
    if (params?.created_by) queryParams.set('created_by', params.created_by);
    if (params?.is_public) queryParams.set('is_public', params.is_public);
    if (params?.tags) queryParams.set('tags', params.tags);

    const url = `${API_BASE}/teacher/templates${queryParams.toString() ? `?${queryParams}` : ''}`;
    return fetchJsonWithAuth<any>(url);
  },

  /**
   * Get a specific assignment template
   */
  getAssignmentTemplate: async (templateId: string): Promise<{ template: any }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/templates/${templateId}`);
  },

  /**
   * Create assignment template
   */
  createAssignmentTemplate: async (data: {
    title: string;
    description?: string;
    instructions?: string;
    total_marks: number;
    default_due_days?: number;
    allow_late_submission?: boolean;
    late_penalty_percent?: number;
    max_file_size_mb?: number;
    allowed_file_types?: string[];
    rubric?: any[];
    questions?: any[];
    attachments?: string[];
    tags?: string[];
    is_public?: boolean;
  }): Promise<{ success: boolean; message: string; template: any }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Update assignment template
   */
  updateAssignmentTemplate: async (templateId: string, data: any): Promise<{ success: boolean; message: string; template: any }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/templates/${templateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete assignment template
   */
  deleteAssignmentTemplate: async (templateId: string): Promise<{ success: boolean; message: string }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/templates/${templateId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Create assignment from template
   */
  useAssignmentTemplate: async (templateId: string, data: {
    class_id: string;
    due_date: string;
    customizations?: any;
  }): Promise<{ success: boolean; message: string; assignment: any }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/templates/${templateId}/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  // ============================================================
  // MESSAGING SYSTEM
  // ============================================================

  /**
   * Get message threads
   */
  getMessageThreads: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    thread_type?: 'DIRECT' | 'GROUP' | 'CLASS_ANNOUNCEMENT';
    class_id?: string;
    unread_only?: boolean;
  }): Promise<{
    threads: any[];
    pagination: any;
    filters: any;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.search) queryParams.set('search', params.search);
    if (params?.thread_type) queryParams.set('thread_type', params.thread_type);
    if (params?.class_id) queryParams.set('class_id', params.class_id);
    if (params?.unread_only) queryParams.set('unread_only', 'true');

    const url = `${API_BASE}/teacher/messages${queryParams.toString() ? `?${queryParams}` : ''}`;
    return fetchJsonWithAuth<any>(url);
  },

  /**
   * Send message to existing thread or create new thread
   */
  sendMessage: async (data: {
    thread_id?: string;
    recipient_ids?: string[];
    title?: string;
    class_id?: string;
    assignment_id?: string;
    content: string;
    message_type?: 'TEXT' | 'FILE' | 'IMAGE';
    attachments?: string[];
    reply_to_message_id?: string;
  }): Promise<{ success: boolean; message: string; data: any }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Get messages in a thread
   */
  getThreadMessages: async (threadId: string, params?: {
    page?: number;
    limit?: number;
    mark_as_read?: boolean;
  }): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.mark_as_read === false) queryParams.set('mark_as_read', 'false');

    const url = `${API_BASE}/teacher/messages/${threadId}${queryParams.toString() ? `?${queryParams}` : ''}`;
    return fetchJsonWithAuth<any>(url);
  },

  /**
   * Update thread settings
   */
  updateThread: async (threadId: string, data: {
    action: 'update_settings' | 'mark_read' | 'archive' | 'unarchive';
    title?: string;
    is_muted?: boolean;
    message_ids?: string[];
  }): Promise<{ success: boolean; message: string }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/messages/${threadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Update typing indicator
   */
  updateTypingIndicator: async (threadId: string, isTyping: boolean): Promise<{ success: boolean; message: string }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/messages/${threadId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_typing: isTyping }),
    });
  },

  // ============================================================
  // ANNOUNCEMENTS
  // ============================================================

  /**
   * Get announcements
   */
  getAnnouncements: async (params?: {
    page?: number;
    limit?: number;
    class_id?: string;
    is_published?: 'all' | '1' | '0';
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    search?: string;
  }): Promise<{
    announcements: any[];
    pagination: any;
    filters: any;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.class_id) queryParams.set('class_id', params.class_id);
    if (params?.is_published) queryParams.set('is_published', params.is_published);
    if (params?.priority) queryParams.set('priority', params.priority);
    if (params?.search) queryParams.set('search', params.search);

    const url = `${API_BASE}/teacher/announcements${queryParams.toString() ? `?${queryParams}` : ''}`;
    return fetchJsonWithAuth<any>(url);
  },

  /**
   * Create announcement
   */
  createAnnouncement: async (data: {
    class_id?: string;
    title: string;
    content: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    target_audience?: 'STUDENTS' | 'PARENTS' | 'BOTH';
    channels?: ('IN_APP' | 'EMAIL' | 'SMS')[];
    attachments?: string[];
    expires_at?: string;
    pin_to_top?: boolean;
    allow_comments?: boolean;
    publish_immediately?: boolean;
  }): Promise<{ success: boolean; message: string; announcement: any; notifications_sent: number }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Get specific announcement
   */
  getAnnouncement: async (announcementId: string): Promise<{ announcement: any }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/announcements/${announcementId}`);
  },

  /**
   * Update announcement
   */
  updateAnnouncement: async (announcementId: string, data: any): Promise<{ 
    success: boolean; 
    message: string; 
    announcement: any; 
    notifications_sent: number 
  }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/announcements/${announcementId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete announcement
   */
  deleteAnnouncement: async (announcementId: string): Promise<{ success: boolean; message: string }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/announcements/${announcementId}`, {
      method: 'DELETE',
    });
  },

  // ============================================================
  // PARENT COMMUNICATIONS
  // ============================================================

  /**
   * Get parent communication records
   */
  getParentCommunications: async (params?: {
    page?: number;
    limit?: number;
    student_id?: string;
    class_id?: string;
    communication_type?: string;
    delivery_status?: string;
    search?: string;
  }): Promise<{
    communications: any[];
    pagination: any;
    filters: any;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.student_id) queryParams.set('student_id', params.student_id);
    if (params?.class_id) queryParams.set('class_id', params.class_id);
    if (params?.communication_type) queryParams.set('communication_type', params.communication_type);
    if (params?.delivery_status) queryParams.set('delivery_status', params.delivery_status);
    if (params?.search) queryParams.set('search', params.search);

    const url = `${API_BASE}/teacher/parent-communications${queryParams.toString() ? `?${queryParams}` : ''}`;
    return fetchJsonWithAuth<any>(url);
  },

  /**
   * Send communication to parents
   */
  sendParentCommunication: async (data: {
    student_ids: string[];
    communication_type: 'PROGRESS_REPORT' | 'ATTENDANCE_ALERT' | 'GRADE_NOTIFICATION' | 'BEHAVIOR_REPORT' | 'GENERAL_UPDATE';
    subject: string;
    message: string;
    attachments?: string[];
    include_student_summary?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      successful: any[];
      failed: any[];
      summary: { total: number; successful: number; failed: number };
    };
  }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/parent-communications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Get Gradebook data matrix for a class
   */
  getClassGradebook: async (classId: string): Promise<{
    students: any[];
    assignments: any[];
    grades: Record<string, Record<string, number | null>>;
  }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/classes/${classId}/gradebook`);
  },

  /**
   * Request an AI evaluation/grading suggestion for a submission
   */
  getAIEvaluationDraft: async (submissionId: string): Promise<{
    marks: number;
    feedback: string;
  }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/submissions/${submissionId}/ai-evaluate`, {
      method: 'POST',
    });
  },

  // ============================================================
  // LIVE CHALLENGE WORD ATTENDANCE SESSIONS
  // ============================================================

  /**
   * Create a live challenge word attendance session
   */
  createAttendanceSession: async (data: {
    class_id: string;
    session_code?: string;
    challenge_word?: string;
    duration_minutes?: number;
    geofence_enabled?: boolean;
    geofence_latitude?: number;
    geofence_longitude?: number;
    geofence_radius_meters?: number;
  }): Promise<{ success: boolean; session: any }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/attendance/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Get active attendance session for a class
   */
  getActiveAttendanceSession: async (classId: string): Promise<{ session: any | null }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/classes/${classId}/active-attendance-session`);
  },

  /**
   * End live attendance session
   */
  endAttendanceSession: async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/attendance/sessions/${sessionId}/end`, {
      method: 'POST',
    });
  },

  /**
   * Get student submissions for a live attendance session
   */
  getAttendanceSessionSubmissions: async (sessionId: string): Promise<{ submissions: any[] }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/teacher/attendance/sessions/${sessionId}/submissions`);
  },

  /**
   * Submit student attendance with Session Code & optional GPS coordinates
   */
  submitStudentAttendance: async (data: {
    session_code: string;
    challenge_word?: string;
    student_id: string;
    student_name: string;
    enrollment_number: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  }): Promise<{ success: boolean; message: string; submission?: any }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/student/attendance/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Enroll student in a class using Join Code
   */
  enrollStudentByJoinCode: async (data: {
    join_code: string;
    student_id: string;
    student_name: string;
    student_email: string;
    enrollment_number: string;
  }): Promise<{ success: boolean; message: string; classData: any }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/student/classes/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Get student enrolled classes
   */
  getStudentEnrolledClasses: async (studentId: string): Promise<{ classes: any[] }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/student/classes/enrolled?student_id=${studentId}`);
  },

  /**
   * Get materials for a class (for students or teachers)
   */
  getClassMaterials: async (classId: string): Promise<{ materials: any[] }> => {
    return fetchJsonWithAuth<any>(`${API_BASE}/student/classes/${classId}/materials`);
  },

  /**
   * Verify if teacher email is in Cloudflare D1 teacher_whitelist table
   */
  verifyTeacherWhitelist: async (email: string): Promise<{ email: string; isWhitelisted: boolean }> => {
    return fetchJsonWithAuth<{ email: string; isWhitelisted: boolean }>(`${API_BASE}/auth/verify-whitelist?email=${encodeURIComponent(email)}`);
  },
};

export const teacherClient = baseTeacherClient;
