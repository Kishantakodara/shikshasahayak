// ============================================================
// QUESTION QUALITY ENGINE - LIFECYCLE SERVICE
// Controls lifecycle state transitions: ACTIVE, WATCH, NEEDS_REVIEW,
// QUARANTINED, and RETIRED with full audit logging.
// ============================================================

import { Env } from '../../contentEngine';
import { evaluateQuestionQuality } from './questionQualityScoringService';

export type LifecycleStatus = 'ACTIVE' | 'WATCH' | 'NEEDS_REVIEW' | 'QUARANTINED' | 'RETIRED';

export async function quarantineQuestion(
  env: Env,
  questionId: string,
  adminId: string,
  reason: string
): Promise<{ success: boolean; lifecycleStatus: LifecycleStatus }> {
  await env.DB.prepare(
    `INSERT INTO question_quality_metrics (question_id, lifecycle_status, quarantine_reason, quarantined_by, quarantined_at, updated_at)
     VALUES (?, 'QUARANTINED', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(question_id) DO UPDATE SET
       lifecycle_status = 'QUARANTINED',
       quarantine_reason = excluded.quarantine_reason,
       quarantined_by = excluded.quarantined_by,
       quarantined_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP`
  )
    .bind(questionId, reason, adminId)
    .run();

  // Audit quality event
  const qeId = `qqe_${crypto.randomUUID().slice(0, 10)}`;
  await env.DB.prepare(
    `INSERT INTO question_quality_events (id, question_id, actor_id, actor_role, event_type, reason)
     VALUES (?, ?, ?, 'admin', 'QUARANTINED', ?)`
  )
    .bind(qeId, questionId, adminId, reason)
    .run();

  // Audit admin log
  const auditId = `qal_${crypto.randomUUID().slice(0, 10)}`;
  await env.DB.prepare(
    `INSERT INTO question_audit_logs (id, admin_id, question_id, action, reason) VALUES (?, ?, ?, 'QUESTION_ARCHIVED', ?)`
  )
    .bind(auditId, adminId, questionId, `[QUARANTINE] ${reason}`)
    .run();

  return { success: true, lifecycleStatus: 'QUARANTINED' };
}

export async function restoreQuestion(
  env: Env,
  questionId: string,
  adminId: string,
  reason: string = 'Restored by admin'
): Promise<{ success: boolean; lifecycleStatus: LifecycleStatus }> {
  await env.DB.prepare(
    `UPDATE question_quality_metrics SET
      lifecycle_status = 'ACTIVE', quarantine_reason = NULL, quarantined_by = NULL, quarantined_at = NULL, updated_at = CURRENT_TIMESTAMP
     WHERE question_id = ?`
  )
    .bind(questionId)
    .run();

  // Audit quality event
  const qeId = `qqe_${crypto.randomUUID().slice(0, 10)}`;
  await env.DB.prepare(
    `INSERT INTO question_quality_events (id, question_id, actor_id, actor_role, event_type, reason)
     VALUES (?, ?, ?, 'admin', 'RESTORED', ?)`
  )
    .bind(qeId, questionId, adminId, reason)
    .run();

  // Audit admin log
  const auditId = `qal_${crypto.randomUUID().slice(0, 10)}`;
  await env.DB.prepare(
    `INSERT INTO question_audit_logs (id, admin_id, question_id, action, reason) VALUES (?, ?, ?, 'QUESTION_EDITED', ?)`
  )
    .bind(auditId, adminId, questionId, `[RESTORE] ${reason}`)
    .run();

  // Recalculate
  await evaluateQuestionQuality(env, questionId);

  return { success: true, lifecycleStatus: 'ACTIVE' };
}

export async function retireQuestion(
  env: Env,
  questionId: string,
  adminId: string,
  reason: string
): Promise<{ success: boolean; lifecycleStatus: LifecycleStatus }> {
  await env.DB.prepare(
    `INSERT INTO question_quality_metrics (question_id, lifecycle_status, quarantine_reason, quarantined_by, quarantined_at, updated_at)
     VALUES (?, 'RETIRED', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(question_id) DO UPDATE SET
       lifecycle_status = 'RETIRED',
       quarantine_reason = excluded.quarantine_reason,
       quarantined_by = excluded.quarantined_by,
       quarantined_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP`
  )
    .bind(questionId, reason, adminId)
    .run();

  // Audit quality event
  const qeId = `qqe_${crypto.randomUUID().slice(0, 10)}`;
  await env.DB.prepare(
    `INSERT INTO question_quality_events (id, question_id, actor_id, actor_role, event_type, reason)
     VALUES (?, ?, ?, 'admin', 'RETIRED', ?)`
  )
    .bind(qeId, questionId, adminId, reason)
    .run();

  // Audit admin log
  const auditId = `qal_${crypto.randomUUID().slice(0, 10)}`;
  await env.DB.prepare(
    `INSERT INTO question_audit_logs (id, admin_id, question_id, action, reason) VALUES (?, ?, ?, 'QUESTION_ARCHIVED', ?)`
  )
    .bind(auditId, adminId, questionId, `[RETIRE] ${reason}`)
    .run();

  return { success: true, lifecycleStatus: 'RETIRED' };
}
