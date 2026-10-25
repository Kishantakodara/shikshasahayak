import { approvalStatus, deleteDocumentAndFiles, normalizeExamSession } from "../../../lib/materialUpload";
import { requireAdminOrTeacher } from "../../../lib/auth";

export async function onRequestGet(context: any) {
  const { request, env, params } = context;

  const { errorResponse: authError } = await requireAdminOrTeacher(request, env);
  if (authError) {
    return authError;
  }

  const id = params.id as string;

  if (!id) {
    return new Response(JSON.stringify({ error: "Document ID is required" }), { status: 400 });
  }

  try {
    const doc = await env.DB.prepare(
      `SELECT
        d.id,
        d.document_type,
        d.title,
        d.description,
        d.approval_status,
        d.uploaded_by,
        d.created_at,
        d.updated_at,
        b.id AS branch_id,
        b.name AS branch_name,
        b.slug AS branch_slug,
        s.id AS subject_id,
        s.name AS subject_name,
        s.code AS subject_code,
        s.slug AS subject_slug,
        s.semester AS semester_no,
        f.file_url AS url,
        f.original_filename,
        d.paper_year AS exam_year,
        d.season AS exam_session,
        d.exam_label,
        d.syllabus_year,
        d.regulation,
        d.version_label,
        d.material_kind,
        d.unit_no,
        d.chapter,
        d.topic,
        d.author,
        blog.id AS blog_id,
        blog.title AS blog_title,
        blog.content AS blog_content,
        blog.status AS blog_status
      FROM documents d
      LEFT JOIN branches b ON b.id = d.branch_id
      LEFT JOIN subjects s ON s.id = d.subject_id
      LEFT JOIN document_files f ON f.document_id = d.id AND f.is_primary = 1
      LEFT JOIN blogs blog ON blog.id = d.blog_id OR blog.related_document_id = d.id
      WHERE d.id = ?
      LIMIT 1`
    )
      .bind(id)
      .first();

    if (!doc) {
      return new Response(JSON.stringify({ error: "Document not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(doc), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestDelete(context: any) {
  const { request, env, params } = context;

  const { errorResponse: authError } = await requireAdminOrTeacher(request, env);
  if (authError) {
    return authError;
  }

  const id = params.id as string;

  if (!id) {
    return new Response(JSON.stringify({ error: "Document ID is required" }), { status: 400 });
  }

  try {
    const doc: any = await env.DB.prepare("SELECT subject_id FROM documents WHERE id = ?").bind(id).first();
    const deleted = await deleteDocumentAndFiles(env, id);
    if (!deleted) {
      return new Response(JSON.stringify({ error: "Document not found" }), { status: 404 });
    }

    if (doc?.subject_id) {
      const remaining: any = await env.DB.prepare("SELECT COUNT(id) as count FROM documents WHERE subject_id = ?").bind(doc.subject_id).first();
      if (remaining && remaining.count === 0) {
        await env.DB.prepare("DELETE FROM subjects WHERE id = ?").bind(doc.subject_id).run();
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestPut(context: any) {
  const { env, params, request } = context;

  const { errorResponse: authError } = await requireAdminOrTeacher(request, env);
  if (authError) {
    return authError;
  }

  const id = params.id as string;

  if (!id) {
    return new Response(JSON.stringify({ error: "Document ID is required" }), { status: 400 });
  }

  try {
    const data = await request.json();

    const doc: any = await env.DB.prepare(
      `SELECT d.document_type, d.blog_id, d.branch_id, d.subject_id, s.semester, s.name as subject_name 
       FROM documents d LEFT JOIN subjects s ON s.id = d.subject_id WHERE d.id = ?`
    ).bind(id).first();

    if (!doc) {
      return new Response(JSON.stringify({ error: "Document not found" }), { status: 404 });
    }

    let branchIds = data.branch_ids || [];
    let semesters = data.semesters || [];
    let groupIds = data.group_ids || [id];

    if (groupIds.length === 0) groupIds = [id];

    const groupPlaceholders = groupIds.map(() => '?').join(',');

    const existingDocs: any[] = await env.DB.prepare(
      `SELECT d.id, d.branch_id, d.university_id, d.subject_id, s.semester, s.name as subject_name, s.code as subject_code, s.slug as subject_slug 
       FROM documents d LEFT JOIN subjects s ON s.id = d.subject_id 
       WHERE d.id IN (${groupPlaceholders})`
    ).bind(...groupIds).all().then((res: any) => res.results || []);

    const existingCombos = existingDocs.map(d => `${d.branch_id}::${d.semester}`);
    const requestedCombos: string[] = [];
    for (const b of branchIds) {
      for (const s of semesters) {
        requestedCombos.push(`${b}::${s}`);
      }
    }

    const toDelete = existingDocs.filter(d => !requestedCombos.includes(`${d.branch_id}::${d.semester}`));
    const toCreate = requestedCombos.filter(c => !existingCombos.includes(c));

    const newDocIds: string[] = [];
    const templateDoc = existingDocs.find(d => !toDelete.includes(d)) || existingDocs[0];
    if (templateDoc && toCreate.length > 0) {
      for (const combo of toCreate) {
        const [bId, semStr] = combo.split('::');
        const sem = parseInt(semStr, 10);

        let subjectRow: any = await env.DB.prepare(
          "SELECT id FROM subjects WHERE branch_id = ? AND semester = ? AND name = ?"
        ).bind(bId, sem, templateDoc.subject_name).first();
        
        if (!subjectRow) {
           const newSubjectId = `sub_${templateDoc.subject_slug}_${sem}_${crypto.randomUUID().split("-")[0]}`;
           await env.DB.prepare(
             "INSERT INTO subjects (id, university_id, branch_id, semester, name, code, slug) VALUES (?, ?, ?, ?, ?, ?, ?)"
           ).bind(newSubjectId, templateDoc.university_id, bId, sem, templateDoc.subject_name, templateDoc.subject_code, templateDoc.subject_slug).run();
           subjectRow = { id: newSubjectId };
        }

        const effectiveTitle = data.title || templateDoc.title || "material";
        const safeTitle = effectiveTitle
          .replace(/[^a-zA-Z0-9]/g, "_")
          .replace(/_{2,}/g, "_")
          .replace(/^_|_$/g, "")
          .toLowerCase()
          .slice(0, 30);
        const newDocId = `doc_${safeTitle}_${crypto.randomUUID().split("-")[0]}`;
        newDocIds.push(newDocId);
        
        await env.DB.prepare(`
          INSERT INTO documents (
            id, document_type, university_id, branch_id, semester, subject_id,
            title, description, approval_status, uploaded_by, approved_by,
            approved_at, blog_id, parent_document_id, created_at, updated_at,
            paper_year, season, exam_label, syllabus_year, regulation, version_label,
            material_kind, unit_no, chapter, topic, author, views, likes, downloads
          )
          SELECT 
            ?, document_type, university_id, ?, ?, ?,
            COALESCE(?, title), COALESCE(?, description), COALESCE(?, approval_status), uploaded_by, approved_by,
            approved_at, blog_id, parent_document_id, created_at, CURRENT_TIMESTAMP,
            paper_year, season, exam_label, syllabus_year, regulation, version_label,
            material_kind, unit_no, chapter, topic, author, views, likes, downloads
          FROM documents WHERE id = ?
        `).bind(newDocId, bId, sem, subjectRow.id, data.title ?? null, data.description ?? null, data.approval_status ?? null, templateDoc.id).run();

        await env.DB.prepare(`
          INSERT INTO document_files (
            id, document_id, file_type, file_asset_id, original_filename,
            storage_key, file_url, mime_type, size_bytes, is_primary, created_at
          )
          SELECT
            'file_' || substr(hex(randomblob(4)), 1, 8), ?, file_type, file_asset_id, original_filename,
            storage_key, file_url, mime_type, size_bytes, is_primary, created_at
          FROM document_files WHERE document_id = ?
        `).bind(newDocId, templateDoc.id).run();
      }
    }

    for (const d of toDelete) {
      await deleteDocumentAndFiles(env, d.id);
    }

    const deletedSubjectIds = [...new Set(toDelete.map(d => d.subject_id))];
    for (const sid of deletedSubjectIds) {
      const remaining: any = await env.DB.prepare("SELECT COUNT(id) as count FROM documents WHERE subject_id = ?").bind(sid).first();
      if (remaining && remaining.count === 0) {
        await env.DB.prepare("DELETE FROM subjects WHERE id = ?").bind(sid).run();
      }
    }

    const remainingGroupIds = existingDocs.filter(d => !toDelete.includes(d)).map(d => d.id);
    const validGroupIds = [...remainingGroupIds, ...newDocIds];

    if (doc.blog_id && validGroupIds.length > 0) {
      await env.DB.prepare("UPDATE blogs SET related_document_id = ? WHERE id = ?")
        .bind(validGroupIds[0], doc.blog_id)
        .run();
    }

    if (remainingGroupIds.length > 0) {
      const rawSeason = data.exam_session ?? data.season ?? null;
      const pyqSeason = rawSeason ? normalizeExamSession(String(rawSeason)) : null;
      const pyqYear = data.exam_year ?? data.paper_year ?? null;
      const pyqExamLabel = data.exam_label ?? (pyqSeason && pyqYear ? `${pyqSeason === "W" ? "Winter" : "Summer"} ${pyqYear}` : null);
      const normalizedStatus = data.approval_status ? approvalStatus(String(data.approval_status)) : null;

      const remainingPlaceholders = remainingGroupIds.map(() => '?').join(',');
      await env.DB.prepare(
        `UPDATE documents
         SET title = COALESCE(?, title),
             description = COALESCE(?, description),
             approval_status = COALESCE(?, approval_status),
             paper_year = COALESCE(?, paper_year),
             season = COALESCE(?, season),
             exam_label = COALESCE(?, exam_label),
             syllabus_year = COALESCE(?, syllabus_year),
             regulation = COALESCE(?, regulation),
             version_label = COALESCE(?, version_label),
             material_kind = COALESCE(?, material_kind),
             unit_no = COALESCE(?, unit_no),
             chapter = COALESCE(?, chapter),
             topic = COALESCE(?, topic),
             author = COALESCE(?, author),
             updated_at = CURRENT_TIMESTAMP
         WHERE id IN (${remainingPlaceholders})`
      ).bind(
        data.title ?? null,
        data.description ?? null,
        normalizedStatus,
        pyqYear,
        pyqSeason,
        pyqExamLabel,
        data.syllabus_year ?? null,
        data.regulation ?? null,
        data.version_label ?? null,
        data.material_kind ?? null,
        data.unit_no !== undefined ? data.unit_no : null,
        data.chapter ?? null,
        data.topic ?? null,
        data.author ?? null,
        ...remainingGroupIds
      ).run();
    }

    if (data.blog) {
      const { action, title: blogTitle, content: blogContent, status: blogStatus, category: blogCategory } = data.blog;

      if (action === "create") {
        const newBlogId = `blog_${crypto.randomUUID().split("-")[0]}`;
        
        await env.DB.prepare(
          `INSERT INTO blogs (id, related_document_id, title, content, author, category, tags, thumbnail, status, views)
           VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, 0)`
        ).bind(newBlogId, id, blogTitle || data.title || "Study Guide", blogContent || "", data.uploaded_by || "Admin", blogCategory || (doc.document_type === "pyq" ? "PYQ Analysis" : doc.document_type === "syllabus" ? "Syllabus" : "Study Guides"), blogStatus || "draft").run();

        if (validGroupIds.length > 0) {
           const validPlaceholders = validGroupIds.map(() => '?').join(',');
           await env.DB.prepare(`UPDATE documents SET blog_id = ? WHERE id IN (${validPlaceholders})`)
             .bind(newBlogId, ...validGroupIds).run();
           
           await env.DB.prepare(`UPDATE blogs SET related_document_id = ? WHERE id = ?`)
             .bind(validGroupIds[0], newBlogId).run();
        }

      } else if (action === "update") {
        let linkedBlogId = doc.blog_id;
        if (!linkedBlogId) {
          const checkBlog: any = await env.DB.prepare("SELECT id FROM blogs WHERE related_document_id = ?").bind(id).first();
          linkedBlogId = checkBlog?.id;
        }

        if (linkedBlogId) {
          await env.DB.prepare(
            `UPDATE blogs
             SET title = COALESCE(?, title),
                 content = COALESCE(?, content),
                 status = COALESCE(?, status),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          ).bind(blogTitle ?? null, blogContent ?? null, blogStatus ?? null, linkedBlogId).run();
        }

      } else if (action === "remove") {
        if (doc.blog_id) {
          await env.DB.prepare("DELETE FROM blogs WHERE id = ?").bind(doc.blog_id).run();
        } else {
          await env.DB.prepare("DELETE FROM blogs WHERE related_document_id = ?").bind(id).run();
        }
        if (validGroupIds.length > 0) {
           const validPlaceholders = validGroupIds.map(() => '?').join(',');
           await env.DB.prepare(`UPDATE documents SET blog_id = NULL WHERE id IN (${validPlaceholders})`)
             .bind(...validGroupIds).run();
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
