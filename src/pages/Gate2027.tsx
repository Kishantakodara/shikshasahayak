import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  GraduationCap, 
  Clock, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  XCircle,
  Calculator, 
  AlertCircle, 
  BookOpen, 
  Info, 
  Fingerprint, 
  TrendingUp, 
  Award,
  Briefcase,
  MapPin,
  Camera,
  FileText,
  FileCheck,
  FolderDown,
  Search,
  Sparkles,
  Zap,
  HelpCircle,
  Layers,
  CheckSquare
} from 'lucide-react';
import { OFFICIAL_SYLLABUS_MAP, OFFICIAL_PYQ_MAP } from '../data/gateOfficialLinks';

// Exhaustive Official 30 Primary Test Papers & Permitted Secondary Combinations (from gate2027.iitm.ac.in/two_paper_combinations)
const PAPER_COMBINATIONS: Record<string, { name: string; secondary: string[] }> = {
  'AE': { name: 'Aerospace Engineering', secondary: ['CE', 'ME', 'XE'] },
  'AG': { name: 'Agricultural Engineering', secondary: ['CE'] },
  'AR': { name: 'Architecture and Planning', secondary: ['CE', 'GE'] },
  'BM': { name: 'Biomedical Engineering', secondary: ['BT', 'IN'] },
  'BT': { name: 'Biotechnology', secondary: ['BM', 'XL'] },
  'CE': { name: 'Civil Engineering', secondary: ['AE', 'AG', 'AR', 'ES', 'GE', 'NM', 'XE'] },
  'CH': { name: 'Chemical Engineering', secondary: ['ES', 'PE', 'XE'] },
  'CS': { name: 'Computer Science and Information Technology', secondary: ['DA', 'EC', 'GE', 'MA', 'PH', 'RA', 'ST', 'ME'] },
  'CY': { name: 'Chemistry', secondary: ['XE', 'XL'] },
  'DA': { name: 'Data Science and Artificial Intelligence', secondary: ['CS', 'EC', 'EE', 'MA', 'ME', 'PH', 'RA', 'ST', 'XE'] },
  'EC': { name: 'Electronics and Communication Engineering', secondary: ['CS', 'DA', 'EE', 'IN', 'PH'] },
  'EE': { name: 'Electrical Engineering', secondary: ['DA', 'EC', 'IN', 'PH', 'RA'] },
  'ES': { name: 'Environmental Science & Engineering', secondary: ['CE', 'CH', 'GE'] },
  'EY': { name: 'Ecology and Evolution', secondary: ['XL'] },
  'GE': { name: 'Geomatics Engineering', secondary: ['AR', 'CE', 'CS', 'ES', 'GG'] },
  'GG': { name: 'Geology and Geophysics', secondary: ['GE'] },
  'IN': { name: 'Instrumentation Engineering', secondary: ['BM', 'EC', 'EE', 'ME'] },
  'MA': { name: 'Mathematics', secondary: ['CS', 'DA', 'PH', 'ST'] },
  'ME': { name: 'Mechanical Engineering', secondary: ['AE', 'DA', 'IN', 'NM', 'PI', 'XE', 'RA', 'CS'] },
  'MN': { name: 'Mining Engineering', secondary: [] },
  'MT': { name: 'Metallurgical Engineering', secondary: ['XE'] },
  'NM': { name: 'Naval Architecture and Marine Engineering', secondary: ['CE', 'ME', 'XE'] },
  'PE': { name: 'Petroleum Engineering', secondary: ['CH'] },
  'PH': { name: 'Physics', secondary: ['CS', 'DA', 'EC', 'EE', 'MA', 'XE'] },
  'PI': { name: 'Production & Industrial Engineering', secondary: ['ME', 'XE'] },
  'RA': { name: 'Robotics & Automation', secondary: ['EE', 'ME', 'DA', 'CS'] },
  'ST': { name: 'Statistics', secondary: ['CS', 'DA', 'MA', 'XH'] },
  'XE': { name: 'Engineering Sciences', secondary: ['AE', 'CE', 'CH', 'CY', 'DA', 'ME', 'MT', 'NM', 'PH', 'PI'] },
  'XH': { name: 'Humanities & Social Sciences', secondary: ['ST'] },
  'XL': { name: 'Life Sciences', secondary: ['BT', 'CY', 'EY'] }
};

// Official List of ALL 38 GATE Test Papers & Specialization Slots
const ALL_GATE_BRANCHES = [
  { code: 'CS-1', name: 'Computer Science and Information Technology', category: 'Computing & AI', isNew: false },
  { code: 'CS-2', name: 'Computer Science and Information Technology', category: 'Computing & AI', isNew: false },
  { code: 'DA', name: 'Data Science and Artificial Intelligence', category: 'Computing & AI', isNew: false },
  { code: 'RA', name: 'Robotics & Automation', category: 'Engineering Specialties', isNew: true },
  { code: 'EC', name: 'Electronics and Communication Engineering', category: 'Electrical & Electronics', isNew: false },
  { code: 'EE', name: 'Electrical Engineering', category: 'Electrical & Electronics', isNew: false },
  { code: 'IN', name: 'Instrumentation Engineering', category: 'Electrical & Electronics', isNew: false },
  { code: 'ME', name: 'Mechanical Engineering', category: 'Mechanical & Civil', isNew: false },
  { code: 'CE-1', name: 'Civil Engineering', category: 'Mechanical & Civil', isNew: false },
  { code: 'CE-2', name: 'Civil Engineering', category: 'Mechanical & Civil', isNew: false },
  { code: 'PI', name: 'Production & Industrial Engineering', category: 'Mechanical & Civil', isNew: false },
  { code: 'NM', name: 'Naval Architecture and Marine Engineering', category: 'Mechanical & Civil', isNew: false },
  { code: 'CH', name: 'Chemical Engineering', category: 'Chemical & Bio', isNew: false },
  { code: 'BT', name: 'Biotechnology', category: 'Chemical & Bio', isNew: false },
  { code: 'BM', name: 'Biomedical Engineering', category: 'Chemical & Bio', isNew: false },
  { code: 'AE', name: 'Aerospace Engineering', category: 'Engineering Specialties', isNew: false },
  { code: 'AG', name: 'Agricultural Engineering', category: 'Engineering Specialties', isNew: false },
  { code: 'AR', name: 'Architecture and Planning', category: 'Engineering Specialties', isNew: false },
  { code: 'ES', name: 'Environmental Science & Engineering', category: 'Engineering Specialties', isNew: false },
  { code: 'GE', name: 'Geomatics Engineering', category: 'Engineering Specialties', isNew: false },
  { code: 'MN', name: 'Mining Engineering', category: 'Engineering Specialties', isNew: false },
  { code: 'MT', name: 'Metallurgical Engineering', category: 'Engineering Specialties', isNew: false },
  { code: 'PE', name: 'Petroleum Engineering', category: 'Engineering Specialties', isNew: false },
  { code: 'TF', name: 'Textile Engineering and Fibre Science', category: 'Engineering Specialties', isNew: false },
  { code: 'XE', name: 'Engineering Sciences', category: 'Engineering Specialties', isNew: false },
  { code: 'CY', name: 'Chemistry', category: 'Sciences & Mathematics', isNew: false },
  { code: 'MA', name: 'Mathematics', category: 'Sciences & Mathematics', isNew: false },
  { code: 'PH', name: 'Physics', category: 'Sciences & Mathematics', isNew: false },
  { code: 'ST', name: 'Statistics', category: 'Sciences & Mathematics', isNew: false },
  { code: 'GG-1', name: 'Geology and Geophysics - Geology', category: 'Sciences & Mathematics', isNew: false },
  { code: 'GG-2', name: 'Geology and Geophysics - Geophysics', category: 'Sciences & Mathematics', isNew: false },
  { code: 'EY', name: 'Ecology and Evolution', category: 'Life & Humanities', isNew: false },
  { code: 'XL', name: 'Life Sciences', category: 'Life & Humanities', isNew: false },
  { code: 'XH-C1', name: 'Humanities & Social Sciences - Economics', category: 'Life & Humanities', isNew: false },
  { code: 'XH-C2', name: 'Humanities & Social Sciences - English', category: 'Life & Humanities', isNew: false },
  { code: 'XH-C3', name: 'Humanities & Social Sciences - Linguistics', category: 'Life & Humanities', isNew: false },
  { code: 'XH-C4', name: 'Humanities & Social Sciences - Philosophy', category: 'Life & Humanities', isNew: false },
  { code: 'XH-C5', name: 'Humanities & Social Sciences - Psychology', category: 'Life & Humanities', isNew: false },
  { code: 'XH-C6', name: 'Humanities & Social Sciences - Sociology', category: 'Life & Humanities', isNew: false }
];

// Exact Scraped Official PDF Link Resolvers
export const getSyllabusUrl = (code: string): string => {
  if (OFFICIAL_SYLLABUS_MAP[code]) return OFFICIAL_SYLLABUS_MAP[code];
  const cleanCode = code.replace('-', '').split('-')[0];
  return `https://gate2027.iitm.ac.in/static/doc/GATE2027_Syllabus/${cleanCode}_GATE2027_Syllabus.pdf`;
};

export const getQuestionPaperUrl = (code: string, year: string, name: string): string => {
  const yearData = OFFICIAL_PYQ_MAP[year];
  if (yearData && yearData.qp) {
    if (yearData.qp[name]) return yearData.qp[name];
    if (yearData.qp[code]) return yearData.qp[code];
  }
  const cleanCode = code.replace('-', '');
  if (year === '2026') return `https://gate2027.iitm.ac.in/static/doc/download/2026/QPs/${cleanCode}.pdf`;
  if (year === '2025') return `https://gate2027.iitm.ac.in/static/doc/download/2025/${cleanCode}2025.pdf`;
  if (year === '2024') return `https://gate2027.iitm.ac.in/static/doc/download/2024/${cleanCode}24S1.pdf`;
  if (year === '2023') return `https://gate2027.iitm.ac.in/static/doc/download/2023/${cleanCode.toLowerCase()}_2023.pdf`;
  if (year === '2022') return `https://gate2027.iitm.ac.in/static/doc/download/2022/${cleanCode.toLowerCase()}_2022.pdf`;
  if (year === '2021') return `https://gate2027.iitm.ac.in/static/doc/download/2021/${cleanCode.toLowerCase()}_2021.pdf`;
  return `https://gate2027.iitm.ac.in/download`;
};

export const getAnswerKeyUrl = (code: string, year: string, name: string): string => {
  const yearData = OFFICIAL_PYQ_MAP[year];
  if (yearData && yearData.key) {
    if (yearData.key[code]) return yearData.key[code];
    if (yearData.key[name]) return yearData.key[name];
  }
  const cleanCode = code.replace('-', '');
  if (year === '2026') return `https://gate2027.iitm.ac.in/static/doc/download/2026/Keys/${cleanCode}_Keys.pdf`;
  if (year === '2025') return `https://gate2027.iitm.ac.in/static/doc/download/2025_Key/${cleanCode}_Keys.pdf`;
  if (year === '2024') return `https://gate2027.iitm.ac.in/static/doc/download/2024/${cleanCode}FinalAnswerKey.pdf`;
  if (year === '2023') return `https://gate2027.iitm.ac.in/static/doc/download/Answer_keys2023/${cleanCode.toUpperCase()}_ANS_GATE2023.pdf`;
  if (year === '2022') return `https://gate2027.iitm.ac.in/static/doc/download/Answer_keys2022/${cleanCode.toLowerCase()}_2022.pdf`;
  if (year === '2021') return `https://gate2027.iitm.ac.in/static/doc/download/Answer_keys2021/${cleanCode.toLowerCase()}_2021.pdf`;
  return `https://gate2027.iitm.ac.in/download`;
};

// Official Paper Pattern Tables Data
const OFFICIAL_PATTERN_PARTICULARS = [
  { item: 'Mode of Examination', value: 'Computer Based Test (CBT)' },
  { item: 'Language of Examination', value: 'English' },
  { item: 'Duration', value: '3 Hours (180 Minutes)*' },
  { item: 'Number of Papers (Subjects)', value: '30 test papers' },
  { item: 'Sections', value: "General Aptitude (GA) + Candidate's Selected Subject(s)" },
  { item: 'Type of Questions', value: '(a) Multiple Choice Question (MCQ)\n(b) Multiple Select Question (MSQ)\n(c) Numerical Answer Type (NAT)' },
  { item: 'Testing of Abilities', value: '(a) Recall\n(b) Comprehension\n(c) Application\n(d) Analysis & Synthesis' }
];

const OFFICIAL_PAPER_STRUCTURE_TABLE = [
  {
    code: 'AE, AG, BM, BT, CE, CH, CS, EC, EE, ES, IN, ME, MN, MT, NM, PE, PI',
    ga: '15',
    common: '85 (includes 13 marks Engineering Mathematics)',
    optional: '--',
    total: '100',
    time: '180'
  },
  {
    code: 'CY, DA, EY, MA, PH, ST',
    ga: '15',
    common: '85',
    optional: '--',
    total: '100',
    time: '180'
  },
  {
    code: 'AR (Architecture & Planning)',
    ga: '15',
    common: '60 (Part A)',
    optional: '25 (Part B1 - Architecture OR B2 - Planning)',
    total: '100',
    time: '180'
  },
  {
    code: 'GE (Geomatics Engineering)',
    ga: '15',
    common: '55 (Part A)',
    optional: '30 (Part B1 - Surveying & Mapping OR B2 - Image Processing)',
    total: '100',
    time: '180'
  },
  {
    code: 'GG (Geology & Geophysics)',
    ga: '15',
    common: '25 (Part A)',
    optional: '60 (Part B1 - Geology OR B2 - Geophysics chosen during application)',
    total: '100',
    time: '180'
  },
  {
    code: 'RA (Robotics & Automation - New)',
    ga: '15',
    common: '60 (Part A)',
    optional: '25 (Part B1 - Electrical OR B2 - Mechanical)',
    total: '100',
    time: '180'
  },
  {
    code: 'XE (Engineering Sciences)',
    ga: '15',
    common: '15 (XE0 - Engg Mathematics)',
    optional: '70 (Select any TWO sections of 35 marks during exam)',
    total: '100',
    time: '180'
  },
  {
    code: 'XH (Humanities & Social Sciences)',
    ga: '15',
    common: '25 (XH0 - Reasoning & Comprehension)',
    optional: '60 (Select any ONE section C1 to C6 at time of application)',
    total: '100',
    time: '180'
  },
  {
    code: 'XL (Life Sciences)',
    ga: '15',
    common: '25 (XL0 - Chemistry)',
    optional: '60 (Select any TWO sections P to U of 30 marks during exam)',
    total: '100',
    time: '180'
  }
];

const Gate2027: React.FC = () => {
  // Active Tab State
  const [activeTab, setActiveTab] = useState<
    'opportunities' | 'eligibility' | 'syllabus' | 'pyqs' | 'pattern' | 'fees' | 'cities' | 'photo' | 'documents'
  >('opportunities');

  // Ticker states
  const [timeLeftReg, setTimeLeftReg] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [timeLeftExam, setTimeLeftExam] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Eligibility Calculator States
  const [degreeYear, setDegreeYear] = useState('3rd Year');
  const [degreeStatus, setDegreeStatus] = useState('Undergraduate');
  const [calculatedEligibility, setCalculatedEligibility] = useState<{ eligible: boolean; message: string } | null>(null);

  // Paper Combination States
  const [primaryPaper, setPrimaryPaper] = useState('CS');

  // Syllabus Search Filter
  const [syllabusSearch, setSyllabusSearch] = useState('');

  // PYQ Filter States
  const [pyqSelectedYear, setPyqSelectedYear] = useState('2026');
  const [pyqSearch, setPyqSearch] = useState('');

  // Smooth scroll to active tabs section
  const handleTabChange = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    const element = document.getElementById('gate-2027-tabs-bar');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Timer Calculations
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const regOpenTime = new Date('2026-08-14T00:00:00').getTime();
      const examStartTime = new Date('2027-02-06T00:00:00').getTime();

      const regDiff = regOpenTime - now;
      const examDiff = examStartTime - now;

      if (regDiff > 0) {
        setTimeLeftReg({
          days: Math.floor(regDiff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((regDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((regDiff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((regDiff % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeftReg({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }

      if (examDiff > 0) {
        setTimeLeftExam({
          days: Math.floor(examDiff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((examDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((examDiff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((examDiff % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeftExam({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate Eligibility on Input Change
  const checkEligibility = () => {
    if (degreeStatus === 'Graduated') {
      setCalculatedEligibility({
        eligible: true,
        message: 'Eligible! You have already completed your degree. There is no age limit or minimum percentage required to appear for GATE 2027.'
      });
    } else if (degreeYear === '3rd Year' || degreeYear === '4th Year+') {
      setCalculatedEligibility({
        eligible: true,
        message: 'Eligible! Currently studying in the 3rd or higher year of any undergraduate program makes you eligible for GATE 2027.'
      });
    } else {
      setCalculatedEligibility({
        eligible: false,
        message: 'Not Eligible Yet. Candidates must be in their 3rd or higher year of an undergraduate course to appear for the exam.'
      });
    }
  };

  // Filtered Branch Syllabi List
  const filteredBranches = ALL_GATE_BRANCHES.filter(
    b => b.code.toLowerCase().includes(syllabusSearch.toLowerCase()) || 
         b.name.toLowerCase().includes(syllabusSearch.toLowerCase()) ||
         b.category.toLowerCase().includes(syllabusSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up">
      {/* Back to Home & Portal Title */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-orange hover:text-brand-hover mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Homepage
        </Link>
        <div>
          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-950/40 text-brand-orange text-xs font-bold rounded-full uppercase tracking-wider">
            Organized by IIT Madras
          </span>
          <h1 className="text-4xl font-display font-bold text-navy-900 dark:text-white mt-2 tracking-tight">
            GATE 2027 Official Guidance Hub
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Comprehensive information, timeline tracker, all 38 branch syllabi & PYQs (2021-2026), paper pattern & eligibility checker.
          </p>
        </div>
      </div>

      {/* Grid containing countdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Countdown card 1 */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-gray-100 dark:border-navy-800 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 dark:bg-orange-950/20 rounded-bl-[100px] pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-orange" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Application Registration Opens</span>
            </div>
            <h3 className="text-lg font-bold text-navy-900 dark:text-white">August 14, 2026</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { val: timeLeftReg.days, label: 'Days' },
                { val: timeLeftReg.hours, label: 'Hrs' },
                { val: timeLeftReg.minutes, label: 'Mins' },
                { val: timeLeftReg.seconds, label: 'Secs' }
              ].map((c, i) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-navy-800/50 rounded-2xl border border-gray-100/50 dark:border-navy-800">
                  <span className="text-2xl font-bold text-brand-orange block leading-none">{c.val}</span>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase mt-1.5 block">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Countdown card 2 */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-gray-100 dark:border-navy-800 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 dark:bg-blue-950/20 rounded-bl-[100px] pointer-events-none" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">GATE 2027 Examination Starts</span>
            </div>
            <h3 className="text-lg font-bold text-navy-900 dark:text-white">February 6, 2027</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { val: timeLeftExam.days, label: 'Days' },
                { val: timeLeftExam.hours, label: 'Hrs' },
                { val: timeLeftExam.minutes, label: 'Mins' },
                { val: timeLeftExam.seconds, label: 'Secs' }
              ].map((c, i) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-navy-800/50 rounded-2xl border border-gray-100/50 dark:border-navy-800">
                  <span className="text-2xl font-bold text-blue-500 block leading-none">{c.val}</span>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase mt-1.5 block">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Mobile-Friendly Tabs Pill Bar */}
      <div id="gate-2027-tabs-bar" className="mb-8 p-1.5 bg-gray-100/70 dark:bg-navy-800/60 border border-gray-200/60 dark:border-navy-750 rounded-2xl scroll-mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-1.5">
          {[
            { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
            { id: 'eligibility', label: 'Eligibility', icon: GraduationCap },
            { id: 'syllabus', label: 'Branch Syllabi', icon: BookOpen },
            { id: 'pyqs', label: 'Previous Papers', icon: FolderDown },
            { id: 'pattern', label: 'Paper Pattern', icon: Layers },
            { id: 'fees', label: 'Application Fees', icon: Award },
            { id: 'cities', label: 'Exam Cities', icon: MapPin },
            { id: 'photo', label: 'Photo & Sign', icon: Camera },
            { id: 'documents', label: 'Documents', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand-orange text-white shadow-md shadow-orange-500/20 font-bold scale-[1.02]'
                    : 'text-gray-600 dark:text-gray-300 hover:text-navy-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-navy-700/50'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-brand-orange'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        
        {/* Left/Middle Column (Spans 2/3) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* TAB 1: OPPORTUNITIES */}
          {activeTab === 'opportunities' && (
            <div className="bg-white dark:bg-navy-900 p-8 rounded-3xl border border-gray-100 dark:border-navy-800 shadow-sm space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-brand-orange" /> Career & Higher Education Opportunities
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Qualifying GATE 2027 opens prestigious doorways across government recruitment and postgraduate education.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-navy-800/40 border border-gray-100 dark:border-navy-800 space-y-2">
                  <span className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-brand-orange flex items-center justify-center font-bold">1</span>
                  <h4 className="text-base font-bold text-navy-900 dark:text-white">PSU Recruitments</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Direct recruitment to Group A & B officer cadres in top Public Sector Undertakings (PSUs) such as ONGC, NTPC, GAIL, HPCL, BHEL, DRDO, and BARC using your GATE score card.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-navy-800/40 border border-gray-100 dark:border-navy-800 space-y-2">
                  <span className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-brand-orange flex items-center justify-center font-bold">2</span>
                  <h4 className="text-base font-bold text-navy-900 dark:text-white">M.Tech & Ph.D Admissions</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Secure admissions for Master’s (M.Tech/M.E.) and Direct Ph.D. programs in premier institutes like IISc Bangalore, IITs, NITs, and IIITs with a monthly financial assistantship.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-navy-800/40 border border-gray-100 dark:border-navy-800 space-y-2">
                  <span className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-brand-orange flex items-center justify-center font-bold">3</span>
                  <h4 className="text-base font-bold text-navy-900 dark:text-white">Financial Fellowships</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    The Ministry of Education (MoE) provides regular fellowships (Rs. 12,400/month for M.Tech and up to Rs. 37,000 - 42,000/month for Doctoral candidates) for GATE qualified students.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gray-50 dark:bg-navy-800/40 border border-gray-100 dark:border-navy-800 space-y-2">
                  <span className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-brand-orange flex items-center justify-center font-bold">4</span>
                  <h4 className="text-base font-bold text-navy-900 dark:text-white">Foreign Universities</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Academically elite global universities (like National University of Singapore - NUS, Nanyang Technological University - NTU in Singapore, and TUM in Germany) accept GATE scores for graduate admissions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ELIGIBILITY CRITERIA & ALL 30 TWO-PAPER COMBINATIONS */}
          {activeTab === 'eligibility' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-navy-900 p-8 rounded-3xl border border-gray-100 dark:border-navy-800 shadow-sm">
                <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calculator className="h-6 w-6 text-brand-orange" /> Eligibility Calculator
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Select your academic year and status below to instantly check if you meet the IIT Madras GATE 2027 eligibility constraints.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Current Year of Study</label>
                    <select 
                      value={degreeYear} 
                      onChange={(e) => setDegreeYear(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800 text-sm text-navy-900 dark:text-white focus:outline-none"
                    >
                      <option value="1st Year">1st Year (Undergrad)</option>
                      <option value="2nd Year">2nd Year (Undergrad)</option>
                      <option value="3rd Year">3rd Year (Undergrad)</option>
                      <option value="4th Year+">4th Year & Above (Undergrad)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Enrollment Status</label>
                    <select 
                      value={degreeStatus} 
                      onChange={(e) => setDegreeStatus(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800 text-sm text-navy-900 dark:text-white focus:outline-none"
                    >
                      <option value="Undergraduate">Currently Pursuing Degree</option>
                      <option value="Graduated">Completed / Graduated Degree</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={checkEligibility}
                  className="px-6 py-3 bg-brand-orange hover:bg-brand-hover text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Verify Eligibility Status
                </button>

                {calculatedEligibility && (
                  <div className={`mt-6 p-5 rounded-2xl border flex items-start gap-3 transition-all ${
                    calculatedEligibility.eligible 
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300' 
                      : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300'
                  }`}>
                    {calculatedEligibility.eligible ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold uppercase tracking-wider">
                        {calculatedEligibility.eligible ? 'Eligible Candidate' : 'Ineligible Candidate'}
                      </h4>
                      <p className="text-xs leading-relaxed opacity-90">{calculatedEligibility.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* TWO-PAPER COMBINATIONS — ALL 30 PRIMARY PAPERS (scraped from gate2027.iitm.ac.in/two_paper_combinations) */}
              <div className="bg-white dark:bg-navy-900 p-8 rounded-3xl border border-gray-100 dark:border-navy-800 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="h-6 w-6 text-brand-orange" /> Permitted Two-Paper Combinations (All 30 Primary Papers)
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Candidates are allowed to appear in either one or two test papers. Select any of the 30 primary papers to view permitted secondary options.
                    </p>
                  </div>

                  <a 
                    href="https://gate2027.iitm.ac.in/two_paper_combinations"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-brand-orange text-white font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-brand-hover transition-colors shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" /> Official IITM Combinations
                  </a>
                </div>

                <div className="space-y-4">
                  {/* Dropdown Menu listing ALL 30 Primary Test Papers */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                      Select Primary Paper Code (30 Papers Available)
                    </label>
                    <select 
                      value={primaryPaper} 
                      onChange={(e) => setPrimaryPaper(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800 text-sm text-navy-900 dark:text-white font-semibold focus:outline-none focus:border-brand-orange"
                    >
                      {Object.keys(PAPER_COMBINATIONS).map((code) => (
                        <option key={code} value={code}>
                          {code} — {PAPER_COMBINATIONS[code].name} ({PAPER_COMBINATIONS[code].secondary.length > 0 ? `${PAPER_COMBINATIONS[code].secondary.length} secondary choices` : 'No secondary paper permitted'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Display secondary paper choices */}
                  <div className="p-5 bg-gray-50 dark:bg-navy-800/40 rounded-2xl border border-gray-100/50 dark:border-navy-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Permitted Secondary Papers for <span className="text-brand-orange">{primaryPaper}</span> ({PAPER_COMBINATIONS[primaryPaper]?.name}):
                      </h4>
                      <span className="text-xs font-bold text-navy-900 dark:text-white">
                        {PAPER_COMBINATIONS[primaryPaper]?.secondary.length || 0} Allowed Option(s)
                      </span>
                    </div>

                    {PAPER_COMBINATIONS[primaryPaper]?.secondary.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {PAPER_COMBINATIONS[primaryPaper].secondary.map((secCode) => {
                          const secBranch = ALL_GATE_BRANCHES.find(b => b.code.replace('-', '').split('-')[0] === secCode) || { name: secCode };
                          return (
                            <span 
                              key={secCode} 
                              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                                secCode === 'RA' 
                                  ? 'bg-orange-50 border-brand-orange text-brand-orange dark:bg-orange-950/20' 
                                  : 'bg-white dark:bg-navy-900 border-gray-200 dark:border-navy-700 text-navy-900 dark:text-white'
                              }`}
                            >
                              <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-950/40 text-brand-orange text-[10px] rounded font-extrabold">{secCode}</span>
                              <span>{secBranch.name}</span>
                              {secCode === 'RA' && (
                                <span className="ml-1 text-[8px] bg-brand-orange text-white px-1.5 py-0.2 rounded uppercase animate-pulse">New</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        No secondary test paper is permitted for {primaryPaper} ({PAPER_COMBINATIONS[primaryPaper]?.name}). Candidates selecting {primaryPaper} as primary paper can only appear in 1 test paper.
                      </div>
                    )}
                  </div>

                  {/* Official Guidelines & Notes from IIT Madras */}
                  <div className="p-4 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/30 rounded-2xl space-y-2 text-xs text-gray-600 dark:text-gray-300">
                    <h5 className="font-bold text-brand-orange text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="h-4 w-4" /> Official Two-Paper Examination Rules:
                    </h5>
                    <ul className="list-disc list-inside space-y-1.5 pl-1 leading-relaxed text-[11px]">
                      <li>Combinations other than the listed ones are <strong>NOT allowed</strong> in the initial registration windows.</li>
                      <li>The exam center for the secondary paper may be different (but in the same city) from that for the primary paper due to scheduling feasibility.</li>
                      <li>Additional combinations may be opened at a later date subject to infrastructure availability.</li>
                    </ul>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SYLLABUS OF ALL 38 BRANCH SLOTS WITH OFFICIAL REDIRECT LINKS */}
          {activeTab === 'syllabus' && (
            <div className="bg-white dark:bg-navy-900 p-8 rounded-3xl border border-gray-100 dark:border-navy-800 shadow-sm space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-brand-orange" /> All 38 GATE Papers Official Syllabus Directory
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Select or search any of the 38 GATE papers to redirect directly to its official IIT Madras syllabus PDF.
                  </p>
                </div>
                
                <a 
                  href="https://gate2027.iitm.ac.in/exam_papers_and_syllabus" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-4 py-2 bg-brand-orange text-white font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-brand-hover transition-colors shrink-0"
                >
                  <ExternalLink className="h-4 w-4" /> Official IITM Syllabus Portal
                </a>
              </div>

              {/* Search Filter Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={syllabusSearch}
                  onChange={(e) => setSyllabusSearch(e.target.value)}
                  placeholder="Search 38 branches by code (e.g. CS-1, DA, RA, XH-C1) or title..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-navy-800/60 border border-gray-200 dark:border-navy-700 rounded-xl text-xs text-navy-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange"
                />
              </div>

              {/* Grid of All 38 Branch Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
                {filteredBranches.map(branch => {
                  const directSyllabusPdf = getSyllabusUrl(branch.code);
                  return (
                    <div 
                      key={branch.code}
                      className="p-4 rounded-2xl bg-gray-50 dark:bg-navy-800/40 border border-gray-100 dark:border-navy-800 flex flex-col justify-between space-y-3 hover:border-brand-orange/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-950/40 text-brand-orange font-bold text-xs rounded-md">
                              {branch.code}
                            </span>
                            {branch.isNew && (
                              <span className="px-2 py-0.5 bg-brand-orange text-white font-black text-[9px] rounded-md uppercase animate-pulse">
                                New 2027
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 font-semibold">{branch.category}</span>
                          </div>
                          <h4 className="text-sm font-bold text-navy-900 dark:text-white mt-1.5">{branch.name}</h4>
                        </div>
                      </div>

                      <a 
                        href={directSyllabusPdf}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 px-3 bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-700 hover:border-brand-orange text-navy-900 dark:text-white hover:text-brand-orange font-bold text-xs rounded-xl flex items-center justify-between transition-all group"
                      >
                        <span className="flex items-center gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5 text-brand-orange" /> Official {branch.code} Syllabus PDF
                        </span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: PREVIOUS YEAR PAPERS */}
          {activeTab === 'pyqs' && (
            <div className="bg-white dark:bg-navy-900 p-8 rounded-3xl border border-gray-100 dark:border-navy-800 shadow-sm space-y-6 animate-fade-in">
              
              {/* Header & Bulk Google Drive Banner */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                      <FolderDown className="h-6 w-6 text-brand-orange" /> Previous Year Question Papers & Answer Keys (38 Papers)
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Official question papers & master answer keys (2021 to 2026) for all 38 branch slots + 2007-2026 Mega Archive.
                    </p>
                  </div>
                  
                  <a 
                    href="https://gate2027.iitm.ac.in/download" 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-4 py-2 bg-gray-100 dark:bg-navy-800 hover:bg-gray-200 dark:hover:bg-navy-750 text-navy-900 dark:text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shrink-0"
                  >
                    <ExternalLink className="h-4 w-4 text-brand-orange" /> IITM Download Portal
                  </a>
                </div>

                {/* BULK DOWNLOAD GOOGLE DRIVE BANNER (2007 - 2026) */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 relative z-10">
                    <span className="px-2.5 py-0.5 bg-white/20 text-white font-extrabold text-[10px] rounded-full uppercase tracking-wider backdrop-blur-md">
                      Mega Archive (2007 - 2026)
                    </span>
                    <h3 className="text-lg font-bold">Bulk Download All 38 Branch PYQs & Solutions</h3>
                    <p className="text-xs text-orange-100">
                      Direct Google Drive folder containing 20 years of solved question papers for all engineering streams.
                    </p>
                  </div>

                  <a 
                    href="https://drive.google.com/drive/folders/1xUn7rGTzKlfvJDoo4SzCRi8jRlBD63ud" 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-5 py-3 bg-white text-brand-orange hover:bg-orange-50 font-black text-xs rounded-2xl shadow-md flex items-center gap-2 shrink-0 transition-transform hover:scale-105"
                  >
                    <FolderDown className="h-4 w-4" /> Bulk Download Folder (Google Drive)
                  </a>
                </div>
              </div>

              {/* Year Selector Tabs */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Examination Year:</h4>
                  <span className="text-[11px] text-brand-orange font-semibold">Showing papers for all 38 branch slots</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['2026', '2025', '2024', '2023', '2022', '2021'].map(year => (
                    <button
                      key={year}
                      onClick={() => setPyqSelectedYear(year)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        pyqSelectedYear === year
                          ? 'bg-brand-orange text-white shadow-md shadow-orange-500/20 scale-105'
                          : 'bg-gray-100 dark:bg-navy-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-700'
                      }`}
                    >
                      GATE {year}
                    </button>
                  ))}
                </div>

                {/* Search Filter input for PYQ Branches */}
                <div className="relative pt-2">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={pyqSearch}
                    onChange={(e) => setPyqSearch(e.target.value)}
                    placeholder={`Search GATE ${pyqSelectedYear} 38 branch papers (e.g. CS-1, CS-2, CE-1, EE, XH-C1)...`}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-navy-800/60 border border-gray-200 dark:border-navy-700 rounded-xl text-xs text-navy-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange"
                  />
                </div>

                {/* Grid of All 38 Branch Question Paper & Answer Key Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {ALL_GATE_BRANCHES
                    .filter(b => 
                      b.code.toLowerCase().includes(pyqSearch.toLowerCase()) || 
                      b.name.toLowerCase().includes(pyqSearch.toLowerCase())
                    )
                    .map(branch => {
                      const qpUrl = getQuestionPaperUrl(branch.code, pyqSelectedYear, branch.name);
                      const akUrl = getAnswerKeyUrl(branch.code, pyqSelectedYear, branch.name);

                      return (
                        <div 
                          key={branch.code}
                          className="p-4 rounded-2xl bg-gray-50 dark:bg-navy-800/40 border border-gray-100 dark:border-navy-800 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-950/40 text-brand-orange font-bold text-xs rounded-md">
                                {branch.code}
                              </span>
                              <span className="text-xs font-bold text-navy-900 dark:text-white truncate max-w-[200px]">
                                {branch.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold">{pyqSelectedYear}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <a 
                              href={qpUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 px-2.5 bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-700 hover:border-brand-orange text-navy-900 dark:text-white text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5 text-brand-orange shrink-0" />
                              <span>{branch.code} Question Paper</span>
                            </a>
                            <a 
                              href={akUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 px-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-500 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span>{branch.code} Answer Key</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: OFFICIAL QUESTION PAPER PATTERN */}
          {activeTab === 'pattern' && (
            <div className="bg-white dark:bg-navy-900 p-8 rounded-3xl border border-gray-100 dark:border-navy-800 shadow-sm space-y-8 animate-fade-in">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                    <Layers className="h-6 w-6 text-brand-orange" /> Official Question Paper Pattern (GATE 2027)
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Complete examination particulars, marking schemes, negative marking rules, and subject-wise distributions.
                  </p>
                </div>

                <a 
                  href="https://gate2027.iitm.ac.in/question_paper_pattern"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-brand-orange text-white font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-brand-hover transition-colors shrink-0"
                >
                  <ExternalLink className="h-4 w-4" /> Official IITM Pattern Page
                </a>
              </div>

              {/* 1. PARTICULARS TABLE */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <Info className="h-5 w-5 text-brand-orange" /> Examination Particulars
                </h3>

                <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-navy-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-navy-800 text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5 w-1/3">Particulars</th>
                        <th className="px-4 py-3.5">Official Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-navy-800 text-navy-900 dark:text-white">
                      {OFFICIAL_PATTERN_PARTICULARS.map((p, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-navy-900' : 'bg-gray-50/50 dark:bg-navy-850/50'}>
                          <td className="px-4 py-3 font-bold text-brand-orange">{p.item}</td>
                          <td className="px-4 py-3 whitespace-pre-line leading-relaxed">{p.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. MARKING SCHEME & NEGATIVE MARKING CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* MCQ Negative Marking Rules */}
                <div className="p-6 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/30 space-y-3">
                  <h4 className="text-base font-bold text-brand-orange flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" /> Multiple Choice Questions (MCQ) Marking
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Questions carry either 1 mark or 2 marks. For a wrong answer chosen in an MCQ, negative marking applies:
                  </p>
                  <ul className="space-y-2 text-xs font-semibold text-navy-900 dark:text-white">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-orange" />
                      1-Mark MCQ: <strong className="text-red-500">1/3 mark deducted</strong> for wrong answer.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-orange" />
                      2-Mark MCQ: <strong className="text-red-500">2/3 mark deducted</strong> for wrong answer.
                    </li>
                  </ul>
                </div>

                {/* MSQ & NAT Rules */}
                <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 space-y-3">
                  <h4 className="text-base font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" /> MSQ & NAT Rules (No Negative Marking)
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Multiple Select Questions (MSQ) and Numerical Answer Type (NAT) questions carry ZERO negative marking:
                  </p>
                  <ul className="space-y-2 text-xs font-semibold text-navy-900 dark:text-white">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      MSQ & NAT: <strong className="text-emerald-500">No negative marking</strong> for wrong answers.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      MSQ Partial Marking: <strong className="text-amber-500">No partial marking</strong> in MSQ.
                    </li>
                  </ul>
                </div>

              </div>

              {/* 3. EXHAUSTIVE SUBJECT-WISE PAPER STRUCTURE TABLE */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-brand-orange" /> Subject-Wise Question Paper Distribution
                </h3>

                <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-navy-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-navy-800 text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-3.5 py-3 w-1/4">Paper Code</th>
                        <th className="px-3 py-3 text-center">GA Marks</th>
                        <th className="px-3.5 py-3">Subject: Common Section</th>
                        <th className="px-3.5 py-3">Subject: Optional Section(s)</th>
                        <th className="px-3 py-3 text-center">Total Marks</th>
                        <th className="px-3 py-3 text-center">Time (Mins)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-navy-800 text-navy-900 dark:text-white">
                      {OFFICIAL_PAPER_STRUCTURE_TABLE.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-navy-900' : 'bg-gray-50/50 dark:bg-navy-850/50'}>
                          <td className="px-3.5 py-3 font-bold text-brand-orange">{row.code}</td>
                          <td className="px-3 py-3 text-center font-bold">{row.ga}</td>
                          <td className="px-3.5 py-3 font-medium leading-relaxed">{row.common}</td>
                          <td className="px-3.5 py-3 text-gray-500 dark:text-gray-400 leading-relaxed">{row.optional}</td>
                          <td className="px-3 py-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{row.total}</td>
                          <td className="px-3 py-3 text-center font-bold">{row.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. PwD COMPENSATORY TIME GUIDELINES */}
              <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    *PwD Candidate Compensatory Time Guidelines
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    Following O.M. F. No. P-13013/75/2023-Policy-DD-III dated August 01, 2025, PwD candidates in the category of blindness, locomotor disability (both arms only), and cerebral palsy can request compensatory time of **one hour** (240 minutes total) upon production of a valid disability certificate/UDID card. For all other specified disabilities, compensatory time is allowed upon production of a functional limitation certificate (refer to official Appendix-B1).
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 6: APPLICATION FEES */}
          {activeTab === 'fees' && (
            <div className="bg-white dark:bg-navy-900 p-8 rounded-3xl border border-gray-100 dark:border-navy-800 shadow-sm space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <Award className="h-6 w-6 text-brand-orange" /> Fee Structure and Period Guidelines
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Application fees are non-refundable and must be paid online via GOAPS card, net banking, or UPI portals.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-gray-50 dark:bg-navy-800/40 border border-gray-150 dark:border-navy-800 space-y-4">
                  <h4 className="text-base font-bold text-navy-900 dark:text-white">Regular Period Fees</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Applications submitted from Aug 14 to Sep 21, 2026.</p>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-400">Female / SC / ST / PwD:</span>
                      <span className="text-brand-orange font-bold">₹ 1000/-</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-400">All Other Candidates:</span>
                      <span className="text-brand-orange font-bold">₹ 2000/-</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-gray-50 dark:bg-navy-800/40 border border-gray-150 dark:border-navy-800 space-y-4">
                  <h4 className="text-base font-bold text-navy-900 dark:text-white">Extended Period Fees</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Late applications submitted from Sep 22 to Sep 30, 2026.</p>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-400">Female / SC / ST / PwD:</span>
                      <span className="text-brand-orange font-bold">₹ 1500/-</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-400">All Other Candidates:</span>
                      <span className="text-brand-orange font-bold">₹ 2500/-</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: EXAM CITIES */}
          {activeTab === 'cities' && (
            <div className="bg-white dark:bg-navy-900 p-8 rounded-3xl border border-gray-100 dark:border-navy-800 shadow-sm space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-brand-orange" /> Selection of Exam Cities & Zones
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  GATE 2027 examinations will be held in multiple cities across 8 zonal units in India.
                </p>
              </div>

              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                <div className="p-4 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/30 rounded-2xl flex gap-3 items-start">
                  <Info className="h-5 w-5 text-brand-orange shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-brand-orange text-xs uppercase tracking-wider">Crucial Choice Rule:</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-normal">
                      Candidates must select **six (6) choices** of examination cities during the form submission. All choices must strictly fall within the **same GATE zone** (under a single organizing institute's list).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-navy-800/40 border border-gray-100 dark:border-navy-850">
                    <h5 className="font-bold text-navy-900 dark:text-white text-sm mb-2">IIT Madras Zone (Zone 2)</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
                      Includes southern areas like Chennai, Bengaluru, Coimbatore, Kochi, Trivandrum, Madurai, Tiruchirappalli, Hyderabad, Secunderabad, and more.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-navy-800/40 border border-gray-100 dark:border-navy-850">
                    <h5 className="font-bold text-navy-900 dark:text-white text-sm mb-2">City Allotment Status</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
                      The finalized exam center venue and allocated test city details will be officially updated on **January 4, 2027**.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: PHOTOGRAPH & SIGNATURE */}
          {activeTab === 'photo' && (
            <div className="bg-white dark:bg-navy-900 p-8 rounded-3xl border border-gray-100 dark:border-navy-800 shadow-sm space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <Camera className="h-6 w-6 text-brand-orange" /> Photograph & Signature Guidelines
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  IIT Madras implements automated photo matching algorithms. Check specifications below to prevent application rejection.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Photo guidelines */}
                <div className="space-y-4">
                  <h4 className="font-bold text-navy-900 dark:text-white text-sm flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-brand-orange rounded-full" /> Photograph Specifications
                  </h4>
                  
                  <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      Good quality color passport size photo (3.5 cm × 4.5 cm).
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      Must have a solid **white background**.
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      JPEG/JPG format; Aspect ratio between 0.66 and 0.89.
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      Face must cover 60% to 70% of the image area.
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      No caps, hats, face masks, or dark/tinted sunglasses.
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      Spectacles are allowed only if there is **no glare** on lens.
                    </li>
                  </ul>
                </div>

                {/* Signature guidelines */}
                <div className="space-y-4">
                  <h4 className="font-bold text-navy-900 dark:text-white text-sm flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-brand-orange rounded-full" /> Signature Specifications
                  </h4>
                  
                  <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      Sign on clean, non-ruled white paper.
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      Use black or dark blue ink pen only.
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      Scan or crop the signature tightly in JPEG format.
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      Do not use pencil, gel pens, or sketch pens.
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      Signature in all capital letters is not allowed.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: REQUIRED DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="bg-white dark:bg-navy-900 p-8 rounded-3xl border border-gray-100 dark:border-navy-800 shadow-sm space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-6 w-6 text-brand-orange" /> Required Registration Documents
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Ensure you compile scanned copies of these documents before starting the online application.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { title: 'Valid Photo Identity Proof', desc: 'Aadhaar Card (Highly Recommended), Passport, PAN Card, Voter ID, or College Identity Card. The name must match application letters exactly.' },
                  { title: 'Degree Certificate or Eligibility Document', desc: 'Final degree certificate, provisional certificate, or course completion certificate if graduated. A declaration or provisional letter signed by HOD for current students.' },
                  { title: 'Category/Caste Certificate (if applicable)', desc: 'Valid SC, ST, OBC-NCL, or EWS certificate in PDF format for claiming application fee concession or seat quota.' },
                  { title: 'Disability/PwD Certificate (if applicable)', desc: 'Scanned medical certificate for PwD candidates, necessary for scribe allocation or extra time accommodations.' }
                ].map((doc, idx) => (
                  <div key={idx} className="flex gap-3 p-4 bg-gray-50 dark:bg-navy-800/40 rounded-2xl border border-gray-100 dark:border-navy-850">
                    <CheckCircle2 className="h-5 w-5 text-brand-orange shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-navy-900 dark:text-white text-sm">{doc.title}</h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{doc.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (1/3 Width) - Common Exam Pattern details */}
        <div className="space-y-8">
          
          {/* GENERAL INFO BAR */}
          <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-gray-100 dark:border-navy-800 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-brand-orange" /> Exam Pattern & Structure
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-navy-850">
                <span className="text-gray-400">Exam Mode</span>
                <span className="font-bold text-navy-900 dark:text-white">Computer Based (CBT)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-navy-850">
                <span className="text-gray-400">Duration</span>
                <span className="font-bold text-navy-900 dark:text-white">3 Hours</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-navy-850">
                <span className="text-gray-400">Total Marks</span>
                <span className="font-bold text-navy-900 dark:text-white">100 Marks</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-navy-850">
                <span className="text-gray-400">Total Questions</span>
                <span className="font-bold text-navy-900 dark:text-white">65 Questions</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400">General Aptitude</span>
                <span className="font-bold text-navy-900 dark:text-white">15 Marks</span>
              </div>
            </div>

            <div className="p-3.5 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/30 text-[11px] text-brand-orange leading-relaxed space-y-1.5">
              <div className="flex gap-1.5 items-start">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p>
                  <strong>Marking Rules:</strong>
                </p>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li><strong>MCQs:</strong> Negative marking applies (-1/3 for 1-mark Q; -2/3 for 2-mark Q).</li>
                <li><strong>MSQs:</strong> Multiple correct options. No negative marking. No partial marking.</li>
                <li><strong>NATs:</strong> Numerical input. No negative marking.</li>
              </ul>
            </div>
          </div>

          {/* DIGILOCKER & FACE CHECKLIST */}
          <div className="bg-white dark:bg-navy-900 p-6 rounded-3xl border border-gray-100 dark:border-navy-800 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-brand-orange" /> DigiLocker & Face Verification
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              IIT Madras requires identity linking to verify candidate credentials and prevent malpractice:
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="h-5 w-5 bg-orange-50 dark:bg-orange-950/45 rounded-lg flex items-center justify-center text-brand-orange font-bold text-[10px] shrink-0 mt-0.5">1</div>
                <div>
                  <span className="font-bold text-navy-900 dark:text-white block">DigiLocker Account</span>
                  <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">Sign in to linking portal to fetch verified certificates instantly.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="h-5 w-5 bg-orange-50 dark:bg-orange-950/45 rounded-lg flex items-center justify-center text-brand-orange font-bold text-[10px] shrink-0 mt-0.5">2</div>
                <div>
                  <span className="font-bold text-navy-900 dark:text-white block">Live Face Photo Capture</span>
                  <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">Automated visual alignment system captures your facial map during registration.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* THREE PROMINENT FEATURE BLOCKS ON MAIN GATE 2027 PAGE */}
      <div className="border-t border-gray-200 dark:border-navy-800 pt-12">
        <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-6 text-center">
          GATE 2027 Academic Preparation Resources
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* BLOCK 1: SYLLABUS OF ALL BRANCHES */}
          <div 
            onClick={() => handleTabChange('syllabus')}
            className="p-8 rounded-3xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-sm hover:shadow-xl hover:border-brand-orange/40 transition-all cursor-pointer group space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-brand-orange flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider">All 38 Test Papers</span>
              <h3 className="text-xl font-bold text-navy-900 dark:text-white mt-1 group-hover:text-brand-orange transition-colors">
                Syllabus of All 38 Branches
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Directly redirect to official IIT Madras syllabi PDFs for CS-1, CS-2, DA, EC, EE, ME, CE-1, CE-2, RA, BM, BT, CH, AE, XH, and all 38 papers.
              </p>
            </div>
            <div className="text-xs font-bold text-brand-orange flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Explore All 38 Syllabi Links</span> →
            </div>
          </div>

          {/* BLOCK 2: PREVIOUS PAPERS */}
          <div 
            onClick={() => handleTabChange('pyqs')}
            className="p-8 rounded-3xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-all cursor-pointer group space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <FolderDown className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">2021 — 2026 Archive</span>
              <h3 className="text-xl font-bold text-navy-900 dark:text-white mt-1 group-hover:text-blue-500 transition-colors">
                Previous Year Question Papers
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Download past GATE papers with official master answer keys for all 38 branch slots across 2021 to 2026.
              </p>
            </div>
            <div className="text-xs font-bold text-blue-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Download PYQs & Keys</span> →
            </div>
          </div>

          {/* BLOCK 3: QUESTION PAPER PATTERN */}
          <div 
            onClick={() => handleTabChange('pattern')}
            className="p-8 rounded-3xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all cursor-pointer group space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Exam Structure</span>
              <h3 className="text-xl font-bold text-navy-900 dark:text-white mt-1 group-hover:text-emerald-500 transition-colors">
                Official Question Paper Pattern
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Comprehensive breakdown of examination particulars, marking schemes, negative marking rules, and subject-wise distributions from IIT Madras.
              </p>
            </div>
            <div className="text-xs font-bold text-emerald-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>View Full Paper Pattern</span> →
            </div>
          </div>

        </div>
      </div>

      {/* FINAL BOTTOM CALLOUT FOR OFFICIAL WEBSITE & BROCHURE PDF (AT VERY END OF PAGE) */}
      <div className="border-t border-gray-200 dark:border-navy-800 pt-12 mt-12 text-center space-y-6">
        <div className="max-w-2xl mx-auto space-y-2">
          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-950/40 text-brand-orange text-xs font-bold rounded-full uppercase tracking-wider">
            Official IIT Madras Links
          </span>
          <h3 className="text-2xl font-bold text-navy-900 dark:text-white">
            Ready to Visit the Official Portal & Information Brochure?
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Redirect directly to the organizing institute's website or download the official GATE 2027 Information Brochure PDF.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <a 
            href="https://gate2027.iitm.ac.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white font-bold text-xs hover:bg-gray-50 dark:hover:bg-navy-800 transition-all shadow-md hover:shadow-lg"
          >
            <ExternalLink className="h-4 w-4 text-brand-orange" /> Visit Official IIT Madras Website
          </a>
          <a 
            href="https://gate2027.iitm.ac.in/static/doc/IB/GATE2027-IB_v1.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-orange text-white font-bold text-xs hover:bg-brand-hover transition-all shadow-md hover:shadow-lg shadow-orange-500/20"
          >
            <Download className="h-4 w-4" /> Download Official Brochure PDF
          </a>
        </div>
      </div>

    </div>
  );
};

export default Gate2027;
