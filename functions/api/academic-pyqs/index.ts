import {
  createDocumentWithFiles,
  intValue,
  resolveBranch,
  resolveSubject,
  textValue,
} from "../../lib/materialUpload";
import { convertLegacyGtuUrl } from "../../lib/gtuPyqDiscoveryEngine";

const pyqSelect = `
  SELECT
    d.id,
    d.title,
    b.name AS branch_name,
    s.semester,
    s.name AS subject_name,
    s.code AS subject_code,
    'PYQ' AS exam_type,
    u.name AS university,
    CASE d.season WHEN 'W' THEN 'Winter' WHEN 'S' THEN 'Summer' ELSE NULL END AS exam_month,
    d.paper_year AS exam_year,
    d.description AS short_description,
    blog.content AS content,
    NULL AS important_topics,
    NULL AS difficulty,
    paper.file_url AS question_paper_url,
    solution.file_url AS solution_url,
    d.approval_status AS status,
    d.views,
    d.downloads,
    d.created_at,
    d.updated_at
  FROM documents d
  JOIN universities u ON u.id = d.university_id
  JOIN branches b ON b.id = d.branch_id
  JOIN subjects s ON s.id = d.subject_id
  LEFT JOIN document_files paper ON paper.document_id = d.id AND paper.file_type = 'paper'
  LEFT JOIN document_files solution ON solution.document_id = d.id AND solution.file_type = 'solution'
  LEFT JOIN blogs blog ON blog.related_document_id = d.id
`;

export async function onRequestGet(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const branchParam = url.searchParams.get("branch") || url.searchParams.get("branchId") || url.searchParams.get("branchSlug");
    const semParam = url.searchParams.get("semester") || url.searchParams.get("sem");
    const subjectParam = url.searchParams.get("subject") || url.searchParams.get("subjectId") || url.searchParams.get("subjectSlug");

    let whereClause = "WHERE d.document_type = 'pyq' AND d.approval_status = 'approved'";
    const bindings: any[] = [];

    if (branchParam) {
      whereClause += " AND (b.slug = ? OR b.id = ?)";
      bindings.push(branchParam, branchParam);
    }
    if (semParam && Number.isFinite(Number(semParam))) {
      whereClause += " AND s.semester = ?";
      bindings.push(Number(semParam));
    }
    if (subjectParam) {
      whereClause += " AND (s.slug = ? OR s.code = ? OR s.id = ?)";
      bindings.push(subjectParam, subjectParam, subjectParam);
    }

    const { results } = await env.DB.prepare(
      `${pyqSelect}
       ${whereClause}
       ORDER BY d.created_at DESC`
    ).bind(...bindings).all();

    const formatted = (results || []).map((row: any) => ({
      ...row,
      question_paper_url: convertLegacyGtuUrl(row.question_paper_url),
    }));

    return new Response(JSON.stringify(formatted), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Failed to fetch academic PYQs" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const formData = await request.formData();
    const fileEntry = formData.get("question_paper") || formData.get("file");
    const file = fileEntry instanceof File ? fileEntry : null;
    const solutionEntry = formData.get("solution");
    const solutionFile = solutionEntry instanceof File ? solutionEntry : null;

    if (!file) {
      return new Response(JSON.stringify({ error: "Question paper PDF is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const branch = await resolveBranch(env, {
      branchId: textValue(formData, "branch_id"),
      branchSlug: textValue(formData, "branch_slug"),
      branchName: textValue(formData, "branch_name"),
    });
    if (!branch) {
      return new Response(JSON.stringify({ error: "Valid branch is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const subject = await resolveSubject(env, {
      subjectId: textValue(formData, "subject_id") || textValue(formData, "subject_offering_id"),
      branchId: branch.id,
      universityId: branch.university_id,
      semester: intValue(formData, "semester") || 1,
      subjectName: textValue(formData, "subject_name"),
      subjectCode: textValue(formData, "subject_code"),
    });

    const content = textValue(formData, "content");
    const result = await createDocumentWithFiles({
      env,
      requestUrl: request.url,
      file,
      solutionFile,
      title: textValue(formData, "title") || file.name,
      documentType: "pyq",
      status: textValue(formData, "status") || "draft",
      branch,
      subject,
      uploadedBy: "admin",
      description: textValue(formData, "short_description") || null,
      examYear: intValue(formData, "exam_year"),
      examSession: textValue(formData, "exam_month"),
      blog: {
        enabled: Boolean(content),
        title: textValue(formData, "blog_title") || textValue(formData, "title"),
        content,
        author: "Admin",
        category: "PYQ Analysis",
        tags: textValue(formData, "important_topics"),
        status: textValue(formData, "status") === "published" ? "published" : "draft",
      },
    });

    return new Response(JSON.stringify({ id: result.id, success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Failed to create academic PYQ" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
