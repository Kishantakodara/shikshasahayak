/**
 * SHIKSHA SAHAYAK OS — PHASE Y MULTI-AGENT ORCHESTRATOR API
 * Endpoint: /api/v1/autonomous/orchestrator
 */

import { AIAgentOrchestrator } from '../../../../functions/lib/autonomousLearningEcosystem';
import { getAuthenticatedUser, checkAIBetaAccess } from '../../../../functions/lib/auth';
import { executeAIRoute, AIResponse } from '../../../../functions/lib/aiProviderRouter';

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env as any);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const hasBeta = await checkAIBetaAccess(user, env as any);
  if (!hasBeta) {
    return new Response(JSON.stringify({ success: false, error: "Forbidden: AI Beta access required" }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const body = await request.json() as any;
    const orchestrator = new AIAgentOrchestrator();

    const dispatchResult = orchestrator.dispatchMessage({
      fromAgent: body.fromAgent || 'Study',
      toAgent: body.toAgent || 'Assessment',
      messageType: body.messageType || 'query',
      payload: body.payload || { topic: 'Process Scheduling' },
      timestamp: new Date().toISOString()
    });

    // Execute agent reasoning via OpenRouter
    const aiResult = await executeAIRoute(env as any, {
      capability: 'orchestrator',
      messages: [{ role: 'user', content: `Agent ${body.fromAgent || 'Study'} dispatched task to ${body.toAgent || 'Assessment'} for topic: ${JSON.stringify(body.payload || {})}` }],
      systemInstruction: 'You are ShikshaSahayak Autonomous Multi-Agent Reasoning Dispatcher.',
      temperature: 0.5,
      maxTokens: 1000,
    }) as AIResponse;

    return new Response(JSON.stringify({
      success: true,
      result: dispatchResult,
      agentReasoning: aiResult.text,
      provider: aiResult.provider,
      model: aiResult.model,
      logs: orchestrator.getExecutionLog()
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
