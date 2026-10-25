import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Folder, 
  FileText, 
  Download, 
  Eye, 
  EyeOff, 
  Trash2, 
  Upload,
  BookOpen
} from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { toast } from 'sonner';

interface MaterialsPanelProps {
  classId: string;
}

export const MaterialsPanel: React.FC<MaterialsPanelProps> = ({ classId }) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  
  // Upload Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('General');
  const [customTopic, setCustomTopic] = useState('');
  const [fileUrl, setFileUrl] = useState('https://example.com/mock_file.pdf');
  const [fileName, setFileName] = useState('notes.pdf');
  const [fileType, setFileType] = useState('pdf');
  const [fileSize, setFileSize] = useState(1024 * 1024 * 2.4); // 2.4 MB

  // Fetch materials
  const { data: materialsData, isLoading } = useQuery({
    queryKey: ['materials', classId, searchQuery],
    queryFn: () => teacherClient.getMaterials({ class_id: classId, search: searchQuery || undefined }),
  });
  const materials = materialsData?.materials || [];

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (data: any) => teacherClient.uploadMaterial(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials', classId] });
      toast.success('Study material uploaded successfully!');
      setUploadModalOpen(false);
      setTitle('');
      setDescription('');
      setTopic('General');
      setCustomTopic('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to upload material');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => teacherClient.deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials', classId] });
      toast.success('Material deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete material');
    }
  });

  // Update visibility mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => teacherClient.updateMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials', classId] });
      toast.success('Material visibility updated');
    }
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    const finalTopic = topic === 'CUSTOM' ? (customTopic.trim() || 'General') : topic;

    uploadMutation.mutate({
      class_id: classId,
      title: title.trim(),
      description: description.trim() || undefined,
      file_url: fileUrl.trim(),
      file_name: fileName.trim(),
      file_type: fileType,
      file_size_bytes: fileSize,
      topic: finalTopic,
      is_visible: true
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this study material? Students will lose access.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleVisibility = (mat: any) => {
    updateMutation.mutate({
      id: mat.id,
      data: {
        is_visible: !mat.is_visible
      }
    });
  };

  // Group materials by folder/topic
  const topicsMap = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    materials.forEach(mat => {
      const folder = mat.topic || 'General';
      if (!map[folder]) map[folder] = [];
      map[folder].push(mat);
    });
    return map;
  }, [materials]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Class Materials</h2>
          <p className="text-sm text-gray-500 mt-0.5">Upload and organize lecture notes, templates, and syllabus files</p>
        </div>
        
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-orange hover:bg-brand-orange/90 text-white gap-2">
              <Upload className="w-4 h-4" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Study Material</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUploadSubmit} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Material Title</label>
                <Input 
                  placeholder="e.g. DBMS Normalization Slides"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Description</label>
                <Textarea 
                  placeholder="Provide details about what this file covers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Topic/Folder</label>
                  <Select value={topic} onValueChange={setTopic}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Lecture Notes">Lecture Notes</SelectItem>
                      <SelectItem value="Lab Material">Lab Material</SelectItem>
                      <SelectItem value="Syllabus">Syllabus</SelectItem>
                      <SelectItem value="CUSTOM">+ Create Custom Topic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">File Type</label>
                  <Select value={fileType} onValueChange={setFileType}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="zip">ZIP Archive</SelectItem>
                      <SelectItem value="docx">Word Document</SelectItem>
                      <SelectItem value="pptx">Powerpoint Slides</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {topic === 'CUSTOM' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Custom Topic Name</label>
                  <Input 
                    placeholder="e.g. Unit 3: Relational Calculus"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                  />
                </div>
              )}

              {/* Simulation Helper Inputs */}
              <div className="p-3 bg-gray-50 dark:bg-navy-950/30 rounded-xl space-y-2 border border-gray-150 dark:border-navy-800">
                <p className="text-[10px] text-gray-400 font-mono">// Mock Upload Properties</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500">File Name</span>
                    <Input 
                      value={fileName} 
                      onChange={(e) => setFileName(e.target.value)} 
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500">Mock File URL</span>
                    <Input 
                      value={fileUrl} 
                      onChange={(e) => setFileUrl(e.target.value)} 
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={uploadMutation.isPending}
                className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Confirm Upload'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter and Folders */}
      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-navy-900"
          />
        </div>

        {/* Folders list */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading materials list...</p>
          </div>
        ) : Object.keys(topicsMap).length === 0 ? (
          <Card className="border border-dashed border-gray-200 dark:border-navy-800 bg-transparent">
            <CardContent className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-60" />
              <h3 className="font-bold text-gray-700 dark:text-gray-300">No Study Materials</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                Upload syllabus plans, textbooks, or presentation slides using the button above.
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.keys(topicsMap).map(folder => (
            <div key={folder} className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 px-1">
                <Folder className="w-4 h-4 text-orange-500" />
                <span>{folder}</span>
                <span className="text-xs font-normal text-gray-400 font-mono">({topicsMap[folder].length} files)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topicsMap[folder].map((mat: any) => (
                  <Card key={mat.id} className="border border-gray-100 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-navy-950/40 flex items-center justify-center text-blue-500 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate" title={mat.title}>
                            {mat.title}
                          </h4>
                          <p className="text-[10px] text-gray-400 truncate max-w-xs">
                            {mat.file_name} • {mat.file_size_bytes ? formatBytes(mat.file_size_bytes) : 'Unknown size'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleToggleVisibility(mat)}
                          className={`h-7 w-7 p-0 ${mat.is_visible ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-650'}`}
                          title={mat.is_visible ? 'Visible to Students' : 'Hidden from Students'}
                        >
                          {mat.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          asChild
                          className="h-7 w-7 p-0 text-gray-400 hover:text-blue-500"
                        >
                          <a href={mat.file_url} target="_blank" rel="noreferrer" title="Download File">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(mat.id)}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                          title="Delete Material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
