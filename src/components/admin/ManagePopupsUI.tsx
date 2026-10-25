import React, { useState, useEffect } from 'react';
import { 
  Megaphone, PlusCircle, Trash2, Edit, Loader2, Calendar, 
  AlertCircle, Eye, EyeOff, Check, X, Moon, Sun, MonitorPlay
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { apiClient } from '../../api/client';

interface Popup {
  id: string;
  title: string;
  type: string;
  html_content: string;
  is_active: number;
  start_date: string | null;
  end_date: string | null;
  frequency: string;
  expiry_days: number;
  created_at: string;
  updated_at: string;
}

const ManagePopupsUI: React.FC = () => {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('announcement');
  const [htmlContent, setHtmlContent] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [frequency, setFrequency] = useState('once');
  const [expiryDays, setExpiryDays] = useState(7);

  // Preview State
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');

  const loadPopups = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.adminGetPopups();
      setPopups(data || []);
    } catch (error) {
      console.error('Failed to load website popups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPopups();
  }, []);

  const toLocalDatetimeString = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const pad = (num: number) => String(num).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
      return '';
    }
  };

  const handleOpenCreate = () => {
    setEditingPopup(null);
    setTitle('');
    setType('announcement');
    setHtmlContent(`<div class="text-center p-6 bg-surface rounded-xl">
  <div class="inline-flex items-center justify-center w-12 h-12 bg-primary/10 text-primary border border-primary/20 rounded-full mb-4">
    📢
  </div>
  <h3 class="text-lg font-bold text-text">New Announcement</h3>
  <p class="text-sm text-muted mt-2">
    Insert your custom HTML and inline styles here. You can use standard Tailwind classes.
  </p>
  <div class="mt-5">
    <button class="bg-primary hover:bg-primary/95 text-white font-bold px-5 py-2 rounded-xl text-sm shadow-md transition-all">
      Learn More
    </button>
  </div>
</div>`);
    setIsActive(true);
    setStartDate('');
    setEndDate('');
    setFrequency('once');
    setExpiryDays(7);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (popup: Popup) => {
    setEditingPopup(popup);
    setTitle(popup.title);
    setType(popup.type);
    setHtmlContent(popup.html_content);
    setIsActive(popup.is_active === 1);
    setStartDate(toLocalDatetimeString(popup.start_date));
    setEndDate(toLocalDatetimeString(popup.end_date));
    setFrequency(popup.frequency);
    setExpiryDays(popup.expiry_days);
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingPopup(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !htmlContent.trim()) {
      alert('Title and HTML Content are required.');
      return;
    }

    const payload = {
      title: title.trim(),
      type,
      html_content: htmlContent.trim(),
      is_active: isActive,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      frequency,
      expiry_days: Number(expiryDays),
    };

    try {
      setIsSubmitting(true);
      if (editingPopup) {
        await apiClient.adminUpdatePopup(editingPopup.id, payload);
      } else {
        await apiClient.adminCreatePopup(payload);
      }
      setIsFormOpen(false);
      setEditingPopup(null);
      await loadPopups();
    } catch (err: any) {
      alert(err.message || 'Failed to save website popup');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this popup? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      await apiClient.adminDeletePopup(id);
      await loadPopups();
    } catch (err: any) {
      alert(err.message || 'Failed to delete popup');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'None';
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

  // Sanitized content for rendering preview
  const sanitizedPreviewHTML = DOMPurify.sanitize(htmlContent, {
    ADD_ATTR: ['target', 'style', 'class'],
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-text tracking-tight flex items-center gap-2">
            <MonitorPlay className="h-5 w-5 text-primary" /> Website Popups System
          </h3>
          <p className="text-sm text-muted mt-1 font-semibold">
            Deploy dynamic overlay modals (announcements, offers, or notifications) to visitors without code changes.
          </p>
        </div>
        {!isFormOpen && (
          <button
            onClick={handleOpenCreate}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 border border-primary/20 self-start sm:self-center"
          >
            <PlusCircle className="h-4.5 w-4.5" /> Create Popup
          </button>
        )}
      </div>

      {/* Main Panel Content */}
      {isFormOpen ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
          {/* Left Side: Create / Edit Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-lg font-bold text-text border-b border-border pb-3 flex items-center justify-between">
              <span>{editingPopup ? 'Edit Popup Details' : 'Create Website Popup'}</span>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-muted hover:text-text p-1 hover:bg-surface-secondary rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text uppercase tracking-wider">Internal Title / Name</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. FYC Drive Materials Offer"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm font-semibold"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text uppercase tracking-wider">Popup Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm font-semibold"
                >
                  <option value="announcement">Announcement</option>
                  <option value="offer">Special Offer / Banner</option>
                  <option value="maintenance">Maintenance Notice</option>
                  <option value="survey">User Survey</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text uppercase tracking-wider">Raw HTML Content</label>
                <span className="text-[10px] text-muted font-bold">Safe sanitization is applied</span>
              </div>
              <textarea
                value={htmlContent}
                onChange={e => setHtmlContent(e.target.value)}
                placeholder="Write raw HTML here..."
                rows={10}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text focus:border-primary outline-none text-sm font-mono placeholder:text-muted"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text uppercase tracking-wider">Display Frequency</label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm font-semibold"
                >
                  <option value="once">Once (Permanent Dismissal)</option>
                  <option value="session">Once Per Session</option>
                  <option value="days">Re-prompt After Expiry (Days)</option>
                  <option value="always">Always (Every Page Load)</option>
                </select>
              </div>

              {frequency === 'days' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text uppercase tracking-wider">Expiry (Days)</label>
                  <input
                    type="number"
                    value={expiryDays}
                    onChange={e => setExpiryDays(Math.max(1, Number(e.target.value)))}
                    min={1}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-text focus:border-primary outline-none text-sm font-semibold"
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Start Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-text focus:border-primary outline-none text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> End Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-text focus:border-primary outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-border pt-4 select-none">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isActive ? 'bg-primary' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <div>
                <span className="text-sm font-bold text-text">Enable Popup</span>
                <p className="text-xs text-muted font-medium">Toggle this popup's visibility state.</p>
              </div>
            </div>

            <div className="flex gap-3 border-t border-border pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary hover:bg-primary/90 text-white px-5 py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 border border-primary/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4.5 w-4.5" /> {editingPopup ? 'Update' : 'Publish'} Popup
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancelForm}
                className="bg-surface-secondary hover:bg-surface-secondary/80 text-text border border-border px-5 py-3 rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Right Side: Real-time Live Preview */}
          <div className="lg:col-span-5 bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 lg:sticky lg:top-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4 className="text-md font-bold text-text flex items-center gap-1.5">
                <Eye className="h-4.5 w-4.5 text-primary" /> Live Render Preview
              </h4>

              {/* Theme Toggle for Preview Container */}
              <div className="flex bg-background rounded-lg p-0.5 border border-border">
                <button
                  type="button"
                  onClick={() => setPreviewTheme('light')}
                  className={`p-1.5 rounded-md transition-all ${
                    previewTheme === 'light' 
                      ? 'bg-surface text-primary shadow-sm' 
                      : 'text-muted hover:text-text'
                  }`}
                  title="Preview in Light Theme"
                >
                  <Sun className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTheme('dark')}
                  className={`p-1.5 rounded-md transition-all ${
                    previewTheme === 'dark' 
                      ? 'bg-surface text-primary shadow-sm' 
                      : 'text-muted hover:text-text'
                  }`}
                  title="Preview in Dark Theme"
                >
                  <Moon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-muted font-medium">
              This is how your popup card will render. Verify styles, links, margins, and readability.
            </p>

            {/* Preview Box Frame (Renders both themes) */}
            <div className={`p-6 border border-border rounded-xl flex items-center justify-center transition-all ${
              previewTheme === 'dark' ? 'bg-[#0B0F19] dark' : 'bg-slate-50'
            }`}>
              <div className="relative w-full max-w-sm bg-surface border border-border rounded-xl shadow-lg p-6 overflow-hidden select-none pointer-events-none">
                {/* Close Button mockup */}
                <div className="absolute top-3.5 right-3.5 p-1 text-muted rounded-full">
                  <X className="h-4 w-4" />
                </div>

                {/* Sanitized Content */}
                <div 
                  className="prose dark:prose-invert max-w-none text-text text-sm"
                  dangerouslySetInnerHTML={{ __html: sanitizedPreviewHTML }} 
                />

                {/* Dismissal footer mock */}
                {(frequency === 'once' || frequency === 'days') && (
                  <div className="mt-6 pt-3 border-t border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted font-bold">
                      <div className="w-3.5 h-3.5 rounded border border-border" />
                      Don't show this again
                    </div>
                    <div className="bg-primary text-white text-[10px] px-2.5 py-1 rounded-lg font-bold">
                      Close
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Popups List Table */
        <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h4 className="font-bold text-text">Configured Overlays</h4>
            <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
              {popups.length} popups
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
              <span className="text-sm text-muted font-bold">Retrieving website popups...</span>
            </div>
          ) : popups.length === 0 ? (
            <div className="text-center py-24 px-4">
              <Megaphone className="h-12 w-12 text-muted mx-auto mb-4" />
              <h4 className="font-bold text-text text-md">No Popups Configured</h4>
              <p className="text-sm text-muted mt-1 max-w-sm mx-auto font-medium">
                Create overlay announcements or offers shown automatically to visitors. Click 'Create Popup' to start.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary text-[11px] font-bold text-text uppercase tracking-wider">
                    <th className="p-4 pl-6">Popup Info</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Frequency</th>
                    <th className="p-4">Schedule</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {popups.map(item => (
                    <tr key={item.id} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-text">{item.title}</div>
                        <div className="text-xs text-muted font-mono mt-0.5">{item.id}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${
                          item.type === 'offer' 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                            : item.type === 'maintenance' 
                            ? 'bg-danger/10 text-danger border-danger/20' 
                            : 'bg-primary/10 text-primary border-primary/20'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="p-4 font-semibold capitalize text-text">
                        {item.frequency === 'days' ? `${item.expiry_days} Days Expiry` : item.frequency}
                      </td>
                      <td className="p-4 text-xs font-medium space-y-1">
                        <div className="flex items-center gap-1">
                          <span className="text-muted font-bold">Start:</span>
                          <span className="text-text font-bold">{formatDate(item.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted font-bold">End:</span>
                          <span className="text-text font-bold">{formatDate(item.end_date)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.is_active === 1 
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                            : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                        }`}>
                          {item.is_active === 1 ? (
                            <>
                              <Eye className="h-3.5 w-3.5" /> Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5" /> Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Popup"
                          className="p-1.5 text-muted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-lg transition-colors inline-flex"
                        >
                          <Edit className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          title="Delete Popup"
                          className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-lg transition-colors inline-flex disabled:opacity-50"
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-4.5 w-4.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-4.5 w-4.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManagePopupsUI;
