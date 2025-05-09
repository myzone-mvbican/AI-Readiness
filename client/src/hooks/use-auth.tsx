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
import { User } from "@shared/schema";
import {
  getQueryFn,
  apiRequest,
  queryClient,
  UNAUTHORIZED_EVENT,
} from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<LoginResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<RegisterResponse, Error, RegisterData>;
  googleLoginMutation: UseMutationResult<LoginResponse, Error, GoogleLoginData>;
  googleConnectMutation: UseMutationResult<LoginResponse, Error, GoogleLoginData>;
  googleDisconnectMutation: UseMutationResult<LoginResponse, Error, void>;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  name: string;
  email: string;
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
  const [_, setLocation] = useLocation();
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
      queryClient.setQueryData(["/api/user"], null);
      
      // Also clear team selection and any team data
      localStorage.removeItem("selectedTeam");
      localStorage.removeItem("userData");
      queryClient.removeQueries({ queryKey: ["/api/teams"] });

      // Show toast message
      toast({
        title: "Session expired",
        description:
          event.detail?.message ||
          "Your session has expired. Please log in again.",
        variant: "destructive",
      });

      // Redirect to login page
      setLocation("/auth");
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
  }, [toast, setLocation]);

  // Get cached user data from localStorage
  const getCachedUser = (): User | null => {
    try {
      const cachedUserData = localStorage.getItem("userData");
      if (cachedUserData) {
        const cachedData = JSON.parse(cachedUserData);
        return cachedData?.user || cachedData;
      }
    } catch (e) {
      console.error("Error parsing cached user data:", e);
    }
    return null;
  };

  // Initial cached user data
  const [cachedUser, setCachedUser] = useState<User | null>(getCachedUser());

  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: token
      ? getQueryFn({
          on401: "returnNull",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      : () => Promise.resolve(null),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch when component using the query mounts
    initialData: cachedUser, // Use cached data as initial data
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
        setToken(data.token);
        queryClient.setQueryData(["/api/user"], data.user);
        
        // Invalidate teams query to ensure we get fresh data
        queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
        
        // Clear any previously selected team to force auto-selection
        localStorage.removeItem("selectedTeam");
        
        toast({
          title: "Login successful",
          description: "You have been logged in successfully.",
        });
      } else {
        toast({
          title: "Login failed",
          description: data.message || "An error occurred during login.",
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
        setToken(data.token);
        queryClient.setQueryData(["/api/user"], data.user);
        
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

      // Clear cached user data and selected team
      localStorage.removeItem("userData");
      localStorage.removeItem("selectedTeam");

      // Clear query cache
      queryClient.setQueryData(["/api/user"], null);
      queryClient.removeQueries({ queryKey: ["/api/teams"] });

      // Show success toast
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
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
        setToken(data.token);
        queryClient.setQueryData(["/api/user"], data.user);
        
        // Invalidate teams query to ensure we get fresh data
        queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
        
        // Clear any previously selected team to force auto-selection
        localStorage.removeItem("selectedTeam");
        
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
      const res = await apiRequest("POST", "/api/auth/google/connect", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await res.json();
    },
    onSuccess: (data: LoginResponse) => {
      if (data.success) {
        // Update user data in cache
        queryClient.setQueryData(["/api/user"], data.user);
        
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
      const res = await apiRequest("DELETE", "/api/auth/google/disconnect", null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return await res.json();
    },
    onSuccess: (data: LoginResponse) => {
      if (data.success) {
        // Update user data in cache
        queryClient.setQueryData(["/api/user"], data.user);
        
        toast({
          title: "Google account disconnected",
          description: "Your Google account has been disconnected successfully.",
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
