import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  FileText,
  User,
  Calendar,
  Clock,
  Star,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  Eye,
  Sparkles,
  Loader2
} from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Switch } from '../../components/ui/switch';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';

export default function AssignmentSubmissions() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [marks, setMarks] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [returnToStudent, setReturnToStudent] = useState(true);

  // Fetch assignment details
  const { data: assignment } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => teacherClient.getAssignment(assignmentId!),
    enabled: !!assignmentId,
  });

  // Fetch submissions
  const { data: submissionsData, isLoading, refetch } = useQuery({
    queryKey: ['assignment-submissions', assignmentId, { status: statusFilter, search: searchQuery }],
    queryFn: () => teacherClient.getAssignmentSubmissions(assignmentId!, {
      status: statusFilter === 'all' ? undefined : statusFilter as any,
      search: searchQuery || undefined,
      limit: 50,
    }),
    enabled: !!assignmentId,
  });

  // Grade submission mutation
  const gradeMutation = useMutation({
    mutationFn: ({ submissionId, gradeData }: { submissionId: string; gradeData: any }) =>
      teacherClient.gradeSubmission(assignmentId!, submissionId, gradeData),
    onSuccess: () => {
      toast.success('Submission graded successfully');
      setGradingModalOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to grade submission');
    },
  });

  const submissions = submissionsData?.submissions || [];
  const assignmentSummary = submissionsData?.assignment_summary;

  const handleGradeSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setMarks(submission.marks || 0);
    setFeedback(submission.feedback || '');
    setGradingModalOpen(true);
  };

  const handleSubmitGrade = () => {
    if (!selectedSubmission || marks < 0 || marks > (assignmentSummary?.total_marks || 100)) {
      toast.error('Please enter valid marks');
      return;
    }

    gradeMutation.mutate({
      submissionId: selectedSubmission.id,
      gradeData: {
        marks,
        feedback: feedback.trim() || undefined,
        return_to_student: returnToStudent,
      },
    });
  };

  const [isAILoading, setIsAILoading] = useState(false);

  const handleAIEvaluate = async () => {
    if (!selectedSubmission) return;
    setIsAILoading(true);
    try {
      const draft = await teacherClient.getAIEvaluationDraft(selectedSubmission.id);
      setMarks(draft.marks);
      setFeedback(draft.feedback);
      toast.success('AI Suggested Marks & Feedback loaded!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate AI evaluation draft');
    } finally {
      setIsAILoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
      case 'LATE_SUBMITTED': return 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300';
      case 'GRADED': return 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300';
      case 'RETURNED': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 dark:text-green-400';
    if (percentage >= 80) return 'text-blue-600 dark:text-blue-400';
    if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (percentage >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#070D19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-navy-800 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-navy-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalSubmissions = submissions.length;
  const gradedCount = submissions.filter((s: any) => s.status === 'GRADED' || s.status === 'RETURNED').length;
  const gradingProgress = totalSubmissions > 0 ? (gradedCount / totalSubmissions) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#070D19] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm" className="bg-white dark:bg-navy-900 border-gray-200 dark:border-navy-800 text-gray-900 dark:text-white">
              <Link to={`/teacher/assignments/${assignmentId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Assignment
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
                {assignment?.title} - Submissions
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span>{totalSubmissions} submissions</span>
                <span>•</span>
                <span>{gradedCount} graded</span>
                <span>•</span>
                <span>{assignmentSummary?.total_marks} marks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-navy-900 border-gray-100 dark:border-navy-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Submissions</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalSubmissions}</p>
                </div>
                <FileText className="w-8 h-8 text-brand-orange" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-navy-900 border-gray-100 dark:border-navy-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Graded</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{gradedCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-navy-900 border-gray-100 dark:border-navy-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{totalSubmissions - gradedCount}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-navy-900 border-gray-100 dark:border-navy-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Late Submissions</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {submissions.filter((s: any) => s.is_late).length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grading Progress */}
        <Card className="mb-8 bg-white dark:bg-navy-900 border-gray-100 dark:border-navy-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Grading Progress</h3>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">{gradingProgress.toFixed(1)}% complete</span>
            </div>
            <Progress value={gradingProgress} className="h-3" />
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by student name or enrollment number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-navy-900 border-gray-200 dark:border-navy-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-white dark:bg-navy-900 border-gray-200 dark:border-navy-800 text-gray-900 dark:text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Submissions</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="LATE_SUBMITTED">Late Submitted</SelectItem>
                <SelectItem value="GRADED">Graded</SelectItem>
                <SelectItem value="RETURNED">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <Card className="bg-white dark:bg-navy-900 border-gray-100 dark:border-navy-800">
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No submissions found</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'No students have submitted this assignment yet'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            submissions.map((submission: any) => (
              <Card key={submission.id} className="bg-white dark:bg-navy-900 border-gray-100 dark:border-navy-800 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-brand-orange" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-white truncate">
                            {submission.student_name || 'Unknown Student'}
                          </h3>
                          <Badge className={getStatusColor(submission.status)}>
                            {submission.status.replace('_', ' ')}
                          </Badge>
                          {submission.is_late && (
                            <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
                              Late
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>{submission.enrollment_number}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Submitted {formatDate(submission.submitted_at)}</span>
                          </div>
                        </div>
                        
                        {submission.feedback && (
                          <div className="mt-2 p-3 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-sm">
                            <div className="flex items-center gap-1 mb-1 text-gray-900 dark:text-white font-bold">
                              <MessageSquare className="w-3.5 h-3.5 text-brand-orange" />
                              <span>Feedback:</span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 line-clamp-2">{submission.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {submission.marks !== null ? (
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            <span className={getGradeColor(parseFloat(submission.grade_percentage))}>
                              {submission.marks}
                            </span>
                            <span className="text-lg text-gray-400">/{assignmentSummary?.total_marks}</span>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
                            {submission.grade_percentage}%
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-semibold">Not Graded</div>
                          <Button
                            onClick={() => handleGradeSubmission(submission)}
                            size="sm"
                            className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold"
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Grade
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2">
                        {submission.marks !== null && (
                          <Button
                            onClick={() => handleGradeSubmission(submission)}
                            variant="outline"
                            size="sm"
                            className="bg-white dark:bg-navy-950 border-gray-200 dark:border-navy-800 text-gray-900 dark:text-white"
                          >
                            <Star className="w-4 h-4 mr-2 text-brand-orange" />
                            Re-grade
                          </Button>
                        )}
                        
                        <Button variant="outline" size="sm" className="bg-white dark:bg-navy-950 border-gray-200 dark:border-navy-800 text-gray-900 dark:text-white">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Grading Modal */}
        <Dialog open={gradingModalOpen} onOpenChange={setGradingModalOpen}>
          <DialogContent className="max-w-2xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 text-gray-900 dark:text-white rounded-3xl p-6 shadow-2xl">
            <DialogHeader className="pb-3 border-b border-gray-100 dark:border-navy-800">
              <DialogTitle className="text-xl font-bold font-display text-gray-900 dark:text-white">Grade Submission</DialogTitle>
            </DialogHeader>
            
            {selectedSubmission && (
              <div className="space-y-6 pt-3">
                {/* Student Info */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-2xl">
                  <div className="w-12 h-12 bg-brand-orange/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-brand-orange" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{selectedSubmission.student_name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedSubmission.enrollment_number} • 
                      Submitted {formatDate(selectedSubmission.submitted_at)}
                      {selectedSubmission.is_late && (
                        <Badge className="ml-2 text-red-600 bg-red-50 dark:bg-red-950/40">Late</Badge>
                      )}
                    </p>
                  </div>
                </div>

                {/* Grading Form */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label htmlFor="marks" className="text-sm font-bold text-gray-900 dark:text-white">Marks (out of {assignmentSummary?.total_marks})</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAIEvaluate}
                        disabled={isAILoading}
                        className="h-7 px-2.5 text-xs font-bold text-brand-orange border-brand-orange/30 hover:bg-orange-50 dark:hover:bg-orange-950/20 gap-1 flex items-center"
                      >
                        {isAILoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-brand-orange" />
                        )}
                        <span>AI Assist</span>
                      </Button>
                    </div>
                    <Input
                      id="marks"
                      type="number"
                      min="0"
                      max={assignmentSummary?.total_marks}
                      step="0.5"
                      value={marks}
                      onChange={(e) => setMarks(parseFloat(e.target.value) || 0)}
                      placeholder="Enter marks"
                      className="bg-gray-50 dark:bg-navy-950 border-gray-200 dark:border-navy-800 text-gray-900 dark:text-white font-bold"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="feedback" className="text-sm font-bold text-gray-900 dark:text-white">Feedback (Optional)</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide feedback to help the student improve..."
                      rows={4}
                      className="bg-gray-50 dark:bg-navy-950 border-gray-200 dark:border-navy-800 text-gray-900 dark:text-white mt-1.5"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={returnToStudent}
                        onCheckedChange={setReturnToStudent}
                      />
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Return to student with notification</Label>
                    </div>
                    
                    <div className="text-sm font-bold text-brand-orange">
                      Grade: {marks > 0 && assignmentSummary?.total_marks ? 
                        ((marks / assignmentSummary.total_marks) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-navy-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setGradingModalOpen(false)}
                    className="border-gray-200 dark:border-navy-800 text-gray-900 dark:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitGrade}
                    disabled={gradeMutation.isPending}
                    className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold"
                  >
                    {gradeMutation.isPending ? 'Grading...' : 'Submit Grade'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}