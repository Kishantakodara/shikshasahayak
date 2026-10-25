import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  FolderOpen, 
  AlertCircle,
  File,
  Film,
  Presentation,
  BookOpen,
  Loader2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { teacherClient } from '../../api/teacherClient';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function TeacherUploadMaterialPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('Power Electronics');
  const [materialType, setMaterialType] = useState('PDF');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [recentMaterials, setRecentMaterials] = useState<any[]>([]);

  useEffect(() => {
    async function initData() {
      try {
        const [clsRes, matRes] = await Promise.all([
          teacherClient.getClasses(),
          teacherClient.getMaterials(),
        ]);
        const clsList = clsRes?.classes || [];
        setClasses(clsList);
        if (clsList.length > 0) {
          setSelectedClassId(clsList[0].id);
        }
        setRecentMaterials(matRes?.materials?.slice(0, 5) || []);
      } catch {
        // ignore
      }
    }
    initData();
  }, []);

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a title for the material');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('subject', subject);
      formData.append('material_type', materialType);
      if (selectedClassId) {
        formData.append('class_id', selectedClassId);
      }

      await teacherClient.uploadMaterial(formData);

      toast.success('Study Material Published Successfully!');
      setTitle('');
      setDescription('');
      setSelectedFile(null);

      // Refresh recent uploads
      const refreshed = await teacherClient.getMaterials();
      setRecentMaterials(refreshed?.materials?.slice(0, 5) || []);

      setTimeout(() => navigate('/teacher/materials'), 800);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Header */}
      <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs">
        <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
          <Upload className="w-4 h-4" /> Content Manager
        </div>
        <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white font-display">Upload Material</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Upload lecture notes, presentation slides, reference books, videos, and question papers to your students.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Upload Form (2 Columns) */}
        <form onSubmit={handleUploadSubmit} className="lg:col-span-2 space-y-6">
          
          {/* Drag & Drop Upload Zone */}
          <div className="bg-white dark:bg-navy-900 p-8 rounded-2xl border-2 border-dashed border-gray-300 dark:border-navy-700 text-center space-y-4 hover:border-brand-orange transition-colors">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.mp4,.png,.jpg"
              onChange={handleFileDrop}
              className="hidden"
              id="material-file-input"
            />
            <label htmlFor="material-file-input" className="cursor-pointer space-y-3 block">
              <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-navy-800 text-brand-orange flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-extrabold text-navy-900 dark:text-white">
                  {selectedFile ? selectedFile.name : 'Drag & drop files here or Click to Browse'}
                </p>
                <p className="text-xs text-gray-400">
                  {selectedFile 
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload`
                    : 'Supports: PDF, PPTX, DOCX, MP4, Images (Max 200MB)'}
                </p>
              </div>
            </label>
          </div>

          {/* Form Fields */}
          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-orange" /> Material Details
            </h3>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Material Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Power Electronics - Unit 2 Lecture Notes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Subject / Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Power Electronics"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Material Type</label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
                >
                  <option value="PDF">PDF Document</option>
                  <option value="Video">Video Lecture</option>
                  <option value="Presentation">Presentation (PPT)</option>
                  <option value="Book">Reference Book</option>
                  <option value="Lab">Lab Manual</option>
                  <option value="Formula">Formula Sheet</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Target Class</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
                >
                  {classes.length > 0 ? (
                    classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.section ? `(${c.section})` : ''}
                      </option>
                    ))
                  ) : (
                    <option value="">All Enrolled Students</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 mb-1 block">Brief Description (Optional)</label>
              <textarea
                rows={2}
                placeholder="Key takeaways or instructions for students..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-navy-950 border border-gray-200 dark:border-navy-800 rounded-xl text-navy-900 dark:text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <Button
              type="submit"
              disabled={uploading}
              className="w-full py-3 bg-brand-orange hover:bg-orange-600 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading & Publishing...
                </>
              ) : (
                'Upload & Publish Material'
              )}
            </Button>
          </div>

        </form>

        {/* Sidebar: Recent Uploads History */}
        <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-gray-200/80 dark:border-navy-800 shadow-xs space-y-4 h-fit">
          <h3 className="text-sm font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-brand-orange" /> Recent Uploads
          </h3>

          <div className="space-y-3 text-xs">
            {recentMaterials.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="font-semibold text-navy-900 dark:text-white">No materials uploaded yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Your published notes and files will appear here.</p>
              </div>
            ) : (
              recentMaterials.map((item, idx) => (
                <div key={item.id || idx} className="p-3 bg-gray-50 dark:bg-navy-950 rounded-xl border border-gray-100 dark:border-navy-800 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-navy-900 dark:text-white truncate max-w-[180px]">{item.title || item.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Recently'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-brand-orange/15 text-brand-orange font-bold text-[10px] shrink-0">
                    {item.material_type || 'PDF'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
