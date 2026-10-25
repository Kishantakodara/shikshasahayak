// ============================================================
// QUESTION INTELLIGENCE ENGINE - NORMALIZATION SERVICE
// Sanitizes whitespace, Unicode, LaTeX math formatting, PDF artifacts,
// and question/option numbering without altering core content logic.
// ============================================================

export interface NormalizedTextResult {
  raw: string;
  normalized: string;
  cleanedText: string;
}

/**
  Normalizes excessive spaces, tabs, and line breaks.
 */
export function normalizeWhitespace(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

/**
  Performs Unicode NFC normalization and replaces non-standard quote/dash variants.
 */
export function normalizeUnicode(text: string): string {
  if (!text) return '';
  let clean = text.normalize('NFC');
  
  // Standardize non-standard quotation marks, primes, and dashes
  clean = clean
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/[\u2013\u2014\u2015]/g, '-')
    .replace(/\u2026/g, '...');
    
  return clean;
}

/**
  Normalizes mathematical notation, LaTeX delimiters, and HTML entity math symbols.
 */
export function normalizeMathText(text: string): string {
  if (!text) return '';
  let clean = text;

  // Standardize LaTeX display math delimiters: \[ ... \] -> $$...$$
  clean = clean.replace(/\\\[([\s\S]*?)\\\]/g, (_, match) => `$$${match.trim()}$$`);
  
  // Standardize inline math delimiters: \( ... \) -> $...$
  clean = clean.replace(/\\\(([\s\S]*?)\\\)/g, (_, match) => `$${match.trim()}$`);

  // Convert common legacy HTML math entities to clean LaTeX equivalents
  const entityMap: Record<string, string> = {
    '&alpha;': '\\alpha',
    '&beta;': '\\beta',
    '&gamma;': '\\gamma',
    '&delta;': '\\delta',
    '&theta;': '\\theta',
    '&pi;': '\\pi',
    '&sigma;': '\\sigma',
    '&omega;': '\\omega',
    '&infin;': '\\infty',
    '&le;': '\\le',
    '&ge;': '\\ge',
    '&ne;': '\\ne',
    '&plusmn;': '\\pm',
    '&times;': '\\times',
    '&div;': '\\div',
    '&radic;': '\\sqrt',
    '&int;': '\\int',
    '&sum;': '\\sum',
  };

  for (const [entity, replacement] of Object.entries(entityMap)) {
    const reg = new RegExp(entity, 'gi');
    clean = clean.replace(reg, replacement);
  }

  return clean;
}

/**
  Strips option prefix tags such as "(A) ", "a) ", "[A] ", "Option A: ", "A. " from text.
 */
export function normalizeOptionPrefixes(optionText: string): string {
  if (!optionText) return '';
  return optionText
    .replace(/^\s*[\(\[\{]?[a-eA-E1-5][\)\]\}]?\s*[\.:\-]?\s*/, '')
    .replace(/^\s*Option\s+[a-eA-E1-5]\s*[\.:\-]?\s*/i, '')
    .trim();
}

/**
  Strips question numbering prefixes such as "Q.1(a) ", "Q14. ", "14. ", "Question 1: ".
 */
export function stripQuestionNumbering(questionText: string): string {
  if (!questionText) return '';
  let clean = questionText.trim();

  // Pattern: Q.1(a), Q1.a, Q14, Question 14, 14., 14(a)
  clean = clean.replace(/^\s*(?:Q(?:uestion)?\s*[\.\:]?\s*)?\d+(?:\s*[\.\:\-\/]\s*|\s*[\(\[\{]?[a-eA-E0-9]{1,2}[\)\]\}]\s*)*/i, '');
  clean = clean.replace(/^\s*[\.\:\-]\s*/, '');

  return clean.trim();
}

/**
  Cleans common PDF extraction artifacts like page headers, footers, and line wrap hyphens.
 */
export function cleanPdfArtifacts(text: string): string {
  if (!text) return '';
  let clean = text;

  // Fix hyphenated line breaks: e.g. "compu-\nter" -> "computer"
  clean = clean.replace(/([a-zA-Z])-\n\s*([a-zA-Z])/g, '$1$2');

  // Strip common GTU / exam paper header/footer artifacts
  clean = clean.replace(/Seat No\.:\s*[A-Z0-9_\-]*/gi, '');
  clean = clean.replace(/Enrolment No\.:?\s*[0-9]*/gi, '');
  clean = clean.replace(/GUJARAT TECHNOLOGICAL UNIVERSITY/gi, '');
  clean = clean.replace(/Page\s+\d+\s+of\s+\d+/gi, '');

  return clean;
}

/**
  Applies the full normalization pipeline to a question payload.
 */
export function normalizeQuestionText(text: string): NormalizedTextResult {
  const raw = text || '';
  let cleaned = cleanPdfArtifacts(raw);
  cleaned = normalizeUnicode(cleaned);
  cleaned = normalizeMathText(cleaned);
  cleaned = normalizeWhitespace(cleaned);
  const stripped = stripQuestionNumbering(cleaned);

  return {
    raw,
    normalized: stripped,
    cleanedText: cleaned,
  };
}
