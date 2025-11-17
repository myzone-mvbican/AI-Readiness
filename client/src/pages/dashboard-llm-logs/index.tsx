import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import LLMLogsTable from "./Table";
import { LLMLog } from "./types";

export default function LLMLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build query parameters for the API
  const queryParams = new URLSearchParams({
    page: "1",
    limit: "50",
    sortBy: "timestamp",
    sortOrder: "desc",
    ...(debouncedSearchTerm && { route: debouncedSearchTerm }), // Use route for search
    ...(providerFilter && { provider: providerFilter }),
    ...(statusFilter && { status: statusFilter }),
  });

  // Get logs with server-side filtering
  const { data: logsData, isLoading } = useQuery({
    queryKey: ["/api/logs/llm", queryParams.toString()],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/logs/llm?${queryParams}`);
      const result = await res.json();
      return result.data || [];
    },
    retry: false,
  });

  const logs: LLMLog[] = logsData || [];

  return (
    <DashboardLayout title="LLM Logs">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 space-y-3">
          <div className="col-span-1">
            <div className="col-span-1 flex items-center space-x-2">
              <ShieldCheck className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl text-foreground font-semibold">
                LLM Logs
              </h2>
            </div>
            <p className="text-muted-foreground mt-2">
              View and analyze all LLM interactions, including requests,
              responses, metrics, and costs.
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by route, feature, model, or provider..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 flex-wrap">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Provider:</span>
              <Button
                variant="ghost"
                size="sm"
                className={
                  !providerFilter
                    ? "bg-muted dark:bg-gray-100"
                    : "text-muted-foreground"
                }
                onClick={() => setProviderFilter(null)}
              >
                All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={
                  providerFilter === "openai"
                    ? "bg-muted dark:bg-gray-100"
                    : "text-muted-foreground"
                }
                onClick={() => setProviderFilter("openai")}
              >
                OpenAI
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={
                  providerFilter === "anthropic"
                    ? "bg-muted dark:bg-gray-100"
                    : "text-muted-foreground"
                }
                onClick={() => setProviderFilter("anthropic")}
              >
                Anthropic
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Button
                variant="ghost"
                size="sm"
                className={
                  !statusFilter
                    ? "bg-muted dark:bg-gray-100"
                    : "text-muted-foreground"
                }
                onClick={() => setStatusFilter(null)}
              >
                All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={
                  statusFilter === "success"
                    ? "bg-muted dark:bg-gray-100"
                    : "text-muted-foreground"
                }
                onClick={() => setStatusFilter("success")}
              >
                Success
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={
                  statusFilter === "error"
                    ? "bg-muted dark:bg-gray-100"
                    : "text-muted-foreground"
                }
                onClick={() => setStatusFilter("error")}
              >
                Error
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No logs found matching your filters.
          </div>
        ) : (
          <LLMLogsTable logs={logs} />
        )}
      </div>
    </DashboardLayout>
  );
}
