import { jsonResponse, errorResponse } from "../../lib/json";
import { getAuthenticatedUser, isAdmin } from "../../lib/auth";

export async function onRequestGet(context: { env: { ASSESSMENT_DB: any } }) {
  const { env } = context;
  const db = (env as any).DB || env.ASSESSMENT_DB;

  try {
    const { results } = await db.prepare(
      `SELECT * FROM quizzes ORDER BY created_at DESC`
    ).all();

    return jsonResponse(results);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: { env: { ASSESSMENT_DB: any; FIREBASE_PROJECT_ID?: string; VITE_FIREBASE_PROJECT_ID?: string }; request: Request }) {
  const { env, request } = context;
  const db = (env as any).DB || env.ASSESSMENT_DB;

  try {
    const user = await getAuthenticatedUser(request, env);
    if (!user || !isAdmin(user.email, user.role)) {
      return errorResponse("Unauthorized: Admin privilege required", 403);
    }
    const body: any = await request.json();
    const {
      title,
      subject,
      code,
      category,
      duration,
      difficulty,
      xp_reward,
      published = 1,
      questions = []
    } = body;

    if (!title || !subject || !code || !category || !duration || !difficulty || !xp_reward) {
      return errorResponse("Missing required quiz fields", 400);
    }

    const quizId = body.id || `quiz-${Date.now()}`;

    // Batch insert statements
    const statements = [
      db.prepare(
        `INSERT INTO quizzes (id, title, subject, code, category, duration, questions_count, difficulty, xp_reward, published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        quizId,
        title,
        subject,
        code,
        category,
        Number(duration),
        questions.length,
        difficulty,
        Number(xp_reward),
        Number(published)
      )
    ];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qId = q.id || `q-${quizId}-${i}-${Date.now()}`;
      statements.push(
        db.prepare(
          `INSERT INTO questions (id, quiz_id, question, options, correct_answer, explanation)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          qId,
          quizId,
          q.question,
          JSON.stringify(q.options),
          Number(q.correct_answer),
          q.explanation || ""
        )
      );
    }

    // Execute in batch transaction
    await db.batch(statements);

    return jsonResponse({ success: true, id: quizId }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
