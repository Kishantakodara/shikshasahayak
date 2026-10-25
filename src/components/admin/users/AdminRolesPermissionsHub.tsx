// ============================================================
// SHIKSHA SAHAYAK OS: ADMIN ROLES & PERMISSIONS HUB
// Role-Based Access Control (RBAC), Custom Roles, & Live Permission Matrix
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Layers,
  Lock,
  UserCheck,
  Grid,
  Table,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminUserManagementShell } from './AdminUserManagementShell';
import {
  UserTabKey,
  RoleDefinition,
  PermissionCategory,
} from '../../../types/user-management';
import { userManagementClient } from '../../../api/userManagementClient';
import { RoleCreateEditModal, AssignUserRoleModal } from './RoleModals';

interface AdminRolesPermissionsHubProps {
  onNavigateToTab?: (tab: UserTabKey) => void;
}

export const AdminRolesPermissionsHub: React.FC<AdminRolesPermissionsHubProps> = ({
  onNavigateToTab,
}) => {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [masterPermissions, setMasterPermissions] = useState<PermissionCategory[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRolesData = async () => {
    setIsLoading(true);
    try {
      const data = await userManagementClient.getRoles();
      setRoles(data.roles);
      setMasterPermissions(data.masterPermissions);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch roles & permissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesData();
  }, []);

  const handleSaveRole = async (roleData: Partial<RoleDefinition>) => {
    setActionLoading(true);
    try {
      await userManagementClient.saveRole(roleData);
      toast.success(`Role ${roleData.roleName} saved successfully!`);
      setIsCreateOpen(false);
      setEditingRole(null);
      fetchRolesData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRole = async (roleKey: string) => {
    if (!window.confirm(`Are you sure you want to delete role ${roleKey}?`)) return;
    try {
      await userManagementClient.deleteRole(roleKey);
      toast.success(`Role ${roleKey} deleted.`);
      fetchRolesData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete role');
    }
  };

  const handleAssignUserRole = async (userIdentifier: string, newRole: string) => {
    setActionLoading(true);
    try {
      await userManagementClient.assignUserRole(userIdentifier, newRole);
      toast.success(`Assigned role ${newRole} to ${userIdentifier}!`);
      setIsAssignOpen(false);
      fetchRolesData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign role');
    } finally {
      setActionLoading(false);
    }
  };

  const totalAssignedUsers = roles.reduce((sum, r) => sum + (r.usersCount || 0), 0);
  const customRolesCount = roles.filter((r) => !r.isSystem).length;
  const totalPoliciesCount = masterPermissions.reduce((sum, c) => sum + c.permissions.length, 0);

  const kpis = [
    {
      label: 'Configured Roles',
      value: roles.length,
      subtext: `${customRolesCount} custom role definitions`,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      icon: Shield,
    },
    {
      label: 'Enforced Permissions',
      value: totalPoliciesCount || 23,
      subtext: 'Across 7 platform scopes',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: Lock,
    },
    {
      label: 'Governed Users',
      value: totalAssignedUsers || 'All',
      subtext: 'Assigned active scopes',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      icon: Users,
    },
    {
      label: 'RBAC Enforcement',
      value: 'Cloudflare D1',
      subtext: 'Edge JWT token verification',
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      icon: ShieldCheck,
    },
  ];

  const getRoleIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return ShieldCheck;
      case 'GraduationCap':
        return GraduationCap;
      case 'Sparkles':
        return Sparkles;
      case 'Users':
        return Users;
      case 'CheckCircle2':
        return CheckCircle2;
      default:
        return Shield;
    }
  };

  return (
    <AdminUserManagementShell
      activeTab="roles-permissions"
      onTabChange={(tab) => onNavigateToTab?.(tab)}
      title="Role-Based Access Control (RBAC)"
      description="Server-enforced access scopes, privilege matrices, custom role definitions, and permission policies on Cloudflare D1."
      breadcrumbs={[{ label: 'Roles & Permissions' }]}
      kpis={kpis}
      onRefresh={fetchRolesData}
      isLoading={isLoading}
      secondaryAction={{
        label: 'Assign User Role',
        icon: UserCheck,
        onClick: () => setIsAssignOpen(true),
      }}
      primaryAction={{
        label: 'Create Custom Role',
        icon: Plus,
        color: 'bg-purple-500 hover:bg-purple-600 shadow-purple-500/20',
        onClick: () => {
          setEditingRole(null);
          setIsCreateOpen(true);
        },
      }}
      filters={
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700/80">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Role Cards</span>
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Permission Matrix</span>
          </button>
        </div>
      }
    >
      {/* 1. CARDS VIEW */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {roles.map((roleItem) => {
            const Icon = getRoleIcon(roleItem.iconName);
            const isSuper = roleItem.permissions.includes('*');

            return (
              <div
                key={roleItem.id || roleItem.roleKey}
                className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 space-y-5 flex flex-col justify-between hover:border-slate-700/80 transition shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-white border border-slate-700 shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-white text-base">{roleItem.roleName}</h3>
                          {roleItem.isSystem && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700 uppercase">
                              System
                            </span>
                          )}
                        </div>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${roleItem.badgeColor}`}
                        >
                          {roleItem.roleKey}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingRole(roleItem);
                          setIsCreateOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition cursor-pointer"
                        title="Edit Permissions"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!roleItem.isSystem && (
                        <button
                          onClick={() => handleDeleteRole(roleItem.roleKey)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                          title="Delete Custom Role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mt-2">{roleItem.description}</p>

                  {/* Granted Permissions List */}
                  <div className="space-y-2 pt-4 border-t border-slate-800 mt-4">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                      <span>Assigned Privileges</span>
                      <span className="text-purple-400 font-mono">
                        {isSuper ? 'ALL PERMISSIONS (*)' : `${roleItem.permissions.length} granted`}
                      </span>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {isSuper ? (
                        <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 font-bold">
                          <span>Unrestricted Root Governance</span>
                          <span className="inline-flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Full Access
                          </span>
                        </div>
                      ) : roleItem.permissions.length === 0 ? (
                        <p className="text-xs text-slate-500 py-2">No permissions assigned.</p>
                      ) : (
                        roleItem.permissions.map((pKey) => (
                          <div
                            key={pKey}
                            className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800"
                          >
                            <span className="text-slate-300 font-mono text-[11px]">{pKey}</span>
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Granted
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Users with this role: <strong className="text-white font-mono">{roleItem.usersCount || 0}</strong>
                  </span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Active Scope
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 2. MATRIX VIEW */
        <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-slate-400 uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4 min-w-[280px]">Permission Scope</th>
                  {roles.map((r) => (
                    <th key={r.roleKey} className="p-4 text-center min-w-[120px]">
                      <span className="block text-white font-extrabold">{r.roleName}</span>
                      <span className="text-[10px] font-mono text-slate-400">{r.roleKey}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {masterPermissions.map((cat) => (
                  <React.Fragment key={cat.category || cat.title || cat.id}>
                    <tr className="bg-slate-900/80 font-bold text-slate-300 text-xs">
                      <td colSpan={roles.length + 1} className="py-2.5 px-4 uppercase text-[11px] tracking-wider text-purple-400 border-t border-b border-slate-800">
                        {cat.category || cat.title}
                      </td>
                    </tr>
                    {cat.permissions.map((p) => (
                      <tr key={p.key} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5">
                          <p className="font-bold text-white text-xs">{p.label}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{p.key}</p>
                        </td>
                        {roles.map((r) => {
                          const isAllowed = r.permissions.includes('*') || r.permissions.includes(p.key);
                          return (
                            <td key={r.roleKey} className="p-3.5 text-center">
                              {isAllowed ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-800/60 text-slate-600 border border-slate-800">
                                  <XCircle className="w-4 h-4" />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <RoleCreateEditModal
        role={editingRole}
        masterPermissions={masterPermissions}
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingRole(null);
        }}
        onSave={handleSaveRole}
        isLoading={actionLoading}
      />

      <AssignUserRoleModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onAssign={handleAssignUserRole}
        availableRoles={roles}
        isLoading={actionLoading}
      />
    </AdminUserManagementShell>
  );
};
