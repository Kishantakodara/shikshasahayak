import { jsonResponse, errorResponse } from "../../../lib/json";
import { getAuthenticatedUser } from "../../../lib/auth";

/**
 * GET /api/teacher/announcements/:id
 * Get a specific announcement with read statistics
 * 
 * Requirements: Announcement retrieval
 */
export async function onRequestGet(context: {
  env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const announcementId = params.id;

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

    // Get announcement with class info
    const announcement = await env.ASSESSMENT_DB
      .prepare(
        `SELECT 
          a.*,
          c.name as class_name,
          c.section as class_section,
          sp.name as created_by_name
         FROM announcements a
         LEFT JOIN classes c ON a.class_id = c.id
         LEFT JOIN student_profiles sp ON a.created_by = sp.user_id
         WHERE a.id = ?`
      )
      .bind(announcementId)
      .first();

    if (!announcement) {
      return errorResponse("Announcement not found", 404);
    }

    if (announcement.created_by !== user.uid) {
      return errorResponse("Forbidden: You can only view your own announcements", 403);
    }

    // Get read statistics
    const readStats = await env.ASSESSMENT_DB
      .prepare(
        `SELECT 
          ar.user_id,
          ar.read_at,
          sp.name as reader_name,
          sp.email as reader_email,
          ce.enrollment_number
         FROM announcement_reads ar
         LEFT JOIN student_profiles sp ON ar.user_id = sp.user_id
         LEFT JOIN class_enrollments ce ON ar.user_id = ce.student_id 
           AND ce.class_id = COALESCE(?, (SELECT id FROM classes WHERE teacher_id = ? LIMIT 1))
         WHERE ar.announcement_id = ?
         ORDER BY ar.read_at DESC`
      )
      .bind(announcement.class_id, user.uid, announcementId)
      .all();

    // Get target audience count
    let targetAudienceCount = 0;
    if (announcement.class_id) {
      // Specific class
      const classAudience = await env.ASSESSMENT_DB
        .prepare(
          `SELECT COUNT(*) as count 
           FROM class_enrollments 
           WHERE class_id = ? AND enrollment_status = 'ACTIVE'`
        )
        .bind(announcement.class_id)
        .first();
      targetAudienceCount = classAudience?.count || 0;
    } else {
      // All teacher's classes
      const allClassesAudience = await env.ASSESSMENT_DB
        .prepare(
          `SELECT COUNT(DISTINCT ce.student_id) as count
           FROM class_enrollments ce
           JOIN classes c ON ce.class_id = c.id
           WHERE c.teacher_id = ? AND ce.enrollment_status = 'ACTIVE'`
        )
        .bind(user.uid)
        .first();
      targetAudienceCount = allClassesAudience?.count || 0;
    }

    // Parse JSON fields and add metadata
    const announcementWithMetadata = {
      ...announcement,
      channels: announcement.channels ? JSON.parse(announcement.channels) : ['IN_APP'],
      attachments: announcement.attachments ? JSON.parse(announcement.attachments) : null,
      read_statistics: {
        total_readers: (readStats.results || []).length,
        target_audience_count: targetAudienceCount,
        read_percentage: targetAudienceCount > 0 
          ? (((readStats.results || []).length / targetAudienceCount) * 100).toFixed(1)
          : "0.0",
        readers: readStats.results || [],
      },
      is_expired: announcement.expires_at ? new Date(announcement.expires_at) < new Date() : false,
      can_edit: !announcement.is_published || new Date(announcement.published_at || '') > new Date(Date.now() - 24 * 60 * 60 * 1000), // Can edit drafts or within 24h of publishing
      can_delete: !announcement.is_published, // Can only delete drafts
    };

    return jsonResponse({
      announcement: announcementWithMetadata,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("GET /api/teacher/announcements/:id error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * PUT /api/teacher/announcements/:id
 * Update an announcement
 * 
 * Body: Partial announcement data (same as POST)
 * 
 * Requirements: Announcement editing
 */
export async function onRequestPut(context: {
  env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const announcementId = params.id;

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

    // Verify announcement exists and user owns it
    const existingAnnouncement = await env.ASSESSMENT_DB
      .prepare("SELECT * FROM announcements WHERE id = ?")
      .bind(announcementId)
      .first();

    if (!existingAnnouncement) {
      return errorResponse("Announcement not found", 404);
    }

    if (existingAnnouncement.created_by !== user.uid) {
      return errorResponse("Forbidden: You can only edit your own announcements", 403);
    }

    // Check if announcement can be edited
    const isPublished = Boolean(existingAnnouncement.is_published);
    const publishedAt = existingAnnouncement.published_at ? new Date(existingAnnouncement.published_at) : null;
    const canEdit = !isPublished || (publishedAt && publishedAt > new Date(Date.now() - 24 * 60 * 60 * 1000));

    if (!canEdit) {
      return errorResponse("Cannot edit announcement: published announcements can only be edited within 24 hours of publishing", 403);
    }

    const body: any = await request.json();
    const {
      class_id,
      title,
      content,
      priority,
      target_audience,
      channels,
      attachments,
      expires_at,
      pin_to_top,
      allow_comments,
      publish_now,
    } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (class_id !== undefined) {
      // Verify class exists and teacher owns it (if provided)
      if (class_id) {
        const classData = await env.ASSESSMENT_DB
          .prepare("SELECT * FROM classes WHERE id = ? AND teacher_id = ? AND is_active = 1")
          .bind(class_id, user.uid)
          .first();

        if (!classData) {
          return errorResponse("Class not found or you don't have access to it", 404);
        }
      }
      updates.push("class_id = ?");
      values.push(class_id || null);
    }

    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return errorResponse("title cannot be empty", 400);
      }
      updates.push("title = ?");
      values.push(title.trim());
    }

    if (content !== undefined) {
      if (!content || content.trim().length === 0) {
        return errorResponse("content cannot be empty", 400);
      }
      updates.push("content = ?");
      values.push(content.trim());
    }

    if (priority !== undefined) {
      if (!['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority)) {
        return errorResponse("Invalid priority. Must be LOW, NORMAL, HIGH, or URGENT", 400);
      }
      updates.push("priority = ?");
      values.push(priority);
    }

    if (target_audience !== undefined) {
      if (!['STUDENTS', 'PARENTS', 'BOTH'].includes(target_audience)) {
        return errorResponse("Invalid target_audience. Must be STUDENTS, PARENTS, or BOTH", 400);
      }
      updates.push("target_audience = ?");
      values.push(target_audience);
    }

    if (channels !== undefined) {
      if (!Array.isArray(channels) || channels.length === 0) {
        return errorResponse("channels must be a non-empty array", 400);
      }
      const validChannels = ['IN_APP', 'EMAIL', 'SMS'];
      const invalidChannels = channels.filter(ch => !validChannels.includes(ch));
      if (invalidChannels.length > 0) {
        return errorResponse(`Invalid channels: ${invalidChannels.join(', ')}`, 400);
      }
      updates.push("channels = ?");
      values.push(JSON.stringify(channels));
    }

    if (attachments !== undefined) {
      updates.push("attachments = ?");
      values.push(attachments ? JSON.stringify(attachments) : null);
    }

    if (expires_at !== undefined) {
      if (expires_at) {
        const expiryDate = new Date(expires_at);
        if (expiryDate <= new Date()) {
          return errorResponse("expires_at must be a future date", 400);
        }
      }
      updates.push("expires_at = ?");
      values.push(expires_at || null);
    }

    if (pin_to_top !== undefined) {
      updates.push("pin_to_top = ?");
      values.push(pin_to_top ? 1 : 0);
    }

    if (allow_comments !== undefined) {
      updates.push("allow_comments = ?");
      values.push(allow_comments ? 1 : 0);
    }

    const now_iso = new Date().toISOString();
    let notificationsSent = 0;

    // Handle publishing
    if (publish_now && !isPublished) {
      updates.push("is_published = ?", "published_at = ?");
      values.push(1, now_iso);

      // Send notifications (similar logic to POST endpoint)
      const finalClassId = class_id !== undefined ? class_id : existingAnnouncement.class_id;
      const finalTargetAudience = target_audience || existingAnnouncement.target_audience;
      const finalChannels = channels ? channels : (existingAnnouncement.channels ? JSON.parse(existingAnnouncement.channels) : ['IN_APP']);
      const finalTitle = title !== undefined ? title.trim() : existingAnnouncement.title;
      const finalContent = content !== undefined ? content.trim() : existingAnnouncement.content;

      // Get target users
      let targetUsersQuery = "";
      let targetUsersParams: any[] = [];

      if (finalClassId) {
        if (finalTargetAudience === 'STUDENTS' || finalTargetAudience === 'BOTH') {
          targetUsersQuery = `
            SELECT DISTINCT ce.student_id as user_id, sp.email, sp.name
            FROM class_enrollments ce
            LEFT JOIN student_profiles sp ON ce.student_id = sp.user_id
            WHERE ce.class_id = ? AND ce.enrollment_status = 'ACTIVE'
          `;
          targetUsersParams = [finalClassId];
        }
      } else {
        if (finalTargetAudience === 'STUDENTS' || finalTargetAudience === 'BOTH') {
          targetUsersQuery = `
            SELECT DISTINCT ce.student_id as user_id, sp.email, sp.name
            FROM class_enrollments ce
            JOIN classes c ON ce.class_id = c.id
            LEFT JOIN student_profiles sp ON ce.student_id = sp.user_id
            WHERE c.teacher_id = ? AND ce.enrollment_status = 'ACTIVE'
          `;
          targetUsersParams = [user.uid];
        }
      }

      if (targetUsersQuery && finalChannels.includes('IN_APP')) {
        const targetUsers = await env.ASSESSMENT_DB
          .prepare(targetUsersQuery)
          .bind(...targetUsersParams)
          .all();

        const notificationInserts = (targetUsers.results || []).map((targetUser: any) =>
          env.ASSESSMENT_DB
            .prepare(
              `INSERT INTO notifications 
               (id, user_id, type, channel, title, message, link, metadata, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .bind(
              crypto.randomUUID(),
              targetUser.user_id,
              'ANNOUNCEMENT',
              'IN_APP',
              finalTitle,
              finalContent.substring(0, 200) + (finalContent.length > 200 ? '...' : ''),
              `/student/announcements/${announcementId}`,
              JSON.stringify({
                announcement_id: announcementId,
                priority: priority || existingAnnouncement.priority,
                class_id: finalClassId,
                expires_at: expires_at !== undefined ? expires_at : existingAnnouncement.expires_at,
              }),
              now_iso
            )
            .run()
        );

        await Promise.all(notificationInserts);
        notificationsSent += (targetUsers.results || []).length;
      }
    }

    if (updates.length === 0) {
      return errorResponse("No fields to update", 400);
    }

    // Add updated_at
    updates.push("updated_at = ?");
    values.push(now_iso);

    // Add announcement ID for WHERE clause
    values.push(announcementId);

    const result = await env.ASSESSMENT_DB
      .prepare(`UPDATE announcements SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    if (!result.success) {
      return errorResponse("Failed to update announcement", 500);
    }

    // Fetch updated announcement
    const updatedAnnouncement = await env.ASSESSMENT_DB
      .prepare(
        `SELECT 
          a.*,
          c.name as class_name,
          c.section as class_section
         FROM announcements a
         LEFT JOIN classes c ON a.class_id = c.id
         WHERE a.id = ?`
      )
      .bind(announcementId)
      .first();

    return jsonResponse({
      success: true,
      message: publish_now && !isPublished 
        ? `Announcement updated and published. ${notificationsSent} notifications sent.`
        : "Announcement updated successfully",
      announcement: {
        ...updatedAnnouncement,
        channels: JSON.parse(updatedAnnouncement.channels),
        attachments: updatedAnnouncement.attachments ? JSON.parse(updatedAnnouncement.attachments) : null,
      },
      notifications_sent: notificationsSent,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PUT /api/teacher/announcements/:id error:", message);
    return errorResponse(message, 500);
  }
}

/**
 * DELETE /api/teacher/announcements/:id
 * Delete an announcement (only drafts can be deleted)
 * 
 * Requirements: Announcement deletion
 */
export async function onRequestDelete(context: {
  env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string };
  request: Request;
  params: { id: string };
}) {
  const { env, request, params } = context;
  const announcementId = params.id;

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

    // Verify announcement exists and user owns it
    const announcement = await env.ASSESSMENT_DB
      .prepare("SELECT * FROM announcements WHERE id = ?")
      .bind(announcementId)
      .first();

    if (!announcement) {
      return errorResponse("Announcement not found", 404);
    }

    if (announcement.created_by !== user.uid) {
      return errorResponse("Forbidden: You can only delete your own announcements", 403);
    }

    // Check if announcement can be deleted (only drafts)
    if (announcement.is_published) {
      return errorResponse("Cannot delete published announcements. You can only delete draft announcements.", 409);
    }

    // Delete the announcement (cascade will handle related records)
    const result = await env.ASSESSMENT_DB
      .prepare("DELETE FROM announcements WHERE id = ?")
      .bind(announcementId)
      .run();

    if (!result.success) {
      return errorResponse("Failed to delete announcement", 500);
    }

    return jsonResponse({
      success: true,
      message: "Announcement deleted successfully",
      announcement_id: announcementId,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("DELETE /api/teacher/announcements/:id error:", message);
    return errorResponse(message, 500);
  }
}