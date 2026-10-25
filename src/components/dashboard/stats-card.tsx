import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  description?: string;
  change?: number; // percentage
  trend?: 'up' | 'down';
  variant?: 'default' | 'primary' | 'secondary';
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  change,
  trend = 'up',
  variant = 'default',
  className,
  ...props
}: StatsCardProps) {
  return (
    <Card 
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
        variant === 'primary' && 'bg-primary text-primary-foreground shadow-lg shadow-primary/20',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20',
        className
      )}
      {...props}
    >
      {/* Background shape */}
      <div 
        className={cn(
          'absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 blur-sm pointer-events-none',
          variant === 'default' ? 'bg-primary' : 'bg-white'
        )} 
      />

      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className={cn('text-xs font-semibold uppercase tracking-wider', variant === 'default' ? 'text-muted-foreground' : 'opacity-80')}>
            {title}
          </span>
          <div className={cn(
            'p-2.5 rounded-lg shrink-0',
            variant === 'default' ? 'bg-primary/10 text-primary' : 'bg-white/10 text-white'
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <h3 className="text-3xl font-extrabold tracking-tight font-display">
            {value}
          </h3>
          
          {(change !== undefined || description) && (
            <div className="flex items-center gap-1.5 text-xs">
              {change !== undefined && (
                <span className={cn(
                  'flex items-center font-semibold gap-0.5',
                  trend === 'up' ? 'text-emerald-500' : 'text-red-500',
                  variant !== 'default' && 'text-white font-bold'
                )}>
                  {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {trend === 'up' ? '+' : ''}{change}%
                </span>
              )}
              {description && (
                <span className={variant === 'default' ? 'text-muted-foreground' : 'opacity-85'}>
                  {description}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
