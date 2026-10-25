import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * GET /api/teacher/messages
 * Get message threads for the teacher
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 * - search: Search by participant name or thread title
 * - thread_type: Filter by thread type (DIRECT, GROUP, CLASS_ANNOUNCEMENT)
 * - class_id: Filter by class
 * - unread_only: Show only threads with unread messages
 * 
 * Requirements: Teacher messaging system
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
    const search = url.searchParams.get("search");
    const threadType = url.searchParams.get("thread_type");
    const classId = url.searchParams.get("class_id");
    const unreadOnly = url.searchParams.get("unread_only") === "true";

    // Build WHERE clause
    let whereClause = "tp.user_id = ?";
    const params: any[] = [user.uid];

    if (threadType) {
      whereClause += " AND mt.thread_type = ?";
      params.push(threadType);
    }

    if (classId) {
      whereClause += " AND mt.class_id = ?";
      params.push(classId);
    }

    if (search) {
      whereClause += ` AND (
        mt.title LIKE ? OR 
        EXISTS (
          SELECT 1 FROM thread_participants tp2 
          JOIN student_profiles sp ON tp2.user_id = sp.user_id 
          WHERE tp2.thread_id = mt.id AND sp.name LIKE ?
        )
      )`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (unreadOnly) {
      whereClause += ` AND EXISTS (
        SELECT 1 FROM messages m 
        LEFT JOIN message_read_receipts mrr ON m.id = mrr.message_id AND mrr.user_id = ?
        WHERE m.thread_id = mt.id AND m.sender_id != ? AND mrr.id IS NULL
      )`;
      params.push(user.uid, user.uid);
    }

    // Get total count
    const countResult = await env.ASSESSMENT_DB
      .prepare(
        `SELECT COUNT(DISTINCT mt.id) as total 
         FROM message_threads mt
         JOIN thread_participants tp ON mt.id = tp.thread_id
         WHERE ${whereClause}`
      )
      .bind(...params)
      .first();

    const total = countResult?.total || 0;

    // Fetch threads with metadata
    const threads = await env.ASSESSMENT_DB
      .prepare(
        `SELECT DISTINCT
          mt.id,
          mt.title,
          mt.thread_type,
          mt.class_id,
          mt.assignment_id,
          mt.is_archived,
          mt.last_message_at,
          mt.created_at,
          c.name as class_name,
          c.section as class_section,
          a.title as assignment_title,
          -- Get latest message
          latest_msg.content as last_message_content,
          latest_msg.message_type as last_message_type,
          latest_msg.sender_id as last_message_sender_id,
          latest_sender.name as last_message_sender_name,
          -- Get unread count
          (SELECT COUNT(m2.id) 
           FROM messages m2 
           LEFT JOIN message_read_receipts mrr2 ON m2.id = mrr2.message_id AND mrr2.user_id = ?
           WHERE m2.thread_id = mt.id AND m2.sender_id != ? AND mrr2.id IS NULL) as unread_count,
          -- Get participant count
          (SELECT COUNT(tp2.id) FROM thread_participants tp2 WHERE tp2.thread_id = mt.id) as participant_count
         FROM message_threads mt
         JOIN thread_participants tp ON mt.id = tp.thread_id
         LEFT JOIN classes c ON mt.class_id = c.id
         LEFT JOIN assignments a ON mt.assignment_id = a.id
         LEFT JOIN messages latest_msg ON mt.id = latest_msg.thread_id 
           AND latest_msg.sent_at = mt.last_message_at
         LEFT JOIN student_profiles latest_sender ON latest_msg.sender_id = latest_sender.user_id
         WHERE ${whereClause}
         ORDER BY mt.last_message_at DESC NULLS LAST, mt.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params, user.uid, user.uid, limit, offset)
      .all();

    // Get participants for each thread
    const threadsWithParticipants = await Promise.all(
      (threads.results || []).map(async (thread: any) => {
        const participants = await env.ASSESSMENT_DB
          .prepare(
            `SELECT 
              tp.user_id,
              tp.role,
              tp.joined_at,
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
          .bind(thread.id)
          .all();

        return {
          ...thread,
          participants: participants.results || [],
        };
      })
    );

    return jsonResponse({
      threads: threadsWithParticipants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
      filters: {
        search,
        thread_type: threadType,
        class_id: classId,
        unread_only: unreadOnly,
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/teacher/messages error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * POST /api/teacher/messages
 * Create a new message thread or send message to existing thread
 * 
 * Body: {
 *   thread_id?: string; // If provided, send to existing thread
 *   recipient_ids?: string[]; // If creating new thread
 *   title?: string; // Thread title (for new threads)
 *   class_id?: string; // Optional class context
 *   assignment_id?: string; // Optional assignment context
 *   content: string;
 *   message_type?: 'TEXT' | 'FILE' | 'IMAGE';
 *   attachments?: string[];
 *   reply_to_message_id?: string;
 * }
 * 
 * Requirements: Teacher messaging
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
      thread_id,
      recipient_ids,
      title,
      class_id,
      assignment_id,
      content,
      message_type = 'TEXT',
      attachments,
      reply_to_message_id,
    } = body;

    if (!content || content.trim().length === 0) {
      return errorResponse("content is required and cannot be empty", 400);
    }

    const now_iso = new Date().toISOString();
    let threadId = thread_id;

    // Create new thread if thread_id not provided
    if (!threadId) {
      if (!recipient_ids || !Array.isArray(recipient_ids) || recipient_ids.length === 0) {
        return errorResponse("recipient_ids is required when creating new thread", 400);
      }

      // Verify recipients are valid students in teacher's classes
      const recipientChecks = await Promise.all(
        recipient_ids.map(async (recipientId: string) => {
          const isValidStudent = await env.ASSESSMENT_DB
            .prepare(
              `SELECT 1 FROM class_enrollments ce
               JOIN classes c ON ce.class_id = c.id
               WHERE ce.student_id = ? AND c.teacher_id = ? AND ce.enrollment_status = 'ACTIVE'`
            )
            .bind(recipientId, user.uid)
            .first();
          
          return { recipientId, isValid: !!isValidStudent };
        })
      );

      const invalidRecipients = recipientChecks.filter(r => !r.isValid);
      if (invalidRecipients.length > 0) {
        return errorResponse(
          `Invalid recipients: ${invalidRecipients.map(r => r.recipientId).join(', ')}. Recipients must be students enrolled in your classes.`,
          400
        );
      }

      // Create new thread
      threadId = crypto.randomUUID();
      const threadTitle = title || `Conversation with ${recipient_ids.length} student(s)`;

      const createThreadResult = await env.ASSESSMENT_DB
        .prepare(
          `INSERT INTO message_threads 
           (id, title, thread_type, created_by, class_id, assignment_id, last_message_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          threadId,
          threadTitle,
          'DIRECT',
          user.uid,
          class_id || null,
          assignment_id || null,
          now_iso,
          now_iso
        )
        .run();

      if (!createThreadResult.success) {
        return errorResponse("Failed to create message thread", 500);
      }

      // Add participants (teacher + recipients)
      const allParticipants = [
        { user_id: user.uid, role: 'CREATOR' },
        ...recipient_ids.map((id: string) => ({ user_id: id, role: 'PARTICIPANT' })),
      ];

      const participantInserts = allParticipants.map(p =>
        env.ASSESSMENT_DB
          .prepare(
            `INSERT INTO thread_participants (id, thread_id, user_id, role, joined_at)
             VALUES (?, ?, ?, ?, ?)`
          )
          .bind(crypto.randomUUID(), threadId, p.user_id, p.role, now_iso)
          .run()
      );

      const participantResults = await Promise.all(participantInserts);
      const allParticipantsAdded = participantResults.every(r => r.success);

      if (!allParticipantsAdded) {
        return errorResponse("Failed to add thread participants", 500);
      }
    } else {
      // Verify user is participant in existing thread
      const isParticipant = await env.ASSESSMENT_DB
        .prepare(
          `SELECT 1 FROM thread_participants 
           WHERE thread_id = ? AND user_id = ?`
        )
        .bind(threadId, user.uid)
        .first();

      if (!isParticipant) {
        return errorResponse("You are not a participant in this thread", 403);
      }
    }

    // Create message
    const messageId = crypto.randomUUID();
    const messageResult = await env.ASSESSMENT_DB
      .prepare(
        `INSERT INTO messages 
         (id, thread_id, sender_id, message_type, content, attachments, reply_to_message_id, sent_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        messageId,
        threadId,
        user.uid,
        message_type,
        content.trim(),
        attachments ? JSON.stringify(attachments) : null,
        reply_to_message_id || null,
        now_iso
      )
      .run();

    if (!messageResult.success) {
      return errorResponse("Failed to send message", 500);
    }

    // Mark message as read by sender
    await env.ASSESSMENT_DB
      .prepare(
        `INSERT INTO message_read_receipts (id, message_id, user_id, read_at)
         VALUES (?, ?, ?, ?)`
      )
      .bind(crypto.randomUUID(), messageId, user.uid, now_iso)
      .run();

    // Send notifications to other participants
    const otherParticipants = await env.ASSESSMENT_DB
      .prepare(
        `SELECT tp.user_id, sp.name, sp.email 
         FROM thread_participants tp
         LEFT JOIN student_profiles sp ON tp.user_id = sp.user_id
         WHERE tp.thread_id = ? AND tp.user_id != ? AND tp.is_muted = 0`
      )
      .bind(threadId, user.uid)
      .all();

    // Create notifications for participants
    const notificationInserts = (otherParticipants.results || []).map((participant: any) =>
      env.ASSESSMENT_DB
        .prepare(
          `INSERT INTO notifications 
           (id, user_id, type, channel, title, message, link, metadata, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          crypto.randomUUID(),
          participant.user_id,
          'NEW_MESSAGE',
          'IN_APP',
          'New Message',
          `You have a new message from your teacher`,
          `/student/messages/${threadId}`,
          JSON.stringify({
            thread_id: threadId,
            sender_id: user.uid,
            message_id: messageId,
            message_preview: content.substring(0, 100),
          }),
          now_iso
        )
        .run()
    );

    await Promise.all(notificationInserts);

    // Fetch the created message with sender info
    const createdMessage = await env.ASSESSMENT_DB
      .prepare(
        `SELECT 
          m.*,
          sp.name as sender_name
         FROM messages m
         LEFT JOIN student_profiles sp ON m.sender_id = sp.user_id
         WHERE m.id = ?`
      )
      .bind(messageId)
      .first();

    return jsonResponse({
      success: true,
      message: "Message sent successfully",
      data: {
        thread_id: threadId,
        message: {
          ...createdMessage,
          attachments: createdMessage?.attachments ? JSON.parse(createdMessage.attachments) : null,
        },
        is_new_thread: !thread_id,
        notifications_sent: (otherParticipants.results || []).length,
      },
    }, 201);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("POST /api/teacher/messages error:", message);
    return errorResponse(message, 500);
  }
}