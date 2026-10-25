import React from "react";
import { WifiOff, Wifi } from "lucide-react";
import { usePWA } from "../../context/PWAContext";

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 bg-amber-500/90 text-slate-950 font-bold px-3.5 py-2 rounded-2xl shadow-xl backdrop-blur-md border border-amber-400 flex items-center gap-2 text-xs animate-bounce">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>You are Offline — Viewing Saved GTU Resources</span>
    </div>
  );
};
