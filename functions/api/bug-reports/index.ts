import { jsonResponse, errorResponse } from "../../lib/json";

export async function onRequestPost(context: { request: Request; env: { DB: D1Database } }) {
  const { request, env } = context;

  if (!env.DB) {
    return errorResponse("Database connection is not configured", 500);
  }

  try {
    const body = await request.json() as {
      user_email?: string;
      description?: string;
      error_stack?: string;
      browser_info?: string;
      screenshot?: string; // base64 data URL
    };
    
    const email = body.user_email?.trim();
    const description = body.description?.trim();
    const errorStack = body.error_stack || null;
    const browserInfo = body.browser_info || null;
    const screenshotBase64 = body.screenshot || null;

    if (!email || !description) {
      return errorResponse("Email and description are required", 400);
    }

    const id = `bug_${crypto.randomUUID().split("-")[0]}`;
    let screenshotUrl: string | null = null;
    let binaryData: Uint8Array | null = null;
    let mimeType = "";
    let sanitizedFilename = "";

    // Process screenshot if provided as base64 data URL (direct base64 storage, zero R2 storage use)
    if (screenshotBase64 && screenshotBase64.startsWith("data:")) {
      const match = screenshotBase64.match(/^data:(image\/[a-zA-Z+-]+);base64,(.+)$/);
      if (!match) {
        return errorResponse("Invalid screenshot format. Expected data URL.", 400);
      }

      mimeType = match[1].toLowerCase();
      const base64Data = match[2];

      const allowedMimes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (!allowedMimes.includes(mimeType)) {
        return errorResponse("Only PNG, JPG, and WEBP screenshot formats are allowed.", 400);
      }

      // Check max payload size for base64 string (protect D1 statement size limit: ~1MB)
      if (screenshotBase64.length > 1024 * 1024) {
        return errorResponse("Screenshot is too large. Maximum allowed size is 750KB.", 400);
      }

      // Store base64 data URL directly without consuming R2 storage
      screenshotUrl = screenshotBase64;

      // Decode base64 to binary byte array for email attachment only
      try {
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        binaryData = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          binaryData[i] = binaryString.charCodeAt(i);
        }
        const extension = mimeType === "image/png" ? ".png" : mimeType === "image/webp" ? ".webp" : ".jpg";
        sanitizedFilename = `screenshot_${id}${extension}`;
      } catch (e) {
        binaryData = null;
      }
    }

    // Save report in D1 database (stores base64 image directly in screenshot_url)
    await env.DB.prepare(`
      INSERT INTO bug_reports (id, user_email, description, screenshot_url, error_stack, browser_info, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      id,
      email,
      description,
      screenshotUrl,
      errorStack,
      browserInfo
    ).run();

    // Forward bug report to developer via Web3Forms
    const web3FormData = new FormData();
    web3FormData.append("access_key", "510341b5-dde2-41cf-9465-a2f7f6fee02c");
    web3FormData.append("subject", `[Bug Report] ShikshaSahayak Bug Bounty - ${id}`);
    web3FormData.append("from_name", "ShikshaSahayak Bug Bounty");
    web3FormData.append("email", email);
    
    let emailMessage = `New bug report submitted!

Bug ID: ${id}
User Email: ${email}
Status: pending

Description:
${description}

---
Technical Information:
Browser/Device: ${browserInfo || "N/A"}
Screenshot URL: ${screenshotUrl || "None"}
`;

    if (errorStack) {
      emailMessage += `\nError Stack Trace:\n${errorStack}`;
    }

    web3FormData.append("message", emailMessage);

    if (binaryData && mimeType && sanitizedFilename) {
      // Reconstruct screenshot file as blob to send to Web3Forms
      const fileBlob = new Blob([binaryData], { type: mimeType });
      web3FormData.append("attachment", fileBlob, sanitizedFilename);
    }

    try {
      const emailResponse = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: web3FormData
      });

      if (!emailResponse.ok) {
        console.error("Web3Forms submission failed:", await emailResponse.text());
      }
    } catch (emailErr) {
      console.error("Failed to forward bug report email:", emailErr);
    }

    return jsonResponse({
      success: true,
      id,
      message: "Bug report submitted and saved successfully."
    });

  } catch (error: any) {
    console.error("Error in submit bug report API:", error);
    return errorResponse(error.message || "An unexpected error occurred", 500);
  }
}
