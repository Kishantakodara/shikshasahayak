// ============================================================
// ADMIN ADVANCED ANALYTICS DASHBOARD
// Enhanced metrics, trend analysis, predictive coverage alerts
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  BookOpen,
  Database,
  Zap,
  Filter,
  Calendar,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  format: 'number' | 'percentage' | 'time' | 'size';
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  status: 'healthy' | 'warning' | 'critical';
  target?: number;
  category: 'quality' | 'coverage' | 'performance' | 'engagement';
}

export interface TrendDataPoint {
  timestamp: string;
  value: number;
  label: string;
}

export interface PredictiveAlert {
  id: string;
  type: 'coverage_drop' | 'quality_decline' | 'engagement_drop' | 'capacity_issue';
  title: string;
  description: string;
  probability: number;
  timeframe: string;
  impact: 'high' | 'medium' | 'low';
  suggestedActions: string[];
  data: Record<string, any>;
}

export interface AnalyticsFilter {
  dateRange: 'last7d' | 'last30d' | 'last90d' | 'custom';
  customStart?: string;
  customEnd?: string;
  subjects?: string[];
  semesters?: number[];
  categories: string[];
}

interface AdminAdvancedAnalyticsProps {
  onExportReport?: (filters: AnalyticsFilter) => Promise<void>;
  onDrillDown?: (metric: AnalyticsMetric) => void;
  className?: string;
}

export const AdminAdvancedAnalytics: React.FC<AdminAdvancedAnalyticsProps> = ({
  onExportReport,
  onDrillDown,
  className = '',
}) => {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [trendData, setTrendData] = useState<Record<string, TrendDataPoint[]>>({});
  const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveAlert[]>([]);
  const [filters, setFilters] = useState<AnalyticsFilter>({
    dateRange: 'last30d',
    subjects: [],
    semesters: [],
    categories: ['quality', 'coverage', 'performance', 'engagement'],
  });
  const [selectedMetric, setSelectedMetric] = useState<AnalyticsMetric | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  // Generate mock analytics data
  const generateMockData = () => {
    const mockMetrics: AnalyticsMetric[] = [
      {
        id: 'overall_quality',
        name: 'Overall Quality Score',
        value: 84.2,
        previousValue: 81.7,
        unit: '%',
        format: 'percentage',
        trend: 'up',
        trendPercent: 3.1,
        status: 'healthy',
        target: 85,
        category: 'quality',
      },
      {
        id: 'subject_coverage',
        name: 'Subject Coverage',
        value: 92.5,
        previousValue: 89.3,
        unit: '%',
        format: 'percentage',
        trend: 'up',
        trendPercent: 3.6,
        status: 'healthy',
        target: 95,
        category: 'coverage',
      },
      {
        id: 'verification_rate',
        name: 'Verification Rate',
        value: 76.8,
        previousValue: 82.1,
        unit: '%',
        format: 'percentage',
        trend: 'down',
        trendPercent: -6.5,
        status: 'warning',
        target: 80,
        category: 'performance',
      },
      {
        id: 'avg_response_time',
        name: 'Avg Response Time',
        value: 340,
        previousValue: 280,
        unit: 'ms',
        format: 'time',
        trend: 'up',
        trendPercent: 21.4,
        status: 'critical',
        target: 300,
        category: 'performance',
      },
      {
        id: 'daily_active_reviewers',
        name: 'Active Reviewers',
        value: 12,
        previousValue: 15,
        unit: 'users',
        format: 'number',
        trend: 'down',
        trendPercent: -20,
        status: 'warning',
        target: 18,
        category: 'engagement',
      },
      {
        id: 'question_bank_size',
        name: 'Question Bank Size',
        value: 12847,
        previousValue: 12203,
        unit: 'questions',
        format: 'number',
        trend: 'up',
        trendPercent: 5.3,
        status: 'healthy',
        category: 'coverage',
      },
    ];

    const mockAlerts: PredictiveAlert[] = [
      {
        id: '1',
        type: 'coverage_drop',
        title: 'Predicted Coverage Drop in Computer Networks',
        description: 'ML model predicts 15% coverage decrease in next 2 weeks based on current ingestion patterns',
        probability: 0.78,
        timeframe: '2 weeks',
        impact: 'high',
        suggestedActions: [
          'Schedule additional paper ingestion sessions',
          'Review curriculum gaps in Units 4-6',
          'Increase AI question generation for underrepresented topics'
        ],
        data: { subject: 'Computer Networks', predicted_drop: 15, confidence: 0.78 }
      },
      {
        id: '2',
        type: 'quality_decline',
        title: 'Quality Score Trend Declining',
        description: 'Quality metrics showing downward trend across multiple subjects, likely due to automated ingestion',
        probability: 0.65,
        timeframe: '1 week',
        impact: 'medium',
        suggestedActions: [
          'Increase manual review frequency',
          'Adjust AI quality thresholds',
          'Add additional quality checks for auto-approved items'
        ],
        data: { affected_subjects: 5, avg_decline: 8.2, confidence: 0.65 }
      }
    ];

    // Generate trend data
    const mockTrendData: Record<string, TrendDataPoint[]> = {};
    mockMetrics.forEach(metric => {
      mockTrendData[metric.id] = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          timestamp: date.toISOString(),
          value: metric.value + (Math.random() - 0.5) * (metric.value * 0.2),
          label: date.toLocaleDateString(),
        };
      });
    });

    setMetrics(mockMetrics);
    setPredictiveAlerts(mockAlerts);
    setTrendData(mockTrendData);
  };

  useEffect(() => {
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      generateMockData();
      setLoading(false);
    }, 1000);
  }, [filters]);

  const filteredMetrics = useMemo(() => {
    return metrics.filter(metric => filters.categories.includes(metric.category));
  }, [metrics, filters.categories]);

  const formatValue = (value: number, format: AnalyticsMetric['format'], unit: string) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'time':
        return `${Math.round(value)}${unit}`;
      case 'size':
        if (value > 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} GB`;
        if (value > 1024) return `${(value / 1024).toFixed(1)} MB`;
        return `${value} KB`;
      default:
        return `${value.toLocaleString()} ${unit}`;
    }
  };

  const getMetricStatusColor = (status: AnalyticsMetric['status']) => {
    switch (status) {
      case 'healthy': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'warning': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
    }
  };

  const getTrendIcon = (trend: AnalyticsMetric['trend']) => {
    switch (trend) {
      case 'up': return ArrowUpRight;
      case 'down': return ArrowDownRight;
      case 'stable': return Minus;
    }
  };

  const getTrendColor = (trend: AnalyticsMetric['trend'], isPositive = true) => {
    if (trend === 'stable') return 'text-slate-400';
    const shouldBeGreen = (trend === 'up' && isPositive) || (trend === 'down' && !isPositive);
    return shouldBeGreen ? 'text-emerald-400' : 'text-red-400';
  };

  const getPredictiveAlertColor = (probability: number) => {
    if (probability >= 0.8) return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (probability >= 0.6) return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            Advanced Analytics
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Predictive insights and trend analysis for question intelligence
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-sm font-bold transition flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
            className="px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg text-sm"
          >
            <option value="last7d">Last 7 days</option>
            <option value="last30d">Last 30 days</option>
            <option value="last90d">Last 90 days</option>
            <option value="custom">Custom range</option>
          </select>

          {onExportReport && (
            <button
              onClick={() => onExportReport(filters)}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg text-sm font-bold transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {['quality', 'coverage', 'performance', 'engagement'].map(category => (
                    <label key={category} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={(e) => {
                          setFilters(prev => ({
                            ...prev,
                            categories: e.target.checked
                              ? [...prev.categories, category]
                              : prev.categories.filter(c => c !== category)
                          }));
                        }}
                        className="rounded"
                      />
                      <span className="text-slate-300 capitalize">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {filters.dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.customStart || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, customStart: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.customEnd || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, customEnd: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMetrics.map(metric => {
          const TrendIcon = getTrendIcon(metric.trend);
          const isPositiveTrend = ['overall_quality', 'subject_coverage', 'question_bank_size'].includes(metric.id);
          
          return (
            <motion.div
              key={metric.id}
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800/50 transition cursor-pointer"
              onClick={() => {
                setSelectedMetric(metric);
                onDrillDown?.(metric);
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-white text-sm">{metric.name}</h3>
                  <div className="text-2xl font-black text-white mt-1">
                    {formatValue(metric.value, metric.format, metric.unit)}
                  </div>
                </div>
                
                <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getMetricStatusColor(metric.status)}`}>
                  {metric.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1 text-xs font-bold ${getTrendColor(metric.trend, isPositiveTrend)}`}>
                  <TrendIcon className="w-3 h-3" />
                  <span>
                    {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}
                    {Math.abs(metric.trendPercent).toFixed(1)}%
                  </span>
                </div>

                {metric.target && (
                  <div className="text-xs text-slate-400">
                    Target: {formatValue(metric.target, metric.format, metric.unit)}
                  </div>
                )}
              </div>

              {/* Progress bar for targets */}
              {metric.target && (
                <div className="mt-3">
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        metric.value >= metric.target ? 'bg-emerald-500' : 
                        metric.value >= metric.target * 0.8 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Predictive Alerts */}
      {predictiveAlerts.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white">Predictive Alerts</h3>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs font-bold">
                AI POWERED
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {predictiveAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 border rounded-xl ${getPredictiveAlertColor(alert.probability)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{alert.title}</h4>
                    <p className="text-xs opacity-90 mt-1">{alert.description}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="text-xs font-bold">
                      {Math.round(alert.probability * 100)}% probability
                    </div>
                    <div className="text-xs opacity-75">{alert.timeframe}</div>
                  </div>
                </div>

                <div className="space-y-2 mt-3">
                  <div className="text-xs font-bold opacity-75">Suggested Actions:</div>
                  {alert.suggestedActions.map((action, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs">
                      <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0 opacity-60" />
                      <span className="opacity-90">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Trends */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            Quality Performance
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <div className="text-lg font-bold text-emerald-400">85.2%</div>
                <div className="text-xs text-slate-400">Avg Quality</div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <div className="text-lg font-bold text-blue-400">1,247</div>
                <div className="text-xs text-slate-400">High Quality</div>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <div className="text-lg font-bold text-amber-400">156</div>
                <div className="text-xs text-slate-400">Need Review</div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { subject: 'Operating Systems', score: 91.2, trend: 'up' },
                { subject: 'Database Management', score: 88.7, trend: 'up' },
                { subject: 'Computer Networks', score: 82.1, trend: 'down' },
                { subject: 'Data Structures', score: 79.6, trend: 'stable' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg text-sm">
                  <span className="text-slate-300">{item.subject}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{item.score}%</span>
                    <div className={`w-2 h-2 rounded-full ${
                      item.trend === 'up' ? 'bg-emerald-400' :
                      item.trend === 'down' ? 'bg-red-400' : 'bg-slate-400'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coverage Analysis */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Coverage Analysis
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <div className="text-lg font-bold text-blue-400">92.5%</div>
                <div className="text-xs text-slate-400">Overall</div>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <div className="text-lg font-bold text-emerald-400">28</div>
                <div className="text-xs text-slate-400">Subjects</div>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <div className="text-lg font-bold text-amber-400">5</div>
                <div className="text-xs text-slate-400">Gaps</div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { semester: 'Semester 1', coverage: 96.8, color: 'emerald' },
                { semester: 'Semester 2', coverage: 94.2, color: 'emerald' },
                { semester: 'Semester 3', coverage: 91.7, color: 'blue' },
                { semester: 'Semester 4', coverage: 87.3, color: 'amber' },
              ].map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{item.semester}</span>
                    <span className="text-white font-bold">{item.coverage}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full bg-${item.color}-500`}
                      style={{ width: `${item.coverage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Performance Insights
          </h3>
          <span className="text-xs text-slate-400">Updated 2 minutes ago</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Processing Speed',
              value: '340ms avg',
              status: 'warning',
              description: 'Response time increased 21% this week',
              icon: Zap,
            },
            {
              title: 'Queue Health',
              value: '156 items',
              status: 'healthy',
              description: 'Within normal parameters',
              icon: Clock,
            },
            {
              title: 'Active Users',
              value: '12 reviewers',
              status: 'warning',
              description: '20% decrease in active reviewers',
              icon: Users,
            },
            {
              title: 'System Load',
              value: '68% CPU',
              status: 'healthy',
              description: 'Optimal performance range',
              icon: Database,
            },
          ].map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div key={index} className="p-4 bg-slate-800/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {insight.title}
                  </span>
                </div>
                <div className="text-lg font-bold text-white mb-1">{insight.value}</div>
                <div className="text-xs text-slate-400">{insight.description}</div>
                <div className="mt-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${getMetricStatusColor(insight.status as any)}`}>
                    {insight.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white font-bold">Analyzing data patterns...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};