// ============================================================
// SHIKSHA SAHAYAK OS API: /api/v1/spec
// ============================================================

import { getApiServiceCatalog, createSuccessEnvelope } from "../../lib/apiManager";

export async function onRequestGet() {
  const spec = getApiServiceCatalog();
  return createSuccessEnvelope(spec, "Master OpenAPI / JSON API specification retrieved");
}
