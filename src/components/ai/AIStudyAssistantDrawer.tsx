// ============================================================
// SHIKSHA SAHAYAK OS - AI STUDY ASSISTANT DRAWER COMPONENT
// ============================================================

import React, { useState } from "react";
import { AIExplanationResult } from "../../types/ai-intelligence";
import { fetchAIStudyExplanation } from "../../api/aiIntelligenceClient";
import { Sparkles, Bot, ArrowRight, X, BookOpen, CheckCircle } from "lucide-react";

interface AIStudyAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  defaultSubjectId?: string;
}

export const AIStudyAssistantDrawer: React.FC<AIStudyAssistantDrawerProps> = ({
  isOpen,
  onClose,
  userId = "guest_student",
  defaultSubjectId = "os",
}) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIExplanationResult | null>(null);

  if (!isOpen) return null;

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    const res = await fetchAIStudyExplanation(userId, query, defaultSubjectId);
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0B132B] text-white border-l border-slate-700/60 shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-300">
      <div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FF6B35]/10 border border-[#FF6B35]/20 rounded-xl text-[#FF6B35]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Study Assistant</h3>
              <p className="text-[11px] text-slate-400">Free conceptual tutor & exam guide</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAsk} className="space-y-3 mb-6">
          <label className="block text-xs font-medium text-slate-300">Ask any concept or PYQ question:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. What is Semaphore in Operating System?"
              className="flex-1 bg-[#1C2541] border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#FF6B35]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-[#FF6B35] hover:bg-[#e05a2b] text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </form>

        {result && (
          <div className="bg-[#1C2541]/70 border border-slate-700/60 rounded-2xl p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <h4 className="text-sm font-bold text-[#FF6B35]">{result.title}</h4>
            <p className="text-xs text-slate-200 leading-relaxed">{result.explanation}</p>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Key Takeaways</span>
              <ul className="space-y-1.5">
                {result.keyTakeaways.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
        Powered by ShikshaSahayak OS Free-First Intelligence Architecture
      </div>
    </div>
  );
};
