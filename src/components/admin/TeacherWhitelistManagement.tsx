import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  GraduationCap,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithAuth } from '../../api/client';

interface WhitelistedTeacher {
  email: string;
  createdAt: string;
  status: 'approved' | 'pending' | 'suspended';
}

interface TeacherWhitelistManagementProps {
  onAddSuccess?: () => void;
}

export const TeacherWhitelistManagement: React.FC<TeacherWhitelistManagementProps> = ({
  onAddSuccess,
}) => {
  const [teachers, setTeachers] = useState<WhitelistedTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/admin/teacher-whitelist');
      const data = await res.json();
      if (res.ok && data.teachers) {
        setTeachers(data.teachers);
      } else {
        toast.error(data.error || 'Failed to load teacher whitelist.');
      }
    } catch (err) {
      toast.error('Network error loading teacher whitelist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/admin/teacher-whitelist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Teacher ${email} whitelisted successfully!`);
        setNewEmail('');
        setIsAddModalOpen(false);
        fetchTeachers();
        onAddSuccess?.();
      } else {
        toast.error(data.error || 'Failed to add teacher to whitelist.');
      }
    } catch (err) {
      toast.error('Network error whitelisting teacher.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeTeacher = async (email: string) => {
    if (!window.confirm(`Are you sure you want to revoke teacher access for ${email}?`)) {
      return;
    }

    setDeletingEmail(email);
    try {
      const res = await fetchWithAuth(`/api/admin/teacher-whitelist?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(`Teacher ${email} removed from whitelist.`);
        setTeachers((prev) => prev.filter((t) => t.email.toLowerCase() !== email.toLowerCase()));
      } else {
        toast.error(data.error || 'Failed to revoke teacher access.');
      }
    } catch (err) {
      toast.error('Network error revoking teacher access.');
    } finally {
      setDeletingEmail(null);
    }
  };

  const filteredTeachers = teachers.filter((t) =>
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Faculty Access Governance
          </div>
          <h2 className="text-2xl font-extrabold text-white">Teacher Whitelist Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enforce authorized teacher registration, class management, grading, and LMS publishing privileges on Cloudflare D1.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTeachers}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Whitelisted Teachers</p>
            <p className="text-2xl font-extrabold text-white">{teachers.length}</p>
          </div>
        </div>

        <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold border border-blue-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Verification Status</p>
            <p className="text-2xl font-extrabold text-emerald-400">100% Active</p>
          </div>
        </div>

        <div className="bg-[#0F172A] p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold border border-orange-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Database Engine</p>
            <p className="text-lg font-extrabold text-white">Cloudflare D1 SSoT</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search whitelisted teachers by email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">Faculty Email</th>
                <th className="p-4">Access Level</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date Whitelisted</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    Loading teacher whitelist from Cloudflare D1...
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No whitelisted teachers found.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.email} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                        {teacher.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white font-mono">{teacher.email}</p>
                        <p className="text-[11px] text-slate-400">Verified Educator</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-bold text-[10px] uppercase border border-emerald-500/20">
                        Full Educator LMS
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[11px] border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {new Date(teacher.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleRevokeTeacher(teacher.email)}
                        disabled={deletingEmail === teacher.email}
                        className="px-3 py-1.5 rounded-xl font-bold text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer flex items-center gap-1.5 ml-auto"
                        title="Revoke Teacher Access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingEmail === teacher.email ? 'Revoking...' : 'Revoke'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Teacher Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#0F172A] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-lg">Add Whitelisted Teacher</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Teacher Faculty Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="professor@university.edu.in"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  This teacher will immediately be allowed to register and log in to the Teacher LMS Portal.
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
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md"
                >
                  {submitting ? 'Adding...' : 'Approve & Whitelist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
