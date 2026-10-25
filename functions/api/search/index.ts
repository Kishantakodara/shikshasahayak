// ============================================================
// GLOBAL SEARCH API: GET /api/search
// Section 31 & 32: Real cross-database search across Subjects, Study Materials,
// PYQs, Questions, and Assignments for Ctrl + K Command Palette.
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const category = url.searchParams.get("category"); // 'subjects' | 'materials' | 'pyqs' | 'questions' | 'assignments'

  const coreDb = (env as any).PADHAKU_CORE_DB || env.DB;
  const db = env.DB || (env as any).PADHAKU_CORE_DB;
  const assessmentDb = (env as any).ASSESSMENT_DB || env.DB;

  if (!db && !coreDb) {
    return errorResponse("Database binding not found", 500);
  }

  const queryPattern = `%${q}%`;
  const results = {
    subjects: [] as any[],
    materials: [] as any[],
    pyqs: [] as any[],
    questions: [] as any[],
    assignments: [] as any[],
  };

  try {
    // 1. Search Subjects (PADHAKU_CORE_DB / DB)
    if (!category || category === 'subjects' || category === 'all') {
      const subjectDb = coreDb || db;
      if (subjectDb) {
        try {
          const { results: subRows } = await subjectDb.prepare(
            `SELECT s.id, s.name, s.code, s.semester, s.branch_id,
                    COALESCE(s.code, LOWER(REPLACE(REPLACE(s.name, ' ', '-'), '/', '-'))) AS slug
             FROM subjects s
             WHERE LOWER(s.name) LIKE LOWER(?) OR LOWER(s.code) LIKE LOWER(?)
             ORDER BY s.name ASC
             LIMIT 10`
          ).bind(queryPattern, queryPattern).all<Record<string, unknown>>();

          results.subjects = (subRows || []).map(r => ({
            id: String(r.id),
            title: String(r.name),
            code: r.code ? String(r.code) : null,
            semester: Number(r.semester || 1),
            branchId: r.branch_id ? String(r.branch_id) : null,
            slug: String(r.slug),
            type: 'subject',
            url: `/student/subject/${r.code || r.slug}`,
          }));
        } catch {}
      }
    }

    // 2. Search Study Materials (documents table)
    if (!category || category === 'materials' || category === 'all') {
      const matDb = db || coreDb;
      if (matDb) {
        try {
          const { results: matRows } = await matDb.prepare(
            `SELECT d.id, d.title, d.semester, d.branch_id, d.paper_year,
                    s.name as subject_name, s.code as subject_code
             FROM documents d
             LEFT JOIN subjects s ON d.subject_id = s.id
             WHERE (d.document_type = 'study-material' OR d.document_type = 'study_material' OR d.document_type = 'syllabus')
               AND d.approval_status = 'approved'
               AND (LOWER(d.title) LIKE LOWER(?) OR LOWER(s.name) LIKE LOWER(?) OR LOWER(s.code) LIKE LOWER(?))
             ORDER BY d.created_at DESC
             LIMIT 10`
          ).bind(queryPattern, queryPattern, queryPattern).all<Record<string, unknown>>();

          results.materials = (matRows || []).map(r => ({
            id: String(r.id),
            title: String(r.title),
            subjectName: r.subject_name ? String(r.subject_name) : 'GTU Study Material',
            subjectCode: r.subject_code ? String(r.subject_code) : null,
            semester: Number(r.semester || 1),
            type: 'material',
            url: `/materials/${r.id}`,
          }));
        } catch {}
      }
    }

    // 3. Search PYQs (documents / gtu_question_papers)
    if (!category || category === 'pyqs' || category === 'all') {
      const pyqDb = db || coreDb;
      if (pyqDb) {
        try {
          const { results: pyqRows } = await pyqDb.prepare(
            `SELECT d.id, d.title, d.semester, d.paper_year, d.season,
                    s.name as subject_name, s.code as subject_code
             FROM documents d
             LEFT JOIN subjects s ON d.subject_id = s.id
             WHERE d.document_type = 'pyq'
               AND d.approval_status = 'approved'
               AND (LOWER(d.title) LIKE LOWER(?) OR LOWER(s.name) LIKE LOWER(?) OR LOWER(s.code) LIKE LOWER(?))
             ORDER BY d.paper_year DESC, d.created_at DESC
             LIMIT 10`
          ).bind(queryPattern, queryPattern, queryPattern).all<Record<string, unknown>>();

          results.pyqs = (pyqRows || []).map(r => ({
            id: String(r.id),
            title: String(r.title),
            subjectName: r.subject_name ? String(r.subject_name) : 'GTU Exam Paper',
            subjectCode: r.subject_code ? String(r.subject_code) : null,
            year: r.paper_year ? Number(r.paper_year) : 2024,
            season: r.season ? String(r.season) : 'Winter',
            semester: Number(r.semester || 1),
            type: 'pyq',
            url: `/resources/pyq`,
          }));
        } catch {}
      }
    }

    // 4. Search Questions (master_question_bank)
    if (!category || category === 'questions' || category === 'all') {
      const qDb = assessmentDb || db;
      if (qDb) {
        try {
          const { results: qRows } = await qDb.prepare(
            `SELECT id, question_text, difficulty, marks, subject_name, subject_code, topic_name, exam_name, exam_year
             FROM master_question_bank
             WHERE verification_status = 'verified'
               AND (LOWER(question_text) LIKE LOWER(?) OR LOWER(topic_name) LIKE LOWER(?) OR LOWER(subject_name) LIKE LOWER(?))
             LIMIT 10`
          ).bind(queryPattern, queryPattern, queryPattern).all<Record<string, unknown>>();

          results.questions = (qRows || []).map(r => ({
            id: String(r.id),
            title: String(r.question_text).substring(0, 100) + '...',
            topicName: r.topic_name ? String(r.topic_name) : null,
            subjectName: r.subject_name ? String(r.subject_name) : 'Question Bank',
            difficulty: String(r.difficulty || 'medium'),
            marks: Number(r.marks || 1),
            type: 'question',
            url: `/student/practice`,
          }));
        } catch {}
      }
    }

    // 5. Search Assignments (assignments)
    if (!category || category === 'assignments' || category === 'all') {
      if (coreDb) {
        try {
          const { results: assignRows } = await coreDb.prepare(
            `SELECT a.id, a.title, a.due_date, a.total_marks, s.name as subject_name
             FROM assignments a
             LEFT JOIN classes c ON a.class_id = c.id
             LEFT JOIN subjects s ON c.subject_id = s.id
             WHERE a.status = 'published'
               AND (LOWER(a.title) LIKE LOWER(?) OR LOWER(a.description) LIKE LOWER(?) OR LOWER(s.name) LIKE LOWER(?))
             ORDER BY a.due_date ASC
             LIMIT 10`
          ).bind(queryPattern, queryPattern, queryPattern).all<Record<string, unknown>>();

          results.assignments = (assignRows || []).map(r => ({
            id: String(r.id),
            title: String(r.title),
            subjectName: r.subject_name ? String(r.subject_name) : 'Academic Lab',
            dueDate: r.due_date ? String(r.due_date) : null,
            totalMarks: Number(r.total_marks || 20),
            type: 'assignment',
            url: `/student/assignments`,
          }));
        } catch {}
      }
    }

    return jsonResponse({
      success: true,
      query: q,
      data: results,
      totalCount:
        results.subjects.length +
        results.materials.length +
        results.pyqs.length +
        results.questions.length +
        results.assignments.length,
    }, {
      headers: {
        "Cache-Control": q ? "public, max-age=60, s-maxage=120" : "public, max-age=300",
      },
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/search:", error);
    const message = error instanceof Error ? error.message : "Search failed";
    return errorResponse(message, 500);
  }
}
