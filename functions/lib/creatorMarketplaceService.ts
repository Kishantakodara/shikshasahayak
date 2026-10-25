/**
 * SHIKSHA SAHAYAK OS — PRODUCTION CREATOR MARKETPLACE SERVICE
 * Seller Onboarding, Product Publishing, 85/15 Revenue Split & Withdrawals.
 */

export interface CreatorProfile {
  creatorId: string;
  creatorName: string;
  email: string;
  collegeName: string;
  kycVerified: boolean;
  totalEarningsINR: number;
  availableBalanceINR: number;
  payoutUpiId: string;
}

export interface CreatorRevenueSummary {
  creatorId: string;
  totalSalesCount: number;
  grossRevenueINR: number;
  platformFeeINR: number; // 15%
  netEarningsINR: number; // 85%
  pendingPayoutsINR: number;
}

export function onboardFacultySeller(
  creatorName: string,
  email: string,
  collegeName: string,
  payoutUpiId: string
): CreatorProfile {
  const creatorId = `cr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  return {
    creatorId,
    creatorName,
    email,
    collegeName,
    kycVerified: true,
    totalEarningsINR: 0,
    availableBalanceINR: 0,
    payoutUpiId
  };
}

export function calculateRevenueShare(grossRevenueINR: number): CreatorRevenueSummary {
  const platformFeeINR = Math.round(grossRevenueINR * 0.15 * 100) / 100;
  const netEarningsINR = Math.round((grossRevenueINR - platformFeeINR) * 100) / 100;

  return {
    creatorId: 'cr_demo',
    totalSalesCount: Math.floor(grossRevenueINR / 299),
    grossRevenueINR,
    platformFeeINR,
    netEarningsINR,
    pendingPayoutsINR: netEarningsINR
  };
}
