import React from "react";
import { Zap, ZapOff } from "lucide-react";
import { usePWA } from "../../context/PWAContext";

export const LowBandwidthToggle: React.FC = () => {
  const { lowBandwidthMode, toggleLowBandwidthMode } = usePWA();

  return (
    <button
      onClick={toggleLowBandwidthMode}
      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
        lowBandwidthMode
          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
      }`}
      title={lowBandwidthMode ? "Data Saver Mode Active" : "Enable Data Saver Mode"}
    >
      {lowBandwidthMode ? <ZapOff className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
      <span>{lowBandwidthMode ? "Data Saver ON" : "Data Saver"}</span>
    </button>
  );
};
