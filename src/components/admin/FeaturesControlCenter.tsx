import React, { useState, useEffect } from 'react';
import {
  Flag,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Brain,
  Code,
  BookOpen,
  FileText,
  WifiOff,
  Briefcase,
  Layers,
  Search,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithAuth } from '../../api/client';

interface FeatureItem {
  flagKey: string;
  name: string;
  description: string;
  category: 'AI & Copilot' | 'Academic Tools' | 'Core Ecosystem' | 'Student Utilities';
  icon: React.ComponentType<{ className?: string }>;
  isMaster?: boolean;
}

const FEATURE_CATALOG: FeatureItem[] = [
  {
    flagKey: 'betaFeaturesEnabled',
    name: 'Master 2.0 Feature Kill-Switch',
    description: 'Global master switch that instantly enables or pauses all 2.0 experimental features portal-wide.',
    category: 'Core Ecosystem',
    icon: Zap,
    isMaster: true,
  },
  {
    flagKey: 'contentFactoryAI',
    name: 'Content Factory (AI)',
    description: 'Autonomous AI note generator and study material synthesizer for university curricula.',
    category: 'AI & Copilot',
    icon: Sparkles,
  },
  {
    flagKey: 'aiCopilot',
    name: 'AI Study Copilot & Tutor',
    description: 'Real-time contextual conversational study assistant with step-by-step academic problem solving.',
    category: 'AI & Copilot',
    icon: Brain,
  },
  {
    flagKey: 'quizSystem',
    name: 'Interactive Quiz & Assessment System',
    description: 'Student test attempts, real-time grading, timer enforcement, and teacher assessment tools.',
    category: 'Academic Tools',
    icon: FileText,
  },
  {
    flagKey: 'practiceZone',
    name: 'Practice Zone & Mock Exams',
    description: 'GTU question bank practice arena with streak tracking and subject-wise accuracy analysis.',
    category: 'Academic Tools',
    icon: BookOpen,
  },
  {
    flagKey: 'codingPlatform',
    name: 'Code Playground & IDE',
    description: 'Online browser-based code editor and compiler for engineering programming subjects.',
    category: 'Academic Tools',
    icon: Code,
  },
  {
    flagKey: 'offlineMode',
    name: 'PWA Offline Mode & Downloads',
    description: 'IndexedDB offline caching of study documents and question papers without network connection.',
    category: 'Student Utilities',
    icon: WifiOff,
  },
  {
    flagKey: 'aiCareerMentor',
    name: 'AI Career & Internship Mentor',
    description: 'Personalized career roadmap generator, skill gap diagnostics, and interview preparation.',
    category: 'Student Utilities',
    icon: Briefcase,
  },
  {
    flagKey: 'resumeBuilder',
    name: 'Student Resume Builder',
    description: 'ATS-optimized resume synthesizer with GTU engineering templates.',
    category: 'Student Utilities',
    icon: Layers,
  },
  {
    flagKey: 'personalizedLearning',
    name: 'Adaptive Learning Analytics',
    description: 'Student weak-area detection and custom tailored revision recommendations.',
    category: 'AI & Copilot',
    icon: Cpu,
  },
];

export const FeaturesControlCenter: React.FC = () => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [updatingFlag, setUpdatingFlag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/v1/admin/beta');
      const data = await res.json();
      if (res.ok && data.featureFlags) {
        const flagMap: Record<string, boolean> = {};
        data.featureFlags.forEach((f: any) => {
          flagMap[f.flag_key] = f.is_enabled === 1;
        });
        // Ensure master switch is mapped
        if (data.betaStats?.globalBetaEnabled !== undefined) {
          flagMap['betaFeaturesEnabled'] = data.betaStats.globalBetaEnabled;
        }
        setFlags(flagMap);
      }
    } catch (err) {
      toast.error('Network failure loading feature flags.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = async (flagKey: string) => {
    const currentStatus = flags[flagKey] ?? true;
    const newStatus = !currentStatus;
    setUpdatingFlag(flagKey);

    try {
      const res = await fetchWithAuth('/api/v1/admin/beta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_feature_flag',
          flagKey,
          enabled: newStatus,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFlags((prev) => ({ ...prev, [flagKey]: newStatus }));
        toast.success(`Feature '${flagKey}' is now ${newStatus ? 'ENABLED' : 'DISABLED'}`);
      } else {
        toast.error(data.error || 'Failed to update feature flag.');
      }
    } catch (err) {
      toast.error('Network failure updating feature flag.');
    } finally {
      setUpdatingFlag(null);
    }
  };

  const categories = ['All', 'Core Ecosystem', 'AI & Copilot', 'Academic Tools', 'Student Utilities'];

  const filteredFeatures = FEATURE_CATALOG.filter((f) => {
    const matchesQuery =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.flagKey.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const masterEnabled = flags['betaFeaturesEnabled'] ?? true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0F172A] p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Flag className="w-4 h-4" /> Real-time Feature Flags Engine
          </div>
          <h2 className="text-2xl font-extrabold text-white">Features Control Center</h2>
          <p className="text-xs text-slate-400 mt-1">
            Centrally enable, disable, or gate major portal modules in real time without redeploying code.
          </p>
        </div>

        <button
          onClick={fetchFlags}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Flags
        </button>
      </div>

      {/* Master Switch Alert Banner */}
      <div
        className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
          masterEnabled
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold border shrink-0 ${
              masterEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-red-500/20 text-red-400 border-red-500/40'
            }`}
          >
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-base">Global 2.0 Feature Master Switch</h3>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                  masterEnabled
                    ? 'bg-emerald-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {masterEnabled ? 'ACTIVE (ONLINE)' : 'EMERGENCY PAUSE (OFFLINE)'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {masterEnabled
                ? 'All portal features and experimental sub-systems are operating normally.'
                : 'Master kill-switch active: All beta & advanced features are suppressed portal-wide.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleToggle('betaFeaturesEnabled')}
          disabled={updatingFlag === 'betaFeaturesEnabled'}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 shrink-0 ${
            masterEnabled
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
              : 'bg-red-500 hover:bg-red-600 text-white shadow-md'
          }`}
        >
          {masterEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          {updatingFlag === 'betaFeaturesEnabled'
            ? 'Updating...'
            : masterEnabled
            ? 'ENABLED'
            : 'DISABLED'}
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-[#0F172A] p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search feature flags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFeatures.map((item) => {
          const isEnabled = flags[item.flagKey] ?? true;
          const Icon = item.icon;
          const isUpdating = updatingFlag === item.flagKey;

          return (
            <div
              key={item.flagKey}
              className={`bg-[#0F172A] p-5 rounded-2xl border transition flex flex-col justify-between gap-4 ${
                isEnabled
                  ? 'border-slate-800 hover:border-slate-700'
                  : 'border-slate-800/60 opacity-80'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold border shrink-0 ${
                    isEnabled
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-white text-sm">{item.name}</h4>
                    <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {item.flagKey}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400">
                  Category: <span className="text-slate-300">{item.category}</span>
                </span>

                <button
                  onClick={() => handleToggle(item.flagKey)}
                  disabled={isUpdating}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
                    isEnabled
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  {isUpdating ? 'Updating...' : isEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
