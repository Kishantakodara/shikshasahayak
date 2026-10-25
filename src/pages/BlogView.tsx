import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Calendar, ArrowLeft, Loader2, FileText, Eye, Share2, Check, Clock, BookOpen, Bookmark } from 'lucide-react';
import { apiClient } from '../api/client';
import MDEditor from '@uiw/react-md-editor';
import { usePageMeta } from '../utils/seo';
import { useTheme } from '../context/ThemeContext';
import { PortalReturnBar } from '../components/navigation/PortalReturnBar';
import { useLearningEcosystem } from '../context/LearningEcosystemContext';

const stripHtmlCodeFence = (content: string) => {
  const trimmed = content.trim();
  const match = trimmed.match(/^(```|~~~)\s*(?:html)?\s*\r?\n([\s\S]*?)\r?\n\1\s*$/i);
  return match ? match[2].trim() : content;
};

const decodeEscapedHtml = (content: string) => {
  if (!/(&lt;|&#60;)/i.test(content)) return content;

  return content
    .replace(/&lt;|&#60;/gi, '<')
    .replace(/&gt;|&#62;/gi, '>')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;|&#38;/gi, '&');
};

const getHtmlBlogContent = (content?: string) => {
  if (!content) return '';

  const normalized = decodeEscapedHtml(stripHtmlCodeFence(content)).trim();
  const lower = normalized.toLowerCase();

  if (
    lower.startsWith('<!doctype') ||
    lower.includes('<html') ||
    lower.includes('<body') ||
    lower.includes('<head')
  ) {
    return normalized;
  }

  if (
    lower.startsWith('<') &&
    (
      lower.includes('<script') ||
      lower.includes('<style') ||
      lower.includes('</script>') ||
      lower.includes('</style>') ||
      lower.includes('</div>')
    )
  ) {
    return normalized;
  }

  return '';
};

const BlogView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();
  const { isBookmarked, addBookmark, removeBookmark } = useLearningEcosystem();
  const isBlogSaved = isBookmarked(id || '') || isBookmarked(blog?.title || '');

  const toggleBlogBookmark = () => {
    if (isBlogSaved) {
      removeBookmark(id || blog?.title);
    } else {
      addBookmark({
        targetId: id || `blog_${Date.now()}`,
        title: blog?.title || 'Article & Guide',
        url: `/blogs/${id}`,
        itemType: 'blog',
        subjectCode: blog?.category
      });
    }
  };

  usePageMeta({
    title: blog?.title ? `${blog.title} — ShikshaSahayak Blog` : 'Blog Post — ShikshaSahayak',
    description: blog?.description || (blog?.title ? `Read our engineering guide "${blog.title}" on ShikshaSahayak.` : 'Read the latest educational blogs, exam preparation guides, and academic updates on ShikshaSahayak.'),
    path: `/blogs/${id}`,
    type: 'article',
  });

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) return;
      try {
        const data = await apiClient.getBlog(id);
        setBlog(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load blog');
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  const htmlBlogContent = getHtmlBlogContent(blog?.content);
  const isHtmlBlog = Boolean(htmlBlogContent);

  useEffect(() => {
    let originalOverflow = '';
    if (isHtmlBlog) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (isHtmlBlog) {
        document.body.style.overflow = originalOverflow;
      }
    };
  }, [isHtmlBlog]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog?.title || 'ShikshaSahayak Blog',
          url: window.location.href,
        });
        return;
      } catch {}
    }

    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-navy-950">
        <Loader2 className="h-10 w-10 text-brand-orange animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Loading article...</p>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center bg-gray-50 dark:bg-navy-950">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-brand-orange flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-navy-900 dark:text-white mb-2 font-display">Article Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">{error || 'This article may have moved or is no longer available.'}</p>
        <Link
          to="/blogs"
          className="inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-hover text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-brand-orange/20"
        >
          <ArrowLeft className="h-4 w-4" /> Back to All Articles
        </Link>
      </div>
    );
  }

  if (isHtmlBlog) {
    return (
      <div className="fixed inset-0 w-screen h-screen z-[9999] overflow-hidden bg-white">
        {/* Floating Controls */}
        <div className="fixed top-4 left-4 z-[10000] flex gap-3">
          <Link
            to="/blogs"
            className="flex items-center gap-2 bg-navy-950/80 hover:bg-navy-950 text-white px-4 py-2 rounded-full font-bold shadow-lg backdrop-blur-sm border border-white/10 hover:border-brand-orange/40 transition-all duration-300 hover:scale-105 group"
          >
            <ArrowLeft className="h-4 w-4 text-brand-orange group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm">Back to Portal</span>
          </Link>

          {blog.related_document_id && (
            <Link
              to={`/materials/${blog.related_document_id}?original=true`}
              className="flex items-center gap-2 bg-brand-orange hover:bg-brand-hover text-white px-5 py-2 rounded-full font-bold shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Eye className="h-4 w-4" />
              <span className="text-sm">View Attached Material</span>
            </Link>
          )}
        </div>
        <iframe
          srcDoc={htmlBlogContent}
          className="w-full h-full border-0"
          title={blog.title}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    );
  }

  // Calculate read time
  const wordCount = (blog.content || '').split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(2, Math.ceil(wordCount / 180));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 py-10 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Navigation & Share Bar */}
        <div className="mb-6">
          <PortalReturnBar
            crumbs={[
              { label: 'Articles', path: '/blogs' },
              { label: blog.title || 'Guide' }
            ]}
            fallbackPath="/blogs"
            extraRight={
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleBlogBookmark}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                    isBlogSaved
                      ? 'bg-orange-50 dark:bg-orange-950/40 border-brand-orange text-brand-orange'
                      : 'bg-white dark:bg-navy-900 border-gray-200 dark:border-navy-800 text-gray-700 dark:text-gray-200 hover:border-brand-orange/40'
                  }`}
                  title={isBlogSaved ? "Remove from My Library" : "Save to My Library"}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBlogSaved ? 'fill-current' : 'text-brand-orange'}`} />
                  <span>{isBlogSaved ? 'Saved' : 'Save'}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-navy-900 border border-gray-200 dark:border-navy-800 text-gray-700 dark:text-gray-200 hover:border-brand-orange/40 transition-all cursor-pointer shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-brand-orange" />
                      <span>Share Guide</span>
                    </>
                  )}
                </button>
              </div>
            }
          />
        </div>

        {/* Article Container Card */}
        <article className="bg-white dark:bg-navy-900 rounded-3xl border border-gray-150 dark:border-navy-800 p-6 sm:p-10 shadow-sm overflow-hidden">
          
          {/* Category Chip & Read Time */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {blog.category && (
              <span className="text-[11px] font-extrabold uppercase tracking-wider bg-brand-orange text-white px-3 py-1 rounded-full shadow-xs">
                {blog.category}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <Clock className="w-3.5 h-3.5 text-brand-orange" />
              {readMinutes} min read
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-navy-900 dark:text-white leading-tight font-display mb-6">
            {blog.title}
          </h1>

          {/* Author & Date Metadata */}
          <div className="flex items-center gap-4 py-4 border-y border-gray-100 dark:border-navy-800 mb-8">
            <div className="w-10 h-10 rounded-full bg-brand-orange/10 text-brand-orange font-bold text-sm flex items-center justify-center shrink-0">
              {(blog.author || 'P')[0].toUpperCase()}
            </div>
            <div className="text-xs">
              <div className="font-bold text-navy-900 dark:text-white">
                {blog.author || 'ShikshaSahayak Editorial'}
              </div>
              <div className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Published on {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Cover Image */}
          {blog.thumbnail && (
            <div className="mb-8 rounded-2xl overflow-hidden border border-gray-150 dark:border-navy-800 bg-slate-100 dark:bg-navy-950 aspect-[16/9] max-h-96">
              <img
                src={blog.thumbnail}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Associated Material Banner */}
          {blog.related_document_id && (
            <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-brand-orange/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-navy-900 dark:text-white">Companion Study Resource</h4>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400">Download the verified PDF and exam notes referenced in this article.</p>
                </div>
              </div>
              <Link
                to={`/materials/${blog.related_document_id}?original=true`}
                className="shrink-0 px-4 py-2 rounded-xl bg-brand-orange hover:bg-brand-hover text-white text-xs font-bold transition-all shadow-md shadow-brand-orange/20 flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Resource</span>
              </Link>
            </div>
          )}

          {/* Markdown Content */}
          <div
            className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-navy-900 dark:prose-headings:text-white prose-a:text-brand-orange prose-a:font-semibold hover:prose-a:underline prose-img:rounded-2xl"
            data-color-mode={resolvedTheme}
          >
            <MDEditor.Markdown
              source={blog.content}
              style={{
                backgroundColor: 'transparent',
                color: 'inherit',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Article Footer & Author Tag */}
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-navy-800">
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-navy-950 border border-gray-150 dark:border-navy-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 text-brand-orange font-bold text-lg flex items-center justify-center shrink-0">
                {(blog.author || 'P')[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                  Written by {blog.author || 'ShikshaSahayak Editorial Team'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                  Published for GTU and engineering students. Prepared with verified syllabus and previous examination insights.
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogView;
