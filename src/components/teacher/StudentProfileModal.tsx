import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Calendar, 
  MapPin, 
  BookOpen,
  FileText,
  Clock,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface StudentProfileModalProps {
  open: boolean;
  onClose: () => void;
  student: any;
  classId: string;
}

/**
 * StudentProfileModal Component
 * 
 * Shows detailed student information, performance, and history
 * Requirements: 3.9, 10.6
 */
export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  open,
  onClose,
  student,
  classId,
}) => {
  // Mock data - in real implementation, this would come from API calls
  const submissionHistory = [
    {
      id: 'sub-1',
      assignment: 'Web Development Project',
      submitted_at: '2024-01-15T10:30:00Z',
      marks: 85,
      total_marks: 100,
      status: 'GRADED',
      is_late: false,
    },
    {
      id: 'sub-2', 
      assignment: 'Database Design Assignment',
      submitted_at: '2024-01-10T14:20:00Z',
      marks: 78,
      total_marks: 100,
      status: 'GRADED',
      is_late: true,
    },
    {
      id: 'sub-3',
      assignment: 'React Component Library',
      submitted_at: null,
      marks: null,
      total_marks: 100,
      status: 'PENDING',
      is_late: false,
    },
  ];

  const attendanceHistory = [
    { date: '2024-01-20', status: 'PRESENT' },
    { date: '2024-01-18', status: 'PRESENT' },
    { date: '2024-01-15', status: 'ABSENT' },
    { date: '2024-01-13', status: 'PRESENT' },
    { date: '2024-01-11', status: 'LATE' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-emerald-500 text-white">Active</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case 'WITHDRAWN':
        return <Badge variant="outline" className="text-red-600 border-red-600">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSubmissionStatusBadge = (status: string, isLate: boolean) => {
    switch (status) {
      case 'GRADED':
        return <Badge className={`${isLate ? 'bg-orange-500' : 'bg-emerald-500'} text-white`}>
          {isLate ? 'Late Submission' : 'Graded'}
        </Badge>;
      case 'PENDING':
        return <Badge className="bg-gray-500 text-white">Not Submitted</Badge>;
      case 'SUBMITTED':
        return <Badge className="bg-blue-500 text-white">Submitted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'ABSENT':
        return <X className="h-4 w-4 text-red-500" />;
      case 'LATE':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'EXCUSED':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const calculatePerformanceMetrics = () => {
    const gradedSubmissions = submissionHistory.filter(s => s.status === 'GRADED');
    const totalMarks = gradedSubmissions.reduce((sum, s) => sum + (s.marks || 0), 0);
    const maxMarks = gradedSubmissions.reduce((sum, s) => sum + s.total_marks, 0);
    const average = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
    
    const presentDays = attendanceHistory.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendanceRate = attendanceHistory.length > 0 ? (presentDays / attendanceHistory.length) * 100 : 0;
    
    return {
      averageMarks: Math.round(average),
      attendanceRate: Math.round(attendanceRate),
      totalSubmissions: submissionHistory.length,
      gradedSubmissions: gradedSubmissions.length,
      pendingSubmissions: submissionHistory.filter(s => s.status === 'PENDING').length,
    };
  };

  const metrics = calculatePerformanceMetrics();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Student Profile</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {/* Student Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Avatar and Basic Info */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-brand-orange to-orange-600 rounded-full flex items-center justify-center">
                    <User className="h-10 w-10 text-white" />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {student.student_name || 'Unknown Student'}
                      </h3>
                      <p className="text-sm text-muted-foreground font-mono">
                        {student.enrollment_number}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2 sm:mt-0">
                      {getStatusBadge(student.enrollment_status)}
                      {student.is_placeholder && (
                        <Badge variant="outline">Placeholder</Badge>
                      )}
                    </div>
                  </div>

                  {/* Contact and Academic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {student.student_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{student.student_email}</span>
                      </div>
                    )}
                    
                    {student.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{student.phone_number}</span>
                      </div>
                    )}
                    
                    {student.branch && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{student.branch}</span>
                      </div>
                    )}
                    
                    {student.semester && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Semester {student.semester}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Enrolled {new Date(student.enrolled_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 text-brand-orange mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{metrics.averageMarks}%</p>
                <p className="text-xs text-muted-foreground">Average Marks</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{metrics.attendanceRate}%</p>
                <p className="text-xs text-muted-foreground">Attendance</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{metrics.gradedSubmissions}</p>
                <p className="text-xs text-muted-foreground">Submissions</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{metrics.pendingSubmissions}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue="submissions" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="analytics">Performance</TabsTrigger>
            </TabsList>

            {/* Submissions Tab */}
            <TabsContent value="submissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assignment Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {submissionHistory.map((submission) => (
                      <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">{submission.assignment}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {submission.submitted_at ? (
                              <span>Submitted: {new Date(submission.submitted_at).toLocaleString()}</span>
                            ) : (
                              <span>Not submitted</span>
                            )}
                            {submission.marks !== null && (
                              <span className="font-semibold">
                                {submission.marks}/{submission.total_marks} marks
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSubmissionStatusBadge(submission.status, submission.is_late)}
                          {submission.status === 'GRADED' && (
                            <Button variant="outline" size="sm">
                              <FileText className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attendance History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {attendanceHistory.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getAttendanceIcon(record.status)}
                          <span className="text-sm text-foreground">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={
                            record.status === 'PRESENT' ? 'text-emerald-600 border-emerald-600' :
                            record.status === 'ABSENT' ? 'text-red-600 border-red-600' :
                            record.status === 'LATE' ? 'text-yellow-600 border-yellow-600' :
                            'text-blue-600 border-blue-600'
                          }
                        >
                          {record.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Performance charts and analytics coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            View All Submissions
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};