/**
 * SHIKSHA SAHAYAK OS — PRODUCTION LIVE CLASSROOM API
 * Endpoint: /api/v1/national/live-classes
 */

import { createLiveSession, createLivePoll } from '../../../../functions/lib/liveClassroomService';

export const onRequestPost: PagesFunction = async (context) => {
  try {
    const body = await context.request.json() as any;
    const action = body.action || 'create_session';

    if (action === 'create_session') {
      const session = createLiveSession(
        body.classId || 'class_gtu_ce_sem3',
        body.className || 'Data Structures & Algorithms Live Lecture',
        body.teacherId || 'prof_shah',
        body.teacherName || 'Prof. A. Shah',
        body.subjectName || 'Data Structures & Algorithms'
      );

      return new Response(JSON.stringify({ success: true, session }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (action === 'create_poll') {
      const poll = createLivePoll(
        body.question || 'What is the time complexity of QuickSort average case?',
        body.options || ['O(n)', 'O(n log n)', 'O(n^2)', 'O(1)']
      );

      return new Response(JSON.stringify({ success: true, poll }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid live classroom action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
