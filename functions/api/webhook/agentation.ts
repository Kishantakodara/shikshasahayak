import { jsonResponse, errorResponse } from "../../lib/json";

export async function onRequestPost(context: { request: Request }) {
  try {
    const payload = await context.request.json();
    console.log("Received Agentation Webhook Payload:", JSON.stringify(payload, null, 2));

    // Respond back to Agentation
    return jsonResponse({
      success: true,
      message: "Webhook received successfully",
      timestamp: Date.now()
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid JSON payload";
    return errorResponse(message, 400);
  }
}

// Enable CORS/preflight for local dev requests if needed
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
