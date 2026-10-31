// ============================================================
// SHIKSHA SAHAYAK OS: ADMIN USERS HUB
// Comprehensive User Roster, Profile Inspection, Role Mutation, & Status Control
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Filter,
  Download,
  AlertCircle,
  Clock,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminUserManagementShell } from './AdminUserManagementShell';
import {
  UserTabKey,
  AdminUserItem,
  UserManagementFilterState,
  UserRole,
  UserStatus,
} from '../../../types/user-management';
import { userManagementClient } from '../../../api/userManagementClient';
import { UserCreateModal, UserEditModal, UserDetailDrawer } from './UserModals';

interface AdminUsersHubProps {
  onNavigateToTab?: (tab: UserTabKey) => void;
}

export const AdminUsersHub: React.FC<AdminUsersHubProps> = ({ onNavigateToTab }) => {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState<UserManagementFilterState>({
    search: '',
    role: 'all',
    status: 'all',
    university: 'all',
    branch: 'all',
    betaOnly: false,
    dateRange: 'all',
    page: 1,
    limit: 50,
  });

  // KPI Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeStudents: 0,
    verifiedTeachers: 0,
    adminsCount: 0,
    betaUsersCount: 0,
  });

  // Modals & Drawer State
  const [drawerUser, setDrawerUser] = useState<AdminUserItem | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userManagementClient.getUsers(filters);
      setUsers(data.users);
      setTotalUsers(data.total);
      if (data.stats) {
        setStats({
          totalUsers: data.stats.totalUsers || data.total,
          activeStudents: data.stats.activeStudents || 0,
          verifiedTeachers: data.stats.verifiedTeachers || 0,
          adminsCount: data.stats.adminsCount || 0,
          betaUsersCount: data.stats.betaUsersCount || 0,
        });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters.search, filters.role, filters.status, filters.betaOnly, filters.page]);

  // Actions
  const handleCreateUser = async (userData: Partial<AdminUserItem>) => {
    setActionLoading(true);
    try {
      await userManagementClient.createUser(userData);
      toast.success(`User ${userData.email} created successfully!`);
      const newUserItem: AdminUserItem = {
        id: userData.id || `user_${Date.now()}`,
        uid: userData.uid || userData.id || `user_${Date.now()}`,
        email: (userData.email || '').toLowerCase(),
        displayName: userData.displayName || (userData.email || '').split('@')[0],
        role: userData.role || 'student',
        status: userData.status || 'active',
        isBetaTester: userData.isBetaTester || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUsers((prev) => [newUserItem, ...prev.filter((u) => u.email.toLowerCase() !== newUserItem.email.toLowerCase())]);
      setTotalUsers((prev) => prev + 1);
      setIsCreateOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (userData: Partial<AdminUserItem>) => {
    setActionLoading(true);
    try {
      await userManagementClient.updateUser(userData);
      toast.success('User updated successfully!');
      setEditingUser(null);
      if (drawerUser && drawerUser.id === userData.id) {
        setDrawerUser((prev) => (prev ? { ...prev, ...userData } : null));
      }
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBeta = async (userItem: AdminUserItem) => {
    const newStatus = !userItem.isBetaTester;
    try {
      await userManagementClient.updateUser({
        id: userItem.id,
        isBetaTester: newStatus,
      });
      toast.success(`Beta access ${newStatus ? 'ENABLED' : 'REVOKED'} for ${userItem.displayName}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userItem.id ? { ...u, isBetaTester: newStatus } : u))
      );
      if (drawerUser?.id === userItem.id) {
        setDrawerUser((prev) => (prev ? { ...prev, isBetaTester: newStatus } : null));
      }
    } catch (err: any) {
      toast.error('Failed to toggle beta status');
    }
  };

  const handleDeleteUser = async (userItem: AdminUserItem) => {
    if (!window.confirm(`Are you sure you want to deactivate ${userItem.displayName || userItem.email}?`)) {
      return;
    }
    try {
      await userManagementClient.deleteUser(userItem.id || userItem.uid);
      toast.success(`User ${userItem.email} deactivated.`);
      fetchUsers();
    } catch (err: any) {
      toast.error('Failed to deactivate user');
    }
  };

  // Bulk Actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(users.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const headers = ['UID', 'Name', 'Email', 'Role', 'Status', 'Beta Active', 'University', 'Created At'];
    const rows = users.map((u) => [
      u.uid,
      `"${u.displayName}"`,
      u.email,
      u.role,
      u.status,
      u.isBetaTester ? 'Yes' : 'No',
      u.university || 'GTU',
      u.createdAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shikshasahayak_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPIs
  const kpis = [
    {
      label: 'Registered Users',
      value: stats.totalUsers || totalUsers,
      subtext: 'Global portal accounts',
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      icon: Users,
    },
    {
      label: 'Active Students',
      value: stats.activeStudents,
      subtext: 'Enrolled across universities',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      icon: GraduationCap,
    },
    {
      label: 'Verified Faculty',
      value: stats.verifiedTeachers,
      subtext: 'LMS classroom educators',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: ShieldCheck,
    },
    {
      label: '2.0 Beta Testers',
      value: stats.betaUsersCount,
      subtext: 'AI Copilot adopters',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      icon: Sparkles,
    },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'teacher':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'moderator':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'beta_tester':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <AdminUserManagementShell
      activeTab="users"
      onTabChange={(tab) => onNavigateToTab?.(tab)}
      title="User Management Roster"
      description="Manage registered student accounts, faculty members, portal administrators, and role governance on Cloudflare D1."
      breadcrumbs={[{ label: 'Users' }]}
      kpis={kpis}
      searchValue={filters.search}
      onSearchChange={(val) => setFilters((prev) => ({ ...prev, search: val, page: 1 }))}
      searchPlaceholder="Search users by display name, email address, or enrollment no..."
      onRefresh={fetchUsers}
      onExportClick={handleExportCSV}
      isLoading={isLoading}
      primaryAction={{
        label: 'Create User',
        icon: UserPlus,
        onClick: () => setIsCreateOpen(true),
      }}
      hasActiveFilters={filters.role !== 'all' || filters.status !== 'all' || filters.betaOnly || Boolean(filters.search)}
      onResetFilters={() =>
        setFilters({
          search: '',
          role: 'all',
          status: 'all',
          university: 'all',
          branch: 'all',
          betaOnly: false,
          dateRange: 'all',
          page: 1,
          limit: 50,
        })
      }
      filters={
        <>
          <select
            value={filters.role}
            onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value, page: 1 }))}
            className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Faculty / Teachers</option>
            <option value="admin">Administrators</option>
            <option value="moderator">Moderators</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
            className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Deactivated</option>
          </select>

          <button
            onClick={() => setFilters((prev) => ({ ...prev, betaOnly: !prev.betaOnly, page: 1 }))}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              filters.betaOnly
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-700/80 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Beta Only</span>
          </button>
        </>
      }
    >
      {/* Bulk Action Bar */}
      {selectedUserIds.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-white font-bold">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span>{selectedUserIds.length} users selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedUserIds([])}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Users Data Table */}
      <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedUserIds.length === users.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-orange-500 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-4">User Profile</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">2.0 Beta</th>
                <th className="p-4">Academic Branch</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 font-mono text-xs">
                    Loading users from Cloudflare D1 unified registry...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Users className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-sm font-bold text-white">No users matching search filters</p>
                      <p className="text-xs text-slate-500">Try adjusting your query, role filter, or reset all active filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((userItem) => {
                  const isSelected = selectedUserIds.includes(userItem.id);
                  return (
                    <tr
                      key={userItem.id}
                      className={`hover:bg-slate-800/40 transition ${isSelected ? 'bg-orange-500/5' : ''}`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(userItem.id)}
                          className="w-3.5 h-3.5 rounded text-orange-500 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {userItem.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p
                              onClick={() => setDrawerUser(userItem)}
                              className="font-bold text-white hover:text-orange-400 transition-colors cursor-pointer truncate max-w-[180px]"
                            >
                              {userItem.displayName}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">{userItem.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase ${getRoleBadge(userItem.role)}`}>
                          {userItem.role}
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            userItem.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/15 text-red-400 border-red-500/30'
                          }`}
                        >
                          {userItem.status === 'active' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span className="capitalize">{userItem.status}</span>
                        </span>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => handleToggleBeta(userItem)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                            userItem.isBetaTester
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          {userItem.isBetaTester ? 'Beta Active' : 'Off'}
                        </button>
                      </td>

                      <td className="p-4 text-slate-300 text-[11px]">
                        {userItem.branch || userItem.branchId ? (
                          <span className="font-semibold text-slate-200">
                            {userItem.branch || userItem.branchId}
                          </span>
                        ) : (
                          <span className="text-slate-500">General</span>
                        )}
                      </td>

                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {new Date(userItem.createdAt).toLocaleDateString()}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDrawerUser(userItem)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Inspect User Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingUser(userItem)}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition cursor-pointer"
                            title="Edit Role & Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(userItem)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                            title="Deactivate Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals & Slide-overs */}
      <UserCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateUser}
        isLoading={actionLoading}
      />

      <UserEditModal
        user={editingUser}
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        onSave={handleUpdateUser}
        isLoading={actionLoading}
      />

      <UserDetailDrawer
        user={drawerUser}
        isOpen={Boolean(drawerUser)}
        onClose={() => setDrawerUser(null)}
        onEdit={(u) => {
          setDrawerUser(null);
          setEditingUser(u);
        }}
        onToggleBeta={handleToggleBeta}
      />
    </AdminUserManagementShell>
  );
};
