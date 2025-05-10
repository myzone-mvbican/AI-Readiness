import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  Plus,
  Search,
} from "lucide-react";
// Import directly from components
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function AdminSurveysPage() {
  const [newSurveyOpen, setNewSurveyOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [teamId, setTeamId] = useState<number | null>(0);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const { toast } = useToast();

  // Get surveys
  // Log to see if we're getting data
  const { data: surveysData, isLoading } = useQuery({
    queryKey: ["/api/admin/surveys/0"],
    retry: false,
  });

  // Add debugging to see what data structure we're getting
  console.log("Surveys data:", surveysData);

  // Get surveys from the response and handle the correct structure
  const surveys = surveysData?.surveys || [];

  // Filter surveys based on search term and status filter
  const filteredSurveys = surveys.filter((survey: any) => {
    const matchesSearch = survey.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || survey.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout title="Manage Surveys">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold">Survey Administration</h2>
          </div>
          <CreateSurveyDialog
            open={newSurveyOpen}
            onOpenChange={setNewSurveyOpen}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Surveys</CardTitle>
            <CardDescription>
              Manage surveys that users can take to assess their AI readiness.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  className={!statusFilter ? "bg-muted" : ""}
                  onClick={() => setStatusFilter(null)}
                >
                  All
                </Button>
                <Button
                  variant="ghost"
                  className={statusFilter === "draft" ? "bg-muted" : ""}
                  onClick={() => setStatusFilter("draft")}
                >
                  Draft
                </Button>
                <Button
                  variant="ghost"
                  className={statusFilter === "public" ? "bg-muted" : ""}
                  onClick={() => setStatusFilter("public")}
                >
                  Public
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredSurveys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No surveys found. Create a new survey to get started.
              </div>
            ) : (
              <SurveysTable surveys={filteredSurveys} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}