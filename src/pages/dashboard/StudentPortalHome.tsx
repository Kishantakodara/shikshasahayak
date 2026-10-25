import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowRight, 
  BookOpen, 
  ChevronRight, 
  FileText, 
  ScrollText, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  TrendingUp, 
  Flame, 
  Award, 
  Target, 
  ClipboardList, 
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Sparkles,
  Briefcase,
  GraduationCap,
  Trophy,
  Code2,
  Users,
  Radio,
  Plus,
  Clock,
  ExternalLink,
  ShieldCheck,
  Search,
  User,
  Phone,
  ClipboardCheck,
  Save,
  BarChart2,
  Trash2,
  Zap,
  BookMarked,
  FileCheck,
  Building2,
  Bookmark,
  Gift
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudentAcademic } from '../../context/StudentAcademicContext';
import { useLearningEcosystem } from '../../context/LearningEcosystemContext';
import { apiClient } from '../../api/client';
import { teacherClient } from '../../api/teacherClient';
import { ShikshaSahayakShell } from '../../components/layout/ShikshaSahayakShell';
import { JoinClassModal } from '../../components/student/JoinClassModal';
import { StudentAttendanceModal } from '../../components/student/StudentAttendanceModal';
import { getActiveAttendanceSessionForStudent, subscribeToSyncEvent, SYNC_EVENTS } from '../../utils/realtimeSync';
import { getCurriculumSubjectsForBranchAndSemester } from '../../utils/curriculumSubjects';
import { saveD1StudentProfile, fetchD1StudentProfile, deleteD1StudentProfile } from '../../api/studentIdentityClient';
import { parseGTUEnrollment } from '../../config/gtuData';
import { getCanonicalBranchSlug } from '../../utils/branchUtils';
import { toast } from 'sonner';

export const StudentPortalHome: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, logout } = useAuth();
  const { academicProfile, saveAcademicProfile } = useStudentAcademic();
  const { analytics } = useLearningEcosystem();

  // Tab management
  const validTabs = ['overview', 'curriculum', 'classroom', 'practice', 'progress'] as const;
  type TabKey = typeof validTabs[number];
  const tabParam = (searchParams.get('tab') || 'overview').toLowerCase();
  const activeTab: TabKey = (validTabs.includes(tabParam as TabKey) ? tabParam : 'overview') as TabKey;

  const handleTabChange = (tab: TabKey) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  // Classroom & Attendance states
  const [joinClassModalOpen, setJoinClassModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [initialJoinCode, setInitialJoinCode] = useState('');
  const [quickCode, setQuickCode] = useState('');
  const [submittingQuick, setSubmittingQuick] = useState(false);
  const [studentClasses, setStudentClasses] = useState<any[]>([]);

  // Study & Curriculum search state
  const [curriculumSearch, setCurriculumSearch] = useState('');

  // Progress & Profile Sub-tab state
  const [progressSubTab, setProgressSubTab] = useState<'analytics' | 'profile'>('analytics');

  // Profile Form States
  const [profileName, setProfileName] = useState(currentUser?.displayName || academicProfile?.fullName || '');
  const [profileEmail] = useState(currentUser?.email || '');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileDob, setProfileDob] = useState('');
  const [profileUniversity, setProfileUniversity] = useState(academicProfile?.universityName || 'Gujarat Technological University');
  const [profileDegree, setProfileDegree] = useState(academicProfile?.degreeName || 'Bachelor of Engineering (B.E. / B.Tech)');
  const [profileCollege, setProfileCollege] = useState(academicProfile?.college || '');
  const [profileBranch, setProfileBranch] = useState(academicProfile?.branchName || '');
  const [profileSemester, setProfileSemester] = useState(academicProfile?.semester || 1);
  const [profileEnrollment, setProfileEnrollment] = useState(academicProfile?.enrollmentNumber || '');
  const [profileGoals, setProfileGoals] = useState(academicProfile?.goals?.[0] || '');
  const [profileCareerGoal, setProfileCareerGoal] = useState(academicProfile?.careerGoal || '');
  const [profileLanguage, setProfileLanguage] = useState(academicProfile?.preferredLanguage || 'English');
  const [profileStyle, setProfileStyle] = useState(academicProfile?.learningStyle || 'Visual');
  
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSavedSuccess, setProfileSavedSuccess] = useState(false);
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Delete Profile Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState('');
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);

  // GTU Enrollment Live Parser
  const parsedEnrollment = parseGTUEnrollment(profileEnrollment);

  // Handle invite links or join codes
  useEffect(() => {
    const codeFromUrl = searchParams.get('joinCode') || searchParams.get('code');
    const codeFromStorage = sessionStorage.getItem('pending_join_code');
    const codeToUse = (codeFromUrl || codeFromStorage || '').trim().toUpperCase();
    if (codeToUse) {
      setInitialJoinCode(codeToUse);
      setJoinClassModalOpen(true);
      sessionStorage.removeItem('pending_join_code');
    }
  }, [searchParams]);

  // Live real-time attendance session sync
  useEffect(() => {
    const checkActiveSession = () => {
      const live = getActiveAttendanceSessionForStudent() || dashboardData?.activeAttendanceSession;
      setActiveSession(live || null);
    };

    checkActiveSession();

    const unsubLaunch = subscribeToSyncEvent(SYNC_EVENTS.ATTENDANCE_LAUNCH, (payload) => {
      setActiveSession(payload);
    });

    const unsubEnd = subscribeToSyncEvent(SYNC_EVENTS.ATTENDANCE_END, () => {
      setActiveSession(null);
    });

    return () => {
      unsubLaunch();
      unsubEnd();
    };
  }, [dashboardData]);

  // Fetch initial profile details from Cloudflare D1
  useEffect(() => {
    if (currentUser?.uid) {
      fetchD1StudentProfile(currentUser.uid)
        .then((p) => {
          if (p) {
            if (p.name) setProfileName(p.name);
            if (p.phone_number) setProfilePhone(p.phone_number);
            if (p.dob) setProfileDob(p.dob);
            if (p.university) setProfileUniversity(p.university);
            if (p.degree) setProfileDegree(p.degree);
            if (p.college) setProfileCollege(p.college);
            if (p.branch) setProfileBranch(p.branch);
            if (p.semester) setProfileSemester(p.semester);
            if (p.enrollment_number) setProfileEnrollment(p.enrollment_number);
          }
        })
        .catch(() => {});
    }
  }, [currentUser?.uid]);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, branchRes, timelineRes] = await Promise.allSettled([
        apiClient.getStudentDashboard({
          branchId: getCanonicalBranchSlug(academicProfile?.branchId || academicProfile?.branchName),
          semester: academicProfile?.semester,
        }),
        apiClient.getBranches(),
        apiClient.getStudentTimeline(),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value?.success) {
        setDashboardData(dashRes.value.data);
      }
      if (branchRes.status === 'fulfilled' && Array.isArray(branchRes.value)) {
        setBranches(branchRes.value);
      }
      if (timelineRes.status === 'fulfilled' && timelineRes.value?.timeline) {
        setTimelineEvents(timelineRes.value.timeline);
      }

      // Also fetch enrolled classes for the student
      if (currentUser?.uid) {
        try {
          const classRes = await teacherClient.getStudentEnrolledClasses(currentUser.uid);
          if (classRes && Array.isArray(classRes.classes)) {
            setStudentClasses(classRes.classes);
          }
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
      setError('Could not connect to academic OS service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [currentUser, academicProfile?.branchId, academicProfile?.semester]);

  // Derived profile details
  const studentName =
    dashboardData?.profile?.name ||
    currentUser?.displayName ||
    academicProfile?.fullName ||
    profileName ||
    'Student';

  const branchName =
    dashboardData?.profile?.branch ||
    academicProfile?.branchName ||
    profileBranch ||
    'Computer Engineering';

  const semesterNum =
    dashboardData?.profile?.semester ||
    academicProfile?.semester ||
    profileSemester ||
    3;

  const rawSubjects = dashboardData?.subjects || [];
  const subjects = rawSubjects.length > 0
    ? rawSubjects
    : getCurriculumSubjectsForBranchAndSemester(academicProfile?.branchId || branchName, semesterNum);

  const enrolledClasses = studentClasses.length > 0
    ? studentClasses
    : (dashboardData?.classes || []);

  const continueStudying = dashboardData?.continueStudying || {
    title: subjects[0]?.name || 'Core Engineering',
    subjectName: subjects[0]?.name || 'Core Engineering',
    unitInfo: 'Unit 1 — Foundations',
    progress: typeof subjects[0]?.progress === 'number' ? subjects[0].progress : 0,
    url: '/student?tab=curriculum',
  };

  const practiceStats = dashboardData?.practiceStats || {
    questionsAttempted: 0,
    correctAnswers: 0,
    accuracyPercentage: 0,
    currentStreakDays: 0,
  };

  const dailyQuestion = dashboardData?.dailyQuestion;
  const assignments = dashboardData?.assignments || [];
  const fallbackExamCountdown = useMemo(() => {
    return {
      isConfigured: false,
      examName: 'GTU University Examination',
      daysLeft: null as number | null,
      message: 'Official examination date not configured in ShikshaSahayak.',
    };
  }, []);

  const examCountdown = dashboardData?.examCountdown || fallbackExamCountdown;

  // Filtered curriculum subjects
  const filteredCurriculumSubjects = useMemo(() => {
    if (!curriculumSearch.trim()) return subjects;
    const query = curriculumSearch.toLowerCase();
    return subjects.filter((s: any) => 
      (s.name && s.name.toLowerCase().includes(query)) ||
      (s.code && s.code.toLowerCase().includes(query)) ||
      (s.shortName && s.shortName.toLowerCase().includes(query))
    );
  }, [subjects, curriculumSearch]);

  // Quick Inline Attendance Submit
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickCode.trim().toUpperCase();
    if (!clean || clean.length < 4) {
      toast.error('Please enter a valid 6-character session code');
      return;
    }

    setSubmittingQuick(true);
    try {
      const res = await teacherClient.submitStudentAttendance({
        session_code: clean,
        challenge_word: clean,
        student_id: currentUser?.uid || 'guest-student',
        student_name: studentName,
        enrollment_number: academicProfile?.enrollmentNumber || profileEnrollment || 'GTU-STUDENT',
      });

      if (res && res.success) {
        toast.success(res.message || 'Attendance verified & recorded successfully!');
        setQuickCode('');
        loadDashboard();
      } else {
        toast.error('Could not verify session code. Please double-check with your professor.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Attendance check-in failed');
    } finally {
      setSubmittingQuick(false);
    }
  };

  // Profile Save Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg('');
    setProfileSaving(true);

    try {
      const slugifiedBranch = profileBranch.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const uid = currentUser?.uid || '';

      if (uid) {
        await saveD1StudentProfile({
          userId: uid,
          name: profileName.trim() || currentUser?.displayName || 'Student',
          email: profileEmail.trim(),
          phoneNumber: profilePhone.trim(),
          college: profileCollege.trim(),
          university: profileUniversity.trim(),
          degree: profileDegree.trim(),
          branch: profileBranch.trim(),
          semester: Number(profileSemester),
          enrollmentNumber: profileEnrollment.trim(),
          goals: [profileGoals],
          dob: profileDob || undefined
        });
      }

      await saveAcademicProfile({
        universityName: profileUniversity,
        college: profileCollege,
        degreeName: profileDegree,
        branchName: profileBranch,
        branchId: slugifiedBranch || 'computer-engineering',
        semester: Number(profileSemester),
        enrollmentNumber: profileEnrollment.trim(),
        goals: [profileGoals],
        careerGoal: profileCareerGoal,
        preferredLanguage: profileLanguage,
        learningStyle: profileStyle as any,
      });

      setProfileSavedSuccess(true);
      toast.success('Academic profile saved to database!');
      setTimeout(() => setProfileSavedSuccess(false), 3500);
      loadDashboard();
    } catch (err: any) {
      console.error('Error updating student profile:', err);
      setProfileErrorMsg('Failed to update profile. Please try again.');
      toast.error('Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Profile Delete Handler
  const handleDeleteProfile = async () => {
    if (confirmDeleteInput.trim().toUpperCase() !== 'DELETE') {
      return;
    }

    setIsDeletingProfile(true);
    try {
      const uid = currentUser?.uid;
      if (uid) {
        await deleteD1StudentProfile(uid);
      }
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Error deleting student profile:', err);
      toast.error('An error occurred while deleting your profile.');
    } finally {
      setIsDeletingProfile(false);
      setShowDeleteModal(false);
    }
  };

  const maxWeeklyMinutes = Math.max(...(analytics.weeklyLogs?.map((l: any) => l.minutesSpent) || [120]), 120);

  return (
    <ShikshaSahayakShell>
      <div className="w-full">
        
        {/* EDITORIAL ACADEMIC HERO HEADER */}
        <section className="relative overflow-hidden border-b border-[#E2E8F0] dark:border-slate-800">
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/hero-academic.jpg" 
              alt="Students studying engineering in campus library"
              className="w-full h-full object-cover object-center filter brightness-[0.78] contrast-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/95 via-[#0F172A]/90 to-slate-900/70"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="max-w-3xl text-left text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 text-white/90 text-xs font-bold tracking-wider uppercase mb-3">
                <span className="w-2 h-2 rounded-full bg-[#F97316] animate-pulse"></span>
                STUDENT ACADEMIC OS • GTU PORTAL
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight mb-3 text-white">
                Padho. Practice Karo.<br />
                Apne <span className="text-[#F97316]">Sapne</span> Pure Karo.
              </h1>

              <p className="text-xs sm:text-sm md:text-base text-slate-200 font-normal leading-relaxed mb-6 max-w-xl">
                Personalized for <strong className="text-white font-bold">{branchName}</strong>, Semester {semesterNum}. Access unit-wise notes, solve previous year papers, and take practice assessments.
              </p>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleTabChange('curriculum')}
                  className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 group cursor-pointer"
                >
                  <span>Continue Studying (Sem {semesterNum})</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('practice')}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>MCQ Practice Tests</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('classroom')}
                  className="px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-slate-200 font-medium text-xs border border-slate-700/60 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>Classrooms ({enrolledClasses.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setJoinClassModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-orange-600/30 hover:bg-orange-600/50 text-white font-medium text-xs border border-orange-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>Join Classroom</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 5 DEDICATED TABS NAVIGATION BAR */}
        <div className="sticky top-14 z-20 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-slate-800 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-2.5 no-scrollbar scrollbar-none">
              
              {/* Tab 1: Overview */}
              <button
                type="button"
                onClick={() => handleTabChange('overview')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#F97316] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>

              {/* Tab 2: Study & Curriculum */}
              <button
                type="button"
                onClick={() => handleTabChange('curriculum')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'curriculum'
                    ? 'bg-[#F97316] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Study & Curriculum</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  activeTab === 'curriculum' ? 'bg-white/20 text-white' : 'bg-orange-500/10 text-[#F97316]'
                }`}>
                  Sem {semesterNum}
                </span>
              </button>

              {/* Tab 3: Classroom & Attendance */}
              <button
                type="button"
                onClick={() => handleTabChange('classroom')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'classroom'
                    ? 'bg-[#F97316] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Classroom & Attendance</span>
                {activeSession && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>

              {/* Tab 4: Practice Arena */}
              <button
                type="button"
                onClick={() => handleTabChange('practice')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'practice'
                    ? 'bg-[#F97316] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Practice Arena</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  activeTab === 'practice' ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                }`}>
                  MCQs
                </span>
              </button>

              {/* Tab 5: Progress & Profile */}
              <button
                type="button"
                onClick={() => handleTabChange('progress')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === 'progress'
                    ? 'bg-[#F97316] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Progress & Profile</span>
              </button>

            </div>
          </div>
        </div>

        {/* MAIN TAB CONTENT CONTAINER */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* LIVE ATTENDANCE ALERT BANNER (VISIBLE ACROSS ALL TABS WHEN ACTIVE) */}
          {activeSession && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-500/15 via-rose-500/10 to-amber-500/15 border-2 border-[#F97316] shadow-lg animate-pulse">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F97316] text-white flex items-center justify-center font-black shrink-0 shadow-md">
                    <Radio className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black tracking-widest uppercase">
                        LIVE ATTENDANCE ACTIVE
                      </span>
                      {activeSession.session_code && (
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          Code: {activeSession.session_code}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white mt-0.5">
                      {activeSession.class_name || activeSession.subject_name || 'Class Attendance Session'}
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-slate-400">
                      {activeSession.teacher_name ? `Faculty: ${activeSession.teacher_name}` : 'Mark your presence before the session timer expires.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttendanceModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Attendance Now</span>
                </button>
              </div>
            </div>
          )}

          {/* ONBOARDING ALERT BANNER IF PROFILE INCOMPLETE */}
          {!academicProfile?.isProfileComplete && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/15 border-2 border-[#F97316]/60 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F97316] text-white flex items-center justify-center font-black shrink-0 shadow-sm">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#F97316] text-white text-[10px] font-black tracking-widest uppercase">
                      Action Required
                    </span>
                    <span className="text-xs font-bold text-[#F97316]">
                      Personalize Workspace
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white mt-0.5">
                    Select Your GTU Branch & Semester
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-300 mt-0.5">
                    Your portal is currently showing default subjects. Customize your real branch and semester using the official form.
                  </p>
                </div>
              </div>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <span>Complete Registration Form</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              
              {/* WELCOME & METRIC CARDS */}
              <section className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0] dark:border-slate-800">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white">
                      Welcome back, {studentName} 👋
                    </h2>
                    <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400 mt-0.5">
                      Your personalized workspace for {branchName} • Semester {semesterNum}.
                    </p>
                  </div>
                  
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 text-xs font-semibold text-[#0F172A] dark:text-slate-200 self-start md:self-auto transition-colors group cursor-pointer"
                    title="Click to view or update your University, Branch & Semester"
                  >
                    <span className="text-[#F97316] font-bold">Semester {semesterNum}</span>
                    <span className="text-slate-400">•</span>
                    <span className="max-w-[150px] truncate">{branchName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-[#F97316] font-bold">GTU</span>
                    <span className="ml-1 text-[10px] text-[#F97316] underline group-hover:no-underline font-bold">Change</span>
                  </Link>
                </div>

                {/* 4 Compact Subtle Statistics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 pt-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#F97316] flex items-center justify-center shrink-0">
                      <Flame className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-extrabold text-[#0F172A] dark:text-white leading-none">
                        {practiceStats.currentStreakDays} {practiceStats.currentStreakDays === 1 ? 'Day' : 'Days'}
                      </p>
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 font-medium">Study Streak</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-extrabold text-[#0F172A] dark:text-white leading-none">
                        {practiceStats.questionsAttempted > 0 ? `${practiceStats.accuracyPercentage}%` : 'Getting Started'}
                      </p>
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 font-medium">Practice Accuracy</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-extrabold text-[#0F172A] dark:text-white leading-none">
                        {assignments.filter((a: any) => a.status === 'OPEN' || a.status === 'LATE').length} Pending
                      </p>
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 font-medium">Assignments</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-extrabold text-[#0F172A] dark:text-white leading-none">
                        {examCountdown?.daysLeft !== null && examCountdown?.daysLeft !== undefined
                          ? (examCountdown as any)?.isConcluded
                            ? 'Exam Concluded'
                            : (examCountdown as any)?.isToday
                            ? 'Exam Today'
                            : `${examCountdown.daysLeft} Days Left`
                          : 'Schedule TBD'}
                      </p>
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 font-medium">To GTU Exam</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* QUICK STUDENT UTILITIES BAR */}
              <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#F97316]" /> Essential Student Toolkit
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">1-Click Quick Access</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <Link
                    to="/student/resume"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/25 text-xs font-bold shrink-0 transition-colors"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Pro Resume Builder</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-600 text-white font-extrabold uppercase">ATS 8+</span>
                  </Link>

                  <Link
                    to="/career/internships"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/25 text-xs font-bold shrink-0 transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Internships & Jobs</span>
                  </Link>

                  <Link
                    to="/career/interview-prep"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/25 text-xs font-bold shrink-0 transition-colors"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>5-Day Interview Prep</span>
                  </Link>

                  <Link
                    to={academicProfile?.branchId ? `/resources/study-material/${getCanonicalBranchSlug(academicProfile.branchId)}/semester/${academicProfile.semester || 1}` : "/resources/study-material"}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/25 text-xs font-bold shrink-0 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Study Notes</span>
                  </Link>

                  <Link
                    to={academicProfile?.branchId ? `/resources/pyq/${getCanonicalBranchSlug(academicProfile.branchId)}/semester/${academicProfile.semester || 1}` : "/resources/pyq"}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-[#F97316] border border-orange-500/25 text-xs font-bold shrink-0 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>GTU PYQs</span>
                  </Link>

                  <Link
                    to={academicProfile?.branchId ? `/resources/syllabus/${getCanonicalBranchSlug(academicProfile.branchId)}/semester/${academicProfile.semester || 1}` : "/resources/syllabus"}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-xs font-bold shrink-0 transition-colors"
                  >
                    <ScrollText className="w-3.5 h-3.5" />
                    <span>Syllabus Schemes</span>
                  </Link>

                  <Link
                    to="/student/library"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0 transition-colors"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                    <span>Saved Library</span>
                  </Link>

                  <Link
                    to="/gate-2027"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-xs font-bold shrink-0 transition-colors"
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>GATE 2027 Arena</span>
                  </Link>

                  <Link
                    to="/opportunities/scholarships"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/25 text-xs font-bold shrink-0 transition-colors"
                  >
                    <Gift className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Scholarships</span>
                  </Link>

                  <Link
                    to="/student/calendar"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>GTU Calendar</span>
                  </Link>
                </div>
              </div>

              {/* WHAT WOULD YOU LIKE TO DO TODAY? */}
              <section>
                <div className="mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
                    What would you like to do today?
                  </h2>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                    Top priorities based on your curriculum schedule and active assignments.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Priority 1: CONTINUE STUDYING */}
                  <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400 font-bold uppercase tracking-wider mb-2">
                        <span>Continue Studying</span>
                        <BookOpen className="w-3.5 h-3.5 text-[#F97316]" />
                      </div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                        {continueStudying.subjectName || continueStudying.title}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                        {continueStudying.unitInfo || 'Core Engineering Curriculum'}
                      </p>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400 font-medium mb-1">
                          <span>Progress</span>
                          <span className="font-bold text-[#F97316]">{continueStudying.progress || 60}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-[#F97316] h-1.5 rounded-full" style={{ width: `${continueStudying.progress || 60}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 mt-2">
                      <button
                        type="button"
                        onClick={() => handleTabChange('curriculum')}
                        className="w-full py-2 px-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Study Curriculum</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Priority 2: PRACTICE */}
                  <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400 font-bold uppercase tracking-wider mb-2">
                        <span>Daily MCQ Practice</span>
                        <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white line-clamp-1">
                        {dailyQuestion?.subjectName || 'Engineering Practice Set'}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5 line-clamp-2">
                        {dailyQuestion?.questionText || 'Practice verified GTU multiple choice questions.'}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 text-xs font-bold">
                          {practiceStats.questionsAttempted} Solved
                        </span>
                        <span className="text-[11px] text-[#64748B] dark:text-slate-400">
                          {dailyQuestion?.difficulty ? `${dailyQuestion.difficulty.toUpperCase()}` : 'VERIFIED'}
                        </span>
                      </div>
                    </div>
                    <div className="pt-4 mt-2">
                      <button
                        type="button"
                        onClick={() => handleTabChange('practice')}
                        className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Start Practice</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Priority 3: ASSIGNMENT */}
                  <div className="bg-white dark:bg-[#0F172A] border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 rounded-2xl p-4 flex flex-col justify-between hover:border-amber-300 transition-colors shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {assignments.length > 0 ? assignments[0].status : 'Assignment'}
                        </span>
                        <span>{assignments.length > 0 ? `${assignments[0].totalMarks} Marks` : 'Tasks'}</span>
                      </div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white line-clamp-1">
                        {assignments.length > 0 ? assignments[0].title : "All caught up!"}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5 line-clamp-1">
                        {assignments.length > 0 ? (assignments[0].subjectName || 'Lab Report') : 'No pending assignments due today.'}
                      </p>
                      <div className="mt-3">
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                          {assignments.length > 0 && assignments[0].dueDate ? `Due: ${assignments[0].dueDate.split('T')[0]}` : 'Active Status'}
                        </span>
                      </div>
                    </div>
                    <div className="pt-4 mt-2">
                      <button
                        type="button"
                        onClick={() => handleTabChange('classroom')}
                        className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 hover:bg-amber-50 text-[#0F172A] dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Classroom Tasks</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Priority 4: EXAM COUNTDOWN */}
                  <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-slate-400 font-bold uppercase tracking-wider mb-2">
                        <span>Exam Schedule</span>
                        <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
                        {examCountdown?.examName || 'GTU University Examination'}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                        {examCountdown?.isConfigured ? 'Official GTU University Schedule' : 'Official examination date not configured in ShikshaSahayak.'}
                      </p>
                      <div className="mt-3 flex items-baseline gap-2">
                        {examCountdown?.daysLeft !== null && examCountdown?.daysLeft !== undefined ? (
                          (examCountdown as any)?.isConcluded ? (
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium py-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Examination cycle concluded</span>
                            </div>
                          ) : (examCountdown as any)?.isToday ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold py-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                              <span>Examination scheduled today</span>
                            </div>
                          ) : (
                            <>
                              <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{examCountdown.daysLeft}</span>
                              <span className="text-xs text-[#64748B] dark:text-slate-400 font-semibold">days remaining</span>
                            </>
                          )
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium py-1">
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Official examination date not configured in ShikshaSahayak.</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pt-4 mt-2">
                      <button
                        type="button"
                        onClick={() => handleTabChange('curriculum')}
                        className="w-full py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-purple-200 dark:border-purple-800 cursor-pointer"
                      >
                        <span>View Syllabus Prep</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              </section>

              {/* TIMELINE & ENROLLED SUBJECTS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Academic Timeline (7 cols) */}
                <section className="lg:col-span-7 bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs">
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
                        Your Academic Timeline
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-slate-400">Upcoming milestones and deadlines</p>
                    </div>
                  </div>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0] dark:before:bg-slate-800">
                    {timelineEvents.length > 0 ? (
                      timelineEvents.slice(0, 4).map((evt, idx) => (
                        <div key={evt.id || idx} className="relative">
                          <div className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ${
                            idx === 0 ? 'bg-[#F97316] ring-4 ring-orange-100 dark:ring-orange-950' : 'bg-slate-400 dark:bg-slate-600'
                          }`}></div>
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                              idx === 0 ? 'text-[#F97316]' : 'text-[#0F172A] dark:text-slate-300'
                            }`}>
                              {evt.date ? evt.date.split('T')[0] : 'Upcoming'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {evt.category || 'ACADEMIC'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#0F172A] dark:text-slate-200 mt-1">
                            {evt.title}
                          </p>
                          <p className="text-[11px] text-[#64748B] dark:text-slate-400">{evt.subjectName} • {evt.daysRemaining !== undefined ? `${evt.daysRemaining} days left` : 'Schedule confirmed'}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-[#64748B] dark:text-slate-400">
                        <span>All assignments and timeline tasks are synchronized.</span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Enrolled Subjects (5 cols) */}
                <section className="lg:col-span-5 bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
                          Enrolled Subjects
                        </h3>
                        <p className="text-xs text-[#64748B] dark:text-slate-400">Semester {semesterNum} • {branchName}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleTabChange('curriculum')}
                        className="text-xs font-bold text-[#F97316] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-4 pt-1">
                      {subjects.slice(0, 5).map((subj: any) => (
                        <div key={subj.code || subj.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="min-w-0 flex-1 pr-2">
                              <span className="font-bold text-[#0F172A] dark:text-white truncate block">
                                {subj.name}
                              </span>
                              <span className="text-[10px] text-[#64748B] dark:text-slate-400">
                                Code {subj.code || 'N/A'} • {subj.units || 'Core Units'}
                              </span>
                            </div>
                            <span className="font-extrabold text-xs text-[#0F172A] dark:text-white shrink-0">
                              {subj.progress || 60}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                (subj.progress || 60) >= 70 ? 'bg-emerald-500' : (subj.progress || 60) >= 50 ? 'bg-[#F97316]' : 'bg-amber-500'
                              }`} 
                              style={{ width: `${subj.progress || 60}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400">
                    <span>Active Subjects: <strong className="text-[#0F172A] dark:text-white">{subjects.length}</strong></span>
                    <button 
                      type="button"
                      onClick={() => handleTabChange('curriculum')}
                      className="text-[#F97316] font-bold hover:underline cursor-pointer"
                    >
                      Course Study Plan →
                    </button>
                  </div>
                </section>

              </div>

              {/* PREP ZONE & CAREER ECOSYSTEM */}
              <section className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] dark:border-slate-800 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F97316] uppercase tracking-wider mb-1">
                      <Sparkles className="w-3.5 h-3.5" /> Prep Zone & Career Hub
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
                      Skills, Competitions & Placement Accelerator
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Curated for Engineering Students</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Resume Builder */}
                  <Link
                    to="/student/resume"
                    className="group p-4 rounded-xl border border-purple-200 dark:border-purple-900/40 hover:border-purple-500 dark:hover:border-purple-400 bg-purple-50/20 dark:bg-purple-950/10 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <h3 className="text-sm font-bold text-[#0F172A] dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          Pro Resume Builder
                        </h3>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-600 text-white">ATS 8+</span>
                      </div>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                        8 ATS-compliant engineering templates (Harvard Ivy, FAANG, Two-Column) with instant PDF export.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                      Build My Resume <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>

                  {/* Card 2: 5-Day Interview Prep */}
                  <Link
                    to="/career/interview-prep"
                    className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#F97316] dark:hover:border-[#F97316] bg-slate-50/50 dark:bg-slate-900/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white group-hover:text-[#F97316] transition-colors">
                        5-Day Interview Prep
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                        Intensive placement bootcamp covering core CS, aptitude, HR rounds, and mock interviews.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      Start Bootcamp <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>

                  {/* Card 3: Internships & Jobs */}
                  <Link
                    to="/career/internships"
                    className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#F97316] dark:hover:border-[#F97316] bg-slate-50/50 dark:bg-slate-900/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white group-hover:text-[#F97316] transition-colors">
                        Internships & Jobs
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                        Verified summer internships, off-campus freshers drives, and campus hiring notices.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      Explore Openings <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>

                  {/* Card 4: Personal Study Library */}
                  <Link
                    to="/student/library"
                    className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#F97316] dark:hover:border-[#F97316] bg-slate-50/50 dark:bg-slate-900/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                        <Bookmark className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white group-hover:text-[#F97316] transition-colors">
                        Personal Study Library
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                        Quick access to all your bookmarked GTU notes, saved question papers, and lab manuals.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      Open Library <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>

                  {/* Card 5: 100 Days of Code */}
                  <Link
                    to="/practice/100-days-of-code"
                    className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#F97316] dark:hover:border-[#F97316] bg-slate-50/50 dark:bg-slate-900/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#F97316] flex items-center justify-center mb-2">
                        <Code2 className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white group-hover:text-[#F97316] transition-colors">
                        100 Days of Code
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                        Daily algorithmic problem-solving sprint with automatic streak tracking and solutions.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#F97316] flex items-center gap-1">
                      Solve Today's Problem <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>

                  {/* Card 6: GATE 2027 Arena */}
                  <Link
                    to="/gate-2027"
                    className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#F97316] dark:hover:border-[#F97316] bg-slate-50/50 dark:bg-slate-900/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                        <Award className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white group-hover:text-[#F97316] transition-colors">
                        GATE 2027 Diagnostic
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                        National benchmark assessment with branch-wise diagnostic tests and subject cut-offs.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      Take Diagnostic Test <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>

                  {/* Card 7: College Festivals */}
                  <Link
                    to="/compete/festivals"
                    className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#F97316] dark:hover:border-[#F97316] bg-slate-50/50 dark:bg-slate-900/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white group-hover:text-[#F97316] transition-colors">
                        College Festivals & Contests
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                        GTU central techfest, national robotics battles, hackathon brackets, and symposiums.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      View Competitions <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>

                  {/* Card 8: Scholarships Directory */}
                  <Link
                    to="/opportunities/scholarships"
                    className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#F97316] dark:hover:border-[#F97316] bg-slate-50/50 dark:bg-slate-900/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
                        <Gift className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white group-hover:text-[#F97316] transition-colors">
                        Scholarships Directory
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 leading-relaxed">
                        State & Central Digital Gujarat, NSP, and merit-based financial assistance programs.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      Check Eligibility <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </div>
              </section>

              {/* GTU ENGINEERING DEPARTMENTS */}
              <section className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
                      Explore GTU Engineering Departments
                    </h2>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                      Browse syllabus, notes, and question papers across all university disciplines.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#F97316] bg-orange-500/10 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                    {branches.length > 0 ? `${branches.length} GTU Departments` : '7 Core GTU Departments'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {(branches.length > 0 ? branches : [
                    { id: 'cse', name: 'Computer Engineering', short_name: 'CSE', slug: 'computer-engineering' },
                    { id: 'it', name: 'Information Technology', short_name: 'IT', slug: 'information-technology' },
                    { id: 'electrical', name: 'Electrical Engineering', short_name: 'Electrical', slug: 'electrical-engineering' },
                    { id: 'ece', name: 'Electronics & Communication', short_name: 'ECE', slug: 'electronics-and-communication' },
                    { id: 'civil', name: 'Civil Engineering', short_name: 'Civil', slug: 'civil-engineering' },
                    { id: 'mechanical', name: 'Mechanical Engineering', short_name: 'Mechanical', slug: 'mechanical-engineering' },
                    { id: 'chemical', name: 'Chemical Engineering', short_name: 'Chemical', slug: 'chemical-engineering' },
                  ]).map((dept) => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => navigate(`/resources/study-material/${dept.slug}`)}
                      className="p-3 rounded-xl border text-left transition-all border-[#E2E8F0] dark:border-slate-800 hover:border-[#F97316] dark:hover:border-[#F97316] bg-slate-50/50 dark:bg-slate-900/40 text-[#0F172A] dark:text-slate-200 cursor-pointer"
                    >
                      <p className="text-xs font-bold truncate">{dept.short_name || dept.name}</p>
                      <p className="text-[10px] text-[#64748B] dark:text-slate-400 truncate mt-0.5">{dept.name}</p>
                    </button>
                  ))}
                </div>
              </section>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: STUDY & CURRICULUM */}
          {/* ======================================================== */}
          {activeTab === 'curriculum' && (
            <div className="space-y-6">
              
              {/* CURRICULUM BANNER */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0F172A] to-slate-900 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-[#F97316] border border-orange-500/30 text-xs font-bold mb-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>GTU NEP Scheme Curriculum</span>
                  </div>
                  <h2 className="text-xl sm:text-3xl font-extrabold">
                    {branchName} • Semester {semesterNum}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                    Official Gujarat Technological University teaching scheme, credit allocation, unit notes, and previous year papers.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to="/register"
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <span>Change Branch / Sem</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to={academicProfile?.branchId ? `/resources/study-material/${getCanonicalBranchSlug(academicProfile.branchId)}/semester/${academicProfile.semester || 1}` : "/resources/study-material"}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Study Notes</span>
                  </Link>
                  <Link
                    to={academicProfile?.branchId ? `/resources/pyq/${getCanonicalBranchSlug(academicProfile.branchId)}/semester/${academicProfile.semester || 1}` : "/resources/pyq"}
                    className="px-3.5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download PYQs</span>
                  </Link>
                  <Link
                    to={academicProfile?.branchId ? `/resources/syllabus/${getCanonicalBranchSlug(academicProfile.branchId)}/semester/${academicProfile.semester || 1}` : "/resources/syllabus"}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <ScrollText className="w-3.5 h-3.5" />
                    <span>Syllabus</span>
                  </Link>
                </div>
              </div>

              {/* SEARCH & FILTERS */}
              <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={curriculumSearch}
                    onChange={(e) => setCurriculumSearch(e.target.value)}
                    placeholder="Search subjects or GTU codes..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div className="flex items-center gap-3 text-xs text-[#64748B] dark:text-slate-400 self-end sm:self-auto">
                  <span>Enrolled: <strong className="text-[#0F172A] dark:text-white">{filteredCurriculumSubjects.length} Courses</strong></span>
                  <span>•</span>
                  <span>GTU Scheme: <strong className="text-[#F97316]">NEP / CBCS</strong></span>
                </div>
              </div>

              {/* SUBJECT CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCurriculumSubjects.map((subject: any) => (
                  <div
                    key={subject.code || subject.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 hover:border-[#F97316] dark:hover:border-[#F97316] transition-all shadow-2xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                          GTU {subject.code || '3130000'}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                          {subject.credits ? `${subject.credits} Credits` : '4 Credits'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#0F172A] dark:text-white leading-snug">
                        {subject.name}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 line-clamp-2">
                        {subject.description || `Comprehensive GTU syllabus units, theory derivations, practicals and solved papers for ${subject.name}.`}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-[#64748B] dark:text-slate-400 font-medium">Syllabus Units</span>
                        <span className="font-bold text-[#0F172A] dark:text-white">{subject.units || '6 Units'}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleTabChange('practice')}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-[#F97316] text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>Practice MCQs</span>
                      </button>

                      <Link
                        to="/resources/pyq"
                        className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PYQs</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {filteredCurriculumSubjects.length === 0 && (
                <div className="p-12 text-center bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-3xl space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#F97316] flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                    No matching subjects found
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 max-w-md mx-auto">
                    Try searching for another subject title or GTU subject code, or reset your search query.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurriculumSearch('')}
                    className="px-4 py-2 rounded-xl bg-[#F97316] text-white text-xs font-bold shadow-sm"
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              {/* QUICK ACADEMIC RESOURCES */}
              <div className="p-6 bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                  University Exam Preparation Resources
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link
                    to={academicProfile?.branchId ? `/resources/study-material/${getCanonicalBranchSlug(academicProfile.branchId)}/semester/${academicProfile.semester || 1}` : "/resources/study-material"}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-slate-50 dark:bg-slate-900/40 transition-colors block group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <p className="text-xs font-bold text-[#0F172A] dark:text-white group-hover:text-blue-500 transition-colors">GTU Study Notes</p>
                    </div>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400">Unit-wise notes, handwritten formula sheets, and chapter summaries.</p>
                  </Link>

                  <Link
                    to={academicProfile?.branchId ? `/resources/pyq/${getCanonicalBranchSlug(academicProfile.branchId)}/semester/${academicProfile.semester || 1}` : "/resources/pyq"}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#F97316] bg-slate-50 dark:bg-slate-900/40 transition-colors block group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-[#F97316]" />
                      <p className="text-xs font-bold text-[#0F172A] dark:text-white group-hover:text-[#F97316] transition-colors">GTU Previous Year Papers</p>
                    </div>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400">Winter 2018 to Summer 2025 question archives with solution keys.</p>
                  </Link>

                  <Link
                    to={academicProfile?.branchId ? `/resources/syllabus/${getCanonicalBranchSlug(academicProfile.branchId)}/semester/${academicProfile.semester || 1}` : "/resources/syllabus"}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 bg-slate-50 dark:bg-slate-900/40 transition-colors block group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ScrollText className="w-4 h-4 text-emerald-500" />
                      <p className="text-xs font-bold text-[#0F172A] dark:text-white group-hover:text-emerald-500 transition-colors">GTU Official Syllabus</p>
                    </div>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400">Theory hours, practical lab credits, and internal assessment criteria.</p>
                  </Link>

                  <Link
                    to="/gate-2027"
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#F97316] bg-slate-50 dark:bg-slate-900/40 transition-colors block group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <p className="text-xs font-bold text-[#0F172A] dark:text-white group-hover:text-[#F97316] transition-colors">GATE 2027 Hub</p>
                    </div>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400">Syllabus roadmaps, previous GATE question sets and recommended books.</p>
                  </Link>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: CLASSROOM & ATTENDANCE */}
          {/* ======================================================== */}
          {activeTab === 'classroom' && (
            <div className="space-y-8">
              
              {/* TWO COCKPIT ACTIONS: QUICK CHECK-IN & JOIN CLASSROOM */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Action 1: Quick Inline Attendance Check-In (6 cols) */}
                <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#F97316] flex items-center justify-center font-bold">
                        <Radio className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white">
                          Quick Attendance Check-In
                        </h3>
                        <p className="text-[11px] text-[#64748B] dark:text-slate-400">Enter active 6-character lecture code</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttendanceModalOpen(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-[#F97316] text-[11px] font-bold border border-orange-500/20 transition-colors cursor-pointer"
                    >
                      GPS Check-In
                    </button>
                  </div>

                  <form onSubmit={handleQuickSubmit} className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Lecture Session Code
                      </label>
                      <input
                        type="text"
                        maxLength={8}
                        value={quickCode}
                        onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
                        placeholder="e.g. 748291"
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-mono tracking-widest font-extrabold uppercase bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#F97316]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingQuick || !quickCode.trim()}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {submittingQuick ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>{submittingQuick ? 'Verifying...' : 'Submit Attendance'}</span>
                    </button>
                  </form>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Your attendance is cryptographically ledgered to your GTU Enrollment Number ({academicProfile?.enrollmentNumber || 'GTU-STUDENT'}).
                  </p>
                </div>

                {/* Action 2: Join College Classroom (6 cols) */}
                <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-white">
                          Join College Classroom
                        </h3>
                        <p className="text-[11px] text-[#64748B] dark:text-slate-400">Connect with your professors and batchmates</p>
                      </div>
                    </div>

                    <p className="text-xs text-[#64748B] dark:text-slate-400 mt-3 leading-relaxed">
                      Enter the 6-character classroom code provided by your faculty member to receive course materials, announcements, and track required 75% lecture attendance.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setJoinClassModalOpen(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Enter 6-Character Classroom Code</span>
                  </button>
                </div>

              </div>

              {/* ENROLLED CLASSROOMS SECTION */}
              <section className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white">
                      Enrolled College Classrooms
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-slate-400">Classes connected with your student ID</p>
                  </div>
                  <span className="text-xs font-bold text-[#F97316] bg-orange-500/10 px-2.5 py-1 rounded-lg">
                    {enrolledClasses.length} Active {enrolledClasses.length === 1 ? 'Class' : 'Classes'}
                  </span>
                </div>

                {enrolledClasses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enrolledClasses.map((cls: any) => (
                      <div
                        key={cls.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-[#F97316] transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-2">
                            <span className="truncate max-w-[150px]">{cls.subject_code || 'GTU COURSE'}</span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px]">
                              ACTIVE
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-[#0F172A] dark:text-white line-clamp-1">
                            {cls.name}
                          </h4>
                          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                            {cls.subject_name || 'Classroom'} • Prof. {cls.teacher_name || 'Faculty Member'}
                          </p>
                          <div className="mt-3 flex items-center gap-3 text-[11px] text-[#64748B] dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" /> {cls.student_count || 1} Students
                            </span>
                            <span>•</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              Code: {cls.join_code}
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 mt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setAttendanceModalOpen(true)}
                            className="text-[11px] font-bold text-[#F97316] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Mark Attendance</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#F97316] flex items-center justify-center mx-auto">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">
                      No classrooms joined yet
                    </h4>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 max-w-md mx-auto">
                      Ask your GTU subject professor for your 6-character class join code to see lecture streams and attendance.
                    </p>
                    <button
                      type="button"
                      onClick={() => setJoinClassModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[#F97316] text-white text-xs font-bold shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Enter Class Code</span>
                    </button>
                  </div>
                )}
              </section>

              {/* ACTIVE ASSIGNMENTS SECTION */}
              <section className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                    College Assignments & Lab Tasks
                  </h3>
                  <span className="text-xs text-[#64748B] dark:text-slate-400">
                    {assignments.length} Total
                  </span>
                </div>

                {assignments.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {assignments.map((asgn: any) => (
                      <div key={asgn.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                              {asgn.status || 'OPEN'}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white">
                              {asgn.title}
                            </h4>
                          </div>
                          <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1">
                            {asgn.subjectName || 'Engineering Course'} • Total Marks: {asgn.totalMarks || 20}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 self-start sm:self-auto">
                          Due: {asgn.dueDate ? asgn.dueDate.split('T')[0] : 'This Week'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-[#64748B] dark:text-slate-400">
                    <span>All caught up! No pending assignments from your college professors.</span>
                  </div>
                )}
              </section>

              {/* GTU 75% ORDINANCE NOTICE */}
              <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs text-[#0F172A] dark:text-slate-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#F97316]">GTU University Attendance Regulation</h4>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    Under Gujarat Technological University academic norms, students must maintain at least 75% aggregate attendance across theory lectures and laboratory sessions to be eligible for end-semester examinations.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: PRACTICE ARENA */}
          {/* ======================================================== */}
          {activeTab === 'practice' && (
            <div className="space-y-8">
              
              {/* GATE PRACTICE PLATFORM BANNER */}
              <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-[#0F172A] to-slate-900 border border-slate-700/60 p-6 sm:p-7 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-white">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-[#F97316] border border-orange-500/30 uppercase tracking-wider">
                      CBT Examination Arena
                    </span>
                    <span className="text-xs text-slate-300 font-medium">GATE 2026 / 2027 Simulator</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    GATE Practice &amp; Computer-Based Examination Arena
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                    Official past papers (PYQs), topic-wise conceptual drills, full-length 65-question mock exams, and instant performance diagnostics.
                  </p>
                </div>
                <Link
                  to="/student/test-dashboard"
                  className="w-full md:w-auto px-6 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all hover:scale-102 shrink-0"
                >
                  <span>Launch GATE Practice Arena</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* REAL PRACTICE METRICS BAR */}
              <section className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs">
                <div className="pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
                  <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
                    GTU Engineering Practice Arena
                  </h2>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                    Live server-evaluated conceptual MCQs and GTU mock tests.
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 block">Questions Solved</span>
                    <span className="text-2xl font-black text-[#0F172A] dark:text-white mt-1 block">
                      {practiceStats.questionsAttempted}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Total Attempts</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 block">Correct Answers</span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                      {practiceStats.correctAnswers}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Verified Correct</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 block">Accuracy Rate</span>
                    <span className="text-2xl font-black text-[#F97316] mt-1 block">
                      {practiceStats.questionsAttempted > 0 ? `${practiceStats.accuracyPercentage}%` : '0%'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Success Accuracy</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 block">Practice Streak</span>
                    <span className="text-2xl font-black text-amber-500 mt-1 block">
                      {practiceStats.currentStreakDays} Days
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Consecutive Days</span>
                  </div>
                </div>
              </section>

              {/* SUBJECT-WISE PRACTICE DRILLS */}
              <section className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                      Semester {semesterNum} Topic Quizzes ({branchName})
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-slate-400">Multiple choice practice drills tailored to your enrolled courses</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map((subj: any) => (
                    <div
                      key={subj.code || subj.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-[#F97316] transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] dark:text-slate-400 font-bold uppercase mb-1.5">
                          <span>Code: {subj.code || 'GTU'}</span>
                          <span className="text-[#F97316]">TOPIC DRILL</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white line-clamp-1">
                          {subj.name}
                        </h4>
                        <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">
                          Unit-wise conceptual assessments with explanations.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                        <Link
                          to={`/student/test-dashboard`}
                          className="w-full py-2 px-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Target className="w-3.5 h-3.5" />
                          <span>Start Assessment</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* PRACTICE MODES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  to="/practice/100-days-of-code"
                  className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#F97316] shadow-2xs transition-all space-y-2 block"
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-[#F97316] flex items-center justify-center font-bold">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">100 Days of Code</h4>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                    Algorithmic coding exercises and daily challenges with automatic test runner.
                  </p>
                </Link>

                <Link
                  to="/compete/coding-conquest"
                  className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-blue-500 shadow-2xs transition-all space-y-2 block"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">Coding Conquest</h4>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                    Live peer-to-peer programming battles and leaderboards for university students.
                  </p>
                </Link>

                <Link
                  to="/gate-2027"
                  className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-purple-500 shadow-2xs transition-all space-y-2 block"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">GATE 2027 Diagnostic</h4>
                  <p className="text-xs text-[#64748B] dark:text-slate-400 leading-relaxed">
                    National-level engineering entrance practice tests and subject roadmaps.
                  </p>
                </Link>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: PROGRESS & PROFILE */}
          {/* ======================================================== */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              
              {/* SUB-TAB TOGGLE: PERFORMANCE ANALYTICS VS PROFILE SETTINGS */}
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] dark:border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setProgressSubTab('analytics')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    progressSubTab === 'analytics'
                      ? 'bg-[#F97316] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Learning Analytics & Progress</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProgressSubTab('profile')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    progressSubTab === 'profile'
                      ? 'bg-[#F97316] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Student Profile & GTU Enrollment</span>
                </button>
              </div>

              {/* SUB-VIEW 1: LEARNING ANALYTICS (NO DUMMY DATA!) */}
              {progressSubTab === 'analytics' && (
                <div className="space-y-6">
                  
                  {/* Top Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#64748B] dark:text-slate-400">Today's Study Time</span>
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-[#F97316] flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl font-black text-[#0F172A] dark:text-white">
                        {analytics.dailyStudyTimeMinutes || 0} mins
                      </div>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Real Session Tracking
                      </p>
                    </div>

                    <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#64748B] dark:text-slate-400">Weekly Study Time</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Calendar className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl font-black text-[#0F172A] dark:text-white">
                        {((analytics.weeklyStudyTimeMinutes || 0) / 60).toFixed(1)} hrs
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400 font-semibold">
                        Past 7 days active reading
                      </p>
                    </div>

                    <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#64748B] dark:text-slate-400">Practice Accuracy</span>
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                          <Target className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl font-black text-[#0F172A] dark:text-white">
                        {practiceStats.questionsAttempted > 0 ? `${practiceStats.accuracyPercentage}%` : '0%'}
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: `${practiceStats.accuracyPercentage || 0}%` }} />
                      </div>
                    </div>

                    <div className="p-5 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#64748B] dark:text-slate-400">Study Streak</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                          <Flame className="w-4 h-4 fill-current" />
                        </div>
                      </div>
                      <div className="text-2xl font-black text-[#0F172A] dark:text-white">
                        {practiceStats.currentStreakDays || analytics.learningStreakDays || 1} Days
                      </div>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">Consistent Study Pace</p>
                    </div>
                  </div>

                  {/* Weekly Study Time Bar Chart */}
                  <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white flex items-center gap-2">
                          <BarChart2 className="w-5 h-5 text-[#F97316]" />
                          Weekly Study Time Breakdown
                        </h3>
                        <p className="text-xs text-[#64748B] dark:text-slate-400">Minutes spent reading notes, solving PYQs, and taking practice quizzes</p>
                      </div>
                      <span className="text-xs font-bold text-[#F97316] bg-orange-500/10 px-3 py-1 rounded-full">
                        Past 7 Days
                      </span>
                    </div>

                    <div className="pt-4 flex items-end justify-between gap-2 h-44 border-b border-slate-100 dark:border-slate-800 pb-2">
                      {(analytics.weeklyLogs && analytics.weeklyLogs.length > 0 ? analytics.weeklyLogs : Array.from({ length: 7 }).map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - (6 - i));
                        return { date: d.toISOString().split('T')[0], minutesSpent: 0 };
                      })).map((log: any, idx: number) => {
                        const heightPercent = Math.round((log.minutesSpent / maxWeeklyMinutes) * 100);
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                            <span className="text-[10px] font-bold text-[#F97316] opacity-0 group-hover:opacity-100 transition">
                              {log.minutesSpent}m
                            </span>
                            <div 
                              className="w-full max-w-[36px] bg-gradient-to-t from-[#F97316] to-amber-400 rounded-t-xl transition-all shadow-xs"
                              style={{ height: `${Math.max(12, heightPercent)}%` }}
                            />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Real Enrolled Subjects Completion (NO FAKE CSE SUBJECTS!) */}
                  <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[#F97316]" />
                        Active Semester Subject Completion ({branchName})
                      </h3>
                      <span className="text-xs text-[#64748B] dark:text-slate-400">Semester {semesterNum}</span>
                    </div>

                    <div className="space-y-4">
                      {subjects.map((sub: any, idx: number) => {
                        const colors = ['bg-[#F97316]', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500'];
                        const colorClass = colors[idx % colors.length];
                        const prog = typeof sub.progress === 'number' ? sub.progress : 0;

                        return (
                          <div key={sub.code || idx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-[#0F172A] dark:text-white">{sub.name} ({sub.code || 'GTU'})</span>
                              <span className="text-[#F97316]">{prog}% Completed</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                              <div className={`${colorClass} h-full rounded-full transition-all`} style={{ width: `${prog}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* SUB-VIEW 2: EDITABLE STUDENT PROFILE & GTU SETTINGS */}
              {progressSubTab === 'profile' && (
                <div className="space-y-6">
                  
                  {/* Status Alerts */}
                  {profileSavedSuccess && (
                    <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-extrabold shadow-md flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Profile & Cloudflare D1 Database Successfully Updated!</span>
                    </div>
                  )}

                  {profileErrorMsg && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold">
                      ⚠️ {profileErrorMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    
                    {/* 1. Personal Details */}
                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                      <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-[#F97316]" />
                        Personal Information
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Full Name</label>
                          <input
                            type="text"
                            required
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#F97316] font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
                          <input
                            type="email"
                            disabled
                            value={profileEmail}
                            className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 font-medium cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Mobile Number</label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input
                              type="tel"
                              maxLength={10}
                              value={profilePhone}
                              onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, ''))}
                              placeholder="10-digit mobile number"
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#F97316] font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Date of Birth</label>
                          <input
                            type="date"
                            value={profileDob}
                            onChange={(e) => setProfileDob(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#F97316] font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Academic Setup & GTU Enrollment */}
                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                      <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-[#F97316]" />
                        Academic Setup & GTU Enrollment
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* GTU Enrollment Input with Live Decoder */}
                        <div className="sm:col-span-2 p-4 rounded-xl bg-orange-50/50 dark:bg-slate-900/60 border border-orange-200/60 dark:border-slate-800 space-y-2">
                          <label className="text-xs font-bold text-[#0F172A] dark:text-white flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <ClipboardCheck className="w-4 h-4 text-[#F97316]" />
                              <span>GTU Enrollment Number</span>
                            </span>
                            <span className="text-[10px] text-[#F97316] font-mono">12 Digits</span>
                          </label>
                          <input
                            type="text"
                            maxLength={12}
                            value={profileEnrollment}
                            onChange={(e) => setProfileEnrollment(e.target.value.replace(/\D/g, ''))}
                            placeholder="e.g. 240430116128"
                            className="w-full px-4 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#F97316] font-mono tracking-wider font-bold"
                          />

                          {profileEnrollment.length > 0 && (
                            <div className="mt-2 p-3 rounded-xl bg-white dark:bg-slate-950 border border-orange-200 dark:border-slate-800 space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                              <div className="flex items-center justify-between font-extrabold text-[#F97316] text-[10px] uppercase">
                                <span><Sparkles className="w-3 h-3 inline mr-1" /> GTU Live Decoder</span>
                                <span>{parsedEnrollment.isValid ? '✓ Valid 12 Digits' : `${profileEnrollment.length}/12 Digits`}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 pt-1">
                                <div>Entry Year: <strong>{parsedEnrollment.yearFull || '--'}</strong></div>
                                <div>Roll No: <strong>#{parsedEnrollment.studentRoll || '---'}</strong></div>
                                <div className="col-span-2">College: <strong>{parsedEnrollment.collegeName || 'Detecting...'}</strong></div>
                                <div className="col-span-2">Branch: <strong>{parsedEnrollment.branchName || 'Detecting...'}</strong></div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">University</label>
                          <input
                            type="text"
                            value={profileUniversity}
                            onChange={(e) => setProfileUniversity(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#F97316] font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Degree / Course</label>
                          <input
                            type="text"
                            value={profileDegree}
                            onChange={(e) => setProfileDegree(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#F97316] font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">College / Institute</label>
                          <input
                            type="text"
                            value={profileCollege}
                            onChange={(e) => setProfileCollege(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#F97316] font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Branch / Department</label>
                          <input
                            type="text"
                            value={profileBranch}
                            onChange={(e) => setProfileBranch(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#F97316] font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Current Semester</label>
                          <select
                            value={profileSemester}
                            onChange={(e) => setProfileSemester(Number(e.target.value))}
                            className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#F97316] font-bold"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                              <option key={s} value={s}>Semester {s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* 3. Goals & Preferences */}
                    <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                      <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-[#F97316]" />
                        Academic Target & Goals
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Semester Target</label>
                          <input
                            type="text"
                            value={profileGoals}
                            onChange={(e) => setProfileGoals(e.target.value)}
                            placeholder="e.g. SPI > 8.5, Master DSA"
                            className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#F97316] font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Career Goal</label>
                          <input
                            type="text"
                            value={profileCareerGoal}
                            onChange={(e) => setProfileCareerGoal(e.target.value)}
                            placeholder="e.g. Software Engineer, GATE 2027"
                            className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#F97316] font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Profile Data</span>
                      </button>

                      <button
                        type="submit"
                        disabled={profileSaving}
                        className="px-6 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                      </button>
                    </div>

                  </form>
                </div>
              )}

            </div>
          )}

        </div>
      </div>

      {/* Classroom Join Code Modal */}
      <JoinClassModal
        open={joinClassModalOpen}
        onOpenChange={setJoinClassModalOpen}
        initialCode={initialJoinCode}
        currentUser={{
          id: currentUser?.uid || 'student',
          name: studentName,
          email: currentUser?.email || '',
          enrollmentNo: academicProfile?.enrollmentNumber || profileEnrollment,
        }}
        onSuccessJoined={() => {
          loadDashboard();
        }}
      />

      {/* Live Attendance Check-In Modal */}
      <StudentAttendanceModal
        open={attendanceModalOpen}
        onOpenChange={setAttendanceModalOpen}
        currentUser={{
          id: currentUser?.uid || 'student',
          name: studentName,
          enrollmentNo: academicProfile?.enrollmentNumber || profileEnrollment,
        }}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0F172A] rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white">Delete Profile Data</h3>
            </div>
            <p className="text-xs text-[#64748B] dark:text-slate-300 leading-relaxed">
              This action will permanently delete your personalized academic settings from Cloudflare D1 and log you out. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={confirmDeleteInput}
              onChange={(e) => setConfirmDeleteInput(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#0F172A] dark:text-white focus:outline-none focus:border-red-500 font-mono font-bold"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmDeleteInput.trim().toUpperCase() !== 'DELETE' || isDeletingProfile}
                onClick={handleDeleteProfile}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isDeletingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </ShikshaSahayakShell>
  );
};

export default StudentPortalHome;
