import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Pin, 
  MessageSquare, 
  Trash2, 
  Send, 
  AlertCircle, 
  Plus, 
  User, 
  CornerDownRight,
  MoreVertical
} from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';

interface ClassStreamProps {
  classId: string;
}

export const ClassStream: React.FC<ClassStreamProps> = ({ classId }) => {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [pinToTop, setPinToTop] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);

  // Fetch announcements
  const { data: announcementsData, isLoading, refetch } = useQuery({
    queryKey: ['announcements', classId],
    queryFn: () => teacherClient.getAnnouncements({ class_id: classId, limit: 50 }),
  });
  const announcements = announcementsData?.announcements || [];

  // Create announcement mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => teacherClient.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', classId] });
      toast.success('Announcement posted to class stream!');
      setNewTitle('');
      setNewContent('');
      setPriority('NORMAL');
      setPinToTop(false);
      setShowForm(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to post announcement');
    }
  });

  // Delete announcement mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => teacherClient.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', classId] });
      toast.success('Announcement removed');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete announcement');
    }
  });

  // Toggle pin mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => teacherClient.updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', classId] });
      toast.success('Announcement updated');
    }
  });

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Please fill in both title and message');
      return;
    }
    createMutation.mutate({
      class_id: classId,
      title: newTitle.trim(),
      content: newContent.trim(),
      priority,
      pin_to_top: pinToTop,
      publish_immediately: true,
      allow_comments: true
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleTogglePin = (ann: any) => {
    updateMutation.mutate({
      id: ann.id,
      data: {
        pin_to_top: !ann.pin_to_top
      }
    });
  };

  const handleCommentSubmit = (annId: string) => {
    const text = commentInputs[annId]?.trim();
    if (!text) return;

    // Simulate sending comment by updating announcement in storage (mock mode)
    const stored = localStorage.getItem('mock_announcements');
    if (stored) {
      try {
        const anns = JSON.parse(stored);
        const idx = anns.findIndex((a: any) => a.id === annId);
        if (idx !== -1) {
          if (!anns[idx].comments) anns[idx].comments = [];
          anns[idx].comments.push({
            id: `c-${Date.now()}`,
            author_name: "Prof. Anand",
            content: text,
            created_at: new Date().toISOString()
          });
          localStorage.setItem('mock_announcements', JSON.stringify(anns));
          toast.success('Comment added');
          setCommentInputs(prev => ({ ...prev, [annId]: '' }));
          refetch();
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    toast.error('Comments are fully supported in mock mode.');
  };

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'URGENT': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800/30';
      case 'HIGH': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-850/30';
      case 'LOW': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-navy-950/40 dark:text-gray-400 dark:border-navy-800/30';
    }
  };

  // Sort announcements: pinned first, then by date descending
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.pin_to_top && !b.pin_to_top) return -1;
    if (!a.pin_to_top && b.pin_to_top) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      
      {/* Stream Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Class Stream</h2>
          <p className="text-sm text-gray-500 dark:text-gray-450 mt-0.5">Announcements, resources, and comments</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)} 
          className="bg-brand-orange hover:bg-brand-orange/90 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel Post' : 'New Announcement'}
        </Button>
      </div>

      {/* Posting Form */}
      {showForm && (
        <Card className="border border-gray-100 dark:border-navy-800 bg-white dark:bg-navy-900 shadow-md">
          <CardContent className="pt-6">
            <form onSubmit={handlePost} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Announcement Title</label>
                <Input 
                  placeholder="e.g. DBMS Mini Project Submission Guidelines"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-gray-50 dark:bg-navy-950/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Message Content</label>
                <Textarea 
                  placeholder="Share details or updates with your students..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  className="bg-gray-50 dark:bg-navy-950/30 resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-500">Priority:</span>
                    <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-medium text-gray-500 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={pinToTop}
                      onChange={(e) => setPinToTop(e.target.checked)}
                      className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange" 
                    />
                    Pin announcement to top
                  </label>
                </div>

                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="bg-navy-900 dark:bg-brand-orange hover:opacity-90 text-white w-full sm:w-auto px-6 h-9"
                >
                  Post Announcement
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stream Announcements Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading classroom feed...</p>
          </div>
        ) : sortedAnnouncements.length === 0 ? (
          <Card className="border border-dashed border-gray-200 dark:border-navy-800 bg-transparent">
            <CardContent className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-60" />
              <h3 className="font-bold text-gray-700 dark:text-gray-300">Class Stream is Empty</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                Post an announcement or material update above to share with your students.
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedAnnouncements.map((ann) => (
            <Card key={ann.id} className={`border transition-all ${ann.pin_to_top ? 'border-brand-orange/30 bg-orange-50/5 dark:bg-navy-900/20' : 'border-gray-100 dark:border-navy-800'}`}>
              <CardContent className="p-6">
                
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0 mt-0.5 font-bold text-sm">
                      {ann.author_name ? ann.author_name[0] : 'P'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{ann.title}</h4>
                        {ann.pin_to_top && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-brand-orange text-brand-orange font-semibold flex items-center gap-1">
                            <Pin className="w-2.5 h-2.5" /> Pinned
                          </Badge>
                        )}
                        <Badge variant="outline" className={`text-[10px] py-0 px-1.5 font-semibold ${getPriorityColor(ann.priority)}`}>
                          {ann.priority}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Posted by {ann.author_name || 'Prof. Anand'} • {new Date(ann.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleTogglePin(ann)}
                      className={`h-7 w-7 p-0 ${ann.pin_to_top ? 'text-brand-orange' : 'text-gray-400 hover:text-gray-650'}`}
                      title={ann.pin_to_top ? 'Unpin from Top' : 'Pin to Top'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(ann.id)}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Body Content */}
                <div className="mt-4 pl-12 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {ann.content}
                </div>

                {/* Comments Thread Section */}
                <div className="mt-6 pt-4 border-t border-gray-150 dark:border-navy-800/80">
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" />
                    Comments ({ann.comments?.length || 0})
                  </h5>

                  {/* Comment List */}
                  {ann.comments && ann.comments.length > 0 && (
                    <div className="space-y-3 mb-4 pl-4 border-l-2 border-gray-100 dark:border-navy-800">
                      {ann.comments.map((comment: any) => (
                        <div key={comment.id} className="flex items-start gap-2.5 text-xs">
                          <CornerDownRight className="w-3.5 h-3.5 text-gray-300 mt-1 shrink-0" />
                          <div className="bg-gray-50 dark:bg-navy-950/40 p-2.5 rounded-xl flex-1">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-bold text-gray-900 dark:text-white">{comment.author_name}</span>
                              <span className="text-[9px] text-gray-400">
                                {new Date(comment.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                              </span>
                            </div>
                            <p className="text-gray-750 dark:text-gray-350">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Input */}
                  <div className="flex items-center gap-2 pl-4">
                    <Input 
                      placeholder="Write a reply or comment..."
                      value={commentInputs[ann.id] || ''}
                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [ann.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommentSubmit(ann.id);
                      }}
                      className="bg-gray-50/50 dark:bg-navy-950/20 text-xs h-8 rounded-lg"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => handleCommentSubmit(ann.id)}
                      className="h-8 bg-brand-orange hover:bg-brand-orange/90 text-white"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

              </CardContent>
            </Card>
          ))
        )}
      </div>

    </div>
  );
};
