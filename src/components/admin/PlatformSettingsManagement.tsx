import React, { useState, useEffect } from 'react';
import {
  Settings,
  Globe,
  Shield,
  Bell,
  ToggleLeft,
  ToggleRight,
  Save,
  CheckCircle2,
  AlertTriangle,
  Server,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithAuth } from '../../api/client';

export const PlatformSettingsManagement: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [studentRegistrationOpen, setStudentRegistrationOpen] = useState(true);
  const [teacherRegistrationOpen, setTeacherRegistrationOpen] = useState(true);
  const [showBetaBanner, setShowBetaBanner] = useState(true);
  const [featuredNotice, setFeaturedNotice] = useState('GTU Summer 2026 Examination PYQs and Solutions are now live!');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const res = await fetchWithAuth('/api/v1/admin/beta');
        if (res.ok) {
          const data = await res.json();
          if (data.featureFlags) {
            data.featureFlags.forEach((f: any) => {
              if (f.flag_key === 'maintenanceMode') setMaintenanceMode(f.is_enabled === 1);
              if (f.flag_key === 'studentRegistrationOpen') setStudentRegistrationOpen(f.is_enabled === 1);
              if (f.flag_key === 'teacherRegistrationOpen') setTeacherRegistrationOpen(f.is_enabled === 1);
              if (f.flag_key === 'showBetaBanner') setShowBetaBanner(f.is_enabled === 1);
            });
          }
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const updates = [
        { flagKey: 'maintenanceMode', enabled: maintenanceMode },
        { flagKey: 'studentRegistrationOpen', enabled: studentRegistrationOpen },
        { flagKey: 'teacherRegistrationOpen', enabled: teacherRegistrationOpen },
        { flagKey: 'showBetaBanner', enabled: showBetaBanner },
      ];

      for (const update of updates) {
        await fetchWithAuth('/api/v1/admin/beta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_feature_flag', ...update })
        });
      }

      toast.success('Platform settings saved successfully to Cloudflare D1!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4" /> Global Platform Settings
          </div>
          <h2 className="text-2xl font-extrabold text-white">Platform & Homepage Configuration</h2>
          <p className="text-xs text-slate-400 mt-1">
            Control public availability, registration gates, banner broadcasts, and maintenance mode.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-md shadow-orange-500/20"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Main Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Availability & Access Controls */}
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-white text-base">Portal Access & Registration Gates</h3>
          </div>

          {/* Setting 1: Maintenance Mode */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <h4 className="font-bold text-white text-sm">Emergency Maintenance Mode</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Displays maintenance landing screen for non-admin visits.
              </p>
            </div>
            <button
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                maintenanceMode ? 'text-red-400' : 'text-slate-400'
              }`}
            >
              {maintenanceMode ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
            </button>
          </div>

          {/* Setting 2: Student Registration */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <h4 className="font-bold text-white text-sm">Student Registration Open</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Allow new students to sign up via registration portals.
              </p>
            </div>
            <button
              onClick={() => setStudentRegistrationOpen(!studentRegistrationOpen)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                studentRegistrationOpen ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {studentRegistrationOpen ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
            </button>
          </div>

          {/* Setting 3: Teacher Registration */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <h4 className="font-bold text-white text-sm">Teacher Whitelist Verification</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Require email whitelist check before faculty account activation.
              </p>
            </div>
            <button
              onClick={() => setTeacherRegistrationOpen(!teacherRegistrationOpen)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                teacherRegistrationOpen ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {teacherRegistrationOpen ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
            </button>
          </div>
        </div>

        {/* Announcements & Homepage Banners */}
        <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-white text-base">Broadcasts & Homepage Banner</h3>
          </div>

          {/* Setting 4: Show Beta Banner */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <h4 className="font-bold text-white text-sm">2.0 Beta Announcement Bar</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Displays top promotional banner for ShikshaSahayak 2.0 release.
              </p>
            </div>
            <button
              onClick={() => setShowBetaBanner(!showBetaBanner)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                showBetaBanner ? 'text-orange-400' : 'text-slate-400'
              }`}
            >
              {showBetaBanner ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
            </button>
          </div>

          {/* Notice Input */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase">
              Global Header Notice Text
            </label>
            <input
              type="text"
              value={featuredNotice}
              onChange={(e) => setFeaturedNotice(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
            <p className="text-[11px] text-slate-400">
              Live announcement displayed across all public portal headers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
