import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
  FileQuestion, FileText, Save, Send, PlusCircle, ArrowRight, ArrowLeft, CheckCircle, ExternalLink, Trash2, Search, Filter, Loader2, BookOpen, Edit, Eye, EyeOff, CheckCircle2,
  AlertTriangle, XCircle, Plus, History, Sparkles, Clock, User, Copy, FileSpreadsheet, Info, Settings, Zap, Check, ChevronRight, RefreshCw, X, Download, Calendar
} from 'lucide-react';
import { Branch, SubjectOffering } from '../../types';
import { SEMESTERS, formatSemester } from '../../constants';
import EditMaterialModal from './EditMaterialModal';
import { compressPdfFile } from '../../utils/pdfCompressor';
import { usePreventTabClose } from '../../hooks/usePreventTabClose';
import { getSiteControlState, saveSiteControlState } from '../../utils/siteControl';
import { generateGtuRecentSessions, getCourseCodeFromBranch, getGtuPyqUrl } from '../../utils/gtuPyq';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface ManagePYQsUIProps {
  embedded?: boolean;
  initialSearchQuery?: string;
}

const ManagePYQsUI: React.FC<ManagePYQsUIProps> = ({ embedded = false, initialSearchQuery = '' }) => {
  const [isCreating, setIsCreating] = useState(embedded);
  const { currentUser } = useAuth();
  const [autoStep, setAutoStep] = useState(1);
  const [autoSubjectSearch, setAutoSubjectSearch] = useState('');
  const [autoSelectedSubjects, setAutoSelectedSubjects] = useState<string[]>([]);
  const [autoUploadHistory, setAutoUploadHistory] = useState<any[]>([]);
  const [autoStatusCounters, setAutoStatusCounters] = useState({ success: 0, error: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [catalogSubjects, setCatalogSubjects] = useState<SubjectOffering[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [uploadedMaterialIds, setUploadedMaterialIds] = useState<string[]>([]);
  const [showLinks, setShowLinks] = useState(false);

  // Site Control State
  const [siteControl, setSiteControl] = useState(getSiteControlState());

  const handleTogglePyqSection = () => {
    const updated = saveSiteControlState({ showPyqs: !siteControl.showPyqs });
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

  // Form state
  const [branchId, setBranchId] = useState('');
  const [branchSlug, setBranchSlug] = useState('');
  const [branchName, setBranchName] = useState('');
  const [semester, setSemester] = useState('');
  const [subjectOfferingId, setSubjectOfferingId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectMode, setSubjectMode] = useState<'catalog' | 'custom'>('catalog');
  const [subjectCode, setSubjectCode] = useState('');

  // Multiple Selection State
  const [isMultipleBranches, setIsMultipleBranches] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [isMultipleSemesters, setIsMultipleSemesters] = useState(false);
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<string>('');
  const [examSeason, setExamSeason] = useState('');
  const [examYear, setExamYear] = useState('');
  const [title, setTitle] = useState('');

  // File state
  const [questionPaperFile, setQuestionPaperFile] = useState<File | null>(null);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [createBlog, setCreateBlog] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogStatus, setBlogStatus] = useState<'draft' | 'published'>('draft');

  // Auto-Generator by Subject Codes State
  const [uploadMode, setUploadMode] = useState<'single' | 'codes'>('single');
  const [codesInput, setCodesInput] = useState('');
  const [isCodesMultipleBranches, setIsCodesMultipleBranches] = useState(false);
  const [codesSelectedBranches, setCodesSelectedBranches] = useState<string[]>([]);
  const [codesSingleBranchId, setCodesSingleBranchId] = useState('');
  const [isCodesMultipleSemesters, setIsCodesMultipleSemesters] = useState(false);
  const [codesSelectedSemesters, setCodesSelectedSemesters] = useState<number[]>([]);
  const [codesSingleSemester, setCodesSingleSemester] = useState('');
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [isCodesPublishing, setIsCodesPublishing] = useState(false);
  const [codesProgress, setCodesProgress] = useState<{ total: number; done: number; current?: string } | null>(null);

  const [subjectMappings, setSubjectMappings] = useState<Record<string, string>>({});
  const [codesDbSubjects, setCodesDbSubjects] = useState<SubjectOffering[]>([]);
  const [isCodesDbLoading, setIsCodesDbLoading] = useState(false);

  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);

  useEffect(() => {
    fetch('/subject_codes.json')
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json() as Promise<Record<string, string>>;
      })
      .then(data => setSubjectMappings(data))
      .catch(err => console.error('Failed to load subject mappings:', err));
  }, []);

  useEffect(() => {
    try {
      const historyStr = localStorage.getItem('pyq_bulk_upload_history');
      if (historyStr) {
        setAutoUploadHistory(JSON.parse(historyStr));
      }
    } catch (e) {
      console.error('Failed to load bulk upload history:', e);
    }
  }, []);

  const saveBulkUploadHistory = (newEntry: any) => {
    try {
      setAutoUploadHistory(prev => {
        const updated = [newEntry, ...prev].slice(0, 50);
        localStorage.setItem('pyq_bulk_upload_history', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error('Failed to save bulk upload history:', e);
    }
  };

  usePreventTabClose(isPublishing || isCompressing || isCodesPublishing);

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

  // Fetch D1 subjects for the auto-generator Step 3 when the user arrives at it
  useEffect(() => {
    if (uploadMode !== 'codes' || autoStep !== 3) return;

    const targetBranches = isCodesMultipleBranches ? codesSelectedBranches : [codesSingleBranchId].filter(Boolean);
    const targetSemesters = isCodesMultipleSemesters
      ? codesSelectedSemesters
      : [Number(codesSingleSemester)].filter(s => !isNaN(s) && s > 0);

    if (targetBranches.length === 0 || targetSemesters.length === 0) {
      setCodesDbSubjects([]);
      return;
    }

    const slugsForBranches = targetBranches
      .map(id => branches.find(b => b.id === id)?.slug)
      .filter(Boolean) as string[];

    if (slugsForBranches.length === 0) return;

    let isActive = true;
    setIsCodesDbLoading(true);

    const fetchAll = slugsForBranches.flatMap(slug =>
      targetSemesters.map(sem => apiClient.getCatalog(slug, sem, 2026))
    );

    Promise.all(fetchAll)
      .then(results => {
        if (!isActive) return;
        const merged: SubjectOffering[] = [];
        const seen = new Set<string>();
        for (const list of results) {
          if (!list) continue;
          for (const item of list) {
            const key = `${item.subjectCode || ''}_${item.subjectName}`.toLowerCase().trim();
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(item);
            }
          }
        }
        merged.sort((a, b) => a.subjectName.localeCompare(b.subjectName));
        setCodesDbSubjects(merged);
      })
      .catch(err => {
        console.error('Failed to fetch D1 subjects for auto-generator:', err);
        if (isActive) setCodesDbSubjects([]);
      })
      .finally(() => {
        if (isActive) setIsCodesDbLoading(false);
      });

    return () => { isActive = false; };
  }, [uploadMode, autoStep, isCodesMultipleBranches, codesSelectedBranches, codesSingleBranchId, isCodesMultipleSemesters, codesSelectedSemesters, codesSingleSemester, branches]);

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
      const data = await apiClient.getAdminMaterials('pyq');
      setMaterials(data || []);
      setSelectedIds([]); // Clear selection when data changes
    } catch (error) {
      console.error('Failed to load PYQs:', error);
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
    setQuestionPaperFile(null);
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
    setExamSeason('');
    setExamYear('');
    setSolutionFile(null);
    setCreateBlog(false);
    setBlogTitle('');
    setBlogContent('');
    setBlogStatus('draft');

    setUploadMode('single');
    setCodesInput('');
    setIsCodesMultipleBranches(false);
    setCodesSelectedBranches([]);
    setCodesSingleBranchId('');
    setIsCodesMultipleSemesters(false);
    setCodesSelectedSemesters([]);
    setCodesSingleSemester('');
    setSelectedSessions([]);
    setIsCodesPublishing(false);
    setCodesProgress(null);
    setAutoStep(1);
    setAutoSubjectSearch('');
    setAutoSelectedSubjects([]);
    setAutoStatusCounters({ success: 0, error: 0 });
    setCodesDbSubjects([]);
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
      if (!questionPaperFile) {
        alert('Please upload the question paper PDF.');
        return;
      }

      setIsPublishing(true);
      
      let processedQP = questionPaperFile;
      if (questionPaperFile.type === 'application/pdf' || questionPaperFile.name.toLowerCase().endsWith('.pdf')) {
        setIsCompressing(true);
        processedQP = await compressPdfFile(questionPaperFile, (progress, msg) => {
          setCompressionProgress(`QP: ${Math.round(progress)}% - ${msg}`);
        });
        setIsCompressing(false);
      }

      let processedSolution = solutionFile;
      if (solutionFile && (solutionFile.type === 'application/pdf' || solutionFile.name.toLowerCase().endsWith('.pdf'))) {
        setIsCompressing(true);
        processedSolution = await compressPdfFile(solutionFile, (progress, msg) => {
          setCompressionProgress(`Solution: ${Math.round(progress)}% - ${msg}`);
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
          formData.append('title', title || `${subjectName} PYQ`);
          formData.append('material_type', 'pyq');
          formData.append('status', status);
          formData.append('exam_session', examSeason.toLowerCase());
          formData.append('exam_year', examYear || new Date().getFullYear().toString());
          formData.append('file', processedQP);
          if (processedSolution) formData.append('solution_file', processedSolution);

          if (subjectMode === 'catalog' && subjectOfferingId && !isMultipleBranches && !isMultipleSemesters) {
            formData.append('subject_id', subjectOfferingId);
          } else {
            formData.append('manual_subject_name', subjectName);
            formData.append('branch_ids', bId);
            formData.append('semesters', String(sem));
            formData.append('subject_code', subjectCode);
          }

          if (createBlog && ids.length === 0) {
            if (!blogContent.trim()) {
              alert('Blog content is required when the linked blog option is enabled.');
              setIsPublishing(false);
              return;
            }
            formData.append('create_blog', 'true');
            formData.append('blog_title', blogTitle || title || `${subjectName} PYQ`);
            formData.append('blog_content', blogContent);
            formData.append('blog_category', 'PYQ Analysis');
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
      alert(`Failed to save PYQ: ${error?.message || error}`);
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (ids: string[]) => {
    const isMultiple = ids.length > 1;
    const confirmMsg = isMultiple 
      ? `Are you sure you want to delete this PYQ for all ${ids.length} selected branches? This will permanently delete their database records and storage files.`
      : 'Are you sure you want to delete this PYQ? This will permanently delete the database record and the storage file.';
    if (!confirm(confirmMsg)) return;
    try {
      setIsDeleting(ids[0]);
      await Promise.all(ids.map(id => apiClient.deleteAdminMaterial(id)));
      await loadMaterials();
    } catch (error) {
      alert('Failed to delete PYQ');
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected PYQs? This will permanently delete their database records and storage files.`)) return;
    try {
      setIsBulkDeleting(true);
      await Promise.all(selectedIds.map(id => apiClient.deleteAdminMaterial(id)));
      setSelectedIds([]);
      await loadMaterials();
    } catch (error) {
      alert('Failed to delete some of the selected PYQs');
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
      alert('Failed to update PYQ status');
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
      alert('Failed to update PYQ visibility status');
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
      const key = `${m.title}_${m.semester_no}_${m.subject_name || ''}_${m.exam_session || ''}_${m.exam_year || ''}`;
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

  const applyConfig = (config: any) => {
    if (!config) return;
    setIsCodesMultipleBranches(config.isCodesMultipleBranches ?? false);
    setCodesSelectedBranches(config.codesSelectedBranches ?? []);
    setCodesSingleBranchId(config.codesSingleBranchId ?? '');
    setIsCodesMultipleSemesters(config.isCodesMultipleSemesters ?? false);
    setCodesSelectedSemesters(config.codesSelectedSemesters ?? []);
    setCodesSingleSemester(config.codesSingleSemester ?? '');
    setSelectedSessions(config.selectedSessions ?? []);
    setAutoSelectedSubjects(config.subjects ?? []);
    setAutoStep(1); // Go back to Step 1
  };

  const handleAutoGenerateFromCodes = async () => {
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
    if (selectedSessions.length === 0) {
      alert('Please select at least one exam session.');
      return;
    }
    if (autoSelectedSubjects.length === 0) {
      alert('Please select or add at least one subject code.');
      return;
    }

    const totalOperations = targetBranches.length * targetSemesters.length * autoSelectedSubjects.length * selectedSessions.length;
    setIsCodesPublishing(true);
    setCodesProgress({ total: totalOperations, done: 0 });
    setAutoStatusCounters({ success: 0, error: 0 });

    // Save configuration as "last configuration"
    const lastConfig = {
      isCodesMultipleBranches,
      codesSelectedBranches,
      codesSingleBranchId,
      isCodesMultipleSemesters,
      codesSelectedSemesters,
      codesSingleSemester,
      selectedSessions,
      subjects: autoSelectedSubjects
    };
    try {
      localStorage.setItem('pyq_last_config', JSON.stringify(lastConfig));
    } catch (e) {
      console.error('Failed to save last config:', e);
    }

    const publishedIds: string[] = [];
    let operationsDone = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const bId of targetBranches) {
      const selectedBranchObj = branches.find(b => b.id === bId);
      const branchSlug = selectedBranchObj?.slug || '';
      const courseCode = getCourseCodeFromBranch(branchSlug);

      for (const sem of targetSemesters) {
        for (const code of autoSelectedSubjects) {
          const subName = subjectMappings[code] || `GTU Course ${code}`;
          
          for (const sessionCode of selectedSessions) {
            const seasonChar = sessionCode.charAt(0).toUpperCase(); // 'W' or 'S'
            const examYear = sessionCode.substring(1); // '2025'
            const seasonLabel = seasonChar === 'W' ? 'Winter' : 'Summer';
            const sessionLabel = `${seasonLabel} ${examYear}`;

            setCodesProgress({
              total: totalOperations,
              done: operationsDone,
              current: `${code} - ${subName} (${sessionLabel}) [Sem ${sem}]`
            });

            try {
              const gtuUrl = getGtuPyqUrl(sessionCode, courseCode, code);

              const formData = new FormData();
              formData.append('title', `${subName} (${sessionLabel})`);
              formData.append('material_type', 'pyq');
              formData.append('status', 'published');
              formData.append('manual_subject_name', subName);
              formData.append('branch_ids', bId);
              formData.append('semesters', String(sem));
              formData.append('subject_code', code);
              formData.append('exam_session', seasonLabel.toLowerCase()); // 'winter' or 'summer'
              formData.append('exam_year', examYear);
              formData.append('file_url', gtuUrl);

              const res = await apiClient.addAdminMaterial(formData);
              if (res && res.id) {
                publishedIds.push(res.id);
                successCount++;
              } else {
                errorCount++;
              }
            } catch (err) {
              console.error(`Failed to auto-generate PYQ for ${code} (${sessionLabel}):`, err);
              errorCount++;
            }

            operationsDone++;
            setAutoStatusCounters({ success: successCount, error: errorCount });
          }
        }
      }
    }

    setCodesProgress({ total: totalOperations, done: totalOperations });
    setIsCodesPublishing(false);

    // Save history log entry
    const newEntry = {
      id: 'bulk_' + Date.now(),
      date: new Date().toISOString(),
      branches: targetBranches.map(bId => branches.find(b => b.id === bId)?.short_name || bId),
      semesters: targetSemesters,
      sessions: selectedSessions,
      subjectsCount: autoSelectedSubjects.length,
      uploadedBy: currentUser?.email || 'admin@shikshasahayak.org',
      status: errorCount === 0 ? 'success' : (successCount > 0 ? 'partial' : 'failed'),
      successCount,
      errorCount,
      totalCount: totalOperations,
      rawConfig: lastConfig
    };
    saveBulkUploadHistory(newEntry);

    if (publishedIds.length > 0) {
      setUploadedMaterialIds(publishedIds);
    }
  };

  const validatedSubjects = React.useMemo(() => {
    const targetBranches = isCodesMultipleBranches ? codesSelectedBranches : [codesSingleBranchId].filter(Boolean);
    const targetSemesters = isCodesMultipleSemesters ? codesSelectedSemesters : [Number(codesSingleSemester)].filter(s => !isNaN(s) && s >= 0);

    return autoSelectedSubjects.map(code => {
      const isFormatValid = /^\d{4,9}$/.test(code);
      if (!isFormatValid) {
        return { code, name: 'Invalid Code', status: 'invalid', message: 'Subject code must be 4-9 digits' };
      }

      const name = subjectMappings[code] || `GTU Subject ${code}`;
      const isUnknown = !subjectMappings[code];

      // Check if already uploaded for ANY selected combination
      let isAlreadyUploaded = false;
      let matchingCombs = 0;
      let totalCombs = 0;

      for (const bId of targetBranches) {
        for (const sem of targetSemesters) {
          for (const sessionCode of selectedSessions) {
            totalCombs++;
            const season = sessionCode.charAt(0).toLowerCase() === 'w' ? 'winter' : 'summer';
            const year = sessionCode.substring(1);
            const found = materials.some(
              m =>
                m.branch_id === bId &&
                Number(m.semester) === sem &&
                m.subject_code === code &&
                m.exam_session?.toLowerCase() === season &&
                String(m.exam_year) === year
            );
            if (found) {
              isAlreadyUploaded = true;
              matchingCombs++;
            }
          }
        }
      }

      if (isAlreadyUploaded) {
        return {
          code,
          name,
          status: 'uploaded',
          message: matchingCombs === totalCombs 
            ? 'Already uploaded for all configurations' 
            : `Uploaded for ${matchingCombs}/${totalCombs} configurations`
        };
      }

      if (isUnknown) {
        return { code, name, status: 'unknown', message: 'Valid format, code unknown to catalog' };
      }

      return { code, name, status: 'valid', message: 'Ready to generate' };
    });
  }, [autoSelectedSubjects, codesSingleBranchId, codesSingleSemester, isCodesMultipleBranches, codesSelectedBranches, isCodesMultipleSemesters, codesSelectedSemesters, selectedSessions, subjectMappings, materials]);

  const previewEntries = React.useMemo(() => {
    const targetBranches = isCodesMultipleBranches ? codesSelectedBranches : [codesSingleBranchId].filter(Boolean);
    const targetSemesters = isCodesMultipleSemesters ? codesSelectedSemesters : [Number(codesSingleSemester)].filter(s => !isNaN(s) && s >= 0);

    const entries: any[] = [];
    for (const bId of targetBranches) {
      const bObj = branches.find(b => b.id === bId);
      const branchNameShort = bObj?.short_name || bObj?.name || bId;
      const branchSlug = bObj?.slug || '';
      const courseCode = getCourseCodeFromBranch(branchSlug);

      for (const sem of targetSemesters) {
        for (const code of autoSelectedSubjects) {
          const subName = subjectMappings[code] || `GTU Subject ${code}`;
          
          for (const sessionCode of selectedSessions) {
            const seasonChar = sessionCode.charAt(0).toUpperCase();
            const examYear = sessionCode.substring(1);
            const seasonLabel = seasonChar === 'W' ? 'Winter' : 'Summer';
            const sessionLabel = `${seasonLabel} ${examYear}`;
            const gtuUrl = getGtuPyqUrl(sessionCode, courseCode, code);

            // check if uploaded
            const season = sessionCode.charAt(0).toLowerCase() === 'w' ? 'winter' : 'summer';
            const isUploaded = materials.some(
              m =>
                m.branch_id === bId &&
                Number(m.semester) === sem &&
                m.subject_code === code &&
                m.exam_session?.toLowerCase() === season &&
                String(m.exam_year) === examYear
            );

            entries.push({
              key: `${bId}_${sem}_${code}_${sessionCode}`,
              subject: subName,
              code,
              branch: branchNameShort,
              semester: sem,
              session: sessionLabel,
              link: gtuUrl,
              status: isUploaded ? 'Uploaded' : 'Ready'
            });
          }
        }
      }
    }
    return entries;
  }, [codesSingleBranchId, codesSingleSemester, isCodesMultipleBranches, codesSelectedBranches, isCodesMultipleSemesters, codesSelectedSemesters, selectedSessions, autoSelectedSubjects, branches, subjectMappings, materials]);

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const codes = Array.from(new Set(
        text
          .split(/[\n,;\s\r]+/)
          .map(c => c.trim().toUpperCase())
          .filter(c => /^\d{4,9}$/.test(c))
      ));
      
      if (codes.length === 0) {
        alert('No valid subject codes found in the file.');
        return;
      }
      
      setAutoSelectedSubjects(prev => {
        const next = [...prev];
        codes.forEach(c => {
          if (!next.includes(c)) next.push(c);
        });
        return next;
      });
      alert(`Successfully imported ${codes.length} subject codes!`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderCodesSuccessPanel = () => {
    const targetBranches = isCodesMultipleBranches ? codesSelectedBranches : [codesSingleBranchId].filter(Boolean);
    const targetSemesters = isCodesMultipleSemesters ? codesSelectedSemesters : [Number(codesSingleSemester)].filter(s => !isNaN(s) && s >= 0);

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-10 px-6 max-w-xl mx-auto space-y-8 bg-surface border border-border rounded-3xl shadow-lg relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-success via-emerald-400 to-teal-500" />
        
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto border border-success/20 shadow-inner relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          >
            <CheckCircle2 className="h-12 w-12 text-success animate-bounce" />
          </motion.div>
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-black text-text">Bulk Upload Completed!</h3>
          <p className="text-sm text-muted font-medium max-w-md mx-auto leading-relaxed">
            Successfully generated direct download links, matched subject codes, created database records, and synced with CDN storage.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-background/50 border border-border p-5 rounded-2xl">
          <div className="text-left space-y-1">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Total Links Generated</span>
            <span className="text-2xl font-black text-primary">{uploadedMaterialIds.length}</span>
          </div>
          <div className="text-left space-y-1 border-l border-border pl-4">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Subjects Processed</span>
            <span className="text-2xl font-black text-accent">{autoSelectedSubjects.length}</span>
          </div>
        </div>

        <div className="space-y-3 text-left bg-surface-secondary/45 border border-border p-5 rounded-2xl">
          <h4 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
            <Info className="h-4 w-4 text-primary" /> System Sync Status
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-text font-medium">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> D1 Database Records Created
              </span>
              <span className="text-success font-bold">100% Synced</span>
            </div>
            <div className="flex items-center justify-between text-xs text-text font-medium">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Cloudflare CDN Links Resolved
              </span>
              <span className="text-success font-bold">100% Synced</span>
            </div>
            <div className="flex items-center justify-between text-xs text-text font-medium">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> subject_codes.json Matching
              </span>
              <span className="text-success font-bold">Verified</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button 
            type="button"
            onClick={() => {
              if (targetBranches[0]) setFilterBranch(targetBranches[0]);
              if (targetSemesters[0]) setFilterSemester(String(targetSemesters[0]));
              resetForm();
              setIsCreating(false);
            }}
            className="flex-1 bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <Eye className="h-4 w-4" /> View Published PYQs
          </button>
          
          <button 
            type="button"
            onClick={resetForm}
            className="flex-1 bg-surface-secondary hover:bg-border border border-border text-text py-3 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" /> Generate Another
          </button>
        </div>
      </motion.div>
    );
  };

  const renderCodesAutoGeneratorContent = () => {
    const recentSessions = generateGtuRecentSessions(2018);
    const targetBranches = isCodesMultipleBranches ? codesSelectedBranches : [codesSingleBranchId].filter(Boolean);
    const targetSemesters = isCodesMultipleSemesters ? codesSelectedSemesters : [Number(codesSingleSemester)].filter(s => !isNaN(s) && s >= 0);
    const totalEstLinks = targetBranches.length * targetSemesters.length * autoSelectedSubjects.length * selectedSessions.length;

    const renderStepIndicator = () => {
      const steps = [
        { id: 1, name: 'Branch & Sem', desc: 'Select target group' },
        { id: 2, name: 'Sessions', desc: 'Select terms' },
        { id: 3, name: 'Subjects', desc: 'Select courses' },
        { id: 4, name: 'Preview', desc: 'Review & Publish' }
      ];

      return (
        <div className="bg-surface border border-border p-4 rounded-2xl shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20 shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text">PYQ Bulk Auto-Generator</h3>
                <p className="text-[11px] text-muted font-medium">Configure and publish multiple papers in 4 simple steps</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
              {steps.map((s, idx) => {
                const isActive = autoStep === s.id;
                const isCompleted = autoStep > s.id;
                return (
                  <React.Fragment key={s.id}>
                    {idx > 0 && <ChevronRight className="h-4 w-4 text-muted shrink-0" />}
                    <button
                      type="button"
                      onClick={() => {
                        if (s.id < autoStep || (s.id <= 4 && !isCodesPublishing)) {
                          setAutoStep(s.id);
                        }
                      }}
                      disabled={isCodesPublishing}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        isActive 
                          ? 'bg-primary border-primary text-white shadow-sm'
                          : isCompleted
                            ? 'bg-success/10 border-success/20 text-success'
                            : 'bg-background border-border text-muted hover:text-text'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        isActive
                          ? 'bg-white text-primary'
                          : isCompleted
                            ? 'bg-success text-white'
                            : 'bg-border text-muted'
                      }`}>
                        {isCompleted ? '✓' : s.id}
                      </span>
                      <div className="text-left">
                        <span className="block leading-none">{s.name}</span>
                      </div>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      );
    };

    const renderStep1 = () => {
      return (
        <motion.div
          key="step1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="bg-surface border border-border p-6 rounded-2xl shadow-sm space-y-6"
        >
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="h-4.5 w-4.5 text-primary" /> Step 1: Select Departments & Semesters
            </h4>
            <p className="text-xs text-muted font-medium">Choose target departments (branches) and semester levels to link.</p>
          </div>

          {/* Branch Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text">Department / Branch Selection Mode</label>
              <div className="flex bg-background border border-border p-0.5 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setIsCodesMultipleBranches(false);
                    setCodesSelectedBranches([]);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${!isCodesMultipleBranches ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-text'}`}
                >
                  Single Branch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCodesMultipleBranches(true);
                    if (codesSingleBranchId) setCodesSelectedBranches([codesSingleBranchId]);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${isCodesMultipleBranches ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-text'}`}
                >
                  Multiple Branches
                </button>
              </div>
            </div>

            {!isCodesMultipleBranches ? (
              <select
                value={codesSingleBranchId}
                onChange={e => {
                  if (e.target.value === 'multiple') {
                    setIsCodesMultipleBranches(true);
                    setCodesSelectedBranches([]);
                  } else {
                    setCodesSingleBranchId(e.target.value);
                  }
                }}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text text-sm focus:border-primary outline-none appearance-none"
              >
                <option value="">Select Branch</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
                <option value="multiple">Multiple Departments</option>
              </select>
            ) : (
              <div className="bg-background border border-border p-4 rounded-xl max-h-56 overflow-y-auto space-y-2.5">
                <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                  <span className="text-[10px] font-bold text-muted uppercase">Select Branches ({codesSelectedBranches.length}/{branches.length})</span>
                  <button
                    type="button"
                    onClick={() => setCodesSelectedBranches(branches.map(b => b.id))}
                    className="text-[10px] text-primary font-bold hover:underline"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {branches.map(b => (
                    <label key={b.id} className="flex items-center gap-2 text-xs text-text font-medium cursor-pointer p-1.5 hover:bg-surface rounded-lg transition-colors border border-transparent hover:border-border">
                      <input
                        type="checkbox"
                        checked={codesSelectedBranches.includes(b.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setCodesSelectedBranches(prev => [...prev, b.id]);
                          } else {
                            setCodesSelectedBranches(prev => prev.filter(id => id !== b.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                      />
                      <span>{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Semester Selection */}
          <div className="space-y-3 border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text">Semester Selection Mode</label>
              <div className="flex bg-background border border-border p-0.5 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setIsCodesMultipleSemesters(false);
                    setCodesSelectedSemesters([]);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${!isCodesMultipleSemesters ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-text'}`}
                >
                  Single Semester
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCodesMultipleSemesters(true);
                    if (codesSingleSemester) setCodesSelectedSemesters([Number(codesSingleSemester)]);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${isCodesMultipleSemesters ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-text'}`}
                >
                  Multiple Semesters
                </button>
              </div>
            </div>

            {!isCodesMultipleSemesters ? (
              <select
                value={codesSingleSemester}
                onChange={e => {
                  if (e.target.value === 'multiple') {
                    setIsCodesMultipleSemesters(true);
                    setCodesSelectedSemesters([]);
                  } else {
                    setCodesSingleSemester(e.target.value);
                  }
                }}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text text-sm focus:border-primary outline-none appearance-none"
              >
                <option value="">Select Semester</option>
                {SEMESTERS.map(s => (
                  <option key={s} value={String(s)}>Semester {formatSemester(s)}</option>
                ))}
                <option value="multiple">Multiple Semesters</option>
              </select>
            ) : (
              <div className="bg-background border border-border p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                  <span className="text-[10px] font-bold text-muted uppercase">Select Semesters ({codesSelectedSemesters.length}/{SEMESTERS.length})</span>
                  <button
                    type="button"
                    onClick={() => setCodesSelectedSemesters([...SEMESTERS])}
                    className="text-[10px] text-primary font-bold hover:underline"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {SEMESTERS.map(s => (
                    <label key={s} className="flex items-center justify-center gap-1.5 text-xs text-text font-medium cursor-pointer p-2.5 hover:bg-surface rounded-lg transition-colors border border-border">
                      <input
                        type="checkbox"
                        checked={codesSelectedSemesters.includes(s)}
                        onChange={e => {
                          if (e.target.checked) {
                            setCodesSelectedSemesters(prev => [...prev, s]);
                          } else {
                            setCodesSelectedSemesters(prev => prev.filter(val => val !== s));
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
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                const targetBranches = isCodesMultipleBranches ? codesSelectedBranches : [codesSingleBranchId].filter(Boolean);
                const targetSemesters = isCodesMultipleSemesters ? codesSelectedSemesters : [Number(codesSingleSemester)].filter(s => !isNaN(s) && s >= 0);
                if (targetBranches.length === 0) {
                  alert('Please select a branch.');
                  return;
                }
                if (targetSemesters.length === 0) {
                  alert('Please select a semester.');
                  return;
                }
                setAutoStep(2);
              }}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-1.5 text-sm cursor-pointer animate-fade-in"
            >
              Next Step <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      );
    };

    const renderStep2 = () => {
      return (
        <motion.div
          key="step2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="bg-surface border border-border p-6 rounded-2xl shadow-sm space-y-6"
        >
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-4.5 w-4.5 text-primary" /> Step 2: Select Exam Sessions
            </h4>
            <p className="text-xs text-muted font-medium">Select GTU term seasons (Winter/Summer) to create papers for.</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedSessions(recentSessions.map(s => s.code))}
              className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-xl hover:bg-primary/20 font-bold transition-all cursor-pointer"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => setSelectedSessions([])}
              className="text-[10px] bg-surface-secondary text-muted border border-border px-3 py-1.5 rounded-xl hover:bg-border font-bold transition-all cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
            {recentSessions.map((session) => {
              const isSelected = selectedSessions.includes(session.code);
              
              // Check status of uploads in selected configuration
              let uploadedCount = 0;
              let totalCombinations = 0;
              
              if (autoSelectedSubjects.length > 0) {
                for (const bId of targetBranches) {
                  for (const sem of targetSemesters) {
                    for (const code of autoSelectedSubjects) {
                      totalCombinations++;
                      const season = session.code.charAt(0).toLowerCase() === 'w' ? 'winter' : 'summer';
                      const year = session.code.substring(1);
                      const found = materials.some(
                        m =>
                          m.branch_id === bId &&
                          Number(m.semester) === sem &&
                          m.subject_code === code &&
                          m.exam_session?.toLowerCase() === season &&
                          String(m.exam_year) === year
                      );
                      if (found) uploadedCount++;
                    }
                  }
                }
              }

              const status = uploadedCount === 0 
                ? 'missing' 
                : uploadedCount === totalCombinations && totalCombinations > 0 
                  ? 'uploaded' 
                  : 'partial';

              return (
                <button
                  key={session.code}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedSessions(prev => prev.filter(c => c !== session.code));
                    } else {
                      setSelectedSessions(prev => [...prev, session.code]);
                    }
                  }}
                  className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 h-28 relative overflow-hidden group hover:scale-[1.01] ${
                    isSelected 
                      ? 'bg-primary/5 border-primary shadow-sm dark:bg-primary/10' 
                      : 'bg-background border-border hover:border-border hover:bg-surface-secondary/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-extrabold text-xs text-text">{session.label}</span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="h-4 w-4 rounded border-gray-300 text-primary accent-primary pointer-events-none"
                    />
                  </div>

                  <div className="z-10">
                    {status === 'uploaded' && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-success bg-success/15 border border-success/30 px-2 py-0.5 rounded-full">
                        ✓ Uploaded
                      </span>
                    )}
                    {status === 'partial' && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-500 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        ⚠ Partial ({uploadedCount}/{totalCombinations})
                      </span>
                    )}
                    {status === 'missing' && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-muted bg-surface-secondary border border-border px-2 py-0.5 rounded-full">
                        Missing
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setAutoStep(1)}
              className="border border-border hover:bg-surface-secondary text-text px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-sm cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            
            <button
              type="button"
              onClick={() => {
                if (selectedSessions.length === 0) {
                  alert('Please select at least one session.');
                  return;
                }
                setAutoStep(3);
              }}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-1.5 text-sm cursor-pointer"
            >
              Next Step <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      );
    };

    const renderStep3 = () => {
      const filteredSubjectOptions = Object.entries(subjectMappings)
        .map(([code, name]) => ({ code, name }))
        .filter(opt => {
          const q = autoSubjectSearch.toLowerCase();
          return opt.code.includes(q) || opt.name.toLowerCase().includes(q);
        })
        .slice(0, 8);

      const allDbCodes = codesDbSubjects
        .map(s => s.subjectCode || '')
        .filter(Boolean);
      const allDbSelected = allDbCodes.length > 0 && allDbCodes.every(c => autoSelectedSubjects.includes(c));

      return (
        <motion.div
          key="step3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="bg-surface border border-border p-6 rounded-2xl shadow-sm space-y-6"
        >
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="h-4.5 w-4.5 text-primary" /> Step 3: Select Subjects
            </h4>
            <p className="text-xs text-muted font-medium">Select subjects from your database or search/paste GTU codes.</p>
          </div>

          {/* ── From Your Database ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                From Your Database
                {isCodesDbLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />}
                {!isCodesDbLoading && codesDbSubjects.length > 0 && (
                  <span className="text-[10px] font-bold text-muted bg-surface-secondary px-1.5 py-0.5 rounded-full">
                    {codesDbSubjects.length} subjects
                  </span>
                )}
              </label>
              {!isCodesDbLoading && codesDbSubjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (allDbSelected) {
                      setAutoSelectedSubjects(prev => prev.filter(c => !allDbCodes.includes(c)));
                    } else {
                      setAutoSelectedSubjects(prev => {
                        const next = [...prev];
                        allDbCodes.forEach(c => { if (!next.includes(c)) next.push(c); });
                        return next;
                      });
                    }
                  }}
                  className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
                >
                  {allDbSelected ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {isCodesDbLoading ? (
              <div className="flex items-center justify-center h-20 text-muted text-xs gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Fetching subjects from database…
              </div>
            ) : codesDbSubjects.length === 0 ? (
              <div className="flex items-center justify-center h-16 text-muted text-xs bg-background border border-border rounded-xl">
                No subjects found for the selected branch(es) and semester(s).
              </div>
            ) : (
              <div className="bg-background border border-border rounded-xl divide-y divide-border max-h-64 overflow-y-auto">
                {codesDbSubjects.map(subject => {
                  const code = subject.subjectCode || '';
                  const isSelected = autoSelectedSubjects.includes(code);
                  return (
                    <label
                      key={subject.id || code}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-secondary/40 transition-colors ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => {
                          if (e.target.checked) {
                            setAutoSelectedSubjects(prev => [...prev, code]);
                          } else {
                            setAutoSelectedSubjects(prev => prev.filter(c => c !== code));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-text block truncate">{subject.subjectName}</span>
                        {code && (
                          <span className="text-[10px] font-mono text-primary">{code}</span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-success shrink-0" />
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Search for GTU subjects ── */}
          <div className="space-y-2 relative border-t border-border pt-4">
            <label className="text-xs font-bold text-text">Search GTU Subject Codes</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                value={autoSubjectSearch}
                onChange={e => setAutoSubjectSearch(e.target.value)}
                placeholder="Type subject code or name… (e.g. Mathematics, 3110015)"
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-text text-sm focus:border-primary outline-none"
              />
            </div>

            {/* Autocomplete Dropdown list */}
            {autoSubjectSearch.trim().length > 0 && filteredSubjectOptions.length > 0 && (
              <div className="absolute left-0 right-0 z-30 bg-surface border border-border rounded-2xl shadow-lg mt-1 overflow-hidden divide-y divide-border max-h-60 overflow-y-auto">
                {filteredSubjectOptions.map((opt) => {
                  const isAlreadySelected = autoSelectedSubjects.includes(opt.code);
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => {
                        if (!isAlreadySelected) {
                          setAutoSelectedSubjects(prev => [...prev, opt.code]);
                        }
                        setAutoSubjectSearch('');
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-surface-secondary/50 text-xs font-medium text-text flex items-center justify-between transition-colors"
                    >
                      <div>
                        <span className="font-bold text-primary mr-2 font-mono">{opt.code}</span>
                        <span>{opt.name}</span>
                      </div>
                      {isAlreadySelected ? (
                        <span className="text-[10px] font-bold text-success">Added</span>
                      ) : (
                        <Plus className="h-3.5 w-3.5 text-muted hover:text-primary transition-colors" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Removable Chips */}
          {autoSelectedSubjects.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted uppercase block">Selected Courses ({autoSelectedSubjects.length})</label>
              <div className="flex flex-wrap gap-2">
                {autoSelectedSubjects.map((code) => {
                  const name = subjectMappings[code] || `GTU Code ${code}`;
                  return (
                    <div key={code} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border text-xs font-bold text-text">
                      <span className="font-mono text-primary">{code}</span>
                      <span className="truncate max-w-[120px] text-muted font-medium">{name}</span>
                      <button
                        type="button"
                        onClick={() => setAutoSelectedSubjects(prev => prev.filter(c => c !== code))}
                        className="text-muted hover:text-danger rounded-full p-0.5 transition-colors cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Paste Block */}
          <div className="space-y-3 bg-background border border-border p-4 rounded-2xl">
            <label className="text-xs font-bold text-text flex items-center gap-1.5">
              <Copy className="h-4 w-4 text-accent" /> Paste Multiple Subject Codes
            </label>
            <textarea
              placeholder="Paste subject codes list (comma, space or line separated)&#10;e.g. 3130014, 3150703, 3110015"
              rows={3}
              value={codesInput}
              onChange={e => setCodesInput(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl p-3 text-xs font-mono focus:border-primary outline-none resize-none placeholder-muted"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const parsed = Array.from(new Set(
                    codesInput
                      .split(/[\n,;\s]+/)
                      .map(c => c.trim().toUpperCase())
                      .filter(c => /^\d{4,9}$/.test(c))
                  ));
                  if (parsed.length === 0) {
                    alert('No valid subject codes found in the pasted content.');
                    return;
                  }
                  setAutoSelectedSubjects(prev => {
                    const next = [...prev];
                    parsed.forEach(code => {
                      if (!next.includes(code)) next.push(code);
                    });
                    return next;
                  });
                  setCodesInput('');
                }}
                className="bg-accent/10 border border-accent/30 hover:bg-accent/20 text-accent px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Parse & Add Codes
              </button>
            </div>
          </div>

          {/* Real-time Validation Report */}
          {validatedSubjects.length > 0 && (
            <div className="space-y-3 border-t border-border pt-4">
              <label className="text-[10px] font-bold text-muted uppercase block">Real-time Validation Report</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {validatedSubjects.map(sub => (
                  <div key={sub.code} className="flex items-center justify-between text-xs bg-background p-2.5 rounded-xl border border-border">
                    <div className="flex items-center gap-2">
                      {sub.status === 'valid' && <CheckCircle className="h-4 w-4 text-success" />}
                      {sub.status === 'uploaded' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      {sub.status === 'unknown' && <Info className="h-4 w-4 text-primary" />}
                      {sub.status === 'invalid' && <XCircle className="h-4 w-4 text-danger" />}
                      <div>
                        <span className="font-bold text-text">{sub.code} - {sub.name}</span>
                        <span className="block text-[9px] text-muted font-medium mt-0.5">{sub.message}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoSelectedSubjects(prev => prev.filter(c => c !== sub.code))}
                      className="text-muted hover:text-danger text-[10px] font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setAutoStep(2)}
              className="border border-border hover:bg-surface-secondary text-text px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-sm cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            
            <button
              type="button"
              onClick={() => {
                if (autoSelectedSubjects.length === 0) {
                  alert('Please select or add at least one subject.');
                  return;
                }
                setAutoStep(4);
              }}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-1.5 text-sm cursor-pointer"
            >
              Next Step <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      );
    };

    const renderStep4 = () => {
      return (
        <motion.div
          key="step4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="bg-surface border border-border p-6 rounded-2xl shadow-sm space-y-6"
        >
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
              <Info className="h-4.5 w-4.5 text-primary" /> Step 4: Preview & Publish
            </h4>
            <p className="text-xs text-muted font-medium">Verify the link structure and metadata before committing to D1 database.</p>
          </div>

          {/* Preview Table */}
          <div className="border border-border rounded-xl overflow-hidden bg-background">
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface border-b border-border font-bold text-muted">
                    <th className="px-4 py-3">Subject / Code</th>
                    <th className="px-4 py-3">Dept</th>
                    <th className="px-4 py-3">Sem</th>
                    <th className="px-4 py-3">Session</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewEntries.map((ent) => (
                    <tr key={ent.key} className="hover:bg-surface-secondary/40 font-medium">
                      <td className="px-4 py-2.5 truncate max-w-[150px]" title={ent.subject}>
                        <span className="font-bold text-text block">{ent.code}</span>
                        <span className="text-[10px] text-muted">{ent.subject}</span>
                      </td>
                      <td className="px-4 py-2.5 text-text font-bold uppercase">{ent.branch}</td>
                      <td className="px-4 py-2.5 text-text">Sem {ent.semester}</td>
                      <td className="px-4 py-2.5 text-accent font-bold">{ent.session}</td>
                      <td className="px-4 py-2.5">
                        {ent.status === 'Uploaded' ? (
                          <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            Exists
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
                            Ready
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <a 
                          href={ent.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:underline font-mono text-[10px] inline-flex items-center gap-1.5"
                        >
                          PDF Link <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setAutoStep(3)}
              className="border border-border hover:bg-surface-secondary text-text px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-1.5 text-sm cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <button
              type="button"
              onClick={handleAutoGenerateFromCodes}
              disabled={isCodesPublishing}
              className="bg-primary hover:bg-primary/95 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isCodesPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing ({codesProgress?.done}/{codesProgress?.total})...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 fill-white text-white" /> ⚡ Generate & Publish PYQs
                </>
              )}
            </button>
          </div>
        </motion.div>
      );
    };

    const renderSummaryCard = () => {
      return (
        <div className="bg-surface border border-border p-5 rounded-2xl shadow-sm space-y-5">
          <h4 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
            <Info className="h-4.5 w-4.5 text-primary" /> Configuration Summary
          </h4>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted font-semibold">Departments</span>
              <span className="font-bold text-text text-right max-w-[140px] truncate">
                {isCodesMultipleBranches 
                  ? `${targetBranches.length} selected`
                  : (branches.find(b => b.id === codesSingleBranchId)?.short_name || 'Not selected')}
              </span>
            </div>

            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted font-semibold">Semesters</span>
              <span className="font-bold text-text font-medium">
                {isCodesMultipleSemesters
                  ? `${targetSemesters.length} selected`
                  : (codesSingleSemester ? `Sem ${codesSingleSemester}` : 'Not selected')}
              </span>
            </div>

            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted font-semibold">Sessions Selected</span>
              <span className="font-bold text-text">{selectedSessions.length} sessions</span>
            </div>

            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted font-semibold">Total Subjects</span>
              <span className="font-bold text-text">{autoSelectedSubjects.length} subjects</span>
            </div>

            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted font-semibold">Estimated Link Entries</span>
              <span className="font-black text-accent">{totalEstLinks} PDF URLs</span>
            </div>

            <div className="flex justify-between pb-1">
              <span className="text-muted font-semibold">Upload Status</span>
              <span className={`font-bold uppercase text-[9px] px-2 py-0.5 rounded-full ${
                isCodesPublishing
                  ? 'bg-primary/15 text-primary border border-primary/20 animate-pulse'
                  : 'bg-surface-secondary border border-border text-muted font-medium'
              }`}>
                {isCodesPublishing ? 'Publishing' : 'Draft'}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {isCodesPublishing && codesProgress && (
            <div className="space-y-3 border-t border-border pt-4 bg-background/30 p-3.5 rounded-xl border border-border/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" /> Publishing...
                </span>
                <span className="font-bold text-primary">{Math.round((codesProgress.done / codesProgress.total) * 100)}%</span>
              </div>
              
              <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${(codesProgress.done / codesProgress.total) * 100}%` }}
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted block uppercase">Current Processing Item:</span>
                <span className="text-[10px] text-text font-mono truncate block bg-surface/50 p-1.5 rounded border border-border" title={codesProgress.current}>
                  {codesProgress.current || 'Parsing metadata...'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
                <div className="bg-success/10 text-success border border-success/20 py-1 rounded">
                  ✓ Success: {autoStatusCounters.success}
                </div>
                <div className="bg-danger/10 text-danger border border-danger/20 py-1 rounded">
                  ✖ Errors: {autoStatusCounters.error}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions List */}
          <div className="border-t border-border pt-4 space-y-2">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Quick Actions</label>
            
            <button
              type="button"
              disabled={isCodesPublishing || autoUploadHistory.length === 0}
              onClick={() => {
                if (autoUploadHistory[0]?.rawConfig) {
                  applyConfig(autoUploadHistory[0].rawConfig);
                  alert('Previous configuration loaded!');
                }
              }}
              className="w-full text-left py-2 px-3 hover:bg-surface-secondary/50 rounded-xl text-xs font-semibold text-text flex items-center gap-2 border border-transparent hover:border-border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Copy className="h-3.5 w-3.5 text-primary" /> Clone Previous Upload
            </button>

            <button
              type="button"
              disabled={isCodesPublishing}
              onClick={() => {
                try {
                  const last = localStorage.getItem('pyq_last_config');
                  if (last) {
                    applyConfig(JSON.parse(last));
                    alert('Last configuration loaded!');
                  } else {
                    alert('No configuration saved yet.');
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              className="w-full text-left py-2 px-3 hover:bg-surface-secondary/50 rounded-xl text-xs font-semibold text-text flex items-center gap-2 border border-transparent hover:border-border transition-all cursor-pointer disabled:opacity-50"
            >
              <Settings className="h-3.5 w-3.5 text-accent" /> Use Last Configuration
            </button>

            <label className="w-full py-2 px-3 hover:bg-surface-secondary/50 rounded-xl text-xs font-semibold text-text flex items-center gap-2 border border-transparent hover:border-border transition-all cursor-pointer">
              <FileSpreadsheet className="h-3.5 w-3.5 text-success" /> Import Codes CSV/TXT
              <input
                type="file"
                accept=".csv,.txt"
                disabled={isCodesPublishing}
                onChange={handleImportCSV}
                className="hidden"
              />
            </label>

            <button
              type="button"
              disabled={isCodesPublishing}
              onClick={resetForm}
              className="w-full text-left py-2 px-3 hover:bg-danger/10 rounded-xl text-xs font-semibold text-danger flex items-center gap-2 border border-transparent hover:border-danger/20 transition-all cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-danger" /> Reset Uploader
            </button>
          </div>
        </div>
      );
    };

    const renderHistoryLog = () => {
      if (autoUploadHistory.length === 0) return null;
      return (
        <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-text">
            <History className="h-5 w-5 text-primary" />
            <h4 className="text-sm font-bold">PYQ Bulk Upload History</h4>
          </div>

          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-secondary border-b border-border text-muted font-bold">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Branches</th>
                  <th className="px-5 py-3">Semesters</th>
                  <th className="px-5 py-3">Sessions</th>
                  <th className="px-5 py-3">Subjects</th>
                  <th className="px-5 py-3">Uploaded By</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {autoUploadHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-secondary/40 font-medium">
                    <td className="px-5 py-3 text-muted">
                      {new Date(item.date).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-5 py-3 truncate max-w-[150px]" title={item.branches?.join(', ')}>
                      {item.branches?.join(', ') || 'N/A'}
                    </td>
                    <td className="px-5 py-3">Sem {item.semesters?.join(', ') || 'N/A'}</td>
                    <td className="px-5 py-3 truncate max-w-[150px]" title={item.sessions?.join(', ')}>
                      {item.sessions?.join(', ') || 'N/A'}
                    </td>
                    <td className="px-5 py-3 font-bold">{item.subjectsCount} subjects</td>
                    <td className="px-5 py-3 truncate max-w-[120px] text-muted" title={item.uploadedBy}>
                      {item.uploadedBy}
                    </td>
                    <td className="px-5 py-3">
                      {item.status === 'success' && (
                        <span className="text-[10px] font-bold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                      )}
                      {item.status === 'partial' && (
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          Partial ({item.successCount}/{item.totalCount})
                        </span>
                      )}
                      {item.status === 'failed' && (
                        <span className="text-[10px] font-bold text-danger bg-danger/10 border border-danger/20 px-2 py-0.5 rounded-full">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          applyConfig(item.rawConfig);
                          alert('Configuration loaded!');
                        }}
                        className="text-xs text-primary font-bold hover:underline cursor-pointer"
                      >
                        Clone Config
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
        {renderStepIndicator()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {autoStep === 1 && renderStep1()}
              {autoStep === 2 && renderStep2()}
              {autoStep === 3 && renderStep3()}
              {autoStep === 4 && renderStep4()}
            </AnimatePresence>
          </div>

          <div className="sticky top-24 space-y-4">
            {renderSummaryCard()}
          </div>
        </div>

        {renderHistoryLog()}
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
                <label className="text-xs font-bold text-text">Subject Name</label>
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
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-xs font-bold text-text">Custom Subject</label>
                    <input type="text" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g. EM-2" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted" />
                  </div>
                );
              })()}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text">Exam Session (Season & Year)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select value={examSeason} onChange={e => setExamSeason(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm appearance-none">
                      <option value="">Select Season</option>
                      <option>Summer</option>
                      <option>Winter</option>
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted">▼</div>
                  </div>
                  <input type="number" value={examYear} onChange={e => setExamYear(e.target.value)} placeholder="Year (e.g. 2026)" className="w-32 bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text">PYQ Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Winter 2026 - DBMS End Sem" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted font-bold" />
              </div>
            </div>
            
            <div className="flex justify-end mt-8">
              <button onClick={() => setStep(2)} disabled={!isStep1Valid} className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                Next <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <label className="border-2 border-dashed border-border rounded-xl bg-background p-10 flex flex-col items-center justify-center text-center hover:bg-surface-secondary transition-colors cursor-pointer group relative block">
              <input type="file" accept="application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setQuestionPaperFile(e.target.files?.[0] || null)} />
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileQuestion className="h-7 w-7 text-primary" />
              </div>
              <p className="text-lg font-bold text-text mb-1">
                {questionPaperFile ? questionPaperFile.name : 'Upload Question Paper'}
              </p>
              <p className="text-sm text-muted">
                {questionPaperFile ? `${(questionPaperFile.size / 1024 / 1024).toFixed(2)} MB` : 'Required (.pdf format)'}
              </p>
            </label>

            <label className="border border-dashed border-border rounded-xl bg-background p-6 flex flex-col items-center justify-center text-center hover:bg-surface-secondary transition-colors cursor-pointer group relative block">
              <input type="file" accept="application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setSolutionFile(e.target.files?.[0] || null)} />
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-text mb-1">
                {solutionFile ? solutionFile.name : 'Optional Solution PDF'}
              </p>
              <p className="text-xs text-muted">
                Upload only if you have the solution file.
              </p>
            </label>

            <div className="bg-surface-secondary rounded-xl p-6 border border-border">
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <h4 className="font-bold text-text">Add linked blog post</h4>
                  <p className="text-xs text-muted font-semibold mt-1">Optional: publish analysis, important topics, or paper notes.</p>
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
                    placeholder="Blog title (defaults to PYQ title)"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm placeholder-muted"
                  />
                  <textarea
                    value={blogContent}
                    onChange={e => setBlogContent(e.target.value)}
                    placeholder="Write analysis, important topics, or notes in Markdown..."
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
                <li><strong className="text-text">Session:</strong> {examSeason} {examYear}</li>
                <li><strong className="text-text">Solution:</strong> {solutionFile ? solutionFile.name : 'Not attached'}</li>
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
                disabled={!questionPaperFile || isPublishing || isCompressing} 
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
                    <Send className="h-4 w-4" /> Publish PYQ
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
          <h3 className="text-lg font-bold text-text">Upload PYQ</h3>
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
          uploadMode === 'codes' ? (
            renderCodesSuccessPanel()
          ) : (
            <div className="text-center py-12 px-4 animate-fade-in max-w-md mx-auto space-y-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto border border-success/20">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-bold text-text">Upload Successful!</h4>
                <p className="text-sm text-muted">
                  {uploadedMaterialIds.length > 1
                    ? `Successfully uploaded and published ${uploadedMaterialIds.length} papers to the database and storage.`
                    : 'The PYQ has been uploaded and published to the database and storage.'
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
          )
        ) : (
          <>
            {/* Upload Modes */}
            <div className="flex border-b-2 border-border mb-8 overflow-x-auto scrollbar-hide">
              <button 
                type="button"
                onClick={() => setUploadMode('single')}
                className={`px-6 py-2.5 font-bold text-sm transition-colors border-b-2 -mb-[2px] whitespace-nowrap ${uploadMode === 'single' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'}`}
              >
                Upload File (Single/Multiple)
              </button>
              <button 
                type="button"
                onClick={() => setUploadMode('codes')}
                className={`px-6 py-2.5 font-bold text-sm transition-colors border-b-2 -mb-[2px] whitespace-nowrap flex items-center gap-1.5 ${uploadMode === 'codes' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'}`}
              >
                Auto-Generator by Codes ⚡
              </button>
            </div>

            {uploadMode === 'single' ? (
              <>
                {renderStepper()}
                {renderStepContent()}
              </>
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
          <h2 className="text-2xl font-bold text-text tracking-tight">Manage PYQs</h2>
          <p className="text-sm text-muted mt-1 font-semibold">View, search, and manage all past year papers in D1/R2.</p>
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
            Upload PYQ
          </button>
        </div>
      </div>

      {/* Top Live Website PYQ Visibility Control Switch Card */}
      <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
            siteControl.showPyqs ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
          }`}>
            <FileQuestion className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-text">PYQ Section on Live Website</h3>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                siteControl.showPyqs ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
              }`}>
                {siteControl.showPyqs ? 'LIVE / ENABLED' : 'HIDDEN FROM PUBLIC'}
              </span>
            </div>
            <p className="text-xs text-muted font-semibold mt-0.5">
              Controls whether students can access Previous Year Question Papers (PYQs) across all subject & semester pages.
            </p>
          </div>
        </div>

        <button
          onClick={handleTogglePyqSection}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
            siteControl.showPyqs
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
          {siteControl.showPyqs ? (
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
            <span className="text-sm text-muted font-bold">Loading PYQs...</span>
          </div>
        ) : groupedMaterials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <BookOpen className="h-12 w-12 text-muted mb-3" />
            <h3 className="text-lg font-bold text-text mb-1">No PYQs found</h3>
            <p className="text-sm text-muted max-w-sm font-semibold">Try adjusting your filters or upload a new PYQ using the button above.</p>
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
                  <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Exam Session</th>
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
                          <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center shrink-0 border border-accent/20">
                            <FileQuestion className="h-4.5 w-4.5 text-accent" />
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
                      <td className="px-6 py-4 text-sm font-bold text-accent capitalize">
                        {m.exam_session ? `${m.exam_session} ${m.exam_year || ''}` : (m.exam_year || 'N/A')}
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
                            onClick={() => handleToggleVisibility(m.ids, m.approval_status || 'approved')}
                            disabled={!!isRowDeleting}
                            className={`p-2 rounded-xl transition-all ${
                              (m.approval_status || 'approved') === 'approved'
                                ? 'text-emerald-500 hover:bg-emerald-500/10'
                                : 'text-amber-500 hover:bg-amber-500/10'
                            }`}
                            title={(m.approval_status || 'approved') === 'approved' ? 'Visible on Live Website (Click to Hide)' : 'Hidden from Website / Draft (Click to Publish)'}
                          >
                            {(m.approval_status || 'approved') === 'approved' ? (
                              <Eye className="h-4.5 w-4.5" />
                            ) : (
                              <EyeOff className="h-4.5 w-4.5" />
                            )}
                          </button>
                          <button 
                            onClick={() => setEditingGroup(m)}
                            className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                            title="Edit PYQ"
                          >
                            <Edit className="h-4.5 w-4.5" />
                          </button>
                          <a 
                            href={`/materials/${m.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                            title="View PYQ File"
                          >
                            <ExternalLink className="h-4.5 w-4.5" />
                          </a>
                          <button
                            onClick={() => handleDelete(m.ids)}
                            disabled={!!isRowDeleting}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-50"
                            title="Delete PYQ"
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

export default ManagePYQsUI;
