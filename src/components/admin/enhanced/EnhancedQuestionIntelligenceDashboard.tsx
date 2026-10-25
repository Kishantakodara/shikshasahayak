// ============================================================
// ENHANCED QUESTION INTELLIGENCE DASHBOARD
// Integrates all productivity components for maximum efficiency
// ============================================================

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  RefreshCw,
  Settings,
  Zap,
  Search,
  Filter,
  Activity,
  Bell,
  Grid,
  List,
  Play,
  Pause,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { toast } from 'sonner';

// Import our new enhanced components
import { AdminGlobalSearch } from './AdminGlobalSearch';
import { AdminBulkOperations } from './AdminBulkOperations';
import { AdminRealtimeMonitor } from './AdminRealtimeMonitor';
import { AdminAIWorkflows } from './AdminAIWorkflows';
import { AdminAdvancedAnalytics } from './AdminAdvancedAnalytics';

// Import performance hooks
import { 
  useAdminData, 
  useTabLazyLoading, 
  useDebouncedSearch, 
  useVirtualScroll,
  usePerformanceMetrics 
} from '../../../hooks/useAdminPerformance';

// Import existing types
import {
  adminQuestionIntelligenceClient,
  QuestionIntelligenceOverviewSnapshot,
  MatrixSubjectRow,
  QuestionInspectorDetail,
} from '../../../api/adminQuestionIntelligenceClient';

interface EnhancedQuestionIntelligenceDashboardProps {
  className?: string;
}

export const EnhancedQuestionIntelligenceDashboard: React.FC<EnhancedQuestionIntelligenceDashboardProps> = ({
  className = '',
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchFilters, setSearchFilters] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Performance monitoring
  const { metrics, recordRender, recordApiCall } = usePerformanceMetrics();

  // Data fetching with caching and performance optimization
  const {
    data: overview,
    loading: overviewLoading,
    refetch: refetchOverview,
  } = useAdminData(
    'question-intelligence-overview',
    () => {
      recordApiCall();
      return adminQuestionIntelligenceClient.getOverview().then(res => res.snapshot);
    },
    {
      refreshInterval: autoRefresh ? 30000 : undefined,
      cacheTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const {
    data: matrixData,
    loading: matrixLoading,
    refetch: refetchMatrix,
  } = useAdminData(
    'question-intelligence-matrix',
    () => {
      recordApiCall();
      return adminQuestionIntelligenceClient.getMatrix().then(res => res.matrix);
    },
    {
      refreshInterval: autoRefresh ? 60000 : undefined,
      enabled: activeTab === 'matrix',
    }
  );

  // Tab lazy loading
  const overviewTab = useTabLazyLoading(activeTab, 'overview');
  const matrixTab = useTabLazyLoading(activeTab, 'matrix');
  const analyticsTab = useTabLazyLoading(activeTab, 'analytics');
  const aiTab = useTabLazyLoading(activeTab, 'ai-workflows');

  // Debounced search
  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    loading: searchLoading,
    executeSearch,
  } = useDebouncedSearch(
    async (query, filters) => {
      recordApiCall();
      return adminQuestionIntelligenceClient.searchQuestions({
        q: query,
        ...filters,
        pageSize: 50,
      });
    },
    300
  );

  // Virtual scrolling for large lists
  const {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll,
  } = useVirtualScroll({
    items: searchResults,
    itemHeight: 120,
    containerHeight: 600,
    overscan: 5,
  });

  // Global search configuration
  const searchFilters_config = useMemo(() => [
    {
      id: 'subjectCode',
      label: 'Subject',
      type: 'select' as const,
      options: [
        { value: 'CS101', label: 'Computer Programming' },
        { value: 'CS201', label: 'Data Structures' },
        { value: 'CS301', label: 'Operating Systems' },
        { value: 'CS401', label: 'Database Management' },
        { value: 'CS501', label: 'Computer Networks' },
      ],
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'verified', label: 'Verified' },
        { value: 'staged', label: 'Staged' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'archived', label: 'Archived' },
      ],
    },
    {
      id: 'difficulty',
      label: 'Difficulty',
      type: 'select' as const,
      options: [
        { value: 'easy', label: 'Easy' },
        { value: 'medium', label: 'Medium' },
        { value: 'hard', label: 'Hard' },
      ],
    },
    {
      id: 'qualityScore',
      label: 'Quality Score',
      type: 'text' as const,
      placeholder: 'Min score (0-100)',
    },
  ], []);

  // Bulk operations configuration
  const availableBulkActions = useMemo(() => [
    {
      id: 'approve',
      label: 'Approve Selected',
      icon: Zap,
      description: 'Move selected items to verified status',
      category: 'status' as const,
      color: 'green' as const,
      confirmationRequired: true,
    },
    {
      id: 'reject',
      label: 'Reject Selected',
      icon: Zap,
      description: 'Reject selected items with reason',
      category: 'status' as const,
      color: 'red' as const,
      confirmationRequired: true,
      requiresInput: true,
      inputType: 'textarea' as const,
    },
    {
      id: 'archive',
      label: 'Archive Selected',
      icon: Zap,
      description: 'Archive selected duplicate items',
      category: 'organization' as const,
      color: 'blue' as const,
    },
    {
      id: 'bulk_quality_check',
      label: 'AI Quality Check',
      icon: Zap,
      description: 'Run AI quality assessment on selected items',
      category: 'quality' as const,
      color: 'purple' as const,
    },
  ], []);

  // Handle search result selection
  const handleSearchResultSelect = useCallback((result: any) => {
    switch (result.type) {
      case 'question':
        // Navigate to question detail
        toast.info(`Opening question: ${result.title}`);
        break;
      case 'duplicate-cluster':
        setActiveTab('duplicates');
        break;
      case 'subject':
        setSearchFilters({ subjectCode: result.metadata.code });
        break;
      default:
        toast.info(`Selected: ${result.title}`);
    }
  }, []);

  // Handle bulk operations
  const handleBulkAction = useCallback(async (
    actionId: string,
    itemIds: string[],
    inputValue?: any
  ): Promise<string> => {
    recordApiCall();
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const jobId = `job_${Date.now()}`;
    toast.success(`Started ${actionId} job for ${itemIds.length} items`);
    
    return jobId;
  }, [recordApiCall]);

  // Handle filter-based bulk actions
  const handleFilterBasedAction = useCallback(async (
    actionId: string,
    filters: Record<string, any>,
    inputValue?: any
  ): Promise<string> => {
    recordApiCall();
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const jobId = `filter_job_${Date.now()}`;
    toast.success(`Started filter-based ${actionId} job`);
    
    return jobId;
  }, [recordApiCall]);

  // Handle AI workflow execution
  const handleAIWorkflowExecution = useCallback(async (
    suggestionId: string,
    parameters?: any
  ): Promise<string> => {
    recordApiCall();
    
    // Simulate AI workflow execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const jobId = `ai_job_${Date.now()}`;
    toast.success('AI workflow started successfully');
    
    return jobId;
  }, [recordApiCall]);

  // Save search functionality
  const handleSaveSearch = useCallback((name: string, query: string, filters: Record<string, any>) => {
    // Save to localStorage or API
    const savedSearches = JSON.parse(localStorage.getItem('admin_saved_searches') || '[]');
    const newSearch = {
      id: Date.now().toString(),
      name,
      query,
      filters,
      createdAt: new Date().toISOString(),
      usageCount: 1,
    };
    
    savedSearches.push(newSearch);
    localStorage.setItem('admin_saved_searches', JSON.stringify(savedSearches));
    
    toast.success(`Search "${name}" saved successfully`);
  }, []);

  // Get saved searches
  const savedSearches = useMemo(() => {
    return JSON.parse(localStorage.getItem('admin_saved_searches') || '[]');
  }, []);

  // Performance monitoring
  useEffect(() => {
    recordRender();
  }, [recordRender]);

  // Auto-refresh control
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAutoRefresh(false);
      } else {
        setAutoRefresh(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const refreshAllData = useCallback(() => {
    refetchOverview();
    refetchMatrix();
    executeSearch();
    toast.success('Data refreshed');
  }, [refetchOverview, refetchMatrix, executeSearch]);

  return (
    <div className={`space-y-6 pb-12 ${isFullscreen ? 'fixed inset-0 bg-slate-950 z-50 p-6 overflow-y-auto' : ''} ${className}`}>
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-100 flex items-center gap-2.5">
              <Layers className="w-8 h-8 text-orange-500" />
              Enhanced Question Intelligence
            </h1>
            <span className="bg-gradient-to-r from-orange-500 to-purple-500 text-white border border-orange-500/30 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Productivity Suite
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            AI-powered analytics, bulk operations, real-time monitoring, and intelligent workflows for maximum productivity.
          </p>

          {/* Performance Metrics Display */}
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <span>Render: {metrics.renderTime.toFixed(0)}ms</span>
            <span>API Calls: {metrics.apiCallCount}</span>
            <span>Cache Hit: {metrics.cacheHitRate.toFixed(0)}%</span>
            {metrics.memoryUsage > 0 && <span>Memory: {metrics.memoryUsage.toFixed(1)}MB</span>}
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Real-time Monitor */}
          <AdminRealtimeMonitor />

          {/* View Mode Toggle */}
          <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition ${
                viewMode === 'grid' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition ${
                viewMode === 'list' 
                  ? 'bg-orange-500 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Auto-refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 border rounded-lg text-sm font-bold transition flex items-center gap-2 ${
              autoRefresh
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {autoRefresh ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            Auto-refresh
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-lg transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Refresh Button */}
          <button
            onClick={refreshAllData}
            disabled={overviewLoading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-sm font-bold transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${overviewLoading ? 'animate-spin text-orange-400' : ''}`} />
            Refresh All
          </button>
        </div>
      </div>

      {/* Global Search */}
      <AdminGlobalSearch
        onResultSelect={handleSearchResultSelect}
        onFilterChange={setSearchFilters}
        availableFilters={searchFilters_config}
        savedSearches={savedSearches}
        onSaveSearch={handleSaveSearch}
      />

      {/* Bulk Operations Panel */}
      <AdminBulkOperations
        selectedItems={selectedItems}
        totalItems={searchResults.length}
        onSelectAll={(selected) => {
          if (selected) {
            setSelectedItems(searchResults.map((_, index) => `item_${index}`));
          } else {
            setSelectedItems([]);
          }
        }}
        onClearSelection={() => setSelectedItems([])}
        availableActions={availableBulkActions}
        onExecuteAction={handleBulkAction}
        activeJobs={[]} // Would come from job monitoring hook
        onCancelJob={() => {}}
        filterCriteria={searchFilters}
        onFilterBasedAction={handleFilterBasedAction}
      />

      {/* AI Workflows Assistant */}
      <AdminAIWorkflows
        onExecuteWorkflow={handleAIWorkflowExecution}
        onAcceptSuggestion={async () => {}}
        onRejectSuggestion={async () => {}}
      />

      {/* Enhanced Tab Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-lg">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'overview', label: '📊 Smart Overview', component: overviewTab },
            { id: 'analytics', label: '📈 Advanced Analytics', component: analyticsTab },
            { id: 'matrix', label: '🗺️ Coverage Matrix', component: matrixTab },
            { id: 'ai-workflows', label: '🤖 AI Workflows', component: aiTab },
            { id: 'search', label: '🔍 Intelligent Search' },
            { id: 'quality', label: '⭐ Quality Center' },
            { id: 'duplicates', label: '🔁 Duplicate Intelligence' },
            { id: 'moderation', label: '🛡️ Moderation Queue' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-orange-500 to-purple-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content with Lazy Loading */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overview Tab */}
          {overviewTab.shouldRender && activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Key Metrics */}
                {overview && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Health Score</div>
                      <div className="text-2xl font-black text-emerald-400">{overview.overallHealthScore}%</div>
                    </div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Coverage</div>
                      <div className="text-2xl font-black text-blue-400">{overview.coverageScore}%</div>
                    </div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Verified</div>
                      <div className="text-2xl font-black text-white">{overview.verifiedQuestions}</div>
                    </div>
                    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Staged</div>
                      <div className="text-2xl font-black text-amber-400">{overview.stagedQuestions}</div>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="font-bold text-white mb-4">Intelligence Summary</h3>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Original PYQs</span>
                        <span className="text-orange-400 font-bold">{overview?.originalPyqCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">AI Generated</span>
                        <span className="text-cyan-400 font-bold">{overview?.aiGeneratedCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Duplicate Clusters</span>
                        <span className="text-purple-400 font-bold">{overview?.duplicateClusterCount || 0}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Subjects Covered</span>
                        <span className="text-emerald-400 font-bold">{overview?.subjectsCovered || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sessions Covered</span>
                        <span className="text-blue-400 font-bold">{overview?.sessionsCovered || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Failed Ingestion</span>
                        <span className="text-red-400 font-bold">{overview?.failedIngestionCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Panel */}
              <div className="space-y-6">
                {/* AI Insights */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    AI Insights
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <div className="text-emerald-300 font-bold mb-1">Quality Improving</div>
                      <div className="text-emerald-200 text-xs">Average scores up 3.2% this week</div>
                    </div>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <div className="text-amber-300 font-bold mb-1">Coverage Gap Detected</div>
                      <div className="text-amber-200 text-xs">Unit 5 needs more questions</div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h4 className="font-bold text-white mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-sm font-bold transition">
                      Bulk Approve Staged (156)
                    </button>
                    <button className="w-full p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg text-sm font-bold transition">
                      Run AI Quality Check
                    </button>
                    <button className="w-full p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-sm font-bold transition">
                      Generate Coverage Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Analytics Tab */}
          {analyticsTab.shouldRender && activeTab === 'analytics' && (
            <AdminAdvancedAnalytics
              onExportReport={async () => { toast.success('Report exported'); }}
              onDrillDown={(metric) => toast.info(`Drilling down into ${metric.name}`)}
            />
          )}

          {/* Other tabs would be implemented here with lazy loading */}
          {activeTab === 'search' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-bold text-white mb-4">Intelligent Search Results</h3>
              <div className="text-slate-400">
                Use the global search above to find questions, subjects, and patterns across your database.
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
