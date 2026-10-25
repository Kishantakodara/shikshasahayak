// ============================================================
// SHIKSHA SAHAYAK OS - CONTENT TAXONOMY EDGE SERVICE
// ============================================================

import {
  ContentObjectTaxonomy,
  TaxonomyMasterLookup,
  TaxonomyQueryFilterParams,
  MasterCategoryCode,
  EducationalPurposeCode,
  LearningStageCode,
  QualityBadgeCode,
  TaxonomyMediaType,
  SupportedLanguageCode,
  ContentTag,
} from "../../src/types/content-taxonomy";
import { queryLearningResources, Env } from "./contentEngine";
import { PaginatedResourceResponse } from "../../src/types/content-engine";

/** Dynamic popularity scoring formula */
export function calculatePopularityScore(
  views: number,
  downloads: number,
  likes: number,
  ratingAvg: number,
  completionCount: number
): number {
  return Number(
    (views * 0.1 + downloads * 0.4 + likes * 0.2 + ratingAvg * 2.0 + completionCount * 0.3).toFixed(2)
  );
}

/**
 * Fetches 360-degree taxonomy payload for any given content object.
 */
export async function getUnifiedContentTaxonomy(
  env: Env,
  documentId: string
): Promise<ContentObjectTaxonomy | null> {
  try {
    const row = await env.DB.prepare(
      `SELECT
         tm.document_id,
         tm.category_id,
         tm.educational_purpose,
         tm.learning_stage,
         tm.quality_badge,
         tm.media_type,
         tm.language,
         tm.completion_count,
         tm.avg_watch_time_secs,
         tm.popularity_score,
         tm.ai_summary_ready,
         tm.ai_quiz_ready,
         tc.code AS category_code,
         tc.name AS category_name,
         tc.icon AS category_icon,
         rm.difficulty,
         rm.visibility,
         rm.version,
         rm.keywords,
         d.approval_status AS status,
         d.created_at,
         d.updated_at,
         ds.views,
         ds.downloads,
         ds.likes,
         rm.rating_avg,
         rm.rating_count
       FROM content_taxonomy_map tm
       JOIN taxonomy_categories tc ON tc.id = tm.category_id
       JOIN documents d ON d.id = tm.document_id
       LEFT JOIN resource_metadata rm ON rm.document_id = d.id
       LEFT JOIN document_stats ds ON ds.document_id = d.id
       WHERE tm.document_id = ?
       LIMIT 1`
    )
      .bind(documentId)
      .first<Record<string, unknown>>();

    if (!row) {
      // Fallback default taxonomy object if map record not yet initialized
      return {
        documentId,
        category: {
          id: "cat_academic",
          code: "academic",
          name: "Academic Resources",
          icon: "BookOpen",
        },
        educationalPurpose: "learning",
        learningStage: "concept_building",
        qualityBadge: "verified",
        mediaType: "pdf",
        difficulty: "intermediate",
        visibility: "public",
        status: "approved",
        language: "en",
        version: "1.0",
        tags: [],
        keywords: [],
        metrics: {
          views: 0,
          downloads: 0,
          bookmarks: 0,
          likes: 0,
          ratingsCount: 0,
          ratingAvg: 0,
          shares: 0,
          completionCount: 0,
          avgWatchTimeSecs: 0,
          popularityScore: 0,
        },
        aiReadiness: {
          summaryReady: true,
          quizReady: true,
          flashcardReady: true,
          topicExtractionReady: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Fetch Tags for Document
    const { results: tagRows } = await env.DB.prepare(
      `SELECT t.id, t.name, t.slug, t.category, t.usage_count, t.created_at
       FROM document_tags_map dtm
       JOIN content_tags t ON t.id = dtm.tag_id
       WHERE dtm.document_id = ?`
    )
      .bind(documentId)
      .all<Record<string, unknown>>();

    const tags: ContentTag[] = (tagRows || []).map((t) => ({
      id: String(t.id),
      name: String(t.name),
      slug: String(t.slug),
      category: t.category ? String(t.category) : undefined,
      usageCount: Number(t.usage_count || 0),
      createdAt: String(t.created_at),
    }));

    const views = Number(row.views || 0);
    const downloads = Number(row.downloads || 0);
    const likes = Number(row.likes || 0);
    const ratingAvg = Number(row.rating_avg || 0.0);
    const completionCount = Number(row.completion_count || 0);

    return {
      documentId: String(row.document_id),
      category: {
        id: String(row.category_id),
        code: String(row.category_code) as MasterCategoryCode,
        name: String(row.category_name),
        icon: row.category_icon ? String(row.category_icon) : undefined,
      },
      educationalPurpose: String(row.educational_purpose) as EducationalPurposeCode,
      learningStage: String(row.learning_stage) as LearningStageCode,
      qualityBadge: String(row.quality_badge) as QualityBadgeCode,
      mediaType: String(row.media_type) as TaxonomyMediaType,
      difficulty: (row.difficulty as any) || "intermediate",
      visibility: (row.visibility as any) || "public",
      status: (row.status as any) || "approved",
      language: String(row.language || "en") as SupportedLanguageCode,
      version: String(row.version || "1.0"),
      tags,
      keywords: row.keywords ? JSON.parse(String(row.keywords)) : [],
      metrics: {
        views,
        downloads,
        bookmarks: 0,
        likes,
        ratingsCount: Number(row.rating_count || 0),
        ratingAvg,
        shares: 0,
        completionCount,
        avgWatchTimeSecs: Number(row.avg_watch_time_secs || 0),
        popularityScore: calculatePopularityScore(views, downloads, likes, ratingAvg, completionCount),
      },
      aiReadiness: {
        summaryReady: Boolean(row.ai_summary_ready),
        quizReady: Boolean(row.ai_quiz_ready),
        flashcardReady: true,
        topicExtractionReady: true,
      },
      createdAt: String(row.created_at || new Date().toISOString()),
      updatedAt: String(row.updated_at || new Date().toISOString()),
    };
  } catch (error) {
    console.error("Error in getUnifiedContentTaxonomy:", error);
    return null;
  }
}

/**
 * Fetches the master taxonomy lookups (8 Categories, Educational Purposes, Learning Stages, Quality Badges).
 */
export async function getTaxonomyMasterLookup(env: Env): Promise<TaxonomyMasterLookup> {
  try {
    const { results: categories } = await env.DB.prepare(
      `SELECT id, name, slug AS code, icon, description FROM taxonomy_categories ORDER BY name`
    ).all<Record<string, unknown>>();

    const { results: purposes } = await env.DB.prepare(
      `SELECT id, code, label, description FROM taxonomy_purposes ORDER BY label`
    ).all<Record<string, unknown>>();

    const { results: stages } = await env.DB.prepare(
      `SELECT id, code, label, description FROM taxonomy_learning_stages ORDER BY label`
    ).all<Record<string, unknown>>();

    return {
      categories: (categories || []).map((c) => ({
        id: String(c.id),
        code: String(c.code) as MasterCategoryCode,
        name: String(c.name),
        icon: c.icon ? String(c.icon) : undefined,
        description: c.description ? String(c.description) : undefined,
      })),
      purposes: (purposes || []).map((p) => ({
        id: String(p.id),
        code: String(p.code) as EducationalPurposeCode,
        label: String(p.label),
        description: p.description ? String(p.description) : undefined,
      })),
      stages: (stages || []).map((s) => ({
        id: String(s.id),
        code: String(s.code) as LearningStageCode,
        label: String(s.label),
        description: s.description ? String(s.description) : undefined,
      })),
      badges: ["draft", "verified", "faculty_verified", "community_verified", "official", "archived", "deprecated"],
      mediaTypes: [
        "pdf",
        "docx",
        "ppt",
        "pptx",
        "image",
        "video",
        "audio",
        "code",
        "quiz",
        "flashcard",
        "article",
        "external_url",
        "interactive",
      ],
      languages: ["en", "gu", "hi", "bilingual", "multilingual"],
    };
  } catch (error) {
    console.error("Error in getTaxonomyMasterLookup:", error);
    return {
      categories: [],
      purposes: [],
      stages: [],
      badges: ["draft", "verified", "official"],
      mediaTypes: ["pdf", "video", "quiz", "code"],
      languages: ["en", "gu", "hi"],
    };
  }
}

/**
 * Queries resources by multi-dimensional taxonomy filters.
 */
export async function queryByTaxonomy(
  env: Env,
  params: TaxonomyQueryFilterParams
): Promise<PaginatedResourceResponse> {
  return queryLearningResources(env, {
    searchQuery: params.searchQuery,
    difficulty: params.difficulty,
    language: params.language,
    visibility: params.visibility,
    status: params.status,
    tags: params.tags,
    page: params.page || 1,
    limit: params.limit || 20,
    sortBy: params.sortBy === "popularity" ? "views" : (params.sortBy as any) || "created_at",
    sortOrder: params.sortOrder || "desc",
  });
}
