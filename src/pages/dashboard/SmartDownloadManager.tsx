import React, { useState } from 'react';
import { 
  Download, HardDrive, FileText, Trash2, RefreshCw, CheckCircle2, 
  Wifi, WifiOff, ArrowRight, ShieldCheck, Database, Layers, Pause,
  Play, Search, Filter, AlertCircle, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLearningEcosystem } from '../../context/LearningEcosystemContext';

interface ActiveTransfer {
  id: string;
  filename: string;
  subject: string;
  size: string;
  progress: number;
  status: 'Downloading' | 'Paused' | 'Completed';
  speed: string;
}

export const SmartDownloadManager: React.FC = () => {
  const { downloads, removeDownload, storageUsageBytes } = useLearningEcosystem();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'completed' | 'active' | 'offline'>('completed');
  const [offlineMode, setOfflineMode] = useState(false);

  const [activeTransfers, setActiveTransfers] = useState<ActiveTransfer[]>([
    {
      id: 'trans-1',
      filename: 'GTU_DBMS_Unit3_Normalization_Notes.pdf',
      subject: 'Database Management Systems',
      size: '14.2 MB',
      progress: 68,
      status: 'Downloading',
      speed: '3.4 MB/s'
    },
    {
      id: 'trans-2',
      filename: 'GATE_2024_Computer_Science_Solved_Archive.pdf',
      subject: 'Computer Science',
      size: '28.5 MB',
      progress: 35,
      status: 'Downloading',
      speed: '2.1 MB/s'
    }
  ]);

  const togglePause = (id: string) => {
    setActiveTransfers(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: t.status === 'Downloading' ? 'Paused' : 'Downloading'
        };
      }
      return t;
    }));
  };

  const totalStorageLimitBytes = 5 * 1024 * 1024 * 1024; // 5 GB simulated local cache limit
  const storagePercent = Math.min(100, Math.round((storageUsageBytes / totalStorageLimitBytes) * 100));

  return (
    <div className="space-y-6 pb-12 font-sans text-left text-slate-900 dark:text-slate-100">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-navy-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-orange/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-xs font-bold">
              <Download className="w-3.5 h-3.5" />
              <span>Smart Offline Download Manager</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Download & Offline Storage Manager
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Manage offline study notes, cached PYQ papers, and video lectures for continuous offline reading.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 dark:bg-slate-950/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-brand-orange/20 text-brand-orange flex items-center justify-center font-extrabold">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-300">Device Cache Storage Meter</div>
              <div className="text-sm font-extrabold text-white mt-0.5">1.4 GB / 5.0 GB Used</div>
              <div className="w-36 bg-white/20 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-brand-orange h-full rounded-full transition-all" style={{ width: `28%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'completed' ? 'bg-brand-orange text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Completed ({downloads.length + 3})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'active' ? 'bg-brand-orange text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Active Transfers ({activeTransfers.length})
            </button>
          </div>

          {/* Offline Toggle & Search */}
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search downloaded files..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <button
              onClick={() => setOfflineMode(!offlineMode)}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer border transition ${
                offlineMode ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {offlineMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span>{offlineMode ? 'Offline Mode Active' : 'Online Sync'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE TRANSFERS TAB */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Active Progressing Downloads</h3>

          <div className="space-y-3">
            {activeTransfers.map(transfer => (
              <div key={transfer.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white">{transfer.filename}</h4>
                    <p className="text-slate-500">{transfer.subject} • {transfer.size}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold font-mono text-brand-orange">{transfer.speed}</span>
                    <button
                      onClick={() => togglePause(transfer.id)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                    >
                      {transfer.status === 'Downloading' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>Status: {transfer.status}</span>
                    <span>{transfer.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-orange rounded-full transition-all" style={{ width: `${transfer.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPLETED TAB */}
      {activeTab === 'completed' && (
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Completed & Offline Ready Material</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: '1', title: 'GTU Database Management Systems Handwritten Notes', size: '12.4 MB', date: '2 hours ago', type: 'PDF Document' },
              { id: '2', title: 'Data Structures & Algorithms Complete GATE Question Bank', size: '24.1 MB', date: 'Yesterday', type: 'PDF Document' },
              { id: '3', title: 'Operating Systems CPU Scheduling Lab Manual', size: '8.5 MB', date: '3 days ago', type: 'Code & PDF' }
            ].map(file => (
              <div key={file.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl flex items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950 text-brand-orange flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{file.title}</h4>
                    <p className="text-[11px] text-slate-500">{file.size} • {file.type} • {file.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Offline Ready
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartDownloadManager;
