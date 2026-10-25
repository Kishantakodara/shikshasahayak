import React from "react";
import { Download, Trash2, HardDrive, FileText, CheckCircle2 } from "lucide-react";
import { usePWA } from "../../context/PWAContext";

export const SmartDownloadManager: React.FC = () => {
  const { offlineDownloads, deleteOfflineResource } = usePWA();

  const totalBytes = offlineDownloads.reduce((sum, d) => sum + (d.fileSizeBytes || 2500000), 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-[#f97316]" />
          <h3 className="font-extrabold text-sm text-white font-display uppercase tracking-wider">
            Smart Offline Downloads
          </h3>
        </div>
        <span className="text-[11px] font-bold text-slate-400">
          {offlineDownloads.length} Resources ({totalMb} MB)
        </span>
      </div>

      {offlineDownloads.length === 0 ? (
        <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800 text-center space-y-1">
          <p className="text-xs text-slate-400 font-medium">No GTU notes downloaded for offline study yet.</p>
          <p className="text-[10px] text-slate-500">Tap "Save Offline" on any study material or PYQ paper.</p>
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          {offlineDownloads.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white leading-snug">{item.title}</h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {item.subject} • Saved {new Date(item.downloadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Offline Ready
                </span>
                <button
                  onClick={() => deleteOfflineResource(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                  title="Remove from offline cache"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
