// ============================================================
// SHIKSHA SAHAYAK OS API: /api/security/headers
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getSecurityOverviewReport } from "../../lib/securityEngine";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    const report = await getSecurityOverviewReport(env);
    return jsonResponse(report.headers, {
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
        "Content-Security-Policy": report.headers.contentSecurityPolicy,
        "Strict-Transport-Security": report.headers.strictTransportSecurity,
        "X-Frame-Options": report.headers.xFrameOptions,
        "X-Content-Type-Options": report.headers.xContentTypeOptions,
        "Referrer-Policy": report.headers.referrerPolicy,
        "Permissions-Policy": report.headers.permissionsPolicy,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
