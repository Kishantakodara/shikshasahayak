// ============================================================
// ADMIN REAL-TIME MONITORING SYSTEM
// WebSocket-based alerts and notifications for critical issues
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Settings,
  Wifi,
  WifiOff,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Database,
  FileX,
  Users,
  Pause,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';

export interface MonitorAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'quality' | 'coverage' | 'ingestion' | 'queue' | 'system' | 'performance';
  title: string;
  message: string;
  details?: string;
  actionUrl?: string;
  actionLabel?: string;
  timestamp: string;
  acknowledged: boolean;
  autoAcknowledge?: boolean;
  metadata: Record<string, any>;
}

export interface MonitorMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: { warning: number; critical: number };
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  category: string;
  lastUpdated: string;
}

export interface MonitorSettings {
  enabled: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
  categories: Record<string, boolean>;
  thresholds: Record<string, { warning: number; critical: number }>;
  autoRefreshInterval: number;
}

interface AdminRealtimeMonitorProps {
  onNavigateToIssue?: (alert: MonitorAlert) => void;
  className?: string;
}

export const AdminRealtimeMonitor: React.FC<AdminRealtimeMonitorProps> = ({
  onNavigateToIssue,
  className = '',
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<MonitorAlert[]>([]);
  const [metrics, setMetrics] = useState<MonitorMetric[]>([]);
  const [settings, setSettings] = useState<MonitorSettings>({
    enabled: true,
    soundEnabled: true,
    desktopNotifications: true,
    categories: {
      quality: true,
      coverage: true,
      ingestion: true,
      queue: true,
      system: true,
      performance: true,
    },
    thresholds: {
      qualityScore: { warning: 70, critical: 50 },
      coveragePercent: { warning: 80, critical: 60 },
      queueSize: { warning: 100, critical: 200 },
      failureRate: { warning: 5, critical: 10 },
    },
    autoRefreshInterval: 30,
  });
  const [showPanel, setShowPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!settings.enabled || isPaused) return;

    try {
      // In production, this would be your actual WebSocket endpoint
      const wsUrl = `ws://localhost:3001/admin/monitor?auth=${localStorage.getItem('auth_token')}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        console.log('Monitor WebSocket connected');
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        console.log('Monitor WebSocket disconnected');
        
        // Attempt reconnection
        if (settings.enabled && !isPaused) {
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  }, [settings.enabled, isPaused]);

  // Handle real-time messages
  const handleRealtimeMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'alert':
        handleNewAlert(data.alert);
        break;
      case 'metric_update':
        handleMetricUpdate(data.metric);
        break;
      case 'alert_resolved':
        handleAlertResolved(data.alertId);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }, [settings]);

  const handleNewAlert = (alert: MonitorAlert) => {
    // Check if category is enabled
    if (!settings.categories[alert.category]) return;

    setAlerts(prev => [alert, ...prev.slice(0, 99)]); // Keep last 100 alerts

    // Show toast notification
    const toastOptions = {
      duration: alert.type === 'critical' ? 10000 : 5000,
      action: alert.actionUrl ? {
        label: alert.actionLabel || 'View',
        onClick: () => onNavigateToIssue?.(alert),
      } : undefined,
    };

    switch (alert.type) {
      case 'critical':
        toast.error(`🚨 ${alert.title}`, toastOptions);
        break;
      case 'high':
        toast.warning(`⚠️ ${alert.title}`, toastOptions);
        break;
      case 'medium':
        toast.info(`ℹ️ ${alert.title}`, toastOptions);
        break;
      default:
        toast(`📊 ${alert.title}`, toastOptions);
    }

    // Desktop notification
    if (settings.desktopNotifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`ShikshaSahayak Admin: ${alert.title}`, {
        body: alert.message,
        icon: '/logo.png',
        tag: alert.id,
      });
    }

    // Sound notification
    if (settings.soundEnabled && alert.type !== 'info') {
      playNotificationSound(alert.type);
    }

    // Auto-acknowledge if configured
    if (alert.autoAcknowledge) {
      setTimeout(() => acknowledgeAlert(alert.id), 5000);
    }
  };

  const handleMetricUpdate = (metric: MonitorMetric) => {
    setMetrics(prev => {
      const index = prev.findIndex(m => m.id === metric.id);
      if (index >= 0) {
        const newMetrics = [...prev];
        newMetrics[index] = metric;
        return newMetrics;
      }
      return [...prev, metric];
    });
  };

  const handleAlertResolved = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const playNotificationSound = (type: MonitorAlert['type']) => {
    try {
      const audio = new Audio();
      switch (type) {
        case 'critical':
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSZ+zPLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSZ+zPLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSZ+zPLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSZ+zPLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSZ+zPLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSZ+zPLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSZ+zPLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSZ+zPLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSZ+zPLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSZ+zPLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSZ+zPLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSZ+zPLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwgCSZ+0PLNESUF';
          break;
        case 'high':
          audio.src = 'data:audio/wav;base64,UklGRl4CAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YToCAAC4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4';
          break;
        default:
          audio.src = 'data:audio/wav;base64,UklGRk4CAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YSoCAADBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSZ+zPLNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSZ+zPLNeSs=';
      }
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
      console.log('Error playing notification sound:', error);
    }
  };

  // Initialize connection and polling
  useEffect(() => {
    if (settings.enabled && !isPaused) {
      connectWebSocket();
      
      // Start metrics polling
      metricsIntervalRef.current = setInterval(fetchMetrics, settings.autoRefreshInterval * 1000);
      
      // Initial metrics fetch
      fetchMetrics();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [settings.enabled, isPaused, connectWebSocket]);

  // Mock metrics fetching (replace with actual API call)
  const fetchMetrics = async () => {
    try {
      const mockMetrics: MonitorMetric[] = [
        {
          id: 'quality_score',
          name: 'Overall Quality Score',
          value: Math.floor(Math.random() * 40) + 60,
          unit: '%',
          threshold: { warning: 70, critical: 50 },
          trend: Math.random() > 0.5 ? 'up' : 'down',
          trendPercent: Math.floor(Math.random() * 10),
          category: 'quality',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'coverage_percent',
          name: 'Subject Coverage',
          value: Math.floor(Math.random() * 30) + 70,
          unit: '%',
          threshold: { warning: 80, critical: 60 },
          trend: 'up',
          trendPercent: 3,
          category: 'coverage',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 'queue_size',
          name: 'Review Queue Size',
          value: Math.floor(Math.random() * 150) + 50,
          unit: 'items',
          threshold: { warning: 100, critical: 200 },
          trend: 'stable',
          trendPercent: 0,
          category: 'queue',
          lastUpdated: new Date().toISOString(),
        },
      ];
      
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  // Request desktop notification permission
  useEffect(() => {
    if (settings.desktopNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [settings.desktopNotifications]);

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
  const criticalAlerts = unacknowledgedAlerts.filter(alert => alert.type === 'critical');

  const getAlertIcon = (type: MonitorAlert['type']) => {
    switch (type) {
      case 'critical': return AlertCircle;
      case 'high': return AlertTriangle;
      case 'medium': return Clock;
      default: return CheckCircle2;
    }
  };

  const getAlertColor = (type: MonitorAlert['type']) => {
    switch (type) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'medium': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    }
  };

  const getMetricStatus = (metric: MonitorMetric) => {
    if (metric.value <= metric.threshold.critical) return 'critical';
    if (metric.value <= metric.threshold.warning) return 'warning';
    return 'healthy';
  };

  const getMetricColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-400';
      case 'warning': return 'text-amber-400';
      default: return 'text-emerald-400';
    }
  };
  return (
    <div className={`relative ${className}`}>
      {/* Monitor Status Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
          isConnected && settings.enabled && !isPaused
            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30'
            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
        }`}
      >
        {isConnected && settings.enabled && !isPaused ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        
        <Bell className="w-4 h-4" />
        
        {/* Alert Count Badge */}
        {unacknowledgedAlerts.length > 0 && (
          <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-extrabold flex items-center justify-center ${
            criticalAlerts.length > 0 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-amber-500 text-white'
          }`}>
            {unacknowledgedAlerts.length > 9 ? '9+' : unacknowledgedAlerts.length}
          </span>
        )}
      </button>

      {/* Monitor Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50"
          >
            {/* Panel Header */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white">System Monitor</h3>
                  <div className={`flex items-center gap-1 text-xs ${
                    isConnected && !isPaused ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {isConnected && !isPaused ? (
                      <>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span>Live</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-slate-400 rounded-full" />
                        <span>{isPaused ? 'Paused' : 'Offline'}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                    title={isPaused ? 'Resume monitoring' : 'Pause monitoring'}
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => setShowPanel(false)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-3">
                {metrics.slice(0, 3).map(metric => {
                  const status = getMetricStatus(metric);
                  const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : null;
                  
                  return (
                    <div key={metric.id} className="text-center">
                      <div className={`text-lg font-bold ${getMetricColor(status)}`}>
                        {metric.value}{metric.unit}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
                        <span className="truncate">{metric.name}</span>
                        {TrendIcon && (
                          <TrendIcon className={`w-3 h-3 ${
                            metric.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                          }`} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-slate-800 overflow-hidden"
                >
                  <div className="p-4 space-y-4">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={settings.soundEnabled}
                          onChange={(e) => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-slate-300">Sound notifications</span>
                      </label>
                      
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={settings.desktopNotifications}
                          onChange={(e) => setSettings(prev => ({ ...prev, desktopNotifications: e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-slate-300">Desktop notifications</span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Alert Categories
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(settings.categories).map(([category, enabled]) => (
                          <label key={category} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                categories: { ...prev.categories, [category]: e.target.checked }
                              }))}
                              className="rounded"
                            />
                            <span className="text-slate-300 capitalize">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Alerts List */}
            <div className="max-h-64 overflow-y-auto">
              {unacknowledgedAlerts.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">All systems operational</p>
                  <p className="text-xs mt-1">No active alerts</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {unacknowledgedAlerts.slice(0, 10).map(alert => {
                    const Icon = getAlertIcon(alert.type);
                    
                    return (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}
                      >
                        <div className="flex items-start gap-2">
                          <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="font-bold text-sm truncate">{alert.title}</h4>
                              <span className="text-xs opacity-75 shrink-0">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-xs opacity-90 line-clamp-2 mb-2">{alert.message}</p>
                            
                            <div className="flex items-center gap-2 text-xs">
                              {alert.actionUrl && (
                                <button
                                  onClick={() => {
                                    onNavigateToIssue?.(alert);
                                    setShowPanel(false);
                                  }}
                                  className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition"
                                >
                                  {alert.actionLabel || 'View'}
                                </button>
                              )}
                              
                              <button
                                onClick={() => acknowledgeAlert(alert.id)}
                                className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition"
                              >
                                Acknowledge
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {unacknowledgedAlerts.length > 10 && (
                    <div className="p-2 text-center text-xs text-slate-400">
                      ... and {unacknowledgedAlerts.length - 10} more alerts
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};