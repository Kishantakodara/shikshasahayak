// ============================================================
// SHIKSHA SAHAYAK OS TYPES: Community & Distribution (Sprint 13)
// ============================================================

export interface StudentCommunitySpec {
  id: string;
  branchSlug: string;
  collegeName?: string;
  memberCount: number;
  createdAt: string;
}

export interface CommunityDiscussionSpec {
  id: string;
  communityId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  status: "pending_moderation" | "approved" | "rejected";
  createdAt: string;
}

export interface StudentAmbassadorSpec {
  userId: string;
  collegeName: string;
  referralCode: string;
  studentReferralCount: number;
  createdAt: string;
}
