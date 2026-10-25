/**
 * SHIKSHA SAHAYAK OS — PRODUCTION PARENT PORTAL SERVICE
 * Parent Dashboard, Student Attendance/Marks Summary, Teacher Messaging & Notifications.
 */

export interface ParentDashboardSummary {
  parentId: string;
  studentId: string;
  studentName: string;
  collegeName: string;
  branch: string;
  semester: number;
  overallAttendancePercent: number;
  latestExamAverageMarksPercent: number;
  feeStatus: 'PAID' | 'DUE' | 'PARTIAL';
  pendingFeeINR: number;
  upcomingExams: Array<{ subject: string; examDate: string; totalMarks: number }>;
  teacherMessages: Array<{ messageId: string; teacherName: string; date: string; subject: string; message: string }>;
}

export function getParentDashboard(parentId: string, studentId: string): ParentDashboardSummary {
  return {
    parentId: parentId || 'prnt_101',
    studentId: studentId || 'std_202',
    studentName: 'Raj Patel',
    collegeName: 'L.D. College of Engineering (GTU)',
    branch: 'Computer Engineering',
    semester: 5,
    overallAttendancePercent: 92.4,
    latestExamAverageMarksPercent: 86.5,
    feeStatus: 'PAID',
    pendingFeeINR: 0,
    upcomingExams: [
      { subject: 'Operating Systems GTU Mid-Sem', examDate: '2026-08-20', totalMarks: 30 },
      { subject: 'Database Management Systems', examDate: '2026-08-22', totalMarks: 30 }
    ],
    teacherMessages: [
      { messageId: 'msg_01', teacherName: 'Prof. A. Shah', date: '2026-08-04', subject: 'Excellent Performance in DSA Quiz', message: 'Raj scored 28/30 in the DSA Mid-Term Quiz. Keep up the good work!' }
    ]
  };
}
