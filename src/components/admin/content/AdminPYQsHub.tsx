import { fetchWithAuth } from '../../../api/client';
// ============================================================
// SHIKSHA SAHAYAK OS: PYQS & PAPERS HUB
// Authentic University Previous Year Question Papers Management
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Upload,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Filter,
  Sparkles,
  Download,
  ExternalLink,
  AlertTriangle,
  X,
  Building2,
  Calendar,
  Layers,
  Book,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { AdminContentShell, KPICardItem, FilterOption } from './AdminContentShell';
import { apiClient } from '../../../api/client';
import { academicManagementClient } from '../../../api/academicManagementClient';
import { toast } from 'sonner';

interface PYQRow {
  id: string;
  year: string;
  season: 'Summer' | 'Winter';
  university: string;
  branch: string;
  branchId?: string;
  semester: number;
  subjectName: string;
  subjectCode: string;
  subjectId?: string;
  examType: 'Regular' | 'Remedial' | 'Makeup';
  pages: number;
  verification: 'Verified' | 'Imported' | 'Needs Review' | 'Rejected';
  status: 'Published' | 'Draft' | 'Review';
  downloads?: number;
  fileUrl?: string;
  storageKey?: string;
  updatedAt?: string;
}

export const AdminPYQsHub: React.FC = () => {
  const [papers, setPapers] = useState<PYQRow[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedVerification, setSelectedVerification] = useState('');

  // Modals & Preview
  const [previewPaper, setPreviewPaper] = useState<PYQRow | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Paper Upload
  const [formState, setFormState] = useState({
    subjectId: '',
    branchId: '',
    semester: '1',
    year: '2025',
    season: 'Summer' as 'Summer' | 'Winter',
    examType: 'Regular' as 'Regular' | 'Remedial' | 'Makeup',
    pages: '4',
    fileUrl: '',
    verificationStatus: 'Verified' as 'Verified' | 'Needs Review' | 'Imported',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pyqData, subData, brData] = await Promise.all([
        apiClient.getAdminMaterials('pyq'),
        academicManagementClient.getSubjects(),
        academicManagementClient.getBranches(),
      ]);

      if (Array.isArray(subData)) setSubjects(subData);
      if (Array.isArray(brData)) setBranches(brData);

      if (Array.isArray(pyqData)) {
        const mapped: PYQRow[] = pyqData.map((d: any) => ({
          id: d.id,
          year: d.paper_year?.toString() || d.exam_year?.toString() || '2025',
          season: d.season === 'W' || d.exam_session === 'winter' ? 'Winter' : 'Summer',
          university: d.university || 'GTU',
          branch: d.branch_name || d.branch_short_names || 'Engineering',
          branchId: d.branch_id,
          semester: Number(d.semester_no || d.semester || 1),
          subjectName: d.subject_name || d.title || 'Subject Paper',
          subjectCode: d.subject_code || '',
          subjectId: d.subject_id,
          examType: (d.exam_type as any) || 'Regular',
          pages: Number(d.page_count || 4),
          verification:
            d.approval_status === 'approved'
              ? 'Verified'
              : d.approval_status === 'rejected'
              ? 'Rejected'
              : d.approval_status === 'pending'
              ? 'Needs Review'
              : 'Imported',
          status: d.approval_status === 'approved' ? 'Published' : 'Draft',
          downloads: Number(d.downloads_count || 0),
          fileUrl: d.file_url || d.download_url || d.url,
          storageKey: d.storage_key,
          updatedAt: d.updated_at ? new Date(d.updated_at).toLocaleDateString() : 'Recent',
        }));
        setPapers(mapped);
      } else {
        setPapers([]);
      }
    } catch (e) {
      console.error('Error fetching PYQs:', e);
      toast.error('Failed to load authentic PYQs');
      setPapers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Papers
  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.year.includes(searchQuery);

      const matchBranch = !selectedBranch || p.branch === selectedBranch || p.branchId === selectedBranch;
      const matchSemester = !selectedSemester || p.semester.toString() === selectedSemester;
      const matchYear = !selectedYear || p.year === selectedYear;
      const matchSeason = !selectedSeason || p.season === selectedSeason;
      const matchVerification = !selectedVerification || p.verification === selectedVerification;

      return matchSearch && matchBranch && matchSemester && matchYear && matchSeason && matchVerification;
    });
  }, [papers, searchQuery, selectedBranch, selectedSemester, selectedYear, selectedSeason, selectedVerification]);

  // KPIs
  const totalPapers = papers.length;
  const verifiedCount = papers.filter((p) => p.verification === 'Verified').length;
  const reviewCount = papers.filter((p) => p.verification === 'Needs Review' || p.verification === 'Imported').length;
  const summerCount = papers.filter((p) => p.season === 'Summer').length;
  const winterCount = papers.filter((p) => p.season === 'Winter').length;

  const kpis: KPICardItem[] = [
    {
      label: 'TOTAL AUTHENTIC PYQS',
      value: totalPapers,
      icon: FileText,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      subtext: 'Strictly authentic university papers',
    },
    {
      label: 'VERIFIED & PUBLISHED',
      value: verifiedCount,
      icon: ShieldCheck,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      subtext: `${Math.round((verifiedCount / (totalPapers || 1)) * 100)}% student-ready`,
    },
    {
      label: 'NEEDS REVIEW',
      value: reviewCount,
      icon: Clock,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      subtext: 'Pending authenticity check',
    },
    {
      label: 'SEASONAL COVERAGE',
      value: `${summerCount}S / ${winterCount}W`,
      icon: Calendar,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      subtext: 'Summer & Winter exam sessions',
    },
  ];

  // Filters setup
  const filterOptions: FilterOption[] = [
    {
      key: 'branch',
      label: 'Branch',
      value: selectedBranch,
      options: Array.from(new Set(papers.map((p) => p.branch)))
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
      key: 'year',
      label: 'Year',
      value: selectedYear,
      options: ['2025', '2024', '2023', '2022', '2021', '2020', '2019'].map((y) => ({
        label: y,
        value: y,
      })),
      onChange: setSelectedYear,
    },
    {
      key: 'season',
      label: 'Season',
      value: selectedSeason,
      options: [
        { label: 'Summer', value: 'Summer' },
        { label: 'Winter', value: 'Winter' },
      ],
      onChange: setSelectedSeason,
    },
    {
      key: 'verification',
      label: 'Verification',
      value: selectedVerification,
      options: [
        { label: 'Verified', value: 'Verified' },
        { label: 'Needs Review', value: 'Needs Review' },
        { label: 'Imported', value: 'Imported' },
        { label: 'Rejected', value: 'Rejected' },
      ],
      onChange: setSelectedVerification,
    },
  ];

  // Upload Paper Handler
  const handleUploadPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.subjectId || !formState.fileUrl) {
      toast.error('Subject and PDF Link are required');
      return;
    }

    const selectedSub = subjects.find((s) => s.id === formState.subjectId);
    if (!selectedSub) {
      toast.error('Subject not found');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/admin/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${selectedSub.name} - ${formState.season} ${formState.year} PYQ`,
          documentType: 'pyq',
          branchId: selectedSub.branchId || formState.branchId,
          semester: Number(formState.semester),
          subjectId: selectedSub.id,
          paperYear: Number(formState.year),
          season: formState.season === 'Winter' ? 'W' : 'S',
          examType: formState.examType,
          fileUrl: formState.fileUrl.trim(),
          approvalStatus: formState.verificationStatus === 'Verified' ? 'approved' : 'pending',
        }),
      });

      if (!res.ok) throw new Error('Failed to upload paper');
      toast.success(`Authentic PYQ paper uploaded successfully`);
      setIsUploadModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload PYQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify / Publish Action
  const handleVerifyPaper = async (paperId: string, status: 'Verified' | 'Rejected') => {
    try {
      const res = await fetchWithAuth(`/api/admin/materials/${paperId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status === 'Verified' ? 'approved' : 'rejected',
        }),
      });

      if (!res.ok) throw new Error('Verification update failed');
      toast.success(`Paper marked as ${status}`);
      setPapers((prev) =>
        prev.map((p) =>
          p.id === paperId ? { ...p, verification: status, status: status === 'Verified' ? 'Published' : 'Draft' } : p
        )
      );
    } catch (err: any) {
      toast.error('Failed to update verification status');
    }
  };

  // Delete Paper
  const handleDeletePaper = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this question paper?')) return;
    try {
      const res = await fetchWithAuth(`/api/admin/materials/${paperId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete paper');
      toast.success('Question paper deleted safely');
      setPapers((prev) => prev.filter((p) => p.id !== paperId));
    } catch (err: any) {
      toast.error('Failed to delete');
    }
  };

  return (
    <AdminContentShell
      title="PYQs & Past Papers"
      description="Authentic university previous-year question papers repository. Strict Rule: AI-generated questions are forbidden from this catalog. Verified papers automatically appear in student PYQ discovery."
      breadcrumb={['ShikshaSahayak Admin', 'Content Management', 'PYQs & Papers']}
      primaryAction={{
        label: 'Upload Paper',
        icon: Plus,
        onClick: () => {
          setFormState({
            subjectId: subjects[0]?.id || '',
            branchId: branches[0]?.id || '',
            semester: '1',
            year: '2025',
            season: 'Summer',
            examType: 'Regular',
            pages: '4',
            fileUrl: '',
            verificationStatus: 'Verified',
          });
          setIsUploadModalOpen(true);
        },
      }}
      secondaryAction={{
        label: 'Export Index',
        icon: Download,
        onClick: () => {
          const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(papers, null, 2)
          )}`;
          const downloadAnchor = document.createElement('a');
          downloadAnchor.setAttribute('href', jsonString);
          downloadAnchor.setAttribute('download', `shikshasahayak_pyqs_${Date.now()}.json`);
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();
          toast.success('PYQ catalog exported');
        },
      }}
      kpis={kpis}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search by subject name, code, or exam year (e.g. 3150710, 2024)..."
      filters={filterOptions}
      onRefresh={loadData}
      isLoading={isLoading}
    >
      {/* 1. PYQ Papers Table */}
      <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-mono">Session</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4 font-mono">Code</th>
                <th className="py-3.5 px-4">Branch & Sem</th>
                <th className="py-3.5 px-4">Exam Type</th>
                <th className="py-3.5 px-4">Verification</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredPapers.length > 0 ? (
                filteredPapers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition group">
                    {/* Session (Year & Season) */}
                    <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                      <span className="text-orange-400">{p.season}</span> {p.year}
                    </td>

                    {/* Subject */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-200 group-hover:text-orange-400 transition">
                        {p.subjectName}
                      </span>
                    </td>

                    {/* Subject Code */}
                    <td className="py-3 px-4 font-mono text-slate-400">{p.subjectCode}</td>

                    {/* Branch & Semester */}
                    <td className="py-3 px-4">
                      <span className="text-slate-300">
                        {p.branch} • <strong className="font-mono text-white">Sem {p.semester}</strong>
                      </span>
                    </td>

                    {/* Exam Type */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {p.examType}
                      </span>
                    </td>

                    {/* Verification */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.verification === 'Verified'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : p.verification === 'Needs Review'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : p.verification === 'Rejected'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }`}
                      >
                        {p.verification === 'Verified' && <ShieldCheck className="w-3 h-3" />}
                        <span>{p.verification}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.status === 'Published'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-700/30 text-slate-400 border-slate-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewPaper(p)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Preview Paper"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {p.verification !== 'Verified' && (
                          <button
                            onClick={() => handleVerifyPaper(p.id, 'Verified')}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
                            title="Verify Authenticity & Publish"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeletePaper(p.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition cursor-pointer"
                          title="Delete Paper"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-400">No question papers found</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Click "+ Upload Paper" above to index verified university past exams.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Educational & Authentic Integrity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-orange-400 font-bold text-xs">
            <ShieldAlert className="w-4 h-4" />
            <span>AUTHENTICITY GUARANTEE</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            AI-generated questions are strictly prohibited from this section. Only genuine university exam
            question papers are permitted.
          </p>
        </div>

        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
            <Calendar className="w-4 h-4" />
            <span>SEASONAL INDEXING</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Papers are categorized by Summer and Winter sessions to match GTU university examination schedules.
          </p>
        </div>

        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>STUDENT DISCOVERY</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Verified papers immediately populate the student portal's PYQ search and subject exam preparation tabs.
          </p>
        </div>
      </div>

      {/* 3. Upload Paper Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Upload Authentic Question Paper</h3>
                  <p className="text-xs text-slate-400">GTU / University Exam Archive</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadPaper} className="p-5 space-y-4">
              {/* Subject Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Subject *
                </label>
                <select
                  value={formState.subjectId}
                  onChange={(e) => {
                    const sub = subjects.find((s) => s.id === e.target.value);
                    setFormState({
                      ...formState,
                      subjectId: e.target.value,
                      branchId: sub?.branchId || formState.branchId,
                      semester: sub?.semester?.toString() || formState.semester,
                    });
                  }}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Select Subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || 'N/A'}) - Sem {s.semester}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Year */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Exam Year *
                  </label>
                  <select
                    value={formState.year}
                    onChange={(e) => setFormState({ ...formState, year: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                  >
                    {['2025', '2024', '2023', '2022', '2021', '2020', '2019'].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Season */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Season *
                  </label>
                  <select
                    value={formState.season}
                    onChange={(e) => setFormState({ ...formState, season: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                  </select>
                </div>

                {/* Exam Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Exam Type
                  </label>
                  <select
                    value={formState.examType}
                    onChange={(e) => setFormState({ ...formState, examType: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Remedial">Remedial</option>
                    <option value="Makeup">Makeup</option>
                  </select>
                </div>
              </div>

              {/* PDF URL */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  PDF Link / R2 Public Storage URL *
                </label>
                <input
                  type="url"
                  placeholder="https://pub-..."
                  value={formState.fileUrl}
                  onChange={(e) => setFormState({ ...formState, fileUrl: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Verification status */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Verification
                </label>
                <div className="flex gap-4 mt-1">
                  {['Verified', 'Needs Review', 'Imported'].map((v) => (
                    <label key={v} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="verificationStatus"
                        value={v}
                        checked={formState.verificationStatus === v}
                        onChange={() => setFormState({ ...formState, verificationStatus: v as any })}
                        className="text-orange-500 focus:ring-0"
                      />
                      <span>{v}</span>
                    </label>
                  ))}
                </div>
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
                  {isSubmitting ? 'Uploading...' : 'Save Paper'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Preview Drawer */}
      {previewPaper && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-[#0F172A] border-l border-slate-800 w-full max-w-md h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              <div className="p-5 border-b border-slate-800 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-wider">
                    {previewPaper.season} {previewPaper.year} • {previewPaper.examType}
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-0.5">{previewPaper.subjectName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Code: {previewPaper.subjectCode} • Sem {previewPaper.semester}
                  </p>
                </div>
                <button
                  onClick={() => setPreviewPaper(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Verification</span>
                    <span className="font-bold text-emerald-400">{previewPaper.verification}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Status</span>
                    <span className="text-white font-mono">{previewPaper.status}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Branch</span>
                    <span className="text-slate-200">{previewPaper.branch}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">University</span>
                    <span className="text-slate-200">{previewPaper.university}</span>
                  </div>
                </div>

                {previewPaper.fileUrl ? (
                  <a
                    href={previewPaper.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>View & Download Authentic PDF</span>
                  </a>
                ) : (
                  <div className="py-4 text-center text-slate-500 text-xs bg-slate-900/40 rounded-xl border border-slate-800">
                    No PDF download link attached
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">ID: {previewPaper.id}</span>
              <button
                onClick={() => setPreviewPaper(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminContentShell>
  );
};
