// ============================================================
// SHIKSHA SAHAYAK OS - UNIVERSAL METADATA EDGE SERVICE
// ============================================================

import {
  UniversalMetadataObject,
  UniversalMetadataQueryParams,
} from "../../src/types/universal-metadata";
import { getLearningResourceById, queryLearningResources, Env } from "./contentEngine";
import { PaginatedResourceResponse } from "../../src/types/content-engine";

/** Search indexing tokenization utility */
export function buildSearchTokens(
  title: string,
  description?: string,
  tags: string[] = [],
  keywords: string[] = [],
  aliases: string[] = []
): string[] {
  const combined = [title, description || "", ...tags, ...keywords, ...aliases]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ");

  const tokens = combined
    .split(/\s+/)
    .filter((t) => t.length > 2);

  return Array.from(new Set(tokens));
}

/**
 * Hydrates full 10-domain Universal Metadata Object for any learning resource.
 */
export async function getUniversalMetadataByResourceId(
  env: Env,
  resourceId: string
): Promise<UniversalMetadataObject | null> {
  const resource = await getLearningResourceById(env, resourceId);
  if (!resource) return null;

  try {
    const row = await env.DB.prepare(
      `SELECT
         um.short_description,
         um.long_description,
         um.priority,
         um.created_by,
         um.updated_by,
         um.learning_outcome,
         um.credits,
         um.curriculum_version,
         um.resource_format,
         um.file_extension,
         um.duration_seconds,
         um.pages_count,
         um.estimated_completion_time_mins,
         um.cover_image_url,
         um.author,
         um.publisher,
         um.original_reference,
         um.knowledge_level,
         um.learning_objective,
         um.blooms_taxonomy_level,
         um.exam_importance,
         um.marks_weightage,
         um.concept_type,
         um.search_weight,
         um.search_boost,
         um.featured,
         um.trending,
         um.popular,
         um.faculty_pick,
         um.student_favorite,
         um.completion_rate,
         um.review_count,
         um.attempt_count,
         um.success_rate,
         um.study_time_secs,
         um.repeat_visits_count,
         um.recommended_branch_id,
         um.recommended_semester,
         um.recommended_goal,
         um.recommended_skill,
         um.dashboard_priority,
         um.future_recommendation_score,
         um.search_index_tokens,
         um.aliases,
         um.synonyms
       FROM universal_metadata_map um
       WHERE um.document_id = ?
       LIMIT 1`
    )
      .bind(resourceId)
      .first<Record<string, unknown>>();

    const aliases = row?.aliases ? JSON.parse(String(row.aliases)) : [];
    const synonyms = row?.synonyms ? JSON.parse(String(row.synonyms)) : [];
    const searchTokens = buildSearchTokens(
      resource.title,
      resource.description || undefined,
      resource.tags,
      resource.keywords,
      aliases
    );

    const universalMetadata: UniversalMetadataObject = {
      system: {
        id: resource.id,
        slug: resource.subjectSlug || resource.id,
        title: resource.title,
        subtitle: resource.subtitle,
        shortDescription: row?.short_description ? String(row.short_description) : resource.description,
        longDescription: row?.long_description ? String(row.long_description) : null,
        version: resource.version,
        status: resource.status,
        visibility: resource.visibility,
        priority: row?.priority ? Number(row.priority) : 0,
        createdAt: resource.createdAt,
        updatedAt: resource.updatedAt,
        createdBy: row?.created_by ? String(row.created_by) : resource.uploadedBy,
        updatedBy: row?.updated_by ? String(row.updated_by) : null,
        approvalStatus: resource.status,
        approvalDate: resource.approvedAt,
        approvedBy: resource.approvedBy,
        isArchived: false,
        isDeleted: false,
      },
      academic: {
        universityId: resource.universityId,
        universityName: resource.universityName,
        universitySlug: resource.universitySlug,
        degreeId: resource.degreeId,
        degreeName: resource.degreeName,
        branchId: resource.branchId,
        branchName: resource.branchName,
        branchSlug: resource.branchSlug,
        semester: resource.semester,
        subjectId: resource.subjectId,
        subjectName: resource.subjectName,
        subjectCode: resource.subjectCode,
        subjectSlug: resource.subjectSlug,
        unitId: resource.unitId,
        unitNo: resource.unitNo,
        unitTitle: resource.unitTitle,
        topicId: resource.topicId,
        topicNo: resource.topicNo,
        topicTitle: resource.topicTitle,
        subTopic: resource.subTopic,
        learningOutcome: row?.learning_outcome ? String(row.learning_outcome) : null,
        credits: row?.credits ? Number(row.credits) : null,
        academicYear: null,
        curriculumVersion: row?.curriculum_version ? String(row.curriculum_version) : "2026.1",
      },
      resource: {
        resourceType: resource.resourceType,
        resourceFormat: row?.resource_format ? String(row.resource_format) : "pdf",
        fileExtension: row?.file_extension ? String(row.file_extension) : "pdf",
        fileSizeBytes: resource.sizeBytes,
        durationSeconds: row?.duration_seconds ? Number(row.duration_seconds) : null,
        pagesCount: row?.pages_count ? Number(row.pages_count) : null,
        estimatedReadingTimeMins: resource.estimatedReadingTimeMinutes,
        estimatedCompletionTimeMins: row?.estimated_completion_time_mins ? Number(row.estimated_completion_time_mins) : null,
        language: resource.language,
        thumbnailUrl: resource.thumbnailUrl,
        previewImageUrl: resource.previewUrl,
        previewText: null,
        coverImageUrl: row?.cover_image_url ? String(row.cover_image_url) : null,
        author: row?.author ? String(row.author) : resource.author,
        publisher: row?.publisher ? String(row.publisher) : null,
        source: null,
        license: "CC-BY-NC-SA",
        copyrightInfo: null,
        originalReference: row?.original_reference ? String(row.original_reference) : null,
      },
      learning: {
        difficulty: resource.difficulty || "intermediate",
        learningStage: "concept_building",
        knowledgeLevel: row?.knowledge_level ? String(row.knowledge_level) : "intermediate",
        learningObjective: row?.learning_objective ? String(row.learning_objective) : null,
        prerequisites: resource.prerequisiteIds,
        recommendedBefore: [],
        recommendedAfter: [],
        revisionLevel: null,
        examImportance: (row?.exam_importance as any) || "medium",
        marksWeightage: row?.marks_weightage ? Number(row.marks_weightage) : null,
        bloomsTaxonomyLevel: (row?.blooms_taxonomy_level as any) || "UNDERSTAND",
        conceptType: row?.concept_type ? String(row.concept_type) : "theory",
      },
      assessment: {
        questionType: null,
        questionCount: null,
        totalMarks: null,
        negativeMarking: false,
        passingCriteriaPercent: 40.0,
        timeLimitMinutes: null,
        attemptsAllowed: null,
        isRandomized: false,
        evaluationMethod: "automated",
        assessmentCategory: null,
      },
      discovery: {
        tags: resource.tags,
        keywords: resource.keywords,
        aliases,
        alternativeNames: [],
        searchWeight: row?.search_weight ? Number(row.search_weight) : 1.0,
        isFeatured: Boolean(row?.featured),
        isTrending: Boolean(row?.trending),
        isPopular: Boolean(row?.popular),
        isRecommended: true,
        isFacultyPick: Boolean(row?.faculty_pick),
        isStudentFavorite: Boolean(row?.student_favorite),
        recentlyUpdated: false,
        recentlyAdded: true,
        futureAiRecommended: true,
      },
      engagement: {
        views: resource.views,
        downloads: resource.downloads,
        bookmarks: resource.bookmarks,
        likes: resource.likes,
        shares: 0,
        completionRatePercent: row?.completion_rate ? Number(row.completion_rate) : 0.0,
        averageRating: resource.ratingAvg,
        reviewCount: row?.review_count ? Number(row.review_count) : resource.ratingCount,
        attemptCount: row?.attempt_count ? Number(row.attempt_count) : 0,
        successRatePercent: row?.success_rate ? Number(row.success_rate) : 0.0,
        studyTimeSeconds: row?.study_time_secs ? Number(row.study_time_secs) : 0,
        repeatVisitsCount: row?.repeat_visits_count ? Number(row.repeat_visits_count) : 0,
        popularityScore: Number(row?.future_recommendation_score || 0.0),
      },
      relationships: {
        parentResourceId: null,
        childResourceIds: [],
        relatedResourceIds: resource.relatedResourceIds,
        alternativeResourceIds: [],
        prerequisiteResourceIds: resource.prerequisiteIds,
        recommendedResourceIds: resource.recommendedNextId ? [resource.recommendedNextId] : [],
        assessmentMappingIds: [],
        videoMappingIds: [],
        flashcardMappingIds: [],
        bookMappingIds: [],
        assignmentMappingIds: [],
        labMappingIds: [],
        presentationMappingIds: [],
      },
      personalization: {
        recommendedBranchId: row?.recommended_branch_id ? String(row.recommended_branch_id) : resource.branchId,
        recommendedSemester: row?.recommended_semester ? Number(row.recommended_semester) : resource.semester,
        recommendedGoal: row?.recommended_goal ? String(row.recommended_goal) : "Exam Success",
        recommendedSkill: row?.recommended_skill ? String(row.recommended_skill) : null,
        recommendedInterest: null,
        requiredProfileRole: "STUDENT",
        visibilityRules: ["PUBLIC"],
        notificationRules: [],
        dashboardPriority: row?.dashboard_priority ? Number(row.dashboard_priority) : 0,
        widgetMapping: ["study_deck", "recent_resources"],
        futureRecommendationScore: Number(row?.future_recommendation_score || 0.0),
      },
      search: {
        searchIndexTokens: searchTokens,
        searchKeywords: resource.keywords,
        searchFilters: {
          university: resource.universityId,
          branch: resource.branchId,
          semester: resource.semester,
          subject: resource.subjectId,
          type: resource.resourceType,
        },
        autocompleteTerms: [resource.title, resource.subjectName || ""].filter(Boolean),
        synonyms,
        rankingWeight: row?.search_weight ? Number(row.search_weight) : 1.0,
        searchCategory: resource.resourceType,
        searchBoost: row?.search_boost ? Number(row.search_boost) : 1.0,
        languageTokens: [resource.language],
      },
    };

    return universalMetadata;
  } catch (error) {
    console.error("Error in getUniversalMetadataByResourceId:", error);
    return null;
  }
}

/**
 * Queries resources by multi-domain universal metadata parameters.
 */
export async function queryByUniversalMetadata(
  env: Env,
  params: UniversalMetadataQueryParams
): Promise<PaginatedResourceResponse> {
  return queryLearningResources(env, {
    universityId: params.universityId,
    branchId: params.branchId,
    semester: params.semester,
    subjectId: params.subjectId,
    unitNo: params.unitNo,
    resourceType: params.resourceType,
    difficulty: params.difficulty,
    searchQuery: params.query,
    tags: params.tags,
    page: params.page || 1,
    limit: params.limit || 20,
    sortBy: params.isPopular || params.isTrending ? "views" : "created_at",
    sortOrder: "desc",
  });
}
