// ============================================================
// SHIKSHA SAHAYAK OS API: /api/courses/[id]
// Section: Course Syllabus, Modules & Lessons
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { Env } from "../../lib/contentEngine";
import { CURATED_COURSES, CourseSummaryDTO } from "./index";

export interface CourseLessonDTO {
  id: string;
  moduleId: string;
  title: string;
  durationMinutes: number;
  contentMarkdown: string;
  videoUrl?: string;
  orderIndex: number;
  isFreePreview: boolean;
}

export interface CourseModuleDTO {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  lessons: CourseLessonDTO[];
}

export interface CourseDetailDTO extends CourseSummaryDTO {
  prerequisites: string[];
  learningOutcomes: string[];
  modules: CourseModuleDTO[];
}

const SAMPLE_MODULES_BY_COURSE: Record<string, CourseModuleDTO[]> = {
  'course-react-fullstack': [
    {
      id: 'mod-1',
      title: 'Module 1: React 19 Core Paradigm & Server-Driven Architecture',
      description: 'Understanding Actions, useActionState, useOptimistic, and Server Functions.',
      orderIndex: 1,
      lessons: [
        {
          id: 'les-1-1',
          moduleId: 'mod-1',
          title: 'Lesson 1.1: What Changed in React 19 — The Compiler & Actions',
          durationMinutes: 18,
          contentMarkdown: `### Welcome to Modern React 19 Engineering\n\nReact 19 introduces native compiler optimization, asynchronous transition management via \`useActionState\`, and direct form actions without manual boilerplate.\n\n#### Key Objectives:\n1. Eliminate manual \`useMemo\` and \`useCallback\` dependency arrays.\n2. Handle form submissions and mutations with optimistic updates.\n3. Integrate seamless suspense boundaries with fallback skeletons.\n\n\`\`\`tsx\n// React 19 Form Action Example\nconst [state, formAction, isPending] = useActionState(async (prevState, formData) => {\n  const res = await updateProfile(formData);\n  return res;\n}, null);\n\`\`\``,
          orderIndex: 1,
          isFreePreview: true
        },
        {
          id: 'les-1-2',
          moduleId: 'mod-1',
          title: 'Lesson 1.2: Optimistic UI Updates & Instant Edge Feedback',
          durationMinutes: 22,
          contentMarkdown: `### Implementing useOptimistic\n\nOptimistic UI ensures that users perceive zero latency even across mobile networks. When a student likes a post or marks a lesson complete, we render the updated state immediately before the network request resolves.\n\n\`\`\`tsx\nconst [optimisticLikes, setOptimisticLikes] = useOptimistic(\n  likes,\n  (current, update: number) => current + update\n);\n\`\`\``,
          orderIndex: 2,
          isFreePreview: true
        }
      ]
    },
    {
      id: 'mod-2',
      title: 'Module 2: Cloudflare Workers, Edge Computing & D1 Databases',
      description: 'Deploying sub-10ms globally distributed backends without heavy servers.',
      orderIndex: 2,
      lessons: [
        {
          id: 'les-2-1',
          moduleId: 'mod-2',
          title: 'Lesson 2.1: Serverless Edge Architecture vs Traditional VM Hosting',
          durationMinutes: 25,
          contentMarkdown: `### The Cloudflare V8 Isolate Paradigm\n\nUnlike traditional Docker containers that take hundreds of milliseconds to boot (cold starts), Cloudflare Workers spin up lightweight V8 isolates in under 5 milliseconds.\n\n- Zero cold starts\n- Distributed across 300+ edge cities\n- Native D1 SQLite replication`,
          orderIndex: 1,
          isFreePreview: false
        },
        {
          id: 'les-2-2',
          moduleId: 'mod-2',
          title: 'Lesson 2.2: Writing Safe D1 Prepared Statements & Migrations',
          durationMinutes: 30,
          contentMarkdown: `### Cloudflare D1 Querying\n\nAlways use prepared statements to protect against SQL injections:\n\n\`\`\`ts\nconst { results } = await env.DB.prepare(\n  "SELECT * FROM users WHERE email = ? AND is_active = 1"\n).bind(userEmail).all();\n\`\`\``,
          orderIndex: 2,
          isFreePreview: false
        }
      ]
    }
  ],
  'default': [
    {
      id: 'mod-def-1',
      title: 'Module 1: Foundations & Core Engineering Principles',
      description: 'Fundamental syntax, architecture, and industry paradigms.',
      orderIndex: 1,
      lessons: [
        {
          id: 'les-def-1',
          moduleId: 'mod-def-1',
          title: '1.1 Architecture & Setup Overview',
          durationMinutes: 15,
          contentMarkdown: `### Course Introduction\n\nWelcome to this comprehensive ShikshaSahayak engineering module. In this curriculum, we balance rigorous theoretical foundations with practical, industry-grade implementations.\n\nTake notes, complete the embedded challenges, and track your streak.`,
          orderIndex: 1,
          isFreePreview: true
        },
        {
          id: 'les-def-2',
          moduleId: 'mod-def-1',
          title: '1.2 Hands-On Problem Solving & Deep Dive',
          durationMinutes: 25,
          contentMarkdown: `### Practical Execution\n\nReview the code patterns, analyze the asymptotic time complexity, and implement the reference algorithms provided in this chapter.`,
          orderIndex: 2,
          isFreePreview: true
        }
      ]
    },
    {
      id: 'mod-def-2',
      title: 'Module 2: Advanced Topics & Exam/Interview Patterns',
      description: 'Complex problem solving, edge cases, and high-frequency questions.',
      orderIndex: 2,
      lessons: [
        {
          id: 'les-def-3',
          moduleId: 'mod-def-2',
          title: '2.1 Optimization & Performance Engineering',
          durationMinutes: 30,
          contentMarkdown: `### Performance Mastery\n\nFocus on minimizing time complexity from $O(N^2)$ to $O(N \\log N)$ using divide and conquer, dynamic programming memoization, or indexing.`,
          orderIndex: 1,
          isFreePreview: false
        }
      ]
    }
  ]
};

export async function onRequestGet(context: { request: Request; params: { id: string }; env: Env }) {
  const { params, env } = context;
  const courseIdentifier = params.id;

  try {
    // Locate course summary
    let course = CURATED_COURSES.find(c => c.id === courseIdentifier || c.slug === courseIdentifier);

    const db = env.PADHAKU_CORE_DB || env.DB;

    if (!course && db) {
      try {
        const row = await db.prepare(
          `SELECT id, title, slug, category, level, description, thumbnail_url,
                  instructor_name, duration_hours, enrolled_count, rating, rating_count
           FROM learning_courses
           WHERE id = ? OR slug = ?`
        ).bind(courseIdentifier, courseIdentifier).first<Record<string, unknown>>();

        if (row) {
          course = {
            id: String(row.id),
            title: String(row.title),
            slug: String(row.slug),
            category: String(row.category) as any,
            level: String(row.level) as any,
            description: String(row.description || ''),
            thumbnailUrl: String(row.thumbnail_url || 'https://images.unsplash.com/photo-1516116211227-bbc677c7c34b?auto=format&fit=crop&w=600&q=80'),
            instructorName: String(row.instructor_name || 'ShikshaSahayak Faculty'),
            durationHours: Number(row.duration_hours || 10),
            enrolledCount: Number(row.enrolled_count || 0),
            rating: Number(row.rating || 4.9),
            ratingCount: Number(row.rating_count || 0),
            modulesCount: 4,
            lessonsCount: 16,
            tags: [String(row.category), String(row.level)]
          };
        }
      } catch {}
    }

    if (!course) {
      return errorResponse('Course not found', 404);
    }

    // Load modules & lessons
    let modules = SAMPLE_MODULES_BY_COURSE[course.id] || SAMPLE_MODULES_BY_COURSE['default'];

    if (db) {
      try {
        const { results: dbModules } = await db.prepare(
          `SELECT id, title, description, order_index FROM course_modules WHERE course_id = ? ORDER BY order_index ASC`
        ).bind(course.id).all<Record<string, unknown>>();

        if (dbModules && dbModules.length > 0) {
          const loadedModules: CourseModuleDTO[] = [];
          for (const m of dbModules) {
            const { results: dbLessons } = await db.prepare(
              `SELECT id, module_id, title, duration_minutes, content_markdown, video_url, order_index, is_free_preview
               FROM course_lessons
               WHERE module_id = ?
               ORDER BY order_index ASC`
            ).bind(m.id).all<Record<string, unknown>>();

            loadedModules.push({
              id: String(m.id),
              title: String(m.title),
              description: String(m.description || ''),
              orderIndex: Number(m.order_index),
              lessons: (dbLessons || []).map(l => ({
                id: String(l.id),
                moduleId: String(l.module_id),
                title: String(l.title),
                durationMinutes: Number(l.duration_minutes || 15),
                contentMarkdown: String(l.content_markdown || ''),
                videoUrl: l.video_url ? String(l.video_url) : undefined,
                orderIndex: Number(l.order_index),
                isFreePreview: Boolean(l.is_free_preview)
              }))
            });
          }
          if (loadedModules.length > 0) {
            modules = loadedModules;
          }
        }
      } catch {}
    }

    const detail: CourseDetailDTO = {
      ...course,
      prerequisites: [
        'Basic engineering mathematics or programming fundamentals',
        'Familiarity with web browser and text editor (VS Code recommended)',
        'GTU Semester 2+ or equivalent college engineering standing'
      ],
      learningOutcomes: [
        'Gain deep conceptual mastery and practical problem-solving capability',
        'Build real-world portfolio projects and ace technical interview rounds',
        'Earn an authenticated verifiable ShikshaSahayak Certificate upon 100% completion'
      ],
      modules
    };

    return jsonResponse({
      success: true,
      course: detail
    }, {
      headers: { 'Cache-Control': 'public, max-age=180' }
    });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to load course details', 500);
  }
}
