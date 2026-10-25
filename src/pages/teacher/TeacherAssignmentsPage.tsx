import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  CheckCircle, 
  Clock, 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  CheckSquare,
  Sparkles,
  Download
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  classBatch: string;
  dueDate: string;
  submittedCount: number;
  totalStudents: number;
  status: 'published' | 'draft' | 'closed';
}

import { useQuery } from '@tanstack/react-query';
import { teacherClient } from '../../api/teacherClient';

export default function TeacherAssignmentsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('General Academic');
  const [newClass, setNewClass] = useState('Assigned Batch');
  const [newDueDate, setNewDueDate] = useState('');

  const [customAssignments, setCustomAssignments] = useState<Assignment[]>([]);

  const { data: apiData } = useQuery({
    queryKey: ['teacher', 'assignments'],
    queryFn: () => teacherClient.getAssignments().catch(() => ({ assignments: [], count: 0 })),
  });

  const { data: classesData } = useQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: () => teacherClient.getClasses().catch(() => ({ classes: [] })),
  });

  const apiAssignments: Assignment[] = (apiData?.assignments || []).map((a: any) => ({
    id: a.id || a.assignment_id,
    title: a.title || 'Assignment',
    subject: a.subject_name || 'General Academic',
    classBatch: a.class_name || 'Assigned Batch',
    dueDate: a.due_date ? new Date(a.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No Due Date',
    submittedCount: a.submission_count || 0,
    totalStudents: a.total_students || 0,
    status: 'published'
  }));

  const assignments = [...customAssignments, ...apiAssignments];

  const totalAssignments = assignments.length;
  const submittedCount = assignments.reduce((sum, a) => sum + a.submittedCount, 0);
  const pendingCount = assignments.filter(a => a.submittedCount === 0).length;
  const avgSubmission = assignments.length > 0 ? Math.round((submittedCount / (assignments.reduce((sum, a) => sum + (a.totalStudents || 1), 0))) * 100) : 0;

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) {
      toast.error('Assignment title is required');
      return;
    }
    const created: Assignment = {
      id: `asgn-${Date.now()}`,
      title: newTitle,
      subject: newSubject,
      classBatch: newClass,
      dueDate: newDueDate || '25 Aug 2026',
      submittedCount: 0,
      totalStudents: 28,
      status: 'published',
    };
    setCustomAssignments([created, ...customAssignments]);
    setCreateModalOpen(false);
    setNewTitle('');
    toast.success(`Assignment "${created.title}" created successfully!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-navy-900 p-6 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" /> Coursework & Evaluations
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white font-display">5. Assignments</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Create, publish, collect, and grade student coursework submissions.
          </p>
        </div>

        <Button 
          onClick={() => setCreateModalOpen(true)}
          className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Assignment
        </Button>
      </div>

      {/* Top 4 Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Total Assignments</span>
          <p className="text-2xl font-black text-navy-900 dark:text-white">{totalAssignments}</p>
          <p className="text-[11px] text-gray-400">Created this term</p>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Submitted</span>
          <p className="text-2xl font-black text-emerald-600">{submittedCount}</p>
          <p className="text-[11px] text-emerald-600 font-semibold">Evaluated coursework</p>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Pending Evaluation</span>
          <p className="text-2xl font-black text-amber-500">{pendingCount}</p>
          <p className="text-[11px] text-amber-500 font-semibold">Awaiting grading</p>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Avg. Submission</span>
          <p className="text-2xl font-black text-brand-orange">{avgSubmission}%</p>
          <p className="text-[11px] text-brand-orange font-semibold">Student turn-in rate</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search assignments by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-xs text-gray-700 dark:text-gray-300"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Assignments Table (Matching Reference Image 5) */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-navy-950 text-gray-400 uppercase font-bold border-b border-gray-100 dark:border-navy-800">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Class / Batch</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Submissions</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-navy-800 text-gray-700 dark:text-gray-300 font-medium">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400 font-bold">
                    No assignments created yet. Click "Create Assignment" to publish your first coursework.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((asgn) => (
                  <tr key={asgn.id} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/50 transition">
                  <td className="p-4 font-bold text-navy-900 dark:text-white">{asgn.title}</td>
                  <td className="p-4 text-brand-orange font-bold">{asgn.subject}</td>
                  <td className="p-4">{asgn.classBatch}</td>
                  <td className="p-4">{asgn.dueDate}</td>
                  <td className="p-4 font-bold text-emerald-600">
                    {asgn.submittedCount} / {asgn.totalStudents}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button onClick={() => toast.info(`Viewing submissions for ${asgn.title}`)} variant="outline" className="text-[11px] py-1 px-2.5">
                        <Eye className="w-3.5 h-3.5 mr-1" /> View Submissions
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create Assignment */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-gray-200 dark:border-navy-800 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-orange" /> Create Assignment
            </h3>
            <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Assignment 5 - Inverter Circuits"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Subject</label>
                <select 
                  value={newSubject} 
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl"
                >
                  <option value="Power Electronics">Power Electronics</option>
                  <option value="Power System">Power System</option>
                  <option value="Control System">Control System</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Class / Batch</label>
                <select 
                  value={newClass} 
                  onChange={(e) => setNewClass(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl"
                >
                  <option value="All Batches">All Batches</option>
                  {(classesData?.classes || []).map((cls: any) => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Due Date</label>
                <input
                  type="text"
                  placeholder="e.g. 28 Aug 2026"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-brand-orange hover:bg-orange-600 text-white font-bold">
                  Publish Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
