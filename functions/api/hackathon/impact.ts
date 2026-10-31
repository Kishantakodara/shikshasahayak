// ============================================================
// SHIKSHA SAHAYAK OS API: /api/hackathon/impact
// Social Impact Analytics & Dynamic Impact Simulator
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";

export async function onRequestGet() {
  return jsonResponse({
    success: true,
    data: {
      metrics: {
        activeStudentsServed: 52000,
        totalVerifiedResources: 12500,
        pyqExamPapersIndexed: 2850,
        estimatedBacklogReductionPercent: 28,
        hoursSavedPerStudentPerSem: 18.5,
        tuitionFeesSavedPerStudentInr: 25000,
        totalSocietalEconomicSavingsInr: 1300000000,
        formattedTotalSavings: "₹130.0 Crores"
      }
    }
  });
}

export async function onRequestPost(context: { request: Request }) {
  try {
    const body = (await context.request.json()) as {
      studentCount: number;
      avgCoachingFee?: number;
      failureRate?: number;
    };

    if (!body || typeof body.studentCount !== "number" || body.studentCount <= 0) {
      return errorResponse("Missing or invalid parameter: studentCount", 400);
    }

    const students = body.studentCount;
    const fee = body.avgCoachingFee ?? 20000;
    const failureRate = body.failureRate ?? 30;

    const total = students * fee;
    const preventedBacklogs = Math.round(students * (failureRate / 100) * 0.28);
    const hoursSaved = Math.round(students * 18.5);

    const formatted = total >= 10000000
      ? `₹${(total / 10000000).toFixed(2)} Crores`
      : `₹${(total / 100000).toFixed(2)} Lakhs`;

    return jsonResponse({
      success: true,
      data: {
        simulationInputs: {
          studentCount: students,
          avgCoachingFee: fee,
          failureRate: failureRate
        },
        projectedImpact: {
          totalEconomicSavingsInr: total,
          formattedEconomicSavings: formatted,
          preventedBacklogsCount: preventedBacklogs,
          totalSemesterHoursSaved: hoursSaved,
          sdgAlignment: "SDG 4 (Quality Education) & SDG 10 (Reduced Inequalities)"
        }
      }
    });
  } catch (error: any) {
    return errorResponse(error.message || "Invalid JSON payload", 400);
  }
}

