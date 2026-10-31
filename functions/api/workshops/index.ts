// ============================================================
// SHIKSHA SAHAYAK OS API: /api/workshops
// Section: Engineering Workshops, Webinars & Masterclasses
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { Env } from "../../lib/contentEngine";
import { getAuthenticatedUser } from "../../lib/auth";

export interface WorkshopDTO {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: 'AI & Cloud' | 'Robotics & IoT' | 'Web3 & Security' | 'Career Strategy' | 'Core Engineering';
  speakerName: string;
  speakerBio: string;
  speakerCompanyOrInstitution: string;
  startTime: string;
  endTime: string;
  venueOrUrl: string;
  isOnline: boolean;
  maxParticipants: number;
  currentParticipants: number;
  prerequisites: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'ARCHIVED';
}

export const CURATED_WORKSHOPS: WorkshopDTO[] = [
  {
    id: 'ws-gemini-cloud-01',
    title: 'Building Production Agentic AI with Gemini & Cloudflare Edge',
    slug: 'agentic-ai-gemini-cloudflare',
    description: 'Deep dive into constructing autonomous AI agents that invoke tools, orchestrate multi-step LLM workflows, and run with sub-10ms edge latency.',
    category: 'AI & Cloud',
    speakerName: 'Dr. Alok Sharma',
    speakerBio: 'Edge AI Systems Engineer & Open Source Contributor',
    speakerCompanyOrInstitution: 'ShikshaSahayak Core AI Research',
    startTime: '2026-10-18T18:00:00Z',
    endTime: '2026-10-18T20:00:00Z',
    venueOrUrl: 'Google Meet (Live Interactive Stream)',
    isOnline: true,
    maxParticipants: 300,
    currentParticipants: 184,
    prerequisites: 'Basic JavaScript/TypeScript syntax and familiarity with REST endpoints.',
    status: 'UPCOMING'
  },
  {
    id: 'ws-tcs-ninja-02',
    title: 'TCS Digital & National Coding Qualifier Bootcamp',
    slug: 'tcs-digital-coding-bootcamp',
    description: 'Live walkthrough of high-frequency dynamic programming, tree traversals, and SQL questions asked in recent national campus qualifier tests.',
    category: 'Career Strategy',
    speakerName: 'Er. Hardik Shah',
    speakerBio: 'Senior Placement Mentor & GTU Gold Medalist',
    speakerCompanyOrInstitution: 'Engineering Placement Cell',
    startTime: '2026-10-22T17:30:00Z',
    endTime: '2026-10-22T19:30:00Z',
    venueOrUrl: 'ShikshaSahayak Live Portal Room A',
    isOnline: true,
    maxParticipants: 500,
    currentParticipants: 320,
    prerequisites: 'Understanding of loops, arrays, and standard recursion.',
    status: 'UPCOMING'
  },
  {
    id: 'ws-iot-robotics-03',
    title: 'Embedded Systems & Industrial Automation with ESP32 & ROS',
    slug: 'embedded-esp32-ros-robotics',
    description: 'Hardware simulation and firmware design for IoT smart grids and autonomous robot kinematics using micro-ROS.',
    category: 'Robotics & IoT',
    speakerName: 'Prof. Jignesh Dave',
    speakerBio: 'Head of Mechatronics & Embedded Labs',
    speakerCompanyOrInstitution: 'LDCE Robotics Club',
    startTime: '2026-10-25T14:00:00Z',
    endTime: '2026-10-25T17:00:00Z',
    venueOrUrl: 'Robotics Lab 304, LD College of Engineering, Ahmedabad',
    isOnline: false,
    maxParticipants: 80,
    currentParticipants: 62,
    prerequisites: 'Basic C programming and circuit fundamentals.',
    status: 'UPCOMING'
  }
];

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const db = (env as any).PADHAKU_CORE_DB || env.DB;
  const user = await getAuthenticatedUser(request, env);

  try {
    let workshops = [...CURATED_WORKSHOPS];
    let registeredWorkshopIds: string[] = [];

    if (db) {
      try {
        const { results } = await db.prepare(
          `SELECT id, title, slug, description, category, speaker_name, speaker_bio,
                  speaker_company_or_institution, start_time, end_time, venue_or_url,
                  is_online, max_participants, current_participants, prerequisites, status
           FROM workshops
           WHERE is_published = 1
           ORDER BY start_time ASC`
        ).all<Record<string, unknown>>();

        if (results && results.length > 0) {
          const dbWorkshops: WorkshopDTO[] = results.map(r => ({
            id: String(r.id),
            title: String(r.title),
            slug: String(r.slug),
            description: String(r.description || ''),
            category: String(r.category) as any,
            speakerName: String(r.speaker_name),
            speakerBio: String(r.speaker_bio || ''),
            speakerCompanyOrInstitution: String(r.speaker_company_or_institution || ''),
            startTime: String(r.start_time),
            endTime: String(r.end_time),
            venueOrUrl: String(r.venue_or_url),
            isOnline: Boolean(r.is_online),
            maxParticipants: Number(r.max_participants || 200),
            currentParticipants: Number(r.current_participants || 0),
            prerequisites: String(r.prerequisites || 'None'),
            status: String(r.status) as any
          }));
          const existingIds = new Set(dbWorkshops.map(w => w.id));
          workshops = [...dbWorkshops, ...CURATED_WORKSHOPS.filter(w => !existingIds.has(w.id))];
        }

        if (user) {
          const userRegs = await db.prepare(
            `SELECT workshop_id FROM workshop_registrations WHERE user_id = ?`
          ).bind(user.uid).all<{ workshop_id: string }>();
          if (userRegs?.results) {
            registeredWorkshopIds = userRegs.results.map(r => String(r.workshop_id));
          }
        }
      } catch (dbErr) {
        console.warn('DB workshop fetch notice:', dbErr);
      }
    }

    if (category && category !== 'all') {
      workshops = workshops.filter(w => w.category.toLowerCase() === category.toLowerCase());
    }

    return jsonResponse({
      success: true,
      workshops,
      registeredWorkshopIds,
      totalCount: workshops.length
    }, {
      headers: { 'Cache-Control': 'public, max-age=60' }
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch workshops', 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const db = (env as any).PADHAKU_CORE_DB || env.DB;
  const user = await getAuthenticatedUser(request, env);

  try {
    const body = await request.json() as { workshopId?: string; userId?: string };
    const workshopId = body?.workshopId;
    const userId = user?.uid || body?.userId || 'guest_student';

    if (!workshopId) {
      return errorResponse('Missing workshopId', 400);
    }

    let isNewRegistration = true;

    if (db) {
      try {
        const regId = `wreg_${userId}_${workshopId}`;
        const insertRes = await db.prepare(
          `INSERT INTO workshop_registrations (id, user_id, workshop_id, registered_at, attendance_status)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'REGISTERED')
           ON CONFLICT(user_id, workshop_id) DO NOTHING`
        ).bind(regId, userId, workshopId).run();

        // Only increment current_participants if a new registration was actually added
        if (insertRes?.meta?.changes && insertRes.meta.changes > 0) {
          await db.prepare(
            `UPDATE workshops SET current_participants = current_participants + 1 WHERE id = ?`
          ).bind(workshopId).run();
        } else {
          isNewRegistration = false;
        }
      } catch (dbErr: any) {
        console.warn('DB workshop registration error:', dbErr);
      }
    }

    return jsonResponse({
      success: true,
      registered: true,
      isNewRegistration,
      workshopId,
      status: 'CONFIRMED'
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to register for workshop', 500);
  }
}
