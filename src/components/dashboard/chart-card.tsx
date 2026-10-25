'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ChartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  children: React.ReactNode;
  selector?: {
    value: string;
    onValueChange: (value: string) => void;
    options: { label: string; value: string }[];
  };
}

export function ChartCard({
  title,
  description,
  children,
  selector,
  className,
  ...props
}: ChartCardProps) {
  return (
    <Card className={cn('col-span-1 md:col-span-2', className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {selector && (
          <Select value={selector.value} onValueChange={selector.onValueChange}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {selector.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
