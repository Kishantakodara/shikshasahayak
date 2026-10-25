// ============================================================
// ADAPTIVE LEARNING ENGINE - DEMAND INTELLIGENCE LOOP SERVICE
// Closes the loop between student weak topic demand, question pool gaps,
// Phase 1I demand recommendations, and Phase 1H pipeline ingestion triggers.
// ============================================================

import { Env } from '../../contentEngine';
import { generateIngestionRecommendations, IngestionRecommendation } from '../qualityEngine';
import { startPipelineJob } from '../pipelineOrchestrator';

export interface AdaptiveDemandLoopSummary {
  totalStudentWeakTopics: number;
  topWeakTopics: Array<{ subjectCode: string; topicName: string; studentCount: number }>;
  recommendations: IngestionRecommendation[];
}

export async function getAdaptiveDemandLoopSummary(
  env: Env
): Promise<AdaptiveDemandLoopSummary> {
  const weakTopicsRes = await env.DB.prepare(
    `SELECT subject_code, topic_name, COUNT(DISTINCT student_id) as student_cnt
     FROM student_topic_mastery
     WHERE mastery_level IN ('LOW_CONFIDENCE', 'DEVELOPING')
     GROUP BY subject_code, topic_name
     ORDER BY student_cnt DESC LIMIT 10`
  ).all<{ subject_code: string; topic_name: string; student_cnt: number }>();

  const weakTopics = (weakTopicsRes.results || []).map((w) => ({
    subjectCode: w.subject_code,
    topicName: w.topic_name,
    studentCount: w.student_cnt,
  }));

  const recommendations = await generateIngestionRecommendations(env);

  return {
    totalStudentWeakTopics: weakTopics.reduce((sum, w) => sum + w.studentCount, 0),
    topWeakTopics: weakTopics,
    recommendations,
  };
}

export async function triggerIngestionForWeakTopic(
  env: Env,
  subjectCode: string,
  adminId: string
): Promise<{ success: boolean; jobId: string }> {
  const job = await startPipelineJob(env, {
    sourceType: 'GTU',
    subjectCode,
    requestedScope: 'FULL',
    createdBy: adminId,
    metadata: { triggerMode: 'MANUAL' },
  });

  return { success: true, jobId: job.job_id };
}
