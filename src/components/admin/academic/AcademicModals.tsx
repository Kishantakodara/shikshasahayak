// ============================================================
// SHIKSHA SAHAYAK OS: ACADEMIC MODALS
// Creation, editing, & impact-aware confirmation dialogs
// ============================================================

import React, { useState } from 'react';
import {
  X,
  Plus,
  Loader2,
  AlertTriangle,
  Building2,
  Building,
  Calendar,
  Book,
  GraduationCap,
  Check,
} from 'lucide-react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 1. UNIVERSITY MODAL
interface UniversityModalProps extends BaseModalProps {
  initialData?: any;
  onSave: (data: any) => Promise<void>;
}

export const UniversityModal: React.FC<UniversityModalProps> = ({ isOpen, onClose, initialData, onSave }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [shortName, setShortName] = useState(initialData?.shortName || initialData?.short_name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [country, setCountry] = useState(initialData?.country || 'India');
  const [state, setState] = useState(initialData?.state || 'Gujarat');
  const [isActive, setIsActive] = useState<boolean>(initialData?.isActive !== undefined ? initialData.isActive : true);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setIsSaving(true);
      await onSave({
        id: initialData?.id,
        name: name.trim(),
        shortName: shortName.trim() || name.slice(0, 4).toUpperCase(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        country,
        state,
        isActive,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save university');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
      <div className="relative w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl p-6 z-10 font-sans space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-white font-display flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-400" />
            {initialData ? 'Edit University' : 'Add University'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase">University Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gujarat Technological University"
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase">Short Code</label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="e.g. GTU"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase">URL Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. gtu"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Gujarat"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase">Status</label>
              <select
                value={isActive ? 'true' : 'false'}
                onChange={(e) => setIsActive(e.target.value === 'true')}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{initialData ? 'Save Changes' : 'Create University'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. BRANCH MODAL
interface BranchModalProps extends BaseModalProps {
  initialData?: any;
  availableUniversities?: { id: string; name: string; shortName: string }[];
  onSave: (data: any) => Promise<void>;
}

export const BranchModal: React.FC<BranchModalProps> = ({
  isOpen,
  onClose,
  initialData,
  availableUniversities = [],
  onSave,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [shortName, setShortName] = useState(initialData?.shortName || initialData?.short_name || '');
  const [code, setCode] = useState(initialData?.code || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [universityId, setUniversityId] = useState(initialData?.universityId || availableUniversities[0]?.id || 'gtu');
  const [isActive, setIsActive] = useState<boolean>(initialData?.isActive !== undefined ? initialData.isActive : true);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !universityId) return;
    try {
      setIsSaving(true);
      await onSave({
        id: initialData?.id,
        name: name.trim(),
        shortName: shortName.trim() || name.slice(0, 3).toUpperCase(),
        code: code.trim() || shortName.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        universityId,
        isActive,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save branch');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
      <div className="relative w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl p-6 z-10 font-sans space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-white font-display flex items-center gap-2">
            <Building className="w-5 h-5 text-orange-400" />
            {initialData ? 'Edit Branch' : 'Add Branch'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase">Parent University</label>
            <select
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              required
            >
              {availableUniversities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.shortName || u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase">Branch Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Computer Engineering"
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase">Branch Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 07 or CE"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase">Short Name</label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="e.g. CE"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{initialData ? 'Save Changes' : 'Create Branch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 3. SUBJECT MODAL
interface SubjectModalProps extends BaseModalProps {
  initialData?: any;
  availableUniversities?: { id: string; name: string; shortName: string }[];
  availableBranches?: { id: string; name: string; shortName: string }[];
  onSave: (data: any) => Promise<void>;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  initialData,
  availableUniversities = [],
  availableBranches = [],
  onSave,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [code, setCode] = useState(initialData?.code || '');
  const [branchId, setBranchId] = useState(initialData?.branchId || availableBranches[0]?.id || '');
  const [semester, setSemester] = useState(initialData?.semester !== undefined ? String(initialData.semester) : '5');
  const [syllabusLink, setSyllabusLink] = useState(initialData?.syllabusLink || '');
  const [isActive, setIsActive] = useState<boolean>(initialData?.isActive !== undefined ? initialData.isActive : true);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !branchId) return;
    try {
      setIsSaving(true);
      await onSave({
        id: initialData?.id,
        name: name.trim(),
        code: code.trim(),
        branchId,
        semester: Number(semester),
        syllabusLink: syllabusLink.trim(),
        isActive,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save subject');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
      <div className="relative w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl p-6 z-10 font-sans space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-white font-display flex items-center gap-2">
            <Book className="w-5 h-5 text-orange-400" />
            {initialData ? 'Edit Subject' : 'Add Subject'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase">Subject Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Computer Networks"
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase">Subject Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 3150710"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={String(s)}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase">Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              required
            >
              {availableBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.shortName || b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase">Syllabus Document Link</label>
            <input
              type="url"
              value={syllabusLink}
              onChange={(e) => setSyllabusLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{initialData ? 'Save Changes' : 'Create Subject'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 4. ACADEMIC YEAR MODAL
interface AcademicYearModalProps extends BaseModalProps {
  initialData?: any;
  onSave: (data: any) => Promise<void>;
}

export const AcademicYearModal: React.FC<AcademicYearModalProps> = ({ isOpen, onClose, initialData, onSave }) => {
  const [year, setYear] = useState(initialData?.year || '2026-27');
  const [startDate, setStartDate] = useState(initialData?.startDate || '2026-06-01');
  const [endDate, setEndDate] = useState(initialData?.endDate || '2027-05-31');
  const [status, setStatus] = useState<string>(initialData?.status || 'Active');
  const [description, setDescription] = useState(initialData?.description || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!year.trim() || !startDate || !endDate) return;
    try {
      setIsSaving(true);
      await onSave({
        id: initialData?.id,
        year: year.trim(),
        startDate,
        endDate,
        status,
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save academic year');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
      <div className="relative w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl p-6 z-10 font-sans space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-extrabold text-white font-display flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-orange-400" />
            {initialData ? 'Edit Academic Year' : 'Add Academic Year'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase">Academic Year Session</label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2026-27"
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="Active">Active (Current Year)</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Inactive">Inactive</option>
              <option value="Archived">Archived</option>
            </select>
            {status === 'Active' && (
              <p className="text-[10px] text-amber-400/90 font-medium mt-1">
                Setting this year to Active will automatically mark all other years as Inactive.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{initialData ? 'Save Changes' : 'Create Year'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 5. IMPACT CONFIRMATION MODAL
interface ImpactConfirmModalProps extends BaseModalProps {
  title: string;
  message: string;
  impactInfo?: {
    branches?: number;
    subjects?: number;
    documents?: number;
  };
  confirmLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void>;
}

export const ImpactConfirmModal: React.FC<ImpactConfirmModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  impactInfo,
  confirmLabel = 'Confirm Action',
  isDestructive = true,
  onConfirm,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await onConfirm();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
      <div className="relative w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl p-6 z-10 font-sans space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isDestructive ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">{title}</h3>
            <p className="text-xs text-slate-400">{message}</p>
          </div>
        </div>

        {impactInfo && (impactInfo.branches || impactInfo.subjects || impactInfo.documents) && (
          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1.5">
            <span className="font-bold text-slate-300 block mb-1">Relationship Integrity Impact:</span>
            {impactInfo.branches !== undefined && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Affected Branches:</span>
                <span className="font-mono font-bold text-white">{impactInfo.branches}</span>
              </div>
            )}
            {impactInfo.subjects !== undefined && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Affected Subjects:</span>
                <span className="font-mono font-bold text-white">{impactInfo.subjects}</span>
              </div>
            )}
            {impactInfo.documents !== undefined && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Affected Study Documents & PYQs:</span>
                <span className="font-mono font-bold text-white">{impactInfo.documents}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`px-4 py-2 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition ${
              isDestructive ? 'bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/30' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
