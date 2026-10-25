// ============================================================
// SHIKSHA SAHAYAK OS EDGE SERVICE: Multi-University Platform (Sprint 17)
// ============================================================

import { Env } from "./contentEngine";
import { UniversityProfile, AcademicProgram, SubjectEquivalenceMapping } from "../../src/types/multi-university-platform";

export async function fetchUniversities(env: Env): Promise<UniversityProfile[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, name, short_name as shortName, slug, country, state, is_active as isActive,
              grading_system_json, passing_criteria_json, academic_calendar_json
       FROM universities
       ORDER BY is_active DESC, name ASC`
    ).all();

    return (results || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      shortName: row.shortName || row.name,
      slug: row.slug,
      country: row.country || "India",
      state: row.state || "Gujarat",
      isActive: Boolean(row.isActive),
      gradingSystem: JSON.parse(row.grading_system_json || '{"scale": 10, "type": "SPI/CPI"}'),
      passingCriteria: JSON.parse(row.passing_criteria_json || '{"min_subject_marks": 35, "min_aggregate": 40}'),
      academicCalendar: JSON.parse(row.academic_calendar_json || '{"odd_sem_start": "July", "even_sem_start": "January"}'),
    }));
  } catch (error) {
    console.error("Failed to fetch universities:", error);
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

export async function fetchAcademicPrograms(env: Env, universityId: string): Promise<AcademicProgram[]> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, university_id as universityId, faculty_id as facultyId, program_type as programType,
              name, slug, duration_years as durationYears, total_semesters as totalSemesters, is_active as isActive
       FROM academic_programs
       WHERE university_id = ? AND is_active = 1
       ORDER BY name ASC`
    ).bind(universityId).all();

    return (results || []).map((row: any) => ({
      id: row.id,
      universityId: row.universityId,
      facultyId: row.facultyId,
      programType: row.programType,
      name: row.name,
      slug: row.slug,
      durationYears: row.durationYears,
      totalSemesters: row.totalSemesters,
      isActive: Boolean(row.isActive),
    }));
  } catch (error) {
    console.error("Failed to fetch academic programs:", error);
    return [];
  }
}

export async function createSubjectEquivalence(
  env: Env,
  sourceSubjectId: string,
  targetSubjectId: string,
  notes?: string,
  createdBy?: string
): Promise<boolean> {
  try {
    const id = `eq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await env.DB.prepare(
      `INSERT INTO subject_equivalence_mappings (id, source_subject_id, target_subject_id, mapping_notes, created_by)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(source_subject_id, target_subject_id) DO UPDATE SET
         mapping_notes = excluded.mapping_notes,
         created_by = excluded.created_by`
    ).bind(id, sourceSubjectId, targetSubjectId, notes || null, createdBy || "admin").run();

    return true;
  } catch (error) {
    console.error("Failed to create subject equivalence:", error);
    return false;
  }
}
