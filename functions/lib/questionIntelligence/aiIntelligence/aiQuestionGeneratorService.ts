// ============================================================
// PHASE 3: AI QUESTION GENERATOR SERVICE
// Generates syllabus-grounded MCQ, MSQ, and NAT questions using
// Google Gemini via server-side Provider Router abstraction.
// ============================================================

import { Env } from '../../contentEngine';
import { executeAIRoute } from '../../aiProviderRouter';
import { MasterQuestion } from '../../../../src/types';
import { validateMasterQuestionPayload } from '../validationService';
import { detectDuplicateQuestionAsync } from '../duplicateDetectionService';
import { enqueueQuestion } from '../ingestionQueueService';
import { createQuestion } from '../questionService';

export interface AIGenerationBatchRequest {
  subjectCode: string;
  subjectName: string;
  semester: number;
  unitNo?: number;
  topicName: string;
  targetBloomLevel?: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  targetDifficulty?: 'easy' | 'medium' | 'hard';
  questionType: 'MCQ' | 'MSQ' | 'NAT';
  count: number;
  targetBranchIds?: string[];
  autoVerify?: boolean;
}

export interface AIGenerationBatchResponse {
  batchId: string;
  requestedCount: number;
  generatedCount: number;
  stagedCount: number;
  quarantinedCount: number;
  modelUsed: string;
  stagedQuestions: Array<{ queueId: string; questionText: string; questionType: string }>;
  errors: string[];
}

/**
  Generates a batch of syllabus-aligned candidate questions using Gemini.
 */
export async function generateQuestionBatchAI(
  env: Env,
  req: AIGenerationBatchRequest
): Promise<AIGenerationBatchResponse> {
  const batchId = `aib_${crypto.randomUUID().slice(0, 10)}`;
  const count = Math.min(Math.max(1, req.count || 1), 10);
  const difficulty = req.targetDifficulty || 'medium';
  const bloomLevel = req.targetBloomLevel || 'APPLY';

  const systemInstruction = `You are a Senior Engineering University Examiner creating rigorous, high-quality technical exam questions.
Output MUST be a valid JSON array of question objects adhering strictly to this schema:
[
  {
    "questionText": "Clear technical question prompt with LaTeX $...$ for inline math and $$...$$ for block formulas",
    "questionType": "${req.questionType}",
    "options": [
      { "id": "A", "text": "Option A text" },
      { "id": "B", "text": "Option B text" },
      { "id": "C", "text": "Option C text" },
      { "id": "D", "text": "Option D text" }
    ],
    "correctAnswer": "A", // For MCQ: "A", for MSQ: ["A", "C"], for NAT: "15.4"
    "acceptableRange": { "min": 15.2, "max": 15.6, "tolerance": 0.2 }, // Only if NAT
    "explanation": "Detailed technical derivation explaining why the answer is correct and why distractors are wrong",
    "marks": ${req.questionType === 'MCQ' ? 1.0 : 2.0},
    "negativeMarking": ${req.questionType === 'MCQ' ? 0.25 : 0.0},
    "difficulty": "${difficulty}",
    "bloomLevel": "${bloomLevel}"
  }
]
Rules:
1. Technical accuracy is mandatory.
2. For MCQ/MSQ, distractors must represent plausible technical misconceptions.
3. For NAT, provide exact numerical answer and realistic tolerance range.
4. Output raw JSON only. No markdown fences.`;

  const userPrompt = `Generate ${count} distinct, rigorous ${req.questionType} questions for:
Subject: ${req.subjectName} (${req.subjectCode})
Semester: ${req.semester}
Unit: ${req.unitNo || 1}
Topic: ${req.topicName}
Difficulty: ${difficulty}
Bloom Level: ${bloomLevel}`;

  const startTime = Date.now();
  let rawJson = '';
  let modelUsed = 'gemini-2.0-flash';
  const errors: string[] = [];
  const stagedQuestions: Array<{ queueId: string; questionText: string; questionType: string }> = [];

  try {
    const aiRes = await executeAIRoute(env, {
      capability: 'quiz_generator',
      systemInstruction,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.4,
      maxTokens: 3000,
    });

    if ('text' in aiRes) {
      if (typeof (aiRes as any).text === 'function') {
        rawJson = await (aiRes as any).text();
      } else {
        rawJson = String(aiRes.text);
      }
      modelUsed = (aiRes as any).model || 'gemini-2.0-flash';
    }
  } catch (err: any) {
    errors.push(`AI Generation request failed: ${err.message || err}`);
  }

  let parsedItems: any[] = [];
  if (rawJson) {
    try {
      const cleanJson = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedItems = JSON.parse(cleanJson);
      if (!Array.isArray(parsedItems)) parsedItems = [parsedItems];
    } catch {
      errors.push('Failed to parse AI JSON response');
    }
  }

  let stagedCount = 0;
  let quarantinedCount = 0;

  for (const item of parsedItems) {
    const qType = (item.questionType || req.questionType) as 'MCQ' | 'MSQ' | 'NAT';
    const candidate: Partial<MasterQuestion> = {
      sourceType: 'AI_PRACTICE',
      isOriginalPyq: false,
      isAiGenerated: true,
      examName: 'PRACTICE',
      examYear: new Date().getFullYear(),
      subjectCode: req.subjectCode,
      subjectName: req.subjectName,
      semester: req.semester,
      unitNo: req.unitNo || 1,
      topicName: req.topicName,
      questionType: qType,
      questionText: item.questionText,
      optionsJson: item.options ? JSON.stringify(item.options) : undefined,
      correctAnswerJson: item.correctAnswer !== undefined ? (typeof item.correctAnswer === 'string' ? item.correctAnswer : JSON.stringify(item.correctAnswer)) : '',
      mcqData: qType === 'MCQ' ? { options: item.options || [], correctAnswer: String(item.correctAnswer || 'A') } : null,
      msqData: qType === 'MSQ' ? { options: item.options || [], correctAnswers: Array.isArray(item.correctAnswer) ? item.correctAnswer : [String(item.correctAnswer || 'A')] } : null,
      natData: qType === 'NAT' ? { exactValue: Number(item.correctAnswer) || 0, acceptableRange: item.acceptableRange } : null,
      explanation: item.explanation,
      marks: Number(item.marks || (req.questionType === 'MCQ' ? 1.0 : 2.0)),
      negativeMarking: Number(item.negativeMarking || (req.questionType === 'MCQ' ? 0.25 : 0.0)),
      difficulty: (item.difficulty || difficulty) as any,
      bloomLevel: (item.bloomLevel || bloomLevel) as any,
      verificationStatus: 'unverified',
    };

    // 1. Technical Validation
    const validation = validateMasterQuestionPayload(candidate);

    // 2. Duplicate Detection
    const dupCheck = await detectDuplicateQuestionAsync(env, candidate);

    const isQuarantined = !validation.isValid || dupCheck.isDuplicate;

    const rawPayloadJson = JSON.stringify({
      ...candidate,
      aiMetadata: {
        batchId,
        modelUsed,
        generatedAt: new Date().toISOString(),
        confidenceScore: isQuarantined ? 0.6 : 0.95,
        validationErrors: validation.errors,
        isDuplicateCandidate: dupCheck.isDuplicate,
        duplicateMatchedId: dupCheck.matchedQuestionId,
      },
    });

    const queueItem = await enqueueQuestion(env, {
      source: 'AI_GENERATOR',
      rawPayloadJson,
      extractedQuestionText: candidate.questionText,
      detectedType: candidate.questionType as any,
      confidenceScore: isQuarantined ? 0.6 : 0.95,
    });

    if (isQuarantined) {
      quarantinedCount++;
    } else {
      stagedCount++;
      stagedQuestions.push({
        queueId: queueItem.id,
        questionText: candidate.questionText || '',
        questionType: candidate.questionType || 'MCQ',
      });

      if (req.autoVerify) {
        try {
          await createQuestion(
            env,
            {
              ...candidate,
              verificationStatus: 'verified',
              verifiedBy: 'gemini_ai_studio',
            },
            req.targetBranchIds && req.targetBranchIds.length > 0
              ? req.targetBranchIds
              : ['branch_00', 'branch_06', 'branch_07', 'branch_09', 'branch_11', 'branch_16', 'branch_19']
          );
        } catch (autoErr) {
          console.error('Failed to auto-create verified question from AI generator:', autoErr);
        }
      }
    }
  }

  // Record batch telemetry in D1
  try {
    const latencyMs = Date.now() - startTime;
    await env.DB.prepare(
      `INSERT INTO ai_generation_batches (
        id, batch_name, subject_code, subject_name, unit_no, topic_name,
        target_bloom_level, target_difficulty, question_type, requested_count,
        generated_count, staged_count, quarantined_count, model_used, latency_ms, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        batchId,
        `AI_${req.subjectCode}_${req.topicName.slice(0, 20)}`,
        req.subjectCode,
        req.subjectName,
        req.unitNo || 1,
        req.topicName,
        bloomLevel,
        difficulty,
        req.questionType,
        count,
        parsedItems.length,
        stagedCount,
        quarantinedCount,
        modelUsed,
        latencyMs,
        errors.length === 0 ? 'COMPLETED' : 'FAILED'
      )
      .run();
  } catch (dbErr) {
    console.error('Failed to log AI generation batch:', dbErr);
  }

  return {
    batchId,
    requestedCount: count,
    generatedCount: parsedItems.length,
    stagedCount,
    quarantinedCount,
    modelUsed,
    stagedQuestions,
    errors,
  };
}
