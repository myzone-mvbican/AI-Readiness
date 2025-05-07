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
): Promise<Response> {
  // Get token from localStorage for each request
  const token = localStorage.getItem("token");

  // Set up headers with Authorization if token exists
  const headers: Record<string, string> = {};

  if (data) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  headers?: Record<string, string>;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, headers = {} }) =>
  async ({ queryKey }) => {
    // Get token from localStorage for each request
    const token = localStorage.getItem("token");

    // Merge with any existing headers
    const requestHeaders = { ...headers };

    // Add Authorization header if token exists
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

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
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
