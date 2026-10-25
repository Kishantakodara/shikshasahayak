

export enum PaperType {
  MIDSEM = 'Midsem',
  ENDSEM = 'Endsem',
  QUIZ = 'Quiz',
  ASSIGNMENT = 'Assignment'
}

export type ApprovalStatus = 'published' | 'pending' | 'rejected';

export interface Announcement {
  id: string;
  title: string;
  date: string;
  category: 'Exam' | 'General' | 'Event' | 'Important';
  link?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  color: string;
  iconName: string;
}

export interface PYQ {
  id: string;
  departmentId: string;
  semester: number;
  year: number;
  type: PaperType;
  title: string;
  downloadUrl: string;
  size: string;
  status: ApprovalStatus;
  submittedBy?: string;
  submittedDate?: string;
}

export interface NoteSection {
  id: string;
  title: string;
  content: string; // In a real app, this might be Markdown or HTML
}

export interface Note {
  id: string;
  title: string;
  departmentId: string;
  semester: number;
  author: string;
  lastUpdated: string;
  sections?: NoteSection[];
  pdfUrl?: string;
  storagePath?: string;
  views: number;
  likes: number;
  status: ApprovalStatus;
  submittedBy?: string;
  submittedDate?: string;
}

export type FilterState = {
  department: string | 'all';
  semester: number | 'all';
  year: number | 'all';
  type: PaperType | 'all';
  search: string;
  subject: string | 'all';
};

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date; // ISO date string YYYY-MM-DD
  type: 'exam' | 'study' | 'assignment' | 'other';
}

// --- NEW API TYPES ---

export interface Branch {
  id: string;
  name: string;
  slug: string;
  short_name?: string;
  program_id?: string;
  program_name?: string;
  program_slug?: string;
  /** @deprecated use slug */
  code?: string;
}

export interface BranchDetail {
  branch: Branch;
  semesters: { semester: number }[];
}

export interface BrowseSubject {
  offering_id: string;
  semester: number;
  subject_group?: string;
  curriculum_id: string;
  curriculum_name: string;
  subject_id: string;
  subject_code: string;
  subject_name: string;
  subject_slug: string;
  session_count: number;
  material_count: number;
}

export interface BrowseSessionFolder {
  code: string;
  year: number;
  session: string;
  label: string;
}

export interface BrowseSubjectDetail {
  branch: Branch;
  offering: {
    offering_id: string;
    semester: number;
    subject_group?: string;
    curriculum_id: string;
    curriculum_name: string;
    subject_id: string;
    subject_code: string;
    subject_name: string;
    subject_slug: string;
    session_count?: number;
    material_count?: number;
  };
  semester: number;
  curriculum: string;
  material_type: string;
  sessions: BrowseSessionFolder[];
  materials_without_session: { id: string; title: string; material_type: string; blog_id?: string; version_label?: string }[];
  canonical_pyq_hierarchy?: any;
}

export interface BrowseSessionDetail {
  branch: Branch;
  offering: { offering_id: string; subject_name: string; subject_slug: string };
  semester: number;
  curriculum: string;
  session: BrowseSessionFolder;
  material_type: string;
  materials: Material[];
}

export interface SubjectOffering {
  id: string; // offeringId
  subjectCode: string;
  subjectName: string;
  branch: string;
  semester: number;
  curriculumYear: number;
}

export interface Material {
  id: string;
  title: string;
  type: 'pyq' | 'note' | 'assignment';
  offeringId: string;
  pdfUrl?: string;
  author?: string;
  year?: number; // for PYQs
  status: 'published' | 'pending' | 'rejected';
  createdAt: string;
  departmentId?: string;
  semester?: number;
  blog_id?: string;
  blog_title?: string;
}
