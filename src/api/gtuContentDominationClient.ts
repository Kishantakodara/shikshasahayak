// ============================================================
// SHIKSHA SAHAYAK OS CLIENT: GTU Content Domination Engine (Sprint 11)
// ============================================================

import { GTUAcademicTaxonomyNode, GTUContentDominationSummary } from "../types/gtu-content-domination";

export async function fetchGTUTaxonomyTree(branchSlug: string, semester: number): Promise<GTUAcademicTaxonomyNode[]> {
  try {
    const res = await fetch(`/api/content/domination?branch=${encodeURIComponent(branchSlug)}&semester=${semester}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchGTUContentSummary(): Promise<GTUContentDominationSummary> {
  try {
    const res = await fetch(`/api/content/domination`);
    if (!res.ok) throw new Error("Failed");
    return await res.json();
  } catch {
    return {
      totalBranches: 6,
      totalSubjects: 48,
      totalTopics: 320,
      totalPYQs: 1250,
      averageQualityScore: 4.85,
    };
  }
}

export async function submitResourceRating(resourceId: string, rating: number, feedbackText?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/content/domination`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId, rating, feedbackText }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
