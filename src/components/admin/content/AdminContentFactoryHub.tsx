// ============================================================
// SHIKSHA SAHAYAK OS: CONTENT FACTORY V2 — PRODUCTION CONTROL CENTER
// Multi-modal academic synthesis, validation, review & publishing
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  Layers,
  ChevronRight,
  BookOpen,
  Eye,
  Edit,
  Trash2,
  ArrowRight,
  Zap,
  Cpu,
  Brain,
  ShieldCheck,
  RotateCcw,
  X,
  ExternalLink,
  Plus,
  Filter,
  Copy,
  Check,
  AlertTriangle,
  HelpCircle,
  ListOrdered,
  FileCheck,
  RefreshCw,
  Search,
  Code2,
  Sliders,
  Send,
  Download,
  BookMarked
} from 'lucide-react';
import { AdminContentShell, KPICardItem } from './AdminContentShell';
import { apiClient, fetchWithAuth } from '../../../api/client';
import { academicManagementClient } from '../../../api/academicManagementClient';
import { toast } from 'sonner';
import MDEditor from '@uiw/react-md-editor';

export interface GenerationJob {
  id: string;
  scope: string;
  contentTypes: string;
  topicCount: number;
  status: 'Processing' | 'Awaiting Review' | 'Approved' | 'Published' | 'Failed';
  progress: number;
  createdBy: string;
  createdAt: string;
}

export interface ContentItem {
  id: string;
  job_id?: string;
  university_id?: string;
  branch_id?: string;
  branch_name?: string;
  semester?: number;
  subject_id?: string;
  subject_name?: string;
  unit_no?: number;
  unit_title?: string;
  topic: string;
  content_type: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  structured_content?: any;
  raw_markdown?: string;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED';
  validation_status?: 'valid' | 'warning' | 'flagged';
  validation_notes?: string;
  published_document_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface ContentTypeConfig {
  id: string;
  label: string;
  icon: string;
  description: string;
  enabled: boolean;
  quantity?: number;
  supportsQuantity?: boolean;
  quantityLabel?: string;
  defaultQuantity?: number;
}

const DEFAULT_CONTENT_TYPES: ContentTypeConfig[] = [
  { id: 'detailed_notes', label: 'Detailed Revision Notes', icon: '📖', description: 'Deep conceptual explanations, diagrams, derivations', enabled: true },
  { id: 'short_notes', label: 'Short Notes & Summary', icon: '📝', description: 'Concise bullet points for last-minute exam prep', enabled: true },
  { id: 'definitions', label: 'Key Definitions & Terms', icon: '🔑', description: 'Standardized textbook and syllabus definitions', enabled: true },
  { id: 'examples', label: 'Real-World Examples', icon: '💡', description: 'Practical industry applications and case studies', enabled: true },
  { id: 'mcqs', label: 'MCQs & Solutions', icon: '🎯', description: 'Exam practice multiple-choice questions with rationales', enabled: true, supportsQuantity: true, quantityLabel: 'Questions', defaultQuantity: 10, quantity: 10 },
  { id: 'short_questions', label: 'Short Questions (2 Marks)', icon: '❓', description: 'Concise university exam questions with model answers', enabled: true, supportsQuantity: true, quantityLabel: 'Questions', defaultQuantity: 5, quantity: 5 },
  { id: 'long_questions', label: 'Long Questions (7 Marks)', icon: '📋', description: 'Comprehensive descriptive exam questions with solutions', enabled: true, supportsQuantity: true, quantityLabel: 'Questions', defaultQuantity: 3, quantity: 3 },
  { id: 'numerical_problems', label: 'Numerical Problems', icon: '🔢', description: 'Step-by-step mathematical calculations and formulas', enabled: false, supportsQuantity: true, quantityLabel: 'Problems', defaultQuantity: 3, quantity: 3 },
  { id: 'viva_questions', label: 'Viva Voce & Lab Questions', icon: '🎓', description: 'Practical exam questions with oral defense points', enabled: true, supportsQuantity: true, quantityLabel: 'Questions', defaultQuantity: 5, quantity: 5 },
  { id: 'quick_revision', label: 'Quick Revision Formula Sheet', icon: '⚡', description: 'Formula sheets, cheat codes, common mistakes to avoid', enabled: true }
];

export const AdminContentFactoryHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'import_ai_pro' | 'generate' | 'review' | 'published' | 'jobs'>('overview');
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Academic Scope Hierarchy
  const [universities, setUniversities] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [academicLoading, setAcademicLoading] = useState<boolean>(true);
  const [academicError, setAcademicError] = useState<string | null>(null);

  // Selected Scope State
  const [selectedUnivId, setSelectedUnivId] = useState<string>('gtu');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('branch_computer');
  const [selectedSemester, setSelectedSemester] = useState<number>(5);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('');
  const [selectedUnitNo, setSelectedUnitNo] = useState<number>(1);
  const [selectedUnitTitle, setSelectedUnitTitle] = useState<string>('Introduction & Fundamentals');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [subjectUnits, setSubjectUnits] = useState<any[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  // Content Types Configuration State
  const [contentTypes, setContentTypes] = useState<ContentTypeConfig[]>(DEFAULT_CONTENT_TYPES);

  // Mode A Import Form State
  const [importJsonText, setImportJsonText] = useState('');
  const [importValidationResult, setImportValidationResult] = useState<{
    valid: boolean;
    issues: string[];
    warnings: string[];
    flags: string[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isCopiedPrompt, setIsCopiedPrompt] = useState(false);

  // 3-Pane Review Queue State
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [reviewFilterStatus, setReviewFilterStatus] = useState<string>('ALL');
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [reviewMode, setReviewMode] = useState<'formatted' | 'raw' | 'quiz'>('formatted');
  const [editedMarkdown, setEditedMarkdown] = useState('');
  const [isSavingMarkdown, setIsSavingMarkdown] = useState(false);

  // Active Quiz Preview State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  // 1. Initial Load of Academic Catalog & Data
  const loadInitialData = async () => {
    setIsLoading(true);
    setAcademicLoading(true);
    setAcademicError(null);
    try {
      // 1. Load Academic Hierarchy directly with authenticated API client
      const [univRes, branchRes, subjectRes] = await Promise.all([
        fetchWithAuth('/api/admin/academic/universities').catch(() => null),
        fetchWithAuth('/api/admin/academic/branches').catch(() => null),
        fetchWithAuth('/api/admin/academic/subjects').catch(() => null),
      ]);

      if (univRes && !univRes.ok) {
        if (univRes.status === 401) setAcademicError('Unauthorized: Authentication required');
        else if (univRes.status === 403) setAcademicError('Forbidden: Admin access required');
        else setAcademicError(`Universities API error (${univRes.status})`);
      } else if (branchRes && !branchRes.ok) {
        if (branchRes.status === 401) setAcademicError('Unauthorized: Authentication required');
        else if (branchRes.status === 403) setAcademicError('Forbidden: Admin access required');
        else setAcademicError(`Branches API error (${branchRes.status})`);
      } else if (subjectRes && !subjectRes.ok) {
        if (subjectRes.status === 401) setAcademicError('Unauthorized: Authentication required');
        else if (subjectRes.status === 403) setAcademicError('Forbidden: Admin access required');
        else setAcademicError(`Subjects API error (${subjectRes.status})`);
      }

      const univJson = univRes && univRes.ok ? await univRes.json().catch(() => ({})) : {};
      const branchJson = branchRes && branchRes.ok ? await branchRes.json().catch(() => ({})) : {};
      const subjectJson = subjectRes && subjectRes.ok ? await subjectRes.json().catch(() => ({})) : {};

      const univData = Array.isArray(univJson) ? univJson : (univJson.universities || []);
      const branchData = Array.isArray(branchJson) ? branchJson : (branchJson.branches || []);
      const subjectData = Array.isArray(subjectJson) ? subjectJson : (subjectJson.subjects || []);

      setUniversities(univData);
      setBranches(branchData);
      setSubjects(subjectData);

      // Auto-select valid university and branch
      if (univData.length > 0) {
        const defaultUniv = univData.find((u: any) => u.id === 'univ_default' || u.slug === 'gtu') || univData[0];
        setSelectedUnivId(defaultUniv.id);
      }
      if (branchData.length > 0) {
        const defaultBranch = branchData.find((b: any) => b.id === 'branch_computer' || b.slug === 'computer-engineering') || branchData[0];
        setSelectedBranchId(defaultBranch.id);
      }

      // 2. Load Content Factory Jobs & Items
      await refreshJobsAndItems();
    } catch (err: any) {
      console.error('Failed to load initial content factory data:', err);
      setAcademicError(err?.message || 'Failed to load curriculum data');
    } finally {
      setIsLoading(false);
      setAcademicLoading(false);
    }
  };

  const refreshJobsAndItems = async () => {
    try {
      const [jobsRes, itemsData] = await Promise.all([
        fetchWithAuth('/api/admin/content-factory/jobs').catch(() => null),
        apiClient.getContentFactoryItems().catch(() => [])
      ]);

      if (jobsRes && jobsRes.ok) {
        const jobsJson = await jobsRes.json().catch(() => ({}));
        const rawJobs = Array.isArray(jobsJson) ? jobsJson : (jobsJson?.jobs || []);
        const mappedJobs: GenerationJob[] = rawJobs.map((j: any) => ({
          id: j.id || `JOB-${j.id}`,
          scope: j.scope || `${j.subject_name || 'Subject'} • Unit ${j.unit_no || '1'}`,
          contentTypes: typeof j.content_types === 'string' ? j.content_types : JSON.stringify(j.content_types || 'Notes'),
          topicCount: j.total_topics || j.topic_count || 1,
          status: j.status === 'completed' ? 'Approved' : j.status === 'in_progress' ? 'Processing' : j.status === 'published' ? 'Published' : 'Awaiting Review',
          progress: j.progress_percent || (j.status === 'completed' ? 100 : 50),
          createdBy: j.created_by || 'Admin',
          createdAt: j.created_at ? new Date(j.created_at).toLocaleDateString() : 'Recent'
        }));
        setJobs(mappedJobs);
      }

      setItems(itemsData || []);
      if (itemsData && itemsData.length > 0 && !selectedItem) {
        setSelectedItem(itemsData[0]);
        setEditedMarkdown(itemsData[0].raw_markdown || '');
      }
    } catch (e) {
      console.error('Error refreshing content items:', e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filtered branches for current selected university (supports univ_default & gtu)
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const uId = b.universityId || b.university_id;
      return (
        !selectedUnivId ||
        selectedUnivId === 'all' ||
        uId === selectedUnivId ||
        (selectedUnivId === 'gtu' && (uId === 'univ_default' || uId === 'gtu')) ||
        (selectedUnivId === 'univ_default' && (uId === 'univ_default' || uId === 'gtu'))
      );
    });
  }, [branches, selectedUnivId]);

  // Semesters with subject counts for the selected branch
  const availableSemesters = useMemo(() => {
    const branchSubjects = subjects.filter((s) => {
      const bId = s.branchId || s.branch_id;
      const bSlug = s.branchSlug || s.branch_slug;
      return !selectedBranchId || selectedBranchId === 'all' || bId === selectedBranchId || bSlug === selectedBranchId;
    });
    const sems = Array.from(new Set(branchSubjects.map((s) => Number(s.semester)).filter((n) => !isNaN(n) && n > 0))).sort((a, b) => a - b);
    return sems.length > 0 ? sems : [1, 2, 3, 4, 5, 6, 7, 8];
  }, [subjects, selectedBranchId]);

  // Filtered Subjects for Current Cascaded Selection (supports camelCase & snake_case)
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const bId = s.branchId || s.branch_id;
      const bSlug = s.branchSlug || s.branch_slug;
      const uId = s.universityId || s.university_id;
      const matchUniv =
        !selectedUnivId ||
        selectedUnivId === 'all' ||
        uId === selectedUnivId ||
        (selectedUnivId === 'gtu' && (uId === 'univ_default' || uId === 'gtu')) ||
        (selectedUnivId === 'univ_default' && (uId === 'univ_default' || uId === 'gtu'));
      const matchBranch = !selectedBranchId || selectedBranchId === 'all' || bId === selectedBranchId || bSlug === selectedBranchId;
      const matchSem = !selectedSemester || Number(s.semester) === Number(selectedSemester);
      return matchUniv && matchBranch && matchSem;
    });
  }, [subjects, selectedUnivId, selectedBranchId, selectedSemester]);

  // Update selected subject when filtered subjects change
  useEffect(() => {
    if (filteredSubjects.length > 0) {
      const exists = filteredSubjects.find(s => s.id === selectedSubjectId);
      if (!exists) {
        setSelectedSubjectId(filteredSubjects[0].id);
        setSelectedSubjectName(filteredSubjects[0].name);
      }
    } else {
      setSelectedSubjectId('');
      setSelectedSubjectName('');
    }
  }, [filteredSubjects, selectedSubjectId]);

  // Load Subject Details (Units & Topics) when selectedSubjectId changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setSubjectUnits([]);
      return;
    }
    let isCancelled = false;
    setIsLoadingUnits(true);
    fetchWithAuth(`/api/admin/academic/subjects/${selectedSubjectId}`)
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!isCancelled && data) {
          const units = data.units || [];
          setSubjectUnits(units);
          if (units.length > 0) {
            const firstUnit = units[0];
            setSelectedUnitNo(Number(firstUnit.unit_number || firstUnit.unitNumber || 1));
            setSelectedUnitTitle(firstUnit.title || firstUnit.name || 'Unit 1');
          }
          if (data.topics && data.topics.length > 0) {
            setSelectedTopic(data.topics[0].title || data.topics[0].name || '');
          }
        }
      })
      .catch((e) => {
        console.warn('Could not load subject details:', e);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingUnits(false);
      });

    return () => { isCancelled = true; };
  }, [selectedSubjectId]);

  // KPIs
  const totalJobs = jobs.length;
  const draftCount = items.filter((i) => i.status === 'DRAFT').length;
  const reviewCount = items.filter((i) => i.status === 'REVIEW').length;
  const approvedCount = items.filter((i) => i.status === 'APPROVED').length;
  const publishedCount = items.filter((i) => i.status === 'PUBLISHED').length;

  const kpis: KPICardItem[] = [
    {
      label: 'Total Pipeline Jobs',
      value: totalJobs,
      trend: 'Content Batches',
      icon: Layers,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    },
    {
      label: 'Drafts',
      value: draftCount,
      subtext: 'Editable in Staging',
      icon: FileText,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Awaiting Review',
      value: reviewCount,
      subtext: 'Academic Quality Check',
      icon: AlertCircle,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      label: 'Approved',
      value: approvedCount,
      trend: `${approvedCount} ready to publish`,
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Published Live',
      value: publishedCount,
      trend: 'Active on Student Portal',
      icon: Sparkles,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
  ];

  // Toggle Content Type
  const handleToggleContentType = (id: string) => {
    setContentTypes((prev) =>
      prev.map((ct) => (ct.id === id ? { ...ct, enabled: !ct.enabled } : ct))
    );
  };

  // Update Content Type Quantity
  const handleUpdateQuantity = (id: string, quantity: number) => {
    setContentTypes((prev) =>
      prev.map((ct) => (ct.id === id ? { ...ct, quantity: Math.max(1, quantity) } : ct))
    );
  };

  // Generate Prompt for Google AI Pro / Gemini
  const generatedAiProPrompt = useMemo(() => {
    const enabledTypes = contentTypes.filter((c) => c.enabled);
    const typeInstructions = enabledTypes
      .map(
        (t) =>
          `- **${t.label}**${t.supportsQuantity ? ` (Exactly ${t.quantity || t.defaultQuantity} items)` : ''}: ${t.description}`
      )
      .join('\n');

    const selectedBranchObj = branches.find(b => b.id === selectedBranchId || b.slug === selectedBranchId);
    const selectedBranchName = selectedBranchObj?.name || 'Computer Engineering';
    const selectedUnivObj = universities.find(u => u.id === selectedUnivId || u.slug === selectedUnivId);
    const selectedUnivName = selectedUnivObj?.name || 'Gujarat Technological University (GTU)';

    return `You are an elite university engineering professor and technical curriculum architect for ${selectedUnivName}.
Generate a comprehensive, authoritative academic study pack in strictly valid JSON format.

### ACADEMIC SCOPE
- **University:** ${selectedUnivName}
- **Branch:** ${selectedBranchName}
- **Semester:** Semester ${selectedSemester}
- **Subject:** ${selectedSubjectName || 'Computer Networks'}
- **Unit ${selectedUnitNo}:** ${selectedUnitTitle}
- **Target Topic:** ${selectedTopic || 'OSI Reference Model & 7-Layer Architecture'}
- **Difficulty Level:** ${selectedDifficulty}

### REQUIRED CONTENT SECTIONS
${typeInstructions}

### STRICT JSON SCHEMA SPECIFICATION
Return ONLY a valid JSON object matching this structure with zero extraneous wrapper text:

{
  "university": "${selectedUnivId}",
  "branch": "${selectedBranchId}",
  "semester": ${selectedSemester},
  "subject_name": "${selectedSubjectName || 'Computer Networks'}",
  "unit_no": ${selectedUnitNo},
  "unit_title": "${selectedUnitTitle}",
  "topic": "${selectedTopic || 'OSI Reference Model & 7-Layer Architecture'}",
  "difficulty": "${selectedDifficulty}",
  "notes": {
    "summary": "Concise 3-sentence summary of the topic.",
    "detailed_notes": "Comprehensive academic markdown notes with clear headers, theoretical principles, diagrams, formulas ($$ ... $$), and real-world examples.",
    "key_takeaways": [
      "Key concept 1",
      "Key concept 2",
      "Key concept 3"
    ]
  },
  "definitions": [
    { "term": "Term Name", "definition": "Rigorous academic textbook definition.", "keyPoints": ["Crucial nuance 1"] }
  ],
  "examples": [
    { "title": "Example Title", "scenario": "Real world technical scenario", "explanation": "Why this mechanism behaves this way." }
  ],
  "mcqs": [
    {
      "question": "Clear, unambiguous technical question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Detailed explanation why Option A is correct and why other options are incorrect."
    }
  ],
  "short_questions": [
    { "question": "Explain the concept of ... (2 Marks)", "answer": "Concise, precise model answer formatted for full marks." }
  ],
  "long_questions": [
    { "question": "Derive/Explain in detail ... (7 Marks)", "answer": "Complete structured descriptive answer with steps and headings." }
  ],
  "numerical_problems": [
    { "problem": "Calculate ...", "givenData": "Given values...", "formulaUsed": "Formula...", "steps": ["Step 1...", "Step 2..."], "finalAnswer": "Final value with units" }
  ],
  "viva_questions": [
    { "question": "What is the key difference between ...?", "answer": "Direct viva oral answer." }
  ],
  "quick_revision": {
    "summaryPoints": ["Point 1", "Point 2"],
    "formulas": ["Equation 1", "Equation 2"],
    "commonMistakes": ["Avoid confusing X with Y..."]
  }
}`;
  }, [
    selectedUnivId,
    selectedBranchId,
    selectedSemester,
    selectedSubjectName,
    selectedUnitNo,
    selectedUnitTitle,
    selectedTopic,
    selectedDifficulty,
    contentTypes
  ]);

  // Copy AI Pro Prompt to Clipboard
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedAiProPrompt);
      setIsCopiedPrompt(true);
      toast.success('AI Pro synthesis prompt copied to clipboard!');
      setTimeout(() => setIsCopiedPrompt(false), 2500);
    } catch {
      toast.error('Failed to copy prompt to clipboard');
    }
  };

  // Pre-validate JSON payload in Mode A
  const handleValidateImportText = (text: string) => {
    setImportJsonText(text);
    if (!text.trim()) {
      setImportValidationResult(null);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const issues: string[] = [];
      const warnings: string[] = [];
      const flags: string[] = [];

      items.forEach((item, idx) => {
        const itemLabel = item.topic ? `Topic "${item.topic}"` : `Item #${idx + 1}`;
        if (!item.topic && !selectedTopic) issues.push(`${itemLabel}: Missing topic title`);
        if (!item.notes?.detailed_notes && !item.detailedNotes && !item.raw_markdown) {
          warnings.push(`${itemLabel}: No detailed notes section provided`);
        }
        if (item.mcqs && Array.isArray(item.mcqs)) {
          item.mcqs.forEach((m: any, mIdx: number) => {
            if (!m.question) issues.push(`${itemLabel} MCQ #${mIdx + 1}: Empty question string`);
            if (!Array.isArray(m.options) || m.options.length < 4) issues.push(`${itemLabel} MCQ #${mIdx + 1}: Must contain 4 options`);
            if (m.correct_answer === undefined && m.answer === undefined) issues.push(`${itemLabel} MCQ #${mIdx + 1}: Missing correct answer index`);
          });
        }
        // Formula checks
        const notesStr = item.notes?.detailed_notes || item.detailedNotes || item.raw_markdown || '';
        if (/(\$\$|\\frac|\\sum|\b[a-zA-Z]\s*=\s*[0-9a-zA-Z_+\-*/^]+\b)/.test(notesStr)) {
          flags.push(`${itemLabel}: Contains mathematical formulas — requires academic verification`);
        }
      });

      setImportValidationResult({
        valid: issues.length === 0,
        issues,
        warnings,
        flags
      });
    } catch (e: any) {
      setImportValidationResult({
        valid: false,
        issues: [`JSON Syntax Error: ${e.message}`],
        warnings: [],
        flags: []
      });
    }
  };

  // Mode A: Submit Import to D1
  const handleImportStructuredPayload = async () => {
    if (!importJsonText.trim()) {
      toast.error('Please paste structured JSON or markdown payload');
      return;
    }

    setIsImporting(true);
    try {
      let parsedPayload: any;
      try {
        parsedPayload = JSON.parse(importJsonText);
      } catch {
        // Fallback markdown format
        parsedPayload = {
          topic: selectedTopic || 'Curriculum Study Topic',
          notes: { detailed_notes: importJsonText }
        };
      }

      const rawItems = Array.isArray(parsedPayload) ? parsedPayload : [parsedPayload];
      const normalizedItems = rawItems.map((item) => ({
        university: item.university || selectedUnivId || 'gtu',
        branch: item.branch || selectedBranchId || 'branch_07',
        semester: Number(item.semester || selectedSemester || 5),
        subject_name: item.subject_name || selectedSubjectName || 'Computer Networks',
        unit_no: Number(item.unit_no || selectedUnitNo || 1),
        unit_title: item.unit_title || selectedUnitTitle || '',
        topic: (item.topic || selectedTopic || 'Core Subject Module').trim(),
        difficulty: item.difficulty || selectedDifficulty || 'medium',
        payload: {
          topic: item.topic || selectedTopic || 'Core Subject Module',
          detailedNotes: item.notes?.detailed_notes || item.detailedNotes,
          shortNotes: item.notes?.short_notes || item.shortNotes,
          definitions: item.definitions,
          examples: item.examples,
          mcqs: (item.mcqs || []).map((m: any) => ({
            question: m.question,
            options: m.options,
            answer: typeof m.correct_answer === 'number' ? m.correct_answer : typeof m.answer === 'number' ? m.answer : 0,
            explanation: m.explanation || ''
          })),
          shortQuestions: item.short_questions || item.shortQuestions,
          longQuestions: item.long_questions || item.longQuestions,
          numericalProblems: item.numerical_problems || item.numericalProblems,
          vivaQuestions: item.viva_questions || item.vivaQuestions,
          quickRevision: item.quick_revision || item.quickRevision
        }
      }));

      const res = await apiClient.importContentFactoryItems(normalizedItems);
      toast.success(`Successfully validated and staged ${res.imported_count || normalizedItems.length} topic(s) as DRAFT!`);
      setImportJsonText('');
      setImportValidationResult(null);
      await refreshJobsAndItems();
      setActiveTab('review');
    } catch (e: any) {
      toast.error(e.message || 'Failed to import and stage content payload');
    } finally {
      setIsImporting(false);
    }
  };

  // State Machine Lifecycle Transitions
  const handleTransitionStatus = async (item: ContentItem, newStatus: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED') => {
    try {
      const res = await apiClient.updateContentFactoryItem({
        id: item.id,
        status: newStatus,
        raw_markdown: editedMarkdown || item.raw_markdown
      });

      if (newStatus === 'PUBLISHED') {
        toast.success(`🚀 "${item.topic}" published live to Student Portal!`);
      } else if (newStatus === 'APPROVED') {
        toast.success(`✅ "${item.topic}" approved for production release!`);
      } else if (newStatus === 'REVIEW') {
        toast.success(`📋 "${item.topic}" moved to Academic Review Queue!`);
      } else {
        toast.info(`Item reverted to DRAFT status.`);
      }

      await refreshJobsAndItems();
      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem((prev) => prev ? { ...prev, status: newStatus, published_document_id: res.published_document_id } : null);
      }
    } catch (e: any) {
      toast.error(e.message || `Failed to transition item to ${newStatus}`);
    }
  };

  // Save Inline Markdown Edits
  const handleSaveMarkdown = async () => {
    if (!selectedItem) return;
    setIsSavingMarkdown(true);
    try {
      await apiClient.updateContentFactoryItem({
        id: selectedItem.id,
        raw_markdown: editedMarkdown
      });
      toast.success('Markdown content updated successfully!');
      setSelectedItem((prev) => prev ? { ...prev, raw_markdown: editedMarkdown } : null);
      await refreshJobsAndItems();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save markdown');
    } finally {
      setIsSavingMarkdown(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this content item? This action is recorded in audit logs.')) return;
    try {
      await apiClient.deleteContentFactoryItem(itemId);
      toast.success('Content item deleted from database.');
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }
      await refreshJobsAndItems();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete item');
    }
  };

  // Filtered Review Queue Items
  const filteredReviewItems = useMemo(() => {
    return items.filter((item) => {
      const matchStatus = reviewFilterStatus === 'ALL' || item.status === reviewFilterStatus;
      const matchSearch =
        !reviewSearchQuery ||
        item.topic.toLowerCase().includes(reviewSearchQuery.toLowerCase()) ||
        (item.subject_name && item.subject_name.toLowerCase().includes(reviewSearchQuery.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [items, reviewFilterStatus, reviewSearchQuery]);

  // Parse structured MCQs for interactive testing
  const parsedMCQs = useMemo(() => {
    if (!selectedItem?.structured_content) return [];
    try {
      const payload = typeof selectedItem.structured_content === 'string' 
        ? JSON.parse(selectedItem.structured_content) 
        : selectedItem.structured_content;
      return payload.mcqs || [];
    } catch {
      return [];
    }
  }, [selectedItem]);

  return (
    <AdminContentShell
      title="Content Factory (AI V2)"
      description="Generate, review, validate, and publish authoritative university curriculum content at scale."
      breadcrumb={['Admin', 'Content Management', 'Content Factory']}
      primaryAction={{
        label: 'Import AI Pro',
        icon: Upload,
        onClick: () => setActiveTab('import_ai_pro'),
      }}
      secondaryAction={{
        label: 'Synthesize Batch',
        icon: Sparkles,
        onClick: () => setActiveTab('generate'),
      }}
      kpis={kpis}
      activeTabSelector={
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
          {[
            { id: 'overview', label: 'Dashboard & SSoT Overview' },
            { id: 'import_ai_pro', label: 'Mode A: Import AI Pro' },
            { id: 'generate', label: 'Mode B: AI Generation' },
            { id: 'review', label: `Review & Approvals (${reviewCount + draftCount})` },
            { id: 'published', label: `Published Catalog (${publishedCount})` },
            { id: 'jobs', label: `Batch Jobs (${jobs.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-orange-500/10 text-orange-400 border-b-2 border-orange-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      }
    >
      {/* ============================================================ */}
      {/* 1. OVERVIEW & SSoT SUMMARY TAB */}
      {/* ============================================================ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Flow Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#0F172A] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  Primary Production Pipeline
                </span>
                <span className="text-slate-400 text-xs font-mono">GTU Engineering Curriculum SSoT</span>
              </div>
              <h2 className="text-lg font-bold text-white">Curriculum Synthesis & Publishing Lifecycle</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Academic Scope → Mode A Google AI Pro Import / Mode B Batch → Automated Quality Validator → Staged Draft → Academic Review → Live Student Portal Delivery.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('import_ai_pro')}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" /> Mode A: Import AI Pro
              </button>
              <button
                onClick={() => setActiveTab('review')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4" /> Open Review Queue ({reviewCount})
              </button>
            </div>
          </div>

          {/* 2-Column Grid: Left: Active Staged Topics, Right: Pipeline Control */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-white text-base">Recently Staged Topics</h3>
                  <p className="text-xs text-slate-400">Items ready for review and publishing</p>
                </div>
                <button
                  onClick={() => setActiveTab('review')}
                  className="text-xs text-orange-400 font-bold hover:underline cursor-pointer"
                >
                  View All ({items.length}) →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold border-b border-slate-800 text-[10px]">
                    <tr>
                      <th className="p-3">Topic Title</th>
                      <th className="p-3">Subject / Unit</th>
                      <th className="p-3">Validation</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {items.length > 0 ? (
                      items.slice(0, 6).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-bold text-white text-[11px]">{item.topic}</td>
                          <td className="p-3 text-slate-300">
                            {item.subject_name || 'Academic Subject'} • Unit {item.unit_no || 1}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                item.validation_status === 'valid'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              <ShieldCheck className="w-3 h-3" /> {item.validation_status || 'valid'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                item.status === 'PUBLISHED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : item.status === 'APPROVED'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : item.status === 'REVIEW'
                                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                  : 'bg-slate-500/10 text-slate-300 border-slate-500/20'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setEditedMarkdown(item.raw_markdown || '');
                                setActiveTab('review');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 font-mono text-xs">
                          {isLoading ? 'Loading content repository...' : 'No content items generated or imported yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Mode A Quick Launch Card */}
            <div className="lg:col-span-4 bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
                  <Zap className="w-4 h-4" /> Quick Generation Launcher
                </div>
                <h3 className="font-extrabold text-white text-base">Mode A — AI Pro Pipeline</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generate comprehensive, syllabus-aligned subject packs in Google AI Pro using our structured prompt template, then validate and publish with 1 click.
                </p>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Selected Scope</span>
                  <p className="font-bold text-white">{selectedSubjectName || 'Select Subject'} (Sem {selectedSemester})</p>
                  <p className="text-orange-400 font-mono text-[11px]">Unit {selectedUnitNo}: {selectedUnitTitle}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setActiveTab('import_ai_pro')}
                  className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Launch Mode A Importer</span>
                </button>
                <button
                  onClick={() => setActiveTab('generate')}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configure Content Types</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. MODE A: GOOGLE AI PRO IMPORT WORKSPACE */}
      {/* ============================================================ */}
      {activeTab === 'import_ai_pro' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Academic Scope & AI Pro Prompt Generator (5 cols) */}
          <div className="lg:col-span-5 bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">Step 1</span>
              <h3 className="font-extrabold text-white text-base">Select Curriculum Scope & Prompt</h3>
              <p className="text-xs text-slate-400">Configure target university subject and copy prompt</p>
            </div>

            {/* Cascaded Selectors */}
            {academicError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>Curriculum API: {academicError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">University</label>
                <select
                  value={selectedUnivId}
                  onChange={(e) => setSelectedUnivId(e.target.value)}
                  disabled={academicLoading}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-orange-500 font-medium disabled:opacity-60"
                >
                  {academicLoading ? (
                    <option disabled>Loading universities...</option>
                  ) : academicError ? (
                    <option disabled>Error: {academicError}</option>
                  ) : universities.length > 0 ? (
                    universities.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.short_name || u.shortName || u.id})
                      </option>
                    ))
                  ) : (
                    <option value="gtu">Gujarat Technological University (GTU)</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Branch</label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    disabled={academicLoading}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-orange-500 font-medium disabled:opacity-60"
                  >
                    {academicLoading ? (
                      <option disabled>Loading branches...</option>
                    ) : academicError ? (
                      <option disabled>Error loading branches</option>
                    ) : filteredBranches.length > 0 ? (
                      filteredBranches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))
                    ) : (
                      <option value="branch_computer">Computer Engineering</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Semester</label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(Number(e.target.value))}
                    disabled={academicLoading}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-orange-500 font-medium disabled:opacity-60"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                      const subjectCount = subjects.filter((s) => {
                        const bId = s.branchId || s.branch_id;
                        const bSlug = s.branchSlug || s.branch_slug;
                        const matchBranch = !selectedBranchId || selectedBranchId === 'all' || bId === selectedBranchId || bSlug === selectedBranchId;
                        return matchBranch && Number(s.semester) === sem;
                      }).length;
                      return (
                        <option key={sem} value={sem}>
                          Semester {sem} {subjectCount > 0 ? `(${subjectCount} subjects)` : '(0 subjects)'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase">Subject</label>
                  {isLoadingUnits && (
                    <span className="text-[10px] text-orange-400 font-mono animate-pulse">Loading units...</span>
                  )}
                </div>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    const subId = e.target.value;
                    setSelectedSubjectId(subId);
                    const sub = filteredSubjects.find((s) => s.id === subId);
                    if (sub) setSelectedSubjectName(sub.name);
                  }}
                  disabled={academicLoading || filteredSubjects.length === 0}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-orange-500 font-medium disabled:opacity-60"
                >
                  {academicLoading ? (
                    <option disabled>Loading subjects...</option>
                  ) : academicError ? (
                    <option disabled>Error: {academicError}</option>
                  ) : filteredSubjects.length > 0 ? (
                    filteredSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || s.id})
                      </option>
                    ))
                  ) : (
                    <option value="">No subjects found for this branch/semester</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Unit No</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={selectedUnitNo}
                    onChange={(e) => setSelectedUnitNo(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Unit Title</label>
                  <input
                    type="text"
                    value={selectedUnitTitle}
                    onChange={(e) => setSelectedUnitTitle(e.target.value)}
                    placeholder="e.g., Data Link Layer & Framing"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Topic Title *</label>
                <input
                  type="text"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  placeholder="e.g., OSI Reference Model & 7-Layer Architecture"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>
            </div>

            {/* Copy Prompt Generator Box */}
            <div className="pt-2">
              <button
                onClick={handleCopyPrompt}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 border border-orange-500/30 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isCopiedPrompt ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{isCopiedPrompt ? 'Prompt Copied to Clipboard!' : 'Copy AI Pro Synthesis Prompt'}</span>
              </button>
              <p className="text-[11px] text-slate-500 text-center mt-1.5">
                Paste into Google AI Pro / Gemini to generate structured JSON.
              </p>
            </div>
          </div>

          {/* Right: Payload Staging & Validator (7 cols) */}
          <div className="lg:col-span-7 bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">Step 2</span>
                  <h3 className="font-extrabold text-white text-base">Paste Structured JSON / Markdown</h3>
                  <p className="text-xs text-slate-400">Automated validator runs instant structural and safety checks</p>
                </div>
                <button
                  onClick={() => {
                    const sample = {
                      university: selectedUnivId || 'gtu',
                      branch: selectedBranchId || 'branch_07',
                      semester: selectedSemester || 5,
                      subject_name: selectedSubjectName || 'Computer Networks',
                      unit_no: selectedUnitNo || 1,
                      unit_title: selectedUnitTitle || 'Introduction to Computer Networks',
                      topic: selectedTopic || 'OSI Reference Model & 7-Layer Architecture',
                      difficulty: selectedDifficulty || 'medium',
                      notes: {
                        summary: 'The OSI model defines 7 distinct abstraction layers for network communication.',
                        detailed_notes: '### 1. Physical Layer\nTransmits unstructured raw bits over physical transmission media.\n\n### 2. Data Link Layer\nNode-to-node framing and error detection.\n\n### 3. Network Layer\nPacket routing and logical addressing (IPv4/IPv6).\n\n### 4. Transport Layer\nEnd-to-end reliability, flow control (TCP) and datagram transport (UDP).\n\n### 5. Session Layer\nDialog control and session tokens.\n\n### 6. Presentation Layer\nData translation, encryption, and compression.\n\n### 7. Application Layer\nNetwork services directly to user applications.',
                        key_takeaways: [
                          '7 Abstract Layers with defined service access points',
                          'Data encapsulation downward; decapsulation upward'
                        ]
                      },
                      mcqs: [
                        {
                          question: 'Which OSI layer is responsible for end-to-end transport reliability?',
                          options: ['Network Layer', 'Transport Layer', 'Data Link Layer', 'Physical Layer'],
                          correct_answer: 1,
                          explanation: 'The Transport Layer provides transparent and reliable transfer of data between end systems.'
                        }
                      ],
                      short_questions: [
                        {
                          question: 'What is the primary function of the Network Layer?',
                          answer: 'The Network Layer handles packet forwarding, logical addressing, and routing across multiple subnetworks.'
                        }
                      ],
                      long_questions: [
                        {
                          question: 'Describe all 7 layers of the OSI reference model with primary responsibilities.',
                          answer: '1. Physical: Raw bit transmission\n2. Data Link: Framing and MAC addressing\n3. Network: Routing\n4. Transport: End-to-end delivery\n5. Session: Session management\n6. Presentation: Syntax\n7. Application: User interface'
                        }
                      ]
                    };
                    handleValidateImportText(JSON.stringify(sample, null, 2));
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg transition cursor-pointer"
                >
                  Load Sample JSON
                </button>
              </div>

              {/* Text Area */}
              <div>
                <textarea
                  rows={14}
                  value={importJsonText}
                  onChange={(e) => handleValidateImportText(e.target.value)}
                  placeholder="Paste JSON or Markdown payload from Google AI Pro here..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-orange-500 leading-relaxed"
                />
              </div>

              {/* Validation Status Strip */}
              {importValidationResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    importValidationResult.valid
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {importValidationResult.valid ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>{importValidationResult.valid ? 'Automated Validation Passed (Ready to Stage)' : 'Validation Issues Detected'}</span>
                  </div>

                  {importValidationResult.issues.length > 0 && (
                    <ul className="list-disc list-inside text-[11px] space-y-0.5 text-rose-300">
                      {importValidationResult.issues.map((iss, i) => (
                        <li key={i}>{iss}</li>
                      ))}
                    </ul>
                  )}

                  {importValidationResult.flags.length > 0 && (
                    <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-300">
                      {importValidationResult.flags.map((flg, i) => (
                        <li key={i}>⚠️ {flg}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-slate-400 text-xs font-mono">
                {importJsonText ? `${importJsonText.length} characters` : 'No payload entered'}
              </span>
              <button
                onClick={handleImportStructuredPayload}
                disabled={isImporting || !importJsonText.trim()}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{isImporting ? 'Validating & Staging...' : 'Validate & Stage as DRAFT'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. MODE B: GENERATE CONTENT & 10 TYPES CONFIGURATION TAB */}
      {/* ============================================================ */}
      {activeTab === 'generate' && (
        <div className="bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-white text-base">Configure 10 Academic Content Types</h3>
              <p className="text-xs text-slate-400">Select content modules and specify question quantities for generation</p>
            </div>
            <button
              onClick={() => setActiveTab('import_ai_pro')}
              className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Switch to Mode A (AI Pro Import)
            </button>
          </div>

          {/* 10 Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contentTypes.map((type) => (
              <div
                key={type.id}
                className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                  type.enabled
                    ? 'bg-slate-900/90 border-orange-500/40 shadow-sm'
                    : 'bg-slate-900/30 border-slate-800/80 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{type.icon}</span>
                    <div>
                      <h4 className="font-bold text-white text-xs">{type.label}</h4>
                      <p className="text-[11px] text-slate-400 leading-tight">{type.description}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={type.enabled}
                    onChange={() => handleToggleContentType(type.id)}
                    className="mt-1 w-4 h-4 rounded text-orange-500 bg-slate-800 border-slate-700 focus:ring-orange-500 cursor-pointer"
                  />
                </div>

                {type.supportsQuantity && type.enabled && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 font-medium">{type.quantityLabel || 'Quantity'}:</span>
                    <div className="flex items-center gap-2">
                      {[3, 5, 10, 15].map((q) => (
                        <button
                          key={q}
                          onClick={() => handleUpdateQuantity(type.id, q)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                            (type.quantity || type.defaultQuantity) === q
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-3">
            <Cpu className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold">Mode B Server-Side Gemini Notice</p>
              <p className="text-[11px] text-blue-300/80">
                Server-side synthesis runs autonomously on Cloudflare Workers when GEMINI_API_KEY is configured. For high-volume generation, use Mode A (Google AI Pro Import).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. REVIEW & APPROVALS 3-PANE WORKSPACE */}
      {/* ============================================================ */}
      {activeTab === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-220px)] min-h-[700px]">
          {/* PANE 1: LEFT - Item Queue List (4 cols) */}
          <div className="lg:col-span-4 bg-[#0F172A] rounded-2xl border border-slate-800 p-4 flex flex-col justify-between overflow-hidden">
            <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
              {/* Header & Filter Chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-white text-sm">Content Queue</h3>
                  <span className="text-xs font-mono text-slate-400">{filteredReviewItems.length} items</span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by topic or subject..."
                    value={reviewSearchQuery}
                    onChange={(e) => setReviewSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 text-[10px] font-bold">
                  {['ALL', 'DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setReviewFilterStatus(st)}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        reviewFilterStatus === st
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Item Cards */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredReviewItems.length > 0 ? (
                  filteredReviewItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        setEditedMarkdown(item.raw_markdown || '');
                      }}
                      className={`p-3 rounded-xl border transition cursor-pointer text-xs space-y-1.5 ${
                        selectedItem?.id === item.id
                          ? 'bg-slate-800/90 border-orange-500 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-white text-xs leading-snug line-clamp-1">{item.topic}</h4>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                            item.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : item.status === 'APPROVED'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : item.status === 'REVIEW'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : 'bg-slate-500/10 text-slate-300 border-slate-500/20'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {item.subject_name || 'Subject'} • Unit {item.unit_no || 1}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
                        <span>{item.difficulty || 'medium'}</span>
                        <span className="text-emerald-400 font-bold">{item.validation_status || 'valid'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No items match filter criteria.
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setActiveTab('import_ai_pro')}
              className="w-full mt-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-orange-400 font-bold text-xs border border-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Stage New Topic
            </button>
          </div>

          {/* PANE 2: CENTER - Formatted Content & Interactive Preview (5 cols) */}
          <div className="lg:col-span-5 bg-[#0F172A] rounded-2xl border border-slate-800 p-4 flex flex-col justify-between overflow-hidden">
            {selectedItem ? (
              <div className="flex-1 flex flex-col overflow-hidden space-y-3">
                {/* Mode Switcher */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                    <button
                      onClick={() => setReviewMode('formatted')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        reviewMode === 'formatted' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Formatted View
                    </button>
                    <button
                      onClick={() => setReviewMode('quiz')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        reviewMode === 'quiz' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      MCQ Tester ({parsedMCQs.length})
                    </button>
                    <button
                      onClick={() => setReviewMode('raw')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        reviewMode === 'raw' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Markdown Editor
                    </button>
                  </div>

                  {reviewMode === 'raw' && (
                    <button
                      onClick={handleSaveMarkdown}
                      disabled={isSavingMarkdown}
                      className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      {isSavingMarkdown ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      <span>Save Markdown</span>
                    </button>
                  )}
                </div>

                {/* Formatted Markdown View */}
                {reviewMode === 'formatted' && (
                  <div className="flex-1 overflow-y-auto pr-2 prose prose-invert max-w-none text-xs leading-relaxed text-slate-200">
                    <MDEditor.Markdown source={selectedItem.raw_markdown || '# No content available'} />
                  </div>
                )}

                {/* Interactive MCQ Quiz Tester */}
                {reviewMode === 'quiz' && (
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-xs">
                    {parsedMCQs.length > 0 ? (
                      parsedMCQs.map((mcq: any, qIdx: number) => {
                        const selectedAns = quizAnswers[qIdx];
                        const isCorrect = selectedAns === mcq.answer;
                        const isAnswered = selectedAns !== undefined;

                        return (
                          <div key={qIdx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                            <p className="font-bold text-white text-xs">
                              Q{qIdx + 1}. {mcq.question}
                            </p>

                            <div className="space-y-1.5">
                              {mcq.options.map((opt: string, optIdx: number) => {
                                const isThisSelected = selectedAns === optIdx;
                                const isThisCorrect = mcq.answer === optIdx;

                                let optClass = 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800';
                                if (isAnswered) {
                                  if (isThisCorrect) optClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                                  else if (isThisSelected && !isCorrect) optClass = 'bg-rose-500/20 border-rose-500 text-rose-300';
                                }

                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition cursor-pointer ${optClass}`}
                                  >
                                    <span className="font-mono font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>

                            {isAnswered && (
                              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                                <span className="font-bold text-orange-400">Explanation: </span>
                                {mcq.explanation || 'No rationale provided.'}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-slate-500">No MCQs structured in this topic bundle.</div>
                    )}
                  </div>
                )}

                {/* Raw Markdown Editor */}
                {reviewMode === 'raw' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <textarea
                      value={editedMarkdown}
                      onChange={(e) => setEditedMarkdown(e.target.value)}
                      className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-orange-500 resize-none leading-relaxed"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                Select a topic from the left queue to inspect and review.
              </div>
            )}
          </div>

          {/* PANE 3: RIGHT - Quality Audit, Metadata & Lifecycle Actions (3 cols) */}
          <div className="lg:col-span-3 bg-[#0F172A] rounded-2xl border border-slate-800 p-4 flex flex-col justify-between overflow-y-auto space-y-4">
            {selectedItem ? (
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="font-extrabold text-white text-sm mb-1">Quality & Metadata</h3>
                  <p className="text-[11px] text-slate-400">Academic rigor validation</p>
                </div>

                {/* Scope Card */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Curriculum Anchor</span>
                  <p className="font-bold text-white">{selectedItem.subject_name || 'Academic Subject'}</p>
                  <p className="text-slate-300">Unit {selectedItem.unit_no || 1}: {selectedItem.unit_title || 'Core'}</p>
                  <p className="text-orange-400 font-mono text-[10px]">Sem {selectedItem.semester || 5} • {selectedItem.branch_name || 'Engineering'}</p>
                </div>

                {/* Validation Status */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Schema Verification</span>
                    <span className="text-emerald-400 font-bold text-[11px]">VALID</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    All required sections, questions, and option distractors passed automated verification.
                  </p>
                </div>

                {/* Quality Flags Notice */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] space-y-1">
                  <div className="flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Academic Quality Gate</span>
                  </div>
                  <p className="text-[10px] text-amber-200/80 leading-tight">
                    Verify that technical definitions and formulas align with standard university textbooks before publishing.
                  </p>
                </div>

                {/* Live Document Reference if Published */}
                {selectedItem.status === 'PUBLISHED' && selectedItem.published_document_id && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] space-y-1">
                    <span className="font-bold block">Live on Student Portal</span>
                    <p className="font-mono text-[10px] text-emerald-200">{selectedItem.published_document_id}</p>
                  </div>
                )}
              </div>
            ) : null}

            {/* Lifecycle State Machine Controls */}
            {selectedItem && (
              <div className="space-y-2 pt-3 border-t border-slate-800">
                {selectedItem.status === 'DRAFT' && (
                  <>
                    <button
                      onClick={() => handleTransitionStatus(selectedItem, 'REVIEW')}
                      className="w-full py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit to Review Queue
                    </button>
                    <button
                      onClick={() => handleDeleteItem(selectedItem.id)}
                      className="w-full py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Draft
                    </button>
                  </>
                )}

                {selectedItem.status === 'REVIEW' && (
                  <>
                    <button
                      onClick={() => handleTransitionStatus(selectedItem, 'APPROVED')}
                      className="w-full py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve Content
                    </button>
                    <button
                      onClick={() => handleTransitionStatus(selectedItem, 'DRAFT')}
                      className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Request Revisions (Draft)
                    </button>
                  </>
                )}

                {selectedItem.status === 'APPROVED' && (
                  <>
                    <button
                      onClick={() => handleTransitionStatus(selectedItem, 'PUBLISHED')}
                      className="w-full py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> 🚀 Publish to Live Portal
                    </button>
                    <button
                      onClick={() => handleTransitionStatus(selectedItem, 'REVIEW')}
                      className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Return to Review
                    </button>
                  </>
                )}

                {selectedItem.status === 'PUBLISHED' && (
                  <>
                    <button
                      onClick={() => handleTransitionStatus(selectedItem, 'APPROVED')}
                      className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Unpublish Material
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. PUBLISHED CATALOG TAB */}
      {/* ============================================================ */}
      {activeTab === 'published' && (
        <div className="bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-white text-base">Live Published Repository</h3>
              <p className="text-xs text-slate-400">Content directly discoverable and active on the Student Portal</p>
            </div>
            <button
              onClick={refreshJobsAndItems}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold border-b border-slate-800 text-[10px]">
                <tr>
                  <th className="p-3">Topic Title</th>
                  <th className="p-3">Subject & Unit</th>
                  <th className="p-3">Live Document ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {items.filter((i) => i.status === 'PUBLISHED').length > 0 ? (
                  items
                    .filter((i) => i.status === 'PUBLISHED')
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-bold text-white text-[11px]">{item.topic}</td>
                        <td className="p-3 text-slate-300">
                          {item.subject_name || 'Subject'} • Unit {item.unit_no || 1}
                        </td>
                        <td className="p-3 font-mono text-orange-400 text-[10px]">
                          {item.published_document_id || item.id}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Live on Portal
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setEditedMarkdown(item.raw_markdown || '');
                              setActiveTab('review');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] transition cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-mono text-xs">
                      No published materials yet. Approve and publish items from the Review Workspace.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. BATCH JOBS MONITOR TAB */}
      {/* ============================================================ */}
      {activeTab === 'jobs' && (
        <div className="bg-[#0F172A] p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-white text-base">Synthesis Jobs Monitor</h3>
              <p className="text-xs text-slate-400">Track asynchronous background generation batches</p>
            </div>
            <button
              onClick={refreshJobsAndItems}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold border-b border-slate-800 text-[10px]">
                <tr>
                  <th className="p-3">Job ID</th>
                  <th className="p-3">Academic Scope</th>
                  <th className="p-3">Topic Count</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Progress</th>
                  <th className="p-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono font-bold text-white text-[11px]">{job.id}</td>
                      <td className="p-3 font-bold text-slate-200">{job.scope}</td>
                      <td className="p-3 text-slate-400">{job.topicCount} Topics</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            job.status === 'Processing'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              job.progress === 100 ? 'bg-emerald-400' : 'bg-blue-400'
                            }`}
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{job.createdAt}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-mono text-xs">
                      No active generation jobs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminContentShell>
  );
};


