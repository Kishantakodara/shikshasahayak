import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";
import { 
  getClassStudentCount, 
  getClassAssignmentCount,
  getClassMaterialCount,
  isClassTeacher,
  isHOD,
  generateUniqueJoinCode,
  getTeacherDb
} from "../../../lib/classHelpers";

/**
 * GET /api/teacher/classes/:id
 * Get details of a specific class with enriched data
 * 
 * Requirements: 2.5, 11.2
 */
export async function onRequestGet(context: { 
  env: { PADHAKU_CORE_DB?: D1Database; DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; 
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const db = getTeacherDb(env);
  const classId = params.id;

  if (!db) {
    return errorResponse("Database binding not configured", 500);
  }

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Fetch class
    const cls = await db
      .prepare(`SELECT * FROM classes WHERE id = ?`)
      .bind(classId)
      .first();

    if (!cls) {
      return errorResponse("Class not found", 404);
    }

    // Authorization: only class teacher, HOD, or admin can view
    const isTeacher = await isClassTeacher(db, classId, user.uid);
    const isHodUser = await isHOD(db, user.uid);
    const isAdmin = user.role === 'admin';

    if (!isTeacher && !isHodUser && !isAdmin) {
      return errorResponse("Forbidden: You do not have permission to view this class", 403);
    }

    // Enrich with counts
    const [studentCount, assignmentCount, materialCount] = await Promise.all([
      getClassStudentCount(db, classId),
      getClassAssignmentCount(db, classId),
      getClassMaterialCount(db, classId),
    ]);

    return jsonResponse({
      ...cls,
      is_active: Boolean(cls.is_active),
      student_count: studentCount,
      assignment_count: assignmentCount,
      material_count: materialCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`GET /api/teacher/classes/${classId} error:`, message);
    return errorResponse(message, 500);
  }
}

/**
 * PUT /api/teacher/classes/:id
 * Update class metadata
 * 
 * Body: Partial<{
 *   name: string (max 200 chars)
 *   description: string | null
 *   section: string | null
 *   semester: number (1-12) | null
 *   academic_year: string (format: YYYY-YY) | null
 *   grading_system: 'PERCENTAGE' | 'GPA' | 'LETTER' | 'PASS_FAIL'
 *   max_students: number
 *   is_active: boolean
 *   cover_image: string | null
 * }>
 * 
 * Requirements: 2.5, 11.2, 13.1
 */
export async function onRequestPut(context: { 
  env: { PADHAKU_CORE_DB?: D1Database; DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; 
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const db = getTeacherDb(env);
  const classId = params.id;

  if (!db) {
    return errorResponse("Database binding not configured", 500);
  }

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Fetch existing class
    const cls = await db
      .prepare(`SELECT * FROM classes WHERE id = ?`)
      .bind(classId)
      .first();

    if (!cls) {
      return errorResponse("Class not found", 404);
    }

    // Authorization: only class teacher, HOD, or admin can modify
    const isTeacher = await isClassTeacher(db, classId, user.uid);
    const isHodUser = await isHOD(db, user.uid);
    const isAdmin = user.role === 'admin';

    if (!isTeacher && !isHodUser && !isAdmin) {
      return errorResponse("Forbidden: You do not have permission to modify this class", 403);
    }

    // Parse request body
    const body: any = await request.json();
    const {
      name,
      description,
      section,
      semester,
      academic_year,
      grading_system,
      max_students,
      is_active,
      cover_image,
    } = body;

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return errorResponse("Class name cannot be empty", 400);
      }
      if (name.length > 200) {
        return errorResponse("Class name must not exceed 200 characters", 400);
      }
    }

    // Validate semester if provided
    if (semester !== undefined && semester !== null) {
      if (typeof semester !== 'number' || semester < 1 || semester > 12) {
        return errorResponse("Semester must be between 1 and 12", 400);
      }
    }

    // Validate academic year format if provided
    if (academic_year !== undefined && academic_year !== null && academic_year !== '') {
      if (!/^\d{4}-(\d{2}|\d{4})$/.test(academic_year)) {
        return errorResponse("Academic year must be in format YYYY-YY (e.g., 2024-25)", 400);
      }
    }

    // Validate grading system if provided
    if (grading_system !== undefined) {
      const validGradingSystems = ['PERCENTAGE', 'GPA', 'LETTER', 'PASS_FAIL'];
      if (!validGradingSystems.includes(grading_system)) {
        return errorResponse(`Grading system must be one of: ${validGradingSystems.join(', ')}`, 400);
      }
    }

    // Validate max_students if provided
    if (max_students !== undefined && (typeof max_students !== 'number' || max_students <= 0)) {
      return errorResponse("Max students must be a positive number", 400);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const paramsList: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      paramsList.push(name.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      paramsList.push(description);
    }
    if (section !== undefined) {
      updates.push('section = ?');
      paramsList.push(section);
    }
    if (semester !== undefined) {
      updates.push('semester = ?');
      paramsList.push(semester);
    }
    if (academic_year !== undefined) {
      let normalizedYear: string | null = null;
      if (academic_year) {
        const match = academic_year.match(/^(\d{4})-(\d{2,4})$/);
        normalizedYear = match ? `${match[1]}-${match[2].slice(-2)}` : '2026-27';
      }
      updates.push('academic_year = ?');
      paramsList.push(normalizedYear);
    }
    if (grading_system !== undefined) {
      updates.push('grading_system = ?');
      paramsList.push(grading_system);
    }
    if (max_students !== undefined) {
      updates.push('max_students = ?');
      paramsList.push(max_students);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      paramsList.push(is_active ? 1 : 0);
    }
    if (cover_image !== undefined) {
      updates.push('cover_image = ?');
      paramsList.push(cover_image);
    }

    if (updates.length === 0) {
      return errorResponse("No fields to update", 400);
    }

    // Add updated_at timestamp
    updates.push('updated_at = CURRENT_TIMESTAMP');
    paramsList.push(classId);

    // Execute update
    await db
      .prepare(`UPDATE classes SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...paramsList)
      .run();

    // Fetch updated class
    const updatedClass = await db
      .prepare(`SELECT * FROM classes WHERE id = ?`)
      .bind(classId)
      .first();
    if (!updatedClass) {
      return errorResponse("Class not found after update", 404);
    }

    // Enrich with counts
    const [studentCount, assignmentCount, materialCount] = await Promise.all([
      getClassStudentCount(db, classId),
      getClassAssignmentCount(db, classId),
      getClassMaterialCount(db, classId),
    ]);

    return jsonResponse({
      ...updatedClass,
      is_active: Boolean(updatedClass.is_active),
      student_count: studentCount,
      assignment_count: assignmentCount,
      material_count: materialCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`PUT /api/teacher/classes/${classId} error:`, message);
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/teacher/classes/:id
 * Soft delete a class (set is_active = false)
 * 
 * Requirements: 2.6, 11.2
 */
export async function onRequestDelete(context: { 
  env: { PADHAKU_CORE_DB?: D1Database; DB?: any; ASSESSMENT_DB?: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; 
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const db = getTeacherDb(env);
  const classId = params.id;

  if (!db) {
    return errorResponse("Database binding not configured", 500);
  }

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Fetch existing class
    const cls = await db
      .prepare(`SELECT * FROM classes WHERE id = ?`)
      .bind(classId)
      .first();

    if (!cls) {
      return errorResponse("Class not found", 404);
    }

    // Authorization: only class teacher, HOD, or admin can delete
    const isTeacher = await isClassTeacher(db, classId, user.uid);
    const isHodUser = await isHOD(db, user.uid);
    const isAdmin = user.role === 'admin';

    if (!isTeacher && !isHodUser && !isAdmin) {
      return errorResponse("Forbidden: You do not have permission to delete this class", 403);
    }

    // Check if class has active enrollments
    const studentCount = await getClassStudentCount(db, classId);
    
    if (studentCount > 0) {
      return errorResponse(
        `Cannot delete class with ${studentCount} active students. Please withdraw all students first.`,
        409
      );
    }

    // Soft delete: set is_active = 0
    await db
      .prepare(`UPDATE classes SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(classId)
      .run();

    return jsonResponse({
      success: true,
      message: "Class deleted successfully",
      classId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`DELETE /api/teacher/classes/${classId} error:`, message);
    return errorResponse(message, 500);
  }
}
