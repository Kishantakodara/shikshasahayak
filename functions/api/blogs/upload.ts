import { jsonResponse, errorResponse, materialDownloadUrl } from "../../lib/json";

export async function onRequestPost(context: { request: Request, env: { MATERIALS_BUCKET: R2Bucket } }) {
  const { request, env } = context;

  if (!env.MATERIALS_BUCKET) {
    return errorResponse("Storage bucket not configured", 500);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return errorResponse("No file provided", 400);
    }

    const uuid = crypto.randomUUID().split("-")[0];
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storageKey = `blogs/${uuid}_${sanitizedFilename}`;

    await env.MATERIALS_BUCKET.put(storageKey, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: {
        source_table: "blogs",
        filename: file.name
      }
    });

    const fileUrl = materialDownloadUrl(storageKey, request.url);

    return jsonResponse({
      url: fileUrl,
      key: storageKey
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
