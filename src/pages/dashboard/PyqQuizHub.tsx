import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, BrainCircuit, Target, Sparkles, Filter, 
  Clock, CheckCircle2, Award, BookOpen, ChevronRight,
  Zap, Cpu, Wrench, Building2, Radio, ArrowRight, Download, Eye,
  Bookmark, Star, Search, Share2, FileDown, CheckCircle, ShieldCheck,
  TrendingUp, Layers, HelpCircle, X, ExternalLink, RefreshCw
} from 'lucide-react';
import { QuestionRenderer } from '../../components/quiz/question-renderer';
import { MATHS_PYQ_BANK, APTITUDE_PYQ_BANK, getAllPyqQuestions } from '../../config/pyqQuestionBank';
import { Question } from '../../types';
import { useStudentAcademic } from '../../context/StudentAcademicContext';
import { useLearningEcosystem } from '../../context/LearningEcosystemContext';
import { gtuPyqClient, CanonicalSubjectTreeItem } from '../../api/gtuPyqClient';
import { getGtuPyqUrl, getCourseCodeFromBranch, GTU_PAPERS_ARCHIVE_URL } from '../../utils/gtuPyq';
import { browsePaths, encodeSemesterSlug } from '../../utils/browsePaths';

export interface PyqPaperItem {
  id: string;
  title: string;
  university: string;
  branch: string;
  branchSlug: string;
  semester: number;
  subject: string;
  subjectCode: string;
  subjectSlug: string;
  year: number;
  sessionCode: string; // e.g. 'W2024', 'S2024'
  examType: 'Summer End-Sem' | 'Winter End-Sem' | 'Mid-Sem 1' | 'Mid-Sem 2' | 'GATE Official';
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'GTU Standard';
  solAvailable: boolean;
  downloadsCount: number;
  solvedCount: number;
  rating: number;
  pdfSize: string;
  pdfUrl?: string;
  isTrending?: boolean;
}

// Master GTU Course Database for all Engineering Branches & Semesters
const COMPREHENSIVE_GTU_PYQ_REGISTRY: PyqPaperItem[] = [
  // ELECTRICAL ENGINEERING - SEMESTER 5
  {
    id: 'pyq-ee-5-ret',
    title: 'GTU Winter 2024 Renewable Energy Technology (3150912)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Electrical Engineering',
    branchSlug: 'electrical-engineering',
    semester: 5,
    subject: 'Renewable Energy Technology',
    subjectCode: '3150912',
    subjectSlug: 'renewable-energy-technology',
    year: 2024,
    sessionCode: 'W2024',
    examType: 'Winter End-Sem',
    difficulty: 'GTU Standard',
    solAvailable: true,
    downloadsCount: 3820,
    solvedCount: 9400,
    rating: 4.9,
    pdfSize: '2.4 MB',
    isTrending: true
  },
  {
    id: 'pyq-ee-5-cs',
    title: 'GTU Summer 2024 Control Systems (3150901)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Electrical Engineering',
    branchSlug: 'electrical-engineering',
    semester: 5,
    subject: 'Control Systems',
    subjectCode: '3150901',
    subjectSlug: 'control-systems',
    year: 2024,
    sessionCode: 'S2024',
    examType: 'Summer End-Sem',
    difficulty: 'Hard',
    solAvailable: true,
    downloadsCount: 4120,
    solvedCount: 11200,
    rating: 4.8,
    pdfSize: '2.8 MB',
    isTrending: true
  },
  {
    id: 'pyq-ee-5-ps2',
    title: 'GTU Winter 2024 Power System - II (3150911)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Electrical Engineering',
    branchSlug: 'electrical-engineering',
    semester: 5,
    subject: 'Power System - II',
    subjectCode: '3150911',
    subjectSlug: 'power-systems-2',
    year: 2024,
    sessionCode: 'W2024',
    examType: 'Winter End-Sem',
    difficulty: 'GTU Standard',
    solAvailable: true,
    downloadsCount: 3650,
    solvedCount: 8900,
    rating: 4.9,
    pdfSize: '2.5 MB'
  },
  {
    id: 'pyq-ee-5-mi',
    title: 'GTU Summer 2024 Microcontroller & Interfacing (3150913)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Electrical Engineering',
    branchSlug: 'electrical-engineering',
    semester: 5,
    subject: 'Microcontroller & Interfacing',
    subjectCode: '3150913',
    subjectSlug: 'microcontroller-and-interfacing',
    year: 2024,
    sessionCode: 'S2024',
    examType: 'Summer End-Sem',
    difficulty: 'Medium',
    solAvailable: true,
    downloadsCount: 2980,
    solvedCount: 7800,
    rating: 4.7,
    pdfSize: '2.1 MB'
  },

  // ELECTRICAL ENGINEERING - SEMESTER 3 & 4
  {
    id: 'pyq-ee-3-ctn',
    title: 'GTU Winter 2024 Circuit Theory & Networks (3130906)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Electrical Engineering',
    branchSlug: 'electrical-engineering',
    semester: 3,
    subject: 'Circuit Theory & Networks',
    subjectCode: '3130906',
    subjectSlug: 'circuit-theory-and-networks',
    year: 2024,
    sessionCode: 'W2024',
    examType: 'Winter End-Sem',
    difficulty: 'Hard',
    solAvailable: true,
    downloadsCount: 4100,
    solvedCount: 10400,
    rating: 4.8,
    pdfSize: '2.6 MB'
  },
  {
    id: 'pyq-ee-4-ps1',
    title: 'GTU Summer 2024 Power System - I (3140914)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Electrical Engineering',
    branchSlug: 'electrical-engineering',
    semester: 4,
    subject: 'Power System - I',
    subjectCode: '3140914',
    subjectSlug: 'power-systems-1',
    year: 2024,
    sessionCode: 'S2024',
    examType: 'Summer End-Sem',
    difficulty: 'GTU Standard',
    solAvailable: true,
    downloadsCount: 3780,
    solvedCount: 9100,
    rating: 4.8,
    pdfSize: '2.3 MB'
  },

  // COMPUTER ENGINEERING - SEMESTER 5
  {
    id: 'pyq-cse-5-dbms',
    title: 'GTU Winter 2024 Database Management Systems (3150703)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Computer Engineering',
    branchSlug: 'computer-engineering',
    semester: 5,
    subject: 'Database Management Systems',
    subjectCode: '3150703',
    subjectSlug: 'database-management-systems',
    year: 2024,
    sessionCode: 'W2024',
    examType: 'Winter End-Sem',
    difficulty: 'GTU Standard',
    solAvailable: true,
    downloadsCount: 5600,
    solvedCount: 14500,
    rating: 4.9,
    pdfSize: '2.4 MB',
    isTrending: true
  },
  {
    id: 'pyq-cse-5-daa',
    title: 'GTU Summer 2024 Design & Analysis of Algorithms (3150701)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Computer Engineering',
    branchSlug: 'computer-engineering',
    semester: 5,
    subject: 'Design & Analysis of Algorithms',
    subjectCode: '3150701',
    subjectSlug: 'design-and-analysis-of-algorithms',
    year: 2024,
    sessionCode: 'S2024',
    examType: 'Summer End-Sem',
    difficulty: 'Hard',
    solAvailable: true,
    downloadsCount: 6200,
    solvedCount: 16800,
    rating: 5.0,
    pdfSize: '2.9 MB',
    isTrending: true
  },
  {
    id: 'pyq-cse-5-cn',
    title: 'GTU Winter 2024 Computer Networks (3150710)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Computer Engineering',
    branchSlug: 'computer-engineering',
    semester: 5,
    subject: 'Computer Networks',
    subjectCode: '3150710',
    subjectSlug: 'computer-networks',
    year: 2024,
    sessionCode: 'W2024',
    examType: 'Winter End-Sem',
    difficulty: 'Medium',
    solAvailable: true,
    downloadsCount: 4800,
    solvedCount: 12100,
    rating: 4.8,
    pdfSize: '2.5 MB'
  },

  // COMPUTER ENGINEERING - SEMESTER 3 & 4
  {
    id: 'pyq-cse-3-dsa',
    title: 'GTU Summer 2024 Data Structures & Algorithms (3130702)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Computer Engineering',
    branchSlug: 'computer-engineering',
    semester: 3,
    subject: 'Data Structures & Algorithms',
    subjectCode: '3130702',
    subjectSlug: 'data-structures-and-algorithms',
    year: 2024,
    sessionCode: 'S2024',
    examType: 'Summer End-Sem',
    difficulty: 'Hard',
    solAvailable: true,
    downloadsCount: 6800,
    solvedCount: 18200,
    rating: 4.9,
    pdfSize: '3.1 MB',
    isTrending: true
  },
  {
    id: 'pyq-cse-4-os',
    title: 'GTU Winter 2023 Operating Systems Architecture (3140702)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Computer Engineering',
    branchSlug: 'computer-engineering',
    semester: 4,
    subject: 'Operating Systems',
    subjectCode: '3140702',
    subjectSlug: 'operating-systems',
    year: 2023,
    sessionCode: 'W2023',
    examType: 'Winter End-Sem',
    difficulty: 'GTU Standard',
    solAvailable: true,
    downloadsCount: 4200,
    solvedCount: 11400,
    rating: 4.7,
    pdfSize: '2.8 MB'
  },
  {
    id: 'pyq-cse-4-coa',
    title: 'GTU Summer 2024 Computer Organization & Architecture (3140707)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Computer Engineering',
    branchSlug: 'computer-engineering',
    semester: 4,
    subject: 'Computer Organization & Architecture',
    subjectCode: '3140707',
    subjectSlug: 'computer-organization-and-architecture',
    year: 2024,
    sessionCode: 'S2024',
    examType: 'Summer End-Sem',
    difficulty: 'Hard',
    solAvailable: true,
    downloadsCount: 3900,
    solvedCount: 9800,
    rating: 4.8,
    pdfSize: '2.7 MB'
  },

  // INFORMATION TECHNOLOGY - SEMESTER 3, 4, 5
  {
    id: 'pyq-it-5-wt',
    title: 'GTU Winter 2024 Web Technology (3150709)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Information Technology',
    branchSlug: 'information-technology',
    semester: 5,
    subject: 'Web Technology',
    subjectCode: '3150709',
    subjectSlug: 'web-technology',
    year: 2024,
    sessionCode: 'W2024',
    examType: 'Winter End-Sem',
    difficulty: 'Medium',
    solAvailable: true,
    downloadsCount: 3950,
    solvedCount: 9600,
    rating: 4.8,
    pdfSize: '2.4 MB'
  },
  {
    id: 'pyq-it-5-se',
    title: 'GTU Summer 2024 Software Engineering (3150711)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Information Technology',
    branchSlug: 'information-technology',
    semester: 5,
    subject: 'Software Engineering',
    subjectCode: '3150711',
    subjectSlug: 'software-engineering',
    year: 2024,
    sessionCode: 'S2024',
    examType: 'Summer End-Sem',
    difficulty: 'GTU Standard',
    solAvailable: true,
    downloadsCount: 3400,
    solvedCount: 8800,
    rating: 4.7,
    pdfSize: '2.3 MB'
  },

  // MECHANICAL ENGINEERING - SEMESTER 3, 4, 5
  {
    id: 'pyq-me-5-ht',
    title: 'GTU Winter 2024 Heat Transfer (3151909)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Mechanical Engineering',
    branchSlug: 'mechanical-engineering',
    semester: 5,
    subject: 'Heat Transfer',
    subjectCode: '3151909',
    subjectSlug: 'heat-transfer',
    year: 2024,
    sessionCode: 'W2024',
    examType: 'Winter End-Sem',
    difficulty: 'Hard',
    solAvailable: true,
    downloadsCount: 3500,
    solvedCount: 8700,
    rating: 4.8,
    pdfSize: '2.9 MB'
  },
  {
    id: 'pyq-me-4-fm',
    title: 'GTU Summer 2024 Fluid Mechanics & Hydraulic Machines (3141906)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Mechanical Engineering',
    branchSlug: 'mechanical-engineering',
    semester: 4,
    subject: 'Fluid Mechanics & Hydraulic Machines',
    subjectCode: '3141906',
    subjectSlug: 'fluid-mechanics',
    year: 2024,
    sessionCode: 'S2024',
    examType: 'Summer End-Sem',
    difficulty: 'Hard',
    solAvailable: true,
    downloadsCount: 3900,
    solvedCount: 9400,
    rating: 4.9,
    pdfSize: '3.0 MB'
  },

  // CIVIL ENGINEERING - SEMESTER 3, 4, 5
  {
    id: 'pyq-ce-5-he',
    title: 'GTU Winter 2024 Highway Engineering (3150611)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Civil Engineering',
    branchSlug: 'civil-engineering',
    semester: 5,
    subject: 'Highway Engineering',
    subjectCode: '3150611',
    subjectSlug: 'highway-engineering',
    year: 2024,
    sessionCode: 'W2024',
    examType: 'Winter End-Sem',
    difficulty: 'GTU Standard',
    solAvailable: true,
    downloadsCount: 3200,
    solvedCount: 8100,
    rating: 4.7,
    pdfSize: '2.5 MB'
  },
  {
    id: 'pyq-ce-3-mos',
    title: 'GTU Summer 2024 Mechanics of Solids (3130608)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'Civil Engineering',
    branchSlug: 'civil-engineering',
    semester: 3,
    subject: 'Mechanics of Solids',
    subjectCode: '3130608',
    subjectSlug: 'mechanics-of-solids',
    year: 2024,
    sessionCode: 'S2024',
    examType: 'Summer End-Sem',
    difficulty: 'Hard',
    solAvailable: true,
    downloadsCount: 4300,
    solvedCount: 10800,
    rating: 4.9,
    pdfSize: '2.8 MB'
  },

  // 1ST YEAR COMMON ENGINEERING SUBJECTS (SEM 1 & 2)
  {
    id: 'pyq-fe-maths1',
    title: 'GTU Winter 2024 Mathematics - 1 (3110014)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'All Branches (1st Year)',
    branchSlug: 'first-year',
    semester: 1,
    subject: 'Mathematics - 1',
    subjectCode: '3110014',
    subjectSlug: 'mathematics-1',
    year: 2024,
    sessionCode: 'W2024',
    examType: 'Winter End-Sem',
    difficulty: 'Hard',
    solAvailable: true,
    downloadsCount: 8400,
    solvedCount: 22000,
    rating: 5.0,
    pdfSize: '3.4 MB',
    isTrending: true
  },
  {
    id: 'pyq-fe-pps',
    title: 'GTU Summer 2024 Programming for Problem Solving (3110003)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'All Branches (1st Year)',
    branchSlug: 'first-year',
    semester: 1,
    subject: 'Programming for Problem Solving',
    subjectCode: '3110003',
    subjectSlug: 'programming-for-problem-solving',
    year: 2024,
    sessionCode: 'S2024',
    examType: 'Summer End-Sem',
    difficulty: 'GTU Standard',
    solAvailable: true,
    downloadsCount: 7600,
    solvedCount: 19500,
    rating: 4.9,
    pdfSize: '2.7 MB'
  },
  {
    id: 'pyq-fe-bee',
    title: 'GTU Winter 2024 Basic Electrical Engineering (3110005)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'All Branches (1st Year)',
    branchSlug: 'first-year',
    semester: 1,
    subject: 'Basic Electrical Engineering',
    subjectCode: '3110005',
    subjectSlug: 'basic-electrical-engineering',
    year: 2024,
    sessionCode: 'W2024',
    examType: 'Winter End-Sem',
    difficulty: 'Medium',
    solAvailable: true,
    downloadsCount: 6900,
    solvedCount: 17200,
    rating: 4.8,
    pdfSize: '2.6 MB'
  },
  {
    id: 'pyq-fe-physics',
    title: 'GTU Summer 2024 Engineering Physics (3110018)',
    university: 'Gujarat Technological University (GTU)',
    branch: 'All Branches (1st Year)',
    branchSlug: 'first-year',
    semester: 2,
    subject: 'Engineering Physics',
    subjectCode: '3110018',
    subjectSlug: 'physics',
    year: 2024,
    sessionCode: 'S2024',
    examType: 'Summer End-Sem',
    difficulty: 'GTU Standard',
    solAvailable: true,
    downloadsCount: 6100,
    solvedCount: 15400,
    rating: 4.8,
    pdfSize: '2.5 MB'
  },

  // GATE NATIONAL EXAMS
  {
    id: 'pyq-gate-cse-2024',
    title: 'GATE 2024 Official Computer Science & IT Solved Paper',
    university: 'IIT IISc GATE Committee',
    branch: 'Computer Engineering',
    branchSlug: 'computer-engineering',
    semester: 7,
    subject: 'Computer Science (All Core)',
    subjectCode: 'GATE-CSE',
    subjectSlug: 'gate-computer-science',
    year: 2024,
    sessionCode: 'GATE2024',
    examType: 'GATE Official',
    difficulty: 'Hard',
    solAvailable: true,
    downloadsCount: 9200,
    solvedCount: 26500,
    rating: 5.0,
    pdfSize: '5.2 MB',
    isTrending: true
  },
  {
    id: 'pyq-gate-ee-2024',
    title: 'GATE 2024 Official Electrical Engineering Solved Paper',
    university: 'IIT IISc GATE Committee',
    branch: 'Electrical Engineering',
    branchSlug: 'electrical-engineering',
    semester: 7,
    subject: 'Electrical Engineering (All Core)',
    subjectCode: 'GATE-EE',
    subjectSlug: 'gate-electrical-engineering',
    year: 2024,
    sessionCode: 'GATE2024',
    examType: 'GATE Official',
    difficulty: 'Hard',
    solAvailable: true,
    downloadsCount: 8100,
    solvedCount: 21400,
    rating: 5.0,
    pdfSize: '4.8 MB',
    isTrending: true
  }
];

const mapBranchToBranchSlug = (branch: string): string => {
  const b = (branch || '').toLowerCase();
  if (b.includes('electrical') || b === 'ee') return 'electrical-engineering';
  if (b.includes('computer') || b === 'cse') return 'computer-engineering';
  if (b.includes('information') || b === 'it') return 'information-technology';
  if (b.includes('mechanical') || b === 'me') return 'mechanical-engineering';
  if (b.includes('civil') || b === 'ce') return 'civil-engineering';
  if (b.includes('electronics') || b === 'ece') return 'electronics-and-communication';
  if (b.includes('first') || b.includes('common')) return 'first-year';
  return 'computer-engineering';
};

export default function PyqQuizHub() {
  const { academicProfile } = useStudentAcademic();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'papers' | 'quiz'>('papers');

  // Filter States - auto-personalized to student's branch & sem
  const studentBranchSlug = useMemo(() => {
    return mapBranchToBranchSlug(academicProfile?.branchId || academicProfile?.branchName || 'computer-engineering');
  }, [academicProfile]);

  const studentSem = useMemo(() => {
    return academicProfile?.semester ? String(academicProfile.semester) : 'all';
  }, [academicProfile]);

  const [selectedUniversity, setSelectedUniversity] = useState<string>('GTU');
  const [selectedBranch, setSelectedBranch] = useState<string>(studentBranchSlug);
  const [selectedSem, setSelectedSem] = useState<string>(studentSem);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedExamType, setSelectedExamType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Synchronize when student academic profile loads
  useEffect(() => {
    if (academicProfile?.branchId || academicProfile?.branchName) {
      setSelectedBranch(mapBranchToBranchSlug(academicProfile.branchId || academicProfile.branchName || ''));
    }
    if (academicProfile?.semester) {
      setSelectedSem(String(academicProfile.semester));
    }
  }, [academicProfile]);

  // Live Canonical Tree Subjects
  const [canonicalSubjects, setCanonicalSubjects] = useState<CanonicalSubjectTreeItem[]>([]);
  const [loadingCanonical, setLoadingCanonical] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;
    setLoadingCanonical(true);

    const queryBranch = selectedBranch === 'all' ? undefined : selectedBranch;
    const querySem = selectedSem === 'all' ? undefined : Number(selectedSem);

    gtuPyqClient.getCanonicalTree({
      branch: queryBranch,
      semester: querySem,
      limit: 20
    })
      .then(res => {
        if (!isCancelled && res?.canonicalSubjects) {
          setCanonicalSubjects(res.canonicalSubjects);
        }
      })
      .catch(err => {
        console.warn('Could not fetch canonical subjects tree in PyqQuizHub:', err);
      })
      .finally(() => {
        if (!isCancelled) setLoadingCanonical(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedBranch, selectedSem]);

  // Modals & Bookmarks
  const { isBookmarked, addBookmark, removeBookmark } = useLearningEcosystem();
  const [previewPaper, setPreviewPaper] = useState<PyqPaperItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Interactive Quiz States
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleBookmark = (paper: PyqPaperItem) => {
    if (isBookmarked(paper.id)) {
      removeBookmark(paper.id);
      triggerToast('Removed from Saved Bookmarks');
    } else {
      addBookmark({
        targetId: paper.id,
        title: paper.title,
        url: `/dashboard/pyq-hub?paper=${paper.id}`,
        itemType: 'pyq',
        subjectCode: paper.subjectCode,
        semester: paper.semester
      });
      triggerToast('Saved to My Library');
    }
  };

  const filteredPapers = useMemo(() => {
    return COMPREHENSIVE_GTU_PYQ_REGISTRY.filter(paper => {
      const matchesSearch = 
        paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.subjectCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesUni = selectedUniversity === 'all' || paper.university.includes(selectedUniversity);
      const matchesBranch = selectedBranch === 'all' || paper.branchSlug === selectedBranch || paper.branchSlug === 'first-year';
      const matchesSem = selectedSem === 'all' || paper.semester === Number(selectedSem);
      const matchesYear = selectedYear === 'all' || paper.year === Number(selectedYear);
      const matchesType = selectedExamType === 'all' || paper.examType === selectedExamType;

      return matchesSearch && matchesUni && matchesBranch && matchesSem && matchesYear && matchesType;
    });
  }, [searchQuery, selectedUniversity, selectedBranch, selectedSem, selectedYear, selectedExamType]);

  const questionsList: Question[] = useMemo(() => {
    let list = getAllPyqQuestions();
    return list.filter(q => {
      const matchBranch = selectedBranch === 'all' || 
        (selectedBranch.includes('computer') && q.tags.includes('CSE')) ||
        (selectedBranch.includes('mechanical') && q.tags.includes('ME')) ||
        (selectedBranch.includes('civil') && q.tags.includes('CE')) ||
        (selectedBranch.includes('electrical') && q.tags.includes('EE'));

      const matchCategory = selectedCategory === 'all' || q.questionCategory === selectedCategory;
      const matchSource = selectedSource === 'all' || q.examSource === selectedSource;

      return matchBranch && matchCategory && matchSource;
    });
  }, [selectedBranch, selectedCategory, selectedSource]);

  const currentQuestion = questionsList[activeQuestionIndex] || questionsList[0];

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto text-left font-sans text-slate-900 dark:text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner with Personalization Tag */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-navy-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                <span>Official GTU & GATE Question Archives (2018–2025)</span>
              </span>
              {academicProfile?.branchName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-extrabold">
                  <ShieldCheck className="h-3 w-3" /> Personalized for {academicProfile.branchName} (Sem {academicProfile.semester || 1})
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Previous Year Question (PYQ) Vault & Solved Papers
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore official GTU End-Semester Winter & Summer session question papers with verified step-by-step solutions, exam module trends, and high-speed PDF downloads.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab('papers')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'papers'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Question Papers Archive
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'quiz'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Interactive PYQ Quiz Mode
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: QUESTION PAPERS ARCHIVE */}
      {activeTab === 'papers' && (
        <div className="space-y-6">
          {/* Multi-Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search papers by subject, GTU code (e.g. 3150912), or exam session..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              {/* Dropdowns */}
              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
                {/* Branch selector */}
                <select
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">All Departments</option>
                  <option value="electrical-engineering">Electrical Engineering (EE)</option>
                  <option value="computer-engineering">Computer Engineering (CSE)</option>
                  <option value="information-technology">Information Technology (IT)</option>
                  <option value="mechanical-engineering">Mechanical Engineering (ME)</option>
                  <option value="civil-engineering">Civil Engineering (CE)</option>
                  <option value="electronics-and-communication">Electronics & Comm. (ECE)</option>
                  <option value="first-year">1st Year Common</option>
                </select>

                {/* Semester selector */}
                <select
                  value={selectedSem}
                  onChange={e => setSelectedSem(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={String(s)}>Semester {s}</option>
                  ))}
                </select>

                {/* Year */}
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">All Years</option>
                  {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>

                {/* Exam type */}
                <select
                  value={selectedExamType}
                  onChange={e => setSelectedExamType(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">All Exam Sessions</option>
                  <option value="Winter End-Sem">Winter End-Sem</option>
                  <option value="Summer End-Sem">Summer End-Sem</option>
                  <option value="GATE Official">GATE Official</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Direct Browse Link Banner */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40 text-xs text-orange-900 dark:text-orange-200">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-orange shrink-0" />
              <span>
                Browsing <strong>{selectedBranch === 'all' ? 'All Engineering Departments' : selectedBranch.replace(/-/g, ' ').toUpperCase()}</strong> • <strong>{selectedSem === 'all' ? 'All Semesters' : `Semester ${selectedSem}`}</strong>
              </span>
            </div>
            {selectedBranch !== 'all' && selectedSem !== 'all' && (
              <Link
                to={browsePaths.semester('pyq', selectedBranch, Number(selectedSem))}
                className="font-extrabold text-brand-orange hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Open Dedicated Semester Archive</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Papers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPapers.length === 0 ? (
              <div className="col-span-full py-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-dashed border-slate-200 dark:border-slate-800">
                <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">No question papers match this filter</h4>
                <p className="text-xs text-slate-400">Try adjusting your department, semester, or search keywords.</p>
                <button
                  onClick={() => {
                    setSelectedBranch('all');
                    setSelectedSem('all');
                    setSelectedYear('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-brand-orange text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredPapers.map(paper => {
                const officialGtuPdfUrl = paper.subjectCode.startsWith('GATE') 
                  ? GTU_PAPERS_ARCHIVE_URL 
                  : getGtuPyqUrl(paper.sessionCode, 'BE', paper.subjectCode);

                const subjectArchiveUrl = browsePaths.subject(
                  'pyq', 
                  paper.branchSlug, 
                  paper.semester, 
                  paper.subjectSlug
                );

                return (
                  <div
                    key={paper.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group relative"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950 text-brand-orange text-[10px] font-black uppercase tracking-wider border border-orange-200/40">
                          {paper.examType} • {paper.year}
                        </span>

                        <button
                          onClick={() => toggleBookmark(paper)}
                          className={`p-2 rounded-xl border transition cursor-pointer ${isBookmarked(paper.id) ? 'bg-orange-50 text-brand-orange border-brand-orange' : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-brand-orange'}`}
                          title={isBookmarked(paper.id) ? "Remove Bookmark" : "Save to My Library"}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked(paper.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-brand-orange transition">
                          {paper.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {paper.subject} ({paper.subjectCode}) • Sem {paper.semester}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1 text-emerald-600 font-extrabold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Official GTU Verified
                        </span>
                        <span>{paper.downloadsCount.toLocaleString()} Downloads</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setPreviewPaper(paper)}
                          className="py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-extrabold text-xs shadow-sm hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer border-none"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        <a
                          href={officialGtuPdfUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer no-underline border-none"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                      </div>

                      <Link
                        to={subjectArchiveUrl}
                        className="w-full py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-brand-orange hover:border-brand-orange/40 text-[11px] font-bold transition flex items-center justify-center gap-1 no-underline"
                      >
                        <span>View All Sessions for Subject</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: INTERACTIVE QUIZ MODE */}
      {activeTab === 'quiz' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold text-slate-500 font-mono">
                Question {activeQuestionIndex + 1} of {questionsList.length}
              </span>

              <div className="flex items-center gap-1.5 overflow-x-auto max-w-md">
                {questionsList.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeQuestionIndex === idx
                        ? 'bg-brand-orange text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {currentQuestion && (
              <QuestionRenderer
                question={currentQuestion}
                selectedAnswer={userAnswers[currentQuestion.id]}
                onChange={val => setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: val }))}
                showFeedback={showFeedback}
                isCorrect={
                  showFeedback
                    ? String(userAnswers[currentQuestion.id]).trim().toLowerCase() === String(currentQuestion.correctAnswer).trim().toLowerCase()
                    : null
                }
              />
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                disabled={activeQuestionIndex === 0}
                onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFeedback(!showFeedback)}
                  className="px-4 py-2 border border-orange-500/40 text-brand-orange text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {showFeedback ? 'Hide Solutions' : 'Check Solution'}
                </button>

                {activeQuestionIndex < questionsList.length - 1 ? (
                  <button
                    onClick={() => setActiveQuestionIndex(prev => Math.min(questionsList.length - 1, prev + 1))}
                    className="px-5 py-2 bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer border-none"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    onClick={() => setShowFeedback(true)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer border-none"
                  >
                    Submit & View Score
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewPaper && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 w-full max-w-3xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="px-2 py-0.5 bg-orange-100 text-brand-orange text-[10px] font-black rounded uppercase">
                  {previewPaper.examType} • {previewPaper.year}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  {previewPaper.title}
                </h3>
              </div>
              <button onClick={() => setPreviewPaper(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <FileDown className="w-10 h-10 text-brand-orange mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">GTU Official Question Paper & Verified Solution Key</h4>
              <p className="text-xs text-slate-500">
                Subject Code: <strong>{previewPaper.subjectCode}</strong> • Session: <strong>{previewPaper.sessionCode}</strong> • Size: {previewPaper.pdfSize}
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> 100% Direct Official GTU Source Link
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Link
                to={browsePaths.subject('pyq', previewPaper.branchSlug, previewPaper.semester, previewPaper.subjectSlug)}
                className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1"
                onClick={() => setPreviewPaper(null)}
              >
                <span>Explore Full {previewPaper.subject} PYQ History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setPreviewPaper(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Close
                </button>
                <a
                  href={getGtuPyqUrl(previewPaper.sessionCode, 'BE', previewPaper.subjectCode)}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-brand-orange hover:bg-orange-600 text-white shadow-md transition cursor-pointer no-underline border-none flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Official PDF</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
