import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
  FileText, Check, X, Eye, Loader2, Edit3, AlertTriangle, BookOpen, GraduationCap, Calendar, User, FileQuestion, ChevronRight
} from 'lucide-react';
import { Branch, SubjectOffering } from '../../types';

const ManageApprovalsUI: React.FC = () => {
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [catalogSubjects, setCatalogSubjects] = useState<SubjectOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Edit states
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [semester, setSemester] = useState('');
  const [subjectMode, setSubjectMode] = useState<'catalog' | 'custom'>('catalog');
  const [subjectOfferingId, setSubjectOfferingId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');

  // Processing states
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const loadPending = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getPendingMaterials();
      setPendingItems(data || []);
      setSelectedItem(null);
    } catch (error) {
      console.error('Failed to load pending materials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
    apiClient.getBranches()
      .then(setBranches)
      .catch(err => console.error('Failed to fetch branches:', err));
  }, []);

  // Fetch catalog subjects when branch or semester changes in edit panel
  useEffect(() => {
    if (!branchId || !semester) {
      setCatalogSubjects([]);
      return;
    }
    const selectedBranch = branches.find(b => b.id === branchId);
    if (!selectedBranch) return;

    let isActive = true;
    setIsCatalogLoading(true);
    apiClient.getCatalog(selectedBranch.slug, Number(semester), 2026)
      .then((data) => {
        if (isActive) setCatalogSubjects(data);
      })
      .catch((error) => {
        console.error('Failed to fetch catalog:', error);
        if (isActive) setCatalogSubjects([]);
      })
      .finally(() => {
        if (isActive) setIsCatalogLoading(false);
      });
    return () => { isActive = false; };
  }, [branchId, semester, branches]);

  const selectItemForEditing = (item: any) => {
    setSelectedItem(item);
    setTitle(item.title || '');
    setAuthorName(item.author_name || '');
    setBranchId(item.branch_id || '');
    setSemester(item.semester_no ? String(item.semester_no) : '');
    
    // Check if there is an existing subject ID mapping
    if (item.subject_id) {
      setSubjectOfferingId(item.subject_id);
      setSubjectName(item.subject_name || '');
      setSubjectCode(item.subject_code || '');
      setSubjectMode('catalog');
    } else {
      setSubjectOfferingId('');
      setSubjectName(item.subject_name || '');
      setSubjectCode(item.subject_code || '');
      setSubjectMode('custom');
    }
  };

  const handleBranchChange = (bId: string) => {
    setBranchId(bId);
    setSubjectOfferingId('');
    setSubjectName('');
    setSubjectCode('');
    setSubjectMode('catalog');
  };

  const handleSemesterChange = (semVal: string) => {
    setSemester(semVal);
    setSubjectOfferingId('');
    setSubjectName('');
    setSubjectCode('');
    setSubjectMode('catalog');
  };

  const handleSubjectChange = (val: string) => {
    if (val === '__custom') {
      setSubjectMode('custom');
      setSubjectOfferingId('');
      setSubjectName('');
      setSubjectCode('');
      return;
    }
    const selected = catalogSubjects.find(s => s.id === val);
    setSubjectMode('catalog');
    setSubjectOfferingId(selected?.id || '');
    setSubjectName(selected?.subjectName || '');
    setSubjectCode(selected?.subjectCode || '');
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    if (!title.trim()) {
      alert('File name/title is required.');
      return;
    }
    if (!branchId) {
      alert('Please select a branch.');
      return;
    }
    if (!semester) {
      alert('Please select a semester.');
      return;
    }
    if (subjectMode === 'catalog' && !subjectOfferingId) {
      alert('Please select a catalog subject, or choose custom subject.');
      return;
    }
    if (subjectMode === 'custom' && !subjectName.trim()) {
      alert('Custom subject name is required.');
      return;
    }

    try {
      setIsApproving(true);
      const payload = {
        title,
        author_name: authorName,
        branch_id: branchId,
        semester: Number(semester),
        subject_id: subjectOfferingId || undefined,
        subject_name: subjectMode === 'custom' ? subjectName : undefined,
        subject_code: subjectMode === 'custom' ? subjectCode : undefined,
      };

      await apiClient.approveMaterial(selectedItem.id, payload);
      alert('Material approved and published to public catalog!');
      await loadPending();
    } catch (err: any) {
      alert(err.message || 'Failed to approve material');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    if (!confirm('Are you sure you want to REJECT and PERMANENTLY DELETE this contributed file? This action is irreversible.')) {
      return;
    }

    try {
      setIsRejecting(true);
      await apiClient.rejectMaterial(selectedItem.id);
      alert('Material rejected and deleted successfully.');
      await loadPending();
    } catch (err: any) {
      alert(err.message || 'Failed to reject material');
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
          Submission Approval Setup
        </h2>
        <p className="text-sm text-muted mt-1 font-semibold">
          Review, edit, and approve contributed documents before publishing them live to the public repository.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Pending List */}
        <div className="lg:col-span-1 bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-text border-b border-border pb-3 flex items-center justify-between">
            <span>Pending Submissions</span>
            <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
              {isLoading ? '...' : pendingItems.length}
            </span>
          </h3>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <span className="text-xs text-muted font-bold">Loading pending list...</span>
            </div>
          ) : pendingItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              <BookOpen className="h-10 w-10 text-muted mx-auto mb-3" />
              <h4 className="font-bold text-text text-sm">All Clean!</h4>
              <p className="text-xs text-muted mt-1">There are no pending student contributions to moderate.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {pendingItems.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => selectItemForEditing(item)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between group ${
                    selectedItem?.id === item.id 
                      ? 'bg-primary/5 border-primary shadow-sm' 
                      : 'bg-surface-secondary/50 border-border hover:bg-surface-secondary hover:border-primary/30'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
                      {item.document_type === 'study-material' ? 'Study Material' : item.document_type.toUpperCase()}
                    </span>
                    <h4 className="font-bold text-sm text-text truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted truncate mt-0.5 font-semibold">
                      By: {item.author_name || 'Contributor'}
                    </p>
                  </div>
                  <ChevronRight className={`h-4.5 w-4.5 text-muted shrink-0 transition-transform ${
                    selectedItem?.id === item.id ? 'translate-x-0.5 text-primary' : 'group-hover:translate-x-0.5'
                  }`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Edit & Approval Panel */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedItem ? (
            <div className="bg-surface border border-border border-dashed rounded-2xl p-20 text-center flex flex-col items-center justify-center min-h-[450px]">
              <AlertTriangle className="h-12 w-12 text-muted mb-4" />
              <h3 className="text-lg font-bold text-text mb-1">No Document Selected</h3>
              <p className="text-sm text-muted max-w-xs font-semibold">Select a pending contribution from the list to preview, edit, and moderate.</p>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm animate-fade-in">
              <div className="p-6 border-b border-border bg-surface-secondary/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Review & Edit</span>
                  <h3 className="text-xl font-bold text-text truncate mt-1 max-w-md" title={selectedItem.title}>{title || 'Review Document'}</h3>
                </div>
                {selectedItem.file_url && (
                  <a 
                    href={selectedItem.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-navy-950 dark:bg-brand-orange text-white px-4.5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm shrink-0 shadow-sm"
                  >
                    <Eye className="h-4 w-4" /> View / Preview PDF
                  </a>
                )}
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* File Name/Title */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-text uppercase tracking-wider">File Title / Name</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      placeholder="Enter clean document title"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm font-semibold"
                    />
                  </div>

                  {/* Author Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1"><User className="h-3.5 w-3.5" /> Author / Contributor Name</label>
                    <input 
                      type="text" 
                      value={authorName} 
                      onChange={e => setAuthorName(e.target.value)} 
                      placeholder="e.g. Anonymous"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm"
                    />
                  </div>

                  {/* Branch Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> Branch / Department</label>
                    <div className="relative">
                      <select 
                        value={branchId} 
                        onChange={e => handleBranchChange(e.target.value)} 
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm appearance-none"
                      >
                        <option value="">Select Branch</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted">▼</div>
                    </div>
                  </div>

                  {/* Semester Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Semester</label>
                    <div className="relative">
                      <select 
                        value={semester} 
                        onChange={e => handleSemesterChange(e.target.value)} 
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm appearance-none"
                      >
                        <option value="">Select Semester</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(semNum => (
                          <option key={semNum} value={String(semNum)}>Semester {semNum}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted">▼</div>
                    </div>
                  </div>

                  {/* Subject Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> Subject</label>
                    <div className="relative">
                      <select 
                        value={subjectMode === 'custom' ? '__custom' : subjectOfferingId} 
                        onChange={e => handleSubjectChange(e.target.value)}
                        disabled={!branchId || !semester || isCatalogLoading}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm appearance-none disabled:opacity-60"
                      >
                        <option value="">{isCatalogLoading ? 'Loading subjects...' : 'Select Catalog Subject'}</option>
                        {catalogSubjects.map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {sub.subjectName}{sub.subjectCode ? ` (${sub.subjectCode})` : ''}
                          </option>
                        ))}
                        <option value="__custom">Custom Subject Name below</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted">▼</div>
                    </div>
                  </div>

                  {/* Custom Subject inputs */}
                  {(subjectMode === 'custom' || (!isCatalogLoading && branchId && semester && catalogSubjects.length === 0)) && (
                    <div className="space-y-2 md:col-span-2 bg-surface-secondary/50 p-4 rounded-xl border border-border animate-fade-in">
                      <label className="text-xs font-bold text-text uppercase tracking-wider">Custom Subject Details</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                        <input 
                          type="text" 
                          value={subjectName} 
                          onChange={e => setSubjectName(e.target.value)} 
                          placeholder="e.g. Mathematics-2" 
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm"
                        />
                        <input 
                          type="text" 
                          value={subjectCode} 
                          onChange={e => setSubjectCode(e.target.value)} 
                          placeholder="Code (optional, e.g. MA-201)" 
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Reject button */}
                  <button 
                    onClick={handleReject}
                    disabled={isRejecting || isApproving}
                    className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {isRejecting ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <X className="h-4.5 w-4.5" /> Reject & Delete
                      </>
                    )}
                  </button>

                  {/* Approve button */}
                  <button 
                    onClick={handleApprove}
                    disabled={isRejecting || isApproving}
                    className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4.5 w-4.5" /> Approve & Publish
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageApprovalsUI;
