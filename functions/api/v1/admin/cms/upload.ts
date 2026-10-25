import { jsonResponse, errorResponse } from "../../../../lib/json";
import { enterpriseCurriculumEngine } from "../../../../lib/enterpriseCurriculumEngine";
import { requireAdmin } from "../../../../lib/auth";

export async function onRequestPost(context: { request: Request; env: { DB: D1Database } }) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    let buffer: ArrayBuffer;
    let filename = "curriculum_upload.xlsx";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return errorResponse("No curriculum file uploaded", 400);
      }
      filename = file.name;
      buffer = await file.arrayBuffer();
    } else {
      const json = await request.json() as any;
      if (json.fileBase64) {
        filename = json.filename || filename;
        const binary = atob(json.fileBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        buffer = bytes.buffer;
      } else if (Array.isArray(json.rows)) {
        // Direct JSON row import fallback
        const report = {
          isValid: true,
          totalRowsProcessed: json.rows.length,
          totalBranchesFound: new Set(json.rows.map((r: any) => r.branchCode || r.branchName)).size,
          totalSubjectsFound: json.rows.length,
          totalSemestersFound: new Set(json.rows.map((r: any) => r.semester)).size,
          errorCount: 0,
          warningCount: 0,
          issues: [],
          parsedData: json.rows
        };

        return jsonResponse({
          success: true,
          filename: json.filename || "custom_curriculum.json",
          validationReport: report
        });
      } else {
        return errorResponse("Invalid upload payload format", 400);
      }
    }

    const uint8 = new Uint8Array(buffer);
    const report = enterpriseCurriculumEngine.parseWorkbookBuffer(uint8, filename);

    return jsonResponse({
      success: true,
      filename,
      validationReport: report
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Curriculum validation error";
    return errorResponse(message, 500);
  }
}
