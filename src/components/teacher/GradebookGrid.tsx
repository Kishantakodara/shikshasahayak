import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Download, 
  Search, 
  ArrowUpDown, 
  TrendingUp, 
  Award,
  BookOpen,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

interface GradebookGridProps {
  classId: string;
}

type SortField = 'name' | 'average' | 'completion';
type SortOrder = 'asc' | 'desc';

export const GradebookGrid: React.FC<GradebookGridProps> = ({ classId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Fetch gradebook data
  const { data, isLoading } = useQuery({
    queryKey: ['gradebook', classId],
    queryFn: () => teacherClient.getClassGradebook(classId),
  });

  const students = data?.students || [];
  const assignments = data?.assignments || [];
  const grades = data?.grades || {};

  // Compute stats for each student
  const studentStats = React.useMemo(() => {
    return students.map(student => {
      let totalMaxMarks = 0;
      let totalEarnedMarks = 0;
      let tasksCompleted = 0;

      assignments.forEach(assign => {
        const score = grades[student.id]?.[assign.id];
        if (score !== undefined && score !== null) {
          totalEarnedMarks += score;
          totalMaxMarks += assign.total_marks;
          tasksCompleted++;
        }
      });

      const averagePercentage = totalMaxMarks > 0 ? (totalEarnedMarks / totalMaxMarks) * 100 : null;
      const completionRate = assignments.length > 0 ? (tasksCompleted / assignments.length) * 100 : 0;

      return {
        ...student,
        averagePercentage,
        completionRate,
        tasksCompleted,
        totalEarnedMarks,
        totalMaxMarks
      };
    });
  }, [students, assignments, grades]);

  // Sort and filter student stats
  const processedStudents = React.useMemo(() => {
    let filtered = studentStats;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.enrollment_number.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      let aVal: any = 0;
      let bVal: any = 0;

      if (sortField === 'name') {
        aVal = a.name;
        bVal = b.name;
      } else if (sortField === 'average') {
        aVal = a.averagePercentage ?? -1;
        bVal = b.averagePercentage ?? -1;
      } else if (sortField === 'completion') {
        aVal = a.completionRate;
        bVal = b.completionRate;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [studentStats, searchQuery, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const exportCSV = () => {
    if (processedStudents.length === 0) return;

    // Columns: Name, Enrollment Number, Assignment 1, Assignment 2, ..., Average %, Completion Rate
    const headers = [
      'Student Name', 
      'Enrollment Number', 
      ...assignments.map(a => `${a.title} (/${a.total_marks})`),
      'Average Grade %',
      'Tasks Completed'
    ];

    const rows = processedStudents.map(s => [
      s.name,
      s.enrollment_number,
      ...assignments.map(a => {
        const score = grades[s.id]?.[a.id];
        return score !== null && score !== undefined ? score : '--';
      }),
      s.averagePercentage !== null ? `${s.averagePercentage.toFixed(1)}%` : '--',
      `${s.tasksCompleted}/${assignments.length}`
    ]);

    const csvContent = [
      headers,
      ...rows
    ].map(r => r.map(c => `"${c}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gradebook_class_${classId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Gradebook exported to CSV successfully');
  };

  const getGradeBadge = (percentage: number | null) => {
    if (percentage === null) return <span className="text-gray-400 font-medium text-xs">--</span>;
    let color = 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20';
    if (percentage < 60) color = 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20';
    else if (percentage < 75) color = 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20';

    return (
      <Badge variant="outline" className={`px-2 py-0.5 text-xs font-semibold ${color} border-transparent`}>
        {percentage.toFixed(1)}%
      </Badge>
    );
  };

  // Calculate class general metrics
  const classAverage = React.useMemo(() => {
    const validAverages = studentStats.map(s => s.averagePercentage).filter(v => v !== null) as number[];
    if (validAverages.length === 0) return null;
    return validAverages.reduce((sum, v) => sum + v, 0) / validAverages.length;
  }, [studentStats]);

  const classCompletion = React.useMemo(() => {
    if (studentStats.length === 0) return 0;
    return studentStats.reduce((sum, s) => sum + s.completionRate, 0) / studentStats.length;
  }, [studentStats]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Class Gradebook</h2>
          <p className="text-sm text-gray-500 dark:text-gray-455 mt-0.5">Spreadsheet ledger for all student evaluation scores</p>
        </div>
        <Button 
          onClick={exportCSV} 
          disabled={processedStudents.length === 0}
          className="bg-brand-orange hover:bg-brand-orange/90 text-white gap-2"
        >
          <Download className="w-4 h-4" />
          Export Ledger
        </Button>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-gray-100 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center text-brand-orange">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Class Average</p>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                {classAverage !== null ? `${classAverage.toFixed(1)}%` : '--'}
              </h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-500">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Mean Completion</p>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                {classCompletion.toFixed(1)}%
              </h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Graded Tasks</p>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                {assignments.length}
              </h4>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-550">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">At-Risk Students</p>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                {studentStats.filter(s => s.averagePercentage !== null && s.averagePercentage < 60).length}
              </h4>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Matrix Ledger Table */}
      <Card className="border-gray-100 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm">
        <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold">Grades Registry</CardTitle>
            <CardDescription className="text-xs">Spreadsheet of individual evaluations</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search student or roll no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs bg-gray-50/50 dark:bg-navy-950/30"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading Gradebook Matrix...</p>
            </div>
          ) : processedStudents.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-500">
              No students found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="border-collapse">
                <TableHeader className="bg-gray-50 dark:bg-navy-950/50">
                  <TableRow>
                    <TableHead 
                      onClick={() => handleSort('name')}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-navy-850 min-w-48 sticky left-0 bg-gray-50 dark:bg-[#0f172a] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r"
                    >
                      <div className="flex items-center gap-1">
                        Student Details
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </TableHead>

                    {/* Task Columns */}
                    {assignments.map((assign) => (
                      <TableHead key={assign.id} className="text-center min-w-32 border-r max-w-40 truncate">
                        <div className="font-semibold text-gray-900 dark:text-white" title={assign.title}>
                          {assign.title}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Max: {assign.total_marks}
                        </div>
                      </TableHead>
                    ))}

                    <TableHead 
                      onClick={() => handleSort('average')}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-navy-850 text-center min-w-28 border-r"
                    >
                      <div className="flex items-center justify-center gap-1 font-bold">
                        Average %
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </TableHead>

                    <TableHead 
                      onClick={() => handleSort('completion')}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-navy-850 text-center min-w-28"
                    >
                      <div className="flex items-center justify-center gap-1">
                        Completed
                        <ArrowUpDown className="w-3 h-3 text-gray-400" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedStudents.map((s) => (
                    <TableRow key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-navy-950/20">
                      <TableCell className="sticky left-0 bg-white dark:bg-[#0b121f] z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] font-medium">
                        <div className="font-bold text-gray-900 dark:text-white text-xs truncate max-w-44">{s.name}</div>
                        <div className="text-[10px] font-mono text-gray-400">{s.enrollment_number}</div>
                      </TableCell>

                      {/* Grades mapping */}
                      {assignments.map((assign) => {
                        const score = grades[s.id]?.[assign.id];
                        return (
                          <TableCell key={assign.id} className="text-center font-semibold text-xs border-r text-gray-700 dark:text-gray-300">
                            {score !== null && score !== undefined ? (
                              <span className={score / assign.total_marks < 0.6 ? 'text-red-500' : ''}>
                                {score} <span className="text-[10px] text-gray-400">/{assign.total_marks}</span>
                              </span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600 font-normal">--</span>
                            )}
                          </TableCell>
                        );
                      })}

                      <TableCell className="text-center border-r">
                        {getGradeBadge(s.averagePercentage)}
                      </TableCell>

                      <TableCell className="text-center text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {s.tasksCompleted} / {assignments.length} ({s.completionRate.toFixed(0)}%)
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};
