import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useLocation } from "wouter";
import {
  useMutation,
  useQuery,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  apiRequest,
  queryClient,
  UNAUTHORIZED_EVENT,
  getQueryFn,
} from "@/lib/queryClient";
import { User } from "@shared/types";
import { useToast } from "@/hooks/use-toast";
import { clearGuestAssessmentData } from "@/lib/localStorage";
import { ApiResponse } from "@shared/types/api-standard";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  loginMutation: UseMutationResult<LoginResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<RegisterResponse, Error, RegisterData>;
  googleLoginMutation: UseMutationResult<LoginResponse, Error, GoogleLoginData>;
  googleConnectMutation: UseMutationResult<
    LoginResponse,
    Error,
    GoogleLoginData
  >;
  googleDisconnectMutation: UseMutationResult<LoginResponse, Error, void>;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  name: string;
  email: string;
  company: string;
  employeeCount: string;
  industry: string;
  password: string;
  confirmPassword?: string;
};

type LoginResponse = {
  success: boolean;
  data?: {
    token: string;
    user: User;
  };
  error?: {
    message: string;
  };
};

type RegisterResponse = {
  success: boolean;
  data?: {
    user: User;
  };
  error?: {
    message: string;
  };
};

type GoogleLoginData = {
  credential: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Listen for unauthorized events (token expiration)
  useEffect(() => {
    const handleUnauthorized = (event: CustomEvent) => {
      // Clear the entire query client cache to prevent stale data
      queryClient.clear();

      // Clear team selection (this is legitimate user preference data)
      localStorage.removeItem("selectedTeam");

      // Clear any session storage items that might have stale state
      sessionStorage.clear();

      toast({
        title: "Session expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });

      // Redirect to login page
      navigate("/auth");
    };

    // Add event listener for unauthorized events
    window.addEventListener(
      UNAUTHORIZED_EVENT,
      handleUnauthorized as EventListener,
    );

    // Cleanup function
    return () => {
      window.removeEventListener(
        UNAUTHORIZED_EVENT,
        handleUnauthorized as EventListener,
      );
    };
  }, [toast, navigate]);

  // Use useQuery for automatic user authentication checking
  const { data: authResponse, isLoading } = useQuery<
    ApiResponse<{ user: User }>
  >({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: true,
    retry: false,
    staleTime: Infinity, // Never consider data stale - fetch only once
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // Extract user from response
  const user: User | null = authResponse?.success
    ? authResponse.data?.user || null
    : null;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (response: LoginResponse) => {
      const { success, data, error } = response;
      if (success && data?.user) {
        // Update user query data directly
        queryClient.setQueryData(["/api/user"], {
          success: true,
          data,
        });

        // Invalidate teams query to ensure we get fresh data
        queryClient.invalidateQueries({ queryKey: ["/api/teams"] });

        localStorage.removeItem("selectedTeam");

        // Clear all guest assessment data using our new utility function
        clearGuestAssessmentData();

        toast({
          title: "Login successful",
          description: "You have been logged in successfully.",
        });
      } else {
        toast({
          title: "Login failed",
          description: "Your login credentials are wrong.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Login failed",
        description: error.message || "An error occurred during login.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      // Remove confirmPassword as it's not needed in the API
      const { confirmPassword, ...registerData } = userData;
      const res = await apiRequest("POST", "/api/register", registerData);
      return await res.json();
    },
    onSuccess: (data: RegisterResponse) => {
      if (data.success && data.data?.user) {
        // Update user query data directly
        queryClient.setQueryData(["/api/user"], {
          success: true,
          data: { user: data.data.user },
        });

        // Invalidate teams query to ensure we get fresh data including the
        // automatically assigned Client team during registration
        queryClient.invalidateQueries({ queryKey: ["/api/teams"] });

        // Clear any previously selected team to force auto-selection
        localStorage.removeItem("selectedTeam");

        // Clear all guest assessment data using our new utility function
        clearGuestAssessmentData();

        toast({
          title: "Registration successful",
          description: "Your account has been created successfully.",
        });
      } else {
        toast({
          title: "Registration failed",
          description:
            data.error?.message || "An error occurred during registration.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Call server logout endpoint to clear HttpOnly cookies
      const res = await apiRequest("POST", "/api/auth/logout", {});

      return await res.json();
    },
    onSuccess: () => {
      // Clear user query data
      queryClient.setQueryData(["/api/user"], {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Not authenticated" },
      });

      // Also clear any guest assessment data
      clearGuestAssessmentData();

      // Clear any session storage items that might have stale state
      sessionStorage.clear();

      // Clear query cache completely to ensure no stale data remains
      queryClient.clear();

      // Show success toast
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });

      // Redirect to auth page
      navigate("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Google authentication mutations
  const googleLoginMutation = useMutation({
    mutationFn: async (data: GoogleLoginData) => {
      const res = await apiRequest("POST", "/api/auth/google/login", data);
      return await res.json();
    },
    onSuccess: (data: LoginResponse) => {
      if (data.success && data.data?.user) {
        // Update user query data directly
        queryClient.setQueryData(["/api/user"], {
          success: true,
          data: { user: data.data.user },
        });

        // Invalidate teams query to ensure we get fresh data
        queryClient.invalidateQueries({ queryKey: ["/api/teams"] });

        // Clear any previously selected team to force auto-selection
        localStorage.removeItem("selectedTeam");

        // Clear any guest assessment data
        clearGuestAssessmentData();

        toast({
          title: "Google login successful",
          description: "You have been logged in successfully with Google.",
        });
      } else {
        toast({
          title: "Google login failed",
          description:
            data.error?.message || "An error occurred during Google login.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Connect Google account to existing user
  const googleConnectMutation = useMutation({
    mutationFn: async (data: GoogleLoginData) => {
      console.log("[Mutation] Starting google connect request");
      const res = await apiRequest("POST", "/api/user/google/connect", data);
      const json = await res.json();
      console.log("[Mutation] Google connect response:", json);
      return json;
    },
    onSuccess: (data: LoginResponse) => {
      console.log("[Mutation] Connect onSuccess called with:", data);
      if (data.success && data.data?.user) {
        console.log("[Mutation] Connect succeeded, updating user data");
        // Update user query data directly
        queryClient.setQueryData(["/api/user"], {
          success: true,
          data: { user: data.data.user },
        });

        toast({
          title: "Google account connected",
          description: "Your Google account has been connected successfully.",
        });
      } else {
        console.log("[Mutation] Connect succeeded but data is invalid");
        toast({
          title: "Google connect failed",
          description:
            data.error?.message || "Failed to connect Google account.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error("[Mutation] Connect onError called:", error);
      toast({
        title: "Google connect failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Disconnect Google account from existing user
  const googleDisconnectMutation = useMutation({
    mutationFn: async () => {
      console.log("[Mutation] Starting google disconnect request");
      const res = await apiRequest("DELETE", "/api/user/google/disconnect", {});
      const json = await res.json();
      console.log("[Mutation] Google disconnect response:", json);
      return json;
    },
    onSuccess: (data: LoginResponse) => {
      console.log("[Mutation] Disconnect onSuccess called with:", data);
      if (data.success && data.data?.user) {
        console.log("[Mutation] Disconnect succeeded, updating user data");
        // Update user query data directly
        queryClient.setQueryData(["/api/user"], {
          success: true,
          data: { user: data.data.user },
        });

        toast({
          title: "Google account disconnected",
          description:
            "Your Google account has been disconnected successfully.",
        });
      } else {
        console.log("[Mutation] Disconnect succeeded but data is invalid");
        toast({
          title: "Google disconnect failed",
          description:
            data.error?.message || "Failed to disconnect Google account.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error("[Mutation] Disconnect onError called:", error);
      toast({
        title: "Google disconnect failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        loginMutation,
        logoutMutation,
        registerMutation,
        googleLoginMutation,
        googleConnectMutation,
        googleDisconnectMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
