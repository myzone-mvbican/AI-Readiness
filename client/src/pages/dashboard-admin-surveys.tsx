import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import {
  FileSpreadsheet,
  ShieldCheck,
  Plus,
  Search,
  Pencil,
  Trash2,
  FileUp,
  X,
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
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { parse } from "papaparse";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Survey } from "@shared/schema";

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
  const [surveyTitle, setSurveyTitle] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Get the current selected team ID
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
      const response = await fetch(`/api/admin/surveys/${fetchTeamId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch surveys");
      }
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
      const response = await fetch("/api/admin/surveys", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create survey");
      }

      return response.json();
    },
    onSuccess: () => {
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
    setCsvFile(null);
    setQuestionsCount(0);
    setIsUploading(false);
    setIsEditing(false);
    setCurrentSurvey(null);
  };

  // Handle CSV file upload and parsing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setCsvFile(null);
      setQuestionsCount(0);
      return;
    }

    const file = e.target.files[0];
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setCsvFile(file);
    setIsUploading(true);

    try {
      // Parse the CSV file to count valid questions
      const text = await file.text();
      parse(text, {
        header: true,
        complete: (results) => {
          // Count rows that have a non-empty Question Summary column
          const validQuestions = results.data.filter((row: any) => {
            // Check if the row has a non-empty Question Summary or similar field
            return Object.values(row).some(
              (value) => typeof value === "string" && value.trim().length > 0,
            );
          }).length;

          setQuestionsCount(validQuestions);
          setIsUploading(false);
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          toast({
            title: "Error parsing CSV",
            description: "The CSV file could not be parsed correctly",
            variant: "destructive",
          });
          setIsUploading(false);
        },
      });
    } catch (error) {
      console.error("Error reading file:", error);
      toast({
        title: "Error reading file",
        description: "The file could not be read",
        variant: "destructive",
      });
      setIsUploading(false);
    }
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

    // Get the current team ID (can be undefined for global surveys)
    const currentTeamId = teamId || undefined;

    const formData = new FormData();
    formData.append("title", surveyTitle);
    formData.append("file", csvFile);
    formData.append("questionsCount", questionsCount.toString());

    // Only add teamId if it's defined (will be a global survey if undefined)
    if (currentTeamId) {
      formData.append("teamId", String(currentTeamId));
    }

    formData.append("status", "draft");

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
              <form onSubmit={handleCreateSurvey}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Survey Title</Label>
                    <Input
                      id="title"
                      value={surveyTitle}
                      onChange={(e) => setSurveyTitle(e.target.value)}
                      placeholder="Enter survey title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="file">CSV File</Label>
                    <div className="border border-input rounded-md px-3 py-2">
                      {csvFile ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            <span className="text-sm truncate max-w-[300px]">
                              {csvFile.name}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCsvFile(null);
                              setQuestionsCount(0);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label
                          htmlFor="csv-upload"
                          className="flex items-center justify-center w-full h-20 cursor-pointer"
                        >
                          {isUploading ? (
                            <div className="flex items-center">
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              <span>Analyzing file...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center space-y-2">
                              <FileUp className="h-8 w-8 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Choose a CSV file or drag and drop
                              </span>
                            </div>
                          )}
                          <input
                            id="csv-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={isUploading}
                          />
                        </label>
                      )}
                    </div>
                    {questionsCount > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Found {questionsCount} valid questions in the CSV.
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setNewSurveyOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !csvFile || isUploading || createSurveyMutation.isPending
                    }
                  >
                    {createSurveyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Survey"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileSpreadsheet className="mr-2 h-5 w-5" />
              Survey Management
            </CardTitle>
            <CardDescription>
              Manage and track surveys for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search surveys..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={statusFilter === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(null)}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "live" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("live")}
                >
                  Live
                </Button>
                <Button
                  variant={statusFilter === "draft" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("draft")}
                >
                  Draft
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="bg-destructive/10 p-4 rounded-md text-center">
                <p className="text-destructive">
                  Error loading surveys. Please try again.
                </p>
              </div>
            ) : filteredSurveys.length === 0 ? (
              <div className="bg-muted/50 p-8 rounded-md text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No surveys found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter
                    ? "No surveys match your search criteria. Try adjusting your filters."
                    : "Get started by creating your first survey."}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
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
                          {format(new Date(survey.updatedAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              survey.status === "live" ? "default" : "secondary"
                            }
                          >
                            {survey.status === "live" ? "Live" : "Draft"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              survey.teamId === null ? "outline" : "secondary"
                            }
                          >
                            {survey.teamId === null ? "Global" : "Team-only"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {survey.author.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {survey.author.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditSurvey(survey)}
                            disabled={!isAuthor(survey)}
                            title={
                              isAuthor(survey)
                                ? "Edit survey"
                                : "Only the author can edit"
                            }
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(survey)}
                            disabled={!isAuthor(survey)}
                            title={
                              isAuthor(survey)
                                ? "Delete survey"
                                : "Only the author can delete"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
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

      {/* Edit Survey Modal */}
      <Dialog open={editSurveyOpen} onOpenChange={setEditSurveyOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Survey</DialogTitle>
            <DialogDescription>
              Update survey details or replace the CSV file.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSurvey}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Survey Title</Label>
                <Input
                  id="edit-title"
                  value={surveyTitle}
                  onChange={(e) => setSurveyTitle(e.target.value)}
                  placeholder="Enter survey title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-file">Replace CSV File (Optional)</Label>
                <div className="border border-input rounded-md px-3 py-2">
                  {csvFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        <span className="text-sm truncate max-w-[300px]">
                          {csvFile.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCsvFile(null);
                          setQuestionsCount(0);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="edit-csv-upload"
                      className="flex items-center justify-center w-full h-20 cursor-pointer"
                    >
                      {isUploading ? (
                        <div className="flex items-center">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          <span>Analyzing file...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-2">
                          <FileUp className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Choose a new CSV file or drag and drop
                          </span>
                        </div>
                      )}
                      <input
                        id="edit-csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
                {csvFile && questionsCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Found {questionsCount} valid questions in the new CSV.
                  </p>
                )}
                {!csvFile && currentSurvey && (
                  <p className="text-sm text-muted-foreground">
                    Current survey has {currentSurvey.questionsCount} questions.
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setEditSurveyOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading || updateSurveyMutation.isPending}
              >
                {updateSurveyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Survey"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the survey "{currentSurvey?.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                currentSurvey && deleteSurveyMutation.mutate(currentSurvey.id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSurveyMutation.isPending}
            >
              {deleteSurveyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
