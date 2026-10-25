// ============================================================
// QUESTION INTELLIGENCE ENGINE - GTU INGESTION RUNNER
// Orchestrates controlled GTU PYQ discovery & sample ingestion.
// Outputs comprehensive metrics and representative question samples.
// ============================================================

import { Env } from '../../contentEngine';
import { discoverGtuSamplePaperMetadata, GtuPaperMetadata } from './gtuDiscoveryService';
import { processGtuPaperIngestion, ExtractedQuestionBlock, INGESTION_LIMITS } from './gtuExtractorService';

export interface GtuSampleIngestionReport {
  papersDiscoveredCount: number;
  papersFetchedCount: number;
  papersFailedCount: number;
  pdfsParsedCount: number;
  totalQuestionsExtracted: number;
  mcqsDetectedCount: number;
  msqsDetectedCount: number;
  natsDetectedCount: number;
  uncertainClassificationsCount: number;
  duplicateCandidatesCount: number;
  extractionFailuresCount: number;
  sampleQuestions: ExtractedQuestionBlock[];
  processedPapers: Array<{ paperId: string; subjectCode: string; subjectName: string; sessionCode: string; questionsCount: number }>;
}

/**
  Runs the controlled GTU PYQ discovery and sample ingestion pipeline with batch clamping and failure isolation.
 */
export async function runGtuSampleIngestionPipeline(
  env: Env,
  targetSubjects: string[] = ['3110014', '3110015', '3110005', '3110003', '3110002'],
  targetSessions: string[] = ['W2024', 'S2024', 'W2023', 'S2023', 'W2022']
): Promise<GtuSampleIngestionReport> {
  const discoveredMetaList = discoverGtuSamplePaperMetadata(targetSubjects, targetSessions);
  // Clamp batch size to conservative limit
  const sampleMetaList = discoveredMetaList.slice(0, INGESTION_LIMITS.MAX_PAPERS_PER_INGESTION_RUN);

  let papersFetchedCount = 0;
  let papersFailedCount = 0;
  let pdfsParsedCount = 0;
  let totalQuestionsExtracted = 0;
  let mcqsDetectedCount = 0;
  let msqsDetectedCount = 0;
  let natsDetectedCount = 0;
  let uncertainClassificationsCount = 0;
  let duplicateCandidatesCount = 0;

  const allExtractedBlocks: ExtractedQuestionBlock[] = [];
  const processedPapers: Array<{ paperId: string; subjectCode: string; subjectName: string; sessionCode: string; questionsCount: number }> = [];

  for (const paperMeta of sampleMetaList) {
    if (totalQuestionsExtracted >= INGESTION_LIMITS.MAX_QUESTIONS_PER_BATCH) {
      break;
    }

    try {
      const res = await processGtuPaperIngestion(env, paperMeta);
      if (res.success) {
        papersFetchedCount++;
        pdfsParsedCount++;
        totalQuestionsExtracted += res.extractedBlocks.length;

        processedPapers.push({
          paperId: paperMeta.paperId,
          subjectCode: paperMeta.subjectCode,
          subjectName: paperMeta.subjectName,
          sessionCode: paperMeta.sessionCode,
          questionsCount: res.extractedBlocks.length,
        });

        for (const block of res.extractedBlocks) {
          allExtractedBlocks.push(block);

          if (block.detectedType === 'MCQ') mcqsDetectedCount++;
          else if (block.detectedType === 'MSQ') msqsDetectedCount++;
          else if (block.detectedType === 'NAT') natsDetectedCount++;
          else uncertainClassificationsCount++;

          if (block.isDuplicateCandidate) duplicateCandidatesCount++;
        }
      } else {
        papersFailedCount++;
      }
    } catch {
      papersFailedCount++;
    }
  }

  // Select 15 representative question blocks across subjects/type
  const sampleQuestions = allExtractedBlocks.slice(0, 15);

  return {
    papersDiscoveredCount: sampleMetaList.length,
    papersFetchedCount,
    papersFailedCount,
    pdfsParsedCount,
    totalQuestionsExtracted,
    mcqsDetectedCount,
    msqsDetectedCount,
    natsDetectedCount,
    uncertainClassificationsCount,
    duplicateCandidatesCount,
    extractionFailuresCount: papersFailedCount,
    sampleQuestions,
    processedPapers,
  };
}
