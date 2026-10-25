import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Users,
  FileText,
  BookOpen,
  Calendar,
  Settings,
  BarChart3,
  Copy,
  RefreshCw,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { JoinCodeDisplay } from '../../components/teacher/JoinCodeDisplay';
import { QuizAssignmentPanel } from '../../components/teacher/QuizAssignmentPanel';
import { AssignmentList } from '../../components/teacher/AssignmentList';
import { AttendancePanel } from '../../components/teacher/AttendancePanel';
import { StudentList } from '../../components/teacher/StudentList';
import { ClassStream } from '../../components/teacher/ClassStream';
import { GradebookGrid } from '../../components/teacher/GradebookGrid';
import { MaterialsPanel } from '../../components/teacher/MaterialsPanel';
import { toast } from 'sonner';

type TabValue = 'stream' | 'overview' | 'students' | 'quizzes' | 'assignments' | 'materials' | 'attendance' | 'gradebook';

/**
 * ClassDetails Page
 * 
 * Single class view with tabs for different aspects
 * Requirements: 2.5, 2.6
 */
export default function ClassDetails() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('stream');
  const [showActions, setShowActions] = useState(false);

  // Fetch class details
  const { data: classData, isLoading, error } = useQuery({
    queryKey: ['teacher', 'classes', classId],
    queryFn: () => teacherClient.getClass(classId!),
    enabled: !!classId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-red-600 dark:text-red-400 font-semibold text-lg">
            Failed to load class
          </p>
          <p className="text-sm text-muted-foreground">
            {error ? (error as Error).message : 'Class not found'}
          </p>
          <Button onClick={() => navigate('/teacher/classes')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Cover Image */}
      <div className="relative">
        {/* Cover Image or Gradient */}
        <div
          className="h-48 sm:h-64 rounded-lg bg-gradient-to-br from-brand-orange/70 to-orange-600 relative overflow-hidden"
          style={
            classData.cover_image
              ? { backgroundImage: `url(${classData.cover_image})`, backgroundSize: 'cover' }
              : undefined
          }
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Back Button */}
          <div className="absolute top-4 left-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/teacher/classes')}
              className="gap-2 bg-white/90 hover:bg-white text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <Badge
              variant={classData.is_active ? 'default' : 'secondary'}
              className={`${
                classData.is_active ? 'bg-emerald-500' : 'bg-gray-400'
              } text-white px-3 py-1`}
            >
              {classData.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {/* Class Info Overlay */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold font-display mb-2">
              {classData.name}
            </h1>
            <div className="flex flex-wrap gap-2 text-sm">
              {classData.section && (
                <Badge variant="outline" className="border-white text-white">
                  Section {classData.section}
                </Badge>
              )}
              {classData.semester && (
                <Badge variant="outline" className="border-white text-white">
                  Semester {classData.semester}
                </Badge>
              )}
              {classData.academic_year && (
                <Badge variant="outline" className="border-white text-white">
                  {classData.academic_year}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Class Join Code & Student Invite Quick Access Bar */}
      {classData.join_code && (
        <div className="bg-gradient-to-r from-orange-500/10 via-brand-orange/5 to-transparent dark:from-orange-950/40 dark:via-navy-900 dark:to-navy-900 p-4 sm:p-5 rounded-2xl border border-brand-orange/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange text-white flex items-center justify-center font-mono font-black text-xl shadow-md">
              #
            </div>
            <div>
              <div className="text-xs text-brand-orange font-bold uppercase tracking-wider flex items-center gap-1.5">
                Class Join Code (For Students)
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-2xl font-black text-navy-900 dark:text-white tracking-widest select-all">
                  {classData.join_code}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(classData.join_code);
                toast.success(`Join Code "${classData.join_code}" copied to clipboard!`);
              }}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial text-xs border-brand-orange/40 text-brand-orange hover:bg-orange-50 dark:hover:bg-navy-800 font-bold gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Code
            </Button>

            <Button
              onClick={() => {
                const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://beta.shikshasahayak.org';
                const inviteLink = `${baseUrl}/login?joinCode=${encodeURIComponent(classData.join_code)}`;
                navigator.clipboard.writeText(inviteLink);
                toast.success('Student Invite Link copied! Share this with your students.');
              }}
              size="sm"
              className="flex-1 sm:flex-initial text-xs bg-brand-orange hover:bg-orange-600 text-white font-bold gap-1.5 shadow-xs"
            >
              <Users className="w-3.5 h-3.5" /> Copy Student Invite Link
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-brand-orange mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {classData.student_count || 0}
            </p>
            <p className="text-xs text-muted-foreground">Students</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-5 w-5 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {classData.assignment_count || 0}
            </p>
            <p className="text-xs text-muted-foreground">Assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-5 w-5 mx-auto text-emerald-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">
              {classData.material_count || 0}
            </p>
            <p className="text-xs text-muted-foreground">Materials</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-foreground">--</p>
            <p className="text-xs text-muted-foreground">Attendance</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="flex flex-wrap md:grid md:grid-cols-8 w-full h-auto bg-muted/50 p-1 rounded-xl mb-6">
          <TabsTrigger value="stream" className="flex-grow py-2">Stream</TabsTrigger>
          <TabsTrigger value="overview" className="flex-grow py-2">Overview</TabsTrigger>
          <TabsTrigger value="students" className="flex-grow py-2">Students</TabsTrigger>
          <TabsTrigger value="quizzes" className="flex-grow py-2">Quizzes</TabsTrigger>
          <TabsTrigger value="assignments" className="flex-grow py-2">Assignments</TabsTrigger>
          <TabsTrigger value="materials" className="flex-grow py-2">Materials</TabsTrigger>
          <TabsTrigger value="attendance" className="flex-grow py-2">Attendance</TabsTrigger>
          <TabsTrigger value="gradebook" className="flex-grow py-2">Gradebook</TabsTrigger>
        </TabsList>

        {/* Stream Tab */}
        <TabsContent value="stream" className="space-y-6 mt-2">
          <ClassStream classId={classData.id} />
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Class Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {classData.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-foreground">{classData.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Grading System</p>
                  <Badge variant="outline">{classData.grading_system}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Max Students</p>
                  <p className="text-foreground font-semibold">{classData.max_students}</p>
                </div>
              </div>

              <JoinCodeDisplay
                joinCode={classData.join_code}
                classId={classData.id}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Analytics dashboard coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6 mt-6">
          <StudentList classId={classData.id} className={classData.name} />
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-6 mt-6">
          <QuizAssignmentPanel classId={classData.id} />
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6 mt-6">
          <AssignmentList classId={classData.id} className={classData.name} />
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-6 mt-6">
          <MaterialsPanel classId={classData.id} />
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6 mt-6">
          <AttendancePanel classId={classData.id} className={classData.name} />
        </TabsContent>

        {/* Gradebook Tab */}
        <TabsContent value="gradebook" className="space-y-6 mt-6">
          <GradebookGrid classId={classData.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
