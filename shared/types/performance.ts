/**
 * Performance Optimization Types
 * 
 * This file defines types for query caching, performance monitoring,
 * and optimization patterns used throughout the application.
 */

/**
 * Query Cache Types
 */
export interface QueryCacheKey {
  entity: 'assessments' | 'users' | 'teams' | 'surveys' | 'benchmarks';
  id?: number | string;
  filters?: Record<string, any>;
  userId?: number;
  teamId?: number;
}

export type CacheInvalidationPattern = 
  | { type: 'exact'; key: QueryCacheKey }
  | { type: 'prefix'; pattern: string }
  | { type: 'entity'; entity: QueryCacheKey['entity'] }
  | { type: 'user'; userId: number }
  | { type: 'team'; teamId: number };

/**
 * Query Configuration
 */
export interface QueryConfig {
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  retry?: number | boolean;
  retryDelay?: number;
}

/**
 * Mutation Configuration
 */
export interface MutationConfig<TData = any, TVariables = any> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
  invalidateQueries?: CacheInvalidationPattern[];
}

/**
 * Performance Monitoring Types
 */
export interface PerformanceMetrics {
  queryTime: number;
  renderTime: number;
  memoryUsage: number;
  timestamp: Date;
}

export interface QueryMetrics {
  queryKey: string;
  duration: number;
  status: 'success' | 'error' | 'loading';
  cacheHit: boolean;
  errorCount: number;
}

/**
 * Optimization Strategies
 */
export interface LazyLoadConfig {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export interface VirtualizationConfig {
  itemHeight: number;
  overscan?: number;
  estimatedItemSize?: number;
}

/**
 * Cache Management
 */
export interface CacheStrategy {
  type: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
  compression?: boolean;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: Date;
  expiry?: Date;
  size: number;
  accessCount: number;
  lastAccessed: Date;
}

/**
 * Prefetch Strategies
 */
export interface PrefetchConfig {
  trigger: 'hover' | 'visible' | 'mount' | 'manual';
  delay?: number;
  conditions?: () => boolean;
}

/**
 * Debounce and Throttle Types
 */
export interface DebounceConfig {
  delay: number;
  immediate?: boolean;
  maxWait?: number;
}

export interface ThrottleConfig {
  interval: number;
  leading?: boolean;
  trailing?: boolean;
}

/**
 * Batch Processing Types
 */
export interface BatchConfig<T = any> {
  maxBatchSize: number;
  flushInterval: number;
  processor: (items: T[]) => Promise<void>;
}

export interface BatchItem<T = any> {
  id: string;
  data: T;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high';
}

/**
 * Resource Loading Types
 */
export interface ResourceConfig {
  preload?: string[];
  lazy?: string[];
  critical?: string[];
}

export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  stage?: string;
  error?: string;
}

/**
 * Memory Management
 */
export interface MemoryConfig {
  maxCacheSize: number;
  gcThreshold: number;
  gcInterval: number;
}

export interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
  entries: number;
}