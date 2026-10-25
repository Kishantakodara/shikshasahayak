// ============================================================
// SHIKSHA SAHAYAK OS API: /api/content-engine/types
// ============================================================

import { jsonResponse } from "../../lib/json";
import { ResourceTypeConfig } from "../../../src/types/content-engine";

const SUPPORTED_RESOURCE_TYPES: ResourceTypeConfig[] = [
  { type: 'notes', label: 'Notes & Study Material', category: 'text', description: 'Comprehensive subject notes and unit summaries', iconName: 'BookOpen' },
  { type: 'pyq', label: 'Previous Year Papers (PYQ)', category: 'assessment', description: 'University past exam question papers', iconName: 'FileText' },
  { type: 'question_bank', label: 'Question Bank', category: 'assessment', description: 'Curated question collections with answer keys', iconName: 'HelpCircle' },
  { type: 'book', label: 'Textbooks', category: 'text', description: 'Full course textbooks and prescribed readings', iconName: 'Book' },
  { type: 'reference_book', label: 'Reference Books', category: 'text', description: 'Advanced reference literature and handbooks', iconName: 'Library' },
  { type: 'formula_sheet', label: 'Formula Sheets', category: 'text', description: 'Quick formula reference cards and key equations', iconName: 'Award' },
  { type: 'assignment', label: 'Assignments & Worksheets', category: 'assessment', description: 'Classroom homework assignments and practice sets', iconName: 'CheckSquare' },
  { type: 'lab_manual', label: 'Lab Manuals', category: 'text', description: 'Practical laboratory instructions and experiment guides', iconName: 'FlaskConical' },
  { type: 'practical', label: 'Practical Solutions', category: 'code', description: 'Completed lab experiment reports and code', iconName: 'Terminal' },
  { type: 'mini_project', label: 'Mini Projects', category: 'project', description: 'Semester mini projects with source code and documentation', iconName: 'FolderGit2' },
  { type: 'major_project', label: 'Major Projects / Thesis', category: 'project', description: 'Final year capstone projects and research reports', iconName: 'GraduationCap' },
  { type: 'ppt', label: 'Presentations (PPT)', category: 'multimedia', description: 'Lecture slides and seminar presentations', iconName: 'Presentation' },
  { type: 'cheat_sheet', label: 'Cheat Sheets', category: 'text', description: 'One-page exam review guides and summaries', iconName: 'Zap' },
  { type: 'research_paper', label: 'Research Papers', category: 'text', description: 'Academic journal articles and conference papers', iconName: 'FileCode' },
  { type: 'blog', label: 'Educational Blogs', category: 'text', description: 'Explanatory articles and study guides', iconName: 'FileEdit' },
  { type: 'article', label: 'Technical Articles', category: 'text', description: 'Deep-dive technology overviews', iconName: 'Newspaper' },
  { type: 'video', label: 'Video Tutorials', category: 'multimedia', description: 'Recorded topic explanations and demonstrations', iconName: 'Video' },
  { type: 'recorded_lecture', label: 'Recorded Classroom Lectures', category: 'multimedia', description: 'Full classroom session video recordings', iconName: 'Tv' },
  { type: 'animation', label: 'Interactive Animations', category: 'multimedia', description: 'Visual concept animations and simulations', iconName: 'PlaySquare' },
  { type: 'infographic', label: 'Infographics', category: 'multimedia', description: 'Visual diagrams and flowcharts', iconName: 'Image' },
  { type: 'mock_test', label: 'Mock Tests', category: 'assessment', description: 'Full-length practice exam simulations', iconName: 'Target' },
  { type: 'quiz', label: 'Quizzes', category: 'assessment', description: 'Interactive topic assessment quizzes', iconName: 'Brain' },
  { type: 'flashcard', label: 'Flashcards', category: 'interactive', description: 'Active recall study cards', iconName: 'Layers' },
  { type: 'code_example', label: 'Code Examples & Snippets', category: 'code', description: 'Runnable source code snippets and algorithms', iconName: 'Code2' },
  { type: 'software_tool', label: 'Software Tools & Utilities', category: 'other', description: 'Simulators, IDEs, and academic calculators', iconName: 'Wrench' },
  { type: 'external_reference', label: 'External Web Links', category: 'other', description: 'Curated external academic websites and docs', iconName: 'ExternalLink' },
  { type: 'other', label: 'Other Resources', category: 'other', description: 'Miscellaneous academic learning materials', iconName: 'File' },
];

export async function onRequestGet() {
  return jsonResponse({
    resourceTypes: SUPPORTED_RESOURCE_TYPES,
    difficulties: ['beginner', 'intermediate', 'advanced', 'expert'],
    visibilities: ['public', 'private', 'unlisted', 'restricted'],
    statuses: ['draft', 'pending', 'approved', 'rejected', 'archived'],
  }, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
