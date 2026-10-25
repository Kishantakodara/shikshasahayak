// ============================================================
// SHIKSHA SAHAYAK OS - ENGINEERING DECISION RECORDS (EDR) TYPES
// ============================================================

/** EDR Decision Lifecycle Statuses */
export type EdrStatus = 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'DEPRECATED' | 'SUPERSEDED';

/** Single Engineering Decision Record Payload */
export interface EdrRecordSpec {
  id: string;
  edrCode: string;
  title: string;
  status: EdrStatus;
  authors: string;
  relatedDocs?: string | null;
  context: string;
  decision: string;
  benefits: string;
  tradeoffs: string;
  risks: string;
  reviewDate: string;
  createdAt: string;
  updatedAt: string;
  alternatives?: EdrAlternativeSpec[];
}

/** EDR Alternative Analysis Record */
export interface EdrAlternativeSpec {
  id: string;
  edrCode: string;
  alternativeName: string;
  advantages: string;
  disadvantages: string;
  rejectionReason: string;
  createdAt: string;
}

/** EDR Catalog Query Filter Parameters */
export interface EdrQueryFilter {
  status?: EdrStatus;
  searchQuery?: string;
}

/** EDR Governance & System Health Report */
export interface EdrHealthReport {
  timestamp: string;
  totalEdrsCount: number;
  acceptedCount: number;
  proposedCount: number;
  deprecatedCount: number;
  overdueReviewsCount: number;
  healthScore: number; // 0.0 to 100.0%
}
