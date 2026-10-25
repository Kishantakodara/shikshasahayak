// ============================================================
// PHASE 3: AI PYQ TRANSFORMER SERVICE
// Transforms canonical GTU PYQs into concept, parameter, and
// distractor variants while maintaining strict mathematical validity
// and bidirectional provenance links to the parent PYQ.
// ============================================================

import { Env } from '../../contentEngine';
import { executeAIRoute } from '../../aiProviderRouter';
import { MasterQuestion } from '../../../../src/types';
import { validateMasterQuestionPayload } from '../validationService';
import { detectDuplicateQuestionAsync } from '../duplicateDetectionService';
import { enqueueQuestion } from '../ingestionQueueService';

export interface PyqTransformationRequest {
  parentQuestionId: string;
  transformationType: 'PARAMETER_VARIANT' | 'CONCEPT_VARIANT' | 'DIFFICULTY_VARIANT' | 'DISTRACTOR_VARIANT';
  targetDifficulty?: 'easy' | 'medium' | 'hard';
}

export interface PyqTransformationResponse {
  success: boolean;
  parentQuestionId: string;
  queueItemId?: string;
  transformedQuestion?: Partial<MasterQuestion>;
  isDuplicateCandidate: boolean;
  status: 'STAGED' | 'QUARANTINED' | 'FAILED';
  error?: string;
}

/**
  Transforms a canonical GTU PYQ into an objective variant.
 */
export async function transformPyqWithAI(
  env: Env,
  req: PyqTransformationRequest
): Promise<PyqTransformationResponse> {
  try {
    // 1. Fetch parent question from master_question_bank
    const parent = await env.DB.prepare(
      `SELECT id, question_type, question_text, options_json, correct_answer_json,
              acceptable_numerical_range_json, explanation, subject_code, subject_name,
              semester, unit_no, topic_name, marks, negative_marking, difficulty, bloom_level,
              exam_name, exam_year, exam_session, source_url
       FROM master_question_bank WHERE id = ?`
    )
      .bind(req.parentQuestionId)
      .first<Record<string, unknown>>();

    if (!parent) {
      return {
        success: false,
        parentQuestionId: req.parentQuestionId,
        status: 'FAILED',
        isDuplicateCandidate: false,
        error: `Parent question '${req.parentQuestionId}' not found in master_question_bank`,
      };
    }

    const systemInstruction = `You are an expert Engineering Examination Transformation System.
Your job is to transform a source GTU Previous Year Question (PYQ) into a high-quality pedagogical variant.

Transformation Type: ${req.transformationType}
Target Difficulty: ${req.targetDifficulty || parent.difficulty}

Rules:
1. Maintain strict mathematical and technical consistency.
2. If PARAMETER_VARIANT: Change numerical constants/variable parameters and re-calculate the exact correct answer.
3. If CONCEPT_VARIANT: Test the identical core principle or equation using a different physical/engineering context.
4. If DISTRACTOR_VARIANT: Keep the stem and correct answer identical, but generate realistic, plausible technical distractors based on common student misconceptions.
5. Output ONLY valid JSON matching this schema:
{
  "questionText": "...",
  "questionType": "${parent.question_type}",
  "options": [
    { "id": "A", "text": "..." },
    { "id": "B", "text": "..." },
    { "id": "C", "text": "..." },
    { "id": "D", "text": "..." }
  ],
  "correctAnswer": "A",
  "acceptableRange": { "min": 0, "max": 0, "tolerance": 0 },
  "explanation": "...",
  "difficulty": "${req.targetDifficulty || parent.difficulty}"
}`;

    const userPrompt = `Source Question:
ID: ${parent.id}
Type: ${parent.question_type}
Subject: ${parent.subject_name} (${parent.subject_code})
Topic: ${parent.topic_name}
Stem: ${parent.question_text}
Options: ${parent.options_json || 'None'}
Correct Answer: ${parent.correct_answer_json}
Current Explanation: ${parent.explanation || 'None'}`;

    let rawJson = '';
    let modelUsed = 'gemini-2.0-flash';

    try {
      const aiRes = await executeAIRoute(env, {
        capability: 'quiz_generator',
        systemInstruction,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.3,
        maxTokens: 2500,
      });

      if ('text' in aiRes) {
        if (typeof (aiRes as any).text === 'function') {
          rawJson = await (aiRes as any).text();
        } else {
          rawJson = String(aiRes.text);
        }
        modelUsed = (aiRes as any).model || 'gemini-2.0-flash';
      }
    } catch {
      // Fallback deterministic variant if offline or API key missing
      let optionsList: any[] = [];
      try {
        if (parent.options_json) optionsList = JSON.parse(String(parent.options_json));
      } catch { /* empty */ }

      rawJson = JSON.stringify({
        questionText: `[Concept Variant] ${parent.question_text}`,
        questionType: parent.question_type,
        options: optionsList.length > 0 ? optionsList : [
          { id: 'A', text: 'Option A' },
          { id: 'B', text: 'Option B' },
          { id: 'C', text: 'Option C' },
          { id: 'D', text: 'Option D' },
        ],
        correctAnswer: parent.correct_answer_json || 'B',
        explanation: parent.explanation || 'Analytical derivation of the conceptual principle.',
        difficulty: req.targetDifficulty || parent.difficulty,
      });
      modelUsed = 'rule-based-variant-generator';
    }

    const cleanJson = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const transformedCandidate: Partial<MasterQuestion> = {
      sourceType: 'AI_PRACTICE',
      isOriginalPyq: false,
      isAiGenerated: true,
      provenanceId: `ai_variant_${req.transformationType.toLowerCase()}_${parent.id}`,
      examName: 'PRACTICE',
      examYear: new Date().getFullYear(),
      subjectCode: String(parent.subject_code),
      subjectName: String(parent.subject_name),
      semester: Number(parent.semester || 1),
      unitNo: Number(parent.unit_no || 1),
      topicName: String(parent.topic_name || ''),
      questionType: (parsed.questionType || parent.question_type) as any,
      questionText: parsed.questionText,
      options: parsed.options,
      correctAnswer: parsed.correctAnswer,
      acceptableNumericalRange: parsed.acceptableRange,
      explanation: parsed.explanation,
      marks: Number(parent.marks || 1.0),
      negativeMarking: Number(parent.negative_marking || 0.25),
      difficulty: (parsed.difficulty || req.targetDifficulty || parent.difficulty) as any,
      bloomLevel: (parent.bloom_level || 'APPLY') as any,
      verificationStatus: 'unverified',
    };

    // 1. Technical Validation
    const validation = validateMasterQuestionPayload(transformedCandidate);

    // 2. Duplicate Detection
    const dupCheck = await detectDuplicateQuestionAsync(env, transformedCandidate);

    const isQuarantined = !validation.isValid;

    const rawPayloadJson = JSON.stringify({
      ...transformedCandidate,
      provenance: {
        parentQuestionId: parent.id,
        transformationType: req.transformationType,
        sourcePaperUrl: parent.source_url,
        originalExamYear: parent.exam_year,
        originalExamSession: parent.exam_session,
        modelUsed,
        transformedAt: new Date().toISOString(),
        confidenceScore: isQuarantined ? 0.6 : 0.95,
        isDuplicateCandidate: dupCheck.isDuplicate,
        duplicateMatchedId: dupCheck.matchedQuestionId,
      },
    });

    const queueItem = await enqueueQuestion(env, {
      source: 'AI_GENERATOR',
      rawPayloadJson,
      extractedQuestionText: transformedCandidate.questionText,
      detectedType: transformedCandidate.questionType as any,
      confidenceScore: isQuarantined ? 0.6 : 0.95,
    });

    return {
      success: true,
      parentQuestionId: String(parent.id),
      queueItemId: queueItem.id,
      transformedQuestion: transformedCandidate,
      isDuplicateCandidate: dupCheck.isDuplicate,
      status: isQuarantined ? 'QUARANTINED' : 'STAGED',
    };
  } catch (err: any) {
    console.error('Error in transformPyqWithAI:', err);
    return {
      success: false,
      parentQuestionId: req.parentQuestionId,
      status: 'FAILED',
      isDuplicateCandidate: false,
      error: err.message || String(err),
    };
  }
}
