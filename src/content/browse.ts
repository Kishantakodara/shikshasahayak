export type MaterialTypeKey = 'pyq' | 'study-material' | 'syllabus';

export interface MaterialTypeConfig {
  key: MaterialTypeKey;
  title: string;
  folderLabel: string;
  description: string;
  aboutTitle: string;
  aboutBody: string[];
  icon: 'FileStack' | 'BookOpen' | 'ScrollText';
}

export const MATERIAL_TYPES: Record<MaterialTypeKey, MaterialTypeConfig> = {
  pyq: {
    key: 'pyq',
    title: 'Previous Year Question Papers',
    folderLabel: 'PYQs',
    description: 'Past university exam papers organized by branch, semester, subject, and exam season.',
    aboutTitle: 'About PYQ Papers',
    aboutBody: [
      'Practicing past university question papers (PYQs) is the single most effective preparation strategy for engineering students. It allows you to familiarize yourself with the question formats, marks distribution, and recurring topics that external examiners prioritize year after year.',
      'Our question paper repository is organized by department, semester, subject, and examination season (Summer and Winter). This granular classification allows you to target your revision precisely, whether you are solving papers unit-by-unit or simulating final examination hall conditions.',
      'To save storage and ensure seamless navigation, each PDF is uploaded once into our Cloudflare R2 bucket and mapped across all relevant subject offerings. If a core subject is shared between Computer Engineering and Information Technology, the exact same approved question paper will appear in both folders automatically.',
      'Every question paper and solution key is reviewed and approved by moderator admins to guarantee accuracy and clear readability before it is made public.',
    ],
    icon: 'FileStack',
  },
  'study-material': {
    key: 'study-material',
    title: 'Study Material',
    folderLabel: 'Study Material',
    description: 'Unit notes and chapter summaries shared by contributors.',
    aboutTitle: 'About Study Material',
    aboutBody: [
      'Comprehensive, high-quality study notes and reference materials form the core foundation of self-directed study. When textbook chapters are too dense and lectures pass by too quickly, our peer-contributed and faculty-verified study materials provide clear, structured, and high-yield content to help you master complex topics.',
      'The study material archive follows our standard directory structure: choose your engineering department, pick your semester, and click into the specific subject folder. Within each subject folder, you will find lecture notes, unit-wise summaries, handwritten formula sheets, and practical lab manuals.',
      'We place a strong emphasis on conceptual clarity, diagrams, and step-by-step mathematical derivations. This helps you grasp difficult algorithms, electrical circuit analyses, and engineering physics problems in less time.',
      'If you have created high-quality study guides or notes, you can submit them to the community via our Contribute page to assist fellow students.',
    ],
    icon: 'BookOpen',
  },
  syllabus: {
    key: 'syllabus',
    title: 'Syllabus',
    folderLabel: 'Syllabus',
    description: 'Official and curated syllabus documents per subject offering.',
    aboutTitle: 'About Syllabus Files',
    aboutBody: [
      'A syllabus acts as the essential blueprint for your academic semester, outlining the boundary constraints of what you are expected to learn. Studying without referencing the official syllabus often leads to wasted effort on out-of-scope topics or missed marks on minor sub-topics.',
      'Our syllabus repository is directly linked to specific curriculum versions and university schemes (such as the 2025 and 2026 schemes). This keeps outdated curriculum versions from cluttering your current course folders, giving you exact guidance on your current scheme.',
      'By selecting your department and academic semester, you can view the complete syllabus list for all active courses. Use these files to plan your preparation, verify the topics covered in lecture notes, and check the recommended reference textbooks suggested by the university board.',
    ],
    icon: 'ScrollText',
  },
};

export const DEFAULT_CURRICULUM = 'cv_2026';

export function isMaterialType(value: string | undefined): value is MaterialTypeKey {
  return value === 'pyq' || value === 'study-material' || value === 'syllabus';
}

export function normalizeMaterialType(value: string | undefined): MaterialTypeKey {
  if (!value) return 'study-material';
  const v = value.toLowerCase().trim();
  if (v === 'pyq' || v === 'pyqs') return 'pyq';
  if (v === 'syllabus' || v === 'syllabuses') return 'syllabus';
  if (v === 'study-material' || v === 'study-materials' || v === 'notes') return 'study-material';
  return isMaterialType(v) ? v : 'study-material';
}

export function sessionLabel(code: string): string {
  const season = code.startsWith('W') ? 'Winter' : 'Summer';
  const year = code.slice(1);
  return `${season} ${year}`;
}
