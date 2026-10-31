import { fetchWithAuth } from '../../../api/client';
// ============================================================
// SHIKSHA SAHAYAK OS: STUDY MATERIALS HUB
// Resource Library for Notes, Books, Assignments, Practicals
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Upload,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Filter,
  X,
  ExternalLink,
  ShieldCheck,
  Archive,
  Layers,
  AlertCircle,
  Building2,
  Calendar,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AdminContentShell, KPICardItem, FilterOption } from './AdminContentShell';
import { apiClient } from '../../../api/client';
import { academicManagementClient } from '../../../api/academicManagementClient';
import { toast } from 'sonner';

interface MaterialRow {
  id: string;
  title: string;
  description?: string;
  university: string;
  branch: string;
  branchId?: string;
  semester: number;
  subjectName: string;
  subjectCode: string;
  subjectId?: string;
  unit: string;
  unitNo?: number;
  topic?: string;
  materialType: string;
  author: string;
  status: 'Published' | 'Pending' | 'Draft' | 'Archived';
  views: number;
  downloads: number;
  updatedAt: string;
  fileUrl?: string;
  storageKey?: string;
}

export const AdminStudyMaterialsHub: React.FC = () => {
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Drawers & Modals
  const [previewMaterial, setPreviewMaterial] = useState<MaterialRow | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Upload / Edit
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    materialType: 'Notes',
    universityId: 'gtu',
    branchId: '',
    semester: '1',
    subjectId: '',
    unitNo: '1',
    topic: '',
    fileUrl: '',
    status: 'Published',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [matData, subData, brData] = await Promise.all([
        apiClient.getAdminMaterials('study-material'),
        academicManagementClient.getSubjects(),
        academicManagementClient.getBranches(),
      ]);

      if (Array.isArray(subData)) setSubjects(subData);
      if (Array.isArray(brData)) setBranches(brData);

      if (Array.isArray(matData)) {
        const mapped: MaterialRow[] = matData.map((m: any) => ({
          id: m.id || `mat_${Math.random()}`,
          title: m.title || 'Untitled Study Material',
          description: m.description || '',
          university: m.university || 'GTU',
          branch: m.branch_name || m.branch_short_names || m.branch_slug || 'Engineering',
          branchId: m.branch_id,
          semester: Number(m.semester_no || m.semester || 1),
          subjectName: m.subject_name || 'Academic Subject',
          subjectCode: m.subject_code || '',
          subjectId: m.subject_id,
          unit: m.unit_no ? `Unit ${m.unit_no}` : m.chapter ? `Ch ${m.chapter}` : 'General',
          unitNo: m.unit_no ? Number(m.unit_no) : undefined,
          topic: m.topic || 'Core Curriculum',
          materialType: m.material_kind || m.material_type || 'Notes',
          author: m.author || m.uploaded_by || 'ShikshaSahayak Faculty',
          status:
            m.approval_status === 'approved' || m.status === 'published'
              ? 'Published'
              : m.approval_status === 'pending' || m.status === 'review'
              ? 'Pending'
              : m.approval_status === 'archived'
              ? 'Archived'
              : 'Draft',
          views: Number(m.views_count || m.views || 0),
          downloads: Number(m.downloads_count || m.downloads || 0),
          updatedAt: m.updated_at ? new Date(m.updated_at).toLocaleDateString() : 'Recent',
          fileUrl: m.file_url || m.download_url || m.url,
          storageKey: m.storage_key,
        }));
        setMaterials(mapped);
      } else {
        setMaterials([]);
      }
    } catch (e) {
      console.error('Error loading study materials:', e);
      toast.error('Failed to load study materials');
      setMaterials([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchSearch =
        !searchQuery ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.topic && m.topic.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchUniv = !selectedUniversity || m.university === selectedUniversity;
      const matchBranch = !selectedBranch || m.branch === selectedBranch || m.branchId === selectedBranch;
      const matchSemester = !selectedSemester || m.semester.toString() === selectedSemester;
      const matchSubject = !selectedSubject || m.subjectId === selectedSubject || m.subjectName === selectedSubject;
      const matchType = !selectedType || m.materialType.toLowerCase() === selectedType.toLowerCase();
      const matchStatus = !selectedStatus || m.status === selectedStatus;

      return matchSearch && matchUniv && matchBranch && matchSemester && matchSubject && matchType && matchStatus;
    });
  }, [materials, searchQuery, selectedUniversity, selectedBranch, selectedSemester, selectedSubject, selectedType, selectedStatus]);

  // KPIs
  const totalCount = materials.length;
  const publishedCount = materials.filter((m) => m.status === 'Published').length;
  const pendingCount = materials.filter((m) => m.status === 'Pending').length;
  const draftCount = materials.filter((m) => m.status === 'Draft').length;
  const archivedCount = materials.filter((m) => m.status === 'Archived').length;

  const kpis: KPICardItem[] = [
    {
      label: 'TOTAL MATERIALS',
      value: totalCount,
      icon: BookOpen,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      subtext: 'Resource library offerings',
    },
    {
      label: 'PUBLISHED (LIVE)',
      value: publishedCount,
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      subtext: 'Visible to verified students',
    },
    {
      label: 'PENDING REVIEW',
      value: pendingCount,
      icon: Clock,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      subtext: 'Awaiting admin moderation',
    },
    {
      label: 'DRAFTS',
      value: draftCount,
      icon: Edit,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      subtext: 'Incomplete resource drafts',
    },
    {
      label: 'ARCHIVED',
      value: archivedCount,
      icon: Archive,
      color: 'text-slate-400 bg-slate-800 border-slate-700',
      subtext: 'Hidden from discovery',
    },
  ];

  // Filters
  const filterOptions: FilterOption[] = [
    {
      key: 'branch',
      label: 'Branch',
      value: selectedBranch,
      options: Array.from(new Set(materials.map((m) => m.branch)))
        .filter(Boolean)
        .map((b) => ({ label: b, value: b })),
      onChange: setSelectedBranch,
    },
    {
      key: 'semester',
      label: 'Semester',
      value: selectedSemester,
      options: [1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
        label: `Sem ${s}`,
        value: s.toString(),
      })),
      onChange: setSelectedSemester,
    },
    {
      key: 'materialType',
      label: 'Type',
      value: selectedType,
      options: [
        { label: 'Notes', value: 'notes' },
        { label: 'Books', value: 'book' },
        { label: 'Assignments', value: 'assignment' },
        { label: 'Practicals', value: 'practical' },
        { label: 'Question Banks', value: 'question-bank' },
      ],
      onChange: setSelectedType,
    },
    {
      key: 'status',
      label: 'Status',
      value: selectedStatus,
      options: [
        { label: 'Published', value: 'Published' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Draft', value: 'Draft' },
        { label: 'Archived', value: 'Archived' },
      ],
      onChange: setSelectedStatus,
    },
  ];

  // Open Upload / Edit Modal
  const handleOpenUploadModal = (materialToEdit?: MaterialRow) => {
    if (materialToEdit) {
      setEditingMaterial(materialToEdit);
      setFormState({
        title: materialToEdit.title,
        description: materialToEdit.description || '',
        materialType: materialToEdit.materialType,
        universityId: 'gtu',
        branchId: materialToEdit.branchId || (branches[0]?.id || ''),
        semester: materialToEdit.semester.toString(),
        subjectId: materialToEdit.subjectId || (subjects[0]?.id || ''),
        unitNo: materialToEdit.unitNo?.toString() || '1',
        topic: materialToEdit.topic || '',
        fileUrl: materialToEdit.fileUrl || '',
        status: materialToEdit.status,
      });
    } else {
      setEditingMaterial(null);
      setFormState({
        title: '',
        description: '',
        materialType: 'Notes',
        universityId: 'gtu',
        branchId: branches[0]?.id || '',
        semester: '1',
        subjectId: subjects[0]?.id || '',
        unitNo: '1',
        topic: '',
        fileUrl: '',
        status: 'Published',
      });
    }
    setIsUploadModalOpen(true);
  };

  // Save Material (Upload or Update Metadata)
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMaterial) {
        // Update Metadata
        const res = await fetchWithAuth(`/api/admin/materials/${editingMaterial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formState.title.trim(),
            description: formState.description.trim() || undefined,
            materialKind: formState.materialType,
            unitNo: Number(formState.unitNo),
            topic: formState.topic.trim(),
            status: formState.status === 'Published' ? 'approved' : formState.status.toLowerCase(),
          }),
        });

        if (!res.ok) throw new Error('Failed to update material metadata');
        toast.success('Study material updated successfully');
      } else {
        // Create new Material
        const res = await fetchWithAuth('/api/admin/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formState.title.trim(),
            description: formState.description.trim() || undefined,
            documentType: 'study-material',
            materialKind: formState.materialType,
            branchId: formState.branchId,
            semester: Number(formState.semester),
            subjectId: formState.subjectId,
            unitNo: Number(formState.unitNo),
            topic: formState.topic.trim() || undefined,
            fileUrl: formState.fileUrl.trim() || undefined,
            approvalStatus: formState.status === 'Published' ? 'approved' : 'pending',
          }),
        });

        if (!res.ok) throw new Error('Failed to create study material');
        toast.success('Study material uploaded successfully');
      }

      setIsUploadModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save material');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Action Handler (Approve / Publish / Archive)
  const handleUpdateStatus = async (materialId: string, newStatus: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/materials/${materialId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus === 'Published' ? 'approved' : newStatus.toLowerCase(),
        }),
      });

      if (!res.ok) throw new Error('Status update failed');
      toast.success(`Material is now ${newStatus}`);
      setMaterials((prev) =>
        prev.map((m) => (m.id === materialId ? { ...m, status: newStatus as any } : m))
      );
    } catch (err: any) {
      toast.error('Failed to change status');
    }
  };

  // Delete Material Handler
  const handleDeleteMaterial = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this study resource? This action is permanent.'))
      return;
    try {
      const res = await fetchWithAuth(`/api/admin/materials/${materialId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete material');
      toast.success('Study material deleted safely');
      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    } catch (err: any) {
      toast.error('Delete failed');
    }
  };

  return (
    <AdminContentShell
      title="Study Materials"
      description="Manage and curate the academic resources delivered to students: Notes, Books, Assignments, Practicals, and Question Banks. Changing metadata dynamically changes student discovery paths."
      breadcrumb={['ShikshaSahayak Admin', 'Content Management', 'Study Materials']}
      primaryAction={{
        label: 'Upload Material',
        icon: Plus,
        onClick: () => handleOpenUploadModal(),
      }}
      secondaryAction={{
        label: 'Export Index',
        icon: Download,
        onClick: () => {
          const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(materials, null, 2)
          )}`;
          const downloadAnchor = document.createElement('a');
          downloadAnchor.setAttribute('href', jsonString);
          downloadAnchor.setAttribute('download', `shikshasahayak_materials_${Date.now()}.json`);
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();
          toast.success('Material index exported');
        },
      }}
      kpis={kpis}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search notes by title, topic, subject code (e.g. Unit 2 OSI, 3150710)..."
      filters={filterOptions}
      onRefresh={loadData}
      isLoading={isLoading}
    >
      {/* 1. Materials Table */}
      <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Title & Topic</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Branch & Sem</th>
                <th className="py-3.5 px-4">Unit</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Engagement</th>
                <th className="py-3.5 px-4">Updated</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition group">
                    {/* Title & Topic */}
                    <td className="py-3 px-4 max-w-xs">
                      <div>
                        <p className="font-bold text-white group-hover:text-orange-400 transition truncate">
                          {m.title}
                        </p>
                        <p className="text-[10px] text-purple-400 font-mono truncate">{m.topic}</p>
                      </div>
                    </td>

                    {/* Material Type */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {m.materialType}
                      </span>
                    </td>

                    {/* Subject */}
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-200 truncate">{m.subjectName}</p>
                        <p className="text-[10px] font-mono text-orange-400">{m.subjectCode}</p>
                      </div>
                    </td>

                    {/* Branch & Semester */}
                    <td className="py-3 px-4">
                      <span className="text-slate-300">
                        {m.branch} • <strong className="font-mono text-white">Sem {m.semester}</strong>
                      </span>
                    </td>

                    {/* Unit */}
                    <td className="py-3 px-4 font-mono text-slate-300 font-bold">{m.unit}</td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          m.status === 'Published'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : m.status === 'Pending'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : m.status === 'Archived'
                            ? 'bg-slate-700/30 text-slate-400 border-slate-700'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>

                    {/* Engagement */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      <span>{m.views} views</span> • <span>{m.downloads} dl</span>
                    </td>

                    {/* Updated */}
                    <td className="py-3 px-4 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                      {m.updatedAt}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewMaterial(m)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Preview Resource"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenUploadModal(m)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Edit Metadata"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {m.status === 'Pending' && (
                          <button
                            onClick={() => handleUpdateStatus(m.id, 'Published')}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
                            title="Approve & Publish"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteMaterial(m.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition cursor-pointer"
                          title="Delete Material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-400">No study materials found</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Click "+ Upload Material" above to curate notes or import resources.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Educational & Architecture Footers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-orange-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>DISCOVERY METADATA</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Changing a resource's branch, semester, unit, or topic dynamically updates where students
            find it in the public study library.
          </p>
        </div>

        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>CONTENT PIPELINE</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            AI materials approved in Content Factory flow directly into this catalog with published status.
          </p>
        </div>

        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>ASSET SAFETY</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cloudflare R2 storage assets are protected with reference-counting deletion to prevent broken links.
          </p>
        </div>
      </div>

      {/* 3. Upload / Edit Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {editingMaterial ? 'Edit Material Metadata' : 'Upload Study Resource'}
                  </h3>
                  <p className="text-xs text-slate-400">Curate student-facing academic resources</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Resource Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unit 1 Complete Handwritten Notes - OSI Model"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Material Type
                  </label>
                  <select
                    value={formState.materialType}
                    onChange={(e) => setFormState({ ...formState, materialType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Notes">Study Notes</option>
                    <option value="Book">Reference Book</option>
                    <option value="Assignment">Assignment Solution</option>
                    <option value="Practical">Practical Manual / Lab</option>
                    <option value="Question Bank">Question Bank (IMP)</option>
                  </select>
                </div>

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
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.shortName || b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Semester
                  </label>
                  <select
                    value={formState.semester}
                    onChange={(e) => setFormState({ ...formState, semester: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Sem {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Unit No
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formState.unitNo}
                    onChange={(e) => setFormState({ ...formState, unitNo: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={formState.status}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Published">Published</option>
                    <option value="Pending">Pending Review</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Topic / Sub-topic Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. OSI 7 Layers & Protocol Data Units (PDUs)"
                  value={formState.topic}
                  onChange={(e) => setFormState({ ...formState, topic: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  File URL / Cloudflare R2 Download Link
                </label>
                <input
                  type="url"
                  placeholder="https://pub-..."
                  value={formState.fileUrl}
                  onChange={(e) => setFormState({ ...formState, fileUrl: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-orange-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingMaterial ? 'Update Resource' : 'Upload Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Preview Drawer */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-[#0F172A] border-l border-slate-800 w-full max-w-md h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              <div className="p-5 border-b border-slate-800 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-wider">
                    {previewMaterial.materialType} • {previewMaterial.unit}
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-0.5">
                    {previewMaterial.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {previewMaterial.subjectName} ({previewMaterial.subjectCode})
                  </p>
                </div>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Status</span>
                    <span className="font-bold text-emerald-400">{previewMaterial.status}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Branch & Sem</span>
                    <span className="text-white font-mono">
                      {previewMaterial.branch} Sem {previewMaterial.semester}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Author / Contributor</span>
                    <span className="text-slate-200">{previewMaterial.author}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Views</span>
                    <span className="font-mono text-white">{previewMaterial.views}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Downloads</span>
                    <span className="font-mono text-white">{previewMaterial.downloads}</span>
                  </div>
                </div>

                {previewMaterial.fileUrl ? (
                  <a
                    href={previewMaterial.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Resource File</span>
                  </a>
                ) : (
                  <div className="py-4 text-center text-slate-500 text-xs bg-slate-900/40 rounded-xl border border-slate-800">
                    No external download link attached
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">ID: {previewMaterial.id}</span>
              <button
                onClick={() => {
                  setPreviewMaterial(null);
                  handleOpenUploadModal(previewMaterial);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
              >
                Edit Metadata
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminContentShell>
  );
};
