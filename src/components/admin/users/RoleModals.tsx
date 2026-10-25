// ============================================================
// SHIKSHA SAHAYAK OS: ROLE MANAGEMENT MODALS
// Modals for Custom Role Authoring, Permission Matrix Editing, & User Assignment
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Users,
  GraduationCap,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { RoleDefinition, PermissionCategory } from '../../../types/user-management';

// ─── 1. ROLE CREATE / EDIT MODAL ─────────────────────────────
interface RoleCreateEditModalProps {
  role: RoleDefinition | null;
  masterPermissions: PermissionCategory[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: Partial<RoleDefinition>) => Promise<void>;
  isLoading?: boolean;
}

export const RoleCreateEditModal: React.FC<RoleCreateEditModalProps> = ({
  role,
  masterPermissions,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [roleName, setRoleName] = useState('');
  const [roleKey, setRoleKey] = useState('');
  const [description, setDescription] = useState('');
  const [badgeColor, setBadgeColor] = useState('bg-blue-500/15 text-blue-400 border-blue-500/30');
  const [iconName, setIconName] = useState('Shield');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (role) {
      setRoleName(role.roleName);
      setRoleKey(role.roleKey);
      setDescription(role.description || '');
      setBadgeColor(role.badgeColor || 'bg-blue-500/15 text-blue-400 border-blue-500/30');
      setIconName(role.iconName || 'Shield');
      setSelectedPermissions(role.permissions || []);
    } else {
      setRoleName('');
      setRoleKey('');
      setDescription('');
      setBadgeColor('bg-blue-500/15 text-blue-400 border-blue-500/30');
      setIconName('Shield');
      setSelectedPermissions([]);
    }
  }, [role, isOpen]);

  if (!isOpen) return null;

  const handleTogglePermission = (permKey: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((k) => k !== permKey) : [...prev, permKey]
    );
  };

  const handleToggleCategory = (categoryPerms: { key: string }[]) => {
    const keys = categoryPerms.map((p) => p.key);
    const allSelected = keys.every((k) => selectedPermissions.includes(k));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((k) => !keys.includes(k)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...keys])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      id: role?.id,
      roleKey: roleKey || roleName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      roleName,
      description,
      badgeColor,
      iconName,
      isSystem: role?.isSystem ?? false,
      permissions: selectedPermissions,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#0F172A] border border-slate-700 rounded-2xl p-6 w-full max-w-3xl shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold border border-purple-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                {role ? `Edit Role: ${role.roleName}` : 'Create Custom RBAC Role'}
              </h3>
              <p className="text-[11px] text-slate-400">Configure permission scopes and access rules.</p>
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
              <label className="block font-bold text-slate-300 uppercase mb-1">Role Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Lead Curriculum Editor"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Role Key (Identifier)</label>
              <input
                type="text"
                disabled={Boolean(role?.isSystem)}
                placeholder="e.g. lead_editor"
                value={roleKey}
                onChange={(e) => setRoleKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono focus:outline-none focus:border-purple-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1">Role Description</label>
            <input
              type="text"
              placeholder="Brief explanation of governance and permissions granted..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Permissions Matrix */}
          <div className="pt-3 border-t border-slate-800 space-y-4 max-h-[380px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between sticky top-0 bg-[#0F172A] py-1 z-10">
              <p className="font-bold text-white uppercase text-xs">Permission Privileges</p>
              <span className="text-[11px] text-purple-400 font-bold font-mono">
                {selectedPermissions.length} selected
              </span>
            </div>

            {masterPermissions.map((category) => {
              const allSelected = category.permissions.every((p) =>
                selectedPermissions.includes(p.key) || selectedPermissions.includes('*')
              );
              return (
                <div key={category.category || category.title || category.id} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs">{category.category || category.title}</h4>
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(category.permissions)}
                      className="text-[11px] font-bold text-purple-400 hover:text-purple-300 cursor-pointer"
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {category.permissions.map((p) => {
                      const isChecked = selectedPermissions.includes(p.key) || selectedPermissions.includes('*');
                      return (
                        <div
                          key={p.key}
                          onClick={() => handleTogglePermission(p.key)}
                          className={`p-2.5 rounded-lg border flex items-start gap-2 cursor-pointer transition ${
                            isChecked
                              ? 'bg-purple-500/10 border-purple-500/30 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            readOnly
                            checked={isChecked}
                            className="mt-0.5 w-3.5 h-3.5 text-purple-500 rounded cursor-pointer"
                          />
                          <div>
                            <p className="font-bold text-xs leading-tight">{p.label}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{p.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
              className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-purple-500/20"
            >
              {isLoading ? 'Saving...' : 'Save Role Matrix'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── 2. ASSIGN USER ROLE MODAL ───────────────────────────────
interface AssignUserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (userIdentifier: string, newRole: string) => Promise<void>;
  availableRoles: RoleDefinition[];
  isLoading?: boolean;
}

export const AssignUserRoleModal: React.FC<AssignUserRoleModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  availableRoles,
  isLoading = false,
}) => {
  const [userIdentifier, setUserIdentifier] = useState('');
  const [selectedRole, setSelectedRole] = useState('student');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdentifier.trim()) return;
    await onAssign(userIdentifier.trim(), selectedRole);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#0F172A] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="font-extrabold text-white text-base">Assign User Role</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1">
              User Email, ID, or UID *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. student@gmail.com or user_123"
              value={userIdentifier}
              onChange={(e) => setUserIdentifier(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1">Target Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
            >
              {availableRoles.map((r) => (
                <option key={r.roleKey} value={r.roleKey}>
                  {r.roleName} ({r.roleKey})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
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
              className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md"
            >
              {isLoading ? 'Assigning...' : 'Assign Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
