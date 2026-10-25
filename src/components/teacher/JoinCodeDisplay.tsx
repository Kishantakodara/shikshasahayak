import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, RefreshCw, Check } from 'lucide-react';
import { teacherClient } from '../../api/teacherClient';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface JoinCodeDisplayProps {
  joinCode: string;
  classId: string;
}

/**
 * JoinCodeDisplay Component
 * 
 * Displays the class join code with copy and regenerate actions
 * Requirements: 2.4, 2.5
 */
export const JoinCodeDisplay: React.FC<JoinCodeDisplayProps> = ({ joinCode, classId }) => {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // Regenerate join code mutation
  const regenerateMutation = useMutation({
    mutationFn: () => teacherClient.regenerateJoinCode(classId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'classes'] });
      toast.success(`Join code regenerated successfully!`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to regenerate join code: ${error.message}`);
    },
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      toast.success('Join code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy join code');
    }
  };

  const handleCopyLink = async () => {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://beta.shikshasahayak.org';
      const inviteLink = `${baseUrl}/login?joinCode=${encodeURIComponent(joinCode)}`;
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Student Invite Link copied! Share on WhatsApp or Class Email.');
    } catch (err) {
      toast.error('Failed to copy invite link');
    }
  };

  const handleRegenerate = () => {
    if (window.confirm(
      'Are you sure you want to regenerate the join code? The old code will become invalid and students will need the new code to join.'
    )) {
      regenerateMutation.mutate();
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">Student Join Code & Invite Link</p>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Join Code Display */}
          <div className="flex items-center gap-2 bg-brand-orange/20 backdrop-blur-sm border border-brand-orange/30 px-4 py-3 rounded-lg min-w-[180px]">
            <span className="text-2xl font-bold font-mono tracking-wider text-brand-orange">
              {joinCode}
            </span>
          </div>

          {/* Copy Code Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
            disabled={copied}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Code
              </>
            )}
          </Button>

          {/* Copy Link Button */}
          <Button
            size="sm"
            onClick={handleCopyLink}
            className="gap-2 bg-brand-orange hover:bg-orange-600 text-white font-bold"
          >
            <Copy className="h-4 w-4" />
            Copy Student Invite Link
          </Button>

          {/* Regenerate Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={regenerateMutation.isPending}
            className="gap-2"
          >
            {regenerateMutation.isPending ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Students can use this code to join your class. Keep it secure and share only with enrolled students.
        </p>
      </div>
    </div>
  );
};
