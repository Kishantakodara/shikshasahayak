import { fetchWithAuth } from '../../../api/client';
// ============================================================
// SHIKSHA SAHAYAK OS: BLOGS & EDITORIAL HUB
// Comprehensive Article Writing, Editing, Managing & Publishing Suite
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  PenTool,
  Plus,
  Eye,
  Edit3,
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
  Search,
  Filter,
  ArrowLeft,
  Save,
  Copy,
  Layers,
  Image as ImageIcon,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Link as LinkIcon,
  Table as TableIcon,
  HelpCircle,
  TrendingUp,
  BookOpen,
  SlidersHorizontal,
  ChevronDown,
  LayoutGrid,
  ListFilter,
  Check,
} from 'lucide-react';
import { AdminContentShell, KPICardItem, FilterOption } from './AdminContentShell';
import { toast } from 'sonner';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  excerpt?: string;
  content: string;
  author: string;
  status: 'Published' | 'Draft' | 'Review' | 'Scheduled' | 'Archived';
  views: number;
  seoTitle?: string;
  seoDescription?: string;
  relatedDocumentId?: string;
  isFeatured?: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  'Study Guides',
  'Exam Preparation',
  'Career & Engineering',
  'Subject Summaries',
  'GTU Updates',
  'Tech Tutorials',
  'Student Tips',
];

const TEMPLATES = [
  {
    name: 'Comprehensive Study Guide',
    content: `# Comprehensive Study Guide: [Subject Name]

## 1. Overview & Key Objectives
Briefly explain what this subject covers and why it is foundational for engineering students.

## 2. High-Weightage Modules
- **Module 1**: Core Theory & Fundamentals
- **Module 2**: Algorithms & Numerical Problems
- **Module 3**: Architectural & Practical Concepts

## 3. Important Formulas & Key Equations
\`\`\`
Formula 1: Definition and expression
Formula 2: Applications and boundaries
\`\`\`

## 4. Frequent Exam Questions (GTU / University)
1. Explain the differences between Architecture A and Architecture B (7 Marks)
2. Derive the equations for performance metrics (7 Marks)

## 5. Recommended Resources & Next Steps
- Review unit-wise notes in the ShikshaSahayak Study Materials section.
- Practice authentic Previous Year Papers (PYQs).
`,
  },
  {
    name: 'GTU Exam Strategy & Tips',
    content: `# GTU Exam Strategy: How to Score High in [Subject]

## 1. Pattern Analysis & Marks Distribution
Understand how the 70-mark university question paper is typically split.

## 2. Top 10 Most Repeated Topics
1. Topic 1 (Appeared in 4+ consecutive papers)
2. Topic 2 (High frequency question)
3. Topic 3 (Numerical/Problem solving)

## 3. Answer Writing Technique (Step-by-Step)
- **Start with diagrams**: GTU evaluators prioritize clear, labeled schematics.
- **Use point format**: Avoid long unstructured paragraphs.
- **Highlight keywords**: Underline critical terms and technical terminology.

## 4. Final Revision Checklist
- [ ] Unit 1 Short definitions & diagrams
- [ ] Unit 2 Mathematical derivations
- [ ] Unit 3 Case studies & real-world implementations
`,
  },
  {
    name: 'Unit Summary & Quick Notes',
    content: `# Quick Revision Summary: Unit [No] - [Unit Title]

## Summary Snapshot
> **Core Concept**: 1-2 sentence core thesis of this unit.

### Key Concepts Breakdown
1. **Concept A**: Concise explanation with real-world context.
2. **Concept B**: Comparative pros and cons table.

| Feature | Type A | Type B |
| :--- | :--- | :--- |
| Complexity | O(n) | O(log n) |
| Memory Usage | Low | Moderate |

### Key Takeaways for Viva & MCQ
- Note 1
- Note 2
`,
  },
];

export const AdminBlogsHub: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'views' | 'title'>('recent');

  // Studio / Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState<'write' | 'preview' | 'split'>('split');
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [blogForm, setBlogForm] = useState({
    title: '',
    slug: '',
    category: 'Study Guides',
    tagInput: '',
    tags: ['GTU', 'Exam Tips'],
    thumbnail: '',
    excerpt: '',
    content: '',
    author: 'ShikshaSahayak Editorial',
    status: 'Published' as BlogPost['status'],
    seoTitle: '',
    seoDescription: '',
    isFeatured: false,
    relatedDocumentId: '',
  });

  // Preview Drawer
  const [previewArticle, setPreviewArticle] = useState<BlogPost | null>(null);

  const loadBlogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth('/api/blogs?admin=true');
      if (res.ok) {
        const data = await res.json();
        const rawBlogs = data.blogs || data;
        if (Array.isArray(rawBlogs)) {
          const mapped: BlogPost[] = rawBlogs.map((b: any) => ({
            id: b.id || `blog_${Math.random()}`,
            title: b.title || 'Untitled Article',
            slug: b.slug || b.id || '',
            category: b.category || 'Study Guides',
            tags: Array.isArray(b.tags)
              ? b.tags
              : b.tags
              ? b.tags.split(',').map((t: string) => t.trim())
              : ['Engineering'],
            thumbnail: b.thumbnail || '',
            excerpt: b.excerpt || (b.content ? b.content.slice(0, 140) + '...' : ''),
            content: b.content || '',
            author: b.author || 'ShikshaSahayak Editorial',
            status:
              b.status === 'published'
                ? 'Published'
                : b.status === 'review'
                ? 'Review'
                : b.status === 'scheduled'
                ? 'Scheduled'
                : b.status === 'archived'
                ? 'Archived'
                : 'Draft',
            views: Number(b.views || 0),
            seoTitle: b.seo_title || b.title || '',
            seoDescription: b.seo_description || b.excerpt || '',
            relatedDocumentId: b.related_document_id || '',
            isFeatured: Boolean(b.is_featured),
            publishedAt: b.created_at ? new Date(b.created_at).toLocaleDateString() : 'Recent',
            createdAt: b.created_at ? new Date(b.created_at).toLocaleDateString() : 'Recent',
            updatedAt: b.updated_at ? new Date(b.updated_at).toLocaleDateString() : 'Recent',
          }));
          setBlogs(mapped);
        } else {
          setBlogs([]);
        }
      } else {
        setBlogs([]);
      }
    } catch (e) {
      console.error('Error fetching blogs:', e);
      toast.error('Failed to load blog articles');
      setBlogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  // Compute Reading Time & Word Count
  const editorWordCount = useMemo(() => {
    if (!blogForm.content) return 0;
    return blogForm.content.trim().split(/\s+/).filter(Boolean).length;
  }, [blogForm.content]);

  const editorReadingTime = useMemo(() => {
    return Math.max(1, Math.ceil(editorWordCount / 200));
  }, [editorWordCount]);

  // Auto generate slug from title
  const handleTitleChange = (newTitle: string) => {
    const autoSlug = newTitle
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setBlogForm((prev) => ({
      ...prev,
      title: newTitle,
      slug: prev.slug === '' || prev.slug === autoSlug.slice(0, -1) ? autoSlug : prev.slug,
      seoTitle: prev.seoTitle === '' ? newTitle : prev.seoTitle,
    }));
  };

  // Tag Handling
  const handleAddTag = () => {
    const trimmed = blogForm.tagInput.trim();
    if (trimmed && !blogForm.tags.includes(trimmed)) {
      setBlogForm({
        ...blogForm,
        tags: [...blogForm.tags, trimmed],
        tagInput: '',
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setBlogForm({
      ...blogForm,
      tags: blogForm.tags.filter((t) => t !== tagToRemove),
    });
  };

  // Open Editor for New Article
  const handleOpenNewEditor = () => {
    setEditingBlogId(null);
    setBlogForm({
      title: '',
      slug: '',
      category: 'Study Guides',
      tagInput: '',
      tags: ['GTU', 'Exam Tips', 'Engineering'],
      thumbnail: '',
      excerpt: '',
      content: TEMPLATES[0].content,
      author: 'ShikshaSahayak Editorial',
      status: 'Published',
      seoTitle: '',
      seoDescription: '',
      isFeatured: false,
      relatedDocumentId: '',
    });
    setEditorTab('split');
    setIsEditorOpen(true);
  };

  // Open Editor for Existing Article
  const handleOpenEditEditor = (blog: BlogPost) => {
    setEditingBlogId(blog.id);
    setBlogForm({
      title: blog.title,
      slug: blog.slug,
      category: blog.category,
      tagInput: '',
      tags: blog.tags,
      thumbnail: blog.thumbnail || '',
      excerpt: blog.excerpt || '',
      content: blog.content,
      author: blog.author,
      status: blog.status,
      seoTitle: blog.seoTitle || blog.title,
      seoDescription: blog.seoDescription || blog.excerpt || '',
      isFeatured: Boolean(blog.isFeatured),
      relatedDocumentId: blog.relatedDocumentId || '',
    });
    setEditorTab('split');
    setIsEditorOpen(true);
  };

  // Insert Markdown Snippet
  const insertMarkdown = (syntaxBefore: string, syntaxAfter = '') => {
    const textarea = document.getElementById('blog-markdown-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousText = textarea.value;
    const selectedText = previousText.substring(start, end) || 'Sample text';

    const replacement = `${syntaxBefore}${selectedText}${syntaxAfter}`;
    const newContent =
      previousText.substring(0, start) + replacement + previousText.substring(end);

    setBlogForm((prev) => ({ ...prev, content: newContent }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + syntaxBefore.length,
        start + syntaxBefore.length + selectedText.length
      );
    }, 50);
  };

  // Save Blog Post (Create / Update)
  const handleSaveBlog = async (targetStatus?: BlogPost['status']) => {
    if (!blogForm.title.trim() || !blogForm.content.trim()) {
      toast.error('Title and Article Content are required');
      return;
    }

    const currentStatus = targetStatus || blogForm.status;
    setIsSaving(true);

    try {
      const payload = {
        title: blogForm.title.trim(),
        slug: blogForm.slug.trim() || blogForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: blogForm.category,
        tags: blogForm.tags.join(','),
        thumbnail: blogForm.thumbnail.trim() || undefined,
        excerpt: blogForm.excerpt.trim() || blogForm.content.slice(0, 140) + '...',
        content: blogForm.content,
        author: blogForm.author.trim() || 'ShikshaSahayak Editorial',
        status: currentStatus.toLowerCase(),
        seo_title: blogForm.seoTitle.trim() || blogForm.title.trim(),
        seo_description: blogForm.seoDescription.trim() || blogForm.excerpt.trim(),
        related_document_id: blogForm.relatedDocumentId || undefined,
      };

      const url = editingBlogId ? `/api/blogs/${editingBlogId}` : '/api/blogs';
      const method = editingBlogId ? 'PUT' : 'POST';

      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save blog post');
      }

      toast.success(
        editingBlogId
          ? `Article updated (${currentStatus})`
          : `Article published successfully (${currentStatus})`
      );

      setIsEditorOpen(false);
      loadBlogs();
    } catch (err: any) {
      toast.error(err.message || 'Error saving article');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Publish / Unpublish
  const handleToggleStatus = async (blog: BlogPost) => {
    const nextStatus = blog.status === 'Published' ? 'draft' : 'published';
    try {
      const res = await fetchWithAuth(`/api/blogs/${blog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error('Status update failed');
      toast.success(`Article set to ${nextStatus.toUpperCase()}`);
      setBlogs((prev) =>
        prev.map((b) => (b.id === blog.id ? { ...b, status: nextStatus === 'published' ? 'Published' : 'Draft' } : b))
      );
    } catch (err: any) {
      toast.error('Failed to change status');
    }
  };

  // Duplicate / Clone Blog
  const handleDuplicateBlog = async (blog: BlogPost) => {
    try {
      const payload = {
        title: `${blog.title} (Copy)`,
        slug: `${blog.slug}-copy-${Math.floor(Math.random() * 1000)}`,
        category: blog.category,
        tags: blog.tags.join(','),
        thumbnail: blog.thumbnail,
        excerpt: blog.excerpt,
        content: blog.content,
        author: blog.author,
        status: 'draft',
      };

      const res = await fetchWithAuth('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Duplicate failed');
      toast.success('Article cloned as Draft');
      loadBlogs();
    } catch (err: any) {
      toast.error('Failed to duplicate article');
    }
  };

  // Delete Blog
  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this article?')) return;
    try {
      const res = await fetchWithAuth(`/api/blogs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Article deleted safely');
      setBlogs((prev) => prev.filter((b) => b.id !== id));
      if (previewArticle?.id === id) setPreviewArticle(null);
    } catch (err: any) {
      toast.error('Failed to delete blog');
    }
  };

  // Filtered & Sorted Blogs
  const filteredBlogs = useMemo(() => {
    return blogs
      .filter((b) => {
        const matchSearch =
          !searchQuery ||
          b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
          b.author.toLowerCase().includes(searchQuery.toLowerCase());

        const matchCategory = !selectedCategory || b.category === selectedCategory;
        const matchStatus = !selectedStatus || b.status === selectedStatus;

        return matchSearch && matchCategory && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return 0; // Default recent
      });
  }, [blogs, searchQuery, selectedCategory, selectedStatus, sortBy]);

  // KPIs
  const totalArticles = blogs.length;
  const publishedCount = blogs.filter((b) => b.status === 'Published').length;
  const draftsCount = blogs.filter((b) => b.status === 'Draft' || b.status === 'Review').length;
  const totalViews = blogs.reduce((acc, b) => acc + (b.views || 0), 0);

  const kpis: KPICardItem[] = [
    {
      label: 'TOTAL EDITORIAL ARTICLES',
      value: totalArticles,
      icon: PenTool,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      subtext: 'Curated student guides & tutorials',
    },
    {
      label: 'PUBLISHED & LIVE',
      value: publishedCount,
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      subtext: `${Math.round((publishedCount / (totalArticles || 1)) * 100)}% public accessibility`,
    },
    {
      label: 'TOTAL STUDENT VIEWS',
      value: totalViews.toLocaleString(),
      icon: Globe,
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      subtext: 'Total reader engagements',
    },
    {
      label: 'DRAFTS & IN REVIEW',
      value: draftsCount,
      icon: Clock,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      subtext: 'Scheduled for editorial release',
    },
  ];

  // Filters
  const filterOptions: FilterOption[] = [
    {
      key: 'category',
      label: 'Category',
      value: selectedCategory,
      options: CATEGORIES.map((c) => ({ label: c, value: c })),
      onChange: setSelectedCategory,
    },
    {
      key: 'status',
      label: 'Status',
      value: selectedStatus,
      options: [
        { label: 'Published', value: 'Published' },
        { label: 'Draft', value: 'Draft' },
        { label: 'Review', value: 'Review' },
        { label: 'Scheduled', value: 'Scheduled' },
        { label: 'Archived', value: 'Archived' },
      ],
      onChange: setSelectedStatus,
    },
  ];

  // -------------------------------------------------------------
  // FULL-SCREEN IMMERSIVE BLOG STUDIO / EDITOR
  // -------------------------------------------------------------
  if (isEditorOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#070B14] flex flex-col text-slate-200 overflow-hidden animate-in fade-in duration-200">
        {/* Studio Top Navbar */}
        <header className="h-16 px-6 bg-[#0B1120] border-b border-slate-800/80 flex items-center justify-between shrink-0 shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (confirm('Leave editor? Any unsaved changes may be lost.')) {
                  setIsEditorOpen(false);
                }
              }}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Articles</span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>{editingBlogId ? 'Editing Article' : 'Writing New Article'}</span>
              </span>
              <h2 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                {blogForm.title || 'Untitled Article'}
              </h2>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] font-mono text-slate-400">
              <span>{editorWordCount} words</span>
              <span>•</span>
              <span>{editorReadingTime} min read</span>
            </div>

            <button
              type="button"
              onClick={() => handleSaveBlog('Draft')}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={() => handleSaveBlog('Published')}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white text-xs font-extrabold shadow-lg shadow-purple-500/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Publishing...' : 'Publish Article'}</span>
            </button>
          </div>
        </header>

        {/* Studio Body: Split Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Main Writing Area (8 cols) */}
          <div className="lg:col-span-8 flex flex-col border-r border-slate-800/80 bg-[#0A0F1D] overflow-y-auto">
            {/* Title & Quick Metadata Bar */}
            <div className="p-6 pb-4 space-y-4 border-b border-slate-800/60 bg-[#0D1527]/40">
              <input
                type="text"
                placeholder="Enter an inspiring, search-friendly article title..."
                value={blogForm.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full text-xl sm:text-2xl font-extrabold text-white placeholder-slate-600 bg-transparent border-0 focus:outline-none focus:ring-0 leading-tight"
              />

              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Category */}
                <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  <select
                    value={blogForm.category}
                    onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                    className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-slate-900 text-slate-200">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Slug display */}
                <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-[11px] text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-orange-400" />
                  <span>/blogs/</span>
                  <input
                    type="text"
                    value={blogForm.slug}
                    onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                    className="bg-transparent text-orange-300 focus:outline-none max-w-[180px] font-mono"
                    placeholder="article-slug"
                  />
                </div>

                {/* Template Selector */}
                <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <select
                    onChange={(e) => {
                      const tpl = TEMPLATES.find((t) => t.name === e.target.value);
                      if (tpl) {
                        if (confirm(`Load template "${tpl.name}"? This will replace current text.`)) {
                          setBlogForm((prev) => ({ ...prev, content: tpl.content }));
                        }
                      }
                    }}
                    defaultValue=""
                    className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-slate-900">
                      ⚡ Insert Structure Template...
                    </option>
                    {TEMPLATES.map((t) => (
                      <option key={t.name} value={t.name} className="bg-slate-900 text-slate-200">
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Markdown Toolbar */}
            <div className="px-6 py-2.5 bg-[#0F172A] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertMarkdown('# ')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Heading 1"
                >
                  <Heading1 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('## ')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('### ')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Heading 3"
                >
                  <Heading3 className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={() => insertMarkdown('**', '**')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('*', '*')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('~~', '~~')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Strikethrough"
                >
                  <Strikethrough className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={() => insertMarkdown('- ')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('1. ')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('- [ ] ')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Checklist"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={() => insertMarkdown('> ')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Blockquote"
                >
                  <Quote className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('```\n', '\n```')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Code Block"
                >
                  <Code className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('[', '](https://)')}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Insert Link"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertMarkdown('\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Data A | Data B |\n')
                  }
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Insert Table"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
              </div>

              {/* View mode switcher for editor */}
              <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setEditorTab('write')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    editorTab === 'write' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('split')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    editorTab === 'split' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Split View
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('preview')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    editorTab === 'preview' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {/* Split Writing / Live Preview Area */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800/80 min-h-[500px]">
              {/* Write Side */}
              {(editorTab === 'write' || editorTab === 'split') && (
                <div className={`p-6 flex flex-col ${editorTab === 'write' ? 'md:col-span-2' : ''}`}>
                  <textarea
                    id="blog-markdown-textarea"
                    placeholder="Write article content using Markdown format..."
                    value={blogForm.content}
                    onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                    className="w-full flex-1 min-h-[420px] bg-transparent text-slate-200 font-mono text-sm leading-relaxed focus:outline-none resize-none placeholder-slate-600"
                  />
                </div>
              )}

              {/* Live Preview Side */}
              {(editorTab === 'preview' || editorTab === 'split') && (
                <div
                  className={`p-6 overflow-y-auto bg-[#070D18]/50 prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-300 font-sans ${
                    editorTab === 'preview' ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                      Live Reader Preview
                    </span>
                    <span className="text-[10px] font-mono text-purple-400">{blogForm.category}</span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-white mb-2">{blogForm.title}</h1>
                  <p className="text-xs text-slate-400 italic mb-4">{blogForm.excerpt}</p>

                  <div className="space-y-4 whitespace-pre-wrap font-sans">
                    {blogForm.content}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Publishing Settings, SEO & Taxonomy (4 cols) */}
          <div className="lg:col-span-4 bg-[#0B1120] p-6 space-y-6 overflow-y-auto border-t lg:border-t-0">
            {/* 1. Publishing Status & Visibility */}
            <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800/80 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                <span>Publishing Controls</span>
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Article Status
                </label>
                <select
                  value={blogForm.status}
                  onChange={(e) => setBlogForm({ ...blogForm, status: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
                >
                  <option value="Published">Published (Live to Students)</option>
                  <option value="Draft">Draft (Private)</option>
                  <option value="Review">In Review</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Author Name
                </label>
                <input
                  type="text"
                  value={blogForm.author}
                  onChange={(e) => setBlogForm({ ...blogForm, author: e.target.value })}
                  placeholder="e.g. Prof. Mehta or ShikshaSahayak Editorial"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Featured / Pin Toggle */}
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={blogForm.isFeatured}
                  onChange={(e) => setBlogForm({ ...blogForm, isFeatured: e.target.checked })}
                  className="rounded text-orange-500 focus:ring-0"
                />
                <div className="text-xs">
                  <span className="font-bold text-white">Pin as Featured Guide</span>
                  <p className="text-[10px] text-slate-400">Highlights this article on top of the discovery portal</p>
                </div>
              </label>
            </div>

            {/* 2. Cover Thumbnail & Excerpt */}
            <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800/80 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-orange-400" />
                <span>Media & Excerpt</span>
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Cover Image URL / Storage Path
                </label>
                <input
                  type="url"
                  value={blogForm.thumbnail}
                  onChange={(e) => setBlogForm({ ...blogForm, thumbnail: e.target.value })}
                  placeholder="https://images.unsplash.com/... or R2 URL"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
                {blogForm.thumbnail && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-slate-700 h-28 bg-slate-900 flex items-center justify-center">
                    <img
                      src={blogForm.thumbnail}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Brief Summary / Excerpt
                </label>
                <textarea
                  rows={2}
                  value={blogForm.excerpt}
                  onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  placeholder="Short description displayed on blog feed cards..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tags & Focus Keywords
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={blogForm.tagInput}
                    onChange={(e) => setBlogForm({ ...blogForm, tagInput: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add tag (e.g. GTU-Sem5)..."
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl border border-slate-700 transition"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {blogForm.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-purple-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. SEO & Social Meta */}
            <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800/80 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Search Engine Optimization (SEO)</span>
              </h3>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <span>Meta Title</span>
                  <span className="font-mono text-slate-500">{blogForm.seoTitle.length}/60</span>
                </div>
                <input
                  type="text"
                  value={blogForm.seoTitle}
                  onChange={(e) => setBlogForm({ ...blogForm, seoTitle: e.target.value })}
                  placeholder="SEO Title for Google snippet"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  <span>Meta Description</span>
                  <span className="font-mono text-slate-500">{blogForm.seoDescription.length}/160</span>
                </div>
                <textarea
                  rows={2}
                  value={blogForm.seoDescription}
                  onChange={(e) => setBlogForm({ ...blogForm, seoDescription: e.target.value })}
                  placeholder="Concise summary shown under Google search results..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Google Snippet Simulation */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                <div className="text-[10px] font-mono text-slate-500">Google Search Simulation</div>
                <div className="text-xs font-bold text-[#8AB4F8] truncate">
                  {blogForm.seoTitle || blogForm.title || 'Article Title'} | ShikshaSahayak
                </div>
                <div className="text-[10px] font-mono text-[#34A853] truncate">
                  https://shikshasahayak.org/blogs/{blogForm.slug || 'article-slug'}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-2">
                  {blogForm.seoDescription || blogForm.excerpt || 'Article summary description...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN CATALOG & MANAGEMENT VIEW
  // -------------------------------------------------------------
  return (
    <AdminContentShell
      title="Blogs & Study Guides Studio"
      description="Full-featured editorial hub for writing, editing, managing, and publishing high-impact study guides, exam strategies, and educational blogs for students."
      breadcrumb={['ShikshaSahayak Admin', 'Content Management', 'Blogs']}
      primaryAction={{
        label: 'Write New Article',
        icon: Plus,
        onClick: handleOpenNewEditor,
      }}
      secondaryAction={{
        label: 'Export Index',
        icon: Share2,
        onClick: () => {
          const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(blogs, null, 2)
          )}`;
          const downloadAnchor = document.createElement('a');
          downloadAnchor.setAttribute('href', jsonString);
          downloadAnchor.setAttribute('download', `padhaku_blogs_${Date.now()}.json`);
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();
          toast.success('Blog catalog exported');
        },
      }}
      kpis={kpis}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search articles by title, category, tags, or author..."
      filters={filterOptions}
      activeTabSelector={
        <div className="flex items-center justify-between pt-1 pb-3">
          {/* Categories Quick Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                !selectedCategory
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Categories ({blogs.length})
            </button>
            {CATEGORIES.map((c) => {
              const count = blogs.filter((b) => b.category === c).length;
              if (count === 0 && selectedCategory !== c) return null;
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(selectedCategory === c ? '' : c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === c
                      ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                      : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {c} ({count})
                </button>
              );
            })}
          </div>

          {/* View Mode & Sort */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="recent">Sort: Most Recent</option>
              <option value="views">Sort: Most Viewed</option>
              <option value="title">Sort: Title A-Z</option>
            </select>

            <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <ListFilter className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      }
      onRefresh={loadBlogs}
      isLoading={isLoading}
    >
      {/* 1. GRID CARDS VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBlogs.length > 0 ? (
            filteredBlogs.map((b) => (
              <div
                key={b.id}
                className="bg-[#0F172A] rounded-2xl border border-slate-800/90 hover:border-slate-700/80 transition shadow-sm overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Card Thumbnail / Header */}
                  <div className="h-40 bg-slate-900 relative overflow-hidden flex items-center justify-center">
                    {b.thumbnail ? (
                      <img
                        src={b.thumbnail}
                        alt={b.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-purple-950/40 text-slate-600">
                        <PenTool className="w-8 h-8 text-purple-400/40 mb-1" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                          {b.category}
                        </span>
                      </div>
                    )}

                    {/* Category & Status Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900/90 text-purple-300 border border-purple-500/30 backdrop-blur-md">
                        {b.category}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${
                          b.status === 'Published'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : b.status === 'Review'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-900/90 text-slate-400 border-slate-700'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-2.5">
                    <h3 className="font-extrabold text-sm text-white group-hover:text-purple-300 transition line-clamp-2">
                      {b.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {b.excerpt || b.content.slice(0, 100)}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {b.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Metrics & Actions */}
                <div className="p-4 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>{b.views || 0}</span>
                    </span>
                    <span>•</span>
                    <span>{b.author}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewArticle(b)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                      title="Preview Article"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleOpenEditEditor(b)}
                      className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition cursor-pointer"
                      title="Full Editor"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDuplicateBlog(b)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                      title="Duplicate Article"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteBlog(b.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-slate-500 bg-[#0F172A] rounded-2xl border border-slate-800">
              <PenTool className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-300">No blog articles match your filters</p>
              <p className="text-xs text-slate-500 mt-1">
                Click "+ Write New Article" to craft your first study guide.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Article Title & Slug</th>
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
                        <p className="font-bold text-white group-hover:text-purple-300 transition truncate">
                          {b.title}
                        </p>
                        <p className="text-[10px] text-purple-400 font-mono truncate">/{b.slug}</p>
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
                        {b.publishedAt}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewArticle(b)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Preview Article"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditEditor(b)}
                            className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition cursor-pointer"
                            title="Full Editor"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlog(b.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition cursor-pointer"
                            title="Delete"
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
                      No blog articles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Educational / Design Guidance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>FULL STUDIO ACCESS</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Write rich Markdown articles with live side-by-side rendering, word counts, and GTU study templates.
          </p>
        </div>

        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-orange-400 font-bold text-xs">
            <Globe className="w-4 h-4" />
            <span>SEO & SOCIAL READY</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Simulate Google Search snippet rankings with automated meta titles, meta descriptions, and custom slugs.
          </p>
        </div>

        <div className="bg-[#0F172A] p-4.5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>DIRECT PUBLIC DELIVERY</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Published articles immediately sync with student study hubs and the public `/blogs` discovery portal.
          </p>
        </div>
      </div>

      {/* 4. Preview Drawer */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-[#0F172A] border-l border-slate-800 w-full max-w-xl h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              <div className="p-5 border-b border-slate-800 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                    {previewArticle.category} • by {previewArticle.author}
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-0.5">{previewArticle.title}</h3>
                </div>
                <button
                  onClick={() => setPreviewArticle(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto max-h-[calc(100vh-140px)] space-y-4">
                {previewArticle.thumbnail && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 h-44 bg-slate-900">
                    <img
                      src={previewArticle.thumbnail}
                      alt={previewArticle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                  {previewArticle.content}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">{previewArticle.views} Total Views</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEditEditor(previewArticle);
                    setPreviewArticle(null);
                  }}
                  className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-xs rounded-xl border border-purple-500/30 transition cursor-pointer"
                >
                  Edit in Studio
                </button>
                <button
                  onClick={() => setPreviewArticle(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminContentShell>
  );
};
