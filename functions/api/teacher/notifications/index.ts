import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * GET /api/teacher/notifications
 * Get notifications for the authenticated teacher
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 * - is_read: Filter by read status (1/0/all)
 * - type: Filter by notification type
 * 
 * Requirements: 8.1, 8.2
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
      return errorResponse("Unauthorized", 401);
    }

    // Check if user has teacher role
    if (user.role !== 'teacher') {
      return errorResponse("Forbidden: Teacher access required", 403);
    }

    // Parse query params
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;
    const isRead = url.searchParams.get("is_read") || "all";
    const type = url.searchParams.get("type");

    // Build WHERE clause
    let whereClause = "user_id = ?";
    const params_bind: any[] = [user.uid];

    if (isRead !== "all") {
      whereClause += " AND is_read = ?";
      params_bind.push(parseInt(isRead));
    }

    if (type) {
      whereClause += " AND type = ?";
      params_bind.push(type);
    }

    // Get total count
    const countResult = await env.ASSESSMENT_DB
      .prepare(`SELECT COUNT(*) as total FROM notifications WHERE ${whereClause}`)
      .bind(...params_bind)
      .first();

    const total = countResult?.total || 0;

    // Fetch notifications
    const notifications = await env.ASSESSMENT_DB
      .prepare(
        `SELECT * FROM notifications 
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params_bind, limit, offset)
      .all();

    // Parse metadata for each notification
    const notificationsWithMetadata = (notifications.results || []).map((notification: any) => ({
      ...notification,
      metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
    }));

    return jsonResponse({
      notifications: notificationsWithMetadata,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/teacher/notifications error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/teacher/notifications
 * Create a notification (usually for announcements to students)
 * 
 * Body: {
 *   class_id?: string,
 *   user_ids?: string[],
 *   type: string,
 *   channel: 'IN_APP' | 'EMAIL' | 'SMS',
 *   title: string,
 *   message: string,
 *   link?: string,
 *   metadata?: object
 * }
 * 
 * Requirements: 8.3, 8.4
 */
export async function onRequestPost(context: {
  env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
}) {
  const { env, request } = context;

  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request, env);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Check if user has teacher role
    if (user.role !== 'teacher') {
      return errorResponse("Forbidden: Teacher access required", 403);
    }

    const body: any = await request.json();
    const {
      class_id,
      user_ids,
      type,
      channel = 'IN_APP',
      title,
      message,
      link,
      metadata
    } = body;

    // Validate required fields
    if (!type || !title || !message) {
      return errorResponse("Missing required fields: type, title, message", 400);
    }

    if (title.length > 200) {
      return errorResponse("Title must be 200 characters or less", 400);
    }

    if (message.length > 1000) {
      return errorResponse("Message must be 1000 characters or less", 400);
    }

    const validChannels = ['IN_APP', 'EMAIL', 'SMS'];
    if (!validChannels.includes(channel)) {
      return errorResponse(`Invalid channel. Must be one of: ${validChannels.join(', ')}`, 400);
    }

    let targetUserIds: string[] = [];

    // Determine target users
    if (user_ids && Array.isArray(user_ids)) {
      targetUserIds = user_ids;
    } else if (class_id) {
      // Verify teacher owns the class
      const classInfo = await env.ASSESSMENT_DB
        .prepare("SELECT id, teacher_id FROM classes WHERE id = ?")
        .bind(class_id)
        .first();

      if (!classInfo) {
        return errorResponse("Class not found", 404);
      }

      if (classInfo.teacher_id !== user.uid) {
        return errorResponse("Forbidden: You can only send notifications to your own classes", 403);
      }

      // Get enrolled students
      const students = await env.ASSESSMENT_DB
        .prepare(
          "SELECT student_id FROM class_enrollments WHERE class_id = ? AND enrollment_status = 'ACTIVE' AND student_id IS NOT NULL"
        )
        .bind(class_id)
        .all();

      targetUserIds = (students.results || []).map((s: any) => s.student_id);
    } else {
      return errorResponse("Either class_id or user_ids must be provided", 400);
    }

    if (targetUserIds.length === 0) {
      return errorResponse("No target users found", 400);
    }

    // Create notifications for all target users
    const now_iso = new Date().toISOString();
    const createdNotifications: Array<{
      id: string;
      user_id: string;
      type: string;
      channel: string;
      title: string;
      message: string;
      link: string | null;
      metadata: unknown;
      created_at: string;
    }> = [];

    for (const userId of targetUserIds) {
      const notificationId = crypto.randomUUID();
      
      const result = await env.ASSESSMENT_DB
        .prepare(
          `INSERT INTO notifications 
           (id, user_id, type, channel, title, message, link, metadata, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          notificationId,
          userId,
          type,
          channel,
          title,
          message,
          link || null,
          metadata ? JSON.stringify(metadata) : null,
          now_iso
        )
        .run();

      if (result.success) {
        createdNotifications.push({
          id: notificationId,
          user_id: userId,
          type,
          channel,
          title,
          message,
          link,
          metadata,
          created_at: now_iso
        });
      }
    }

    return jsonResponse({
      success: true,
      message: `${createdNotifications.length} notifications created successfully`,
      notifications_created: createdNotifications.length,
      target_users: targetUserIds.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/teacher/notifications error:", message);
    return errorResponse(message, 500);
  }
}
