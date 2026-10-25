import { deleteDocumentAndFiles } from "../../../../lib/materialUpload";
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
      return new Response(JSON.stringify({ error: "Document ID is required" }), { status: 400 });
    }

    await deleteDocumentAndFiles(env, materialId);

    return new Response(JSON.stringify({ success: true }), {
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
