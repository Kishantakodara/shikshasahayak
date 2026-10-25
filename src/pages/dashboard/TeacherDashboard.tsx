import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  ArrowRight, 
  BarChart2, 
  FileText, 
  HelpCircle, 
  Award, 
  Users, 
  BookOpen,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Radio,
  User,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  Upload,
  Megaphone,
  CheckSquare,
  BarChart4
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { teacherClient } from '../../api/teacherClient';
import { CreateClassModal } from '../../components/teacher/CreateClassModal';
import { CreateAssignmentModal } from '../../components/teacher/CreateAssignmentModal';
import { CreateAnnouncementModal } from '../../components/teacher/CreateAnnouncementModal';
import { toast } from 'sonner';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const attendanceScrollRef = useRef<HTMLDivElement>(null);

  const teacherName = currentUser?.displayName || currentUser?.fullName || 'Educator';

  // Fetch Real Overview Metrics from D1
  const { data: overviewData } = useQuery({
    queryKey: ['teacher', 'overview'],
    queryFn: () => teacherClient.getOverview().catch(() => null),
  });

  const stats = overviewData?.stats || {
    subjectsCount: 0,
    classesCount: 0,
    studentsCount: 0,
    pendingGradingCount: 0,
  };

  // Fetch Classes list
  const { data: classesResponse } = useQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: () => teacherClient.getClasses({ limit: 100 }),
  });
  const teacherClasses = classesResponse?.classes || [];

  const scrollAttendance = (direction: 'left' | 'right') => {
    if (attendanceScrollRef.current) {
      const { scrollLeft, clientWidth } = attendanceScrollRef.current;
      const scrollAmount = clientWidth * 0.7;
      attendanceScrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleCreateAssignmentClick = () => {
    if (teacherClasses.length === 0) {
      toast.warning("Please create a class before adding assignments.");
      setClassModalOpen(true);
      return;
    }
    setAssignmentModalOpen(true);
  };

  const handleCreateQuizClick = () => {
    if (teacherClasses.length === 0) {
      toast.warning("Please create a class before managing quizzes.");
      setClassModalOpen(true);
      return;
    }
    navigate('/teacher/quizzes');
  };

  const handlePostAnnouncementClick = () => {
    if (teacherClasses.length === 0) {
      toast.warning("Please create a class before posting announcements.");
      setClassModalOpen(true);
      return;
    }
    setAnnouncementModalOpen(true);
  };

  const displayAttendanceClasses = teacherClasses.map((cls: any) => ({
    id: cls.id,
    name: cls.name,
    subject: cls.subject_name || cls.subject || 'Engineering Subject',
    time: cls.semester ? `Semester ${cls.semester} • Section ${cls.section || 'A'}` : 'Active Batch',
    room: cls.section ? `Section ${cls.section}` : 'Main Hall',
    present: cls.student_count || 0,
    total: cls.max_students || 60,
    percentage: cls.student_count && cls.max_students ? Math.round((cls.student_count / cls.max_students) * 100) : 0
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner (Greeting & Quote) */}
      <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-gray-150 dark:border-navy-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white font-display">
            Welcome back, {teacherName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic mt-1">
            "Teaching is the one profession that creates all other professions."
          </p>
        </div>

        <Link
          to="/teacher/settings"
          className="px-5 py-2.5 rounded-full bg-white dark:bg-navy-800 border border-orange-200 dark:border-navy-700 text-brand-orange text-xs font-bold shadow-xs hover:border-brand-orange transition-all flex items-center gap-1.5 shrink-0"
        >
          <User className="w-4 h-4 text-brand-orange" />
          <span>View My Profile</span>
        </Link>
      </div>

      {/* Main 3-Column Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 5 Stat Cards Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            
            {/* Card 1: My Subjects */}
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-150 dark:border-navy-800 shadow-xs flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-[#fff2e8] dark:bg-orange-950/40 text-brand-orange flex items-center justify-center mb-3">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400">My Subjects</h4>
                <div className="text-2xl font-black text-navy-900 dark:text-white mt-0.5">{stats.subjectsCount}</div>
                <p className="text-[10px] text-gray-400 font-medium">Assigned Subjects</p>
              </div>
            </div>

            {/* Card 2: My Classes */}
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-150 dark:border-navy-800 shadow-xs flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-[#e0f2fe] dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400">My Classes</h4>
                <div className="text-2xl font-black text-navy-900 dark:text-white mt-0.5">{stats.classesCount}</div>
                <p className="text-[10px] text-gray-400 font-medium">Total Batches</p>
              </div>
            </div>

            {/* Card 3: Students */}
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-150 dark:border-navy-800 shadow-xs flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-[#dcfce7] dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400">Enrolled Students</h4>
                <div className="text-2xl font-black text-navy-900 dark:text-white mt-0.5">{stats.studentsCount}</div>
                <p className="text-[10px] text-gray-400 font-medium">Total Students</p>
              </div>
            </div>

            {/* Card 4: Active Batches */}
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-150 dark:border-navy-800 shadow-xs flex flex-col justify-between">
              <div className="w-10 h-10 rounded-full bg-[#f3e8ff] dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mb-3">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400">Active Batches</h4>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{stats.classesCount}</div>
                <p className="text-[10px] text-gray-400 font-medium">Configured Classes</p>
              </div>
            </div>

            {/* Card 5: Pending Work */}
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-150 dark:border-navy-800 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="w-10 h-10 rounded-full bg-[#fff1e6] dark:bg-orange-950/40 text-brand-orange flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400">Pending Grading</h4>
                <div className="text-2xl font-black text-navy-900 dark:text-white mt-0.5">{stats.pendingGradingCount}</div>
                <p className="text-[10px] text-gray-400 font-medium">Submissions to Grade</p>
              </div>
            </div>

          </div>

          {/* Take Attendance Carousel */}
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-gray-150 dark:border-navy-800 shadow-xs relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-navy-900 dark:text-white">Take Attendance</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Launch live attendance sessions or mark roll calls for your classes.</p>
              </div>
              <Link to="/teacher/attendance" className="text-xs font-bold text-brand-orange hover:text-brand-hover flex items-center gap-1">
                View All Attendance <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {displayAttendanceClasses.length === 0 ? (
              <div className="text-center py-8 bg-gray-50/60 dark:bg-navy-950/40 rounded-2xl border border-dashed border-gray-200 dark:border-navy-800 p-6 space-y-3">
                <Radio className="w-8 h-8 text-brand-orange mx-auto opacity-80 animate-pulse" />
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  No classes created yet. Create a class to launch live attendance sessions.
                </p>
                <Button
                  onClick={() => setClassModalOpen(true)}
                  className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs gap-1.5 mx-auto"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Class
                </Button>
              </div>
            ) : (
              <div className="relative group">
                <button 
                  type="button"
                  onClick={() => scrollAttendance('left')}
                  className="absolute -left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white dark:bg-navy-800 border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:text-brand-orange"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button 
                  type="button"
                  onClick={() => scrollAttendance('right')}
                  className="absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white dark:bg-navy-800 border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:text-brand-orange"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div 
                  ref={attendanceScrollRef}
                  className="flex gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-2"
                >
                  {displayAttendanceClasses.map((cls) => (
                    <div 
                      key={cls.id}
                      className="min-w-[210px] max-w-[230px] shrink-0 bg-gray-50/70 dark:bg-navy-950/60 border border-gray-150 dark:border-navy-800/80 rounded-2xl p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-xs font-extrabold text-navy-900 dark:text-white mb-0.5 truncate">{cls.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-3 truncate">{cls.subject}</div>
                        <div className="text-[11px] text-gray-400 font-medium mb-0.5">{cls.time}</div>
                        <div className="text-[11px] text-gray-400 font-medium mb-3">Room: {cls.room}</div>
                        <div className="flex items-center justify-between text-xs font-bold text-navy-900 dark:text-white mb-3">
                          <span>Students: {cls.present}</span>
                          <span className="text-brand-orange">Code Active</span>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate('/teacher/attendance')}
                        className="w-full py-2 rounded-xl bg-white dark:bg-navy-800 border border-orange-200 text-brand-orange text-xs font-extrabold hover:bg-brand-orange hover:text-white transition-all text-center shadow-xs cursor-pointer"
                      >
                        Take Attendance
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Grid: Recent Activities + Attendance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Recent Activities */}
            <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-gray-150 dark:border-navy-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-extrabold text-navy-900 dark:text-white">Recent Activities</h3>
                  <Link to="/teacher/announcements" className="text-xs font-bold text-brand-orange flex items-center gap-1">
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {teacherClasses.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <p className="text-xs text-gray-400">No activity yet. Your classroom logs and grading events will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {teacherClasses.slice(0, 3).map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckSquare className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-navy-900 dark:text-white truncate">Class configured: {c.name}</h5>
                            <p className="text-[10px] text-gray-400">{c.student_count || 0} students enrolled</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-700 text-[10px] font-bold shrink-0">Active</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Overview */}
            <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-gray-150 dark:border-navy-800 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-extrabold text-navy-900 dark:text-white">Attendance Overview</h3>
                  <Link to="/teacher/attendance" className="text-xs font-bold text-brand-orange flex items-center gap-1">
                    View Report <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  {/* SVG Donut Chart */}
                  <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-200 dark:text-navy-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        strokeDasharray="100, 100"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-500"
                        strokeWidth="3.8"
                        strokeDasharray={`${stats.studentsCount > 0 ? 100 : 0}, 100`}
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-base font-black text-navy-900 dark:text-white">{stats.studentsCount > 0 ? '100%' : '0%'}</span>
                      <span className="text-[9px] font-bold text-gray-400">Roster</span>
                    </div>
                  </div>

                  {/* Legend Stats */}
                  <div className="space-y-1.5 text-xs font-bold flex-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Active Roster
                      </span>
                      <span className="text-navy-900 dark:text-white">{stats.studentsCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Classes
                      </span>
                      <span className="text-navy-900 dark:text-white">{stats.classesCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-400 font-medium border-t border-gray-100 dark:border-navy-800 pt-1">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full border border-gray-300" /> Subjects
                      </span>
                      <span>{stats.subjectsCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Link
                to="/teacher/attendance"
                className="w-full py-3 rounded-xl bg-[#f97316] hover:bg-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
              >
                <BarChart4 className="w-4 h-4" />
                <span>Launch Attendance Portal</span>
              </Link>
            </div>

          </div>

        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          
          {/* Today's Schedule */}
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-gray-150 dark:border-navy-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-navy-900 dark:text-white">Class Timetable</h3>
              <Link to="/teacher/classes" className="text-xs font-bold text-brand-orange hover:text-brand-hover">
                View All -&gt;
              </Link>
            </div>

            {teacherClasses.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <Calendar className="w-6 h-6 text-gray-300 mx-auto" />
                <p className="text-xs text-gray-400">No classes configured. Create a class to establish your teaching schedule.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs font-semibold">
                {teacherClasses.map((cls: any, i: number) => (
                  <div key={cls.id} className="flex items-start gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${i % 3 === 0 ? 'bg-orange-500' : i % 3 === 1 ? 'bg-emerald-500' : 'bg-purple-500'} mt-1 shrink-0`} />
                    <div>
                      <div className="text-[11px] text-gray-400 font-medium">{cls.section ? `Section ${cls.section}` : 'Section A'} • Sem {cls.semester || 1}</div>
                      <div className="font-bold text-navy-900 dark:text-white">{cls.name}</div>
                      <div className="text-[11px] text-brand-orange font-mono font-bold">Join Code: {cls.join_code}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Tasks */}
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-gray-150 dark:border-navy-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-navy-900 dark:text-white">Pending Tasks</h3>
              <Link to="/teacher/assignments" className="text-xs font-bold text-brand-orange hover:text-brand-hover">
                View All -&gt;
              </Link>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/70 dark:bg-navy-950/60 border border-gray-150 dark:border-navy-800/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-brand-orange shrink-0" />
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-navy-900 dark:text-white truncate">Upload Unit 4 Notes</h5>
                    <p className="text-[10px] text-gray-400">Control System</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md border border-blue-200 text-blue-600 bg-blue-50 text-[10px] font-bold shrink-0">Low</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-navy-900 rounded-3xl p-6 border border-gray-150 dark:border-navy-800 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-navy-900 dark:text-white">Quick Actions</h3>

            <div className="grid grid-cols-4 gap-2 text-center">
              <button
                onClick={() => navigate('/teacher/attendance')}
                className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-gray-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-[#fff2e8] text-brand-orange flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-navy-900 dark:text-white leading-tight">Take Attendance</span>
              </button>

              <button
                onClick={handleCreateAssignmentClick}
                className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-gray-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-[#e6f7ed] text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-navy-900 dark:text-white leading-tight">Upload Material</span>
              </button>

              <button
                onClick={handleCreateQuizClick}
                className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-gray-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-[#f3e8ff] text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-navy-900 dark:text-white leading-tight">Create Quiz</span>
              </button>

              <button
                onClick={handlePostAnnouncementClick}
                className="flex flex-col items-center gap-2 p-2 rounded-2xl hover:bg-gray-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-[#fef3c7] text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Megaphone className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold text-navy-900 dark:text-white leading-tight">Post Announcement</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Modals for Action Triggers */}
      <CreateClassModal
        open={classModalOpen}
        onClose={() => setClassModalOpen(false)}
        onOpenChange={setClassModalOpen}
      />

      <CreateAssignmentModal
        isOpen={assignmentModalOpen}
        open={assignmentModalOpen}
        onClose={() => setAssignmentModalOpen(false)}
        onOpenChange={setAssignmentModalOpen}
        teacherClasses={teacherClasses}
      />

      <CreateAnnouncementModal
        open={announcementModalOpen}
        onClose={() => setAnnouncementModalOpen(false)}
        teacherClasses={teacherClasses}
      />

    </div>
  );
}
