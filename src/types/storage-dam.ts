// ============================================================
// SHIKSHA SAHAYAK OS - ENTERPRISE STORAGE & DIGITAL ASSET MANAGEMENT TYPES
// ============================================================

/** Supported Storage Provider Identifiers */
export type StorageProviderType = 'cloudflare_r2' | 'local_dev' | 'aws_s3' | 'gcs';

/** Immutable Asset Storage Categories */
export type AssetCategory =
  | 'learning-resources'
  | 'question-papers'
  | 'books'
  | 'videos'
  | 'images'
  | 'assignments'
  | 'profile-images'
  | 'course-assets'
  | 'generated-assets'
  | 'temporary'
  | 'archive';

/** Asset Visibility Scopes */
export type AssetVisibility =
  | 'public'
  | 'authenticated'
  | 'branch_specific'
  | 'teacher_only'
  | 'admin_only'
  | 'private';

/** Immutable Asset Audit Log Actions */
export type AssetAuditAction =
  | 'upload'
  | 'replace'
  | 'delete'
  | 'restore'
  | 'download'
  | 'visibility_changed'
  | 'metadata_updated';

/** Digital Asset Entity Model */
export interface DigitalAssetModel {
  id: string;
  originalFilename: string;
  displayName: string;
  storageProvider: StorageProviderType;
  storageBucket: string;
  storageKey: string;
  contentType: string;
  extension: string;
  sizeBytes: number;
  checksumSha256?: string | null;
  widthPx?: number | null;
  heightPx?: number | null;
  durationSecs?: number | null;
  pagesCount?: number | null;
  thumbnailStorageKey?: string | null;
  previewStorageKey?: string | null;
  visibility: AssetVisibility;
  downloadCount: number;
  lastAccessedAt?: string | null;
  ownerId?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Asset Upload Registration Request */
export interface AssetUploadRequest {
  filename: string;
  category: AssetCategory;
  entityId: string;
  contentType: string;
  sizeBytes: number;
  version?: number;
  checksumSha256?: string;
  visibility?: AssetVisibility;
  uploadedBy?: string;
}

/** Asset Upload Registration Response */
export interface AssetUploadResponse {
  assetId: string;
  storageKey: string;
  uploadUrl?: string; // Direct put / signed upload URL if supported
  readyToUpload: boolean;
  isDuplicate: boolean;
  duplicateAssetId?: string | null;
}

/** Secure Signed Asset Download Link */
export interface AssetDownloadLink {
  assetId: string;
  downloadUrl: string;
  expiresAt: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

/** Storage Health & Capacity Diagnostics Report */
export interface StorageHealthReport {
  timestamp: string;
  storageProvider: StorageProviderType;
  totalAssetsCount: number;
  totalStorageSizeBytes: number;
  totalStorageSizeFormatted: string;
  orphanAssetsCount: number; // DB row missing binary or vice versa
  duplicateAssetsCount: number;
  bucketHealth: 'healthy' | 'degraded' | 'error';
}

/** Immutable Digital Asset Audit Log Entry */
export interface AssetAuditLog {
  id: string;
  assetId: string;
  action: AssetAuditAction;
  performedBy: string;
  details?: Record<string, unknown> | null;
  createdAt: string;
}

/**
 * Provider-Independent Storage Interface.
 * Business logic communicates ONLY with this interface, never directly with Cloudflare R2 or S3 SDKs.
 */
export interface IStorageProvider {
  providerType: StorageProviderType;
  getStorageKey(category: AssetCategory, entityId: string, version: number, filename: string): string;
  putObject(key: string, body: ArrayBuffer | ReadableStream, contentType: string): Promise<boolean>;
  getObject(key: string): Promise<{ body: ReadableStream | ArrayBuffer; contentType: string; size: number } | null>;
  deleteObject(key: string): Promise<boolean>;
  getPublicUrl(key: string): string;
}
