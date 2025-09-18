import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLocation } from "wouter";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  getQueryFn,
  apiRequest,
  queryClient,
  UNAUTHORIZED_EVENT,
} from "@/lib/queryClient";
import { User, UseAuthReturn, AuthError } from "@shared/types";
import { useToast } from "@/hooks/use-toast";
import { clearGuestAssessmentData, clearAuthData } from "@/lib/localStorage";
import {
  createQueryKey,
  invalidateQueries,
  getQueryConfig,
} from "@/lib/query-cache";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
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
  microsoftLoginMutation: UseMutationResult<LoginResponse, Error, GoogleLoginData>;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  name: string;
  email: string;
  company: string;
  employeeCount: "1-9" | "10-49" | "50-249" | "250-999" | "1000+";
  industry:
    | "technology"
    | "healthcare"
    | "finance"
    | "retail"
    | "manufacturing"
    | "education"
    | "government"
    | "energy"
    | "transportation"
    | "other";
  password: string;
  confirmPassword?: string;
};

type LoginResponse = {
  success: boolean;
  token: string;
  user: User;
  message: string;
};

type RegisterResponse = {
  success: boolean;
  token: string;
  user: User;
  message: string;
};

type GoogleLoginData = {
  credential: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );

  // Load token from localStorage on initial render
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Set auth header whenever token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // Listen for unauthorized events (token expiration)
  useEffect(() => {
    const handleUnauthorized = (event: CustomEvent) => {
      // Clear auth state
      setToken(null);

      // Clear the entire query client cache to prevent stale data
      queryClient.clear();

      // Update cached user state
      setCachedUser(null);

      // Also clear all localStorage items related to authentication
      localStorage.removeItem("token");
      localStorage.removeItem("selectedTeam");
      localStorage.removeItem("userData");

      // Clear any session storage items that might have stale state
      sessionStorage.clear();

      // Show toast message
      toast({
        title: "Session expired",
        description:
          event.detail?.message ||
          "Your session has expired. Please log in again.",
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

  // Get cached user data from localStorage with improved error handling
  const getCachedUser = (): User | null => {
    try {
      const cachedUserData = localStorage.getItem("userData");
      if (cachedUserData) {
        const cachedData = JSON.parse(cachedUserData);
        // Handle both formats: { user: User } and User directly
        const userData = cachedData?.user || cachedData;

        // Validate that this is a user object by checking required fields
        if (
          userData &&
          typeof userData === "object" &&
          "id" in userData &&
          "email" in userData
        ) {
          return userData as User;
        }
      }
    } catch (e) {
      console.error("Error parsing cached user data:", e);
      // Clear invalid data to prevent future errors
      localStorage.removeItem("userData");
    }
    return null;
  };

  // Initial cached user data
  const [cachedUser, setCachedUser] = useState<User | null>(getCachedUser());
  const [authError, setAuthError] = useState<AuthError | null>(null);

  // Helper function to convert regular errors to AuthError
  const createAuthError = (
    error: Error | string,
    code: AuthError["code"] = "SERVER_ERROR",
  ): AuthError => {
    if (typeof error === "string") {
      return { code, message: error, timestamp: new Date() };
    }
    return {
      code,
      message: error.message || "An unexpected error occurred",
      timestamp: new Date(),
      details: { originalError: error.name },
    };
  };

  // Get the latest token before each query execution
  const getTokenForQuery = () => localStorage.getItem("token");

  // Use standard query key for user data to match login mutation
  const userQueryKey = ["/api/user"];
  const userQueryConfig = getQueryConfig("users");

  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser,
  } = useQuery<User | null, Error>({
    queryKey: userQueryKey,
    queryFn: async () => {
      const token = getTokenForQuery();
      if (!token) return null;
      
      const res = await fetch("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      
      if (res.status === 401) return null;
      if (!res.ok) throw new Error(`Failed to fetch user: ${res.status}`);
      
      const data = await res.json();
      return data.user; // Extract just the user object
    },
    enabled: !!token || !!getCachedUser(),
    ...userQueryConfig,
    initialData: cachedUser,
    retry: false,
  });

  // Update localStorage when user data changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("userData", JSON.stringify(user));
    }
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (data: LoginResponse) => {
      if (data.success && data.token) {
        // Save token to state and localStorage
        setToken(data.token);

        // Cache user data in query client and localStorage - store only user object
        queryClient.setQueryData(["/api/user"], data.user);
        localStorage.setItem("userData", JSON.stringify(data.user));

        // Force refetch user data to ensure state is updated
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });

        // Invalidate teams query to ensure we get fresh data
        queryClient.invalidateQueries({ queryKey: ["/api/teams"] });

        // Clear any previously selected team to force auto-selection
        localStorage.removeItem("selectedTeam");

        // Clear all guest assessment data using our new utility function
        clearGuestAssessmentData();

        // Update cached user state
        setCachedUser(data.user);

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
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
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
      if (data.success && data.token) {
        // Save token to state and localStorage
        setToken(data.token);

        // Cache user data in query client and localStorage
        queryClient.setQueryData(["/api/user"], data.user);
        localStorage.setItem("userData", JSON.stringify(data.user));

        // Update cached user state
        setCachedUser(data.user);

        // Invalidate teams query to ensure we get fresh data including the
        // automatically assigned Client team during registration
        queryClient.invalidateQueries({ queryKey: ["/api/teams"] });

        // Clear any previously selected team to force auto-selection
        localStorage.removeItem("selectedTeam");

        toast({
          title: "Registration successful",
          description: "Your account has been created successfully.",
        });
      } else {
        toast({
          title: "Registration failed",
          description: data.message || "An error occurred during registration.",
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
      // No actual API call needed as we're using JWT tokens stored on the client
      // Just clean up the local state
      return Promise.resolve();
    },
    onSuccess: () => {
      // Clear token
      setToken(null);

      // Clear all authentication-related data from localStorage
      clearAuthData();

      // Also clear any guest assessment data
      clearGuestAssessmentData();

      // Clear any session storage items that might have stale state
      sessionStorage.clear();

      // Clear query cache completely to ensure no stale data remains
      queryClient.clear();

      // Reset local cache state
      setCachedUser(null);

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
      if (data.success && data.token) {
        // Save token to state and localStorage
        setToken(data.token);

        // Cache user data in query client and localStorage
        queryClient.setQueryData(["/api/user"], data.user);
        localStorage.setItem("userData", JSON.stringify(data.user));

        // Update cached user state
        setCachedUser(data.user);

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
          description: data.message || "An error occurred during Google login.",
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
      const res = await apiRequest(
        "POST",
        "/api/user/google/connect",
        data,
        false,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return await res.json();
    },
    onSuccess: (data: LoginResponse) => {
      if (data.success) {
        // Cache user data in query client and localStorage
        queryClient.setQueryData(["/api/user"], data.user);
        localStorage.setItem("userData", JSON.stringify(data.user));

        // Update cached user state
        setCachedUser(data.user);

        toast({
          title: "Google account connected",
          description: "Your Google account has been connected successfully.",
        });
      } else {
        toast({
          title: "Google connect failed",
          description: data.message || "Failed to connect Google account.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
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
      const res = await apiRequest(
        "DELETE",
        "/api/user/google/disconnect",
        null,
        false,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return await res.json();
    },
    onSuccess: (data: LoginResponse) => {
      if (data.success) {
        // Cache user data in query client and localStorage
        queryClient.setQueryData(["/api/user"], data.user);
        localStorage.setItem("userData", JSON.stringify(data.user));

        // Update cached user state
        setCachedUser(data.user);

        toast({
          title: "Google account disconnected",
          description:
            "Your Google account has been disconnected successfully.",
        });
      } else {
        toast({
          title: "Google disconnect failed",
          description: data.message || "Failed to disconnect Google account.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Google disconnect failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Microsoft login mutation
  const microsoftLoginMutation = useMutation({
    mutationFn: async (data: GoogleLoginData) => {
      const res = await apiRequest("POST", "/api/auth/microsoft/login", data);
      return await res.json();
    },
    onSuccess: (data: LoginResponse) => {
      if (data.success && data.token) {
        // Save token to state and localStorage
        setToken(data.token);

        // Cache user data in query client and localStorage
        queryClient.setQueryData(["/api/user"], data.user);
        localStorage.setItem("userData", JSON.stringify(data.user));

        // Update cached user state
        setCachedUser(data.user);

        // Invalidate teams query to ensure we get fresh data
        queryClient.invalidateQueries({ queryKey: ["/api/teams"] });

        // Clear any previously selected team to force auto-selection
        localStorage.removeItem("selectedTeam");

        // Clear any guest assessment data
        clearGuestAssessmentData();

        toast({
          title: "Microsoft login successful",
          description: "You have been logged in successfully with Microsoft.",
        });
      } else {
        toast({
          title: "Microsoft login failed",
          description: data.message || "An error occurred during Microsoft login.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Microsoft login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions for the new type-safe interface
  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        googleLoginMutation,
        googleConnectMutation,
        googleDisconnectMutation,
        microsoftLoginMutation,
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
