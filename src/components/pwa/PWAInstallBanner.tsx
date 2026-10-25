import React, { useState } from "react";
import { Download, X, Smartphone, Sparkles } from "lucide-react";
import { usePWA } from "../../context/PWAContext";

export const PWAInstallBanner: React.FC = () => {
  const { isStandalone, installPrompt, showInstallBanner, setShowInstallBanner, triggerInstallPrompt } = usePWA();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  if (isStandalone || !showInstallBanner) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;

  return (
    <>
      {/* Floating PWA Install Banner (Positioned cleanly below top floating navbar) */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-xl bg-gradient-to-r from-[#f97316] to-orange-600 text-white p-3 sm:py-2.5 sm:px-4 rounded-2xl shadow-2xl border border-orange-400/40 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-xs">
            <Smartphone className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-xs leading-tight truncate">Install ShikshaSahayak App</p>
            <p className="text-[11px] text-orange-100 font-medium truncate">Offline GTU notes & instant access</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {installPrompt ? (
            <button
              onClick={triggerInstallPrompt}
              className="bg-white text-[#f97316] px-3 py-1.5 rounded-xl text-xs font-black hover:bg-orange-50 shadow-md flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Install
            </button>
          ) : isIOS ? (
            <button
              onClick={() => setShowIOSInstructions(true)}
              className="bg-white text-[#f97316] px-3 py-1.5 rounded-xl text-xs font-black hover:bg-orange-50 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> How to Install
            </button>
          ) : null}

          <button
            onClick={() => setShowInstallBanner(false)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white cursor-pointer"
            aria-label="Close install banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* iOS Installation Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0F172A] border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative space-y-4 text-center">
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900 border border-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#f97316]/10 text-[#f97316] flex items-center justify-center mx-auto">
              <Sparkles className="h-6 w-6" />
            </div>

            <h3 className="text-base font-black text-white font-display">Install ShikshaSahayak on iOS</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              To install ShikshaSahayak on your iPhone or iPad:
            </p>

            <ol className="text-left text-xs font-medium text-slate-300 space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#f97316]">1.</span> Tap the <strong>Share</strong> button in your Safari browser bar.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#f97316]">2.</span> Scroll down and tap <strong>"Add to Home Screen"</strong>.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#f97316]">3.</span> Tap <strong>Add</strong> in the top right corner.
              </li>
            </ol>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-2 bg-[#f97316] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
