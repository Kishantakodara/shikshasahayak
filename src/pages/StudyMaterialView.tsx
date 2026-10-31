import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  ThumbsUp, 
  AlertCircle, 
  ArrowLeft, 
  Loader2, 
  PenTool, 
  FileText, 
  Eye, 
  X, 
  Download,
  Clock,
  Check,
  Trash2,
  Edit3,
  ShieldAlert,
  Bookmark
} from 'lucide-react';
import { useParams, useNavigate, useSearchParams, Navigate, Link } from 'react-router-dom';
import ShareModal from '../components/ShareModal';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLearningEcosystem } from '../context/LearningEcosystemContext';
import { formatSemester } from '../constants';
import { usePageMeta } from '../utils/seo';
import { downloadPdfFile, getEmbeddedPdfUrl } from '../utils/downloadPdf';
import { normalizeGtuPyqUrl } from '../utils/gtuPyq';
import MDEditor from '@uiw/react-md-editor';

const getPdfSrc = (url: string) => {
  if (!url) return '';
  return `${url}#toolbar=0&navpanes=0`;
};

const isMobileDevice = () =>
  typeof navigator !== 'undefined' &&
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const StudyMaterialView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [material, setMaterial] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeFile, setActiveFile] = useState<'paper' | 'solution'>('paper');
  const [activeTab, setActiveTab] = useState<'blog' | 'document'>('document');
  const { isBookmarked, addBookmark, removeBookmark } = useLearningEcosystem();
  const isMaterialSaved = isBookmarked(id || '') || isBookmarked(material?.title || '');

  const toggleMaterialBookmark = () => {
    if (isMaterialSaved) {
      removeBookmark(id || material?.title);
    } else {
      addBookmark({
        targetId: id || `mat_${Date.now()}`,
        title: material?.title || 'Study Material',
        url: `/materials/${id}`,
        itemType: 'notes',
        subjectCode: material?.subject_code || material?.subject || material?.branch_name,
        semester: material?.semester
      });
    }
  };

  usePageMeta({
    title: material?.title || 'Study Material',
    description: material?.description || (material?.title ? `Read ${material.title} on ShikshaSahayak.` : 'Read engineering study materials, unit notes, and chapter summaries shared by contributors on ShikshaSahayak.'),
    path: `/materials/${id}`,
    type: 'article',
  });

  // Auth context for Admin status
  const { currentUser, loading: authLoading } = useAuth();
  const isAdmin = !!(currentUser && currentUser.email && [
    'contact@shikshasahayak.org',
    'tech@shikshasahayak.org',
    'team@shikshasahayak.org'
  ].includes(currentUser.email.toLowerCase()));

  // Moderation state variables
  const [isEditing, setIsEditing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');

  useEffect(() => {
    if (id) {
      const liked = localStorage.getItem(`liked_material_${id}`);
      setHasLiked(!!liked);
    }
  }, [id]);

  useEffect(() => {
    if (!id || authLoading) return;

    const fetchMaterial = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getMaterial(id, isAdmin);
        setMaterial(data);
      } catch (err) {
        console.error("Error loading material:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterial();
  }, [id, isAdmin, authLoading]);

  // Populate edit inputs when material loaded
  useEffect(() => {
    if (material) {
      setEditTitle(material.title || '');
      setEditAuthor(material.author || material.uploaded_by || '');
    }
  }, [material]);

  const handleLike = async () => {
    if (!material || hasLiked) return;

    setHasLiked(true);
    localStorage.setItem(`liked_material_${material.id}`, 'true');
    try {
      const stats = await apiClient.likeMaterial(material.id);
      setMaterial((prev: any) => prev ? { ...prev, likes: stats.likes } : prev);
    } catch (error) {
      console.error('Failed to persist like:', error);
    }
  };

  const handleOpenFullscreen = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setIsFullscreen(true);
  };

  const handleSuggestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thanks! Your suggestion has been sent for review.");
    setIsSuggesting(false);
    setSuggestion('');
  };

  // Moderation Action Handlers
  const handleApprove = async (withChanges = false) => {
    if (!id) return;
    setIsApproving(true);
    setModerationError(null);
    try {
      const payload = withChanges ? { title: editTitle, author_name: editAuthor } : undefined;
      await apiClient.approveMaterial(id, payload);
      
      // Refresh the material details
      const data = await apiClient.getMaterial(id, isAdmin);
      setMaterial(data);
      setIsEditing(false);
    } catch (err: any) {
      console.error("Failed to approve material:", err);
      setModerationError(err.message || "Failed to approve material");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to reject and permanently delete this document? This action cannot be undone.")) {
      return;
    }
    setIsRejecting(true);
    setModerationError(null);
    try {
      await apiClient.rejectMaterial(id);
      alert("Material rejected and deleted successfully.");
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error("Failed to reject material:", err);
      setModerationError(err.message || "Failed to reject material");
      setIsRejecting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-navy-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-10 w-10 text-brand-orange animate-spin mb-4" />
        <p className="text-gray-500 font-medium font-display uppercase tracking-widest text-xs">Opening Document...</p>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-navy-950 flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-2">Document Not Found</h2>
        <button onClick={() => window.history.back()} className="text-brand-orange hover:underline">Go Back</button>
      </div>
    );
  }

  const isOriginal = searchParams.get('original') === 'true';
  const isPreview = searchParams.get('preview') === 'true';

  if (material.blog_id && !isOriginal && !isPreview && material.approval_status === 'approved') {
    return <Navigate to={`/blogs/${material.blog_id}`} replace />;
  }

  const isPending = !!(material.is_pending || material.status === 'pending');

  // Find associated files
  const paperFile = material.files?.find((f: any) => f.file_type === 'paper');
  const solutionFile = material.files?.find((f: any) => f.file_type === 'solution');

  const activeFileObj = activeFile === 'solution' && solutionFile ? solutionFile : paperFile;
  const rawPdfPath = activeFileObj ? activeFileObj.file_url : (material.pdfUrl || material.url);
  const pdfPath = normalizeGtuPyqUrl(rawPdfPath);

  // Clean the PDF path to ensure same-origin behavior for /api/storage/ URLs
  const cleanPdfPath = pdfPath && pdfPath.includes('/api/storage/')
    ? '/api/storage/' + pdfPath.split('/api/storage/')[1]
    : pdfPath;

  let fullPdfUrl =
    cleanPdfPath && cleanPdfPath.startsWith('/')
      ? window.location.origin + cleanPdfPath
      : cleanPdfPath;

  // Append a cache-buster to bypass the cached "Content-Disposition: attachment" headers on Cloudflare CDN.
  // Note: GTU official API endpoint rejects query parameters with HTTP 502 Bad Gateway, so exclude gtu.ac.in.
  if (fullPdfUrl && !fullPdfUrl.includes('gtu.ac.in')) {
    const separator = fullPdfUrl.includes('?') ? '&' : '?';
    fullPdfUrl = `${fullPdfUrl}${separator}v=2`;
  }

  let authorName = material.author || material.uploaded_by || 'Anonymous Contributor';
  if (authorName.toLowerCase() === 'admin') {
    authorName = 'ShikshaSahayak Admin';
  }
  const displayDate = material.created_at ? new Date(material.created_at).toLocaleDateString() : 'Recently';

  return (
    <div className="w-full min-h-full bg-slate-50 dark:bg-[#090D1A] animate-fade-in transition-colors pb-12">
      {/* Floating Back Button for Mobile */}
      <div className="lg:hidden p-4">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium text-xs">
           <ArrowLeft className="h-4 w-4" /> Back to Resources
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Main Content Area */}
          <article className="flex-1 min-w-0 space-y-6">
            
            {/* Admin Moderation Banner */}
            {isAdmin && isPending && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_rgba(245,158,11,0.08)] relative overflow-hidden transition-all duration-300">
                {/* Glowing top line for amber */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <ShieldAlert className="h-6 w-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
                        Pending Document Moderation
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 uppercase">Admin View</span>
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-450 mt-1">
                        This contributed file is not yet visible to the public. Review the details and preview below to take action.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-4 py-2 text-sm font-bold border border-gray-350 dark:border-navy-700 hover:bg-gray-100 dark:hover:bg-navy-800 text-gray-700 dark:text-gray-300 rounded-xl transition-all inline-flex items-center gap-1.5"
                    >
                      <Edit3 className="h-4 w-4" />
                      {isEditing ? 'Cancel Edit' : 'Edit & Approve'}
                    </button>
                    
                    <button
                      onClick={handleReject}
                      disabled={isRejecting || isApproving}
                      className="px-4 py-2 text-sm font-bold border border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 text-red-650 dark:text-red-400 rounded-xl transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isRejecting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Reject & Delete
                        </>
                      )}
                    </button>

                    {!isEditing && (
                      <button
                        onClick={() => handleApprove(false)}
                        disabled={isRejecting || isApproving}
                        className="px-5 py-2 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isApproving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            Approve & Publish
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit Form */}
                {isEditing && (
                  <div className="mt-6 pt-6 border-t border-amber-200/50 dark:border-amber-900/30 space-y-4 max-w-xl animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Document Title</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full p-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-950 focus:ring-2 focus:ring-brand-orange outline-none text-sm text-navy-900 dark:text-white"
                          placeholder="Enter document title..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Author Name</label>
                        <input
                          type="text"
                          value={editAuthor}
                          onChange={(e) => setEditAuthor(e.target.value)}
                          className="w-full p-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-950 focus:ring-2 focus:ring-brand-orange outline-none text-sm text-navy-900 dark:text-white"
                          placeholder="Enter author/uploader..."
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => handleApprove(true)}
                        disabled={isApproving || isRejecting}
                        className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm shadow-sm transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isApproving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            Save & Approve
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {moderationError && (
                  <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/25 border border-red-200 dark:border-red-900/35 rounded-xl text-sm text-red-650 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {moderationError}
                  </div>
                )}
              </div>
            )}

             {/* Paper Container */}
            <div className="bg-white dark:bg-navy-900 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-200/50 dark:border-navy-800 p-8 md:p-12 lg:p-16 relative overflow-hidden">
                {/* Decorative top accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-orange via-red-500 to-brand-orange" />
                
                <div className="mb-10">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 animate-pulse-slow">
                            {(material.material_kind || material.document_type || 'Material').replace('-', ' ')}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Status: {isPending ? 'Pending Moderation' : (material.status || 'Published')}
                        </span>
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-navy-900 dark:text-white mb-6 leading-[1.15]">
                        {material.title}
                    </h1>
                    
                    <div className="flex items-center justify-between py-6 border-y border-gray-100 dark:border-navy-800">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-brand-orange text-white flex items-center justify-center font-bold text-lg shadow-sm uppercase">
                                {authorName.charAt(0)}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-navy-900 dark:text-white">{authorName}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                    <span>Uploaded on {displayDate}</span>
                                </div>
                            </div>
                        </div>
                        {!isPending && (
                          <div className="flex items-center gap-2">
                              {material.blog_id && (
                                <Link 
                                  to={`/blogs/${material.blog_id}`}
                                  className="px-4 py-2 bg-brand-orange/10 text-brand-orange hover:bg-brand-orange hover:text-white rounded-xl font-bold transition-all text-xs inline-flex items-center gap-1.5 shadow-sm"
                                >
                                  <FileText className="h-4 w-4" /> Read Blog
                                </Link>
                              )}
                              <button
                                onClick={toggleMaterialBookmark}
                                title={isMaterialSaved ? "Remove from My Library" : "Save to My Library"}
                                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors ${
                                  isMaterialSaved ? 'text-brand-orange bg-orange-50 dark:bg-orange-950/40' : 'text-gray-400 hover:text-navy-900 dark:hover:text-white'
                                }`}
                              >
                                <Bookmark className={`h-5 w-5 ${isMaterialSaved ? 'fill-current' : ''}`} />
                              </button>
                              <button onClick={() => setIsShareOpen(true)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-navy-800 text-gray-400 hover:text-navy-900 dark:hover:text-white transition-colors" title="Share Material">
                                  <Share2 className="h-5 w-5" />
                              </button>
                          </div>
                        )}
                    </div>

                    {/* Additional Document Metadata */}
                    <div className="py-6 border-b border-gray-100 dark:border-navy-800">
                      {material.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                          {material.description}
                        </p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Branch</p>
                          <p className="text-sm font-semibold text-navy-900 dark:text-white">
                            {material.is_all_branches ? "All Branches" : (material.branch_name || 'N/A')}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Semester</p>
                          <p className="text-sm font-semibold text-navy-900 dark:text-white">
                            {material.semester_no !== undefined && material.semester_no !== null 
                              ? `Sem ${formatSemester(material.semester_no)}` 
                              : 'N/A'}
                          </p>
                        </div>
                        {material.unit_no !== undefined && material.unit_no !== null && (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Unit Number</p>
                            <p className="text-sm font-semibold text-navy-900 dark:text-white">Unit {material.unit_no}</p>
                          </div>
                        )}
                        {material.chapter && (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chapter</p>
                            <p className="text-sm font-semibold text-navy-900 dark:text-white">{material.chapter}</p>
                          </div>
                        )}
                        {material.topic && (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Topic</p>
                            <p className="text-sm font-semibold text-navy-900 dark:text-white">{material.topic}</p>
                          </div>
                        )}
                        {/* PYQ Fields */}
                        {material.exam_year && (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Year</p>
                            <p className="text-sm font-semibold text-navy-900 dark:text-white">{material.exam_year}</p>
                          </div>
                        )}
                        {material.exam_session && (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Session</p>
                            <p className="text-sm font-semibold text-navy-900 dark:text-white capitalize">{material.exam_session}</p>
                          </div>
                        )}
                        {/* Syllabus Fields */}
                        {material.syllabus_year && (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Syllabus Year</p>
                            <p className="text-sm font-semibold text-navy-900 dark:text-white">{material.syllabus_year}</p>
                          </div>
                        )}
                        {material.regulation && (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Regulation</p>
                            <p className="text-sm font-semibold text-navy-900 dark:text-white">{material.regulation}</p>
                          </div>
                        )}
                        {material.version_label && (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">W.E.F Year</p>
                            <p className="text-sm font-semibold text-navy-900 dark:text-white">{material.version_label}</p>
                          </div>
                        )}
                      </div>
                    </div>
                </div>

                {/* Main Content Switcher */}
                <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                    {isPending && !isAdmin ? (
                      <div className="my-10 p-8 bg-amber-50 dark:bg-amber-950/10 rounded-2xl border border-amber-200/50 dark:border-amber-900/20 text-center">
                        <Clock className="h-12 w-12 text-brand-orange animate-pulse mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-2">Pending Moderation</h3>
                        <p className="text-gray-550 dark:text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
                          This study material has been contributed by a student and is currently awaiting verification. 
                          It will become fully viewable and downloadable once approved by the moderation team.
                        </p>
                      </div>
                    ) : material.url ? (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-navy-800 pb-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {solutionFile && (
                              <div className="flex bg-gray-100 dark:bg-navy-950 p-1 rounded-xl w-fit">
                                <button
                                  onClick={() => setActiveFile('paper')}
                                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                    activeFile === 'paper'
                                      ? 'bg-white dark:bg-navy-800 text-brand-orange shadow-sm'
                                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                  }`}
                                >
                                  Question Paper
                                </button>
                                <button
                                  onClick={() => setActiveFile('solution')}
                                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                    activeFile === 'solution'
                                      ? 'bg-white dark:bg-navy-800 text-brand-orange shadow-sm'
                                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                  }`}
                                >
                                  Solution
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {fullPdfUrl && (
                              <button 
                                onClick={() => downloadPdfFile(fullPdfUrl, material.title)} 
                                className="bg-navy-900 dark:bg-navy-800 hover:bg-navy-800 dark:hover:bg-navy-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm text-xs inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Download className="h-4 w-4" /> Download PDF
                              </button>
                            )}
                            <button 
                              onClick={handleOpenFullscreen} 
                              className="bg-brand-orange hover:bg-brand-hover text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm text-xs inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="h-4 w-4" /> Fullscreen
                            </button>
                          </div>
                        </div>
                        <div className="w-full h-[600px] md:h-[800px] rounded-2xl overflow-hidden border border-gray-250/50 dark:border-navy-800 shadow-sm bg-gray-100 dark:bg-navy-950">
                          <object
                            data={`${fullPdfUrl}#toolbar=0`}
                            type="application/pdf"
                            className="w-full h-full border-0"
                          >
                            <iframe
                              src={getEmbeddedPdfUrl(fullPdfUrl)}
                              className="w-full h-full border-0"
                              title={activeFile === 'solution' ? `Solution - ${material.title}` : material.title}
                            />
                          </object>
                        </div>
                      </div>
                    ) : (material.raw_markdown || material.content) ? (
                      <div className="space-y-6 animate-fade-in">
                        <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 sm:p-8 md:p-10 border border-gray-100 dark:border-navy-800 shadow-sm" data-color-mode="auto">
                          <MDEditor.Markdown
                            source={material.raw_markdown || material.content}
                            style={{ backgroundColor: 'transparent' }}
                            className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-brand-orange hover:prose-a:underline"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="py-10 text-center text-gray-500">
                        No document attached to this material.
                      </div>
                    )}
                </div>

                {/* Suggestions Section */}
                {!isPending && isSuggesting && (
                    <div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-100 dark:border-yellow-900/30">
                        <h3 className="font-bold text-navy-900 dark:text-white mb-2 flex items-center gap-2">
                            <PenTool className="h-4 w-4" /> Suggest an Edit
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">Help improve this study material. Your suggestion will be reviewed by the author.</p>
                        <form onSubmit={handleSuggestSubmit}>
                            <textarea 
                                value={suggestion}
                                onChange={(e) => setSuggestion(e.target.value)}
                                placeholder="Describe the change or addition..."
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-950 focus:ring-2 focus:ring-brand-orange outline-none text-sm mb-3"
                                rows={4}
                                required
                            />
                            <div className="flex gap-2 justify-end">
                                <button type="button" onClick={() => setIsSuggesting(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-navy-900">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-bold shadow-sm">Submit Suggestion</button>
                            </div>
                        </form>
                    </div>
                )}

                 {/* Contribute Solution CTA for PYQ papers without solutions */}
                 {!isPending && material.material_type === 'pyq' && !solutionFile && (
                   <div className="mt-8 p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
                     <div>
                       <h3 className="font-bold text-emerald-800 dark:text-emerald-400 mb-1 flex items-center gap-2">
                         <PenTool className="h-5 w-5" /> Are you looking for the solution?
                       </h3>
                       <p className="text-sm text-emerald-750 dark:text-emerald-350">
                         No solution is available for this question paper yet. Have you solved this paper? Contribute your solution to help others!
                       </p>
                     </div>
                     <Link
                       to={`/contribute?type=solution&parent_document_id=${material.id}&subject_id=${material.subject_id}&department=${material.branch_slug}&semester=${material.semester_no}`}
                       className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm text-sm shrink-0 text-center"
                     >
                       Submit Solution
                     </Link>
                   </div>
                 )}

                 {/* Bottom Like Action */}
                {!isPending && (
                  <div className="mt-16 p-6 bg-gray-50 dark:bg-navy-800 rounded-2xl flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Find this document helpful?</span>
                      <button 
                        onClick={handleLike}
                        disabled={hasLiked}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm text-sm font-bold transition-all ${
                          hasLiked 
                            ? 'bg-brand-orange text-white cursor-default' 
                            : 'bg-white dark:bg-navy-900 text-navy-900 dark:text-white hover:text-brand-orange'
                        }`}
                      >
                          <ThumbsUp className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} /> 
                          {hasLiked ? 'Liked' : 'Like'}
                      </button>
                  </div>
                )}
            </div>
          </article>
        </div>
      </div>

      {/* PDF Fullscreen Modal for non-HTML blogs */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsFullscreen(false)} />
          <div className="relative bg-white dark:bg-navy-900 shadow-2xl w-full h-full max-w-none rounded-none p-0 flex flex-col transform transition-all duration-300 scale-100 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-orange to-red-500 z-20" />
            <button 
              onClick={() => setIsFullscreen(false)}
              className="absolute top-3 right-4 text-gray-400 hover:text-navy-900 dark:hover:text-white p-2 rounded-full hover:bg-gray-100 dark:hover:bg-navy-800 transition-colors z-20"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col h-full w-full bg-gray-100 dark:bg-navy-950">
              <div className="bg-white dark:bg-navy-900 flex items-center justify-between p-4 pr-16 border-b border-gray-200 dark:border-navy-700 z-10 shadow-sm relative">
                <h3 className="text-xl font-bold text-navy-900 dark:text-white truncate">{material.title}</h3>
                <div className="flex items-center gap-3 shrink-0">
                  {fullPdfUrl && (
                    <button 
                      onClick={() => downloadPdfFile(fullPdfUrl, material.title)}
                      className="text-gray-400 hover:text-navy-900 dark:text-navy-500 dark:hover:text-white p-2 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition-colors flex items-center justify-center cursor-pointer" 
                      title="Download PDF"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => setIsFullscreen(false)}
                    className="text-sm font-bold text-brand-orange hover:bg-orange-50 dark:hover:bg-navy-800 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
              <div className="flex-1 w-full overflow-hidden bg-gray-100 dark:bg-navy-950 relative">
                <object
                  data={`${fullPdfUrl}#toolbar=0`}
                  type="application/pdf"
                  className="w-full h-full border-0"
                >
                  <iframe
                    src={getEmbeddedPdfUrl(fullPdfUrl)}
                    className="w-full h-full border-0"
                    title={material.title}
                    allow="autoplay"
                  />
                </object>
              </div>
            </div>
          </div>
        </div>
      )}

      <ShareModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={material?.title || 'Study Material'}
        description={material?.description}
      />
    </div>
  );
};

export default StudyMaterialView;
