import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderPlus, Folder, BookOpen, FileText, Bookmark, Download, 
  Trash2, Plus, ArrowRight, CheckCircle2, Search, ExternalLink, 
  Layers, Share2, X, LayoutGrid, List, Upload, 
  ChevronRight, Award, Check, Tag, Briefcase, GraduationCap,
  Sparkles, AlertCircle
} from 'lucide-react';
import { useLearningEcosystem } from '../../context/LearningEcosystemContext';
import { useStudentAcademic } from '../../context/StudentAcademicContext';
import { BookmarkItem, LibraryFolder, BookmarkType } from '../../types/learning-ecosystem';

const COLOR_PALETTE = [
  { name: 'Orange', value: '#f97316', bgClass: 'bg-orange-500' },
  { name: 'Blue', value: '#3b82f6', bgClass: 'bg-blue-500' },
  { name: 'Emerald', value: '#10b981', bgClass: 'bg-emerald-500' },
  { name: 'Purple', value: '#8b5cf6', bgClass: 'bg-purple-500' },
  { name: 'Amber', value: '#f59e0b', bgClass: 'bg-amber-500' },
  { name: 'Rose', value: '#f43f5e', bgClass: 'bg-rose-500' },
];

export const MyLibrary: React.FC = () => {
  const { academicProfile } = useStudentAcademic();
  const { 
    bookmarks, 
    removeBookmark, 
    downloads, 
    removeDownload,
    folders, 
    createFolder, 
    deleteFolder,
    addItemToFolder, 
    removeItemFromFolder,
    storageUsageBytes 
  } = useLearningEcosystem();

  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'notes' | 'pyq' | 'opportunities' | 'blog' | 'collections' | 'offline'>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'title' | 'type'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals & Popovers
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#f97316');
  const [assignTarget, setAssignTarget] = useState<BookmarkItem | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatSavedDate = (isoString?: string) => {
    if (!isoString) return 'Recently saved';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Recently saved';
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Saved today';
      if (diffDays === 1) return 'Saved yesterday';
      if (diffDays < 7) return `Saved ${diffDays}d ago`;
      return `Saved ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } catch {
      return 'Recently saved';
    }
  };

  const getResourceTypeMeta = (type: BookmarkType) => {
    switch (type) {
      case 'notes':
      case 'study_material':
      case 'subject':
        return {
          label: 'Study Material',
          categoryKey: 'notes',
          icon: FileText,
          badgeClass: 'bg-orange-50 dark:bg-orange-950/60 text-brand-orange border-orange-200/80 dark:border-orange-900/50',
          actionText: 'Read Notes'
        };
      case 'pyq':
        return {
          label: 'GTU Exam Paper',
          categoryKey: 'pyq',
          icon: BookOpen,
          badgeClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border-sky-200/80 dark:border-sky-900/50',
          actionText: 'View PYQ'
        };
      case 'scholarship':
        return {
          label: 'Scholarship',
          categoryKey: 'opportunities',
          icon: Award,
          badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/50',
          actionText: 'View Scholarship'
        };
      case 'job':
      case 'internship':
        return {
          label: type === 'job' ? 'Job Opening' : 'Internship',
          categoryKey: 'opportunities',
          icon: Briefcase,
          badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-900/50',
          actionText: 'View Opportunity'
        };
      case 'blog':
        return {
          label: 'Article & Guide',
          categoryKey: 'blog',
          icon: BookOpen,
          badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-900/50',
          actionText: 'Read Guide'
        };
      case 'mcq':
      case 'assignment':
      case 'ai_chat':
        return {
          label: 'Prep & Practice',
          categoryKey: 'notes',
          icon: Sparkles,
          badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200/80 dark:border-purple-900/50',
          actionText: 'Practice Now'
        };
      default:
        return {
          label: 'Study Resource',
          categoryKey: 'notes',
          icon: Bookmark,
          badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          actionText: 'Open Resource'
        };
    }
  };

  // Counts by smart categories
  const categoryCounts = useMemo(() => {
    return {
      all: bookmarks.length,
      notes: bookmarks.filter(b => b.itemType === 'notes' || b.itemType === 'study_material' || b.itemType === 'subject' || b.itemType === 'mcq' || b.itemType === 'assignment' || b.itemType === 'ai_chat').length,
      pyq: bookmarks.filter(b => b.itemType === 'pyq').length,
      opportunities: bookmarks.filter(b => b.itemType === 'scholarship' || b.itemType === 'job' || b.itemType === 'internship').length,
      blog: bookmarks.filter(b => b.itemType === 'blog').length,
      collections: folders.length,
      offline: downloads.length,
    };
  }, [bookmarks, folders, downloads]);

  // Active selected folder (if any)
  const activeCustomFolder = useMemo(() => {
    if (!selectedFolderId) return null;
    return folders.find(f => f.id === selectedFolderId) || null;
  }, [selectedFolderId, folders]);

  // Filtered & Sorted Bookmarks
  const filteredBookmarks = useMemo(() => {
    let result = [...bookmarks];

    // Filter by Custom Folder
    if (selectedFolderId && activeCustomFolder) {
      result = result.filter(b => 
        activeCustomFolder.itemIds.includes(b.id) || 
        activeCustomFolder.itemIds.includes(b.targetId) ||
        activeCustomFolder.itemIds.includes(b.title)
      );
    } else if (activeTab !== 'all' && activeTab !== 'collections' && activeTab !== 'offline') {
      // Filter by Tab
      result = result.filter(b => {
        const meta = getResourceTypeMeta(b.itemType);
        return meta.categoryKey === activeTab;
      });
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(b => 
        b.title.toLowerCase().includes(q) ||
        (b.subjectCode && b.subjectCode.toLowerCase().includes(q)) ||
        b.itemType.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'oldest') {
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'type') {
        return a.itemType.localeCompare(b.itemType);
      }
      // Default: recent (newest first)
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    return result;
  }, [bookmarks, selectedFolderId, activeCustomFolder, activeTab, searchQuery, sortBy]);

  // Folder submission
  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    createFolder(newFolderName.trim(), newFolderDesc.trim(), newFolderColor);
    setNewFolderName('');
    setNewFolderDesc('');
    setShowCreateFolderModal(false);
    triggerToast(`Created collection folder "${newFolderName.trim()}"`);
  };

  const handleShareBookmark = async (bookmark: BookmarkItem) => {
    try {
      const fullUrl = bookmark.url.startsWith('http') ? bookmark.url : `${window.location.origin}${bookmark.url}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullUrl);
        triggerToast(`Copied link to "${bookmark.title}"`);
      } else {
        triggerToast(fullUrl);
      }
    } catch {
      triggerToast(`Link: ${bookmark.url}`);
    }
  };

  const handleRemoveBookmark = (bookmark: BookmarkItem) => {
    removeBookmark(bookmark.id);
    triggerToast(`Removed "${bookmark.title}" from library`);
  };

  const isItemInFolder = (folder: LibraryFolder, item: BookmarkItem) => {
    return folder.itemIds.includes(item.id) || folder.itemIds.includes(item.targetId) || folder.itemIds.includes(item.title);
  };

  const toggleFolderMembership = (folder: LibraryFolder, item: BookmarkItem) => {
    if (isItemInFolder(folder, item)) {
      removeItemFromFolder(folder.id, item.id);
      removeItemFromFolder(folder.id, item.targetId);
      triggerToast(`Removed from "${folder.name}"`);
    } else {
      addItemToFolder(folder.id, item.id);
      triggerToast(`Added to "${folder.name}"`);
    }
  };

  return (
    <div className="space-y-6 pb-20 text-slate-900 dark:text-slate-100 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP HERO BANNER & REAL STATS */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-navy-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800/80">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 mb-4">
          <Link to="/student" className="hover:text-brand-orange transition">Home</Link>
          <span>/</span>
          <span className="text-slate-300">Student Portal</span>
          <span>/</span>
          <span className="text-brand-orange font-bold">Personal Study Vault</span>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-xs font-bold">
              <Bookmark className="w-3.5 h-3.5" />
              <span>Personal Academic Vault • Zero Dummy Data</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-white">
              My Library & Bookmarks
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every note, GTU question paper, scholarship, and career opportunity you bookmark across ShikshaSahayak is organized here with custom folders and instant access.
            </p>

            {/* Micro Real Stats Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-xl border border-white/10">
                <Bookmark className="w-3.5 h-3.5 text-brand-orange" />
                <strong className="text-white">{categoryCounts.all}</strong> Saved Bookmarks
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-xl border border-white/10">
                <Folder className="w-3.5 h-3.5 text-sky-400" />
                <strong className="text-white">{folders.length}</strong> Custom Folders
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-xl border border-white/10">
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <strong className="text-white">{downloads.length}</strong> Offline Items
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => setShowCreateFolderModal(true)}
              className="px-5 py-3 rounded-2xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ New Collection Folder</span>
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-brand-orange" />
              <span>Contribute Material</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CUSTOM COLLECTIONS & FOLDERS SHELF */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-brand-orange flex items-center justify-center">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Study Collections & Folders
              </h2>
              <p className="text-xs text-slate-400">Filter your library by custom collection or smart folder.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedFolderId && (
              <button
                onClick={() => setSelectedFolderId(null)}
                className="text-xs font-bold text-brand-orange hover:underline cursor-pointer bg-transparent border-none"
              >
                Clear Folder Filter &times;
              </button>
            )}
            <button
              onClick={() => setShowCreateFolderModal(true)}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-orange flex items-center gap-1 cursor-pointer bg-transparent border-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Folder</span>
            </button>
          </div>
        </div>

        {/* Folder Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Smart All Folder */}
          <button
            onClick={() => {
              setSelectedFolderId(null);
              if (activeTab === 'collections') setActiveTab('all');
            }}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
              !selectedFolderId && activeTab !== 'collections'
                ? 'bg-orange-50/70 dark:bg-orange-950/40 border-brand-orange shadow-xs'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-brand-orange/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <Folder className="w-5 h-5 text-brand-orange" />
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-orange/10 text-brand-orange">
                {bookmarks.length}
              </span>
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">All Bookmarks</h4>
              <p className="text-[10px] text-slate-400">Complete Vault</p>
            </div>
          </button>

          {/* User's Custom Folders */}
          {folders.map(folder => {
            const isSelected = selectedFolderId === folder.id;
            return (
              <div
                key={folder.id}
                onClick={() => {
                  setSelectedFolderId(isSelected ? null : folder.id);
                  if (activeTab === 'collections') setActiveTab('all');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer group relative ${
                  isSelected
                    ? 'bg-orange-50/70 dark:bg-orange-950/40 border-brand-orange shadow-xs ring-2 ring-brand-orange/20'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-brand-orange/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: folder.color || '#f97316' }}
                  >
                    📁
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {folder.itemIds.length}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete folder "${folder.name}"? (Bookmarks will remain safe)`)) {
                          deleteFolder(folder.id);
                          if (selectedFolderId === folder.id) setSelectedFolderId(null);
                          triggerToast(`Deleted folder "${folder.name}"`);
                        }
                      }}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-0.5 cursor-pointer border-none bg-transparent"
                      title="Delete collection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white truncate" title={folder.name}>
                    {folder.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {folder.description || 'Collection'}
                  </p>
                </div>
              </div>
            );
          })}

          {/* New Folder Quick Card */}
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-orange/60 text-left transition-all flex flex-col items-center justify-center space-y-1 text-slate-400 hover:text-brand-orange cursor-pointer bg-transparent"
          >
            <FolderPlus className="w-5 h-5" />
            <span className="text-[11px] font-bold">+ New Folder</span>
          </button>
        </div>
      </div>

      {/* 3. MULTI-DIMENSIONAL SEARCH & FILTER CONTROL BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Search Bar & Primary Tab Toggle */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search your saved bookmarks by title, subject code, or type..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange shadow-inner transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Primary View Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none shrink-0">
            {[
              { id: 'all', label: 'All Items', icon: Bookmark, count: categoryCounts.all },
              { id: 'notes', label: 'Study Notes', icon: FileText, count: categoryCounts.notes },
              { id: 'pyq', label: 'GTU PYQs', icon: BookOpen, count: categoryCounts.pyq },
              { id: 'opportunities', label: 'Opportunities', icon: Briefcase, count: categoryCounts.opportunities },
              { id: 'blog', label: 'Articles & Guides', icon: BookOpen, count: categoryCounts.blog },
              { id: 'offline', label: 'Offline Downloads', icon: Download, count: categoryCounts.offline },
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id && !selectedFolderId;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSelectedFolderId(null);
                  }}
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-brand-orange text-white shadow-md shadow-orange-500/20'
                      : 'bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-orange'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-bar: Sort Options & Grid/List Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-brand-orange text-xs cursor-pointer"
            >
              <option value="recent">Recently Saved</option>
              <option value="oldest">Oldest Saved</option>
              <option value="title">Alphabetical (A-Z)</option>
              <option value="type">By Resource Type</option>
            </select>

            {selectedFolderId && activeCustomFolder && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-brand-orange text-[10px] font-black uppercase">
                Folder: {activeCustomFolder.name}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs text-slate-500 font-semibold">
              Showing {filteredBookmarks.length} saved {filteredBookmarks.length === 1 ? 'item' : 'items'}
            </span>

            {/* Grid / List Mode */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg flex items-center justify-center transition cursor-pointer border-none ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-brand-orange shadow-xs' : 'text-slate-400 bg-transparent'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg flex items-center justify-center transition cursor-pointer border-none ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-brand-orange shadow-xs' : 'text-slate-400 bg-transparent'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAIN BOOKMARKS LIST / GRID */}
      {activeTab === 'offline' ? (
        /* OFFLINE DOWNLOADS VIEW */
        <div className="space-y-4">
          {downloads.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-3 shadow-xs">
              <Download className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">No Offline Downloads Stored</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Downloaded notes and question papers will appear here for instant offline study.
              </p>
              <Link
                to="/resources/study-material"
                className="inline-flex px-4 py-2 bg-brand-orange text-white font-extrabold rounded-xl text-xs shadow-md hover:bg-orange-600 transition"
              >
                Browse Study Materials
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {downloads.map(dl => (
                <div
                  key={dl.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
                      {dl.fileType.toUpperCase()} • {formatSize(dl.sizeBytes)}
                    </span>
                    <button
                      onClick={() => {
                        removeDownload(dl.id);
                        triggerToast(`Removed "${dl.title}" from offline storage`);
                      }}
                      className="text-slate-400 hover:text-red-500 cursor-pointer border-none bg-transparent"
                      title="Delete offline file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{dl.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{dl.subjectCode || 'Offline Asset'}</p>
                  </div>
                  <a
                    href={dl.storagePath}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl text-center block shadow-sm transition"
                  >
                    Open Document
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : filteredBookmarks.length === 0 ? (
        /* EMPTY STATE FOR BOOKMARKS */
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-orange-950/50 text-brand-orange flex items-center justify-center mx-auto shadow-inner">
            <Bookmark className="w-8 h-8" />
          </div>

          {searchQuery ? (
            <>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                No Bookmarks Matching "{searchQuery}"
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Try searching for different terms or clear your search query.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-brand-orange text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer border-none"
              >
                Clear Search
              </button>
            </>
          ) : selectedFolderId && activeCustomFolder ? (
            <>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Collection "{activeCustomFolder.name}" is Empty
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                You haven't added any bookmarks to this folder yet. Browse your saved items and click the folder icon to organize them here.
              </p>
              <button
                onClick={() => setSelectedFolderId(null)}
                className="px-4 py-2 bg-brand-orange text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer border-none"
              >
                View All Bookmarks
              </button>
            </>
          ) : bookmarks.length === 0 ? (
            <>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Your Study Vault is Ready
              </h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                Bookmark notes, GTU question papers, scholarship opportunities, or internships anywhere across the student portal and they will automatically appear here with folder organization.
              </p>

              {/* Discovery Quick Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 max-w-3xl mx-auto text-left">
                <Link
                  to="/resources/study-material"
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-brand-orange transition group flex flex-col justify-between space-y-2"
                >
                  <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-brand-orange flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-orange">
                      Engineering Notes
                    </h5>
                    <p className="text-[10px] text-slate-400">GTU syllabus notes & formula sheets</p>
                  </div>
                  <span className="text-[11px] font-bold text-brand-orange flex items-center gap-1">
                    Explore Notes &rarr;
                  </span>
                </Link>

                <Link
                  to="/resources/pyq"
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-brand-orange transition group flex flex-col justify-between space-y-2"
                >
                  <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-orange">
                      GTU Exam PYQs
                    </h5>
                    <p className="text-[10px] text-slate-400">Previous year question papers</p>
                  </div>
                  <span className="text-[11px] font-bold text-sky-600 flex items-center gap-1">
                    Browse PYQs &rarr;
                  </span>
                </Link>

                <Link
                  to="/opportunities/scholarships"
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-brand-orange transition group flex flex-col justify-between space-y-2"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-orange">
                      Scholarships
                    </h5>
                    <p className="text-[10px] text-slate-400">Verified student grants & financial aid</p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    Find Grants &rarr;
                  </span>
                </Link>

                <Link
                  to="/career/internships"
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-brand-orange transition group flex flex-col justify-between space-y-2"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-orange">
                      Internships
                    </h5>
                    <p className="text-[10px] text-slate-400">Student tech internships & roles</p>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1">
                    View Jobs &rarr;
                  </span>
                </Link>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                No Bookmarks in this Category
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                You haven't saved any items under this category yet.
              </p>
              <button
                onClick={() => {
                  setActiveTab('all');
                  setSelectedFolderId(null);
                }}
                className="px-4 py-2 bg-brand-orange text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer border-none"
              >
                Show All Bookmarks
              </button>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBookmarks.map(bm => {
            const meta = getResourceTypeMeta(bm.itemType);
            const MetaIcon = meta.icon;
            const containingFolders = folders.filter(f => isItemInFolder(f, bm));

            return (
              <div
                key={bm.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between space-y-4 group"
              >
                {/* Header Row: Badge & Action Buttons */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${meta.badgeClass}`}>
                      <MetaIcon className="w-3 h-3" />
                      <span>{meta.label}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Add/Move to Folder Button */}
                      <button
                        onClick={() => setAssignTarget(bm)}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                          containingFolders.length > 0 
                            ? 'bg-orange-50 text-brand-orange border-brand-orange' 
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-brand-orange'
                        }`}
                        title={containingFolders.length > 0 ? `In ${containingFolders.length} collection(s)` : 'Add to collection folder'}
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                      </button>

                      {/* Share Button */}
                      <button
                        onClick={() => handleShareBookmark(bm)}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-brand-orange transition cursor-pointer"
                        title="Copy Share Link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove Bookmark Button */}
                      <button
                        onClick={() => handleRemoveBookmark(bm)}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 transition cursor-pointer"
                        title="Remove Bookmark"
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current text-brand-orange hover:text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Subject info */}
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-brand-orange transition line-clamp-2 leading-snug">
                      {bm.title}
                    </h3>

                    {bm.subjectCode && (
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                        {bm.subjectCode} {bm.semester ? `• Semester ${bm.semester}` : ''}
                      </p>
                    )}
                  </div>

                  {/* Assigned Folders Badges */}
                  {containingFolders.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {containingFolders.map(f => (
                        <span
                          key={f.id}
                          onClick={() => setSelectedFolderId(f.id)}
                          className="px-2 py-0.5 rounded-lg text-[9px] font-bold text-white cursor-pointer hover:opacity-85 transition truncate max-w-[130px]"
                          style={{ backgroundColor: f.color || '#f97316' }}
                          title={`Click to filter by folder: ${f.name}`}
                        >
                          📁 {f.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Meta & Open Button */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                    <span>{formatSavedDate(bm.createdAt)}</span>
                    <span className="text-brand-orange font-bold text-[10px] uppercase">
                      ShikshaSahayak Vault
                    </span>
                  </div>

                  <Link
                    to={bm.url}
                    className="w-full py-2.5 rounded-2xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer no-underline"
                  >
                    <span>{meta.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW MODE */
        <div className="space-y-3">
          {filteredBookmarks.map(bm => {
            const meta = getResourceTypeMeta(bm.itemType);
            const MetaIcon = meta.icon;
            const containingFolders = folders.filter(f => isItemInFolder(f, bm));

            return (
              <div
                key={bm.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-brand-orange/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${meta.badgeClass}`}>
                    <MetaIcon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                      {bm.subjectCode && (
                        <span className="text-[10px] font-bold text-slate-500">
                          {bm.subjectCode} {bm.semester ? `• Sem ${bm.semester}` : ''}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {formatSavedDate(bm.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-brand-orange transition">
                      {bm.title}
                    </h3>

                    {containingFolders.length > 0 && (
                      <div className="flex items-center gap-1 pt-0.5">
                        {containingFolders.map(f => (
                          <span
                            key={f.id}
                            className="px-2 py-0.5 rounded text-[9px] font-bold text-white"
                            style={{ backgroundColor: f.color || '#f97316' }}
                          >
                            📁 {f.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-2 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0 shrink-0">
                  <button
                    onClick={() => setAssignTarget(bm)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition cursor-pointer border-none"
                    title="Organize in collection folder"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleShareBookmark(bm)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition cursor-pointer border-none"
                    title="Copy share link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleRemoveBookmark(bm)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 text-slate-400 transition cursor-pointer border-none"
                    title="Remove from bookmarks"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <Link
                    to={bm.url}
                    className="px-4 py-2 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs shadow-md transition no-underline flex items-center gap-1.5"
                  >
                    <span>{meta.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. CREATE COLLECTION FOLDER MODAL */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-brand-orange" />
                Create Collection Folder
              </h3>
              <button 
                onClick={() => setShowCreateFolderModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolderSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">
                  Collection Name <span className="text-brand-orange">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="e.g. GTU Mid-Sem 2 Priority"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">
                  Description (Optional)
                </label>
                <textarea
                  value={newFolderDesc}
                  onChange={e => setNewFolderDesc(e.target.value)}
                  placeholder="Add context about this folder (e.g., unit revision, gate materials)..."
                  className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange h-20 resize-none"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1 font-bold">
                  Color Accent
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {COLOR_PALETTE.map(c => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setNewFolderColor(c.value)}
                      className={`w-7 h-7 rounded-full ${c.bgClass} flex items-center justify-center transition-transform cursor-pointer border-2 ${
                        newFolderColor === c.value ? 'scale-110 border-white ring-2 ring-brand-orange' : 'border-transparent'
                      }`}
                      title={c.name}
                    >
                      {newFolderColor === c.value && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateFolderModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border-none bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-brand-orange hover:bg-orange-600 text-white shadow-md transition cursor-pointer border-none"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ASSIGN TO FOLDER MODAL */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-brand-orange" />
                  Organize in Folders
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                  {assignTarget.title}
                </p>
              </div>
              <button 
                onClick={() => setAssignTarget(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {folders.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <p>You haven't created any custom collections yet.</p>
                  <button
                    onClick={() => {
                      setShowCreateFolderModal(true);
                    }}
                    className="mt-2 text-brand-orange font-bold hover:underline cursor-pointer bg-transparent border-none"
                  >
                    + Create First Collection
                  </button>
                </div>
              ) : (
                folders.map(folder => {
                  const inFolder = isItemInFolder(folder, assignTarget);
                  return (
                    <div
                      key={folder.id}
                      onClick={() => toggleFolderMembership(folder, assignTarget)}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                        inFolder 
                          ? 'bg-orange-50/70 dark:bg-orange-950/40 border-brand-orange' 
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-brand-orange/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div 
                          className="w-4 h-4 rounded-full shrink-0" 
                          style={{ backgroundColor: folder.color || '#f97316' }} 
                        />
                        <div className="truncate">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {folder.name}
                          </h4>
                          {folder.description && (
                            <p className="text-[10px] text-slate-400 truncate">{folder.description}</p>
                          )}
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                        inFolder ? 'bg-brand-orange border-brand-orange text-white' : 'border-slate-300 dark:border-slate-700'
                      }`}>
                        {inFolder && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setShowCreateFolderModal(true);
                }}
                className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Collection</span>
              </button>

              <button
                onClick={() => setAssignTarget(null)}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-brand-orange hover:bg-orange-600 text-white shadow-md cursor-pointer border-none"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. UPLOAD NOTE MODAL / CONTRIBUTE DIALOG */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand-orange" />
                Contribute Notes to Library
              </h3>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                ShikshaSahayak is an open, student-powered repository. Share your handwritten notes, GTU formula sheets, or unit solutions to help thousands of engineering peers.
              </p>

              <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/60 dark:border-orange-900/40 space-y-2">
                <h4 className="font-extrabold text-brand-orange flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4" /> Contributor Rewards
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Every verified note earns contributor XP, a public author badge on EduOS, and immediate access to community perks.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Link
                  to="/contribute"
                  onClick={() => setShowUploadModal(false)}
                  className="w-full sm:flex-1 py-3 bg-brand-orange hover:bg-orange-600 text-white font-extrabold rounded-2xl text-center shadow-md transition no-underline text-xs"
                >
                  Go to Contribution Portal &rarr;
                </Link>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer border-none bg-transparent"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLibrary;
