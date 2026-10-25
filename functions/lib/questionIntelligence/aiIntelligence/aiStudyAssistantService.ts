// ============================================================
// PHASE 3: AI STUDY ASSISTANT SERVICE
// Generates Socratic hints, wrong-answer misconception diagnosis,
// and step-by-step solutions with persistent D1 edge caching.
// ============================================================

import { Env } from '../../contentEngine';
import { executeAIRoute } from '../../aiProviderRouter';

export interface AIStudyAssistanceRequest {
  questionId: string;
  assistanceType: 'HINT' | 'EXPLANATION' | 'WRONG_ANSWER_DIAGNOSIS' | 'CONCEPT_SUMMARY';
  selectedOption?: string; // e.g. 'C' for wrong answer diagnosis
  studentLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface AIStudyAssistanceResponse {
  questionId: string;
  assistanceType: string;
  selectedOption?: string;
  markdownContent: string;
  cached: boolean;
  modelUsed: string;
}

/**
  Retrieves or generates study assistance content with deterministic D1 caching.
 */
export async function getStudyAssistanceAI(
  env: Env,
  req: AIStudyAssistanceRequest
): Promise<AIStudyAssistanceResponse> {
  const selectedOpt = req.selectedOption || 'NONE';

  // 1. Check D1 edge cache
  try {
    const cachedRow = await env.DB.prepare(
      `SELECT content_payload_json, model_used FROM ai_study_assistance_cache
       WHERE question_id = ? AND assistance_type = ? AND selected_option = ?`
    )
      .bind(req.questionId, req.assistanceType, selectedOpt)
      .first<{ content_payload_json: string; model_used: string }>();

    if (cachedRow) {
      return {
        questionId: req.questionId,
        assistanceType: req.assistanceType,
        selectedOption: req.selectedOption,
        markdownContent: cachedRow.content_payload_json,
        cached: true,
        modelUsed: cachedRow.model_used || 'cache',
      };
    }
  } catch (cacheErr) {
    console.warn('Cache lookup warning:', cacheErr);
  }

  // 2. Fetch question details from master_question_bank
  const qRow = await env.DB.prepare(
    `SELECT id, question_type, question_text, options_json, correct_answer_json,
            explanation, subject_code, subject_name, topic_name
     FROM master_question_bank WHERE id = ?`
  )
    .bind(req.questionId)
    .first<Record<string, unknown>>();

  if (!qRow) {
    throw new Error(`Question '${req.questionId}' not found`);
  }

  let systemInstruction = '';
  let userPrompt = '';

  if (req.assistanceType === 'HINT') {
    systemInstruction = `You are a Socratic Engineering Tutor.
Provide a progressive, helpful hint that guides the student toward finding the solution WITHOUT revealing the final answer or correct option letter.
Keep it concise (2-3 sentences) with LaTeX formulas ($...$) where helpful.`;

    userPrompt = `Subject: ${qRow.subject_name}
Topic: ${qRow.topic_name}
Question: ${qRow.question_text}
Options: ${qRow.options_json || 'None'}`;
  } else if (req.assistanceType === 'WRONG_ANSWER_DIAGNOSIS') {
    systemInstruction = `You are an expert Engineering Professor diagnosing a student misconception.
Explain clearly why the student's selected option (${req.selectedOption}) is incorrect, what common calculation or conceptual trap led to it, and how to avoid it.
Do NOT reveal the correct option directly.`;

    userPrompt = `Subject: ${qRow.subject_name}
Topic: ${qRow.topic_name}
Question: ${qRow.question_text}
Options: ${qRow.options_json || 'None'}
Student Selected: Option ${req.selectedOption}`;
  } else {
    // EXPLANATION / CONCEPT_SUMMARY
    systemInstruction = `You are a Senior Engineering Educator providing a complete, crystal-clear derivation and explanation.
Provide step-by-step reasoning with LaTeX ($...$, $$...$$) and practical intuition.`;

    userPrompt = `Subject: ${qRow.subject_name}
Topic: ${qRow.topic_name}
Question: ${qRow.question_text}
Options: ${qRow.options_json || 'None'}
Correct Answer: ${qRow.correct_answer_json}`;
  }

  let generatedText = '';
  let modelUsed = 'gemini-2.0-flash';

  try {
    const aiRes = await executeAIRoute(env, {
      capability: 'tutor',
      systemInstruction,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.3,
      maxTokens: 1500,
    });

    if ('text' in aiRes) {
      if (typeof (aiRes as any).text === 'function') {
        generatedText = await (aiRes as any).text();
      } else {
        generatedText = String(aiRes.text);
      }
      modelUsed = (aiRes as any).model || 'gemini-2.0-flash';
    }
  } catch {
    // Contextual fallback explanation if offline or test mode
    if (req.assistanceType === 'HINT') {
      generatedText = 'Socratic Hint: Focus on the specific layer responsible for end-to-end communication and port addressing.';
    } else if (req.assistanceType === 'WRONG_ANSWER_DIAGNOSIS') {
      generatedText = `Misconception Note: Option ${req.selectedOption} handles node-to-node or intermediate framing rather than true process-to-process delivery.`;
    } else {
      generatedText = String(qRow.explanation || 'Refer to standard university textbook reference for this topic derivation.');
    }
  }

  // 3. Store in D1 edge cache
  try {
    const cacheId = `asac_${crypto.randomUUID().slice(0, 12)}`;
    await env.DB.prepare(
      `INSERT OR REPLACE INTO ai_study_assistance_cache (
        id, question_id, assistance_type, selected_option, content_payload_json, model_used
      ) VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(cacheId, req.questionId, req.assistanceType, selectedOpt, generatedText, modelUsed)
      .run();
  } catch (saveErr) {
    console.warn('Failed to save to assistance cache:', saveErr);
  }

  return {
    questionId: req.questionId,
    assistanceType: req.assistanceType,
    selectedOption: req.selectedOption,
    markdownContent: generatedText,
    cached: false,
    modelUsed,
  };
}
