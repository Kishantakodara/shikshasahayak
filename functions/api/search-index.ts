export async function onRequestGet(context: any) {
  const { env } = context;

  const databases: D1Database[] = [];
  if (env.PADHAKU_CORE_DB) databases.push(env.PADHAKU_CORE_DB);
  if (env.DB) databases.push(env.DB);

  if (databases.length === 0) {
    return new Response(JSON.stringify({ studyMaterials: [], pyqs: [], syllabuses: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  let studyMaterials: any[] = [];
  let pyqs: any[] = [];
  let syllabuses: any[] = [];

  for (const db of databases) {
    try {
      const smRes = await db.prepare(`
        SELECT 
          d.id, 
          d.title, 
          d.semester, 
          d.branch_id as departmentId, 
          COALESCE(d.author, d.uploaded_by, 'Admin') as author,
          s.name as subjectName,
          s.code as subjectCode
        FROM documents d
        LEFT JOIN subjects s ON d.subject_id = s.id
        WHERE (d.document_type = 'study-material' OR d.document_type = 'study_material') AND d.approval_status = 'approved'
        ORDER BY d.created_at DESC
        LIMIT 200
      `).all().catch(() => ({ results: [] }));

      const pyqRes = await db.prepare(`
        SELECT 
          d.id, 
          d.title, 
          d.semester, 
          d.branch_id as departmentId, 
          d.paper_year as year, 
          d.season as type,
          s.name as subjectName,
          s.code as subjectCode
        FROM documents d
        LEFT JOIN subjects s ON d.subject_id = s.id
        WHERE d.document_type = 'pyq' AND d.approval_status = 'approved'
        ORDER BY d.created_at DESC
        LIMIT 200
      `).all().catch(() => ({ results: [] }));

      const sylRes = await db.prepare(`
        SELECT 
          d.id, 
          d.title, 
          d.semester, 
          d.branch_id as departmentId,
          COALESCE(s.name, d.title) as subjectName,
          COALESCE(s.code, '') as subjectCode
        FROM documents d
        LEFT JOIN subjects s ON d.subject_id = s.id
        WHERE d.document_type = 'syllabus' AND d.approval_status = 'approved'
        ORDER BY d.created_at DESC
        LIMIT 200
      `).all().catch(() => ({ results: [] }));

      const sm = smRes.results || [];
      const pq = pyqRes.results || [];
      const sy = sylRes.results || [];

      if (sm.length > 0 || pq.length > 0 || sy.length > 0) {
        studyMaterials = sm;
        pyqs = pq;
        syllabuses = sy;
        break;
      }
    } catch {}
  }

  return new Response(
    JSON.stringify({
      studyMaterials,
      pyqs,
      syllabuses,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
