import { jsonResponse, errorResponse } from "../../../lib/json";

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function onRequestPost(context: {
  request: Request;
  env: {
    GEMINI_API_KEY?: string;
    VITE_GEMINI_API_KEY?: string;
    VITE_NVIDIA_NIM_API_KEY?: string;
  };
}) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  const geminiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
  const nvidiaKey = env.VITE_NVIDIA_NIM_API_KEY;

  if (!geminiKey && !nvidiaKey) {
    return new Response(
      JSON.stringify({ error: { message: "AI API Key (Gemini or NVIDIA NIM) is not configured on the server." } }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const body = await request.json() as { messages: Array<{ role: string; content: string }> };
    const messages = body.messages || [];

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: { message: "No messages provided." } }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Standard system instruction for ShikshaSahayak Academic Assistant
    const systemInstruction = "You are ShikshaSahayak AI Tutor, an expert engineering academic assistant. Help students understand concepts, prepare for exams, solve PYQs, and navigate their syllabus. Be concise, structured, and helpful. Format math cleanly and use Markdown.";

    let lastGeminiError = '';

    // Step 1: Attempt Google Gemini models if key is available
    if (geminiKey) {
      const contents = messages.map((m) => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || '' }]
      }));

      const modelCandidates = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
      let geminiRes: Response | null = null;

      for (const model of modelCandidates) {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${geminiKey}`;
        try {
          const res = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemInstruction }] },
              contents,
              generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
            })
          });

          if (res.ok) {
            geminiRes = res;
            break;
          } else {
            lastGeminiError = await res.text();
            console.warn(`Gemini model ${model} failed (${res.status}): ${lastGeminiError}`);
          }
        } catch (e: any) {
          lastGeminiError = e.message;
        }
      }

      if (geminiRes) {
        // Transform Gemini SSE stream into simple { text: chunk } SSE format for AIChat frontend
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const reader = geminiRes.body?.getReader();
        const encoder = new TextEncoder();

        (async () => {
          if (!reader) {
            await writer.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data:')) {
                  try {
                    const jsonStr = trimmed.slice(5).trim();
                    if (jsonStr === '[DONE]') continue;
                    const data = JSON.parse(jsonStr);
                    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (candidateText) {
                      const ssePayload = `data: ${JSON.stringify({ text: candidateText })}\n\n`;
                      await writer.write(encoder.encode(ssePayload));
                    }
                  } catch (e) {
                    // Ignore partial JSON lines
                  }
                }
              }
            }
          } catch (err) {
            console.error("Stream reading error:", err);
          } finally {
            await writer.close();
          }
        })();

        return new Response(readable, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            ...corsHeaders
          }
        });
      }
    }

    // Step 2: Automatic Failover to NVIDIA NIM API if Gemini failed or is unconfigured
    if (nvidiaKey) {
      console.log("Failing over to NVIDIA NIM API backend...");

      // NVIDIA NIM Model candidates: Meta Llama 3.1 405B / 70B / Mistral Large
      const nvidiaModels = [
        "meta/llama-3.1-405b-instruct",
        "meta/llama-3.1-70b-instruct",
        "mistralai/mistral-large-2-instruct"
      ];

      let nvidiaRes: Response | null = null;
      let lastNvidiaError = '';

      for (const nimModel of nvidiaModels) {
        try {
          const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${nvidiaKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: nimModel,
              messages: [
                { role: "system", content: systemInstruction },
                ...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content }))
              ],
              temperature: 0.7,
              max_tokens: 2048,
              stream: true
            })
          });

          if (res.ok) {
            nvidiaRes = res;
            break;
          } else {
            lastNvidiaError = await res.text();
            console.warn(`NVIDIA model ${nimModel} failed (${res.status}): ${lastNvidiaError}`);
          }
        } catch (err: any) {
          lastNvidiaError = err.message;
        }
      }

      if (nvidiaRes) {
        // Transform NVIDIA NIM OpenAI-style SSE stream
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const reader = nvidiaRes.body?.getReader();
        const encoder = new TextEncoder();

        (async () => {
          if (!reader) {
            await writer.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data:')) {
                  try {
                    const jsonStr = trimmed.slice(5).trim();
                    if (jsonStr === '[DONE]') continue;
                    const data = JSON.parse(jsonStr);
                    const chunkText = data.choices?.[0]?.delta?.content;
                    if (chunkText) {
                      const ssePayload = `data: ${JSON.stringify({ text: chunkText })}\n\n`;
                      await writer.write(encoder.encode(ssePayload));
                    }
                  } catch (e) {
                    // Ignore chunk parse errors
                  }
                }
              }
            }
          } catch (err) {
            console.error("NVIDIA Stream error:", err);
          } finally {
            await writer.close();
          }
        })();

        return new Response(readable, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            ...corsHeaders
          }
        });
      }
    }

    // Step 3: Return detailed error if all providers/models failed
    return new Response(
      JSON.stringify({
        error: {
          message: `All AI providers failed to generate a response. Gemini Error: ${lastGeminiError || 'N/A'}`
        }
      }),
      { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: { message: error.message || "Failed to communicate with AI model" } }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}
