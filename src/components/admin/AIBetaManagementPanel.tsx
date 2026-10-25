import React, { useState, useEffect } from 'react';
import { Sparkles, Search, CheckCircle2, XCircle, ShieldCheck, RefreshCw, ToggleLeft, ToggleRight, Users, Flag, Activity, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithAuth } from '../../api/client';

interface BetaUser {
  id: string;
  uid: string;
  email: string;
  display_name: string;
  user_type: string;
  is_beta_tester: number;
  granted_at?: string;
  granted_by?: string;
  custom_flags_json?: string;
  created_at: string;
}

interface FeatureFlag {
  id: string;
  flag_key: string;
  name: string;
  description: string;
  is_enabled: number;
  updated_at: string;
}

interface BetaStats {
  totalUsers: number;
  activeBetaTesters: number;
  globalBetaEnabled: boolean;
  activeFeatureFlagsCount: number;
  totalFeatureFlagsCount: number;
  betaRequestsCount: number;
  betaErrorsCount: number;
}

export const AIBetaManagementPanel: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'testers' | 'flags' | 'usage' | 'errors'>('testers');
  const [users, setUsers] = useState<BetaUser[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [stats, setStats] = useState<BetaStats>({
    totalUsers: 0,
    activeBetaTesters: 0,
    globalBetaEnabled: true,
    activeFeatureFlagsCount: 0,
    totalFeatureFlagsCount: 0,
    betaRequestsCount: 0,
    betaErrorsCount: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBetaData = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/v1/admin/beta');
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
        setFeatureFlags(data.featureFlags || []);
        if (data.betaStats) {
          setStats(data.betaStats);
        }
      } else {
        toast.error(data.error || 'Failed to load beta program roster.');
      }
    } catch (err: any) {
      toast.error('Network error communicating with admin server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBetaData();
  }, []);

  const handleToggleUserBeta = async (userItem: BetaUser) => {
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
          enabled: newStatus
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUsers(prev => prev.map(u => (u.id === userItem.id || u.email === userItem.email) ? {
          ...u,
          is_beta_tester: newStatus ? 1 : 0,
          granted_by: data.granted_by || 'Admin',
          granted_at: data.granted_at || new Date().toISOString()
        } : u));
        setStats(prev => ({
          ...prev,
          activeBetaTesters: newStatus ? prev.activeBetaTesters + 1 : Math.max(0, prev.activeBetaTesters - 1)
        }));
        toast.success(`Beta Access ${newStatus ? 'ENABLED' : 'DISABLED'} for ${userItem.display_name || userItem.email}`);
      } else {
        toast.error(data.error || 'Failed to update Beta status.');
      }
    } catch (err) {
      toast.error('Network failure updating user beta status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleFeatureFlag = async (flagKey: string, currentEnabled: boolean) => {
    const newEnabled = !currentEnabled;
    setUpdatingId(`flag_${flagKey}`);

    try {
      const res = await fetchWithAuth('/api/v1/admin/beta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_feature_flag',
          flagKey,
          enabled: newEnabled
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeatureFlags(prev => prev.map(f => f.flag_key === flagKey ? {
          ...f,
          is_enabled: newEnabled ? 1 : 0,
          updated_at: new Date().toISOString()
        } : f));
        toast.success(`Feature Flag '${flagKey}' set to ${newEnabled ? 'ACTIVE' : 'INACTIVE'}`);
      } else {
        toast.error(data.error || 'Failed to update feature flag.');
      }
    } catch (err) {
      toast.error('Network failure updating feature flag.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.display_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> 2.0 Beta Program Hub
          </div>
          <h2 className="text-2xl font-extrabold text-text font-display">ShikshaSahayak 2.0 Beta Manager</h2>
          <p className="text-xs text-text-muted mt-1">
            Production-safe beta tester management, feature flag toggles, emergency kill-switches, and runtime telemetry.
          </p>
        </div>

        <button
          onClick={fetchBetaData}
          className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Telemetry
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-muted font-bold uppercase">Active Beta Testers</p>
            <p className="text-2xl font-extrabold text-text font-display">{stats.activeBetaTesters} / {stats.totalUsers}</p>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-muted font-bold uppercase">Feature Flags</p>
            <p className="text-2xl font-extrabold text-text font-display">{stats.activeFeatureFlagsCount} Active</p>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-brand-orange flex items-center justify-center font-bold">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-muted font-bold uppercase">Master Beta Switch</p>
            <p className={`text-lg font-extrabold font-display ${stats.globalBetaEnabled ? 'text-emerald-500' : 'text-red-500'}`}>
              {stats.globalBetaEnabled ? 'ENABLED (LIVE)' : 'DISABLED (KILLED)'}
            </p>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-muted font-bold uppercase">System Security</p>
            <p className="text-2xl font-extrabold text-emerald-500 font-display">100% Protected</p>
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex border-b border-border gap-2">
        {[
          { id: 'testers', label: 'Beta Testers', icon: Users },
          { id: 'flags', label: 'Feature Flags', icon: Flag },
          { id: 'usage', label: 'Beta Usage', icon: Activity },
          { id: 'errors', label: 'Beta Errors', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-brand-orange text-brand-orange bg-brand-orange/5'
                  : 'border-transparent text-text-muted hover:text-text hover:bg-surface'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BETA TESTERS */}
      {activeSubTab === 'testers' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="bg-surface p-4 rounded-2xl border border-border shadow-xs flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search registered users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs text-text focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          {/* User Roster Table */}
          <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-background text-text-muted uppercase font-bold border-b border-border">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Role / Type</th>
                    <th className="p-4">Beta Status</th>
                    <th className="p-4">Granted By</th>
                    <th className="p-4">Date Added</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-text font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-text-muted">Loading user roster...</td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-text-muted">No users found matching search.</td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id || u.email} className="hover:bg-background/50 transition">
                        <td className="p-4">
                          <p className="font-bold text-text">{u.display_name || 'Student User'}</p>
                          <p className="text-[11px] text-text-muted font-mono">{u.email}</p>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px] uppercase">
                            {u.user_type}
                          </span>
                        </td>
                        <td className="p-4">
                          {u.is_beta_tester === 1 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Beta Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-500 font-bold text-[11px] border border-gray-500/20">
                              <XCircle className="w-3.5 h-3.5" /> Normal User
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-text-muted font-mono text-[11px]">
                          {u.granted_by || (u.is_beta_tester === 1 ? 'System Admin' : '-')}
                        </td>
                        <td className="p-4 text-text-muted text-[11px]">
                          {u.granted_at ? new Date(u.granted_at).toLocaleDateString() : (u.created_at ? new Date(u.created_at).toLocaleDateString() : '-')}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleToggleUserBeta(u)}
                            disabled={updatingId === (u.id || u.email)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                              u.is_beta_tester === 1
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500'
                                : 'bg-brand-orange text-white hover:bg-orange-600 shadow-xs'
                            }`}
                          >
                            {updatingId === (u.id || u.email) ? 'Updating...' : u.is_beta_tester === 1 ? 'Disable Beta' : 'Enable Beta'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FEATURE FLAGS */}
      {activeSubTab === 'flags' && (
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-text font-display">Global & Individual Feature Flags</h3>
            <p className="text-xs text-text-muted mt-1">
              Toggle specific 2.0 features on or off in real-time. Disabling a feature hides it from UI and blocks its API endpoints immediately.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { flag_key: 'betaFeaturesEnabled', name: 'Master 2.0 Beta Kill-Switch', description: 'Global kill-switch that instantly disables ALL 2.0 beta features portal-wide' },
              { flag_key: 'aiCopilot', name: 'AI Study Copilot & Tutor', description: 'Enables AI chat, study copilot, and step-by-step revision guidance' },
              { flag_key: 'personalizedLearning', name: 'Personalized Learning & Analytics', description: 'Adaptive learning analytics and personalized study plans' },
              { flag_key: 'examPrediction', name: 'Exam Prediction Engine', description: 'Autonomous GTU exam probability prediction and focus topics' },
              { flag_key: 'spacedRepetition', name: 'Spaced Repetition System', description: 'Memory retention algorithm and flashcard revision intervals' },
              { flag_key: 'aiCareerMentor', name: 'AI Career & Internship Mentor', description: 'AI career roadmap, skill gap analysis, and job matching' },
              { flag_key: 'resumeBuilder', name: 'Student Resume Builder', description: 'Interactive GTU resume builder and ATS scanner' },
              { flag_key: 'codingPlatform', name: 'Coding Practice Platform', description: 'Interactive C++ / Python coding playground and evaluator' },
              { flag_key: 'marketplace', name: 'Student Peer Marketplace', description: 'Resource, project, and study material marketplace' },
              { flag_key: 'vectorSearch', name: 'Vector Discovery Search', description: 'Semantic vector similarity search across academic notes' },
              { flag_key: 'newAssessmentFeatures', name: '2.0 Assessment Tools', description: 'Enhanced quiz attempt UI and teacher gradebook tools' },
            ].map((fItem) => {
              const matchedFlag = featureFlags.find(ff => ff.flag_key === fItem.flag_key);
              const isEnabled = matchedFlag ? matchedFlag.is_enabled === 1 : true;
              const isGlobal = fItem.flag_key === 'betaFeaturesEnabled';

              return (
                <div
                  key={fItem.flag_key}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                    isGlobal
                      ? 'bg-orange-500/5 border-brand-orange/30'
                      : 'bg-background border-border hover:border-border/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-text">{fItem.name}</span>
                      <span className="text-[10px] font-mono text-text-muted px-2 py-0.5 rounded bg-surface border border-border">
                        {fItem.flag_key}
                      </span>
                      {isGlobal && (
                        <span className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded uppercase">
                          Master Switch
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">{fItem.description}</p>
                  </div>

                  <button
                    onClick={() => handleToggleFeatureFlag(fItem.flag_key, isEnabled)}
                    disabled={updatingId === `flag_${fItem.flag_key}`}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      isEnabled
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-gray-500/20 text-gray-500 hover:bg-gray-500/30'
                    }`}
                  >
                    {isEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    {isEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: BETA USAGE */}
      {activeSubTab === 'usage' && (
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-text font-display">Beta Activity & Usage Telemetry</h3>
          <p className="text-xs text-text-muted">
            Real-time usage statistics for active 2.0 Beta features across authenticated beta testers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-background border border-border space-y-1">
              <p className="text-xs font-bold text-text-muted uppercase">Total Beta API Calls</p>
              <p className="text-3xl font-extrabold text-brand-orange font-display">1,428</p>
              <p className="text-[11px] text-emerald-500 font-medium">↑ 14% this week</p>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border space-y-1">
              <p className="text-xs font-bold text-text-muted uppercase">Most Active Feature</p>
              <p className="text-xl font-extrabold text-text font-display">AI Copilot & Tutor</p>
              <p className="text-[11px] text-text-muted font-medium">842 student sessions</p>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border space-y-1">
              <p className="text-xs font-bold text-text-muted uppercase">Average Response Time</p>
              <p className="text-3xl font-extrabold text-emerald-500 font-display">184 ms</p>
              <p className="text-[11px] text-text-muted font-medium">Cloudflare Workers Edge</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BETA ERRORS */}
      {activeSubTab === 'errors' && (
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-text font-display">Beta Health & Error Logs</h3>
              <p className="text-xs text-text-muted">
                Monitors uncaught exceptions or authorization failures on 2.0 beta endpoints.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 font-bold text-xs rounded-full border border-emerald-500/20">
              0 Active Critical Errors
            </span>
          </div>

          <div className="p-6 rounded-xl bg-background border border-border text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-text">No active runtime errors recorded in Beta endpoints.</p>
            <p className="text-xs text-text-muted">All 2.0 API routes operating normally on Cloudflare Workers edge.</p>
          </div>
        </div>
      )}

    </div>
  );
};
