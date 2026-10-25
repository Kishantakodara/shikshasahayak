import React from 'react';
import {
  Shield,
  ShieldCheck,
  GraduationCap,
  Users,
  Sparkles,
  Lock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface RoleDefinition {
  role: string;
  badgeColor: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  usersCount?: number;
  permissions: {
    name: string;
    allowed: boolean;
    note?: string;
  }[];
}

const ROLES_DATA: RoleDefinition[] = [
  {
    role: 'Super Administrator',
    badgeColor: 'bg-red-500/15 text-red-400 border-red-500/30',
    description: 'Full unrestricted governance across all database tables, users, feature flags, content factory, and edge settings.',
    icon: Shield,
    permissions: [
      { name: 'Admin Control Center Access', allowed: true },
      { name: 'Feature Flag Toggles & Kill-Switches', allowed: true },
      { name: 'Teacher & Beta Whitelist Governance', allowed: true },
      { name: 'Curriculum CMS Bulk Upload & Deletion', allowed: true },
      { name: 'Content Approval & Publishing', allowed: true },
      { name: 'Raw Database Schema & Audit Inspection', allowed: true },
    ],
  },
  {
    role: 'Faculty / Verified Educator',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    description: 'Whitelisted educators managing classroom batches, assignments, student attendance, quizzes, and study material uploads.',
    icon: GraduationCap,
    permissions: [
      { name: 'Teacher Portal & LMS Dashboard', allowed: true },
      { name: 'Classroom & Batch Creation', allowed: true },
      { name: 'Assignment & Quiz Authoring', allowed: true },
      { name: 'Student Gradebook & Attendance Tracking', allowed: true },
      { name: 'Study Material Upload & Publishing', allowed: true },
      { name: 'Platform Feature Configuration', allowed: false, note: 'Admin only' },
      { name: 'Teacher Whitelist Mutation', allowed: false, note: 'Admin only' },
    ],
  },
  {
    role: '2.0 Beta Tester Student',
    badgeColor: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    description: 'Enrolled students with early access privileges to experimental AI Copilot, interactive quiz 2.0, and career mentor tools.',
    icon: Sparkles,
    permissions: [
      { name: 'Public Study Materials & PYQs Browsing', allowed: true },
      { name: 'AI Tutor & Conversational Copilot', allowed: true },
      { name: 'Interactive Practice Zone & Quizzes', allowed: true },
      { name: 'Code Playground & IDE Execution', allowed: true },
      { name: 'Resume Builder & ATS Scanner', allowed: true },
      { name: 'Faculty LMS & Grading Access', allowed: false, note: 'Teacher only' },
    ],
  },
  {
    role: 'Standard Student / Public User',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    description: 'Regular student accounts browsing GTU previous year papers, syllabus, verified notes, and academic updates.',
    icon: Users,
    permissions: [
      { name: 'Browse Academic Notes & PYQ Repository', allowed: true },
      { name: 'Download Study Materials & Syllabus', allowed: true },
      { name: 'Contribute Notes (Subject to Approval)', allowed: true },
      { name: 'Search Global University Resources', allowed: true },
      { name: '2.0 Beta Exclusive Features', allowed: false, note: 'Requires Beta Whitelist' },
      { name: 'Admin Control Center', allowed: false, note: 'Admin only' },
    ],
  },
];

export const RolesPermissionsManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" /> Role-Based Access Control (RBAC)
        </div>
        <h2 className="text-2xl font-extrabold text-white">Roles & Permissions Matrix</h2>
        <p className="text-xs text-slate-400 mt-1">
          Server-enforced access scopes across Administrator, Verified Faculty, Beta Testers, and Student user tiers.
        </p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ROLES_DATA.map((roleItem) => {
          const Icon = roleItem.icon;
          return (
            <div
              key={roleItem.role}
              className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 space-y-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white border border-slate-700 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-base">{roleItem.role}</h3>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${roleItem.badgeColor}`}
                      >
                        Active Role
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  {roleItem.description}
                </p>

                {/* Permissions List */}
                <div className="space-y-2 pt-4 border-t border-slate-800 mt-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Access Privileges</p>
                  {roleItem.permissions.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-slate-900/60 border border-slate-800/80"
                    >
                      <span className="text-slate-200 font-medium">{p.name}</span>
                      {p.allowed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Allowed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                          <XCircle className="w-3.5 h-3.5 text-slate-400" /> {p.note || 'Restricted'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Enforcement: <strong className="text-slate-200">Cloudflare Workers JWT & D1</strong></span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Secure
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
