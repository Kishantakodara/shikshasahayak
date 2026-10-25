import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  FileText,
  Edit,
  Trash2,
  Send,
  Eye,
  Download,
  BarChart3,
  Settings,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';
import { toast } from 'sonner';

type TabValue = 'overview' | 'questions' | 'submissions' | 'analytics';

export default function AssignmentDetails() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  // Fetch assignment details
  const { data: assignment, isLoading, error } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => teacherClient.getAssignment(assignmentId!),
    enabled: !!assignmentId,
  });

  // Fetch submissions if needed
  const { data: submissionsData } = useQuery({
    queryKey: ['assignment-submissions', assignmentId],
    queryFn: () => teacherClient.getAssignmentSubmissions(assignmentId!, { limit: 50 }),
    enabled: !!assignmentId && assignment?.status === 'PUBLISHED',
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => teacherClient.deleteAssignment(assignmentId!),
    onSuccess: () => {
      toast.success('Assignment deleted successfully');
      navigate('/teacher/assignments');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete assignment');
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: () => teacherClient.publishAssignment(assignmentId!, { notify_students: true }),
    onSuccess: (result) => {
      toast.success(`Assignment published! ${result.notifications_sent} students notified`);
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to publish assignment');
    },
  });

  const handleDelete = () => {
    if (!assignment) return;
    if (confirm(`Are you sure you want to delete "${assignment.title}"?`)) {
      deleteMutation.mutate();
    }
  };

  const handlePublish = () => {
    if (!assignment) return;
    if (confirm(`Publish "${assignment.title}" to students?`)) {
      publishMutation.mutate();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-red-100 text-red-800';
      case 'GRADED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Assignment Not Found</h1>
            <p className="text-gray-600 mb-6">The assignment you're looking for doesn't exist or you don't have access to it.</p>
            <Button asChild variant="outline">
              <Link to="/teacher/assignments">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Assignments
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const submissions = submissionsData?.submissions || [];
  const stats = assignment.stats || {};
  const questions = assignment.questions || [];
  const submissionRate = stats.total_submissions > 0 ? (stats.submitted_count / stats.total_submissions) * 100 : 0;
  const gradingRate = stats.submitted_count > 0 ? (stats.graded_count / stats.submitted_count) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm">
              <Link to="/teacher/assignments">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor(assignment.status)}>
                  {assignment.status}
                </Badge>
                <Badge variant="outline">
                  {assignment.class_name} {assignment.class_section && `- ${assignment.class_section}`}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {assignment.status === 'DRAFT' && (
              <Button
                onClick={handlePublish}
                disabled={publishMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {publishMutation.isPending ? 'Publishing...' : 'Publish'}
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to={`/teacher/assignments/${assignmentId}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
                <TabsTrigger value="submissions">
                  Submissions ({stats.submitted_count || 0})
                </TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Assignment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {assignment.description && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                        <p className="text-gray-700">{assignment.description}</p>
                      </div>
                    )}
                    
                    {assignment.instructions && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-700 whitespace-pre-wrap">{assignment.instructions}</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Settings</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Marks:</span>
                            <span className="font-medium">{assignment.total_marks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Late Submissions:</span>
                            <span className="font-medium">
                              {assignment.allow_late_submission ? 'Allowed' : 'Not Allowed'}
                            </span>
                          </div>
                          {assignment.allow_late_submission && assignment.late_penalty_percent && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Late Penalty:</span>
                              <span className="font-medium">{assignment.late_penalty_percent}%</span>
                            </div>
                          )}
                          {assignment.max_file_size_mb && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Max File Size:</span>
                              <span className="font-medium">{assignment.max_file_size_mb}MB</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">File Types</h4>
                        {assignment.allowed_file_types && assignment.allowed_file_types.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignment.allowed_file_types.map((type: string) => (
                              <Badge key={type} variant="outline" className="text-xs">
                                {type.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">All file types allowed</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Questions Tab */}
              <TabsContent value="questions" className="space-y-4 mt-6">
                {questions.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No structured questions added</p>
                      <p className="text-sm text-gray-400 mt-1">
                        This assignment uses description/instructions for requirements
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  questions.map((question: any, index: number) => (
                    <Card key={question.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                          <Badge variant="outline">{question.max_marks} marks</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <Badge className="mb-2">{question.question_type.replace('_', ' ')}</Badge>
                            <p className="text-gray-900">{question.question_text}</p>
                          </div>
                          
                          {question.question_type === 'MCQ' && question.options && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                              <ol className="list-decimal list-inside space-y-1">
                                {question.options.map((option: string, i: number) => (
                                  <li key={i} className="text-sm text-gray-600">{option}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{question.required ? 'Required' : 'Optional'}</span>
                            <span>{question.max_marks} marks</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Submissions Tab */}
              <TabsContent value="submissions" className="space-y-4 mt-6">
                {assignment.status === 'DRAFT' ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Publish the assignment to see submissions</p>
                    </CardContent>
                  </Card>
                ) : submissions.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No submissions yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Recent Submissions</h3>
                      <Button asChild className="bg-brand-orange hover:bg-brand-orange/90">
                        <Link to={`/teacher/assignments/${assignmentId}/submissions`}>
                          View All Submissions
                        </Link>
                      </Button>
                    </div>
                    
                    {submissions.slice(0, 5).map((submission: any) => (
                      <Card key={submission.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              submission.status === 'GRADED' ? 'bg-green-500' :
                              submission.status === 'SUBMITTED' ? 'bg-blue-500' :
                              'bg-gray-400'
                            }`} />
                            <div>
                              <p className="font-medium">{submission.student_name || 'Unknown Student'}</p>
                              <p className="text-sm text-gray-500">
                                {submission.enrollment_number} • {formatDate(submission.submitted_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {submission.marks !== null ? (
                              <div className="text-sm">
                                <span className="font-medium">{submission.marks}</span>
                                <span className="text-gray-500">/{assignment.total_marks}</span>
                                <div className="text-xs text-gray-400">
                                  {submission.grade_percentage}%
                                </div>
                              </div>
                            ) : (
                              <Badge variant="outline">Not Graded</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Submission Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Submission Rate</span>
                            <span>{submissionRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={submissionRate} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1">
                            {stats.submitted_count || 0} of {stats.total_submissions || 0} students
                          </p>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Grading Progress</span>
                            <span>{gradingRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={gradingRate} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1">
                            {stats.graded_count || 0} of {stats.submitted_count || 0} submissions
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Score Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats.average_marks !== null ? (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Average Score:</span>
                            <span className="font-medium">
                              {stats.average_marks?.toFixed(1)}/{assignment.total_marks}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Highest Score:</span>
                            <span className="font-medium">
                              {stats.max_marks}/{assignment.total_marks}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Lowest Score:</span>
                            <span className="font-medium">
                              {stats.min_marks}/{assignment.total_marks}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Late Submissions:</span>
                            <span className="font-medium text-orange-600">
                              {stats.late_submissions || 0}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No grades available yet</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Due Date Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Due Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-medium ${isOverdue(assignment.due_date) ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(assignment.due_date)}
                </div>
                {isOverdue(assignment.due_date) && (
                  <div className="flex items-center gap-1 text-sm text-red-600 mt-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Overdue</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Marks:</span>
                  <span className="font-medium">{assignment.total_marks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Questions:</span>
                  <span className="font-medium">{questions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Submissions:</span>
                  <span className="font-medium">{stats.submitted_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Graded:</span>
                  <span className="font-medium">{stats.graded_count || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            {assignment.status === 'PUBLISHED' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild className="w-full" variant="outline">
                    <Link to={`/teacher/assignments/${assignmentId}/submissions`}>
                      <Users className="w-4 h-4 mr-2" />
                      View All Submissions
                    </Link>
                  </Button>
                  <Button asChild className="w-full" variant="outline">
                    <Link to={`/teacher/assignments/${assignmentId}/edit`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Assignment
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}