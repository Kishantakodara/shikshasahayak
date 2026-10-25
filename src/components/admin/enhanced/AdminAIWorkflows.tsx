// ============================================================
// ADMIN AI-ASSISTED WORKFLOWS
// Smart categorization, automated quality scoring, and pattern recognition
// ============================================================

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Brain,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Layers,
  Filter,
  Play,
  Pause,
  Settings,
  Eye,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Loader2,
  Zap,
  Target,
  Clock,
  Star,
} from 'lucide-react';

export interface AIWorkflowSuggestion {
  id: string;
  type: 'categorization' | 'quality_scoring' | 'duplicate_detection' | 'curriculum_mapping' | 'pattern_recognition';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  estimatedTime: string;
  affectedItems: number;
  preview: {
    before: any;
    after: any;
    changes: string[];
  };
  metadata: Record<string, any>;
}

export interface AIWorkflowJob {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'reviewing';
  progress: number;
  processedItems: number;
  totalItems: number;
  results: {
    accepted: number;
    rejected: number;
    flagged: number;
  };
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface AIInsight {
  id: string;
  category: 'quality_trend' | 'coverage_gap' | 'difficulty_imbalance' | 'topic_clustering' | 'performance_prediction';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  actionable: boolean;
  suggestedAction?: string;
  data: any;
  generatedAt: string;
}

interface AdminAIWorkflowsProps {
  onExecuteWorkflow: (suggestionId: string, parameters?: any) => Promise<string>;
  onAcceptSuggestion: (suggestionId: string) => Promise<void>;
  onRejectSuggestion: (suggestionId: string, reason?: string) => Promise<void>;
  className?: string;
}

export const AdminAIWorkflows: React.FC<AdminAIWorkflowsProps> = ({
  onExecuteWorkflow,
  onAcceptSuggestion,
  onRejectSuggestion,
  className = '',
}) => {
  const [suggestions, setSuggestions] = useState<AIWorkflowSuggestion[]>([]);
  const [activeJobs, setActiveJobs] = useState<AIWorkflowJob[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AIWorkflowSuggestion | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'jobs' | 'insights'>('suggestions');

  // Fetch AI suggestions
  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      // Mock AI suggestions (replace with actual API)
      const mockSuggestions: AIWorkflowSuggestion[] = [
        {
          id: '1',
          type: 'categorization',
          title: 'Auto-categorize 150 uncategorized questions',
          description: 'AI has identified topic patterns for questions missing curriculum mapping',
          confidence: 0.92,
          impact: 'high',
          estimatedTime: '5 minutes',
          affectedItems: 150,
          preview: {
            before: { status: 'uncategorized', topic: null },
            after: { status: 'categorized', topic: 'Database Normalization' },
            changes: ['Assign 45 questions to Unit 3', 'Map 105 questions to specific topics']
          },
          metadata: { subjects: ['DBMS', 'Database Systems'], accuracy: 0.92 }
        },
        {
          id: '2',
          type: 'quality_scoring',
          title: 'Bulk quality assessment for 250 staged questions',
          description: 'Automated quality scoring using advanced NLP analysis',
          confidence: 0.88,
          impact: 'high',
          estimatedTime: '3 minutes',
          affectedItems: 250,
          preview: {
            before: { quality_score: null, status: 'staged' },
            after: { quality_score: 85, status: 'verified' },
            changes: ['180 questions marked as high quality', '70 questions flagged for review']
          },
          metadata: { criteria: ['clarity', 'completeness', 'difficulty'], threshold: 75 }
        },
        {
          id: '3',
          type: 'duplicate_detection',
          title: 'Identify 12 new duplicate clusters',
          description: 'Advanced semantic similarity analysis found recurring question patterns',
          confidence: 0.95,
          impact: 'medium',
          estimatedTime: '2 minutes',
          affectedItems: 45,
          preview: {
            before: { duplicate_cluster: null },
            after: { duplicate_cluster: 'cluster_456', canonical: true },
            changes: ['Group 45 similar questions into 12 clusters', 'Mark 33 as duplicates']
          },
          metadata: { similarity_threshold: 0.85, subjects: ['OS', 'Computer Networks'] }
        }
      ];

      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Failed to fetch AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch AI insights
  const fetchInsights = useCallback(async () => {
    try {
      const mockInsights: AIInsight[] = [
        {
          id: '1',
          category: 'quality_trend',
          title: 'Quality scores declining for Computer Networks subject',
          description: 'Average quality score dropped 15% over last month. Pattern suggests topic complexity mismatch.',
          severity: 'warning',
          actionable: true,
          suggestedAction: 'Review curriculum mapping for Units 4-6',
          data: { subject: 'Computer Networks', trend: -15, timeframe: '30 days' },
          generatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          category: 'coverage_gap',
          title: 'Critical coverage gap in Operating Systems Unit 5',
          description: 'Only 12% of questions cover memory management topics, well below curriculum requirements.',
          severity: 'critical',
          actionable: true,
          suggestedAction: 'Generate practice questions for memory management',
          data: { subject: 'Operating Systems', unit: 5, coverage: 12, required: 60 },
          generatedAt: new Date().toISOString(),
        }
      ];

      setInsights(mockInsights);
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
    }
  }, []);

  // Simulate job progress
  const simulateJobProgress = useCallback((jobId: string) => {
    const interval = setInterval(() => {
      setActiveJobs(prev => prev.map(job => {
        if (job.id !== jobId) return job;
        
        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(interval);
          return job;
        }

        const newProgress = Math.min(job.progress + Math.random() * 15, 100);
        const newProcessed = Math.floor((newProgress / 100) * job.totalItems);
        
        if (newProgress >= 100) {
          return {
            ...job,
            status: 'completed' as const,
            progress: 100,
            processedItems: job.totalItems,
            completedAt: new Date().toISOString(),
            results: {
              accepted: Math.floor(job.totalItems * 0.8),
              rejected: Math.floor(job.totalItems * 0.1),
              flagged: Math.floor(job.totalItems * 0.1),
            }
          };
        }

        return {
          ...job,
          progress: newProgress,
          processedItems: newProcessed,
        };
      }));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleExecuteWorkflow = async (suggestion: AIWorkflowSuggestion) => {
    try {
      const jobId = await onExecuteWorkflow(suggestion.id);
      
      // Add job to active jobs
      const newJob: AIWorkflowJob = {
        id: jobId,
        type: suggestion.type,
        status: 'running',
        progress: 0,
        processedItems: 0,
        totalItems: suggestion.affectedItems,
        results: { accepted: 0, rejected: 0, flagged: 0 },
        startedAt: new Date().toISOString(),
      };

      setActiveJobs(prev => [newJob, ...prev]);
      
      // Simulate progress
      simulateJobProgress(jobId);
      
      // Remove suggestion
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      setSelectedSuggestion(null);
      setShowPreview(false);
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    fetchInsights();
  }, [fetchSuggestions, fetchInsights]);

  const getSuggestionIcon = (type: AIWorkflowSuggestion['type']) => {
    switch (type) {
      case 'categorization': return Layers;
      case 'quality_scoring': return Star;
      case 'duplicate_detection': return Target;
      case 'curriculum_mapping': return BarChart3;
      case 'pattern_recognition': return Brain;
      default: return Sparkles;
    }
  };

  const getImpactColor = (impact: AIWorkflowSuggestion['impact']) => {
    switch (impact) {
      case 'high': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'medium': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    }
  };

  const getInsightColor = (severity: AIInsight['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'warning': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      case 'info': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    }
  };

  return (
    <div className={`bg-slate-900 border border-slate-700 rounded-xl ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white">AI Workflow Assistant</h3>
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-xs font-bold">
              BETA
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoMode(!autoMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                autoMode 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
              }`}
            >
              {autoMode ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              Auto Mode
            </button>
            
            <button
              onClick={fetchSuggestions}
              disabled={loading}
              className="px-3 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold hover:bg-purple-500/30 transition"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-3 bg-slate-800/50 rounded-lg p-1">
          {[
            { id: 'suggestions', label: 'Suggestions', count: suggestions.length },
            { id: 'jobs', label: 'Active Jobs', count: activeJobs.filter(j => j.status === 'running').length },
            { id: 'insights', label: 'AI Insights', count: insights.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      {/* Content */}
      <div className="p-4">
        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-3" />
                <p className="text-slate-400">Analyzing data patterns...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400">No AI suggestions available</p>
                <p className="text-xs text-slate-500 mt-1">Check back in a few minutes for new insights</p>
              </div>
            ) : (
              suggestions.map(suggestion => {
                const Icon = getSuggestionIcon(suggestion.type);
                
                return (
                  <div
                    key={suggestion.id}
                    className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800/70 transition"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 text-purple-400 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-sm">{suggestion.title}</h4>
                          <p className="text-xs text-slate-400 mt-1">{suggestion.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getImpactColor(suggestion.impact)}`}>
                          {suggestion.impact.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400">
                          {Math.round(suggestion.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 text-xs">
                      <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                        <div className="font-bold text-emerald-400">{suggestion.affectedItems}</div>
                        <div className="text-slate-400">Items</div>
                      </div>
                      <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                        <div className="font-bold text-blue-400">{suggestion.estimatedTime}</div>
                        <div className="text-slate-400">Est. Time</div>
                      </div>
                      <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                        <div className="font-bold text-purple-400">{Math.round(suggestion.confidence * 100)}%</div>
                        <div className="text-slate-400">Accuracy</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setSelectedSuggestion(suggestion);
                          setShowPreview(true);
                        }}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600 rounded-lg text-xs font-bold transition"
                      >
                        <Eye className="w-3 h-3 inline mr-1" />
                        Preview
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onRejectSuggestion(suggestion.id)}
                          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold transition"
                        >
                          <ThumbsDown className="w-3 h-3 inline mr-1" />
                          Reject
                        </button>
                        
                        <button
                          onClick={() => handleExecuteWorkflow(suggestion)}
                          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition"
                        >
                          <Play className="w-3 h-3 inline mr-1" />
                          Execute
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Active Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            {activeJobs.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400">No active AI jobs</p>
              </div>
            ) : (
              activeJobs.map(job => (
                <div
                  key={job.id}
                  className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-white text-sm capitalize">
                        {job.type.replace('_', ' ')} Job
                      </h4>
                      <p className="text-xs text-slate-400">
                        {job.processedItems} / {job.totalItems} items processed
                      </p>
                    </div>
                    
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      job.status === 'running' ? 'bg-blue-500/20 text-blue-300' :
                      job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {job.status.toUpperCase()}
                    </span>
                  </div>

                  {job.status === 'running' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(job.progress)}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {job.status === 'completed' && (
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="text-center p-2 bg-emerald-500/10 rounded-lg">
                        <div className="font-bold text-emerald-400">{job.results.accepted}</div>
                        <div className="text-slate-400">Accepted</div>
                      </div>
                      <div className="text-center p-2 bg-amber-500/10 rounded-lg">
                        <div className="font-bold text-amber-400">{job.results.flagged}</div>
                        <div className="text-slate-400">Flagged</div>
                      </div>
                      <div className="text-center p-2 bg-red-500/10 rounded-lg">
                        <div className="font-bold text-red-400">{job.results.rejected}</div>
                        <div className="text-slate-400">Rejected</div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {insights.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400">No AI insights available</p>
              </div>
            ) : (
              insights.map(insight => (
                <div
                  key={insight.id}
                  className={`p-4 border rounded-xl ${getInsightColor(insight.severity)}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="font-bold text-sm">{insight.title}</h4>
                      <p className="text-xs opacity-90 mt-1">{insight.description}</p>
                    </div>
                    <span className="text-xs opacity-75 shrink-0">
                      {new Date(insight.generatedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  {insight.actionable && insight.suggestedAction && (
                    <div className="mt-3 p-2 bg-black/20 rounded-lg">
                      <div className="flex items-center gap-2 text-xs">
                        <Zap className="w-3 h-3" />
                        <span className="font-bold">Suggested Action:</span>
                        <span>{insight.suggestedAction}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && selectedSuggestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">AI Workflow Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <h4 className="font-bold text-white mb-2">{selectedSuggestion.title}</h4>
                  <p className="text-sm text-slate-300 mb-3">{selectedSuggestion.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">Confidence:</span>
                      <span className="ml-2 text-purple-400 font-bold">
                        {Math.round(selectedSuggestion.confidence * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Affected Items:</span>
                      <span className="ml-2 text-emerald-400 font-bold">
                        {selectedSuggestion.affectedItems}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <h4 className="font-bold text-white mb-3">Expected Changes</h4>
                  <div className="space-y-3">
                    {selectedSuggestion.preview.changes.map((change, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-slate-300">{change}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <h5 className="font-bold text-red-300 text-sm mb-2">Before</h5>
                    <pre className="text-xs text-red-200 overflow-x-auto">
                      {JSON.stringify(selectedSuggestion.preview.before, null, 2)}
                    </pre>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <h5 className="font-bold text-emerald-300 text-sm mb-2">After</h5>
                    <pre className="text-xs text-emerald-200 overflow-x-auto">
                      {JSON.stringify(selectedSuggestion.preview.after, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleExecuteWorkflow(selectedSuggestion)}
                    className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg font-bold transition"
                  >
                    Execute Workflow
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};