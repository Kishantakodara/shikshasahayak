// ============================================================
// SHIKSHA SAHAYAK OS API: /api/festivals
// Section: GTU & National Engineering College Festivals & Events
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { Env } from "../../lib/contentEngine";
import { getAuthenticatedUser } from "../../lib/auth";

export interface FestEventDTO {
  id: string;
  festivalId: string;
  title: string;
  category: 'Coding' | 'Robotics' | 'Hackathon' | 'Project Expo' | 'Gaming' | 'Symposium';
  entryFee: number;
  prizePool: number;
  description: string;
  rules: string[];
  minTeamSize: number;
  maxTeamSize: number;
}

export interface CollegeFestivalDTO {
  id: string;
  name: string;
  slug: string;
  collegeName: string;
  location: string;
  state: string;
  festType: 'Technical' | 'Cultural' | 'Sports' | 'Symposium' | 'Hackathon';
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  description: string;
  bannerUrl: string;
  websiteUrl: string;
  isVerified: boolean;
  events: FestEventDTO[];
}

export const CURATED_FESTIVALS: CollegeFestivalDTO[] = [
  {
    id: 'fest-gtu-techfest',
    name: 'GTU Central Techfest 2026',
    slug: 'gtu-central-techfest',
    collegeName: 'Gujarat Technological University (Chandkheda Campus)',
    location: 'Ahmedabad, Gujarat',
    state: 'Gujarat',
    festType: 'Technical',
    startDate: '2026-11-20',
    endDate: '2026-11-22',
    registrationDeadline: '2026-11-15',
    description: 'The flagship annual technical extravaganza of Gujarat Technological University uniting over 120 affiliated colleges with state-level robotic battles, 36-hour hackathon, and innovation exhibitions.',
    bannerUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    websiteUrl: 'https://techfest.gtu.ac.in',
    isVerified: true,
    events: [
      {
        id: 'ev-gtu-hack',
        festivalId: 'fest-gtu-techfest',
        title: 'Smart Gujarat 36-Hour National Hackathon',
        category: 'Hackathon',
        entryFee: 0,
        prizePool: 150000,
        description: 'Build edge IoT, AI, or smart city prototypes tackling actual civic challenges.',
        rules: ['Team of 2-4 students', 'Original code written during contest window', 'Hardware components permitted'],
        minTeamSize: 2,
        maxTeamSize: 4
      },
      {
        id: 'ev-gtu-robo',
        festivalId: 'fest-gtu-techfest',
        title: 'RoboWars & Line Follower Championship',
        category: 'Robotics',
        entryFee: 200,
        prizePool: 75000,
        description: 'Combat robotics arena and autonomous obstacle-traversal sprint.',
        rules: ['Bot weight under 15kg', 'Pneumatic and electric actuators permitted'],
        minTeamSize: 1,
        maxTeamSize: 4
      }
    ]
  },
  {
    id: 'fest-msu-footprints',
    name: 'FootPrints 2026 — National Technical Symposium',
    slug: 'msu-baroda-footprints',
    collegeName: 'Faculty of Technology & Engineering, The Maharaja Sayajirao University',
    location: 'Vadodara, Gujarat',
    state: 'Gujarat',
    festType: 'Symposium',
    startDate: '2026-12-05',
    endDate: '2026-12-07',
    registrationDeadline: '2026-11-28',
    description: 'One of Western India’s oldest student-driven technical symposiums, featuring guest lectures by ISRO scientists, aeromodelling, and algorithmic speed runs.',
    bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    websiteUrl: 'https://msufootprints.org',
    isVerified: true,
    events: [
      {
        id: 'ev-fp-code',
        festivalId: 'fest-msu-footprints',
        title: 'CodeSprint: Extreme Algorithmic Duel',
        category: 'Coding',
        entryFee: 100,
        prizePool: 40000,
        description: 'High-speed competitive programming with sudden-death knockout brackets.',
        rules: ['Individual participation', 'Languages: C++, Java, Python'],
        minTeamSize: 1,
        maxTeamSize: 1
      }
    ]
  },
  {
    id: 'fest-svnit-mindbend',
    name: 'MindBend 2026',
    slug: 'svnit-surat-mindbend',
    collegeName: 'Sardar Vallabhbhai National Institute of Technology (SVNIT)',
    location: 'Surat, Gujarat',
    state: 'Gujarat',
    festType: 'Technical',
    startDate: '2026-12-18',
    endDate: '2026-12-20',
    registrationDeadline: '2026-12-10',
    description: 'Annual techno-managerial festival of SVNIT Surat featuring drone racing, structural bridge design, and national open-source hackathons.',
    bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    websiteUrl: 'https://mindbend.svnit.ac.in',
    isVerified: true,
    events: [
      {
        id: 'ev-mb-expo',
        festivalId: 'fest-svnit-mindbend',
        title: 'National Engineering Project & Innovation Expo',
        category: 'Project Expo',
        entryFee: 150,
        prizePool: 60000,
        description: 'Showcase your final-year capstone project or startup prototype to venture capitalists.',
        rules: ['Working physical prototype or deployed software demo required'],
        minTeamSize: 1,
        maxTeamSize: 4
      }
    ]
  }
];

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const db = (env as any).PADHAKU_CORE_DB || env.DB;
  const user = await getAuthenticatedUser(request, env);

  try {
    let list = [...CURATED_FESTIVALS];
    let registeredEventIds: string[] = [];

    if (db) {
      try {
        const { results } = await db.prepare(
          `SELECT id, name, slug, college_name, location, state, fest_type,
                  start_date, end_date, registration_deadline, description,
                  banner_url, website_url, is_verified
           FROM college_festivals
           WHERE is_verified = 1
           ORDER BY start_date ASC`
        ).all<Record<string, unknown>>();

        if (results && results.length > 0) {
          const dbFests: CollegeFestivalDTO[] = results.map(r => ({
            id: String(r.id),
            name: String(r.name),
            slug: String(r.slug),
            collegeName: String(r.college_name),
            location: String(r.location),
            state: String(r.state || 'Gujarat'),
            festType: String(r.fest_type) as any,
            startDate: String(r.start_date),
            endDate: String(r.end_date),
            registrationDeadline: String(r.registration_deadline || ''),
            description: String(r.description || ''),
            bannerUrl: String(r.banner_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'),
            websiteUrl: String(r.website_url || ''),
            isVerified: Boolean(r.is_verified),
            events: []
          }));
          const existingIds = new Set(dbFests.map(f => f.id));
          list = [...dbFests, ...CURATED_FESTIVALS.filter(f => !existingIds.has(f.id))];
        }

        if (user) {
          const regRes = await db.prepare(
            `SELECT event_id FROM student_fest_registrations WHERE user_id = ?`
          ).bind(user.uid).all<{ event_id: string }>();
          if (regRes?.results) {
            registeredEventIds = regRes.results.map(r => String(r.event_id));
          }
        }
      } catch (dbErr) {
        console.warn('DB festivals fetch notice:', dbErr);
      }
    }

    if (type && type !== 'all') {
      list = list.filter(f => f.festType.toLowerCase() === type.toLowerCase());
    }

    return jsonResponse({
      success: true,
      festivals: list,
      registeredEventIds,
      totalCount: list.length
    }, {
      headers: { 'Cache-Control': 'public, max-age=60' }
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch festivals', 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const db = (env as any).PADHAKU_CORE_DB || env.DB;
  const user = await getAuthenticatedUser(request, env);

  try {
    const body = await request.json() as {
      festivalId?: string;
      eventId?: string;
      teamName?: string;
      userId?: string;
    };

    const festivalId = body?.festivalId;
    const eventId = body?.eventId;
    const teamName = body?.teamName || 'Solo Engineering Participant';
    const userId = user?.uid || body?.userId || 'guest_student';

    if (!festivalId || !eventId) {
      return errorResponse('Missing festivalId or eventId', 400);
    }

    if (db) {
      try {
        const regId = `freg_${userId}_${eventId}`;
        await db.prepare(
          `INSERT INTO student_fest_registrations (id, user_id, festival_id, event_id, team_name, registered_at, status)
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'CONFIRMED')
           ON CONFLICT(user_id, event_id) DO NOTHING`
        ).bind(regId, userId, festivalId, eventId, teamName).run();
      } catch (dbErr: any) {
        console.warn('DB festival registration warning:', dbErr);
      }
    }

    return jsonResponse({
      success: true,
      status: 'CONFIRMED',
      festivalId,
      eventId,
      teamName
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to register for festival event', 500);
  }
}
