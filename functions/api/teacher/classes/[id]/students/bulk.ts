// ============================================================
// TEACHER API: POST /api/teacher/classes/:id/students/bulk
// Bulk enrolls students by Excel/CSV roster (name, enrollment, email) into a class
// Automatically whitelists student emails for beta.shikshasahayak.org
// Dispatches student class invitation records and join links
// ============================================================

import { jsonResponse, errorResponse } from "../../../../../lib/json";
import { getAuthenticatedUser } from "../../../../../lib/auth";
import { syncBetaUserToFirestoreREST } from "../../../../../lib/firestoreRestService";

export interface StudentInput {
  name?: string;
  fullName?: string;
  student_name?: string;
  enrollment_number?: string;
  enrollmentNumber?: string;
  roll_no?: string;
  rollNo?: string;
  email?: string;
  student_email?: string;
  email_address?: string;
}

export async function onRequestPost(context: {
  env: { PADHAKU_CORE_DB?: D1Database; DB?: D1Database; ASSESSMENT_DB?: D1Database; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const classId = params.id;
  const db = (env.PADHAKU_CORE_DB || env.ASSESSMENT_DB) || env.DB;

  if (!db) {
    return errorResponse("Database binding not found", 500);
  }

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !user.uid) {
      return errorResponse("Unauthorized - Teacher authentication required", 401);
    }

    // Fetch class details
    const classInfo = await db
      .prepare("SELECT id, name, join_code, teacher_id, section, semester, max_students, is_active FROM classes WHERE id = ?")
      .bind(classId)
      .first<{
        id: string;
        name: string;
        join_code: string;
        teacher_id: string;
        section?: string;
        semester?: number;
        max_students?: number;
        is_active?: number;
      }>();

    if (!classInfo) {
      return errorResponse("Class not found", 404);
    }

    const body = (await request.json().catch(() => ({}))) as {
      students?: StudentInput[];
      enrollment_numbers?: string[];
      enrollmentNumbers?: string[];
    };

    // Normalize students input (supports both full student objects & legacy array of enrollment numbers)
    let studentList: Array<{ name: string; enrollment_number: string; email: string }> = [];

    if (Array.isArray(body.students) && body.students.length > 0) {
      studentList = body.students.map((s) => {
        const name = (s.name || s.fullName || s.student_name || "").trim();
        const enrollment_number = (s.enrollment_number || s.enrollmentNumber || s.roll_no || s.rollNo || "").trim();
        const email = (s.email || s.student_email || s.email_address || "").trim().toLowerCase();
        return { name, enrollment_number, email };
      });
    } else {
      const numbers = body.enrollment_numbers || body.enrollmentNumbers || [];
      studentList = numbers.map((n) => ({
        name: "",
        enrollment_number: String(n).trim(),
        email: "",
      }));
    }

    // Filter out rows without enrollment number or email
    const validStudents = studentList.filter((s) => s.enrollment_number || s.email);

    if (validStudents.length === 0) {
      return errorResponse("No valid students found in the upload payload", 400);
    }

    const successful: any[] = [];
    const failed: any[] = [];
    const whitelistedEmails: string[] = [];
    const invitationsDispatched: string[] = [];
    const nowIso = new Date().toISOString();
    const teacherEmail = user.email || "teacher@shikshasahayak.org";
    const teacherName = user.name || "Course Instructor";

    // Ensure supporting tables exist
    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS user_beta_access (
          user_id TEXT PRIMARY KEY,
          is_beta_tester INTEGER NOT NULL DEFAULT 1,
          custom_flags_json TEXT,
          notes TEXT,
          granted_by TEXT,
          granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_active_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
    } catch {}

    try {
      await db.prepare(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          type TEXT NOT NULL,
          channel TEXT NOT NULL CHECK (channel IN ('IN_APP', 'EMAIL', 'SMS')),
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          link TEXT,
          metadata TEXT,
          is_read INTEGER NOT NULL DEFAULT 0,
          read_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
    } catch {}

    for (const student of validStudents) {
      const cleanEnrollment = student.enrollment_number;
      const cleanEmail = student.email;
      const cleanName = student.name || (cleanEmail ? cleanEmail.split("@")[0] : cleanEnrollment);

      if (!cleanEnrollment && !cleanEmail) continue;

      const enrollId = `ce_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const studentId = cleanEmail
        ? `student_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`
        : `student_${cleanEnrollment.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

      try {
        // 1. Check if already enrolled in this class
        let existingEnrollment: any = null;
        if (cleanEnrollment) {
          existingEnrollment = await db
            .prepare("SELECT id, enrollment_status FROM class_enrollments WHERE class_id = ? AND enrollment_number = ? LIMIT 1")
            .bind(classId, cleanEnrollment)
            .first();
        }
        if (!existingEnrollment && cleanEmail) {
          existingEnrollment = await db
            .prepare("SELECT id, enrollment_status FROM class_enrollments WHERE class_id = ? AND student_id = ? LIMIT 1")
            .bind(classId, studentId)
            .first();
        }

        if (existingEnrollment) {
          // Reactivate or keep active
          await db
            .prepare(`
              UPDATE class_enrollments 
              SET enrollment_status = 'ACTIVE', 
                  enrolled_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `)
            .bind(existingEnrollment.id)
            .run();
        } else {
          // Insert new enrollment record
          await db
            .prepare(`
              INSERT INTO class_enrollments (
                id, class_id, student_id, enrollment_number, enrollment_status, enrolled_at, is_placeholder
              ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, 0)
            `)
            .bind(enrollId, classId, studentId, cleanEnrollment || null, nowIso)
            .run();
        }

        // 2. Upsert student in unified_users if email is present
        if (cleanEmail) {
          try {
            await db
              .prepare(`
                INSERT INTO unified_users (id, uid, email, display_name, user_type, ai_beta_enabled)
                VALUES (?, ?, ?, ?, 'student', 1)
                ON CONFLICT(email) DO UPDATE SET
                  display_name = COALESCE(excluded.display_name, unified_users.display_name),
                  ai_beta_enabled = 1,
                  updated_at = CURRENT_TIMESTAMP
              `)
              .bind(studentId, studentId, cleanEmail, cleanName)
              .run();
          } catch {}

          // 3. Automatically add student email to Beta Whitelist in Cloudflare D1
          try {
            await db
              .prepare(`
                INSERT INTO user_beta_access (user_id, is_beta_tester, granted_by, granted_at, notes)
                VALUES (?, 1, ?, CURRENT_TIMESTAMP, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                  is_beta_tester = 1,
                  granted_by = excluded.granted_by,
                  granted_at = CURRENT_TIMESTAMP,
                  notes = excluded.notes
              `)
              .bind(cleanEmail, teacherEmail, `Enrolled in ${classInfo.name} (${classInfo.join_code})`)
              .run();
          } catch {}

          // 4. Automatically sync student email to Firebase Firestore beta_whitelist collection via REST API
          try {
            await syncBetaUserToFirestoreREST({
              email: cleanEmail,
              status: "approved",
              notes: `Enrolled in ${classInfo.name} (${classInfo.join_code})`,
              addedBy: teacherEmail,
            });
            whitelistedEmails.push(cleanEmail);
          } catch (fsErr) {
            console.warn(`Firestore beta whitelist sync warning for ${cleanEmail}:`, fsErr);
          }

          // 5. Create student invitation record in Notifications table
          try {
            const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const joinLink = `https://beta.shikshasahayak.org/login?joinCode=${encodeURIComponent(classInfo.join_code)}`;
            const inviteMessage = `Hello ${cleanName}, you have been enrolled in "${classInfo.name}" by Prof. ${teacherName}. Your Class Join Code is: ${classInfo.join_code}. Access your class study materials, live attendance, and assignments directly.`;

            await db
              .prepare(`
                INSERT INTO notifications (
                  id, user_id, type, channel, title, message, link, metadata, created_at
                ) VALUES (?, ?, 'CLASS_INVITATION', 'EMAIL', ?, ?, ?, ?, CURRENT_TIMESTAMP)
              `)
              .bind(
                notificationId,
                studentId,
                `Class Invitation: ${classInfo.name}`,
                inviteMessage,
                joinLink,
                JSON.stringify({
                  classId,
                  className: classInfo.name,
                  joinCode: classInfo.join_code,
                  teacherName,
                  teacherEmail,
                  studentEmail: cleanEmail,
                  studentName: cleanName,
                  studentEnrollment: cleanEnrollment,
                  portalUrl: "https://beta.shikshasahayak.org",
                })
              )
              .run();

            invitationsDispatched.push(cleanEmail);
          } catch (notifErr) {
            console.warn(`Notification record creation warning for ${cleanEmail}:`, notifErr);
          }
        }

        successful.push({
          name: cleanName,
          enrollment_number: cleanEnrollment,
          email: cleanEmail,
          student_id: studentId,
          whitelisted: cleanEmail ? true : false,
          invitation_sent: cleanEmail ? true : false,
        });
      } catch (err: any) {
        failed.push({
          name: cleanName,
          enrollment_number: cleanEnrollment,
          email: cleanEmail,
          error: err.message || "Failed to process enrollment",
        });
      }
    }

    return jsonResponse({
      success: true,
      message: `Enrolled ${successful.length} student(s) successfully into "${classInfo.name}". ${whitelistedEmails.length} email(s) whitelisted on beta.shikshasahayak.org.`,
      data: {
        successful,
        failed,
        whitelistedEmailsCount: whitelistedEmails.length,
        invitationsDispatchedCount: invitationsDispatched.length,
        classDetails: {
          id: classInfo.id,
          name: classInfo.name,
          joinCode: classInfo.join_code,
        },
        summary: {
          total: validStudents.length,
          successful: successful.length,
          failed: failed.length,
          whitelisted: whitelistedEmails.length,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to bulk enroll students";
    console.error("POST /api/teacher/classes/:id/students/bulk error:", message);
    return errorResponse(message, 500);
  }
}

