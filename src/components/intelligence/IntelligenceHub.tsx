import React, { useState, useEffect } from "react";
import { Brain, Cpu, Compass, Send } from "lucide-react";
import {
  getPredictiveScores,
  getContextualRecommendations,
  runOrchestratedAI,
} from "../../api/educationIntelligenceClient";
import { PredictiveLearningScore, ContextualRecommendation } from "../../types/education-intelligence";
import { KnowledgeGraphExplorer } from "./KnowledgeGraphExplorer";
import { PredictiveRiskWidget } from "./PredictiveRiskWidget";
import { AdaptivePathGenerator } from "./AdaptivePathGenerator";

export const IntelligenceHub: React.FC = () => {
  const [scores, setScores] = useState<PredictiveLearningScore[]>([]);
  const [recommendations, setRecommendations] = useState<ContextualRecommendation[]>([]);
  const [promptInput, setPromptInput] = useState("");
  const [aiResult, setAiResult] = useState<{ text: string; provider: string; model: string; latency: number } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    getPredictiveScores().then(setScores);
    getContextualRecommendations().then(setRecommendations);
  }, []);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    setAiLoading(true);
    const res = await runOrchestratedAI("GTU Concept Inquiry", promptInput);
    setAiResult({
      text: res.resultText,
      provider: res.provider,
      model: res.modelUsed,
      latency: res.latencyMs,
    });
    setAiLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-black text-foreground font-display flex items-center gap-2">
          <Brain className="h-6 w-6 text-[#f97316]" /> Education Intelligence Platform
        </h2>
        <p className="text-xs text-muted-foreground font-medium">
          Unified Knowledge Graph, Contextual Recommendations 2.0, Predictive Learning Analytics &amp; Provider-Agnostic AI Router.
        </p>
      </div>

      {/* Provider-Agnostic AI Prompt Bar */}
      <div className="bg-card border border-border rounded-3xl p-5 space-y-3">
        <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider flex items-center gap-2">
          <Cpu className="h-4 w-4 text-cyan-500" /> Multi-Model AI Orchestrator
        </h3>
        <form onSubmit={handleAskAI} className="flex gap-2">
          <input
            type="text"
            placeholder="Ask AI Orchestrator (e.g. Explain Binary Search Trees with GTU exam example)..."
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-background border border-border rounded-2xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#f97316]"
          />
          <button
            type="submit"
            disabled={aiLoading}
            className="px-4 py-2.5 bg-[#f97316] hover:bg-orange-600 text-white font-bold text-xs rounded-2xl shadow-md flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" /> {aiLoading ? "Routing..." : "Run AI"}
          </button>
        </form>

        {aiResult && (
          <div className="p-4 bg-muted/50 rounded-2xl border border-border space-y-2 text-xs animate-fade-in">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground border-b border-border pb-2">
              <span className="font-bold text-cyan-500">Provider: {aiResult.provider}</span>
              <span>Model: {aiResult.model} • {aiResult.latency}ms</span>
            </div>
            <p className="text-foreground leading-relaxed font-medium pt-1">{aiResult.text}</p>
          </div>
        )}
      </div>

      {/* Contextual Recommendations 2.0 */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-[#f97316]" />
            <h3 className="font-extrabold text-sm text-foreground font-display uppercase tracking-wider">
              Contextual Recommendations 2.0 ({recommendations.length})
            </h3>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-xs">
            <p>No personalized recommendations yet.</p>
            <p className="mt-1 text-[11px]">Complete practice sessions and study activities to generate learning insights.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 bg-muted/40 rounded-2xl border border-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md uppercase">
                    {rec.type}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500">{rec.relevanceScore}% Match</span>
                </div>
                <h4 className="font-bold text-foreground text-xs leading-snug">{rec.title}</h4>
                <p className="text-[11px] text-muted-foreground">{rec.description}</p>
                <span className="text-[9px] text-[#f97316] font-bold block pt-1">Why: {rec.reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid of Graph & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KnowledgeGraphExplorer />
        <div className="space-y-6">
          <PredictiveRiskWidget scores={scores} />
          <AdaptivePathGenerator />
        </div>
      </div>
    </div>
  );
};
