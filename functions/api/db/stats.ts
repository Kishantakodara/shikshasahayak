// ============================================================
// SHIKSHA SAHAYAK OS API: /api/db/stats
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getEnterpriseSchemaOverview } from "../../lib/enterpriseDb";
import { Env } from "../../lib/contentEngine";

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    const overview = await getEnterpriseSchemaOverview(env);
    const domainStats = overview.domains.map((d) => {
      const tablesInDomain = overview.tables.filter((t) => t.domain === d.name);
      const totalDomainRecords = tablesInDomain.reduce((sum, t) => sum + t.rowCount, 0);
      return {
        domainName: d.name,
        tablesCount: d.tables.length,
        totalRecords: totalDomainRecords,
        tables: tablesInDomain.map((t) => ({ name: t.tableName, count: t.rowCount })),
      };
    });

    return jsonResponse(
      {
        database: overview.databaseName,
        version: overview.version,
        totalTables: overview.totalTables,
        domainStats,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return errorResponse(message, 500);
  }
}
