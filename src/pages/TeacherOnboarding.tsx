// ============================================================
// SHIKSHA SAHAYAK OS - TEACHER ONBOARDING PAGE
// Step-by-step academic setup for newly registered educators
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStoredTokens } from '../api/client';
import { Loader2, GraduationCap, Building2, BookOpen, Layers, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function TeacherOnboarding() {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  
  const [fullName, setFullName] = useState(currentUser?.displayName || currentUser?.fullName || '');
  const [institution, setInstitution] = useState('');
  const [department, setDepartment] = useState('Computer Engineering');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['computer-engineering']);
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([3, 5]);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const branchesList = [
    { id: 'computer-engineering', label: 'Computer Engineering' },
    { id: 'information-technology', label: 'Information Technology' },
    { id: 'electrical-engineering', label: 'Electrical Engineering' },
    { id: 'electronics-communication', label: 'Electronics & Communication' },
    { id: 'mechanical-engineering', label: 'Mechanical Engineering' },
    { id: 'civil-engineering', label: 'Civil Engineering' },
    { id: 'chemical-engineering', label: 'Chemical Engineering' },
  ];

  const handleBranchToggle = (id: string) => {
    setSelectedBranches(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const handleSemesterToggle = (sem: number) => {
    setSelectedSemesters(prev => 
      prev.includes(sem) ? prev.filter(s => s !== sem) : [...prev, sem]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Full Name is required');
      return;
    }
    if (!institution.trim()) {
      setErrorMsg('Institution name is required');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const { access } = getStoredTokens();
      const res = await fetch('/api/teacher/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access}`
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          institution: institution.trim(),
          department: department.trim(),
          designation: designation.trim(),
          branches: selectedBranches,
          semesters: selectedSemesters,
          subjects: ['General Academic']
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Profile setup failed with status ${res.status}`);
      }

      navigate('/teacher', { replace: true });
    } catch (err: any) {
      console.error('Teacher onboarding failed:', err);
      setErrorMsg(err.message || 'Failed to complete profile setup');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070d19]">
        <Loader2 className="h-10 w-10 animate-spin text-brand-orange" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#070d19] py-12 px-4 font-sans overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-orange/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        <div className="bg-white/95 dark:bg-navy-900/80 backdrop-blur-xl border border-gray-100 dark:border-navy-800 rounded-3xl shadow-2xl p-8 sm:p-10 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/20 border border-orange-500/20 text-brand-orange text-xs font-bold uppercase tracking-wider mb-2">
              <GraduationCap className="w-4 h-4" />
              <span>Educator Setup</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white font-display">
              Complete Your Faculty Profile
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Configure your institutional affiliation, teaching branches, and target semesters.
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Prof. Rajesh Sharma"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50 dark:bg-navy-950/50 text-navy-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-orange focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                  College / Institution
                </label>
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={e => setInstitution(e.target.value)}
                  placeholder="Gujarat Technological University (GTU)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50 dark:bg-navy-950/50 text-navy-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-orange focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="Computer Engineering"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50 dark:bg-navy-950/50 text-navy-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-orange focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                  Designation / Role
                </label>
                <select
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-800 bg-gray-50 dark:bg-navy-950/50 text-navy-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-orange focus:outline-none"
                >
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="Head of Department (HOD)">Head of Department (HOD)</option>
                  <option value="Visiting Faculty">Visiting Faculty</option>
                </select>
              </div>
            </div>

            {/* Branches Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                Teaching Branches (Select all applicable)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {branchesList.map(b => (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => handleBranchToggle(b.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                      selectedBranches.includes(b.id)
                        ? 'bg-brand-orange/10 border-brand-orange text-brand-orange'
                        : 'bg-gray-50 dark:bg-navy-950/30 border-gray-200 dark:border-navy-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <span className="truncate">{b.label}</span>
                    {selectedBranches.includes(b.id) && <CheckCircle2 className="w-3.5 h-3.5 text-brand-orange shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Semesters Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                Target Semesters
              </label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <button
                    type="button"
                    key={sem}
                    onClick={() => handleSemesterToggle(sem)}
                    className={`w-11 h-11 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center justify-center ${
                      selectedSemesters.includes(sem)
                        ? 'bg-brand-orange text-white shadow-md'
                        : 'bg-gray-50 dark:bg-navy-950/30 border border-gray-200 dark:border-navy-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Sem {sem}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full py-6 font-black text-sm bg-brand-orange hover:bg-orange-600 text-white rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Save Faculty Profile & Enter Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
