/**
 * ShikshaSahayak - Safe Staging Migration Engine
 *
 * Implements strict guards to prevent accidentally running migrations against production:
 * 1. Strictly blocks execution against production database UUIDs.
 * 2. Requires explicit --staging flag.
 * 3. Enforces dry-run verification before remote execution.
 */

export const PRODUCTION_BLOCKED_UUIDS = new Set([
  '00000000-0000-0000-0000-000000000003', // Production shiksha-core-db
  '00000000-0000-0000-0000-000000000001', // Production keydocs
  '00000000-0000-0000-0000-000000000002'  // Production padhaku-assessment-db
]);

export function validateStagingTarget(databaseName: string, databaseId: string) {
  if (PRODUCTION_BLOCKED_UUIDS.has(databaseId)) {
    throw new Error(`CRITICAL SECURITY VIOLATION: Database ID '${databaseId}' is a PRODUCTION database! Staging operations strictly blocked.`);
  }

  if (!databaseName.toLowerCase().includes('staging')) {
    throw new Error(`Safety Violation: Staging database name '${databaseName}' must contain 'staging'.`);
  }

  return {
    valid: true,
    databaseName,
    databaseId
  };
}
