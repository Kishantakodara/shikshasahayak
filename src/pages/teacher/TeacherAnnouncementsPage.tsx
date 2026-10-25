import React, { useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  Eye, 
  Trash2, 
  Sparkles,
  Send
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: string;
  date: string;
  status: 'published' | 'scheduled' | 'draft';
}

import { useQuery } from '@tanstack/react-query';
import { teacherClient } from '../../api/teacherClient';

export default function TeacherAnnouncementsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newAudience, setNewAudience] = useState('All Classes');

  const [customAnnouncements, setCustomAnnouncements] = useState<Announcement[]>([]);

  const { data: apiData } = useQuery({
    queryKey: ['teacher', 'announcements'],
    queryFn: () => teacherClient.getAnnouncements().catch(() => ({ announcements: [], count: 0 })),
  });

  const { data: classesData } = useQuery({
    queryKey: ['teacher', 'classes'],
    queryFn: () => teacherClient.getClasses().catch(() => ({ classes: [] })),
  });

  const apiAnnouncements: Announcement[] = (apiData?.announcements || []).map((a: any) => ({
    id: a.id,
    title: a.title || 'Announcement',
    body: a.content || a.body || '',
    audience: a.class_name || a.subject_name || 'All Enrolled Batches',
    date: a.created_at ? new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today',
    status: 'published'
  }));

  const announcements = [...customAnnouncements, ...apiAnnouncements];

  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newBody) return;
    const created: Announcement = {
      id: `anc-${Date.now()}`,
      title: newTitle,
      body: newBody,
      audience: newAudience,
      date: 'Today',
      status: 'published',
    };
    setCustomAnnouncements([created, ...customAnnouncements]);
    setModalOpen(false);
    setNewTitle('');
    setNewBody('');
    toast.success('Announcement broadcasted to students!');
  };

  const totalAnnouncements = announcements.length;
  const publishedCount = announcements.length;
  const scheduledCount = 0;
  const draftsCount = 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-navy-900 p-6 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
            <Megaphone className="w-4 h-4" /> Class Communications
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white font-display">13. Announcements</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Broadcast important updates, exam notices, and deadlines to your batches.
          </p>
        </div>

        <Button 
          onClick={() => setModalOpen(true)}
          className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Announcement
        </Button>
      </div>

      {/* Top 4 Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Total Notices</span>
          <p className="text-2xl font-black text-navy-900 dark:text-white">{totalAnnouncements}</p>
        </div>
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Published</span>
          <p className="text-2xl font-black text-emerald-600">{publishedCount}</p>
        </div>
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Scheduled</span>
          <p className="text-2xl font-black text-blue-500">{scheduledCount}</p>
        </div>
        <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-1">
          <span className="text-xs text-gray-400 font-semibold">Drafts</span>
          <p className="text-2xl font-black text-amber-500">{draftsCount}</p>
        </div>
      </div>

      {/* Announcements List */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs p-6 space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-bold">
            No announcements posted yet. Click "New Announcement" to broadcast to your class.
          </div>
        ) : (
          filteredAnnouncements.map((anc) => (
            <div key={anc.id} className="p-4 bg-gray-50 dark:bg-navy-950 rounded-xl border border-gray-100 dark:border-navy-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-navy-900 dark:text-white">{anc.title}</span>
                  <span className="px-2 py-0.5 rounded bg-brand-orange/15 text-brand-orange font-bold text-[10px]">
                    {anc.audience}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{anc.body}</p>
              </div>
              <span className="text-xs text-gray-400 font-bold shrink-0">{anc.date}</span>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-gray-200 dark:border-navy-800 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-orange" /> New Announcement
            </h3>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End Semester Exam Schedule"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Target Audience</label>
                <select
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl"
                >
                  <option value="All Students">All Students</option>
                  {(classesData?.classes || []).map((cls: any) => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Message</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Write your broadcast message..."
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-brand-orange hover:bg-orange-600 text-white font-bold gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Broadcast
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
