import {
  createDocumentWithFiles,
  intValue,
  normalizeDocumentType,
  resolveBranch,
  resolveSubject,
  textValue,
} from "../../../lib/materialUpload";
import { requireAdminOrTeacher } from "../../../lib/auth";

export async function onRequestGet(context: any) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdminOrTeacher(request, env);
  if (authError) {
    return authError;
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  try {
    let query = `
      SELECT
        d.id,
        d.document_type,
        d.document_type AS material_type,
        d.title,
        d.description,
        d.approval_status,
        d.approval_status AS status,
        d.uploaded_by,
        d.approved_by,
        d.created_at,
        d.updated_at,
        u.name AS university,
        b.id AS branch_id,
        b.name AS branch_name,
        b.name AS branch_names,
        b.short_name AS branch_short_names,
        b.slug AS branch_slug,
        s.id AS subject_id,
        s.id AS subject_offering_id,
        s.name AS subject_name,
        s.code AS subject_code,
        s.slug AS subject_slug,
        s.semester AS semester_no,
        f.storage_key,
        f.file_asset_id,
        fa.content_hash,
        fa.size_bytes AS size_bytes,
        fa.original_filename AS asset_filename,
        f.original_filename,
        f.file_url,
        f.file_url AS url,
        d.paper_year AS exam_year,
        CASE d.season WHEN 'W' THEN 'winter' WHEN 'S' THEN 'summer' ELSE NULL END AS exam_session,
        d.syllabus_year,
        d.version_label,
        d.regulation,
        d.material_kind,
        d.unit_no,
        d.chapter,
        d.topic,
        d.author,
        d.views,
        d.likes,
        d.downloads,
        blog.id AS blog_id,
        blog.title AS blog_title,
        blog.status AS blog_status
      FROM documents d
      LEFT JOIN universities u ON u.id = d.university_id
      LEFT JOIN branches b ON b.id = d.branch_id
      LEFT JOIN subjects s ON s.id = d.subject_id
      LEFT JOIN document_files f ON f.document_id = d.id AND f.is_primary = 1
      LEFT JOIN file_assets fa ON fa.id = f.file_asset_id
      LEFT JOIN blogs blog ON blog.id = d.blog_id OR blog.related_document_id = d.id
      WHERE 1=1
    `;

    const params: string[] = [];
    if (type) {
      query += " AND d.document_type = ?";
      params.push(normalizeDocumentType(type));
    }

    query += " ORDER BY d.created_at DESC";

    const stmt = env.DB.prepare(query);
    const { results } = await (params.length ? stmt.bind(...params) : stmt).all();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdminOrTeacher(request, env);
  if (authError) {
    return authError;
  }

  try {
    // Support both JSON and FormData submissions.
    // The Admin PYQ Hub sends JSON (camelCase keys),
    // while other upload forms may send FormData (snake_case keys).
    let formData: FormData;
    const contentType = (request.headers.get("Content-Type") || "").toLowerCase();

    if (contentType.includes("application/json")) {
      const json = await request.json() as Record<string, any>;
      formData = new FormData();

      // Map camelCase JSON keys → snake_case FormData keys
      const keyMap: Record<string, string> = {
        documentType: "material_type",
        materialType: "material_type",
        fileUrl: "file_url",
        subjectId: "subject_id",
        subjectOfferingId: "subject_offering_id",
        branchId: "branch_id",
        branchIds: "branch_ids",
        paperYear: "exam_year",
        examYear: "exam_year",
        examSession: "exam_session",
        season: "exam_session",
        approvalStatus: "status",
        syllabusYear: "syllabus_year",
        versionLabel: "version_label",
        materialKind: "material_kind",
        unitNo: "unit_no",
        subjectName: "subject_name",
        subjectCode: "subject_code",
        manualSubjectName: "manual_subject_name",
        createBlog: "create_blog",
        blogTitle: "blog_title",
        blogContent: "blog_content",
        blogAuthor: "blog_author",
        blogCategory: "blog_category",
        blogTags: "blog_tags",
        blogThumbnail: "blog_thumbnail",
        blogStatus: "blog_status",
        blogId: "blog_id",
      };

      for (const [jsonKey, value] of Object.entries(json)) {
        if (value == null) continue;
        const formKey = keyMap[jsonKey] || jsonKey;
        formData.append(formKey, String(value));
      }
    } else {
      formData = await request.formData();
    }

    const documentType = normalizeDocumentType(textValue(formData, "material_type"));
    const fileUrl = textValue(formData, "file_url");
    const file = formData.get("file") as File | null;
    const solutionFile = formData.get("solution_file") as File | null;

    if (!file && !fileUrl && documentType !== "syllabus") {
      return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
    }
    const subjectId = textValue(formData, "subject_id") || textValue(formData, "subject_offering_id");
    let subject: any = null;
    let branch: any = null;

    if (subjectId) {
      subject = await env.DB.prepare(
        `SELECT id, university_id, branch_id, semester, code, name, slug
         FROM subjects
         WHERE id = ?`
      )
        .bind(subjectId)
        .first();
      if (!subject) {
        return new Response(JSON.stringify({ error: "Selected subject not found" }), { status: 400 });
      }
      branch = await resolveBranch(env, { branchId: subject.branch_id });
    } else {
      const branchId =
        textValue(formData, "branch_id") ||
        textValue(formData, "branch_ids").split(",").filter(Boolean)[0];
      const semester =
        intValue(formData, "semester") ||
        Number(textValue(formData, "semesters").split(",").filter(Boolean)[0]);
      const subjectName = textValue(formData, "manual_subject_name") || textValue(formData, "subject_name");

      branch = await resolveBranch(env, { branchId });
      if (!branch) {
        return new Response(JSON.stringify({ error: "Branch is required" }), { status: 400 });
      }
      if (!Number.isFinite(semester)) {
        return new Response(JSON.stringify({ error: "Semester is required" }), { status: 400 });
      }

      subject = await resolveSubject(env, {
        branchId: branch.id,
        universityId: branch.university_id,
        semester,
        subjectName,
        subjectCode: textValue(formData, "subject_code"),
      });
    }

    if (!branch) {
      return new Response(JSON.stringify({ error: "Branch not found" }), { status: 400 });
    }

    const createBlog =
      textValue(formData, "create_blog") === "true" ||
      Boolean(textValue(formData, "blog_title") && textValue(formData, "blog_content"));

    const result = await createDocumentWithFiles({
      env,
      requestUrl: request.url,
      file,
      fileUrl,
      solutionFile,
      title: textValue(formData, "title") || (file ? file.name : `${subject.name} Syllabus`),
      documentType,
      status: textValue(formData, "status") || "published",
      branch,
      subject,
      uploadedBy: textValue(formData, "author") || "admin",
      description: textValue(formData, "description") || null,
      examYear: intValue(formData, "exam_year"),
      examSession: textValue(formData, "exam_session") || textValue(formData, "exam_month"),
      syllabusYear: intValue(formData, "syllabus_year"),
      regulation: textValue(formData, "regulation") || null,
      versionLabel: textValue(formData, "version_label") || null,
      materialKind: textValue(formData, "material_kind") || "notes",
      unitNo: intValue(formData, "unit_no"),
      chapter: textValue(formData, "chapter") || null,
      topic: textValue(formData, "topic") || null,
      author: textValue(formData, "author") || null,
      blogId: textValue(formData, "blog_id") || null,
      blog: {
        enabled: createBlog,
        title: textValue(formData, "blog_title") || null,
        content: textValue(formData, "blog_content") || null,
        author: textValue(formData, "blog_author") || textValue(formData, "author") || "Admin",
        category: textValue(formData, "blog_category") || "Study Guides",
        tags: textValue(formData, "blog_tags") || null,
        thumbnail: textValue(formData, "blog_thumbnail") || null,
        status: textValue(formData, "blog_status") || "draft",
      },
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
