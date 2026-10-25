import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * GET /api/teacher/events
 * Server-Sent Events endpoint for real-time updates
 * 
 * Query params:
 * - class_id: Subscribe to specific class updates (optional)
 * 
 * Requirements: 10.1, 10.2
 */
export async function onRequestGet(context: {
  env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
}) {
  const { env, request } = context;
  const url = new URL(request.url);

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Check if user has teacher role
    if (user.role !== 'teacher') {
      return new Response("Forbidden: Teacher access required", { status: 403 });
    }

    const classId = url.searchParams.get("class_id");

    // Verify class ownership if class_id is provided
    if (classId) {
      const classInfo = await env.ASSESSMENT_DB
        .prepare("SELECT id, teacher_id FROM classes WHERE id = ?")
        .bind(classId)
        .first();

      if (!classInfo || classInfo.teacher_id !== user.uid) {
        return new Response("Forbidden: Class access denied", { status: 403 });
      }
    }

    // Create SSE response
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const initialMessage = {
          type: 'connection',
          timestamp: new Date().toISOString(),
          message: 'Connected to teacher events stream',
          user_id: user.uid,
          class_id: classId || null
        };

        controller.enqueue(`data: ${JSON.stringify(initialMessage)}\n\n`);

        // Set up periodic updates (every 30 seconds for keepalive)
        const keepaliveInterval = setInterval(() => {
          try {
            const keepaliveMessage = {
              type: 'keepalive',
              timestamp: new Date().toISOString(),
            };
            controller.enqueue(`data: ${JSON.stringify(keepaliveMessage)}\n\n`);
          } catch (error) {
            clearInterval(keepaliveInterval);
            controller.close();
          }
        }, 30000);

        // Simulate real-time updates check (in production, this would be event-driven)
        const updateInterval = setInterval(async () => {
          try {
            // Check for recent updates in teacher's classes
            const updates = await checkForUpdates(env.ASSESSMENT_DB, user.uid, classId);
            
            if (updates.length > 0) {
              for (const update of updates) {
                controller.enqueue(`data: ${JSON.stringify(update)}\n\n`);
              }
            }
          } catch (error) {
            console.error('Error checking for updates:', error);
            clearInterval(updateInterval);
            clearInterval(keepaliveInterval);
            controller.close();
          }
        }, 10000); // Check every 10 seconds

        // Clean up on client disconnect
        request.signal?.addEventListener('abort', () => {
          clearInterval(keepaliveInterval);
          clearInterval(updateInterval);
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/teacher/events error:", message);
    return new Response(`Server Error: ${message}`, { status: 500 });
  }
}

/**
 * Check for recent updates in teacher's classes
 */
async function checkForUpdates(db: any, teacherId: string, classId?: string | null): Promise<any[]> {
  const updates: any[] = [];
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  try {
    // Build class filter
    let classFilter = "c.teacher_id = ?";
    const params = [teacherId];
    
    if (classId) {
      classFilter += " AND c.id = ?";
      params.push(classId);
    }

    // Check for new assignment submissions
    const newSubmissions = await db
      .prepare(
        `SELECT 
          asub.id,
          asub.assignment_id,
          asub.student_id,
          asub.submitted_at,
          asub.status,
          a.title as assignment_title,
          c.name as class_name,
          sp.name as student_name
         FROM assignment_submissions asub
         JOIN assignments a ON asub.assignment_id = a.id
         JOIN classes c ON a.class_id = c.id
         LEFT JOIN student_profiles sp ON asub.student_id = sp.user_id
         WHERE ${classFilter} AND asub.submitted_at >= ?
         ORDER BY asub.submitted_at DESC
         LIMIT 5`
      )
      .bind(...params, fiveMinutesAgo)
      .all();

    for (const submission of (newSubmissions.results || [])) {
      updates.push({
        type: 'assignment_submission',
        timestamp: submission.submitted_at,
        message: `New submission from ${submission.student_name || 'Unknown Student'}`,
        data: {
          submission_id: submission.id,
          assignment_id: submission.assignment_id,
          assignment_title: submission.assignment_title,
          class_name: submission.class_name,
          student_name: submission.student_name,
          status: submission.status
        }
      });
    }

    // Check for new student enrollments
    const newEnrollments = await db
      .prepare(
        `SELECT 
          ce.id,
          ce.student_id,
          ce.enrollment_number,
          ce.enrolled_at,
          ce.enrollment_status,
          c.name as class_name,
          sp.name as student_name
         FROM class_enrollments ce
         JOIN classes c ON ce.class_id = c.id
         LEFT JOIN student_profiles sp ON ce.student_id = sp.user_id
         WHERE ${classFilter} AND ce.enrolled_at >= ?
         ORDER BY ce.enrolled_at DESC
         LIMIT 5`
      )
      .bind(...params, fiveMinutesAgo)
      .all();

    for (const enrollment of (newEnrollments.results || [])) {
      updates.push({
        type: 'student_enrollment',
        timestamp: enrollment.enrolled_at,
        message: `New enrollment: ${enrollment.student_name || enrollment.enrollment_number}`,
        data: {
          enrollment_id: enrollment.id,
          student_name: enrollment.student_name,
          enrollment_number: enrollment.enrollment_number,
          class_name: enrollment.class_name,
          status: enrollment.enrollment_status
        }
      });
    }

    // Check for new material views
    const newMaterialViews = await db
      .prepare(
        `SELECT 
          ms.material_id,
          ms.student_id,
          ms.viewed_at,
          cm.title as material_title,
          c.name as class_name,
          sp.name as student_name
         FROM material_stats ms
         JOIN class_materials cm ON ms.material_id = cm.id
         JOIN classes c ON cm.class_id = c.id
         LEFT JOIN student_profiles sp ON ms.student_id = sp.user_id
         WHERE ${classFilter} AND ms.viewed_at >= ?
         ORDER BY ms.viewed_at DESC
         LIMIT 3`
      )
      .bind(...params, fiveMinutesAgo)
      .all();

    for (const view of (newMaterialViews.results || [])) {
      updates.push({
        type: 'material_access',
        timestamp: view.viewed_at,
        message: `${view.student_name || 'Student'} accessed ${view.material_title}`,
        data: {
          material_id: view.material_id,
          material_title: view.material_title,
          student_name: view.student_name,
          class_name: view.class_name
        }
      });
    }

  } catch (error) {
    console.error('Error in checkForUpdates:', error);
  }

  return updates;
}