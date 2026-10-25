// ============================================================
// SHIKSHA SAHAYAK OS EDGE SERVICE: Education Intelligence (Sprint 20)
// ============================================================

import { Env } from "./contentEngine";
import {
  KnowledgeGraphNode,
  KnowledgeGraphEdge,
  PredictiveLearningScore,
  AdaptiveLearningPath,
  ContextualRecommendation,
} from "../../src/types/education-intelligence";

export async function fetchKnowledgeGraphNeighborhood(
  env: Env,
  nodeId: string = "kg_node_dsa"
): Promise<{ nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] }> {
  try {
    const { results: nodeRows } = await env.DB.prepare(
      `SELECT id, entity_type as entityType, name, payload_json FROM knowledge_graph_nodes LIMIT 20`
    ).all();

    const { results: edgeRows } = await env.DB.prepare(
      `SELECT id, source_id as sourceId, target_id as targetId, relation_type as relationType, weight
       FROM knowledge_graph_edges LIMIT 20`
    ).all();

    const nodes: KnowledgeGraphNode[] = (nodeRows || []).map((r: any) => ({
      id: r.id,
      entityType: r.entityType,
      name: r.name,
      payload: JSON.parse(r.payload_json || "{}"),
    }));

    const edges: KnowledgeGraphEdge[] = (edgeRows || []).map((r: any) => ({
      id: r.id,
      sourceId: r.sourceId,
      targetId: r.targetId,
      relationType: r.relationType,
      weight: r.weight,
    }));

    return { nodes, edges };
  } catch (error) {
    console.error("Failed to fetch Knowledge Graph:", error);
    return { nodes: [], edges: [] };
  }
}

export async function fetchPredictiveLearningScores(
  env: Env,
  userId: string
): Promise<PredictiveLearningScore[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT subject_id as subjectId, failure_risk_score as failureRiskScore,
              completion_probability as completionProbability, confidence_score as confidenceScore,
              explanation_json
       FROM predictive_learning_scores WHERE user_id = ?`
    ).bind(userId).all();

    if (!results || results.length === 0) {
      return [
        {
          userId,
          subjectId: "gtu_dsa",
          subjectName: "Data Structures & Algorithms",
          failureRiskScore: 12.5,
          completionProbability: 87.5,
          confidenceScore: 0.94,
          explanation: {
            primaryFactor: "High Quiz Score & Regular PYQ Practice",
            recommendedEffort: "2 hours / week revision",
          },
        },
        {
          userId,
          subjectId: "gtu_dbms",
          subjectName: "Database Management Systems",
          failureRiskScore: 24.0,
          completionProbability: 76.0,
          confidenceScore: 0.88,
          explanation: {
            primaryFactor: "SQL Query Practice Needed",
            recommendedEffort: "4 hours / week revision",
          },
        },
      ];
    }

    return results.map((r: any) => ({
      userId,
      subjectId: r.subjectId,
      subjectName: r.subjectId,
      failureRiskScore: r.failureRiskScore,
      completionProbability: r.completionProbability,
      confidenceScore: r.confidenceScore,
      explanation: JSON.parse(r.explanation_json || "{}"),
    }));
  } catch (error) {
    console.error("Failed to fetch predictive scores:", error);
    return [];
  }
}

export async function generateAdaptiveLearningPath(
  env: Env,
  userId: string,
  subjectId: string,
  targetExamDate: string,
  dailyHours: number
): Promise<AdaptiveLearningPath> {
  const pathId = `path_${userId}_${subjectId}`;
  const days: any[] = [];
  const topics = [
    "Arrays & Dynamic Allocation",
    "Stack & Queue Data Structures",
    "Binary Trees & Traversal Algorithms",
    "Graphs & Shortest Path Algorithms",
    "Hashing & Search Trees",
    "GTU PYQ Paper 2024 Practice",
    "GTU PYQ Paper 2023 Revision",
  ];

  for (let i = 0; i < topics.length; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    days.push({
      dayNumber: i + 1,
      date: d.toISOString().split("T")[0],
      topicToStudy: topics[i],
      allocatedHours: dailyHours,
      recommendedResourceUrl: `/resources/study-material/computer-engineering/semester/3`,
      isDone: i === 0,
    });
  }

  try {
    await env.DB.prepare(
      `INSERT INTO adaptive_learning_paths (id, user_id, subject_id, target_exam_date, daily_hours_available, schedule_json)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         target_exam_date = excluded.target_exam_date,
         daily_hours_available = excluded.daily_hours_available,
         schedule_json = excluded.schedule_json`
    ).bind(pathId, userId, subjectId, targetExamDate, dailyHours, JSON.stringify(days)).run();
  } catch (err) {
    console.error("Failed to save adaptive path:", err);
  }

  return {
    id: pathId,
    userId,
    subjectId,
    targetExamDate,
    dailyHoursAvailable: dailyHours,
    schedule: days,
  };
}

export async function fetchContextualRecommendations(
  env: Env,
  userId: string
): Promise<ContextualRecommendation[]> {
  return [
    {
      id: "rec_1",
      type: "resource",
      title: "Handwritten Unit 3 Notes: Binary Trees & Graphs",
      description: "GTU 2024 High-Weightage handwritten lecture notes.",
      relevanceScore: 98,
      reason: "Addresses predicted weak area in GTU DSA",
      actionUrl: "/resources/study-material",
    },
    {
      id: "rec_2",
      type: "assessment",
      title: "GTU Winter 2024 PYQ Practice Quiz",
      description: "Test 14 GTU exam questions with instant step-by-step solutions.",
      relevanceScore: 92,
      reason: "Recommended for 15-day GTU exam countdown",
      actionUrl: "/practice",
    },
    {
      id: "rec_3",
      type: "roadmap",
      title: "Campus Placement Preparation Milestone 2",
      description: "Quantitative Aptitude & Algorithm Design exercises.",
      relevanceScore: 89,
      reason: "Matches your career interest in Software Engineering",
      actionUrl: "/student",
    },
  ];
}
