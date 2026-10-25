// ============================================================
// ADMIN PERFORMANCE OPTIMIZATION HOOKS
// Virtual scrolling, intelligent prefetching, and caching
// ============================================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useIntersectionObserver } from './useIntersectionObserver';

// Cache management
class AdminCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize = 100;

  set(key: string, data: any, ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  invalidate(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  size() {
    return this.cache.size;
  }
}

const adminCache = new AdminCache();

// Virtual scrolling hook
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight)
    );
    
    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex: Math.min(items.length - 1, endIndex + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      item,
      index: visibleRange.startIndex + index,
    }));
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

// Intelligent data fetching with caching and prefetching
export function useAdminData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    enabled?: boolean;
    refreshInterval?: number;
    cacheTime?: number;
    prefetch?: boolean;
    dependencies?: any[];
  } = {}
) {
  const {
    enabled = true,
    refreshInterval,
    cacheTime = 5 * 60 * 1000,
    prefetch = false,
    dependencies = [],
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check cache first
    const cached = adminCache.get(key);
    if (cached && !force) {
      setData(cached);
      setLastFetch(Date.now());
      return cached;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current();
      setData(result);
      setLastFetch(Date.now());
      
      // Cache the result
      adminCache.set(key, result, cacheTime);
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Fetch failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, enabled, cacheTime]);

  // Initial fetch and dependency-based refetch
  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  // Refresh interval
  useEffect(() => {
    if (!refreshInterval || !enabled) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchData, refreshInterval, enabled]);

  // Prefetch on component mount
  useEffect(() => {
    if (prefetch && enabled) {
      // Prefetch in next tick to not block initial render
      setTimeout(() => fetchData(), 0);
    }
  }, [prefetch, enabled]);

  const invalidate = useCallback(() => {
    adminCache.invalidate(key);
    return fetchData(true);
  }, [key, fetchData]);

  const isStale = lastFetch && (Date.now() - lastFetch > cacheTime);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    invalidate,
    isStale,
  };
}

// Lazy loading hook for tab content
export function useTabLazyLoading(activeTab: string, tabName: string) {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (activeTab === tabName) {
      setShouldLoad(true);
      // Mark as loaded after a short delay to avoid unnecessary re-renders
      setTimeout(() => setHasLoaded(true), 100);
    }
  }, [activeTab, tabName]);

  // Once loaded, keep it loaded for better UX (can be configured)
  const shouldRender = shouldLoad || hasLoaded;

  return {
    shouldRender,
    hasLoaded,
    isActive: activeTab === tabName,
  };
}

// Debounced search hook
export function useDebouncedSearch(
  searchFunction: (query: string, filters: Record<string, any>) => Promise<any>,
  delay = 300
) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeSearch = useCallback(async (searchQuery: string, searchFilters: Record<string, any>) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!searchQuery.trim() && Object.keys(searchFilters).length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const result = await searchFunction(searchQuery, searchFilters);
      
      if (!abortControllerRef.current.signal.aborted) {
        setResults(result.data || result);
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        setError(err instanceof Error ? err : new Error('Search failed'));
        setResults([]);
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [searchFunction]);

  // Debounced search effect
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      executeSearch(query, filters);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, filters, executeSearch, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    loading,
    error,
    executeSearch: () => executeSearch(query, filters),
  };
}

// Background job monitoring hook
export function useBackgroundJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [polling, setPolling] = useState(false);
  
  const pollJobs = useCallback(async () => {
    try {
      setPolling(true);
      // This would be your actual API call
      const response = await fetch('/api/admin/background-jobs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to poll background jobs:', error);
    } finally {
      setPolling(false);
    }
  }, []);

  useEffect(() => {
    // Poll every 2 seconds for active jobs
    const interval = setInterval(pollJobs, 2000);
    
    // Initial poll
    pollJobs();
    
    return () => clearInterval(interval);
  }, [pollJobs]);

  const runningJobs = jobs.filter(job => job.status === 'running');
  const hasActiveJobs = runningJobs.length > 0;

  return {
    jobs,
    runningJobs,
    hasActiveJobs,
    polling,
    refetch: pollJobs,
  };
}

// Performance monitoring hook
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    apiCallCount: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
  });

  const startTime = useRef<number>(0);

  useEffect(() => {
    startTime.current = performance.now();
  }, []);

  const recordRender = useCallback(() => {
    const renderTime = performance.now() - startTime.current;
    setMetrics(prev => ({ ...prev, renderTime }));
  }, []);

  const recordApiCall = useCallback(() => {
    setMetrics(prev => ({ ...prev, apiCallCount: prev.apiCallCount + 1 }));
  }, []);

  useEffect(() => {
    // Update cache hit rate
    const totalRequests = metrics.apiCallCount;
    const cacheSize = adminCache.size();
    const cacheHitRate = totalRequests > 0 ? (cacheSize / totalRequests) * 100 : 0;
    
    setMetrics(prev => ({ ...prev, cacheHitRate }));
  }, [metrics.apiCallCount]);

  useEffect(() => {
    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memoryInfo.usedJSHeapSize / 1024 / 1024, // MB
      }));
    }
  }, []);

  return {
    metrics,
    recordRender,
    recordApiCall,
    clearCache: () => adminCache.invalidate(),
  };
}

export { adminCache };