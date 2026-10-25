import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * GET /api/teacher/messages/:id
 * Get messages in a specific thread
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * - mark_as_read: Auto-mark messages as read (default: true)
 * 
 * Requirements: Thread message retrieval
 */
export async function onRequestGet(context: {
  env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const threadId = params.id;
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

    // Verify user is participant in thread
    const participation = await env.ASSESSMENT_DB
      .prepare(
        `SELECT tp.*, mt.title, mt.thread_type, mt.class_id, mt.assignment_id
         FROM thread_participants tp
         JOIN message_threads mt ON tp.thread_id = mt.id
         WHERE tp.thread_id = ? AND tp.user_id = ?`
      )
      .bind(threadId, user.uid)
      .first();

    if (!participation) {
      return errorResponse("Thread not found or you don't have access to it", 404);
    }

    // Parse query params
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = (page - 1) * limit;
    const markAsRead = url.searchParams.get("mark_as_read") !== "false";

    // Get total message count
    const countResult = await env.ASSESSMENT_DB
      .prepare("SELECT COUNT(*) as total FROM messages WHERE thread_id = ?")
      .bind(threadId)
      .first();

    const total = countResult?.total || 0;

    // Fetch messages with sender info and read receipts
    const messages = await env.ASSESSMENT_DB
      .prepare(
        `SELECT 
          m.id,
          m.thread_id,
          m.sender_id,
          m.message_type,
          m.content,
          m.attachments,
          m.reply_to_message_id,
          m.is_edited,
          m.edited_at,
          m.sent_at,
          sp.name as sender_name,
          u.role as sender_role,
          -- Get read receipt for current user
          mrr.read_at as read_at,
          -- Get total read count
          (SELECT COUNT(*) FROM message_read_receipts WHERE message_id = m.id) as read_count,
          -- Get participants count for read percentage
          (SELECT COUNT(*) FROM thread_participants WHERE thread_id = m.thread_id) as total_participants,
          -- Get reply-to message if any
          reply_msg.content as reply_to_content,
          reply_sender.name as reply_to_sender_name
         FROM messages m
         LEFT JOIN student_profiles sp ON m.sender_id = sp.user_id
         LEFT JOIN users u ON m.sender_id = u.uid
         LEFT JOIN message_read_receipts mrr ON m.id = mrr.message_id AND mrr.user_id = ?
         LEFT JOIN messages reply_msg ON m.reply_to_message_id = reply_msg.id
         LEFT JOIN student_profiles reply_sender ON reply_msg.sender_id = reply_sender.user_id
         WHERE m.thread_id = ?
         ORDER BY m.sent_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(user.uid, threadId, limit, offset)
      .all();

    // Parse JSON fields and add metadata
    const messagesWithMetadata = (messages.results || []).map((msg: any) => ({
      ...msg,
      attachments: msg.attachments ? JSON.parse(msg.attachments) : null,
      is_own_message: msg.sender_id === user.uid,
      read_percentage: msg.total_participants > 0 
        ? ((msg.read_count / msg.total_participants) * 100).toFixed(1)
        : "0.0",
    }));

    // Mark unread messages as read if requested
    if (markAsRead) {
      const unreadMessages = messagesWithMetadata.filter(m => !m.read_at && !m.is_own_message);
      
      if (unreadMessages.length > 0) {
        const now_iso = new Date().toISOString();
        const readReceiptInserts = unreadMessages.map(msg =>
          env.ASSESSMENT_DB
            .prepare(
              `INSERT OR IGNORE INTO message_read_receipts (id, message_id, user_id, read_at)
               VALUES (?, ?, ?, ?)`
            )
            .bind(crypto.randomUUID(), msg.id, user.uid, now_iso)
            .run()
        );

        await Promise.all(readReceiptInserts);

        // Update last_read_at for participant
        await env.ASSESSMENT_DB
          .prepare(
            `UPDATE thread_participants 
             SET last_read_at = ? 
             WHERE thread_id = ? AND user_id = ?`
          )
          .bind(now_iso, threadId, user.uid)
          .run();
      }
    }

    // Get thread participants info
    const participants = await env.ASSESSMENT_DB
      .prepare(
        `SELECT 
          tp.user_id,
          tp.role,
          tp.joined_at,
          tp.last_read_at,
          tp.is_muted,
          sp.name as participant_name,
          sp.email as participant_email,
          u.role as user_role
         FROM thread_participants tp
         LEFT JOIN student_profiles sp ON tp.user_id = sp.user_id
         LEFT JOIN users u ON tp.user_id = u.uid
         WHERE tp.thread_id = ?
         ORDER BY tp.joined_at ASC`
      )
      .bind(threadId)
      .all();

    // Get typing indicators
    const typingUsers = await env.ASSESSMENT_DB
      .prepare(
        `SELECT 
          ti.user_id,
          sp.name as user_name
         FROM typing_indicators ti
         LEFT JOIN student_profiles sp ON ti.user_id = sp.user_id
         WHERE ti.thread_id = ? AND ti.user_id != ? AND ti.is_typing = 1
           AND ti.updated_at > datetime('now', '-10 seconds')`
      )
      .bind(threadId, user.uid)
      .all();

    return jsonResponse({
      thread: {
        id: threadId,
        title: participation.title,
        thread_type: participation.thread_type,
        class_id: participation.class_id,
        assignment_id: participation.assignment_id,
      },
      messages: messagesWithMetadata.reverse(), // Show oldest first
      participants: participants.results || [],
      typing_users: (typingUsers.results || []).map((tu: any) => ({
        user_id: tu.user_id,
        user_name: tu.user_name,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
      user_participation: {
        role: participation.role,
        joined_at: participation.joined_at,
        last_read_at: participation.last_read_at,
        is_muted: Boolean(participation.is_muted),
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/teacher/messages/:id error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * PUT /api/teacher/messages/:id
 * Update thread settings or mark messages as read
 * 
 * Body: {
 *   action: 'update_settings' | 'mark_read' | 'archive' | 'unarchive';
 *   title?: string; // For update_settings
 *   is_muted?: boolean; // For update_settings
 *   message_ids?: string[]; // For mark_read
 * }
 * 
 * Requirements: Thread management
 */
export async function onRequestPut(context: {
  env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const threadId = params.id;

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
    const { action, title, is_muted, message_ids } = body;

    // Verify user is participant in thread
    const participation = await env.ASSESSMENT_DB
      .prepare(
        `SELECT * FROM thread_participants 
         WHERE thread_id = ? AND user_id = ?`
      )
      .bind(threadId, user.uid)
      .first();

    if (!participation) {
      return errorResponse("Thread not found or you don't have access to it", 404);
    }

    const now_iso = new Date().toISOString();

    switch (action) {
      case 'update_settings':
        // Update thread title (only creator can do this)
        if (title !== undefined && participation.role === 'CREATOR') {
          await env.ASSESSMENT_DB
            .prepare("UPDATE message_threads SET title = ?, updated_at = ? WHERE id = ?")
            .bind(title, now_iso, threadId)
            .run();
        }

        // Update mute settings for user
        if (is_muted !== undefined) {
          await env.ASSESSMENT_DB
            .prepare(
              `UPDATE thread_participants 
               SET is_muted = ? 
               WHERE thread_id = ? AND user_id = ?`
            )
            .bind(is_muted ? 1 : 0, threadId, user.uid)
            .run();
        }

        return jsonResponse({
          success: true,
          message: "Settings updated successfully",
        });

      case 'mark_read':
        if (!message_ids || !Array.isArray(message_ids)) {
          return errorResponse("message_ids array is required for mark_read action", 400);
        }

        // Mark specified messages as read
        const readReceiptInserts = message_ids.map(messageId =>
          env.ASSESSMENT_DB
            .prepare(
              `INSERT OR IGNORE INTO message_read_receipts (id, message_id, user_id, read_at)
               VALUES (?, ?, ?, ?)`
            )
            .bind(crypto.randomUUID(), messageId, user.uid, now_iso)
            .run()
        );

        await Promise.all(readReceiptInserts);

        // Update last_read_at for participant
        await env.ASSESSMENT_DB
          .prepare(
            `UPDATE thread_participants 
             SET last_read_at = ? 
             WHERE thread_id = ? AND user_id = ?`
          )
          .bind(now_iso, threadId, user.uid)
          .run();

        return jsonResponse({
          success: true,
          message: `Marked ${message_ids.length} messages as read`,
        });

      case 'archive':
      case 'unarchive':
        // Only creator can archive/unarchive thread
        if (participation.role !== 'CREATOR') {
          return errorResponse("Only thread creator can archive/unarchive threads", 403);
        }

        const isArchived = action === 'archive' ? 1 : 0;
        await env.ASSESSMENT_DB
          .prepare("UPDATE message_threads SET is_archived = ?, updated_at = ? WHERE id = ?")
          .bind(isArchived, now_iso, threadId)
          .run();

        return jsonResponse({
          success: true,
          message: `Thread ${action}d successfully`,
        });

      default:
        return errorResponse("Invalid action. Allowed: update_settings, mark_read, archive, unarchive", 400);
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PUT /api/teacher/messages/:id error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/teacher/messages/:id/typing
 * Update typing indicator for thread
 * 
 * Body: {
 *   is_typing: boolean;
 * }
 * 
 * Requirements: Real-time typing indicators
 */
export async function onRequestPost(context: {
  env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const threadId = params.id;
  const url = new URL(request.url);

  try {
    // Check if this is the typing endpoint
    if (!url.pathname.endsWith('/typing')) {
      return errorResponse("Invalid endpoint", 404);
    }

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
    const { is_typing } = body;

    if (typeof is_typing !== 'boolean') {
      return errorResponse("is_typing must be a boolean", 400);
    }

    // Verify user is participant in thread
    const isParticipant = await env.ASSESSMENT_DB
      .prepare(
        `SELECT 1 FROM thread_participants 
         WHERE thread_id = ? AND user_id = ?`
      )
      .bind(threadId, user.uid)
      .first();

    if (!isParticipant) {
      return errorResponse("Thread not found or you don't have access to it", 404);
    }

    const now_iso = new Date().toISOString();

    if (is_typing) {
      // Update or insert typing indicator
      await env.ASSESSMENT_DB
        .prepare(
          `INSERT OR REPLACE INTO typing_indicators 
           (id, thread_id, user_id, is_typing, updated_at)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(crypto.randomUUID(), threadId, user.uid, 1, now_iso)
        .run();
    } else {
      // Remove typing indicator
      await env.ASSESSMENT_DB
        .prepare(
          `DELETE FROM typing_indicators 
           WHERE thread_id = ? AND user_id = ?`
        )
        .bind(threadId, user.uid)
        .run();
    }

    return jsonResponse({
      success: true,
      message: `Typing indicator ${is_typing ? 'set' : 'cleared'}`,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/teacher/messages/:id/typing error:", message);
    return errorResponse(message, 500);
  }
}