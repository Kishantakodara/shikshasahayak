// ============================================================
// SHIKSHA SAHAYAK OS: UNIFIED CONTENT & QUESTION INTELLIGENCE STUDIO
// Comprehensive All-in-One Workspace:
// Overview -> Add Source (Web URL / PDF / AI / Manual) -> Extraction Queue ->
// Question Review & Verification -> GATE 2027 Taxonomy Browser -> Master Bank & Practice Runner
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  Database,
  Upload,
  Calendar,
  Building2,
  ShieldCheck,
  Zap,
  HelpCircle,
  FileText,
  RotateCcw,
  CheckSquare,
  Square,
  Award,
  Play,
  X,
  Code,
  Download,
  BookMarked,
  Info,
  RefreshCw,
  Globe,
  FileUp,
  Send,
  ListFilter,
  Ban,
  TrendingUp,
  BarChart3,
  Bookmark,
  Image as ImageIcon,
} from 'lucide-react';
import { fetchWithAuth } from '../../api/client';
import { academicManagementClient } from '../../api/academicManagementClient';
import { toast } from 'sonner';
import { MathRenderer } from '../ui/MathRenderer';
import { extractText, getDocumentProxy } from 'unpdf';
import {
  GATE_2027_PAPERS,
  GatePaperDef,
  getGatePaperByCode,
  getAllSubjectsForPaper,
} from '../../data/gate2027Taxonomy';

export type StudioTab =
  | 'overview'
  | 'add-source'
  | 'queue'
  | 'review'
  | 'gate-browser'
  | 'master-bank';

export interface ExtractedQuestionItem {
  id?: string;
  questionNo: string;
  questionType: 'MCQ' | 'MSQ' | 'NAT';
  questionText: string;
  options?: Array<{ id: string; text: string; imageUrl?: string }>;
  correctAnswer?: string;
  correctAnswers?: string[];
  exactNumericalValue?: number | string;
  acceptableNumericalRange?: { min: number; max: number; tolerance?: number };
  explanation?: string;
  marks?: number;
  negativeMarking?: number;
  imageUrl?: string;
  diagramNeeded?: boolean;
  sourceUrl?: string;
  sourceTitle?: string;
  sourceCategory?: string;
  year?: number;
  examName?: string;
  paperCode?: string;
  subjectName?: string;
  topicName?: string;
  isDuplicateCandidate?: boolean;
  duplicateMatchedId?: string;
  duplicateConfidence?: number;
  validationStatus: 'STRUCTURALLY_VALID' | 'NEEDS_ACADEMIC_REVIEW' | 'INVALID';
  validationErrors?: string[];
  isApproved?: boolean;
}

export interface IngestionJobItem {
  id: string;
  sourceTitle: string;
  sourceUrl: string;
  examName: string;
  paperOrSubject: string;
  submissionTime: string;
  status: 'Queued' | 'Fetching' | 'Extracting' | 'Validating' | 'Needs Review' | 'Approved' | 'Published' | 'Failed' | 'Blocked';
  discoveredCount: number;
  parsedCount: number;
  rejectedCount: number;
  duplicateCount: number;
  lastError?: string;
}

export interface OverviewMetrics {
  totalSourcesSubmitted: number;
  sourcesAwaitingExtraction: number;
  questionsExtracted: number;
  questionsRequiringReview: number;
  questionsApproved: number;
  questionsPublished: number;
  duplicateQuestionsDetected: number;
  failedOrBlockedJobs: number;
  breakdown?: {
    gateQuestionsCount: number;
    gtuQuestionsCount: number;
    mcqCount: number;
    msqCount: number;
    natCount: number;
  };
}

export const AdminUnifiedStudio: React.FC = () => {
  // Active Tab
  const [activeTab, setActiveTab] = useState<StudioTab>('overview');

  // Universal Academic Scope
  const [selectedExam, setSelectedExam] = useState<'GATE 2027' | 'GTU'>('GATE 2027');

  // GATE Scope
  const [selectedGatePaper, setSelectedGatePaper] = useState<string>('CS');
  const [selectedGateSection, setSelectedGateSection] = useState<string>('CS_CORE');
  const [selectedGateSubjectId, setSelectedGateSubjectId] = useState<string>('cs_algorithms');
  const [selectedGateTopic, setSelectedGateTopic] = useState<string>('Asymptotic Analysis of Worst & Average Time');

  // GTU Scope
  const [universities, setUniversities] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('07');
  const [selectedSemester, setSelectedSemester] = useState<number>(5);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string>('');

  // Overview Metrics State
  const [metrics, setMetrics] = useState<OverviewMetrics>({
    totalSourcesSubmitted: 0,
    sourcesAwaitingExtraction: 0,
    questionsExtracted: 0,
    questionsRequiringReview: 0,
    questionsApproved: 0,
    questionsPublished: 0,
    duplicateQuestionsDetected: 0,
    failedOrBlockedJobs: 0,
  });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  // Ingestion Source State
  const [sourceMode, setSourceMode] = useState<'url' | 'pdf' | 'manual' | 'json'>('url');
  const [sourceUrlInput, setSourceUrlInput] = useState<string>('https://practicepaper.in/');
  const [jsonPasteInput, setJsonPasteInput] = useState<string>('');
  const [sourceTitleInput, setSourceTitleInput] = useState<string>('');
  const [sourceCategory, setSourceCategory] = useState<string>('OFFICIAL_PYQ');
  const [examYearInput, setExamYearInput] = useState<number>(2024);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState<boolean>(false);
  const [discoveredSubpagesList, setDiscoveredSubpagesList] = useState<string[]>([]);
  const [extractionBlocker, setExtractionBlocker] = useState<string | null>(null);

  // Manual Question Entry State
  const [manualQType, setManualQType] = useState<'MCQ' | 'MSQ' | 'NAT'>('MCQ');
  const [manualText, setManualText] = useState('');
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [manualOptions, setManualOptions] = useState([
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ]);
  const [manualCorrectAns, setManualCorrectAns] = useState('A');
  const [manualMsqAnswers, setManualMsqAnswers] = useState<string[]>(['A']);
  const [manualNatVal, setManualNatVal] = useState<number>(0);
  const [manualNatMin, setManualNatMin] = useState<number>(0);
  const [manualNatMax, setManualNatMax] = useState<number>(0);
  const [manualExplanation, setManualExplanation] = useState('');

  // Extraction Queue & Jobs
  const [extractionJobs, setExtractionJobs] = useState<IngestionJobItem[]>([
    {
      id: 'job_1',
      sourceTitle: 'PracticePaper.in GATE CS Practice Bank',
      sourceUrl: 'https://practicepaper.in/gate/cs/algorithms',
      examName: 'GATE 2027',
      paperOrSubject: 'CS — Algorithms',
      submissionTime: 'Today, 10:15 AM',
      status: 'Needs Review',
      discoveredCount: 12,
      parsedCount: 11,
      rejectedCount: 1,
      duplicateCount: 2,
    },
    {
      id: 'job_2',
      sourceTitle: 'IIT Madras Official GATE 2024 EE Paper',
      sourceUrl: 'https://gate2027.iitm.ac.in/download/ee_2024.pdf',
      examName: 'GATE 2027',
      paperOrSubject: 'EE — Electrical Machines',
      submissionTime: 'Yesterday',
      status: 'Published',
      discoveredCount: 65,
      parsedCount: 65,
      rejectedCount: 0,
      duplicateCount: 4,
    },
  ]);

  // Extracted Questions for Review Table
  const [extractedReviewQuestions, setExtractedReviewQuestions] = useState<ExtractedQuestionItem[]>([
    {
      id: 'ext_q1',
      questionNo: '1',
      questionType: 'MCQ',
      questionText: 'Consider a min-heap with \\(n\\) elements. What is the worst-case time complexity to find the maximum element in this min-heap?',
      options: [
        { id: 'A', text: '\\(O(1)\\)' },
        { id: 'B', text: '\\(O(\\log n)\\)' },
        { id: 'C', text: '\\(O(n)\\)' },
        { id: 'D', text: '\\(O(n \\log n)\\)' },
      ],
      correctAnswer: 'C',
      explanation: 'In a min-heap, the minimum element is at the root. The maximum element must reside in one of the \\(\\lceil n/2 \\rceil\\) leaf nodes. Finding it requires a linear scan among all leaf nodes, taking \\(O(n)\\) time.',
      marks: 1,
      negativeMarking: 0.33,
      sourceUrl: 'https://practicepaper.in/gate/cs/algorithms',
      sourceTitle: 'PracticePaper GATE CS Module',
      sourceCategory: 'OFFICIAL_PYQ',
      year: 2024,
      examName: 'GATE 2027',
      paperCode: 'CS',
      subjectName: 'Algorithms',
      topicName: 'Heaps & Priority Queues',
      validationStatus: 'STRUCTURALLY_VALID',
      isApproved: false,
    },
    {
      id: 'ext_q2',
      questionNo: '2',
      questionType: 'MSQ',
      questionText: 'Which of the following statements is/are TRUE regarding regular languages and context-free languages?',
      options: [
        { id: 'A', text: 'Every regular language is context-free.' },
        { id: 'B', text: 'Context-free languages are closed under intersection.' },
        { id: 'C', text: 'The union of two regular languages is always regular.' },
        { id: 'D', text: 'The complement of a context-free language is always context-free.' },
      ],
      correctAnswer: 'A',
      correctAnswers: ['A', 'C'],
      explanation: 'Regular languages are a strict subset of CFLs (A is true). Regular languages are closed under union (C is true). CFLs are NOT closed under intersection or complementation (B and D are false).',
      marks: 2,
      negativeMarking: 0,
      sourceUrl: 'https://practicepaper.in/gate/cs/toc',
      sourceTitle: 'GATE Theory of Computation Set',
      sourceCategory: 'OFFICIAL_PYQ',
      year: 2023,
      examName: 'GATE 2027',
      paperCode: 'CS',
      subjectName: 'Theory of Computation',
      topicName: 'Regular & Context-Free Languages',
      validationStatus: 'STRUCTURALLY_VALID',
      isApproved: false,
    },
    {
      id: 'ext_q3',
      questionNo: '3',
      questionType: 'NAT',
      questionText: 'A pipeline processor has 5 stages with execution times of 12 ns, 15 ns, 10 ns, 18 ns, and 14 ns respectively. Pipeline register delay is 2 ns. Calculate the clock cycle time of the pipeline in nanoseconds.',
      options: [],
      exactNumericalValue: 20,
      acceptableNumericalRange: { min: 19.9, max: 20.1, tolerance: 0.1 },
      explanation: 'Clock cycle time = Max(Stage delays) + Register delay = 18 ns + 2 ns = 20 ns.',
      marks: 2,
      negativeMarking: 0,
      sourceUrl: 'https://practicepaper.in/gate/cs/coa',
      sourceTitle: 'Computer Organization Question Bank',
      sourceCategory: 'OFFICIAL_PYQ',
      year: 2024,
      examName: 'GATE 2027',
      paperCode: 'CS',
      subjectName: 'Computer Organization and Architecture',
      topicName: 'Instruction Pipelining',
      validationStatus: 'STRUCTURALLY_VALID',
      isApproved: false,
    },
  ]);

  // Selected for Bulk Actions in Review Table
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [reviewFilterType, setReviewFilterType] = useState<string>('ALL');
  const [reviewSearch, setReviewSearch] = useState<string>('');

  // Editing Question Modal State
  const [editingQuestion, setEditingQuestion] = useState<ExtractedQuestionItem | null>(null);

  // Student Live Practice Runner State
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [testSessionQuestions, setTestSessionQuestions] = useState<any[]>([]);
  const [activeTestQuestionIdx, setActiveTestQuestionIdx] = useState<number>(0);
  const [studentSelectedOption, setStudentSelectedOption] = useState<string>('');
  const [studentMsqSelections, setStudentMsqSelections] = useState<string[]>([]);
  const [studentNatAnswer, setStudentNatAnswer] = useState<string>('');
  const [testAnswerRevealed, setTestAnswerRevealed] = useState<boolean>(false);
  const [isLoadingTestSession, setIsLoadingTestSession] = useState<boolean>(false);

  // Fetch Live Operational Metrics
  const fetchOverviewMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const res = await fetchWithAuth('/api/admin/question-intelligence/content-overview');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setMetrics(json.data);
        }
      }
    } catch (e) {
      console.warn('Could not load live overview metrics:', e);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  useEffect(() => {
    fetchOverviewMetrics();
  }, []);

  // Fetch GTU Scope Details
  useEffect(() => {
    const loadGtuScope = async () => {
      try {
        const [uRes, bRes] = await Promise.all([
          academicManagementClient.getUniversities(),
          academicManagementClient.getBranches(),
        ]);
        setUniversities(uRes || []);
        setBranches(bRes || []);
      } catch (e) {
        console.warn('Error loading GTU scope:', e);
      }
    };
    loadGtuScope();
  }, []);

  // Fetch GTU Subjects when branch/semester change
  useEffect(() => {
    const loadGtuSubjects = async () => {
      if (selectedExam !== 'GTU') return;
      try {
        const sRes = await academicManagementClient.getSubjects({
          branch: selectedBranchId,
          semester: String(selectedSemester),
        });
        setSubjects(sRes || []);
        if (sRes && sRes.length > 0) {
          setSelectedSubjectId(sRes[0].id);
        }
      } catch (e) {
        console.warn('Error loading GTU subjects:', e);
      }
    };
    loadGtuSubjects();
  }, [selectedExam, selectedBranchId, selectedSemester]);

  // Derived GATE Paper Details
  const activeGatePaper = useMemo<GatePaperDef | undefined>(() => {
    return getGatePaperByCode(selectedGatePaper);
  }, [selectedGatePaper]);

  const activeGateSections = useMemo(() => {
    return activeGatePaper?.sections || [];
  }, [activeGatePaper]);

  const activeGateSubjects = useMemo(() => {
    const sec = activeGateSections.find((s) => s.code === selectedGateSection);
    return sec ? sec.subjects : activeGateSections[0]?.subjects || [];
  }, [activeGateSections, selectedGateSection]);

  const activeGateTopics = useMemo(() => {
    const subj = activeGateSubjects.find((s) => s.id === selectedGateSubjectId);
    return subj ? subj.topics : [];
  }, [activeGateSubjects, selectedGateSubjectId]);

  // Update Section when Paper Changes
  useEffect(() => {
    if (activeGateSections.length > 0) {
      setSelectedGateSection(activeGateSections[0].code);
    }
  }, [selectedGatePaper]);

  // Update Subject when Section Changes
  useEffect(() => {
    if (activeGateSubjects.length > 0) {
      setSelectedGateSubjectId(activeGateSubjects[0].id);
    }
  }, [selectedGateSection, activeGateSections]);

  // Update Topic when Subject Changes
  useEffect(() => {
    if (activeGateTopics.length > 0) {
      setSelectedGateTopic(activeGateTopics[0]);
    }
  }, [selectedGateSubjectId, activeGateSubjects]);

  // ── Handler: Execute Server-Side Website Extraction ────────────────────────
  const handleExecuteExtraction = async () => {
    if (!sourceUrlInput || !sourceUrlInput.trim()) {
      toast.error('Please enter a valid website URL');
      return;
    }

    setIsExtracting(true);
    setExtractionBlocker(null);

    const payload = {
      url: sourceUrlInput.trim(),
      examName: selectedExam,
      paperCode: selectedExam === 'GATE 2027' ? selectedGatePaper : selectedBranchId,
      subjectName:
        selectedExam === 'GATE 2027'
          ? activeGateSubjects.find((s) => s.id === selectedGateSubjectId)?.name || 'GATE Subject'
          : subjects.find((s) => s.id === selectedSubjectId)?.name || 'GTU Subject',
      topicName: selectedExam === 'GATE 2027' ? selectedGateTopic : selectedTopicTitle,
      year: examYearInput,
      sourceCategory,
    };

    try {
      const res = await fetchWithAuth('/api/admin/question-intelligence/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract website');
      }

      if (data.results && data.results.length > 0) {
        const firstResult = data.results[0];

        if (firstResult.discoveredSubpageUrls && firstResult.discoveredSubpageUrls.length > 0) {
          setDiscoveredSubpagesList(firstResult.discoveredSubpageUrls);
        }

        if (!firstResult.success && firstResult.blockerMessage) {
          setExtractionBlocker(firstResult.blockerMessage);
          toast.error(firstResult.blockerMessage);
        } else if (firstResult.questions && firstResult.questions.length > 0) {
          // Prepend new questions to review list
          setExtractedReviewQuestions((prev) => [...firstResult.questions, ...prev]);
          if (firstResult.isMultiPageTest && firstResult.totalPagesExtracted && firstResult.totalPagesExtracted > 1) {
            toast.success(
              `Multi-Page Test Extracted! Fetched all ${firstResult.questions.length} questions across ${firstResult.totalPagesExtracted} pages of the test!`
            );
          } else {
            toast.success(
              `Successfully extracted ${firstResult.questions.length} questions from ${firstResult.sourceTitle}!`
            );
          }

          // Add to job queue
          const jobTitle = firstResult.isMultiPageTest && firstResult.totalPagesExtracted && firstResult.totalPagesExtracted > 1
            ? `${firstResult.sourceTitle || sourceTitleInput || 'Web Source'} (${firstResult.totalPagesExtracted} Pages)`
            : firstResult.sourceTitle || sourceTitleInput || 'Web Source';

          const newJob: IngestionJobItem = {
            id: `job_${Date.now()}`,
            sourceTitle: jobTitle,
            sourceUrl: sourceUrlInput,
            examName: selectedExam,
            paperOrSubject: `${payload.paperCode} — ${payload.subjectName}`,
            submissionTime: 'Just now',
            status: 'Needs Review',
            discoveredCount: firstResult.discoveredQuestionsCount,
            parsedCount: firstResult.successfullyParsedCount,
            rejectedCount: firstResult.rejectedCount,
            duplicateCount: firstResult.duplicateCount,
          };
          setExtractionJobs((prev) => [newJob, ...prev]);

          // Switch to review table
          setActiveTab('review');
        } else {
          toast.info(firstResult.blockerMessage || 'Extraction completed, but no questions found.');
        }
      }

      fetchOverviewMetrics();
    } catch (err: any) {
      toast.error(err.message || 'Error occurred during extraction');
    } finally {
      setIsExtracting(false);
    }
  };

  // ── Handler: Execute Server-Side PDF Question Paper Extraction ─────────────
  const handleUploadPdf = async (file: File) => {
    setIsExtractingPdf(true);
    setExtractionBlocker(null);

    // Pre-extract text client-side for resilient performance and avoiding worker bundle limits
    let clientExtractedText = '';
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await getDocumentProxy(new Uint8Array(arrayBuffer));
      const { text } = await extractText(pdfDoc, { mergePages: false });
      if (Array.isArray(text)) {
        clientExtractedText = text
          .map((pageText, idx) => `\n--- PAGE ${idx + 1} ---\n${pageText}`)
          .join('\n');
      } else if (typeof text === 'string') {
        clientExtractedText = text;
      }
    } catch (clientErr) {
      console.warn('Client-side PDF parse attempt passed to serverless fallback:', clientErr);
    }

    const formData = new FormData();
    formData.append('file', file);
    if (clientExtractedText) {
      formData.append('rawText', clientExtractedText);
    }
    formData.append('examName', selectedExam);
    formData.append('paperCode', selectedExam === 'GATE 2027' ? selectedGatePaper : selectedBranchId);
    formData.append(
      'subjectName',
      selectedExam === 'GATE 2027'
        ? activeGateSubjects.find((s) => s.id === selectedGateSubjectId)?.name || 'GATE Subject'
        : subjects.find((s) => s.id === selectedSubjectId)?.name || 'GTU Subject'
    );
    formData.append(
      'topicName',
      selectedExam === 'GATE 2027' ? selectedGateTopic : selectedTopicTitle || 'General Topic'
    );
    formData.append('year', String(examYearInput));
    formData.append('sourceCategory', sourceCategory);

    try {
      const res = await fetchWithAuth('/api/admin/question-intelligence/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract PDF question paper');
      }

      if (data.questions && data.questions.length > 0) {
        setExtractedReviewQuestions((prev) => [...data.questions, ...prev]);
        toast.success(`Successfully extracted ${data.questions.length} questions from ${file.name}!`);

        const newJob: IngestionJobItem = {
          id: `job_pdf_${Date.now()}`,
          sourceTitle: file.name,
          sourceUrl: `pdf://${file.name}`,
          examName: selectedExam,
          paperOrSubject: selectedExam === 'GATE 2027' ? selectedGatePaper : selectedBranchId,
          submissionTime: 'Just now',
          status: 'Needs Review',
          discoveredCount: data.discoveredQuestionsCount || data.questions.length,
          parsedCount: data.successfullyParsedCount || data.questions.length,
          rejectedCount: data.rejectedCount || 0,
          duplicateCount: data.duplicateCount || 0,
        };
        setExtractionJobs((prev) => [newJob, ...prev]);
        setActiveTab('review');
      } else {
        toast.info(data.blockerMessage || 'PDF uploaded, but no recognizable question blocks could be parsed.');
      }
      fetchOverviewMetrics();
    } catch (err: any) {
      toast.error(err.message || 'Error occurred during PDF extraction');
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // ── Handler: Add Manual Question to Review Table ───────────────────────────
  const handleSaveManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) {
      toast.error('Question text is required');
      return;
    }

    const newQ: ExtractedQuestionItem = {
      id: `manual_${Date.now()}`,
      questionNo: String(extractedReviewQuestions.length + 1),
      questionType: manualQType,
      questionText: manualText.trim(),
      imageUrl: manualImageUrl.trim() || undefined,
      diagramNeeded: Boolean(manualImageUrl.trim()),
      options: manualQType !== 'NAT' ? manualOptions : [],
      correctAnswer: manualQType === 'MCQ' ? manualCorrectAns : manualMsqAnswers[0],
      correctAnswers: manualQType === 'MSQ' ? manualMsqAnswers : undefined,
      exactNumericalValue: manualQType === 'NAT' ? manualNatVal : undefined,
      acceptableNumericalRange:
        manualQType === 'NAT' ? { min: manualNatMin, max: manualNatMax } : undefined,
      explanation: manualExplanation.trim() || 'Authoritative faculty solution.',
      marks: manualQType === 'NAT' ? 2 : 1,
      negativeMarking: manualQType === 'MCQ' ? 0.33 : 0,
      sourceCategory: 'MANUAL_AUTHORING',
      year: examYearInput,
      examName: selectedExam,
      paperCode: selectedExam === 'GATE 2027' ? selectedGatePaper : selectedBranchId,
      subjectName:
        selectedExam === 'GATE 2027'
          ? activeGateSubjects.find((s) => s.id === selectedGateSubjectId)?.name
          : subjects.find((s) => s.id === selectedSubjectId)?.name,
      topicName: selectedExam === 'GATE 2027' ? selectedGateTopic : selectedTopicTitle,
      validationStatus: 'STRUCTURALLY_VALID',
      isApproved: true,
    };

    setExtractedReviewQuestions((prev) => [newQ, ...prev]);
    toast.success('Question added to review queue!');
    setManualText('');
    setManualImageUrl('');
    setManualExplanation('');
    setActiveTab('review');
  };

  // ── Sample AI JSON Templates Suite ───────────────────────────────────────
  type SampleTemplateType = 'all' | 'mcq' | 'msq' | 'nat' | 'fill_ups' | 'true_false';
  const [selectedSampleType, setSelectedSampleType] = useState<SampleTemplateType>('all');

  const SAMPLE_TEMPLATES: Record<SampleTemplateType, { title: string; filename: string; json: string }> = {
    all: {
      title: 'Mixed Exam Set (MCQ, MSQ, NAT, Fill-ups + Circuit Diagrams)',
      filename: 'sample_all_types_questions.json',
      json: JSON.stringify([
        {
          question: "For the op-amp circuit shown with \\(R_1 = 10\\text{ k}\\Omega\\), \\(R_f = 100\\text{ k}\\Omega\\), and input voltage \\(V_{in} = 0.5\\text{ V}\\), what is the output voltage \\(V_{out}\\) in Volts?",
          questionType: "MCQ",
          imageUrl: "https://images.unsplash.com/photo-1608755728617-aefab37d45f6?auto=format&fit=crop&w=600&q=80",
          diagramNeeded: true,
          options: [
            { id: "A", text: "\\(+5.0\\text{ V}\\)" },
            { id: "B", text: "\\(-5.0\\text{ V}\\)" },
            { id: "C", text: "\\(-0.5\\text{ V}\\)" },
            { id: "D", text: "\\(+10.0\\text{ V}\\)" }
          ],
          answer: "B",
          explanation: "This is an inverting amplifier configuration. The closed-loop gain is \\(A_v = -\\frac{R_f}{R_1} = -\\frac{100\\text{ k}\\Omega}{10\\text{ k}\\Omega} = -10\\). Output voltage \\(V_{out} = A_v \\times V_{in} = -10 \\times 0.5\\text{ V} = -5.0\\text{ V}\\).",
          marks: 2,
          negativeMarking: 0.67
        },
        {
          question: "Which of the following statements is/are TRUE regarding regular and context-free languages?",
          questionType: "MSQ",
          options: [
            { id: "A", text: "Every regular language is context-free." },
            { id: "B", text: "The intersection of any two context-free languages is always context-free." },
            { id: "C", text: "The complement of a regular language is always regular." },
            { id: "D", text: "Every finite language is regular." }
          ],
          answer: ["A", "C", "D"],
          explanation: "Regular languages are a strict subset of CFLs (A is true). Regular languages are closed under complement (C is true). Any finite language can be represented by a finite automaton without loops (D is true). CFLs are not closed under intersection (B is false).",
          marks: 2,
          negativeMarking: 0
        },
        {
          question: "A 5-stage pipeline has stage delays of 10 ns, 12 ns, 9 ns, 11 ns, and 8 ns. The pipeline register delay is 2 ns. If 1000 tasks are executed, what is the total execution time in microseconds (rounded to 2 decimal places)?",
          questionType: "NAT",
          answer: 14.06,
          acceptableNumericalRange: { min: 14.00, max: 14.10, tolerance: 0.05 },
          explanation: "Clock cycle \\(\\tau = \\max(10, 12, 9, 11, 8) + 2 = 12 + 2 = 14\\) ns. Total time \\(T = (k + n - 1) \\times \\tau = (5 + 1000 - 1) \\times 14 = 1004 \\times 14 = 14056\\) ns = 14.056 \\(\\mu s\\) \\(\\approx 14.06\\) \\(\\mu s\\).",
          marks: 2,
          negativeMarking: 0
        },
        {
          question: "In an IEEE 754 single-precision floating-point format, the decimal value represented by the 32-bit hexadecimal pattern 0x40C00000 is ________.",
          questionType: "FILL_UPS",
          answer: 6.0,
          acceptableNumericalRange: { min: 5.95, max: 6.05, tolerance: 0.05 },
          explanation: "Hex 0x40C00000 = binary 0 10000001 10000000000000000000000. Sign = 0 (positive). Exponent = 129 - 127 = 2. Mantissa = 1.1₂ = 1.5. Value = +1.5 × 2² = 6.0.",
          marks: 2,
          negativeMarking: 0
        }
      ], null, 2)
    },
    mcq: {
      title: 'MCQ (Single Choice Question with Circuit Diagram)',
      filename: 'sample_mcq_questions.json',
      json: JSON.stringify([
        {
          question: "For the bridge network shown in the diagram, find the equivalent resistance \\(R_{AB}\\) across terminals A and B if each resistor is \\(10\\,\\Omega\\).",
          questionType: "MCQ",
          imageUrl: "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?auto=format&fit=crop&w=600&q=80",
          diagramNeeded: true,
          options: [
            { id: "A", text: "\\(5\\,\\Omega\\)" },
            { id: "B", text: "\\(10\\,\\Omega\\)" },
            { id: "C", text: "\\(20\\,\\Omega\\)" },
            { id: "D", text: "\\(40\\,\\Omega\\)" }
          ],
          answer: "B",
          explanation: "Since the bridge is balanced (ratio of adjacent arms is equal), no current flows through the bridge resistor. The equivalent network consists of two parallel branches of \\(20\\,\\Omega\\), giving \\(R_{eq} = 10\\,\\Omega\\).",
          marks: 1,
          negativeMarking: 0.33
        }
      ], null, 2)
    },
    msq: {
      title: 'MSQ (Multiple Select Question)',
      filename: 'sample_msq_questions.json',
      json: JSON.stringify([
        {
          question: "Which of the following problems are known to be NP-Complete?",
          questionType: "MSQ",
          options: [
            { id: "A", text: "Travelling Salesperson Problem (Decision version)" },
            { id: "B", text: "Shortest Path in Directed Acyclic Graph" },
            { id: "C", text: "3-SAT (Boolean Satisfiability)" },
            { id: "D", text: "Vertex Cover Problem" }
          ],
          answer: ["A", "C", "D"],
          explanation: "TSP Decision, 3-SAT, and Vertex Cover are classical Karp NP-complete problems. Shortest path in a DAG is solvable in linear \\(O(V + E)\\) time using topological sort.",
          marks: 2,
          negativeMarking: 0
        }
      ], null, 2)
    },
    nat: {
      title: 'NAT (Numerical Answer Type with Circuit Diagram)',
      filename: 'sample_nat_questions.json',
      json: JSON.stringify([
        {
          question: "In the RLC series circuit shown below, given \\(R = 4\\,\\Omega\\), \\(L = 10\\text{ mH}\\), and \\(C = 100\\,\\mu\\text{F}\\), calculate the resonant frequency in radians per second (rad/s) rounded to the nearest integer.",
          questionType: "NAT",
          imageUrl: "https://images.unsplash.com/photo-1608755728617-aefab37d45f6?auto=format&fit=crop&w=600&q=80",
          diagramNeeded: true,
          answer: 1000,
          acceptableNumericalRange: { min: 990, max: 1010, tolerance: 10 },
          explanation: "Resonant angular frequency \\(\\omega_0 = \\frac{1}{\\sqrt{LC}} = \\frac{1}{\\sqrt{10 \\times 10^{-3} \\times 100 \\times 10^{-6}}} = \\frac{1}{\\sqrt{10^{-6}}} = 1000\\text{ rad/s}\\).",
          marks: 2,
          negativeMarking: 0
        }
      ], null, 2)
    },
    fill_ups: {
      title: 'Fill-in-the-Blanks (NAT / Blank Format)',
      filename: 'sample_fill_in_the_blanks_questions.json',
      json: JSON.stringify([
        {
          question: "The maximum number of nodes in a binary tree of height \\(h = 4\\) (where root is at height 0) is ________.",
          questionType: "FILL_UPS",
          answer: 31,
          acceptableNumericalRange: { min: 31, max: 31, tolerance: 0 },
          explanation: "The maximum number of nodes in a binary tree of height \\(h\\) is \\(2^{h+1} - 1\\). For \\(h = 4\\), \\(N = 2^5 - 1 = 32 - 1 = 31\\).",
          marks: 1,
          negativeMarking: 0
        }
      ], null, 2)
    },
    true_false: {
      title: 'True / False (Binary Evaluation)',
      filename: 'sample_true_false_questions.json',
      json: JSON.stringify([
        {
          question: "True or False: In a B-Tree of order \\(m\\), every internal node except the root has at least \\(\\lceil m/2 \\rceil\\) children.",
          questionType: "TRUE_FALSE",
          options: [
            { id: "A", text: "True" },
            { id: "B", text: "False" }
          ],
          answer: "A",
          explanation: "True. By definition, every internal node in a B-Tree of order \\(m\\) must have at least \\(\\lceil m/2 \\rceil\\) child pointers (except the root which has at least 2 children if it is not a leaf).",
          marks: 1,
          negativeMarking: 0.33
        }
      ], null, 2)
    }
  };

  // Helper: Load a specific sample template
  const handleSelectSampleTemplate = (type: SampleTemplateType) => {
    setSelectedSampleType(type);
    setJsonPasteInput(SAMPLE_TEMPLATES[type].json);
    toast.success(`Loaded sample schema: ${SAMPLE_TEMPLATES[type].title}`);
  };

  // Helper: Copy AI Prompt for LLMs (Gemini, ChatGPT, Claude)
  const handleCopyAiPrompt = (sampleType: SampleTemplateType) => {
    const topic = selectedExam === 'GATE 2027' ? selectedGateTopic : selectedTopicTitle || 'Computer Science / Engineering';
    const exam = selectedExam;
    const promptText = `Act as an expert assessment author and professor for ${exam}.
Generate 5 high-quality questions on the topic "${topic}".
Follow this JSON schema strictly without any markdown backticks, conversational preamble, or explanations outside the JSON array:

${SAMPLE_TEMPLATES[sampleType].json}

Strict Formatting Rules:
1. Ensure formulas and math use standard LaTeX notation: \\( ... \\) for inline math and $$ ... $$ for display math.
2. For MCQ: single choice with options A, B, C, D and answer "A" / "B" / "C" / "D".
3. For MSQ: multiple correct choices with answer array like ["A", "C"].
4. For NAT / Fill-ups: numerical answer with exact float value and acceptableNumericalRange { min, max, tolerance }.
5. For True/False: options A: "True", B: "False" and answer "A" or "B".
6. Circuit Diagrams & Figures: When a question requires a circuit diagram, schematic, or figure, include "imageUrl": "https://..." and "diagramNeeded": true.
7. Provide detailed step-by-step solutions in the "explanation" field.
8. Return ONLY the valid, parseable JSON array.`;

    navigator.clipboard.writeText(promptText);
    toast.success(`Copied ${SAMPLE_TEMPLATES[sampleType].title} prompt for Gemini / ChatGPT / Claude!`);
  };

  // Helper: Download Sample JSON File
  const handleDownloadSampleJson = (sampleType: SampleTemplateType) => {
    const tpl = SAMPLE_TEMPLATES[sampleType];
    const blob = new Blob([tpl.json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = tpl.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${tpl.filename}`);
  };

  // ── Handler: Import Questions from AI-Generated JSON ───────────────────────
  const handleImportJsonQuestions = () => {
    if (!jsonPasteInput.trim()) {
      toast.error('Please paste valid JSON containing questions.');
      return;
    }

    try {
      let parsed = JSON.parse(jsonPasteInput);
      if (!Array.isArray(parsed)) {
        if (parsed.questions && Array.isArray(parsed.questions)) {
          parsed = parsed.questions;
        } else if (parsed.items && Array.isArray(parsed.items)) {
          parsed = parsed.items;
        } else {
          parsed = [parsed];
        }
      }

      if (parsed.length === 0) {
        toast.error('No question objects found in the provided JSON array.');
        return;
      }

      const imported: ExtractedQuestionItem[] = parsed.map((item: any, idx: number) => {
        const rawType = String(item.questionType || item.type || '').toUpperCase();
        let qType: 'MCQ' | 'MSQ' | 'NAT' = 'MCQ';

        if (rawType === 'MSQ') {
          qType = 'MSQ';
        } else if (rawType === 'NAT' || rawType === 'NUMERICAL') {
          qType = 'NAT';
        } else if (rawType === 'FILL_UPS' || rawType === 'FILL_IN_THE_BLANKS' || rawType === 'BLANK') {
          if (typeof item.answer === 'number' || item.exactNumericalValue !== undefined || item.acceptableNumericalRange) {
            qType = 'NAT';
          } else {
            qType = 'MCQ';
          }
        } else if (rawType === 'TRUE_FALSE') {
          qType = 'MCQ';
        } else {
          qType = 'MCQ';
        }

        // Normalize options
        let opts: { id: string; text: string; imageUrl?: string }[] = [];
        if (Array.isArray(item.options) && item.options.length > 0) {
          opts = item.options.map((opt: any, oIdx: number) => {
            const letter = String.fromCharCode(65 + oIdx);
            if (typeof opt === 'string') return { id: letter, text: opt };
            return {
              id: opt.id || letter,
              text: opt.text || opt.label || String(opt),
              imageUrl: opt.imageUrl || opt.image || opt.diagramUrl ? String(opt.imageUrl || opt.image || opt.diagramUrl) : undefined,
            };
          });
        } else if (rawType === 'TRUE_FALSE') {
          opts = [
            { id: 'A', text: 'True' },
            { id: 'B', text: 'False' },
          ];
        }

        let rawAns = item.correctAnswer ?? item.answer ?? item.correct_answer;
        if (typeof rawAns === 'boolean') {
          rawAns = rawAns ? 'A' : 'B';
        }
        if (rawAns === undefined || rawAns === null) {
          rawAns = qType === 'NAT' ? 0 : 'A';
        }

        const rawAnswers = item.correctAnswers || (Array.isArray(rawAns) ? rawAns : [rawAns]);
        const imgUrl =
          item.imageUrl ||
          item.diagramUrl ||
          item.image ||
          item.questionImageUrl ||
          item.diagram_url ||
          item.question_image_url;
        const diagramNeeded = Boolean(item.diagramNeeded || item.diagram_needed || imgUrl);

        return {
          id: `ai_json_${Date.now()}_${idx}`,
          questionNo: String(extractedReviewQuestions.length + idx + 1),
          questionType: qType,
          questionText: item.questionText || item.question || item.text || 'Untitled AI Question',
          imageUrl: imgUrl ? String(imgUrl) : undefined,
          diagramNeeded,
          options: qType !== 'NAT' ? opts : [],
          correctAnswer: String(Array.isArray(rawAns) ? rawAns[0] : rawAns),
          correctAnswers: qType === 'MSQ' ? rawAnswers.map(String) : undefined,
          exactNumericalValue:
            item.exactNumericalValue !== undefined
              ? Number(item.exactNumericalValue)
              : typeof rawAns === 'number'
              ? rawAns
              : undefined,
          acceptableNumericalRange: item.acceptableNumericalRange || item.range,
          explanation: item.explanation || item.solution || 'AI-generated question explanation.',
          marks: item.marks || (qType === 'NAT' ? 2 : 1),
          negativeMarking: item.negativeMarking ?? (qType === 'MCQ' ? 0.33 : 0),
          sourceCategory: 'USER_PROVIDED_MATERIAL',
          year: examYearInput,
          examName: selectedExam,
          paperCode: selectedExam === 'GATE 2027' ? selectedGatePaper : selectedBranchId,
          subjectName:
            selectedExam === 'GATE 2027'
              ? activeGateSubjects.find((s) => s.id === selectedGateSubjectId)?.name
              : subjects.find((s) => s.id === selectedSubjectId)?.name,
          topicName: selectedExam === 'GATE 2027' ? selectedGateTopic : selectedTopicTitle,
          validationStatus: 'STRUCTURALLY_VALID',
          isApproved: false,
        };
      });

      setExtractedReviewQuestions((prev) => [...imported, ...prev]);
      toast.success(`Successfully imported ${imported.length} question(s) from AI JSON into Review Table!`);
      setJsonPasteInput('');
      setActiveTab('review');
    } catch (err: any) {
      toast.error(`Invalid JSON format: ${err.message}`);
    }
  };

  // ── Handler: Single Question Approve ───────────────────────────────────────
  const handleApproveSingle = (idx: number) => {
    setExtractedReviewQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, isApproved: true } : q))
    );
    toast.success('Question verified & approved for publishing');
  };

  // ── Handler: Single Question Reject ────────────────────────────────────────
  const handleRejectSingle = (idx: number) => {
    setExtractedReviewQuestions((prev) => prev.filter((_, i) => i !== idx));
    toast.info('Question rejected and removed from staging');
  };

  // ── Handler: Save Edited Question from Modal ──────────────────────────────
  const handleSaveEditedQuestion = (updated: ExtractedQuestionItem) => {
    setExtractedReviewQuestions((prev) =>
      prev.map((q) => (q.id === updated.id ? updated : q))
    );
    setEditingQuestion(null);
    toast.success('Question updated successfully!');
  };

  // ── Handler: Bulk Approval ─────────────────────────────────────────────────
  const handleBulkApprove = () => {
    if (selectedQuestionIds.length === 0) {
      toast.error('Select at least one question to approve');
      return;
    }
    setExtractedReviewQuestions((prev) =>
      prev.map((q) =>
        selectedQuestionIds.includes(q.id || '') ? { ...q, isApproved: true } : q
      )
    );
    toast.success(`Approved ${selectedQuestionIds.length} questions!`);
    setSelectedQuestionIds([]);
  };

  // ── Handler: Authoritative Publish to Master Question Bank ──────────────────
  const handlePublishToMasterBank = async () => {
    const approvedQuestions = extractedReviewQuestions.filter((q) => q.isApproved);
    if (approvedQuestions.length === 0) {
      toast.error('No approved questions ready for publishing. Please approve questions first.');
      return;
    }

    try {
      const res = await fetchWithAuth('/api/admin/question-intelligence/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: approvedQuestions.map((q) => ({
            questionText: q.questionText,
            questionType: q.questionType,
            questionImageUrl: q.imageUrl || null,
            diagramNeeded: q.diagramNeeded ? 1 : 0,
            subjectCode: q.paperCode,
            subjectName: q.subjectName,
            topicName: q.topicName,
            examName: q.examName,
            examYear: q.year,
            marks: q.marks,
            negativeMarking: q.negativeMarking,
            optionsJson: q.options ? JSON.stringify(q.options) : null,
            correctAnswerJson:
              q.questionType === 'MSQ'
                ? JSON.stringify(q.correctAnswers || [q.correctAnswer])
                : String(q.correctAnswer || q.exactNumericalValue || 'A'),
            acceptableNumericalRangeJson: q.acceptableNumericalRange
              ? JSON.stringify(q.acceptableNumericalRange)
              : null,
            explanation: q.explanation,
            sourceUrl: q.sourceUrl,
            sourceType: 'GATE',
            isOriginalPyq: true,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Publishing failed');
      }

      toast.success(
        `Successfully published ${data.publishedCount || approvedQuestions.length} questions to Master Question Bank!`
      );

      // Remove published from staging
      setExtractedReviewQuestions((prev) => prev.filter((q) => !q.isApproved));
      fetchOverviewMetrics();
    } catch (err: any) {
      toast.error(err.message || 'Error publishing questions');
    }
  };

  // ── Handler: Launch Student Test Practice Runner ───────────────────────────
  const handleLaunchStudentPractice = async () => {
    setIsLoadingTestSession(true);
    setIsTestModalOpen(true);
    setTestAnswerRevealed(false);
    setStudentSelectedOption('');
    setStudentMsqSelections([]);
    setStudentNatAnswer('');
    setActiveTestQuestionIdx(0);

    try {
      const res = await fetchWithAuth('/api/practice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examName: selectedExam,
          subjectCode: selectedExam === 'GATE 2027' ? selectedGatePaper : selectedBranchId,
          topicName: selectedExam === 'GATE 2027' ? selectedGateTopic : selectedTopicTitle,
          sourceMode: 'GATE_PYQ',
          questionCount: 5,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create practice session');
      }

      const json = await res.json();
      if (json.questions && json.questions.length > 0) {
        setTestSessionQuestions(json.questions);
      } else {
        // Fallback to local questions in memory for live validation
        setTestSessionQuestions(
          extractedReviewQuestions.map((q, idx) => ({
            id: q.id || `q_${idx}`,
            sequenceNumber: idx + 1,
            questionText: q.questionText,
            questionType: q.questionType,
            questionImageUrl: q.imageUrl || (q as any).questionImageUrl,
            diagramNeeded: q.diagramNeeded,
            options: q.options || [],
            marks: q.marks || 1,
            subjectName: q.subjectName,
            topicName: q.topicName,
            correctAnswer: q.correctAnswer,
            correctAnswers: q.correctAnswers,
            exactNumericalValue: q.exactNumericalValue,
            acceptableNumericalRange: q.acceptableNumericalRange,
            explanation: q.explanation,
          }))
        );
      }
    } catch {
      // Use staged questions
      setTestSessionQuestions(
        extractedReviewQuestions.map((q, idx) => ({
          id: q.id || `q_${idx}`,
          sequenceNumber: idx + 1,
          questionText: q.questionText,
          questionType: q.questionType,
          questionImageUrl: q.imageUrl || (q as any).questionImageUrl,
          diagramNeeded: q.diagramNeeded,
          options: q.options || [],
          marks: q.marks || 1,
          subjectName: q.subjectName,
          topicName: q.topicName,
          correctAnswer: q.correctAnswer,
          correctAnswers: q.correctAnswers,
          exactNumericalValue: q.exactNumericalValue,
          acceptableNumericalRange: q.acceptableNumericalRange,
          explanation: q.explanation,
        }))
      );
    } finally {
      setIsLoadingTestSession(false);
    }
  };

  // Filtered Review Questions
  const filteredReviewQuestions = useMemo(() => {
    return extractedReviewQuestions.filter((q) => {
      if (reviewFilterType !== 'ALL' && q.questionType !== reviewFilterType) return false;
      if (
        reviewSearch &&
        !q.questionText.toLowerCase().includes(reviewSearch.toLowerCase()) &&
        !q.topicName?.toLowerCase().includes(reviewSearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [extractedReviewQuestions, reviewFilterType, reviewSearch]);

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. UNIVERSAL STICKY ACADEMIC SCOPE TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#0F172A]/95 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Exam Switcher */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Segment:</span>
                <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700">
                  <button
                    onClick={() => setSelectedExam('GATE 2027')}
                    className={`px-3 py-1 rounded-md text-xs font-extrabold transition cursor-pointer ${
                      selectedExam === 'GATE 2027'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    GATE 2027
                  </button>
                  <button
                    onClick={() => setSelectedExam('GTU')}
                    className={`px-3 py-1 rounded-md text-xs font-extrabold transition cursor-pointer ${
                      selectedExam === 'GTU'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    GTU Engineering
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedExam === 'GATE 2027'
                  ? 'Official IIT Madras 30-Paper Taxonomy & Revised Section Codes'
                  : 'Gujarat Technological University Curriculum SSoT'}
              </p>
            </div>
          </div>

          {/* Scope Selectors depending on Exam */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {selectedExam === 'GATE 2027' ? (
              <>
                {/* 1. Paper Selector (All 30 Papers) */}
                <div className="flex flex-col min-w-[170px]">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Paper (30 Papers)</label>
                  <select
                    value={selectedGatePaper}
                    onChange={(e) => setSelectedGatePaper(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {GATE_2027_PAPERS.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.code} — {p.name} {p.isNew ? '★ NEW' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Section Selector */}
                <div className="flex flex-col min-w-[150px]">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Section</label>
                  <select
                    value={selectedGateSection}
                    onChange={(e) => setSelectedGateSection(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {activeGateSections.map((sec) => (
                      <option key={sec.code} value={sec.code}>
                        {sec.code} — {sec.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Subject Selector */}
                <div className="flex flex-col min-w-[160px]">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Subject</label>
                  <select
                    value={selectedGateSubjectId}
                    onChange={(e) => setSelectedGateSubjectId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {activeGateSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Topic Selector */}
                <div className="flex flex-col min-w-[170px] max-w-[220px]">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Syllabus Topic</label>
                  <select
                    value={selectedGateTopic}
                    onChange={(e) => setSelectedGateTopic(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-orange-500 truncate cursor-pointer"
                  >
                    {activeGateTopics.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                {/* GTU Branch */}
                <div className="flex flex-col min-w-[150px]">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">GTU Branch</label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.code || b.id}>
                        ({b.code}) {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* GTU Semester 1-8 */}
                <div className="flex flex-col min-w-[100px]">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">Semester</label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>

                {/* GTU Subject */}
                <div className="flex flex-col min-w-[160px]">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">GTU Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        ({s.code}) {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Quick Test Practice Button */}
            <div className="flex flex-col justify-end">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1">&nbsp;</label>
              <button
                onClick={handleLaunchStudentPractice}
                className="px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Test Live</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. STUDIO NAVIGATION TABS
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>A. Content Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('add-source')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'add-source'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>B. Add Content Source</span>
          <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px]">Web/PDF</span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'queue'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>C. Extraction Queue</span>
          {extractionJobs.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-orange-400 text-[10px] font-mono">
              {extractionJobs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('review')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'review'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>D. Question Review Table</span>
          {extractedReviewQuestions.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 text-[10px] font-mono">
              {extractedReviewQuestions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('gate-browser')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'gate-browser'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>E. GATE 2027 Taxonomy Browser</span>
        </button>

        <button
          onClick={() => setActiveTab('master-bank')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
            activeTab === 'master-bank'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>F. Live Master Bank</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB A: CONTENT OVERVIEW (OPERATIONAL METRICS)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Content Ingestion & Pipeline Health Snapshot</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px]">
                  Live D1 Verified
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Real-time metrics reflecting discovered sources, extraction stages, verified questions, and duplicate clusters.
              </p>
            </div>
            <button
              onClick={fetchOverviewMetrics}
              disabled={isLoadingMetrics}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMetrics ? 'animate-spin text-orange-400' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {/* 8 Operational KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 block mb-1">Total Sources Submitted</span>
              <p className="text-2xl font-black text-white font-display">
                {metrics.totalSourcesSubmitted.toLocaleString()}
              </p>
              <span className="text-[11px] text-blue-400 font-bold block mt-1">URLs & Papers</span>
            </div>

            <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 block mb-1">Awaiting Extraction</span>
              <p className="text-2xl font-black text-amber-400 font-display">
                {metrics.sourcesAwaitingExtraction.toLocaleString()}
              </p>
              <span className="text-[11px] text-amber-400 font-bold block mt-1">In Queue</span>
            </div>

            <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 block mb-1">Questions Extracted</span>
              <p className="text-2xl font-black text-purple-400 font-display">
                {metrics.questionsExtracted.toLocaleString()}
              </p>
              <span className="text-[11px] text-purple-400 font-bold block mt-1">Total Parsed</span>
            </div>

            <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 block mb-1">Requiring Review</span>
              <p className="text-2xl font-black text-yellow-400 font-display">
                {metrics.questionsRequiringReview.toLocaleString()}
              </p>
              <span className="text-[11px] text-yellow-400 font-bold block mt-1">Pending Triage</span>
            </div>

            <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 block mb-1">Questions Approved</span>
              <p className="text-2xl font-black text-emerald-400 font-display">
                {metrics.questionsApproved.toLocaleString()}
              </p>
              <span className="text-[11px] text-emerald-400 font-bold block mt-1">Staging Passed</span>
            </div>

            <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 block mb-1">Questions Published</span>
              <p className="text-2xl font-black text-orange-400 font-display">
                {metrics.questionsPublished.toLocaleString()}
              </p>
              <span className="text-[11px] text-orange-400 font-bold block mt-1">Live in Master Bank</span>
            </div>

            <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 block mb-1">Duplicates Detected</span>
              <p className="text-2xl font-black text-rose-400 font-display">
                {metrics.duplicateQuestionsDetected.toLocaleString()}
              </p>
              <span className="text-[11px] text-rose-400 font-bold block mt-1">Safe Clustered</span>
            </div>

            <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400 block mb-1">Failed / Blocked Jobs</span>
              <p className="text-2xl font-black text-slate-300 font-display">
                {metrics.failedOrBlockedJobs.toLocaleString()}
              </p>
              <span className="text-[11px] text-slate-400 font-bold block mt-1">Requires Retry</span>
            </div>
          </div>

          {/* Quick Action Station */}
          <div className="bg-gradient-to-br from-slate-900 to-[#0F172A] rounded-2xl border border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Ready to ingest new questions?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Paste any permitted question website URL or upload a question paper PDF to extract questions automatically.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => {
                  setSourceMode('url');
                  setActiveTab('add-source');
                }}
                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Globe className="w-4 h-4" />
                <span>Extract from URL</span>
              </button>
              <button
                onClick={() => {
                  setSourceMode('pdf');
                  setActiveTab('add-source');
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-2 border border-slate-700 cursor-pointer"
              >
                <FileUp className="w-4 h-4" />
                <span>Upload Paper PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB B: ADD CONTENT SOURCE (WEBSITE URL / PDF / AI / MANUAL)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'add-source' && (
        <div className="bg-[#0F172A] rounded-2xl border border-slate-800 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-orange-400" />
                <span>Add Content Source for Ingestion</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Extract questions, answer keys, explanations, and LaTeX solutions into the assessment pipeline without manual JSON formatting.
              </p>
            </div>

            {/* Source Mode Selector */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setSourceMode('url')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  sourceMode === 'url' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Website URL</span>
              </button>
              <button
                onClick={() => setSourceMode('pdf')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  sourceMode === 'pdf' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>PDF Document</span>
              </button>
              <button
                onClick={() => setSourceMode('manual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  sourceMode === 'manual' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Manual Entry</span>
              </button>
              <button
                onClick={() => setSourceMode('json')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  sourceMode === 'json' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Paste AI JSON</span>
              </button>
            </div>
          </div>

          {/* Mode 1: Website URL Ingestion */}
          {sourceMode === 'url' && (
            <div className="space-y-5">
              {extractionBlocker && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <span className="font-bold">Extraction Blocker Reported:</span>
                    <p className="mt-0.5">{extractionBlocker}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Permitted Source Website URL:
                  </label>
                  <input
                    type="url"
                    value={sourceUrlInput}
                    onChange={(e) => setSourceUrlInput(e.target.value)}
                    placeholder="https://practicepaper.in/gate/cs/algorithms"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Accepts specific question pages or topic directories. Protected against SSRF and private IPs.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Optional Source Title / Reference:
                  </label>
                  <input
                    type="text"
                    value={sourceTitleInput}
                    onChange={(e) => setSourceTitleInput(e.target.value)}
                    placeholder="e.g. PracticePaper.in GATE CS Algorithms Set 1"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Discovered Subpage Topics (when index page submitted) */}
              {discoveredSubpagesList.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-orange-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Discovered Topics ({discoveredSubpagesList.length}): Click any to load and extract
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {discoveredSubpagesList.map((subUrl) => {
                      const slug = subUrl.split('/').filter(Boolean).pop() || subUrl;
                      return (
                        <button
                          key={subUrl}
                          type="button"
                          onClick={() => {
                            setSourceUrlInput(subUrl);
                            setSourceTitleInput(`PracticePaper — ${slug.replace(/-/g, ' ')}`);
                            toast.info(`Selected ${slug}`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-orange-500/20 text-slate-300 hover:text-orange-300 text-[11px] font-mono transition border border-slate-700 cursor-pointer"
                        >
                          {slug}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Source Provenance Category:</label>
                  <select
                    value={sourceCategory}
                    onChange={(e) => setSourceCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold cursor-pointer"
                  >
                    <option value="OFFICIAL_PYQ">Official Previous Year Question (PYQ)</option>
                    <option value="LICENSED_RESOURCE">Licensed / Permitted Academic Resource</option>
                    <option value="ORIGINAL_PRACTICE">Original Faculty Practice Question</option>
                    <option value="USER_MATERIAL">User Provided Academic Material</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Exam Year / Session:</label>
                  <input
                    type="number"
                    value={examYearInput}
                    onChange={(e) => setExamYearInput(Number(e.target.value))}
                    min={2000}
                    max={2027}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Mapped Scope:</label>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-orange-400 font-bold truncate">
                    {selectedExam} — {selectedExam === 'GATE 2027' ? selectedGatePaper : selectedBranchId} ({selectedExam === 'GATE 2027' ? selectedGateTopic : selectedTopicTitle || 'General'})
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  ⚡ Multi-page tests (palettes 1-5, 6-10, 11-15...), MCQs, MSQs, and NATs with LaTeX formulas are automatically crawled and extracted.
                </span>
                <button
                  onClick={handleExecuteExtraction}
                  disabled={isExtracting}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  {isExtracting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Fetching & Parsing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit for Extraction</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: PDF Document Upload */}
          {sourceMode === 'pdf' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-800 hover:border-orange-500/50 rounded-2xl p-8 text-center transition">
                {isExtractingPdf ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <RefreshCw className="w-10 h-10 text-orange-400 animate-spin mb-3" />
                    <h4 className="text-sm font-bold text-white">Extracting Questions from PDF...</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Parsing PDF pages via unpdf, segmenting question blocks, detecting circuit diagrams and NAT numerical ranges.
                    </p>
                  </div>
                ) : (
                  <>
                    <FileUp className="w-10 h-10 text-orange-400 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-white">Upload Question Paper PDF</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Drag and drop official GATE or GTU question paper PDF files. Questions, diagrams, and numerical ranges will be extracted into the review staging queue.
                    </p>
                    <input
                      type="file"
                      accept=".pdf"
                      disabled={isExtractingPdf}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUploadPdf(file);
                        }
                      }}
                      className="hidden"
                      id="pdf-upload-input"
                    />
                    <label
                      htmlFor="pdf-upload-input"
                      className="mt-4 inline-block px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
                    >
                      Browse PDF Files
                    </label>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Mode 3: Manual Question Entry */}
          {sourceMode === 'manual' && (
            <form onSubmit={handleSaveManualQuestion} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300">Question Format:</span>
                {(['MCQ', 'MSQ', 'NAT'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setManualQType(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      manualQType === t
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Question Text (Supports LaTeX \\( ... \\)):</label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  rows={3}
                  placeholder="Enter the problem statement..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Circuit Diagram / Schematic Image URL (optional):
                </label>
                <input
                  type="url"
                  value={manualImageUrl}
                  onChange={(e) => setManualImageUrl(e.target.value)}
                  placeholder="https://... (direct link to electrical schematic, graph, circuit, or diagram)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                />
                {manualImageUrl.trim() && (
                  <div className="mt-2 p-2 bg-slate-950 rounded-xl border border-slate-800 max-w-xs">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Diagram Preview:</span>
                    <img
                      src={manualImageUrl}
                      alt="Manual diagram preview"
                      className="max-h-36 rounded-lg object-contain mx-auto"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Options for MCQ / MSQ */}
              {manualQType !== 'NAT' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Options & Correct Answer:</label>
                  {manualOptions.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                        {opt.id}
                      </span>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setManualOptions((prev) =>
                            prev.map((o, i) => (i === idx ? { ...o, text: val } : o))
                          );
                        }}
                        placeholder={`Option ${opt.id} text...`}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                        required
                      />
                      {manualQType === 'MCQ' ? (
                        <button
                          type="button"
                          onClick={() => setManualCorrectAns(opt.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                            manualCorrectAns === opt.id
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {manualCorrectAns === opt.id ? 'Correct Answer' : 'Mark Correct'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setManualMsqAnswers((prev) =>
                              prev.includes(opt.id)
                                ? prev.filter((x) => x !== opt.id)
                                : [...prev, opt.id]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                            manualMsqAnswers.includes(opt.id)
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {manualMsqAnswers.includes(opt.id) ? 'Selected (MSQ)' : 'Include in MSQ'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* NAT Numerical Inputs */}
              {manualQType === 'NAT' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Exact Value:</label>
                    <input
                      type="number"
                      step="any"
                      value={manualNatVal}
                      onChange={(e) => setManualNatVal(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Tolerance Min:</label>
                    <input
                      type="number"
                      step="any"
                      value={manualNatMin}
                      onChange={(e) => setManualNatMin(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Tolerance Max:</label>
                    <input
                      type="number"
                      step="any"
                      value={manualNatMax}
                      onChange={(e) => setManualNatMax(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Explanation & Step-by-Step Solution:</label>
                <textarea
                  value={manualExplanation}
                  onChange={(e) => setManualExplanation(e.target.value)}
                  rows={2}
                  placeholder="Provide step-by-step logic, theorems applied, or derivation..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Save & Stage Question
              </button>
            </form>
          )}

          {/* Mode 4: Paste AI-Generated JSON with Interactive Requirement Selectors */}
          {sourceMode === 'json' && (
            <div className="space-y-5">
              {/* Header Card with Template Selectors */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                      <Code className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Paste AI Output (JSON)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          Gemini • ChatGPT • Claude • DeepSeek
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Choose your requirement to generate an exact sample JSON schema or copy an AI prompt for any LLM.
                      </p>
                    </div>
                  </div>

                  {/* Copy Prompt & Download File Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyAiPrompt(selectedSampleType)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:border-slate-600"
                      title="Copy full AI prompt with schema instructions for ChatGPT / Gemini"
                    >
                      <Copy className="w-3.5 h-3.5 text-orange-400" />
                      <span>Copy AI Prompt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadSampleJson(selectedSampleType)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:border-slate-600"
                      title="Download this schema as a .json file"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      <span>Download .json</span>
                    </button>
                  </div>
                </div>

                {/* Requirement Selectors (MCQ, MSQ, NAT, Fill-ups, True/False, Mixed) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Select Question Type Requirement:
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectSampleTemplate('all')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        selectedSampleType === 'all'
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      <span>🎯 All Combined (Mixed)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSampleTemplate('mcq')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        selectedSampleType === 'mcq'
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      <span>🔘 MCQ (Single Choice)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSampleTemplate('msq')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        selectedSampleType === 'msq'
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      <span>☑️ MSQ (Multiple Correct)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSampleTemplate('nat')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        selectedSampleType === 'nat'
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      <span>🔢 NAT (Numerical Range)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSampleTemplate('fill_ups')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        selectedSampleType === 'fill_ups'
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      <span>✏️ Fill-in-the-Blanks</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectSampleTemplate('true_false')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        selectedSampleType === 'true_false'
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      <span>⚖️ True / False</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* JSON Editor Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    JSON Questions Payload (Paste from AI model or edit template):
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {jsonPasteInput.length > 0 ? `${jsonPasteInput.length} characters` : 'Empty payload'}
                  </span>
                </div>
                <textarea
                  value={jsonPasteInput}
                  onChange={(e) => setJsonPasteInput(e.target.value)}
                  rows={10}
                  placeholder={`Select a question type above (e.g. MCQ, MSQ, NAT, Fill-ups) to load sample JSON, or paste your AI model's JSON output here...`}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleImportJsonQuestions}
                    className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Parse & Stage to Review Table</span>
                  </button>
                  {jsonPasteInput.trim() && (
                    <button
                      type="button"
                      onClick={() => setJsonPasteInput('')}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer border border-slate-700"
                    >
                      Clear JSON
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Staged questions can be reviewed and edited before publishing to live practice.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB C: EXTRACTION & INGESTION QUEUE
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'queue' && (
        <div className="bg-[#0F172A] rounded-2xl border border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                <span>Ingestion & Extraction Queue</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitor live crawling, parsing status, duplicate detection, and validation states of all submitted sources.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Source & URL</th>
                  <th className="py-3 px-4">Scope</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Parsed</th>
                  <th className="py-3 px-4">Duplicates</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {extractionJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{job.sourceTitle}</div>
                      <a
                        href={job.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-400 hover:text-orange-400 flex items-center gap-1 font-mono mt-0.5"
                      >
                        <span className="truncate max-w-[260px]">{job.sourceUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-300">
                      <div>{job.examName}</div>
                      <span className="text-[11px] text-slate-400 font-normal">{job.paperOrSubject}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">{job.submissionTime}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          job.status === 'Published'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : job.status === 'Needs Review'
                            ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                            : job.status === 'Extracting'
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-emerald-400 font-bold">{job.parsedCount}</span>
                      <span className="text-slate-500"> / {job.discoveredCount}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {job.duplicateCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/20 font-bold">
                          {job.duplicateCount} found
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveTab('review')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
                        >
                          Review Items
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB D: QUESTION REVIEW & PUBLISHING TABLE
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'review' && (
        <div className="bg-[#0F172A] rounded-2xl border border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-orange-400" />
                <span>Extracted Questions Review & Verification</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review mathematical formulas, answer keys, options, and duplicate flags before 1-click publishing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkApprove}
                disabled={selectedQuestionIds.length === 0}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bulk Approve ({selectedQuestionIds.length})</span>
              </button>

              <button
                onClick={handlePublishToMasterBank}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Approved Questions</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Filter Type:</span>
              {(['ALL', 'MCQ', 'MSQ', 'NAT'] as const).map((ft) => (
                <button
                  key={ft}
                  onClick={() => setReviewFilterType(ft)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    reviewFilterType === ft
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {ft}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                placeholder="Search extracted questions..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Questions Cards List */}
          <div className="space-y-4">
            {filteredReviewQuestions.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No extracted questions in the review queue. Submit a website URL or PDF above!
              </div>
            ) : (
              filteredReviewQuestions.map((q, idx) => {
                const isSelected = selectedQuestionIds.includes(q.id || '');

                return (
                  <div
                    key={q.id || idx}
                    className={`rounded-2xl border p-5 transition space-y-3 ${
                      q.isApproved
                        ? 'bg-emerald-950/10 border-emerald-500/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => {
                            const qId = q.id || '';
                            setSelectedQuestionIds((prev) =>
                              prev.includes(qId) ? prev.filter((x) => x !== qId) : [...prev, qId]
                            );
                          }}
                          className="cursor-pointer text-slate-400 hover:text-white"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-orange-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-xs font-bold">
                          Q.{q.questionNo}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase ${
                            q.questionType === 'MCQ'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : q.questionType === 'MSQ'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {q.questionType}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {q.paperCode} • {q.subjectName} • {q.topicName} ({q.marks} Mark{q.marks && q.marks > 1 ? 's' : ''})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {q.isApproved ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApproveSingle(idx)}
                            className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => setEditingQuestion(q)}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRejectSingle(idx)}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Statement */}
                    <div className="text-sm text-slate-100 font-serif leading-relaxed">
                      <MathRenderer content={q.questionText} />
                    </div>

                    {/* Circuit Diagram / Image Attachment Preview */}
                    {q.imageUrl && (
                      <div className="my-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-start gap-1.5">
                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Circuit Diagram / Figure
                        </span>
                        <a
                          href={q.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative block max-w-sm overflow-hidden rounded-lg border border-slate-700 bg-white/5 p-1"
                        >
                          <img
                            src={q.imageUrl}
                            alt="Circuit diagram or figure"
                            className="max-h-48 w-auto object-contain rounded transition group-hover:scale-105"
                          />
                        </a>
                      </div>
                    )}
                    {q.diagramNeeded && !q.imageUrl && (
                      <div className="my-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>This question refers to a diagram or circuit schematic, but no image URL is attached yet.</span>
                        </span>
                        <button
                          onClick={() => setEditingQuestion(q)}
                          className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded text-[11px] font-medium text-amber-200 transition cursor-pointer"
                        >
                          + Add Diagram URL
                        </button>
                      </div>
                    )}

                    {/* Options (MCQ / MSQ) */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt) => {
                          const isCorrect =
                            q.questionType === 'MSQ'
                              ? q.correctAnswers?.includes(opt.id)
                              : q.correctAnswer === opt.id;

                          return (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                isCorrect
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-300'
                              }`}
                            >
                              <span>
                                <strong className="font-mono mr-2">{opt.id}.</strong>
                                <MathRenderer content={opt.text} inline />
                              </span>
                              {isCorrect && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500 text-white">
                                  Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* NAT Answer & Tolerance */}
                    {q.questionType === 'NAT' && (
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs flex items-center gap-4">
                        <span className="text-slate-400">
                          Exact Value: <strong className="text-white font-mono">{q.exactNumericalValue}</strong>
                        </span>
                        {q.acceptableNumericalRange && (
                          <span className="text-slate-400">
                            Acceptable Range: [
                            <strong className="text-amber-400 font-mono">
                              {q.acceptableNumericalRange.min} — {q.acceptableNumericalRange.max}
                            </strong>
                            ]
                          </span>
                        )}
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                        <span className="font-bold text-orange-400 mr-1.5">Explanation:</span>
                        <MathRenderer content={q.explanation} />
                      </div>
                    )}

                    {/* Footer Provenance & Duplicate Warning */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <div className="flex items-center gap-3">
                        {q.sourceUrl && (
                          <a
                            href={q.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-orange-400 flex items-center gap-1 font-mono"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Source: {q.sourceTitle || 'Web'}</span>
                          </a>
                        )}
                        <span>Category: {q.sourceCategory || 'PYQ'}</span>
                      </div>

                      {q.isDuplicateCandidate && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/20 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Potential Duplicate Detected
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB E: GATE 2027 TAXONOMY BROWSER (ALL 30 PAPERS)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'gate-browser' && (
        <div className="bg-[#0F172A] rounded-2xl border border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-400" />
                <span>Official GATE 2027 30-Paper Taxonomy & Coverage</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect official sections (including XE0–XE9, XH0–XH6, XL0–XL5) and syllabus topics for every test paper.
              </p>
            </div>
            {activeGatePaper && (
              <a
                href={activeGatePaper.syllabusUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Official PDF Syllabus</span>
              </a>
            )}
          </div>

          {/* Paper Navigator Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
            {GATE_2027_PAPERS.map((p) => (
              <button
                key={p.code}
                onClick={() => setSelectedGatePaper(p.code)}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  selectedGatePaper === p.code
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{p.code}</span>
                {p.isNew && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
              </button>
            ))}
          </div>

          {/* Active Paper Details & Tree */}
          {activeGatePaper && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{activeGatePaper.name}</span>
                    <span className="text-xs font-mono text-orange-400">({activeGatePaper.code})</span>
                    {activeGatePaper.isNew && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        ★ NEW FOR GATE 2027
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Category: {activeGatePaper.category}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Sections</span>
                  <p className="text-xl font-black text-white font-mono">{activeGatePaper.sections.length}</p>
                </div>
              </div>

              {/* Sections & Topics Accordion */}
              <div className="space-y-3">
                {activeGatePaper.sections.map((sec) => (
                  <div key={sec.code} className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-orange-400 font-mono text-xs font-bold">
                          {sec.code}
                        </span>
                        <h4 className="text-sm font-bold text-white">{sec.name}</h4>
                        {sec.isCompulsory && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Compulsory
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {sec.subjects.map((sub) => (
                        <div key={sub.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800/80 space-y-2">
                          <span className="text-xs font-bold text-white block">{sub.name}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {sub.topics.map((top) => (
                              <span
                                key={top}
                                className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium"
                              >
                                {top}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB F: LIVE MASTER BANK & PRACTICE RUNNER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'master-bank' && (
        <div className="bg-[#0F172A] rounded-2xl border border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-orange-400" />
                <span>Live Master Bank & Interactive Student Test Runner</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified live questions stored in D1 database and discoverable by student assessment sessions.
              </p>
            </div>
            <button
              onClick={handleLaunchStudentPractice}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Play className="w-4 h-4" />
              <span>Launch Live Practice Session</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-300">
              Active Exam Scope: <strong className="text-white">{selectedExam}</strong> • Paper:{' '}
              <strong className="text-orange-400">{selectedExam === 'GATE 2027' ? selectedGatePaper : selectedBranchId}</strong>
            </span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> All Questions Verified
            </span>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          QUESTION EDIT & CIRCUIT DIAGRAM MODAL
      ───────────────────────────────────────────────────────────── */}
      {editingQuestion && (
        <QuestionEditModal
          question={editingQuestion}
          onSave={handleSaveEditedQuestion}
          onClose={() => setEditingQuestion(null)}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          STUDENT PRACTICE TEST RUNNER MODAL
      ───────────────────────────────────────────────────────────── */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0F172A] rounded-2xl border border-slate-700 max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Student Practice Verification Mode</h3>
                  <p className="text-[11px] text-slate-400">Simulates exact student test interface via /api/practice/session</p>
                </div>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingTestSession ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
                <span>Initializing live practice session...</span>
              </div>
            ) : testSessionQuestions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No verified questions found for this paper. Approve questions in the Review tab first.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Question Header */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-white">
                    Question {activeTestQuestionIdx + 1} of {testSessionQuestions.length}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-orange-400 font-mono text-[11px]">
                    {testSessionQuestions[activeTestQuestionIdx]?.questionType || 'MCQ'} (1 Mark)
                  </span>
                </div>

                {/* Problem Statement */}
                <div className="text-sm text-slate-100 font-serif leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div>
                    <MathRenderer content={testSessionQuestions[activeTestQuestionIdx]?.questionText} />
                  </div>
                  {testSessionQuestions[activeTestQuestionIdx]?.questionImageUrl && (
                    <div className="p-2.5 rounded-lg bg-black/40 border border-slate-700/60 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-orange-400 self-start flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Circuit Diagram / Figure
                      </span>
                      <img
                        src={testSessionQuestions[activeTestQuestionIdx]?.questionImageUrl}
                        alt="Question Figure"
                        className="max-h-56 w-auto object-contain rounded border border-slate-800 bg-white/5 p-1"
                      />
                    </div>
                  )}
                </div>

                {/* Question Options or NAT input */}
                {testSessionQuestions[activeTestQuestionIdx]?.questionType === 'NAT' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">Enter Numerical Answer:</label>
                    <input
                      type="number"
                      step="any"
                      value={studentNatAnswer}
                      onChange={(e) => setStudentNatAnswer(e.target.value)}
                      placeholder="Type number..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {testSessionQuestions[activeTestQuestionIdx]?.options?.map((opt: any) => {
                      const isSelected =
                        testSessionQuestions[activeTestQuestionIdx]?.questionType === 'MSQ'
                          ? studentMsqSelections.includes(opt.id)
                          : studentSelectedOption === opt.id;

                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            if (testSessionQuestions[activeTestQuestionIdx]?.questionType === 'MSQ') {
                              setStudentMsqSelections((prev) =>
                                prev.includes(opt.id) ? prev.filter((x) => x !== opt.id) : [...prev, opt.id]
                              );
                            } else {
                              setStudentSelectedOption(opt.id);
                            }
                          }}
                          className={`w-full text-left p-3 rounded-xl border text-xs flex flex-col gap-2 transition cursor-pointer ${
                            isSelected
                              ? 'bg-orange-500/15 border-orange-500 text-white font-semibold'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>
                              <strong className="font-mono mr-2">{opt.id}.</strong>
                              <MathRenderer content={opt.text} inline />
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-orange-400" />}
                          </div>
                          {opt.imageUrl && (
                            <img
                              src={opt.imageUrl}
                              alt={`Option ${opt.id} figure`}
                              className="max-h-24 w-auto object-contain rounded bg-white/5 p-1 border border-slate-800"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Answer Check Result */}
                {testAnswerRevealed && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>
                        Verified Answer:{' '}
                        {testSessionQuestions[activeTestQuestionIdx]?.correctAnswer ||
                          testSessionQuestions[activeTestQuestionIdx]?.exactNumericalValue}
                      </span>
                    </div>
                    {testSessionQuestions[activeTestQuestionIdx]?.explanation && (
                      <div className="text-slate-300 text-[11px] pt-1">
                        <MathRenderer content={testSessionQuestions[activeTestQuestionIdx]?.explanation} />
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setTestAnswerRevealed(true)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Check Answer & Solution
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={activeTestQuestionIdx === 0}
                      onClick={() => {
                        setActiveTestQuestionIdx((prev) => Math.max(0, prev - 1));
                        setTestAnswerRevealed(false);
                      }}
                      className="px-3 py-1.5 bg-slate-800 disabled:opacity-40 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      disabled={activeTestQuestionIdx >= testSessionQuestions.length - 1}
                      onClick={() => {
                        setActiveTestQuestionIdx((prev) =>
                          Math.min(testSessionQuestions.length - 1, prev + 1)
                        );
                        setTestAnswerRevealed(false);
                      }}
                      className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Next Question
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION EDIT MODAL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface QuestionEditModalProps {
  question: ExtractedQuestionItem;
  onSave: (updated: ExtractedQuestionItem) => void;
  onClose: () => void;
}

const QuestionEditModal: React.FC<QuestionEditModalProps> = ({ question, onSave, onClose }) => {
  const [questionText, setQuestionText] = useState(question.questionText || '');
  const [questionType, setQuestionType] = useState<'MCQ' | 'MSQ' | 'NAT'>(question.questionType || 'MCQ');
  const [imageUrl, setImageUrl] = useState(question.imageUrl || '');
  const [diagramNeeded, setDiagramNeeded] = useState(question.diagramNeeded || !!question.imageUrl);
  const [options, setOptions] = useState<Array<{ id: string; text: string; imageUrl?: string }>>(
    question.options && question.options.length > 0
      ? question.options
      : [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' },
        ]
  );
  const [correctAnswer, setCorrectAnswer] = useState<string>(question.correctAnswer || 'A');
  const [correctAnswers, setCorrectAnswers] = useState<string[]>(
    question.correctAnswers || [question.correctAnswer || 'A']
  );
  const [exactNumericalValue, setExactNumericalValue] = useState<number>(
    Number(question.exactNumericalValue ?? 0)
  );
  const [natMin, setNatMin] = useState<number>(
    Number(question.acceptableNumericalRange?.min ?? question.exactNumericalValue ?? 0)
  );
  const [natMax, setNatMax] = useState<number>(
    Number(question.acceptableNumericalRange?.max ?? question.exactNumericalValue ?? 0)
  );
  const [explanation, setExplanation] = useState(question.explanation || '');
  const [marks, setMarks] = useState<number>(question.marks || 1);
  const [negativeMarking, setNegativeMarking] = useState<number>(question.negativeMarking || 0);

  const handleOptionTextChange = (idx: number, text: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === idx ? { ...opt, text } : opt)));
  };

  const handleOptionImageChange = (idx: number, optImageUrl: string) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === idx ? { ...opt, imageUrl: optImageUrl.trim() || undefined } : opt))
    );
  };

  const handleAddOption = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextId = letters[options.length] || `OPT_${options.length + 1}`;
    setOptions((prev) => [...prev, { id: nextId, text: '' }]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) {
      toast.error('At least 2 options are required for MCQ / MSQ');
      return;
    }
    const removedId = options[idx]?.id;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
    if (correctAnswer === removedId && options.length > 1) {
      const remaining = options.filter((_, i) => i !== idx);
      setCorrectAnswer(remaining[0].id);
    }
    setCorrectAnswers((prev) => prev.filter((id) => id !== removedId));
  };

  const handleSave = () => {
    if (!questionText.trim()) {
      toast.error('Question statement is required');
      return;
    }

    const updated: ExtractedQuestionItem = {
      ...question,
      questionText: questionText.trim(),
      questionType,
      imageUrl: imageUrl.trim() || undefined,
      diagramNeeded: diagramNeeded || !!imageUrl.trim(),
      options: questionType !== 'NAT' ? options : [],
      correctAnswer: questionType === 'MCQ' ? correctAnswer : undefined,
      correctAnswers: questionType === 'MSQ' ? correctAnswers : undefined,
      exactNumericalValue: questionType === 'NAT' ? Number(exactNumericalValue) : undefined,
      acceptableNumericalRange:
        questionType === 'NAT'
          ? {
              min: Number(natMin),
              max: Number(natMax),
              tolerance: Math.max(0, (Number(natMax) - Number(natMin)) / 2),
            }
          : undefined,
      explanation: explanation.trim(),
      marks: Number(marks),
      negativeMarking: Number(negativeMarking),
      validationStatus: 'STRUCTURALLY_VALID',
    };

    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0F172A] rounded-2xl border border-slate-700 max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 sticky top-0 bg-[#0F172A] z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Edit className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Edit Question & Circuit Diagram</h3>
              <p className="text-[11px] text-slate-400">Modify question statement, circuit schematic, options, or numerical ranges</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question Type & Marks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Type</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="MCQ">MCQ (Single Choice)</option>
              <option value="MSQ">MSQ (Multi Choice)</option>
              <option value="NAT">NAT (Numerical Answer)</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Marks</label>
            <input
              type="number"
              value={marks}
              onChange={(e) => setMarks(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Negative Marks</label>
            <input
              type="number"
              step="0.01"
              value={negativeMarking}
              onChange={(e) => setNegativeMarking(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
        </div>

        {/* Question Statement */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Question Statement</label>
            <span className="text-[10px] text-orange-400 font-mono">LaTeX Math Supported: \(...\), \[...\], \begin&#123;bmatrix&#125;</span>
          </div>
          <textarea
            rows={4}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono leading-relaxed"
            placeholder="Type LaTeX or text question..."
          />
          {questionText.trim() && (
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Live Math Preview:</span>
              <MathRenderer content={questionText} />
            </div>
          )}
        </div>

        {/* Circuit Diagram / Image Attachment Section */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-orange-400" /> Circuit Diagram / Schematic / Figure
            </span>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={diagramNeeded}
                onChange={(e) => setDiagramNeeded(e.target.checked)}
                className="rounded accent-orange-500"
              />
              <span>Requires Diagram</span>
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 block">Image or Diagram URL (Web or R2 Storage):</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                if (e.target.value.trim()) setDiagramNeeded(true);
              }}
              placeholder="https://example.com/schematic.png"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
            />
          </div>

          {imageUrl && (
            <div className="p-2 rounded-lg bg-black/40 border border-slate-700/60 flex flex-col items-center gap-1">
              <span className="text-[10px] text-slate-400 font-medium">Live Diagram Preview:</span>
              <img
                src={imageUrl}
                alt="Circuit Diagram Preview"
                className="max-h-48 w-auto object-contain rounded border border-slate-800 bg-white/5"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Options for MCQ / MSQ */}
        {questionType !== 'NAT' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Options ({questionType === 'MCQ' ? 'Select 1 Correct' : 'Check Multiple Correct'})
              </label>
              <button
                type="button"
                onClick={handleAddOption}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-orange-400 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Option
              </button>
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => {
                const isSelected =
                  questionType === 'MSQ'
                    ? correctAnswers.includes(opt.id)
                    : correctAnswer === opt.id;

                return (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-xl border flex flex-col gap-2 ${
                      isSelected ? 'bg-orange-500/10 border-orange-500/40' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (questionType === 'MSQ') {
                            setCorrectAnswers((prev) =>
                              prev.includes(opt.id) ? prev.filter((x) => x !== opt.id) : [...prev, opt.id]
                            );
                          } else {
                            setCorrectAnswer(opt.id);
                          }
                        }}
                        className={`w-6 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center transition cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500 text-white shadow'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {opt.id}
                      </button>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                        placeholder={`Option ${opt.id} text...`}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Optional Option Image */}
                    <div className="flex items-center gap-2 pl-8">
                      <span className="text-[10px] text-slate-500 shrink-0">Option Image:</span>
                      <input
                        type="url"
                        value={opt.imageUrl || ''}
                        onChange={(e) => handleOptionImageChange(idx, e.target.value)}
                        placeholder="Optional image URL for this option..."
                        className="flex-1 bg-slate-950/70 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 font-mono"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NAT Value and Range */}
        {questionType === 'NAT' && (
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 block">Numerical Key & Acceptable Range</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Exact Value:</label>
                <input
                  type="number"
                  step="any"
                  value={exactNumericalValue}
                  onChange={(e) => setExactNumericalValue(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Min Accepted Value:</label>
                <input
                  type="number"
                  step="any"
                  value={natMin}
                  onChange={(e) => setNatMin(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Max Accepted Value:</label>
                <input
                  type="number"
                  step="any"
                  value={natMax}
                  onChange={(e) => setNatMax(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step-by-Step Explanation */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Solution & Explanation</label>
          <textarea
            rows={3}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed"
            placeholder="Detailed step-by-step derivation / explanation..."
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" /> Save Question
          </button>
        </div>
      </div>
    </div>
  );
};
