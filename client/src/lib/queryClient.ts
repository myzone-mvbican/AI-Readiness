import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { extractErrorMessage } from "./api";

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

// CSRF token management
let csrfToken: string | null = null;

// Get CSRF token from cookie
function getCSRFTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie =>
    cookie.trim().startsWith('csrf-token=')
  );

  if (csrfCookie) {
    return csrfCookie.split('=')[1];
  }

  return null;
}

// Get CSRF token from cookie or fallback to cache
function getCachedCSRFToken(): string | null {
  // First try the cookie (preferred method)
  const cookieToken = getCSRFTokenFromCookie();
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback to global cache (set by page components)
  if ((window as any).__csrfToken) {
    return (window as any).__csrfToken;
  }

  // Fallback to module-level cache
  return csrfToken;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const errorMessage = await extractErrorMessage(res);
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  isFormData: boolean = false,
  options: { headers?: Record<string, string> } = {},
): Promise<Response> {
  // Set up headers - we use HttpOnly cookies for authentication
  const headers: Record<string, string> = { ...options.headers };

  // Set Content-Type only if not FormData (FormData will set its own)
  if (data && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // Add CSRF token for state-changing operations
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (stateChangingMethods.includes(method.toUpperCase())) {
    // Use cached CSRF token if available
    const token = getCachedCSRFToken();
    if (token) {
      headers['x-csrf-token'] = token;
      // CSRF token included in request
    }
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

  try {
    const res = await fetch(url, fetchOptions);
    
    await throwIfResNotOk(res);

    return res;

  } catch (error) {
    console.error(`API request to ${url} failed:`, error);
    throw error;
  }
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
      // We use HttpOnly cookies for authentication, so no need to check localStorage tokens
      // The server will handle authentication via cookies

      // Merge with any existing headers
      const requestHeaders = { ...headers };

      try {
        // Build the URL - if queryKey has more than one element, construct the URL with parameters
        let url = queryKey[0] as string;

        // If second element is a number or string, append it to the URL
        if (queryKey.length > 1 && (typeof queryKey[1] === 'number' || typeof queryKey[1] === 'string')) {
          url = `${url}/${queryKey[1]}`;
        }

        const res = await fetch(url, {
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
        // Handle errors normally - the server will return 401 if authentication fails
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
