import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export function useUser() {
  const { user } = useAuth();
  
  // If we already have the user from auth context, return it
  if (user) {
    return { user, isLoading: false };
  }

  // Otherwise, fetch the user data
  const { data, isLoading } = useQuery({
    queryKey: ["/api/user"],
    // Only execute this query if we don't have the user already
    enabled: !user,
  });

  return {
    user: data || null,
    isLoading,
  };
}