import { requireAdmin } from "../../../lib/auth";

export async function onRequestDelete(context: any) {
  const { request, env, params } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  const id = params.id as string;

  if (!id) {
    return new Response(JSON.stringify({ error: "Announcement ID is required" }), { status: 400 });
  }

  try {
    await env.DB.prepare(`DELETE FROM announcements WHERE id = ?`).bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
