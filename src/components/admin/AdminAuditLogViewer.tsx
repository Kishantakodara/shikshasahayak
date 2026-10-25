// ============================================================
// SHIKSHA SAHAYAK OS - ADMIN AUDIT LOG VIEWER COMPONENT
// ============================================================

import React from "react";
import { AdminAuditLogSpec } from "../../types/admin-platform";
import { Shield, Clock, Terminal } from "lucide-react";

interface AdminAuditLogViewerProps {
  logs: AdminAuditLogSpec[];
}

export const AdminAuditLogViewer: React.FC<AdminAuditLogViewerProps> = ({ logs }) => {
  return (
    <div className="bg-[#1C2541]/70 border border-slate-700/60 rounded-2xl p-5 space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Administrative Security Audit Trail</h3>
        </div>
        <span className="text-xs text-slate-400">{logs.length} Recent Events</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Admin</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3">Resource</th>
              <th className="py-2.5 px-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {logs && logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{log.adminId}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px] border border-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 capitalize">{log.resourceType}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 font-mono text-xs">
                  No security or administrative audit records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
