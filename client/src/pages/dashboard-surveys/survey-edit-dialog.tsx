import { useState, useEffect } from "react";
import { parse } from "papaparse";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SurveyWithAuthor } from "./survey-table";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, FileUp, Loader2, X } from "lucide-react";

interface EditSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  survey: SurveyWithAuthor;
}

export default function SurveyEditDialog({ 
  open, 
  onOpenChange, 
  survey 
}: EditSurveyDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [surveyTitle, setSurveyTitle] = useState(survey.title);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [questionsCount, setQuestionsCount] = useState(survey.questionsCount);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    survey.teamId ? String(survey.teamId) : "global"
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(survey.status);

  // Fetch teams for the dropdown
  const { data: teamsData } = useQuery({
    queryKey: ["/api/admin/teams"],
    retry: false,
  });

  const teams = teamsData?.teams || [];

  useEffect(() => {
    if (survey) {
      setSurveyTitle(survey.title);
      setQuestionsCount(survey.questionsCount);
      setSelectedTeamId(survey.teamId ? String(survey.teamId) : "global");
      setSelectedStatus(survey.status);
    }
  }, [survey]);

  // Update an existing survey
  const updateSurveyMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest(
        "PUT",
        `/api/admin/surveys/${survey.id}`,
        formData,
        true
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update survey");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/surveys"],
      });
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Survey updated successfully",
      });
      setCsvFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle CSV file upload and parsing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setCsvFile(null);
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

  // Handle form submission to update the survey
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

    const formData = new FormData();
    formData.append("title", surveyTitle);
    formData.append("status", selectedStatus);

    // Only add teamId if it's not "global"
    if (selectedTeamId !== "global") {
      formData.append("teamId", selectedTeamId);
    }

    // If a new file was uploaded, include it
    if (csvFile) {
      formData.append("file", csvFile);
      formData.append("questionsCount", questionsCount.toString());
    }

    updateSurveyMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-team">Visibility</Label>
                <Select 
                  value={selectedTeamId} 
                  onValueChange={setSelectedTeamId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (Everyone)</SelectItem>
                    {teams.map((team: any) => (
                      <SelectItem key={team.id} value={String(team.id)}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={selectedStatus} 
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                          Choose a new CSV file (optional)
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
              {!csvFile && (
                <p className="text-sm text-muted-foreground">
                  Current survey has {survey.questionsCount} questions.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
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
  );
}