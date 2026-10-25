import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Send } from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';

interface CreateAnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  teacherClasses: Array<{ id: string; name: string; section?: string | null }>;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  open,
  onClose,
  teacherClasses,
}) => {
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState<string>(teacherClasses[0]?.id || 'all');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [pinToTop, setPinToTop] = useState(false);

  const postMutation = useMutation({
    mutationFn: teacherClient.createAnnouncement,
    onSuccess: (res) => {
      toast.success(res.message || 'Announcement posted successfully!');
      queryClient.invalidateQueries({ queryKey: ['teacher'] });
      
      try {
        const event = new CustomEvent('padhaku_announcement_create', { detail: { title, content, priority } });
        window.dispatchEvent(event);
        localStorage.setItem(`padhaku_sync_announcement_${Date.now()}`, JSON.stringify({ title, content, priority }));
      } catch (e) {
        console.warn('Announcement sync dispatch skipped:', e);
      }

      setTitle('');
      setContent('');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to post announcement');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter an announcement title');
      return;
    }
    if (!content.trim()) {
      toast.error('Please enter announcement content');
      return;
    }

    postMutation.mutate({
      class_id: classId === 'all' ? undefined : classId,
      title: title.trim(),
      content: content.trim(),
      priority,
      pin_to_top: pinToTop,
      publish_immediately: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-gray-100 dark:border-navy-800">
          <DialogTitle className="text-xl font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-orange" />
            Post New Announcement
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Select Target Class
            </Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="bg-gray-50 dark:bg-navy-950 border-gray-200 dark:border-navy-800">
                <SelectValue placeholder="Choose Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Enrolled Classes</SelectItem>
                {teacherClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} {cls.section ? `(${cls.section})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Announcement Title *
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Midterm Exam Schedule & Syllabus Details"
              className="bg-gray-50 dark:bg-navy-950 border-gray-200 dark:border-navy-800"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Message Content *
            </Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write notice details for students..."
              rows={5}
              className="bg-gray-50 dark:bg-navy-950 border-gray-200 dark:border-navy-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Priority Level
              </Label>
              <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                <SelectTrigger className="bg-gray-50 dark:bg-navy-950 border-gray-200 dark:border-navy-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low (Normal Update)</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High Priority</SelectItem>
                  <SelectItem value="URGENT">Urgent Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-navy-950 rounded-xl border border-gray-200 dark:border-navy-800">
              <div>
                <Label className="text-xs font-semibold text-gray-900 dark:text-white">Pin to Top</Label>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Keep visible at top of stream</p>
              </div>
              <Switch checked={pinToTop} onCheckedChange={setPinToTop} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-navy-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-200 dark:border-navy-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={postMutation.isPending}
              className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold gap-2 shadow-md shadow-orange-500/10"
            >
              {postMutation.isPending ? 'Posting...' : 'Post Notice'}
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
