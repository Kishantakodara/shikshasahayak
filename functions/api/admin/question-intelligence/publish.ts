// ============================================================
// ADMIN API: POST /api/admin/question-intelligence/publish
// Authoritative Admin Publishing Endpoint: Validates & Publishes Questions
// Directly to master_question_bank with branch mappings and audit logs.
// ============================================================

import { getAuthenticatedUser, isAdmin } from '../../../lib/auth';
import { jsonResponse, errorResponse } from '../../../lib/json';
import { MasterQuestion } from '../../../../src/types';
import { createQuestion, getQuestionById, updateQuestion } from '../../../lib/questionIntelligence/questionService';
import { updateQueueStatus } from '../../../lib/questionIntelligence/ingestionQueueService';
import { mapGatePaperToBranchIds } from '../../../lib/questionIntelligence/transformationEngine/gateIngestionService';

export async function onRequestPost(context: { request: Request; env: any }): Promise<Response> {
  try {
    const user = await getAuthenticatedUser(context.request, context.env);
    if (!user) return errorResponse("Unauthorized: Authentication required", 401);
    if (!isAdmin(user.email, user.role) && user.role !== "admin" && user.role !== "teacher") {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const body = (await context.request.json().catch(() => ({}))) as {
      queueIds?: string[];
      questionIds?: string[];
      questions?: Partial<MasterQuestion>[];
      targetBranchIds?: string[];
      paperCode?: string;
    };

    const publishedQuestions: MasterQuestion[] = [];
    const errors: string[] = [];

    // 1. Publish from raw question payloads (e.g. from Review Table)
    if (body.questions && Array.isArray(body.questions) && body.questions.length > 0) {
      for (const q of body.questions) {
        try {
          const targetBranches = body.targetBranchIds && body.targetBranchIds.length > 0
            ? body.targetBranchIds
            : q.applicableBranches && q.applicableBranches.length > 0
            ? q.applicableBranches
            : mapGatePaperToBranchIds(body.paperCode || q.subjectCode || 'CS');

          const payload: Partial<MasterQuestion> = {
            ...q,
            verificationStatus: 'verified',
            verifiedBy: user.uid || user.email || 'Admin',
            verifiedAt: new Date().toISOString(),
            isOriginalPyq: q.isOriginalPyq !== undefined ? q.isOriginalPyq : true,
            isAiGenerated: q.isAiGenerated !== undefined ? q.isAiGenerated : false,
            examName: q.examName || 'GATE 2027',
            sourceType: q.sourceType || 'GATE',
            applicableBranches: targetBranches,
          };

          const created = await createQuestion(context.env, payload, targetBranches);
          publishedQuestions.push(created);

          // Record audit log
          try {
            await context.env.DB.prepare(
              `INSERT INTO question_audit_logs (
                id, admin_id, admin_email, question_id, action,
                new_value_json, reason, created_at
              ) VALUES (?, ?, ?, ?, 'QUESTION_PUBLISHED', ?, 'Published from Unified Content Studio', CURRENT_TIMESTAMP)`
            )
              .bind(
                `qal_${crypto.randomUUID().slice(0, 10)}`,
                user.uid || 'admin',
                user.email || 'admin@shikshasahayak.org',
                created.id,
                JSON.stringify({ status: 'verified', publishedAt: new Date().toISOString() })
              )
              .run();
          } catch (auditErr) {
            console.warn('Audit log write error:', auditErr);
          }
        } catch (itemErr: any) {
          errors.push(`Failed question '${q.questionText?.slice(0, 30)}...': ${itemErr.message}`);
        }
      }
    }

    // 2. Publish existing questions by ID (marking verification_status = 'verified')
    if (body.questionIds && Array.isArray(body.questionIds) && body.questionIds.length > 0) {
      for (const qId of body.questionIds) {
        try {
          const existing = await getQuestionById(context.env, qId);
          if (existing) {
            const updated = await updateQuestion(context.env, qId, {
              verificationStatus: 'verified',
              verifiedBy: user.uid || user.email || 'Admin',
              verifiedAt: new Date().toISOString(),
            });
            if (updated) publishedQuestions.push(updated);

            try {
              await context.env.DB.prepare(
                `INSERT INTO question_audit_logs (
                  id, admin_id, admin_email, question_id, action,
                  new_value_json, reason, created_at
                ) VALUES (?, ?, ?, ?, 'QUESTION_PUBLISHED', ?, 'Approved & Verified in Master Question Bank', CURRENT_TIMESTAMP)`
              )
                .bind(
                  `qal_${crypto.randomUUID().slice(0, 10)}`,
                  user.uid || 'admin',
                  user.email || 'admin@shikshasahayak.org',
                  qId,
                  JSON.stringify({ status: 'verified', publishedAt: new Date().toISOString() })
                )
                .run();
            } catch {}
          }
        } catch (idErr: any) {
          errors.push(`Failed question ID '${qId}': ${idErr.message}`);
        }
      }
    }

    // 3. If queue IDs provided, mark them approved
    if (body.queueIds && Array.isArray(body.queueIds)) {
      for (const qId of body.queueIds) {
        await updateQueueStatus(context.env, qId, 'approved');
      }
    }

    return jsonResponse({
      success: publishedQuestions.length > 0 || errors.length === 0,
      publishedCount: publishedQuestions.length,
      publishedQuestions,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/question-intelligence/publish:', err);
    return errorResponse(err.message || 'Internal Server Error during question publication', 500);
  }
}
