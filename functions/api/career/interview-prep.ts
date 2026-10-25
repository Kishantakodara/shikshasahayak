// ============================================================
// SHIKSHA SAHAYAK OS API: /api/career/interview-prep
// Section: 5-Day Structured Engineering Interview Preparation Program
// ============================================================

import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser } from "../../lib/auth";
import { Env } from "../../lib/contentEngine";

export interface DayTask {
  id: string;
  title: string;
  category: 'core' | 'coding' | 'aptitude' | 'system-design' | 'behavioral';
  estimatedMinutes: number;
  description: string;
  actionUrl?: string;
  isCompleted?: boolean;
}

export interface InterviewDayModule {
  dayNumber: number;
  title: string;
  theme: string;
  summary: string;
  badge: string;
  tasks: DayTask[];
}

const FIVE_DAY_PROGRAM: InterviewDayModule[] = [
  {
    dayNumber: 1,
    title: 'Core Engineering & Resume Pitch',
    theme: 'Foundations & Technical Storytelling',
    summary: 'Fine-tune your technical profile, master the 90-second elevator pitch, and review core CS fundamentals (DBMS Normalization, OS Processes vs Threads, Computer Networks OSI Stack).',
    badge: 'Day 1 of 5',
    tasks: [
      {
        id: 'd1-t1',
        title: 'ATS Resume Review & Keyword Optimization',
        category: 'core',
        estimatedMinutes: 30,
        description: 'Audit your engineering resume using the ShikshaSahayak ATS builder. Ensure project bullet points use action verbs with quantified metrics.',
        actionUrl: '/student/resume'
      },
      {
        id: 'd1-t2',
        title: '90-Second Technical Pitch Self-Audit',
        category: 'behavioral',
        estimatedMinutes: 20,
        description: 'Prepare your answer to "Walk me through your background and key engineering projects". Record or articulate key talking points.'
      },
      {
        id: 'd1-t3',
        title: 'Core DBMS & SQL Indexing Refresher',
        category: 'core',
        estimatedMinutes: 40,
        description: 'Review B-Trees vs B+ Trees, ACID properties, transaction isolation levels, and write 3 SQL multi-table join queries.',
        actionUrl: '/practice'
      }
    ]
  },
  {
    dayNumber: 2,
    title: 'Algorithmic Problem Solving & DSA',
    theme: 'Data Structures & Pattern Recognition',
    summary: 'Master the high-frequency coding patterns tested in engineering campus placements: Two Pointers, Sliding Window, Fast/Slow Pointers, and Binary Search.',
    badge: 'Day 2 of 5',
    tasks: [
      {
        id: 'd2-t1',
        title: 'Two Pointers & Subarray Target Sum',
        category: 'coding',
        estimatedMinutes: 35,
        description: 'Solve two sum, 3Sum, and container with most water. Analyze time and space complexity tradeoffs.',
        actionUrl: '/practice/100-days-code'
      },
      {
        id: 'd2-t2',
        title: 'Sliding Window Maximum & Longest Substring',
        category: 'coding',
        estimatedMinutes: 40,
        description: 'Implement dynamic-size sliding window with hash sets and frequency maps.',
        actionUrl: '/compete/coding-conquest'
      },
      {
        id: 'd2-t3',
        title: 'Binary Search On Answer Spaces',
        category: 'coding',
        estimatedMinutes: 35,
        description: 'Master binary search on monotonic predicates (e.g., book allocation, square root with precision).',
        actionUrl: '/practice'
      }
    ]
  },
  {
    dayNumber: 3,
    title: 'System Design & Database Architecture',
    theme: 'Scalability, Schema & Architecture',
    summary: 'Learn how to approach engineering system design questions: REST API design, caching layers (Redis), horizontal scaling, and relational vs document database selection.',
    badge: 'Day 3 of 5',
    tasks: [
      {
        id: 'd3-t1',
        title: 'URL Shortener (TinyURL) Architecture Derivation',
        category: 'system-design',
        estimatedMinutes: 45,
        description: 'Design database schema (Base62 encoding, unique counter generation), rate limiter, and cache eviction strategy.',
        actionUrl: '/student/study'
      },
      {
        id: 'd3-t2',
        title: 'CAP Theorem & Distributed Consistency',
        category: 'system-design',
        estimatedMinutes: 25,
        description: 'Understand consistency vs availability tradeoffs across network partitions with real cloud examples.'
      },
      {
        id: 'd3-t3',
        title: 'Database Sharding & Read-Replicas',
        category: 'system-design',
        estimatedMinutes: 30,
        description: 'Explore master-slave replication, write bottlenecks, and hash-based table partitioning.'
      }
    ]
  },
  {
    dayNumber: 4,
    title: 'Quantitative Aptitude & Logical Reasoning',
    theme: 'Campus Placement Screening Mastery',
    summary: 'Tackle the quantitative aptitude screening round conducted by TCS, Infosys, Capgemini, and core engineering recruiters.',
    badge: 'Day 4 of 5',
    tasks: [
      {
        id: 'd4-t1',
        title: 'Percentages, Profit & Loss Quick Formulas',
        category: 'aptitude',
        estimatedMinutes: 30,
        description: 'Solve 15 speed numerical questions with percentage change multipliers and successive discount formulas.',
        actionUrl: '/practice'
      },
      {
        id: 'd4-t2',
        title: 'Time, Speed & Distance / Work Efficiency',
        category: 'aptitude',
        estimatedMinutes: 35,
        description: 'Master relative speed formulas for trains and LCM method for pipes/cisterns.',
        actionUrl: '/practice'
      },
      {
        id: 'd4-t3',
        title: 'Data Interpretation & Graph Analysis',
        category: 'aptitude',
        estimatedMinutes: 25,
        description: 'Read and compute year-over-year growth ratios from multi-bar and pie charts.'
      }
    ]
  },
  {
    dayNumber: 5,
    title: 'Behavioral Interviews & Technical Simulation',
    theme: 'STAR Method & Mock Interview Execution',
    summary: 'Deliver confident, structured behavioral answers using the Situation, Task, Action, Result (STAR) framework and simulate a complete 30-minute technical interview.',
    badge: 'Day 5 of 5',
    tasks: [
      {
        id: 'd5-t1',
        title: 'STAR Behavioral Story Bank (3 Stories)',
        category: 'behavioral',
        estimatedMinutes: 35,
        description: 'Draft 3 structured engineering stories: Conflict resolution, technical mistake/debugging under pressure, and leadership.'
      },
      {
        id: 'd5-t2',
        title: '30-Minute Full Technical Mock Simulation',
        category: 'core',
        estimatedMinutes: 30,
        description: 'Take a comprehensive timed 25-question mixed engineering mock covering DSA, OS, and DBMS.',
        actionUrl: '/student/practice/exam'
      },
      {
        id: 'd5-t3',
        title: 'Questions for the Interviewer Strategy',
        category: 'behavioral',
        estimatedMinutes: 15,
        description: 'Prepare 3 thoughtful, intelligent questions to ask the hiring team about engineering stack, deployment cycles, and mentorship.'
      }
    ]
  }
];

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const db = (env as any).PADHAKU_CORE_DB || env.DB;
  const user = await getAuthenticatedUser(request, env);
  const userId = user ? user.uid : 'guest_student';

  try {
    let completedTaskIds = new Set<string>();

    if (db && user) {
      try {
        const { results } = await db.prepare(
          `SELECT task_id FROM student_interview_progress WHERE user_id = ? AND is_completed = 1`
        ).bind(userId).all<Record<string, unknown>>();

        if (results) {
          results.forEach(r => completedTaskIds.add(String(r.task_id)));
        }
      } catch {}
    }

    const programWithStatus = FIVE_DAY_PROGRAM.map(day => ({
      ...day,
      tasks: day.tasks.map(t => ({
        ...t,
        isCompleted: completedTaskIds.has(t.id)
      })),
      completedCount: day.tasks.filter(t => completedTaskIds.has(t.id)).length,
      isDayFullyCompleted: day.tasks.every(t => completedTaskIds.has(t.id))
    }));

    const totalTasks = FIVE_DAY_PROGRAM.reduce((acc, d) => acc + d.tasks.length, 0);
    const completedTasksCount = completedTaskIds.size;
    const progressPercentage = Math.round((completedTasksCount / totalTasks) * 100);

    return jsonResponse({
      success: true,
      program: programWithStatus,
      totalTasks,
      completedTasksCount,
      progressPercentage
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const db = (env as any).PADHAKU_CORE_DB || env.DB;
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse("Unauthorized", 401);

  try {
    const body = (await request.json()) as {
      dayNumber: number;
      taskId: string;
      isCompleted: boolean;
    };

    if (!body || !body.taskId || !body.dayNumber) {
      return errorResponse("Missing dayNumber or taskId", 400);
    }

    const id = `ip_${user.uid}_${body.taskId}`;

    if (db) {
      await db.prepare(
        `INSERT INTO student_interview_progress (id, user_id, day_number, task_id, is_completed, completed_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, day_number, task_id) DO UPDATE SET
           is_completed = excluded.is_completed,
           completed_at = excluded.completed_at`
      ).bind(
        id,
        user.uid,
        body.dayNumber,
        body.taskId,
        body.isCompleted ? 1 : 0,
        body.isCompleted ? new Date().toISOString() : null
      ).run();
    }

    return jsonResponse({ success: true, isCompleted: body.isCompleted });
  } catch (err: any) {
    return errorResponse(err.message || 'Internal Server Error', 500);
  }
}
