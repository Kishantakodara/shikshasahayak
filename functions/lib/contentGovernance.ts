// ============================================================
// SHIKSHA SAHAYAK OS - CONTENT LIFECYCLE & GOVERNANCE EDGE SERVICE
// ============================================================

import {
  ContentGovernanceItem,
  ContentAuditLog,
  LifecycleState,
  MetadataValidationResult,
  DuplicateCheckResult,
  ContentHealthReport,
  AuditAction,
  OwnerType,
  ContentSource,
  QualityLevel,
} from "../../src/types/content-governance";
import { Env } from "./contentEngine";

/**
 * Generates a consistent, human-readable display name from metadata attributes.
 * Example output: "Operating Systems - Unit 3 - Deadlock Notes - GTU B.Tech CSE Semester 5"
 */
export function generateStandardDisplayName(params: {
  subjectName?: string;
  unitNo?: number;
  topicTitle?: string;
  resourceTypeName?: string;
  universityShortName?: string;
  degreeShortName?: string;
  branchShortName?: string;
  semester?: number;
  rawTitle?: string;
}): string {
  const subject = params.subjectName || "Subject";
  const unit = params.unitNo ? `Unit ${params.unitNo}` : "";
  const topic = params.topicTitle || "";
  const type = params.resourceTypeName || "Study Resource";
  const univ = params.universityShortName || "GTU";
  const degree = params.degreeShortName || "B.Tech";
  const branch = params.branchShortName || "CSE";
  const sem = params.semester ? `Semester ${params.semester}` : "";

  const parts = [subject];
  if (unit) parts.push(unit);
  if (topic) parts.push(topic);
  parts.push(type);
  const contextStr = [univ, degree, branch, sem].filter(Boolean).join(" ");
  if (contextStr) parts.push(`- ${contextStr}`);

  return parts.filter(Boolean).join(" - ");
}

/**
 * Validates mandatory metadata before publishing.
 */
export function validateMandatoryMetadata(params: {
  title?: string;
  universityId?: string;
  degreeId?: string;
  branchId?: string;
  semester?: number;
  subjectId?: string;
  resourceType?: string;
  language?: string;
  visibility?: string;
  version?: string;
  uploadedBy?: string;
}): MetadataValidationResult {
  const missingFields: string[] = [];

  if (!params.title || !params.title.trim()) missingFields.push("title");
  if (!params.universityId) missingFields.push("universityId");
  if (!params.branchId) missingFields.push("branchId");
  if (params.semester === undefined || params.semester === null) missingFields.push("semester");
  if (!params.subjectId) missingFields.push("subjectId");
  if (!params.resourceType) missingFields.push("resourceType");

  const warnings: string[] = [];
  if (!params.degreeId) warnings.push("degreeId not specified");
  if (!params.uploadedBy) warnings.push("uploadedBy tracking missing");

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings,
    errors: missingFields.map((f) => `Mandatory metadata field missing: ${f}`),
  };
}

/**
 * Fetches governance item details for a document.
 */
export async function getContentGovernance(
  env: Env,
  documentId: string
): Promise<ContentGovernanceItem | null> {
  try {
    const row = await env.DB.prepare(
      `SELECT
         gm.document_id,
         gm.lifecycle_state,
         gm.owner_type,
         gm.owner_id,
         gm.content_source,
         gm.quality_level,
         gm.curriculum_year,
         gm.effective_from,
         gm.effective_until,
         gm.display_name,
         gm.license,
         gm.copyright_holder,
         gm.attribution_notes,
         gm.is_soft_deleted,
         gm.soft_deleted_at,
         gm.soft_deleted_by,
         gm.created_at,
         gm.updated_at,
         d.title AS doc_title
       FROM content_governance_map gm
       JOIN documents d ON d.id = gm.document_id
       WHERE gm.document_id = ?
       LIMIT 1`
    )
      .bind(documentId)
      .first<Record<string, unknown>>();

    if (!row) {
      // Fallback default governance record
      return {
        documentId,
        lifecycleState: "published",
        ownerType: "platform_admin",
        ownerId: null,
        contentSource: "official_gtu",
        qualityLevel: "official",
        curriculumYear: null,
        effectiveFrom: null,
        effectiveUntil: null,
        displayName: "Document Resource",
        license: "CC-BY-NC-SA",
        copyrightHolder: null,
        attributionNotes: null,
        isSoftDeleted: false,
        softDeletedAt: null,
        softDeletedBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      documentId: String(row.document_id),
      lifecycleState: String(row.lifecycle_state) as LifecycleState,
      ownerType: String(row.owner_type) as OwnerType,
      ownerId: row.owner_id ? String(row.owner_id) : null,
      contentSource: String(row.content_source) as ContentSource,
      qualityLevel: String(row.quality_level) as QualityLevel,
      curriculumYear: row.curriculum_year ? Number(row.curriculum_year) : null,
      effectiveFrom: row.effective_from ? String(row.effective_from) : null,
      effectiveUntil: row.effective_until ? String(row.effective_until) : null,
      displayName: String(row.display_name || row.doc_title || "Document"),
      license: String(row.license || "CC-BY-NC-SA"),
      copyrightHolder: row.copyright_holder ? String(row.copyright_holder) : null,
      attributionNotes: row.attribution_notes ? String(row.attribution_notes) : null,
      isSoftDeleted: Boolean(row.is_soft_deleted),
      softDeletedAt: row.soft_deleted_at ? String(row.soft_deleted_at) : null,
      softDeletedBy: row.soft_deleted_by ? String(row.soft_deleted_by) : null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  } catch (error) {
    console.error("Error in getContentGovernance:", error);
    return null;
  }
}

/**
 * Transitions lifecycle state and logs immutable audit trail.
 */
export async function transitionLifecycleState(
  env: Env,
  documentId: string,
  newState: LifecycleState,
  performedBy: string,
  details?: Record<string, unknown>
): Promise<boolean> {
  try {
    const currentGov = await getContentGovernance(env, documentId);
    const prevState = currentGov?.lifecycleState || "published";

    // Upsert governance state
    await env.DB.prepare(
      `INSERT INTO content_governance_map (
         document_id, lifecycle_state, display_name, updated_at
       ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(document_id) DO UPDATE SET
         lifecycle_state = excluded.lifecycle_state,
         updated_at = CURRENT_TIMESTAMP`
    )
      .bind(documentId, newState, currentGov?.displayName || "Document")
      .run();

    // Map audit action
    let action: AuditAction = "updated";
    if (newState === "published") action = "published";
    else if (newState === "archived") action = "archived";
    else if (newState === "soft_deleted") action = "soft_deleted";
    else if (newState === "restored") action = "restored";
    else if (newState === "submitted_for_review") action = "submitted";
    else if (newState === "approved") action = "approved";

    // Record immutable audit log
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await env.DB.prepare(
      `INSERT INTO content_audit_logs (
         id, document_id, action, performed_by, previous_state, new_state, details, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
      .bind(auditId, documentId, action, performedBy, prevState, newState, details ? JSON.stringify(details) : null)
      .run();

    return true;
  } catch (error) {
    console.error("Error in transitionLifecycleState:", error);
    return false;
  }
}

/**
 * Detects duplicate documents based on content hash, title, and subject matching.
 */
export async function detectDuplicates(
  env: Env,
  contentHash?: string,
  subjectId?: string,
  title?: string
): Promise<DuplicateCheckResult> {
  try {
    if (contentHash) {
      // Check file asset hash uniqueness
      const assetRow = await env.DB.prepare(
        `SELECT id, original_filename FROM file_assets WHERE content_hash = ? LIMIT 1`
      )
        .bind(contentHash)
        .first<Record<string, unknown>>();

      if (assetRow) {
        return {
          isDuplicate: true,
          matchScore: 1.0,
          reason: `Exact identical binary file content exists (${assetRow.original_filename})`,
        };
      }
    }

    if (subjectId && title) {
      // Check title similarity within same subject
      const dupDoc = await env.DB.prepare(
        `SELECT id, title FROM documents WHERE subject_id = ? AND title LIKE ? LIMIT 1`
      )
        .bind(subjectId, `%${title.trim()}%`)
        .first<Record<string, unknown>>();

      if (dupDoc) {
        return {
          isDuplicate: true,
          duplicateDocumentId: String(dupDoc.id),
          duplicateTitle: String(dupDoc.title),
          matchScore: 0.85,
          reason: `Very similar title found in the same subject (${dupDoc.title})`,
        };
      }
    }

    return {
      isDuplicate: false,
      matchScore: 0.0,
    };
  } catch (error) {
    console.error("Error in detectDuplicates:", error);
    return { isDuplicate: false, matchScore: 0.0 };
  }
}

/**
 * Generates an administrative Content Health Monitoring report.
 */
export async function generateContentHealthReport(env: Env): Promise<ContentHealthReport> {
  try {
    const totalRow = await env.DB.prepare(`SELECT COUNT(*) AS c FROM documents`).first<{ c: number }>();
    const total = totalRow?.c || 0;

    const pubRow = await env.DB.prepare(
      `SELECT COUNT(*) AS c FROM documents WHERE approval_status = 'approved'`
    ).first<{ c: number }>();
    const publishedCount = pubRow?.c || 0;

    const draftRow = await env.DB.prepare(
      `SELECT COUNT(*) AS c FROM documents WHERE approval_status = 'pending'`
    ).first<{ c: number }>();
    const draftCount = draftRow?.c || 0;

    // Orphan resources without subject
    const orphanRow = await env.DB.prepare(
      `SELECT COUNT(*) AS c FROM documents WHERE subject_id IS NULL OR subject_id = ''`
    ).first<{ c: number }>();
    const orphanCount = orphanRow?.c || 0;

    const healthScore = total > 0 ? Number((((total - orphanCount) / total) * 100).toFixed(1)) : 100.0;

    return {
      timestamp: new Date().toISOString(),
      totalResources: total,
      publishedCount,
      draftCount,
      archivedCount: 0,
      softDeletedCount: 0,
      deprecatedCount: 0,
      orphanResourcesCount: orphanCount,
      missingMetadataCount: 0,
      duplicateCandidatesCount: 0,
      brokenRelationshipsCount: 0,
      healthScore,
    };
  } catch (error) {
    console.error("Error generating content health report:", error);
    return {
      timestamp: new Date().toISOString(),
      totalResources: 0,
      publishedCount: 0,
      draftCount: 0,
      archivedCount: 0,
      softDeletedCount: 0,
      deprecatedCount: 0,
      orphanResourcesCount: 0,
      missingMetadataCount: 0,
      duplicateCandidatesCount: 0,
      brokenRelationshipsCount: 0,
      healthScore: 100.0,
    };
  }
}

/**
 * Fetches immutable audit trail logs for a document.
 */
export async function getAuditLogs(env: Env, documentId: string): Promise<ContentAuditLog[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, document_id, action, performed_by, previous_state, new_state, details, created_at
       FROM content_audit_logs
       WHERE document_id = ?
       ORDER BY created_at DESC`
    )
      .bind(documentId)
      .all<Record<string, unknown>>();

    return (results || []).map((row) => ({
      id: String(row.id),
      documentId: String(row.document_id),
      action: String(row.action) as AuditAction,
      performedBy: String(row.performed_by),
      previousState: row.previous_state ? String(row.previous_state) : null,
      newState: row.new_state ? String(row.new_state) : null,
      details: row.details ? JSON.parse(String(row.details)) : null,
      createdAt: String(row.created_at),
    }));
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
}
