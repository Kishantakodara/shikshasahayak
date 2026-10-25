// ============================================================
// ADMIN API: POST /api/admin/question-intelligence/extract-pdf
// Parses uploaded PDF question papers, extracts text per page,
// segments questions, detects circuit diagram requirements,
// options, types (MCQ/MSQ/NAT), checks duplicates, and stages to queue.
// ============================================================

import { getDocumentProxy, extractText } from 'unpdf';
import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { normalizeMathAndLatex, ExtractedQuestionCandidate } from '../../../lib/questionIntelligence/websiteExtractionService';
import { validateMcqPayload, validateMsqPayload } from '../../../lib/questionIntelligence/validationService';
import { detectDuplicateQuestionAsync } from '../../../lib/questionIntelligence/duplicateDetectionService';
import { enqueueQuestion } from '../../../lib/questionIntelligence/ingestionQueueService';

const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_PAGES = 30;

export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse('Unauthorized: Authentication required', 401);
    if (!isAdmin(user.email, user.role) && user.role !== 'admin' && user.role !== 'teacher') {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const formData = await context.request.formData().catch(() => null);
    if (!formData) {
      return errorResponse('Invalid form data payload', 400);
    }

    const file = formData.get('file');
    if (!file || typeof file === 'string' || !(file instanceof File)) {
      return errorResponse('Missing or invalid PDF file in form data', 400);
    }

    if (file.size === 0) {
      return errorResponse('Uploaded PDF file is empty (0 bytes)', 400);
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      return errorResponse(`PDF file exceeds maximum allowed size of 15 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB)`, 400);
    }

    const examName = String(formData.get('examName') || 'GATE 2027');
    const paperCode = String(formData.get('paperCode') || 'CS');
    const subjectName = String(formData.get('subjectName') || `${paperCode} Core Subject`);
    const topicName = String(formData.get('topicName') || 'General Topic');
    const year = Number(formData.get('year')) || 2024;
    const sourceCategory = String(formData.get('sourceCategory') || 'OFFICIAL_PYQ');

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Validate PDF magic number (%PDF-)
    if (bytes.length < 4 || bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
      return errorResponse('Corrupted or invalid PDF file header (not a valid %PDF file)', 400);
    }

    const rawTextFromClient = String(formData.get('rawText') || '').trim();

    // Extract text from PDF document
    let fullText = '';
    const pageTexts: string[] = [];

    if (rawTextFromClient) {
      fullText = rawTextFromClient;
    } else {
      try {
        const doc = await getDocumentProxy(bytes);
        const { totalPages, text } = await extractText(doc, { mergePages: false });
        const pagesLimit = Math.min(Array.isArray(text) ? text.length : totalPages, MAX_PAGES);

        for (let p = 0; p < pagesLimit; p++) {
          const pageContent = Array.isArray(text) ? (text[p] || '') : (text || '');
          pageTexts.push(pageContent);
          fullText += `\n--- PAGE ${p + 1} ---\n` + pageContent;
        }
      } catch (parseErr: any) {
        console.warn('unpdf server extraction error, trying fallback stream extractor:', parseErr);
        fullText = extractTextFromPdfStreamFallback(bytes);
        if (!fullText.trim()) {
          return errorResponse(`Failed to extract text from PDF: ${parseErr.message || String(parseErr)}`, 422);
        }
      }
    }

    if (!fullText.trim()) {
      return errorResponse('No readable text found in this PDF. If this is a scanned document, please ensure OCR text is embedded.', 422);
    }

    // Segment questions from extracted text
    const questions = segmentQuestionsFromPdfText(fullText, {
      fileName: file.name,
      examName,
      paperCode,
      subjectName,
      topicName,
      year,
      sourceCategory,
    });

    if (questions.length === 0) {
      return jsonResponse({
        success: true,
        sourceTitle: file.name,
        discoveredQuestionsCount: 0,
        successfullyParsedCount: 0,
        rejectedCount: 0,
        duplicateCount: 0,
        questions: [],
        blockerMessage: 'Could not automatically identify question boundaries (Q.1, Question 1:, etc.) in this PDF.',
      });
    }

    // Duplicate detection and queue staging
    const enqueuedItemIds: string[] = [];
    let duplicateCount = 0;
    let rejectedCount = 0;

    for (const q of questions) {
      try {
        const dup = await detectDuplicateQuestionAsync(context.env, {
          questionText: q.questionText,
          questionType: q.questionType,
          subjectCode: q.paperCode,
          subjectName: q.subjectName,
          examName: q.examName,
          examYear: q.year,
        });

        if (dup.isDuplicate) {
          q.isDuplicateCandidate = true;
          q.duplicateMatchedId = dup.matchedQuestionId;
          q.duplicateConfidence = dup.confidence;
          duplicateCount++;
        }

        if (q.validationStatus === 'INVALID') {
          rejectedCount++;
        }

        const rawPayloadJson = JSON.stringify({
          ...q,
          imageUrl: q.imageUrl,
          diagramNeeded: q.diagramNeeded,
          ingestedAt: new Date().toISOString(),
          source: 'GATE_ZIP',
        });

        const queueItem = await enqueueQuestion(context.env, {
          source: 'GATE_ZIP',
          rawPayloadJson,
          extractedQuestionText: q.questionText,
          detectedType: q.questionType,
          confidenceScore: q.isDuplicateCandidate ? 0.3 : 0.88,
        });

        enqueuedItemIds.push(queueItem.id);
      } catch (err) {
        console.warn('Error staging PDF question:', err);
      }
    }

    return jsonResponse({
      success: true,
      sourceTitle: file.name,
      examName,
      paperCode,
      subjectName,
      topicName,
      discoveredQuestionsCount: questions.length,
      successfullyParsedCount: questions.length - rejectedCount,
      rejectedCount,
      duplicateCount,
      questions,
      enqueuedItemIds,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/question-intelligence/extract-pdf:', err);
    return errorResponse(err.message || 'Internal Server Error during PDF extraction', 500);
  }
}

/**
  Segments raw text into structured question blocks using academic question numbering patterns.
 */
function segmentQuestionsFromPdfText(
  fullText: string,
  meta: {
    fileName: string;
    examName: string;
    paperCode: string;
    subjectName: string;
    topicName: string;
    year: number;
    sourceCategory: string;
  }
): ExtractedQuestionCandidate[] {
  const questions: ExtractedQuestionCandidate[] = [];

  // Remove page separators & common exam headers/footers
  const clean = fullText
    .replace(/--- PAGE \d+ ---/g, '\n')
    .replace(/Page\s+\d+\s+of\s+\d+/gi, '')
    .replace(/GATE\s+\d{4}\s+Question\s+Paper/gi, '')
    .replace(/Computer\s+Science\s+and\s+Information\s+Technology/gi, '');

  // Split regex for Question boundaries:
  // Supports: "Q.1", "Q. 1", "Question 1:", "Q1.", "1.", "Q.1 (a)"
  const boundaryRegex = /(?:^|\n)\s*(?:Q(?:uestion)?\.?\s*(\d+[a-z]?)|(\d+)\.)\s*[:\.]?\s*/gi;

  const matches: Array<{ qNo: string; index: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = boundaryRegex.exec(clean)) !== null) {
    const qNo = m[1] || m[2];
    matches.push({ qNo, index: m.index });
  }

  if (matches.length === 0) return [];

  for (let i = 0; i < matches.length; i++) {
    const startIdx = matches[i].index;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index : clean.length;
    const block = clean.slice(startIdx, endIdx).trim();

    if (block.length < 25) continue;

    const candidate = parsePdfQuestionBlock(block, matches[i].qNo, meta);
    if (candidate && candidate.questionText.length > 15) {
      questions.push(candidate);
    }
  }

  return questions;
}

/**
  Parses a single text block into an ExtractedQuestionCandidate.
 */
function parsePdfQuestionBlock(
  block: string,
  questionNo: string,
  meta: {
    fileName: string;
    examName: string;
    paperCode: string;
    subjectName: string;
    topicName: string;
    year: number;
    sourceCategory: string;
  }
): ExtractedQuestionCandidate | null {
  const optLabels = ['A', 'B', 'C', 'D'];

  // 1. Detect if a circuit diagram or image is needed
  const diagramNeeded = /circuit|diagram|schematic|figure|graph|truth table|karnaugh|waveform|shown below|in the following figure/i.test(
    block
  );

  // 2. Extract Options:
  // Pattern 1: (A) ... (B) ... (C) ... (D) ...
  // Pattern 2: (a) ... (b) ... (c) ... (d) ...
  // Pattern 3: A. ... B. ... C. ... D. ...
  const optPattern = /(?:\([A-Da-d]\)|[A-Da-d]\.|\b[A-Da-d]\))\s*([\s\S]*?)(?=(?:\([A-Da-d]\)|[A-Da-d]\.|\b[A-Da-d]\)|Answer|Ans:|Key:|$))/gi;

  const rawOptions: string[] = [];
  let optMatch: RegExpExecArray | null;
  while ((optMatch = optPattern.exec(block)) !== null) {
    const text = optMatch[1].trim();
    if (text.length > 0 && rawOptions.length < 4) {
      rawOptions.push(text);
    }
  }

  const options =
    rawOptions.length >= 2
      ? rawOptions.map((optText, idx) => ({
          id: optLabels[idx] || String(idx),
          text: normalizeMathAndLatex(optText.replace(/\n+/g, ' ').trim()),
        }))
      : undefined;

  // 3. Extract Answer Key
  let correctAnswer = 'A';
  let correctAnswers: string[] | undefined;
  let exactNumericalValue: number | string | undefined;
  let acceptableRange: { min: number; max: number; tolerance?: number } | undefined;

  const ansMatch = block.match(
    /(?:Answer|Correct\s*Option|Key|Ans|Correct\s*Answer)\s*[:\-]?\s*(?:\(?([A-D](?:\s*,\s*[A-D])*)\)?|([-+]?\d*\.?\d+(?:\s*(?:to|-)\s*[-+]?\d*\.?\d+)?))/i
  );

  if (ansMatch) {
    const rawAns = (ansMatch[1] || ansMatch[2] || '').trim();
    if (/[A-D]/i.test(rawAns)) {
      if (rawAns.includes(',')) {
        correctAnswers = rawAns.split(',').map((s) => s.trim().toUpperCase());
        correctAnswer = correctAnswers[0];
      } else {
        correctAnswer = rawAns.toUpperCase();
      }
    } else if (rawAns) {
      if (rawAns.includes('to') || rawAns.includes('-')) {
        const parts = rawAns.split(/to|-/i).map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
        if (parts.length >= 2) {
          acceptableRange = { min: Math.min(parts[0], parts[1]), max: Math.max(parts[0], parts[1]) };
          exactNumericalValue = (parts[0] + parts[1]) / 2;
        }
      } else {
        const num = parseFloat(rawAns);
        if (!isNaN(num)) {
          exactNumericalValue = num;
          acceptableRange = { min: num, max: num, tolerance: 0.05 };
        }
      }
    }
  }

  // 4. Extract Explanation
  let explanation = '';
  const expMatch = block.match(/(?:Explanation|Solution|Derivation)\s*[:\-]?\s*([\s\S]*?)$/i);
  if (expMatch) {
    explanation = normalizeMathAndLatex(expMatch[1].replace(/\n+/g, ' ').trim());
  }

  // 5. Extract Question Body
  let bodyText = block
    .replace(/^(?:Q(?:uestion)?\.?\s*\d+[a-z]?|\d+\.)\s*[:\.]?\s*/i, '')
    .replace(/(?:Answer|Correct\s*Option|Key|Ans|Correct\s*Answer)[\s\S]*$/i, '')
    .replace(/(?:Explanation|Solution)[\s\S]*$/i, '');

  if (options) {
    for (const opt of options) {
      bodyText = bodyText.replace(opt.text, '');
    }
  }

  const questionText = normalizeMathAndLatex(bodyText.replace(/\n+/g, ' ').trim());

  // 6. Detect Type
  let detectedType: 'MCQ' | 'MSQ' | 'NAT' = 'MCQ';
  if (correctAnswers && correctAnswers.length > 1) {
    detectedType = 'MSQ';
  } else if (!options || options.length < 2) {
    detectedType = 'NAT';
  } else if (/select all|choose all that apply|which of the following are/i.test(questionText)) {
    detectedType = 'MSQ';
  }

  // 7. Validation
  const valErrors: string[] = [];
  if (questionText.length < 15) {
    valErrors.push('Extracted question text is too short');
  }

  if (detectedType === 'MCQ' && options) {
    const val = validateMcqPayload(options, correctAnswer || 'A');
    if (!val.isValid) valErrors.push(...val.errors);
  } else if (detectedType === 'MSQ' && options) {
    const val = validateMsqPayload(options, correctAnswers || [correctAnswer || 'A']);
    if (!val.isValid) valErrors.push(...val.errors);
  }

  const validationStatus =
    valErrors.length === 0 ? 'STRUCTURALLY_VALID' : 'NEEDS_ACADEMIC_REVIEW';

  return {
    questionNo,
    questionType: detectedType,
    questionText,
    diagramNeeded,
    options,
    correctAnswer: correctAnswer || 'A',
    correctAnswers,
    exactNumericalValue,
    acceptableNumericalRange: acceptableRange,
    explanation: explanation || `Solution for ${meta.paperCode} Question ${questionNo}.`,
    marks: detectedType === 'NAT' ? 2 : 1,
    negativeMarking: detectedType === 'MCQ' ? 0.33 : 0,
    sourceUrl: `pdf://${meta.fileName}`,
    sourceTitle: meta.fileName,
    sourceCategory: meta.sourceCategory,
    year: meta.year,
    examName: meta.examName,
    paperCode: meta.paperCode,
    subjectName: meta.subjectName,
    topicName: meta.topicName,
    validationStatus,
    validationErrors: valErrors,
  };
}

/**
 * Resilient fallback stream extractor that parses literal and array text operators from raw PDF streams
 * if the serverless PDF.js runtime fails to resolve.
 */
function extractTextFromPdfStreamFallback(bytes: Uint8Array): string {
  try {
    let binary = '';
    const len = bytes.byteLength;
    const chunk = 8192;
    for (let i = 0; i < len; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, Math.min(i + chunk, len))));
    }

    const textSnippets: string[] = [];

    // Match (text) Tj
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let match: RegExpExecArray | null;
    while ((match = tjRegex.exec(binary)) !== null) {
      const clean = match[1].replace(/\\([()\\])/g, '$1').trim();
      if (clean && clean.length > 1) textSnippets.push(clean);
    }

    // Match [(t)(e)(x)(t)] TJ
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    while ((match = tjArrayRegex.exec(binary)) !== null) {
      const inner = match[1];
      const subMatches = inner.match(/\(([^)]*)\)/g);
      if (subMatches) {
        const combined = subMatches
          .map((s) => s.slice(1, -1).replace(/\\([()\\])/g, '$1'))
          .join('');
        if (combined.trim() && combined.trim().length > 1) {
          textSnippets.push(combined.trim());
        }
      }
    }

    return textSnippets.join('\n');
  } catch (err) {
    console.warn('Error during fallback PDF stream extraction:', err);
    return '';
  }
}
