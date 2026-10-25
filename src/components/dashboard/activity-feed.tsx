import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FileText, Play, CheckCircle2, Megaphone, Trophy, User } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'quiz_submitted' | 'assignment_submitted' | 'assignment_graded' | 'announcement' | 'achievement' | 'user_joined';
  title: string;
  description: string;
  time: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface ActivityFeedProps extends React.HTMLAttributes<HTMLDivElement> {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities, className, ...props }: ActivityFeedProps) {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'quiz_submitted':
        return <Play className="h-4 w-4 text-primary" />;
      case 'assignment_submitted':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'assignment_graded':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'announcement':
        return <Megaphone className="h-4 w-4 text-amber-500" />;
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'user_joined':
        return <User className="h-4 w-4 text-pink-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getBgColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'quiz_submitted':
        return 'bg-primary/10';
      case 'assignment_submitted':
        return 'bg-blue-500/10';
      case 'assignment_graded':
        return 'bg-emerald-500/10';
      case 'announcement':
        return 'bg-amber-500/10';
      case 'achievement':
        return 'bg-yellow-500/10';
      case 'user_joined':
        return 'bg-pink-500/10';
      default:
        return 'bg-muted';
    }
  };

  return (
    <Card className={cn('col-span-1 md:col-span-2', className)} {...props}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Real-time log of events platform-wide</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No recent activity
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 after:absolute after:inset-y-2 after:left-2.5 after:w-0.5 after:bg-muted">
            {activities.map((item) => (
              <div key={item.id} className="relative flex gap-4 items-start">
                {/* Bullet circle with icon */}
                <div className={cn(
                  'absolute -left-6 z-10 p-1 rounded-full border bg-card flex items-center justify-center',
                  getBgColor(item.type)
                )}>
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex justify-between items-center w-full">
                    <h4 className="text-sm font-semibold text-foreground truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                  
                  {item.user && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                        {item.user.avatar ? (
                          <img src={item.user.avatar} alt="avatar" className="h-full w-full object-cover rounded-full" />
                        ) : (
                          item.user.name[0]
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">{item.user.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
