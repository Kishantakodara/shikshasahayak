import { fetchWithAuth } from '../../../api/client';
// ============================================================
// SHIKSHA SAHAYAK OS: BLOGS & ANNOUNCEMENTS HUB
// Dual Communication & Editorial Publishing Suite
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  PenTool,
  Megaphone,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  Calendar,
  Users,
  X,
  FileText,
  Tag,
  Share2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
} from 'lucide-react';
import { AdminContentShell, KPICardItem } from './AdminContentShell';
import { apiClient } from '../../../api/client';
import { toast } from 'sonner';

interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  link?: string;
  audience: 'All' | 'Students' | 'Teachers' | 'Beta Users';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Active' | 'Draft' | 'Expired' | 'Archived';
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

interface BlogItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  excerpt?: string;
  content: string;
  author: string;
  status: 'Published' | 'Draft' | 'Review' | 'Archived';
  views: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export const AdminBlogsAnnouncementsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'announcements' | 'blogs'>('announcements');
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    link: '',
    audience: 'All' as 'All' | 'Students' | 'Teachers' | 'Beta Users',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
    status: 'Active' as 'Active' | 'Draft' | 'Expired' | 'Archived',
  });

  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogItem | null>(null);
  const [blogForm, setBlogForm] = useState({
    title: '',
    slug: '',
    category: 'Study Guides',
    tags: 'GTU, Exam, Tips',
    thumbnail: '',
    excerpt: '',
    content: '',
    author: 'ShikshaSahayak Editorial',
    status: 'Published' as 'Published' | 'Draft' | 'Review' | 'Archived',
  });

  const [previewBlog, setPreviewBlog] = useState<BlogItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [annData, blogData] = await Promise.all([
        apiClient.getAnnouncements(),
        fetchWithAuth('/api/blogs').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);

      if (Array.isArray(annData)) {
        const mappedAnn: AnnouncementItem[] = annData.map((a: any) => ({
          id: a.id || `ann_${Math.random()}`,
          title: a.title || a.text || 'Portal Operational Broadcast',
          message: a.message || a.text || '',
          link: a.link || '',
          audience: (a.target_audience as any) || 'All',
          priority: (a.priority as any) || 'Medium',
          status: (a.status as any) || 'Active',
          createdAt: a.created_at ? new Date(a.created_at).toLocaleDateString() : 'Recent',
        }));
        setAnnouncements(mappedAnn);
      } else {
        setAnnouncements([]);
      }

      const rawBlogs = blogData.blogs || blogData;
      if (Array.isArray(rawBlogs)) {
        const mappedBlogs: BlogItem[] = rawBlogs.map((b: any) => ({
          id: b.id || `blog_${Math.random()}`,
          title: b.title || 'Untitled Blog Article',
          slug: b.slug || b.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'article',
          category: b.category || 'Study Guides',
          tags: Array.isArray(b.tags) ? b.tags : (b.tags ? b.tags.split(',') : ['GTU', 'Exam']),
          thumbnail: b.thumbnail || '',
          excerpt: b.excerpt || (b.content ? b.content.slice(0, 120) + '...' : ''),
          content: b.content || '',
          author: b.author || 'ShikshaSahayak Editorial',
          status: b.status === 'published' ? 'Published' : 'Draft',
          views: Number(b.views || 0),
          createdAt: b.created_at ? new Date(b.created_at).toLocaleDateString() : 'Recent',
          updatedAt: b.updated_at ? new Date(b.updated_at).toLocaleDateString() : 'Recent',
        }));
        setBlogs(mappedBlogs);
      } else {
        setBlogs([]);
      }
    } catch (e) {
      console.error('Error fetching blogs & announcements:', e);
      toast.error('Failed to load communications data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered lists
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(
      (a) =>
        !searchQuery ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.message.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [announcements, searchQuery]);

  const filteredBlogs = useMemo(() => {
    return blogs.filter(
      (b) =>
        !searchQuery ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [blogs, searchQuery]);

  // KPIs
  const activeAnnouncements = announcements.filter((a) => a.status === 'Active').length;
  const publishedBlogs = blogs.filter((b) => b.status === 'Published').length;
  const totalBlogViews = blogs.reduce((acc, b) => acc + (b.views || 0), 0);

  const kpis: KPICardItem[] = [
    {
      label: 'ACTIVE ANNOUNCEMENTS',
      value: activeAnnouncements,
      icon: Megaphone,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      subtext: 'Broadcasting to students/faculty',
    },
    {
      label: 'PUBLISHED BLOGS',
      value: publishedBlogs,
      icon: PenTool,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      subtext: 'Live educational articles',
    },
    {
      label: 'EDITORIAL VIEWS',
      value: totalBlogViews,
      icon: Globe,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      subtext: 'Total student readership',
    },
    {
      label: 'TOTAL DRAFTS',
      value: announcements.filter((a) => a.status === 'Draft').length + blogs.filter((b) => b.status === 'Draft').length,
      icon: Clock,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      subtext: 'Scheduled for publishing',
    },
  ];

  // Announcement Handlers
  const handleOpenAnnouncementModal = (ann?: AnnouncementItem) => {
    if (ann) {
      setEditingAnnouncement(ann);
      setAnnouncementForm({
        title: ann.title,
        message: ann.message,
        link: ann.link || '',
        audience: ann.audience,
        priority: ann.priority,
        status: ann.status,
      });
    } else {
      setEditingAnnouncement(null);
      setAnnouncementForm({
        title: '',
        message: '',
        link: '',
        audience: 'All',
        priority: 'Medium',
        status: 'Active',
      });
    }
    setIsAnnouncementModalOpen(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() && !announcementForm.message.trim()) {
      toast.error('Title or message is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: announcementForm.message.trim() || announcementForm.title.trim(),
          title: announcementForm.title.trim(),
          link: announcementForm.link.trim() || undefined,
          target_audience: announcementForm.audience,
          priority: announcementForm.priority,
          status: announcementForm.status,
        }),
      });

      if (!res.ok) throw new Error('Failed to save announcement');
      toast.success('Announcement broadcast published');
      setIsAnnouncementModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to remove this announcement?')) return;
    try {
      await fetchWithAuth(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      toast.success('Announcement deleted');
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      toast.error('Failed to delete announcement');
    }
  };

  // Blog Handlers
  const handleOpenBlogModal = (blog?: BlogItem) => {
    if (blog) {
      setEditingBlog(blog);
      setBlogForm({
        title: blog.title,
        slug: blog.slug,
        category: blog.category,
        tags: blog.tags.join(', '),
        thumbnail: blog.thumbnail || '',
        excerpt: blog.excerpt || '',
        content: blog.content,
        author: blog.author,
        status: blog.status,
      });
    } else {
      setEditingBlog(null);
      setBlogForm({
        title: '',
        slug: '',
        category: 'Study Guides',
        tags: 'GTU, Exam, Tips',
        thumbnail: '',
        excerpt: '',
        content: '',
        author: 'ShikshaSahayak Editorial',
        status: 'Published',
      });
    }
    setIsBlogModalOpen(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogForm.title.trim() || !blogForm.content.trim()) {
      toast.error('Title and Content are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: blogForm.title.trim(),
        slug: blogForm.slug.trim() || blogForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: blogForm.category,
        tags: blogForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        thumbnail: blogForm.thumbnail.trim() || undefined,
        excerpt: blogForm.excerpt.trim() || undefined,
        content: blogForm.content,
        author: blogForm.author.trim() || 'ShikshaSahayak Editorial',
        status: blogForm.status.toLowerCase(),
      };

      const url = editingBlog ? `/api/blogs/${editingBlog.id}` : '/api/blogs';
      const method = editingBlog ? 'PUT' : 'POST';

      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save blog');
      toast.success(editingBlog ? 'Blog article updated' : 'Blog article published');
      setIsBlogModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save blog');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog article?')) return;
    try {
      await fetchWithAuth(`/api/blogs/${id}`, { method: 'DELETE' });
      toast.success('Blog article deleted');
      setBlogs((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      toast.error('Failed to delete blog');
    }
  };

  return (
    <AdminContentShell
      title="Blogs & Announcements"
      description="Two distinct publishing systems under one unified interface: Broadcast operational announcements to portal users, and author educational blogs and study guides."
      breadcrumb={['ShikshaSahayak Admin', 'Content Management', 'Blogs & Announcements']}
      primaryAction={{
        label: activeTab === 'announcements' ? 'New Announcement' : 'Write Blog',
        icon: Plus,
        onClick: () => {
          if (activeTab === 'announcements') handleOpenAnnouncementModal();
          else handleOpenBlogModal();
        },
      }}
      kpis={kpis}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={
        activeTab === 'announcements' ? 'Search announcements...' : 'Search blog articles...'
      }
      activeTabSelector={
        <div className="flex items-center gap-2 pt-1 pb-3">
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Announcements ({announcements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('blogs')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'blogs'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Blogs & Guides ({blogs.length})</span>
          </button>
        </div>
      }
      onRefresh={loadData}
      isLoading={isLoading}
    >
      {/* SECTION A: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Broadcast Message</th>
                  <th className="py-3.5 px-4">Target Audience</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Link URL</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredAnnouncements.length > 0 ? (
                  filteredAnnouncements.map((ann) => (
                    <tr key={ann.id} className="hover:bg-slate-800/40 transition group">
                      <td className="py-3 px-4 max-w-sm">
                        <p className="font-bold text-white group-hover:text-orange-400 transition truncate">
                          {ann.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{ann.message}</p>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          <Users className="w-3 h-3 text-orange-400" />
                          <span>{ann.audience}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            ann.priority === 'Urgent'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : ann.priority === 'High'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {ann.priority}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 truncate max-w-[150px]">
                        {ann.link ? (
                          <a
                            href={ann.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-400 hover:underline flex items-center gap-1"
                          >
                            <span>Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          'None'
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            ann.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-700/30 text-slate-400 border-slate-700'
                          }`}
                        >
                          {ann.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {ann.createdAt}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAnnouncementModal(ann)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Edit Announcement"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition cursor-pointer"
                            title="Delete Announcement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Megaphone className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-400">No announcements published</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Click "+ New Announcement" above to broadcast to students and teachers.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION B: BLOGS */}
      {activeTab === 'blogs' && (
        <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Article Title</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Views</th>
                  <th className="py-3.5 px-4">Published</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredBlogs.length > 0 ? (
                  filteredBlogs.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition group">
                      <td className="py-3 px-4 max-w-sm">
                        <p className="font-bold text-white group-hover:text-orange-400 transition truncate">
                          {b.title}
                        </p>
                        <p className="text-[10px] text-purple-400 font-mono truncate">{b.slug}</p>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {b.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-300">{b.author}</td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            b.status === 'Published'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-700/30 text-slate-400 border-slate-700'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{b.views}</td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {b.createdAt}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewBlog(b)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Preview Article"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenBlogModal(b)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Edit Article"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlog(b.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition cursor-pointer"
                            title="Delete Article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <PenTool className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-400">No blog articles found</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Click "+ Write Blog" above to publish educational guides.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Educational Footer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-orange-400 font-bold text-xs">
            <Radio className="w-4 h-4" />
            <span>OPERATIONAL BROADCASTS</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Announcements appear in top banners and notification feeds for targeted audiences across portals.
          </p>
        </div>

        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
            <PenTool className="w-4 h-4" />
            <span>EDITORIAL INTEGRITY</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Blogs are educational articles and study guides published directly to the public discovery portal.
          </p>
        </div>

        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>DATABASE SEPARATION</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Announcements and Blogs use dedicated backend tables, ensuring no cross-contamination of metadata.
          </p>
        </div>
      </div>

      {/* Announcement Modal */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Broadcast Announcement</h3>
                  <p className="text-xs text-slate-400">Portal-wide operational alert</p>
                </div>
              </div>
              <button
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. GTU Summer 2026 Exam Schedule Released"
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm({ ...announcementForm, title: e.target.value })
                  }
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Message Content *
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed notification message for students..."
                  value={announcementForm.message}
                  onChange={(e) =>
                    setAnnouncementForm({ ...announcementForm, message: e.target.value })
                  }
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Audience
                  </label>
                  <select
                    value={announcementForm.audience}
                    onChange={(e) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        audience: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="All">All Users</option>
                    <option value="Students">Students Only</option>
                    <option value="Teachers">Teachers Only</option>
                    <option value="Beta Users">Beta Testers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={announcementForm.priority}
                    onChange={(e) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        priority: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Optional Action Link
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={announcementForm.link}
                  onChange={(e) =>
                    setAnnouncementForm({ ...announcementForm, link: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-orange-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blog Modal */}
      {isBlogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {editingBlog ? 'Edit Blog Article' : 'Write Educational Blog'}
                  </h3>
                  <p className="text-xs text-slate-400">Public student study guide</p>
                </div>
              </div>
              <button
                onClick={() => setIsBlogModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBlog} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5 Strategies to Master Computer Networks for GTU Semester 5"
                  value={blogForm.title}
                  onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={blogForm.category}
                    onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Study Guides">Study Guides</option>
                    <option value="Exam Preparation">Exam Preparation</option>
                    <option value="Career & Engineering">Career & Engineering</option>
                    <option value="Announcements">General Articles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={blogForm.author}
                    onChange={(e) => setBlogForm({ ...blogForm, author: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="GTU, Exam, Notes, Strategy"
                  value={blogForm.tags}
                  onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Markdown Content *
                </label>
                <textarea
                  rows={8}
                  placeholder="# Introduction to..."
                  value={blogForm.content}
                  onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBlogModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-purple-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingBlog ? 'Update Article' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Drawer */}
      {previewBlog && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-[#0F172A] border-l border-slate-800 w-full max-w-lg h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              <div className="p-5 border-b border-slate-800 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                    {previewBlog.category} • by {previewBlog.author}
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-0.5">{previewBlog.title}</h3>
                </div>
                <button
                  onClick={() => setPreviewBlog(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto max-h-[calc(100vh-140px)] space-y-4">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                  {previewBlog.content}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">{previewBlog.views} Views</span>
              <button
                onClick={() => setPreviewBlog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminContentShell>
  );
};
