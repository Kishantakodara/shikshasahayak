import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
  Save, Send, FileText, PlusCircle, ArrowRight, ArrowLeft, CheckCircle, ExternalLink, Trash2, Search, Filter, Loader2, BookOpen, Edit, Eye, EyeOff, CheckCircle2
} from 'lucide-react';
import { Branch, SubjectOffering } from '../../types';
import { SEMESTERS, formatSemester } from '../../constants';
import EditMaterialModal from './EditMaterialModal';
import { usePreventTabClose } from '../../hooks/usePreventTabClose';
import { compressPdfFile } from '../../utils/pdfCompressor';
import { getSiteControlState, saveSiteControlState } from '../../utils/siteControl';

interface ManageStudyMaterialsUIProps {
  embedded?: boolean;
  initialSearchQuery?: string;
}

const ManageStudyMaterialsUI: React.FC<ManageStudyMaterialsUIProps> = ({ embedded = false, initialSearchQuery = '' }) => {
  const [isCreating, setIsCreating] = useState(embedded);
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [catalogSubjects, setCatalogSubjects] = useState<SubjectOffering[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [uploadedMaterialIds, setUploadedMaterialIds] = useState<string[]>([]);
  const [showLinks, setShowLinks] = useState(false);

  // Site Control State
  const [siteControl, setSiteControl] = useState(getSiteControlState());

  const handleToggleMaterialsSection = () => {
    const updated = saveSiteControlState({ showStudyNotes: !siteControl.showStudyNotes });
    setSiteControl(updated);
  };

  // Materials List State
  const [materials, setMaterials] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Wizard State
  const [step, setStep] = useState(1);

  // Form State
  const [title, setTitle] = useState('');
  const [branchId, setBranchId] = useState('');
  const [branchSlug, setBranchSlug] = useState('');
  const [branchName, setBranchName] = useState('');
  const [semester, setSemester] = useState('');
  const [subjectOfferingId, setSubjectOfferingId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectMode, setSubjectMode] = useState<'catalog' | 'custom'>('catalog');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [materialKind, setMaterialKind] = useState('notes');
  const [unitNo, setUnitNo] = useState('');
  const [topic, setTopic] = useState('');
  const [chapter, setChapter] = useState('');

  // Multiple Selection State
  const [isMultipleBranches, setIsMultipleBranches] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [isMultipleSemesters, setIsMultipleSemesters] = useState(false);
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<string>('');

  // File State
  const [file, setFile] = useState<File | null>(null);
  const [createBlog, setCreateBlog] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogStatus, setBlogStatus] = useState<'draft' | 'published'>('draft');

  // Blog linking states
  const [blogsList, setBlogsList] = useState<any[]>([]);
  const [linkBlogMode, setLinkBlogMode] = useState<'new' | 'existing'>('new');
  const [selectedBlogId, setSelectedBlogId] = useState<string>('');
  const [uploadedBlogId, setUploadedBlogId] = useState<string | null>(null);

  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);

  usePreventTabClose(isPublishing || isCompressing);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds([]);
  }, [searchQuery, filterBranch, filterSemester]);

  useEffect(() => {
    let isActive = true;
    apiClient.getBranches()
      .then((data) => {
        if (isActive) setBranches(data);
      })
      .catch((error) => console.error('Failed to fetch branches:', error));

    apiClient.getBlogs(true)
      .then((data) => {
        if (isActive) setBlogsList(data || []);
      })
      .catch((error) => console.error('Failed to fetch blogs:', error));

    return () => { isActive = false; };
  }, []);

  useEffect(() => {
    const targetSlugs = isMultipleBranches
      ? selectedBranches.map(id => branches.find(b => b.id === id)?.slug).filter(Boolean) as string[]
      : [branchSlug].filter(Boolean);

    const targetSemesters = isMultipleSemesters
      ? selectedSemesters.map(Number)
      : [Number(semester)].filter(s => !isNaN(s) && s >= 0);

    if (targetSlugs.length === 0 || targetSemesters.length === 0) {
      setCatalogSubjects([]);
      return;
    }

    let isActive = true;
    setIsCatalogLoading(true);

    const fetchPromises = targetSlugs.flatMap(slug =>
      targetSemesters.map(sem => apiClient.getCatalog(slug, sem, 2026))
    );

    Promise.all(fetchPromises)
      .then((results) => {
        if (!isActive) return;
        const merged: SubjectOffering[] = [];
        const seenKeys = new Set<string>();
        for (const list of results) {
          if (!list) continue;
          for (const item of list) {
            const key = `${item.subjectCode || ''}_${item.subjectName}`.toLowerCase().trim();
            if (!seenKeys.has(key)) {
              seenKeys.add(key);
              merged.push(item);
            }
          }
        }
        merged.sort((a, b) => a.subjectName.localeCompare(b.subjectName));
        setCatalogSubjects(merged);
      })
      .catch((error) => {
        console.error('Failed to fetch combined catalog:', error);
        if (isActive) setCatalogSubjects([]);
      })
      .finally(() => {
        if (isActive) setIsCatalogLoading(false);
      });

    return () => { isActive = false; };
  }, [branchSlug, semester, isMultipleBranches, selectedBranches, isMultipleSemesters, selectedSemesters, branches]);

  const loadMaterials = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAdminMaterials('study-material');
      setMaterials(data || []);
      setSelectedIds([]); // Clear selection when data changes
    } catch (error) {
      console.error('Failed to load study materials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isCreating) {
      loadMaterials();
    }
  }, [isCreating]);

  const resetSubjectSelection = () => {
    setSubjectOfferingId('');
    setSubjectName('');
    setSubjectCode('');
    setSubjectMode('catalog');
  };

  const resetForm = () => {
    setUploadedMaterialIds([]);
    setShowLinks(false);
    setStep(1);
    setTitle('');
    setFile(null);
    setBranchId('');
    setBranchSlug('');
    setBranchName('');
    setSemester('');
    setIsMultipleBranches(false);
    setSelectedBranches([]);
    setIsMultipleSemesters(false);
    setSelectedSemesters([]);
    setIsPublishing(false);
    resetSubjectSelection();
    setCreateBlog(false);
    setBlogTitle('');
    setBlogContent('');
    setBlogStatus('draft');
    setLinkBlogMode('new');
    setSelectedBlogId('');
    setUploadedBlogId(null);
    setAuthor('');
    setDescription('');
    setMaterialKind('notes');
    setUnitNo('');
    setTopic('');
    setChapter('');
  };

  const handleBranchChange = (selectedId: string) => {
    if (selectedId === 'multiple') {
      setIsMultipleBranches(true);
      setBranchId('');
      setBranchSlug('');
      setBranchName('');
      setSelectedBranches([]);
      resetSubjectSelection();
      return;
    }
    setIsMultipleBranches(false);
    const selected = branches.find((branch) => branch.id === selectedId);
    setBranchId(selected?.id || '');
    setBranchSlug(selected?.slug || '');
    setBranchName(selected?.name || '');
    resetSubjectSelection();
  };

  const handleSemesterChange = (selectedVal: string) => {
    if (selectedVal === 'multiple') {
      setIsMultipleSemesters(true);
      setSemester('');
      setSelectedSemesters([]);
      resetSubjectSelection();
      return;
    }
    setIsMultipleSemesters(false);
    setSemester(selectedVal);
    resetSubjectSelection();
  };

  // Subject mode selection effect removed to allow catalog subjects in multi-mode

  const handleSubjectChange = (selectedId: string) => {
    if (selectedId === '__custom') {
      setSubjectMode('custom');
      setSubjectOfferingId('');
      setSubjectName('');
      setSubjectCode('');
      return;
    }
    const selected = catalogSubjects.find((subject) => subject.id === selectedId);
    setSubjectMode('catalog');
    setSubjectOfferingId(selected?.id || '');
    setSubjectName(selected?.subjectName || '');
    setSubjectCode(selected?.subjectCode || '');
  };

  const handlePublish = async (status: 'draft' | 'published') => {
    try {
      if (!file) {
        alert('Please upload a PDF file.');
        return;
      }

      setIsPublishing(true);
      
      let processedFile = file;
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setIsCompressing(true);
        processedFile = await compressPdfFile(file, (progress, msg) => {
          setCompressionProgress(`${Math.round(progress)}% - ${msg}`);
        });
        setIsCompressing(false);
      }

      const ids: string[] = [];
      let lastBlogId: string | null = null;

      const targetBranches = isMultipleBranches ? selectedBranches : [branchId];
      const targetSemesters = isMultipleSemesters ? selectedSemesters.map(Number) : [Number(semester)];

      for (const bId of targetBranches) {
        for (const sem of targetSemesters) {
          const formData = new FormData();
          formData.append('title', title || `${subjectName} Material`);
          formData.append('material_type', 'study-material');
          formData.append('status', status);
          formData.append('file', processedFile);
          
            if (subjectMode === 'catalog' && subjectOfferingId && !isMultipleBranches && !isMultipleSemesters) {
              formData.append('subject_id', subjectOfferingId);
            } else {
              formData.append('manual_subject_name', subjectName);
              formData.append('branch_ids', bId);
              formData.append('semesters', String(sem));
              formData.append('subject_code', subjectCode);
            }

            if (author.trim()) {
              formData.append('author', author.trim());
            }
            if (description.trim()) formData.append('description', description.trim());
            if (materialKind.trim()) formData.append('material_kind', materialKind.trim());
            if (unitNo.trim()) formData.append('unit_no', unitNo.trim());
            if (topic.trim()) formData.append('topic', topic.trim());
            if (chapter.trim()) formData.append('chapter', chapter.trim());

            // Create blog only for the first combination to avoid duplicating the same blog post
          if (createBlog && linkBlogMode === 'new' && ids.length === 0) {
            if (!blogContent.trim()) {
              alert('Blog content is required when the linked blog option is enabled.');
              setIsPublishing(false);
              return;
            }
            formData.append('create_blog', 'true');
            formData.append('blog_title', blogTitle || title || `${subjectName} Material`);
            formData.append('blog_content', blogContent);
            formData.append('blog_category', 'Study Material');
            formData.append('blog_status', blogStatus);
          }

          if (createBlog && linkBlogMode === 'existing' && selectedBlogId) {
            formData.append('blog_id', selectedBlogId);
          } else if (lastBlogId) {
            formData.append('blog_id', lastBlogId);
          }

          const res = await apiClient.addAdminMaterial(formData);
          ids.push(res.id);
          if (res.blog_id) {
            lastBlogId = res.blog_id;
          }

          if (createBlog && linkBlogMode === 'existing' && selectedBlogId && ids.length === 1) {
            await apiClient.updateBlog(selectedBlogId, { related_document_id: res.id });
            lastBlogId = selectedBlogId;
          }
        }
      }

      setUploadedMaterialIds(ids);
      if (lastBlogId) {
        setUploadedBlogId(lastBlogId);
      }
    } catch (error: any) {
      alert(`Failed to save study material: ${error?.message || error}`);
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (ids: string[]) => {
    const isMultiple = ids.length > 1;
    const confirmMsg = isMultiple 
      ? `Are you sure you want to delete this study material for all ${ids.length} selected branches? This will permanently delete their database records and storage files.`
      : 'Are you sure you want to delete this study material? This will permanently delete the database record and the storage file.';
    if (!confirm(confirmMsg)) return;
    try {
      setIsDeleting(ids[0]);
      await Promise.all(ids.map(id => apiClient.deleteAdminMaterial(id)));
      await loadMaterials();
    } catch (error) {
      alert('Failed to delete material');
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected study materials? This will permanently delete their database records and storage files.`)) return;
    try {
      setIsBulkDeleting(true);
      await Promise.all(selectedIds.map(id => apiClient.deleteAdminMaterial(id)));
      setSelectedIds([]);
      await loadMaterials();
    } catch (error) {
      alert('Failed to delete some of the selected study materials');
      console.error(error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleToggleVisibility = async (ids: string[], currentStatus: string) => {
    const newStatus = currentStatus === 'approved' ? 'draft' : 'approved';
    try {
      setIsDeleting(ids[0]);
      for (const id of ids) {
        await apiClient.updateAdminMaterial(id, { approval_status: newStatus });
      }
      await loadMaterials();
    } catch (error) {
      alert('Failed to update study material visibility status');
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Filtering materials
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (m.subject_name && m.subject_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Check if the material references the branch id
    const matchesBranch = !filterBranch || m.branch_id === filterBranch;

    const matchesSemester = !filterSemester || String(m.semester_no) === filterSemester;

    return matchesSearch && matchesBranch && matchesSemester;
  });

  const groupedMaterials = React.useMemo(() => {
    if (filterBranch !== '') {
      return filteredMaterials.map(m => ({
        ...m,
        ids: [m.id],
        branches: [{ id: m.branch_id, name: m.branch_name, shortName: m.branch_short_names, slug: m.branch_slug }]
      }));
    }

    const groups: { [key: string]: any } = {};
    for (const m of filteredMaterials) {
      const key = `${m.title}_${m.subject_name || ''}`;
      if (!groups[key]) {
        groups[key] = {
          ...m,
          ids: [m.id],
          branches: [],
          semesters: []
        };
      } else {
        groups[key].ids.push(m.id);
      }

      const branchInfo = {
        id: m.branch_id,
        name: m.branch_name,
        shortName: m.branch_short_names,
        slug: m.branch_slug
      };
      if (!groups[key].branches.some((b: any) => b.id === branchInfo.id)) {
        groups[key].branches.push(branchInfo);
      }
      
      if (m.semester_no !== undefined && m.semester_no !== null && !groups[key].semesters.includes(m.semester_no)) {
        groups[key].semesters.push(m.semester_no);
      }
    }
    return Object.values(groups);
  }, [filteredMaterials, filterBranch]);

  const renderStepper = () => (
    <div className="flex items-center justify-between mb-8 px-4 relative max-w-md mx-auto">
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -z-10 -translate-y-1/2" />
      {[
        { num: 1, label: 'Details' },
        { num: 2, label: 'Upload' }
      ].map((s) => (
        <div key={s.num} className="flex flex-col items-center bg-surface px-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${
            step >= s.num ? 'bg-primary text-white' : 'bg-surface-secondary text-muted border border-border'
          }`}>
            {s.num}
          </div>
          <span className={`text-xs font-semibold ${step >= s.num ? 'text-text' : 'text-muted'}`}>{s.label}</span>
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    const isStep1Valid = (() => {
      if (isMultipleBranches && selectedBranches.length === 0) return false;
      if (!isMultipleBranches && !branchId) return false;
      
      if (isMultipleSemesters && selectedSemesters.length === 0) return false;
      if (!isMultipleSemesters && !semester) return false;
      
      if (!subjectName) return false;
      
      return true;
    })();

    switch(step) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text">Branch</label>
                <div className="relative">
                  <select value={isMultipleBranches ? 'multiple' : branchId} onChange={e => handleBranchChange(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm appearance-none">
                    <option value="">Select Branch</option>
                    {branches.map(branch => (
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
                  <select value={isMultipleSemesters ? 'multiple' : semester} onChange={e => { handleSemesterChange(e.target.value); }} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm appearance-none">
                    <option value="">Select Semester</option>
                    {SEMESTERS.map(s => <option key={s} value={String(s)}>Semester {formatSemester(s)}</option>)}
                    <option value="multiple">Multiple Semesters</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted">▼</div>
                </div>
              </div>

              {isMultipleBranches && (
                <div className="space-y-2 md:col-span-2 bg-surface-secondary border border-border p-4 rounded-xl animate-fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-text block">Select Departments / Branches</label>
                    <label className="flex items-center gap-2 text-xs text-primary font-bold cursor-pointer hover:opacity-80 transition-opacity">
                      <input
                        type="checkbox"
                        checked={branches.length > 0 && selectedBranches.length === branches.length}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedBranches(branches.map(branch => branch.id));
                          } else {
                            setSelectedBranches([]);
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <span>Select All</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {branches.map(branch => (
                      <label key={branch.id} className="flex items-center gap-2 text-xs text-text font-medium cursor-pointer p-1.5 hover:bg-background rounded-lg border border-transparent hover:border-border transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedBranches.includes(branch.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedBranches(prev => [...prev, branch.id]);
                            } else {
                              setSelectedBranches(prev => prev.filter(id => id !== branch.id));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                        />
                        <span>{branch.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {isMultipleSemesters && (
                <div className="space-y-2 md:col-span-2 bg-surface-secondary border border-border p-4 rounded-xl animate-fade-in">
                  <label className="text-xs font-bold text-text block mb-2">Select Semesters</label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {SEMESTERS.map(s => (
                      <label key={s} className="flex items-center justify-center gap-1.5 text-xs text-text font-medium cursor-pointer p-1.5 hover:bg-background rounded-lg border border-border transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedSemesters.includes(s)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedSemesters(prev => [...prev, s]);
                            } else {
                              setSelectedSemesters(prev => prev.filter(val => val !== s));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                        />
                        <span>Sem {s}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-text">Subject</label>
                <div className="relative">
                  {(() => {
                    const isBranchSelected = isMultipleBranches ? selectedBranches.length > 0 : !!branchId;
                    const isSemesterSelected = isMultipleSemesters ? selectedSemesters.length > 0 : !!semester;
                    const dropdownDisabled = !isBranchSelected || !isSemesterSelected || isCatalogLoading;
                    const placeholderText = isCatalogLoading
                      ? 'Loading subjects...'
                      : (!isBranchSelected || !isSemesterSelected)
                        ? 'Select branch & semester first'
                        : 'Select Subject';
                    return (
                      <select
                        value={subjectMode === 'custom' ? '__custom' : subjectOfferingId}
                        onChange={e => handleSubjectChange(e.target.value)}
                        disabled={dropdownDisabled}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm appearance-none disabled:opacity-60"
                      >
                        <option value="">{placeholderText}</option>
                        {catalogSubjects.map(subject => (
                          <option key={subject.id} value={subject.id}>
                            {subject.subjectName}{subject.subjectCode ? ` (${subject.subjectCode})` : ''}
                          </option>
                        ))}
                        <option value="__custom">Add custom subject</option>
                      </select>
                    );
                  })()}
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted">▼</div>
                </div>
              </div>

              {(() => {
                const isBranchSelected = isMultipleBranches ? selectedBranches.length > 0 : !!branchId;
                const isSemesterSelected = isMultipleSemesters ? selectedSemesters.length > 0 : !!semester;
                const showCustomSubject = subjectMode === 'custom' || (!isCatalogLoading && isBranchSelected && isSemesterSelected && catalogSubjects.length === 0);
                return showCustomSubject && (
                  <div className="space-y-2 md:col-span-2 animate-fade-in">
                    <label className="text-xs font-bold text-text">Custom Subject</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g. EM-2" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted" />
                      <input type="text" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} placeholder="Subject code (optional)" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted" />
                    </div>
                  </div>
                );
              })()}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Unit 3 - Graph Algorithms"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted font-bold"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-text">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. A comprehensive guide to Graph Algorithms..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted resize-y min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text">Material Kind</label>
                <div className="relative">
                  <select
                    value={materialKind}
                    onChange={e => setMaterialKind(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm appearance-none"
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
                  value={unitNo}
                  onChange={e => setUnitNo(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text">Chapter</label>
                <input
                  type="text"
                  value={chapter}
                  onChange={e => setChapter(e.target.value)}
                  placeholder="e.g. Trees and Graphs"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Dijkstra's Algorithm"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text">Faculty / Author</label>
                <input
                  type="text"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  placeholder="e.g. Dr. John Doe (Optional)"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted font-bold"
                />
              </div>

            </div>
            
            <div className="flex justify-end mt-8">
              <button 
                onClick={() => setStep(2)}
                disabled={!isStep1Valid}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <label className="border-2 border-dashed border-border rounded-xl bg-background p-12 flex flex-col items-center justify-center text-center hover:bg-surface-secondary transition-colors cursor-pointer group relative block">
              <input type="file" accept="application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setFile(e.target.files?.[0] || null)} />
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-bold text-text mb-1">
                {file ? file.name : 'Drag & drop PDF here'}
              </p>
              <p className="text-sm text-muted">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'or click to browse from your computer (Max 100MB)'}
              </p>
            </label>

            <div className="bg-surface-secondary rounded-xl p-6 border border-border">
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <h4 className="font-bold text-text">Add linked blog post</h4>
                  <p className="text-xs text-muted font-semibold mt-1">Optional: link a blog page with this uploaded file.</p>
                </div>
                <input
                  type="checkbox"
                  checked={createBlog}
                  onChange={e => setCreateBlog(e.target.checked)}
                  className="h-5 w-5 accent-primary"
                />
              </label>

              {createBlog && (
                <div className="mt-5 space-y-4">
                  <div className="flex gap-4 border-b border-border pb-3">
                    <label className="flex items-center gap-2 text-sm text-text font-bold cursor-pointer">
                      <input 
                        type="radio" 
                        name="linkBlogMode" 
                        checked={linkBlogMode === 'new'} 
                        onChange={() => setLinkBlogMode('new')}
                        className="accent-primary"
                      />
                      Create New Blog
                    </label>
                    <label className="flex items-center gap-2 text-sm text-text font-bold cursor-pointer">
                      <input 
                        type="radio" 
                        name="linkBlogMode" 
                        checked={linkBlogMode === 'existing'} 
                        onChange={() => setLinkBlogMode('existing')}
                        className="accent-primary"
                      />
                      Select Existing Blog
                    </label>
                  </div>

                  {linkBlogMode === 'existing' ? (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted uppercase">Choose Blog</label>
                      <div className="relative">
                        <select 
                          value={selectedBlogId} 
                          onChange={e => setSelectedBlogId(e.target.value)} 
                          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm appearance-none"
                        >
                          <option value="">Select an existing blog post</option>
                          {blogsList.map(blog => (
                            <option key={blog.id} value={blog.id}>
                              {blog.title} ({blog.status})
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted">▼</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={blogTitle}
                        onChange={e => setBlogTitle(e.target.value)}
                        placeholder="Blog title (defaults to document title)"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted"
                      />
                      <textarea
                        value={blogContent}
                        onChange={e => setBlogContent(e.target.value)}
                        placeholder="Write the blog content or summary in Markdown..."
                        rows={5}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted resize-y"
                      />
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted">Blog status</span>
                        <select
                          value={blogStatus}
                          onChange={e => setBlogStatus(e.target.value as 'draft' | 'published')}
                          className="bg-background border border-border rounded-xl px-3 py-2 text-text focus:border-primary outline-none text-sm"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="bg-surface-secondary rounded-xl p-6 border border-border mt-6">
              <h4 className="font-bold text-text text-lg mb-4">Review Details</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><strong className="text-text">Title:</strong> {title || 'Not provided'}</li>
                <li>
                  <strong className="text-text">Path:</strong>{' '}
                  {isMultipleBranches 
                    ? `[${selectedBranches.map(id => branches.find(b => b.id === id)?.name || id).join(', ')}]` 
                    : branchName
                  }{' '}
                  {'>'}{' '}
                  {isMultipleSemesters 
                    ? `[Semesters: ${selectedSemesters.sort().join(', ')}]` 
                    : `Sem ${semester}`
                  }{' '}
                  {'>'} {subjectName}
                </li>
                <li><strong className="text-text">File:</strong> {file ? file.name : 'None selected'}</li>
              </ul>
            </div>

            <div className="flex justify-between mt-8">
              <button 
                onClick={() => setStep(1)}
                disabled={isPublishing}
                className="bg-surface-secondary hover:bg-border text-text px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button 
                onClick={() => handlePublish('published')}
                disabled={!file || isPublishing || isCompressing}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isCompressing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {compressionProgress || 'Compressing PDF...'}
                  </>
                ) : isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Publish Study Material
                  </>
                )}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const formView = (
    <div className={`${embedded ? '' : 'bg-surface border border-border rounded-2xl shadow-sm overflow-hidden mt-6'}`}>
      {!embedded && (
        <div className="p-6 border-b border-border flex items-center justify-between bg-surface-secondary/50">
          <h3 className="text-lg font-bold text-text">Upload Study Material</h3>
          <button 
            onClick={() => {
              resetForm();
              setIsCreating(false);
            }}
            className="text-muted hover:text-text transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      )}
      <div className={`${embedded ? '' : 'p-6 md:p-8'}`}>
        {uploadedMaterialIds.length > 0 ? (
          <div className="text-center py-12 px-4 animate-fade-in max-w-md mx-auto space-y-6">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto border border-success/20">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl font-bold text-text">Upload Successful!</h4>
              <p className="text-sm text-muted">
                {uploadedMaterialIds.length > 1
                  ? `Successfully uploaded and published ${uploadedMaterialIds.length} files to the database and storage.`
                  : 'The study material has been uploaded and published to the database and storage.'
                }
              </p>
            </div>
            {!showLinks ? (
              <button
                onClick={() => setShowLinks(true)}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold transition-all shadow-sm"
              >
                View Uploaded Material
              </button>
            ) : (
              <>
                <div className="bg-surface-secondary border border-border rounded-xl p-4 flex flex-col gap-2 max-h-48 overflow-y-auto w-full animate-fade-in">
                  <span className="text-xs font-semibold text-muted text-center block">YOUR PAGES ARE LIVE AT:</span>
                  {uploadedMaterialIds.map((mId) => (
                    <a 
                      key={mId}
                      href={`/materials/${mId}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline font-bold text-sm break-all flex items-center justify-between p-1.5 border-b border-border last:border-0 hover:bg-background rounded-lg transition-colors"
                    >
                      <span className="truncate text-left font-mono">/materials/{mId}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 ml-1.5" />
                    </a>
                  ))}
                </div>
                {uploadedBlogId && (
                  <a 
                    href={`/blogs/${uploadedBlogId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#0F172A] text-white py-3 rounded-xl font-bold hover:bg-[#1E293B] transition-colors border border-slate-700/50 block text-center animate-fade-in"
                  >
                    View Linked Blog Post
                  </a>
                )}
              </>
            )}
            <button 
              onClick={resetForm}
              className="w-full bg-surface-secondary hover:bg-border text-text py-3 rounded-xl font-bold transition-all shadow-sm border border-border"
            >
              Upload Another File
            </button>
          </div>
        ) : (
          <>
            {renderStepper()}
            {renderStepContent()}
          </>
        )}
      </div>
    </div>
  );

  if (isCreating) return formView;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight">Manage Study Materials</h2>
          <p className="text-sm text-muted mt-1 font-semibold">View, search, and manage all study materials in D1/R2.</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-red-600 hover:bg-red-750 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
            >
              {isBulkDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <PlusCircle className="h-4 w-4" />
            Upload Study Material
          </button>
        </div>
      </div>

      {/* Top Live Website Study Notes Visibility Control Switch Card */}
      <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
            siteControl.showStudyNotes ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
          }`}>
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-text">Study Notes Section on Live Website</h3>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                siteControl.showStudyNotes ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
              }`}>
                {siteControl.showStudyNotes ? 'LIVE / ENABLED' : 'HIDDEN FROM PUBLIC'}
              </span>
            </div>
            <p className="text-xs text-muted font-semibold mt-0.5">
              Controls whether students can access Study Notes & Lecture Materials across all subject & semester pages.
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleMaterialsSection}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
            siteControl.showStudyNotes
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
          {siteControl.showStudyNotes ? (
            <>
              <Eye className="h-4 w-4" /> Section is Visible (Click to Hide)
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" /> Section is Hidden (Click to Show)
            </>
          )}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="w-full md:w-96 flex items-center bg-background border border-border rounded-xl px-4 py-2.5 focus-within:border-primary transition-all">
          <Search className="h-4 w-4 text-muted mr-2" />
          <input 
            type="text" 
            placeholder="Search by title or subject..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-text placeholder-muted w-full"
          />
        </div>
        
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3 items-center">
          <div className="w-full sm:w-44 relative">
            <select 
              value={filterBranch} 
              onChange={e => setFilterBranch(e.target.value)} 
              className="w-full bg-background border border-border rounded-xl pl-9 pr-8 py-2.5 text-text outline-none focus:border-primary text-sm appearance-none"
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs pointer-events-none">▼</div>
          </div>

          <div className="w-full sm:w-40 relative">
            <select 
              value={filterSemester} 
              onChange={e => setFilterSemester(e.target.value)} 
              className="w-full bg-background border border-border rounded-xl pl-9 pr-8 py-2.5 text-text outline-none focus:border-primary text-sm appearance-none"
            >
              <option value="">All Semesters</option>
              {SEMESTERS.map(s => (
                <option key={s} value={String(s)}>Semester {formatSemester(s)}</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs pointer-events-none">▼</div>
          </div>
        </div>
      </div>

      {/* Materials Table/List */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="text-sm text-muted font-bold">Loading study materials...</span>
          </div>
        ) : groupedMaterials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <BookOpen className="h-12 w-12 text-muted mb-3" />
            <h3 className="text-lg font-bold text-text mb-1">No study materials found</h3>
            <p className="text-sm text-muted max-w-sm font-semibold">Try adjusting your filters or upload a new study material using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-secondary border-b border-border">
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={groupedMaterials.length > 0 && groupedMaterials.every(m => m.ids.every((id: string) => selectedIds.includes(id)))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(groupedMaterials.flatMap(m => m.ids));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Semester</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Status on Website</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Upload Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {groupedMaterials.map((m) => {
                  const isRowSelected = m.ids.every((id: string) => selectedIds.includes(id));
                  const isRowDeleting = isDeleting && m.ids.includes(isDeleting);
                  const isApproved = (m.approval_status || 'approved') === 'approved';
                  return (
                    <tr key={m.id} className={`hover:bg-surface-secondary/40 transition-colors ${isRowSelected ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                      <td className="px-6 py-4 w-12">
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(prev => {
                                const next = [...prev];
                                m.ids.forEach((id: string) => {
                                  if (!next.includes(id)) next.push(id);
                                });
                                return next;
                              });
                            } else {
                              setSelectedIds(prev => prev.filter(id => !m.ids.includes(id)));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 border border-primary/20">
                            <FileText className="h-4.5 w-4.5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-sm text-text block truncate" title={m.title}>{m.title}</span>
                            <span className="text-[10px] font-mono text-muted truncate block max-w-xs">{m.storage_key}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-text">
                        <div className="flex flex-wrap gap-1">
                          {m.branches.length >= branches.length && branches.length > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                              All Branches
                            </span>
                          ) : (
                            m.branches.map((b: any) => (
                              <span 
                                key={b.id} 
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20" 
                                title={b.name}
                              >
                                {b.shortName || b.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-text">
                        {m.semesters && m.semesters.length > 0 ? `Sem ${m.semesters.sort().map((s: number) => formatSemester(s)).join(', ')}` : "Unsorted"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-text">
                        {m.subject_name || "General"}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleVisibility(m.ids, m.approval_status || 'approved')}
                          disabled={!!isRowDeleting}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                          title="Click to toggle document visibility on live website (retains record safely in database)"
                        >
                          {isApproved ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              <span>Visible on Website</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                              <span>Hidden from Site</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingGroup(m)}
                            className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                            title="Edit Study Material"
                          >
                            <Edit className="h-4.5 w-4.5" />
                          </button>
                          <a 
                            href={`/materials/${m.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                            title="View Study Material"
                          >
                            <ExternalLink className="h-4.5 w-4.5" />
                          </a>
                          <button
                            onClick={() => handleDelete(m.ids)}
                            disabled={!!isRowDeleting}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50"
                            title="Delete Study Material"
                          >
                            {isRowDeleting ? (
                              <Loader2 className="h-4.5 w-4.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-4.5 w-4.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <EditMaterialModal
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        materialId={editingGroup?.ids[0] || ''}
        groupIds={editingGroup?.ids || []}
        initialBranches={editingGroup?.branches.map((b: any) => b.id) || []}
        initialSemesters={editingGroup?.semesters || []}
        onSave={loadMaterials}
      />
    </div>
  );
};

export default ManageStudyMaterialsUI;
