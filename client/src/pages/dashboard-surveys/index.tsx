import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck,
  Plus,
  Search,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Survey } from "@shared/schema";
import { SurveyForm } from "./components";

// Type for the survey data with author info
type SurveyWithAuthor = Survey & {
  author: {
    name: string;
    email: string;
  };
};

export default function AdminSurveysPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [newSurveyOpen, setNewSurveyOpen] = useState(false);
  const [editSurveyOpen, setEditSurveyOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentSurvey, setCurrentSurvey] = useState<SurveyWithAuthor | null>(
    null,
  );
  
  // Form state
  const [surveyTitle, setSurveyTitle] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [surveyStatus, setSurveyStatus] = useState("draft");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Get the current selected team ID from localStorage
  const teamId = localStorage.getItem("selectedTeam")
    ? parseInt(localStorage.getItem("selectedTeam") || "0")
    : 0;

  // Fetch surveys for the current team and global surveys
  const {
    data: surveys,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/admin/surveys", teamId],
    queryFn: async () => {
      // Default to team ID 0 if not set, which will fetch global surveys
      const fetchTeamId = teamId || 0;
      // Use the imported apiRequest helper instead of fetch directly
      // This automatically adds the token from localStorage
      const response = await apiRequest("GET", `/api/admin/surveys/${fetchTeamId}`);
      return response.json();
    },
  });

  // Create a new survey
  const createSurveyMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Get the authentication token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // We can't use the apiRequest helper directly because it doesn't support FormData
      // But we still need to use the same token pattern for consistency
      try {
        const response = await fetch("/api/admin/surveys", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        // Handle non-ok responses
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Survey creation failed:", errorData);
          throw new Error(errorData.message || "Failed to create survey");
        }

        return response.json();
      } catch (err) {
        console.error("Survey creation error:", err);
        throw err;
      }
    },
    onSuccess: () => {
      // Invalidate cache after creation to refresh the list
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/surveys", teamId],
      });
      setNewSurveyOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Survey created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update an existing survey
  const updateSurveyMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!currentSurvey) throw new Error("No survey selected for update");

      // Get the authentication token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // We can't use the apiRequest helper directly because it doesn't support FormData
      const response = await fetch(`/api/admin/surveys/${currentSurvey.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update survey");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate cache after update to refresh the list
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/surveys", teamId],
      });
      setEditSurveyOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Survey updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete a survey
  const deleteSurveyMutation = useMutation({
    mutationFn: async (surveyId: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/admin/surveys/${surveyId}`,
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete survey");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate cache after deletion to refresh the list
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/surveys", teamId],
      });
      setDeleteDialogOpen(false);
      setCurrentSurvey(null);
      toast({
        title: "Success",
        description: "Survey deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset form values
  const resetForm = () => {
    setSurveyTitle("");
    setSelectedTeamId(null); // Default to Global survey
    setSurveyStatus("draft"); // Default to Draft status
    setCsvFile(null);
    setQuestionsCount(0);
    setIsUploading(false);
    setCurrentSurvey(null);
  };

  // Handle creating a new survey
  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!surveyTitle.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a survey title",
        variant: "destructive",
      });
      return;
    }

    if (!csvFile) {
      toast({
        title: "Missing file",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    if (questionsCount === 0) {
      toast({
        title: "Invalid CSV",
        description: "No valid questions found in the CSV file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", surveyTitle);
    formData.append("file", csvFile);
    formData.append("questionsCount", questionsCount.toString());
    formData.append("status", surveyStatus);

    // Only add teamId if it's not null (will be a global survey if null)
    if (selectedTeamId !== null) {
      formData.append("teamId", String(selectedTeamId));
    }

    createSurveyMutation.mutate(formData);
  };

  // Handle updating an existing survey
  const handleUpdateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!surveyTitle.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a survey title",
        variant: "destructive",
      });
      return;
    }

    if (!currentSurvey) {
      toast({
        title: "Error",
        description: "No survey selected for update",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", surveyTitle);
    formData.append("status", surveyStatus);
    
    // Only add teamId if it's not null (will be a global survey if null)
    if (selectedTeamId !== null) {
      formData.append("teamId", String(selectedTeamId));
    }

    // If a new file was uploaded, include it
    if (csvFile) {
      formData.append("file", csvFile);
      formData.append("questionsCount", questionsCount.toString());
    }

    updateSurveyMutation.mutate(formData);
  };

  // Open the edit dialog for a survey
  const handleEditSurvey = (survey: SurveyWithAuthor) => {
    setCurrentSurvey(survey);
    setSurveyTitle(survey.title);
    setSelectedTeamId(survey.teamId);
    setSurveyStatus(survey.status);
    setEditSurveyOpen(true);
  };

  // Open the delete confirmation dialog for a survey
  const handleDeleteClick = (survey: SurveyWithAuthor) => {
    setCurrentSurvey(survey);
    setDeleteDialogOpen(true);
  };

  // Check if the current user is the author of a survey
  const isAuthor = (survey: SurveyWithAuthor) => {
    return user?.id === survey.authorId;
  };

  // Filter surveys based on search term and status filter
  const filteredSurveys =
    surveys?.surveys?.filter((survey: SurveyWithAuthor) => {
      const matchesSearch = survey.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || survey.status === statusFilter;
      return matchesSearch && matchesStatus;
    }) || [];

  return (
    <DashboardLayout title="Manage Surveys">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold">Survey Administration</h2>
          </div>
          <Dialog open={newSurveyOpen} onOpenChange={setNewSurveyOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setNewSurveyOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Survey
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Survey</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with survey questions.
                </DialogDescription>
              </DialogHeader>
              <SurveyForm
                title={surveyTitle}
                setTitle={setSurveyTitle}
                teamId={selectedTeamId}
                setTeamId={setSelectedTeamId}
                status={surveyStatus}
                setStatus={setSurveyStatus}
                csvFile={csvFile}
                setCsvFile={setCsvFile}
                questionsCount={questionsCount}
                setQuestionsCount={setQuestionsCount}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
                onSubmit={handleCreateSurvey}
                submitButtonText="Create Survey"
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Surveys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search surveys..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-10 text-destructive">
                Error loading surveys. Please try again.
              </div>
            ) : filteredSurveys.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No surveys found. Create a new survey to get started.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSurveys.map((survey: SurveyWithAuthor) => (
                      <TableRow key={survey.id}>
                        <TableCell className="font-medium">
                          {survey.title}
                        </TableCell>
                        <TableCell>{survey.questionsCount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              survey.status === "public" ? "default" : "outline"
                            }
                          >
                            {survey.status === "public" ? "Public" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {survey.teamId ? "Team-only" : "Global"}
                          </Badge>
                        </TableCell>
                        <TableCell>{survey.author.name}</TableCell>
                        <TableCell>
                          {format(new Date(survey.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSurvey(survey)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog
                              open={
                                deleteDialogOpen &&
                                currentSurvey?.id === survey.id
                              }
                              onOpenChange={(open) => {
                                if (!open) setDeleteDialogOpen(false);
                              }}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(survey)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Survey
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the survey "
                                    {currentSurvey?.title}"? This action cannot
                                    be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground"
                                    onClick={() =>
                                      deleteSurveyMutation.mutate(
                                        currentSurvey!.id,
                                      )
                                    }
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Survey Dialog */}
      <Dialog open={editSurveyOpen} onOpenChange={setEditSurveyOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Survey</DialogTitle>
            <DialogDescription>
              Update survey details or upload a new CSV file.
            </DialogDescription>
          </DialogHeader>
          <SurveyForm
            title={surveyTitle}
            setTitle={setSurveyTitle}
            teamId={selectedTeamId}
            setTeamId={setSelectedTeamId}
            status={surveyStatus}
            setStatus={setSurveyStatus}
            csvFile={csvFile}
            setCsvFile={setCsvFile}
            questionsCount={questionsCount}
            setQuestionsCount={setQuestionsCount}
            isUploading={isUploading}
            setIsUploading={setIsUploading}
            onSubmit={handleUpdateSurvey}
            submitButtonText="Update Survey"
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}