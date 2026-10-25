import React from 'react';
import { UserRole } from '@/types';
import { TeacherLayout } from './TeacherLayout';
import { ShikshaSahayakShell } from './ShikshaSahayakShell';

export function DashboardShell({
  children,
  role,
  fluid = false,
}: {
  children: React.ReactNode;
  role: UserRole;
  fluid?: boolean;
}) {
  if (role === UserRole.TEACHER) {
    return <TeacherLayout>{children}</TeacherLayout>;
  }

  if (role === UserRole.STUDENT) {
    if (fluid) {
      return (
        <div className="min-h-screen bg-background w-full">
          {children}
        </div>
      );
    }
    return <ShikshaSahayakShell>{children}</ShikshaSahayakShell>;
  }

  if (fluid) {
    return (
      <div className="min-h-screen bg-background w-full">
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background w-full">
      <main className="flex-1 flex flex-col w-full min-w-0">
        {children}
      </main>
    </div>
  );
}

export default DashboardShell;
