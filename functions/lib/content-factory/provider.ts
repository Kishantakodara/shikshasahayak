/**
 * Content Factory V1 — AI Provider Abstraction
 * Supports Google Gemini (Google AI Pro workflow) with clean provider abstraction.
 */

export interface ContentGenerationParams {
  university: string;
  branch: string;
  semester: number;
  subject: string;
  unitNo: number;
  unitTitle?: string;
  topic: string;
  contentTypes: string[]; // ['detailed_notes', 'short_notes', 'definitions', 'examples', 'mcqs', 'short_questions', 'long_questions', 'numerical_problems', 'viva_questions', 'quick_revision']
  config?: {
    mcqCount?: number;
    shortQuestionCount?: number;
    longQuestionCount?: number;
    vivaQuestionCount?: number;
    numericalCount?: number;
  };
}

export interface GeneratedMCQ {
  question: string;
  options: string[];
  answer: number; // 0-based index
  explanation: string;
}

export interface GeneratedQuestion {
  question: string;
  answer: string;
  marks?: number;
  keyPoints?: string[];
}

export interface GeneratedNumerical {
  problem: string;
  givenData?: string;
  formulaUsed?: string;
  steps: string[];
  finalAnswer: string;
}

export interface GeneratedDefinition {
  term: string;
  definition: string;
  keyPoints?: string[];
}

export interface GeneratedExample {
  title: string;
  scenario: string;
  explanation: string;
}

export interface GeneratedContentPayload {
  topic: string;
  detailedNotes?: string;
  shortNotes?: string;
  definitions?: GeneratedDefinition[];
  examples?: GeneratedExample[];
  mcqs?: GeneratedMCQ[];
  shortQuestions?: GeneratedQuestion[];
  longQuestions?: GeneratedQuestion[];
  numericalProblems?: GeneratedNumerical[];
  vivaQuestions?: GeneratedQuestion[];
  quickRevision?: {
    summaryPoints: string[];
    formulas: string[];
    commonMistakes: string[];
  };
}

export interface ContentGenerationProvider {
  generate(params: ContentGenerationParams, apiKey?: string): Promise<GeneratedContentPayload>;
}

/**
 * Format raw JSON payload into structured readable Markdown presentation
 */
export function formatPayloadToMarkdown(payload: GeneratedContentPayload, params: ContentGenerationParams): string {
  const sections: string[] = [];

  sections.push(`# ${payload.topic}`);
  sections.push(`> **Curriculum:** ${params.university.toUpperCase()} • ${params.branch} (Semester ${params.semester})\n> **Subject:** ${params.subject} • Unit ${params.unitNo}${params.unitTitle ? `: ${params.unitTitle}` : ''}\n`);

  if (payload.detailedNotes) {
    sections.push(`## 📖 Detailed Notes\n\n${payload.detailedNotes}`);
  }

  if (payload.shortNotes) {
    sections.push(`## 📝 Short Notes (Revision Summary)\n\n${payload.shortNotes}`);
  }

  if (payload.definitions && payload.definitions.length > 0) {
    sections.push(`## 🔑 Key Definitions & Terms\n`);
    payload.definitions.forEach((def, i) => {
      sections.push(`### ${i + 1}. ${def.term}\n${def.definition}${def.keyPoints && def.keyPoints.length > 0 ? `\n\n*Key Points:*\n${def.keyPoints.map(kp => `- ${kp}`).join('\n')}` : ''}`);
    });
  }

  if (payload.examples && payload.examples.length > 0) {
    sections.push(`## 💡 Real-World Examples & Applications\n`);
    payload.examples.forEach((ex, i) => {
      sections.push(`### Example ${i + 1}: ${ex.title}\n**Scenario:** ${ex.scenario}\n\n**Explanation:** ${ex.explanation}`);
    });
  }

  if (payload.quickRevision) {
    sections.push(`## ⚡ Quick Revision Summary\n`);
    if (payload.quickRevision.summaryPoints && payload.quickRevision.summaryPoints.length > 0) {
      sections.push(`### Key Takeaways\n${payload.quickRevision.summaryPoints.map(p => `- ${p}`).join('\n')}`);
    }
    if (payload.quickRevision.formulas && payload.quickRevision.formulas.length > 0) {
      sections.push(`### Important Formulas & Rules\n${payload.quickRevision.formulas.map(f => `- \`${f}\``).join('\n')}`);
    }
    if (payload.quickRevision.commonMistakes && payload.quickRevision.commonMistakes.length > 0) {
      sections.push(`### Common Exam Pitfalls\n${payload.quickRevision.commonMistakes.map(m => `⚠️ ${m}`).join('\n')}`);
    }
  }

  if (payload.mcqs && payload.mcqs.length > 0) {
    sections.push(`## 🎯 Multiple Choice Questions (MCQs)\n`);
    payload.mcqs.forEach((mcq, i) => {
      const opts = mcq.options.map((opt, oIdx) => `   ${String.fromCharCode(65 + oIdx)}. ${opt}`).join('\n');
      const correctChar = String.fromCharCode(65 + (mcq.answer ?? 0));
      sections.push(`**Q${i + 1}. ${mcq.question}**\n${opts}\n\n*Correct Answer:* **(${correctChar}) ${mcq.options[mcq.answer] || ''}**\n*Explanation:* ${mcq.explanation}\n`);
    });
  }

  if (payload.shortQuestions && payload.shortQuestions.length > 0) {
    sections.push(`## ❓ Short Answer Questions (2–3 Marks)\n`);
    payload.shortQuestions.forEach((sq, i) => {
      sections.push(`**Q${i + 1} (${sq.marks || 2} Marks): ${sq.question}**\n\n${sq.answer}\n`);
    });
  }

  if (payload.longQuestions && payload.longQuestions.length > 0) {
    sections.push(`## 📑 Long Answer Questions (5–7 Marks)\n`);
    payload.longQuestions.forEach((lq, i) => {
      const kp = lq.keyPoints && lq.keyPoints.length > 0 ? `\n\n*Evaluation Points:*\n${lq.keyPoints.map(p => `- ${p}`).join('\n')}` : '';
      sections.push(`**Q${i + 1} (${lq.marks || 7} Marks): ${lq.question}**\n\n${lq.answer}${kp}\n`);
    });
  }

  if (payload.numericalProblems && payload.numericalProblems.length > 0) {
    sections.push(`## 🔢 Numerical Problems & Step-by-Step Solutions\n`);
    payload.numericalProblems.forEach((num, i) => {
      const given = num.givenData ? `\n**Given:** ${num.givenData}` : '';
      const formula = num.formulaUsed ? `\n**Formula:** \`${num.formulaUsed}\`` : '';
      const steps = num.steps && num.steps.length > 0 ? `\n**Solution Steps:**\n${num.steps.map((s, sIdx) => `${sIdx + 1}. ${s}`).join('\n')}` : '';
      sections.push(`### Problem ${i + 1}\n${num.problem}${given}${formula}${steps}\n\n**Final Answer:** \`${num.finalAnswer}\`\n`);
    });
  }

  if (payload.vivaQuestions && payload.vivaQuestions.length > 0) {
    sections.push(`## 🎓 Viva Voce Questions\n`);
    payload.vivaQuestions.forEach((viva, i) => {
      sections.push(`**Viva Q${i + 1}: ${viva.question}**\n\n*Answer:* ${viva.answer}\n`);
    });
  }

  return sections.join('\n\n---\n\n');
}

/**
 * Gemini implementation of ContentGenerationProvider
 */
export class GeminiContentProvider implements ContentGenerationProvider {
  async generate(params: ContentGenerationParams, apiKey?: string): Promise<GeneratedContentPayload> {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const {
      mcqCount = 5,
      shortQuestionCount = 3,
      longQuestionCount = 2,
      vivaQuestionCount = 3,
      numericalCount = 1
    } = params.config || {};

    const prompt = `You are a Senior Engineering Professor, University Textbook Author, and Subject-Matter Expert creating authoritative study material for ${params.university.toUpperCase()} (${params.branch}, Semester ${params.semester}).
Subject: ${params.subject}
Unit ${params.unitNo}${params.unitTitle ? `: ${params.unitTitle}` : ''}
Topic: ${params.topic}

Target Audience: Undergraduate engineering students preparing for university examinations, lab viva-voce, competitive exams (GATE), and technical interviews.

ACADEMIC RIGOR & QUALITY MANDATES:
1. ADAPTIVE PEDAGOGICAL STRUCTURE: Automatically select the natural teaching breakdown for "${params.topic}":
   - Protocol/Network: Architecture, Message Flows/Packet Structures, Encapsulation, Governing Standards (IEEE/IETF/ISO).
   - Algorithm: Technical Intuition, Step-by-Step Mechanism, Pseudocode, Time/Space Complexity (O), Edge Cases.
   - Mathematical: Core Concept, Derivation & Assumptions, Formulas with Variable Units, Step-by-Step Solved Problem.
   - Hardware/Physical: Physical Construction, Component Architecture, Working Principle, Operating Characteristics.
   - Database/Theory: Fundamental Principles, Formal Specifications, Comparative Analysis, Real-World Use Cases.
2. ACCURACY OVER VERBOSITY: Prioritize technical precision over word count. Do not inflate text with filler, conversational intros ("In this lesson..."), or repetitive conclusions. Every paragraph must advance conceptual understanding.
3. EXPLANATION RIGOR: For main concepts, address WHAT it is, WHY it is needed, HOW it operates, WHERE it is applied, its ADVANTAGES, LIMITATIONS, and DIFFERENCES from related concepts.
4. FACTUAL & STANDARDS DISCIPLINE: Cite RFCs, IEEE, ISO, or IETF standards ONLY when factually verified. Never invent an RFC number or technical specification. If uncertain about a specific historical/numerical detail, explicitly mark it as "[Academic verification required]".
5. UNIVERSITY EXAM ORIENTATION: Use neutral terminology like "Exam Focus", "Potential Short-Answer Area", or "Potential Long-Answer Area". Do not invent fabricated past-year frequency claims or specific mark percentages.
6. NO UNNECESSARY NUMERICALS/DIAGRAMS: Generate numerical problems ONLY if the topic involves quantitative calculation; otherwise return an empty array []. Generate ASCII diagrams ONLY when structural/architectural visualization is genuinely beneficial.
7. NON-REPETITIVE CONTENT: Keep definitions, detailed notes, examples, questions, and revision summaries distinct. Avoid verbatim sentence duplication across sections.

Generate content matching the requested types:
${params.contentTypes.map(t => `- ${t}`).join('\n')}

Return ONLY a valid, parseable JSON object matching this exact schema (no markdown backticks, no conversational text):
{
  "topic": "${params.topic}",
  ${params.contentTypes.includes('detailed_notes') ? `"detailedNotes": "Markdown string containing authoritative textbook-level material following the adaptive pedagogical structure with subheadings, concise explanations, verified standards, and necessary diagrams/tables.",` : ''}
  ${params.contentTypes.includes('short_notes') ? `"shortNotes": "High-density revision points covering key definitions, rules, and core concepts without unnecessary fluff.",` : ''}
  ${params.contentTypes.includes('definitions') ? `"definitions": [{"term": "string", "definition": "string", "keyPoints": ["string"]}],` : ''}
  ${params.contentTypes.includes('examples') ? `"examples": [{"title": "string", "scenario": "string", "explanation": "string"}],` : ''}
  ${params.contentTypes.includes('mcqs') ? `"mcqs": [{"question": "string", "options": ["Option A", "Option B", "Option C", "Option D"], "answer": 0, "explanation": "string"}] (provide exactly ${mcqCount} conceptual MCQs testing core mechanisms with 1 unambiguous correct answer),` : ''}
  ${params.contentTypes.includes('short_questions') ? `"shortQuestions": [{"question": "string", "answer": "string", "marks": 3}] (provide exactly ${shortQuestionCount} short-answer exam questions),` : ''}
  ${params.contentTypes.includes('long_questions') ? `"longQuestions": [{"question": "string", "answer": "string", "keyPoints": ["string"], "marks": 7}] (provide exactly ${longQuestionCount} structural exam questions with evaluation points),` : ''}
  ${params.contentTypes.includes('numerical_problems') ? `"numericalProblems": [{"problem": "string", "givenData": "string", "formulaUsed": "string", "steps": ["string"], "finalAnswer": "string"}] (provide ${numericalCount} numerical problems ONLY if topic is quantitative, else []),` : ''}
  ${params.contentTypes.includes('viva_questions') ? `"vivaQuestions": [{"question": "string", "answer": "string"}] (provide exactly ${vivaQuestionCount} lab viva questions),` : ''}
  ${params.contentTypes.includes('quick_revision') ? `"quickRevision": {"summaryPoints": ["string"], "formulas": ["string"], "commonMistakes": ["string"]}` : ''}
}`;

    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
    let lastError: any = null;

    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini ${model} failed (${response.status}): ${errText}`);
        }

        const data = await response.json() as any;
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        
        // Clean any accidental markdown backticks if model wrapped JSON
        const cleanedText = rawText.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        const parsed = JSON.parse(cleanedText) as GeneratedContentPayload;
        parsed.topic = parsed.topic || params.topic;
        return parsed;
      } catch (err: any) {
        lastError = err;
        console.warn(`[ContentFactory] Model ${model} failed, attempting fallback:`, err.message);
      }
    }

    throw lastError || new Error('All Gemini model candidates failed.');
  }
}
