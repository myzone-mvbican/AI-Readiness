/**
 * Type-Safe Mutation Utilities
 * 
 * Demonstrates the enhanced type safety for mutations with proper cache invalidation
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { createMutationConfig, createQueryKey } from "@/lib/query-cache";
import type { Assessment, User } from "@shared/types";

/**
 * Example: Type-safe assessment creation with automatic cache invalidation
 */
export function useCreateAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation(createMutationConfig(queryClient, {
    mutationFn: async (data: { surveyId: number; teamId: number }) => {
      const response = await apiRequest("POST", "/api/assessments", data);
      return await response.json();
    },
    onSuccess: (newAssessment: Assessment) => {
      // Type-safe cache invalidation patterns
      console.log("Created assessment:", newAssessment.id);
    },
    invalidateQueries: [
      { type: 'entity', entity: 'assessments' },
      { type: 'user', userId: newAssessment?.userId || 0 },
      { type: 'team', teamId: newAssessment?.teamId || 0 }
    ]
  }));
}

/**
 * Example: Type-safe user update with optimistic updates
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation(createMutationConfig(queryClient, {
    mutationFn: async (userData: Partial<User> & { id: number }) => {
      const response = await apiRequest("PATCH", `/api/users/${userData.id}`, userData);
      return await response.json();
    },
    onMutate: async (userData) => {
      // Optimistic update with type safety
      const userQueryKey = createQueryKey({ entity: 'users', id: 'current' });
      
      await queryClient.cancelQueries({ queryKey: userQueryKey });
      const previousUser = queryClient.getQueryData<User>(userQueryKey);
      
      if (previousUser) {
        queryClient.setQueryData<User>(userQueryKey, {
          ...previousUser,
          ...userData
        });
      }
      
      return { previousUser };
    },
    onError: (err, userData, context) => {
      // Rollback on error
      if (context?.previousUser) {
        const userQueryKey = createQueryKey({ entity: 'users', id: 'current' });
        queryClient.setQueryData(userQueryKey, context.previousUser);
      }
    },
    invalidateQueries: [
      { type: 'entity', entity: 'users' }
    ]
  }));
}