/**
 * Query Cache Management
 * 
 * Provides type-safe query cache operations with performance optimizations
 */

import { QueryClient } from "@tanstack/react-query";
import type { 
  QueryCacheKey, 
  CacheInvalidationPattern, 
  QueryConfig,
  MutationConfig 
} from "@shared/types/performance";

/**
 * Create standardized query keys
 */
export function createQueryKey(config: QueryCacheKey): string[] {
  const parts = ['/api', config.entity];
  
  if (config.id !== undefined) {
    parts.push(config.id.toString());
  }
  
  if (config.userId) {
    parts.push('user', config.userId.toString());
  }
  
  if (config.teamId) {
    parts.push('team', config.teamId.toString());
  }
  
  if (config.filters && Object.keys(config.filters).length > 0) {
    parts.push('filters', JSON.stringify(config.filters));
  }
  
  return parts;
}

/**
 * Type-safe cache invalidation
 */
export function invalidateQueries(
  queryClient: QueryClient, 
  patterns: CacheInvalidationPattern[]
): void {
  patterns.forEach(pattern => {
    switch (pattern.type) {
      case 'exact':
        queryClient.invalidateQueries({
          queryKey: createQueryKey(pattern.key),
          exact: true
        });
        break;
        
      case 'prefix':
        queryClient.invalidateQueries({
          queryKey: [pattern.pattern],
          type: 'all'
        });
        break;
        
      case 'entity':
        queryClient.invalidateQueries({
          queryKey: ['/api', pattern.entity],
          type: 'all'
        });
        break;
        
      case 'user':
        queryClient.invalidateQueries({
          queryKey: ['/api'],
          predicate: (query) => {
            const key = query.queryKey as string[];
            return key.includes('user') && key.includes(pattern.userId.toString());
          }
        });
        break;
        
      case 'team':
        queryClient.invalidateQueries({
          queryKey: ['/api'],
          predicate: (query) => {
            const key = query.queryKey as string[];
            return key.includes('team') && key.includes(pattern.teamId.toString());
          }
        });
        break;
    }
  });
}

/**
 * Default query configurations for different entity types
 */
export const queryConfigs: Record<QueryCacheKey['entity'], QueryConfig> = {
  assessments: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3
  },
  users: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2
  },
  teams: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 2
  },
  surveys: {
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 2
  },
  benchmarks: {
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 4 * 60 * 60 * 1000, // 4 hours
    refetchOnWindowFocus: false,
    retry: 1
  }
};

/**
 * Get optimized query configuration for an entity
 */
export function getQueryConfig(entity: QueryCacheKey['entity']): QueryConfig {
  return queryConfigs[entity] || {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2
  };
}

/**
 * Create a type-safe mutation configuration
 */
export function createMutationConfig<TData = any, TVariables = any>(
  queryClient: QueryClient,
  config: MutationConfig<TData, TVariables>
): MutationConfig<TData, TVariables> {
  return {
    ...config,
    onSuccess: (data, variables) => {
      // Invalidate queries if specified
      if (config.invalidateQueries) {
        invalidateQueries(queryClient, config.invalidateQueries);
      }
      
      // Call custom onSuccess handler
      config.onSuccess?.(data, variables);
    }
  };
}