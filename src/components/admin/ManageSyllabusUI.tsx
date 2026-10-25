import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { compressPdfFile } from '../../utils/pdfCompressor';
import { 
  Book, Save, Send, PlusCircle, ArrowRight, ArrowLeft, CheckCircle, ExternalLink, Trash2, Search, Filter, Loader2, BookOpen, Edit, Upload, AlertCircle, Eye, EyeOff, CheckCircle2, XCircle, ShieldCheck,
  Zap, Building2, GraduationCap, Calendar, Hash, Info, ChevronDown, Sparkles, ClipboardList, Link, Settings, Check, RefreshCw, X, Plus, History, Clock, FileText, AlertTriangle, Layers, Database, Cloud
} from 'lucide-react';
import { Branch, SubjectOffering } from '../../types';
import { SEMESTERS, formatSemester } from '../../constants';
import EditMaterialModal from './EditMaterialModal';
import { usePreventTabClose } from '../../hooks/usePreventTabClose';
import { getGtuOfficialSyllabusUrl } from '../../utils/gtuSyllabus';
import { getSiteControlState, saveSiteControlState } from '../../utils/siteControl';
import { motion, AnimatePresence } from 'framer-motion';

interface ManageSyllabusUIProps {
  embedded?: boolean;
  initialSearchQuery?: string;
}

const ManageSyllabusUI: React.FC<ManageSyllabusUIProps> = ({ embedded = false, initialSearchQuery = '' }) => {
  const [isCreating, setIsCreating] = useState(embedded);
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [catalogSubjects, setCatalogSubjects] = useState<SubjectOffering[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [uploadedMaterialIds, setUploadedMaterialIds] = useState<string[]>([]);
  const [showLinks, setShowLinks] = useState(false);

  // Site Control State
  const [siteControl, setSiteControl] = useState(getSiteControlState());

  const handleToggleSyllabusSection = () => {
    const updated = saveSiteControlState({ showSyllabus: !siteControl.showSyllabus });
    setSiteControl(updated);
  };

  // Materials List State
  const [materials, setMaterials] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [filterBranch, setFilterBranch] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
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
  const [versionLabel, setVersionLabel] = useState('');
  const [syllabusYear, setSyllabusYear] = useState('');

  // Multiple Selection State
  const [isMultipleBranches, setIsMultipleBranches] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [isMultipleSemesters, setIsMultipleSemesters] = useState(false);
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<string>('');
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    savedPercentage: number;
  } | null>(null);

  // Bulk Upload States
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk' | 'codes'>('single');
  const [bulkFiles, setBulkFiles] = useState<{ 
    file: File; 
    subjectName: string; 
    subjectCode: string; 
    status: 'pending' | 'compressing' | 'uploading' | 'success' | 'error'; 
    errorMsg?: string; 
    progress?: string; 
    compressedSize?: number;
    savedPercentage?: number;
  }[]>([]);
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);
  const [bulkWefYear, setBulkWefYear] = useState('');
  const [bulkSyllabusYear, setBulkSyllabusYear] = useState('');

  // Auto-Generator by Subject Codes State
  const [codesInput, setCodesInput] = useState('');
  const [isCodesMultipleBranches, setIsCodesMultipleBranches] = useState(false);
  const [codesSelectedBranches, setCodesSelectedBranches] = useState<string[]>([]);
  const [codesSingleBranchId, setCodesSingleBranchId] = useState('');
  const [isCodesMultipleSemesters, setIsCodesMultipleSemesters] = useState(false);
  const [codesSelectedSemesters, setCodesSelectedSemesters] = useState<number[]>([]);
  const [codesSingleSemester, setCodesSingleSemester] = useState('');
  const [codesWefYear, setCodesWefYear] = useState('2024-25');
  const [isCodesPublishing, setIsCodesPublishing] = useState(false);
  const [codesProgress, setCodesProgress] = useState<{ total: number; done: number; current?: string } | null>(null);

  // Advanced Wizard & History State
  const [autoStep, setAutoStep] = useState(1);
  const [autoBranchSearch, setAutoBranchSearch] = useState('');
  const [autoUploadHistory, setAutoUploadHistory] = useState<any[]>([]);
  const [autoSuccessResult, setAutoSuccessResult] = useState<{ total: number; success: number; failed: number; timeSec: string } | null>(null);
  const [subjectSearchInput, setSubjectSearchInput] = useState('');

  useEffect(() => {
    try {
      const historyStr = localStorage.getItem('syllabus_bulk_upload_history');
      if (historyStr) {
        setAutoUploadHistory(JSON.parse(historyStr));
      }
    } catch (e) {
      console.error('Failed to load syllabus upload history:', e);
    }
  }, []);

  const saveBulkUploadHistory = (newEntry: any) => {
    try {
      setAutoUploadHistory(prev => {
        const updated = [newEntry, ...prev].slice(0, 50);
        localStorage.setItem('syllabus_bulk_upload_history', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error('Failed to save syllabus upload history:', e);
    }
  };

  usePreventTabClose(isPublishing || isCompressing || isBulkPublishing || isCodesPublishing);

  // File State
  const [file, setFile] = useState<File | null>(null);
  const [createBlog, setCreateBlog] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogStatus, setBlogStatus] = useState<'draft' | 'published'>('draft');

  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);

  const [subjectMappings, setSubjectMappings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/subject_codes.json')
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json() as Promise<Record<string, string>>;
      })
      .then(data => setSubjectMappings(data))
      .catch(err => console.error('Failed to load subject mappings:', err));
  }, []);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds([]);
  }, [searchQuery, filterBranch, filterSemester, filterStatus]);

  useEffect(() => {
    let isActive = true;
    apiClient.getBranches()
      .then((data) => {
        if (isActive) setBranches(data);
      })
      .catch((error) => console.error('Failed to fetch branches:', error));
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
      const data = await apiClient.getAdminMaterials('syllabus');
      setMaterials(data || []);
      setSelectedIds([]); // Clear selection when data changes
    } catch (error) {
      console.error('Failed to load syllabus list:', error);
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
    setVersionLabel('');
    setSyllabusYear('');
    setCreateBlog(false);
    setBlogTitle('');
    setBlogContent('');
    setBlogStatus('draft');
    setBulkFiles([]);
    setIsBulkPublishing(false);
    setBulkWefYear('');
    setBulkSyllabusYear('');
    setUploadMode('single');
    setCompressionStats(null);
    setCodesInput('');
    setIsCodesMultipleBranches(false);
    setCodesSelectedBranches([]);
    setCodesSingleBranchId('');
    setIsCodesMultipleSemesters(false);
    setCodesSelectedSemesters([]);
    setCodesSingleSemester('');
    setCodesWefYear('2024-25');
    setIsCodesPublishing(false);
    setCodesProgress(null);
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
      setIsPublishing(true);

      let processedFile = file;
      let stats: typeof compressionStats = null;
      if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
        setIsCompressing(true);
        processedFile = await compressPdfFile(file, (progress, msg) => {
          setCompressionProgress(`${Math.round(progress)}% - ${msg}`);
        });
        setIsCompressing(false);
        stats = {
          originalSize: file.size,
          compressedSize: processedFile.size,
          savedPercentage: ((file.size - processedFile.size) / file.size) * 100
        };
      }
      setCompressionStats(stats);

      const ids: string[] = [];
      let lastBlogId: string | null = null;

      const targetBranches = isMultipleBranches ? selectedBranches : [branchId];
      const targetSemesters = isMultipleSemesters ? selectedSemesters.map(Number) : [Number(semester)];

      for (const bId of targetBranches) {
        for (const sem of targetSemesters) {
          const formData = new FormData();
          formData.append('title', title || `${subjectName} Syllabus`);
          formData.append('material_type', 'syllabus');
          formData.append('status', status);
          if (processedFile) {
            formData.append('file', processedFile);
          } else if (subjectCode) {
            formData.append('file_url', getGtuOfficialSyllabusUrl(subjectCode));
          }
          
          if (subjectMode === 'catalog' && subjectOfferingId && !isMultipleBranches && !isMultipleSemesters) {
            formData.append('subject_id', subjectOfferingId);
          } else {
            formData.append('manual_subject_name', subjectName);
            formData.append('branch_ids', bId);
            formData.append('semesters', String(sem));
            formData.append('subject_code', subjectCode);
          }
          formData.append('version_label', versionLabel);
          formData.append('syllabus_year', syllabusYear);

          if (createBlog && ids.length === 0) {
            if (!blogContent.trim()) {
              alert('Blog content is required when the linked blog option is enabled.');
              setIsPublishing(false);
              return;
            }
            formData.append('create_blog', 'true');
            formData.append('blog_title', blogTitle || title || `${subjectName} Syllabus`);
            formData.append('blog_content', blogContent);
            formData.append('blog_category', 'Syllabus');
            formData.append('blog_status', blogStatus);
          }

          if (lastBlogId) {
            formData.append('blog_id', lastBlogId);
          }

          const res = await apiClient.addAdminMaterial(formData);
          ids.push(res.id);
          if (res.blog_id) {
            lastBlogId = res.blog_id;
          }
        }
      }

      setUploadedMaterialIds(ids);
    } catch (error: any) {
      alert(`Failed to save syllabus: ${error?.message || error}`);
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  };

  const cleanSubjectFromFilename = (filename: string): string => {
    const name = filename.replace(/\.pdf$/i, '');
    let cleaned = name
      .replace(/\b(cse|it|ece|ee|me|ce|computer|information|electrical|ece|mechanical|civil)\b/gi, '')
      .replace(/sem(?:ester)?\s*[1-8]/gi, '')
      .replace(/\b(pyq|endsem|midsem|paper|exam|syllabus|notes|studymaterial|study-material|tutorial)\b/gi, '')
      .replace(/\b(20\d{2})\b/g, '')
      .replace(/\b(winter|summer|dec|may|jun|jan|spring)\b/gi, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getSubjectShortName = (subjectName: string): string => {
    const parts = subjectName.split(/\s+/);
    const cleanParts = parts.filter(part => !/\d/.test(part));
    if (cleanParts.length > 0) {
      return cleanParts.join(' ').trim();
    }
    return subjectName;
  };

  const extractSubjectCode = (filename: string): string => {
    const name = filename.replace(/\.pdf$/i, '');
    const match = name.match(/\b([A-Z]{2,4}[-\s]?\d{3,}[A-Z\d]*|[A-Z]{2}\d{2}[A-Z]\d{5})\b/i);
    return match ? match[1].toUpperCase() : '';
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    const newBulkFiles = filesArray.map(f => {
      const code = extractSubjectCode(f.name).toUpperCase().trim();
      const mappedName = subjectMappings[code];
      return {
        file: f,
        subjectName: mappedName || cleanSubjectFromFilename(f.name) || 'General Subject',
        subjectCode: code,
        status: 'pending' as const
      };
    });
    setBulkFiles(prev => [...prev, ...newBulkFiles]);
  };

  const handleBulkPublish = async () => {
    if (selectedBranches.length === 0) {
      alert('Please select at least one branch.');
      return;
    }
    if (selectedSemesters.length === 0) {
      alert('Please select at least one semester.');
      return;
    }
    if (bulkFiles.length === 0) {
      alert('Please select at least one syllabus PDF file.');
      return;
    }

    setIsBulkPublishing(true);

    const ids: string[] = [];

    for (let i = 0; i < bulkFiles.length; i++) {
      const item = bulkFiles[i];
      if (item.status === 'success') continue;

      try {
        setBulkFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'compressing' } : f));
        
        let processedFile = item.file;
        let compressedSize: number | undefined;
        let savedPercentage: number | undefined;
        if (item.file.type === 'application/pdf' || item.file.name.toLowerCase().endsWith('.pdf')) {
          processedFile = await compressPdfFile(item.file, (progress, msg) => {
            setBulkFiles(prev => prev.map((f, idx) => idx === i ? { ...f, progress: `${Math.round(progress)}%` } : f));
          });
          compressedSize = processedFile.size;
          savedPercentage = ((item.file.size - processedFile.size) / item.file.size) * 100;
        }

        setBulkFiles(prev => prev.map((f, idx) => idx === i ? { 
          ...f, 
          status: 'uploading',
          compressedSize,
          savedPercentage
        } : f));

        const targetBranches = selectedBranches;
        const targetSemesters = selectedSemesters.map(Number);

        for (const bId of targetBranches) {
          for (const sem of targetSemesters) {
            const formData = new FormData();
            const docTitle = item.file.name.replace(/\.pdf$/i, '').trim();
            
            formData.append('title', docTitle);
            formData.append('material_type', 'syllabus');
            formData.append('status', 'published');
            formData.append('file', processedFile);
            formData.append('manual_subject_name', item.subjectName);
            if (item.subjectCode) {
              formData.append('subject_code', item.subjectCode);
            }
            formData.append('branch_ids', bId);
            formData.append('semesters', String(sem));
            formData.append('version_label', bulkWefYear);
            formData.append('syllabus_year', bulkSyllabusYear);

            const res = await apiClient.addAdminMaterial(formData);
            ids.push(res.id);
          }
        }

        setBulkFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'success' } : f));
      } catch (err: any) {
        console.error(err);
        setBulkFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', errorMsg: err.message || String(err) } : f));
      }
    }

    if (ids.length > 0) {
      setUploadedMaterialIds(prev => [...prev, ...ids]);
    }
    setIsBulkPublishing(false);
  };

  const renderBulkUploadContent = () => {
    const isReadyToPublish = selectedBranches.length > 0 && selectedSemesters.length > 0 && bulkFiles.length > 0;

    return (
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-surface border border-border p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-text uppercase tracking-wider mb-2">1. Select Branches & Semesters</h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted block">Departments / Branches</label>
                  <label className="flex items-center gap-2 text-xs text-primary font-bold cursor-pointer hover:opacity-80 transition-opacity">
                    <input
                      type="checkbox"
                      checked={branches.length > 0 && selectedBranches.length === branches.length}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedBranches(branches.map(b => b.id));
                        } else {
                          setSelectedBranches([]);
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                    <span>Select All</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-surface-secondary/50 p-3 rounded-xl border border-border">
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
                        className="h-4 w-4 rounded border-gray-355 text-primary focus:ring-primary accent-primary"
                      />
                      <span>{branch.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted block">Semesters</label>
                <div className="grid grid-cols-4 gap-2 bg-surface-secondary/50 p-3 rounded-xl border border-border">
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
                        className="h-4 w-4 rounded border-gray-355 text-primary focus:ring-primary accent-primary"
                      />
                      <span>Sem {s}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text">WEF Academic Year (e.g. 2025-26)</label>
                <input
                  type="text"
                  list="wef-years"
                  value={bulkWefYear}
                  onChange={e => {
                    setBulkWefYear(e.target.value);
                    const match = e.target.value.match(/^(\d{4})/);
                    if (match) {
                      setBulkSyllabusYear(match[1]);
                    } else {
                      setBulkSyllabusYear('');
                    }
                  }}
                  placeholder="e.g. 2025-26"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-surface border border-border p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-text uppercase tracking-wider mb-2">2. Upload Syllabus Files</h3>
              
              <label className="border-2 border-dashed border-border rounded-xl bg-background p-8 flex flex-col items-center justify-center text-center hover:bg-surface-secondary transition-colors cursor-pointer group relative block">
                <input 
                  type="file" 
                  accept="application/pdf" 
                  multiple 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={handleBulkFileChange} 
                  disabled={isBulkPublishing}
                />
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6 text-blue-500" />
                </div>
                <p className="text-sm font-bold text-text mb-1">
                  Drag & drop PDF files here
                </p>
                <p className="text-xs text-muted">
                  or click to select multiple syllabus documents
                </p>
              </label>

              {bulkFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-xs font-bold text-muted">Syllabus Files ({bulkFiles.length})</span>
                    <button 
                      onClick={() => setBulkFiles([])}
                      disabled={isBulkPublishing}
                      className="text-xs text-red-500 hover:text-red-650 font-bold disabled:opacity-50"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {bulkFiles.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-surface-secondary border border-border rounded-xl">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted font-medium truncate block max-w-[200px]" title={item.file.name}>{item.file.name}</span>
                            <span className="text-[10px] text-muted font-semibold">
                              {item.compressedSize ? (
                                <>
                                  <span className="line-through text-muted/75 mr-1.5">{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                  <span className="text-emerald-500 font-bold">{(item.compressedSize / 1024 / 1024).toFixed(2)} MB</span>
                                  {item.savedPercentage !== undefined && item.savedPercentage > 0 && (
                                    <span className="text-emerald-500 font-bold ml-1.5">({Math.round(item.savedPercentage)}% saved)</span>
                                  )}
                                </>
                              ) : (
                                `${(item.file.size / 1024 / 1024).toFixed(2)} MB`
                              )}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 mt-1">
                            <div className="flex items-center gap-1.5 flex-1">
                              <span className="text-[10px] font-bold text-text shrink-0">Subject:</span>
                              <input 
                                type="text"
                                value={item.subjectName}
                                onChange={e => {
                                  const newName = e.target.value;
                                  setBulkFiles(prev => prev.map((f, i) => i === idx ? { ...f, subjectName: newName } : f));
                                }}
                                disabled={isBulkPublishing}
                                placeholder="Subject Name"
                                className="w-full bg-background border border-border rounded-lg px-2 py-0.5 text-xs text-text focus:border-primary outline-none font-semibold"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 sm:w-32 shrink-0">
                              <span className="text-[10px] font-bold text-text shrink-0">Code:</span>
                              <input 
                                type="text"
                                value={item.subjectCode}
                                onChange={e => {
                                  const rawCode = e.target.value;
                                  const cleanCode = rawCode.toUpperCase().trim();
                                  const mappedName = subjectMappings[cleanCode];
                                  setBulkFiles(prev => prev.map((f, i) => {
                                    if (i === idx) {
                                      return {
                                        ...f,
                                        subjectCode: rawCode,
                                        subjectName: mappedName || f.subjectName
                                      };
                                    }
                                    return f;
                                  }));
                                }}
                                disabled={isBulkPublishing}
                                placeholder="Code"
                                className="w-full bg-background border border-border rounded-lg px-2 py-0.5 text-xs text-text focus:border-primary outline-none font-semibold uppercase"
                              />
                            </div>
                          </div>
                          {item.errorMsg && (
                            <span className="text-[10px] text-red-500 font-bold block">{item.errorMsg}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.status === 'pending' && (
                            <button
                              onClick={() => setBulkFiles(prev => prev.filter((_, i) => i !== idx))}
                              disabled={isBulkPublishing}
                              className="text-muted hover:text-red-500 p-1 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          {item.status === 'compressing' && (
                            <div className="flex items-center gap-1 text-[10px] text-primary font-bold">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Compressing {item.progress ? `(${item.progress})` : ''}</span>
                            </div>
                          )}
                          {item.status === 'uploading' && (
                            <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Uploading</span>
                            </div>
                          )}
                          {item.status === 'success' && (
                            <span className="text-[10px] text-success font-bold flex items-center gap-1">
                              <CheckCircle className="h-4.5 w-4.5 text-success shrink-0" />
                              <span>Uploaded</span>
                            </span>
                          )}
                          {item.status === 'error' && (
                            <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                              <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                              <span>Failed</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={resetForm}
                disabled={isBulkPublishing}
                className="bg-surface-secondary hover:bg-border text-text px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
              >
                Reset
              </button>
              <button 
                onClick={handleBulkPublish}
                disabled={!isReadyToPublish || isBulkPublishing}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isBulkPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading ({bulkFiles.filter(f => f.status === 'success').length}/{bulkFiles.length})...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Publish {bulkFiles.length} Syllabus Files
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleDelete = async (ids: string[]) => {
    const isMultiple = ids.length > 1;
    const confirmMsg = isMultiple 
      ? `Are you sure you want to delete this syllabus for all ${ids.length} selected branches? This will permanently delete their database records and storage files.`
      : 'Are you sure you want to delete this syllabus? This will permanently delete the database record and the storage file.';
    if (!confirm(confirmMsg)) return;
    try {
      setIsDeleting(ids[0]);
      await Promise.all(ids.map(id => apiClient.deleteAdminMaterial(id)));
      await loadMaterials();
    } catch (error) {
      alert('Failed to delete syllabus');
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected syllabus files? This will permanently delete their database records and storage files.`)) return;
    try {
      setIsBulkDeleting(true);
      await Promise.all(selectedIds.map(id => apiClient.deleteAdminMaterial(id)));
      setSelectedIds([]);
      await loadMaterials();
    } catch (error) {
      alert('Failed to delete some of the selected syllabus files');
      console.error(error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkStatusChange = async (targetStatus: 'approved' | 'draft') => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      for (const id of selectedIds) {
        await apiClient.updateAdminMaterial(id, { approval_status: targetStatus });
      }
      setSelectedIds([]);
      await loadMaterials();
    } catch (error) {
      alert('Failed to update syllabus status');
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
      alert('Failed to update syllabus visibility status');
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Filtering materials
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (m.subject_name && m.subject_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.subject_code && m.subject_code.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Check if the material references the branch slug or name
    const matchesBranch = !filterBranch || 
      (m.branch_slug && m.branch_slug.toLowerCase().includes(filterBranch.toLowerCase())) ||
      (m.branch_short_names && m.branch_short_names.toLowerCase().includes(filterBranch.toLowerCase())) ||
      (m.branch_names && m.branch_names.toLowerCase().includes(filterBranch.toLowerCase()));

    const matchesSemester = !filterSemester || String(m.semester_no) === filterSemester;

    const status = m.approval_status || 'approved';
    const matchesStatus = !filterStatus || filterStatus === 'all' || 
      (filterStatus === 'approved' ? status === 'approved' : status !== 'approved');

    return matchesSearch && matchesBranch && matchesSemester && matchesStatus;
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
      const key = `${m.title}_${m.semester_no}_${m.subject_name || ''}`;
      if (!groups[key]) {
        groups[key] = {
          ...m,
          ids: [m.id],
          branches: []
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
    }
    return Object.values(groups);
  }, [filteredMaterials, filterBranch]);

  const handleAutoGenerateFromCodes = async () => {
    const startTime = Date.now();
    const targetBranches = isCodesMultipleBranches ? codesSelectedBranches : [codesSingleBranchId].filter(Boolean);
    const targetSemesters = isCodesMultipleSemesters ? codesSelectedSemesters : [Number(codesSingleSemester)].filter(s => !isNaN(s) && s >= 0);

    if (targetBranches.length === 0) {
      alert('Please select at least one branch.');
      return;
    }
    if (targetSemesters.length === 0) {
      alert('Please select at least one semester.');
      return;
    }

    const parsedCodes = Array.from(new Set(
      codesInput
        .split(/[\n,;\s]+/)
        .map(c => c.trim().toUpperCase())
        .filter(c => c.length >= 4)
    ));

    if (parsedCodes.length === 0) {
      alert('Please enter at least one valid GTU subject code (e.g. 3130014, 3150703).');
      return;
    }

    const totalOperations = targetBranches.length * targetSemesters.length * parsedCodes.length;
    setIsCodesPublishing(true);
    setCodesProgress({ total: totalOperations, done: 0 });

    const publishedIds: string[] = [];
    let operationsDone = 0;
    let failedCount = 0;

    for (const bId of targetBranches) {
      for (const sem of targetSemesters) {
        for (const code of parsedCodes) {
          const subName = subjectMappings[code] || `GTU Course ${code}`;
          setCodesProgress({ total: totalOperations, done: operationsDone, current: `${code} - ${subName} [Sem ${sem}]` });

          try {
            const formData = new FormData();
            formData.append('title', `${subName} Syllabus`);
            formData.append('material_type', 'syllabus');
            formData.append('status', 'published');
            formData.append('manual_subject_name', subName);
            formData.append('branch_ids', bId);
            formData.append('semesters', String(sem));
            formData.append('subject_code', code);
            formData.append('file_url', `https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/${code}.pdf`);
            if (codesWefYear) {
              formData.append('version_label', codesWefYear);
              const match = codesWefYear.match(/^(\d{4})/);
              if (match) formData.append('syllabus_year', match[1]);
            }

            const res = await apiClient.addAdminMaterial(formData);
            if (res && res.id) publishedIds.push(res.id);
          } catch (err) {
            console.error(`Failed to auto-generate syllabus for ${code}:`, err);
            failedCount++;
          }
          operationsDone++;
        }
      }
    }

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

    setCodesProgress({ total: totalOperations, done: totalOperations });
    setIsCodesPublishing(false);

    if (publishedIds.length > 0) {
      setUploadedMaterialIds(publishedIds);
    }

    const branchNames = targetBranches.map(bId => {
      const found = branches.find(b => b.id === bId);
      return found?.short_name || found?.name || bId;
    });

    saveBulkUploadHistory({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      branches: branchNames,
      semesters: targetSemesters,
      wef: codesWefYear,
      subjectsCount: parsedCodes.length,
      linksGenerated: publishedIds.length,
      failed: failedCount,
      status: failedCount === 0 ? 'success' : publishedIds.length > 0 ? 'partial' : 'error'
    });

    setAutoSuccessResult({
      total: totalOperations,
      success: publishedIds.length,
      failed: failedCount,
      timeSec: elapsedTime
    });
  };

  const renderCodesAutoGeneratorContent = () => {
    const parsedCodes = Array.from(new Set(
      codesInput
        .split(/[\n,;\s]+/)
        .map(c => c.trim().toUpperCase())
        .filter(c => c.length >= 4)
    ));

    const targetBranches = isCodesMultipleBranches ? codesSelectedBranches : [codesSingleBranchId].filter(Boolean);
    const targetSemesters = isCodesMultipleSemesters ? codesSelectedSemesters : [Number(codesSingleSemester)].filter(s => !isNaN(s) && s >= 0);
    const totalLinks = targetBranches.length * targetSemesters.length * parsedCodes.length;
    const isStep1Valid = targetBranches.length > 0;
    const isStep2Valid = targetSemesters.length > 0 && /^\d{4}-\d{2}$/.test(codesWefYear.trim());
    const isStep3Valid = parsedCodes.length > 0;
    const isReady = isStep1Valid && isStep2Valid && isStep3Valid;

    // Live validation: classify each code
    const codeStatuses = parsedCodes.map(code => {
      const isFormatValid = /^\d{4,9}$/.test(code);
      const hasMapping = !!subjectMappings[code];
      return { code, isFormatValid, hasMapping, title: subjectMappings[code] || `GTU Subject ${code}` };
    });
    const validCount = codeStatuses.filter(c => c.isFormatValid).length;
    const mappedCount = codeStatuses.filter(c => c.hasMapping).length;
    const unknownCount = validCount - mappedCount;
    const wefIsValid = /^\d{4}-\d{2}$/.test(codesWefYear.trim());

    // Filter branches for search
    const filteredBranchList = branches.filter(b => 
      !autoBranchSearch || 
      b.name.toLowerCase().includes(autoBranchSearch.toLowerCase()) ||
      (b.short_name && b.short_name.toLowerCase().includes(autoBranchSearch.toLowerCase()))
    );

    // Summary labels
    const branchLabel = isCodesMultipleBranches
      ? (codesSelectedBranches.length > 0 ? `${codesSelectedBranches.length} Depts` : 'None')
      : (branches.find(b => b.id === codesSingleBranchId)?.short_name || branches.find(b => b.id === codesSingleBranchId)?.name || 'None');
    const semLabel = isCodesMultipleSemesters
      ? (codesSelectedSemesters.length > 0 ? `Sem ${codesSelectedSemesters.join(', ')}` : 'None')
      : (codesSingleSemester ? `Sem ${codesSingleSemester}` : 'None');

    const resetAutoGenerator = () => {
      setAutoStep(1);
      setCodesInput('');
      setAutoSuccessResult(null);
      setCodesProgress(null);
    };

    const removeCodeChip = (codeToRemove: string) => {
      const updated = parsedCodes.filter(c => c !== codeToRemove).join('\n');
      setCodesInput(updated);
    };

    return (
      <div className="space-y-8 max-w-5xl mx-auto pb-12">
        {/* Hero Banner Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/40 via-surface/90 to-purple-900/30 border border-indigo-500/25 p-6 rounded-3xl shadow-xl backdrop-blur-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/15 via-purple-500/10 to-transparent rounded-full -translate-y-16 translate-x-16 pointer-events-none blur-2xl" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl text-indigo-400 shrink-0 shadow-inner">
                <Zap className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-extrabold text-text tracking-tight">📚 GTU Syllabus Auto-Generator</h3>
                  <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wide">
                    Zero File Upload
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed max-w-2xl">
                  Automatically fetch GTU syllabus PDFs, resolve official subject names, build direct GTU S3 links, and publish database entries in one click.
                </p>
              </div>
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-xl">
                <Zap className="h-3 w-3" /> Auto Detection
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-xl">
                <FileText className="h-3 w-3" /> Official GTU PDFs
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-xl">
                <Cloud className="h-3 w-3" /> Cloudflare S3
              </span>
            </div>
          </div>
        </div>

        {/* 4-Step Progress Stepper Bar */}
        <div className="bg-surface/80 border border-border/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
          <div className="grid grid-cols-4 gap-2 relative">
            {[
              { num: 1, title: 'Branch', desc: 'Select Department', icon: Building2, isValid: isStep1Valid },
              { num: 2, title: 'Semester & WEF', desc: 'Scheme & Term', icon: GraduationCap, isValid: isStep2Valid },
              { num: 3, title: 'Subject Codes', desc: 'Paste & Validate', icon: Hash, isValid: isStep3Valid },
              { num: 4, title: 'Preview & Publish', desc: 'Review & Sync', icon: Sparkles, isValid: isReady }
            ].map((s) => {
              const isActive = autoStep === s.num;
              const isDone = autoStep > s.num || (s.num < 4 && s.isValid);

              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (s.num <= autoStep || isDone) setAutoStep(s.num);
                  }}
                  className={`flex flex-col md:flex-row items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    isActive 
                      ? 'bg-primary/10 border border-primary/30 text-primary shadow-sm' 
                      : isDone
                        ? 'bg-surface-secondary/40 text-text hover:bg-surface-secondary cursor-pointer'
                        : 'text-muted/60 opacity-70 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-surface-secondary text-muted border border-border'
                  }`}>
                    {isDone && !isActive ? <Check className="h-4 w-4" /> : s.num}
                  </div>
                  <div className="hidden md:block min-w-0">
                    <div className={`text-xs font-bold truncate ${isActive ? 'text-primary' : 'text-text'}`}>
                      {s.title}
                    </div>
                    <div className="text-[10px] text-muted truncate">{s.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wizard Step Content */}
        <AnimatePresence mode="wait">
          {/* STEP 1: Select Branch */}
          {autoStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
                  <div>
                    <h4 className="text-base font-extrabold text-text flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Step 1: Select Branch / Department
                    </h4>
                    <p className="text-xs text-muted mt-0.5">Choose a single branch or select multiple departments for bulk creation.</p>
                  </div>

                  {/* Mode Switcher */}
                  <div className="flex items-center gap-2 bg-background p-1 rounded-xl border border-border shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCodesMultipleBranches(false);
                        if (!codesSingleBranchId && branches.length > 0) setCodesSingleBranchId(branches[0].id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        !isCodesMultipleBranches ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-text'
                      }`}
                    >
                      Single Branch
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCodesMultipleBranches(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isCodesMultipleBranches ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-text'
                      }`}
                    >
                      Multiple Branches
                    </button>
                  </div>
                </div>

                {/* Branch Filter Input */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      type="text"
                      placeholder="Search branch name or code (e.g. Computer, Mechanical, Electrical)..."
                      value={autoBranchSearch}
                      onChange={e => setAutoBranchSearch(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text outline-none focus:border-primary transition-all"
                    />
                    {autoBranchSearch && (
                      <button
                        type="button"
                        onClick={() => setAutoBranchSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text text-xs"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {isCodesMultipleBranches && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCodesSelectedBranches(branches.map(b => b.id))}
                        className="px-3 py-2 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-xl border border-primary/20 transition-all whitespace-nowrap"
                      >
                        Select All ({branches.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCodesSelectedBranches([])}
                        className="px-3 py-2 text-xs font-bold bg-surface-secondary text-muted hover:text-text rounded-xl border border-border transition-all whitespace-nowrap"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Branch Selection Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
                  {filteredBranchList.map((b) => {
                    const isSelected = isCodesMultipleBranches
                      ? codesSelectedBranches.includes(b.id)
                      : codesSingleBranchId === b.id;

                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          if (isCodesMultipleBranches) {
                            setCodesSelectedBranches(prev =>
                              prev.includes(b.id) ? prev.filter(id => id !== b.id) : [...prev, b.id]
                            );
                          } else {
                            setCodesSingleBranchId(b.id);
                          }
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-text shadow-sm'
                            : 'bg-background hover:bg-surface-secondary/60 border-border text-muted hover:text-text'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-text truncate">{b.name}</div>
                          {b.short_name && <div className="text-[10px] font-mono text-muted uppercase mt-0.5">{b.short_name}</div>}
                        </div>
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-primary border-primary text-white' : 'border-gray-500/40 bg-surface'
                        }`}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-border/80">
                  <span className="text-xs text-muted font-medium">
                    Selected: <strong className="text-text">{isCodesMultipleBranches ? `${codesSelectedBranches.length} Branch(es)` : (branches.find(b => b.id === codesSingleBranchId)?.name || 'None')}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => setAutoStep(2)}
                    disabled={!isStep1Valid}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      isStep1Valid
                        ? 'bg-primary hover:bg-primary/90 text-white shadow-md cursor-pointer hover:translate-x-0.5'
                        : 'bg-surface-secondary text-muted border border-border cursor-not-allowed opacity-60'
                    }`}
                  >
                    Continue to Semester & Scheme <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Semester & WEF Scheme */}
          {autoStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-border/80 pb-4">
                  <div>
                    <h4 className="text-base font-extrabold text-text flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Step 2: Select Semester & WEF Scheme
                    </h4>
                    <p className="text-xs text-muted mt-0.5">Specify target academic terms and official WEF year.</p>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl">
                    Branch: {branchLabel}
                  </span>
                </div>

                {/* Semester Mode & Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-text flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-muted" /> Target Semester(s)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCodesMultipleSemesters(false);
                          if (!codesSingleSemester) setCodesSingleSemester('1');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          !isCodesMultipleSemesters ? 'bg-primary text-white' : 'bg-surface-secondary text-muted'
                        }`}
                      >
                        Single
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCodesMultipleSemesters(true)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          isCodesMultipleSemesters ? 'bg-primary text-white' : 'bg-surface-secondary text-muted'
                        }`}
                      >
                        Multiple
                      </button>

                      {isCodesMultipleSemesters && (
                        <button
                          type="button"
                          onClick={() => setCodesSelectedSemesters([...SEMESTERS])}
                          className="px-2 py-1 text-[10px] font-bold text-primary hover:underline ml-2"
                        >
                          Select All (1-8)
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {SEMESTERS.map((sem) => {
                      const isSelected = isCodesMultipleSemesters
                        ? codesSelectedSemesters.includes(sem)
                        : Number(codesSingleSemester) === sem;

                      return (
                        <button
                          key={sem}
                          type="button"
                          onClick={() => {
                            if (isCodesMultipleSemesters) {
                              setCodesSelectedSemesters(prev =>
                                prev.includes(sem) ? prev.filter(s => s !== sem) : [...prev, sem]
                              );
                            } else {
                              setCodesSingleSemester(String(sem));
                            }
                          }}
                          className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-primary/10 border-primary text-primary font-extrabold shadow-sm'
                              : 'bg-background hover:bg-surface-secondary/60 border-border text-muted hover:text-text'
                          }`}
                        >
                          <span className="text-base font-extrabold">Sem {sem}</span>
                          <span className="text-[10px] text-muted uppercase tracking-wider">Semester {formatSemester(sem)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* WEF Scheme Year Input & Presets */}
                <div className="space-y-3 pt-4 border-t border-border/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-text flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-muted" /> WEF Scheme Year
                      <span className="text-[10px] font-normal text-muted">(e.g. 2024-25)</span>
                    </label>
                    <span className="text-[10px] font-mono text-muted">Format: YYYY-YY</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={codesWefYear}
                        onChange={e => setCodesWefYear(e.target.value)}
                        placeholder="e.g. 2024-25"
                        className={`w-full bg-background border rounded-xl pl-4 pr-10 py-2.5 text-text text-sm font-mono outline-none transition-all ${
                          codesWefYear && !wefIsValid
                            ? 'border-amber-500/60 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20'
                            : codesWefYear && wefIsValid
                              ? 'border-success/60 focus:border-success focus:ring-1 focus:ring-success/20'
                              : 'border-border focus:border-primary focus:ring-1 focus:ring-primary/20'
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {wefIsValid ? <CheckCircle className="h-4 w-4 text-success" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      {['2024-25', '2023-24', '2022-23', '2021-22'].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCodesWefYear(preset)}
                          className={`px-2.5 py-2 text-xs font-mono font-bold rounded-xl border transition-all whitespace-nowrap ${
                            codesWefYear === preset
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-background hover:bg-surface-secondary border-border text-muted'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-border/80">
                  <button
                    type="button"
                    onClick={() => setAutoStep(1)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-surface-secondary text-muted hover:text-text border border-border transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Branch
                  </button>

                  <button
                    type="button"
                    onClick={() => setAutoStep(3)}
                    disabled={!isStep2Valid}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      isStep2Valid
                        ? 'bg-primary hover:bg-primary/90 text-white shadow-md cursor-pointer hover:translate-x-0.5'
                        : 'bg-surface-secondary text-muted border border-border cursor-not-allowed opacity-60'
                    }`}
                  >
                    Continue to Subject Codes <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Subject Codes Input */}
          {autoStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
                  <div>
                    <h4 className="text-base font-extrabold text-text flex items-center gap-2">
                      <Hash className="h-5 w-5 text-primary" />
                      Step 3: Enter GTU Subject Codes
                    </h4>
                    <p className="text-xs text-muted mt-0.5">Paste multiple codes or search subjects. Real-time validation active.</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-xl">
                      {branchLabel}
                    </span>
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-xl">
                      {semLabel}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                      WEF {codesWefYear}
                    </span>
                  </div>
                </div>

                {/* Textarea Input Card & Controls */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-text flex items-center gap-1.5">
                      Paste Subject Codes
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCodesInput('3130014, 3150703, 3140705, 3160704, 3170701')}
                        className="text-[11px] font-bold text-primary hover:underline bg-primary/10 px-2.5 py-1 rounded-lg"
                      >
                        ⚡ Paste Sample Codes
                      </button>
                      {codesInput && (
                        <button
                          type="button"
                          onClick={() => setCodesInput('')}
                          className="text-[11px] font-bold text-muted hover:text-text bg-surface-secondary px-2.5 py-1 rounded-lg"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    rows={5}
                    value={codesInput}
                    onChange={e => setCodesInput(e.target.value)}
                    placeholder={`Paste GTU subject codes — one per line, or comma/space separated:\n\n3130014\n3150703, 3150709\n3150711 3150712`}
                    className="w-full bg-background border border-border rounded-xl p-4 text-text text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none resize-y transition-all placeholder:text-muted/40 placeholder:font-sans placeholder:text-xs"
                  />
                  <p className="text-[11px] text-muted">Supports space, comma, semicolon, or newline separated codes.</p>
                </div>

                {/* Catalog Subject Quick Lookup */}
                <div className="space-y-3 pt-4 border-t border-border/80">
                  <label className="text-xs font-bold text-text flex items-center gap-1.5">
                    <Search className="h-4 w-4 text-muted" /> Quick Add from GTU Database
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type subject name or code to search (e.g. Operating System, 3150703)..."
                      value={subjectSearchInput}
                      onChange={e => setSubjectSearchInput(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl pl-4 pr-10 py-2 text-xs text-text outline-none focus:border-primary"
                    />
                    {subjectSearchInput && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-border/60">
                        {Object.entries(subjectMappings)
                          .filter(([code, title]) => 
                            code.includes(subjectSearchInput.trim()) || 
                            title.toLowerCase().includes(subjectSearchInput.toLowerCase())
                          )
                          .slice(0, 8)
                          .map(([code, title]) => (
                            <div
                              key={code}
                              onClick={() => {
                                setCodesInput(prev => prev ? `${prev}\n${code}` : code);
                                setSubjectSearchInput('');
                              }}
                              className="p-2.5 hover:bg-primary/10 cursor-pointer flex items-center justify-between text-xs transition-colors"
                            >
                              <div className="truncate min-w-0 pr-2">
                                <span className="font-extrabold text-primary font-mono mr-2">{code}</span>
                                <span className="text-text font-medium">{title}</span>
                              </div>
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">+ Add</span>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Chips & Validation Counter Bar */}
                {parsedCodes.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-border/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text">Detected Subject Chips</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {parsedCodes.length} Total
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold">
                        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          ✓ {mappedCount} Valid Mapped
                        </span>
                        {unknownCount > 0 && (
                          <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            ⚠ {unknownCount} Unknown
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chips Display */}
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-background border border-border/80 rounded-xl">
                      {codeStatuses.map(({ code, title, isFormatValid, hasMapping }) => (
                        <div
                          key={code}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                            !isFormatValid
                              ? 'bg-red-500/10 border-red-500/30 text-red-400'
                              : hasMapping
                                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          }`}
                        >
                          <span className="font-extrabold font-mono text-text">{code}</span>
                          <span className="truncate max-w-[160px] text-[11px] opacity-90">{title}</span>
                          <button
                            type="button"
                            onClick={() => removeCodeChip(code)}
                            className="hover:text-red-400 p-0.5 rounded-lg transition-colors ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-border/80">
                  <button
                    type="button"
                    onClick={() => setAutoStep(2)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-surface-secondary text-muted hover:text-text border border-border transition-all"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Semester
                  </button>

                  <button
                    type="button"
                    onClick={() => setAutoStep(4)}
                    disabled={!isStep3Valid}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      isStep3Valid
                        ? 'bg-primary hover:bg-primary/90 text-white shadow-md cursor-pointer hover:translate-x-0.5'
                        : 'bg-surface-secondary text-muted border border-border cursor-not-allowed opacity-60'
                    }`}
                  >
                    Continue to Preview & Publish <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Preview & Publish / Process / Success */}
          {autoStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Publishing Process Screen */}
              {isCodesPublishing ? (
                <div className="bg-surface border border-border rounded-2xl p-8 text-center space-y-6 shadow-xl">
                  <div className="relative inline-flex items-center justify-center">
                    <Loader2 className="h-16 w-16 text-primary animate-spin" />
                    <Zap className="h-6 w-6 text-indigo-400 absolute" />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-lg font-extrabold text-text">Auto-Generating Syllabus Links...</h4>
                    <p className="text-xs text-muted max-w-md mx-auto">
                      Resolving subject codes, constructing official GTU S3 links, and syncing live database records.
                    </p>
                  </div>

                  {codesProgress && (
                    <div className="max-w-md mx-auto space-y-3 bg-background border border-border rounded-2xl p-5 shadow-inner">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-text">Progress Status</span>
                        <span className="text-primary">{Math.round((codesProgress.done / codesProgress.total) * 100)}%</span>
                      </div>
                      <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-indigo-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(codesProgress.done / codesProgress.total) * 100}%` }}
                        />
                      </div>
                      {codesProgress.current && (
                        <p className="text-[11px] font-mono text-muted truncate">
                          ↳ {codesProgress.current}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : autoSuccessResult ? (
                /* Success Screen */
                <div className="bg-surface border border-emerald-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 shadow-inner">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-2xl font-black text-text">✅ Successfully Published!</h4>
                    <p className="text-xs text-muted">All syllabus links have been generated and synced into D1 & Cloudflare storage.</p>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
                    <div className="bg-background border border-border p-4 rounded-2xl text-center">
                      <div className="text-2xl font-black text-primary">{autoSuccessResult.success}</div>
                      <div className="text-[10px] text-muted uppercase font-bold mt-1">Links Created</div>
                    </div>
                    <div className="bg-background border border-border p-4 rounded-2xl text-center">
                      <div className="text-2xl font-black text-emerald-400">{autoSuccessResult.total}</div>
                      <div className="text-[10px] text-muted uppercase font-bold mt-1">Database Records</div>
                    </div>
                    <div className="bg-background border border-border p-4 rounded-2xl text-center">
                      <div className="text-2xl font-black text-purple-400">{autoSuccessResult.failed}</div>
                      <div className="text-[10px] text-muted uppercase font-bold mt-1">Failed</div>
                    </div>
                    <div className="bg-background border border-border p-4 rounded-2xl text-center">
                      <div className="text-2xl font-black text-indigo-400 font-mono">{autoSuccessResult.timeSec}s</div>
                      <div className="text-[10px] text-muted uppercase font-bold mt-1">Time Elapsed</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all"
                    >
                      View Published Materials
                    </button>
                    <button
                      type="button"
                      onClick={resetAutoGenerator}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-surface-secondary hover:bg-border text-text border border-border transition-all"
                    >
                      Upload More Syllabuses
                    </button>
                  </div>
                </div>
              ) : (
                /* Preview Screen & Summary Grid */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Left Column: Preview Table */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-secondary/40">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-bold text-text uppercase tracking-wider">Generated Links Preview</h4>
                        </div>
                        <span className="text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                          {totalLinks} Entry/Entries
                        </span>
                      </div>

                      <div className="max-h-96 overflow-y-auto divide-y divide-border/60">
                        {targetBranches.flatMap((bId) => {
                          const branchObj = branches.find(b => b.id === bId);
                          const bShort = branchObj?.short_name || branchObj?.name || bId;

                          return targetSemesters.flatMap((sem) => {
                            return codeStatuses.map(({ code, title, isFormatValid, hasMapping }) => {
                              const s3Url = `https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/${code}.pdf`;
                              return (
                                <div key={`${bId}_${sem}_${code}`} className="p-3.5 hover:bg-surface-secondary/40 transition-colors flex items-center justify-between gap-3 text-xs">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold font-mono text-primary">{code}</span>
                                      <span className="font-semibold text-text truncate">{title}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-muted mt-1 truncate">
                                      <span className="text-accent font-bold">{bShort} · Sem {sem}</span>
                                      <span className="font-mono truncate">{s3Url}</span>
                                    </div>
                                  </div>

                                  <div className="shrink-0 flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                      Cloudflare Ready
                                    </span>
                                    {!hasMapping && (
                                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                        Unknown
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          });
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setAutoStep(3)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-surface-secondary text-muted hover:text-text border border-border transition-all"
                      >
                        <ArrowLeft className="h-4 w-4" /> Back to Subject Codes
                      </button>

                      <button
                        type="button"
                        onClick={handleAutoGenerateFromCodes}
                        disabled={!isReady}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-extrabold text-sm shadow-xl transition-all ${
                          isReady
                            ? 'bg-gradient-to-r from-primary via-indigo-500 to-purple-600 hover:from-primary/90 hover:to-purple-500 text-white cursor-pointer hover:shadow-primary/30 hover:-translate-y-0.5'
                            : 'bg-surface-secondary text-muted border border-border cursor-not-allowed opacity-60'
                        }`}
                      >
                        <Sparkles className="h-5 w-5" />
                        ⚡ Generate & Publish {totalLinks} Syllabus Links
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Sticky Summary Card */}
                  <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm sticky top-6 space-y-4">
                    <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-surface-secondary/40">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      <h4 className="text-xs font-bold text-text uppercase tracking-wider">Live Summary</h4>
                    </div>

                    <div className="p-5 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Branch</span>
                        <span className="font-bold text-text truncate max-w-[140px]">{branchLabel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Semester</span>
                        <span className="font-bold text-text">{semLabel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> WEF Scheme</span>
                        <span className="font-bold font-mono text-emerald-400">{codesWefYear}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Subjects</span>
                        <span className="font-bold text-primary">{parsedCodes.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted flex items-center gap-1.5"><Link className="h-3.5 w-3.5" /> Total Links</span>
                        <span className="font-extrabold text-sm text-accent">{totalLinks}</span>
                      </div>

                      <div className="pt-3 border-t border-border/80">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
                          <ShieldCheck className="h-4 w-4 shrink-0" />
                          <span>Ready for Instant Database & Cloudflare Sync</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload History Table Section */}
        {autoUploadHistory.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm space-y-4 mt-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-secondary/40">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold text-text uppercase tracking-wider">Recent Upload History</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('syllabus_bulk_upload_history');
                  setAutoUploadHistory([]);
                }}
                className="text-[10px] font-bold text-muted hover:text-red-400 transition-colors"
              >
                Clear History
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-surface-secondary/20 text-muted">
                    <th className="px-5 py-3 font-bold">Date & Time</th>
                    <th className="px-5 py-3 font-bold">Branches</th>
                    <th className="px-5 py-3 font-bold">Semesters</th>
                    <th className="px-5 py-3 font-bold">WEF</th>
                    <th className="px-5 py-3 font-bold">Subjects</th>
                    <th className="px-5 py-3 font-bold">Links Generated</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {autoUploadHistory.slice(0, 10).map((item) => (
                    <tr key={item.id} className="hover:bg-surface-secondary/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-[11px] text-muted">
                        {new Date(item.date).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 font-semibold text-text">
                        {Array.isArray(item.branches) ? item.branches.join(', ') : item.branches}
                      </td>
                      <td className="px-5 py-3 font-semibold text-text">
                        Sem {Array.isArray(item.semesters) ? item.semesters.join(', ') : item.semesters}
                      </td>
                      <td className="px-5 py-3 font-mono text-emerald-400 font-bold">{item.wef}</td>
                      <td className="px-5 py-3 font-bold text-primary">{item.subjectsCount}</td>
                      <td className="px-5 py-3 font-bold text-text">{item.linksGenerated}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          item.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

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
                          className="h-4 w-4 rounded border-gray-350 text-primary focus:ring-primary accent-primary"
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
                          className="h-4 w-4 rounded border-gray-350 text-primary focus:ring-primary accent-primary"
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
              <div className="space-y-2">
                <label className="text-xs font-bold text-text">Syllabus Title (Optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={`e.g. ${subjectName ? subjectName + ' Syllabus' : 'Mathematics Syllabus'}`}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text">WEF Academic Year (e.g. 2025-26)</label>
                <input
                  type="text"
                  list="wef-years"
                  value={versionLabel}
                  onChange={e => {
                    setVersionLabel(e.target.value);
                    const match = e.target.value.match(/^(\d{4})/);
                    if (match) {
                      setSyllabusYear(match[1]);
                    } else {
                      setSyllabusYear('');
                    }
                  }}
                  placeholder="e.g. 2025-26"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted"
                />
                <datalist id="wef-years">
                  <option value="2026-27" />
                  <option value="2025-26" />
                  <option value="2024-25" />
                  <option value="2023-24" />
                  <option value="2022-23" />
                  <option value="2018-19" />
                </datalist>
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
                      <input 
                        type="text" 
                        value={subjectCode} 
                        onChange={e => {
                          const rawCode = e.target.value;
                          setSubjectCode(rawCode);
                          const cleanCode = rawCode.toUpperCase().trim();
                          if (subjectMappings[cleanCode]) {
                            setSubjectName(subjectMappings[cleanCode]);
                          }
                        }} 
                        placeholder="Subject code (optional)" 
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted" 
                      />
                    </div>
                  </div>
                );
              })()}
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
            <div className="text-center mb-2">
              <span className="inline-block px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                PDF Upload Optional
              </span>
              <p className="text-xs text-muted">
                If omitted, GTU's official S3 CDN URL ({subjectCode ? `https://s3-ap-southeast-1.amazonaws.com/gtusitecirculars/Syallbus/${subjectCode}.pdf` : 'based on subject code'}) will be linked automatically.
              </p>
            </div>
            <label className="border-2 border-dashed border-border rounded-xl bg-background p-10 flex flex-col items-center justify-center text-center hover:bg-surface-secondary transition-colors cursor-pointer group relative block">
              <input type="file" accept="application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setFile(e.target.files?.[0] || null)} />
              <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Book className="h-7 w-7 text-blue-500" />
              </div>
              <p className="text-base font-bold text-text mb-1">
                {file ? file.name : 'Upload Custom Syllabus PDF (Optional)'}
              </p>
              <p className="text-xs text-muted">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Click to browse custom file, or leave empty to use official GTU PDF link'}
              </p>
            </label>

            <div className="bg-surface-secondary rounded-xl p-6 border border-border">
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <h4 className="font-bold text-text">Add linked blog post</h4>
                  <p className="text-xs text-muted font-semibold mt-1">Optional: publish syllabus notes, scope, or exam guidance.</p>
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
                  <input
                    type="text"
                    value={blogTitle}
                    onChange={e => setBlogTitle(e.target.value)}
                    placeholder="Blog title (defaults to syllabus title)"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted"
                  />
                  <textarea
                    value={blogContent}
                    onChange={e => setBlogContent(e.target.value)}
                    placeholder="Write the syllabus blog content in Markdown..."
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
                </div>
              )}
            </div>

            <div className="bg-surface-secondary rounded-xl p-6 border border-border mt-6">
              <h4 className="font-bold text-text text-lg mb-4">Review Details</h4>
              <ul className="space-y-2 text-sm text-muted">
                <li><strong className="text-text">Title:</strong> {title || `${subjectName} Syllabus`}</li>
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
                {versionLabel && (
                  <li><strong className="text-text">WEF Year:</strong> {versionLabel}</li>
                )}
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
                    {compressionProgress || 'Compressing...'}
                  </>
                ) : isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Publish Syllabus
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
          <h3 className="text-lg font-bold text-text">Upload Syllabus</h3>
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
                  ? `Successfully uploaded and published ${uploadedMaterialIds.length} syllabus files to the database and storage.`
                  : 'The syllabus has been uploaded and published to the database and storage.'
                }
              </p>
              {compressionStats && (
                <div className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl p-3 mt-2 font-semibold">
                  PDF Compressed: <span className="line-through text-muted/75 mr-1.5">{(compressionStats.originalSize / 1024 / 1024).toFixed(2)} MB</span> → <span>{(compressionStats.compressedSize / 1024 / 1024).toFixed(2)} MB</span> ({Math.round(compressionStats.savedPercentage)}% space saved)
                </div>
              )}
            </div>
            {!showLinks ? (
              <button
                onClick={() => setShowLinks(true)}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold transition-all shadow-sm"
              >
                View Uploaded Material
              </button>
            ) : (
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
            {/* Mode Switcher */}
            <div className="flex border-b border-border mb-6 overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  setUploadMode('single');
                  setSelectedBranches([]);
                  setSelectedSemesters([]);
                }}
                className={`px-6 py-2.5 font-bold text-sm transition-colors border-b-2 -mb-[2px] whitespace-nowrap ${uploadMode === 'single' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'}`}
              >
                Single Upload
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMode('bulk');
                  setSelectedBranches([]);
                  setSelectedSemesters([]);
                }}
                className={`px-6 py-2.5 font-bold text-sm transition-colors border-b-2 -mb-[2px] whitespace-nowrap ${uploadMode === 'bulk' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'}`}
              >
                Bulk Files Upload
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadMode('codes');
                }}
                className={`px-6 py-2.5 font-bold text-sm transition-colors border-b-2 -mb-[2px] whitespace-nowrap flex items-center gap-1.5 ${uploadMode === 'codes' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'}`}
              >
                <span>⚡ Auto-Generate by Subject Codes List</span>
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">No File Needed</span>
              </button>
            </div>

            {uploadMode === 'single' ? (
              <>
                {renderStepper()}
                {renderStepContent()}
              </>
            ) : uploadMode === 'bulk' ? (
              renderBulkUploadContent()
            ) : (
              renderCodesAutoGeneratorContent()
            )}
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
          <h2 className="text-2xl font-bold text-text tracking-tight">Manage Syllabus</h2>
          <p className="text-sm text-muted mt-1 font-semibold">View, search, and manage all syllabus files in D1/R2.</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkStatusChange('approved')}
                disabled={isBulkDeleting}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Eye className="h-3.5 w-3.5" /> Show Selected ({selectedIds.length})
              </button>
              <button
                onClick={() => handleBulkStatusChange('draft')}
                disabled={isBulkDeleting}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <EyeOff className="h-3.5 w-3.5" /> Hide Selected ({selectedIds.length})
              </button>
              <button 
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isBulkDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <PlusCircle className="h-4 w-4" />
            Upload Syllabus
          </button>
        </div>
      </div>

      {/* Top Live Website Visibility Control Switch Card */}
      <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
            siteControl.showSyllabus ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
          }`}>
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-text">Syllabus Section on Live Website</h3>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                siteControl.showSyllabus ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
              }`}>
                {siteControl.showSyllabus ? 'LIVE / ENABLED' : 'HIDDEN FROM PUBLIC'}
              </span>
            </div>
            <p className="text-xs text-muted font-semibold mt-0.5">
              Controls whether students can access the Syllabus section across all subject & semester pages.
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleSyllabusSection}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
            siteControl.showSyllabus
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
          {siteControl.showSyllabus ? (
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
        <div className="w-full md:w-80 flex items-center bg-background border border-border rounded-xl px-4 py-2.5 focus-within:border-primary transition-all">
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
                <option key={b.id} value={b.short_name || b.slug}>{b.name}</option>
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

          <div className="w-full sm:w-48 relative">
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)} 
              className="w-full bg-background border border-border rounded-xl pl-9 pr-8 py-2.5 text-text outline-none focus:border-primary text-sm appearance-none"
            >
              <option value="all">All Live Statuses</option>
              <option value="approved">Visible on Live Site Only</option>
              <option value="hidden">Hidden / Draft Only</option>
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
            <span className="text-sm text-muted font-bold">Loading Syllabus files...</span>
          </div>
        ) : groupedMaterials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <BookOpen className="h-12 w-12 text-muted mb-3" />
            <h3 className="text-lg font-bold text-text mb-1">No Syllabus files found</h3>
            <p className="text-sm text-muted max-w-sm font-semibold">Try adjusting your filters or upload a new syllabus using the button above.</p>
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
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">WEF Year</th>
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
                          <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0 border border-blue-500/20">
                            <Book className="h-4.5 w-4.5 text-blue-500" />
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
                        {m.semester_no ? `Sem ${m.semester_no}` : "Unsorted"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-text">
                        {m.subject_name || "General"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-text">
                        {m.version_label ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                            {m.version_label}
                          </span>
                        ) : (
                          <span className="text-xs text-muted font-medium italic">N/A</span>
                        )}
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
                      <td className="px-6 py-4 text-xs font-semibold text-muted">
                        {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setEditingGroup(m)}
                            className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                            title="Edit Syllabus"
                          >
                            <Edit className="h-4.5 w-4.5" />
                          </button>
                          <a 
                            href={`/materials/${m.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                            title="View Syllabus File"
                          >
                            <ExternalLink className="h-4.5 w-4.5" />
                          </a>
                          <button
                            onClick={() => handleDelete(m.ids)}
                            disabled={!!isRowDeleting}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50"
                            title="Delete Syllabus"
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
        initialSemesters={editingGroup ? [editingGroup.semester_no] : []}
        onSave={loadMaterials}
      />
    </div>
  );
};

export default ManageSyllabusUI;
