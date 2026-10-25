import React, { useState, useEffect } from "react";
import { Sparkles, Check, ShieldCheck, X } from "lucide-react";
import { SubscriptionPlanSpec, ProductPackSpec } from "../../types/monetization-platform";
import { fetchSubscriptionPlans, fetchProductPacks } from "../../api/monetizationPlatformClient";

interface FreemiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FreemiumUpgradeModal: React.FC<FreemiumUpgradeModalProps> = ({ isOpen, onClose }) => {
  const [plans, setPlans] = useState<SubscriptionPlanSpec[]>([]);
  const [packs, setPacks] = useState<ProductPackSpec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([fetchSubscriptionPlans(), fetchProductPacks()]).then(([pData, packData]) => {
      setPlans(pData);
      setPacks(packData);
      setLoading(false);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0F172A] border border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900 border border-slate-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center space-y-2">
          <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 uppercase tracking-widest inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> ShikshaSahayak Premium Experience
          </span>
          <h2 className="text-xl font-black text-white font-display">Supercharge Your GTU Exam Preparation</h2>
          <p className="text-xs text-slate-400 font-medium">Free core notes & PYQs will remain 100% free forever for all students.</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading Plans & Product Packs...</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.planId}
                  className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                    plan.priceInr > 0
                      ? "bg-gradient-to-b from-[#f97316]/10 to-slate-900 border-[#f97316]/40 shadow-lg shadow-orange-500/5"
                      : "bg-slate-900/60 border-slate-800"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-white font-display">{plan.name}</h3>
                      <span className="text-sm font-black text-white font-display">
                        {plan.priceInr === 0 ? "FREE" : `₹${plan.priceInr}/mo`}
                      </span>
                    </div>
                    <ul className="space-y-1.5 pt-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="text-[11px] font-medium text-slate-300 flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => alert(`Selected ${plan.name}`)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors shadow-md ${
                      plan.priceInr > 0
                        ? "bg-[#f97316] hover:bg-orange-600 text-white"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                    }`}
                  >
                    {plan.priceInr === 0 ? "Current Plan" : "Upgrade to Pro"}
                  </button>
                </div>
              ))}
            </div>

            {/* Product Packs */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Featured Exam & Placement Packs</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {packs.map((pack) => (
                  <div key={pack.packId} className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-white leading-snug">{pack.title}</h5>
                      <span className="text-[10px] text-slate-400 font-medium">{pack.items.length} High-Yield Exam Assets</span>
                    </div>
                    <span className="text-xs font-extrabold text-[#f97316] bg-[#f97316]/10 px-2.5 py-1 rounded-lg">
                      ₹{pack.priceInr}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
