import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Plus, 
  Radio, 
  FileText, 
  ChevronRight, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  FolderOpen,
  Calendar,
  ExternalLink,
  Sparkles,
  Download,
  X
} from 'lucide-react';
import { ShikshaSahayakShell } from '../../components/layout/ShikshaSahayakShell';
import { useAuth } from '../../context/AuthContext';
import { useStudentAcademic } from '../../context/StudentAcademicContext';
import { teacherClient } from '../../api/teacherClient';
import { JoinClassModal } from '../../components/student/JoinClassModal';
import { StudentAttendanceModal } from '../../components/student/StudentAttendanceModal';
import { toast } from 'sonner';

export const StudentClassroomsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const { academicProfile } = useStudentAcademic();

  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [initialJoinCode, setInitialJoinCode] = useState('');

  // Materials viewer modal
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  // Check query params for join code
  useEffect(() => {
    const code = searchParams.get('joinCode') || searchParams.get('code') || sessionStorage.getItem('pending_join_code');
    if (code) {
      setInitialJoinCode(code.trim().toUpperCase());
      setJoinModalOpen(true);
      sessionStorage.removeItem('pending_join_code');
    }
  }, [searchParams]);

  const loadEnrolledClasses = async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await teacherClient.getStudentEnrolledClasses(currentUser.uid);
      if (res && Array.isArray(res.classes)) {
        setClasses(res.classes);
      } else {
        setClasses([]);
      }
    } catch (err: any) {
      console.warn('Failed to load student classes:', err);
      // Fallback: don't block user with error banner if offline
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrolledClasses();
  }, [currentUser?.uid]);

  const handleOpenMaterials = async (cls: any) => {
    setSelectedClass(cls);
    setLoadingMaterials(true);
    try {
      const res = await teacherClient.getClassMaterials(cls.id);
      if (res && Array.isArray(res.materials)) {
        setMaterials(res.materials);
      } else {
        setMaterials([]);
      }
    } catch (err) {
      console.warn('Failed to fetch class materials:', err);
      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const studentName = currentUser?.displayName || academicProfile?.fullName || 'Student';
  const branchName = academicProfile?.branchName || 'Engineering';
  const semesterNum = academicProfile?.semester || 3;

  return (
    <ShikshaSahayakShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0] dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#F97316] text-xs font-bold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" />
              COLLEGE CLASSROOMS & LMS
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-white">
              My Enrolled Classrooms
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Connect with your faculty, access verified study materials, view homework assignments, and mark lecture attendance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setJoinModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Join Class by Code</span>
            </button>
            <button
              onClick={() => setAttendanceModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-[#F97316] font-bold text-xs border border-orange-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              <span>Mark Live Attendance</span>
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="p-12 text-center bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-[#F97316] animate-spin" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Loading your college classrooms...</span>
          </div>
        )}

        {/* ERROR STATE */}
        {error && !loading && (
          <div className="p-5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-xs font-semibold text-red-800 dark:text-red-300">{error}</span>
            </div>
            <button
              onClick={loadEnrolledClasses}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* CLASSROOMS LIST */}
        {!loading && classes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-5 hover:border-[#F97316] transition-all shadow-2xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {cls.subject_code || 'GTU CODE'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase">
                      ENROLLED
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A] dark:text-white line-clamp-1">
                    {cls.name}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {cls.subject_name || 'Class Course'}
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Faculty:</span>
                      <strong className="text-[#0F172A] dark:text-white">{cls.teacher_name || 'Professor'}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Classmates:</span>
                      <strong className="text-[#0F172A] dark:text-white">{cls.student_count || 1} students</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Class Code:</span>
                      <code className="font-mono font-bold text-[#F97316]">{cls.join_code}</code>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenMaterials(cls)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>View Handouts</span>
                  </button>
                  <button
                    onClick={() => setAttendanceModalOpen(true)}
                    className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    title="Check into live session"
                  >
                    <Radio className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Check In</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && classes.length === 0 && (
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 text-center space-y-4 shadow-2xs">
            <div className="w-16 h-16 rounded-3xl bg-orange-500/10 text-[#F97316] flex items-center justify-center mx-auto">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] dark:text-white">
                No College Classrooms Joined Yet
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 leading-relaxed">
                Connect directly with your college teachers. Enter the 6-character classroom code provided by your instructor to access lecture materials, homework submissions, and attend live roll calls.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                onClick={() => setJoinModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Enter Class Code</span>
              </button>
              <Link
                to="/student"
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
              >
                Back to Student Home
              </Link>
            </div>
          </div>
        )}

        {/* HOW CLASSROOM JOINING WORKS */}
        <section className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F97316]" />
            How Classroom Connection Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="p-3 bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <strong className="text-[#0F172A] dark:text-white block font-bold">1. Obtain Class Code</strong>
              <p>Your course professor generates a unique 6-character code (e.g., <code className="font-mono text-[#F97316]">CS5001</code>) for your subject section.</p>
            </div>
            <div className="p-3 bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <strong className="text-[#0F172A] dark:text-white block font-bold">2. Join in 1 Click</strong>
              <p>Click "Join Class by Code", enter your roll/enrollment number and code. You are automatically enrolled.</p>
            </div>
            <div className="p-3 bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <strong className="text-[#0F172A] dark:text-white block font-bold">3. Access Materials & Check-In</strong>
              <p>Download unit notes, submit assignments, and mark verified live lecture attendance directly from your phone.</p>
            </div>
          </div>
        </section>

      </div>

      {/* CLASS MATERIALS DRAWER / MODAL */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                  {selectedClass.name}
                </h3>
                <p className="text-xs text-[#64748B]">
                  Instructor: Prof. {selectedClass.teacher_name || 'Faculty'}
                </p>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {loadingMaterials ? (
                <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-[#F97316] animate-spin" />
                  <span className="text-xs text-[#64748B]">Fetching handouts & slides...</span>
                </div>
              ) : materials.length > 0 ? (
                materials.map((m: any, idx: number) => (
                  <div
                    key={m.id || idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#F97316] transition-colors flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-[#F97316] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0F172A] dark:text-white truncate">{m.title || 'Lecture Document'}</p>
                        <p className="text-[11px] text-[#64748B] truncate">{m.file_type || 'PDF'} • Unit Handout</p>
                      </div>
                    </div>
                    {m.file_url ? (
                      <a
                        href={m.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center gap-1 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400">Available</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-10 text-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-[#64748B]">No documents uploaded for this classroom yet.</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedClass(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOIN CLASS MODAL */}
      <JoinClassModal
        open={joinModalOpen}
        onOpenChange={setJoinModalOpen}
        initialCode={initialJoinCode}
        currentUser={{
          id: currentUser?.uid || 'student',
          name: studentName,
          email: currentUser?.email || '',
          enrollmentNo: academicProfile?.enrollmentNumber || academicProfile?.enrollmentNo,
        }}
        onSuccessJoined={() => {
          loadEnrolledClasses();
        }}
      />

      {/* ATTENDANCE CHECK-IN MODAL */}
      <StudentAttendanceModal
        open={attendanceModalOpen}
        onOpenChange={setAttendanceModalOpen}
        currentUser={{
          id: currentUser?.uid || 'student',
          name: studentName,
          enrollmentNo: academicProfile?.enrollmentNumber || academicProfile?.enrollmentNo,
        }}
      />
    </ShikshaSahayakShell>
  );
};

export default StudentClassroomsPage;
