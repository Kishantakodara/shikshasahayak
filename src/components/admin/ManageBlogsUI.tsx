import React, { useState, useEffect, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { 
  Image as ImageIcon, 
  Save, 
  Send, 
  Eye, 
  Trash2, 
  Edit3, 
  MoreVertical,
  PlusCircle,
  Tag,
  FolderOpen,
  PenTool,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  FileText,
  UploadCloud,
  UserCircle
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { usePreventTabClose } from '../../hooks/usePreventTabClose';

interface ManageBlogsUIProps {
  initialCreating?: boolean;
}

const ManageBlogsUI: React.FC<ManageBlogsUIProps> = ({ initialCreating = false }) => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(initialCreating);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('Admin User');
  const [category, setCategory] = useState('Study Guides');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [relatedDocumentId, setRelatedDocumentId] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  usePreventTabClose(isSaving || isUploading);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getBlogs(true); // Fetch all (including drafts)
      setBlogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const data = await apiClient.getAdminMaterials();
      setDocuments(data || []);
    } catch (err) {
      console.error('Failed to load documents for blog linking:', err);
    }
  };

  useEffect(() => {
    fetchBlogs();
    fetchDocuments();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      const res = await apiClient.uploadBlogThumbnail(file);
      setThumbnail(res.url);
      setSuccessMessage('Cover image uploaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload cover image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (publishStatus: 'draft' | 'published') => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      const payload = {
        title,
        content,
        author: author || 'Admin User',
        category,
        tags: tags || '',
        thumbnail: thumbnail || '',
        status: publishStatus,
        related_document_id: relatedDocumentId || undefined
      };

      if (editingId) {
        await apiClient.updateBlog(editingId, payload);
        setSuccessMessage(`Blog post updated successfully as ${publishStatus}!`);
      } else {
        await apiClient.createBlog(payload);
        setSuccessMessage(`Blog post created successfully as ${publishStatus}!`);
      }

      resetForm();
      fetchBlogs();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save blog post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (blog: any) => {
    setEditingId(blog.id);
    setTitle(blog.title);
    setAuthor(blog.author || 'Admin User');
    setCategory(blog.category || 'Study Guides');
    setTags(blog.tags || '');
    setContent(blog.content);
    setThumbnail(blog.thumbnail || '');
    setRelatedDocumentId(blog.related_document_id || '');
    setIsCreating(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this blog post?')) return;

    try {
      setError(null);
      await apiClient.deleteBlog(id);
      setSuccessMessage('Blog post deleted successfully.');
      fetchBlogs();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete blog post');
    }
  };

  const resetForm = () => {
    setTitle('');
    setAuthor('Admin User');
    setCategory('Study Guides');
    setTags('');
    setContent('');
    setThumbnail('');
    setRelatedDocumentId('');
    setEditingId(null);
    setIsCreating(false);
  };

  if (loading && blogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-10 w-10 text-[#F97316] animate-spin" />
        <p className="text-slate-400">Loading blog posts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Blog Management</h2>
          <p className="text-sm text-slate-400 mt-1">Write, edit, and publish posts to your platform.</p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-[#F97316] hover:bg-[#ea580c] text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-[#F97316]/20 transition-colors flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            New Post
          </button>
        )}
      </div>

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {isCreating ? (
        <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/30">
            <h3 className="text-lg font-bold text-white">{editingId ? 'Edit Post' : 'Create New Post'}</h3>
            <button 
              onClick={resetForm}
              className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <input
                type="text"
                placeholder="Post Title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-3xl sm:text-4xl font-bold text-white placeholder-slate-600 focus:ring-0 px-0"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Linked Upload (Optional)
                </label>
                <select
                  value={relatedDocumentId}
                  onChange={(e) => setRelatedDocumentId(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] outline-none transition-all text-sm"
                >
                  <option value="">Standalone blog post</option>
                  {documents.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title} - {doc.material_type?.replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <UserCircle className="h-4 w-4" /> Author
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] outline-none transition-all text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" /> Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] outline-none transition-all text-sm appearance-none"
                >
                  <option>Study Guides</option>
                  <option>Study Material</option>
                  <option>PYQ</option>
                  <option>Announcements</option>
                  <option>Exam Tips</option>
                  <option>Engineering</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Tags
                </label>
                <input
                  type="text"
                  placeholder="e.g. math, exam, prep"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/50">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                <ImageIcon className="h-4 w-4" /> Cover Image
              </label>
              
              <div 
                className="border-2 border-dashed border-slate-700 rounded-xl bg-[#0F172A]/50 p-6 flex flex-col items-center justify-center text-center hover:bg-[#0F172A] transition-colors cursor-pointer group min-h-[160px]"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <Loader2 className="h-8 w-8 text-[#F97316] animate-spin mb-2" />
                    <p className="text-sm font-medium text-slate-300">Uploading cover image...</p>
                  </div>
                ) : thumbnail ? (
                  <div className="relative max-w-md w-full h-40 rounded-lg overflow-hidden group/image">
                    <img src={thumbnail} alt="Cover Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity gap-2">
                      <span className="text-xs font-bold text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">Change Image</span>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setThumbnail('');
                        }} 
                        className="text-xs font-bold text-red-400 hover:text-red-300"
                      >
                        Remove Cover
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <UploadCloud className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">Click to upload cover image</p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP, or GIF (max. 5MB)</p>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/50" data-color-mode="dark">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Edit3 className="h-4 w-4" /> Content
                </label>
                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-2">
                  <UploadCloud className="h-3 w-3" /> Upload HTML
                  <input type="file" accept=".html,.txt,.md" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => setContent(event.target?.result as string);
                    reader.readAsText(file);
                  }} />
                </label>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-700">
                <MDEditor
                  value={content}
                  onChange={(val) => setContent(val || '')}
                  height={500}
                  className="bg-[#0F172A] border-none"
                  previewOptions={{
                    style: { backgroundColor: '#0F172A' }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-800/30 border-t border-slate-700/50 flex items-center justify-between sticky bottom-0 z-10 backdrop-blur-xl">
            <button 
              type="button"
              onClick={() => {
                if (!title || !content) {
                  alert("Add title and content first to preview.");
                  return;
                }
                const previewWindow = window.open('', '_blank');
                if (previewWindow) {
                  previewWindow.document.write(`
                    <html>
                      <head>
                        <title>Preview: ${title}</title>
                        <style>
                          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; background: #0F172A; color: #E2E8F0; }
                          h1 { border-bottom: 1px solid #334155; padding-bottom: 20px; color: #FFF; }
                          .meta { color: #94A3B8; font-size: 0.9rem; margin-bottom: 40px; }
                          .cover { width: 100%; max-height: 400px; object-cover: fit; border-radius: 12px; margin-bottom: 40px; }
                          pre { background: #1E293B; padding: 16px; border-radius: 8px; overflow-x: auto; }
                          code { font-family: monospace; }
                        </style>
                      </head>
                      <body>
                        ${thumbnail ? `<img class="cover" src="${thumbnail}" />` : ''}
                        <h1>${title}</h1>
                        <div class="meta">By ${author} • Category: ${category} • Status: Preview</div>
                        <div>${content.replace(/\n/g, '<br />')}</div>
                      </body>
                    </html>
                  `);
                  previewWindow.document.close();
                }
              }}
              className="text-slate-400 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Preview
            </button>
            <div className="flex gap-3">
              <button 
                onClick={() => handleSave('draft')}
                disabled={isSaving}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Draft
              </button>
              <button 
                onClick={() => handleSave('published')}
                disabled={isSaving}
                className="bg-gradient-to-r from-[#F97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-[#F97316]/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publish Post
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {blogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-48 h-48 mb-8 relative">
                <div className="absolute inset-0 bg-[#F97316]/20 rounded-full blur-3xl" />
                <img src="https://illustrations.popsy.co/amber/freelancer.svg" alt="Empty" className="w-full h-full relative z-10 drop-shadow-2xl opacity-80" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">No blogs yet</h3>
              <p className="text-slate-400 mb-8 max-w-md">Share your knowledge with the community. Create study guides, exam tips, and announcements.</p>
              <button 
                onClick={() => setIsCreating(true)}
                className="bg-gradient-to-r from-[#F97316] to-[#ea580c] text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-[#F97316]/20 hover:shadow-[#F97316]/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <PlusCircle className="h-5 w-5" />
                Create First Blog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {blogs.map((blog, i) => (
                <div 
                  key={blog.id} 
                  className="group bg-[#1E293B] border border-slate-700/50 rounded-2xl overflow-hidden hover:shadow-xl hover:border-slate-600 transition-all duration-300 hover:-translate-y-1 flex flex-col"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="h-40 bg-slate-800 relative overflow-hidden">
                    {blog.thumbnail ? (
                      <img src={blog.thumbnail} alt={blog.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                        <PenTool className="h-10 w-10 text-slate-600" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full backdrop-blur-md ${
                        blog.status === 'published' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20' 
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/20'
                      }`}>
                        {blog.status}
                      </span>
                      {blog.category && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-slate-900/60 text-slate-300 border border-slate-700/40 backdrop-blur-md">
                          {blog.category}
                        </span>
                      )}
                      {blog.related_document_id && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20 backdrop-blur-md">
                          Linked file
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg text-white mb-3 line-clamp-2 leading-tight group-hover:text-[#F97316] transition-colors">{blog.title}</h3>
                    
                    <div className="mt-auto flex items-center justify-between text-sm text-slate-400">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5" title="Views">
                          <Eye className="h-4 w-4" /> {blog.views.toLocaleString()}
                        </span>
                        <span className="text-xs">{new Date(blog.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">By {blog.author || 'Admin'}</span>
                    </div>
                  </div>
                  
                  <div className="px-5 py-3 border-t border-slate-700/50 bg-slate-800/30 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(blog)}
                      className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-medium transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                    <div className="flex items-center gap-2">
                      <a 
                        href={`/blogs/${blog.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-slate-400 hover:text-[#F97316] p-1.5 rounded-lg transition-colors"
                        title="View Live Page"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <button 
                        onClick={() => handleDelete(blog.id)}
                        className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg transition-colors"
                        title="Delete Post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Helper icons
const UserCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
);
const UploadCloudIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
);

export default ManageBlogsUI;
