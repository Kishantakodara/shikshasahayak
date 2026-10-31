// ============================================================
// SHIKSHA SAHAYAK OS: ADMIN TEACHER WHITELIST HUB
// Faculty Access Governance, Department & College Mapping, & Bulk Whitelist
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building2,
  Building,
  Upload,
  Download,
  Search,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminUserManagementShell } from './AdminUserManagementShell';
import {
  UserTabKey,
  TeacherWhitelistItem,
  WhitelistStatus,
} from '../../../types/user-management';
import { userManagementClient } from '../../../api/userManagementClient';
import { addTeacherToFirestore } from '../../../utils/firestoreWhitelistService';
import {
  TeacherAddModal,
  TeacherEditModal,
  TeacherBulkImportModal,
} from './TeacherWhitelistModals';

interface AdminTeacherWhitelistHubProps {
  onNavigateToTab?: (tab: UserTabKey) => void;
  onAddSuccess?: () => void;
}

export const AdminTeacherWhitelistHub: React.FC<AdminTeacherWhitelistHubProps> = ({
  onNavigateToTab,
  onAddSuccess,
}) => {
  const [teachers, setTeachers] = useState<TeacherWhitelistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  // Modals State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherWhitelistItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const data = await userManagementClient.getTeachers({
        search: searchQuery,
        status: statusFilter,
        department: deptFilter,
      });
      setTeachers(data.teachers);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch teacher whitelist');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [searchQuery, statusFilter, deptFilter]);

  const handleAddTeacher = async (teacherData: Partial<TeacherWhitelistItem>) => {
    setActionLoading(true);
    try {
      await userManagementClient.addTeacher(teacherData);
      toast.success(`Teacher ${teacherData.email} whitelisted successfully!`);
      const newTeacher: TeacherWhitelistItem = {
        id: teacherData.id || `tw_${Date.now()}`,
        email: (teacherData.email || '').toLowerCase(),
        name: teacherData.name || (teacherData.email || '').split('@')[0],
        department: teacherData.department || '',
        college: teacherData.college || '',
        status: teacherData.status || 'approved',
        notes: teacherData.notes || '',
        addedBy: 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTeachers((prev) => [newTeacher, ...prev.filter((t) => t.email.toLowerCase() !== newTeacher.email.toLowerCase())]);
      setIsAddOpen(false);
      fetchTeachers();
      onAddSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to whitelist teacher');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTeacher = async (teacherData: Partial<TeacherWhitelistItem>) => {
    setActionLoading(true);
    try {
      await userManagementClient.updateTeacher(teacherData);
      toast.success(`Teacher ${teacherData.email} details updated!`);
      setEditingTeacher(null);
      fetchTeachers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update teacher');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkSubmit = async (teachersList: Partial<TeacherWhitelistItem>[]) => {
    setActionLoading(true);
    try {
      const res = await userManagementClient.bulkAddTeachers(teachersList);
      toast.success(`Successfully imported ${res.addedCount} faculty members!`);
      setIsBulkOpen(false);
      fetchTeachers();
      onAddSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to bulk import teachers');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeTeacher = async (email: string) => {
    if (!window.confirm(`Are you sure you want to revoke faculty access for ${email}?`)) {
      return;
    }
    try {
      await userManagementClient.deleteTeacher(email);
      toast.success(`Teacher ${email} removed from whitelist.`);
      setTeachers((prev) => prev.filter((t) => t.email.toLowerCase() !== email.toLowerCase()));
    } catch (err: any) {
      toast.error('Failed to revoke teacher access');
    }
  };

  const handleSyncFirestore = async () => {
    setActionLoading(true);
    try {
      const defaultList = [
        { email: 'tech@shikshasahayak.org', name: 'Dr. R. K. Mehta', department: 'Computer Engineering', college: 'GTU Main Campus', status: 'approved' as const },
        { email: 'contact@shikshasahayak.org', name: 'Prof. A. S. Patel', department: 'Computer Science & Engineering', college: 'GTU Main Campus', status: 'approved' as const },
        { email: 'team@shikshasahayak.org', name: 'ShikshaSahayak Official Faculty', department: 'Academic Administration', college: 'ShikshaSahayak Network', status: 'approved' as const },
        { email: 'developer@shikshasahayak.org', name: 'Lead Technical Faculty', department: 'Information Technology', college: 'GTU Main Campus', status: 'approved' as const },
      ];

      let count = 0;
      for (const t of defaultList) {
        const ok = await addTeacherToFirestore({
          email: t.email,
          name: t.name,
          department: t.department,
          college: t.college,
          status: t.status,
          added_by: 'Admin Portal Sync',
        });
        if (ok) count++;
      }

      for (const t of teachers) {
        if (t.email) {
          await addTeacherToFirestore({
            email: t.email,
            name: t.name || t.email.split('@')[0],
            department: t.department,
            college: t.college,
            status: (t.status as any) || 'approved',
            added_by: 'Admin Portal Sync',
          });
        }
      }

      toast.success(`Synced ${count} initial faculty & ${teachers.length} active teachers to Firestore teacher_whitelist!`);
      fetchTeachers();
    } catch (err: any) {
      toast.error('Firestore sync error: ' + (err.message || 'Permission denied in Firebase Console'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Email', 'Name', 'Department', 'College', 'Status', 'Date Added'];
    const rows = teachers.map((t) => [
      t.email,
      `"${t.name || ''}"`,
      `"${t.department || ''}"`,
      `"${t.college || ''}"`,
      t.status,
      t.createdAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shikshasahayak_teacher_whitelist_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const approvedCount = teachers.filter((t) => t.status === 'approved').length;
  const pendingCount = teachers.filter((t) => t.status === 'pending').length;
  const uniqueCollegesCount = new Set(teachers.map((t) => t.college).filter(Boolean)).size;

  const kpis = [
    {
      label: 'Whitelisted Faculty',
      value: teachers.length,
      subtext: 'Verified educators',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: GraduationCap,
    },
    {
      label: 'Approved & Active',
      value: approvedCount,
      subtext: 'Full LMS privileges',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      icon: CheckCircle2,
    },
    {
      label: 'Pending Approvals',
      value: pendingCount,
      subtext: 'Under verification',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      icon: Clock,
    },
    {
      label: 'Colleges Represented',
      value: uniqueCollegesCount || 1,
      subtext: 'Engineering institutions',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      icon: Building2,
    },
  ];

  return (
    <AdminUserManagementShell
      activeTab="teacher-whitelist"
      onTabChange={(tab) => onNavigateToTab?.(tab)}
      title="Teacher Whitelist Management"
      description="Manage verified faculty accounts, classroom batches, grading authority, and educational LMS authoring on Cloudflare D1."
      breadcrumbs={[{ label: 'Teacher Whitelist' }]}
      kpis={kpis}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search whitelisted faculty by email, name, college, or department..."
      onRefresh={fetchTeachers}
      onExportClick={handleExportCSV}
      isLoading={isLoading}
      secondaryAction={{
        label: 'Bulk Import',
        icon: Upload,
        onClick: () => setIsBulkOpen(true),
      }}
      primaryAction={{
        label: 'Add Teacher',
        icon: Plus,
        color: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20',
        onClick: () => setIsAddOpen(true),
      }}
      hasActiveFilters={statusFilter !== 'all' || deptFilter !== 'all' || Boolean(searchQuery)}
      onResetFilters={() => {
        setSearchQuery('');
        setStatusFilter('all');
        setDeptFilter('all');
      }}
      filters={
        <>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved & Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>

          <button
            onClick={handleSyncFirestore}
            disabled={actionLoading}
            className="px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Sync all teachers to Firebase Firestore teacher_whitelist collection"
          >
            <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            <span>Sync Firestore</span>
          </button>
        </>
      }
    >
      {/* Teachers Table */}
      <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">Faculty Member</th>
                <th className="p-4">Department</th>
                <th className="p-4">College / University</th>
                <th className="p-4">LMS Verification Status</th>
                <th className="p-4">Date Whitelisted</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-mono text-xs">
                    Loading teacher whitelist from Cloudflare D1...
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <GraduationCap className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-sm font-bold text-white">No whitelisted teachers found</p>
                      <p className="text-xs text-slate-500">Add an educator email or adjust your search filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.email} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                          {(teacher.name || teacher.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate max-w-[180px]">
                            {teacher.name || 'Verified Educator'}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">{teacher.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-bold text-[10px] uppercase border border-slate-700">
                        {teacher.department || 'Engineering'}
                      </span>
                    </td>

                    <td className="p-4 text-slate-300 text-[11px]">
                      {teacher.college || <span className="text-slate-500">GTU Affiliated</span>}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] border ${
                          teacher.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : teacher.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }`}
                      >
                        {teacher.status === 'approved' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : teacher.status === 'pending' ? (
                          <Clock className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        <span className="capitalize">{teacher.status}</span>
                      </span>
                    </td>

                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {new Date(teacher.createdAt).toLocaleDateString()}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingTeacher(teacher)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition cursor-pointer"
                          title="Edit Faculty Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRevokeTeacher(teacher.email)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                          title="Revoke Whitelist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <TeacherAddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddTeacher}
        isLoading={actionLoading}
      />

      <TeacherEditModal
        teacher={editingTeacher}
        isOpen={Boolean(editingTeacher)}
        onClose={() => setEditingTeacher(null)}
        onSave={handleUpdateTeacher}
        isLoading={actionLoading}
      />

      <TeacherBulkImportModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onBulkSubmit={handleBulkSubmit}
        isLoading={actionLoading}
      />
    </AdminUserManagementShell>
  );
};
