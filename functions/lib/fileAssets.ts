import { materialDownloadUrl } from "./json";

export type UploadEnv = {
  DB: D1Database;
  MATERIALS_BUCKET: R2Bucket;
};

export type FileAssetRow = {
  id: string;
  content_hash: string;
  original_filename: string;
  storage_key: string;
  mime_type: string | null;
  size_bytes: number | null;
};

export async function computeSha256(file: File): Promise<{ hash: string; buffer: ArrayBuffer }> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return { hash, buffer };
}

export function fileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex <= 0) return "";
  return filename.slice(dotIndex).toLowerCase();
}

export function buildBlobStorageKey(contentHash: string, originalFilename: string, extension: string): string {
  let baseName = originalFilename;
  if (baseName.toLowerCase().endsWith(extension.toLowerCase()) && extension.length > 0) {
    baseName = baseName.slice(0, -extension.length);
  }
  
  const safeName = baseName.replace(/[^a-zA-Z0-9-]/g, "_").replace(/_{2,}/g, "_").replace(/^_|_$/g, "") || "file";
  const shortName = safeName.slice(0, 60);
  
  const safeExtension = extension.replace(/[^a-z0-9.]/g, "") || ".bin";
  return `storage/blobs/${shortName}_${contentHash}${safeExtension}`;
}

export async function findFileAssetByHash(
  env: Pick<UploadEnv, "DB">,
  contentHash: string
): Promise<FileAssetRow | null> {
  return env.DB.prepare(
    `SELECT id, content_hash, original_filename, storage_key, mime_type, size_bytes
     FROM file_assets
     WHERE content_hash = ?
     LIMIT 1`
  )
    .bind(contentHash)
    .first<FileAssetRow>();
}

export async function getFileAssetRefCount(
  env: Pick<UploadEnv, "DB">,
  fileAssetId: string
): Promise<number> {
  const row = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM document_files WHERE file_asset_id = ?"
  )
    .bind(fileAssetId)
    .first<{ count: number }>();
  return row?.count || 0;
}

export async function releaseFileAssetIfOrphaned(
  env: UploadEnv,
  fileAssetId: string | null | undefined
): Promise<void> {
  if (!fileAssetId) return;

  const refCount = await getFileAssetRefCount(env, fileAssetId);
  if (refCount > 0) return;

  const asset = await env.DB.prepare(
    "SELECT storage_key FROM file_assets WHERE id = ? LIMIT 1"
  )
    .bind(fileAssetId)
    .first<{ storage_key: string }>();

  if (asset?.storage_key && env.MATERIALS_BUCKET) {
    const deletePromise = env.MATERIALS_BUCKET.delete(asset.storage_key).catch(() => undefined);
    const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 1000));
    await Promise.race([deletePromise, timeoutPromise]);
  }

  await env.DB.prepare("DELETE FROM file_assets WHERE id = ?").bind(fileAssetId).run();
}

export function getMimeTypeFromExtension(extension: string): string | null {
  const ext = extension.toLowerCase();
  switch (ext) {
    case '.pdf': return 'application/pdf';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.svg': return 'image/svg+xml';
    case '.txt': return 'text/plain';
    case '.doc': return 'application/msword';
    case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.ppt': return 'application/vnd.ms-powerpoint';
    case '.pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case '.xls': return 'application/vnd.ms-excel';
    case '.xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default: return null;
  }
}

export async function getOrCreateFileAsset(input: {
  env: UploadEnv;
  file: File;
  requestUrl: string;
}): Promise<{ asset: FileAssetRow; created: boolean }> {
  const { hash, buffer } = await computeSha256(input.file);
  const existing = await findFileAssetByHash(input.env, hash);
  if (existing) {
    return { asset: existing, created: false };
  }

  const originalFilename = input.file.name.trim() || "download.bin";
  const extension = fileExtension(originalFilename) || ".bin";
  const storageKey = buildBlobStorageKey(hash, originalFilename, extension);
  const assetId = `asset_${crypto.randomUUID().split("-")[0]}`;
  
  let mimeType = input.file.type || "";
  if (!mimeType || mimeType === "application/octet-stream" || mimeType === "binary/octet-stream") {
    mimeType = getMimeTypeFromExtension(extension) || "application/octet-stream";
  }
  const sizeBytes = input.file.size || buffer.byteLength;

  await input.env.MATERIALS_BUCKET.put(storageKey, buffer, {
    httpMetadata: { contentType: mimeType },
    customMetadata: {
      content_hash: hash,
      original_filename: originalFilename,
    },
  });

  try {
    await input.env.DB.prepare(
      `INSERT INTO file_assets
         (id, content_hash, original_filename, storage_key, mime_type, size_bytes)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(assetId, hash, originalFilename, storageKey, mimeType, sizeBytes)
      .run();
  } catch (error) {
    if (input.env.MATERIALS_BUCKET) {
      const deletePromise = input.env.MATERIALS_BUCKET.delete(storageKey).catch(() => undefined);
      const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 1000));
      await Promise.race([deletePromise, timeoutPromise]);
    }
    const raced = await findFileAssetByHash(input.env, hash);
    if (raced) return { asset: raced, created: false };
    throw error;
  }

  const asset = await findFileAssetByHash(input.env, hash);
  if (!asset) throw new Error("Failed to create file asset");
  return { asset, created: true };
}

export function fileAssetDownloadUrl(asset: Pick<FileAssetRow, "storage_key">, requestUrl: string): string {
  return materialDownloadUrl(asset.storage_key, requestUrl);
}

export function contentDispositionFilename(filename: string, inline: boolean = true): string {
  const safe = filename.replace(/[\r\n"]/g, "_").trim() || "download";
  const encoded = encodeURIComponent(safe);
  const disposition = inline ? 'inline' : 'attachment';
  return `${disposition}; filename="${safe}"; filename*=UTF-8''${encoded}`;
}
