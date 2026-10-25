import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FileText, 
  Search, 
  Grid, 
  List, 
  Plus, 
  Download, 
  Share2, 
  FolderPlus,
  BookOpen,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { teacherClient } from '../../api/teacherClient';
import { toast } from 'sonner';

interface FolderItem {
  id: string;
  name: string;
  count: number;
  color: string;
  typeKey?: string;
}

const DEFAULT_FOLDERS: FolderItem[] = [
  { id: 'f1', name: 'Lecture Notes', count: 0, color: 'text-amber-500 bg-amber-50 dark:bg-navy-900', typeKey: 'notes' },
  { id: 'f2', name: 'Question Papers & PYQs', count: 0, color: 'text-blue-500 bg-blue-50 dark:bg-navy-900', typeKey: 'pyq' },
  { id: 'f3', name: 'Reference Books', count: 0, color: 'text-purple-500 bg-purple-50 dark:bg-navy-900', typeKey: 'book' },
  { id: 'f4', name: 'Lab Manuals', count: 0, color: 'text-emerald-500 bg-emerald-50 dark:bg-navy-900', typeKey: 'lab' },
  { id: 'f5', name: 'Presentations & Slides', count: 0, color: 'text-brand-orange bg-orange-50 dark:bg-navy-900', typeKey: 'presentation' },
  { id: 'f6', name: 'Formula Sheets', count: 0, color: 'text-rose-500 bg-rose-50 dark:bg-navy-900', typeKey: 'formula' },
];

export default function TeacherResourceLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [folders, setFolders] = useState<FolderItem[]>(DEFAULT_FOLDERS);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFolderModal, setNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await teacherClient.getMaterials();
        const mats = res?.materials || [];
        setMaterials(mats);

        // Update counts dynamically based on real materials in database
        setFolders(prev => prev.map(f => {
          let count = 0;
          if (f.typeKey === 'notes') {
            count = mats.filter((m: any) => m.material_type?.includes('note') || m.material_type === 'DOCUMENT').length;
          } else if (f.typeKey === 'pyq') {
            count = mats.filter((m: any) => m.material_type?.includes('pyq') || m.material_type?.includes('question')).length;
          } else if (f.typeKey === 'book') {
            count = mats.filter((m: any) => m.material_type?.includes('book') || m.material_type?.includes('reference')).length;
          } else if (f.typeKey === 'lab') {
            count = mats.filter((m: any) => m.material_type?.includes('lab')).length;
          } else if (f.typeKey === 'presentation') {
            count = mats.filter((m: any) => m.material_type?.includes('slide') || m.material_type?.includes('presentation')).length;
          } else if (f.typeKey === 'formula') {
            count = mats.filter((m: any) => m.material_type?.includes('formula')).length;
          }
          return { ...f, count };
        }));
      } catch {
        // keep default folders
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newFolder: FolderItem = {
      id: `folder_${Date.now()}`,
      name: newFolderName.trim(),
      count: 0,
      color: 'text-brand-orange bg-orange-50 dark:bg-navy-900',
    };
    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setNewFolderModal(false);
    toast.success(`Folder '${newFolder.name}' created!`);
  };

  const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-navy-900 p-6 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
            <Folder className="w-4 h-4" /> File Directory
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white font-display">Resource Library</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Browse folder directories, reference books, lab manuals, and formula sheets.
          </p>
        </div>

        <Button onClick={() => setNewFolderModal(true)} className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs gap-1.5 cursor-pointer">
          <FolderPlus className="w-4 h-4" /> New Folder
        </Button>
      </div>

      {/* Search & View Mode Controls */}
      <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search folders or resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-navy-950 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs ${viewMode === 'grid' ? 'bg-white dark:bg-navy-800 text-brand-orange shadow-xs' : 'text-gray-400'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg text-xs ${viewMode === 'list' ? 'bg-white dark:bg-navy-800 text-brand-orange shadow-xs' : 'text-gray-400'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Folders Grid / List */}
      {filteredFolders.length === 0 ? (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200/80 dark:border-navy-800 p-12 text-center shadow-xs">
          <Folder className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-1">No folders found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
            Try searching for a different keyword or create a custom folder.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFolders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => toast.info(`Opening ${folder.name} directory (${folder.count} files)`)}
              className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group"
            >
              <div className={`w-12 h-12 rounded-2xl ${folder.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <Folder className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-navy-900 dark:text-white truncate group-hover:text-brand-orange transition-colors">
                  {folder.name}
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {folder.count} {folder.count === 1 ? 'Resource' : 'Resources'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs divide-y divide-gray-100 dark:divide-navy-800">
          {filteredFolders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => toast.info(`Opening ${folder.name} directory`)}
              className="p-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-navy-800/50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${folder.color} flex items-center justify-center shrink-0`}>
                  <Folder className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-navy-900 dark:text-white">{folder.name}</h3>
                  <span className="text-[11px] text-gray-400">{folder.count} Resources</span>
                </div>
              </div>
              <span className="text-xs text-brand-orange font-semibold">Open Folder &rarr;</span>
            </div>
          ))}
        </div>
      )}

      {/* New Folder Modal */}
      {newFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-gray-200 dark:border-navy-800 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-orange" /> Create New Folder
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Folder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 3 Mid-Sem Question Sets"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setNewFolderModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-brand-orange hover:bg-orange-600 text-white font-bold">
                  Create Folder
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
