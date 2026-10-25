// ============================================================
// SHIKSHA SAHAYAK OS TYPES: Monetization System (Sprint 14)
// ============================================================

export interface SubscriptionPlanSpec {
  planId: string;
  name: string;
  priceInr: number;
  features: string[];
}

export interface UserEntitlementSpec {
  userId: string;
  planId: string;
  status: "active" | "expired";
  expiresAt: string;
}

export interface ProductPackSpec {
  packId: string;
  title: string;
  category: "exam_pack" | "placement_pack" | "gate_pack";
  priceInr: number;
  items: string[];
}

export interface InstitutionalB2BContractSpec {
  collegeId: string;
  contractName: string;
  maxStudents: number;
  analyticsEnabled: boolean;
  expiresAt: string;
}
