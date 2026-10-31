// ============================================================
// SHIKSHA SAHAYAK OS: ADMIN BETA USER WHITELIST HUB
// 2.0 Early Access Management, Granular AI Feature Flags, & Tester Control
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Zap,
  Code2,
  FileSearch,
  CheckCircle2,
  XCircle,
  Sliders,
  Users,
  Activity,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminUserManagementShell } from './AdminUserManagementShell';
import { UserTabKey, BetaUserItem } from '../../../types/user-management';
import { userManagementClient } from '../../../api/userManagementClient';
import { addBetaUserToFirestore } from '../../../utils/firestoreWhitelistService';
import { BetaAddModal, BetaEditModal } from './BetaWhitelistModals';

interface AdminBetaWhitelistHubProps {
  onNavigateToTab?: (tab: UserTabKey) => void;
  onAddSuccess?: () => void;
}

export const AdminBetaWhitelistHub: React.FC<AdminBetaWhitelistHubProps> = ({
  onNavigateToTab,
  onAddSuccess,
}) => {
  const [users, setUsers] = useState<BetaUserItem[]>([]);
  const [featureFlags, setFeatureFlags] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    activeBetaTesters: 0,
    globalBetaEnabled: true,
    activeFeatureFlagsCount: 0,
    aiCopilotAdopters: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<BetaUserItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBetaData = async () => {
    setIsLoading(true);
    try {
      const data = await userManagementClient.getBetaUsers();
      setUsers(data.users);
      setFeatureFlags(data.featureFlags);
      setStats(data.betaStats);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch beta whitelist');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBetaData();
  }, []);

  const handleToggleBeta = async (userItem: BetaUserItem) => {
    const newStatus = !userItem.isBetaTester;
    setUpdatingId(userItem.id);

    try {
      const res = await userManagementClient.toggleBetaUser(
        userItem.id || userItem.email,
        newStatus,
        userItem.customFlags,
        userItem.notes
      );
      toast.success(`Beta access ${newStatus ? 'ENABLED' : 'REVOKED'} for ${userItem.displayName || userItem.email}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userItem.id ? { ...u, isBetaTester: newStatus } : u))
      );
      setStats((prev: any) => ({
        ...prev,
        activeBetaTesters: prev.activeBetaTesters + (newStatus ? 1 : -1),
      }));
    } catch (err: any) {
      toast.error('Failed to toggle user beta status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddBetaTester = async (
    email: string,
    customFlags: Record<string, boolean>,
    notes: string
  ) => {
    setActionLoading(true);
    try {
      await userManagementClient.toggleBetaUser(email, true, customFlags, notes);
      toast.success(`Tester ${email} enrolled in 2.0 Beta program!`);
      const newBetaUser: BetaUserItem = {
        id: email,
        uid: email,
        email: email.toLowerCase(),
        displayName: email.split('@')[0],
        userType: 'student',
        isBetaTester: true,
        grantedAt: new Date().toISOString(),
        grantedBy: 'Admin',
        notes,
        customFlags,
        createdAt: new Date().toISOString(),
      };
      setUsers((prev) => [newBetaUser, ...prev.filter((u) => u.email.toLowerCase() !== email.toLowerCase())]);
      setIsAddOpen(false);
      fetchBetaData();
      onAddSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add beta tester');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveTesterFlags = async (
    userId: string,
    enabled: boolean,
    customFlags: Record<string, boolean>,
    notes: string
  ) => {
    setActionLoading(true);
    try {
      await userManagementClient.toggleBetaUser(userId, enabled, customFlags, notes);
      toast.success('Beta feature privileges updated!');
      setEditingUser(null);
      fetchBetaData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save configuration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncFirestore = async () => {
    setActionLoading(true);
    try {
      const defaultList = [
        { email: 'tech@shikshasahayak.org', notes: 'Platform Super Admin & AI Beta Lead', status: 'approved' as const },
        { email: 'contact@shikshasahayak.org', notes: 'Platform Admin & Beta Reviewer', status: 'approved' as const },
        { email: 'team@shikshasahayak.org', notes: 'Official Portal Account', status: 'approved' as const },
        { email: 'developer@shikshasahayak.org', notes: 'Lead Developer Account', status: 'approved' as const },
      ];

      let count = 0;
      for (const b of defaultList) {
        const ok = await addBetaUserToFirestore({
          email: b.email,
          notes: b.notes,
          status: b.status,
          added_by: 'Admin Portal Sync',
        });
        if (ok) count++;
      }

      for (const u of users) {
        if (u.email) {
          await addBetaUserToFirestore({
            email: u.email,
            notes: u.notes || 'Admin Portal Sync',
            status: u.isBetaTester ? 'approved' : 'pending',
            added_by: u.grantedBy || 'Admin Portal Sync',
          });
        }
      }

      toast.success(`Synced ${count} initial beta users & ${users.length} active testers to Firestore beta_whitelist!`);
      fetchBetaData();
    } catch (err: any) {
      toast.error('Firestore sync error: ' + (err.message || 'Permission denied in Firebase Console'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Email', 'Name', 'Role', 'Beta Active', 'AI Copilot', 'Practice 2.0', 'Code Sandbox', 'Career ATS'];
    const rows = users.map((u) => [
      u.email,
      `"${u.displayName || 'Student'}"`,
      u.userType || 'student',
      u.isBetaTester ? 'Yes' : 'No',
      u.customFlags?.ai_copilot !== false ? 'Active' : 'Off',
      u.customFlags?.quiz_2_0 !== false ? 'Active' : 'Off',
      u.customFlags?.code_playground !== false ? 'Active' : 'Off',
      u.customFlags?.career_ats !== false ? 'Active' : 'Off',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shikshasahayak_beta_testers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? u.isBetaTester
        : !u.isBetaTester;
    return matchesSearch && matchesStatus;
  });

  const kpis = [
    {
      label: '2.0 Beta Testers',
      value: stats.activeBetaTesters,
      subtext: 'Active early adopters',
      color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      icon: Sparkles,
    },
    {
      label: 'AI Copilot Adopters',
      value: stats.aiCopilotAdopters || stats.activeBetaTesters,
      subtext: 'Conversational tutor users',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      icon: Zap,
    },
    {
      label: 'Active Flag Gates',
      value: stats.activeFeatureFlagsCount || 4,
      subtext: 'Cloudflare D1 runtime flags',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: Activity,
    },
    {
      label: 'Global 2.0 Switch',
      value: stats.globalBetaEnabled ? 'Live' : 'Standby',
      subtext: 'Platform rollout mode',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      icon: ShieldCheck,
    },
  ];

  return (
    <AdminUserManagementShell
      activeTab="beta-whitelist"
      onTabChange={(tab) => onNavigateToTab?.(tab)}
      title="Beta User Whitelist & Feature Gates"
      description="Control 2.0 early access privileges, AI Copilot, interactive quiz testing, and custom feature flags on Cloudflare D1."
      breadcrumbs={[{ label: 'Beta Whitelist' }]}
      kpis={kpis}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search beta testers by student name or email..."
      onRefresh={fetchBetaData}
      onExportClick={handleExportCSV}
      isLoading={isLoading}
      primaryAction={{
        label: 'Add Beta Tester',
        icon: Plus,
        color: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20',
        onClick: () => setIsAddOpen(true),
      }}
      hasActiveFilters={statusFilter !== 'all' || Boolean(searchQuery)}
      onResetFilters={() => {
        setSearchQuery('');
        setStatusFilter('all');
      }}
      filters={
        <>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Users</option>
            <option value="active">Active Beta Testers</option>
            <option value="inactive">Standard Users (Beta Off)</option>
          </select>

          <button
            onClick={handleSyncFirestore}
            disabled={actionLoading}
            className="px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Sync all beta testers to Firebase Firestore beta_whitelist collection"
          >
            <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            <span>Sync Firestore</span>
          </button>
        </>
      }
    >
      {/* Beta Testers Table */}
      <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">Student Tester</th>
                <th className="p-4">Account Type</th>
                <th className="p-4">Enabled Beta Features</th>
                <th className="p-4">Program Status</th>
                <th className="p-4">Date Granted</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-mono text-xs">
                    Loading beta testers roster from Cloudflare D1...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-sm font-bold text-white">No beta testers found</p>
                      <p className="text-xs text-slate-500">Enroll students into 2.0 beta or adjust search filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isTester = u.isBetaTester;
                  const flags = u.customFlags || {
                    ai_copilot: true,
                    quiz_2_0: true,
                    code_playground: true,
                    career_ats: true,
                  };

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-xs shrink-0">
                            {(u.displayName || u.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate max-w-[180px]">
                              {u.displayName || 'Student Tester'}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-bold text-[10px] uppercase border border-slate-700">
                          {u.userType || 'student'}
                        </span>
                      </td>

                      <td className="p-4">
                        {isTester ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {flags.ai_copilot && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                AI Copilot
                              </span>
                            )}
                            {flags.quiz_2_0 && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                Quiz 2.0
                              </span>
                            )}
                            {flags.code_playground && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                                IDE
                              </span>
                            )}
                            {flags.career_ats && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/15 text-pink-400 border border-pink-500/30">
                                ATS
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Standard Access Only</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] border ${
                            isTester
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isTester ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span>{isTester ? 'Beta Active' : 'Off'}</span>
                        </span>
                      </td>

                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {u.grantedAt
                          ? new Date(u.grantedAt).toLocaleDateString()
                          : u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : '-'}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingUser(u)}
                            className="p-1.5 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition cursor-pointer"
                            title="Configure Feature Privileges"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleBeta(u)}
                            disabled={updatingId === u.id}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                              isTester
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                            }`}
                          >
                            {updatingId === u.id ? 'Updating...' : isTester ? 'Revoke' : 'Grant Beta'}
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

      {/* Modals */}
      <BetaAddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddBetaTester}
        isLoading={actionLoading}
      />

      <BetaEditModal
        user={editingUser}
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveTesterFlags}
        isLoading={actionLoading}
      />
    </AdminUserManagementShell>
  );
};
