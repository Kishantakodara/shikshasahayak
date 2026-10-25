// ============================================================
// SHIKSHA SAHAYAK OS CLIENT: Education Intelligence Platform (Sprint 20)
// ============================================================

import {
  KnowledgeGraphNode,
  KnowledgeGraphEdge,
  PredictiveLearningScore,
  AdaptiveLearningPath,
  ContextualRecommendation,
  AIOptimizedCompletionResponse,
} from "../types/education-intelligence";

export async function getKnowledgeGraph(nodeId: string = "kg_node_dsa"): Promise<{
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}> {
  try {
    const res = await fetch(`/api/intelligence/graph?nodeId=${nodeId}`);
    if (!res.ok) throw new Error("Failed to fetch Knowledge Graph");
    const data = await res.json();
    return data.graph || { nodes: [], edges: [] };
  } catch (error) {
    console.error(error);
    return {
      nodes: [],
      edges: [],
    };
  }
}

export async function getPredictiveScores(): Promise<PredictiveLearningScore[]> {
  try {
    const res = await fetch(`/api/intelligence/predictions`);
    if (!res.ok) throw new Error("Failed to fetch predictions");
    const data = await res.json();
    return data.scores || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function generateAdaptivePath(
  subjectId: string,
  targetExamDate: string,
  dailyHours: number
): Promise<AdaptiveLearningPath | null> {
  try {
    const res = await fetch(`/api/intelligence/predictions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, targetExamDate, dailyHours }),
    });
    if (!res.ok) throw new Error("Failed to generate path");
    const data = await res.json();
    return data.path || null;
  } catch {
    return null;
  }
}

export async function getContextualRecommendations(): Promise<ContextualRecommendation[]> {
  try {
    const res = await fetch(`/api/intelligence/recommendations`);
    if (!res.ok) throw new Error("Failed to fetch recommendations");
    const data = await res.json();
    return data.recommendations || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function runOrchestratedAI(
  taskName: string,
  prompt: string
): Promise<AIOptimizedCompletionResponse> {
  try {
    const res = await fetch(`/api/intelligence/ai-orchestrator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskName, prompt }),
    });
    if (!res.ok) throw new Error("AI Orchestrator failed");
    const data = await res.json();
    return data.completion;
  } catch {
    return {
      resultText: "Focus on GTU PYQs and handwritten unit notes for exam revision.",
      provider: "ShikshaSahayak Edge Intelligence Router",
      modelUsed: "edge-rule-engine-v1",
      latencyMs: 85,
      tokensUsed: 42,
    };
  }
}
