import { fetchWithAuth } from '../../../api/client';
// ============================================================
// SHIKSHA SAHAYAK OS: ANNOUNCEMENTS HUB
// Operational Broadcast & System Alerts Management Suite
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  Radio,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  X,
  Users,
  Calendar,
  Send,
  Eye,
  Bell,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { AdminContentShell, KPICardItem, FilterOption } from './AdminContentShell';
import { apiClient } from '../../../api/client';
import { toast } from 'sonner';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  link?: string;
  linkLabel?: string;
  audience: 'All' | 'Students' | 'Teachers' | 'Beta Users';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Active' | 'Draft' | 'Expired' | 'Archived';
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export const AdminAnnouncementsHub: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAudience, setSelectedAudience] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formState, setFormState] = useState({
    title: '',
    message: '',
    link: '',
    linkLabel: 'Learn More',
    audience: 'All' as Announcement['audience'],
    priority: 'Medium' as Announcement['priority'],
    status: 'Active' as Announcement['status'],
  });

  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getAnnouncements();
      if (Array.isArray(data)) {
        const mapped: Announcement[] = data.map((a: any) => ({
          id: a.id || `ann_${Math.random()}`,
          title: a.title || a.text?.slice(0, 50) || 'Portal Operational Broadcast',
          message: a.message || a.text || '',
          link: a.link || '',
          linkLabel: a.link_label || 'View Details',
          audience: (a.target_audience as any) || 'All',
          priority: (a.priority as any) || 'Medium',
          status: (a.status as any) || 'Active',
          createdAt: a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Recent',
        }));
        setAnnouncements(mapped);
      } else {
        setAnnouncements([]);
      }
    } catch (e) {
      console.error('Error fetching announcements:', e);
      toast.error('Failed to load announcements');
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Filtered list
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const matchSearch =
        !searchQuery ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.message.toLowerCase().includes(searchQuery.toLowerCase());

      const matchAudience = !selectedAudience || a.audience === selectedAudience;
      const matchPriority = !selectedPriority || a.priority === selectedPriority;
      const matchStatus = !selectedStatus || a.status === selectedStatus;

      return matchSearch && matchAudience && matchPriority && matchStatus;
    });
  }, [announcements, searchQuery, selectedAudience, selectedPriority, selectedStatus]);

  // KPIs
  const totalBroadcasts = announcements.length;
  const activeCount = announcements.filter((a) => a.status === 'Active').length;
  const urgentCount = announcements.filter((a) => a.priority === 'Urgent' || a.priority === 'High').length;
  const draftsCount = announcements.filter((a) => a.status === 'Draft').length;

  const kpis: KPICardItem[] = [
    {
      label: 'ACTIVE BROADCASTS',
      value: activeCount,
      icon: Radio,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      subtext: 'Currently displayed on live portals',
    },
    {
      label: 'TOTAL ANNOUNCEMENTS',
      value: totalBroadcasts,
      icon: Megaphone,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      subtext: 'All recorded system broadcasts',
    },
    {
      label: 'HIGH PRIORITY / URGENT',
      value: urgentCount,
      icon: AlertTriangle,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      subtext: 'Prominent header banner alerts',
    },
    {
      label: 'DRAFT BROADCASTS',
      value: draftsCount,
      icon: Clock,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      subtext: 'Ready for scheduled launch',
    },
  ];

  // Filters setup
  const filterOptions: FilterOption[] = [
    {
      key: 'audience',
      label: 'Audience',
      value: selectedAudience,
      options: [
        { label: 'All Users', value: 'All' },
        { label: 'Students', value: 'Students' },
        { label: 'Teachers', value: 'Teachers' },
        { label: 'Beta Users', value: 'Beta Users' },
      ],
      onChange: setSelectedAudience,
    },
    {
      key: 'priority',
      label: 'Priority',
      value: selectedPriority,
      options: [
        { label: 'Urgent Alert', value: 'Urgent' },
        { label: 'High Priority', value: 'High' },
        { label: 'Medium Priority', value: 'Medium' },
        { label: 'Low Info', value: 'Low' },
      ],
      onChange: setSelectedPriority,
    },
    {
      key: 'status',
      label: 'Status',
      value: selectedStatus,
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Draft', value: 'Draft' },
        { label: 'Expired', value: 'Expired' },
        { label: 'Archived', value: 'Archived' },
      ],
      onChange: setSelectedStatus,
    },
  ];

  // Open Modal for Create / Edit
  const handleOpenModal = (ann?: Announcement) => {
    if (ann) {
      setEditingId(ann.id);
      setFormState({
        title: ann.title,
        message: ann.message,
        link: ann.link || '',
        linkLabel: ann.linkLabel || 'Learn More',
        audience: ann.audience,
        priority: ann.priority,
        status: ann.status,
      });
    } else {
      setEditingId(null);
      setFormState({
        title: '',
        message: '',
        link: '',
        linkLabel: 'Learn More',
        audience: 'All',
        priority: 'Medium',
        status: 'Active',
      });
    }
    setIsModalOpen(true);
  };

  // Save Announcement
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim() || !formState.message.trim()) {
      toast.error('Title and broadcast message are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: formState.message.trim(),
          title: formState.title.trim(),
          link: formState.link.trim() || undefined,
          link_label: formState.linkLabel.trim() || undefined,
          target_audience: formState.audience,
          priority: formState.priority,
          status: formState.status,
        }),
      });

      if (!res.ok) throw new Error('Failed to save announcement');
      toast.success(
        editingId ? 'Announcement updated successfully' : 'Announcement broadcasted live'
      );
      setIsModalOpen(false);
      loadAnnouncements();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Announcement
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this announcement?')) return;
    try {
      const res = await fetchWithAuth(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Announcement removed');
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <AdminContentShell
      title="Announcements & Broadcasts"
      description="Deploy real-time operational notifications, exam schedules, and system alerts to students, teachers, and beta testers across the portal."
      breadcrumb={['ShikshaSahayak Admin', 'Content Management', 'Announcements']}
      primaryAction={{
        label: 'New Broadcast',
        icon: Plus,
        onClick: () => handleOpenModal(),
      }}
      kpis={kpis}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search broadcasts by title or message content..."
      filters={filterOptions}
      onRefresh={loadAnnouncements}
      isLoading={isLoading}
    >
      {/* 1. Announcements Table */}
      <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Broadcast Alert</th>
                <th className="py-3.5 px-4">Target Audience</th>
                <th className="py-3.5 px-4">Priority Level</th>
                <th className="py-3.5 px-4">Action URL</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Broadcast Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredAnnouncements.length > 0 ? (
                filteredAnnouncements.map((ann) => (
                  <tr key={ann.id} className="hover:bg-slate-800/40 transition group">
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            ann.priority === 'Urgent'
                              ? 'bg-red-400 shadow-xs shadow-red-400'
                              : ann.priority === 'High'
                              ? 'bg-amber-400'
                              : 'bg-orange-400'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-white group-hover:text-orange-400 transition truncate">
                            {ann.title}
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                            {ann.message}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        <Users className="w-3 h-3 text-orange-400" />
                        <span>{ann.audience}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          ann.priority === 'Urgent'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : ann.priority === 'High'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : ann.priority === 'Low'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}
                      >
                        {ann.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 max-w-[140px] truncate">
                      {ann.link ? (
                        <a
                          href={ann.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-400 hover:underline flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{ann.linkLabel || 'Link'}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-600">None</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          ann.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-700/30 text-slate-400 border-slate-700'
                        }`}
                      >
                        {ann.status === 'Active' && <Radio className="w-2.5 h-2.5 animate-pulse" />}
                        <span>{ann.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {ann.createdAt}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenModal(ann)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Edit Broadcast"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ann.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition cursor-pointer"
                          title="Delete Broadcast"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-500">
                    <Megaphone className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-400">No announcements found</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Click "+ New Broadcast" to send notification alerts to users.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Educational / Broadcast Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-orange-400 font-bold text-xs">
            <Radio className="w-4 h-4" />
            <span>INSTANT NAVBAR BANNER</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Active announcements render as top notice bars and notification cards on the student portal.
          </p>
        </div>

        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
            <Users className="w-4 h-4" />
            <span>ROLE-BASED TARGETING</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Filter delivery to specifically target Students, Whitelisted Teachers, or Beta Testing participants.
          </p>
        </div>

        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>SEPARATE SSOT STORAGE</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Operational alerts are strictly stored in the dedicated announcements table, separate from blog articles.
          </p>
        </div>
      </div>

      {/* 3. Create / Edit Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {editingId ? 'Edit Announcement' : 'New Operational Broadcast'}
                  </h3>
                  <p className="text-xs text-slate-400">Portal alert configuration</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Alert Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. GTU Summer 2026 Examination Schedule Released"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Broadcast Message Content *
                </label>
                <textarea
                  rows={3}
                  placeholder="Details regarding the alert or announcement..."
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Target Audience
                  </label>
                  <select
                    value={formState.audience}
                    onChange={(e) =>
                      setFormState({ ...formState, audience: e.target.value as any })
                    }
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="All">All Portal Users</option>
                    <option value="Students">Students Only</option>
                    <option value="Teachers">Teachers Only</option>
                    <option value="Beta Users">Beta Testers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Priority Level
                  </label>
                  <select
                    value={formState.priority}
                    onChange={(e) =>
                      setFormState({ ...formState, priority: e.target.value as any })
                    }
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Low">Low (Informational)</option>
                    <option value="Medium">Medium (Standard)</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent Alert Banner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Action URL / Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formState.link}
                    onChange={(e) => setFormState({ ...formState, link: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Link Button Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. View Schedule"
                    value={formState.linkLabel}
                    onChange={(e) => setFormState({ ...formState, linkLabel: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Live Banner Preview Simulation */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>Student Portal Banner Simulation</span>
                </span>
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                    formState.priority === 'Urgent'
                      ? 'bg-red-500/15 border-red-500/30 text-red-200'
                      : formState.priority === 'High'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                      : 'bg-orange-500/15 border-orange-500/30 text-orange-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Bell className="w-4 h-4 shrink-0 text-orange-400" />
                    <span className="font-bold truncate">
                      {formState.title || 'Announcement Title'}
                    </span>
                    <span className="text-[11px] text-slate-400 hidden sm:inline truncate">
                      — {formState.message || 'Notification content'}
                    </span>
                  </div>
                  {formState.link && (
                    <span className="px-2 py-0.5 bg-white/10 rounded font-bold text-[10px] whitespace-nowrap flex items-center gap-1 shrink-0">
                      <span>{formState.linkLabel}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-orange-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Broadcast' : 'Broadcast Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminContentShell>
  );
};
