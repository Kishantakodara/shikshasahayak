import { jsonResponse, errorResponse } from "../../../../lib/json";
import { getAuthenticatedUser, checkAIBetaAccess } from "../../../../lib/auth";

export async function onRequestPost(context: { request: Request; env: any }) {
  const { request, env } = context;

  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);

  const hasBeta = await checkAIBetaAccess(user, env);
  if (!hasBeta) return errorResponse("Forbidden: AI Beta access required", 403);

  const nvidiaKey = env.NVIDIA_NIM_API_KEY || env.VITE_NVIDIA_NIM_API_KEY;
  if (!nvidiaKey) {
    return errorResponse("NVIDIA NIM API key is not configured on the server", 500);
  }

  try {
    const body = (await request.json()) as any;
    if (!body.model) {
      body.model = "meta/llama-3.1-405b-instruct";
    }

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${nvidiaKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(errorText, {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const responseText = await response.text();
    return new Response(responseText, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
