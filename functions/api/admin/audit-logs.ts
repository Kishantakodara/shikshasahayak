// ============================================================
// SHIKSHA SAHAYAK OS API: /api/admin/audit-logs
// Enterprise Administrative Security Audit Trail & Access Logs
// SECURITY: Requires Admin Role
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { recordAdminAuditLog } from "../../lib/adminPlatformService";
import { getAuthenticatedUser, isAdmin } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin access required", 403);
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.toLowerCase().trim() || "";
  const action = url.searchParams.get("action") || "all";
  const resourceType = url.searchParams.get("resourceType") || "all";
  const dateRange = url.searchParams.get("dateRange") || "all";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(Number(limitParam), 500) : 50;
  const offset = Number(url.searchParams.get("offset")) || 0;

  try {
    // Ensure table exists
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id TEXT PRIMARY KEY,
        admin_id TEXT NOT NULL,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        details TEXT,
        details_json TEXT,
        ip_address TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    let query = `
      SELECT id, admin_id, action, resource_type, resource_id, details_json, details, ip_address, created_at
      FROM admin_audit_logs
      WHERE 1=1
    `;
    const bindings: unknown[] = [];

    if (search) {
      query += ` AND (LOWER(admin_id) LIKE ? OR LOWER(action) LIKE ? OR LOWER(resource_type) LIKE ? OR LOWER(COALESCE(resource_id, '')) LIKE ? OR LOWER(COALESCE(details_json, '')) LIKE ?)`;
      const s = `%${search}%`;
      bindings.push(s, s, s, s, s);
    }

    if (action && action !== "all") {
      query += ` AND action = ?`;
      bindings.push(action);
    }

    if (resourceType && resourceType !== "all") {
      query += ` AND resource_type = ?`;
      bindings.push(resourceType);
    }

    if (dateRange === "today") {
      query += ` AND DATE(created_at) = DATE('now')`;
    } else if (dateRange === "week") {
      query += ` AND created_at >= DATETIME('now', '-7 days')`;
    } else if (dateRange === "month") {
      query += ` AND created_at >= DATETIME('now', '-30 days')`;
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    bindings.push(limit, offset);

    const { results } = await env.DB.prepare(query).bind(...bindings).all<Record<string, unknown>>();

    const logs = (results || []).map((row) => {
      let detailsObj: any = null;
      if (row.details_json) {
        try {
          detailsObj = JSON.parse(String(row.details_json));
        } catch {
          detailsObj = { raw: String(row.details_json) };
        }
      } else if (row.details) {
        try {
          detailsObj = JSON.parse(String(row.details));
        } catch {
          detailsObj = { raw: String(row.details) };
        }
      }

      return {
        id: String(row.id),
        adminId: String(row.admin_id),
        adminEmail: detailsObj?.actorEmail || (typeof row.admin_id === "string" && row.admin_id.includes("@") ? row.admin_id : undefined),
        action: String(row.action),
        resourceType: String(row.resource_type),
        resourceId: row.resource_id ? String(row.resource_id) : null,
        details: detailsObj,
        ipAddress: row.ip_address ? String(row.ip_address) : "127.0.0.1",
        createdAt: String(row.created_at || new Date().toISOString()),
      };
    });

    const totalCount = (await env.DB.prepare(`SELECT COUNT(*) as c FROM admin_audit_logs`).first<{ c: number }>())?.c || logs.length;
    const todayCount = (await env.DB.prepare(`SELECT COUNT(*) as c FROM admin_audit_logs WHERE DATE(created_at) = DATE('now')`).first<{ c: number }>())?.c || 0;

    return jsonResponse(
      {
        success: true,
        logs,
        total: totalCount,
        todayCount,
      },
      {
        headers: {
          ...corsHeaders,
          "Cache-Control": "private, no-cache",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized: Authentication required", 401);
  if (!isAdmin(user.email, user.role) && user.role !== "admin") {
    return errorResponse("Forbidden: Admin access required", 403);
  }

  try {
    const body = (await request.json()) as {
      action: string;
      resourceType: string;
      resourceId?: string;
      details?: Record<string, unknown>;
    };

    if (!body || !body.action || !body.resourceType) {
      return errorResponse("Missing required audit log fields", 400);
    }

    const success = await recordAdminAuditLog(
      env,
      user.uid,
      body.action,
      body.resourceType,
      body.resourceId,
      { ...body.details, actorEmail: user.email }
    );

    return jsonResponse({ success, action: body.action }, { headers: corsHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
