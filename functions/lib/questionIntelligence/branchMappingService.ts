// ============================================================
// QUESTION INTELLIGENCE ENGINE - BRANCH MAPPING SERVICE
// Manages 1-to-many relationships between a single master question
// and N applicable engineering branches without duplicating data.
// ============================================================

import { Env } from '../contentEngine';
import { CanonicalBranchInfo, normalizeBranchName, CANONICAL_BRANCHES } from '../branchNormalization';

export interface BranchMappingResult {
  mappedCount: number;
  mappedBranchIds: string[];
}

/**
  Normalizes a raw branch string or branch ID into its canonical database branch ID.
 */
export function resolveCanonicalBranchId(branchInput: string): string {
  if (!branchInput) return branchInput;
  const normalized = normalizeBranchName(branchInput);
  if (normalized) return normalized.id;
  return branchInput;
}

/**
  Maps a single master question to a specific branch ID in question_branch_mappings.
 */
export async function mapQuestionToBranch(
  env: Env,
  questionId: string,
  branchInput: string
): Promise<boolean> {
  try {
    const resolvedId = resolveCanonicalBranchId(branchInput);
    const mappingId = `qbm_${crypto.randomUUID().slice(0, 12)}`;

    await env.DB.prepare(
      `INSERT OR IGNORE INTO question_branch_mappings (id, question_id, branch_id)
       VALUES (?, ?, ?)`
    )
      .bind(mappingId, questionId, resolvedId)
      .run();

    return true;
  } catch (error) {
    console.error('Error in mapQuestionToBranch:', error);
    return false;
  }
}

/**
  Maps a single master question to multiple branch IDs in question_branch_mappings.
 */
export async function mapQuestionToBranches(
  env: Env,
  questionId: string,
  branchInputs: string[]
): Promise<BranchMappingResult> {
  if (!Array.isArray(branchInputs) || branchInputs.length === 0) {
    return { mappedCount: 0, mappedBranchIds: [] };
  }

  const mappedIds: string[] = [];
  try {
    for (const bInput of branchInputs) {
      const resolvedId = resolveCanonicalBranchId(bInput);
      const mappingId = `qbm_${crypto.randomUUID().slice(0, 12)}`;

      const { success } = await env.DB.prepare(
        `INSERT OR IGNORE INTO question_branch_mappings (id, question_id, branch_id)
         VALUES (?, ?, ?)`
      )
        .bind(mappingId, questionId, resolvedId)
        .run();

      if (success && !mappedIds.includes(resolvedId)) {
        mappedIds.push(resolvedId);
      }
    }

    return {
      mappedCount: mappedIds.length,
      mappedBranchIds: mappedIds,
    };
  } catch (error) {
    console.error('Error in mapQuestionToBranches:', error);
    return { mappedCount: mappedIds.length, mappedBranchIds: mappedIds };
  }
}

/**
  Unmaps a question from a specific branch ID.
 */
export async function unmapQuestionFromBranch(
  env: Env,
  questionId: string,
  branchInput: string
): Promise<boolean> {
  try {
    const resolvedId = resolveCanonicalBranchId(branchInput);
    await env.DB.prepare(
      `DELETE FROM question_branch_mappings WHERE question_id = ? AND branch_id = ?`
    )
      .bind(questionId, resolvedId)
      .run();

    return true;
  } catch (error) {
    console.error('Error in unmapQuestionFromBranch:', error);
    return false;
  }
}

/**
  Fetches all mapped branches for a specific master question ID.
 */
export async function getQuestionBranches(
  env: Env,
  questionId: string
): Promise<CanonicalBranchInfo[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT qbm.branch_id, b.slug, b.name, b.short_name, b.code
       FROM question_branch_mappings qbm
       LEFT JOIN branches b ON qbm.branch_id = b.id
       WHERE qbm.question_id = ?`
    )
      .bind(questionId)
      .all<Record<string, unknown>>();

    if (!results || results.length === 0) return [];

    return results.map(row => {
      const bId = String(row.branch_id);
      
      // Match against CANONICAL_BRANCHES dictionary or build from D1 row
      const known = Object.values(CANONICAL_BRANCHES).find(cb => cb.id === bId || cb.slug === String(row.slug));
      if (known) return known;

      return {
        id: bId,
        slug: String(row.slug || bId),
        name: String(row.name || bId),
        shortName: String(row.short_name || bId),
        code: row.code ? String(row.code) : undefined,
      };
    });
  } catch (error) {
    console.error('Error in getQuestionBranches:', error);
    return [];
  }
}
