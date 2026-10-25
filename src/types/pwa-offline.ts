// ============================================================
// SHIKSHA SAHAYAK OS TYPES: PWA & Offline Learning (Sprint 16)
// ============================================================

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface OfflineResourceItem {
  id: string;
  title: string;
  subject: string;
  type: "note" | "pyq" | "guide" | "pdf";
  blobUrl?: string;
  fileSizeBytes: number;
  downloadedAt: string;
}

export interface WebPushSubscriptionSpec {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceInfo?: string;
  categories?: string[];
}

export interface PWAPerformanceMetrics {
  isStandalone: boolean;
  isOffline: boolean;
  lowBandwidthMode: boolean;
  cachedResourceCount: number;
  totalCachedBytes: number;
}
