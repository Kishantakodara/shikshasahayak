// ============================================================
// SHIKSHA SAHAYAK OS CLIENT: Community & Distribution (Sprint 13)
// ============================================================

import { CommunityDiscussionSpec, StudentAmbassadorSpec } from "../types/community-distribution";

export async function fetchCommunityDiscussions(communityId: string): Promise<CommunityDiscussionSpec[]> {
  try {
    const res = await fetch(`/api/community/discussions?communityId=${encodeURIComponent(communityId)}`);
    if (!res.ok) throw new Error("Failed");
    return await res.json();
  } catch {
    return [
      {
        id: "d1",
        communityId,
        authorId: "u1",
        authorName: "Jayesh Shah (GTU Sem 5)",
        title: "DBMS Mid-Sem PYQs Discussion",
        content: "Anyone solved the Normalization 3NF question from Winter 2024 paper?",
        status: "approved",
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

export async function postDiscussion(communityId: string, title: string, content: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/community/discussions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ communityId, title, content }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchAmbassadorStats(): Promise<StudentAmbassadorSpec | null> {
  try {
    const res = await fetch(`/api/community/discussions?type=ambassador`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
