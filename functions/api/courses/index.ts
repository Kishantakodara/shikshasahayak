// ============================================================
// SHIKSHA SAHAYAK OS API: /api/courses
// Section: Course Catalog & Engineering Skill Tracks
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { Env } from "../../lib/contentEngine";

export interface CourseSummaryDTO {
  id: string;
  title: string;
  slug: string;
  category: 'Programming' | 'Web Development' | 'AI/ML' | 'Core Engineering' | 'Aptitude';
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  description: string;
  thumbnailUrl: string;
  instructorName: string;
  durationHours: number;
  enrolledCount: number;
  rating: number;
  ratingCount: number;
  modulesCount: number;
  lessonsCount: number;
  tags: string[];
}

export const CURATED_COURSES: CourseSummaryDTO[] = [
  {
    id: 'course-react-fullstack',
    title: 'Modern Full-Stack Engineering with React 19 & TypeScript',
    slug: 'react-19-fullstack-engineering',
    category: 'Web Development',
    level: 'Intermediate',
    description: 'Master React 19, server actions, optimistic UI, state machines, and building low-latency edge applications on Cloudflare Workers and D1.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=600&q=80',
    instructorName: 'Prof. R. Verma & ShikshaSahayak Academic Team',
    durationHours: 14.5,
    enrolledCount: 3420,
    rating: 4.95,
    ratingCount: 420,
    modulesCount: 5,
    lessonsCount: 18,
    tags: ['React 19', 'TypeScript', 'Cloudflare Workers', 'Tailwind CSS']
  },
  {
    id: 'course-gtu-dsa',
    title: 'GTU & Placement Data Structures & Algorithms Mastery',
    slug: 'dsa-mastery-cpp-java',
    category: 'Programming',
    level: 'Beginner',
    description: 'Comprehensive coverage of Arrays, Linked Lists, Trees, Graphs, Dynamic Programming, and GTU 3130702 syllabus with company test patterns.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516116211227-bbc677c7c34b?auto=format&fit=crop&w=600&q=80',
    instructorName: 'Er. Hardik Shah (GTU Gold Medalist)',
    durationHours: 28.0,
    enrolledCount: 5190,
    rating: 4.92,
    ratingCount: 880,
    modulesCount: 8,
    lessonsCount: 32,
    tags: ['C++', 'Java', 'DSA', 'GTU Syllabus', 'LeetCode']
  },
  {
    id: 'course-ai-generative',
    title: 'Applied Generative AI & LLM Systems for Engineers',
    slug: 'generative-ai-llm-systems',
    category: 'AI/ML',
    level: 'Intermediate',
    description: 'Build RAG pipelines, function calling, agentic coding workflows, and integrate Gemini API & vector embeddings in production apps.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80',
    instructorName: 'AI Systems Research Lab',
    durationHours: 16.0,
    enrolledCount: 2840,
    rating: 4.88,
    ratingCount: 310,
    modulesCount: 6,
    lessonsCount: 20,
    tags: ['Gemini API', 'Python', 'Vector DB', 'RAG', 'Agentic AI']
  },
  {
    id: 'course-gate-dbms',
    title: 'Database Management Systems & SQL Query Engineering',
    slug: 'dbms-sql-query-engineering',
    category: 'Core Engineering',
    level: 'All Levels',
    description: 'Relational algebra, normal forms (1NF to BCNF), indexing, transactions, ACID properties, and SQLite/D1 edge database internals.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=600&q=80',
    instructorName: 'Dr. Meera Trivedi',
    durationHours: 12.0,
    enrolledCount: 1980,
    rating: 4.89,
    ratingCount: 240,
    modulesCount: 4,
    lessonsCount: 15,
    tags: ['DBMS', 'SQL', 'Normalization', 'GATE Prep', 'GTU']
  },
  {
    id: 'course-campus-aptitude',
    title: 'Placement Quantitative Aptitude & Logical Reasoning',
    slug: 'campus-aptitude-cracking-bootcamp',
    category: 'Aptitude',
    level: 'Beginner',
    description: 'Speed math, percentages, time & work, permutations, syllogisms, and coding questions asked by TCS, Infosys, Capgemini, and Cognizant.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
    instructorName: 'Placement Aptitude Cell',
    durationHours: 18.0,
    enrolledCount: 4670,
    rating: 4.91,
    ratingCount: 512,
    modulesCount: 5,
    lessonsCount: 22,
    tags: ['TCS NQT', 'Aptitude', 'Shortcuts', 'Campus Placements']
  }
];

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const level = url.searchParams.get("level");
  const search = url.searchParams.get("search");

  try {
    let courses = [...CURATED_COURSES];

    // If D1 learning_courses has entries, merge them
    const db = env.PADHAKU_CORE_DB || env.DB;
    if (db) {
      try {
        const { results } = await db.prepare(
          `SELECT id, title, slug, category, level, description, thumbnail_url,
                  instructor_name, duration_hours, enrolled_count, rating, rating_count
           FROM learning_courses
           WHERE is_published = 1
           ORDER BY enrolled_count DESC`
        ).all<Record<string, unknown>>();

        if (results && results.length > 0) {
          const dbCourses: CourseSummaryDTO[] = results.map(r => ({
            id: String(r.id),
            title: String(r.title),
            slug: String(r.slug),
            category: String(r.category) as any,
            level: String(r.level) as any,
            description: String(r.description || ''),
            thumbnailUrl: String(r.thumbnail_url || 'https://images.unsplash.com/photo-1516116211227-bbc677c7c34b?auto=format&fit=crop&w=600&q=80'),
            instructorName: String(r.instructor_name || 'ShikshaSahayak Faculty'),
            durationHours: Number(r.duration_hours || 10),
            enrolledCount: Number(r.enrolled_count || 0),
            rating: Number(r.rating || 4.9),
            ratingCount: Number(r.rating_count || 0),
            modulesCount: 4,
            lessonsCount: 16,
            tags: [String(r.category), String(r.level)]
          }));

          // Avoid duplicates by slug
          const existingSlugs = new Set(dbCourses.map(c => c.slug));
          const fallback = CURATED_COURSES.filter(c => !existingSlugs.has(c.slug));
          courses = [...dbCourses, ...fallback];
        }
      } catch {}
    }

    if (category && category !== 'all') {
      courses = courses.filter(c => c.category.toLowerCase() === category.toLowerCase());
    }
    if (level && level !== 'all') {
      courses = courses.filter(c => c.level.toLowerCase() === level.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      courses = courses.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return jsonResponse({
      success: true,
      courses,
      totalCount: courses.length
    }, {
      headers: { 'Cache-Control': 'public, max-age=180' }
    });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to retrieve courses', 500);
  }
}
