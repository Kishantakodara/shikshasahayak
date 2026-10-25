/**
 * SHIKSHA SAHAYAK OS — CENTRAL SERVER-SIDE AI PROVIDER ROUTER
 * 
 * Provides unified, secure routing across multiple AI LLM providers:
 * - OpenRouter (Primary for Tutor, Assistant, Planner, Copilot, Orchestrator)
 * - Groq (Primary for Quiz Generation, Exam Prediction)
 * - NVIDIA NIM (Dedicated / Fallback for High-Performance Chat)
 * - Gemini (Fallback Provider)
 * - Hugging Face (Embeddings / Vision / Specialized Models)
 * 
 * SECURITY:
 * All API keys MUST originate strictly from server-side Cloudflare environment bindings.
 * Zero keys are exposed to the client bundle or response payloads.
 */

export interface Env {
  OPENROUTER_API_KEY?: string;
  GROQ_API_KEY?: string;
  NVIDIA_NIM_API_KEY?: string;
  HUGGINGFACE_API_KEY?: string;
  GEMINI_API_KEY?: string;
  GITHUB_TOKEN?: string;
  CLOUDFLARE_API_TOKEN?: string;
  DB?: any;
}

export type AICapability =
  | 'tutor'
  | 'assistant'
  | 'planner'
  | 'quiz_generator'
  | 'copilot'
  | 'personalized_plan'
  | 'smart_analytics'
  | 'exam_prediction'
  | 'memory'
  | 'orchestrator'
  | 'spaced_repetition'
  | 'vector_search'
  | 'nvidia_completions';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'model';
  content: string;
}

export interface AIRouterOptions {
  capability: AICapability;
  messages: AIMessage[];
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  userId?: string;
}

export interface AIResponse {
  text: string;
  provider: string;
  model: string;
  requestId: string;
  latencyMs: number;
  usage?: { promptTokens?: number; completionTokens?: number };
}

/**
 * Logs telemetry metrics to D1 database ai_request_logs table
 */
export async function logAITelemetry(
  env: Env,
  userId: string,
  feature: string,
  promptTokens: number,
  completionTokens: number,
  latencyMs: number,
  provider: string,
  model: string,
  success: boolean
) {
  if (!env.DB) return;
  try {
    const id = `req_ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await env.DB.prepare(
      `INSERT INTO ai_request_logs (id, user_id, feature, prompt_tokens, completion_tokens, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
      .bind(id, userId || 'anonymous', `${feature}:${provider}:${model}`, promptTokens, completionTokens)
      .run();
  } catch (err) {
    console.error('[AI Telemetry] Log failed:', err);
  }
}

/**
 * Executes an AI Request through the primary provider with automatic failover.
 */
export async function executeAIRoute(
  env: Env,
  options: AIRouterOptions
): Promise<Response | AIResponse> {
  const { capability, messages, systemInstruction, temperature = 0.7, maxTokens = 2048, stream = false, userId = 'anonymous' } = options;
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Define Provider Hierarchy per Capability
  switch (capability) {
    case 'quiz_generator':
    case 'exam_prediction': {
      const res = await routeGroqFirst(env, { messages, systemInstruction, temperature, maxTokens, stream });
      res.requestId = requestId;
      res.latencyMs = Date.now() - startTime;
      await logAITelemetry(env, userId, capability, res.usage?.promptTokens || 0, res.usage?.completionTokens || 0, res.latencyMs, res.provider, res.model, true);
      return res;
    }

    case 'tutor':
      return await routeTutorStreamWithFallback(env, { messages, systemInstruction, temperature, maxTokens, stream });

    case 'nvidia_completions': {
      const res = await callNvidiaNim(env, { messages, systemInstruction, temperature, maxTokens, stream });
      res.requestId = requestId;
      res.latencyMs = Date.now() - startTime;
      await logAITelemetry(env, userId, capability, 0, 0, res.latencyMs, res.provider, res.model, true);
      return res;
    }

    case 'assistant':
    case 'planner':
    case 'copilot':
    case 'personalized_plan':
    case 'smart_analytics':
    case 'memory':
    case 'orchestrator':
    case 'spaced_repetition':
    case 'vector_search':
    default: {
      const res = await routeOpenRouterFirst(env, { messages, systemInstruction, temperature, maxTokens, stream });
      res.requestId = requestId;
      res.latencyMs = Date.now() - startTime;
      await logAITelemetry(env, userId, capability, res.usage?.promptTokens || 0, res.usage?.completionTokens || 0, res.latencyMs, res.provider, res.model, true);
      return res;
    }
  }
}

/**
 * OpenRouter Primary -> Gemini Fallback
 */
async function routeOpenRouterFirst(
  env: Env,
  opts: { messages: AIMessage[]; systemInstruction?: string; temperature: number; maxTokens: number; stream: boolean }
): Promise<AIResponse> {
  const openRouterKey = env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    try {
      const res = await callOpenRouter(openRouterKey, 'meta-llama/llama-3.3-70b-instruct', opts);
      if (res) return res;
    } catch (err: any) {
      console.error('[AI Router] OpenRouter failed, attempting fallback...');
    }
  }

  // Fallback to Gemini
  const geminiKey = env.GEMINI_API_KEY;
  if (geminiKey) {
    const res = await callGemini(geminiKey, 'gemini-2.0-flash', opts);
    if (res) return res;
  }

  // Fallback to Groq
  const groqKey = env.GROQ_API_KEY;
  if (groqKey) {
    const res = await callGroq(groqKey, 'llama-3.3-70b-versatile', opts);
    if (res) return res;
  }

  throw new Error('All AI providers failed to process request. Please try again.');
}

/**
 * Groq Primary -> OpenRouter Fallback
 */
async function routeGroqFirst(
  env: Env,
  opts: { messages: AIMessage[]; systemInstruction?: string; temperature: number; maxTokens: number; stream: boolean }
): Promise<AIResponse> {
  const groqKey = env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const res = await callGroq(groqKey, 'llama-3.3-70b-versatile', opts);
      if (res) return res;
    } catch (err: any) {
      console.error('[AI Router] Groq failed, attempting fallback...');
    }
  }

  // Fallback to OpenRouter
  return await routeOpenRouterFirst(env, opts);
}

/**
 * AI Tutor Streaming Route: OpenRouter -> NVIDIA NIM -> Gemini
 */
async function routeTutorStreamWithFallback(
  env: Env,
  opts: { messages: AIMessage[]; systemInstruction?: string; temperature: number; maxTokens: number; stream: boolean }
): Promise<Response> {
  const openRouterKey = env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    const streamRes = await fetchOpenRouterStream(openRouterKey, 'google/gemini-2.0-flash-001', opts);
    if (streamRes && streamRes.ok) return streamRes;
  }

  const nvidiaKey = env.NVIDIA_NIM_API_KEY;
  if (nvidiaKey) {
    const streamRes = await fetchNvidiaNimStream(nvidiaKey, 'meta/llama-3.1-405b-instruct', opts);
    if (streamRes && streamRes.ok) return streamRes;
  }

  const geminiKey = env.GEMINI_API_KEY;
  if (geminiKey) {
    const streamRes = await fetchGeminiStream(geminiKey, 'gemini-2.5-flash', opts);
    if (streamRes && streamRes.ok) return streamRes;
  }

  return new Response(
    JSON.stringify({ success: false, error: 'All AI streaming providers currently unavailable.' }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  );
}

/* ─────────────────────────────────────────────────────────────
 * PROVIDER API CALL IMPLEMENTATIONS
 * ───────────────────────────────────────────────────────────── */

async function callOpenRouter(
  apiKey: string,
  model: string,
  opts: { messages: AIMessage[]; systemInstruction?: string; temperature: number; maxTokens: number }
): Promise<AIResponse | null> {
  const formattedMessages = opts.systemInstruction
    ? [{ role: 'system', content: opts.systemInstruction }, ...opts.messages]
    : opts.messages;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://shikshasahayak.org',
      'X-Title': 'ShikshaSahayak AI',
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content })),
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
    })
  });

  if (!res.ok) return null;
  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content || '';

  return {
    text,
    provider: 'OpenRouter',
    model,
    requestId: '',
    latencyMs: 0,
    usage: {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
    }
  };
}

async function callGroq(
  apiKey: string,
  model: string,
  opts: { messages: AIMessage[]; systemInstruction?: string; temperature: number; maxTokens: number }
): Promise<AIResponse | null> {
  const formattedMessages = opts.systemInstruction
    ? [{ role: 'system', content: opts.systemInstruction }, ...opts.messages]
    : opts.messages;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content })),
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
    })
  });

  if (!res.ok) return null;
  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content || '';

  return {
    text,
    provider: 'Groq',
    model,
    requestId: '',
    latencyMs: 0,
    usage: {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
    }
  };
}

async function callNvidiaNim(
  env: Env,
  opts: { messages: AIMessage[]; systemInstruction?: string; temperature: number; maxTokens: number; stream?: boolean }
): Promise<AIResponse> {
  const apiKey = env.NVIDIA_NIM_API_KEY;
  if (!apiKey) throw new Error('NVIDIA NIM API key is not configured.');

  const model = 'meta/llama-3.1-405b-instruct';
  const formattedMessages = opts.systemInstruction
    ? [{ role: 'system', content: opts.systemInstruction }, ...opts.messages]
    : opts.messages;

  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content })),
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
    })
  });

  if (!res.ok) throw new Error('NVIDIA NIM API call failed.');
  const data = await res.json() as any;
  const text = data.choices?.[0]?.message?.content || '';

  return {
    text,
    provider: 'NVIDIA NIM',
    model,
    requestId: '',
    latencyMs: 0,
  };
}

async function callGemini(
  apiKey: string,
  model: string,
  opts: { messages: AIMessage[]; systemInstruction?: string; temperature: number; maxTokens: number }
): Promise<AIResponse | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const contents = opts.messages.map(m => ({
    role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(opts.systemInstruction ? { system_instruction: { parts: [{ text: opts.systemInstruction }] } } : {}),
      contents,
      generationConfig: { temperature: opts.temperature, maxOutputTokens: opts.maxTokens }
    })
  });

  if (!res.ok) return null;
  const data = await res.json() as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return {
    text,
    provider: 'Gemini',
    model,
    requestId: '',
    latencyMs: 0,
  };
}

/* ─────────────────────────────────────────────────────────────
 * STREAMING FETCHERS FOR SSE RESPONSE
 * ───────────────────────────────────────────────────────────── */

async function fetchOpenRouterStream(
  apiKey: string,
  model: string,
  opts: { messages: AIMessage[]; systemInstruction?: string; temperature: number; maxTokens: number }
): Promise<Response | null> {
  const formattedMessages = opts.systemInstruction
    ? [{ role: 'system', content: opts.systemInstruction }, ...opts.messages]
    : opts.messages;

  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://shikshasahayak.org',
      'X-Title': 'ShikshaSahayak AI',
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content })),
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      stream: true
    })
  });
}

async function fetchNvidiaNimStream(
  apiKey: string,
  model: string,
  opts: { messages: AIMessage[]; systemInstruction?: string; temperature: number; maxTokens: number }
): Promise<Response | null> {
  const formattedMessages = opts.systemInstruction
    ? [{ role: 'system', content: opts.systemInstruction }, ...opts.messages]
    : opts.messages;

  return fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content })),
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      stream: true
    })
  });
}

async function fetchGeminiStream(
  apiKey: string,
  model: string,
  opts: { messages: AIMessage[]; systemInstruction?: string; temperature: number; maxTokens: number }
): Promise<Response | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
  const contents = opts.messages.map(m => ({
    role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(opts.systemInstruction ? { system_instruction: { parts: [{ text: opts.systemInstruction }] } } : {}),
      contents,
      generationConfig: { temperature: opts.temperature, maxOutputTokens: opts.maxTokens }
    })
  });
}
