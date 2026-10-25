// ============================================================
// SHIKSHA SAHAYAK OS KEYDOCS 3.0: FILES & R2 ASSETS SERVICE
// File attachment and deduplicated R2 asset management
// ============================================================

import { AssetRecord, DocumentFileRecord, FileType } from "./types";

export async function getDocumentFiles(db: D1Database, documentId: string): Promise<DocumentFileRecord[]> {
  const { results } = await db.prepare(`
    SELECT df.id, df.document_id, df.file_type, df.is_primary, df.created_at,
           df.storage_key as df_storage_key, df.file_url as df_file_url, df.original_filename as df_original_filename,
           a.id as asset_id, a.content_hash, a.storage_key as asset_storage_key, a.original_filename as asset_original_filename,
           a.mime_type, a.size_bytes
    FROM document_files df
    LEFT JOIN assets a ON a.id = df.file_asset_id OR a.storage_key = df.storage_key
    WHERE df.document_id = ?
    ORDER BY df.is_primary DESC, df.created_at ASC
  `).bind(documentId).all<any>();

  if (!results) return [];

  return results.map(r => {
    const storageKey = r.asset_storage_key || r.df_storage_key || '';
    const fileUrl = r.df_file_url || (storageKey ? `/api/storage/${storageKey}` : '');
    const filename = r.asset_original_filename || r.df_original_filename || 'document-file.pdf';

    return {
      id: r.id,
      document_id: r.document_id,
      asset_id: r.asset_id || r.id,
      file_type: r.file_type as FileType,
      is_primary: Number(r.is_primary || 0),
      created_at: r.created_at,
      original_filename: filename,
      storage_key: storageKey,
      file_url: fileUrl,
      mime_type: r.mime_type || 'application/pdf',
      size_bytes: Number(r.size_bytes || 0),
    };
  });
}

export async function attachFileToDocument(
  db: D1Database,
  data: {
    document_id: string;
    file_type: FileType;
    storage_key: string;
    file_url: string;
    original_filename: string;
    mime_type?: string;
    size_bytes?: number;
    content_hash?: string;
    is_primary?: boolean;
  }
): Promise<DocumentFileRecord> {
  const contentHash = data.content_hash || `hash_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Ensure Asset exists in assets table
  await db.prepare(`
    INSERT INTO assets (id, content_hash, storage_key, original_filename, mime_type, size_bytes)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(content_hash) DO UPDATE SET
      storage_key = excluded.storage_key,
      original_filename = excluded.original_filename
  `).bind(assetId, contentHash, data.storage_key, data.original_filename, data.mime_type || 'application/pdf', data.size_bytes || 0).run();

  const asset = await db.prepare(`SELECT * FROM assets WHERE content_hash = ? OR storage_key = ?`).bind(contentHash, data.storage_key).first<any>();
  const activeAssetId = asset ? asset.id : assetId;

  // 2. Clear primary flag if new file is primary
  const isPrimaryInt = data.is_primary ? 1 : 0;
  if (isPrimaryInt === 1) {
    await db.prepare(`UPDATE document_files SET is_primary = 0 WHERE document_id = ?`).bind(data.document_id).run();
  }

  // 3. Insert into document_files
  const docFileId = `df_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await db.prepare(`
    INSERT INTO document_files (id, document_id, file_type, file_asset_id, original_filename, storage_key, file_url, mime_type, size_bytes, is_primary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    docFileId,
    data.document_id,
    data.file_type,
    activeAssetId,
    data.original_filename,
    data.storage_key,
    data.file_url,
    data.mime_type || 'application/pdf',
    data.size_bytes || 0,
    isPrimaryInt
  ).run();

  return {
    id: docFileId,
    document_id: data.document_id,
    asset_id: activeAssetId,
    file_type: data.file_type,
    is_primary: isPrimaryInt,
    created_at: new Date().toISOString(),
    original_filename: data.original_filename,
    storage_key: data.storage_key,
    file_url: data.file_url,
    mime_type: data.mime_type || 'application/pdf',
    size_bytes: data.size_bytes || 0,
  };
}

export async function removeFileFromDocument(db: D1Database, documentFileId: string): Promise<boolean> {
  await db.prepare(`DELETE FROM document_files WHERE id = ?`).bind(documentFileId).run();
  return true;
}
