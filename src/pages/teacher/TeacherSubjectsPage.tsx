import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BookOpen, 
  Users, 
  LayoutGrid, 
  TrendingUp, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  FileText, 
  MoreVertical,
  Calendar,
  Layers,
  Edit,
  Eye,
  Trash2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

interface Subject {
  id: string;
  name: string;
  code: string;
  branch: string;
  semester: string;
  units: number;
  studentsCount: number;
  classesCount: number;
  completionRate: number;
  nextClass: string;
  color: string;
  status: 'active' | 'archived';
}

export default function TeacherSubjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [modalOpen, setModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', code: '', branch: 'Electrical Engg.', semester: 'Sem 4', units: 4 });

  const [customSubjects, setCustomSubjects] = useState<Subject[]>([]);

  const { data: apiData } = useQuery({
    queryKey: ['teacher', 'subjects'],
    queryFn: () => teacherClient.getSubjects().catch(() => null),
  });

  const apiSubjects: Subject[] = (apiData?.subjects || []).map((s: any) => ({
    id: s.subject_id || s.assignment_id || s.id,
    name: s.subject_name || s.name || 'Subject',
    code: s.subject_code || s.code || 'SUB001',
    branch: s.branch_name || s.branch_id || 'Engineering',
    semester: `Sem ${s.semester || 1}`,
    units: 4,
    studentsCount: s.student_count || 0,
    classesCount: 1,
    completionRate: 100,
    nextClass: 'Scheduled',
    color: 'border-l-brand-orange text-brand-orange bg-orange-50/50 dark:bg-navy-900',
    status: 'active',
  }));

  const subjects = [...customSubjects, ...apiSubjects];

  // Compute stats
  const activeSubjects = subjects.filter(s => s.status === 'active');
  const totalStudents = subjects.reduce((sum, s) => sum + s.studentsCount, 0);
  const totalClasses = subjects.reduce((sum, s) => sum + s.classesCount, 0);
  const avgCompletion = subjects.length > 0 ? Math.round(subjects.reduce((sum, s) => sum + s.completionRate, 0) / subjects.length) : 0;

  const filteredSubjects = subjects.filter(s => {
    const matchesTab = s.status === activeTab;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSem = semesterFilter === 'all' || s.semester.toLowerCase().includes(semesterFilter.toLowerCase());
    const matchesBranch = branchFilter === 'all' || s.branch.toLowerCase().includes(branchFilter.toLowerCase());
    return matchesTab && matchesSearch && matchesSem && matchesBranch;
  });

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name || !newSubject.code) {
      toast.error('Please fill in subject name and code');
      return;
    }
    const created: Subject = {
      id: `subj-${Date.now()}`,
      name: newSubject.name,
      code: newSubject.code,
      branch: newSubject.branch,
      semester: newSubject.semester,
      units: Number(newSubject.units) || 4,
      studentsCount: 30,
      classesCount: 2,
      completionRate: 0,
      nextClass: 'Schedule pending',
      color: 'border-l-brand-orange text-brand-orange bg-orange-50/50 dark:bg-navy-900',
      status: 'active',
    };
    setCustomSubjects([created, ...customSubjects]);
    setModalOpen(false);
    setNewSubject({ name: '', code: '', branch: 'Electrical Engg.', semester: 'Sem 4', units: 4 });
    toast.success(`Subject "${created.name}" created successfully!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-navy-900 p-6 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" /> Academic Offerings
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white font-display">1. My Subjects</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage the subjects you teach and track course completion progress across semesters.
          </p>
        </div>

        <Button 
          onClick={() => setModalOpen(true)}
          className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Subject
        </Button>
      </div>

      {/* Top 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Active Subjects</span>
            <div className="p-2 rounded-xl bg-orange-50 dark:bg-navy-800 text-brand-orange">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy-900 dark:text-white">{activeSubjects.length}</p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> All active this term
          </p>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Total Students</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-navy-800 text-blue-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy-900 dark:text-white">{totalStudents}</p>
          <p className="text-[11px] text-gray-400">Enrolled across batches</p>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Total Classes</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-navy-800 text-purple-500">
              <LayoutGrid className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy-900 dark:text-white">{totalClasses}</p>
          <p className="text-[11px] text-gray-400">Weekly class sessions</p>
        </div>

        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Average Completion</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-navy-800 text-emerald-500">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy-900 dark:text-white">{avgCompletion}%</p>
          <p className="text-[11px] text-emerald-600 font-semibold">Course syllabus progress</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Active/Archived Tabs */}
        <div className="flex items-center bg-gray-100 dark:bg-navy-950 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'active' 
                ? 'bg-white dark:bg-navy-800 text-brand-orange shadow-xs' 
                : 'text-gray-500 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            Active ({subjects.filter(s => s.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'archived' 
                ? 'bg-white dark:bg-navy-800 text-brand-orange shadow-xs' 
                : 'text-gray-500 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            Archived ({subjects.filter(s => s.status === 'archived').length})
          </button>
        </div>

        {/* Search & Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search subject or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
            />
          </div>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-xs text-gray-700 dark:text-gray-300 focus:outline-none"
          >
            <option value="all">All Semesters</option>
            <option value="Sem 4">Sem 4</option>
            <option value="Sem 6">Sem 6</option>
          </select>
        </div>
      </div>

      {/* Subjects Cards Grid (Matching Reference Image) */}
      {filteredSubjects.length === 0 ? (
        <div className="bg-white dark:bg-navy-900 border border-gray-200/80 dark:border-navy-800 rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-navy-900 dark:text-white">No Subjects Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            No subjects match your current filter criteria. Try resetting search filters or add a new subject.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map((subject) => (
            <div 
              key={subject.id}
              className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200/80 dark:border-navy-800 p-5 shadow-xs hover:shadow-md transition-all space-y-4 border-l-4 border-l-brand-orange relative group"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-navy-900 dark:text-white group-hover:text-brand-orange transition-colors">
                    {subject.name}
                  </h3>
                  <p className="text-xs font-semibold text-gray-400 mt-0.5">
                    {subject.code} &bull; {subject.branch} &bull; <span className="text-brand-orange font-bold">{subject.semester}</span>
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-orange-50 dark:bg-navy-800 text-brand-orange text-[10px] font-bold border border-orange-200/60 dark:border-navy-700">
                  {subject.units} Units
                </span>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-2 py-2 border-y border-gray-100 dark:border-navy-800 text-xs">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300 font-semibold">{subject.studentsCount} Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-300 font-semibold">{subject.nextClass}</span>
                </div>
              </div>

              {/* Course Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-500">Completion</span>
                  <span className="text-navy-900 dark:text-white">{subject.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-navy-950 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-brand-orange h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${subject.completionRate}%` }}
                  />
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="flex items-center gap-2 pt-2">
                <Button 
                  onClick={() => toast.info(`Viewing ${subject.name} materials`)}
                  variant="outline" 
                  className="flex-1 text-xs py-1.5 border-gray-200 dark:border-navy-700 text-gray-700 dark:text-gray-300 hover:text-brand-orange hover:border-brand-orange"
                >
                  <FileText className="w-3.5 h-3.5 mr-1" /> Materials
                </Button>
                <Button 
                  onClick={() => toast.info(`Viewing ${subject.name} attendance`)}
                  variant="outline" 
                  className="flex-1 text-xs py-1.5 border-gray-200 dark:border-navy-700 text-gray-700 dark:text-gray-300 hover:text-brand-orange hover:border-brand-orange"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Attendance
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Subject Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-gray-200 dark:border-navy-800 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-orange" /> Add New Subject
            </h3>
            <form onSubmit={handleAddSubject} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Signal Processing"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl focus:border-brand-orange"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Subject Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EE405"
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Semester</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sem 4 - A"
                    value={newSubject.semester}
                    onChange={(e) => setNewSubject({ ...newSubject, semester: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl focus:border-brand-orange"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-brand-orange hover:bg-orange-600 text-white font-bold">
                  Create Subject
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
