import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Mail,
  CheckCircle2,
  XCircle,
  X,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Users,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithAuth } from '../../api/client';

interface BetaUser {
  id: string;
  uid?: string;
  email: string;
  display_name?: string;
  user_type?: string;
  is_beta_tester: number;
  granted_at?: string;
  granted_by?: string;
  created_at?: string;
}

interface BetaWhitelistManagementProps {
  onAddSuccess?: () => void;
}

export const BetaWhitelistManagement: React.FC<BetaWhitelistManagementProps> = ({
  onAddSuccess,
}) => {
  const [users, setUsers] = useState<BetaUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBetaUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/v1/admin/beta');
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
      } else {
        toast.error(data.error || 'Failed to load beta user whitelist.');
      }
    } catch (err) {
      toast.error('Network error loading beta whitelist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBetaUsers();
  }, []);

  const handleToggleBeta = async (userItem: BetaUser) => {
    const newStatus = userItem.is_beta_tester === 1 ? false : true;
    setUpdatingId(userItem.id || userItem.email);

    try {
      const res = await fetchWithAuth('/api/v1/admin/beta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle_user_beta',
          userId: userItem.id || userItem.uid || userItem.email,
          enabled: newStatus,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userItem.id || u.email === userItem.email
              ? {
                  ...u,
                  is_beta_tester: newStatus ? 1 : 0,
                  granted_by: data.granted_by || 'Admin',
                  granted_at: data.granted_at || new Date().toISOString(),
                }
              : u
          )
        );
        toast.success(
          `Beta Access ${newStatus ? 'ENABLED' : 'REVOKED'} for ${
            userItem.display_name || userItem.email
          }`
        );
      } else {
        toast.error(data.error || 'Failed to update Beta status.');
      }
    } catch (err) {
      toast.error('Network failure updating user beta status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddBetaEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/v1/admin/beta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle_user_beta',
          userId: email,
          enabled: true,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Beta tester ${email} added successfully!`);
        setNewEmail('');
        setIsAddModalOpen(false);
        fetchBetaUsers();
        onAddSuccess?.();
      } else {
        toast.error(data.error || 'Failed to add beta tester.');
      }
    } catch (err) {
      toast.error('Network error adding beta user.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.display_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeBetaCount = users.filter((u) => u.is_beta_tester === 1).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> 2.0 Early Access Program
          </div>
          <h2 className="text-2xl font-extrabold text-white">Beta User Whitelist Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Grant students and early adopters access to 2.0 AI tutor, copilot, coding playground, and experimental features.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBetaUsers}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-md shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" /> Add Beta User
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold border border-orange-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Active Beta Testers</p>
            <p className="text-2xl font-extrabold text-white">
              {activeBetaCount} <span className="text-xs text-slate-400 font-normal">/ {users.length} total</span>
            </p>
          </div>
        </div>

        <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Feature Gates</p>
            <p className="text-2xl font-extrabold text-emerald-400">Real-time D1</p>
          </div>
        </div>

        <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold border border-purple-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Security & Isolation</p>
            <p className="text-lg font-extrabold text-white">Server-Verified</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search beta testers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Account Type</th>
                <th className="p-4">Beta Program Status</th>
                <th className="p-4">Granted By</th>
                <th className="p-4">Date Granted</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Loading beta testers roster...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No beta users found matching search query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isTester = u.is_beta_tester === 1;
                  return (
                    <tr key={u.id || u.email} className="hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <p className="font-bold text-white">{u.display_name || 'Student User'}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-bold text-[10px] uppercase border border-slate-700">
                          {u.user_type || 'student'}
                        </span>
                      </td>
                      <td className="p-4">
                        {isTester ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[11px] border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Beta Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 font-bold text-[11px] border border-slate-700">
                            <XCircle className="w-3.5 h-3.5" /> Normal User
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {u.granted_by || (isTester ? 'Admin' : '-')}
                      </td>
                      <td className="p-4 text-slate-400 text-[11px]">
                        {u.granted_at
                          ? new Date(u.granted_at).toLocaleDateString()
                          : u.created_at
                          ? new Date(u.created_at).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleBeta(u)}
                          disabled={updatingId === (u.id || u.email)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ml-auto ${
                            isTester
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                              : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                          }`}
                        >
                          {updatingId === (u.id || u.email)
                            ? 'Updating...'
                            : isTester
                            ? 'Revoke Beta'
                            : 'Enable Beta'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Beta User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-400" />
                <h3 className="font-extrabold text-white text-lg">Add Beta Tester</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBetaEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Tester Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="student@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  This user will be granted 2.0 Beta tester privileges across AI Copilot, Quiz 2.0, and Career Mentor.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md"
                >
                  {submitting ? 'Adding...' : 'Grant Beta Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
