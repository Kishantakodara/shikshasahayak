import { requireAdmin } from "../../../lib/auth";

export async function onRequestGet(context: any) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  try {
    const query = `SELECT * FROM announcements ORDER BY created_at DESC`;
    const { results } = await env.DB.prepare(query).all();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  try {
    const data = await request.json();
    const id = `ann_${crypto.randomUUID().split("-")[0]}`;

    if (!data.text) {
      return new Response(JSON.stringify({ error: "Text is required" }), { status: 400 });
    }

    const insertQuery = `
      INSERT INTO announcements (id, text, link)
      VALUES (?, ?, ?)
    `;

    await env.DB.prepare(insertQuery)
      .bind(id, data.text, data.link || null)
      .run();

    return new Response(JSON.stringify({ id, text: data.text, link: data.link }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
