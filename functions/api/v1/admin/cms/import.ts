import { jsonResponse, errorResponse } from "../../../../lib/json";
import { enterpriseCurriculumEngine, CurriculumRowSpec } from "../../../../lib/enterpriseCurriculumEngine";
import { requireAdmin } from "../../../../lib/auth";

export async function onRequestPost(context: { request: Request; env: { DB: D1Database } }) {
  const { request, env } = context;

  const { errorResponse: authError } = await requireAdmin(request, env);
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json() as {
      parsedData: CurriculumRowSpec[];
      filename?: string;
      uploadedBy?: string;
    };

    if (!body.parsedData || !Array.isArray(body.parsedData) || body.parsedData.length === 0) {
      return errorResponse("No parsed curriculum data provided for import", 400);
    }

    const filename = body.filename || "university_curriculum.xlsx";
    const uploadedBy = body.uploadedBy || "Super Admin";

    const summary = await enterpriseCurriculumEngine.importCurriculumToD1(
      env.DB,
      body.parsedData,
      filename,
      uploadedBy
    );

    return jsonResponse({
      success: true,
      summary,
      message: `Curriculum Version ${summary.versionNumber} successfully committed into Cloudflare D1.`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Curriculum import failed";
    return errorResponse(message, 500);
  }
}
