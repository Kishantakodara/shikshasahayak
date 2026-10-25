import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Download, 
  UserPlus, 
  MoreVertical, 
  Eye, 
  MessageCircle, 
  UserX, 
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Grid3x3,
  List,
  ArrowUpDown
} from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import { BulkEnrollModal } from './BulkEnrollModal';
import { StudentProfileModal } from './StudentProfileModal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { toast } from 'sonner';

interface StudentListProps {
  classId: string;
  className: string;
}

type ViewMode = 'table' | 'cards';
type StatusFilter = 'all' | 'ACTIVE' | 'PENDING' | 'WITHDRAWN';
type SortField = 'name' | 'enrollment_number' | 'enrolled_at' | 'attendance' | 'average_marks';
type SortOrder = 'asc' | 'desc';

/**
 * StudentList Component
 * 
 * Displays enrolled students in a class with management actions
 * Requirements: 3.8, 3.9, 10.6
 */
export const StudentList: React.FC<StudentListProps> = ({ classId, className }) => {
  const queryClient = useQueryClient();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('enrolled_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [showBulkEnroll, setShowBulkEnroll] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const limit = 25;

  // Fetch students
  const { data, isLoading, error } = useQuery({
    queryKey: ['teacher', 'classes', classId, 'students', page, statusFilter, searchQuery],
    queryFn: () => teacherClient.getClassStudents(classId, { 
      page, 
      limit, 
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchQuery || undefined
    }),
  });

  // Remove student mutation
  const removeStudentMutation = useMutation({
    mutationFn: (studentId: string) => teacherClient.removeStudent(classId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'classes', classId, 'students'] });
      toast.success('Student removed from class');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove student: ${error.message}`);
    },
  });

  // Handle remove student
  const handleRemoveStudent = (student: any) => {
    if (window.confirm(`Remove ${student.student_name || student.enrollment_number} from "${className}"?`)) {
      removeStudentMutation.mutate(student.student_id);
    }
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Sort students
  const sortedStudents = React.useMemo(() => {
    if (!data?.students) return [];
    
    const students = [...data.students];
    
    students.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.student_name || a.enrollment_number;
          bValue = b.student_name || b.enrollment_number;
          break;
        case 'enrollment_number':
          aValue = a.enrollment_number;
          bValue = b.enrollment_number;
          break;
        case 'enrolled_at':
          aValue = new Date(a.enrolled_at);
          bValue = new Date(b.enrolled_at);
          break;
        case 'attendance':
          aValue = a.attendance_percentage || 0;
          bValue = b.attendance_percentage || 0;
          break;
        case 'average_marks':
          aValue = a.average_marks || 0;
          bValue = b.average_marks || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return students;
  }, [data?.students, sortField, sortOrder]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-emerald-500 text-white">Active</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">Pending</Badge>;
      case 'WITHDRAWN':
        return <Badge variant="outline" className="text-red-600 border-red-600">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'WITHDRAWN':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Student stats summary
  const totalStudents = data?.pagination?.total || 0;
  const activeCount = sortedStudents.filter(s => s.enrollment_status === 'ACTIVE').length;
  const pendingCount = sortedStudents.filter(s => s.enrollment_status === 'PENDING').length;
  const withdrawnCount = sortedStudents.filter(s => s.enrollment_status === 'WITHDRAWN').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Class Roster & Students</h2>
          <p className="text-sm text-muted-foreground">{totalStudents} enrolled in "{className}"</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => setShowBulkEnroll(true)}
            className="bg-brand-orange hover:bg-orange-600 text-white font-bold gap-2 shadow-xs cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Add Students (Excel / CSV)
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (!sortedStudents || sortedStudents.length === 0) {
                toast.info('No students to export');
                return;
              }
              const exportRows = sortedStudents.map((st) => ({
                'Enrollment Number': st.enrollment_number,
                'Full Name': st.student_name || '',
                'Email': st.student_email || '',
                'Status': st.enrollment_status,
                'Enrolled At': st.enrolled_at,
              }));
              const worksheet = XLSX.utils.json_to_sheet(exportRows);
              const workbook = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
              XLSX.writeFile(workbook, `${className.replace(/[^a-zA-Z0-9]/g, '_')}_roster.xlsx`);
              toast.success('Roster exported to Excel (.xlsx)!');
            }}
            className="gap-2 font-semibold"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{withdrawnCount}</p>
            <p className="text-xs text-muted-foreground">Withdrawn</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or enrollment number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as StatusFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="px-3"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="px-3"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading students...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <p className="text-red-600 dark:text-red-400 font-semibold">Failed to load students</p>
            <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          </div>
        </div>
      ) : sortedStudents.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-6xl">👥</div>
            <h3 className="text-xl font-bold text-foreground">No students found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'No students match your search criteria.'
                : statusFilter === 'WITHDRAWN'
                ? 'No withdrawn students in this class.'
                : 'Start by adding students to your class!'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button
                onClick={() => setShowBulkEnroll(true)}
                className="gap-2 bg-brand-orange hover:bg-brand-hover text-white"
              >
                <UserPlus className="h-4 w-4" />
                Add Students
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        // Table View
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Status</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort('enrollment_number')}
                  >
                    <div className="flex items-center gap-1">
                      Enrollment #
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort('attendance')}
                  >
                    <div className="flex items-center gap-1">
                      Attendance %
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort('average_marks')}
                  >
                    <div className="flex items-center gap-1">
                      Avg. Marks
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStudents.map((student) => (
                  <TableRow key={student.enrollment_id}>
                    <TableCell>{getStatusIcon(student.enrollment_status)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          {student.student_name || 'Unknown'}
                        </p>
                        {student.student_email && (
                          <p className="text-xs text-muted-foreground">{student.student_email}</p>
                        )}
                        {student.is_placeholder && (
                          <Badge variant="outline" className="text-xs mt-1">Placeholder</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{student.enrollment_number}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {student.attendance_percentage ?? '--'}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {student.average_marks ?? '--'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStudent(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStudent(student)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        // Cards View
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedStudents.map((student) => (
            <Card key={student.enrollment_id} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(student.enrollment_status)}
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {student.student_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {student.enrollment_number}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(student.enrollment_status)}
                </div>

                {student.student_email && (
                  <p className="text-xs text-muted-foreground mb-3">{student.student_email}</p>
                )}

                {student.is_placeholder && (
                  <Badge variant="outline" className="text-xs mb-3">Placeholder Account</Badge>
                )}

                <div className="grid grid-cols-2 gap-4 text-center text-xs mb-4">
                  <div>
                    <p className="text-muted-foreground">Attendance</p>
                    <p className="font-semibold text-foreground">
                      {student.attendance_percentage ?? '--'}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg. Marks</p>
                    <p className="font-semibold text-foreground">
                      {student.average_marks ?? '--'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveStudent(student)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <UserX className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => {
                return (
                  p === 1 ||
                  p === data.pagination.totalPages ||
                  Math.abs(p - page) <= 1
                );
              })
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-2 text-muted-foreground">...</span>
                  )}
                  <Button
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                    className="min-w-9"
                  >
                    {p}
                  </Button>
                </React.Fragment>
              ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page === data.pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Modals */}
      <BulkEnrollModal
        open={showBulkEnroll}
        onClose={() => setShowBulkEnroll(false)}
        classId={classId}
        className={className}
      />

      {selectedStudent && (
        <StudentProfileModal
          open={true}
          onClose={() => setSelectedStudent(null)}
          student={selectedStudent}
          classId={classId}
        />
      )}
    </div>
  );
};