import { contentDispositionFilename } from "../../lib/fileAssets";

export async function onRequestGet(context: {
  request: Request;
  env: {
    DB?: D1Database;
    MATERIALS_BUCKET: R2Bucket;
  };
  params: {
    path?: string | string[];
  };
}) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  
  if (!env.MATERIALS_BUCKET) {
    return new Response("Storage bucket not configured", { status: 500 });
  }

  // params.path is an array for [[path]]
  const rawKey = Array.isArray(params.path) ? params.path.join("/") : params.path;

  if (!rawKey) {
    return new Response("Missing storage key", { status: 400 });
  }

  let storageKey = decodeURIComponent(rawKey);
  
  // Google Docs Viewer sometimes double-encodes URLs, turning %20 into %2520.
  if (storageKey.includes('%20')) {
    storageKey = storageKey.replace(/%20/g, ' ');
  }

  try {
    const object = await env.MATERIALS_BUCKET.get(storageKey);
    
    if (object === null) {
      return new Response("Object not found", { status: 404 });
    }

    const file = env.DB
      ? await env.DB.prepare(
          `SELECT df.document_id,
                  COALESCE(df.original_filename, fa.original_filename) AS original_filename,
                  fa.mime_type
           FROM document_files df
           LEFT JOIN file_assets fa ON fa.id = df.file_asset_id
           WHERE df.storage_key = ?
           LIMIT 1`
        )
          .bind(storageKey)
          .first<{ document_id: string; original_filename: string | null; mime_type: string | null }>()
          .catch(() => null)
      : null;

    if (file?.document_id && env.DB) {
      await env.DB.prepare(
        `UPDATE documents
         SET downloads = downloads + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
        .bind(file.document_id)
        .run()
        .catch(() => undefined);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");

    // Override generic content type to allow inline preview of common formats
    let contentType = headers.get("content-type");
    if (!contentType || contentType === "application/octet-stream" || contentType === "binary/octet-stream") {
      if (file?.mime_type && file.mime_type !== "application/octet-stream" && file.mime_type !== "binary/octet-stream") {
        headers.set("content-type", file.mime_type);
      } else {
        const ext = storageKey.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') {
          headers.set("content-type", "application/pdf");
        } else if (ext === 'png') {
          headers.set("content-type", "image/png");
        } else if (ext === 'jpg' || ext === 'jpeg') {
          headers.set("content-type", "image/jpeg");
        } else if (ext === 'webp') {
          headers.set("content-type", "image/webp");
        } else if (ext === 'svg') {
          headers.set("content-type", "image/svg+xml");
        } else if (ext === 'txt') {
          headers.set("content-type", "text/plain");
        }
      }
    }

    const isDownloadParam = url.searchParams.has("download") || url.searchParams.get("disposition") === "attachment";
    let downloadName =
      file?.original_filename ||
      (env.DB
        ? await env.DB.prepare("SELECT original_filename FROM file_assets WHERE storage_key = ? LIMIT 1")
            .bind(storageKey)
            .first<{ original_filename: string }>()
            .then((row) => row?.original_filename || null)
            .catch(() => null)
        : null) || storageKey.split('/').pop() || "Study Material";

    if (downloadName && !downloadName.toLowerCase().includes("by shikshasahayak") && !downloadName.toLowerCase().includes("by padhaku portal")) {
      let base = downloadName.replace(/\.pdf$/i, "").replace(/\s*-\s*by\s+(shikshasahayak|padhaku\s*portal)$/i, "");
      downloadName = `${base} - By ShikshaSahayak.pdf`;
    }

    if (isDownloadParam) {
      headers.set("Content-Disposition", contentDispositionFilename(downloadName, false));
    } else if (downloadName) {
      headers.set("Content-Disposition", contentDispositionFilename(downloadName, true));
    }
    
    return new Response(object.body, {
      headers,
    });
  } catch (err: any) {
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
