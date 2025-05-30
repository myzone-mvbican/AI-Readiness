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
import { createQueryKey, invalidateQueries, getQueryConfig } from "@/lib/query-cache";

type AuthContextType = UseAuthReturn & {
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
  employeeCount: "1-9" | "10-49" | "50-249" | "250-999" | "1000+";
  industry: "technology" | "healthcare" | "finance" | "retail" | "manufacturing" | "education" | "government" | "energy" | "transportation" | "other";
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

  // Get the latest token before each query execution
  const getTokenForQuery = () => localStorage.getItem("token");

  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({
      on401: "returnNull",
      forcedToken: getTokenForQuery(),
      requiresAuth: true,
    }),
    enabled: !!token || !!getCachedUser(), // Enable if token exists OR we have cached user data
    staleTime: 1000 * 60 * 15, // Consider data fresh for 15 minutes
    gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false, // Disable periodic refetching
    refetchIntervalInBackground: false, // Disable background refetching
    initialData: cachedUser, // Use cached data as initial data
    retry: false, // Don't retry failed requests
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

        // Cache user data in query client and localStorage
        queryClient.setQueryData(["/api/user"], data.user);
        localStorage.setItem("userData", JSON.stringify(data.user));

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