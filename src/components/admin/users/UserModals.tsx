// ============================================================
// SHIKSHA SAHAYAK OS: USER MANAGEMENT MODALS & DETAIL DRAWER
// Modals for User Creation, Editing, and Comprehensive Profile Inspection
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Shield,
  GraduationCap,
  Sparkles,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Key,
  BookOpen,
  Activity,
  Layers,
  Award,
} from 'lucide-react';
import { AdminUserItem, UserRole, UserStatus } from '../../../types/user-management';

// ─── 1. USER CREATION / INVITE MODAL ─────────────────────────
interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: Partial<AdminUserItem>) => Promise<void>;
  isLoading?: boolean;
}

export const UserCreateModal: React.FC<UserCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<AdminUserItem>>({
    email: '',
    displayName: '',
    role: 'student',
    status: 'active',
    isBetaTester: false,
    universityId: 'gtu',
    branchId: '',
    semester: '1',
    enrollmentNo: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#0F172A] border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold border border-orange-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Create & Provision User</h3>
              <p className="text-[11px] text-slate-400">Add a student, faculty member, or portal administrator.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Display Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Assigned Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
              >
                <option value="student">Student (Standard)</option>
                <option value="teacher">Faculty / Verified Teacher</option>
                <option value="moderator">Content Moderator</option>
                <option value="admin">Platform Administrator</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Account Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
              >
                <option value="active">Active</option>
                <option value="pending">Pending Verification</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Academic Info */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Academic Affiliation (Optional)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">University</label>
                <input
                  type="text"
                  placeholder="GTU"
                  value={formData.universityId}
                  onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Branch Code / Name</label>
                <input
                  type="text"
                  placeholder="07 (Computer)"
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Enrollment No.</label>
                <input
                  type="text"
                  placeholder="210280107001"
                  value={formData.enrollmentNo}
                  onChange={(e) => setFormData({ ...formData, enrollmentNo: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Beta Access Checkbox */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between p-3 rounded-xl bg-orange-500/5 border border-orange-500/15">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
              <div>
                <p className="font-bold text-white text-xs">2.0 Early Access Program</p>
                <p className="text-[10px] text-slate-400">Grant instant access to AI Copilot, Practice Zone 2.0, & Career Tools.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.isBetaTester}
              onChange={(e) => setFormData({ ...formData, isBetaTester: e.target.checked })}
              className="w-4 h-4 rounded text-orange-500 focus:ring-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-orange-500/20"
            >
              {isLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── 2. USER EDIT MODAL ──────────────────────────────────────
interface UserEditModalProps {
  user: AdminUserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Partial<AdminUserItem>) => Promise<void>;
  isLoading?: boolean;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<AdminUserItem>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
        isBetaTester: user.isBetaTester,
        universityId: user.universityId || user.university || 'gtu',
        branchId: user.branchId || user.branch || '',
        semester: user.semester || '',
        enrollmentNo: user.enrollmentNo || '',
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#0F172A] border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold border border-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Edit User Profile & Role</h3>
              <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Display Name</label>
              <input
                type="text"
                value={formData.displayName || ''}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Assigned Role</label>
              <select
                value={formData.role || 'student'}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              >
                <option value="student">Student</option>
                <option value="teacher">Faculty / Verified Teacher</option>
                <option value="moderator">Content Moderator</option>
                <option value="admin">Platform Administrator</option>
                <option value="super_admin">Super Administrator</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Account Status</label>
              <select
                value={formData.status || 'active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Enrollment Number</label>
              <input
                type="text"
                placeholder="e.g. 210280107001"
                value={formData.enrollmentNo || ''}
                onChange={(e) => setFormData({ ...formData, enrollmentNo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between p-3 rounded-xl bg-orange-500/5 border border-orange-500/15">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
              <div>
                <p className="font-bold text-white text-xs">2.0 Beta Early Access</p>
                <p className="text-[10px] text-slate-400">Enable AI copilot and beta experimental routes for this user.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(formData.isBetaTester)}
              onChange={(e) => setFormData({ ...formData, isBetaTester: e.target.checked })}
              className="w-4 h-4 rounded text-orange-500 focus:ring-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── 3. USER DETAILS SLIDE-OVER DRAWER ───────────────────────
interface UserDetailDrawerProps {
  user: AdminUserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (user: AdminUserItem) => void;
  onToggleBeta: (user: AdminUserItem) => void;
}

export const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({
  user,
  isOpen,
  onClose,
  onEdit,
  onToggleBeta,
}) => {
  if (!isOpen || !user) return null;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'teacher':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'moderator':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="bg-[#0F172A] border-l border-slate-800 w-full max-w-md h-full overflow-y-auto p-6 space-y-6 shadow-2xl flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-extrabold text-lg">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-extrabold text-white text-lg leading-snug">{user.displayName}</h3>
                <p className="text-xs text-slate-400 font-mono truncate max-w-[200px]">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Badges & Summary */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold border uppercase ${getRoleBadge(user.role)}`}>
              {user.role}
            </span>
            <span
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                user.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}
            >
              Status: {user.status.toUpperCase()}
            </span>
            {user.isBetaTester && (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 2.0 Beta Enrolled
              </span>
            )}
          </div>

          {/* Identity & Technical Info */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account Metadata</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">Internal ID:</span>
                <span className="font-mono text-[11px] text-slate-300 select-all">{user.id}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">Firebase UID:</span>
                <span className="font-mono text-[11px] text-slate-300 select-all">{user.uid}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">Joined Platform:</span>
                <span>{new Date(user.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Academic Record</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">University:</span>
                <span className="font-bold text-white">{user.university || 'Gujarat Technological University'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">Branch / Stream:</span>
                <span>{user.branch || 'General / First Year'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-500">Enrollment Number:</span>
                <span className="font-mono text-slate-200">{user.enrollmentNo || 'Not Provided'}</span>
              </div>
            </div>
          </div>

          {/* Beta Feature Privileges */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Beta Privileges</p>
              <button
                onClick={() => onToggleBeta(user)}
                className="text-[11px] font-bold text-orange-400 hover:underline cursor-pointer"
              >
                {user.isBetaTester ? 'Revoke Access' : 'Grant Beta Access'}
              </button>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>AI Conversational Tutor:</span>
                <span className={user.isBetaTester ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {user.isBetaTester ? 'Active' : 'Locked'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Interactive Practice 2.0:</span>
                <span className={user.isBetaTester ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {user.isBetaTester ? 'Active' : 'Locked'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Code Playground Execution:</span>
                <span className={user.isBetaTester ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {user.isBetaTester ? 'Active' : 'Locked'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
          <button
            onClick={() => onEdit(user)}
            className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md"
          >
            Edit User Profile
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
