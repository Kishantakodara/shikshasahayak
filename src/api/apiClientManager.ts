// ============================================================
// SHIKSHA SAHAYAK OS - FRONTEND API CLIENT MANAGER
// ============================================================

import {
  ApiResponseEnvelope,
  MasterApiSpecification,
  ServiceHealthStatus,
} from "../types/api-architecture";

/**
 * Standardized API client request wrapper enforcing uniform envelope unwrapping.
 */
export async function executeApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponseEnvelope<T>> {
  try {
    const headers = new Headers(options.headers || {});
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const body: ApiResponseEnvelope<T> = await response.json();

    if (!response.ok || !body.success) {
      console.warn(`[ApiClientManager] API Request warning (${response.status}):`, body.error?.message || body.message);
    }

    return body;
  } catch (error) {
    console.error("[ApiClientManager] Network or Parse Error:", error);
    return {
      success: false,
      statusCode: 500,
      message: error instanceof Error ? error.message : "Network failure",
      data: null,
      pagination: null,
      metadata: {
        requestId: `client_err_${Date.now()}`,
        version: "v1",
        timestamp: new Date().toISOString(),
      },
      error: {
        code: "CLIENT_NETWORK_ERROR",
        message: "Failed to connect to ShikshaSahayak OS API Gateway",
      },
    };
  }
}

/**
 * Fetches health status across all 22 API service modules.
 */
export async function fetchApiGatewayHealth(): Promise<{
  gatewayStatus: string;
  totalServices: number;
  operationalServices: number;
  serviceStatuses: ServiceHealthStatus[];
} | null> {
  const envelope = await executeApiRequest<{
    gatewayStatus: string;
    totalServices: number;
    operationalServices: number;
    serviceStatuses: ServiceHealthStatus[];
  }>("/api/v1/health");

  return envelope.success ? envelope.data : null;
}

/**
 * Fetches the master OpenAPI / JSON API specification.
 */
export async function fetchApiSpecification(): Promise<MasterApiSpecification | null> {
  const envelope = await executeApiRequest<MasterApiSpecification>("/api/v1/spec");
  return envelope.success ? envelope.data : null;
}
