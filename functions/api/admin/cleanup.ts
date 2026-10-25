import { deleteDocumentAndFiles } from "../../lib/materialUpload";
import { releaseFileAssetIfOrphaned } from "../../lib/fileAssets";
import { requireAdmin } from "../../lib/auth";
export async function onRequestPost(context: { request: Request; env: WorkerBindings }) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }
  const logs: string[] = [];
  let dbDeletedCount = 0;
  let r2DeletedCount = 0;

  try {
    const { results: dbFiles } = await env.DB.prepare(
      `SELECT df.document_id, df.storage_key, df.file_asset_id, d.title
       FROM document_files df
       JOIN documents d ON d.id = df.document_id
       WHERE df.storage_key IS NOT NULL`
    ).all<{ document_id: string; storage_key: string; file_asset_id: string | null; title: string }>();

    logs.push(`Found ${dbFiles?.length || 0} document files in database.`);

    const validStorageKeys = new Set<string>();
    const missingDocumentIds = new Set<string>();

    for (const file of dbFiles || []) {
      const storageKey = String(file.storage_key);
      const exists = await env.MATERIALS_BUCKET.head(storageKey);
      if (!exists) {
        logs.push(`Record "${file.title}" references missing file "${storageKey}". Cleaning up document.`);
        missingDocumentIds.add(String(file.document_id));
      } else {
        validStorageKeys.add(storageKey);
      }
    }

    for (const documentId of missingDocumentIds) {
      await deleteDocumentAndFiles(env, documentId);
      dbDeletedCount++;
    }

    const { results: assetRows } = await env.DB.prepare(
      "SELECT id, storage_key FROM file_assets"
    ).all<{ id: string; storage_key: string }>();

    for (const asset of assetRows || []) {
      validStorageKeys.add(asset.storage_key);
    }

    const orphanedAssetIds = new Set<string>();

    let truncated = true;
    let cursor: string | undefined = undefined;

    while (truncated) {
      const listResult: any = await env.MATERIALS_BUCKET.list({
        prefix: "storage/",
        cursor,
      });

      for (const obj of listResult.objects) {
        if (!validStorageKeys.has(obj.key)) {
          logs.push(`Orphaned physical file found in R2: "${obj.key}". Deleting from bucket.`);
          const deletePromise = env.MATERIALS_BUCKET.delete(obj.key).catch(() => undefined);
          const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 1000));
          await Promise.race([deletePromise, timeoutPromise]);
          r2DeletedCount++;

          const asset = (assetRows || []).find((row) => row.storage_key === obj.key);
          if (asset) orphanedAssetIds.add(asset.id);
        }
      }

      truncated = listResult.truncated;
      cursor = listResult.cursor;
    }

    for (const assetId of orphanedAssetIds) {
      await releaseFileAssetIfOrphaned(env, assetId);
    }

    return new Response(JSON.stringify({
      success: true,
      dbDeletedCount,
      r2DeletedCount,
      logs,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      logs,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
