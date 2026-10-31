import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { StudentAcademicProvider } from './context/StudentAcademicContext';
import { LearningEcosystemProvider } from './context/LearningEcosystemContext';
import AdminRoute from './components/AdminRoute';
import { StudentRoute } from './components/StudentRoute';
import { TeacherRoute } from './components/teacher/TeacherRoute';
import ScrollToTop from './components/ScrollToTop';
import { DashboardShell } from './components/layout/DashboardShell';
import { UserRole } from './types';
import BugBountyWidget from './components/BugBountyWidget';

// Resilient lazy-loading helper with automatic single retry for stale server module sessions or network glitches
const lazyWithRetry = <T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T } | any>
) =>
  React.lazy(async () => {
    const pageRefreshed = sessionStorage.getItem('lazy_retry_refreshed');
    try {
      const component = await componentImport();
      sessionStorage.removeItem('lazy_retry_refreshed');
      return component;
    } catch (error) {
      if (!pageRefreshed) {
        sessionStorage.setItem('lazy_retry_refreshed', 'true');
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });

// Lazy load route pages for performance bundle splitting
const Home = lazyWithRetry(() => import('./pages/Home'));
const StudyMaterialView = lazyWithRetry(() => import('./pages/StudyMaterialView'));
const ResourcesHub = lazyWithRetry(() => import('./pages/browse/ResourcesHub'));
const TypeAboutPage = lazyWithRetry(() => import('./pages/browse/TypeAboutPage'));
const BranchPage = lazyWithRetry(() => import('./pages/browse/BranchPage'));
const SemesterPage = lazyWithRetry(() => import('./pages/browse/SemesterPage'));
const SubjectPage = lazyWithRetry(() => import('./pages/browse/SubjectPage'));
const SessionPage = lazyWithRetry(() => import('./pages/browse/SessionPage'));
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const AdminLogin = lazyWithRetry(() => import('./pages/AdminLogin'));
const Contribute = lazyWithRetry(() => import('./pages/Contribute'));
const AIChat = lazyWithRetry(() => import('./pages/AIChat'));
const About = lazyWithRetry(() => import('./pages/About'));
const Contact = lazyWithRetry(() => import('./pages/Contact'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazyWithRetry(() => import('./pages/TermsOfService'));
const Disclaimer = lazyWithRetry(() => import('./pages/Disclaimer'));
const ExamTips = lazyWithRetry(() => import('./pages/ExamTips'));
const StudyGuides = lazyWithRetry(() => import('./pages/StudyGuides'));
const StudyGuideView = lazyWithRetry(() => import('./pages/StudyGuideView'));
const Sitemap = lazyWithRetry(() => import('./pages/Sitemap'));
const Announcements = lazyWithRetry(() => import('./pages/Announcements'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
const Blogs = lazyWithRetry(() => import('./pages/Blogs'));
const BlogView = lazyWithRetry(() => import('./pages/BlogView'));
const AcademicStudyMaterialView = lazyWithRetry(() => import('./pages/AcademicStudyMaterialView'));
const AcademicPYQView = lazyWithRetry(() => import('./pages/AcademicPYQView'));
const Gate2027 = lazyWithRetry(() => import('./pages/Gate2027'));
const Login = lazyWithRetry(() => import('./pages/Login'));
const RegisterChoice = lazyWithRetry(() => import('./pages/RegisterChoice'));
const StudentRegister = lazyWithRetry(() => import('./pages/StudentRegister'));
const TeacherRegister = lazyWithRetry(() => import('./pages/TeacherRegister'));
const Whiteboard = lazyWithRetry(() => import('./pages/Whiteboard'));
const Planner = lazyWithRetry(() => import('./pages/Planner'));
const Feedback = lazyWithRetry(() => import('./pages/Feedback'));
const BulkUpload = lazyWithRetry(() => import('./pages/BulkUpload'));
const BugBounty = lazyWithRetry(() => import('./pages/BugBounty'));
const HackathonSocialCause = lazyWithRetry(() => import('./pages/HackathonSocialCause'));

// Dashboards
const StudentPortalHome = lazyWithRetry(() => import('./pages/dashboard/StudentPortalHome'));
const StudentDashboard = lazyWithRetry(() => import('./pages/dashboard/StudentDashboard'));
const StudentClassroomsPage = lazyWithRetry(() => import('./pages/dashboard/StudentClassroomsPage'));
const StudentAttendancePage = lazyWithRetry(() => import('./pages/dashboard/StudentAttendancePage'));
const PracticeZone = lazyWithRetry(() => import('./pages/dashboard/PracticeZone'));
const QuizAttempt = lazyWithRetry(() => import('./pages/dashboard/QuizAttempt'));
const QuizResult = lazyWithRetry(() => import('./pages/dashboard/QuizResult'));
const MyLibrary = lazyWithRetry(() => import('./pages/dashboard/MyLibrary'));
const AcademicCalendarPage = lazyWithRetry(() => import('./pages/dashboard/AcademicCalendarPage'));
const NotificationCenterPage = lazyWithRetry(() => import('./pages/dashboard/NotificationCenterPage'));
const SmartDownloadManager = lazyWithRetry(() => import('./pages/dashboard/SmartDownloadManager'));
const MyProfilePage = lazyWithRetry(() => import('./pages/dashboard/MyProfilePage'));
const LearningAnalyticsPage = lazyWithRetry(() => import('./pages/dashboard/LearningAnalyticsPage'));
const StudyPage = lazyWithRetry(() => import('./pages/browse/StudyPage'));
const MySubjectsPage = lazyWithRetry(() => import('./pages/dashboard/MySubjectsPage'));
const AssignmentsPage = lazyWithRetry(() => import('./pages/dashboard/AssignmentsPage'));
const AcademicTimelinePage = lazyWithRetry(() => import('./pages/dashboard/AcademicTimelinePage'));
const PracticeExamPage = lazyWithRetry(() => import('./pages/dashboard/PracticeExamPage'));
const TeacherDashboard = lazyWithRetry(() => import('./pages/dashboard/TeacherDashboard'));
const TeacherLogin = lazyWithRetry(() => import('./pages/TeacherLogin'));
const TeacherOnboarding = lazyWithRetry(() => import('./pages/TeacherOnboarding'));
const ClassList = lazyWithRetry(() => import('./pages/teacher/ClassList'));
const ClassDetails = lazyWithRetry(() => import('./pages/teacher/ClassDetails'));
const AssignmentList = lazyWithRetry(() => import('./components/teacher/AssignmentList'));
const AssignmentDetails = lazyWithRetry(() => import('./pages/teacher/AssignmentDetails'));
const AssignmentSubmissions = lazyWithRetry(() => import('./pages/teacher/AssignmentSubmissions'));
const TeacherSubjectsPage = lazyWithRetry(() => import('./pages/teacher/TeacherSubjectsPage'));
const TeacherStudentsPage = lazyWithRetry(() => import('./pages/teacher/TeacherStudentsPage'));
const TeacherAttendancePage = lazyWithRetry(() => import('./pages/teacher/TeacherAttendancePage'));
const TeacherAssignmentsPage = lazyWithRetry(() => import('./pages/teacher/TeacherAssignmentsPage'));
const TeacherQuizzesPage = lazyWithRetry(() => import('./pages/teacher/TeacherQuizzesPage'));
const TeacherQuestionBankPage = lazyWithRetry(() => import('./pages/teacher/TeacherQuestionBankPage'));
const TeacherResultsPage = lazyWithRetry(() => import('./pages/teacher/TeacherResultsPage'));
const TeacherNotesPage = lazyWithRetry(() => import('./pages/teacher/TeacherNotesPage'));
const TeacherMaterialsPage = lazyWithRetry(() => import('./pages/teacher/TeacherMaterialsPage'));
const TeacherUploadMaterialPage = lazyWithRetry(() => import('./pages/teacher/TeacherUploadMaterialPage'));
const TeacherResourceLibraryPage = lazyWithRetry(() => import('./pages/teacher/TeacherResourceLibraryPage'));
const TeacherAnnouncementsPage = lazyWithRetry(() => import('./pages/teacher/TeacherAnnouncementsPage'));
const TeacherMessagesPage = lazyWithRetry(() => import('./pages/teacher/TeacherMessagesPage'));
const TeacherSettingsPage = lazyWithRetry(() => import('./pages/teacher/TeacherSettingsPage'));
const StudentCareerDashboard = lazyWithRetry(() => import('./components/career/StudentCareerDashboard').then(m => ({ default: m.StudentCareerDashboard })));
const InstitutionSaaSHub = lazyWithRetry(() => import('./components/institution/InstitutionSaaSHub').then(m => ({ default: m.InstitutionSaaSHub })));
const IntelligenceHub = lazyWithRetry(() => import('./components/intelligence/IntelligenceHub').then(m => ({ default: m.IntelligenceHub })));
const AdminQuestionIntelligenceDashboard = lazyWithRetry(() => import('./pages/admin/AdminQuestionIntelligenceDashboard'));

const CareerListingsPage = lazyWithRetry(() => import('./pages/career/CareerListingsPage'));
const CareerDetailPage = lazyWithRetry(() => import('./pages/career/CareerDetailPage'));
const FiveDayInterviewPrepPage = lazyWithRetry(() => import('./pages/career/FiveDayInterviewPrepPage'));
const CoursesCatalogPage = lazyWithRetry(() => import('./pages/courses/CoursesCatalogPage'));
const CoursePlayerPage = lazyWithRetry(() => import('./pages/courses/CoursePlayerPage'));
const ScholarshipsPage = lazyWithRetry(() => import('./pages/opportunities/ScholarshipsPage'));
const WorkshopsPage = lazyWithRetry(() => import('./pages/opportunities/WorkshopsPage'));
const CollegeFestivalsPage = lazyWithRetry(() => import('./pages/compete/CollegeFestivalsPage'));
const HundredDaysOfCodePage = lazyWithRetry(() => import('./pages/practice/HundredDaysOfCodePage'));
const HundredDaysHub = lazyWithRetry(() => import('./pages/student/100-days-code/HundredDaysHub'));
const CodingConquestPage = lazyWithRetry(() => import('./pages/compete/CodingConquestPage'));

const ResumeBuilderPage = lazyWithRetry(() => import('./pages/dashboard/ResumeBuilderPage'));
const CodingPlatformPage = lazyWithRetry(() => import('./pages/dashboard/CodingPlatformPage'));
const MarketplacePage = lazyWithRetry(() => import('./pages/dashboard/MarketplacePage'));
const ParentPortalPage = lazyWithRetry(() => import('./pages/dashboard/ParentPortalPage'));
const CurriculumManagementPage = lazyWithRetry(() => import('./pages/admin/CurriculumManagementPage'));

// Question Intelligence Engine Components (Phases 1D-1J)
const StudentAdaptiveDashboard = lazyWithRetry(() => import('./components/student/StudentAdaptiveDashboard').then(m => ({ default: m.StudentAdaptiveDashboard })));
const StudentTestDashboard = lazyWithRetry(() => import('./components/practice/StudentTestDashboard').then(m => ({ default: m.StudentTestDashboard })));
const StudentTestInterface = lazyWithRetry(() => import('./components/practice/StudentTestInterface').then(m => ({ default: m.StudentTestInterface })));
const StudentTestResultView = lazyWithRetry(() => import('./components/practice/StudentTestResultView').then(m => ({ default: m.StudentTestResultView })));
const StudentTestHistoryView = lazyWithRetry(() => import('./components/practice/StudentTestHistoryView').then(m => ({ default: m.StudentTestHistoryView })));

const AdminQuestionBankDashboard = lazyWithRetry(() => import('./components/admin/AdminQuestionBankDashboard').then(m => ({ default: m.AdminQuestionBankDashboard })));
const AdminPipelineMonitor = lazyWithRetry(() => import('./components/admin/AdminPipelineMonitor').then(m => ({ default: m.AdminPipelineMonitor })));
const AdminQuestionQualityCenter = lazyWithRetry(() => import('./components/admin/AdminQuestionQualityCenter').then(m => ({ default: m.AdminQuestionQualityCenter })));
const AdminAdaptiveAnalytics = lazyWithRetry(() => import('./components/admin/AdminAdaptiveAnalytics').then(m => ({ default: m.AdminAdaptiveAnalytics })));

// Lazy load global popups

const AnnouncementPopup = lazyWithRetry(() => import('./components/AnnouncementPopup'));
const CookieConsent = lazyWithRetry(() => import('./components/CookieConsent'));

// Dev-only Agentation setup (Tree-shaken completely in production)
const AgentationDev = import.meta.env.DEV
  ? lazyWithRetry(() => import('agentation').then(m => ({ default: m.Agentation })))
  : null;

const RedirectToMaterials: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/materials/${id}`} replace />;
};

const RedirectToMaterialsWithDocPrefix: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/materials/doc_${id}`} replace />;
};

const JoinCodeRedirect: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const { code } = useParams<{ code?: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const joinCode = (code || searchParams.get('joinCode') || searchParams.get('code') || searchParams.get('joincode') || '').trim().toUpperCase();

  if (loading) {
    return <PageLoader />;
  }

  if (joinCode) {
    try {
      sessionStorage.setItem('pending_join_code', joinCode);
    } catch {}
    if (currentUser) {
      return <Navigate to={`/student?joinCode=${encodeURIComponent(joinCode)}`} replace />;
    }
    return <Navigate to={`/login?joinCode=${encodeURIComponent(joinCode)}`} replace />;
  }
  return <Navigate to={currentUser ? '/student' : '/login'} replace />;
};

// Lightweight Page Loader for Suspense boundaries
const PageLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
    <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading page...</p>
  </div>
);

import { PWAProvider } from './context/PWAContext';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

import { BetaFeatureProvider } from './contexts/BetaFeatureContext';
import { BetaGuard } from './components/BetaGuard';
import { BetaHostGate } from './components/BetaHostGate';

const App: React.FC = () => {
  console.log("[APP] App component mounting");
  console.log("[ROUTES] Routes tree rendering");
  return (
    <PWAProvider>
      <Router>
        <PWAInstallBanner />
        <OfflineIndicator />
        <ScrollToTop />
        <Suspense fallback={null}>
          <CookieConsent />
        </Suspense>
        <Suspense fallback={null}>
          <AnnouncementPopup />
        </Suspense>
        <AuthProvider>
          <BetaFeatureProvider>
            <StudentAcademicProvider>
              <LearningEcosystemProvider>
                <Layout>
                <BetaHostGate>
                <Suspense fallback={<PageLoader />}>
                <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/study" element={<Navigate to="/student?tab=curriculum" replace />} />
                <Route path="/subjects" element={<Navigate to="/student?tab=curriculum" replace />} />
                <Route path="/student/subjects" element={<Navigate to="/student?tab=curriculum" replace />} />
                <Route path="/practice" element={<Navigate to="/student?tab=practice" replace />} />
                <Route path="/practice/exam" element={<DashboardShell role={UserRole.STUDENT}><PracticeExamPage /></DashboardShell>} />
                <Route path="/assignments" element={<Navigate to="/student?tab=classroom" replace />} />
                <Route path="/student/assignments" element={<Navigate to="/student?tab=classroom" replace />} />
                <Route path="/timeline" element={<DashboardShell role={UserRole.STUDENT}><AcademicTimelinePage /></DashboardShell>} />
                <Route path="/student/timeline" element={<DashboardShell role={UserRole.STUDENT}><AcademicTimelinePage /></DashboardShell>} />
                <Route path="/resources" element={<DashboardShell role={UserRole.STUDENT}><ResourcesHub /></DashboardShell>} />
                <Route path="/resources/:type" element={<DashboardShell role={UserRole.STUDENT}><TypeAboutPage /></DashboardShell>} />
                <Route path="/resources/:type/departments" element={<Navigate to="../" replace />} />
                <Route path="/resources/:type/:branchSlug" element={<DashboardShell role={UserRole.STUDENT}><BranchPage /></DashboardShell>} />
                <Route path="/resources/:type/:branchSlug/semester/:sem" element={<DashboardShell role={UserRole.STUDENT}><SemesterPage /></DashboardShell>} />
                <Route path="/resources/:type/:branchSlug/semester/:sem/:subjectSlug" element={<DashboardShell role={UserRole.STUDENT}><SubjectPage /></DashboardShell>} />
                <Route
                  path="/resources/:type/:branchSlug/semester/:sem/:subjectSlug/:session"
                  element={<DashboardShell role={UserRole.STUDENT}><SessionPage /></DashboardShell>}
                />
                <Route path="/pyqs" element={<Navigate to="/resources/pyq" replace />} />
                <Route path="/pyqs/*" element={<Navigate to="/resources/pyq" replace />} />
                <Route path="/resources/pyqs" element={<Navigate to="/resources/pyq" replace />} />
                <Route path="/resources/pyqs/*" element={<Navigate to="/resources/pyq" replace />} />
                <Route path="/notes" element={<Navigate to="/resources/study-material" replace />} />
                <Route path="/notes/*" element={<Navigate to="/resources/study-material" replace />} />
                <Route path="/resources/notes" element={<Navigate to="/resources/study-material" replace />} />
                <Route path="/resources/notes/*" element={<Navigate to="/resources/study-material" replace />} />
                <Route path="/resources/study-materials" element={<Navigate to="/resources/study-material" replace />} />
                <Route path="/resources/study-materials/*" element={<Navigate to="/resources/study-material" replace />} />
                <Route path="/resources/syllabuses" element={<Navigate to="/resources/syllabus" replace />} />
                <Route path="/resources/syllabuses/*" element={<Navigate to="/resources/syllabus" replace />} />
                <Route path="/study-material" element={<Navigate to="/resources/study-material" replace />} />
                <Route path="/study-material/*" element={<Navigate to="/resources/study-material" replace />} />
                <Route path="/materials" element={<Navigate to="/resources/study-material" replace />} />
                <Route path="/dashboard/pyq-hub" element={<Navigate to="/resources/pyq" replace />} />
                <Route path="/materials/:id" element={<DashboardShell role={UserRole.STUDENT}><StudyMaterialView /></DashboardShell>} />
                <Route path="/ai-tutor" element={
                  <BetaGuard featureKey="aiCopilot">
                    <AIChat />
                  </BetaGuard>
                } />
                <Route path="/resources/syllabus/doc_:id" element={<RedirectToMaterialsWithDocPrefix />} />
                <Route path="/resources/pyq/doc_:id" element={<RedirectToMaterialsWithDocPrefix />} />
                <Route path="/resources/study-material/doc_:id" element={<RedirectToMaterialsWithDocPrefix />} />
                <Route path="/contribute" element={<DashboardShell role={UserRole.STUDENT}><Contribute /></DashboardShell>} />
                <Route path="/guides" element={<StudyGuides />} />
                <Route path="/guides/:slug" element={<StudyGuideView />} />
                <Route path="/blogs" element={<Blogs />} />
                <Route path="/blogs/:id" element={<BlogView />} />
                <Route path="/articles" element={<Blogs />} />
                <Route path="/articles/:id" element={<BlogView />} />

                {/* Prep Zone & Career Expansion Routes */}
                <Route path="/courses" element={<DashboardShell role={UserRole.STUDENT}><CoursesCatalogPage /></DashboardShell>} />
                <Route path="/courses/:courseSlug/learn" element={<DashboardShell role={UserRole.STUDENT}><CoursePlayerPage /></DashboardShell>} />
                <Route path="/courses/:courseSlug" element={<DashboardShell role={UserRole.STUDENT}><CoursePlayerPage /></DashboardShell>} />

              <Route path="/scholarships" element={<DashboardShell role={UserRole.STUDENT}><ScholarshipsPage /></DashboardShell>} />
              <Route path="/opportunities/scholarships" element={<DashboardShell role={UserRole.STUDENT}><ScholarshipsPage /></DashboardShell>} />

              <Route path="/workshops" element={<DashboardShell role={UserRole.STUDENT}><WorkshopsPage /></DashboardShell>} />
              <Route path="/opportunities/workshops" element={<DashboardShell role={UserRole.STUDENT}><WorkshopsPage /></DashboardShell>} />

              <Route path="/festivals" element={<DashboardShell role={UserRole.STUDENT}><CollegeFestivalsPage /></DashboardShell>} />
              <Route path="/compete/festivals" element={<DashboardShell role={UserRole.STUDENT}><CollegeFestivalsPage /></DashboardShell>} />
              <Route path="/compete/college-festivals" element={<DashboardShell role={UserRole.STUDENT}><CollegeFestivalsPage /></DashboardShell>} />
              <Route path="/compete/hackathons" element={<DashboardShell role={UserRole.STUDENT}><CollegeFestivalsPage /></DashboardShell>} />

              <Route path="/coding/100-days" element={<DashboardShell role={UserRole.STUDENT}><HundredDaysHub /></DashboardShell>} />
              <Route path="/practice/100-days-of-code" element={<DashboardShell role={UserRole.STUDENT}><HundredDaysHub /></DashboardShell>} />
              <Route path="/practice/100-days-code" element={<DashboardShell role={UserRole.STUDENT}><HundredDaysHub /></DashboardShell>} />

              <Route path="/coding/conquest" element={<DashboardShell role={UserRole.STUDENT}><CodingConquestPage /></DashboardShell>} />
              <Route path="/compete/coding-conquest" element={<DashboardShell role={UserRole.STUDENT}><CodingConquestPage /></DashboardShell>} />

              <Route path="/career" element={<DashboardShell role={UserRole.STUDENT}><CareerListingsPage /></DashboardShell>} />
              <Route path="/career/internships" element={<DashboardShell role={UserRole.STUDENT}><CareerListingsPage /></DashboardShell>} />
              <Route path="/career/internships/:id" element={<DashboardShell role={UserRole.STUDENT}><CareerDetailPage /></DashboardShell>} />
              <Route path="/career/jobs" element={<DashboardShell role={UserRole.STUDENT}><CareerListingsPage /></DashboardShell>} />
              <Route path="/career/jobs/:id" element={<DashboardShell role={UserRole.STUDENT}><CareerDetailPage /></DashboardShell>} />
              <Route path="/career/:id" element={<DashboardShell role={UserRole.STUDENT}><CareerDetailPage /></DashboardShell>} />
              <Route path="/student/career-hub" element={<DashboardShell role={UserRole.STUDENT}><CareerListingsPage /></DashboardShell>} />
              <Route path="/career/interview-prep" element={<DashboardShell role={UserRole.STUDENT}><FiveDayInterviewPrepPage /></DashboardShell>} />
              <Route path="/career/5-day-interview-prep" element={<DashboardShell role={UserRole.STUDENT}><FiveDayInterviewPrepPage /></DashboardShell>} />
              <Route path="/career/resume-builder" element={<DashboardShell role={UserRole.STUDENT}><ResumeBuilderPage /></DashboardShell>} />
              <Route path="/community" element={<Navigate to="/student/lms" replace />} />

              <Route path="/academic-study-materials/:id" element={<RedirectToMaterials />} />
              <Route path="/academic-notes/:id" element={<RedirectToMaterials />} />
              <Route path="/academic-pyqs/:id" element={<RedirectToMaterials />} />
              <Route path="/gate-2027" element={<DashboardShell role={UserRole.STUDENT}><Gate2027 /></DashboardShell>} />
              <Route path="/login" element={<Login />} />
              <Route path="/join" element={<JoinCodeRedirect />} />
              <Route path="/join/:code" element={<JoinCodeRedirect />} />
              <Route path="/register" element={<StudentRegister />} />
              <Route path="/register/student" element={<StudentRegister />} />
              <Route path="/student/register" element={<StudentRegister />} />
              <Route path="/register/teacher" element={<TeacherRegister />} />
              <Route path="/teacher/register" element={<Navigate to="/register/teacher" replace />} />
              <Route path="/onboarding" element={<Navigate to="/register" replace />} />

              {/* Legal / AdSense Pages - Direct rendering for crawlers */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/privacypolicy" element={<PrivacyPolicy />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/privacy-policy.html" element={<PrivacyPolicy />} />
              <Route path="/privacy.html" element={<PrivacyPolicy />} />
              <Route path="/about" element={<About />} />
              <Route path="/hackathon" element={<HackathonSocialCause />} />
              <Route path="/social-cause" element={<HackathonSocialCause />} />
              <Route path="/vbyld-2027" element={<HackathonSocialCause />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/bug-bounty" element={<BugBounty />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/terms-and-conditions" element={<TermsOfService />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/sitemap" element={<Sitemap />} />
              <Route path="/exam-tips" element={<ExamTips />} />
              <Route path="/announcements" element={<Announcements />} />
              
              {/* Admin Portal Routes */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />

              {/* Student Portal Dashboard Routes */}
              <Route path="/student" element={<StudentPortalHome />} />
              <Route path="/student/dashboard" element={<Navigate to="/student?tab=overview" replace />} />
              <Route path="/classes" element={<Navigate to="/student?tab=classroom" replace />} />
              <Route path="/attendance" element={<Navigate to="/student?tab=classroom" replace />} />
              <Route path="/student/classes" element={<Navigate to="/student?tab=classroom" replace />} />
              <Route path="/student/attendance" element={<Navigate to="/student?tab=classroom" replace />} />
              <Route path="/student/lms" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT} fluid>
                    <StudentDashboard />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/study" element={<Navigate to="/student?tab=curriculum" replace />} />
              <Route path="/student/practice" element={<Navigate to="/student?tab=practice" replace />} />
              <Route path="/student/practice/exam" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <PracticeExamPage />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/adaptive" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <StudentAdaptiveDashboard />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/test-dashboard" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <StudentTestDashboard />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/test/:sessionId" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <StudentTestInterface />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/test/:sessionId/result" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <StudentTestResultView />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/history" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <StudentTestHistoryView />
                  </DashboardShell>
                </StudentRoute>
              } />

              <Route path="/student/career" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <StudentCareerDashboard />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/intelligence" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <IntelligenceHub />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/institution" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <InstitutionSaaSHub />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/institution/dashboard" element={<Navigate to="/institution" replace />} />
              <Route path="/student/quiz/:quizId/attempt" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <QuizAttempt />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/quiz/:quizId/result" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <QuizResult />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/library" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <MyLibrary />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/calendar" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <AcademicCalendarPage />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/notifications" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <NotificationCenterPage />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/downloads" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <SmartDownloadManager />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/analytics" element={<Navigate to="/student?tab=progress" replace />} />
              <Route path="/student/profile" element={<Navigate to="/student?tab=progress" replace />} />
              <Route path="/student/resume" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <ResumeBuilderPage />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/coding" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <CodingPlatformPage />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/100-days-code" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <HundredDaysHub />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/100-days-code/tracks" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <HundredDaysHub />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/100-days-code/track/:trackId" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <HundredDaysHub />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/100-days-code/day/:dayNumber" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <HundredDaysHub />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/100-days-code/projects" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <HundredDaysHub />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/student/100-days-code/achievements" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <HundredDaysHub />
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/marketplace" element={
                <StudentRoute>
                  <DashboardShell role={UserRole.STUDENT}>
                    <BetaGuard featureKey="marketplace">
                      <MarketplacePage />
                    </BetaGuard>
                  </DashboardShell>
                </StudentRoute>
              } />
              <Route path="/parent" element={<ParentPortalPage />} />

              {/* Instructor Login & Portal Routes */}
              <Route path="/teacher/login" element={<TeacherLogin />} />
              <Route path="/teacher/onboarding" element={
                <TeacherRoute>
                  <TeacherOnboarding />
                </TeacherRoute>
              } />
              
              {/* Home Dashboard */}
              <Route path="/teacher" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER}>
                    <TeacherDashboard />
                  </DashboardShell>
                </TeacherRoute>
              } />
              <Route path="/teacher/dashboard" element={<Navigate to="/teacher" replace />} />

              {/* 1. My Subjects */}
              <Route path="/teacher/subjects" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER}>
                    <TeacherSubjectsPage />
                  </DashboardShell>
                </TeacherRoute>
              } />

              {/* 2. My Classes */}
              <Route path="/teacher/classes" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER}>
                    <ClassList />
                  </DashboardShell>
                </TeacherRoute>
              } />
              <Route path="/teacher/classes/:classId" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER} fluid>
                    <ClassDetails />
                  </DashboardShell>
                </TeacherRoute>
              } />

              {/* 3. Students */}
              <Route path="/teacher/students" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER}>
                    <TeacherStudentsPage />
                  </DashboardShell>
                </TeacherRoute>
              } />

              {/* 4. Attendance */}
              <Route path="/teacher/attendance" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER}>
                    <TeacherAttendancePage />
                  </DashboardShell>
                </TeacherRoute>
              } />

              {/* 5. Assignments */}
              <Route path="/teacher/assignments" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER}>
                    <TeacherAssignmentsPage />
                  </DashboardShell>
                </TeacherRoute>
              } />
              <Route path="/teacher/assignments/:assignmentId" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER} fluid>
                    <AssignmentDetails />
                  </DashboardShell>
                </TeacherRoute>
              } />
              <Route path="/teacher/assignments/:assignmentId/submissions" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER} fluid>
                    <AssignmentSubmissions />
                  </DashboardShell>
                </TeacherRoute>
              } />

              {/* 6. Quizzes */}
              <Route path="/teacher/quizzes" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER}>
                    <TeacherQuizzesPage />
                  </DashboardShell>
                </TeacherRoute>
              } />

              {/* 7. Question Bank */}
              <Route path="/teacher/question-bank" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER}>
                    <TeacherQuestionBankPage />
                  </DashboardShell>
                </TeacherRoute>
              } />

              {/* 8. Marks & Results */}
              <Route path="/teacher/results" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER}>
                    <TeacherResultsPage />
                  </DashboardShell>
                </TeacherRoute>
              } />
              <Route path="/teacher/gradebook" element={<Navigate to="/teacher/results" replace />} />

              {/* 9. My Notes */}
              <Route path="/teacher/notes" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER}>
                    <TeacherNotesPage />
                  </DashboardShell>
                </TeacherRoute>
              } />

              {/* 10. Study Materials */}
              <Route path="/teacher/materials" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER}>
                    <TeacherMaterialsPage />
                  </DashboardShell>
                </TeacherRoute>
              } />

              {/* 11. Upload Material */}
              <Route path="/teacher/materials/upload" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER}>
                    <TeacherUploadMaterialPage />
                  </DashboardShell>
                </TeacherRoute>
              } />

              {/* 12. Resource Library */}
              <Route path="/teacher/resources" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER}>
                    <TeacherResourceLibraryPage />
                  </DashboardShell>
                </TeacherRoute>
              } />

              {/* 13. Announcements */}
              <Route path="/teacher/announcements" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER}>
                    <TeacherAnnouncementsPage />
                  </DashboardShell>
                </TeacherRoute>
              } />

              {/* 14. Messages */}
              <Route path="/teacher/messages" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER}>
                    <TeacherMessagesPage />
                  </DashboardShell>
                </TeacherRoute>
              } />

              <Route path="/teacher/settings" element={
                <TeacherRoute>
                  <DashboardShell role={UserRole.TEACHER}>
                    <TeacherSettingsPage />
                  </DashboardShell>
                </TeacherRoute>
              } />

              {/* Student Interactive Tools */}
              <Route path="/whiteboard" element={<Whiteboard />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/bulk-upload" element={<BulkUpload />} />

              {/* Admin Command Center Sub-Routes */}
              <Route path="/admin/question-intelligence" element={
                <AdminRoute>
                  <DashboardShell role={UserRole.SUPER_ADMIN}>
                    <AdminQuestionIntelligenceDashboard />
                  </DashboardShell>
                </AdminRoute>
              } />
              <Route path="/admin/cms" element={
                <AdminRoute>
                  <DashboardShell role={UserRole.SUPER_ADMIN}>
                    <CurriculumManagementPage />
                  </DashboardShell>
                </AdminRoute>
              } />

              {/* Fallback route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </BetaHostGate>
          {import.meta.env.DEV && AgentationDev && (
            <Suspense fallback={null}>
              <AgentationDev />
            </Suspense>
          )}
          <BugBountyWidget />
        </Layout>
      </LearningEcosystemProvider>
    </StudentAcademicProvider>
    </BetaFeatureProvider>
    </AuthProvider>
  </Router>
</PWAProvider>
  );
};

export default App;
