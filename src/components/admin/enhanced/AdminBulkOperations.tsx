// ============================================================
// ADMIN BULK OPERATIONS COMPONENT
// Multi-select, filter-based bulk actions, and background processing
// ============================================================

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Square,
  ChevronDown,
  Play,
  Pause,
  X,
  Filter,
  Download,
  Upload,
  Archive,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  FileCheck,
  Settings,
  Zap,
  BarChart3,
} from 'lucide-react';

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  confirmationRequired?: boolean;
  confirmationMessage?: string;
  requiresInput?: boolean;
  inputType?: 'text' | 'select' | 'textarea';
  inputOptions?: Array<{ value: string; label: string }>;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  category: 'quality' | 'status' | 'organization' | 'export';
}

export interface BulkOperationJob {
  id: string;
  action: string;
  targetCount: number;
  processedCount: number;
  successCount: number;
  errorCount: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  errors: Array<{ id: string; message: string }>;
  metadata: Record<string, any>;
}

interface AdminBulkOperationsProps {
  selectedItems: string[];
  totalItems: number;
  onSelectAll: (selected: boolean) => void;
  onClearSelection: () => void;
  availableActions: BulkAction[];
  onExecuteAction: (actionId: string, itemIds: string[], inputValue?: any) => Promise<string>; // returns job ID
  activeJobs: BulkOperationJob[];
  onCancelJob: (jobId: string) => void;
  filterCriteria?: Record<string, any>;
  onFilterBasedAction?: (actionId: string, filters: Record<string, any>, inputValue?: any) => Promise<string>;
  className?: string;
}

export const AdminBulkOperations: React.FC<AdminBulkOperationsProps> = ({
  selectedItems,
  totalItems,
  onSelectAll,
  onClearSelection,
  availableActions,
  onExecuteAction,
  activeJobs,
  onCancelJob,
  filterCriteria,
  onFilterBasedAction,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAction, setSelectedAction] = useState<BulkAction | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showFilterAction, setShowFilterAction] = useState(false);
  const [showJobMonitor, setShowJobMonitor] = useState(false);

  const hasSelection = selectedItems.length > 0;
  const allSelected = selectedItems.length === totalItems && totalItems > 0;
  const runningJobs = activeJobs.filter(job => job.status === 'running');
  const completedJobs = activeJobs.filter(job => ['completed', 'failed', 'cancelled'].includes(job.status));

  // Auto-expand when items are selected
  useEffect(() => {
    if (hasSelection && !isExpanded) {
      setIsExpanded(true);
    }
  }, [hasSelection, isExpanded]);

  const handleActionSelect = (action: BulkAction) => {
    setSelectedAction(action);
    setInputValue('');
    
    if (action.confirmationRequired) {
      setShowConfirmation(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = async (action: BulkAction, useFilters = false) => {
    if (!action) return;

    try {
      let jobId: string;
      
      if (useFilters && onFilterBasedAction && filterCriteria) {
        jobId = await onFilterBasedAction(action.id, filterCriteria, inputValue || undefined);
      } else {
        jobId = await onExecuteAction(action.id, selectedItems, inputValue || undefined);
      }

      // Clear selection and inputs
      if (!useFilters) {
        onClearSelection();
      }
      setSelectedAction(null);
      setInputValue('');
      setShowConfirmation(false);
      setShowFilterAction(false);
      
      // Show job monitor
      setShowJobMonitor(true);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const getActionColor = (color: BulkAction['color']) => {
    const colorMap = {
      blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30',
      green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30',
      orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/30',
      red: 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30',
      purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30',
    };
    return colorMap[color];
  };

  const getJobStatusColor = (status: BulkOperationJob['status']) => {
    switch (status) {
      case 'running': return 'text-blue-400';
      case 'completed': return 'text-emerald-400';
      case 'failed': return 'text-red-400';
      case 'cancelled': return 'text-slate-400';
      default: return 'text-amber-400';
    }
  };

  if (!hasSelection && runningJobs.length === 0) {
    return null;
  }
  return (
    <div className={`bg-slate-900 border border-slate-700 rounded-xl shadow-lg ${className}`}>
      {/* Selection Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectAll(!allSelected);
            }}
            className="p-1 hover:bg-slate-800 rounded"
          >
            {allSelected ? (
              <CheckSquare className="w-5 h-5 text-orange-400" />
            ) : selectedItems.length > 0 ? (
              <div className="w-5 h-5 bg-orange-500/20 border-2 border-orange-400 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-orange-400 rounded-sm" />
              </div>
            ) : (
              <Square className="w-5 h-5 text-slate-400" />
            )}
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">
                {selectedItems.length} selected
              </span>
              {runningJobs.length > 0 && (
                <div className="flex items-center gap-2 text-blue-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{runningJobs.length} job{runningJobs.length !== 1 ? 's' : ''} running</span>
                </div>
              )}
            </div>
            {selectedItems.length > 0 && (
              <span className="text-xs text-slate-400">
                {((selectedItems.length / totalItems) * 100).toFixed(1)}% of total items
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {runningJobs.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowJobMonitor(!showJobMonitor);
              }}
              className="px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-sm font-bold hover:bg-blue-500/30 transition"
            >
              Monitor Jobs
            </button>
          )}
          
          {selectedItems.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearSelection();
              }}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          <ChevronDown 
            className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {/* Expanded Actions Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-800 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Action Categories */}
              {['quality', 'status', 'organization', 'export'].map(category => {
                const categoryActions = availableActions.filter(action => action.category === category);
                if (categoryActions.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {category} Actions
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {categoryActions.map(action => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.id}
                            onClick={() => handleActionSelect(action)}
                            disabled={selectedItems.length === 0}
                            className={`p-3 border rounded-xl text-left transition-all group ${
                              selectedItems.length === 0 
                                ? 'opacity-50 cursor-not-allowed' 
                                : getActionColor(action.color)
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-4 h-4" />
                              <span className="font-bold text-sm">{action.label}</span>
                            </div>
                            <p className="text-xs opacity-80">{action.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Filter-Based Actions */}
              {onFilterBasedAction && filterCriteria && Object.keys(filterCriteria).length > 0 && (
                <div className="pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Apply to All Filtered Items
                    </div>
                    <button
                      onClick={() => setShowFilterAction(!showFilterAction)}
                      className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold hover:bg-purple-500/30 transition"
                    >
                      <Filter className="w-3 h-3 inline mr-1" />
                      Filter Actions
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {showFilterAction && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 overflow-hidden"
                      >
                        <p className="text-xs text-purple-300 mb-3">
                          These actions will apply to ALL items matching your current filters:
                        </p>
                        <div className="text-xs text-slate-400 mb-3">
                          {Object.entries(filterCriteria).map(([key, value]) => (
                            <span key={key} className="inline-block mr-3">
                              {key}: <strong className="text-purple-300">{String(value)}</strong>
                            </span>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {availableActions.slice(0, 6).map(action => {
                            const Icon = action.icon;
                            return (
                              <button
                                key={action.id}
                                onClick={() => {
                                  setSelectedAction(action);
                                  executeAction(action, true);
                                }}
                                className={`p-2 border rounded-lg text-left transition-all text-xs ${getActionColor(action.color)}`}
                              >
                                <Icon className="w-3 h-3 inline mr-1" />
                                {action.label}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job Monitor Panel */}
      <AnimatePresence>
        {showJobMonitor && (runningJobs.length > 0 || completedJobs.length > 0) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-800 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white">Background Jobs</h4>
                <button
                  onClick={() => setShowJobMonitor(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {[...runningJobs, ...completedJobs.slice(-5)].map(job => (
                  <div
                    key={job.id}
                    className="p-3 bg-slate-800/60 border border-slate-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {availableActions.find(a => a.id === job.action)?.label || job.action}
                        </span>
                        <span className={`text-xs font-bold ${getJobStatusColor(job.status)}`}>
                          {job.status.toUpperCase()}
                        </span>
                      </div>
                      {job.status === 'running' && (
                        <button
                          onClick={() => onCancelJob(job.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {job.status === 'running' && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>{job.processedCount} / {job.targetCount} items</span>
                          <span>{((job.processedCount / job.targetCount) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${(job.processedCount / job.targetCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {job.status === 'completed' && (
                      <div className="text-xs text-slate-400">
                        Completed {job.successCount} items
                        {job.errorCount > 0 && (
                          <span className="text-red-400 ml-2">• {job.errorCount} errors</span>
                        )}
                      </div>
                    )}

                    {job.errorCount > 0 && job.errors.length > 0 && (
                      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs">
                        <details>
                          <summary className="cursor-pointer text-red-300 font-bold">
                            View Errors ({job.errorCount})
                          </summary>
                          <div className="mt-2 space-y-1 text-red-400">
                            {job.errors.slice(0, 3).map((error, i) => (
                              <div key={i}>• {error.message}</div>
                            ))}
                            {job.errors.length > 3 && (
                              <div>• ... and {job.errors.length - 3} more</div>
                            )}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && selectedAction && (
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
              className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Confirm Action</h3>
              </div>
              
              <p className="text-slate-300 mb-4">
                {selectedAction.confirmationMessage || 
                 `Are you sure you want to ${selectedAction.label.toLowerCase()} ${selectedItems.length} selected items?`}
              </p>

              {selectedAction.requiresInput && (
                <div className="mb-4">
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    {selectedAction.inputType === 'textarea' ? 'Reason/Comments' : 'Value'}
                  </label>
                  {selectedAction.inputType === 'textarea' ? (
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                      rows={3}
                      placeholder="Enter reason for this action..."
                    />
                  ) : selectedAction.inputType === 'select' ? (
                    <select
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    >
                      <option value="">Select...</option>
                      {selectedAction.inputOptions?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                      placeholder="Enter value..."
                    />
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setSelectedAction(null);
                    setInputValue('');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeAction(selectedAction)}
                  disabled={selectedAction.requiresInput && !inputValue.trim()}
                  className={`px-4 py-2 rounded-lg font-bold transition ${
                    selectedAction.requiresInput && !inputValue.trim()
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : getActionColor(selectedAction.color)
                  }`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};