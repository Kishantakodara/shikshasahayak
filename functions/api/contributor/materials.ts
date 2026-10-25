import {
  createDocumentWithFiles,
  intValue,
  normalizeDocumentType,
  resolveBranch,
  resolveSubject,
  textValue,
} from "../../lib/materialUpload";

const departmentToBranch: Record<string, string> = {
  cse: "computer",
  it: "it",
  ee: "electrical",
  ece: "ece",
  me: "mechanical",
  ce: "civil",
};

export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided in the form data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const parentDocumentId = textValue(formData, "parent_document_id");
    let documentType = normalizeDocumentType(textValue(formData, "material_type"));
    const subjectId = textValue(formData, "subject_id") || textValue(formData, "subject_offering_id");
    let subject: any = null;
    let branch: any = null;
    let examYear = intValue(formData, "exam_year");
    let examSession = textValue(formData, "exam_session");

    if (parentDocumentId) {
      const parentDoc: any = await env.DB.prepare(
        `SELECT d.branch_id, d.subject_id, p.paper_year, p.season, d.title
         FROM documents d
         LEFT JOIN pyq_details p ON p.document_id = d.id
         WHERE d.id = ?`
      )
        .bind(parentDocumentId)
        .first();

      if (!parentDoc) {
        return new Response(JSON.stringify({ error: "Parent PYQ document not found" }), { status: 400 });
      }

      documentType = "pyq";
      branch = await resolveBranch(env, { branchId: parentDoc.branch_id });
      subject = await env.DB.prepare(
        `SELECT id, university_id, branch_id, semester, code, name, slug
         FROM subjects
         WHERE id = ?`
      )
        .bind(parentDoc.subject_id)
        .first();

      if (!subject) {
        return new Response(JSON.stringify({ error: "Parent subject not found" }), { status: 400 });
      }

      examYear = parentDoc.paper_year;
      examSession = parentDoc.season;
    } else if (subjectId) {
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
      const departmentId = textValue(formData, "departmentId");
      const branchSlug = departmentToBranch[departmentId] || textValue(formData, "branch_slug") || "computer";
      branch = await resolveBranch(env, { branchSlug });
      if (!branch) {
        return new Response(JSON.stringify({ error: "Branch not found" }), { status: 400 });
      }

      subject = await resolveSubject(env, {
        branchId: branch.id,
        universityId: branch.university_id,
        semester: intValue(formData, "semester") || 1,
        subjectName: textValue(formData, "subject_name") || "General",
        subjectCode: textValue(formData, "subject_code"),
      });
    }

    const result = await createDocumentWithFiles({
      env,
      requestUrl: request.url,
      file,
      title: textValue(formData, "title") || file.name,
      documentType,
      status: "pending",
      branch,
      subject,
      uploadedBy: textValue(formData, "author") || "contributor",
      examYear,
      examSession,
      syllabusYear: intValue(formData, "syllabus_year"),
      regulation: textValue(formData, "regulation") || null,
      versionLabel: textValue(formData, "version_label") || null,
      materialKind: documentType === "study-material" ? "notes" : null,
      parentDocumentId: parentDocumentId || null,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
