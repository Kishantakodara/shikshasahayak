// ============================================================
// SHIKSHA SAHAYAK OS API: /api/institution/portal
// Multi-tenant institution management, departments, library & accreditation
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import {
  fetchInstitutions,
  fetchInstitutionDepartments,
  fetchInstitutionalLibrary,
  addInstitutionalLibraryResource,
  fetchAccreditationRecords,
  fetchSaasSubscription,
} from "../../lib/institutionSaaSService";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const institutionId = url.searchParams.get("institutionId") || "inst_ldce";

  if (action === "departments") {
    const departments = await fetchInstitutionDepartments(env, institutionId);
    return jsonResponse({ success: true, departments });
  }

  if (action === "library") {
    const library = await fetchInstitutionalLibrary(env, institutionId);
    return jsonResponse({ success: true, library });
  }

  if (action === "accreditation") {
    const records = await fetchAccreditationRecords(env, institutionId);
    return jsonResponse({ success: true, records });
  }

  if (action === "subscription") {
    const subscription = await fetchSaasSubscription(env, institutionId);
    return jsonResponse({ success: true, subscription });
  }

  const institutions = await fetchInstitutions(env);
  return jsonResponse({ success: true, institutions });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const body = (await request.json()) as {
      action: "library";
      institutionId: string;
      title: string;
      resourceType: "lab_manual" | "research_paper" | "lecture_note" | "question_bank" | "policy";
      fileUrl: string;
      fileSizeBytes?: number;
      isPublic?: boolean;
    };

    if (body.action === "library" && body.institutionId && body.title && body.fileUrl) {
      const ok = await addInstitutionalLibraryResource(env, body.institutionId, {
        title: body.title,
        resourceType: body.resourceType || "lab_manual",
        fileUrl: body.fileUrl,
        fileSizeBytes: body.fileSizeBytes || 1048576,
        uploadedBy: user.uid,
        isPublic: body.isPublic !== false,
      });
      return jsonResponse({ success: ok });
    }

    return errorResponse("Invalid payload", 400);
  } catch {
    return errorResponse("Internal Server Error", 500);
  }
}
