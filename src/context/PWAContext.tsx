import React, { createContext, useContext, useState, useEffect } from "react";
import { BeforeInstallPromptEvent, OfflineResourceItem } from "../types/pwa-offline";
import { registerPushSubscription, trackPWAInstallation } from "../api/pwaOfflineClient";

interface PWAContextType {
  isOnline: boolean;
  isStandalone: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  showInstallBanner: boolean;
  setShowInstallBanner: (show: boolean) => void;
  lowBandwidthMode: boolean;
  toggleLowBandwidthMode: () => void;
  triggerInstallPrompt: () => Promise<void>;
  offlineDownloads: OfflineResourceItem[];
  downloadResourceForOffline: (item: Omit<OfflineResourceItem, "downloadedAt">) => Promise<boolean>;
  deleteOfflineResource: (id: string) => Promise<boolean>;
  pushSubscribed: boolean;
  subscribeToPushNotifications: () => Promise<boolean>;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_LOW_BW = "padhaku_low_bandwidth_mode";
const LOCAL_STORAGE_KEY_DOWNLOADS = "padhaku_offline_downloads";
const LOCAL_STORAGE_KEY_BANNER_SEEN = "padhaku_pwa_banner_seen";

export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBannerState] = useState<boolean>(false);

  const setShowInstallBanner = (show: boolean) => {
    setShowInstallBannerState(show);
    if (!show) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_BANNER_SEEN, "true");
      } catch {}
    }
  };

  const [lowBandwidthMode, setLowBandwidthMode] = useState<boolean>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY_LOW_BW) === "true";
  });

  const [offlineDownloads, setOfflineDownloads] = useState<OfflineResourceItem[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_DOWNLOADS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [pushSubscribed, setPushSubscribed] = useState<boolean>(false);

  // Connection listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Standalone check
    const matchStandalone = window.matchMedia("(display-mode: standalone)");
    setIsStandalone(matchStandalone.matches || (navigator as unknown as { standalone?: boolean }).standalone || false);

    const handleStandaloneChange = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    matchStandalone.addEventListener("change", handleStandaloneChange);

    // Intercept beforeinstallprompt - show banner ONLY on first encounter
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      const alreadySeen = localStorage.getItem(LOCAL_STORAGE_KEY_BANNER_SEEN) === "true";
      if (!alreadySeen) {
        setShowInstallBannerState(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Service worker registration
    if ("serviceWorker" in navigator) {
      if (import.meta.env.DEV) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      } else {
        navigator.serviceWorker.register("/sw.js").then((reg) => {
          if (reg.pushManager) {
            reg.pushManager.getSubscription().then((sub) => {
              setPushSubscribed(!!sub);
            });
          }
        });
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      matchStandalone.removeEventListener("change", handleStandaloneChange);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const toggleLowBandwidthMode = () => {
    setLowBandwidthMode((prev) => {
      const next = !prev;
      localStorage.setItem(LOCAL_STORAGE_KEY_LOW_BW, String(next));
      return next;
    });
  };

  const triggerInstallPrompt = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      trackPWAInstallation(navigator.platform || "PWA");
      setShowInstallBanner(false);
      setInstallPrompt(null);
    }
  };

  const downloadResourceForOffline = async (item: Omit<OfflineResourceItem, "downloadedAt">): Promise<boolean> => {
    try {
      const fullItem: OfflineResourceItem = {
        ...item,
        downloadedAt: new Date().toISOString(),
      };

      const updated = [fullItem, ...offlineDownloads.filter((d) => d.id !== item.id)];
      setOfflineDownloads(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY_DOWNLOADS, JSON.stringify(updated));

      // Trigger service worker cache put if browser supports
      if ("caches" in window) {
        const cache = await caches.open("padhaku-materials-v1");
        await cache.add(`/materials/${item.id}`);
      }

      return true;
    } catch {
      return false;
    }
  };

  const deleteOfflineResource = async (id: string): Promise<boolean> => {
    const updated = offlineDownloads.filter((d) => d.id !== id);
    setOfflineDownloads(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY_DOWNLOADS, JSON.stringify(updated));
    return true;
  };

  const subscribeToPushNotifications = async (): Promise<boolean> => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // Optional VAPID key support can be added here
      });

      const ok = await registerPushSubscription(sub);
      if (ok) setPushSubscribed(true);
      return ok;
    } catch (err) {
      console.error("Push subscription failed:", err);
      return false;
    }
  };

  return (
    <PWAContext.Provider
      value={{
        isOnline,
        isStandalone,
        installPrompt,
        showInstallBanner,
        setShowInstallBanner,
        lowBandwidthMode,
        toggleLowBandwidthMode,
        triggerInstallPrompt,
        offlineDownloads,
        downloadResourceForOffline,
        deleteOfflineResource,
        pushSubscribed,
        subscribeToPushNotifications,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

export const usePWA = (): PWAContextType => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
};
