import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  ChevronLeft, 
  PlayCircle, 
  FileText, 
  Award, 
  Sparkles, 
  Clock, 
  ArrowLeft,
  BookOpen,
  Share2,
  Printer,
  ShieldCheck
} from 'lucide-react';
import { CourseDetailDTO, CourseLessonDTO } from '@/types';
import { useAuth } from '../../context/AuthContext';
import { fetchWithAuth } from '../../api/client';
import { PortalReturnBar } from '../../components/navigation/PortalReturnBar';

export const CoursePlayerPage: React.FC = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const { currentUser } = useAuth();

  const [course, setCourse] = useState<CourseDetailDTO | null>(null);
  const [activeLesson, setActiveLesson] = useState<CourseLessonDTO | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [certificate, setCertificate] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  // Load course details & user progress
  useEffect(() => {
    if (!courseSlug) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/courses/${courseSlug}`);
        const data = await res.json() as { success: boolean; course: CourseDetailDTO };
        if (data.success && data.course) {
          setCourse(data.course);

          // Find first lesson to play
          const allLessons = data.course.modules.flatMap(m => m.lessons);
          if (allLessons.length > 0) {
            setActiveLesson(allLessons[0]);
          }

          // Auto-enroll and fetch progress with authentication
          try {
            fetchWithAuth('/api/courses/enroll', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ courseId: data.course.id })
            }).catch(() => {});

            const progRes = await fetchWithAuth(`/api/courses/progress?courseId=${data.course.id}`);
            const progData = await progRes.json() as any;
            if (progData.success) {
              setCompletedLessonIds(progData.completedLessons || []);
              setProgressPercent(progData.progressPercent || 0);
              if (progData.certificate) {
                setCertificate(progData.certificate);
              }
            }
          } catch {}
        }
      } catch (err) {
        console.error('Failed to load course player:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [courseSlug]);

  const allLessons = course ? course.modules.flatMap(m => m.lessons) : [];
  const currentLessonIndex = activeLesson ? allLessons.findIndex(l => l.id === activeLesson.id) : -1;

  const handleMarkComplete = async () => {
    if (!course || !activeLesson) return;
    setUpdating(true);
    try {
      const isAlreadyCompleted = completedLessonIds.includes(activeLesson.id);
      const studentName = currentUser?.displayName || currentUser?.fullName || 'Engineering Student';
      const res = await fetchWithAuth('/api/courses/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          lessonId: activeLesson.id,
          isCompleted: true,
          totalLessons: allLessons.length,
          courseTitle: course.title,
          studentName
        })
      });
      const data = await res.json() as any;
      if (data.success) {
        if (!isAlreadyCompleted) {
          setCompletedLessonIds([...completedLessonIds, activeLesson.id]);
        }
        setProgressPercent(data.progressPercent);
        if (data.certificate) {
          setCertificate(data.certificate);
          setShowCertModal(true);
        }

        // Advance to next lesson if available
        if (currentLessonIndex < allLessons.length - 1) {
          setActiveLesson(allLessons[currentLessonIndex + 1]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      setActiveLesson(allLessons[currentLessonIndex + 1]);
    }
  };

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      setActiveLesson(allLessons[currentLessonIndex - 1]);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-500">Loading interactive classroom...</p>
      </div>
    );
  }

  if (!course || !activeLesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Course Not Found</h2>
        <Link to="/courses" className="inline-block px-4 py-2 bg-brand-orange text-white rounded-xl text-xs font-bold">
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Portal Navigation Bar */}
      <PortalReturnBar
        crumbs={[
          { label: 'Courses', path: '/courses' },
          { label: course.title }
        ]}
        fallbackPath="/courses"
      />

      {/* Top Breadcrumb & Progress Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-navy-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/courses"
            className="p-2 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:text-brand-orange transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[11px] font-bold text-brand-orange uppercase tracking-wider block">
              {course.category} • {course.level}
            </span>
            <h1 className="text-base sm:text-lg font-black text-navy-950 dark:text-white line-clamp-1">
              {course.title}
            </h1>
          </div>
        </div>

        {/* Course Completion Progress Bar */}
        <div className="w-full sm:w-64 space-y-1.5 self-end sm:self-auto">
          <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Progress: {progressPercent}%</span>
            <span>{completedLessonIds.length} / {allLessons.length} Completed</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-navy-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-orange to-amber-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {certificate && (
            <button
              onClick={() => setShowCertModal(true)}
              className="text-[11px] font-bold text-emerald-500 flex items-center gap-1 hover:underline pt-0.5"
            >
              <Award className="w-3.5 h-3.5" /> View Verified Certificate
            </button>
          )}
        </div>
      </div>

      {/* Main Classroom Layout (Left: Syllabus, Right: Lesson Reader) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Syllabus Tree */}
        <div className="lg:col-span-4 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-700 shadow-sm p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-orange" /> Course Curriculum
          </h3>

          <div className="space-y-4">
            {course.modules.map((module) => (
              <div key={module.id} className="space-y-2">
                <h4 className="text-xs font-bold text-navy-950 dark:text-white leading-tight">
                  {module.title}
                </h4>

                <div className="space-y-1 pl-1">
                  {module.lessons.map((lesson) => {
                    const isDone = completedLessonIds.includes(lesson.id);
                    const isCurrent = activeLesson.id === lesson.id;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition ${
                          isCurrent
                            ? 'bg-brand-orange text-white font-bold shadow-sm'
                            : 'hover:bg-slate-50 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {isDone ? (
                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-white' : 'text-emerald-500'}`} />
                          ) : (
                            <Circle className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-white/60' : 'text-slate-400'}`} />
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </div>
                        <span className={`text-[10px] shrink-0 ${isCurrent ? 'text-white/80' : 'text-slate-400'}`}>
                          {lesson.durationMinutes}m
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Active Lesson Content */}
        <div className="lg:col-span-8 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-700 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header of Lesson */}
          <div className="border-b border-slate-100 dark:border-navy-800 pb-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" /> {activeLesson.durationMinutes} minutes reading & hands-on
              {completedLessonIds.includes(activeLesson.id) && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-navy-950 dark:text-white">
              {activeLesson.title}
            </h2>
          </div>

          {/* Lesson Body */}
          <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-navy-950 rounded-2xl border border-slate-100 dark:border-navy-800 flex items-center gap-3">
              <PlayCircle className="w-8 h-8 text-brand-orange shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-navy-900 dark:text-white">Interactive Engineering Workspace</h4>
                <p className="text-[11px] text-slate-500">Follow the code walkthrough below, examine patterns, and complete the checkpoint.</p>
              </div>
            </div>

            <div className="whitespace-pre-line bg-slate-50/50 dark:bg-navy-950/30 p-6 rounded-2xl border border-slate-100 dark:border-navy-800 font-sans">
              {activeLesson.contentMarkdown}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-6 border-t border-slate-100 dark:border-navy-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              onClick={handlePrevLesson}
              disabled={currentLessonIndex <= 0}
              className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-navy-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Previous Lesson
            </button>

            <button
              onClick={handleMarkComplete}
              disabled={updating}
              className="py-3 px-6 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              {updating ? 'Saving Progress...' : completedLessonIds.includes(activeLesson.id) ? 'Next Lesson' : 'Mark Complete & Continue'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Verified Certificate Modal */}
      {showCertModal && certificate && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-center">
            <button
              onClick={() => setShowCertModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-500 flex items-center justify-center font-bold"
            >
              ✕
            </button>

            {/* Certificate Sheet Display */}
            <div className="border-4 border-double border-brand-orange/40 p-8 rounded-2xl bg-gradient-to-b from-orange-50/40 via-white to-orange-50/20 dark:from-navy-950 dark:via-navy-900 dark:to-navy-950 space-y-4">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-full bg-brand-orange/10 flex items-center justify-center border border-brand-orange/30">
                  <Award className="w-8 h-8 text-brand-orange" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">ShikshaSahayak Verified Credential</span>
                <h2 className="text-2xl font-black text-navy-950 dark:text-white">Certificate of Completion</h2>
              </div>

              <p className="text-xs text-slate-500">This certifies that</p>
              <h3 className="text-xl font-extrabold text-brand-orange underline decoration-brand-orange/40 underline-offset-4">
                {certificate.studentName}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                has successfully fulfilled all curriculum requirements, practical assignments, and assessments for
              </p>
              <h4 className="text-base font-bold text-navy-900 dark:text-white">
                {certificate.courseTitle}
              </h4>

              <div className="pt-4 border-t border-slate-200 dark:border-navy-700 flex flex-wrap justify-between items-center text-[11px] text-slate-500">
                <span>Certificate No: <strong className="text-slate-700 dark:text-slate-200">{certificate.certificateNumber}</strong></span>
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified: {certificate.verificationCode}
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.print()}
                className="py-2.5 px-5 bg-navy-900 dark:bg-navy-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-black"
              >
                <Printer className="w-4 h-4" /> Print / Save PDF
              </button>
              <button
                onClick={() => setShowCertModal(false)}
                className="py-2.5 px-5 bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePlayerPage;
