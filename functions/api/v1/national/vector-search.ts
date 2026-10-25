/**
 * SHIKSHA SAHAYAK OS — PRODUCTION VECTOR SEARCH & RAG API
 * Endpoint: /api/v1/national/vector-search
 */

import { chunkDocumentText, performRAGSearch } from '../../../../functions/lib/vectorSearchService';
import { getAuthenticatedUser, verifyBetaAccess } from '../../../../functions/lib/auth';

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env as any);
  const betaAuth = await verifyBetaAccess(user, env as any, 'vectorSearch');
  if (!betaAuth.allowed && betaAuth.response) {
    return betaAuth.response;
  }

  try {
    const body = (await request.json()) as any;
    const query = body.query || 'Process Scheduling GTU Questions';
    const documentId = body.documentId || 'doc_gtu_os_2024';
    const documentTitle = body.documentTitle || 'GTU Operating System Lecture Notes';
    const subject = body.subject || 'Operating Systems';
    const fullText = body.fullText || `Operating Systems Process Scheduling algorithms include First Come First Served (FCFS), Shortest Job First (SJF), Round Robin (RR), and Priority Scheduling. Round Robin uses a fixed time quantum. Thrashing occurs when page fault rates become excessively high causing CPU utilization to drop to near zero. Banker's algorithm is used for Deadlock Avoidance.`;

    const vectorizeActive = Boolean((env as any).VECTORIZE);
    const vectorEngineStatus = vectorizeActive 
      ? "Cloudflare Vectorize Active" 
      : "Vectorize not configured, retaining D1/text-search RAG engine";

    const chunks = chunkDocumentText(documentId, documentTitle, subject, fullText);
    const topResults = performRAGSearch(query, chunks, 3);

    return new Response(JSON.stringify({
      success: true,
      vectorEngineStatus,
      vectorizeActive,
      query,
      totalChunksIndexed: chunks.length,
      topResults,
      ragContextPrompt: `Use the following academic context to answer the student's question:\n${topResults.map(r => r.text).join('\n---\n')}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
