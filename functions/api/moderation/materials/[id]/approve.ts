import { resolveBranch, resolveSubject } from "../../../../lib/materialUpload";
import { requireAdminOrTeacher } from "../../../../lib/auth";

export async function onRequestPost(context: any) {
  const { request, env, params } = context;

  const { errorResponse: authError } = await requireAdminOrTeacher(request, env);
  if (authError) {
    return authError;
  }

  const materialId = params.id;

  try {
    if (!materialId) {
      return new Response(JSON.stringify({ error: "Material ID is required" }), { status: 400 });
    }

    // Get the current document to know its type and current values
    const currentDoc: any = await env.DB.prepare(
      `SELECT id, document_type, branch_id, semester, subject_id, title, uploaded_by, parent_document_id 
       FROM documents 
       WHERE id = ?`
    ).bind(materialId).first();

    if (!currentDoc) {
      return new Response(JSON.stringify({ error: "Material not found" }), { status: 404 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      // Body might be empty (just simple approve request)
    }

    if (currentDoc.parent_document_id) {
      // Re-link the files to the parent document, making them secondary and of type 'solution'
      await env.DB.prepare(
        `UPDATE document_files
         SET document_id = ?, is_primary = 0, file_type = 'solution'
         WHERE document_id = ?`
      ).bind(currentDoc.parent_document_id, materialId).run();

      // Clean up the temporary document records
      await env.DB.prepare("DELETE FROM blogs WHERE related_document_id = ?").bind(materialId).run();
      await env.DB.prepare("DELETE FROM documents WHERE id = ?").bind(materialId).run();

      return new Response(JSON.stringify({ success: true, merged: true, parent_document_id: currentDoc.parent_document_id }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    let finalBranchId = body.branch_id || currentDoc.branch_id;
    let finalSemester = body.semester ? Number(body.semester) : currentDoc.semester;
    let finalSubjectId = body.subject_id || currentDoc.subject_id;
    let finalTitle = body.title || currentDoc.title;
    let finalUploadedBy = body.author_name || currentDoc.uploaded_by;

    // Resolve branch and subject if they changed or we are editing
    const branch = await resolveBranch(env, { branchId: finalBranchId });
    if (!branch) {
      return new Response(JSON.stringify({ error: "Branch not found" }), { status: 400 });
    }

    let subject;
    if (body.subject_id && body.subject_id !== currentDoc.subject_id) {
      // Map to selected subject
      subject = await env.DB.prepare("SELECT id, university_id, branch_id, semester, name, code, slug FROM subjects WHERE id = ?").bind(body.subject_id).first();
    } else if (body.subject_name) {
      // Create/resolve custom subject
      subject = await resolveSubject(env, {
        branchId: branch.id,
        universityId: branch.university_id,
        semester: finalSemester,
        subjectName: body.subject_name,
        subjectCode: body.subject_code,
      });
    } else {
      // Use existing mapping or resolve existing subject
      subject = await env.DB.prepare("SELECT id, university_id, branch_id, semester, name, code, slug FROM subjects WHERE id = ?").bind(finalSubjectId).first();
    }

    if (!subject) {
      return new Response(JSON.stringify({ error: "Subject not found or could not be resolved" }), { status: 400 });
    }

    // Update document fields and status
    await env.DB.prepare(`
      UPDATE documents
      SET title = ?,
          branch_id = ?,
          semester = ?,
          subject_id = ?,
          uploaded_by = ?,
          author = COALESCE(?, author),
          approval_status = 'approved',
          approved_by = 'admin',
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      finalTitle,
      branch.id,
      finalSemester,
      subject.id,
      finalUploadedBy,
      body.author_name ?? null,
      materialId
    ).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
