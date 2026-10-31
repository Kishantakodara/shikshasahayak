import React, { useState, useEffect } from 'react';
import { 
  FileCode, 
  Plus, 
  Search, 
  BookOpen, 
  FileText, 
  Calendar, 
  Share2, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface Note {
  id: string;
  title: string;
  subject: string;
  date: string;
  pages: number;
  color?: string;
  content?: string;
}

export default function TeacherNotesPage() {
  const { currentUser } = useAuth();
  const storageKey = `shiksha_teacher_notes_${currentUser?.uid || 'guest'}`;

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newPages, setNewPages] = useState('5');

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notes));
    } catch {
      // ignore
    }
  }, [notes, storageKey]);

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created: Note = {
      id: `note_${Date.now()}`,
      title: newTitle.trim(),
      subject: newSubject.trim() || 'Lecture Notes',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      pages: parseInt(newPages) || 1,
      color: 'text-brand-orange bg-orange-50 dark:bg-navy-900 border-orange-200',
    };
    setNotes([created, ...notes]);
    setModalOpen(false);
    setNewTitle('');
    setNewSubject('');
    setNewPages('5');
    toast.success('Note created successfully!');
  };

  const handleDeleteNote = (id: string, title: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    toast.success(`Deleted note: ${title}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-navy-900 p-6 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
            <FileCode className="w-4 h-4" /> Personal Notebook
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white font-display">My Notes</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Organize personal lecture summaries, formula keys, and teaching reference notes.
          </p>
        </div>

        <Button 
          onClick={() => setModalOpen(true)}
          className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Note
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search notes by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200/80 dark:border-navy-800 p-12 text-center shadow-xs">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-navy-900 dark:text-white mb-1">
            {searchQuery ? 'No matching notes found' : 'No personal notes created yet'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
            {searchQuery 
              ? 'Try changing your search terms or create a new note.' 
              : 'Create personal lecture notes, revision formula guides, and lesson plans for quick reference.'}
          </p>
          <Button 
            onClick={() => setModalOpen(true)}
            className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-xl inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Your First Note
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredNotes.map((note) => (
            <div 
              key={note.id}
              className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200/80 dark:border-navy-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-navy-900 dark:text-white line-clamp-1">{note.title}</h3>
                  <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{note.date}</span>
                </div>
                <p className="text-xs font-semibold text-brand-orange line-clamp-1">{note.subject}</p>
              </div>

              <div className="pt-8 border-t border-gray-100 dark:border-navy-800 flex items-center justify-between text-xs text-gray-400">
                <span className="font-bold">{note.pages} {note.pages === 1 ? 'Page' : 'Pages'}</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toast.info(`Viewing ${note.title}`)} 
                    className="p-1 hover:text-brand-orange transition-colors"
                    title="View note"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => toast.success(`Link copied for ${note.title}`)} 
                    className="p-1 hover:text-brand-orange transition-colors"
                    title="Share note"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteNote(note.id, note.title)} 
                    className="p-1 hover:text-red-500 transition-colors"
                    title="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Note Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-gray-200 dark:border-navy-800 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-orange" /> Create Note
            </h3>
            <form onSubmit={handleCreateNote} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Microcontrollers Summary"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Subject Key / Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Formula Sheet"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Estimated Pages</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={newPages}
                  onChange={(e) => setNewPages(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-brand-orange hover:bg-orange-600 text-white font-bold">
                  Save Note
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
