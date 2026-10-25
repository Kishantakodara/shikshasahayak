// ============================================================
// SHIKSHA SAHAYAK OS API: /api/announcements
// Unified Public Announcements Endpoint (PADHAKU_CORE_DB / DB)
// ============================================================

interface Env {
  PADHAKU_CORE_DB?: D1Database;
  DB?: D1Database;
}

export async function onRequestGet(context: { env: Env }) {
  const { env } = context;
  const primaryDb = env.PADHAKU_CORE_DB;
  const fallbackDb = env.DB;

  if (!primaryDb && !fallbackDb) {
    return new Response(JSON.stringify({ error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const dbsToTry = [primaryDb, fallbackDb].filter(Boolean) as D1Database[];
  let allAnnouncements: any[] = [];

  for (const db of dbsToTry) {
    try {
      // 1. Try shiksha-core-db announcements schema (rich fields)
      try {
        const { results } = await db.prepare(
          `SELECT id, title, content, priority, target_audience, channels, attachments, is_published, created_at 
           FROM announcements 
           WHERE is_published = 1 OR is_published IS NULL 
           ORDER BY created_at DESC 
           LIMIT 15`
        ).all();

        if (results && results.length > 0) {
          const mapped = results.map((row: any) => ({
            id: row.id,
            title: row.title || row.content || "Academic Announcement",
            text: row.content || row.title || "Academic Announcement",
            content: row.content || row.title || "",
            link: row.attachments || null,
            priority: row.priority || "normal",
            createdAt: row.created_at || new Date().toISOString()
          }));
          allAnnouncements.push(...mapped);
          break; // Found records in primary database
        }
      } catch {
        // Table might have Keydocs schema (id, text, link, created_at)
        const { results } = await db.prepare(
          `SELECT id, text, link, created_at FROM announcements ORDER BY created_at DESC LIMIT 15`
        ).all();

        if (results && results.length > 0) {
          const mapped = results.map((row: any) => ({
            id: row.id,
            title: row.text || "Academic Announcement",
            text: row.text || "Academic Announcement",
            content: row.text || "",
            link: row.link || null,
            priority: "normal",
            createdAt: row.created_at || new Date().toISOString()
          }));
          allAnnouncements.push(...mapped);
          break;
        }
      }
    } catch (e) {
      console.warn("Could not query announcements from D1 instance:", e);
    }
  }

  // Deduplicate by ID
  const seenIds = new Set<string>();
  const uniqueAnnouncements = allAnnouncements.filter((a) => {
    if (seenIds.has(a.id)) return false;
    seenIds.add(a.id);
    return true;
  });

  return new Response(JSON.stringify(uniqueAnnouncements), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60, s-maxage=300"
    }
  });
}
