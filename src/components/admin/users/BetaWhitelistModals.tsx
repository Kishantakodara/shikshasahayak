// ============================================================
// SHIKSHA SAHAYAK OS: BETA WHITELIST MODALS
// Granular Feature Flags, Tester Provisioning, & Custom Rollout Modals
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Mail,
  Zap,
  Code2,
  FileSearch,
  CheckCircle2,
  Sliders,
  Users,
} from 'lucide-react';
import { BetaUserItem } from '../../../types/user-management';

// ─── 1. ADD BETA TESTER MODAL ────────────────────────────────
interface BetaAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, customFlags: Record<string, boolean>, notes: string) => Promise<void>;
  isLoading?: boolean;
}

export const BetaAddModal: React.FC<BetaAddModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [customFlags, setCustomFlags] = useState<Record<string, boolean>>({
    ai_copilot: true,
    quiz_2_0: true,
    code_playground: true,
    career_ats: true,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    await onSubmit(email.trim().toLowerCase(), customFlags, notes);
  };

  const toggleFlag = (key: string) => {
    setCustomFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#0F172A] border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold border border-orange-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Enroll 2.0 Beta Tester</h3>
              <p className="text-[11px] text-slate-400">Grant access to experimental generative AI and testing tools.</p>
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
            <label className="block font-bold text-slate-300 uppercase mb-1">Student / Tester Email *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="student@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Granular Flags */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <p className="font-bold text-slate-300 uppercase text-[11px]">Granular Beta Feature Privileges</p>
            <div className="space-y-2">
              <div
                onClick={() => toggleFlag('ai_copilot')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  customFlags.ai_copilot
                    ? 'bg-orange-500/10 border-orange-500/30 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <div>
                    <p className="font-bold text-xs">AI Study Copilot & Explainer</p>
                    <p className="text-[10px] text-slate-400">Conversational tutor for GTU questions.</p>
                  </div>
                </div>
                <input type="checkbox" readOnly checked={customFlags.ai_copilot} className="w-4 h-4 text-orange-500" />
              </div>

              <div
                onClick={() => toggleFlag('quiz_2_0')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  customFlags.quiz_2_0
                    ? 'bg-orange-500/10 border-orange-500/30 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="font-bold text-xs">Interactive Practice Zone 2.0</p>
                    <p className="text-[10px] text-slate-400">Adaptive quizzes with instant grading.</p>
                  </div>
                </div>
                <input type="checkbox" readOnly checked={customFlags.quiz_2_0} className="w-4 h-4 text-orange-500" />
              </div>

              <div
                onClick={() => toggleFlag('code_playground')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  customFlags.code_playground
                    ? 'bg-orange-500/10 border-orange-500/30 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Code2 className="w-4 h-4 text-sky-400" />
                  <div>
                    <p className="font-bold text-xs">In-Browser Code Playground</p>
                    <p className="text-[10px] text-slate-400">Live browser IDE for Python, C, C++, Java.</p>
                  </div>
                </div>
                <input type="checkbox" readOnly checked={customFlags.code_playground} className="w-4 h-4 text-orange-500" />
              </div>

              <div
                onClick={() => toggleFlag('career_ats')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  customFlags.career_ats
                    ? 'bg-orange-500/10 border-orange-500/30 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileSearch className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="font-bold text-xs">Resume ATS Scanner & Career Hub</p>
                    <p className="text-[10px] text-slate-400">ATS score calculator & gap analysis.</p>
                  </div>
                </div>
                <input type="checkbox" readOnly checked={customFlags.career_ats} className="w-4 h-4 text-orange-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1">Notes / Program Cohort</label>
            <input
              type="text"
              placeholder="e.g. Early Beta Cohort 1 - Campus Ambassador"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
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
              {isLoading ? 'Enrolling...' : 'Grant Beta Access'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── 2. EDIT BETA TESTER MODAL ───────────────────────────────
interface BetaEditModalProps {
  user: BetaUserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, enabled: boolean, customFlags: Record<string, boolean>, notes: string) => Promise<void>;
  isLoading?: boolean;
}

export const BetaEditModal: React.FC<BetaEditModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [enabled, setEnabled] = useState(true);
  const [notes, setNotes] = useState('');
  const [customFlags, setCustomFlags] = useState<Record<string, boolean>>({
    ai_copilot: true,
    quiz_2_0: true,
    code_playground: true,
    career_ats: true,
  });

  useEffect(() => {
    if (user) {
      setEnabled(user.isBetaTester);
      setNotes(user.notes || '');
      if (user.customFlags) {
        setCustomFlags({
          ai_copilot: user.customFlags.ai_copilot ?? true,
          quiz_2_0: user.customFlags.quiz_2_0 ?? true,
          code_playground: user.customFlags.code_playground ?? true,
          career_ats: user.customFlags.career_ats ?? true,
        });
      }
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(user.id || user.email, enabled, customFlags, notes);
  };

  const toggleFlag = (key: string) => {
    setCustomFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#0F172A] border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold border border-orange-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Configure Beta Feature Access</h3>
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
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="font-bold text-white text-xs">Beta Program Active</p>
              <p className="text-[10px] text-slate-400">Master toggle for this user.</p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                enabled ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {enabled ? 'Active' : 'Disabled'}
            </button>
          </div>

          {/* Granular Flags */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <p className="font-bold text-slate-300 uppercase text-[11px]">Granular Privileges</p>
            <div className="space-y-2">
              <div
                onClick={() => toggleFlag('ai_copilot')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  customFlags.ai_copilot
                    ? 'bg-orange-500/10 border-orange-500/30 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span className="font-bold text-xs">AI Study Copilot & Explainer</span>
                </div>
                <input type="checkbox" readOnly checked={customFlags.ai_copilot} className="w-4 h-4 text-orange-500" />
              </div>

              <div
                onClick={() => toggleFlag('quiz_2_0')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  customFlags.quiz_2_0
                    ? 'bg-orange-500/10 border-orange-500/30 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs">Interactive Practice Zone 2.0</span>
                </div>
                <input type="checkbox" readOnly checked={customFlags.quiz_2_0} className="w-4 h-4 text-orange-500" />
              </div>

              <div
                onClick={() => toggleFlag('code_playground')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  customFlags.code_playground
                    ? 'bg-orange-500/10 border-orange-500/30 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Code2 className="w-4 h-4 text-sky-400" />
                  <span className="font-bold text-xs">In-Browser Code Playground</span>
                </div>
                <input type="checkbox" readOnly checked={customFlags.code_playground} className="w-4 h-4 text-orange-500" />
              </div>

              <div
                onClick={() => toggleFlag('career_ats')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  customFlags.career_ats
                    ? 'bg-orange-500/10 border-orange-500/30 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileSearch className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-xs">Resume ATS Scanner & Career Hub</span>
                </div>
                <input type="checkbox" readOnly checked={customFlags.career_ats} className="w-4 h-4 text-orange-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 uppercase mb-1">Tester Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
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
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
