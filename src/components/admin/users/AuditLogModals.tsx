// ============================================================
// SHIKSHA SAHAYAK OS: AUDIT LOG INSPECTOR DRAWER & EXPORT DIALOG
// Deep Forensics, JSON Payload Explorer, & Compliance Export
// ============================================================

import React, { useState } from 'react';
import {
  X,
  Shield,
  Clock,
  Terminal,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Server,
  UserCheck,
} from 'lucide-react';
import { AuditLogEntry } from '../../../types/user-management';

// ─── 1. AUDIT LOG DETAIL DRAWER ──────────────────────────────
interface AuditLogDetailDrawerProps {
  log: AuditLogEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogDetailDrawer: React.FC<AuditLogDetailDrawerProps> = ({
  log,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !log) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD'))
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (action.includes('UPDATE') || action.includes('MUTATION'))
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    if (action.includes('DELETE') || action.includes('REVOKE') || action.includes('DEACTIVATE'))
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="bg-[#0F172A] border-l border-slate-800 w-full max-w-lg h-full overflow-y-auto p-6 space-y-6 shadow-2xl flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold border border-amber-500/20">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base leading-snug">Audit Event Inspector</h3>
                <p className="text-xs text-slate-400 font-mono">{log.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Header Banner */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold font-mono border ${getActionBadgeColor(log.action)}`}>
                {log.action}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Admin / Actor</span>
                <span className="font-semibold text-white font-mono truncate block">
                  {log.adminEmail || log.adminId}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Resource Type</span>
                <span className="font-semibold text-slate-200 capitalize block">
                  {log.resourceType} ({log.resourceId || 'N/A'})
                </span>
              </div>
            </div>
          </div>

          {/* Forensic Details */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Network Trace & Identity</p>
            <div className="space-y-2 text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Origin IP:</span>
                <span className="font-mono text-slate-200">{log.ipAddress || '127.0.0.1'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Resource Key:</span>
                <span className="font-mono text-slate-200 truncate max-w-[220px]">{log.resourceId || '-'}</span>
              </div>
            </div>
          </div>

          {/* JSON Payload Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-300 uppercase text-[11px]">Event Payload (JSON)</p>
              <button
                onClick={handleCopyJson}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-64 select-all leading-relaxed">
              {JSON.stringify(log.details || { note: 'No extra payload recorded.' }, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
