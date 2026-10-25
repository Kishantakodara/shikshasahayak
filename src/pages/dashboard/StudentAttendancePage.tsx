import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Radio, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Users, 
  Calendar, 
  ArrowRight, 
  AlertTriangle, 
  ChevronRight, 
  Check, 
  RefreshCw, 
  BookOpen, 
  TrendingUp,
  Percent,
  History
} from 'lucide-react';
import { ShikshaSahayakShell } from '../../components/layout/ShikshaSahayakShell';
import { useAuth } from '../../context/AuthContext';
import { useStudentAcademic } from '../../context/StudentAcademicContext';
import { StudentAttendanceModal } from '../../components/student/StudentAttendanceModal';
import { JoinClassModal } from '../../components/student/JoinClassModal';
import { teacherClient } from '../../api/teacherClient';
import { getActiveAttendanceSessionForStudent, subscribeToSyncEvent, SYNC_EVENTS } from '../../utils/realtimeSync';
import { toast } from 'sonner';

export const StudentAttendancePage: React.FC = () => {
  const { currentUser } = useAuth();
  const { academicProfile } = useStudentAcademic();

  const [activeSession, setActiveSession] = useState<any>(null);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Inline check-in state
  const [quickCode, setQuickCode] = useState('');
  const [submittingQuick, setSubmittingQuick] = useState(false);

  useEffect(() => {
    const checkLiveSession = () => {
      const session = getActiveAttendanceSessionForStudent();
      setActiveSession(session || null);
    };

    checkLiveSession();

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
  }, []);

  const loadStudentClasses = async () => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await teacherClient.getStudentEnrolledClasses(currentUser.uid);
      if (res && Array.isArray(res.classes)) {
        setClasses(res.classes);
      }
    } catch (e) {
      console.warn('Could not load student classes for attendance:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentClasses();
  }, [currentUser?.uid]);

  const studentName = currentUser?.displayName || academicProfile?.fullName || 'Student';
  const branchName = academicProfile?.branchName || 'Computer Engineering';
  const semesterNum = academicProfile?.semester || 3;

  // Mock verified attendance ledger records
  const subjectAttendanceList = [
    { id: '1', code: '3130702', name: 'Data Structures', totalLectures: 36, attended: 32, percentage: 89, faculty: 'Prof. J. Patel' },
    { id: '2', code: '3130703', name: 'Database Management Systems', totalLectures: 34, attended: 28, percentage: 82, faculty: 'Prof. R. Shah' },
    { id: '3', code: '3130704', name: 'Digital Logic & Design', totalLectures: 30, attended: 22, percentage: 73, faculty: 'Prof. S. Mehta' },
    { id: '4', code: '3130004', name: 'Effective Technical Communication', totalLectures: 24, attended: 22, percentage: 92, faculty: 'Dr. V. Joshi' },
    { id: '5', code: '3130006', name: 'Probability and Statistics', totalLectures: 28, attended: 24, percentage: 86, faculty: 'Prof. N. Desai' },
  ];

  const overallTotal = subjectAttendanceList.reduce((acc, s) => acc + s.totalLectures, 0);
  const overallAttended = subjectAttendanceList.reduce((acc, s) => acc + s.attended, 0);
  const overallPercentage = Math.round((overallAttended / overallTotal) * 100);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickCode.trim().toUpperCase();
    if (!clean || clean.length < 4) {
      toast.error('Please enter a valid 6-digit session code');
      return;
    }

    setSubmittingQuick(true);
    try {
      const res = await teacherClient.submitStudentAttendance({
        session_code: clean,
        student_id: currentUser?.uid || 'guest-student',
        student_name: studentName,
        enrollment_number: academicProfile?.enrollmentNumber || academicProfile?.enrollmentNo || 'GTU-STUDENT',
      });

      if (res && res.success) {
        toast.success(res.message || 'Attendance verified & recorded!');
        setQuickCode('');
      } else {
        toast.error('Could not verify session code. Please verify with your professor.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Attendance check-in failed');
    } finally {
      setSubmittingQuick(false);
    }
  };

  return (
    <ShikshaSahayakShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0] dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              GTU ATTENDANCE ENGINE • 75% ELIGIBILITY
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-white">
              Student Attendance Cockpit
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Check in to live professor sessions, track GTU 75% examination clearance, and view verified lecture logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setAttendanceModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Full Screen Check-In</span>
            </button>
            <button
              onClick={() => setJoinModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4 text-[#F97316]" />
              <span>Join Class</span>
            </button>
          </div>
        </div>

        {/* ACTIVE LIVE ROLL CALL ALERT */}
        {activeSession && (
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-orange-500/10 to-emerald-500/15 border-2 border-emerald-500 shadow-xl animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 shadow-lg">
                  <Radio className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                      LIVE SESSION OPEN NOW
                    </span>
                    {activeSession.session_code && (
                      <span className="font-mono text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        Code: {activeSession.session_code}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white mt-1">
                    {activeSession.class_name || activeSession.subject_name || 'Active Class Attendance'}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Faculty: {activeSession.teacher_name || 'Class Instructor'} • Mark your attendance before the timer closes.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAttendanceModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Attendance (1-Tap)</span>
              </button>
            </div>
          </div>
        )}

        {/* QUICK CODE CHECK-IN & STATS OVERVIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Quick Check-In Box (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F97316] uppercase tracking-wider">
              <Radio className="w-4 h-4" /> Quick Check-In
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">
              Enter Attendance Code
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              If your professor has announced an attendance number code on the blackboard or screen, enter it below to mark your presence.
            </p>

            <form onSubmit={handleQuickSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  6-Digit Session Code
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={quickCode}
                  onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 849201"
                  className="w-full text-center font-mono font-black text-xl tracking-widest bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-[#0F172A] dark:text-white focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <button
                type="submit"
                disabled={submittingQuick || !quickCode.trim()}
                className="w-full py-3 px-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submittingQuick ? 'Verifying Session...' : 'Submit Attendance'}</span>
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>GPS Verification Available</span>
              <button
                onClick={() => setAttendanceModalOpen(true)}
                className="text-[#F97316] font-bold hover:underline"
              >
                Use GPS Check-In →
              </button>
            </div>
          </div>

          {/* Overall Attendance Summary (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                    Overall GTU Examination Eligibility
                  </h3>
                  <p className="text-xs text-[#64748B]">Semester {semesterNum} • {branchName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                  overallPercentage >= 75
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                }`}>
                  {overallPercentage >= 75 ? '✓ Exam Eligible (>75%)' : '⚠ Caution (<75%)'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-2xl font-black text-[#F97316]">{overallPercentage}%</span>
                  <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Average Attendance</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{overallAttended}</span>
                  <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Attended Lectures</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-2xl font-black text-slate-700 dark:text-slate-300">{overallTotal}</span>
                  <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Total Lectures Held</p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 text-xs text-orange-900 dark:text-orange-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#F97316] shrink-0" />
              <span>
                GTU University Ordinance requires minimum 75% attendance in theory & practical classes to receive the hall ticket.
              </span>
            </div>
          </div>

        </div>

        {/* SUBJECT-WISE ATTENDANCE BREAKDOWN */}
        <section className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">
                Subject-Wise Attendance Breakdown
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Current semester courses and lecture compliance records
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              5 Courses Tracked
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {subjectAttendanceList.map((subj) => {
              const isSafe = subj.percentage >= 75;
              const lecturesNeeded = !isSafe ? Math.ceil((0.75 * subj.totalLectures - subj.attended) / 0.25) : 0;

              return (
                <div key={subj.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {subj.code}
                      </span>
                      <h4 className="text-sm font-bold text-[#0F172A] dark:text-white truncate">
                        {subj.name}
                      </h4>
                    </div>
                    <p className="text-xs text-[#64748B]">
                      {subj.faculty} • {subj.attended} of {subj.totalLectures} lectures attended
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-32 hidden sm:block">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[11px] text-[#64748B]">Compliance</span>
                        <strong className="text-[#0F172A] dark:text-white font-bold">{subj.percentage}%</strong>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            subj.percentage >= 85 ? 'bg-emerald-500' : subj.percentage >= 75 ? 'bg-[#F97316]' : 'bg-rose-500'
                          }`}
                          style={{ width: `${subj.percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="min-w-[130px] text-right">
                      {isSafe ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg" title={`Attend next ${lecturesNeeded} lectures to cross 75%`}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Need +{lecturesNeeded} Lec
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* MODALS */}
      <StudentAttendanceModal
        open={attendanceModalOpen}
        onOpenChange={setAttendanceModalOpen}
        currentUser={{
          id: currentUser?.uid || 'student',
          name: studentName,
          enrollmentNo: academicProfile?.enrollmentNumber || academicProfile?.enrollmentNo,
        }}
      />

      <JoinClassModal
        open={joinModalOpen}
        onOpenChange={setJoinModalOpen}
        currentUser={{
          id: currentUser?.uid || 'student',
          name: studentName,
          email: currentUser?.email || '',
          enrollmentNo: academicProfile?.enrollmentNumber || academicProfile?.enrollmentNo,
        }}
      />
    </ShikshaSahayakShell>
  );
};

export default StudentAttendancePage;
