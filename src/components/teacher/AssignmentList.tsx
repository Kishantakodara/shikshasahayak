import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Send,
  BookOpen
} from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { CreateAssignmentModal } from './CreateAssignmentModal';
import { toast } from 'sonner';

interface AssignmentListProps {
  classId?: string;
  className?: string;
}

export const AssignmentList: React.FC<AssignmentListProps> = ({ classId, className }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Fetch assignments
  const { data: assignmentsData, isLoading, refetch } = useQuery({
    queryKey: ['assignments', { page, status: statusFilter, class_id: classId, search: searchQuery }],
    queryFn: () => teacherClient.getAssignments({
      page,
      limit: 20,
      status: statusFilter === 'all' ? undefined : statusFilter as any,
      class_id: classId,
      search: searchQuery || undefined,
    }),
  });

  // Fetch teacher classes for create modal
  const { data: classesData } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => teacherClient.getClasses(),
  });

  const assignments = assignmentsData?.assignments || [];
  const pagination = assignmentsData?.pagination;
  const teacherClasses = classesData?.classes || [];

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isDueSoon = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 24;
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const handleDeleteAssignment = async (assignmentId: string, assignmentTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${assignmentTitle}"?`)) return;
    
    try {
      await teacherClient.deleteAssignment(assignmentId);
      toast.success('Assignment deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete assignment');
    }
  };

  const handlePublishAssignment = async (assignmentId: string, assignmentTitle: string) => {
    if (!confirm(`Publish "${assignmentTitle}" to students?`)) return;
    
    try {
      const result = await teacherClient.publishAssignment(assignmentId, { notify_students: true });
      toast.success(`Assignment published successfully! ${result.notifications_sent} students notified`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish assignment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {classId ? `${className} Assignments` : 'All Assignments'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage assignments and track student submissions
          </p>
        </div>
        
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-brand-orange hover:bg-brand-orange/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Assignment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="GRADED">Graded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assignment Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first assignment to get started'
                }
              </p>
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-brand-orange hover:bg-brand-orange/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {assignments.map((assignment: any) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2">
                        {assignment.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {assignment.class_name} {assignment.class_section && `- ${assignment.class_section}`}
                        </Badge>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/teacher/assignments/${assignment.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/teacher/assignments/${assignment.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        {assignment.status === 'DRAFT' && (
                          <DropdownMenuItem
                            onClick={() => handlePublishAssignment(assignment.id, assignment.title)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {assignment.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {assignment.description}
                    </p>
                  )}
                  
                  {/* Assignment Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-brand-orange" />
                      <span>{assignment.total_marks} marks</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>{assignment.submitted_count || 0}/{assignment.total_submissions || 0} submitted</span>
                    </div>
                  </div>
                  
                  {/* Due Date */}
                  <div className="flex items-center justify-between text-sm">
                    <div className={`flex items-center gap-2 ${
                      isOverdue(assignment.due_date) 
                        ? 'text-red-600' 
                        : isDueSoon(assignment.due_date)
                        ? 'text-orange-600'
                        : 'text-gray-500'
                    }`}>
                      <Clock className="w-4 h-4" />
                      <span>
                        Due: {formatDate(assignment.due_date)}
                        {isOverdue(assignment.due_date) && ' (Overdue)'}
                        {isDueSoon(assignment.due_date) && !isOverdue(assignment.due_date) && ' (Due Soon)'}
                      </span>
                    </div>
                    
                    {assignment.graded_count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {assignment.graded_count} graded
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Link to={`/teacher/assignments/${assignment.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    
                    {assignment.status === 'PUBLISHED' && assignment.submitted_count > 0 && (
                      <Button
                        asChild
                        size="sm"
                        className="flex-1 bg-brand-orange hover:bg-brand-orange/90"
                      >
                        <Link to={`/teacher/assignments/${assignment.id}/submissions`}>
                          <Users className="w-4 h-4 mr-2" />
                          Grade ({assignment.submitted_count})
                        </Link>
                      </Button>
                    )}
                    
                    {assignment.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        onClick={() => handlePublishAssignment(assignment.id, assignment.title)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Publish
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={!pagination.hasMore}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Assignment Modal */}
      <CreateAssignmentModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        classId={classId}
        teacherClasses={teacherClasses.map(cls => ({
          ...cls,
          section: cls.section || undefined
        }))}
      />
    </div>
  );
};

export default AssignmentList;