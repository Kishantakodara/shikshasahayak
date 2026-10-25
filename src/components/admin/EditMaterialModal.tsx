import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { X, Loader2 } from 'lucide-react';
import { SEMESTERS, formatSemester } from '../../constants';

interface EditMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialId: string;
  groupIds?: string[];
  initialBranches?: string[];
  initialSemesters?: number[];
  onSave: () => void;
}

const EditMaterialModal: React.FC<EditMaterialModalProps> = ({
  isOpen,
  onClose,
  materialId,
  groupIds = [],
  initialBranches = [],
  initialSemesters = [],
  onSave,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Document base details
  const [docType, setDocType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');

  // Study material details
  const [author, setAuthor] = useState('');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [unitNo, setUnitNo] = useState('');
  const [materialKind, setMaterialKind] = useState('notes');

  // PYQ details
  const [examYear, setExamYear] = useState('');
  const [examSession, setExamSession] = useState('summer');
  const [examLabel, setExamLabel] = useState('');

  // Syllabus details
  const [syllabusYear, setSyllabusYear] = useState('');
  const [regulation, setRegulation] = useState('');
  const [versionLabel, setVersionLabel] = useState('');

  // Blog association states
  const [initialHasBlog, setInitialHasBlog] = useState(false);
  const [hasBlog, setHasBlog] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogStatus, setBlogStatus] = useState('draft');

  // Branch and Semester multiselect
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([]);
  const [isMultipleBranches, setIsMultipleBranches] = useState(false);
  const [isMultipleSemesters, setIsMultipleSemesters] = useState(false);
  const [branchId, setBranchId] = useState('');
  const [semester, setSemester] = useState('');

  useEffect(() => {
    apiClient.getBranches().then(setBranchesList).catch(console.error);
  }, []);

  useEffect(() => {
    if (!isOpen || !materialId) return;

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiClient.getAdminMaterial(materialId);
        setDocType(data.document_type || '');
        setTitle(data.title || '');
        setDescription(data.description || '');
        setStatus(data.approval_status || 'pending');

        // Study Material fields
        setAuthor(data.author || '');
        setChapter(data.chapter || '');
        setTopic(data.topic || '');
        setUnitNo(data.unit_no !== null && data.unit_no !== undefined ? String(data.unit_no) : '');
        setMaterialKind(data.material_kind || 'notes');

        // PYQ fields
        setExamYear(data.exam_year ? String(data.exam_year) : '');
        setExamSession(data.exam_session?.toLowerCase() || 'summer');
        setExamLabel(data.exam_label || '');

        // Syllabus fields
        setSyllabusYear(data.syllabus_year ? String(data.syllabus_year) : '');
        setRegulation(data.regulation || '');
        setVersionLabel(data.version_label || '');

        // Blog fields
        const exists = !!data.blog_id;
        setInitialHasBlog(exists);
        setHasBlog(exists);
        setBlogTitle(data.blog_title || '');
        setBlogContent(data.blog_content || '');
        setBlogStatus(data.blog_status || 'draft');

        // Populate branches and semesters from group
        const initialBranchList = initialBranches.length > 0 ? initialBranches : (data.branch_id ? [data.branch_id] : []);
        const initialSemList = initialSemesters.length > 0 ? initialSemesters : (data.semester_no !== undefined && data.semester_no !== null ? [data.semester_no] : []);
        
        setSelectedBranches(initialBranchList);
        setSelectedSemesters(initialSemList);

        if (initialBranchList.length > 1) {
           setIsMultipleBranches(true);
           setBranchId('');
        } else if (initialBranchList.length === 1) {
           setIsMultipleBranches(false);
           setBranchId(initialBranchList[0]);
        }

        if (initialSemList.length > 1) {
           setIsMultipleSemesters(true);
           setSemester('');
        } else if (initialSemList.length === 1) {
           setIsMultipleSemesters(false);
           setSemester(String(initialSemList[0]));
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, materialId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Build payload
    const finalBranches = isMultipleBranches ? selectedBranches : (branchId ? [branchId] : []);
    const finalSemesters = isMultipleSemesters ? selectedSemesters : (semester ? [Number(semester)] : []);

    const payload: any = {
      title,
      description,
      approval_status: status,
      group_ids: groupIds,
      branch_ids: finalBranches,
      semesters: finalSemesters,
    };

    if (docType === 'study-material') {
      payload.author = author || null;
      payload.chapter = chapter || null;
      payload.topic = topic || null;
      payload.unit_no = unitNo !== '' ? Number(unitNo) : null;
      payload.material_kind = materialKind;
    } else if (docType === 'pyq') {
      payload.exam_year = examYear !== '' ? Number(examYear) : null;
      payload.exam_session = examSession.toUpperCase();
      payload.exam_label = examLabel || null;
    } else if (docType === 'syllabus') {
      payload.syllabus_year = syllabusYear !== '' ? Number(syllabusYear) : null;
      payload.regulation = regulation || null;
      payload.version_label = versionLabel || null;
    }

    // Determine blog action
    if (hasBlog !== initialHasBlog || hasBlog) {
      let action: 'create' | 'update' | 'remove' = 'update';
      if (hasBlog && !initialHasBlog) {
        action = 'create';
      } else if (!hasBlog && initialHasBlog) {
        action = 'remove';
      }

      payload.blog = {
        action,
        title: blogTitle || title,
        content: blogContent,
        status: blogStatus,
      };
    }

    try {
      await apiClient.updateAdminMaterial(materialId, payload);
      onSave();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-navy-900 rounded-3xl border border-white/20 dark:border-navy-800 shadow-2xl overflow-hidden transition-all duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-navy-800 bg-gray-50 dark:bg-navy-950/50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-text">Edit Document Details</h3>
            <p className="text-xs text-muted font-semibold mt-0.5 capitalize">Type: {docType.replace('-', ' ')}</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-navy-800 text-gray-400 hover:text-navy-900 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="text-sm text-muted font-bold">Loading document details...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl text-sm text-red-650 dark:text-red-400 font-semibold">
                  {error}
                </div>
              )}

              {/* Basic Details (All types) */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-text uppercase tracking-wider border-b border-border pb-1.5">Basic Details</h4>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text">Branch</label>
                    <div className="relative">
                      <select value={isMultipleBranches ? 'multiple' : branchId} onChange={e => {
                        const val = e.target.value;
                        if (val === 'multiple') {
                          setIsMultipleBranches(true);
                          setBranchId('');
                        } else {
                          setIsMultipleBranches(false);
                          setBranchId(val);
                          setSelectedBranches(val ? [val] : []);
                        }
                      }} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm appearance-none">
                        <option value="">Select Branch</option>
                        {branchesList.map(branch => (
                          <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                        <option value="multiple">Multiple Departments</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted">▼</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text">Semester</label>
                    <div className="relative">
                      <select value={isMultipleSemesters ? 'multiple' : semester} onChange={e => { 
                        const val = e.target.value;
                        if (val === 'multiple') {
                          setIsMultipleSemesters(true);
                          setSemester('');
                        } else {
                          setIsMultipleSemesters(false);
                          setSemester(val);
                          setSelectedSemesters(val ? [Number(val)] : []);
                        }
                      }} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm appearance-none">
                        <option value="">Select Semester</option>
                        {SEMESTERS.map(s => <option key={s} value={String(s)}>Semester {formatSemester(s)}</option>)}
                        <option value="multiple">Multiple Semesters</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted">▼</div>
                    </div>
                  </div>
                </div>

                {isMultipleBranches && (
                  <div className="space-y-2 md:col-span-2 bg-surface-secondary border border-border p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-text block">Departments / Branches</label>
                      <label className="flex items-center gap-2 text-xs text-primary font-bold cursor-pointer hover:opacity-80 transition-opacity">
                        <input
                          type="checkbox"
                          checked={branchesList.length > 0 && selectedBranches.length === branchesList.length}
                          onChange={e => {
                            if (e.target.checked) setSelectedBranches(branchesList.map(b => b.id));
                            else setSelectedBranches([]);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                        />
                        <span>Select All</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {branchesList.map(branch => (
                        <label key={branch.id} className="flex items-center gap-2 text-xs text-text font-medium cursor-pointer p-1.5 hover:bg-background rounded-lg border border-transparent hover:border-border transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedBranches.includes(branch.id)}
                            onChange={e => {
                              if (e.target.checked) setSelectedBranches(prev => [...prev, branch.id]);
                              else setSelectedBranches(prev => prev.filter(id => id !== branch.id));
                            }}
                            className="h-4 w-4 rounded border-gray-350 text-primary focus:ring-primary accent-primary"
                          />
                          <span>{branch.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {isMultipleSemesters && (
                  <div className="space-y-2 md:col-span-2 bg-surface-secondary border border-border p-4 rounded-xl">
                    <label className="text-xs font-bold text-text block mb-2">Semesters</label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {SEMESTERS.map(s => (
                        <label key={s} className="flex items-center justify-center gap-1.5 text-xs text-text font-medium cursor-pointer p-1.5 hover:bg-background rounded-lg border border-border transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedSemesters.includes(s)}
                            onChange={e => {
                              if (e.target.checked) setSelectedSemesters(prev => [...prev, s]);
                              else setSelectedSemesters(prev => prev.filter(val => val !== s));
                            }}
                            className="h-4 w-4 rounded border-gray-350 text-primary focus:ring-primary accent-primary"
                          />
                          <span>Sem {formatSemester(s)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-bold text-text">Approval Status</label>
                    <div className="relative">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm appearance-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved / Published</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted">▼</div>
                    </div>
                  </div>
              </div>

              {/* Type-Specific Details */}
              {docType === 'study-material' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-text uppercase tracking-wider border-b border-border pb-1.5">Study Material Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text">Material Kind</label>
                      <div className="relative">
                        <select
                          value={materialKind}
                          onChange={(e) => setMaterialKind(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm appearance-none"
                        >
                          <option value="notes">Notes</option>
                          <option value="book">Book</option>
                          <option value="assignment">Assignment</option>
                          <option value="practical">Practical / Lab Manual</option>
                          <option value="question_bank">Question Bank</option>
                          <option value="video">Video Lecture</option>
                          <option value="other">Other</option>
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted">▼</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text">Unit Number</label>
                      <input
                        type="number"
                        min="0"
                        value={unitNo}
                        onChange={(e) => setUnitNo(e.target.value)}
                        placeholder="e.g. 1 (Leave empty for complete)"
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text">Topic</label>
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text">Chapter</label>
                      <input
                        type="text"
                        value={chapter}
                        onChange={(e) => setChapter(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text">Faculty / Author</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm"
                    />
                  </div>
                </div>
              )}

              {docType === 'pyq' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-text uppercase tracking-wider border-b border-border pb-1.5">PYQ Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text">Exam Year</label>
                      <input
                        type="number"
                        required
                        value={examYear}
                        onChange={(e) => setExamYear(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text">Exam Session (Season)</label>
                      <div className="relative">
                        <select
                          value={examSession}
                          onChange={(e) => setExamSession(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm appearance-none"
                        >
                          <option value="summer">Summer</option>
                          <option value="winter">Winter</option>
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted">▼</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text">Exam Label</label>
                    <input
                      type="text"
                      value={examLabel}
                      onChange={(e) => setExamLabel(e.target.value)}
                      placeholder="e.g. Winter 2026 End Sem"
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm"
                    />
                  </div>
                </div>
              )}

              {docType === 'syllabus' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-text uppercase tracking-wider border-b border-border pb-1.5">Syllabus Details</h4>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text">WEF Year</label>
                    <input
                      type="text"
                      value={versionLabel}
                      onChange={(e) => setVersionLabel(e.target.value)}
                      placeholder="e.g. 2025-26"
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Blog Management */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-text uppercase tracking-wider border-b border-border pb-1.5">Blog Association</h4>
                
                <div className="bg-surface-secondary rounded-2xl p-5 border border-border">
                  <label className="flex items-center justify-between gap-4 cursor-pointer">
                    <div>
                      <h5 className="font-bold text-text text-sm">Enable Linked Blog Post</h5>
                      <p className="text-[11px] text-muted font-semibold mt-0.5">Publish details, solutions, or guides related to this document.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={hasBlog}
                      onChange={(e) => setHasBlog(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                  </label>

                  {/* Warning for unchecking existing blog */}
                  {initialHasBlog && !hasBlog && (
                    <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs text-amber-700 dark:text-amber-400 font-semibold animate-pulse-slow">
                      ⚠️ Warning: Unchecking this option will permanently delete the associated blog post from the database upon saving.
                    </div>
                  )}

                  {/* Blog Edit Fields */}
                  {hasBlog && (
                    <div className="mt-5 space-y-4 border-t border-border pt-4 animate-fade-in">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text">Blog Title</label>
                        <input
                          type="text"
                          value={blogTitle}
                          onChange={(e) => setBlogTitle(e.target.value)}
                          placeholder="Defaults to document title"
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text">Blog Content (Markdown)</label>
                        <textarea
                          required
                          value={blogContent}
                          onChange={(e) => setBlogContent(e.target.value)}
                          placeholder="Write blog content in Markdown..."
                          rows={6}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm resize-y"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted">Blog Status</span>
                        <select
                          value={blogStatus}
                          onChange={(e) => setBlogStatus(e.target.value)}
                          className="bg-background border border-border rounded-xl px-3 py-1.5 text-text focus:border-primary outline-none text-xs"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="bg-surface-secondary hover:bg-border text-text px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary hover:bg-primary/95 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditMaterialModal;
