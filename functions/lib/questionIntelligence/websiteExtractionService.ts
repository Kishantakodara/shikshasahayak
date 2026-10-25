// ============================================================
// QUESTION INTELLIGENCE ENGINE - WEBSITE TO QUESTION EXTRACTION
// Safe SSRF-protected extraction pipeline with modular site adapters
// ============================================================

import { Env } from '../contentEngine';
import { MasterQuestion, McqOptionSpec, MsqOptionSpec } from '../../../src/types';
import { validateMcqPayload, validateMsqPayload } from './validationService';
import { detectDuplicateQuestion, detectDuplicateQuestionAsync } from './duplicateDetectionService';
import { enqueueQuestion } from './ingestionQueueService';

export interface ExtractedQuestionCandidate {
  questionNo: string;
  questionType: 'MCQ' | 'MSQ' | 'NAT';
  questionText: string;
  questionHtml?: string;
  imageUrl?: string;
  diagramNeeded?: boolean;
  options?: Array<{ id: string; text: string; imageUrl?: string }>;
  correctAnswer?: string;
  correctAnswers?: string[];
  exactNumericalValue?: number | string;
  acceptableNumericalRange?: { min: number; max: number; tolerance?: number };
  explanation?: string;
  marks?: number;
  negativeMarking?: number;
  sourceUrl: string;
  sourceTitle?: string;
  sourceCategory?: string;
  year?: number;
  examName?: string;
  paperCode?: string;
  subjectName?: string;
  topicName?: string;
  isDuplicateCandidate?: boolean;
  duplicateMatchedId?: string;
  duplicateConfidence?: number;
  validationStatus: 'STRUCTURALLY_VALID' | 'NEEDS_ACADEMIC_REVIEW' | 'INVALID';
  validationErrors: string[];
}

export interface WebsiteExtractionResult {
  success: boolean;
  sourceUrl: string;
  sourceTitle: string;
  examName: string;
  paperCode: string;
  subjectName?: string;
  topicName?: string;
  discoveredQuestionsCount: number;
  successfullyParsedCount: number;
  rejectedCount: number;
  duplicateCount: number;
  discoveredSubpageUrls?: string[];
  isMultiPageTest?: boolean;
  totalPagesExtracted?: number;
  totalPagesTotal?: number;
  questions: ExtractedQuestionCandidate[];
  enqueuedItemIds: string[];
  blockerMessage?: string;
  error?: string;
}

/**
  Strict SSRF Protection Validator.
  Disallows internal IPs, link-local, cloud metadata, and invalid protocols.
 */
export function validateUrlForSsrf(targetUrl: string): { isSafe: boolean; reason?: string } {
  try {
    const parsed = new URL(targetUrl);

    // 1. Protocol check
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isSafe: false, reason: `Disallowed protocol '${parsed.protocol}'. Only HTTP and HTTPS are permitted.` };
    }

    const host = parsed.hostname.toLowerCase();

    // 2. Loopback & localhost check
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') {
      return { isSafe: false, reason: 'Access to localhost / loopback addresses is strictly forbidden.' };
    }

    // 3. Cloud metadata endpoints
    if (
      host === '169.254.169.254' ||
      host === 'metadata.google.internal' ||
      host.endsWith('.metadata.google.internal') ||
      host === 'instance-data'
    ) {
      return { isSafe: false, reason: 'Access to cloud instance metadata services is strictly forbidden.' };
    }

    // 4. Private IPv4 ranges
    // 10.0.0.0/8
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      return { isSafe: false, reason: 'Access to RFC 1918 private network (10.0.0.0/8) is forbidden.' };
    }
    // 172.16.0.0/12
    const m172 = host.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
    if (m172) {
      const secondOctet = parseInt(m172[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) {
        return { isSafe: false, reason: 'Access to RFC 1918 private network (172.16.0.0/12) is forbidden.' };
      }
    }
    // 192.168.0.0/16
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) {
      return { isSafe: false, reason: 'Access to RFC 1918 private network (192.168.0.0/16) is forbidden.' };
    }
    // 169.254.0.0/16 (Link Local)
    if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(host)) {
      return { isSafe: false, reason: 'Access to link-local address (169.254.0.0/16) is forbidden.' };
    }

    // 5. Internal domain extensions
    if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.lan') || host.endsWith('.corp')) {
      return { isSafe: false, reason: `Access to internal domain '${host}' is forbidden.` };
    }

    return { isSafe: true };
  } catch (err: any) {
    return { isSafe: false, reason: `Malformed URL: ${err.message}` };
  }
}

/**
  Normalizes mathematical formulas and converts standard HTML math representations to LaTeX.
 */
export function normalizeMathAndLatex(rawHtmlOrText: string): string {
  if (!rawHtmlOrText) return '';
  return rawHtmlOrText
    .replace(/\[latex\]([\s\S]*?)\[\/latex\]/gi, (_m, inner) => `\\(${inner.trim()}\\)`)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&plusmn;/gi, '±')
    .replace(/&times;/gi, '×')
    .replace(/&divide;/gi, '÷')
    .replace(/&le;/gi, '≤')
    .replace(/&ge;/gi, '≥')
    .replace(/&ne;/gi, '≠')
    .replace(/&infin;/gi, '∞')
    .replace(/&Alpha;/gi, 'Α')
    .replace(/&alpha;/gi, 'α')
    .replace(/&Beta;/gi, 'Β')
    .replace(/&beta;/gi, 'β')
    .replace(/&Gamma;/gi, 'Γ')
    .replace(/&gamma;/gi, 'γ')
    .replace(/&Delta;/gi, 'Δ')
    .replace(/&delta;/gi, 'δ')
    .replace(/&pi;/gi, 'π')
    .replace(/&Omega;/gi, 'Ω')
    .replace(/&omega;/gi, 'ω')
    .replace(/&theta;/gi, 'θ')
    .replace(/&sigma;/gi, 'σ')
    .replace(/<sup>(.*?)<\/sup>/gi, '^($1)')
    .replace(/<sub>(.*?)<\/sub>/gi, '_($1)')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&hellip;/gi, '…')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .trim();
}

/**
  Cleans and strips unnecessary HTML while preserving essential formatting and code blocks.
 */
function cleanHtmlSnippet(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .trim();
}

/**
  Parses a structured PracticePaper question from its JSON object.
 */
function parsePracticePaperQuestion(
  q: any,
  sourceUrl: string,
  pageTitle: string,
  meta: {
    examName?: string;
    paperCode?: string;
    subjectName?: string;
    topicName?: string;
    year?: number;
    sourceCategory?: string;
  }
): ExtractedQuestionCandidate | null {
  if (!q || !q.text) return null;

  const optLabels = ['A', 'B', 'C', 'D'];
  const rawText = String(q.text || '');

  // Check for image or circuit diagram in text or solution
  const imgMatch =
    rawText.match(/<img[^>]+src=["']([^"']+)["']/i) ||
    (q.solution ? String(q.solution).match(/<img[^>]+src=["']([^"']+)["']/i) : null);
  const imageUrl = imgMatch ? imgMatch[1] : undefined;
  const diagramNeeded =
    Boolean(imageUrl) || /circuit|diagram|schematic|figure|graph|truth table|karnaugh/i.test(rawText);

  // Clean and normalize text
  const cleanText = normalizeMathAndLatex(
    rawText
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<img[^>]+>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );

  const rawSolution = q.solution ? String(q.solution) : '';
  const explanation = normalizeMathAndLatex(
    rawSolution
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<img[^>]+>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );

  let detectedType: 'MCQ' | 'MSQ' | 'NAT' = 'MCQ';
  const typeUpper = String(q.type || '').toUpperCase();
  if (typeUpper === 'NAT' || q.ansMin !== undefined) {
    detectedType = 'NAT';
  } else if (typeUpper === 'MSQ' || Array.isArray(q.correct)) {
    detectedType = 'MSQ';
  }

  // Options
  let options: Array<{ id: string; text: string; imageUrl?: string }> | undefined;
  if (detectedType !== 'NAT' && Array.isArray(q.options) && q.options.length > 0) {
    options = q.options.map((opt: any, idx: number) => {
      const optStr = typeof opt === 'string' ? opt : String(opt?.text || opt || '');
      const oImg = optStr.match(/<img[^>]+src=["']([^"']+)["']/i);
      const optClean = normalizeMathAndLatex(
        optStr
          .replace(/<img[^>]+>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      );
      return {
        id: optLabels[idx] || String(idx),
        text: optClean,
        imageUrl: oImg ? oImg[1] : undefined,
      };
    });
  }

  // Answers
  let correctAnswer = 'A';
  let correctAnswers: string[] | undefined;
  let exactNumericalValue: number | string | undefined;
  let acceptableNumericalRange: { min: number; max: number; tolerance?: number } | undefined;

  if (detectedType === 'NAT') {
    const minVal = q.ansMin !== undefined ? Number(q.ansMin) : undefined;
    const maxVal = q.ansMax !== undefined ? Number(q.ansMax) : minVal;
    if (minVal !== undefined) {
      exactNumericalValue = minVal;
      acceptableNumericalRange = { min: minVal, max: maxVal ?? minVal, tolerance: 0 };
      correctAnswer = String(minVal);
    }
  } else if (detectedType === 'MSQ') {
    if (Array.isArray(q.correct)) {
      correctAnswers = q.correct.map((c: any) =>
        typeof c === 'number' ? (optLabels[c] || 'A') : String(c).toUpperCase()
      );
      correctAnswer = correctAnswers?.[0] || 'A';
    } else if (typeof q.correct === 'number') {
      correctAnswers = [optLabels[q.correct] || 'A'];
      correctAnswer = correctAnswers[0];
    }
  } else {
    // MCQ
    if (typeof q.correct === 'number') {
      correctAnswer = optLabels[q.correct] || 'A';
    } else if (typeof q.correct === 'string') {
      correctAnswer = q.correct.toUpperCase();
    }
  }

  // Year from tag1 if available (e.g. "GATE CSE 2026 SET-2")
  let year = meta.year || 2026;
  if (q.tag1) {
    const yMatch = String(q.tag1).match(/\b(20\d{2})\b/);
    if (yMatch) year = parseInt(yMatch[1], 10);
  }

  return {
    questionNo: String(q.number || q.id || 1),
    questionType: detectedType,
    questionText: cleanText,
    questionHtml: rawText,
    imageUrl,
    diagramNeeded,
    options,
    correctAnswer,
    correctAnswers,
    exactNumericalValue,
    acceptableNumericalRange,
    explanation: explanation || `Solution for ${meta.paperCode || 'GATE'} Question ${q.number || 1}.`,
    marks: q.marks || (detectedType === 'NAT' ? 2 : 1),
    negativeMarking: detectedType === 'MCQ' ? (q.marks === 2 ? 0.67 : 0.33) : 0,
    sourceUrl,
    sourceTitle: pageTitle,
    sourceCategory: meta.sourceCategory || 'LICENSED_RESOURCE',
    year,
    examName: meta.examName || 'GATE 2027',
    paperCode: meta.paperCode || 'CS',
    subjectName: q.tag2 || meta.subjectName || 'Core Subject',
    topicName: q.tag2 || meta.topicName || 'General Topic',
    validationStatus: 'STRUCTURALLY_VALID',
    validationErrors: [],
  };
}

/**
  Parses a raw HTML document into distinct candidate questions using modular adapters.
 */
export function parseQuestionsFromHtml(
  html: string,
  sourceUrl: string,
  contextMeta: {
    examName?: string;
    paperCode?: string;
    subjectName?: string;
    topicName?: string;
    year?: number;
    sourceCategory?: string;
  }
): { questions: ExtractedQuestionCandidate[]; discoveredSubpageUrls: string[] } {
  const questions: ExtractedQuestionCandidate[] = [];
  const discoveredSubpageUrls: string[] = [];

  // Extract page title from raw HTML before stripping
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const sourceTitle = titleMatch ? titleMatch[1].trim() : 'Web Extracted Resource';

  // 1. PRACTICEPAPER.IN / QUIZ JSON EMBED ADAPTER:
  // Check for embedded JSON payload in <script id="pp-quiz-data"> BEFORE cleanHtmlSnippet strips scripts
  const ppQuizMatch = html.match(/<script[^>]*id=['"]pp-quiz-data['"][^>]*>([\s\S]*?)<\/script>/i);
  if (ppQuizMatch) {
    try {
      const quizData = JSON.parse(ppQuizMatch[1]);
      const quizTitle = quizData?.meta?.pageTitle || quizData?.meta?.quizName || sourceTitle;
      const rawQuestions: any[] = Array.isArray(quizData?.questions) ? quizData.questions : [];

      for (const q of rawQuestions) {
        const qCandidate = parsePracticePaperQuestion(q, sourceUrl, quizTitle, contextMeta);
        if (qCandidate && qCandidate.questionText.length > 10) {
          questions.push(qCandidate);
        }
      }
    } catch (err) {
      console.warn('Failed to parse pp-quiz-data JSON:', err);
    }
  }

  const cleaned = cleanHtmlSnippet(html);

  // 2. Discover potential question sub-links on the page (within same domain)
  try {
    const urlObj = new URL(sourceUrl);
    const linkRegex = /href=["']([^"']+)["']/gi;
    let lMatch: RegExpExecArray | null;
    while ((lMatch = linkRegex.exec(cleaned)) !== null) {
      const href = lMatch[1];
      if (
        (href.includes('/question/') ||
          href.includes('/gate/') ||
          href.includes('/gate-cse/') ||
          href.includes('/pyq/')) &&
        !href.includes('#') &&
        !href.endsWith('.pdf') &&
        !href.endsWith('.png') &&
        !href.endsWith('.jpg') &&
        !href.endsWith('/feed')
      ) {
        try {
          const absolute = new URL(href, sourceUrl).toString();
          if (new URL(absolute).hostname === urlObj.hostname && !discoveredSubpageUrls.includes(absolute)) {
            discoveredSubpageUrls.push(absolute);
          }
        } catch {}
      }
    }
  } catch {}

  // If questions were already parsed via pp-quiz-data, return early
  if (questions.length > 0) {
    return { questions, discoveredSubpageUrls };
  }

  // 3. ADAPTER B: Question containers with class names or IDs matching question patterns
  // E.g. class="question-card", "question-wrapper", "question-block", "pp-question-card", "mcq-block"
  const cardPatterns = [
    /<div[^>]*class=["'][^"']*(?:pp-question-card|question-card|question-item|question-wrapper|exam-question|pyq-card|mcq-block)[^"']*["'][^>]*>([\s\S]*?)<\/div>(?=\s*<div[^>]*class=["'][^"']*(?:pp-question-card|question-card|question-item|question-wrapper|exam-question|pyq-card|mcq-block)|$)/gi,
    /<article[^>]*>([\s\S]*?)<\/article>/gi,
    /<li[^>]*class=["'][^"']*(?:question|mcq|item)[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi,
  ];

  let rawBlocks: string[] = [];
  for (const pat of cardPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pat.exec(cleaned)) !== null) {
      if (match[1] && match[1].length > 40) {
        rawBlocks.push(match[1]);
      }
    }
    if (rawBlocks.length > 0) break;
  }

  // Fallback: If no cards found, split by question numbering like "Q.1", "Q 1.", "Question 1:", "Q1:"
  if (rawBlocks.length === 0) {
    const splitRegex = /(?:<p>|<div[^>]*>)?\s*(?:Q(?:uestion)?\.?\s*(\d+)\s*[:\.]?)/gi;
    const parts = cleaned.split(splitRegex);
    if (parts.length > 2) {
      for (let i = 1; i < parts.length; i += 2) {
        const qNum = parts[i];
        const content = parts[i + 1] || '';
        rawBlocks.push(`<strong>Question ${qNum}:</strong> ${content}`);
      }
    }
  }

  // 4. Process each candidate question block
  let autoIdx = 1;
  for (const block of rawBlocks) {
    const qCandidate = parseSingleQuestionBlock(block, autoIdx, sourceUrl, sourceTitle, contextMeta);
    if (qCandidate && qCandidate.questionText.length > 15) {
      questions.push(qCandidate);
      autoIdx++;
    }
  }

  // Fallback if entire single-question page was parsed as a single unit
  if (questions.length === 0 && (cleaned.includes('Question') || cleaned.includes('Q.'))) {
    const singleQ = parseSingleQuestionBlock(cleaned, 1, sourceUrl, sourceTitle, contextMeta);
    if (singleQ && singleQ.questionText.length > 20) {
      questions.push(singleQ);
    }
  }

  return { questions, discoveredSubpageUrls };
}

/**
  Parses a single HTML block into an ExtractedQuestionCandidate.
 */
function parseSingleQuestionBlock(
  block: string,
  fallbackIdx: number,
  sourceUrl: string,
  sourceTitle: string,
  meta: {
    examName?: string;
    paperCode?: string;
    subjectName?: string;
    topicName?: string;
    year?: number;
    sourceCategory?: string;
  }
): ExtractedQuestionCandidate | null {
  // A. Extract Question Number
  const qNoMatch = block.match(/(?:Q(?:uestion)?\.?\s*(\d+[a-z]?)|#\s*(\d+))/i);
  const questionNo = qNoMatch ? (qNoMatch[1] || qNoMatch[2]) : String(fallbackIdx);

  // Image & Circuit Diagram Detection
  const imgMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i);
  const imageUrl = imgMatch ? imgMatch[1] : undefined;
  const diagramNeeded =
    Boolean(imageUrl) || /circuit|diagram|schematic|figure|graph|truth table|karnaugh/i.test(block);

  // B. Extract Options (A, B, C, D)
  const options: Array<{ id: string; text: string; imageUrl?: string }> = [];
  const optLabels = ['A', 'B', 'C', 'D'];

  // Pattern 1: (A) Text (B) Text (C) Text (D) Text
  const optRegex = /(?:\([A-D]\)|[A-D]\.|\b[A-D]\))\s*([^(\n<]+)/gi;
  let oMatch: RegExpExecArray | null;
  const foundTexts: string[] = [];

  // Look for structured radio/label options first
  const labelMatches = block.match(/<(?:label|div|span)[^>]*class=["'][^"']*(?:option|choice|pp-option)[^"']*["'][^>]*>([\s\S]*?)<\/(?:label|div|span)>/gi);
  if (labelMatches && labelMatches.length >= 2) {
    labelMatches.slice(0, 4).forEach((lm, idx) => {
      const oImg = lm.match(/<img[^>]+src=["']([^"']+)["']/i);
      const cleanText = lm.replace(/<[^>]+>/g, '').replace(/^[A-D][\.\)]\s*/i, '').trim();
      if (cleanText) {
        options.push({
          id: optLabels[idx] || String(idx),
          text: normalizeMathAndLatex(cleanText),
          imageUrl: oImg ? oImg[1] : undefined,
        });
      }
    });
  } else {
    while ((oMatch = optRegex.exec(block)) !== null) {
      const text = oMatch[1].replace(/<[^>]+>/g, '').trim();
      if (text.length > 0 && foundTexts.length < 4) {
        foundTexts.push(text);
      }
    }
    if (foundTexts.length >= 2) {
      foundTexts.forEach((t, idx) => {
        options.push({ id: optLabels[idx] || String(idx), text: normalizeMathAndLatex(t) });
      });
    }
  }

  // C. Extract Correct Answer
  let correctAnswer = '';
  let correctAnswers: string[] | undefined;
  let exactNumericalValue: number | string | undefined;
  let acceptableRange: { min: number; max: number; tolerance?: number } | undefined;

  const ansMatch = block.match(/(?:Answer|Correct\s*Option|Key|Ans|Correct\s*Answer)\s*[:\-]?\s*(?:<b>|<strong>)?\s*(?:\(?([A-D](?:\s*,\s*[A-D])*)\)?|([-+]?\d*\.?\d+(?:\s*(?:to|-)\s*[-+]?\d*\.?\d+)?))/i);

  if (ansMatch) {
    const rawAns = (ansMatch[1] || ansMatch[2] || '').trim();
    if (/[A-D]/i.test(rawAns)) {
      if (rawAns.includes(',')) {
        // MSQ multiple answers
        correctAnswers = rawAns.split(',').map(s => s.trim().toUpperCase());
        correctAnswer = correctAnswers[0];
      } else {
        correctAnswer = rawAns.toUpperCase();
      }
    } else if (rawAns) {
      // Numerical Answer (NAT)
      if (rawAns.includes('to') || rawAns.includes('-')) {
        const parts = rawAns.split(/to|-/i).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
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

  // D. Extract Explanation / Solution
  let explanation = '';
  const expMatch = block.match(/(?:Explanation|Solution|Step-by-step\s*Solution)\s*[:\-]?\s*([\s\S]*?)(?:<\/div>|<\/article>|<div[^>]*class=["']question|$)/i);
  if (expMatch) {
    explanation = normalizeMathAndLatex(expMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  }

  // E. Extract Question Text
  // Strip out options, answer section, and explanation from raw block to obtain question body
  let bodyText = block
    .replace(/(?:Answer|Correct\s*Option|Key|Ans|Correct\s*Answer)[\s\S]*$/i, '')
    .replace(/(?:Explanation|Solution)[\s\S]*$/i, '');

  if (options.length > 0) {
    for (const opt of options) {
      bodyText = bodyText.replace(opt.text, '');
    }
  }

  const rawCleanedText = bodyText
    .replace(/<[^>]+>/g, ' ')
    .replace(/^Q(?:uestion)?\.?\s*\d+\s*[:\.]?/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  const questionText = normalizeMathAndLatex(rawCleanedText);

  // F. Detect Question Type
  let detectedType: 'MCQ' | 'MSQ' | 'NAT' = 'MCQ';
  if (correctAnswers && correctAnswers.length > 1) {
    detectedType = 'MSQ';
  } else if (options.length === 0 && (exactNumericalValue !== undefined || acceptableRange !== undefined)) {
    detectedType = 'NAT';
  } else if (block.toLowerCase().includes('multiple select') || block.toLowerCase().includes('msq')) {
    detectedType = 'MSQ';
  } else if (block.toLowerCase().includes('numerical answer') || block.toLowerCase().includes('nat')) {
    detectedType = 'NAT';
  }

  // G. Validation Check
  const valErrors: string[] = [];
  if (!questionText || questionText.length < 10) {
    valErrors.push('Extracted question text is too short or missing');
  }

  if (detectedType === 'MCQ') {
    const mcqVal = validateMcqPayload(options, correctAnswer || 'A');
    if (!mcqVal.isValid) valErrors.push(...mcqVal.errors);
  } else if (detectedType === 'MSQ') {
    const msqVal = validateMsqPayload(options, correctAnswers || [correctAnswer || 'A']);
    if (!msqVal.isValid) valErrors.push(...msqVal.errors);
  } else if (detectedType === 'NAT') {
    if (exactNumericalValue === undefined && !acceptableRange) {
      valErrors.push('NAT question requires an exact numerical answer or acceptable range');
    }
  }

  const validationStatus: 'STRUCTURALLY_VALID' | 'NEEDS_ACADEMIC_REVIEW' | 'INVALID' =
    valErrors.length === 0 ? 'STRUCTURALLY_VALID' : !correctAnswer && !exactNumericalValue ? 'NEEDS_ACADEMIC_REVIEW' : 'INVALID';

  return {
    questionNo,
    questionType: detectedType,
    questionText,
    questionHtml: null as any,
    imageUrl,
    diagramNeeded,
    options: options.length > 0 ? options : undefined,
    correctAnswer: correctAnswer || (options[0]?.id || 'A'),
    correctAnswers,
    exactNumericalValue,
    acceptableNumericalRange: acceptableRange,
    explanation: explanation || `Solution for ${meta.paperCode || 'GATE'} Question ${questionNo}.`,
    marks: detectedType === 'NAT' ? 2 : 1,
    negativeMarking: detectedType === 'MCQ' ? 0.33 : 0,
    sourceUrl,
    sourceTitle,
    sourceCategory: meta.sourceCategory || 'PERMITTED_WEB_SOURCE',
    year: meta.year || 2024,
    examName: meta.examName || 'GATE 2027',
    paperCode: meta.paperCode || 'CS',
    subjectName: meta.subjectName || `${meta.paperCode || 'GATE'} Core Subject`,
    topicName: meta.topicName || 'General Topic',
    validationStatus,
    validationErrors: valErrors,
  };
}

/**
  Pagination Plan for multi-page tests and question palettes.
 */
export interface PaginationPlan {
  isMultiPage: boolean;
  totalPages: number;
  totalQuestionsExpected?: number;
  pageUrls: string[];
}

/**
  Discovers and plans multi-page test navigation for websites that distribute
  questions across multiple paginated pages (e.g. PracticePaper question palettes,
  range buttons "1-5", "6-10", "11-15", Sanfoundry, or WordPress quiz pagination).
 */
export function extractPaginationPlan(html: string, sourceUrl: string): PaginationPlan {
  let currentObj: URL;
  try {
    currentObj = new URL(sourceUrl);
  } catch {
    return { isMultiPage: false, totalPages: 1, pageUrls: [sourceUrl] };
  }

  const cleanBase = `${currentObj.origin}${currentObj.pathname}`;

  // 1. PracticePaper / JSON Quiz Embed Adapter
  const ppQuizMatch = html.match(/<script[^>]*id=['"]pp-quiz-data['"][^>]*>([\s\S]*?)<\/script>/i);
  if (ppQuizMatch) {
    try {
      const quizData = JSON.parse(ppQuizMatch[1]);
      const totalPages = Number(quizData?.meta?.totalPages || 1);
      const totalQuestions = Number(quizData?.meta?.totalQuestions || 0);
      if (totalPages > 1) {
        const pageUrls: string[] = [];
        const maxPages = Math.min(totalPages, 30);
        for (let p = 1; p <= maxPages; p++) {
          pageUrls.push(p === 1 ? cleanBase : `${cleanBase}?page_no=${p}`);
        }
        return {
          isMultiPage: true,
          totalPages,
          totalQuestionsExpected: totalQuestions,
          pageUrls,
        };
      }
    } catch (err) {
      console.warn('extractPaginationPlan failed to parse pp-quiz-data:', err);
    }
  }

  // 2. Discover pagination links via HTML anchors, range tabs, and pagination bars
  const discovered = new Set<string>();
  discovered.add(cleanBase);

  // Match links with query parameters like ?page_no=N, ?page=N, ?p=N, or path /page/N/
  const linkRegex = /<a[^>]+href=["']([^"']*(?:page_no|page|p|start)=\d+[^"']*|\/[^"']*\/page\/\d+\/?[^"']*)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const href = match[1];
      const abs = new URL(href, sourceUrl).toString();
      const absObj = new URL(abs);
      if (
        absObj.hostname === currentObj.hostname &&
        absObj.pathname.startsWith(currentObj.pathname.split('/page/')[0])
      ) {
        discovered.add(abs);
      }
    } catch {}
  }

  // Check palette range buttons (e.g. data-page="2" or class="pp-set-tab")
  const dataPageRegex = /<a[^>]+data-page=["'](\d+)["'][^>]*href=["']([^"']+)["']/gi;
  let dpMatch: RegExpExecArray | null;
  while ((dpMatch = dataPageRegex.exec(html)) !== null) {
    try {
      const abs = new URL(dpMatch[2], sourceUrl).toString();
      if (new URL(abs).hostname === currentObj.hostname) {
        discovered.add(abs);
      }
    } catch {}
  }

  // Also check <link rel="next"> or <a rel="next">
  const nextMatch = html.match(/<(?:link|a)[^>]+rel=["']next["'][^>]+href=["']([^"']+)["']/i);
  if (nextMatch) {
    try {
      const absNext = new URL(nextMatch[1], sourceUrl).toString();
      if (new URL(absNext).hostname === currentObj.hostname) {
        discovered.add(absNext);
      }
    } catch {}
  }

  if (discovered.size > 1) {
    const urls = Array.from(discovered).slice(0, 30);
    return {
      isMultiPage: true,
      totalPages: urls.length,
      pageUrls: urls,
    };
  }

  return {
    isMultiPage: false,
    totalPages: 1,
    pageUrls: [sourceUrl],
  };
}

/**
  Main Server-Side Ingestion Pipeline for a Website URL.
  Performs SSRF check -> HTTP Fetch -> Extraction -> Multi-Page Discovery -> Deduplication -> Queue Staging.
 */
export async function executeWebsiteExtraction(
  env: Env,
  targetUrl: string,
  meta: {
    examName?: string;
    paperCode?: string;
    subjectName?: string;
    topicName?: string;
    year?: number;
    sourceCategory?: string;
  }
): Promise<WebsiteExtractionResult> {
  // 1. SSRF Check
  const ssrf = validateUrlForSsrf(targetUrl);
  if (!ssrf.isSafe) {
    return {
      success: false,
      sourceUrl: targetUrl,
      sourceTitle: 'Blocked Target',
      examName: meta.examName || 'GATE 2027',
      paperCode: meta.paperCode || 'CS',
      discoveredQuestionsCount: 0,
      successfullyParsedCount: 0,
      rejectedCount: 0,
      duplicateCount: 0,
      questions: [],
      enqueuedItemIds: [],
      blockerMessage: `SSRF Security Block: ${ssrf.reason}`,
      error: ssrf.reason,
    };
  }

  // 2. Fetch remote page with timeout and size limit
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
  } catch (fetchErr: any) {
    clearTimeout(timeoutId);
    return {
      success: false,
      sourceUrl: targetUrl,
      sourceTitle: 'Fetch Error',
      examName: meta.examName || 'GATE 2027',
      paperCode: meta.paperCode || 'CS',
      discoveredQuestionsCount: 0,
      successfullyParsedCount: 0,
      rejectedCount: 0,
      duplicateCount: 0,
      questions: [],
      enqueuedItemIds: [],
      blockerMessage: `Remote fetch failed or timed out: ${fetchErr.message}`,
      error: fetchErr.message,
    };
  } finally {
    clearTimeout(timeoutId);
  }

  // 3. Status and Access Check
  if (!response.ok) {
    const isForbidden = response.status === 403 || response.status === 401;
    return {
      success: false,
      sourceUrl: targetUrl,
      sourceTitle: 'Access Restricted',
      examName: meta.examName || 'GATE 2027',
      paperCode: meta.paperCode || 'CS',
      discoveredQuestionsCount: 0,
      successfullyParsedCount: 0,
      rejectedCount: 0,
      duplicateCount: 0,
      questions: [],
      enqueuedItemIds: [],
      blockerMessage: isForbidden
        ? `Access Forbidden (HTTP ${response.status}). Site requires authentication or has anti-bot CAPTCHA active. Extraction halted.`
        : `Server returned HTTP ${response.status}: ${response.statusText}`,
      error: `HTTP ${response.status}`,
    };
  }

  const rawHtml = await response.text();

  // 4. Parse Questions and discovered subpages from initial page
  let { questions: initialQuestions, discoveredSubpageUrls } = parseQuestionsFromHtml(rawHtml, targetUrl, meta);
  let resolvedSourceTitle = initialQuestions[0]?.sourceTitle || 'Web Source';
  let allQuestions: ExtractedQuestionCandidate[] = [...initialQuestions];

  // 4b. Multi-Page Discovery & Batch Crawling:
  // If the test distributes questions across multiple paginated pages (e.g. Question Palette
  // with ranges like 1-5, 6-10, 11-15...), automatically extract all test pages.
  const paginationPlan = extractPaginationPlan(rawHtml, targetUrl);
  let pagesExtractedCount = 1;

  if (paginationPlan.isMultiPage && paginationPlan.pageUrls.length > 1) {
    const normalizeUrlKey = (u: string) => {
      try {
        const parsed = new URL(u);
        return `${parsed.origin}${parsed.pathname}${parsed.search}`;
      } catch {
        return u;
      }
    };
    const currentNorm = normalizeUrlKey(targetUrl);
    const pagesToFetch = paginationPlan.pageUrls.filter((u) => normalizeUrlKey(u) !== currentNorm);

    // Concurrently fetch remaining pages in safe batches of 4
    const BATCH_SIZE = 4;
    for (let i = 0; i < pagesToFetch.length; i += BATCH_SIZE) {
      const batch = pagesToFetch.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (pageUrl) => {
          const ssrfCheck = validateUrlForSsrf(pageUrl);
          if (!ssrfCheck.isSafe) return [];

          const pageController = new AbortController();
          const pageTimeout = setTimeout(() => pageController.abort(), 8000);
          try {
            const pageRes = await fetch(pageUrl, {
              signal: pageController.signal,
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
              },
              redirect: 'follow',
            });
            if (!pageRes.ok) return [];
            const pageHtml = await pageRes.text();
            const parsedSub = parseQuestionsFromHtml(pageHtml, pageUrl, meta);
            pagesExtractedCount++;
            return parsedSub.questions;
          } catch (pageErr) {
            console.warn(`Multi-page crawl failed for ${pageUrl}:`, pageErr);
            return [];
          } finally {
            clearTimeout(pageTimeout);
          }
        })
      );

      for (const qList of batchResults) {
        allQuestions.push(...qList);
      }
    }
  }

  // Deduplicate questions across multi-page boundaries by normalized text snippet
  const seenQuestionKeys = new Set<string>();
  const deduplicatedQuestions: ExtractedQuestionCandidate[] = [];
  for (const q of allQuestions) {
    const key = q.questionText.slice(0, 80).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seenQuestionKeys.has(key)) {
      seenQuestionKeys.add(key);
      deduplicatedQuestions.push(q);
    }
  }

  // Sort questions sequentially by question number (e.g., 1, 2, ... 56)
  deduplicatedQuestions.sort((a, b) => {
    const numA = parseInt(a.questionNo.replace(/\D/g, ''), 10);
    const numB = parseInt(b.questionNo.replace(/\D/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return 0;
  });

  let questions = deduplicatedQuestions;

  // If this was an index page and no direct questions were found, but subpages exist,
  // automatically attempt to extract questions from the first valid content subpage!
  if (questions.length === 0 && discoveredSubpageUrls.length > 0) {
    const candidateSub = discoveredSubpageUrls.find(
      (u) =>
        !u.endsWith('/feed') &&
        !u.includes('/my-bookmarked') &&
        !u.includes('/privacy') &&
        !u.includes('/about')
    );
    if (candidateSub) {
      try {
        const subRes = await fetch(candidateSub, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });
        if (subRes.ok) {
          const subHtml = await subRes.text();
          const subParsed = parseQuestionsFromHtml(subHtml, candidateSub, meta);
          if (subParsed.questions.length > 0) {
            questions = subParsed.questions;
            resolvedSourceTitle = questions[0]?.sourceTitle || 'Web Subpage Questions';
          }
        }
      } catch (subErr) {
        console.warn('Subpage resolution error:', subErr);
      }
    }
  }

  if (questions.length === 0) {
    return {
      success: true,
      sourceUrl: targetUrl,
      sourceTitle: 'No Questions Found',
      examName: meta.examName || 'GATE 2027',
      paperCode: meta.paperCode || 'CS',
      discoveredQuestionsCount: 0,
      successfullyParsedCount: 0,
      rejectedCount: 0,
      duplicateCount: 0,
      discoveredSubpageUrls,
      questions: [],
      enqueuedItemIds: [],
      blockerMessage: discoveredSubpageUrls.length > 0
        ? `No direct questions found on this index page, but ${discoveredSubpageUrls.length} individual topic links were discovered.`
        : 'Could not detect structured question formats on the provided page.',
    };
  }

  // 5. Run Duplicate Detection and Staging Queue insertion
  const enqueuedItemIds: string[] = [];
  let duplicateCount = 0;
  let rejectedCount = 0;

  // Prefetch existing questions once for fast in-memory similarity matching
  let dbRows: any[] = [];
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, question_text, subject_name, subject_code, question_type, exam_year, exam_name
       FROM master_question_bank LIMIT 500`
    ).all<Record<string, unknown>>();
    dbRows = results || [];
  } catch (dbErr) {
    console.warn('Could not prefetch master_question_bank rows for duplicate check:', dbErr);
  }

  for (const q of questions) {
    try {
      // A. Fast Duplicate Detection against in-memory dbRows
      const dup = detectDuplicateQuestion(dbRows, {
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

      // B. Enqueue candidate into staging queue
      const rawPayloadJson = JSON.stringify({
        ...q,
        imageUrl: q.imageUrl,
        diagramNeeded: q.diagramNeeded,
        ingestedAt: new Date().toISOString(),
        source: 'GATE_ZIP', // Fits schema check constraint
      });

      const queueItem = await enqueueQuestion(env, {
        source: 'GATE_ZIP',
        rawPayloadJson,
        extractedQuestionText: q.questionText,
        detectedType: q.questionType,
        confidenceScore: q.isDuplicateCandidate ? 0.3 : 0.9,
      });

      enqueuedItemIds.push(queueItem.id);
    } catch (enqueueErr) {
      console.error('Error staging extracted question:', enqueueErr);
    }
  }

  return {
    success: true,
    sourceUrl: targetUrl,
    sourceTitle: resolvedSourceTitle || questions[0]?.sourceTitle || 'Web Source',
    examName: meta.examName || 'GATE 2027',
    paperCode: meta.paperCode || 'CS',
    subjectName: meta.subjectName,
    topicName: meta.topicName,
    discoveredQuestionsCount: questions.length,
    successfullyParsedCount: questions.length - rejectedCount,
    rejectedCount,
    duplicateCount,
    discoveredSubpageUrls,
    isMultiPageTest: paginationPlan.isMultiPage,
    totalPagesExtracted: paginationPlan.isMultiPage ? pagesExtractedCount : 1,
    totalPagesTotal: paginationPlan.totalPages,
    questions,
    enqueuedItemIds,
  };
}
