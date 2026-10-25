// ============================================================
// SHIKSHA SAHAYAK OS CLIENT: Multi-University Platform (Sprint 17)
// ============================================================

import { UniversityProfile, AcademicProgram } from "../types/multi-university-platform";

export async function getUniversities(): Promise<UniversityProfile[]> {
  try {
    const res = await fetch(`/api/academic/universities`);
    if (!res.ok) throw new Error("Failed to fetch universities");
    const data = await res.json();
    return data.universities || [];
  } catch (error) {
    console.error(error);
    return [
      {
        id: "gtu",
        name: "Gujarat Technological University",
        shortName: "GTU",
        slug: "gtu",
        country: "India",
        state: "Gujarat",
        isActive: true,
        gradingSystem: { scale: 10, type: "SPI/CPI" },
        passingCriteria: { minSubjectMarks: 35, minAggregate: 40 },
        academicCalendar: { oddSemStart: "July", evenSemStart: "January" },
      },
    ];
  }
}

export async function getAcademicPrograms(universityId: string): Promise<AcademicProgram[]> {
  try {
    const res = await fetch(`/api/academic/universities?action=programs&universityId=${universityId}`);
    if (!res.ok) throw new Error("Failed to fetch academic programs");
    const data = await res.json();
    return data.programs || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function createSubjectEquivalenceMapping(
  sourceSubjectId: string,
  targetSubjectId: string,
  notes?: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/academic/universities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceSubjectId, targetSubjectId, notes }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
