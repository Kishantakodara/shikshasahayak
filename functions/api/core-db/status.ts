/**
 * SHIKSHA SAHAYAK OS — CANONICAL CORE DATABASE STATUS & CONNECTIVITY ENDPOINT
 * Endpoint: /api/core-db/status
 */

interface Env {
  PADHAKU_CORE_DB?: D1Database;
  DB?: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.PADHAKU_CORE_DB || context.env.DB;

  if (!db) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'No database binding found (neither PADHAKU_CORE_DB nor DB is available)'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const startTime = Date.now();
    
    // Check ping
    const pingResult = await db.prepare('SELECT 1 as alive').first<{ alive: number }>();
    
    // Query table list from sqlite_master
    const { results: tables } = await db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name"
    ).all<{ name: string }>();

    const latencyMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        database: 'shiksha-core-db',
        connected: pingResult?.alive === 1,
        latencyMs,
        tableCount: tables.length,
        tables: tables.map(t => t.name)
      }, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        database: 'shiksha-core-db',
        connected: false,
        error: err?.message || 'Database query failure'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
