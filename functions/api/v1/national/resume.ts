/**
 * SHIKSHA SAHAYAK OS — PRODUCTION RESUME BUILDER & ATS API
 * Endpoint: /api/v1/national/resume
 */

import { analyzeAndBuildResume } from '../../../../functions/lib/resumeBuilderService';
import { getAuthenticatedUser, verifyBetaAccess } from '../../../../functions/lib/auth';

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;
  const user = await getAuthenticatedUser(request, env as any);
  const betaAuth = await verifyBetaAccess(user, env as any, 'resumeBuilder');
  if (!betaAuth.allowed && betaAuth.response) {
    return betaAuth.response;
  }
  try {
    const body = await context.request.json() as any;
    const spec = {
      fullName: body.fullName || 'Raj Patel',
      email: body.email || 'raj.patel@gtu.ac.in',
      phone: body.phone || '+91 9876543210',
      location: body.location || 'Ahmedabad, Gujarat',
      summary: body.summary || 'Passionate B.Tech Computer Engineering student with expertise in full-stack web development, Cloudflare Workers, React 19, and GTU coursework.',
      education: body.education || [
        { degree: 'B.Tech Computer Engineering', institution: 'Gujarat Technological University (GTU)', gpa: 8.75, endYear: '2026' }
      ],
      skills: body.skills || ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'Git', 'Data Structures', 'Algorithms'],
      projects: body.projects || [
        { title: 'ShikshaSahayak OS EdTech Platform', techStack: ['React 19', 'TypeScript', 'Cloudflare Workers', 'D1'], description: 'Built an autonomous AI-powered academic learning portal for GTU engineering students.', githubUrl: 'https://github.com/shikshasahayak/portal' }
      ]
    };

    const analysis = analyzeAndBuildResume(spec);

    return new Response(JSON.stringify({ success: true, spec, analysis }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
