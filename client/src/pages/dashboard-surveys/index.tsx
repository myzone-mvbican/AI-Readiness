import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SurveyCreateDialog from "./survey-create-dialog";
import SurveyTable from "./survey-table";
import { apiRequest } from "@/lib/queryClient";

export default function AdminSurveysPage() {
  const [newSurveyOpen, setNewSurveyOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(""); 

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build query parameters for the API
  const queryParams = new URLSearchParams({
    ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
    ...(statusFilter && { status: statusFilter }),
  });

  // Get surveys with server-side search and status filtering
  const { data: surveys, isLoading } = useQuery({
    queryKey: ["/api/admin/surveys/0", queryParams.toString()],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/surveys/0?${queryParams}`);
      const { data } = await res.json();
      return data || [];
    },
    retry: false,
  }); 

  return (
    <DashboardLayout title="Manage Surveys">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 space-y-3">
          <div className="col-span-1">
            <div className="col-span-1 flex items-center space-x-2">
              <ShieldCheck className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl text-foreground font-semibold">
                Manage Surveys
              </h2>
            </div>
            <p className="text-muted-foreground mt-2">
              Manage surveys that users can take to assess their AI readiness.
            </p>
          </div>
          <div className="col-span-1 flex justify-end">
            <SurveyCreateDialog
              open={newSurveyOpen}
              onOpenChange={setNewSurveyOpen}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search surveys..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
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
              className={
                statusFilter === "draft"
                  ? "bg-muted dark:bg-gray-100"
                  : "text-muted-foreground"
              }
              onClick={() => setStatusFilter("draft")}
            >
              Draft
            </Button>
            <Button
              variant="ghost"
              className={
                statusFilter === "public"
                  ? "bg-muted dark:bg-gray-100"
                  : "text-muted-foreground"
              }
              onClick={() => setStatusFilter("public")}
            >
              Public
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No surveys found. Create a new survey to get started.
          </div>
        ) : (
          <SurveyTable surveys={surveys} />
        )}
      </div>
    </DashboardLayout>
  );
}
