import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Grid, 
  List, 
  Search, 
  LayoutGrid, 
  Users, 
  BookOpen, 
  Clock, 
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import { ClassCard } from '../../components/teacher/ClassCard';
import { CreateClassModal } from '../../components/teacher/CreateClassModal';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import type { Class } from '../../types/teacher';

export default function ClassList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: () => teacherClient.getClasses(),
  });

  const apiClasses = data?.classes || [];
  const displayClasses = apiClasses;

  const totalClasses = apiClasses.length;
  const activeBatches = apiClasses.length;
  const totalStudents = apiClasses.reduce((sum: number, c: any) => sum + (c.student_count || 0), 0);
  const activeToday = apiClasses.length;

  const filteredClasses = displayClasses.filter((c: any) =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.subject_name || c.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.join_code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Join Code "${code}" copied! Share this with your students.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-navy-900 p-6 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
            <LayoutGrid className="w-4 h-4" /> Batch Roster
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white font-display">2. My Classes</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage your class batches, weekly schedules, student enrollments, and share join codes.
          </p>
        </div>

        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Class
        </Button>
      </div>

      {/* Top 4 Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Total Classes</span>
          <p className="text-2xl font-black text-navy-900 dark:text-white">{totalClasses}</p>
        </div>
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Total Batches</span>
          <p className="text-2xl font-black text-blue-500">{activeBatches}</p>
        </div>
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Total Students</span>
          <p className="text-2xl font-black text-emerald-600">{totalStudents}</p>
        </div>
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Active Classes</span>
          <p className="text-2xl font-black text-brand-orange">{activeToday}</p>
        </div>
      </div>

      {/* Search & Toggle View Bar */}
      <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search classes by name, subject, or join code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-navy-950 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs cursor-pointer ${viewMode === 'table' ? 'bg-white dark:bg-navy-800 text-brand-orange shadow-xs font-bold' : 'text-gray-400'}`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-navy-800 text-brand-orange shadow-xs font-bold' : 'text-gray-400'}`}
            title="Grid View"
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-navy-950 text-gray-400 uppercase font-bold border-b border-gray-100 dark:border-navy-800">
                <tr>
                  <th className="p-4">Class / Batch</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Semester</th>
                  <th className="p-4">Join Code (For Students)</th>
                  <th className="p-4">Students</th>
                  <th className="p-4">Academic Year</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-navy-800 text-gray-700 dark:text-gray-300 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading classes...
                    </td>
                  </tr>
                ) : filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400 font-bold space-y-2">
                      <p>No classes found. Click "Create Class" to set up your first classroom batch.</p>
                      <Button
                        onClick={() => setShowCreateModal(true)}
                        size="sm"
                        className="bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold mx-auto"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Create Class Now
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredClasses.map((cls: any) => (
                    <tr 
                      key={cls.id} 
                      onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                      className="hover:bg-orange-50/40 dark:hover:bg-navy-800/60 transition cursor-pointer group"
                    >
                      <td className="p-4">
                        <div className="font-bold text-navy-900 dark:text-white group-hover:text-brand-orange transition-colors">
                          {cls.name}
                        </div>
                        {cls.section && (
                          <div className="text-[10px] text-gray-400">Section {cls.section}</div>
                        )}
                      </td>
                      <td className="p-4 text-brand-orange font-bold">
                        {cls.subject_name || cls.subject || 'General Academic'}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="font-semibold text-[11px]">
                          Sem {cls.semester || 1}
                        </Badge>
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-brand-orange bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-900/50 select-all">
                            {cls.join_code}
                          </span>
                          <button
                            onClick={(e) => handleCopyCode(e, cls.join_code)}
                            className="p-1 rounded-md text-gray-400 hover:text-brand-orange hover:bg-gray-100 dark:hover:bg-navy-800 transition"
                            title="Copy student join code"
                          >
                            {copiedCode === cls.join_code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-4 font-bold">
                        <span className="text-navy-900 dark:text-white">{cls.student_count || 0}</span>
                        <span className="text-gray-400 font-normal"> / {cls.max_students || 50}</span>
                      </td>
                      <td className="p-4">{cls.academic_year || '2026-27'}</td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          onClick={() => navigate(`/teacher/classes/${cls.id}`)} 
                          variant="outline" 
                          className="text-xs py-1.5 px-3 border-orange-200 text-brand-orange hover:bg-brand-orange hover:text-white font-bold gap-1 cursor-pointer transition shadow-xs"
                        >
                          <span>View Class</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View using Rich ClassCard */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-navy-900 border border-gray-200/80 dark:border-navy-800 rounded-2xl p-12 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="text-base font-bold text-navy-900 dark:text-white">No Classes Found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No classes match your current search criteria. Click below to create a new class.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold"
              >
                <Plus className="w-4 h-4 mr-1" /> Create Class
              </Button>
            </div>
          ) : (
            filteredClasses.map((cls: any) => (
              <ClassCard
                key={cls.id}
                classData={cls}
                onCopyJoinCode={(code) => {
                  navigator.clipboard.writeText(code);
                  toast.success(`Join Code "${code}" copied to clipboard!`);
                }}
              />
            ))
          )}
        </div>
      )}

      <CreateClassModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onOpenChange={setShowCreateModal} />

    </div>
  );
}

