// ============================================================
// QUESTION INTELLIGENCE ENGINE - GTU EXTRACTOR & SEGMENTER SERVICE
// Parses official GTU PDF papers, extracts text per page, segments
// question blocks, detects question types (MCQ, MSQ, NAT), assigns
// confidence scores, checks duplicates, and enqueues into staging queue.
// ============================================================

import { getDocumentProxy, extractText } from 'unpdf';
import { Env } from '../../contentEngine';
import { GtuPaperMetadata } from './gtuDiscoveryService';
import { normalizeQuestionText } from '../normalizationService';
import { detectDuplicateQuestionAsync } from '../duplicateDetectionService';
import { enqueueQuestion } from '../ingestionQueueService';
import { MasterQuestion } from '../../../../src/types';
import { convertLegacyGtuUrl } from '../../gtuPyqDiscoveryEngine';

export const INGESTION_LIMITS = {
  MAX_PAPERS_PER_INGESTION_RUN: 20,
  MAX_QUESTIONS_PER_BATCH: 100,
  MAX_QUEUE_ITEMS_PER_WORKER: 20,
  MAX_PDF_SIZE_BYTES: 15 * 1024 * 1024, // 15 MB
  MAX_PDF_PAGE_COUNT: 25,
  MAX_EXTRACTED_TEXT_BYTES: 500 * 1024, // 500 KB
  MAX_QUESTIONS_PER_PAPER: 50,
  MAX_RETRY_COUNT: 3,
  CONCURRENT_PAPER_FETCH_LIMIT: 3,
} as const;

export interface ExtractedQuestionBlock {
  paperId: string;
  sourceUrl: string;
  examName: 'GTU';
  examYear: number;
  examSession: 'WINTER' | 'SUMMER';
  subjectCode: string;
  subjectName: string;
  semester: number;
  originalPage: number;
  questionNo: string;
  subQuestionNo: string;
  rawText: string;
  cleanedText: string;
  options?: Array<{ id: string; text: string }>;
  detectedType: 'MCQ' | 'MSQ' | 'NAT' | null;
  confidenceScore: number;
  classificationReason: string;
  isDuplicateCandidate: boolean;
  duplicateMatchedId?: string;
}

export interface IngestionProcessingResult {
  success: boolean;
  paperId: string;
  sourceUrl: string;
  pdfByteSize?: number;
  pageCount?: number;
  extractedBlocks: ExtractedQuestionBlock[];
  enqueuedCount: number;
  duplicateCount: number;
  error?: string;
  durationMs: number;
}

/**
  Fetches PDF buffer with browser User-Agent header, response verification, and size limits.
 */
export async function fetchGtuPaperPdf(url: string): Promise<Uint8Array> {
  if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url.trim())) {
    throw new Error(`Invalid GTU paper URL: '${url}'`);
  }

  const cleanUrl = convertLegacyGtuUrl(url.trim());
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/pdf,application/xhtml+xml',
  };

  const res = await fetch(cleanUrl, { headers });
  if (res.status === 403) {
    throw new Error(`HTTP 403 Forbidden: Access denied by GTU server for '${cleanUrl}'`);
  }
  if (res.status === 404 || res.status === 502) {
    throw new Error(`HTTP ${res.status} Not Found: GTU paper not found at '${cleanUrl}'`);
  }
  if (res.status !== 200) {
    throw new Error(`Failed to fetch GTU paper PDF from '${cleanUrl}' (HTTP Status: ${res.status})`);
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('text/html') || contentType.includes('application/json')) {
    throw new Error(`Invalid response format: Expected PDF but received '${contentType}' from '${cleanUrl}'`);
  }

  const contentLength = res.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > INGESTION_LIMITS.MAX_PDF_SIZE_BYTES) {
    throw new Error(`Oversized PDF rejected: ${contentLength} bytes exceeds limit of ${INGESTION_LIMITS.MAX_PDF_SIZE_BYTES} bytes`);
  }

  const arrayBuffer = await res.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    throw new Error(`Empty PDF received (0 bytes) from '${cleanUrl}'`);
  }

  if (arrayBuffer.byteLength > INGESTION_LIMITS.MAX_PDF_SIZE_BYTES) {
    throw new Error(`Oversized PDF rejected: ${arrayBuffer.byteLength} bytes exceeds limit of ${INGESTION_LIMITS.MAX_PDF_SIZE_BYTES} bytes`);
  }

  const bytes = new Uint8Array(arrayBuffer);

  // Check magic header (%PDF- or %PDF: bytes 0x25, 0x50, 0x44, 0x46)
  if (bytes.length < 4 || bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
    const textPreview = new TextDecoder().decode(bytes.slice(0, 50)).trim();
    if (textPreview.startsWith('<!DOCTYPE') || textPreview.startsWith('<html') || textPreview.startsWith('{')) {
      throw new Error(`HTML or Challenge page returned instead of PDF from '${cleanUrl}'`);
    }
    throw new Error(`Corrupted or invalid PDF header received from '${cleanUrl}'`);
  }

  return bytes;
}

/**
  Parses text content from GTU PDF page-by-page with page count and text size limits.
 */
export async function extractPdfTextPages(
  pdfBuffer: Uint8Array
): Promise<Array<{ pageNum: number; text: string }>> {
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error('Cannot extract text from empty PDF buffer');
  }

  if (pdfBuffer.length > INGESTION_LIMITS.MAX_PDF_SIZE_BYTES) {
    throw new Error(`PDF buffer size (${pdfBuffer.length} bytes) exceeds limit of ${INGESTION_LIMITS.MAX_PDF_SIZE_BYTES} bytes`);
  }

  // Check magic header (%PDF)
  if (pdfBuffer.length < 4 || pdfBuffer[0] !== 0x25 || pdfBuffer[1] !== 0x50 || pdfBuffer[2] !== 0x44 || pdfBuffer[3] !== 0x46) {
    throw new Error('Corrupted or invalid PDF buffer');
  }

  try {
    const doc = await getDocumentProxy(pdfBuffer);
    const { totalPages, text } = await extractText(doc, { mergePages: false });
    const pages: Array<{ pageNum: number; text: string }> = [];

    const pageCount = Array.isArray(text) ? text.length : totalPages;
    const pageLimit = Math.min(pageCount, INGESTION_LIMITS.MAX_PDF_PAGE_COUNT);
    let totalTextBytes = 0;

    for (let i = 0; i < pageLimit; i++) {
      if (totalTextBytes >= INGESTION_LIMITS.MAX_EXTRACTED_TEXT_BYTES) {
        break;
      }

      const pageText = Array.isArray(text) ? (text[i] || '') : (text || '');
      totalTextBytes += pageText.length;
      pages.push({ pageNum: i + 1, text: pageText });
    }

    return pages;
  } catch (err: any) {
    throw new Error(`Failed to parse PDF document: ${err.message || String(err)}`);
  }
}

/**
  Detects question type (MCQ, MSQ, NAT) and assigns classification confidence.
 */
export function classifyQuestionType(
  rawText: string,
  cleanedText: string
): { detectedType: 'MCQ' | 'MSQ' | 'NAT' | null; confidenceScore: number; options?: Array<{ id: string; text: string }>; reason: string } {
  const text = cleanedText || rawText;

  // Check for 4 structured options: (A)... (B)... (C)... (D)... or [A]... [B]... or a)... b)... c)... d)...
  const optPatternA = /\(A\)\s*([\s\S]*?)\(B\)\s*([\s\S]*?)\(C\)\s*([\s\S]*?)\(D\)\s*([\s\S]*?)$/i;
  const optPatternB = /A\.\s*([\s\S]*?)B\.\s*([\s\S]*?)C\.\s*([\s\S]*?)D\.\s*([\s\S]*?)$/i;
  const optPatternC = /a\)\s*([\s\S]*?)b\)\s*([\s\S]*?)c\)\s*([\s\S]*?)d\)\s*([\s\S]*?)$/i;

  let match = text.match(optPatternA) || text.match(optPatternB) || text.match(optPatternC);

  if (match) {
    const options = [
      { id: 'A', text: match[1].trim() },
      { id: 'B', text: match[2].trim() },
      { id: 'C', text: match[3].trim() },
      { id: 'D', text: match[4].trim() },
    ];

    // Check if MSQ prompt is present
    if (/select all|multiple correct|choose all that apply/i.test(text)) {
      return {
        detectedType: 'MSQ',
        confidenceScore: 0.95,
        options,
        reason: 'Detected 4 option choices with explicit multi-select phrasing',
      };
    }

    return {
      detectedType: 'MCQ',
      confidenceScore: 0.95,
      options,
      reason: 'Detected structured 4-choice option block (A, B, C, D)',
    };
  }

  // NAT (Numerical Answer Type) Detection
  const natKeywords = [
    /evaluate the integral/i,
    /calculate the value of/i,
    /find the length of/i,
    /find the area of/i,
    /find the rank of/i,
    /determine the value of/i,
    /calculate the equivalent resistance/i,
    /evaluate\s+lim/i,
    /find the determinant/i,
  ];

  const isNatPrompt = natKeywords.some(pattern => pattern.test(text));
  if (isNatPrompt) {
    return {
      detectedType: 'NAT',
      confidenceScore: 0.90,
      reason: 'Detected mathematical numerical evaluation prompt without option choices',
    };
  }

  // Subjective / Open-Ended / Non-Objective GTU Question
  return {
    detectedType: null,
    confidenceScore: 0.60,
    reason: 'Open-ended or descriptive question without objective options (Requires Admin Review)',
  };
}

/**
  Segments text into question blocks based on GTU numbering patterns:
  Q.1 (a), Q.1 (b), Q.2 (a), OR Q.2 (a), Q.3 (a), (a), (b), (c), etc.
 */
export function segmentGtuQuestionsFromPages(
  paperMeta: GtuPaperMetadata,
  pages: Array<{ pageNum: number; text: string }>
): ExtractedQuestionBlock[] {
  const blocks: ExtractedQuestionBlock[] = [];

  for (const page of pages) {
    if (blocks.length >= INGESTION_LIMITS.MAX_QUESTIONS_PER_PAPER) {
      break;
    }

    let text = page.text;

    // Strip header/footer text
    text = text.replace(/Enrolment No\.\/Seat No.*?Total Marks:\s*\d+/gi, '');
    text = text.replace(/Instructions:.*?scientific calculators are allowed\./gi, '');

    // Split questions by "Q.", "OR Q.", sub-questions "(a)", "(b)", and nested parts "(i)", "(ii)"
    const questionRegex = /(?:OR\s+)?Q\.\s*(\d+)(?:\s*\(([a-zA-Z0-9]+)\))?(?:\s*\(([ivx0-9]+)\))?|(?:^|\n|\.\s+)\s*(?:(?:OR\s+)?\(([a-z])\)(?:\s*\(([ivx0-9]+)\))?|\(([ivx]+)\)\s+)/g;

    let currentQNo = '1';
    let currentSubNo = 'a';
    let currentNested = '';

    const matches: Array<{ index: number; qNo: string; subNo: string; fullMatch: string }> = [];

    let match: RegExpExecArray | null;
    while ((match = questionRegex.exec(text)) !== null) {
      if (match[1]) {
        currentQNo = match[1];
        currentSubNo = match[2] || 'a';
        currentNested = match[3] || '';
      } else if (match[4]) {
        currentSubNo = match[4];
        currentNested = match[5] || '';
      } else if (match[6]) {
        currentNested = match[6];
      }

      const fullSubNo = currentNested ? `${currentSubNo}(${currentNested})` : currentSubNo;
      matches.push({ index: match.index, qNo: currentQNo, subNo: fullSubNo, fullMatch: match[0] });
    }

    if (matches.length === 0) {
      // Single page text block
      const cleaned = normalizeQuestionText(text).normalized;
      if (cleaned.length > 20 && blocks.length < INGESTION_LIMITS.MAX_QUESTIONS_PER_PAPER) {
        const cls = classifyQuestionType(text, cleaned);
        blocks.push({
          paperId: paperMeta.paperId,
          sourceUrl: paperMeta.downloadUrl,
          examName: 'GTU',
          examYear: paperMeta.examYear,
          examSession: paperMeta.examSession,
          subjectCode: paperMeta.subjectCode,
          subjectName: paperMeta.subjectName,
          semester: paperMeta.semester,
          originalPage: page.pageNum,
          questionNo: '1',
          subQuestionNo: 'a',
          rawText: text.trim(),
          cleanedText: cleaned,
          options: cls.options,
          detectedType: cls.detectedType,
          confidenceScore: cls.confidenceScore,
          classificationReason: cls.reason,
          isDuplicateCandidate: false,
        });
      }
      continue;
    }

    for (let i = 0; i < matches.length; i++) {
      if (blocks.length >= INGESTION_LIMITS.MAX_QUESTIONS_PER_PAPER) {
        break;
      }

      const start = matches[i].index;
      const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
      const rawChunk = text.slice(start, end).trim();
      const cleaned = normalizeQuestionText(rawChunk).normalized;

      if (cleaned.length > 15) {
        const cls = classifyQuestionType(rawChunk, cleaned);
        blocks.push({
          paperId: paperMeta.paperId,
          sourceUrl: paperMeta.downloadUrl,
          examName: 'GTU',
          examYear: paperMeta.examYear,
          examSession: paperMeta.examSession,
          subjectCode: paperMeta.subjectCode,
          subjectName: paperMeta.subjectName,
          semester: paperMeta.semester,
          originalPage: page.pageNum,
          questionNo: matches[i].qNo,
          subQuestionNo: matches[i].subNo,
          rawText: rawChunk,
          cleanedText: cleaned,
          options: cls.options,
          detectedType: cls.detectedType,
          confidenceScore: cls.confidenceScore,
          classificationReason: cls.reason,
          isDuplicateCandidate: false,
        });
      }
    }
  }

  return blocks;
}

/**
  Processes a GTU paper PDF, segments questions, checks duplicates, and enqueues into staging queue.
  Returns structured IngestionProcessingResult with isolated error handling and performance telemetry.
 */
export async function processGtuPaperIngestion(
  env: Env,
  paperMeta: GtuPaperMetadata
): Promise<IngestionProcessingResult> {
  const startTime = Date.now();
  let duplicateCount = 0;

  try {
    const pdfBuffer = await fetchGtuPaperPdf(paperMeta.downloadUrl);
    const pages = await extractPdfTextPages(pdfBuffer);
    const blocks = segmentGtuQuestionsFromPages(paperMeta, pages);

    let enqueuedCount = 0;

    for (const block of blocks) {
      const candidatePayload: Partial<MasterQuestion> = {
        sourceType: 'GTU',
        isOriginalPyq: true,
        isAiGenerated: false,
        sourceUrl: paperMeta.downloadUrl,
        examName: 'GTU',
        examYear: paperMeta.examYear,
        examSession: paperMeta.examSession,
        questionNo: block.questionNo,
        subQuestionNo: block.subQuestionNo,
        subjectCode: paperMeta.subjectCode,
        subjectName: paperMeta.subjectName,
        semester: paperMeta.semester,
        questionType: (block.detectedType || 'MCQ') as any,
        questionText: block.cleanedText,
        mcqData: block.options ? { options: block.options, correctAnswer: 'A' } : undefined,
      };

      // Duplicate Check
      const dupCheck = await detectDuplicateQuestionAsync(env, candidatePayload);
      block.isDuplicateCandidate = dupCheck.isDuplicate;
      block.duplicateMatchedId = dupCheck.matchedQuestionId;
      if (dupCheck.isDuplicate) {
        duplicateCount++;
      }

      // Build raw payload JSON with provenance metadata
      const rawPayloadJson = JSON.stringify({
        ...candidatePayload,
        provenance: {
          paperId: paperMeta.paperId,
          sourceUrl: paperMeta.downloadUrl,
          originalPage: block.originalPage,
          rawText: block.rawText,
          classificationReason: block.classificationReason,
          isDuplicateCandidate: dupCheck.isDuplicate,
          duplicateMatchedId: dupCheck.matchedQuestionId,
          duplicateConfidence: dupCheck.confidence,
        },
      });

      await enqueueQuestion(env, {
        source: 'GTU_PDF',
        rawPayloadJson,
        extractedQuestionText: block.cleanedText,
        detectedType: block.detectedType,
        confidenceScore: block.confidenceScore,
      });

      enqueuedCount++;
    }

    const durationMs = Date.now() - startTime;

    return {
      success: true,
      paperId: paperMeta.paperId,
      sourceUrl: paperMeta.downloadUrl,
      pdfByteSize: pdfBuffer.byteLength,
      pageCount: pages.length,
      extractedBlocks: blocks,
      enqueuedCount,
      duplicateCount,
      durationMs,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    return {
      success: false,
      paperId: paperMeta.paperId,
      sourceUrl: paperMeta.downloadUrl,
      extractedBlocks: [],
      enqueuedCount: 0,
      duplicateCount: 0,
      error: err.message || String(err),
      durationMs,
    };
  }
}

/**
  Extracts question blocks from sample text for automated ingestion processing.
 */
export async function extractGTUQuestionPaper(
  pdfText: string,
  paperMeta: Partial<GtuPaperMetadata>
): Promise<{ extractedQuestions: ExtractedQuestionBlock[] }> {
  const pages = [{ pageNum: 1, text: pdfText }];
  const dummyMeta: GtuPaperMetadata = {
    paperId: paperMeta.paperId || 'gtu_sample',
    downloadUrl: paperMeta.downloadUrl || (paperMeta as any).sourceUrl || 'https://gtu.ac.in',
    subjectCode: paperMeta.subjectCode || '3110014',
    subjectName: paperMeta.subjectName || 'Mathematics - 1',
    examName: 'GTU',
    examYear: paperMeta.examYear || 2024,
    examSession: paperMeta.examSession || 'WINTER',
    sessionCode: paperMeta.sessionCode || 'W2024',
    courseCode: paperMeta.courseCode || 'BE',
    semester: paperMeta.semester || 1,
  };

  const blocks = segmentGtuQuestionsFromPages(dummyMeta, pages);
  return { extractedQuestions: blocks };
}

