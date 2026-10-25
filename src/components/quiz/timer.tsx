'use client';

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerProps {
  durationMinutes: number;
  onTimeExpired: () => void;
  onTimeWarning?: (minutesLeft: number) => void;
}

export function Timer({
  durationMinutes,
  onTimeExpired,
  onTimeWarning,
}: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeExpired();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const nextSecs = prev - 1;
        
        // Warnings
        if (nextSecs === 300) { // 5 minutes
          onTimeWarning?.(5);
        } else if (nextSecs === 60) { // 1 minute
          onTimeWarning?.(1);
        }

        return nextSecs;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft, onTimeExpired, onTimeWarning]);

  const formatTime = () => {
    const hrs = Math.floor(secondsLeft / 3600);
    const mins = Math.floor((secondsLeft % 3600) / 60);
    const secs = secondsLeft % 60;

    const pad = (num: number) => String(num).padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const getTimerStyles = () => {
    if (secondsLeft < 60) { // Under 1 minute
      return 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse';
    }
    if (secondsLeft < 300) { // Under 5 minutes
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  };

  return (
    <div className={cn(
      'flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm font-bold font-mono tracking-wider shrink-0 transition-colors duration-300',
      getTimerStyles()
    )}>
      <Clock className="h-4 w-4" />
      <span>{formatTime()}</span>
    </div>
  );
}
