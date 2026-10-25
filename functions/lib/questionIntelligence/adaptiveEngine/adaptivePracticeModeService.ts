// ============================================================
// ADAPTIVE LEARNING ENGINE - PRACTICE MODE SERVICE
// Generates adaptive test sessions for 7 dedicated practice modes:
// WEAK_TOPIC_MODE, REVISION_MODE, MASTER_TOPIC_MODE, BALANCED_PRACTICE,
// EXAM_MODE, RECOVERY_MODE, and CHALLENGE_MODE.
// ============================================================

import { Env } from '../../contentEngine';
import { selectAdaptiveQuestions } from './adaptiveQuestionSelectionService';
import { generateTestSession } from '../testEngine/testGenerationService';
import { TestSessionDTO } from '../../../../src/types';


export type AdaptivePracticeMode =
  | 'WEAK_TOPIC_MODE'
  | 'REVISION_MODE'
  | 'MASTER_TOPIC_MODE'
  | 'BALANCED_PRACTICE'
  | 'EXAM_MODE'
  | 'RECOVERY_MODE'
  | 'CHALLENGE_MODE';

export interface StartAdaptiveSessionOptions {
  studentId: string;
  mode: AdaptivePracticeMode;
  subjectCode?: string;
  topicName?: string;
  questionCount?: number;
  timeLimitMinutes?: number;
}

export async function startAdaptivePracticeSession(
  env: Env,
  options: StartAdaptiveSessionOptions
): Promise<TestSessionDTO> {

  const count = options.questionCount || 10;

  let modeSelectType: 'WEAK_TOPIC' | 'REVISION' | 'CHALLENGE' | 'RECOVERY' | 'BALANCED' = 'BALANCED';
  if (options.mode === 'WEAK_TOPIC_MODE') modeSelectType = 'WEAK_TOPIC';
  else if (options.mode === 'REVISION_MODE') modeSelectType = 'REVISION';
  else if (options.mode === 'CHALLENGE_MODE') modeSelectType = 'CHALLENGE';
  else if (options.mode === 'RECOVERY_MODE') modeSelectType = 'RECOVERY';

  const questions = await selectAdaptiveQuestions(env, {
    studentId: options.studentId,
    subjectCode: options.subjectCode,
    topicName: options.topicName,
    targetCount: count,
    mode: modeSelectType,
  });

  let testType: any = 'CUSTOM_TEST';
  if (options.mode === 'WEAK_TOPIC_MODE') testType = 'WEAK_TOPIC_TEST';
  else if (options.mode === 'REVISION_MODE') testType = 'INCORRECT_QUESTION_TEST';

  const session = await generateTestSession(env, {
    studentId: options.studentId,
    testType,
    subjectCode: options.subjectCode,
    topicName: options.topicName,
    questionCount: count,
    durationMinutes: options.timeLimitMinutes || 20,
    practiceMode: 'IMMEDIATE_PRACTICE',
  } as any);

  if ('reason' in session) {
    throw new Error(`Insufficient questions for session: ${session.reason}`);
  }

  return session;

}
