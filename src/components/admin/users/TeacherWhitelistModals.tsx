// ============================================================
// SHIKSHA SAHAYAK OS: TEACHER WHITELIST MODALS
// Modals for Adding, Editing, Bulk Importing, and Revoking Faculty Members
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  GraduationCap,
  Mail,
  Building,
  Building2,
  BookOpen,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { TeacherWhitelistItem, WhitelistStatus } from '../../../types/user-management';

// ─── 1. ADD TEACHER MODAL ────────────────────────────────────
interface TeacherAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (teacherData: Partial<TeacherWhitelistItem>) => Promise<void>;
  isLoading?: boolean;
}

export const TeacherAddModal: React.FC<TeacherAddModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<TeacherWhitelistItem>>({
    email: '',
    name: '',
    department: 'Computer Engineering',
    college: '',
    status: 'approved',
    notes: '',
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
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Add Whitelisted Faculty</h3>
              <p className="text-[11px] text-slate-400">Grant full LMS instructor, assignment, and grading privileges.</p>
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
          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1">Faculty Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="professor@university.edu.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Faculty Full Name</label>
              <input
                type="text"
                placeholder="Dr. Rajesh Patel"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Verification Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as WhitelistStatus })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="approved">Approved & Active</option>
                <option value="pending">Pending Document Verification</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Department</label>
              <input
                type="text"
                placeholder="e.g. Computer Engineering"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">College / Institution</label>
              <input
                type="text"
                placeholder="e.g. L.D. College of Engineering"
                value={formData.college || ''}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1">Administrative Notes</label>
            <textarea
              rows={2}
              placeholder="Internal verification notes, designation, or staff ID..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
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
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-emerald-500/20"
            >
              {isLoading ? 'Whitelisting...' : 'Approve & Whitelist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── 2. EDIT TEACHER MODAL ───────────────────────────────────
interface TeacherEditModalProps {
  teacher: TeacherWhitelistItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Partial<TeacherWhitelistItem>) => Promise<void>;
  isLoading?: boolean;
}

export const TeacherEditModal: React.FC<TeacherEditModalProps> = ({
  teacher,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<TeacherWhitelistItem>>({});

  useEffect(() => {
    if (teacher) {
      setFormData({
        email: teacher.email,
        name: teacher.name || '',
        department: teacher.department || '',
        college: teacher.college || '',
        status: teacher.status,
        notes: teacher.notes || '',
      });
    }
  }, [teacher]);

  if (!isOpen || !teacher) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#0F172A] border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Edit Faculty Record</h3>
              <p className="text-[11px] text-slate-400 font-mono">{teacher.email}</p>
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
              <label className="block font-bold text-slate-300 uppercase mb-1">Faculty Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Status</label>
              <select
                value={formData.status || 'approved'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as WhitelistStatus })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="approved">Approved & Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Department</label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">College</label>
              <input
                type="text"
                value={formData.college || ''}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1">Notes</label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white resize-none focus:outline-none focus:border-emerald-500"
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
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md"
            >
              {isLoading ? 'Saving...' : 'Update Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── 3. BULK IMPORT TEACHER MODAL ────────────────────────────
interface TeacherBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBulkSubmit: (teachers: Partial<TeacherWhitelistItem>[]) => Promise<void>;
  isLoading?: boolean;
}

export const TeacherBulkImportModal: React.FC<TeacherBulkImportModalProps> = ({
  isOpen,
  onClose,
  onBulkSubmit,
  isLoading = false,
}) => {
  const [rawText, setRawText] = useState('');
  const [department, setDepartment] = useState('Computer Engineering');
  const [college, setCollege] = useState('');

  if (!isOpen) return null;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsedTeachers: Partial<TeacherWhitelistItem>[] = [];

    for (const line of lines) {
      if (line.includes(',')) {
        const parts = line.split(',');
        const email = parts[0]?.trim();
        const name = parts[1]?.trim();
        const dept = parts[2]?.trim() || department;
        const col = parts[3]?.trim() || college;
        if (email && email.includes('@')) {
          parsedTeachers.push({ email, name, department: dept, college: col, status: 'approved' });
        }
      } else if (line.includes('@')) {
        parsedTeachers.push({ email: line, department, college, status: 'approved' });
      }
    }

    if (parsedTeachers.length === 0) {
      alert('No valid emails found in the input.');
      return;
    }

    await onBulkSubmit(parsedTeachers);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#0F172A] border border-slate-700 rounded-2xl p-6 w-full max-w-xl shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Bulk Faculty Whitelist Importer</h3>
              <p className="text-[11px] text-slate-400">Paste multiple faculty emails or CSV formatted lines.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleImport} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Default Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Default College / Institution</label>
              <input
                type="text"
                placeholder="e.g. GTU Campus"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1">
              Emails / CSV Records (One per line)
            </label>
            <textarea
              rows={8}
              required
              placeholder={`professor1@gtu.edu.in\nprofessor2@gtu.edu.in, Dr. Mehta, Electrical, BVM\nprofessor3@gtu.edu.in`}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full font-mono text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Supports raw email addresses or CSV format: <code className="text-emerald-400 font-mono">email, name, department, college</code>
            </p>
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
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md shadow-emerald-500/20"
            >
              {isLoading ? 'Importing...' : 'Process & Whitelist Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
