import {
  fileAssetDownloadUrl,
  getOrCreateFileAsset,
  releaseFileAssetIfOrphaned,
} from "./fileAssets";
import { materialDownloadUrl } from "./json";

export type UploadEnv = {
  DB: D1Database;
  MATERIALS_BUCKET: R2Bucket;
};

export type BranchRow = {
  id: string;
  university_id: string;
  name: string;
  slug: string;
  short_name?: string | null;
};

export type SubjectRow = {
  id: string;
  university_id: string;
  branch_id: string;
  semester: number;
  code: string | null;
  name: string;
  slug: string;
};

export type CreateDocumentInput = {
  env: UploadEnv;
  requestUrl: string;
  file?: File | null;
  fileUrl?: string | null;
  solutionFile?: File | null;
  title: string;
  documentType: "pyq" | "syllabus" | "study-material";
  status: string;
  branch: BranchRow;
  subject: SubjectRow;
  uploadedBy?: string | null;
  description?: string | null;
  examYear?: number | null;
  examSession?: string | null;
  syllabusYear?: number | null;
  regulation?: string | null;
  versionLabel?: string | null;
  materialKind?: string | null;
  unitNo?: number | null;
  chapter?: string | null;
  topic?: string | null;
  author?: string | null;
  blogId?: string | null;
  parentDocumentId?: string | null;
  blog?: {
    enabled: boolean;
    title?: string | null;
    content?: string | null;
    author?: string | null;
    category?: string | null;
    tags?: string | null;
    thumbnail?: string | null;
    status?: string | null;
  };
};

export function textValue(formData: FormData, key: string): string {
  return formData.get(key)?.toString().trim() || "";
}

export function intValue(formData: FormData, key: string): number | null {
  const raw = textValue(formData, key);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function slugify(value: string, fallback = "untitled"): string {
  const slug = value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function folderSegment(value: string, fallback: string): string {
  const normalized = value
    .trim()
    .replace(/&/g, "and")
    .replace(/[\\/:*?"<>|#%{}^~[\]`]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, "-")
    .trim();

  return normalized || fallback;
}

function safeFilename(value: string): string {
  return (
    value
      .replace(/[\\/:*?"<>|#%{}^~[\]`]+/g, "_")
      .replace(/\s+/g, " ")
      .trim() || "upload.pdf"
  );
}

function materialTypeFolder(value: string): string {
  if (value === "pyq") return "PYQ";
  if (value === "syllabus") return "Syllabus";
  if (value === "study-material") return "Study-Material";
  if (value === "solution") return "Solutions";
  if (value === "thumbnail") return "Covers";
  return folderSegment(value, "Files");
}

function appendCollisionSuffix(storageKey: string, sourceId: string): string {
  const slashIndex = storageKey.lastIndexOf("/");
  const directory = slashIndex >= 0 ? storageKey.slice(0, slashIndex + 1) : "";
  const filename = slashIndex >= 0 ? storageKey.slice(slashIndex + 1) : storageKey;
  const dotIndex = filename.lastIndexOf(".");
  const suffix =
    sourceId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 8) ||
    crypto.randomUUID().slice(0, 8);

  if (dotIndex <= 0) return `${directory}${filename}-${suffix}`;
  return `${directory}${filename.slice(0, dotIndex)}-${suffix}${filename.slice(dotIndex)}`;
}

export function normalizeDocumentType(value: string): "pyq" | "syllabus" | "study-material" {
  const normalized = value.trim().toLowerCase();
  if (normalized === "pyq" || normalized === "pyqs") return "pyq";
  if (normalized === "syllabus") return "syllabus";
  return "study-material";
}

export function approvalStatus(value: string): "pending" | "approved" | "rejected" {
  const normalized = value.trim().toLowerCase();
  if (normalized === "published" || normalized === "approved") return "approved";
  if (normalized === "rejected") return "rejected";
  return "pending";
}

export function publicStatus(value: string): "published" | "pending" | "rejected" {
  if (value === "approved") return "published";
  if (value === "rejected") return "rejected";
  return "pending";
}

export function normalizeExamSession(value: string): "S" | "W" | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "w" || /(winter|dec|jan|nov)/.test(normalized)) return "W";
  if (normalized === "s" || /(summer|may|jun|apr|spring)/.test(normalized)) return "S";
  return null;
}

export function sessionName(value?: string | null): string | null {
  if (value === "W") return "winter";
  if (value === "S") return "summer";
  return null;
}

export function buildResourceStorageKey(input: {
  folderLabel: string;
  branchName: string;
  branchSlug?: string;
  semester?: number | null;
  subjectName?: string;
  subjectSlug?: string;
  sourceId: string;
  filename: string;
  filenamePrefix?: string;
}): string {
  const folder = materialTypeFolder(input.folderLabel);
  const segments = [
    "storage",
    "Engineering",
    folderSegment(input.branchName || "", input.branchSlug || "Branch"),
  ];

  if (input.semester) segments.push(`Sem ${input.semester}`);
  segments.push(folder);

  if (input.subjectName || input.subjectSlug) {
    segments.push(folderSegment(input.subjectName || "", input.subjectSlug || "Subject"));
  }

  segments.push(`${input.filenamePrefix || ""}${safeFilename(input.filename)}`);

  return segments.filter(Boolean).join("/");
}

export async function getAvailableStorageKey(
  env: UploadEnv,
  storageKey: string,
  sourceId: string
): Promise<string> {
  const existing = await env.MATERIALS_BUCKET.head(storageKey);
  return existing ? appendCollisionSuffix(storageKey, sourceId) : storageKey;
}

export async function resolveBranch(
  env: Pick<UploadEnv, "DB">,
  input: { branchId?: string; branchSlug?: string; branchName?: string }
): Promise<BranchRow | null> {
  const branchId = input.branchId?.trim();
  const branchSlug = input.branchSlug?.trim();
  const branchName = input.branchName?.trim();

  return env.DB.prepare(
    `SELECT id, university_id, name, slug, short_name
     FROM branches
     WHERE (? != '' AND id = ?)
        OR (? != '' AND slug = ?)
        OR (? != '' AND name = ?)
     LIMIT 1`
  )
    .bind(branchId || "", branchId || "", branchSlug || "", branchSlug || "", branchName || "", branchName || "")
    .first<BranchRow>();
}

export async function resolveSubject(
  env: Pick<UploadEnv, "DB">,
  input: {
    subjectId?: string;
    branchId: string;
    universityId: string;
    semester: number;
    subjectName: string;
    subjectCode?: string;
  }
): Promise<SubjectRow> {
  const subjectId = input.subjectId?.trim();

  if (subjectId) {
    const existing = await env.DB.prepare(
      `SELECT id, university_id, branch_id, semester, code, name, slug
       FROM subjects
       WHERE id = ?`
    )
      .bind(subjectId)
      .first<SubjectRow>();
    if (existing) return existing;
  }

  const name = input.subjectName.trim();
  if (!name) throw new Error("Subject is required");

  const slug = slugify(name, "subject");
  const code = input.subjectCode?.trim() || null;

  let subject = await env.DB.prepare(
    `SELECT id, university_id, branch_id, semester, code, name, slug
     FROM subjects
     WHERE branch_id = ? AND semester = ? AND (slug = ? OR (? IS NOT NULL AND code = ?))
     LIMIT 1`
  )
    .bind(input.branchId, input.semester, slug, code, code)
    .first<SubjectRow>();

  if (subject) return subject;

  const id = `sub_${slug}_${input.semester}_${crypto.randomUUID().split("-")[0]}`;
  await env.DB.prepare(
    `INSERT INTO subjects (id, university_id, branch_id, semester, name, code, slug)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, input.universityId, input.branchId, input.semester, name, code, slug)
    .run();

  subject = await env.DB.prepare(
    `SELECT id, university_id, branch_id, semester, code, name, slug
     FROM subjects
     WHERE id = ?`
  )
    .bind(id)
    .first<SubjectRow>();

  if (!subject) throw new Error("Failed to create subject");
  return subject;
}

async function uploadDocumentFile(input: {
  env: UploadEnv;
  requestUrl: string;
  documentId: string;
  file: File;
  fileType: "paper" | "solution" | "syllabus" | "material" | "thumbnail" | "other";
  isPrimary: boolean;
  createdAssetIds: Set<string>;
}): Promise<{ id: string; storageKey: string; url: string; fileAssetId: string }> {
  const { asset, created } = await getOrCreateFileAsset({
    env: input.env,
    file: input.file,
    requestUrl: input.requestUrl,
  });

  if (created) {
    input.createdAssetIds.add(asset.id);
  }

  const id = `file_${crypto.randomUUID().split("-")[0]}`;
  const url = fileAssetDownloadUrl(asset, input.requestUrl);
  const originalFilename = input.file.name.trim() || asset.original_filename;

  await input.env.DB.prepare(
    `INSERT INTO document_files
       (id, document_id, file_type, file_asset_id, original_filename, storage_key, file_url, mime_type, size_bytes, is_primary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      input.documentId,
      input.fileType,
      asset.id,
      originalFilename,
      asset.storage_key,
      url,
      asset.mime_type || input.file.type || null,
      asset.size_bytes ?? input.file.size ?? null,
      input.isPrimary ? 1 : 0
    )
    .run();

  return { id, storageKey: asset.storage_key, url, fileAssetId: asset.id };
}

export async function createDocumentWithFiles(input: CreateDocumentInput): Promise<{
  id: string;
  title: string;
  document_type: string;
  material_type: string;
  status: string;
  approval_status: string;
  storage_key: string;
  url: string;
  blog_id?: string | null;
}> {
  const safeTitle = (input.title || input.file?.name || "material")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase()
    .slice(0, 30);
  const documentId = `doc_${safeTitle}_${crypto.randomUUID().split("-")[0]}`;
  const status = approvalStatus(input.status);
  const primaryFileType =
    input.parentDocumentId
      ? "solution"
      : input.documentType === "pyq"
        ? "paper"
        : input.documentType === "syllabus"
          ? "syllabus"
          : "material";
  const createdAssetIds = new Set<string>();

  // Determine if a linked blog is enabled and generate its ID early so we can reference it in documents
  let blogId: string | null = input.blogId || null;
  const blogEnabled =
    input.blog?.enabled ||
    Boolean(input.blog?.title?.trim() && input.blog?.content?.trim());

  if (blogEnabled && !blogId) {
    const blogContent = input.blog?.content?.trim();
    if (!blogContent) {
      throw new Error("Blog content is required when creating a linked blog");
    }
    blogId = `blog_${crypto.randomUUID().split("-")[0]}`;
  }

  // --- DUPLICATE CHECK LOGIC ---
  if (input.documentType === "pyq") {
    const season = normalizeExamSession(input.examSession || "") || "S";
    const examYear = input.examYear || new Date().getFullYear();
    const existingPyq = await input.env.DB.prepare(
      `SELECT id FROM documents
       WHERE subject_id = ? AND document_type = 'pyq' AND paper_year = ? AND season = ?`
    ).bind(input.subject.id, examYear, season).first();
    
    if (existingPyq) {
      throw new Error("This material (PYQ) already exists. Please ask admin to review whether it is the same or not.");
    }
  } else if (input.documentType === "syllabus") {
    const existingSyllabus = await input.env.DB.prepare(
      `SELECT id FROM documents
       WHERE subject_id = ? AND document_type = 'syllabus' AND syllabus_year = ?`
    ).bind(input.subject.id, input.syllabusYear || null).first();
    
    if (existingSyllabus) {
      throw new Error("This material (Syllabus) already exists for this WEF year. Please ask admin to review whether it is the same or not.");
    }
  }
  // -----------------------------

  try {
    const pyqSeason = input.documentType === "pyq" ? (normalizeExamSession(input.examSession || "") || "S") : null;
    const pyqYear = input.documentType === "pyq" ? (input.examYear || new Date().getFullYear()) : null;
    const pyqExamLabel = input.documentType === "pyq" ? `${pyqSeason === "W" ? "Winter" : "Summer"} ${pyqYear}` : null;

    await input.env.DB.prepare(
      `INSERT INTO documents (
         id, document_type, university_id, branch_id, semester, subject_id, title,
         description, approval_status, uploaded_by, approved_by, approved_at, blog_id, parent_document_id,
         paper_year, season, exam_label, syllabus_year, regulation, version_label,
         material_kind, unit_no, chapter, topic, author, views, likes, downloads
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`
    )
      .bind(
        documentId,
        input.documentType,
        input.branch.university_id,
        input.branch.id,
        input.subject.semester,
        input.subject.id,
        input.title || input.file?.name || `${input.subject.name} Syllabus`,
        input.description || null,
        status,
        input.uploadedBy || "admin",
        status === "approved" ? "admin" : null,
        status === "approved" ? new Date().toISOString() : null,
        blogEnabled && !input.blogId ? null : blogId,
        input.parentDocumentId || null,
        pyqYear,
        pyqSeason,
        pyqExamLabel,
        input.documentType === "syllabus" ? (input.syllabusYear || null) : null,
        input.documentType === "syllabus" ? (input.regulation || null) : null,
        input.documentType === "syllabus" ? (input.versionLabel || null) : null,
        input.documentType === "study-material" ? (input.materialKind || "notes") : null,
        input.documentType === "study-material" ? (input.unitNo || null) : null,
        input.documentType === "study-material" ? (input.chapter || null) : null,
        input.documentType === "study-material" ? (input.topic || null) : null,
        input.documentType === "study-material" ? (input.author || null) : null
      )
      .run();

    let primary: { id: string; storageKey: string; url: string; fileAssetId?: string };

    if (input.file) {
      primary = await uploadDocumentFile({
        env: input.env,
        requestUrl: input.requestUrl,
        documentId,
        file: input.file,
        fileType: primaryFileType,
        isPrimary: true,
        createdAssetIds,
      });
    } else {
      const fileId = `file_${crypto.randomUUID().split("-")[0]}`;
      const defaultUrl = input.fileUrl || (input.subject?.code ? `https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/${input.subject.code}.pdf` : '');
      const originalFilename = `${input.subject?.code || input.subject?.name || 'GTU'}_Syllabus.pdf`;

      await input.env.DB.prepare(
        `INSERT INTO document_files
           (id, document_id, file_type, file_asset_id, original_filename, storage_key, file_url, mime_type, size_bytes, is_primary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          fileId,
          documentId,
          primaryFileType,
          null,
          originalFilename,
          null,
          defaultUrl,
          'application/pdf',
          0,
          1
        )
        .run();

      primary = { id: fileId, storageKey: '', url: defaultUrl };
    }

    if (input.solutionFile && input.documentType === "pyq") {
      await uploadDocumentFile({
        env: input.env,
        requestUrl: input.requestUrl,
        documentId,
        file: input.solutionFile,
        fileType: "solution",
        isPrimary: false,
        createdAssetIds,
      });
    }

    if (blogEnabled && blogId && !input.blogId) {
      const blogTitle = input.blog?.title?.trim() || input.title;
      const blogContent = input.blog?.content?.trim() || "";
      await input.env.DB.prepare(
        `INSERT INTO blogs
           (id, related_document_id, title, content, author, category, tags, thumbnail, status, views)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
      )
        .bind(
          blogId,
          documentId,
          blogTitle,
          blogContent,
          input.blog?.author || input.uploadedBy || "Admin",
          input.blog?.category || "Study Guides",
          input.blog?.tags || null,
          input.blog?.thumbnail || null,
          input.blog?.status === "published" ? "published" : "draft"
        )
        .run();

      // Now set the blog_id in documents table to satisfy the foreign key constraint
      await input.env.DB.prepare(
        `UPDATE documents SET blog_id = ? WHERE id = ?`
      )
        .bind(blogId, documentId)
        .run();
    }

    return {
      id: documentId,
      title: input.title || input.file?.name || "Untitled resource",
      document_type: input.documentType,
      material_type: input.documentType,
      status,
      approval_status: status,
      storage_key: primary.storageKey,
      url: primary.url,
      blog_id: blogId,
    };
  } catch (error) {
    await input.env.DB.prepare("DELETE FROM documents WHERE id = ?").bind(documentId).run().catch(() => undefined);
    for (const assetId of createdAssetIds) {
      await releaseFileAssetIfOrphaned(input.env, assetId);
    }
    throw error;
  }
}

export async function deleteDocumentAndFiles(env: UploadEnv, documentId: string): Promise<number> {
  const { results } = await env.DB.prepare(
    `SELECT file_asset_id, storage_key
     FROM document_files
     WHERE document_id = ?`
  )
    .bind(documentId)
    .all<{ file_asset_id: string | null; storage_key: string | null }>();

  const fileAssetIds = new Set<string>();
  const legacyStorageKeys: string[] = [];

  for (const file of results || []) {
    if (file.file_asset_id) {
      fileAssetIds.add(file.file_asset_id);
    } else if (file.storage_key) {
      legacyStorageKeys.push(file.storage_key);
    }
  }

  const result = await env.DB.prepare("DELETE FROM documents WHERE id = ?").bind(documentId).run();

  for (const assetId of fileAssetIds) {
    await releaseFileAssetIfOrphaned(env, assetId);
  }

  for (const storageKey of legacyStorageKeys) {
    if (env.MATERIALS_BUCKET) {
      const deletePromise = env.MATERIALS_BUCKET.delete(storageKey).catch(() => undefined);
      const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 1000));
      await Promise.race([deletePromise, timeoutPromise]);
    }
  }

  return result.meta.changes || 0;
}

export async function uploadAuxiliaryFile(
  env: UploadEnv,
  file: File,
  storageKey: string,
  metadata: Record<string, string>
): Promise<string> {
  await env.MATERIALS_BUCKET.put(storageKey, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
    customMetadata: metadata,
  });

  return materialDownloadUrl(storageKey);
}
