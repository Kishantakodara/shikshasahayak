// ============================================================
// SHIKSHA SAHAYAK OS: ACADEMIC SUBJECTS HUB
// Master Catalog of Academic Subjects across Universities
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Sparkles,
  Layers,
  FileText,
  BookOpen,
  ArrowRight,
  X,
  ExternalLink,
  ChevronRight,
  Search,
  Book,
  Building2,
  Calendar,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AdminContentShell, KPICardItem, FilterOption } from './AdminContentShell';
import { academicManagementClient } from '../../../api/academicManagementClient';
import { toast } from 'sonner';

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  university?: string;
  universityId?: string;
  branch: string;
  branchId?: string;
  semester: number;
  credits: number;
  coveragePercent: number;
  status: 'Active' | 'Draft' | 'Inactive';
  materialsCount?: number;
  pyqsCount?: number;
  unitsCount?: number;
  syllabusLink?: string;
  updatedAt?: string;
}

interface AdminAcademicSubjectsHubProps {
  onNavigateToTab?: (tab: string, param?: any) => void;
}

export const AdminAcademicSubjectsHub: React.FC<AdminAcademicSubjectsHubProps> = ({
  onNavigateToTab,
}) => {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [selectedSubjectDrawer, setSelectedSubjectDrawer] = useState<SubjectItem | null>(null);
  const [drawerDetail, setDrawerDetail] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formState, setFormState] = useState({
    name: '',
    code: '',
    universityId: 'gtu',
    branchId: '',
    semester: '1',
    credits: '4',
    syllabusLink: '',
    status: 'Active',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subjectsData, branchesData, univsData] = await Promise.all([
        academicManagementClient.getSubjects(),
        academicManagementClient.getBranches(),
        academicManagementClient.getUniversities(),
      ]);

      if (Array.isArray(branchesData)) setBranches(branchesData);
      if (Array.isArray(univsData)) setUniversities(univsData);

      if (Array.isArray(subjectsData)) {
        const mapped: SubjectItem[] = subjectsData.map((s: any) => ({
          id: s.id,
          name: s.name,
          code: s.code || '',
          university: s.universityShort || s.universityName || 'GTU',
          universityId: s.universityId || 'gtu',
          branch: s.branchShort || s.branchName || 'Engineering',
          branchId: s.branchId,
          semester: Number(s.semester || 1),
          credits: Number(s.credits || (Number(s.semester) <= 2 ? 3 : 4)),
          coveragePercent: Number(s.contentCoverage || 0),
          status: s.isActive ? 'Active' : s.status === 'Draft' ? 'Draft' : 'Inactive',
          materialsCount: Number(s.materialsCount || 0),
          pyqsCount: Number(s.pyqsCount || 0),
          unitsCount: Number(s.unitsCount || 0),
          syllabusLink: s.syllabusLink || '',
          updatedAt: s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : 'Recent',
        }));
        setSubjects(mapped);
      } else {
        setSubjects([]);
      }
    } catch (e) {
      console.error('Error fetching academic subjects:', e);
      toast.error('Failed to load academic subjects catalog');
      setSubjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBranch = !selectedBranch || s.branch === selectedBranch || s.branchId === selectedBranch;
      const matchesSemester = !selectedSemester || s.semester.toString() === selectedSemester;
      const matchesStatus = !selectedStatus || s.status === selectedStatus;
      const matchesUniv = !selectedUniversity || s.university === selectedUniversity || s.universityId === selectedUniversity;

      return matchesSearch && matchesBranch && matchesSemester && matchesStatus && matchesUniv;
    });
  }, [subjects, searchQuery, selectedUniversity, selectedBranch, selectedSemester, selectedStatus]);

  // KPIs
  const totalSubjects = subjects.length;
  const activeSubjects = subjects.filter((s) => s.status === 'Active').length;
  const draftSubjects = subjects.filter((s) => s.status === 'Draft').length;
  const withoutContent = subjects.filter(
    (s) => (s.materialsCount || 0) === 0 && (s.pyqsCount || 0) === 0
  ).length;

  const kpis: KPICardItem[] = [
    {
      label: 'TOTAL SUBJECTS',
      value: totalSubjects,
      icon: FileSpreadsheet,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      subtext: `${subjects.length} active master offerings`,
    },
    {
      label: 'ACTIVE CATALOG',
      value: activeSubjects,
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      subtext: `${Math.round((activeSubjects / (totalSubjects || 1)) * 100)}% live for students`,
    },
    {
      label: 'DRAFT MODE',
      value: draftSubjects,
      icon: Edit,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      subtext: 'Pending curriculum completion',
    },
    {
      label: 'WITHOUT CONTENT',
      value: withoutContent,
      icon: Sparkles,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      subtext: 'Opportunity for Content Factory',
    },
  ];

  // Filters setup
  const branchOptions = useMemo(() => {
    const unique = Array.from(new Set(subjects.map((s) => s.branch))).filter(Boolean);
    return unique.map((b) => ({ label: b, value: b }));
  }, [subjects]);

  const filterOptions: FilterOption[] = [
    {
      key: 'university',
      label: 'University',
      value: selectedUniversity,
      options: [
        { label: 'GTU', value: 'GTU' },
        { label: 'All Universities', value: '' },
      ],
      onChange: setSelectedUniversity,
    },
    {
      key: 'branch',
      label: 'Branch',
      value: selectedBranch,
      options: branchOptions,
      onChange: setSelectedBranch,
    },
    {
      key: 'semester',
      label: 'Semester',
      value: selectedSemester,
      options: [1, 2, 3, 4, 5, 6, 7, 8].map((sem) => ({
        label: `Sem ${sem}`,
        value: sem.toString(),
      })),
      onChange: setSelectedSemester,
    },
    {
      key: 'status',
      label: 'Status',
      value: selectedStatus,
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Draft', value: 'Draft' },
        { label: 'Inactive', value: 'Inactive' },
      ],
      onChange: setSelectedStatus,
    },
  ];

  // Open Subject Details Drawer
  const handleOpenDrawer = async (subject: SubjectItem) => {
    setSelectedSubjectDrawer(subject);
    try {
      const details = await academicManagementClient.getSubject(subject.id);
      setDrawerDetail(details);
    } catch (e) {
      console.error('Error fetching subject detail:', e);
      setDrawerDetail(null);
    }
  };

  // Open Add/Edit Modal
  const handleOpenAddModal = (subjectToEdit?: SubjectItem) => {
    if (subjectToEdit) {
      setEditingSubject(subjectToEdit);
      setFormState({
        name: subjectToEdit.name,
        code: subjectToEdit.code,
        universityId: subjectToEdit.universityId || 'gtu',
        branchId: subjectToEdit.branchId || (branches[0]?.id || ''),
        semester: subjectToEdit.semester.toString(),
        credits: subjectToEdit.credits.toString(),
        syllabusLink: subjectToEdit.syllabusLink || '',
        status: subjectToEdit.status,
      });
    } else {
      setEditingSubject(null);
      setFormState({
        name: '',
        code: '',
        universityId: 'gtu',
        branchId: branches[0]?.id || '',
        semester: '1',
        credits: '4',
        syllabusLink: '',
        status: 'Active',
      });
    }
    setIsAddModalOpen(true);
  };

  // Save Subject (Create or Edit)
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.code.trim() || !formState.branchId) {
      toast.error('Subject Name, Code, and Branch are required');
      return;
    }

    // Duplicate code validation in same branch and semester
    const isDuplicate = subjects.some(
      (s) =>
        s.id !== editingSubject?.id &&
        s.code.toLowerCase().trim() === formState.code.toLowerCase().trim() &&
        s.branchId === formState.branchId &&
        s.semester.toString() === formState.semester
    );

    if (isDuplicate) {
      toast.error(`Subject code "${formState.code}" already exists for this branch and semester`);
      return;
    }

    setIsSubmitting(true);
    try {
      await academicManagementClient.saveSubject({
        id: editingSubject?.id,
        name: formState.name.trim(),
        code: formState.code.trim(),
        branchId: formState.branchId,
        semester: Number(formState.semester),
        syllabusLink: formState.syllabusLink.trim() || undefined,
        isActive: formState.status === 'Active',
        status: formState.status as 'Active' | 'Draft' | 'Inactive',
      });

      toast.success(
        editingSubject
          ? `Subject "${formState.name}" updated successfully`
          : `Subject "${formState.name}" created successfully`
      );
      setIsAddModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Subject Status
  const handleToggleStatus = async (subject: SubjectItem) => {
    const nextStatus = subject.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await academicManagementClient.saveSubject({
        id: subject.id,
        name: subject.name,
        isActive: nextStatus === 'Active',
        status: nextStatus,
      });
      toast.success(`Subject "${subject.name}" is now ${nextStatus}`);
      setSubjects((prev) =>
        prev.map((s) => (s.id === subject.id ? { ...s, status: nextStatus } : s))
      );
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  return (
    <AdminContentShell
      title="Academic Subjects"
      description="Manage the master subject catalog used across ShikshaSahayak. Subjects created here immediately populate Curriculum CMS, Content Factory, and Student Portals."
      breadcrumb={['ShikshaSahayak Admin', 'Content Management', 'Academic Subjects']}
      primaryAction={{
        label: 'Add Subject',
        icon: Plus,
        onClick: () => handleOpenAddModal(),
      }}
      secondaryAction={{
        label: 'Export Catalog',
        icon: Download,
        onClick: () => {
          const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(subjects, null, 2)
          )}`;
          const downloadAnchor = document.createElement('a');
          downloadAnchor.setAttribute('href', jsonString);
          downloadAnchor.setAttribute('download', `shikshasahayak_subjects_catalog_${Date.now()}.json`);
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();
          toast.success('Catalog exported successfully');
        },
      }}
      kpis={kpis}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search by subject name or code (e.g., Computer Networks, 3150710)..."
      filters={filterOptions}
      onRefresh={loadData}
      isLoading={isLoading}
    >
      {/* 1. Subjects Data Table */}
      <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-mono">Code</th>
                <th className="py-3.5 px-4">Subject Name</th>
                <th className="py-3.5 px-4">University</th>
                <th className="py-3.5 px-4">Branch</th>
                <th className="py-3.5 px-4">Sem</th>
                <th className="py-3.5 px-4">Credits</th>
                <th className="py-3.5 px-4">Content Coverage</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Updated</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition group">
                    {/* Code */}
                    <td className="py-3 px-4 font-mono font-bold text-orange-400">
                      {s.code || 'N/A'}
                    </td>

                    {/* Subject Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white group-hover:text-orange-400 transition">
                          {s.name}
                        </span>
                        {s.syllabusLink && (
                          <a
                            href={s.syllabusLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-orange-400 transition"
                            title="Open Official Syllabus"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* University */}
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {s.university}
                    </td>

                    {/* Branch */}
                    <td className="py-3 px-4 text-slate-300">{s.branch}</td>

                    {/* Semester */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      Sem {s.semester}
                    </td>

                    {/* Credits */}
                    <td className="py-3 px-4 font-mono text-slate-400">{s.credits}</td>

                    {/* Content Coverage */}
                    <td className="py-3 px-4 min-w-[130px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              s.coveragePercent >= 80
                                ? 'bg-emerald-500'
                                : s.coveragePercent >= 40
                                ? 'bg-amber-500'
                                : 'bg-purple-500'
                            }`}
                            style={{ width: `${s.coveragePercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {s.coveragePercent}%
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          s.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : s.status === 'Draft'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-slate-700/30 text-slate-400 border-slate-700'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>

                    {/* Updated */}
                    <td className="py-3 px-4 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                      {s.updatedAt}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDrawer(s)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="View Subject Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenAddModal(s)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Edit Subject"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(s)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-orange-400 transition cursor-pointer"
                          title={s.status === 'Active' ? 'Deactivate Subject' : 'Activate Subject'}
                        >
                          {s.status === 'Active' ? (
                            <ToggleRight className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </button>

                        {onNavigateToTab && (
                          <button
                            onClick={() => onNavigateToTab('cms', { subjectId: s.id, subjectName: s.name })}
                            className="px-2 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/20 transition cursor-pointer flex items-center gap-1"
                            title="Open in Curriculum CMS"
                          >
                            <span>Curriculum</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <Book className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-400">No academic subjects found</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {searchQuery || selectedBranch || selectedSemester
                        ? 'Try clearing active filters or search parameters'
                        : 'Click "+ Add Subject" above to create your first master catalog offering.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Educational & Architecture Cards (Visual Mockup Direction) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-orange-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>WHAT IT DOES</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Maintains the canonical single source of truth for all subject offerings across university
            branches and semesters.
          </p>
        </div>

        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
            <Zap className="w-4 h-4" />
            <span>HOW IT WORKS</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Units and topics attach to subjects in Curriculum CMS. Content Factory then generates notes
            mapped directly to these topics.
          </p>
        </div>

        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>IMPACT</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Modifying a subject immediately updates student navigation, PYQ filters, and study material
            indexing across all portals.
          </p>
        </div>
      </div>

      {/* 3. Add / Edit Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {editingSubject ? 'Edit Subject Offering' : 'Add New Academic Subject'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Master catalog definition in ShikshaSahayak database
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveSubject} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* University */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    University
                  </label>
                  <select
                    value={formState.universityId}
                    onChange={(e) => setFormState({ ...formState, universityId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="gtu">Gujarat Technological University (GTU)</option>
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.shortName || 'UNIV'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Branch *
                  </label>
                  <select
                    value={formState.branchId}
                    onChange={(e) => setFormState({ ...formState, branchId: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Select Branch...</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.shortName || b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Semester */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Semester *
                  </label>
                  <select
                    value={formState.semester}
                    onChange={(e) => setFormState({ ...formState, semester: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Code */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3150710"
                    value={formState.code}
                    onChange={(e) => setFormState({ ...formState, code: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Credits */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formState.credits}
                    onChange={(e) => setFormState({ ...formState, credits: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Subject Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Subject Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Networks & Security"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Syllabus Link */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Official Syllabus Link / URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formState.syllabusLink}
                  onChange={(e) => setFormState({ ...formState, syllabusLink: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Status
                </label>
                <div className="flex gap-4 mt-1">
                  {['Active', 'Draft', 'Inactive'].map((st) => (
                    <label key={st} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="subjectStatus"
                        value={st}
                        checked={formState.status === st}
                        onChange={() => setFormState({ ...formState, status: st })}
                        className="text-orange-500 focus:ring-0"
                      />
                      <span>{st}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-orange-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingSubject ? 'Update Subject' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Subject Detail Drawer */}
      {selectedSubjectDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-[#0F172A] border-l border-slate-800 w-full max-w-md h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div>
              <div className="p-5 border-b border-slate-800 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-wider">
                    {selectedSubjectDrawer.code} • Sem {selectedSubjectDrawer.semester}
                  </span>
                  <h3 className="text-lg font-extrabold text-white mt-0.5">
                    {selectedSubjectDrawer.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedSubjectDrawer.branch} • {selectedSubjectDrawer.university}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSubjectDrawer(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-160px)]">
                {/* Stats Matrix */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Units</p>
                    <p className="text-lg font-extrabold text-white mt-0.5 font-mono">
                      {drawerDetail?.units?.length || selectedSubjectDrawer.unitsCount || 0}
                    </p>
                  </div>
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Materials</p>
                    <p className="text-lg font-extrabold text-white mt-0.5 font-mono">
                      {selectedSubjectDrawer.materialsCount || 0}
                    </p>
                  </div>
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">PYQs</p>
                    <p className="text-lg font-extrabold text-white mt-0.5 font-mono">
                      {selectedSubjectDrawer.pyqsCount || 0}
                    </p>
                  </div>
                </div>

                {/* Units List Preview */}
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                    Curriculum Units Breakdown
                  </h4>
                  {drawerDetail?.units && drawerDetail.units.length > 0 ? (
                    <div className="space-y-2">
                      {drawerDetail.units.map((u: any) => (
                        <div
                          key={u.id}
                          className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-xs text-white">
                              Unit {u.unit_no}: {u.title}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {u.description || 'Curriculum unit topics'}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-orange-400 font-bold">
                            Unit #{u.unit_no}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                      <Layers className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                      <p className="text-xs">No curriculum units defined yet</p>
                    </div>
                  )}
                </div>

                {/* Action Bridges */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                    Downstream Actions
                  </h4>

                  {onNavigateToTab && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedSubjectDrawer(null);
                          onNavigateToTab('cms', { subjectId: selectedSubjectDrawer.id });
                        }}
                        className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-orange-400" />
                          <span>Open Curriculum CMS</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedSubjectDrawer(null);
                          onNavigateToTab('content-factory', { subjectId: selectedSubjectDrawer.id });
                        }}
                        className="w-full py-2.5 px-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold rounded-xl border border-purple-500/20 transition flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          <span>Generate with Content Factory</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedSubjectDrawer(null);
                          onNavigateToTab('study-material', { subjectId: selectedSubjectDrawer.id });
                        }}
                        className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                          <span>View Study Materials</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedSubjectDrawer(null);
                          onNavigateToTab('pyqs', { subjectId: selectedSubjectDrawer.id });
                        }}
                        className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-emerald-400" />
                          <span>View Past Papers (PYQs)</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                ID: {selectedSubjectDrawer.id}
              </span>
              <button
                onClick={() => {
                  setSelectedSubjectDrawer(null);
                  handleOpenAddModal(selectedSubjectDrawer);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
              >
                Edit Subject Details
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminContentShell>
  );
};
