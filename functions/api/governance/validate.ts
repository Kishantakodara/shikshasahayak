// ============================================================
// SHIKSHA SAHAYAK OS API: /api/governance/validate
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { validateMandatoryMetadata, detectDuplicates, generateStandardDisplayName } from "../../lib/contentGovernance";
import { Env } from "../../lib/contentEngine";

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const payload = await request.json<Record<string, unknown>>();

    const validation = validateMandatoryMetadata({
      title: String(payload.title || ""),
      universityId: payload.universityId ? String(payload.universityId) : undefined,
      degreeId: payload.degreeId ? String(payload.degreeId) : undefined,
      branchId: payload.branchId ? String(payload.branchId) : undefined,
      semester: payload.semester !== undefined ? Number(payload.semester) : undefined,
      subjectId: payload.subjectId ? String(payload.subjectId) : undefined,
      resourceType: payload.resourceType ? String(payload.resourceType) : undefined,
      uploadedBy: payload.uploadedBy ? String(payload.uploadedBy) : undefined,
    });

    const duplicates = await detectDuplicates(
      env,
      payload.contentHash ? String(payload.contentHash) : undefined,
      payload.subjectId ? String(payload.subjectId) : undefined,
      payload.title ? String(payload.title) : undefined
    );

    const displayName = generateStandardDisplayName({
      subjectName: payload.subjectName ? String(payload.subjectName) : undefined,
      unitNo: payload.unitNo ? Number(payload.unitNo) : undefined,
      topicTitle: payload.topicTitle ? String(payload.topicTitle) : undefined,
      resourceTypeName: payload.resourceTypeName ? String(payload.resourceTypeName) : undefined,
      universityShortName: payload.universityShortName ? String(payload.universityShortName) : undefined,
      degreeShortName: payload.degreeShortName ? String(payload.degreeShortName) : undefined,
      branchShortName: payload.branchShortName ? String(payload.branchShortName) : undefined,
      semester: payload.semester ? Number(payload.semester) : undefined,
      rawTitle: payload.title ? String(payload.title) : undefined,
    });

    return jsonResponse({
      validation,
      duplicates,
      suggestedDisplayName: displayName,
      readyToPublish: validation.isValid && !duplicates.isDuplicate,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
