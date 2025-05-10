import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Global event for handling unauthorized access
export const UNAUTHORIZED_EVENT = "auth:unauthorized";

// Dispatches an event when an unauthorized response is received
function handleUnauthorized(
  message = "Your session has expired. Please log in again.",
) {
  const event = new CustomEvent(UNAUTHORIZED_EVENT, {
    detail: { message },
  });
  window.dispatchEvent(event);
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Handle 401 Unauthorized responses globally
    if (res.status === 401) {
      const text = await res.text();
      handleUnauthorized();
      throw new Error(`Unauthorized: ${text || res.statusText}`);
    }

    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  isFormData: boolean = false,
  options?: { headers?: Record<string, string> },
): Promise<Response> {
  // Get token from localStorage for each request
  const token = localStorage.getItem("token");

  // Set up headers with Authorization if token exists
  const headers: Record<string, string> = { ...options?.headers };

  // Set Content-Type only if not FormData (FormData will set its own)
  if (data && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // Add Authorization header if not already provided in options
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: "include",
  };

  // Handle different body types
  if (data) {
    if (isFormData && data instanceof FormData) {
      // FormData will set its own Content-Type with boundary
      fetchOptions.body = data;
    } else {
      fetchOptions.body = JSON.stringify(data);
    }
  }

  const res = await fetch(url, fetchOptions);

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  headers?: Record<string, string>;
  forcedToken?: string | null;
  requiresAuth?: boolean;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, headers = {}, forcedToken = null, requiresAuth = true }) =>
  async ({ queryKey }) => {
    // Get token from localStorage for each request, using forcedToken if provided
    const token = forcedToken !== null ? forcedToken : localStorage.getItem("token");
    
    // If auth is required but no token exists, return null early
    if (requiresAuth && !token && unauthorizedBehavior === "returnNull") {
      return null;
    }

    // Merge with any existing headers
    const requestHeaders = { ...headers };

    // Add Authorization header if token exists
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers: requestHeaders,
      });

      if (res.status === 401) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }

        // Handle unauthorized globally
        handleUnauthorized();
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // If the request fails and auth is required but we have no token,
      // return null instead of throwing if we're configured to return null on 401
      if (requiresAuth && !token && unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
