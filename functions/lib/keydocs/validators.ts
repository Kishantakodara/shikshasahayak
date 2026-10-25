// ============================================================
// SHIKSHA SAHAYAK OS KEYDOCS 3.0: VALIDATORS SERVICE
// Payload verification & integrity checks for KeyDocs requests
// ============================================================

import { DocumentType, DocumentStatus, CurriculumNodeType, MaterialKind, DocumentRelationType } from "./types";

export function validateDocumentType(type: any): DocumentType {
  const valid: DocumentType[] = ['pyq', 'syllabus', 'study-material'];
  if (!valid.includes(type)) {
    throw new Error(`Invalid document_type: '${type}'. Must be one of: ${valid.join(', ')}`);
  }
  return type as DocumentType;
}

export function validateDocumentStatus(status: any): DocumentStatus {
  const valid: DocumentStatus[] = ['draft', 'review', 'published', 'archived', 'rejected'];
  if (!valid.includes(status)) {
    throw new Error(`Invalid status: '${status}'. Must be one of: ${valid.join(', ')}`);
  }
  return status as DocumentStatus;
}

export function validateCurriculumNodeType(type: any): CurriculumNodeType {
  const valid: CurriculumNodeType[] = ['unit', 'topic', 'subtopic'];
  if (!valid.includes(type)) {
    throw new Error(`Invalid node_type: '${type}'. Must be one of: ${valid.join(', ')}`);
  }
  return type as CurriculumNodeType;
}

export function validateMaterialKind(kind: any): MaterialKind {
  const valid: MaterialKind[] = ['notes', 'book', 'assignment', 'practical', 'question_bank', 'video', 'other'];
  if (!valid.includes(kind)) {
    return 'notes';
  }
  return kind as MaterialKind;
}

export function validateRelationType(type: any): DocumentRelationType {
  const valid: DocumentRelationType[] = ['solution', 'revision', 'translation', 'duplicate', 'related'];
  if (!valid.includes(type)) {
    throw new Error(`Invalid relation_type: '${type}'. Must be one of: ${valid.join(', ')}`);
  }
  return type as DocumentRelationType;
}
