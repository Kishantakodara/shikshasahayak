// ============================================================
// SHIKSHA SAHAYAK OS - PERFORMANCE HEALTH BADGE COMPONENT
// ============================================================

import React, { useEffect, useState } from "react";
import { PerformanceHealthSummary } from "../../types/performance-scaling";
import { fetchPerformanceHealthSummary } from "../../api/performanceScalingClient";
import { Activity, Zap, AlertTriangle, XCircle } from "lucide-react";

interface PerformanceHealthBadgeProps {
  className?: string;
}

export const PerformanceHealthBadge: React.FC<PerformanceHealthBadgeProps> = ({
  className = "",
}) => {
  const [health, setHealth] = useState<PerformanceHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceHealthSummary().then((summary) => {
      setHealth(summary);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
        <span className="text-[11px] text-slate-500 font-medium">Checking...</span>
      </div>
    );
  }

  if (!health) return null;

  const configs = {
    healthy: {
      dot: "bg-emerald-400",
      text: "text-emerald-400",
      label: "All Systems Operational",
      icon: <Zap className="w-3 h-3" />,
      pulse: "animate-pulse",
    },
    degraded: {
      dot: "bg-amber-400",
      text: "text-amber-400",
      label: "Partial Degradation",
      icon: <AlertTriangle className="w-3 h-3" />,
      pulse: "",
    },
    critical: {
      dot: "bg-rose-500",
      text: "text-rose-400",
      label: "Critical Issues",
      icon: <XCircle className="w-3 h-3" />,
      pulse: "",
    },
  };

  const cfg = configs[health.healthStatus];

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-slate-700/60 rounded-full ${className}`}
      title={`Avg Latency: ${health.averageLatencyMs}ms | Error Rate: ${health.errorRate}% | ${health.totalRequests} requests`}
    >
      <div className={`w-2 h-2 rounded-full ${cfg.dot} ${cfg.pulse}`} />
      <span className={`text-[11px] font-semibold ${cfg.text} flex items-center gap-1`}>
        {cfg.icon}
        {cfg.label}
      </span>
      <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
        {health.averageLatencyMs}ms avg
      </span>
    </div>
  );
};
