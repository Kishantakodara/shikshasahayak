import React, { useState, useEffect } from 'react';
import { PenTool, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';
import MDEditor from '@uiw/react-md-editor';

const ManageBlogs: React.FC = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchBlogs = async () => {
    setIsLoadingData(true);
    try {
      const data = await apiClient.getBlogs();
      setBlogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setErrorMsg('Title and content are required');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (editingId) {
        await apiClient.updateBlog(editingId, { title, content, author });
        setSuccessMsg('Blog updated successfully!');
      } else {
        await apiClient.createBlog({ title, content, author });
        setSuccessMsg('Blog created successfully!');
      }
      setTitle('');
      setAuthor('');
      setContent('');
      setEditingId(null);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchBlogs();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save blog');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (blog: any) => {
    setEditingId(blog.id);
    setTitle(blog.title);
    setAuthor(blog.author || '');
    setContent(blog.content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      await apiClient.deleteBlog(id);
      setSuccessMsg('Deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchBlogs();
      if (editingId === id) {
        setEditingId(null);
        setTitle('');
        setAuthor('');
        setContent('');
      }
    } catch (err: any) {
      alert(`Delete Failed: ${err.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12" data-color-mode="light">
      {/* Left Side: Editor Form */}
      <div>
        <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-6">
          {editingId ? 'Edit Blog Post' : 'Write New Blog Post'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {successMsg && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" /> {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Blog Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-50 dark:bg-navy-800 border border-gray-300 dark:border-navy-700 rounded-lg p-3 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Author (Optional)</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-gray-50 dark:bg-navy-800 border border-gray-300 dark:border-navy-700 rounded-lg p-3 text-navy-900 dark:text-white focus:ring-2 focus:ring-brand-orange outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content (Markdown)</label>
            <div className="border border-gray-300 dark:border-navy-700 rounded-lg overflow-hidden">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                height={400}
                preview="edit"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all ${isSubmitting ? 'bg-navy-700 cursor-wait' : 'bg-navy-900 dark:bg-brand-orange hover:bg-navy-800 dark:hover:bg-brand-hover'
                }`}
            >
              {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Saving...</> : (editingId ? 'Update Blog' : 'Publish Blog')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setTitle('');
                  setAuthor('');
                  setContent('');
                }}
                className="flex justify-center py-4 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 dark:border-navy-700 dark:text-gray-300 dark:hover:bg-navy-800 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right Side: List & Delete */}
      <div className="bg-gray-50 dark:bg-navy-950 p-6 rounded-2xl border border-gray-200 dark:border-navy-800 max-h-[800px] overflow-y-auto">
        <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-6 sticky top-0 bg-gray-50 dark:bg-navy-950 pb-2 z-10 flex items-center justify-between border-b dark:border-navy-800">
          <span className="flex items-center gap-2">
            <div className="w-2 h-6 bg-brand-orange rounded-full" />
            Manage Published Blogs
          </span>
          <button
            onClick={fetchBlogs}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-navy-800 rounded-full transition-colors"
            title="Refresh Data"
          >
            <Loader2 className={`h-5 w-5 text-brand-orange ${isLoadingData ? 'animate-spin' : ''}`} />
          </button>
        </h3>

        <div className="space-y-4">
          {!isLoadingData && blogs.map(item => (
            <div key={item.id} className={`bg-white dark:bg-navy-900 p-4 rounded-xl shadow-sm border ${editingId === item.id ? 'border-brand-orange' : 'border-gray-100 dark:border-navy-800'} flex flex-col gap-3 group/item hover:border-brand-orange/50 transition-colors`}>
              <div className="min-w-0">
                <h4 className="font-bold text-navy-900 dark:text-white line-clamp-1 group-hover/item:text-brand-orange transition-colors">{item.title}</h4>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">By {item.author || 'Admin'} • {new Date(item.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="px-3 py-1.5 text-xs font-medium text-navy-700 bg-navy-50 hover:bg-navy-100 dark:text-navy-300 dark:bg-navy-800 dark:hover:bg-navy-700 rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg shrink-0 transition-all"
                  title="Delete Blog"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {!isLoadingData && blogs.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm">
              No blogs found. Write one to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageBlogs;
