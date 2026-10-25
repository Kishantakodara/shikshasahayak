import {
  createDocumentWithFiles,
  intValue,
  resolveBranch,
  resolveSubject,
  textValue,
} from "../../lib/materialUpload";

const studySelect = `
  SELECT
    d.id,
    d.title,
    b.name AS branch_name,
    s.semester,
    s.name AS subject_name,
    d.unit_no AS unit_number,
    d.topic AS topic_name,
    d.author AS faculty_name,
    u.name AS university,
    NULL AS academic_year,
    d.description AS short_description,
    blog.content AS content,
    blog.tags AS tags,
    blog.thumbnail AS cover_image_url,
    file.file_url AS pdf_url,
    d.approval_status AS status,
    0 AS is_featured,
    d.views,
    d.downloads,
    d.created_at,
    d.updated_at
  FROM documents d
  JOIN universities u ON u.id = d.university_id
  JOIN branches b ON b.id = d.branch_id
  JOIN subjects s ON s.id = d.subject_id
  LEFT JOIN document_files file ON file.document_id = d.id AND file.is_primary = 1
  LEFT JOIN blogs blog ON blog.related_document_id = d.id
`;

export async function onRequestGet(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const branchParam = url.searchParams.get("branch") || url.searchParams.get("branchId") || url.searchParams.get("branchSlug");
    const semParam = url.searchParams.get("semester") || url.searchParams.get("sem");
    const subjectParam = url.searchParams.get("subject") || url.searchParams.get("subjectId") || url.searchParams.get("subjectSlug");

    let whereClause = "WHERE d.document_type = 'study-material' AND d.approval_status = 'approved'";
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
      `${studySelect}
       ${whereClause}
       ORDER BY d.created_at DESC`
    ).bind(...bindings).all();

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Failed to fetch study materials" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const formData = await request.formData();
    const fileEntry = formData.get("file");
    const file = fileEntry instanceof File ? fileEntry : null;

    if (!file) {
      return new Response(JSON.stringify({ error: "PDF file is required" }), {
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
      title: textValue(formData, "title") || file.name,
      documentType: "study-material",
      status: textValue(formData, "status") || "draft",
      branch,
      subject,
      uploadedBy: textValue(formData, "faculty_name") || "admin",
      description: textValue(formData, "short_description") || null,
      materialKind: "notes",
      unitNo: intValue(formData, "unit_number"),
      topic: textValue(formData, "topic_name") || null,
      author: textValue(formData, "faculty_name") || null,
      blog: {
        enabled: Boolean(content),
        title: textValue(formData, "blog_title") || textValue(formData, "title"),
        content,
        author: textValue(formData, "faculty_name") || "Admin",
        category: "Study Material",
        tags: textValue(formData, "tags"),
        thumbnail: textValue(formData, "cover_image_url"),
        status: textValue(formData, "status") === "published" ? "published" : "draft",
      },
    });

    return new Response(JSON.stringify({ id: result.id, success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Failed to create study material" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
