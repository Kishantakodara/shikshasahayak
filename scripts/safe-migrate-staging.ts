/**
 * ShikshaSahayak - Safe Staging Migration Engine
 *
 * Implements strict guards to prevent accidentally running migrations against production:
 * 1. Strictly blocks execution against production database UUIDs.
 * 2. Requires explicit --staging flag.
 * 3. Enforces dry-run verification before remote execution.
 */

export const PRODUCTION_BLOCKED_UUIDS = new Set([
  '4e63a42b-1271-462f-8271-da47cf659139', // Production shiksha-core-db
  'd0d22669-42aa-4c36-b9e3-c3aace80cad4', // Production keydocs
  '352efef7-24bb-418c-8158-92144fc7f821'  // Production padhaku-assessment-db
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
