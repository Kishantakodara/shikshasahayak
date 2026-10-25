// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND STORAGE & DAM API CLIENT
// ============================================================

import {
  AssetUploadRequest,
  AssetUploadResponse,
  AssetDownloadLink,
  StorageHealthReport,
  AssetAuditLog,
} from "../types/storage-dam";

/**
 * Registers asset metadata and initializes upload workflow.
 */
export async function registerAssetForUpload(
  payload: AssetUploadRequest
): Promise<AssetUploadResponse | null> {
  try {
    const res = await fetch("/api/storage/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to register asset for upload (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in StorageDamClient.registerAssetForUpload:", error);
    return null;
  }
}

/**
 * Fetches asset download URL & metadata for an asset ID.
 */
export async function fetchAssetDownloadLink(
  assetId: string
): Promise<AssetDownloadLink | null> {
  try {
    const res = await fetch(`/api/storage/asset/${encodeURIComponent(assetId)}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch asset download link (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in StorageDamClient.fetchAssetDownloadLink:", error);
    return null;
  }
}

/**
 * Soft deletes a digital asset with audit trail logging.
 */
export async function softDeleteAsset(
  assetId: string,
  performedBy = "user"
): Promise<boolean> {
  try {
    const res = await fetch(`/api/storage/asset/${encodeURIComponent(assetId)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ performedBy }),
    });
    return res.ok;
  } catch (error) {
    console.error("Error in StorageDamClient.softDeleteAsset:", error);
    return false;
  }
}

/**
 * Fetches immutable audit trail logs for an asset ID.
 */
export async function fetchAssetAuditLogs(
  assetId: string
): Promise<AssetAuditLog[]> {
  try {
    const res = await fetch(`/api/storage/audit/${encodeURIComponent(assetId)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error in StorageDamClient.fetchAssetAuditLogs:", error);
    return [];
  }
}

/**
 * Fetches storage capacity and health diagnostics report.
 */
export async function fetchStorageHealthReport(): Promise<StorageHealthReport | null> {
  try {
    const res = await fetch("/api/storage/health");
    if (!res.ok) {
      throw new Error(`Failed to fetch storage health report (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error in StorageDamClient.fetchStorageHealthReport:", error);
    return null;
  }
}
