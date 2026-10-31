import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
  Megaphone, PlusCircle, Trash2, Link as LinkIcon, Loader2, Calendar, AlertCircle, FileText
} from 'lucide-react';
import ManagePopupsUI from './ManagePopupsUI';

const ManageAnnouncementsUI: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'notices' | 'popups'>('notices');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Form State
  const [text, setText] = useState('');
  const [link, setLink] = useState('');

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getAnnouncements();
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      alert('Announcement text is required.');
      return;
    }

    try {
      setIsPublishing(true);
      await apiClient.addAnnouncement(text.trim(), link.trim() || undefined);
      setText('');
      setLink('');
      await loadAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Failed to publish announcement');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      setIsDeleting(id);
      await apiClient.deleteAnnouncement(id);
      await loadAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Failed to delete announcement');
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" /> Announcements Management
          </h2>
          <p className="text-sm text-muted mt-1 font-semibold">
            Manage global notice board alerts and dynamic overlay popup campaigns.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-surface-secondary border border-border p-1 rounded-xl self-start md:self-center">
          <button
            onClick={() => setActiveSubTab('notices')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'notices'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-text'
            }`}
          >
            Notice Board
          </button>
          <button
            onClick={() => setActiveSubTab('popups')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'popups'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-text'
            }`}
          >
            Website Popups
          </button>
        </div>
      </div>

      {activeSubTab === 'popups' ? (
        <ManagePopupsUI />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in">
          {/* Left Column: Create Announcement Form */}
          <div className="lg:col-span-1 bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-text border-b border-border pb-3 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-primary" /> Publish Notice
            </h3>

            <form onSubmit={handlePublish} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text uppercase tracking-wider">Announcement Text</label>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Enter alert text (e.g. Semester 2 exams scheduled to start on June 18th!)"
                  rows={4}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm font-semibold placeholder:text-muted resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5" /> Action URL / Link (Optional)
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  placeholder="e.g. https://shikshasahayak.org/syllabus"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isPublishing}
                className="w-full bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 border border-primary/20 disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4.5 w-4.5" /> Publish Announcement
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Live Notices List */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-text border-b border-border pb-3 flex items-center justify-between">
              <span>Live Announcements</span>
              <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                {isLoading ? '...' : announcements.length}
              </span>
            </h3>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="h-7 w-7 text-primary animate-spin" />
                <span className="text-sm text-muted font-bold">Retrieving live announcements...</span>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-24 px-4 border border-dashed border-border rounded-xl">
                <Megaphone className="h-12 w-12 text-muted mx-auto mb-4" />
                <h4 className="font-bold text-text text-md">No Live Notices</h4>
                <p className="text-sm text-muted mt-1 max-w-sm mx-auto font-medium">
                  There are no announcements currently visible on the home page dashboard. Use the publisher form to post one.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {announcements.map((item) => (
                  <div 
                    key={item.id}
                    className="p-4 rounded-xl border border-border bg-surface-secondary/50 flex items-start gap-4 transition-all hover:bg-surface-secondary"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 mt-0.5">
                      <Megaphone className="h-4.5 w-4.5 text-primary" />
                    </div>
                    
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="text-sm font-semibold text-text break-words leading-relaxed">
                        {item.text}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted font-bold">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {formatDate(item.created_at)}
                        </span>
                        {item.link && (
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <LinkIcon className="h-3 w-3" /> Visit Link
                          </a>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting === item.id}
                      title="Delete Announcement"
                      className="p-2 text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                    >
                      {isDeleting === item.id ? (
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAnnouncementsUI;
