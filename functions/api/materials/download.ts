import { contentDispositionFilename } from "../../lib/fileAssets";
import { convertLegacyGtuUrl } from "../../lib/gtuPyqDiscoveryEngine";

export async function onRequestGet(context: {
  request: Request;
  env: {
    DB?: D1Database;
    MATERIALS_BUCKET: R2Bucket;
  };
}) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  const rawExternalUrl = url.searchParams.get("url");
  const customTitle = url.searchParams.get("title");

  // Support external URL proxy downloading for cross-origin PDFs
  if (rawExternalUrl) {
    try {
      const externalUrl = convertLegacyGtuUrl(rawExternalUrl);
      const parsed = new URL(externalUrl);
      // Validate protocol
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return new Response(JSON.stringify({ error: "Invalid URL protocol" }), { status: 400 });
      }

      // SSRF protection: reject private/local IP ranges & cloud metadata endpoints
      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1' ||
        hostname === '169.254.169.254' ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local')
      ) {
        return new Response(JSON.stringify({ error: "Forbidden remote host" }), { status: 403 });
      }

      const extRes = await fetch(externalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/pdf,*/*',
        },
      });
      if (!extRes.ok) {
        return new Response(JSON.stringify({ error: "Failed to fetch remote document" }), { status: 502 });
      }
      let filename = customTitle || "Document - By ShikshaSahayak.pdf";
      if (!filename.toLowerCase().includes("by padhaku portal")) {
        let base = filename.replace(/\.pdf$/i, "");
        filename = `${base} - By ShikshaSahayak.pdf`;
      }
      const headers = new Headers();
      headers.set("Content-Type", "application/pdf");
      headers.set("Content-Disposition", contentDispositionFilename(filename, false));
      return new Response(extRes.body, { status: 200, headers });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: "Failed to process remote URL" }), { status: 500 });
    }
  }

  if (!key) {
    return new Response(JSON.stringify({ error: "Missing key or url parameter" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const object = await env.MATERIALS_BUCKET.get(key);

    if (object === null) {
      return new Response(JSON.stringify({ error: "Object not found" }), { 
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    let downloadName = customTitle || (env.DB
      ? await env.DB.prepare(
          `SELECT COALESCE(df.original_filename, fa.original_filename) AS original_filename
           FROM document_files df
           LEFT JOIN file_assets fa ON fa.id = df.file_asset_id
           WHERE df.storage_key = ?
           LIMIT 1`
        )
          .bind(key)
          .first<{ original_filename: string | null }>()
          .then((row) => row?.original_filename || null)
          .catch(() => null)
      : null);

    if (!downloadName || downloadName === "null") {
      downloadName = key.split('/').pop() || "Study Material";
    }

    if (!downloadName.toLowerCase().includes("by padhaku portal")) {
      let base = downloadName.replace(/\.pdf$/i, "");
      downloadName = `${base} - By ShikshaSahayak.pdf`;
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    if (object.httpEtag) headers.set('etag', object.httpEtag);
    
    headers.set('Content-Type', 'application/pdf');
    headers.set("Content-Disposition", contentDispositionFilename(downloadName, false));

    return new Response(object.body, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    console.error("Download error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
